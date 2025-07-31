// 🎯 完全版LINEアンケートツール - 型定義

export interface SurveyButton {
  label: string
  action: string
  value?: string
  next?: string
}

export interface DisplaySettings {
  layout?: 'vertical' | 'carousel'
  buttonSize?: 'sm' | 'md' | 'lg'
}

export interface SurveyStep {
  title: string
  message: string
  buttons: SurveyButton[]
  displaySettings?: DisplaySettings
}

export interface SurveyConfig {
  [key: string]: SurveyStep
}

export interface UserSession {
  currentStep: string
  data: Record<string, any>
  lastActivity: number
  requestCount: number
}

export interface RateLimitInfo {
  requests: number
  resetTime: number
}