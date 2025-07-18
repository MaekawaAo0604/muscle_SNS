import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const demoUsers = [
  {
    id: 'demo-user-1',
    email: 'hiroshi@example.com',
    nickname: 'ヒロシ',
    age: 28,
    gender: 'MALE',
    bio: 'フィットネス歴3年。筋肥大目的でトレーニングしています。一緒にBIG3を極めましょう！',
    trainingProfile: {
      experienceYears: 3,
      frequencyPerWeek: 4,
      benchPressWeight: 80,
      squatWeight: 100,
      deadliftWeight: 120,
      favoriteBodyParts: '胸、肩',
      trainingGoals: '筋肥大、ベンチプレス100kg'
    }
  },
  {
    id: 'demo-user-2',
    email: 'yuki@example.com',
    nickname: 'ユキ',
    age: 25,
    gender: 'FEMALE',
    bio: 'ダイエット目的でジムに通っています。有酸素運動メインですが、筋トレも頑張ってます💪',
    trainingProfile: {
      experienceYears: 1,
      frequencyPerWeek: 3,
      benchPressWeight: 30,
      squatWeight: 40,
      deadliftWeight: 50,
      favoriteBodyParts: '脚、お尻',
      trainingGoals: '体脂肪減少、美ボディ'
    }
  },
  {
    id: 'demo-user-3',
    email: 'takeshi@example.com',
    nickname: 'タケシ',
    age: 32,
    gender: 'MALE',
    bio: 'パワーリフター志望。重量重視でトレーニングしています。BIG3のフォームチェックお願いします！',
    trainingProfile: {
      experienceYears: 5,
      frequencyPerWeek: 5,
      benchPressWeight: 120,
      squatWeight: 140,
      deadliftWeight: 160,
      favoriteBodyParts: '背中、脚',
      trainingGoals: 'パワーリフティング、MAX更新'
    }
  },
  {
    id: 'demo-user-4',
    email: 'mika@example.com',
    nickname: 'ミカ',
    age: 29,
    gender: 'FEMALE',
    bio: 'ボディメイク目的でトレーニング中。特に上半身の筋肉をつけたいです！',
    trainingProfile: {
      experienceYears: 2,
      frequencyPerWeek: 4,
      benchPressWeight: 40,
      squatWeight: 60,
      deadliftWeight: 70,
      favoriteBodyParts: '胸、背中',
      trainingGoals: '筋肥大、上半身強化'
    }
  },
  {
    id: 'demo-user-5',
    email: 'kenji@example.com',
    nickname: 'ケンジ',
    age: 35,
    gender: 'MALE',
    bio: 'サラリーマンの隙間時間トレーニー。効率重視で短時間集中型です。',
    trainingProfile: {
      experienceYears: 4,
      frequencyPerWeek: 3,
      benchPressWeight: 90,
      squatWeight: 110,
      deadliftWeight: 130,
      favoriteBodyParts: '胸、脚',
      trainingGoals: '筋力維持、体力向上'
    }
  },
  {
    id: 'demo-user-6',
    email: 'satomi@example.com',
    nickname: 'サトミ',
    age: 27,
    gender: 'FEMALE',
    bio: 'ヨガインストラクター。柔軟性と筋力の両立を目指しています🧘‍♀️',
    trainingProfile: {
      experienceYears: 3,
      frequencyPerWeek: 5,
      benchPressWeight: 35,
      squatWeight: 50,
      deadliftWeight: 60,
      favoriteBodyParts: 'コア、肩',
      trainingGoals: '柔軟性、体幹強化'
    }
  }
]

export async function POST(request: NextRequest) {
  try {
    const createdUsers = []

    for (const userData of demoUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userData.id }
      })

      if (existingUser) {
        console.log(`User ${userData.nickname} already exists, skipping...`)
        continue
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          id: userData.id,
          email: userData.email,
          nickname: userData.nickname,
          age: userData.age,
          gender: userData.gender,
          bio: userData.bio,
          passwordHash: '', // Demo users don't need password
          isActive: true
        }
      })

      // Create training profile
      const trainingProfile = await prisma.trainingProfile.create({
        data: {
          userId: user.id,
          ...userData.trainingProfile
        }
      })

      createdUsers.push({
        user,
        trainingProfile
      })
    }

    return NextResponse.json({
      message: `Created ${createdUsers.length} demo users`,
      users: createdUsers
    })
  } catch (error) {
    console.error('Demo user creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}