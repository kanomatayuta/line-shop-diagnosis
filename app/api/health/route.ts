// 🏥 COMPREHENSIVE HEALTH CHECK & MONITORING API
// 最高品質のヘルスチェックシステム

import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth, metrics, logger } from '../../../lib/monitoring'
import { securityGuard } from '../../../lib/security'
import { cacheManager } from '../../../lib/cache'
import { errorHandler } from '../../../lib/error-handler'

// システムヘルスチェック
export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // セキュリティチェック
    const clientIP = request.ip || 'unknown'
    if (!securityGuard.isAllowed(clientIP)) {
      return NextResponse.json({
        status: 'error',
        message: 'Rate limit exceeded'
      }, { status: 429 })
    }
    
    // 基本システムヘルス取得
    const systemHealth = await getSystemHealth()
    
    // 追加ヘルスチェック
    const additionalChecks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkExternalServicesHealth(),
      checkCacheHealth(),
      checkSecurityHealth(),
      checkPerformanceHealth()
    ])
    
    const healthChecks = {
      database: getCheckResult(additionalChecks[0]),
      externalServices: getCheckResult(additionalChecks[1]),
      cache: getCheckResult(additionalChecks[2]),
      security: getCheckResult(additionalChecks[3]),
      performance: getCheckResult(additionalChecks[4])
    }
    
    // 全体的な健康状態を判定
    const overallStatus = determineOverallStatus(healthChecks)
    const responseTime = performance.now() - startTime
    
    // メトリクス記録
    metrics.recordRequest(true, responseTime)
    
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTimeMs: Math.round(responseTime),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      system: systemHealth,
      checks: healthChecks,
      summary: {
        healthy: overallStatus === 'healthy',
        degraded: overallStatus === 'degraded',
        unhealthy: overallStatus === 'unhealthy',
        totalChecks: Object.keys(healthChecks).length,
        passedChecks: Object.values(healthChecks).filter(check => check.status === 'healthy').length
      }
    }
    
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime,
      clientIP
    })
    
    return NextResponse.json(response, { 
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    const responseTime = performance.now() - startTime
    metrics.recordRequest(false, responseTime)
    
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    })
    
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      responseTimeMs: Math.round(responseTime)
    }, { status: 503 })
  }
}

// 詳細メトリクス取得
export async function POST(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    const body = await request.json()
    const { includeDetails = false, includeMetrics = false } = body
    
    // セキュリティチェック
    const clientIP = request.ip || 'unknown'
    if (!securityGuard.isAllowed(clientIP)) {
      return NextResponse.json({
        error: 'Rate limit exceeded'
      }, { status: 429 })
    }
    
    const response: any = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid
    }
    
    if (includeMetrics) {
      response.metrics = metrics.getMetrics()
      response.cache = cacheManager.getAllStats()
      response.security = securityGuard.getSecurityStats()
      response.errors = errorHandler.getErrorStats()
    }
    
    if (includeDetails) {
      response.system = {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        versions: process.versions
      }
      
      response.environment = {
        nodeEnv: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    }
    
    const responseTime = performance.now() - startTime
    response.responseTimeMs = Math.round(responseTime)
    
    metrics.recordRequest(true, responseTime)
    
    return NextResponse.json(response)
    
  } catch (error) {
    const responseTime = performance.now() - startTime
    metrics.recordRequest(false, responseTime)
    
    return errorHandler.handleError(error as Error, {
      endpoint: '/api/health',
      method: 'POST'
    })
  }
}

// ヘルスチェック関数群
async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  try {
    // データベース接続とクエリのテスト
    // 実際のプロジェクトでは実際のDB接続をテスト
    const startTime = performance.now()
    
    // サンプルチェック（実際のDBクエリに置き換え）
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const responseTime = performance.now() - startTime
    
    return {
      status: 'healthy',
      responseTimeMs: Math.round(responseTime),
      details: {
        connected: true,
        responseTime: Math.round(responseTime)
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database check failed',
      details: {
        connected: false
      }
    }
  }
}

async function checkExternalServicesHealth(): Promise<HealthCheckResult> {
  try {
    const checks = await Promise.allSettled([
      checkLineAPI(),
      // 他の外部サービスのチェックを追加
    ])
    
    const lineCheck = getCheckResult(checks[0])
    
    const allHealthy = [lineCheck].every(check => check.status === 'healthy')
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      details: {
        line: lineCheck
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'External services check failed'
    }
  }
}

