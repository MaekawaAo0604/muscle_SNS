import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { firebaseUserId } = await request.json()
    
    if (!firebaseUserId) {
      return NextResponse.json(
        { error: 'Firebase user ID is required' },
        { status: 400 }
      )
    }

    // Check if Firebase user exists in database
    const firebaseUser = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    })

    if (!firebaseUser) {
      return NextResponse.json(
        { error: 'Firebase user not found in database' },
        { status: 404 }
      )
    }

    // Get demo users to match with
    const demoUsers = await prisma.user.findMany({
      where: {
        id: {
          in: ['demo-user-1', 'demo-user-2', 'demo-user-3', 'demo-user-4']
        }
      }
    })

    if (demoUsers.length === 0) {
      return NextResponse.json(
        { error: 'No demo users found. Please create demo users first.' },
        { status: 400 }
      )
    }

    // Create matches between Firebase user and demo users
    const createdMatches = []
    const createdSwipes = []
    const createdMessages = []

    for (const demoUser of demoUsers.slice(0, 2)) { // Create 2 matches
      // Check if match already exists
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: firebaseUserId, user2Id: demoUser.id },
            { user1Id: demoUser.id, user2Id: firebaseUserId }
          ]
        }
      })

      if (!existingMatch) {
        // Create swipes in both directions
        const swipe1 = await prisma.swipe.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: firebaseUserId,
              toUserId: demoUser.id
            }
          },
          update: {},
          create: {
            fromUserId: firebaseUserId,
            toUserId: demoUser.id,
            direction: 'RIGHT'
          }
        })

        const swipe2 = await prisma.swipe.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: demoUser.id,
              toUserId: firebaseUserId
            }
          },
          update: {},
          create: {
            fromUserId: demoUser.id,
            toUserId: firebaseUserId,
            direction: 'RIGHT'
          }
        })

        createdSwipes.push(swipe1, swipe2)

        // Create the match
        const match = await prisma.match.create({
          data: {
            user1Id: firebaseUserId < demoUser.id ? firebaseUserId : demoUser.id,
            user2Id: firebaseUserId < demoUser.id ? demoUser.id : firebaseUserId,
            isActive: true
          }
        })

        createdMatches.push(match)

        // Create a demo message
        const message = await prisma.message.create({
          data: {
            matchId: match.id,
            fromUserId: demoUser.id,
            toUserId: firebaseUserId,
            content: `こんにちは！${demoUser.nickname}です。一緒にトレーニングしませんか？`,
            isRead: false
          }
        })
        createdMessages.push(message)
      }
    }

    return NextResponse.json({
      message: `Created ${createdMatches.length} matches for Firebase user`,
      firebaseUserId,
      matches: createdMatches,
      swipes: createdSwipes,
      messages: createdMessages
    })
  } catch (error) {
    console.error('Firebase matches creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}