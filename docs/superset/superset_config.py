"""
Quest Canada - Apache Superset Configuration
Enables embedding, guest tokens, CORS, and Row-Level Security (RLS)

IMPORTANT: Change all secrets in production!
"""

import os
from typing import Optional
from flask import g

# -------------------------------------------------------------------
# Flask App Builder Configuration
# -------------------------------------------------------------------
# Your App secret key - MUST CHANGE IN PRODUCTION
SECRET_KEY = os.getenv(
    'SUPERSET_SECRET_KEY',
    'CHANGE_THIS_TO_A_LONG_RANDOM_STRING_MIN_42_CHARS'
)

# SQLAlchemy connection string to Superset metadata database
SQLALCHEMY_DATABASE_URI = os.getenv(
    'DATABASE_URL',
    'postgresql+psycopg2://superset:superset_secure_password_change_me@superset-db:5432/superset'
)

# Disable modification tracking
SQLALCHEMY_TRACK_MODIFICATIONS = False

# -------------------------------------------------------------------
# Feature Flags
# -------------------------------------------------------------------
FEATURE_FLAGS = {
    # Enable dashboard embedding (CRITICAL)
    "EMBEDDED_SUPERSET": True,

    # Enable SQL Lab
    "ENABLE_TEMPLATE_PROCESSING": True,

    # Enable advanced data types
    "ENABLE_ADVANCED_DATA_TYPES": True,

    # Alert features (disable if not using)
    "ALERT_REPORTS": False,

    # Enable dashboard cross filters
    "DASHBOARD_CROSS_FILTERS": True,

    # Enable dashboard native filters
    "DASHBOARD_NATIVE_FILTERS": True,
}

# -------------------------------------------------------------------
# Guest Token Configuration (Critical for Embedding)
# -------------------------------------------------------------------
# JWT secret for signing guest tokens - MUST BE STRONG IN PRODUCTION
GUEST_TOKEN_JWT_SECRET = os.getenv(
    'GUEST_TOKEN_JWT_SECRET',
    'CHANGE_THIS_GUEST_TOKEN_SECRET_TO_RANDOM_STRING_MIN_42_CHARS'
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
        '/api/v1/security/login',
        '/api/v1/security/csrf_token/',
        '/api/v1/chart/*',
        '/api/v1/dashboard/*',
        '/superset/explore_json/*',
        '/api/v1/query/',
        '/api/v1/formData/*',
        '/superset/csrf_token/',
        '/superset/fetch_datasource_metadata/',
    ],
    'origins': [
        'http://localhost:3000',  # React dev server
        'http://localhost:3001',  # Alternative port
        'https://cpsc405.joeyfishertech.com',  # Production
        # Add your production domains here
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
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'"],
        "frame-ancestors": [
            "'self'",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://cpsc405.joeyfishertech.com",
            # Add your production domains here
        ],
    },
    "force_https": False,  # Set to True in production with SSL
}

# -------------------------------------------------------------------
# Row Level Security (RLS)
# -------------------------------------------------------------------
# Enable RLS (applied via guest tokens)
ROW_LEVEL_SECURITY_ENABLED = True

# -------------------------------------------------------------------
# Cache Configuration
# -------------------------------------------------------------------
# Redis cache for query results and thumbnails
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': os.getenv('REDIS_HOST', 'superset-redis'),
    'CACHE_REDIS_PORT': int(os.getenv('REDIS_PORT', 6379)),
    'CACHE_REDIS_DB': 1,
}

# Data cache (query results)
DATA_CACHE_CONFIG = CACHE_CONFIG

# Thumbnail cache
THUMBNAIL_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 86400,  # 24 hours
    'CACHE_KEY_PREFIX': 'superset_thumbnails_',
    'CACHE_REDIS_HOST': os.getenv('REDIS_HOST', 'superset-redis'),
    'CACHE_REDIS_PORT': int(os.getenv('REDIS_PORT', 6379)),
    'CACHE_REDIS_DB': 2,
}

# Filter state cache
FILTER_STATE_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 86400,
    'CACHE_KEY_PREFIX': 'superset_filter_',
    'CACHE_REDIS_HOST': os.getenv('REDIS_HOST', 'superset-redis'),
    'CACHE_REDIS_PORT': int(os.getenv('REDIS_PORT', 6379)),
    'CACHE_REDIS_DB': 3,
}

# -------------------------------------------------------------------
# Web Server Configuration
# -------------------------------------------------------------------
# Increase timeout for large queries
SUPERSET_WEBSERVER_TIMEOUT = 300

# Allow bigger file uploads
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB

# Number of workers
SUPERSET_WORKERS = 4

# Worker timeout
GUNICORN_TIMEOUT = 300

# -------------------------------------------------------------------
# Database Connections
# -------------------------------------------------------------------
# Allow connections to local PostgreSQL (disable in production if needed)
PREVENT_UNSAFE_DB_CONNECTIONS = False

# SQL Lab query limits
QUERY_RESULT_LIMIT = 10000
SQL_MAX_ROW = 100000