async function checkLineAPI(): Promise<HealthCheckResult> {
  try {
    // LINE APIの基本的な接続確認
    const hasToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN
    const hasSecret = !!process.env.LINE_CHANNEL_SECRET
    
    if (!hasToken || !hasSecret) {
      return {
        status: 'unhealthy',
        error: 'LINE API credentials not configured',
        details: {
          hasToken,
          hasSecret
        }
      }
    }
    
    return {
      status: 'healthy',
      details: {
        configured: true,
        hasToken,
        hasSecret
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'LINE API check failed'
    }
  }
}

async function checkCacheHealth(): Promise<HealthCheckResult> {
  try {
    const cacheStats = cacheManager.getAllStats()
    const totalCaches = Object.keys(cacheStats).length
    
    // キャッシュの健康状態をチェック
    let healthyCaches = 0
    const cacheDetails: Record<string, any> = {}
    
    for (const [name, stats] of Object.entries(cacheStats)) {
      const isHealthy = stats.hitRate > 0.5 || stats.hitCount + stats.missCount < 10
      if (isHealthy) healthyCaches++
      
      cacheDetails[name] = {
        healthy: isHealthy,
        hitRate: stats.hitRate,
        size: stats.size,
        maxSize: stats.maxSize
      }
    }
    
    const status = healthyCaches === totalCaches ? 'healthy' : 
                   healthyCaches > totalCaches / 2 ? 'degraded' : 'unhealthy'
    
    return {
      status,
      details: {
        totalCaches,
        healthyCaches,
        caches: cacheDetails
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Cache check failed'
    }
  }
}

async function checkSecurityHealth(): Promise<HealthCheckResult> {
  try {
    const securityStats = securityGuard.getSecurityStats()
    
    // セキュリティ指標の評価
    const hasActiveThreats = securityStats.blacklisted > 0 || securityStats.suspicious > 0
    const highRateLimit = securityStats.rateLimits > 100 // 閾値は調整可能
    
    const status = hasActiveThreats ? 'degraded' : 
                   highRateLimit ? 'degraded' : 'healthy'
    
    return {
      status,
      details: {
        activeThreats: hasActiveThreats,
        rateLimitInstances: securityStats.rateLimits,
        blacklistedIPs: securityStats.blacklisted,
        suspiciousActivity: securityStats.suspicious
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Security check failed'
    }
  }
}

async function checkPerformanceHealth(): Promise<HealthCheckResult> {
  try {
    const systemMetrics = metrics.getMetrics()
    const memoryUsage = process.memoryUsage()
    
    // パフォーマンス指標の評価
    const memoryRatio = memoryUsage.heapUsed / memoryUsage.heapTotal
    const errorRate = systemMetrics.errorRate
    const avgResponseTime = systemMetrics.requests.avgResponseTime
    
    const memoryHealthy = memoryRatio < 0.8
    const errorRateHealthy = errorRate < 0.05
    const responseTimeHealthy = avgResponseTime < 1000
    
    const healthyCount = [memoryHealthy, errorRateHealthy, responseTimeHealthy].filter(Boolean).length
    const status = healthyCount === 3 ? 'healthy' : 
                   healthyCount >= 2 ? 'degraded' : 'unhealthy'
    
    return {
      status,
      details: {
        memory: {
          ratio: memoryRatio,
          healthy: memoryHealthy
        },
        errorRate: {
          value: errorRate,
          healthy: errorRateHealthy
        },
        responseTime: {
          value: avgResponseTime,
          healthy: responseTimeHealthy
        }
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Performance check failed'
    }
  }
}

// ヘルパー関数
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  error?: string
  responseTimeMs?: number
  details?: any
}

function getCheckResult(result: PromiseSettledResult<HealthCheckResult>): HealthCheckResult {
  if (result.status === 'fulfilled') {
    return result.value
  } else {
    return {
      status: 'unhealthy',
      error: result.reason instanceof Error ? result.reason.message : 'Check failed'
    }
  }
}

function determineOverallStatus(checks: Record<string, HealthCheckResult>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map(check => check.status)
  
  if (statuses.some(status => status === 'unhealthy')) {
    return 'unhealthy'
  }
  
  if (statuses.some(status => status === 'degraded')) {
    return 'degraded'
  }
  
  return 'healthy'
}