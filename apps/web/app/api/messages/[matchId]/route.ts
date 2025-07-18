import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // Get messages for this match
    const messages = await prisma.message.findMany({
      where: {
        matchId: params.matchId
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}