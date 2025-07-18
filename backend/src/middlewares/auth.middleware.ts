import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebase';
import { JWTPayload } from '../types/auth.types';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // テスト用：userIdが提供されている場合は認証を迂回
    if (req.query.userId && !token) {
      req.user = { 
        userId: req.query.userId as string, 
        id: req.query.userId as string, 
        email: `${req.query.userId}@example.com` 
      };
      return next();
    }

    if (!token) {
      throw new Error();
    }

    let decoded: JWTPayload;

    try {
      // Try Firebase ID token first if Firebase Auth is available
      if (firebaseAuth) {
        const firebaseToken = await firebaseAuth.verifyIdToken(token);
        decoded = {
          userId: firebaseToken.uid,
          id: firebaseToken.uid,
          email: firebaseToken.email || '',
        };
      } else {
        throw new Error('Firebase not available');
      }
    } catch (firebaseError) {
      // Fallback to JWT verification
      try {
        decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as JWTPayload;
      } catch (jwtError) {
        throw new Error('Invalid token');
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const authMiddleware = authenticate;