import admin from 'firebase-admin';

// Firebase Admin SDK初期化
if (!admin.apps.length) {
  try {
    // 開発環境では認証を簡略化
    if (process.env.NODE_ENV === 'development') {
      admin.initializeApp({
        projectId: 'musclesns',
      });
    } else {
      // プロダクション環境では適切なサービスアカウントキーを使用
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'musclesns',
      });
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
    // 開発環境でFirebase認証が利用できない場合の代替処理
  }
}

export const auth = admin.apps.length > 0 ? admin.auth() : null;
export default admin;