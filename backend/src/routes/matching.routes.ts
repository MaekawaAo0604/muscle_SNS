import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// 潜在的マッチング候補取得（高度なフィルタリング対応）
router.get('/potential', async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
      ageMin,
      ageMax,
      gender,
      gymIds,
      trainingLevel,
      timeSlots,
      limit = 10
    } = req.query;

    // 現在のユーザー情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainingProfile: true,
        userGyms: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 基本的な除外条件
    let whereClause: any = {
      id: { not: userId }, // 自分を除外
      isActive: true,
      AND: []
    };

    // 年齢フィルタ
    if (ageMin || ageMax) {
      const ageFilter: any = {};
      if (ageMin) ageFilter.gte = parseInt(ageMin as string);
      if (ageMax) ageFilter.lte = parseInt(ageMax as string);
      whereClause.AND.push({ age: ageFilter });
    }

    // 性別フィルタ
    if (gender && gender !== 'all') {
      whereClause.AND.push({ gender: gender as string });
    }

    // ジムフィルタ
    if (gymIds) {
      const gymIdArray = Array.isArray(gymIds) ? gymIds : [gymIds];
      whereClause.AND.push({
        userGyms: {
          some: {
            gymId: { in: gymIdArray as string[] }
          }
        }
      });
    }

    // トレーニングレベルフィルタ
    if (trainingLevel) {
      const levelFilter = getTrainingLevelFilter(trainingLevel as string);
      if (levelFilter) {
        whereClause.AND.push({
          trainingProfile: levelFilter
        });
      }
    }

    // 時間帯フィルタ
    if (timeSlots) {
      const timeSlotArray = Array.isArray(timeSlots) ? timeSlots : [timeSlots];
      whereClause.AND.push({
        trainingProfile: {
          preferredTimeSlots: {
            contains: timeSlotArray.join(',')
          }
        }
      });
    }

    // 既にスワイプしたユーザーを除外
    const swipedUserIds = await prisma.swipe.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true }
    });

    if (swipedUserIds.length > 0) {
      whereClause.AND.push({
        id: { notIn: swipedUserIds.map(s => s.toUserId) }
      });
    }

    // ブロックしたユーザーとブロックされたユーザーを除外
    const blockedUserIds = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      },
      select: { blockerId: true, blockedId: true }
    });

    const excludedUserIds = blockedUserIds.flatMap(block => [
      block.blockerId,
      block.blockedId
    ]).filter(id => id !== userId);

    if (excludedUserIds.length > 0) {
      whereClause.AND.push({
        id: { notIn: excludedUserIds }
      });
    }

    // 候補者取得
    const candidates = await prisma.user.findMany({
      where: whereClause,
      include: {
        trainingProfile: true,
        userGyms: {
          include: {
            gym: true
          }
        }
      },
      take: parseInt(limit as string),
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 距離計算とスコアリング
    const candidatesWithScore = candidates.map(candidate => {
      const score = calculateMatchScore(currentUser, candidate);
      return {
        ...candidate,
        matchScore: score
      };
    });

    // スコア順でソート
    candidatesWithScore.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      candidates: candidatesWithScore,
      total: candidatesWithScore.length
    });

  } catch (error) {
    console.error('マッチング候補取得エラー:', error);
    res.status(500).json({ error: 'マッチング候補取得に失敗しました' });
  }
});

// スワイプ機能
router.post('/swipe', async (req, res) => {
  try {
    const { toUserId, direction } = req.body;
    const fromUserId = req.user!.id;

    if (!toUserId || !direction) {
      return res.status(400).json({ error: 'toUserId と direction が必要です' });
    }

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ error: 'direction は left または right である必要があります' });
    }

    // 既存のスワイプをチェック
    const existingSwipe = await prisma.swipe.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId
        }
      }
    });

    if (existingSwipe) {
      return res.status(400).json({ error: '既にスワイプ済みです' });
    }

    // スワイプ記録を保存
    const swipe = await prisma.swipe.create({
      data: {
        fromUserId,
        toUserId,
        direction
      }
    });

    let isMatch = false;
    let match = null;

    // 右スワイプの場合、マッチングをチェック
    if (direction === 'right') {
      const reciprocalSwipe = await prisma.swipe.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: toUserId,
            toUserId: fromUserId
          }
        }
      });

      if (reciprocalSwipe && reciprocalSwipe.direction === 'right') {
        isMatch = true;
        
        // マッチングを作成
        match = await prisma.match.create({
          data: {
            user1Id: fromUserId < toUserId ? fromUserId : toUserId,
            user2Id: fromUserId < toUserId ? toUserId : fromUserId
          },
          include: {
            user1: {
              select: {
                id: true,
                nickname: true,
                profileImageUrl: true
              }
            },
            user2: {
              select: {
                id: true,
                nickname: true,
                profileImageUrl: true
              }
            }
          }
        });
      }
    }

    res.json({
      swipe,
      isMatch,
      match
    });

  } catch (error) {
    console.error('スワイプエラー:', error);
    res.status(500).json({ error: 'スワイプに失敗しました' });
  }
});

