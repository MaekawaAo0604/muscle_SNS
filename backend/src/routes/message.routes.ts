import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload, uploadToCloudinary } from '../utils/cloudinary';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// マッチのメッセージ一覧取得
router.get('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;
    const { page = 1, limit = 50 } = req.query;

    // マッチの存在と権限確認
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // メッセージ取得
    const messages = await prisma.message.findMany({
      where: { matchId },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        },
        toUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    // 逆順にして古いメッセージから新しいメッセージの順にする
    const reversedMessages = messages.reverse();

    res.json({
      messages: reversedMessages,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        hasMore: messages.length === parseInt(limit as string)
      }
    });

  } catch (error) {
    console.error('メッセージ取得エラー:', error);
    res.status(500).json({ error: 'メッセージ取得に失敗しました' });
  }
});

// メッセージ送信
router.post('/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'メッセージ内容が必要です' });
    }

    // マッチの存在と権限確認
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // 相手のID取得
    const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // メッセージ作成
    const message = await prisma.message.create({
      data: {
        matchId,
        fromUserId: userId,
        toUserId: recipientId,
        content: content.trim()
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        },
        toUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        }
      }
    });

    // マッチの更新日時を更新
    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message });

  } catch (error) {
    console.error('メッセージ送信エラー:', error);
    res.status(500).json({ error: 'メッセージ送信に失敗しました' });
  }
});

// メッセージ画像送信
router.post('/:matchId/image', upload.single('image'), async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    // マッチの存在と権限確認
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // 画像をCloudinaryにアップロード
    const uploadResult = await uploadToCloudinary(file.buffer, 'muscle-matching/messages');

    // 相手のID取得
    const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;

    // メッセージ作成
    const message = await prisma.message.create({
      data: {
        matchId,
        fromUserId: userId,
        toUserId: recipientId,
        content: '画像を送信しました',
        imageUrl: uploadResult.secure_url
      },
      include: {
        fromUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        },
        toUser: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        }
      }
    });

    // マッチの更新日時を更新
    await prisma.match.update({
      where: { id: matchId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message });

  } catch (error) {
    console.error('画像メッセージ送信エラー:', error);
    res.status(500).json({ error: '画像メッセージ送信に失敗しました' });
  }
});

// メッセージ既読更新
router.patch('/:matchId/read', async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;

    // マッチの存在と権限確認
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // 未読メッセージを既読に更新
    const updatedCount = await prisma.message.updateMany({
      where: {
        matchId,
        toUserId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ 
      message: '既読にしました',
      updatedCount: updatedCount.count
    });

  } catch (error) {
    console.error('既読更新エラー:', error);
    res.status(500).json({ error: '既読更新に失敗しました' });
  }
});

// 未読メッセージ数取得
router.get('/:matchId/unread-count', async (req, res) => {
  try {
    const { matchId } = req.params;
    // テスト用：クエリパラメータからuserIdを取得
    const userId = req.query.userId as string || req.user?.id;

    // マッチの存在と権限確認
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ error: 'マッチが見つかりません' });
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: 'このマッチにアクセスする権限がありません' });
    }

    // 未読メッセージ数を取得
    const unreadCount = await prisma.message.count({
      where: {
        matchId,
        toUserId: userId,
        isRead: false
      }
    });

    res.json({ unreadCount });

  } catch (error) {
    console.error('未読メッセージ数取得エラー:', error);
    res.status(500).json({ error: '未読メッセージ数取得に失敗しました' });
  }
});

export default router;