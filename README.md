# 合トレマッチングアプリ

一緒にトレーニングする仲間を見つけるマッチングサービスです。

## 機能

### 実装済み機能
- ユーザー認証（登録・ログイン）
- 基本的なUI/UXコンポーネント
- バックエンドAPI（認証、ユーザー管理）
- データベース設計（Prisma）
- Socket.ioによるリアルタイム通信の基盤

### 今後実装予定
- マッチング機能（Tinderライクなスワイプ）
- メッセージ機能
- プロフィール作成・編集
- ジム検索・選択
- フィルタリング機能

## 技術スタック

### フロントエンド
- Next.js 14
- TypeScript
- Tailwind CSS
- React Hook Form
- Framer Motion
- Axios

### バックエンド
- Node.js
- Express
- TypeScript
- Prisma (ORM)
- PostgreSQL
- Socket.io
- JWT認証

## セットアップ

### 必要な環境
- Node.js 18+
- PostgreSQL
- npm または yarn

### 1. プロジェクトのクローン
```bash
cd muscle-matching-app
```

### 2. 依存関係のインストール
```bash
# ルートディレクトリで
npm install

# バックエンドの依存関係
cd backend
npm install

# フロントエンドの依存関係
cd ../apps/web
npm install
```

### 3. データベースの設定
```bash
# PostgreSQLデータベースを作成
createdb muscle_matching

# 環境変数を設定
cd backend
cp .env.example .env
```

`.env`ファイルを編集して、データベースの接続情報を設定：
```
DATABASE_URL="postgresql://username:password@localhost:5432/muscle_matching"
JWT_SECRET="your-super-secret-jwt-key"
```

### 4. データベースのマイグレーション
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 5. アプリケーションの起動

#### 開発環境での起動
```bash
# ルートディレクトリで（バックエンドとフロントエンドを同時に起動）
npm run dev

# または個別に起動
npm run dev:backend  # バックエンドのみ
npm run dev:web      # フロントエンドのみ
```

#### アクセス先
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:5000
- Prisma Studio: `npx prisma studio`

## プロジェクト構造

```
muscle-matching-app/
├── apps/
│   ├── web/                    # Next.js Webアプリケーション
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── mobile/                 # React Native アプリ（今後実装）
├── packages/
│   ├── shared/                 # 共通コンポーネント・ロジック
│   └── ui/                     # 共通UIコンポーネント
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middlewares/
│   │   └── types/
│   └── prisma/
└── docs/                       # ドキュメント
```

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### ユーザー（認証必要）
- `GET /api/users/profile` - プロフィール取得
- `PUT /api/users/profile` - プロフィール更新
- `POST /api/users/profile/image` - プロフィール画像アップロード

### マッチング（認証必要）
- `GET /api/matching/candidates` - マッチング候補取得
- `POST /api/matching/swipe` - スワイプアクション
- `GET /api/matching/matches` - マッチ一覧取得

### メッセージ（認証必要）
- `GET /api/messages/:matchId` - メッセージ取得
- `POST /api/messages/:matchId` - メッセージ送信

### ジム（認証必要）
- `GET /api/gyms/search` - ジム検索
- `GET /api/gyms/:id` - ジム詳細取得

## 開発状況

### 完了項目
- [x] プロジェクト初期セットアップ
- [x] バックエンドAPI基盤
- [x] データベース設計
- [x] 認証システム
- [x] フロントエンド基本構造
- [x] ログイン・登録ページ

### 進行中
- [ ] マッチング機能の実装
- [ ] メッセージ機能の実装
- [ ] プロフィール作成・編集機能
- [ ] ジム検索・選択機能

### 今後の予定
- [ ] モバイルアプリ（React Native）
- [ ] 画像アップロード機能
- [ ] プッシュ通知
- [ ] 詳細なフィルタリング
- [ ] プレミアムプラン機能

## 貢献

プロジェクトへの貢献を歓迎します。以下の手順で貢献できます：

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -am 'Add new feature'`)
4. ブランチにプッシュ (`git push origin feature/new-feature`)
5. Pull Requestを作成

## ライセンス

MIT License