// マッチ一覧取得
router.get('/matches', async (req, res) => {
  try {
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;

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
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
            age: true
          }
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
            age: true
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
        createdAt: 'desc'
      }
    });

    // 相手の情報を整理
    const matchesWithPartner = matches.map(match => {
      const partner = match.user1Id === userId ? match.user2 : match.user1;
      const lastMessage = match.messages[0] || null;
      
      return {
        id: match.id,
        user: partner, // フロントエンドでは 'user' キーを期待
        lastMessage,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        isActive: match.isActive,
        unreadCount: 0 // TODO: 実装する
      };
    });

    res.json({
      matches: matchesWithPartner,
      total: matchesWithPartner.length
    });

  } catch (error) {
    console.error('マッチ一覧取得エラー:', error);
    res.status(500).json({ error: 'マッチ一覧取得に失敗しました' });
  }
});

// 特定のマッチ情報取得
router.get('/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
            age: true,
            gender: true,
            bio: true,
            trainingProfile: {
              select: {
                experienceYears: true,
                frequencyPerWeek: true,
                favoriteBodyParts: true,
                trainingGoals: true,
                preferredTimeSlots: true
              }
            }
          }
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true,
            age: true,
            gender: true,
            bio: true,
            trainingProfile: {
              select: {
                experienceYears: true,
                frequencyPerWeek: true,
                favoriteBodyParts: true,
                trainingGoals: true,
                preferredTimeSlots: true
              }
            }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // 相手の情報を取得
    const partner = match.user1Id === userId ? match.user2 : match.user1;
    
    res.json({
      id: match.id,
      user: partner,
      createdAt: match.createdAt,
      isActive: match.isActive
    });

  } catch (error) {
    console.error('マッチ情報取得エラー:', error);
    res.status(500).json({ error: 'マッチ情報の取得に失敗しました' });
  }
});

// マッチング解除
router.delete('/matches/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user!.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチを解除する権限がありません' });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { isActive: false }
    });

    res.json({ message: 'マッチングを解除しました' });

  } catch (error) {
    console.error('マッチング解除エラー:', error);
    res.status(500).json({ error: 'マッチング解除に失敗しました' });
  }
});

// ヘルパー関数：トレーニングレベルフィルタ
function getTrainingLevelFilter(level: string) {
  switch (level) {
    case 'beginner':
      return {
        experienceYears: { lt: 1 }
      };
    case 'intermediate':
      return {
        experienceYears: { gte: 1, lt: 3 }
      };
    case 'advanced':
      return {
        experienceYears: { gte: 3 }
      };
    default:
      return null;
  }
}

// ヘルパー関数：マッチングスコア計算
function calculateMatchScore(user1: any, user2: any): number {
  let score = 0;

  // 年齢の近さ (最大20点)
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age);
    score += Math.max(0, 20 - ageDiff * 2);
  }

  // 共通ジム (最大30点)
  const user1Gyms = user1.userGyms?.map((ug: any) => ug.gymId) || [];
  const user2Gyms = user2.userGyms?.map((ug: any) => ug.gymId) || [];
  const commonGyms = user1Gyms.filter((gymId: string) => user2Gyms.includes(gymId));
  score += commonGyms.length * 15;

  // トレーニング経験の近さ (最大20点)
  const exp1 = user1.trainingProfile?.experienceYears || 0;
  const exp2 = user2.trainingProfile?.experienceYears || 0;
  const expDiff = Math.abs(exp1 - exp2);
  score += Math.max(0, 20 - expDiff * 3);

  // トレーニング頻度の近さ (最大15点)
  const freq1 = user1.trainingProfile?.frequencyPerWeek || 0;
  const freq2 = user2.trainingProfile?.frequencyPerWeek || 0;
  const freqDiff = Math.abs(freq1 - freq2);
  score += Math.max(0, 15 - freqDiff * 2);

  // 基本点 (最大15点)
  score += 15;

  return Math.min(100, Math.max(0, score));
}

export default router;