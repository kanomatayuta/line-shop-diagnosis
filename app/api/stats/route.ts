import { NextRequest, NextResponse } from 'next/server'
import { getActualSystemStats, resetStats } from '../../../lib/stats-manager'

export async function GET(request: NextRequest) {
  try {
    const stats = getActualSystemStats()
    
    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Stats API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get system stats'
    }, { status: 500 })
  }
}

// 統計リセット用（開発用）
export async function DELETE(request: NextRequest) {
  const success = resetStats()
  
  if (!success) {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }
  
  return NextResponse.json({ success: true, message: 'Stats reset' })
}