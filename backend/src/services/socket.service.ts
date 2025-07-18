import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth.types';

const prisma = new PrismaClient();

// オンラインユーザー管理
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocketHandlers = (io: Server) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as JWTPayload;

      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    console.log(`User ${userId} connected`);

    // オンラインユーザーに追加
    onlineUsers.set(userId, socket.id);

    // Join user to their own room
    socket.join(userId);

    // Join match rooms
    socket.on('join_match', async (data) => {
      const { matchId } = data;
      
      // マッチの存在と権限を確認
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          user1: true,
          user2: true
        }
      });

      if (match && (match.user1Id === userId || match.user2Id === userId)) {
        socket.join(matchId);
        console.log(`User ${userId} joined match ${matchId}`);
      }
    });

    // Leave match rooms
    socket.on('leave_match', (data) => {
      const { matchId } = data;
      socket.leave(matchId);
      console.log(`User ${userId} left match ${matchId}`);
    });

    // メッセージ送信
    socket.on('send_message', async (data) => {
      try {
        const { matchId, content, imageUrl } = data;

        // マッチの存在確認
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            user1: true,
            user2: true
          }
        });

        if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
          socket.emit('error', { message: 'マッチが見つかりません' });
          return;
        }

        // 相手のID取得
        const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;

        // メッセージをデータベースに保存
        const message = await prisma.message.create({
          data: {
            matchId,
            fromUserId: userId,
            toUserId: recipientId,
            content,
            imageUrl
          },
          include: {
            fromUser: {
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

        // リアルタイムでメッセージを送信
        io.to(matchId).emit('new_message', {
          id: message.id,
          matchId: message.matchId,
          fromUserId: message.fromUserId,
          toUserId: message.toUserId,
          content: message.content,
          imageUrl: message.imageUrl,
          isRead: message.isRead,
          createdAt: message.createdAt,
          fromUser: message.fromUser
        });

        console.log(`Message sent in match ${matchId}`);
      } catch (error) {
        console.error('メッセージ送信エラー:', error);
        socket.emit('error', { message: 'メッセージ送信に失敗しました' });
      }
    });

    // メッセージ既読
    socket.on('mark_as_read', async (data) => {
      try {
        const { matchId } = data;

        // メッセージを既読に更新
        await prisma.message.updateMany({
          where: {
            matchId,
            toUserId: userId,
            isRead: false
          },
          data: {
            isRead: true
          }
        });

        // 既読通知を送信
        io.to(matchId).emit('messages_read', {
          matchId,
          readByUserId: userId
        });

        console.log(`Messages marked as read in match ${matchId} by user ${userId}`);
      } catch (error) {
        console.error('既読更新エラー:', error);
      }
    });

    // タイピング開始
    socket.on('typing_start', (data) => {
      const { matchId } = data;
      socket.to(matchId).emit('typing_start', {
        matchId,
        userId
      });
    });

    // タイピング停止
    socket.on('typing_stop', (data) => {
      const { matchId } = data;
      socket.to(matchId).emit('typing_stop', {
        matchId,
        userId
      });
    });

    // オンライン状態確認
    socket.on('check_online_status', (data) => {
      const { userIds } = data;
      const onlineStatus = userIds.map((id: string) => ({
        userId: id,
        isOnline: onlineUsers.has(id)
      }));
      
      socket.emit('online_status', onlineStatus);
    });

    // 切断処理
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  // 定期的なハートビート（オンライン状態管理）
  setInterval(() => {
    io.emit('heartbeat');
  }, 30000); // 30秒ごと
};