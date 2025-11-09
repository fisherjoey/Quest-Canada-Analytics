/**
 * Quest Canada - Superset Guest Token Endpoint
 * Node.js + Express implementation
 *
 * This file provides example code for generating Superset guest tokens
 * from a Node.js backend with Row-Level Security (RLS) support.
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Configuration (use environment variables in production)
const SUPERSET_URL = process.env.SUPERSET_URL || 'http://localhost:8088';
const SUPERSET_USERNAME = process.env.SUPERSET_USERNAME || 'admin';
const SUPERSET_PASSWORD = process.env.SUPERSET_PASSWORD || 'admin';

/**
 * Authenticate with Superset and get access token
 * @returns {Promise<string>} Access token
 */
async function getSupersetAccessToken() {
  try {
    const response = await axios.post(
      `${SUPERSET_URL}/api/v1/security/login`,
      {
        username: SUPERSET_USERNAME,
        password: SUPERSET_PASSWORD,
        provider: 'db',
        refresh: true
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Superset authentication failed:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Superset');
  }
}

/**
 * Generate RLS rules based on user context
 * @param {Object} user - Authenticated user object
 * @returns {Array} RLS rules for Superset
 */
function generateRLSRules(user) {
  // Admin users see all data
  if (user.role === 'admin' || user.is_admin) {
    return [];
  }

  // Regular users see only their community's data
  if (user.community) {
    // Escape single quotes to prevent SQL injection
    const escapedCommunity = user.community.replace(/'/g, "''");

    return [
      {
        // Filter communities table
        clause: `communities.name = '${escapedCommunity}'`
      }
    ];
  }

  // Default: no data access
  return [
    { clause: '1 = 0' }  // Returns no rows
  ];
}

/**
 * POST /api/superset/guest-token
 * Generate guest token for authenticated user
 *
 * Request body:
 * {
 *   "dashboard_id": "abc123-uuid-from-superset"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
 *   "expires_in": 300
 * }
 */
router.post('/guest-token', async (req, res) => {
  try {
    // Extract authenticated user (assumes auth middleware sets req.user)
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Validate request body
    const { dashboard_id } = req.body;

    if (!dashboard_id) {
      return res.status(400).json({
        success: false,
        error: 'dashboard_id is required'
      });
    }

    // 1. Authenticate with Superset
    const accessToken = await getSupersetAccessToken();

    // 2. Prepare guest token payload
    const guestTokenPayload = {
      user: {
        username: user.email || user.username || 'guest',
        first_name: user.firstName || user.first_name || 'User',
        last_name: user.lastName || user.last_name || ''
      },
      resources: [
        {
          type: 'dashboard',
          id: dashboard_id
        }
      ],
      rls: generateRLSRules(user)
    };

    // 3. Request guest token from Superset
    const response = await axios.post(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      guestTokenPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    // 4. Return guest token to client
    res.json({
      success: true,
      token: response.data.token,
      expires_in: 300  // 5 minutes
    });

  } catch (error) {
    console.error('Guest token generation error:', error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to generate guest token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/superset/dashboards
 * Get list of available Superset dashboards
 *
 * Response:
 * {
 *   "success": true,
 *   "dashboards": [
 *     {
 *       "id": 1,
 *       "uuid": "abc123-uuid",
 *       "title": "Dashboard Name",
 *       "url": "/superset/dashboard/1/"
 *     }
 *   ]
 * }
 */
router.get('/dashboards', async (req, res) => {
  try {
    // Authenticate with Superset
    const accessToken = await getSupersetAccessToken();

    // Fetch dashboards
    const response = await axios.get(
      `${SUPERSET_URL}/api/v1/dashboard/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          q: JSON.stringify({
            page: 0,
            page_size: 100,
            order_column: 'changed_on_delta_humanized',
            order_direction: 'desc'
          })
        }
      }
    );

    // Format response
    const dashboards = response.data.result.map(dashboard => ({
      id: dashboard.id,
      uuid: dashboard.dashboard_uuid,
      title: dashboard.dashboard_title,
      url: dashboard.url,
      status: dashboard.status,
      changed_on: dashboard.changed_on_delta_humanized
    }));

    res.json({
      success: true,
      dashboards
    });

  } catch (error) {
    console.error('Failed to fetch dashboards:', error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboards'
    });
  }
});

/**
 * Example auth middleware (customize for your app)
 */
function authMiddleware(req, res, next) {
  // Example: Extract JWT from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'No authorization header'
    });
  }

  try {
    // Your JWT verification logic here
    // const token = authHeader.replace('Bearer ', '');
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Mock user for example
    req.user = {
      id: 1,
      email: 'john.doe@calgary.ca',
      firstName: 'John',
      lastName: 'Doe',
      community: 'Calgary',
      role: 'user'
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
}

// Export router
module.exports = router;

// Usage in your Express app:
// const supersetRoutes = require('./examples/node-backend-endpoint');
// app.use('/api/superset', authMiddleware, supersetRoutes);
