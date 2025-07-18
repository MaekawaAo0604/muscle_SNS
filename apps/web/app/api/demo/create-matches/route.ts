import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // First ensure demo users exist
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: ['demo-user-1', 'demo-user-2', 'demo-user-3', 'demo-user-4', 'demo-user-5', 'demo-user-6']
        }
      }
    })

    if (users.length < 2) {
      return NextResponse.json(
        { error: 'Not enough demo users found. Please create demo users first.' },
        { status: 400 }
      )
    }

    // Create some demo matches and swipes
    const demoMatches = [
      { user1: 'demo-user-1', user2: 'demo-user-2' },
      { user1: 'demo-user-1', user2: 'demo-user-3' },
      { user1: 'demo-user-2', user2: 'demo-user-4' },
      { user1: 'demo-user-3', user2: 'demo-user-5' },
    ]

    const createdMatches = []
    const createdSwipes = []

    for (const matchPair of demoMatches) {
      // Check if match already exists
      const existingMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { user1Id: matchPair.user1, user2Id: matchPair.user2 },
            { user1Id: matchPair.user2, user2Id: matchPair.user1 }
          ]
        }
      })

      if (!existingMatch) {
        // Create swipes in both directions
        const swipe1 = await prisma.swipe.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: matchPair.user1,
              toUserId: matchPair.user2
            }
          },
          update: {},
          create: {
            fromUserId: matchPair.user1,
            toUserId: matchPair.user2,
            direction: 'RIGHT'
          }
        })

        const swipe2 = await prisma.swipe.upsert({
          where: {
            fromUserId_toUserId: {
              fromUserId: matchPair.user2,
              toUserId: matchPair.user1
            }
          },
          update: {},
          create: {
            fromUserId: matchPair.user2,
            toUserId: matchPair.user1,
            direction: 'RIGHT'
          }
        })

        createdSwipes.push(swipe1, swipe2)

        // Create the match
        const match = await prisma.match.create({
          data: {
            user1Id: matchPair.user1 < matchPair.user2 ? matchPair.user1 : matchPair.user2,
            user2Id: matchPair.user1 < matchPair.user2 ? matchPair.user2 : matchPair.user1,
            isActive: true
          }
        })

        createdMatches.push(match)
      }
    }

    // Create some demo messages
    const demoMessages = []
    if (createdMatches.length > 0) {
      for (const match of createdMatches.slice(0, 2)) {
        const message = await prisma.message.create({
          data: {
            matchId: match.id,
            fromUserId: match.user1Id,
            toUserId: match.user2Id,
            content: 'こんにちは！一緒にトレーニングしませんか？',
            isRead: false
          }
        })
        demoMessages.push(message)
      }
    }

    return NextResponse.json({
      message: `Created ${createdMatches.length} demo matches, ${createdSwipes.length} swipes, and ${demoMessages.length} messages`,
      matches: createdMatches,
      swipes: createdSwipes,
      messages: demoMessages
    })
  } catch (error) {
    console.error('Demo matches creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}