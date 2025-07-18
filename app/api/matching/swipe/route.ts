import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { fromUserId, toUserId, direction } = await request.json()

    if (!fromUserId || !toUserId || !direction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create swipe record
    const swipe = await prisma.swipe.create({
      data: {
        fromUserId,
        toUserId,
        direction: direction.toUpperCase()
      }
    })

    let isMatch = false

    // Check for match if it's a RIGHT swipe
    if (direction.toUpperCase() === 'RIGHT') {
      const reciprocalSwipe = await prisma.swipe.findFirst({
        where: {
          fromUserId: toUserId,
          toUserId: fromUserId,
          direction: 'RIGHT'
        }
      })

      if (reciprocalSwipe) {
        // Create match
        const match = await prisma.match.create({
          data: {
            user1Id: fromUserId < toUserId ? fromUserId : toUserId,
            user2Id: fromUserId < toUserId ? toUserId : fromUserId,
            isActive: true
          }
        })
        
        isMatch = true
      }
    }

    return NextResponse.json({
      swipe,
      isMatch
    })
  } catch (error) {
    console.error('Swipe error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}