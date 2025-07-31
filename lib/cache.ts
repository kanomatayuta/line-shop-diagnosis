// 🚀 ULTIMATE PERFORMANCE OPTIMIZATION & CACHING SYSTEM
// 最高性能のキャッシュと最適化システム

import { logger, performance as perfTracker } from './monitoring'

// キャッシュ設定
const CACHE_CONFIG = {
  DEFAULT_TTL: 15 * 60 * 1000, // 15分
  MAX_CACHE_SIZE: 1000, // 最大1000エントリ
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5分ごとにクリーンアップ
  MEMORY_THRESHOLD: 0.8, // メモリ使用量80%でクリーンアップ
  HIT_RATE_THRESHOLD: 0.7, // ヒット率70%以下で最適化
}

// キャッシュエントリー
interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
  hitCount: number
  lastAccess: number
  size: number // バイト数（概算）
}

// LRU (Least Recently Used) キャッシュ
class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private totalSize = 0
  private hitCount = 0
  private missCount = 0
  private cleanupInterval: NodeJS.Timeout
  
  constructor(
    private maxSize: number = CACHE_CONFIG.MAX_CACHE_SIZE,
    private defaultTTL: number = CACHE_CONFIG.DEFAULT_TTL
  ) {
    // 定期的なクリーンアップを開始
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, CACHE_CONFIG.CLEANUP_INTERVAL)
  }
  
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const entryTTL = ttl || this.defaultTTL
    const size = this.estimateSize(value)
    
    // 既存エントリーがある場合は削除
    if (this.cache.has(key)) {
      this.delete(key)
    }
    
    // 新しいエントリーを作成
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTTL,
      hitCount: 0,
      lastAccess: now,
      size
    }
    
    this.cache.set(key, entry)
    this.accessOrder.push(key)
    this.totalSize += size
    
    // サイズ制限をチェック
    this.evictIfNecessary()
    
    logger.debug('Cache set', { key, size, ttl: entryTTL })
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key)
    const now = Date.now()
    
    if (!entry) {
      this.missCount++
      logger.debug('Cache miss', { key })
      return null
    }
    
    // TTL チェック
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      this.missCount++
      logger.debug('Cache expired', { key, age: now - entry.timestamp })
      return null
    }
    
    // ヒット時の更新
    entry.hitCount++
    entry.lastAccess = now
    this.hitCount++
    
    // LRU順序を更新
    this.updateAccessOrder(key)
    
    logger.debug('Cache hit', { key, hitCount: entry.hitCount })
    return entry.value
  }
  
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    this.cache.delete(key)
    this.totalSize -= entry.size
    
    // アクセス順序からも削除
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    
    logger.debug('Cache delete', { key })
    return true
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    // TTL チェック
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      return false
    }
    
    return true
  }
  
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.totalSize = 0
    this.hitCount = 0
    this.missCount = 0
    logger.info('Cache cleared')
  }
  
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }
  
  private evictIfNecessary(): void {
    // サイズベースの削除
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.delete(oldestKey)
      }
    }
    
    // メモリ使用量ベースの削除
    const memUsage = process.memoryUsage()
    const memoryRatio = memUsage.heapUsed / memUsage.heapTotal
    
    if (memoryRatio > CACHE_CONFIG.MEMORY_THRESHOLD) {
      const entriesToRemove = Math.floor(this.cache.size * 0.2) // 20%削除
      logger.warn('High memory usage, evicting cache entries', { 
        memoryRatio, 
        entriesToRemove 
      })
      
      for (let i = 0; i < entriesToRemove && this.accessOrder.length > 0; i++) {
        const keyToRemove = this.accessOrder.shift()
        if (keyToRemove) {
          this.delete(keyToRemove)
        }
      }
    }
  }
  
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    // 期限切れエントリーを収集
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }
    
    // 削除実行
    keysToDelete.forEach(key => this.delete(key))
    
    if (keysToDelete.length > 0) {
      logger.info('Cache cleanup completed', { 
        expired: keysToDelete.length,
        remaining: this.cache.size
      })
    }
  }
  
  private estimateSize(value: T): number {
    try {
      // JSON文字列化してサイズを概算
      return JSON.stringify(value).length * 2 // UTF-16なので2倍
    } catch {
      return 1000 // デフォルトサイズ
    }
  }
  
  getStats() {
    const total = this.hitCount + this.missCount
    const hitRate = total > 0 ? this.hitCount / total : 0
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalSize: this.totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      memoryUsage: process.memoryUsage()
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// メモ化デコレーター
function memoize<T extends (...args: any[]) => any>(
  ttl: number = CACHE_CONFIG.DEFAULT_TTL,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const cache = new LRUCache<ReturnType<T>>()
    
    descriptor.value = function (...args: Parameters<T>): ReturnType<T> {
      const key = keyGenerator ? 
        keyGenerator(...args) : 
        `${propertyKey}_${JSON.stringify(args)}`
      
      // キャッシュから取得を試行
      const cached = cache.get(key)
      if (cached !== null) {
        return cached
      }
      
      // メソッド実行
      const result = originalMethod.apply(this, args)
      
      // 結果をキャッシュに保存（Promiseの場合は解決後）
      if (result instanceof Promise) {
        return result.then((resolvedResult) => {
          cache.set(key, resolvedResult, ttl)
          return resolvedResult
        })
      } else {
        cache.set(key, result, ttl)
        return result
      }
    }
    
    return descriptor
  }
}

