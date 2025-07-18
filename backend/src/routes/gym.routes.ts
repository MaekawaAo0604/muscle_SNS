import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// ジム検索API
router.get('/search', async (req, res) => {
  try {
    const { 
      query, 
      chainName, 
      latitude, 
      longitude, 
      radius = 10000,
      limit = 50 
    } = req.query;

    let whereClause: any = {};

    // テキスト検索
    if (query) {
      whereClause.OR = [
        { name: { contains: query as string } },
        { chainName: { contains: query as string } },
        { address: { contains: query as string } }
      ];
    }

    // チェーン名でフィルタリング
    if (chainName) {
      whereClause.chainName = chainName;
    }

    let gyms;

    // 位置情報ベースの検索
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusInDegrees = parseFloat(radius as string) / 111000; // 1度 ≈ 111km

      // 簡単な距離計算（正確ではないが高速）
      whereClause.AND = [
        { latitude: { gte: lat - radiusInDegrees } },
        { latitude: { lte: lat + radiusInDegrees } },
        { longitude: { gte: lng - radiusInDegrees } },
        { longitude: { lte: lng + radiusInDegrees } }
      ];

      gyms = await prisma.gym.findMany({
        where: whereClause,
        take: parseInt(limit as string),
        orderBy: [
          { chainName: 'asc' },
          { name: 'asc' }
        ]
      });

      // より正確な距離計算とソート
      gyms = gyms.map(gym => ({
        ...gym,
        distance: calculateDistance(lat, lng, gym.latitude, gym.longitude)
      })).sort((a, b) => a.distance - b.distance);

    } else {
      // 位置情報なしの検索
      gyms = await prisma.gym.findMany({
        where: whereClause,
        take: parseInt(limit as string),
        orderBy: [
          { chainName: 'asc' },
          { name: 'asc' }
        ]
      });
    }

    res.json({
      gyms,
      total: gyms.length
    });

  } catch (error) {
    console.error('ジム検索エラー:', error);
    res.status(500).json({ error: 'ジム検索に失敗しました' });
  }
});

// 特定のジム詳細取得
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const gym = await prisma.gym.findUnique({
      where: { id },
      include: {
        userGyms: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    if (!gym) {
      return res.status(404).json({ error: 'ジムが見つかりません' });
    }

    res.json(gym);

  } catch (error) {
    console.error('ジム詳細取得エラー:', error);
    res.status(500).json({ error: 'ジム詳細取得に失敗しました' });
  }
});

// チェーン名一覧取得
router.get('/chains/list', async (req, res) => {
  try {
    const chains = await prisma.gym.findMany({
      select: {
        chainName: true
      },
      distinct: ['chainName'],
      orderBy: {
        chainName: 'asc'
      }
    });

    const chainNames = chains
      .map(chain => chain.chainName)
      .filter(name => name !== null);

    res.json({ chains: chainNames });

  } catch (error) {
    console.error('チェーン一覧取得エラー:', error);
    res.status(500).json({ error: 'チェーン一覧取得に失敗しました' });
  }
});

// ユーザーのジム登録
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const { gymId, isPrimary = false } = req.body;
    const userId = req.user!.id;

    // ジムの存在確認
    const gym = await prisma.gym.findUnique({
      where: { id: gymId }
    });

    if (!gym) {
      return res.status(404).json({ error: 'ジムが見つかりません' });
    }

    // 既存の登録確認
    const existingUserGym = await prisma.userGym.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId
        }
      }
    });

    if (existingUserGym) {
      return res.status(400).json({ error: 'このジムは既に登録されています' });
    }

    // プライマリジムの場合、既存のプライマリを解除
    if (isPrimary) {
      await prisma.userGym.updateMany({
        where: {
          userId,
          isPrimary: true
        },
        data: {
          isPrimary: false
        }
      });
    }

    // ジム登録
    const userGym = await prisma.userGym.create({
      data: {
        userId,
        gymId,
        isPrimary
      },
      include: {
        gym: true
      }
    });

    res.status(201).json(userGym);

  } catch (error) {
    console.error('ジム登録エラー:', error);
    res.status(500).json({ error: 'ジム登録に失敗しました' });
  }
});

// ユーザーのジム登録解除
router.delete('/unregister/:gymId', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;
    const userId = req.user!.id;

    const userGym = await prisma.userGym.findUnique({
      where: {
        userId_gymId: {
          userId,
          gymId
        }
      }
    });

    if (!userGym) {
      return res.status(404).json({ error: 'ジム登録が見つかりません' });
    }

    await prisma.userGym.delete({
      where: {
        userId_gymId: {
          userId,
          gymId
        }
      }
    });

    res.json({ message: 'ジム登録を解除しました' });

  } catch (error) {
    console.error('ジム登録解除エラー:', error);
    res.status(500).json({ error: 'ジム登録解除に失敗しました' });
  }
});

// ユーザーの登録済みジム一覧
router.get('/user/list', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const userGyms = await prisma.userGym.findMany({
      where: { userId },
      include: {
        gym: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ gyms: userGyms });

  } catch (error) {
    console.error('ユーザージム一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザージム一覧取得に失敗しました' });
  }
});

// プライマリジム設定
router.patch('/primary/:gymId', authMiddleware, async (req, res) => {
  try {
    const { gymId } = req.params;
    const userId = req.user!.id;

    // 既存のプライマリを解除
    await prisma.userGym.updateMany({
      where: {
        userId,
        isPrimary: true
      },
      data: {
        isPrimary: false
      }
    });

    // 新しいプライマリを設定
    const userGym = await prisma.userGym.update({
      where: {
        userId_gymId: {
          userId,
          gymId
        }
      },
      data: {
        isPrimary: true
      },
      include: {
        gym: true
      }
    });

    res.json(userGym);

  } catch (error) {
    console.error('プライマリジム設定エラー:', error);
    res.status(500).json({ error: 'プライマリジム設定に失敗しました' });
  }
});

// ヘルパー関数：2点間の距離計算（Haversine formula）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;