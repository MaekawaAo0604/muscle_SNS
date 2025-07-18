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

    // Get match info
    const match = await prisma.match.findFirst({
      where: {
        id: params.matchId,
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
        }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Get the other user
    const otherUser = match.user1Id === userId ? match.user2 : match.user1

    const response = {
      id: match.id,
      createdAt: match.createdAt.toISOString(),
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
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Match fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}