// キャッシュマネージャー
class CacheManager {
  private static instance: CacheManager
  private caches = new Map<string, LRUCache<any>>()
  
  private constructor() {}
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }
  
  getCache<T>(name: string, maxSize?: number, defaultTTL?: number): LRUCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new LRUCache<T>(maxSize, defaultTTL))
      logger.info('Cache created', { name, maxSize, defaultTTL })
    }
    return this.caches.get(name)!
  }
  
  deleteCache(name: string): boolean {
    const cache = this.caches.get(name)
    if (cache) {
      cache.destroy()
      this.caches.delete(name)
      logger.info('Cache deleted', { name })
      return true
    }
    return false
  }
  
  clearAllCaches(): void {
    for (const [name, cache] of this.caches.entries()) {
      cache.clear()
      logger.info('Cache cleared', { name })
    }
  }
  
  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats()
    }
    return stats
  }
  
  optimizeAll(): void {
    for (const [name, cache] of this.caches.entries()) {
      const stats = cache.getStats()
      
      // ヒット率が低い場合は警告
      if (stats.hitRate < CACHE_CONFIG.HIT_RATE_THRESHOLD) {
        logger.warn('Low cache hit rate detected', { name, hitRate: stats.hitRate })
      }
      
      // サイズが大きすぎる場合はクリーンアップ
      if (stats.size > stats.maxSize * 0.9) {
        logger.info('Cache approaching size limit, triggering cleanup', { 
          name, 
          size: stats.size, 
          maxSize: stats.maxSize 
        })
      }
    }
  }
}

// 非同期関数のキャッシュ
class AsyncCache<T> {
  private cache = new LRUCache<Promise<T>>()
  private pending = new Map<string, Promise<T>>()
  
  async get(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // キャッシュから取得を試行
    const cached = this.cache.get(key)
    if (cached) {
      try {
        return await cached
      } catch (error) {
        // キャッシュされた失敗したPromiseを削除
        this.cache.delete(key)
      }
    }
    
    // 進行中の処理があるかチェック
    const pendingPromise = this.pending.get(key)
    if (pendingPromise) {
      return await pendingPromise
    }
    
    // 新しい処理を開始
    const promise = factory().finally(() => {
      this.pending.delete(key)
    })
    
    this.pending.set(key, promise)
    this.cache.set(key, promise, ttl)
    
    return await promise
  }
  
  delete(key: string): void {
    this.cache.delete(key)
    this.pending.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
    this.pending.clear()
  }
}

// パフォーマンス最適化ユーティリティ
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private batchQueues = new Map<string, { items: any[]; timeout: NodeJS.Timeout }>()
  
  private constructor() {}
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }
  
  // バッチ処理
  batch<T, R>(
    key: string,
    item: T,
    processor: (items: T[]) => Promise<R[]>,
    delay: number = 100,
    maxBatchSize: number = 10
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      let queue = this.batchQueues.get(key)
      
      if (!queue) {
        queue = { items: [], timeout: setTimeout(() => {}, 0) }
        this.batchQueues.set(key, queue)
      }
      
      queue.items.push({ item, resolve, reject })
      
      // バッチサイズに達した場合は即座に処理
      if (queue.items.length >= maxBatchSize) {
        this.processBatch(key, processor)
      } else {
        // タイムアウト設定
        clearTimeout(queue.timeout)
        queue.timeout = setTimeout(() => {
          this.processBatch(key, processor)
        }, delay)
      }
    })
  }
  
  private async processBatch<T, R>(
    key: string,
    processor: (items: T[]) => Promise<R[]>
  ): Promise<void> {
    const queue = this.batchQueues.get(key)
    if (!queue || queue.items.length === 0) return
    
    const items = queue.items.splice(0)
    this.batchQueues.delete(key)
    
    try {
      const inputItems = items.map(({ item }) => item)
      const results = await processor(inputItems)
      
      items.forEach(({ resolve }, index) => {
        resolve(results[index])
      })
    } catch (error) {
      items.forEach(({ reject }) => {
        reject(error)
      })
    }
  }
  
  // デバウンス
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }
  
  // スロットル
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastExecTime = 0
    
    return (...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastExecTime >= delay) {
        func(...args)
        lastExecTime = now
      }
    }
  }
}

// エクスポート
export const cacheManager = CacheManager.getInstance()
export const performanceOptimizer = PerformanceOptimizer.getInstance()
export { LRUCache, AsyncCache, memoize }

// 便利なヘルパー関数
export function withCache<T>(
  cacheKey: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cache = cacheManager.getCache<T>('default')
  const asyncCache = new AsyncCache<T>()
  
  return asyncCache.get(cacheKey, factory, ttl)
}

export function cached<T extends (...args: any[]) => any>(
  ttl?: number,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return memoize<T>(ttl, keyGenerator)
}

// パフォーマンス測定付きキャッシュ
export async function withPerformanceCache<T>(
  cacheKey: string,
  factory: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const trackingId = `cache_${cacheKey}`
  
  return await perfTracker.measure(trackingId, async () => {
    return await withCache(cacheKey, factory, ttl)
  }).then(({ result, duration }) => {
    logger.debug('Cache operation completed', {
      cacheKey,
      duration,
      cached: duration < 10 // 10ms未満はキャッシュヒットと推定
    })
    return result
  })
}