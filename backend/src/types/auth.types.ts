export interface JWTPayload {
  id: string;
  userId: string;
  email: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
  };
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}