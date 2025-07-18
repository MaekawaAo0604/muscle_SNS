import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { firebaseUid, email, displayName, photoURL } = await request.json()

    if (!firebaseUid || !email) {
      return NextResponse.json(
        { error: 'Firebase UID and email are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: firebaseUid }
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { id: firebaseUid },
        data: {
          email,
          nickname: displayName || existingUser.nickname,
          profileImageUrl: photoURL || existingUser.profileImageUrl,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({ user: updatedUser })
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          id: firebaseUid,
          email,
          nickname: displayName || 'ユーザー',
          profileImageUrl: photoURL,
          passwordHash: '', // Not used for Firebase users
          isActive: true
        }
      })

      return NextResponse.json({ user: newUser })
    }
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}