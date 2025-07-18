import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// ユーザーを通報
router.post('/report', async (req, res) => {
  try {
    const reporterId = req.user!.id;
    const { reportedId, reason, description } = req.body;

    if (!reportedId || !reason) {
      return res.status(400).json({ error: 'reportedId と reason が必要です' });
    }

    // 自分自身を通報できない
    if (reporterId === reportedId) {
      return res.status(400).json({ error: '自分自身を通報することはできません' });
    }

    // 通報対象のユーザーが存在するか確認
    const reportedUser = await prisma.user.findUnique({
      where: { id: reportedId }
    });

    if (!reportedUser) {
      return res.status(404).json({ error: '通報対象のユーザーが見つかりません' });
    }

    // 既に通報済みか確認
    const existingReport = await prisma.report.findUnique({
      where: {
        reporterId_reportedId: {
          reporterId,
          reportedId
        }
      }
    });

    if (existingReport) {
      return res.status(400).json({ error: '既にこのユーザーを通報済みです' });
    }

    // 通報作成
    const report = await prisma.report.create({
      data: {
        reporterId,
        reportedId,
        reason,
        description
      },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true
          }
        },
        reported: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    res.status(201).json({
      message: '通報を受け付けました',
      report
    });

  } catch (error) {
    console.error('通報エラー:', error);
    res.status(500).json({ error: '通報の処理に失敗しました' });
  }
});

// ユーザーをブロック
router.post('/block', async (req, res) => {
  try {
    const blockerId = req.user!.id;
    const { blockedId } = req.body;

    if (!blockedId) {
      return res.status(400).json({ error: 'blockedId が必要です' });
    }

    // 自分自身をブロックできない
    if (blockerId === blockedId) {
      return res.status(400).json({ error: '自分自身をブロックすることはできません' });
    }

    // ブロック対象のユーザーが存在するか確認
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId }
    });

    if (!blockedUser) {
      return res.status(404).json({ error: 'ブロック対象のユーザーが見つかりません' });
    }

    // 既にブロック済みか確認
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: '既にこのユーザーをブロック済みです' });
    }

    // ブロック作成
    const block = await prisma.block.create({
      data: {
        blockerId,
        blockedId
      },
      include: {
        blocker: {
          select: {
            id: true,
            nickname: true
          }
        },
        blocked: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    // 既存のマッチがあれば無効化
    await prisma.match.updateMany({
      where: {
        OR: [
          { user1Id: blockerId, user2Id: blockedId },
          { user1Id: blockedId, user2Id: blockerId }
        ]
      },
      data: {
        isActive: false
      }
    });

    res.status(201).json({
      message: 'ユーザーをブロックしました',
      block
    });

  } catch (error) {
    console.error('ブロックエラー:', error);
    res.status(500).json({ error: 'ブロックの処理に失敗しました' });
  }
});

// ユーザーのブロックを解除
router.delete('/block/:blockedId', async (req, res) => {
  try {
    const blockerId = req.user!.id;
    const { blockedId } = req.params;

    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    });

    if (!block) {
      return res.status(404).json({ error: 'ブロック情報が見つかりません' });
    }

    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId
        }
      }
    });

    res.json({ message: 'ブロックを解除しました' });

  } catch (error) {
    console.error('ブロック解除エラー:', error);
    res.status(500).json({ error: 'ブロック解除に失敗しました' });
  }
});

// ブロックしたユーザー一覧取得
router.get('/blocked-users', async (req, res) => {
  try {
    const blockerId = req.user!.id;

    const blockedUsers = await prisma.block.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      blockedUsers: blockedUsers.map(block => ({
        id: block.id,
        blockedAt: block.createdAt,
        user: block.blocked
      }))
    });

  } catch (error) {
    console.error('ブロックユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ブロックユーザー一覧の取得に失敗しました' });
  }
});

// 通報理由の一覧取得
router.get('/report-reasons', (req, res) => {
  const reasons = [
    { value: 'inappropriate_content', label: '不適切なコンテンツ' },
    { value: 'harassment', label: 'ハラスメント' },
    { value: 'spam', label: 'スパム' },
    { value: 'fake_profile', label: '偽のプロフィール' },
    { value: 'inappropriate_behavior', label: '不適切な行動' },
    { value: 'safety_concern', label: '安全性への懸念' },
    { value: 'other', label: 'その他' }
  ];

  res.json({ reasons });
});

// 管理者用：通報一覧取得
router.get('/admin/reports', async (req, res) => {
  try {
    // 簡易的な管理者チェック（実際のアプリでは適切な権限チェックを実装）
    const userId = req.user!.id;
    
    // 管理者かどうかの確認（この例では省略）
    // 実際の実装では、admin役割のチェックなどを行う
    
    const { status = 'all', page = 1, limit = 20 } = req.query;

    let whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true,
            email: true
          }
        },
        reported: {
          select: {
            id: true,
            nickname: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const totalReports = await prisma.report.count({
      where: whereClause
    });

    res.json({
      reports,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalReports,
        totalPages: Math.ceil(totalReports / parseInt(limit as string))
      }
    });

  } catch (error) {
    console.error('管理者通報一覧取得エラー:', error);
    res.status(500).json({ error: '通報一覧の取得に失敗しました' });
  }
});

// 管理者用：通報のステータス更新
router.patch('/admin/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { status },
      include: {
        reporter: {
          select: {
            id: true,
            nickname: true
          }
        },
        reported: {
          select: {
            id: true,
            nickname: true
          }
        }
      }
    });

    res.json({
      message: 'ステータスを更新しました',
      report: updatedReport
    });

  } catch (error) {
    console.error('通報ステータス更新エラー:', error);
    res.status(500).json({ error: 'ステータス更新に失敗しました' });
  }
});

export default router;