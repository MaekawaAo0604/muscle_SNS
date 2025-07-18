#!/bin/bash

# Vercel環境変数を一括設定するスクリプト
echo "Setting Vercel environment variables..."

# Firebase設定
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY AIzaSyD0vsT5ySYamXWiVhnZdnCxHyNXjG4qVxg production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN musclesns.firebaseapp.com production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID musclesns production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET musclesns.firebasestorage.app production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 160560927319 production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID 1:160560927319:web:762f2db996c06c1e65c912 production

# API設定
vercel env add NEXT_PUBLIC_API_URL https://muscle-matching-backend.onrender.com production
vercel env add NEXT_PUBLIC_SOCKET_URL https://muscle-matching-backend.onrender.com production

# データベース設定
vercel env add DATABASE_URL "postgresql://muscle_matching_user:XLjmzoCFQUITrHE6RvJk0nbNeoNWw2BZ@dpg-d1t23rili9vc73fjik1g-a/muscle_matching" production

echo "環境変数設定完了！"
echo "次に実行: vercel --prod"