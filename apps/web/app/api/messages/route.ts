import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { matchId, fromUserId, toUserId, content } = await request.json()

    if (!matchId || !fromUserId || !toUserId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify match exists and user is part of it
    const match = await prisma.match.findFirst({
      where: {
        id: matchId,
        OR: [
          { user1Id: fromUserId, user2Id: toUserId },
          { user1Id: toUserId, user2Id: fromUserId }
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

    // Create message
    const message = await prisma.message.create({
      data: {
        matchId,
        fromUserId,
        toUserId,
        content: content.trim(),
        isRead: false
      }
    })

    // Update match timestamp
    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        fromUserId: message.fromUserId,
        toUserId: message.toUserId,
        createdAt: message.createdAt.toISOString(),
        isRead: message.isRead
      }
    })
  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}