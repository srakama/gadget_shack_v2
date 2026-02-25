const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const {
  authLimiter,
  passwordResetLimiter,
  validateInput,
  validationSets
} = require('../middleware/security');
const { body } = require('express-validator');
const emailService = require('../services/emailService');
const oauthService = require('../services/oauthService');

const router = express.Router();

// Register new user
router.post('/register', authLimiter, validateInput(validationSets.register), async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code
    } = req.body;

    if (!email || !password || !first_name || !phone) {
      return res.status(400).json({ error: 'Email, password, first name, and phone are required' });
    }

    // Check if user already exists
    const existingUsers = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with extended fields
    const sql = `
      INSERT INTO users (
        email, password, first_name, last_name, phone,
        address, city, province, postal_code, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'customer')
    `;
    const result = await database.run(sql, [
      email,
      hashedPassword,
      first_name,
      last_name,
      phone,
      address || null,
      city || null,
      province || null,
      postal_code || null
    ]);

    // Generate token
    const token = generateToken(result.id, email, 'customer');

    // Send welcome email (don't wait for it to complete)
    emailService.sendWelcomeEmail(email, first_name).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    res.status(201).json({
      message: 'Account created successfully! Welcome to GadgetShack!',
      user: {
        id: result.id,
        email,
        first_name,
        last_name,
        phone,
        address,
        city,
        province,
        postal_code,
        role: 'customer'
      },
      token
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user. Please try again.' });
  }
});

// Login user
router.post('/login', authLimiter, validateInput(validationSets.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const users = await database.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});


// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, req.user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password
    const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await database.run(sql, [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get current user info (lightweight)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await database.query(`
      SELECT id, email, first_name, last_name, role, profile_picture, oauth_provider
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await database.query(`
      SELECT id, email, first_name, last_name, phone, address,
             city, province, postal_code, role, created_at, updated_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: users[0]
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code
    } = req.body;

    const sql = `
      UPDATE users SET
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        province = COALESCE(?, province),
        postal_code = COALESCE(?, postal_code),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await database.run(sql, [
      first_name,
      last_name,
      phone,
      address,
      city,
      province,
      postal_code,
      req.user.id
    ]);

    // Get updated user data
    const users = await database.query(`
      SELECT id, email, first_name, last_name, phone, address,
             city, province, postal_code, role, created_at, updated_at
      FROM users WHERE id = ?
    `, [req.user.id]);

    res.json({
      message: 'Profile updated successfully',
      user: users[0]
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Request password reset
router.post('/forgot-password', passwordResetLimiter, validateInput([
  validationSets.register[0] // email validation
]), async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const users = await database.query('SELECT id FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

    if (users.length === 0) {
      return; // Don't reveal that email doesn't exist
    }

    // TODO: Generate reset token and send email
    // For now, just log it (in production, send actual email)
    console.log(`Password reset requested for: ${email}`);

  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Change password (authenticated users)
router.post('/change-password', authenticateToken, validateInput([
  validationSets.register[1], // password validation
  body('currentPassword').notEmpty().withMessage('Current password is required')
]), async (req, res) => {
  try {
    const { currentPassword, password } = req.body;
    const userId = req.user.id;

    // Get current user
    const users = await database.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password
    await database.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// OAuth Google login
router.post('/oauth/google', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    const result = await oauthService.processOAuthLogin('google', token);

    if (result.success) {
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// OAuth Facebook login
router.post('/oauth/facebook', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Facebook token is required' });
    }

    const result = await oauthService.processOAuthLogin('facebook', token);

    if (result.success) {
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Update profile picture
router.put('/profile/picture', authenticateToken, async (req, res) => {
  try {
    const { picture_url } = req.body;

    if (!picture_url) {
      return res.status(400).json({ error: 'Picture URL is required' });
    }

    await oauthService.updateProfilePicture(req.user.id, picture_url);

    res.json({ message: 'Profile picture updated successfully' });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ error: 'Failed to update profile picture' });
  }
});

// Unlink OAuth account
router.delete('/oauth/unlink', authenticateToken, async (req, res) => {
  try {
    await oauthService.unlinkOAuth(req.user.id);
    res.json({ message: 'OAuth account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking OAuth:', error);
    res.status(500).json({ error: 'Failed to unlink OAuth account' });
  }
});

module.exports = router;
