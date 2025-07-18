import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload, uploadToCloudinary, deleteImage } from '../utils/cloudinary';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// プロフィール取得
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        trainingProfile: true,
        userGyms: {
          include: {
            gym: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json(user);
  } catch (error) {
    console.error('プロフィール取得エラー:', error);
    res.status(500).json({ error: 'プロフィール取得に失敗しました' });
  }
});

// プロフィール更新
router.post('/profile', async (req, res) => {
  try {
    const userId = req.user!.id;
    const {
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
      preferredTimeSlots
    } = req.body;

    // ユーザー基本情報更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        age,
        gender,
        bio
      }
    });

    // トレーニングプロフィール更新
    const trainingProfileData = {
      experienceYears,
      frequencyPerWeek,
      benchPressWeight,
      squatWeight,
      deadliftWeight,
      favoriteBodyParts,
      trainingGoals,
      preferredTimeSlots
    };

    const trainingProfile = await prisma.trainingProfile.upsert({
      where: { userId },
      update: trainingProfileData,
      create: {
        userId,
        ...trainingProfileData
      }
    });

    res.json({
      user: updatedUser,
      trainingProfile
    });
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    res.status(500).json({ error: 'プロフィール更新に失敗しました' });
  }
});

// プロフィール画像アップロード
router.post('/profile/image', upload.single('image'), async (req, res) => {
  try {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    // 既存の画像を削除
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingUser?.profileImageUrl) {
      const publicId = existingUser.profileImageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        await deleteImage(`muscle-matching/${publicId}`);
      }
    }

    // Cloudinaryにアップロード
    const uploadResult = await uploadToCloudinary(file.buffer, 'muscle-matching/profiles');

    // データベース更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImageUrl: uploadResult.secure_url
      }
    });

    res.json({
      imageUrl: uploadResult.secure_url,
      user: updatedUser
    });
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    res.status(500).json({ error: '画像アップロードに失敗しました' });
  }
});

// Firebase同期
router.post('/sync', async (req, res) => {
  try {
    const { firebaseUid, email, displayName } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'Firebase UID と email が必要です' });
    }

    // 既存ユーザーをチェック
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // 新規ユーザー作成
      user = await prisma.user.create({
        data: {
          id: firebaseUid,
          email,
          passwordHash: '', // Firebaseユーザーはパスワードハッシュ不要
          nickname: displayName || email.split('@')[0],
        }
      });
    }

    // Generate JWT token for backend API calls
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ 
      user,
      token 
    });
  } catch (error) {
    console.error('Firebase同期エラー:', error);
    res.status(500).json({ error: 'Firebase同期に失敗しました' });
  }
});

export default router;