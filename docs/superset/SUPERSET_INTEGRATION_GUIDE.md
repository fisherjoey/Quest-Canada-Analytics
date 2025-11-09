# Apache Superset Integration Guide
## Embedding Dashboards in React with Custom Authentication

**Last Updated**: January 2025
**Agent**: Agent 3 - Apache Superset Integration Specialist
**Target**: Quest Canada Gap Analysis System

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Superset Docker Setup](#superset-docker-setup)
5. [Configuration](#configuration)
6. [Guest Token Authentication](#guest-token-authentication)
7. [Row-Level Security (RLS)](#row-level-security-rls)
8. [Backend Implementation](#backend-implementation)
9. [React Frontend Implementation](#react-frontend-implementation)
10. [Security Considerations](#security-considerations)
11. [Troubleshooting](#troubleshooting)
12. [Production Deployment](#production-deployment)

---

## Overview

This guide provides a complete implementation roadmap for embedding Apache Superset dashboards into the Quest Canada React application using the `@superset-ui/embedded-sdk` with guest token authentication.

### Why Superset?

- **Open Source**: Free, enterprise-grade analytics platform
- **PostgreSQL Native**: Direct connection to our existing database
- **Rich Visualizations**: 40+ chart types out of the box
- **Embedding SDK**: First-class support for React applications
- **Row-Level Security**: Multi-tenancy support for community-specific data
- **SQL Lab**: Ad-hoc query interface for power users

### Embedding Methods Comparison

| Method | Pros | Cons | Recommended |
|--------|------|------|-------------|
| **@superset-ui/embedded-sdk** | Native React support, guest tokens, RLS, seamless auth | Requires backend token generation | ✅ **Yes** |
| **iframe Embedding** | Simple implementation | No RLS, auth issues, limited customization | ❌ No |
| **API-based Access** | Full control | Complex, requires reimplementing UI | ❌ No |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Browser                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React Application (Port 3001)              │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  @superset-ui/embedded-sdk                  │  │  │
│  │  │  - embedDashboard()                         │  │  │
│  │  │  - Renders iframe with guest token          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         │ 1. Request dashboard
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Node.js Backend (Port 5000)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  POST /api/superset/guest-token                 │   │
│  │  - Authenticate user (existing auth)            │   │
│  │  - Determine user's community                   │   │
│  │  - Generate RLS rules                           │   │
│  │  - Call Superset API                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ 2. Request guest token
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Apache Superset (Port 8088)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  POST /api/v1/security/guest_token              │   │
│  │  - Validate request (JWT auth)                  │   │
│  │  - Apply RLS rules                              │   │
│  │  - Generate guest token                         │   │
│  │  - Return token (5-min expiry)                  │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Dashboard Rendering                            │   │
│  │  - Embed in iframe                              │   │
│  │  - Apply RLS filters                            │   │
│  │  - Query PostgreSQL                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         │
                         │ 3. Query data
                         ▼
┌─────────────────────────────────────────────────────────┐
│            PostgreSQL + TimescaleDB                     │
│               quest_canada Database                     │
│  - communities                                          │
│  - community_projects                                   │
│  - benchmark_assessments                                │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Software Requirements

- **Docker** and **Docker Compose**: For running Superset
- **Node.js 18+**: For backend API
- **React 18+**: For frontend
- **PostgreSQL 14+**: Existing Quest Canada database

### Existing Infrastructure

This guide assumes you have:
- PostgreSQL database at `localhost:5432` with `quest_canada` database
- Node.js API running on port 5000
- React frontend development environment

---

## Superset Docker Setup

### Option 1: Production-Ready Docker Compose

Create `superset/docker-compose.superset.yml`:

```yaml
version: '3.8'

services:
  # Redis for caching
  superset-redis:
    image: redis:7.2-alpine
    container_name: quest_superset_redis
    restart: unless-stopped
    volumes:
      - superset_redis:/data
    networks:
      - quest_network

  # Superset metadata database
  superset-db:
    image: postgres:14-alpine
    container_name: quest_superset_db
    restart: unless-stopped
    environment:
      POSTGRES_DB: superset
      POSTGRES_USER: superset
      POSTGRES_PASSWORD: superset_secure_password_change_me
    volumes:
      - superset_db:/var/lib/postgresql/data
    networks:
      - quest_network

  # Apache Superset
  superset:
    image: apache/superset:latest
    container_name: quest_superset
    restart: unless-stopped
    depends_on:
      - superset-db
      - superset-redis
    environment:
      # Database connection
      DATABASE_DB: superset
      DATABASE_HOST: superset-db
      DATABASE_PASSWORD: superset_secure_password_change_me
      DATABASE_USER: superset
      DATABASE_PORT: 5432
      DATABASE_DIALECT: postgresql

      # Redis
      REDIS_HOST: superset-redis
      REDIS_PORT: 6379

      # Security
      SUPERSET_SECRET_KEY: 'YOUR_SECRET_KEY_CHANGE_THIS_TO_LONG_RANDOM_STRING'

      # Load examples (set to false in production)
      SUPERSET_LOAD_EXAMPLES: 'false'

      # SCARF analytics
      SCARF_ANALYTICS: 'false'
    ports:
      - "8088:8088"
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py
      - superset_home:/app/superset_home
    networks:
      - quest_network
    command: >
      bash -c "
        superset db upgrade &&
        superset fab create-admin
          --username admin
          --firstname Admin
          --lastname User
          --email admin@quest.ca
          --password admin &&
        superset init &&
        /usr/bin/run-server.sh
      "

volumes:
  superset_redis:
  superset_db:
  superset_home:

networks:
  quest_network:
    driver: bridge
```

### Option 2: Lightweight Development Setup

For rapid development, use the official Superset repository:

```bash
# Clone Superset repository
git clone --depth=1 https://github.com/apache/superset.git
cd superset

# Start with docker-compose
docker compose up -d
```

**Default Access**:
- URL: `http://localhost:8088`
- Username: `admin`
- Password: `admin`

### Starting Superset

```bash
# Production setup
cd superset
docker-compose -f docker-compose.superset.yml up -d

# Check status
docker-compose -f docker-compose.superset.yml ps

# View logs
docker-compose -f docker-compose.superset.yml logs -f superset

# Stop services
docker-compose -f docker-compose.superset.yml down
```

---

## Configuration

### 1. Superset Configuration File

Create `superset/superset_config.py`:

```python
"""
Quest Canada - Apache Superset Configuration
Enables embedding, guest tokens, CORS, and RLS
"""

import os
from typing import Optional

# -------------------------------------------------------------------
# Flask App Builder Configuration
# -------------------------------------------------------------------
# Your App secret key - CHANGE THIS IN PRODUCTION
SECRET_KEY = os.getenv('SUPERSET_SECRET_KEY', 'CHANGE_THIS_TO_A_LONG_RANDOM_STRING')

# The SQLAlchemy connection string to your Superset metadata database
SQLALCHEMY_DATABASE_URI = os.getenv(
    'DATABASE_URL',
    'postgresql+psycopg2://superset:superset_secure_password_change_me@superset-db:5432/superset'
)

# -------------------------------------------------------------------
# Feature Flags
# -------------------------------------------------------------------
FEATURE_FLAGS = {
    # Enable dashboard embedding
    "EMBEDDED_SUPERSET": True,

    # Enable SQL Lab
    "ENABLE_TEMPLATE_PROCESSING": True,

    # Alert features
    "ALERT_REPORTS": False,
}

# -------------------------------------------------------------------
# Guest Token Configuration (Critical for Embedding)
# -------------------------------------------------------------------
# JWT secret for signing guest tokens - MUST be strong in production
GUEST_TOKEN_JWT_SECRET = os.getenv(
    'GUEST_TOKEN_JWT_SECRET',
    'CHANGE_THIS_GUEST_TOKEN_SECRET_TO_RANDOM_STRING'
)

# JWT algorithm
GUEST_TOKEN_JWT_ALGO = 'HS256'

# JWT audience (must match backend implementation)
GUEST_TOKEN_JWT_AUDIENCE = 'superset'

# Guest token expiration (5 minutes = 300 seconds)
GUEST_TOKEN_JWT_EXP_SECONDS = 300

# Guest token header name
GUEST_TOKEN_HEADER_NAME = 'X-GuestToken'

# Default role for guest users
GUEST_ROLE_NAME = 'Public'

# -------------------------------------------------------------------
# CORS Configuration (Required for React Embedding)
# -------------------------------------------------------------------
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': [
        'X-CSRFToken',
        'Content-Type',
        'Origin',
        'X-Requested-With',
        'Accept',
        'Authorization',
        'X-GuestToken',
    ],
    'resources': [
        '/api/v1/security/guest_token/',
        '/api/v1/chart/*',
        '/api/v1/dashboard/*',
        '/superset/explore_json/*',
        '/api/v1/query/',
        '/api/v1/formData/*',
    ],
    'origins': [
        'http://localhost:3000',  # React dev server
        'http://localhost:3001',  # Alternative port
        'https://cpsc405.joeyfishertech.com',  # Production
    ]
}

# -------------------------------------------------------------------
# Security - Talisman Configuration
# -------------------------------------------------------------------
# Configure Content Security Policy for embedding
TALISMAN_ENABLED = True
TALISMAN_CONFIG = {
    "content_security_policy": {
        "default-src": ["'self'"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-ancestors": [
            "'self'",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://cpsc405.joeyfishertech.com",
        ],
    },
    "force_https": False,  # Set to True in production with SSL
}

# -------------------------------------------------------------------
# Row Level Security
# -------------------------------------------------------------------
# Enable RLS (applied via guest tokens)
ROW_LEVEL_SECURITY_ENABLED = True

# -------------------------------------------------------------------
# Cache Configuration
# -------------------------------------------------------------------
# Redis cache
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': os.getenv('REDIS_HOST', 'superset-redis'),
    'CACHE_REDIS_PORT': int(os.getenv('REDIS_PORT', 6379)),
    'CACHE_REDIS_DB': 1,
}

DATA_CACHE_CONFIG = CACHE_CONFIG

# -------------------------------------------------------------------
# Web Server Configuration
# -------------------------------------------------------------------
# Increase timeout for large queries
SUPERSET_WEBSERVER_TIMEOUT = 300

# Allow bigger file uploads
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB

# -------------------------------------------------------------------
# Database Connections
# -------------------------------------------------------------------
# Allow connections to local PostgreSQL
PREVENT_UNSAFE_DB_CONNECTIONS = False

# SQL Lab query limits
QUERY_RESULT_LIMIT = 10000
SQL_MAX_ROW = 100000

# -------------------------------------------------------------------
# Email Configuration (Optional - for alerts)
# -------------------------------------------------------------------
SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_MAIL_FROM = os.getenv('SMTP_MAIL_FROM', 'superset@quest.ca')

# -------------------------------------------------------------------
# Custom Branding (Optional)
# -------------------------------------------------------------------
APP_NAME = "Quest Canada Analytics"
APP_ICON = "/static/assets/images/superset-logo-horiz.png"
APP_ICON_WIDTH = 126

# -------------------------------------------------------------------
# Authentication
# -------------------------------------------------------------------
# Allow user self-registration
AUTH_USER_REGISTRATION = False

# Default role for new users
AUTH_ROLE_PUBLIC = 'Public'

# Authentication type (database, LDAP, OAuth, etc.)
AUTH_TYPE = 1  # AUTH_DB

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
ENABLE_TIME_ROTATE = True
TIME_ROTATE_LOG_LEVEL = "INFO"
FILENAME = os.path.join(os.path.expanduser("~"), "superset.log")

# -------------------------------------------------------------------
# Jinja Template Context
# -------------------------------------------------------------------
# Make user attributes available in SQL queries
JINJA_CONTEXT_ADDONS = {
    'current_user': lambda: g.user,
}
```

### 2. Environment Variables

Create `superset/.env`:

```bash
# Superset Secrets
SUPERSET_SECRET_KEY=your-super-secret-key-change-in-production-min-42-chars
GUEST_TOKEN_JWT_SECRET=your-guest-token-secret-change-in-production-min-42-chars

# Database
DATABASE_URL=postgresql+psycopg2://superset:superset_secure_password_change_me@superset-db:5432/superset

# Redis
REDIS_HOST=superset-redis
REDIS_PORT=6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_MAIL_FROM=superset@quest.ca
```

### 3. Generate Strong Secrets

```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(42))"

# Generate GUEST_TOKEN_JWT_SECRET
python3 -c "import secrets; print(secrets.token_urlsafe(42))"
```

Update these values in `.env` file.

---

## Guest Token Authentication

### How Guest Tokens Work

1. **User accesses React app** → Authenticates with your existing auth system
2. **React requests dashboard** → Calls your Node.js backend `/api/superset/guest-token`
3. **Backend generates token** → Calls Superset API with user context + RLS rules
4. **Superset returns guest token** → Short-lived JWT (5 minutes)
5. **React embeds dashboard** → Uses token to load dashboard in iframe
6. **Dashboard queries data** → RLS rules filter data automatically

### Guest Token Flow Diagram

```
User → React App → Node.js API → Superset API
                       ↓              ↓
                  Auth Check    Generate JWT
                       ↓              ↓
                  User Info     Apply RLS Rules
                       ↓              ↓
                  Community     Return Guest Token
                       ↓              ↓
                    ←──────────────────
                       ↓
                 Embed Dashboard
```

### Guest Token Payload Structure

```json
{
  "user": {
    "username": "john.doe@calgary.ca",
    "first_name": "John",
    "last_name": "Doe"
  },
  "resources": [
    {
      "type": "dashboard",
      "id": "abc123-dashboard-uuid"
    }
  ],
  "rls": [
    {
      "clause": "community_name = 'Calgary'"
    }
  ],
  "iat": 1730883214,
  "exp": 1730883514,
  "aud": "superset",
  "type": "guest"
}
```

### Token Expiration and Refresh

Guest tokens expire after 5 minutes. Implement auto-refresh:

```javascript
// React component
useEffect(() => {
  let refreshInterval;

  const refreshToken = async () => {
    const newToken = await fetchGuestToken();
    // Token is automatically used by the SDK
  };

  // Refresh every 4 minutes (before 5-min expiry)
  refreshInterval = setInterval(refreshToken, 4 * 60 * 1000);

  return () => clearInterval(refreshInterval);
}, []);
```

---

## Row-Level Security (RLS)

### What is RLS?

Row-Level Security allows filtering data based on user identity. For Quest Canada:

- **Calgary users** → See only Calgary projects and assessments
- **Edmonton users** → See only Edmonton data
- **Admin users** → See all data

### RLS Implementation Methods

#### Method 1: Dynamic RLS via Guest Tokens (Recommended)

RLS rules are injected when generating guest tokens:

```javascript
// Node.js backend
const guestTokenPayload = {
  resources: [{ type: "dashboard", id: dashboardId }],
  rls: [
    { clause: `community_name = '${user.community}'` }
  ],
  user: {
    username: user.email,
    first_name: user.firstName,
    last_name: user.lastName
  }
};
```

**Advantages**:
- Dynamic per-user filtering
- No manual configuration in Superset UI
- Scales to thousands of communities
- Centralized auth logic in your backend

#### Method 2: Static RLS Rules in Superset UI

Configure RLS rules manually in Superset:

1. Navigate to **Security** → **Row Level Security**
2. Click **+ Row Level Security**
3. Configure:
   - **Table**: `communities.community_projects`
   - **Clause**: `city = '{{ current_user().username }}'`
   - **Roles**: Gamma, Public
4. Save

**Disadvantages**:
- Manual setup for each table
- Less flexible
- Requires Superset admin access

### Multi-Table RLS Strategy

For Quest Canada, apply RLS to all relevant tables:

```javascript
// Complex RLS example
const generateRLS = (user) => {
  if (user.role === 'admin') {
    return [];  // No restrictions for admins
  }

  return [
    // Filter communities
    { clause: `communities.name = '${user.community}'` },

    // Filter projects (via join)
    { clause: `community_projects.community_id IN (
        SELECT id FROM communities WHERE name = '${user.community}'
      )`
    },

    // Filter assessments
    { clause: `benchmark_assessments.community_id IN (
        SELECT id FROM communities WHERE name = '${user.community}'
      )`
    }
  ];
};
```

### Testing RLS

```sql
-- Test query to verify RLS is working
SELECT
  p.project_code,
  p.project_name,
  c.name as community_name
FROM community_projects p
JOIN communities c ON p.community_id = c.id
WHERE c.name = 'Calgary';  -- This should match RLS clause
```

---

## Backend Implementation

### Node.js + Express Implementation

#### Install Dependencies

```bash
cd server/api
npm install axios jsonwebtoken
```

#### Create Superset Service (`server/api/superset_service.js`)

```javascript
/**
 * Quest Canada - Superset Integration Service
 * Handles guest token generation and dashboard embedding
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const SUPERSET_URL = process.env.SUPERSET_URL || 'http://localhost:8088';
const SUPERSET_USERNAME = process.env.SUPERSET_USERNAME || 'admin';
const SUPERSET_PASSWORD = process.env.SUPERSET_PASSWORD || 'admin';
const GUEST_TOKEN_JWT_SECRET = process.env.GUEST_TOKEN_JWT_SECRET || 'your-guest-token-secret';

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
    console.error('Failed to authenticate with Superset:', error.response?.data || error.message);
    throw new Error('Superset authentication failed');
  }
}

/**
 * Generate RLS rules based on user context
 * @param {Object} user - User object from your auth system
 * @returns {Array} RLS rules
 */
function generateRLSRules(user) {
  // Admin users see all data
  if (user.role === 'admin' || user.is_admin) {
    return [];
  }

  // Regular users see only their community
  if (user.community) {
    return [
      {
        clause: `communities.name = '${user.community.replace(/'/g, "''")}'`  // SQL injection protection
      }
    ];
  }

  // Default: no data access
  return [
    { clause: '1 = 0' }  // Returns no rows
  ];
}

/**
 * Generate guest token for dashboard embedding
 * @param {Object} user - Authenticated user
 * @param {string} dashboardId - Dashboard UUID from Superset
 * @returns {Promise<string>} Guest token
 */
async function generateGuestToken(user, dashboardId) {
  try {
    // 1. Authenticate with Superset
    const accessToken = await getSupersetAccessToken();

    // 2. Prepare guest token payload
    const payload = {
      user: {
        username: user.email || user.username,
        first_name: user.firstName || user.first_name || 'User',
        last_name: user.lastName || user.last_name || ''
      },
      resources: [
        {
          type: 'dashboard',
          id: dashboardId
        }
      ],
      rls: generateRLSRules(user)
    };

    // 3. Request guest token from Superset
    const response = await axios.post(
      `${SUPERSET_URL}/api/v1/security/guest_token/`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.token;
  } catch (error) {
    console.error('Failed to generate guest token:', error.response?.data || error.message);
    throw new Error('Guest token generation failed');
  }
}

/**
 * Get list of available dashboards
 * @returns {Promise<Array>} List of dashboards
 */
async function getDashboards() {
  try {
    const accessToken = await getSupersetAccessToken();

    const response = await axios.get(
      `${SUPERSET_URL}/api/v1/dashboard/`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.result.map(dashboard => ({
      id: dashboard.id,
      uuid: dashboard.dashboard_uuid,
      title: dashboard.dashboard_title,
      url: dashboard.url
    }));
  } catch (error) {
    console.error('Failed to fetch dashboards:', error.response?.data || error.message);
    throw new Error('Failed to fetch dashboards');
  }
}

module.exports = {
  generateGuestToken,
  getDashboards,
  generateRLSRules
};
```

#### Add API Endpoint (`server/api/forms_api.py` or new Express route)

**Option A: Add to existing Flask API**

```python
# Add to server/api/forms_api.py

import requests
import os
from datetime import datetime, timedelta

SUPERSET_URL = os.getenv('SUPERSET_URL', 'http://localhost:8088')
SUPERSET_USERNAME = os.getenv('SUPERSET_USERNAME', 'admin')
SUPERSET_PASSWORD = os.getenv('SUPERSET_PASSWORD', 'admin')

@app.route('/api/superset/guest-token', methods=['POST'])
def get_superset_guest_token():
    """Generate Superset guest token for authenticated user"""
    try:
        # Get user context from request
        # In production, extract from JWT or session
        data = request.json
        dashboard_id = data.get('dashboard_id')
        user_email = data.get('user_email', 'guest@quest.ca')
        community = data.get('community', 'Calgary')

        # 1. Authenticate with Superset
        login_response = requests.post(
            f'{SUPERSET_URL}/api/v1/security/login',
            json={
                'username': SUPERSET_USERNAME,
                'password': SUPERSET_PASSWORD,
                'provider': 'db',
                'refresh': True
            }
        )

        if login_response.status_code != 200:
            return jsonify({'success': False, 'error': 'Superset authentication failed'}), 401

        access_token = login_response.json()['access_token']

        # 2. Generate guest token with RLS
        guest_token_payload = {
            'user': {
                'username': user_email,
                'first_name': user_email.split('@')[0],
                'last_name': ''
            },
            'resources': [
                {
                    'type': 'dashboard',
                    'id': dashboard_id
                }
            ],
            'rls': [
                {
                    'clause': f"communities.name = '{community}'"
                }
            ]
        }

        guest_token_response = requests.post(
            f'{SUPERSET_URL}/api/v1/security/guest_token/',
            json=guest_token_payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {access_token}'
            }
        )

        if guest_token_response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Guest token generation failed'
            }), 500

        guest_token = guest_token_response.json()['token']

        return jsonify({
            'success': True,
            'token': guest_token,
            'expires_in': 300  # 5 minutes
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/superset/dashboards', methods=['GET'])
def get_superset_dashboards():
    """Get list of available Superset dashboards"""
    try:
        # Authenticate
        login_response = requests.post(
            f'{SUPERSET_URL}/api/v1/security/login',
            json={
                'username': SUPERSET_USERNAME,
                'password': SUPERSET_PASSWORD,
                'provider': 'db',
                'refresh': True
            }
        )

        access_token = login_response.json()['access_token']

        # Fetch dashboards
        dashboards_response = requests.get(
            f'{SUPERSET_URL}/api/v1/dashboard/',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        dashboards = dashboards_response.json()['result']

        return jsonify({
            'success': True,
            'dashboards': [
                {
                    'id': d['id'],
                    'uuid': d['dashboard_uuid'],
                    'title': d['dashboard_title'],
                    'url': d['url']
                }
                for d in dashboards
            ]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

**Option B: Create Express.js Endpoint**

```javascript
// server/api/routes/superset.js

const express = require('express');
const router = express.Router();
const supersetService = require('../superset_service');

/**
 * POST /api/superset/guest-token
 * Generate guest token for authenticated user
 */
router.post('/guest-token', async (req, res) => {
  try {
    // Extract user from auth middleware
    const user = req.user;  // Assumes auth middleware sets req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { dashboard_id } = req.body;

    if (!dashboard_id) {
      return res.status(400).json({
        success: false,
        error: 'dashboard_id is required'
      });
    }

    // Generate guest token
    const guestToken = await supersetService.generateGuestToken(user, dashboard_id);

    res.json({
      success: true,
      token: guestToken,
      expires_in: 300  // 5 minutes
    });

  } catch (error) {
    console.error('Guest token error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/superset/dashboards
 * Get list of available dashboards
 */
router.get('/dashboards', async (req, res) => {
  try {
    const dashboards = await supersetService.getDashboards();

    res.json({
      success: true,
      dashboards
    });

  } catch (error) {
    console.error('Dashboards fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

// In server/api/app.js or main server file:
// const supersetRoutes = require('./routes/superset');
// app.use('/api/superset', supersetRoutes);
```

### Environment Variables for Backend

Add to `server/api/.env`:

```bash
# Superset Configuration
SUPERSET_URL=http://localhost:8088
SUPERSET_USERNAME=admin
SUPERSET_PASSWORD=admin
GUEST_TOKEN_JWT_SECRET=your-guest-token-secret-must-match-superset-config
```

---

## React Frontend Implementation

### 1. Install Dependencies

```bash
cd client  # or your React app directory
npm install @superset-ui/embedded-sdk
```

### 2. Create Superset Dashboard Component

**File**: `client/src/components/SupersetDashboard.jsx`

```javascript
import React, { useEffect, useRef, useState } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';
import './SupersetDashboard.css';

/**
 * SupersetDashboard Component
 * Embeds Apache Superset dashboard with guest token authentication
 *
 * @param {string} dashboardId - UUID of the Superset dashboard
 * @param {string} supersetDomain - URL of Superset instance (default: http://localhost:8088)
 * @param {object} dashboardUiConfig - UI configuration options
 */
const SupersetDashboard = ({
  dashboardId,
  supersetDomain = 'http://localhost:8088',
  dashboardUiConfig = {}
}) => {
  const dashboardRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);

  /**
   * Fetch guest token from backend
   * @returns {Promise<string>} Guest token
   */
  const fetchGuestToken = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/superset/guest-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if using JWT
          // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        credentials: 'include',  // Include cookies
        body: JSON.stringify({
          dashboard_id: dashboardId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch guest token: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Invalid token response');
      }

      return data.token;
    } catch (err) {
      console.error('Guest token fetch error:', err);
      setError(`Authentication failed: ${err.message}`);
      throw err;
    }
  };

  /**
   * Embed the dashboard
   */
  useEffect(() => {
    if (!dashboardRef.current || !dashboardId) {
      return;
    }

    const embed = async () => {
      try {
        setLoading(true);
        setError(null);

        // Default UI configuration
        const defaultConfig = {
          hideTitle: false,
          hideTab: false,
          hideChartControls: false,
          filters: {
            expanded: true,
            visible: true
          }
        };

        // Embed dashboard
        await embedDashboard({
          id: dashboardId,
          supersetDomain: supersetDomain,
          mountPoint: dashboardRef.current,
          fetchGuestToken: fetchGuestToken,
          dashboardUiConfig: {
            ...defaultConfig,
            ...dashboardUiConfig
          },
          iframeSandboxExtras: ['allow-top-navigation'],
          referrerPolicy: 'same-origin'
        });

        setLoading(false);

        // Set up token refresh (every 4 minutes, tokens expire in 5)
        const interval = setInterval(async () => {
          try {
            await fetchGuestToken();
            console.log('Guest token refreshed');
          } catch (err) {
            console.error('Failed to refresh token:', err);
          }
        }, 4 * 60 * 1000);

        setTokenRefreshInterval(interval);

      } catch (err) {
        console.error('Dashboard embedding error:', err);
        setError(`Failed to load dashboard: ${err.message}`);
        setLoading(false);
      }
    };

    embed();

    // Cleanup
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [dashboardId, supersetDomain]);

  return (
    <div className="superset-dashboard-container">
      {loading && (
        <div className="superset-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="superset-error">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      <div
        ref={dashboardRef}
        className="superset-dashboard-iframe"
        style={{ display: loading || error ? 'none' : 'block' }}
      />
    </div>
  );
};

export default SupersetDashboard;
```

### 3. Styles for Dashboard Component

**File**: `client/src/components/SupersetDashboard.css`

```css
.superset-dashboard-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
  position: relative;
  background-color: #f5f5f5;
}

.superset-dashboard-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.superset-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.superset-loading p {
  margin-top: 16px;
  color: #666;
  font-size: 16px;
}

.superset-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 24px;
  text-align: center;
}

.superset-error h3 {
  color: #e74c3c;
  margin-bottom: 12px;
}

.superset-error p {
  color: #666;
  margin-bottom: 20px;
  max-width: 500px;
}

.superset-error button {
  padding: 10px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.superset-error button:hover {
  background-color: #2980b9;
}
```

### 4. Usage Example in React App

```javascript
// Example: App.js or DashboardPage.js

import React from 'react';
import SupersetDashboard from './components/SupersetDashboard';

function App() {
  // Dashboard UUID from Superset (get from Superset UI → Dashboard → Share → Embed)
  const dashboardId = 'abc123-your-dashboard-uuid';

  return (
    <div className="App">
      <header>
        <h1>Quest Canada Analytics</h1>
      </header>

      <main style={{ height: '800px', padding: '20px' }}>
        <SupersetDashboard
          dashboardId={dashboardId}
          supersetDomain="http://localhost:8088"
          dashboardUiConfig={{
            hideTitle: false,
            hideChartControls: false,
            filters: {
              expanded: true
            }
          }}
        />
      </main>
    </div>
  );
}

export default App;
```

### 5. Advanced: Dashboard Selector Component

```javascript
// client/src/components/DashboardSelector.jsx

import React, { useState, useEffect } from 'react';
import SupersetDashboard from './SupersetDashboard';

const DashboardSelector = () => {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available dashboards
    fetch('http://localhost:5000/api/superset/dashboards')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDashboards(data.dashboards);
          if (data.dashboards.length > 0) {
            setSelectedDashboard(data.dashboards[0].uuid);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboards:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading dashboards...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="dashboard-select">Select Dashboard: </label>
        <select
          id="dashboard-select"
          value={selectedDashboard || ''}
          onChange={(e) => setSelectedDashboard(e.target.value)}
          style={{ padding: '8px', fontSize: '14px' }}
        >
          {dashboards.map(dashboard => (
            <option key={dashboard.uuid} value={dashboard.uuid}>
              {dashboard.title}
            </option>
          ))}
        </select>
      </div>

      {selectedDashboard && (
        <SupersetDashboard
          dashboardId={selectedDashboard}
          supersetDomain="http://localhost:8088"
        />
      )}
    </div>
  );
};

export default DashboardSelector;
```

---

## Security Considerations

### 1. Secret Management

**Critical**: Never commit secrets to version control!

```bash
# .gitignore
.env
superset/.env
server/api/.env
superset_config.py  # If it contains secrets
```

Use environment variables:

```python
# superset_config.py
import os

SECRET_KEY = os.getenv('SUPERSET_SECRET_KEY')
GUEST_TOKEN_JWT_SECRET = os.getenv('GUEST_TOKEN_JWT_SECRET')
```

### 2. HTTPS in Production

Always use HTTPS in production:

```python
# superset_config.py
ENABLE_PROXY_FIX = True
TALISMAN_CONFIG = {
    # ... other config
    "force_https": True,
}
```

Update CORS origins:

```python
CORS_OPTIONS = {
    'origins': [
        'https://cpsc405.joeyfishertech.com'
    ]
}
```

### 3. SQL Injection Prevention

Always sanitize user input in RLS clauses:

```python
# BAD - SQL injection risk
rls_clause = f"community = '{user_input}'"

# GOOD - Escape single quotes
rls_clause = f"community = '{user_input.replace(\"'\", \"''\")}'"

# BETTER - Use parameterized queries when possible
```

### 4. Token Security

- **Short expiration**: Keep tokens at 5 minutes
- **Refresh mechanism**: Implement automatic token refresh
- **Secure transmission**: Always use HTTPS
- **No client storage**: Don't store tokens in localStorage

### 5. Authentication Layer

Ensure your backend validates user auth before generating tokens:

```python
@app.route('/api/superset/guest-token', methods=['POST'])
@require_authentication  # Custom decorator
def get_superset_guest_token():
    user = get_current_user()  # From session/JWT
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    # ... generate token
```

### 6. Rate Limiting

Implement rate limiting on token endpoint:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@app.route('/api/superset/guest-token', methods=['POST'])
@limiter.limit("10 per minute")  # Max 10 tokens per minute
def get_superset_guest_token():
    # ... generate token
```

---

## Troubleshooting

### Issue 1: CORS Errors

**Symptom**: Browser console shows CORS policy errors

**Solution**:

1. Verify `superset_config.py` has correct origins:
```python
CORS_OPTIONS = {
    'origins': ['http://localhost:3000']
}
```

2. Check browser DevTools → Network → Request Headers
3. Restart Superset after config changes:
```bash
docker-compose restart superset
```

### Issue 2: Guest Token Generation Fails

**Symptom**: 401 or 403 errors when calling `/api/v1/security/guest_token/`

**Solution**:

1. Verify admin account has permission:
```sql
-- In Superset metadata DB
SELECT * FROM ab_permission WHERE name = 'can_grant_guest_token';
```

2. Grant permission via Superset UI:
   - **Security** → **List Roles** → **Admin**
   - Add permission: **can_grant_guest_token on Security**

3. Check access token is valid:
```bash
curl -X POST http://localhost:8088/api/v1/security/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin","provider":"db","refresh":true}'
```

### Issue 3: Dashboard Won't Load in Iframe

**Symptom**: Blank iframe or "Refused to display in a frame" error

**Solution**:

1. Enable embedding for specific dashboard:
   - Open dashboard in Superset
   - Click **Share** → **Embed dashboard**
   - Add allowed domains

2. Update `TALISMAN_CONFIG`:
```python
TALISMAN_CONFIG = {
    "content_security_policy": {
        "frame-ancestors": ["'self'", "http://localhost:3000"],
    }
}
```

### Issue 4: RLS Not Filtering Data

**Symptom**: Users see data from all communities

**Solution**:

1. Verify RLS clause syntax:
```python
# Test in SQL Lab
SELECT * FROM community_projects
WHERE communities.name = 'Calgary';
```

2. Check guest token payload:
```javascript
// Decode JWT in browser
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded.rls);
```

3. Ensure table names match:
```python
# Use fully qualified names
{ "clause": "communities.name = 'Calgary'" }
```

### Issue 5: Database Connection Failed

**Symptom**: "Can't connect to database" in Superset

**Solution**:

1. Use correct host for Docker:
```
# BAD
postgresql://localhost:5432/quest_canada

# GOOD (from Docker container)
postgresql://host.docker.internal:5432/quest_canada
```

2. Test connection:
```bash
docker exec -it quest_superset psql -h host.docker.internal -U grafana -d quest_canada
```

3. Allow PostgreSQL connections from Docker:
```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line:
host    all             all             172.17.0.0/16           md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue 6: Token Expiration Errors

**Symptom**: Dashboard works initially, then fails after 5 minutes

**Solution**: Implement token refresh (see React component example above)

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `No module named 'superset_config'` | Config file not mounted | Check Docker volume mount |
| `CSRF token missing` | CORS misconfiguration | Add `X-CSRFToken` to allowed headers |
| `Invalid guest token` | JWT secret mismatch | Ensure secrets match between backend and Superset |
| `Permission denied` | Missing `can_grant_guest_token` | Grant permission to admin role |
| `Dashboard not found` | Wrong dashboard ID | Get correct UUID from Superset UI |

---

## Production Deployment

### 1. Production Checklist

- [ ] Change all default passwords (admin, Postgres, Redis)
- [ ] Generate strong secrets (42+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (block Superset port 8088 from public)
- [ ] Set up database backups
- [ ] Configure email alerts (optional)
- [ ] Enable monitoring (Prometheus/Grafana)
- [ ] Test RLS thoroughly with different user roles
- [ ] Set `SUPERSET_LOAD_EXAMPLES=false`
- [ ] Review and lock down CORS origins
- [ ] Implement rate limiting on token endpoint
- [ ] Set up log aggregation

### 2. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  superset:
    image: apache/superset:latest
    restart: always
    environment:
      SUPERSET_SECRET_KEY: ${SUPERSET_SECRET_KEY}
      GUEST_TOKEN_JWT_SECRET: ${GUEST_TOKEN_JWT_SECRET}
      SUPERSET_LOAD_EXAMPLES: 'false'
      DATABASE_DIALECT: postgresql
      DATABASE_HOST: ${DB_HOST}
      DATABASE_DB: ${DB_NAME}
      DATABASE_USER: ${DB_USER}
      DATABASE_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./superset_config.py:/app/pythonpath/superset_config.py:ro
    ports:
      - "127.0.0.1:8088:8088"  # Only accessible via nginx reverse proxy
    networks:
      - quest_network
```

### 3. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/quest-superset

upstream superset {
    server 127.0.0.1:8088;
}

server {
    listen 443 ssl http2;
    server_name analytics.cpsc405.joeyfishertech.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Superset
    location / {
        proxy_pass http://superset;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. PostgreSQL Production Setup

```sql
-- Create dedicated Superset database user
CREATE USER superset_ro WITH PASSWORD 'secure_password';

-- Grant read-only access to Quest Canada data
GRANT CONNECT ON DATABASE quest_canada TO superset_ro;
GRANT USAGE ON SCHEMA public TO superset_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO superset_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO superset_ro;

-- For Superset metadata database (separate)
CREATE DATABASE superset_metadata OWNER superset;
```

### 5. Monitoring

```python
# superset_config.py - Add monitoring

# Prometheus metrics
ENABLE_PROMETHEUS = True

# Sentry error tracking (optional)
SENTRY_DSN = os.getenv('SENTRY_DSN', '')

# Logging to file
import logging
from logging.handlers import RotatingFileHandler

file_handler = RotatingFileHandler(
    '/var/log/superset/superset.log',
    maxBytes=10485760,  # 10MB
    backupCount=10
)
file_handler.setLevel(logging.INFO)
```

### 6. Backup Strategy

```bash
#!/bin/bash
# backup-superset.sh

# Backup Superset metadata
docker exec quest_superset_db pg_dump -U superset superset > \
  /backups/superset-$(date +%Y%m%d-%H%M%S).sql

# Backup Superset config
cp superset_config.py /backups/superset_config-$(date +%Y%m%d).py

# Keep last 7 days
find /backups -name "superset-*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup-superset.sh
```

---

## Summary

This guide provides a complete implementation path for integrating Apache Superset with the Quest Canada application:

### Key Components

1. **Superset Docker Setup**: Production-ready containerized deployment
2. **Configuration**: Secure settings with CORS, embedding, and guest tokens
3. **Guest Token Auth**: Seamless authentication without Superset login
4. **Row-Level Security**: Multi-tenancy support for community-specific data
5. **Backend API**: Node.js/Python endpoints for token generation
6. **React Components**: Production-ready embedding components
7. **Security**: Best practices for production deployment

### Next Steps

1. **Deploy Superset** using provided Docker Compose configuration
2. **Create dashboards** connecting to `quest_canada` PostgreSQL database
3. **Implement backend** guest token endpoint
4. **Build React components** using `@superset-ui/embedded-sdk`
5. **Test RLS** with different user communities
6. **Deploy to production** following security checklist

### Resources

- [Apache Superset Documentation](https://superset.apache.org/docs/intro)
- [Embedded SDK GitHub](https://github.com/apache/superset/tree/master/superset-embedded-sdk)
- [Superset Security Guide](https://superset.apache.org/docs/security/)
- [Docker Compose Installation](https://superset.apache.org/docs/installation/installing-superset-using-docker-compose/)

---

**For Questions or Issues**: Refer to the troubleshooting section or consult the official Apache Superset documentation.
