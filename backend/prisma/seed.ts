import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 日本の主要ジムデータ
  const gyms = [
    // エニタイムフィットネス
    {
      name: 'エニタイムフィットネス 渋谷店',
      chainName: 'エニタイムフィットネス',
      address: '東京都渋谷区渋谷2-22-3',
      latitude: 35.6581,
      longitude: 139.7414,
    },
    {
      name: 'エニタイムフィットネス 新宿店',
      chainName: 'エニタイムフィットネス',
      address: '東京都新宿区新宿3-1-13',
      latitude: 35.6896,
      longitude: 139.7006,
    },
    {
      name: 'エニタイムフィットネス 品川店',
      chainName: 'エニタイムフィットネス',
      address: '東京都港区高輪4-10-18',
      latitude: 35.6286,
      longitude: 139.7390,
    },
    {
      name: 'エニタイムフィットネス 池袋店',
      chainName: 'エニタイムフィットネス',
      address: '東京都豊島区南池袋1-26-6',
      latitude: 35.7295,
      longitude: 139.7100,
    },
    {
      name: 'エニタイムフィットネス 横浜店',
      chainName: 'エニタイムフィットネス',
      address: '神奈川県横浜市西区北幸1-1-8',
      latitude: 35.4658,
      longitude: 139.6201,
    },
    
    // ゴールドジム
    {
      name: 'ゴールドジム 原宿東京',
      chainName: 'ゴールドジム',
      address: '東京都渋谷区神宮前6-31-21',
      latitude: 35.6681,
      longitude: 139.7074,
    },
    {
      name: 'ゴールドジム 表参道東京',
      chainName: 'ゴールドジム',
      address: '東京都港区北青山2-5-8',
      latitude: 35.6654,
      longitude: 139.7142,
    },
    {
      name: 'ゴールドジム 恵比寿東京',
      chainName: 'ゴールドジム',
      address: '東京都渋谷区恵比寿1-13-6',
      latitude: 35.6468,
      longitude: 139.7101,
    },
    {
      name: 'ゴールドジム 上野駅前店',
      chainName: 'ゴールドジム',
      address: '東京都台東区上野7-1-1',
      latitude: 35.7138,
      longitude: 139.7770,
    },
    
    // ティップネス
    {
      name: 'ティップネス 渋谷店',
      chainName: 'ティップネス',
      address: '東京都渋谷区渋谷1-3-18',
      latitude: 35.6598,
      longitude: 139.7023,
    },
    {
      name: 'ティップネス 新宿店',
      chainName: 'ティップネス',
      address: '東京都新宿区新宿4-1-6',
      latitude: 35.6897,
      longitude: 139.7038,
    },
    {
      name: 'ティップネス 六本木店',
      chainName: 'ティップネス',
      address: '東京都港区六本木6-6-9',
      latitude: 35.6627,
      longitude: 139.7316,
    },
    
    // フィットプレイス
    {
      name: 'フィットプレイス 青山店',
      chainName: 'フィットプレイス',
      address: '東京都港区南青山5-4-27',
      latitude: 35.6651,
      longitude: 139.7100,
    },
    {
      name: 'フィットプレイス 銀座店',
      chainName: 'フィットプレイス',
      address: '東京都中央区銀座5-6-12',
      latitude: 35.6707,
      longitude: 139.7621,
    },
    
    // ルネサンス
    {
      name: 'ルネサンス 新宿店',
      chainName: 'ルネサンス',
      address: '東京都新宿区新宿4-3-17',
      latitude: 35.6903,
      longitude: 139.7043,
    },
    {
      name: 'ルネサンス 渋谷店',
      chainName: 'ルネサンス',
      address: '東京都渋谷区道玄坂2-24-1',
      latitude: 35.6584,
      longitude: 139.6993,
    },
    
    // コナミスポーツ
    {
      name: 'コナミスポーツ 新宿店',
      chainName: 'コナミスポーツ',
      address: '東京都新宿区西新宿1-4-11',
      latitude: 35.6918,
      longitude: 139.6973,
    },
    {
      name: 'コナミスポーツ 渋谷店',
      chainName: 'コナミスポーツ',
      address: '東京都渋谷区宇田川町15-1',
      latitude: 35.6617,
      longitude: 139.6988,
    },
    
    // ジェクサー
    {
      name: 'ジェクサー 新宿店',
      chainName: 'ジェクサー',
      address: '東京都新宿区新宿3-38-1',
      latitude: 35.6907,
      longitude: 139.7033,
    },
    {
      name: 'ジェクサー 品川店',
      chainName: 'ジェクサー',
      address: '東京都港区港南2-16-1',
      latitude: 35.6256,
      longitude: 139.7411,
    },
    
    // 大阪エリア
    {
      name: 'エニタイムフィットネス 梅田店',
      chainName: 'エニタイムフィットネス',
      address: '大阪府大阪市北区梅田1-3-1',
      latitude: 34.7024,
      longitude: 135.4959,
    },
    {
      name: 'ゴールドジム 梅田大阪',
      chainName: 'ゴールドジム',
      address: '大阪府大阪市北区梅田2-4-9',
      latitude: 34.7021,
      longitude: 135.4937,
    },
    {
      name: 'ティップネス 難波店',
      chainName: 'ティップネス',
      address: '大阪府大阪市中央区難波4-1-15',
      latitude: 34.6665,
      longitude: 135.4972,
    },
    
    // 名古屋エリア
    {
      name: 'エニタイムフィットネス 名古屋栄店',
      chainName: 'エニタイムフィットネス',
      address: '愛知県名古屋市中区栄3-18-1',
      latitude: 35.1677,
      longitude: 136.9067,
    },
    {
      name: 'ゴールドジム 名古屋金山',
      chainName: 'ゴールドジム',
      address: '愛知県名古屋市中区金山1-17-1',
      latitude: 35.1420,
      longitude: 136.9009,
    },
    
    // 福岡エリア
    {
      name: 'エニタイムフィットネス 天神店',
      chainName: 'エニタイムフィットネス',
      address: '福岡県福岡市中央区天神2-3-10',
      latitude: 33.5904,
      longitude: 130.3947,
    },
    {
      name: 'ゴールドジム 博多福岡',
      chainName: 'ゴールドジム',
      address: '福岡県福岡市博多区博多駅前2-1-1',
      latitude: 33.5904,
      longitude: 130.4200,
    },
    
    // 札幌エリア
    {
      name: 'エニタイムフィットネス 札幌駅前店',
      chainName: 'エニタイムフィットネス',
      address: '北海道札幌市中央区北4条西2-1-1',
      latitude: 43.0686,
      longitude: 141.3506,
    },
    
    // 仙台エリア
    {
      name: 'エニタイムフィットネス 仙台駅前店',
      chainName: 'エニタイムフィットネス',
      address: '宮城県仙台市青葉区中央1-1-1',
      latitude: 38.2604,
      longitude: 140.8822,
    },
    
    // 広島エリア
    {
      name: 'エニタイムフィットネス 広島店',
      chainName: 'エニタイムフィットネス',
      address: '広島県広島市中区基町6-27',
      latitude: 34.3853,
      longitude: 132.4553,
    },
  ];

  console.log('ジムデータを投入中...');
  
  for (const gym of gyms) {
    await prisma.gym.create({
      data: gym
    });
  }

  console.log(`${gyms.length}件のジムデータを投入しました`);

  // デモユーザーを作成
  console.log('デモユーザーを作成中...');
  
  const demoUsers = [
    {
      id: 'demo-user-1',
      email: 'hiroshi@example.com',
      passwordHash: '', // 空のパスワード（Firebase認証用）
      nickname: 'ヒロシ',
      age: 28,
      gender: '男性',
      bio: '筋トレ歴3年です！一緒にトレーニングしましょう！',
      profileImageUrl: null,
    },
    {
      id: 'demo-user-2',
      email: 'yuki@example.com',
      passwordHash: '', 
      nickname: 'ユキ',
      age: 25,
      gender: '女性',
      bio: '健康的な体作りを目指しています。',
      profileImageUrl: null,
    },
    {
      id: 'demo-user-3',
      email: 'takeshi@example.com',
      passwordHash: '',
      nickname: 'タケシ',
      age: 32,
      gender: '男性',
      bio: 'パワーリフティング中心にやってます。',
      profileImageUrl: null,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  // トレーニングプロフィールを作成
  console.log('トレーニングプロフィールを作成中...');
  
  const trainingProfiles = [
    {
      userId: 'demo-user-1',
      experienceYears: 3,
      frequencyPerWeek: 4,
      benchPressWeight: 80,
      squatWeight: 100,
      deadliftWeight: 120,
      favoriteBodyParts: '胸、肩',
      trainingGoals: 'バルクアップ',
      preferredTimeSlots: '夜',
    },
    {
      userId: 'demo-user-2',
      experienceYears: 1,
      frequencyPerWeek: 3,
      benchPressWeight: 40,
      squatWeight: 60,
      deadliftWeight: 70,
      favoriteBodyParts: '脚、お尻',
      trainingGoals: '体型維持',
      preferredTimeSlots: '夕方',
    },
    {
      userId: 'demo-user-3',
      experienceYears: 5,
      frequencyPerWeek: 5,
      benchPressWeight: 120,
      squatWeight: 150,
      deadliftWeight: 180,
      favoriteBodyParts: '背中、脚',
      trainingGoals: 'パワーアップ',
      preferredTimeSlots: '朝',
    },
  ];

  for (const profile of trainingProfiles) {
    await prisma.trainingProfile.upsert({
      where: { userId: profile.userId },
      update: profile,
      create: profile,
    });
  }

  // マッチを作成
  console.log('マッチを作成中...');
  
  const matches = [
    {
      id: 'match-1',
      user1Id: 'demo-user-1',
      user2Id: 'demo-user-2',
      isActive: true,
    },
    {
      id: 'match-2', 
      user1Id: 'demo-user-1',
      user2Id: 'demo-user-3',
      isActive: true,
    },
  ];

  for (const match of matches) {
    await prisma.match.upsert({
      where: { id: match.id },
      update: match,
      create: match,
    });
  }

  // メッセージを作成
  console.log('メッセージを作成中...');
  
  const messages = [
    {
      id: 'msg-1',
      matchId: 'match-1',
      fromUserId: 'demo-user-2',
      toUserId: 'demo-user-1',
      content: 'こんにちは！ユキです。一緒にトレーニングしませんか？',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
    },
    {
      id: 'msg-2',
      matchId: 'match-1',
      fromUserId: 'demo-user-1',
      toUserId: 'demo-user-2',
      content: 'ありがとうございます！いつトレーニングしますか？',
      isRead: false,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12時間前
    },
    {
      id: 'msg-3',
      matchId: 'match-2',
      fromUserId: 'demo-user-3',
      toUserId: 'demo-user-1',
      content: 'こんにちは！一緒にトレーニングしませんか？',
      isRead: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6時間前
    },
  ];

  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: message,
      create: message,
    });
  }

  console.log('デモデータの作成が完了しました');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });