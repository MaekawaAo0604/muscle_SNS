import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        isActive: true
      },
      include: {
        user1: {
          include: {
            trainingProfile: true
          }
        },
        user2: {
          include: {
            trainingProfile: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform data for frontend
    const formattedMatches = await Promise.all(
      matches.map(async (match) => {
        const otherUser = match.user1Id === userId ? match.user2 : match.user1
        const lastMessage = match.messages[0] || null

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            matchId: match.id,
            toUserId: userId,
            isRead: false
          }
        })

        return {
          id: match.id,
          createdAt: match.createdAt.toISOString(),
          isActive: match.isActive,
          user: {
            id: otherUser.id,
            nickname: otherUser.nickname,
            age: otherUser.age,
            gender: otherUser.gender,
            bio: otherUser.bio,
            profileImageUrl: otherUser.profileImageUrl,
            trainingProfile: otherUser.trainingProfile ? {
              experienceYears: otherUser.trainingProfile.experienceYears,
              frequencyPerWeek: otherUser.trainingProfile.frequencyPerWeek,
              favoriteBodyParts: otherUser.trainingProfile.favoriteBodyParts,
              trainingGoals: otherUser.trainingProfile.trainingGoals
            } : null
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt.toISOString(),
            fromUserId: lastMessage.fromUserId
          } : null,
          unreadCount
        }
      })
    )

    return NextResponse.json({ matches: formattedMatches })
  } catch (error) {
    console.error('Matches fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}