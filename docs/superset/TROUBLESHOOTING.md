# Apache Superset Integration - Troubleshooting Guide

This guide covers common issues when integrating Apache Superset with Quest Canada.

---

## Table of Contents

1. [CORS Issues](#cors-issues)
2. [Authentication Problems](#authentication-problems)
3. [Database Connection Errors](#database-connection-errors)
4. [Embedding Issues](#embedding-issues)
5. [RLS Not Working](#rls-not-working)
6. [Performance Issues](#performance-issues)
7. [Docker Issues](#docker-issues)
8. [Token Errors](#token-errors)

---

## CORS Issues

### Symptom 1: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Browser Console Error**:
```
Access to fetch at 'http://localhost:8088/api/v1/security/guest_token/'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**:

1. **Check superset_config.py**:
```python
ENABLE_CORS = True
CORS_OPTIONS = {
    'origins': ['http://localhost:3000'],  # Add your React app URL
    'supports_credentials': True
}
```

2. **Restart Superset**:
```bash
docker-compose -f docker-compose.superset.yml restart superset
```

3. **Verify in browser DevTools**:
   - Network tab → Request Headers
   - Should see: `Origin: http://localhost:3000`
   - Response Headers should include: `Access-Control-Allow-Origin: http://localhost:3000`

### Symptom 2: "CORS policy: Credentials flag is true"

**Error**:
```
The value of 'Access-Control-Allow-Origin' in the response must not be '*'
when the request's credentials mode is 'include'
```

**Solution**:

Update `superset_config.py`:
```python
CORS_OPTIONS = {
    'origins': ['http://localhost:3000'],  # Must be specific, not '*'
    'supports_credentials': True
}
```

### Symptom 3: Preflight OPTIONS request fails

**Solution**:

Add required headers to `CORS_OPTIONS`:
```python
CORS_OPTIONS = {
    'origins': ['http://localhost:3000'],
    'allow_headers': [
        'Content-Type',
        'Authorization',
        'X-CSRFToken',
        'X-GuestToken'
    ],
    'supports_credentials': True
}
```

---

## Authentication Problems

### Symptom 1: "401 Unauthorized" when generating guest token

**Error Response**:
```json
{
  "message": "Unauthorized"
}
```

**Solution**:

1. **Verify Superset credentials**:
```bash
# Test login
curl -X POST http://localhost:8088/api/v1/security/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin","provider":"db","refresh":true}'
```

2. **Check if access token is valid**:
```javascript
// In your backend code, log the access token
console.log('Access token:', accessToken);
```

3. **Ensure Authorization header is set**:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

### Symptom 2: "Permission denied: can_grant_guest_token"

**Error**:
```json
{
  "message": "You don't have permission to grant guest tokens"
}
```

**Solution**:

1. **Grant permission via Superset UI**:
   - Go to **Security** → **List Roles**
   - Click **Admin** role
   - Find permission: `can_grant_guest_token on Security`
   - Check the box
   - Save

2. **Verify via SQL** (in Superset metadata DB):
```sql
SELECT r.name, p.name
FROM ab_permission_view pv
JOIN ab_permission p ON pv.permission_id = p.id
JOIN ab_view_menu vm ON pv.view_menu_id = vm.id
JOIN ab_permission_view_role pvr ON pv.id = pvr.permission_view_id
JOIN ab_role r ON pvr.role_id = r.id
WHERE p.name = 'can_grant_guest_token';
```

### Symptom 3: "Invalid guest token"

**Error**:
```
JWT token is invalid or expired
```

**Solution**:

1. **Verify JWT secret matches**:
   - Backend `GUEST_TOKEN_JWT_SECRET` must match `superset_config.py`

2. **Check token expiration**:
```javascript
// Decode JWT to check expiry
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires at:', new Date(decoded.exp * 1000));
```

3. **Implement token refresh** (see React component example)

---

## Database Connection Errors

### Symptom 1: "Can't connect to database on localhost:5432"

**Error in Superset**:
```
OperationalError: could not connect to server: Connection refused
```

**Solution**:

**From Docker container, `localhost` refers to the container itself, not your host machine.**

Use correct host:
- **Mac/Windows**: `host.docker.internal`
- **Linux**: `172.17.0.1` or bridge IP

**Connection String**:
```
postgresql://grafana:password@host.docker.internal:5432/quest_canada
```

**Test from container**:
```bash
docker exec -it quest_superset ping host.docker.internal
```

### Symptom 2: "FATAL: no pg_hba.conf entry for host"

**PostgreSQL Error**:
```
FATAL: no pg_hba.conf entry for host "172.17.0.2", user "grafana", database "quest_canada"
```

**Solution**:

1. **Edit pg_hba.conf**:
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

2. **Add Docker network**:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             172.17.0.0/16           md5
```

3. **Restart PostgreSQL**:
```bash
sudo systemctl restart postgresql
```

### Symptom 3: "SSL connection required"

**Solution**:

Add `?sslmode=disable` to connection string:
```
postgresql://grafana:password@host.docker.internal:5432/quest_canada?sslmode=disable
```

Or configure SSL properly in production.

---

## Embedding Issues

### Symptom 1: Blank iframe / Dashboard won't load

**Symptom**: Iframe renders but content is blank

**Solution**:

1. **Enable embedding for dashboard**:
   - Open dashboard in Superset
   - Click **Share** → **Embed dashboard**
   - Add allowed domain: `http://localhost:3000`
   - Click **Save**

2. **Check TALISMAN_CONFIG**:
```python
# In superset_config.py
TALISMAN_CONFIG = {
    "content_security_policy": {
        "frame-ancestors": [
            "'self'",
            "http://localhost:3000"  # Add your domain
        ]
    }
}
```

3. **Restart Superset**:
```bash
docker-compose -f docker-compose.superset.yml restart superset
```

### Symptom 2: "Refused to display in a frame" error

**Browser Console Error**:
```
Refused to display 'http://localhost:8088' in a frame because
it set 'X-Frame-Options' to 'deny'
```

**Solution**:

Update `superset_config.py`:
```python
# Disable X-Frame-Options (CSP handles this)
TALISMAN_CONFIG = {
    "frame_options": "ALLOWFROM",
    "frame_options_allow_from": "http://localhost:3000",
    "content_security_policy": {
        "frame-ancestors": ["'self'", "http://localhost:3000"]
    }
}
```

### Symptom 3: Dashboard loads but is not interactive

**Solution**:

Add iframe sandbox permissions:
```javascript
embedDashboard({
  // ... other config
  iframeSandboxExtras: [
    'allow-top-navigation',
    'allow-popups',
    'allow-popups-to-escape-sandbox'
  ]
});
```

---

## RLS Not Working

### Symptom 1: Users see all data (RLS not filtering)

**Solution**:

1. **Verify RLS clause syntax**:
```javascript
// Correct
{ clause: "communities.name = 'Calgary'" }

// Wrong
{ clause: "name = 'Calgary'" }  // Missing table name
```

2. **Test RLS clause in SQL Lab**:
```sql
SELECT *
FROM community_projects p
JOIN communities c ON p.community_id = c.id
WHERE communities.name = 'Calgary';  -- Your RLS clause
```

3. **Check guest token payload**:
```javascript
// Decode JWT in browser console
const token = 'your-guest-token';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('RLS rules:', payload.rls);
```

### Symptom 2: RLS blocks all data

**RLS clause**: `{ clause: "1 = 0" }`

**Cause**: Fallback rule when user has no community assigned

**Solution**:

Ensure user has community in your backend:
```javascript
if (!user.community) {
  return res.status(400).json({
    error: 'User must have a community assigned'
  });
}
```

### Symptom 3: RLS works in SQL Lab but not in dashboard

**Solution**:

1. **Ensure dataset has base table specified**:
   - Go to **Data** → **Datasets**
   - Edit dataset
   - Verify **SQL** tab has correct table

2. **Check virtual dataset compatibility**:
   - RLS may not work with complex SQL queries
   - Use physical tables when possible

---

## Performance Issues

### Symptom 1: Dashboard loads slowly

**Solution**:

1. **Enable caching** in `superset_config.py`:
```python
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_HOST': 'superset-redis'
}

DATA_CACHE_CONFIG = CACHE_CONFIG
```

2. **Optimize queries**:
   - Add indexes to frequently filtered columns
   - Use aggregations in dataset SQL
   - Limit data timeframe

3. **Set row limits**:
```python
ROW_LIMIT = 10000
```

### Symptom 2: Token refresh causes lag

**Solution**:

Refresh token in background without re-rendering:
```javascript
const refreshToken = async () => {
  try {
    await fetchGuestToken();
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
};

// Refresh every 4 minutes (before 5-min expiry)
setInterval(refreshToken, 4 * 60 * 1000);
```

---

## Docker Issues

### Symptom 1: "Port 8088 already in use"

**Error**:
```
bind: address already in use
```

**Solution**:

1. **Find what's using port 8088**:
```bash
lsof -i :8088
# or
netstat -tuln | grep 8088
```

2. **Stop conflicting service or change port**:
```yaml
# In docker-compose.superset.yml
ports:
  - "8089:8088"  # Use different external port
```

### Symptom 2: Superset container keeps restarting

**Solution**:

1. **Check logs**:
```bash
docker-compose -f docker-compose.superset.yml logs superset
```

2. **Common causes**:
   - Database not ready: Wait for `superset-db` healthcheck
   - Invalid config: Check `superset_config.py` syntax
   - Missing secrets: Verify `.env` file

3. **Verify dependencies**:
```yaml
depends_on:
  superset-db:
    condition: service_healthy
```

### Symptom 3: "No space left on device"

**Solution**:

Clean up Docker:
```bash
docker system prune -a
docker volume prune
```

---

## Token Errors

### Symptom 1: "Token expired"

**Error after 5 minutes**:
```
Guest token has expired
```

**Solution**:

Implement automatic token refresh (see React component example)

### Symptom 2: "Audience mismatch"

**Error**:
```
Token audience does not match
```

**Solution**:

Ensure `GUEST_TOKEN_JWT_AUDIENCE` matches in both places:
```python
# superset_config.py
GUEST_TOKEN_JWT_AUDIENCE = 'superset'

# Backend (if generating tokens locally)
payload = {
  'aud': 'superset',  # Must match
  # ...
}
```

---

## Quick Diagnostics

### Check Superset Health

```bash
# Superset API health
curl http://localhost:8088/health

# Expected response:
# "OK"
```

### Check Database Connection

```bash
# From Superset container
docker exec -it quest_superset \
  psql -h host.docker.internal -U grafana -d quest_canada -c "SELECT NOW();"
```

### Check CORS Headers

```bash
# Check preflight request
curl -X OPTIONS http://localhost:8088/api/v1/security/guest_token/ \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Decode Guest Token

```javascript
// In browser console
const token = 'eyJ0eXAiOiJKV1QiLCJhbGc...';
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded);
```

### Check Superset Logs

```bash
# Follow logs
docker-compose -f docker-compose.superset.yml logs -f superset

# Last 100 lines
docker-compose -f docker-compose.superset.yml logs --tail=100 superset
```

---

## Getting Help

If you encounter issues not covered here:

1. **Check official documentation**:
   - [Apache Superset Docs](https://superset.apache.org/docs/intro)
   - [GitHub Issues](https://github.com/apache/superset/issues)

2. **Enable debug mode**:
```python
# In superset_config.py
DEBUG = True
LOG_LEVEL = "DEBUG"
```

3. **Check browser DevTools**:
   - Console for JavaScript errors
   - Network tab for API requests
   - Application tab for storage

4. **Test in isolation**:
   - Test Superset login directly
   - Test guest token endpoint with curl
   - Test dashboard without embedding

---

## Common Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `CORS policy` | CORS not configured | Update `CORS_OPTIONS` in config |
| `401 Unauthorized` | Invalid credentials | Check username/password |
| `403 Forbidden` | Missing permission | Grant `can_grant_guest_token` |
| `Connection refused` | Wrong host | Use `host.docker.internal` |
| `Invalid guest token` | Secret mismatch | Verify `GUEST_TOKEN_JWT_SECRET` |
| `Refused to display` | CSP restriction | Update `TALISMAN_CONFIG` |
| `Token expired` | No refresh | Implement token refresh |
| `No pg_hba.conf entry` | PostgreSQL access | Update `pg_hba.conf` |

---

**For additional support**, refer to:
- `SUPERSET_INTEGRATION_GUIDE.md` - Complete technical guide
- `README.md` - Quick start guide
- `superset_config.py` - Configuration reference
