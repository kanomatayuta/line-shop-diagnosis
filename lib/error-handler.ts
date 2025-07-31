// ⚡ ADVANCED ERROR HANDLING & RECOVERY SYSTEM
// 完全無欠なエラーハンドリングとリカバリーシステム

import { NextResponse } from 'next/server'
import { logger, metrics } from './monitoring'

// エラー分類
enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  SYSTEM = 'system',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

// エラー重要度
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// カスタムエラークラス
export class AppError extends Error {
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: any
  public readonly timestamp: Date
  public readonly userId?: string
  
  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any,
    userId?: string
  ) {
    super(message)
    
    this.name = 'AppError'
    this.category = category
    this.severity = severity
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date()
    this.userId = userId
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// 特定エラータイプ
export class ValidationError extends AppError {
  constructor(message: string, context?: any, userId?: string) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, 400, true, context, userId)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: any, userId?: string) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, 401, true, context, userId)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, context?: any, userId?: string) {
    super(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH, 403, true, context, userId)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, context?: any, userId?: string) {
    super(message, ErrorCategory.RATE_LIMIT, ErrorSeverity.MEDIUM, 429, true, context, userId)
  }
}

export class ExternalAPIError extends AppError {
  constructor(message: string, context?: any, userId?: string) {
    super(message, ErrorCategory.EXTERNAL_API, ErrorSeverity.HIGH, 502, true, context, userId)
  }
}

