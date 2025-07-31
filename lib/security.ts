// 🛡️ ENTERPRISE GRADE SECURITY SYSTEM
// 完全無欠なセキュリティモジュール

import crypto from 'crypto'
import { NextRequest } from 'next/server'

// セキュリティ設定
const SECURITY_CONFIG = {
  // 暗号化設定
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  
  // レート制限設定
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1分
    MAX_REQUESTS: 10, // 1分間に10リクエスト
    BLOCK_DURATION: 300000, // 5分間ブロック
  },
  
  // セッション設定
  SESSION: {
    MAX_AGE: 30 * 60 * 1000, // 30分
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5分ごとにクリーンアップ
    MAX_SESSIONS_PER_USER: 3, // ユーザーあたり最大3セッション
  },
  
  // リクエスト検証
  VALIDATION: {
    MAX_PAYLOAD_SIZE: 10000, // 10KB
    MAX_HEADER_SIZE: 8192, // 8KB
    ALLOWED_ORIGINS: process.env.NODE_ENV === 'production' 
      ? ['https://line-shop-diagnosis.vercel.app'] 
      : ['http://localhost:3000', 'https://line-shop-diagnosis.vercel.app'],
  }
}

// 暗号化キー管理
class EncryptionManager {
  private static instance: EncryptionManager
  private keys: Map<string, Buffer> = new Map()
  
  private constructor() {
    // メインキーを生成または取得
    this.initializeKeys()
  }
  
  static getInstance(): EncryptionManager {
    if (!EncryptionManager.instance) {
      EncryptionManager.instance = new EncryptionManager()
    }
    return EncryptionManager.instance
  }
  
  private initializeKeys() {
    // 環境変数から暗号化キーを取得、なければ生成
    const masterKey = process.env.ENCRYPTION_KEY || this.generateSecureKey()
    this.keys.set('master', Buffer.from(masterKey, 'hex'))
    
    // セッション専用キー
    const sessionKey = process.env.SESSION_KEY || this.generateSecureKey()
    this.keys.set('session', Buffer.from(sessionKey, 'hex'))
  }
  
  private generateSecureKey(): string {
    return crypto.randomBytes(SECURITY_CONFIG.KEY_LENGTH).toString('hex')
  }
  
  encrypt(data: string, keyType: 'master' | 'session' = 'master'): string {
    const key = this.keys.get(keyType)
    if (!key) throw new Error('Encryption key not found')
    
    const iv = crypto.randomBytes(SECURITY_CONFIG.IV_LENGTH)
    const cipher = crypto.createCipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key)
    cipher.setAAD(Buffer.from('LINE_SURVEY_TOOL', 'utf8'))
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  }
  
  decrypt(encryptedData: string, keyType: 'master' | 'session' = 'master'): string {
    const key = this.keys.get(keyType)
    if (!key) throw new Error('Decryption key not found')
    
    const [ivHex, tagHex, encrypted] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    
    const decipher = crypto.createDecipher(SECURITY_CONFIG.ENCRYPTION_ALGORITHM, key)
    decipher.setAAD(Buffer.from('LINE_SURVEY_TOOL', 'utf8'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// レート制限とDDoS防御
class SecurityGuard {
  private static instance: SecurityGuard
  private rateLimits = new Map<string, { count: number; resetTime: number; blocked: boolean; blockUntil: number }>()
  private blacklist = new Set<string>()
  private whitelist = new Set<string>()
  private suspiciousIPs = new Map<string, { count: number; lastSeen: number }>()
  
  private constructor() {
    // 定期クリーンアップ
    setInterval(() => this.cleanup(), SECURITY_CONFIG.SESSION.CLEANUP_INTERVAL)
  }
  
  static getInstance(): SecurityGuard {
    if (!SecurityGuard.instance) {
      SecurityGuard.instance = new SecurityGuard()
    }
    return SecurityGuard.instance
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    
    // ブラックリストチェック
    if (this.blacklist.has(identifier)) {
      this.logSecurityEvent('BLOCKED_REQUEST', { identifier, reason: 'blacklisted' })
      return false
    }
    
    const limit = this.rateLimits.get(identifier)
    
    // ブロック期間中かチェック
    if (limit?.blocked && now < limit.blockUntil) {
      this.logSecurityEvent('BLOCKED_REQUEST', { identifier, reason: 'rate_limit_block' })
      return false
    }
    
    // レート制限リセット
    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.RATE_LIMIT.WINDOW_MS,
        blocked: false,
        blockUntil: 0
      })
      return true
    }
    
    // リクエスト数増加
    limit.count++
    
    // 制限に達した場合
    if (limit.count > SECURITY_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
      limit.blocked = true
      limit.blockUntil = now + SECURITY_CONFIG.RATE_LIMIT.BLOCK_DURATION
      
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', { 
        identifier, 
        count: limit.count,
        blockUntil: new Date(limit.blockUntil).toISOString()
      })
      
      // 繰り返し違反者を監視
      this.trackSuspiciousActivity(identifier)
      
      return false
    }
    
    return true
  }
  
  private trackSuspiciousActivity(identifier: string) {
    const suspicious = this.suspiciousIPs.get(identifier) || { count: 0, lastSeen: 0 }
    suspicious.count++
    suspicious.lastSeen = Date.now()
    
    this.suspiciousIPs.set(identifier, suspicious)
    
    // 複数回の違反でブラックリスト追加
    if (suspicious.count >= 3) {
      this.blacklist.add(identifier)
      this.logSecurityEvent('ADDED_TO_BLACKLIST', { identifier, violations: suspicious.count })
    }
  }
  
  validateRequest(request: NextRequest): { valid: boolean; reason?: string } {
    // Content-Length チェック
    const contentLength = parseInt(request.headers.get('content-length') || '0')
    if (contentLength > SECURITY_CONFIG.VALIDATION.MAX_PAYLOAD_SIZE) {
      return { valid: false, reason: 'payload_too_large' }
    }
    
    // Origin チェック
    const origin = request.headers.get('origin')
    if (origin && !SECURITY_CONFIG.VALIDATION.ALLOWED_ORIGINS.includes(origin)) {
      return { valid: false, reason: 'invalid_origin' }
    }
    
    // User-Agent チェック（基本的な検証）
    const userAgent = request.headers.get('user-agent')
    if (!userAgent || userAgent.length < 10) {
      return { valid: false, reason: 'suspicious_user_agent' }
    }
    
    // SQLインジェクション検出
    const url = request.url.toLowerCase()
    const sqlPatterns = ['union', 'select', 'insert', 'delete', 'drop', '--', ';--', 'xp_', 'sp_']
    if (sqlPatterns.some(pattern => url.includes(pattern))) {
      return { valid: false, reason: 'sql_injection_attempt' }
    }
    
    return { valid: true }
  }
  
  private cleanup() {
    const now = Date.now()
    
    // 期限切れのレート制限データを削除
    for (const [identifier, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime && now > limit.blockUntil) {
        this.rateLimits.delete(identifier)
      }
    }
    
    // 古い疑わしいIPデータを削除
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (now - data.lastSeen > 24 * 60 * 60 * 1000) { // 24時間
        this.suspiciousIPs.delete(ip)
      }
    }
  }
  
  private logSecurityEvent(event: string, data: any) {
    console.log(`🛡️ SECURITY EVENT: ${event}`, {
      timestamp: new Date().toISOString(),
      ...data
    })
  }
  
  getSecurityStats() {
    return {
      rateLimits: this.rateLimits.size,
      blacklisted: this.blacklist.size,
      suspicious: this.suspiciousIPs.size,
      timestamp: new Date().toISOString()
    }
  }
}

