// 📊 ENTERPRISE MONITORING & ANALYTICS SYSTEM
// 最高品質のロギング・モニタリングシステム

import fs from 'fs'
import path from 'path'

// モニタリング設定
const MONITORING_CONFIG = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MAX_LOG_SIZE: 10 * 1024 * 1024, // 10MB
  LOG_ROTATION_COUNT: 5,
  METRICS_INTERVAL: 60000, // 1分
  ALERT_THRESHOLDS: {
    ERROR_RATE: 0.05, // 5%エラー率
    RESPONSE_TIME: 3000, // 3秒
    MEMORY_USAGE: 0.8, // 80%メモリ使用率
    CPU_USAGE: 0.9, // 90%CPU使用率
  }
}

// ログレベル定義
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// メトリクス収集
class MetricsCollector {
  private static instance: MetricsCollector
  private metrics = {
    requests: {
      total: 0,
      success: 0,
      error: 0,
      avgResponseTime: 0,
      responseTimeSum: 0,
      responseTimeCount: 0
    },
    system: {
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      uptime: process.uptime(),
      startTime: Date.now()
    },
    survey: {
      totalSessions: 0,
      completedSurveys: 0,
      abandonedSurveys: 0,
      averageCompletionTime: 0,
      stepAnalytics: new Map<string, { visits: number; completions: number; abandonments: number }>()
    },
    security: {
      blockedRequests: 0,
      rateLimitHits: 0,
      suspiciousActivity: 0,
      activeThreats: 0
    }
  }
  
  private intervals: NodeJS.Timeout[] = []
  
  private constructor() {
    this.startMetricsCollection()
  }
  
  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }
  
  // リクエストメトリクス記録
  recordRequest(success: boolean, responseTime: number) {
    this.metrics.requests.total++
    if (success) {
      this.metrics.requests.success++
    } else {
      this.metrics.requests.error++
    }
    
    this.metrics.requests.responseTimeSum += responseTime
    this.metrics.requests.responseTimeCount++
    this.metrics.requests.avgResponseTime = 
      this.metrics.requests.responseTimeSum / this.metrics.requests.responseTimeCount
  }
  
  // サーベイメトリクス記録
  recordSurveyEvent(event: 'start' | 'complete' | 'abandon', stepId?: string, completionTime?: number) {
    switch (event) {
      case 'start':
        this.metrics.survey.totalSessions++
        break
      case 'complete':
        this.metrics.survey.completedSurveys++
        if (completionTime) {
          // 完了時間の移動平均を計算
          const currentAvg = this.metrics.survey.averageCompletionTime
          const completedCount = this.metrics.survey.completedSurveys
          this.metrics.survey.averageCompletionTime = 
            (currentAvg * (completedCount - 1) + completionTime) / completedCount
        }
        break
      case 'abandon':
        this.metrics.survey.abandonedSurveys++
        break
    }
    
    // ステップ別分析
    if (stepId) {
      const stepMetrics = this.metrics.survey.stepAnalytics.get(stepId) || 
        { visits: 0, completions: 0, abandonments: 0 }
      
      if (event === 'start') stepMetrics.visits++
      if (event === 'complete') stepMetrics.completions++
      if (event === 'abandon') stepMetrics.abandonments++
      
      this.metrics.survey.stepAnalytics.set(stepId, stepMetrics)
    }
  }
  
  // セキュリティメトリクス記録
  recordSecurityEvent(event: 'blocked' | 'rateLimit' | 'suspicious' | 'threat') {
    switch (event) {
      case 'blocked':
        this.metrics.security.blockedRequests++
        break
      case 'rateLimit':
        this.metrics.security.rateLimitHits++
        break
      case 'suspicious':
        this.metrics.security.suspiciousActivity++
        break
      case 'threat':
        this.metrics.security.activeThreats++
        break
    }
  }
  
  // システムメトリクス更新
  private updateSystemMetrics() {
    const memUsage = process.memoryUsage()
    this.metrics.system.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: memUsage.heapUsed / memUsage.heapTotal
    }
    this.metrics.system.uptime = process.uptime()
  }
  
  // メトリクス収集開始
  private startMetricsCollection() {
    const interval = setInterval(() => {
      this.updateSystemMetrics()
      this.checkAlerts()
    }, MONITORING_CONFIG.METRICS_INTERVAL)
    
    this.intervals.push(interval)
  }
  
  // アラートチェック
  private checkAlerts() {
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.error / this.metrics.requests.total 
      : 0
    
    if (errorRate > MONITORING_CONFIG.ALERT_THRESHOLDS.ERROR_RATE) {
      Logger.getInstance().critical('High error rate detected', { errorRate })
    }
    
    if (this.metrics.requests.avgResponseTime > MONITORING_CONFIG.ALERT_THRESHOLDS.RESPONSE_TIME) {
      Logger.getInstance().warn('High response time detected', { 
        avgResponseTime: this.metrics.requests.avgResponseTime 
      })
    }
    
    if (this.metrics.system.memory.percentage > MONITORING_CONFIG.ALERT_THRESHOLDS.MEMORY_USAGE) {
      Logger.getInstance().critical('High memory usage detected', { 
        memoryUsage: this.metrics.system.memory.percentage 
      })
    }
  }
  
  // メトリクス取得
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      errorRate: this.metrics.requests.total > 0 
        ? this.metrics.requests.error / this.metrics.requests.total 
        : 0,
      completionRate: this.metrics.survey.totalSessions > 0 
        ? this.metrics.survey.completedSurveys / this.metrics.survey.totalSessions 
        : 0
    }
  }
  
  // リセット
  reset() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      error: 0,
      avgResponseTime: 0,
      responseTimeSum: 0,
      responseTimeCount: 0
    }
    // その他のメトリクスもリセット
  }
  
  // クリーンアップ
  destroy() {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
  }
}

