// OAuth Service for Google and Facebook authentication
const jwt = require('jsonwebtoken');
const database = require('../config/database');

class OAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // Verify Google OAuth token
  async verifyGoogleToken(token) {
    try {
      let userInfo;

      // Check if token is a JWT (Google ID token) or access token
      if (token.includes('.')) {
        // JWT token - verify with Google's tokeninfo endpoint
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

        if (!response.ok) {
          throw new Error('Invalid Google ID token');
        }

        userInfo = await response.json();

        return {
          id: userInfo.sub,
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
          profile_picture: userInfo.picture,
          provider: 'google'
        };
      } else {
        // Access token - use userinfo endpoint
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);

        if (!response.ok) {
          throw new Error('Invalid Google access token');
        }

        userInfo = await response.json();

        return {
          id: userInfo.id,
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
          profile_picture: userInfo.picture,
          provider: 'google'
        };
      }
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Verify Facebook OAuth token
  async verifyFacebookToken(token) {
    try {
      // Verify token with Facebook
      const response = await fetch(`https://graph.facebook.com/me?access_token=${token}&fields=id,email,first_name,last_name,picture`);
      
      if (!response.ok) {
        throw new Error('Invalid Facebook token');
      }
      
      const userInfo = await response.json();
      
      return {
        id: userInfo.id,
        email: userInfo.email,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        profile_picture: userInfo.picture?.data?.url,
        provider: 'facebook'
      };
    } catch (error) {
      console.error('Facebook token verification failed:', error);
      throw new Error('Invalid Facebook token');
    }
  }

  // Find or create user from OAuth data
  async findOrCreateOAuthUser(oauthData) {
    try {
      // First, try to find user by OAuth provider and ID
      let users = await database.query(
        'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
        [oauthData.provider, oauthData.id]
      );

      if (users.length > 0) {
        // Update profile picture if it has changed
        if (users[0].profile_picture !== oauthData.profile_picture) {
          await database.run(
            'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [oauthData.profile_picture, users[0].id]
          );
          users[0].profile_picture = oauthData.profile_picture;
        }
        return users[0];
      }

      // If not found by OAuth, try to find by email
      users = await database.query('SELECT * FROM users WHERE email = ?', [oauthData.email]);

      if (users.length > 0) {
        // Link existing account with OAuth
        await database.run(
          `UPDATE users SET 
           oauth_provider = ?, 
           oauth_id = ?, 
           profile_picture = ?,
           first_name = COALESCE(first_name, ?),
           last_name = COALESCE(last_name, ?),
           updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [
            oauthData.provider,
            oauthData.id,
            oauthData.profile_picture,
            oauthData.first_name,
            oauthData.last_name,
            users[0].id
          ]
        );

        // Return updated user
        const updatedUsers = await database.query('SELECT * FROM users WHERE id = ?', [users[0].id]);
        return updatedUsers[0];
      }

      // Create new user
      const result = await database.run(
        `INSERT INTO users (
          email, first_name, last_name, profile_picture, 
          oauth_provider, oauth_id, role, phone
        ) VALUES (?, ?, ?, ?, ?, ?, 'customer', '')`,
        [
          oauthData.email,
          oauthData.first_name,
          oauthData.last_name,
          oauthData.profile_picture,
          oauthData.provider,
          oauthData.id
        ]
      );

      // Return the new user
      const newUsers = await database.query('SELECT * FROM users WHERE id = ?', [result.lastID]);
      return newUsers[0];

    } catch (error) {
      console.error('Error finding/creating OAuth user:', error);
      throw error;
    }
  }

  // Generate JWT token for user
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  // Process OAuth login
  async processOAuthLogin(provider, token) {
    try {
      let oauthData;

      switch (provider) {
        case 'google':
          oauthData = await this.verifyGoogleToken(token);
          break;
        case 'facebook':
          oauthData = await this.verifyFacebookToken(token);
          break;
        default:
          throw new Error('Unsupported OAuth provider');
      }

      // Find or create user
      const user = await this.findOrCreateOAuthUser(oauthData);

      // Generate JWT token
      const jwtToken = this.generateToken(user);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture: user.profile_picture,
          role: user.role
        },
        token: jwtToken
      };

    } catch (error) {
      console.error('OAuth login failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user profile with picture
  async getUserProfile(userId) {
    try {
      const users = await database.query(
        `SELECT id, email, first_name, last_name, phone, address, 
         city, province, postal_code, role, profile_picture, 
         oauth_provider, created_at, updated_at 
         FROM users WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      return users[0];
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile picture
  async updateProfilePicture(userId, pictureUrl) {
    try {
      await database.run(
        'UPDATE users SET profile_picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [pictureUrl, userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  // Remove OAuth linking (for account unlinking)
  async unlinkOAuth(userId) {
    try {
      await database.run(
        `UPDATE users SET 
         oauth_provider = NULL, 
         oauth_id = NULL, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [userId]
      );

      return { success: true };
    } catch (error) {
      console.error('Error unlinking OAuth:', error);
      throw error;
    }
  }
}

module.exports = new OAuthService();
