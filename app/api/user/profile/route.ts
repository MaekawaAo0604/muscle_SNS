import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      nickname,
      age,
      gender,
      bio,
      experienceYears,
      frequencyPerWeek,
      benchPressWeight,
      squatWeight,
      deadliftWeight,
      favoriteBodyParts,
      trainingGoals,
    } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname: nickname || undefined,
        age: age || undefined,
        gender: gender || undefined,
        bio: bio || undefined,
        updatedAt: new Date(),
      },
    })

    // Create or update training profile
    const trainingProfile = await prisma.trainingProfile.upsert({
      where: { userId },
      update: {
        experienceYears: experienceYears || undefined,
        frequencyPerWeek: frequencyPerWeek || undefined,
        benchPressWeight: benchPressWeight || undefined,
        squatWeight: squatWeight || undefined,
        deadliftWeight: deadliftWeight || undefined,
        favoriteBodyParts: favoriteBodyParts || undefined,
        trainingGoals: trainingGoals || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId,
        experienceYears: experienceYears || undefined,
        frequencyPerWeek: frequencyPerWeek || undefined,
        benchPressWeight: benchPressWeight || undefined,
        squatWeight: squatWeight || undefined,
        deadliftWeight: deadliftWeight || undefined,
        favoriteBodyParts: favoriteBodyParts || undefined,
        trainingGoals: trainingGoals || undefined,
      },
    })

    return NextResponse.json({
      user: updatedUser,
      trainingProfile,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainingProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}