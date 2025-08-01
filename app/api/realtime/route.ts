import { NextRequest, NextResponse } from 'next/server'
import { getRealTimeData, getStreamingData, resolveAlert, realtimeEmitter } from '../../../lib/realtime-analytics'

// 🔴 リアルタイムアナリティクスAPI - Server-Sent Events対応
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'data'
  const stream = searchParams.get('stream') === 'true'
  
  try {
    if (stream) {
      // Server-Sent Events ストリーミング
      return new Response(
        new ReadableStream({
          start(controller) {
            // 初期データ送信
            const initialData = getStreamingData()
            controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)
            
            // リアルタイム更新のリスナー設定
            const handleUpdate = (data: any) => {
              const streamData = getStreamingData()
              controller.enqueue(`data: ${JSON.stringify(streamData)}\n\n`)
            }
            
            const handleNewResponse = (response: any) => {
              controller.enqueue(`event: newResponse\ndata: ${JSON.stringify(response)}\n\n`)
            }
            
            const handleNewInsight = (insight: any) => {
              controller.enqueue(`event: newInsight\ndata: ${JSON.stringify(insight)}\n\n`)
            }
            
            const handleAlert = (alert: any) => {
              controller.enqueue(`event: operationalAlert\ndata: ${JSON.stringify(alert)}\n\n`)
            }
            
            // イベントリスナー登録
            realtimeEmitter.on('metricsUpdate', handleUpdate)
            realtimeEmitter.on('newResponse', handleNewResponse)
            realtimeEmitter.on('newInsight', handleNewInsight)
            realtimeEmitter.on('operationalAlert', handleAlert)
            
            // 定期的なpingでコネクション維持
            const pingInterval = setInterval(() => {
              controller.enqueue(`event: ping\ndata: ${Date.now()}\n\n`)
            }, 30000)
            
            // クライアント切断時のクリーンアップ
            request.signal.addEventListener('abort', () => {
              realtimeEmitter.off('metricsUpdate', handleUpdate)
              realtimeEmitter.off('newResponse', handleNewResponse)
              realtimeEmitter.off('newInsight', handleNewInsight)
              realtimeEmitter.off('operationalAlert', handleAlert)
              clearInterval(pingInterval)
              controller.close()
            })
          }
        }),
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
          }
        }
      )
    }
    
    // 通常のデータ取得
    switch (type) {
      case 'data':
        const data = getRealTimeData()
        return NextResponse.json({
          success: true,
          data,
          timestamp: new Date().toISOString()
        })
      
      case 'streaming':
        const streamingData = getStreamingData()
        return NextResponse.json({
          success: true,
          data: streamingData,
          timestamp: new Date().toISOString()
        })
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Realtime API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get realtime data'
    }, { status: 500 })
  }
}

// アラート解決
export async function POST(request: NextRequest) {
  try {
    const { alertId, actionTaken } = await request.json()
    
    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'alertId is required'
      }, { status: 400 })
    }
    
    const resolved = resolveAlert(alertId, actionTaken)
    
    return NextResponse.json({
      success: true,
      resolved,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Alert resolution error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to resolve alert'
    }, { status: 500 })
  }
}