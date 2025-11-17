import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { generateToken, generateRefreshToken, verifyToken, authenticate } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../utils/validation.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to calculate token expiry
function getTokenExpiry(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// Helper to get client info
function getClientInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'Unknown'
  };
}

// Register new user
router.post('/register', registerValidation, validate, async (req, res) => {
  try {
    const { role, name, email, address, password } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email_role: { email, role } }
    });

    if (existing) {
      return res.status(409).json({
        message: 'An account with this email and role already exists'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        role,
        name,
        email,
        address,
        passwordHash,
        isActive: true,
        lastLogin: new Date()
      }
    });

    // Generate tokens
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const clientInfo = getClientInfo(req);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: getTokenExpiry(7),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      }
    });

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Account created successfully',
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate user error
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'An account with this email and role already exists'
      });
    }
    
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { role, email, password } = req.body;

    // Find user by email + role first
    let user = await prisma.user.findUnique({
      where: { email_role: { email, role } }
    });

    // If not found for this role, fall back to any account with this email
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email }
      });
    }

    // If still not found, automatically create an account using provided credentials
    if (!user) {
      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          role,
          name: email.split('@')[0],
          email,
          address: '',
          passwordHash,
          isActive: true,
          lastLogin: new Date()
        }
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const clientInfo = getClientInfo(req);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: getTokenExpiry(7),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      }
    });

    // Return user data (without password hash)
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/clerk-sync', async (req, res) => {
  try {
    const body = req.body || {};
    const email = body.email;
    const name = body.name;
    const role = body.role;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const userRole = role === 'participant' ? 'participant' : 'user';

    let user = await prisma.user.findUnique({
      where: { email_role: { email, role: userRole } }
    });

    if (!user) {
      const rawPassword = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const passwordHash = await bcrypt.hash(rawPassword, 12);
      user = await prisma.user.create({
        data: {
          role: userRole,
          name: name || email.split('@')[0],
          email,
          address: '',
          passwordHash,
          isActive: true,
          lastLogin: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          lastLogin: new Date()
        }
      });
    }

    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const clientInfo = getClientInfo(req);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: getTokenExpiry(7),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      }
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Clerk user synced',
      user: userWithoutPassword,
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Clerk sync error:', error);
    res.status(500).json({ message: 'Server error during Clerk sync' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      // Delete session
      await prisma.session.deleteMany({
        where: { token }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Find session
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({ message: 'Session not found' });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ message: 'Session expired' });
    }

    // Generate new tokens
    const newToken = generateToken(session.user.id, session.user.email, session.user.role);
    const newRefreshToken = generateRefreshToken(session.user.id);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: getTokenExpiry(7)
      }
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', authenticate, async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (typeof body.name === 'string') {
      const name = body.name.toString().trim();
      if (!name) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      updates.name = name;
    }

    if (typeof body.address === 'string') {
      updates.address = body.address.toString().trim();
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No profile fields to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// Get user's active sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId: req.user.id,
        expiresAt: { gt: new Date() }
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke a specific session
router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke all sessions except current
router.post('/sessions/revoke-all', authenticate, async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.substring(7);

    await prisma.session.deleteMany({
      where: {
        userId: req.user.id,
        token: { not: currentToken }
      }
    });

    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
