import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify user is part of this match
    const match = await prisma.match.findFirst({
      where: {
        id: params.matchId,
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        isActive: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found or unauthorized' },
        { status: 404 }
      )
    }

    // Mark all unread messages as read for this user in this match
    await prisma.message.updateMany({
      where: {
        matchId: params.matchId,
        toUserId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark messages as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}