// セキュアセッション管理
class SecureSessionManager {
  private static instance: SecureSessionManager
  private sessions = new Map<string, {
    data: any
    created: number
    lastAccess: number
    encrypted: boolean
    fingerprint: string
  }>()
  private encryption = EncryptionManager.getInstance()
  
  private constructor() {
    setInterval(() => this.cleanup(), SECURITY_CONFIG.SESSION.CLEANUP_INTERVAL)
  }
  
  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager()
    }
    return SecureSessionManager.instance
  }
  
  createSession(userId: string, fingerprint: string, data: any): string {
    const sessionId = this.generateSessionId()
    const now = Date.now()
    
    // 既存セッション数チェック
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.fingerprint === fingerprint)
    
    if (userSessions.length >= SECURITY_CONFIG.SESSION.MAX_SESSIONS_PER_USER) {
      // 最も古いセッションを削除
      const oldestSession = userSessions
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0]
      this.sessions.delete(oldestSession[0])
    }
    
    // データを暗号化
    const encryptedData = this.encryption.encrypt(JSON.stringify(data), 'session')
    
    this.sessions.set(sessionId, {
      data: encryptedData,
      created: now,
      lastAccess: now,
      encrypted: true,
      fingerprint
    })
    
    return sessionId
  }
  
  getSession(sessionId: string): any | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null
    
    const now = Date.now()
    
    // セッション期限チェック
    if (now - session.lastAccess > SECURITY_CONFIG.SESSION.MAX_AGE) {
      this.sessions.delete(sessionId)
      return null
    }
    
    // アクセス時間更新
    session.lastAccess = now
    
    // データを復号化
    try {
      const decryptedData = this.encryption.decrypt(session.data, 'session')
      return JSON.parse(decryptedData)
    } catch (error) {
      console.error('🛡️ Session decryption failed:', error)
      this.sessions.delete(sessionId)
      return null
    }
  }
  
  updateSession(sessionId: string, data: any): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false
    
    try {
      const encryptedData = this.encryption.encrypt(JSON.stringify(data), 'session')
      session.data = encryptedData
      session.lastAccess = Date.now()
      return true
    } catch (error) {
      console.error('🛡️ Session update failed:', error)
      return false
    }
  }
  
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }
  
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }
  
  private cleanup() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccess > SECURITY_CONFIG.SESSION.MAX_AGE) {
        this.sessions.delete(sessionId)
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired sessions`)
    }
  }
}

// LINE Webhook署名検証（強化版）
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!signature || !process.env.LINE_CHANNEL_SECRET) {
    return false
  }
  
  try {
    const hash = crypto
      .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
      .update(body, 'utf8')
      .digest('base64')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(hash)
    )
  } catch (error) {
    console.error('🛡️ Signature verification failed:', error)
    return false
  }
}

// デバイスフィンガープリント生成
export function generateDeviceFingerprint(request: NextRequest): string {
  const components = [
    request.headers.get('user-agent') || '',
    request.headers.get('accept-language') || '',
    request.headers.get('accept-encoding') || '',
    request.ip || 'unknown'
  ]
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
}

// エクスポート
export const securityGuard = SecurityGuard.getInstance()
export const sessionManager = SecureSessionManager.getInstance()
export const encryption = EncryptionManager.getInstance()

// セキュリティミドルウェア
export function securityMiddleware(request: NextRequest): { success: boolean; message?: string } {
  const clientIP = request.ip || 'unknown'
  
  // レート制限チェック
  if (!securityGuard.isAllowed(clientIP)) {
    return { success: false, message: 'Rate limit exceeded' }
  }
  
  // リクエスト検証
  const validation = securityGuard.validateRequest(request)
  if (!validation.valid) {
    return { success: false, message: `Invalid request: ${validation.reason}` }
  }
  
  return { success: true }
}