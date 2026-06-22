import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, config.jwt.accessTokenSecret, {
      expiresIn: config.jwt.accessTokenExpiry as any,
      algorithm: 'HS256',
    });
  } catch (error) {
    logger.error('Error generating access token', error);
    throw error;
  }
};

export const generateRefreshToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry as any,
      algorithm: 'HS256',
    });
  } catch (error) {
    logger.error('Error generating refresh token', error);
    throw error;
  }
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying access token', error);
    throw error;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshTokenSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying refresh token', error);
    throw error;
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload | null;
  } catch (error) {
    return null;
  }
};