# SQL Lab timeout
SQLLAB_TIMEOUT = 300

# CSV export encoding
CSV_EXPORT = {
    'encoding': 'utf-8',
}

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

EMAIL_NOTIFICATIONS = False  # Set to True if using email alerts

# -------------------------------------------------------------------
# Custom Branding
# -------------------------------------------------------------------
APP_NAME = "Quest Canada Analytics"
APP_ICON = "/static/assets/images/superset-logo-horiz.png"
APP_ICON_WIDTH = 126

# Custom CSS (optional)
# EXTRA_CATEGORICAL_COLOR_SCHEMES = []
# EXTRA_SEQUENTIAL_COLOR_SCHEMES = []

# -------------------------------------------------------------------
# Authentication
# -------------------------------------------------------------------
# Allow user self-registration
AUTH_USER_REGISTRATION = False

# Default role for new users
AUTH_ROLE_PUBLIC = 'Public'

# Authentication type (database, LDAP, OAuth, etc.)
AUTH_TYPE = 1  # AUTH_DB

# User info keys (for LDAP/OAuth - not needed for DB auth)
# AUTH_LDAP_SERVER = "ldap://ldap.example.com"
# AUTH_LDAP_BIND_USER = "cn=admin,dc=example,dc=com"
# AUTH_LDAP_BIND_PASSWORD = "password"

# Session lifetime (24 hours)
PERMANENT_SESSION_LIFETIME = 86400

# -------------------------------------------------------------------
# Logging
# -------------------------------------------------------------------
# Log level
LOG_LEVEL = "INFO"

# Enable time-based log rotation
ENABLE_TIME_ROTATE = True
TIME_ROTATE_LOG_LEVEL = "INFO"

# Log format
LOG_FORMAT = "%(asctime)s:%(levelname)s:%(name)s:%(message)s"

# Log file location (comment out to disable file logging)
# FILENAME = os.path.join(os.path.expanduser("~"), "superset.log")

# -------------------------------------------------------------------
# Async Query Configuration (Optional - for long-running queries)
# -------------------------------------------------------------------
# GLOBAL_ASYNC_QUERIES_REDIS_CONFIG = {
#     "port": 6379,
#     "host": "superset-redis",
#     "password": "",
#     "db": 4,
# }

# GLOBAL_ASYNC_QUERIES_REDIS_STREAM_PREFIX = "async-events-"
# GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT = 1000
# GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT_FIREHOSE = 1000000

# -------------------------------------------------------------------
# Jinja Template Context
# -------------------------------------------------------------------
# Make user attributes available in SQL queries via Jinja
JINJA_CONTEXT_ADDONS = {
    'current_user': lambda: g.user if hasattr(g, 'user') else None,
}

# -------------------------------------------------------------------
# Chart & Dashboard Configuration
# -------------------------------------------------------------------
# Default row limit for charts
ROW_LIMIT = 50000

# Default sample size for SQL Lab
SAMPLES_ROW_LIMIT = 1000

# Enable proxy for markdown
ENABLE_PROXY_FIX = True

# Markdown allowed protocols
ALLOWED_URL_SCHEMES = [
    'http',
    'https',
    'mailto',
    'tel',
]

# -------------------------------------------------------------------
# Dashboard Configuration
# -------------------------------------------------------------------
# Enable dashboard embed button
DASHBOARD_CROSS_FILTERS = True

# Enable native filters
DASHBOARD_NATIVE_FILTERS_SET = True

# -------------------------------------------------------------------
# PostgreSQL Quest Canada Connection (Example)
# -------------------------------------------------------------------
# This section is optional - you can configure databases via UI instead
#
# SQLALCHEMY_CUSTOM_PASSWORD_STORE = {
#     'quest_canada_db': {
#         'username': 'grafana',
#         'password': os.getenv('QUEST_DB_PASSWORD', 'your_password'),
#         'host': 'host.docker.internal',  # For Docker on Mac/Windows
#         'port': 5432,
#         'database': 'quest_canada',
#     }
# }

# -------------------------------------------------------------------
# Alert & Report Configuration (Optional)
# -------------------------------------------------------------------
# ALERT_REPORTS_NOTIFICATION_DRY_RUN = True
# WEBDRIVER_BASEURL = "http://superset:8088/"
# WEBDRIVER_BASEURL_USER_FRIENDLY = "http://localhost:8088/"

# -------------------------------------------------------------------
# Production Settings
# -------------------------------------------------------------------
# In production, consider:
# 1. Set PREVENT_UNSAFE_DB_CONNECTIONS = True
# 2. Set TALISMAN_CONFIG["force_https"] = True
# 3. Disable SQL Lab if not needed
# 4. Enable rate limiting
# 5. Configure reverse proxy (nginx)
# 6. Set up monitoring (Prometheus, Sentry)
# 7. Enable database connection pooling
# 8. Configure backup strategy

# -------------------------------------------------------------------
# End of Configuration
# -------------------------------------------------------------------
