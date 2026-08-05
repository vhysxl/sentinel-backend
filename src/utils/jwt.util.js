import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Claims carried by both token types. No `role` field exists in this system —
 * `isAdmin` is the only privilege bit.
 */
export const buildTokenPayload = (user) => ({
  sub: user.id,
  email: user.email,
  name: user.fullname,
  isAdmin: user.isAdmin
});
