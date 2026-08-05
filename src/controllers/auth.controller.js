import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/client.js';
import { users } from '../db/schema/users.js';
import { config } from '../config/env.config.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required')
});

export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: parseResult.error.errors
      });
    }

    const { identifier, password } = parseResult.data;

    // Find user by username using the identifier
    const [user] = await db.select().from(users).where(eq(users.username, identifier)).limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        department: user.department
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        mustChangePassword: false,
        tokens: {
          accessToken: token,
          refreshToken: token // fallback for now
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const { eq } = await import('drizzle-orm');
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