// 高度なロガー
class Logger {
  private static instance: Logger
  private logPath: string
  private currentLogFile: string
  private logBuffer: string[] = []
  private flushInterval: NodeJS.Timeout
  
  private constructor() {
    this.logPath = path.join(process.cwd(), 'logs')
    this.ensureLogDirectory()
    this.currentLogFile = this.generateLogFileName()
    
    // バッファリング書き込み（パフォーマンス向上）
    this.flushInterval = setInterval(() => this.flushLogs(), 5000)
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true })
    }
  }
  
  private generateLogFileName(): string {
    const date = new Date().toISOString().split('T')[0]
    return path.join(this.logPath, `app-${date}.log`)
  }
  
  private shouldLog(level: LogLevel): boolean {
    const configLevel = LogLevel[MONITORING_CONFIG.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO
    return level >= configLevel
  }
  
  private formatLogEntry(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      pid: process.pid,
      ...(data && { data })
    }
    return JSON.stringify(logEntry) + '\n'
  }
  
  private writeLog(level: LogLevel, levelName: string, message: string, data?: any) {
    if (!this.shouldLog(level)) return
    
    const logEntry = this.formatLogEntry(levelName, message, data)
    
    // コンソール出力（開発環境）
    if (process.env.NODE_ENV !== 'production') {
      const colors = {
        DEBUG: '\x1b[36m',
        INFO: '\x1b[32m',
        WARN: '\x1b[33m',
        ERROR: '\x1b[31m',
        CRITICAL: '\x1b[35m'
      }
      console.log(`${colors[levelName as keyof typeof colors] || ''}${logEntry.trim()}\x1b[0m`)
    }
    
    // ファイルバッファに追加
    this.logBuffer.push(logEntry)
    
    // ログローテーション確認
    this.checkLogRotation()
  }
  
  private async flushLogs() {
    if (this.logBuffer.length === 0) return
    
    try {
      const logsToWrite = this.logBuffer.splice(0)
      await fs.promises.appendFile(this.currentLogFile, logsToWrite.join(''))
    } catch (error) {
      console.error('Failed to write logs:', error)
    }
  }
  
  private checkLogRotation() {
    try {
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile)
        if (stats.size > MONITORING_CONFIG.MAX_LOG_SIZE) {
          this.rotateLog()
        }
      }
    } catch (error) {
      console.error('Log rotation check failed:', error)
    }
  }
  
  private rotateLog() {
    try {
      // 既存のログファイルをリネーム
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const archivedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`)
      fs.renameSync(this.currentLogFile, archivedFile)
      
      // 古いログファイルを削除（設定された数以上の場合）
      this.cleanupOldLogs()
      
      // 新しいログファイル名を生成
      this.currentLogFile = this.generateLogFileName()
    } catch (error) {
      console.error('Log rotation failed:', error)
    }
  }
  
  private cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logPath)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logPath, file),
          mtime: fs.statSync(path.join(this.logPath, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      
      // 設定された数以上のファイルを削除
      if (files.length > MONITORING_CONFIG.LOG_ROTATION_COUNT) {
        files.slice(MONITORING_CONFIG.LOG_ROTATION_COUNT).forEach(file => {
          fs.unlinkSync(file.path)
        })
      }
    } catch (error) {
      console.error('Log cleanup failed:', error)
    }
  }
  
  // パブリックメソッド
  debug(message: string, data?: any) {
    this.writeLog(LogLevel.DEBUG, 'DEBUG', message, data)
  }
  
  info(message: string, data?: any) {
    this.writeLog(LogLevel.INFO, 'INFO', message, data)
  }
  
  warn(message: string, data?: any) {
    this.writeLog(LogLevel.WARN, 'WARN', message, data)
  }
  
  error(message: string, data?: any) {
    this.writeLog(LogLevel.ERROR, 'ERROR', message, data)
  }
  
  critical(message: string, data?: any) {
    this.writeLog(LogLevel.CRITICAL, 'CRITICAL', message, data)
  }
  
  // 構造化ログ
  logRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string) {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      type: 'http_request'
    })
  }
  
  logSurveyEvent(event: string, userId: string, stepId?: string, data?: any) {
    this.info('Survey Event', {
      event,
      userId,
      stepId,
      data,
      type: 'survey_event'
    })
  }
  
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: any) {
    const logMethod = severity === 'critical' ? this.critical : 
                     severity === 'high' ? this.error :
                     severity === 'medium' ? this.warn : this.info
    
    logMethod.call(this, `Security Event: ${event}`, {
      severity,
      data,
      type: 'security_event'
    })
  }
  
  // ヘルスチェック
  async getLogHealth() {
    try {
      const stats = fs.existsSync(this.currentLogFile) 
        ? fs.statSync(this.currentLogFile) 
        : null
      
      return {
        healthy: true,
        currentLogFile: this.currentLogFile,
        logFileSize: stats?.size || 0,
        bufferSize: this.logBuffer.length,
        lastWrite: stats?.mtime || null
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // クリーンアップ
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushLogs()
  }
}

// パフォーマンス追跡
class PerformanceTracker {
  private static instance: PerformanceTracker
  private activeTracking = new Map<string, { start: number; metadata?: any }>()
  
  private constructor() {}
  
  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker()
    }
    return PerformanceTracker.instance
  }
  
  start(trackingId: string, metadata?: any) {
    this.activeTracking.set(trackingId, {
      start: Date.now(),
      metadata
    })
  }
  
  end(trackingId: string): number | null {
    const tracking = this.activeTracking.get(trackingId)
    if (!tracking) return null
    
    const duration = Date.now() - tracking.start
    this.activeTracking.delete(trackingId)
    
    // メトリクス記録
    const logger = Logger.getInstance()
    logger.debug('Performance measurement', {
      trackingId,
      duration,
      metadata: tracking.metadata,
      type: 'performance'
    })
    
    return duration
  }
  
  measure<T>(trackingId: string, fn: () => T | Promise<T>, metadata?: any): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      this.start(trackingId, metadata)
      
      try {
        const result = await fn()
        const duration = this.end(trackingId) || 0
        resolve({ result, duration })
      } catch (error) {
        this.end(trackingId)
        reject(error)
      }
    })
  }
}

// エクスポート
export const metrics = MetricsCollector.getInstance()
export const logger = Logger.getInstance()
export const performance = PerformanceTracker.getInstance()

// ヘルスチェックエンドポイント用
export async function getSystemHealth() {
  const systemMetrics = metrics.getMetrics()
  const logHealth = await logger.getLogHealth()
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: systemMetrics,
    logging: logHealth,
    version: process.env.npm_package_version || 'unknown'
  }
}