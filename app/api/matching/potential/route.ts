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

    // Get users who haven't been swiped by current user
    const swipedUserIds = await prisma.swipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true }
    })

    const excludedIds = [userId, ...swipedUserIds.map(s => s.toUserId)]

    // Get potential matches
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
        isActive: true
      },
      include: {
        trainingProfile: true
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for frontend
    const users = potentialMatches.map(user => ({
      id: user.id,
      nickname: user.nickname,
      age: user.age,
      gender: user.gender,
      bio: user.bio,
      profileImageUrl: user.profileImageUrl,
      trainingProfile: user.trainingProfile ? {
        experienceYears: user.trainingProfile.experienceYears,
        frequencyPerWeek: user.trainingProfile.frequencyPerWeek,
        benchPressWeight: user.trainingProfile.benchPressWeight,
        squatWeight: user.trainingProfile.squatWeight,
        deadliftWeight: user.trainingProfile.deadliftWeight,
        favoriteBodyParts: user.trainingProfile.favoriteBodyParts,
        trainingGoals: user.trainingProfile.trainingGoals
      } : null
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Potential matches error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}