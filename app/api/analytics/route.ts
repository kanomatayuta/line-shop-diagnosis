import { NextRequest, NextResponse } from 'next/server'
import { 
  generateAnalytics, 
  getAllJourneys, 
  getUserJourney, 
  exportAnalyticsData,
  resetAnalyticsData 
} from '../../../lib/analytics-manager'

// 📊 アナリティクスデータ取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const userId = searchParams.get('userId')
    
    switch (type) {
      case 'summary':
        // 基本統計サマリー
        const analytics = generateAnalytics()
        return NextResponse.json({
          success: true,
          data: analytics,
          timestamp: new Date().toISOString()
        })
      
      case 'journeys':
        // 全ユーザージャーニー
        const journeys = getAllJourneys()
        return NextResponse.json({
          success: true,
          data: journeys,
          count: journeys.length,
          timestamp: new Date().toISOString()
        })
      
      case 'user':
        // 特定ユーザーのジャーニー
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'userId parameter is required'
          }, { status: 400 })
        }
        
        const userJourney = getUserJourney(userId)
        if (!userJourney) {
          return NextResponse.json({
            success: false,
            error: 'User journey not found'
          }, { status: 404 })
        }
        
        return NextResponse.json({
          success: true,
          data: userJourney,
          timestamp: new Date().toISOString()
        })
      
      case 'export':
        // 全データエクスポート
        const exportData = exportAnalyticsData()
        return NextResponse.json({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString()
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get analytics data'
    }, { status: 500 })
  }
}

// 🔄 アナリティクスデータリセット（開発用）
export async function DELETE(request: NextRequest) {
  const success = resetAnalyticsData()
  
  if (!success) {
    return NextResponse.json({ 
      error: 'Not allowed in production' 
    }, { status: 403 })
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Analytics data reset' 
  })
}