// サーキットブレーカー
class CircuitBreaker {
  private failures = 0
  private lastFailureTime?: Date
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1分
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN'
      } else {
        throw new AppError(
          'Circuit breaker is OPEN - service temporarily unavailable',
          ErrorCategory.SYSTEM,
          ErrorSeverity.HIGH,
          503
        )
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = new Date()
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
      logger.critical('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold
      })
    }
  }
  
  private shouldAttemptReset(): boolean {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime.getTime()) >= this.timeout
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// リトライ機構
class RetryManager {
  static async execute<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    backoffMultiplier: number = 2,
    jitter: boolean = true
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt > maxRetries) {
          break
        }
        
        // リトライすべきでないエラーの場合は即座に失敗
        if (error instanceof AppError && !this.shouldRetry(error)) {
          break
        }
        
        const delay = this.calculateDelay(attempt, baseDelay, backoffMultiplier, jitter)
        
        logger.warn('Operation failed, retrying', {
          attempt,
          maxRetries,
          delay,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }
  
  private static shouldRetry(error: AppError): boolean {
    // リトライしない条件
    const noRetryCategories = [
      ErrorCategory.VALIDATION,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION
    ]
    
    return !noRetryCategories.includes(error.category)
  }
  
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    backoffMultiplier: number,
    jitter: boolean
  ): number {
    const exponentialDelay = baseDelay * Math.pow(backoffMultiplier, attempt - 1)
    
    if (jitter) {
      // ±25%のジッターを追加
      const jitterRange = exponentialDelay * 0.25
      return exponentialDelay + (Math.random() * 2 - 1) * jitterRange
    }
    
    return exponentialDelay
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// グローバルエラーハンドラー
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private errorCounts = new Map<string, number>()
  private lastErrorTime = new Map<string, Date>()
  
  private constructor() {
    this.setupProcessHandlers()
  }
  
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }
  
  private setupProcessHandlers() {
    // 未処理の例外をキャッチ
    process.on('uncaughtException', (error: Error) => {
      logger.critical('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        type: 'uncaught_exception'
      })
      
      metrics.recordSecurityEvent('threat')
      
      // グレースフルシャットダウン
      this.gracefulShutdown(1)
    })
    
    // 未処理のPromise拒否をキャッチ
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.critical('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        type: 'unhandled_rejection'
      })
      
      metrics.recordSecurityEvent('threat')
    })
    
    // シグナルハンドリング
    const signals = ['SIGTERM', 'SIGINT']
    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown`)
        this.gracefulShutdown(0)
      })
    })
  }
  
  handleError(error: Error, context?: any): NextResponse {
    // エラーを分類・拡張
    const appError = this.enhanceError(error, context)
    
    // ログ記録
    this.logError(appError, context)
    
    // メトリクス更新
    this.updateMetrics(appError)
    
    // 回復処理の試行
    this.attemptRecovery(appError)
    
    // クライアントレスポンス生成
    return this.generateErrorResponse(appError)
  }
  
  private enhanceError(error: Error, context?: any): AppError {
    if (error instanceof AppError) {
      return error
    }
    
    // 既知のエラーパターンに基づいて分類
    const category = this.categorizeError(error)
    const severity = this.determineSeverity(error, category)
    
    return new AppError(
      error.message,
      category,
      severity,
      this.getStatusCode(category),
      true,
      { originalError: error.name, context }
    )
  }
  
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCategory.AUTHENTICATION
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCategory.AUTHORIZATION
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorCategory.RATE_LIMIT
    }
    
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return ErrorCategory.NETWORK
    }
    
    if (name.includes('typeerror') || name.includes('referenceerror')) {
      return ErrorCategory.SYSTEM
    }
    
    return ErrorCategory.UNKNOWN
  }
  
  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // カテゴリベースの重要度
    switch (category) {
      case ErrorCategory.SYSTEM:
        return ErrorSeverity.CRITICAL
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.EXTERNAL_API:
        return ErrorSeverity.HIGH
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.NETWORK:
        return ErrorSeverity.MEDIUM
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW
      default:
        return ErrorSeverity.MEDIUM
    }
  }
  
  private getStatusCode(category: ErrorCategory): number {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 400
      case ErrorCategory.AUTHENTICATION:
        return 401
      case ErrorCategory.AUTHORIZATION:
        return 403
      case ErrorCategory.RATE_LIMIT:
        return 429
      case ErrorCategory.EXTERNAL_API:
        return 502
      case ErrorCategory.SYSTEM:
        return 500
      default:
        return 500
    }
  }
  
  private logError(error: AppError, context?: any) {
    const logData = {
      category: error.category,
      severity: error.severity,
      statusCode: error.statusCode,
      userId: error.userId,
      context: error.context,
      stack: error.stack,
      timestamp: error.timestamp,
      additionalContext: context
    }
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.critical(error.message, logData)
        break
      case ErrorSeverity.HIGH:
        logger.error(error.message, logData)
        break
      case ErrorSeverity.MEDIUM:
        logger.warn(error.message, logData)
        break
      case ErrorSeverity.LOW:
        logger.info(error.message, logData)
        break
    }
  }
  
  private updateMetrics(error: AppError) {
    // エラー回数をカウント
    const errorKey = `${error.category}:${error.message}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, currentCount + 1)
    this.lastErrorTime.set(errorKey, new Date())
    
    // メトリクス更新
    metrics.recordRequest(false, 0)
    
    if (error.category === ErrorCategory.RATE_LIMIT) {
      metrics.recordSecurityEvent('rateLimit')
    } else if (error.severity === ErrorSeverity.CRITICAL) {
      metrics.recordSecurityEvent('threat')
    }
  }
  
  private attemptRecovery(error: AppError) {
    // カテゴリに応じた回復処理
    switch (error.category) {
      case ErrorCategory.EXTERNAL_API:
        // 外部API障害の場合、サーキットブレーカーを確認
        const breaker = this.getCircuitBreaker('external_api')
        logger.info('External API error detected, circuit breaker state', breaker.getState())
        break
        
      case ErrorCategory.SYSTEM:
        // システムエラーの場合、ガベージコレクションを実行
        if (global.gc) {
          logger.info('Attempting garbage collection for system error recovery')
          global.gc()
        }
        break
    }
  }
  
  private generateErrorResponse(error: AppError): NextResponse {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    const response = {
      success: false,
      error: {
        message: error.message,
        category: error.category,
        statusCode: error.statusCode,
        timestamp: error.timestamp.toISOString(),
        ...(isDevelopment && {
          stack: error.stack,
          context: error.context
        })
      }
    }
    
    return NextResponse.json(response, { status: error.statusCode })
  }
  
  getCircuitBreaker(service: string): CircuitBreaker {
    if (!this.circuitBreakers.has(service)) {
      this.circuitBreakers.set(service, new CircuitBreaker())
    }
    return this.circuitBreakers.get(service)!
  }
  
  private gracefulShutdown(exitCode: number) {
    logger.info('Starting graceful shutdown', { exitCode })
    
    // アクティブな接続の終了を待つ
    setTimeout(() => {
      logger.info('Graceful shutdown completed')
      process.exit(exitCode)
    }, 5000)
  }
  
  // エラー統計取得
  getErrorStats() {
    const stats = new Map<string, { count: number; lastOccurrence: Date }>()
    
    for (const [key, count] of Array.from(this.errorCounts.entries())) {
      const lastTime = this.lastErrorTime.get(key)
      if (lastTime) {
        stats.set(key, { count, lastOccurrence: lastTime })
      }
    }
    
    return Object.fromEntries(stats)
  }
}

// ヘルパー関数
export function handleAsyncError<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return ((...args: any[]) => {
    const result = fn(...args)
    return Promise.resolve(result).catch((error) => {
      const handler = GlobalErrorHandler.getInstance()
      throw handler.handleError(error, { function: fn.name, args })
    })
  }) as T
}

// ミドルウェア用ラッパー
export function errorMiddleware(handler: (req: any, res: any) => Promise<any>) {
  return async (req: any, res: any) => {
    try {
      return await handler(req, res)
    } catch (error) {
      const errorHandler = GlobalErrorHandler.getInstance()
      return errorHandler.handleError(error as Error, {
        method: req.method,
        url: req.url,
        headers: req.headers
      })
    }
  }
}

// エクスポート
export const errorHandler = GlobalErrorHandler.getInstance()
export const circuitBreaker = (service: string) => errorHandler.getCircuitBreaker(service)
export const retry = RetryManager.execute

// デコレーター（実験的）
export function Retry(maxRetries: number = 3, baseDelay: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      return await retry(() => method.apply(this, args), maxRetries, baseDelay)
    }
    
    return descriptor
  }
}

export function CircuitBreakerDecorator(service: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const breaker = errorHandler.getCircuitBreaker(service)
    
    descriptor.value = async function (...args: any[]) {
      return await breaker.execute(() => method.apply(this, args))
    }
    
    return descriptor
  }
}