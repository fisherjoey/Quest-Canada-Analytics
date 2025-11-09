# Apache Superset Integration - Quick Reference

## Essential Commands

### Start/Stop Superset

```bash
# Start
docker-compose -f docker-compose.superset.yml up -d

# Stop
docker-compose -f docker-compose.superset.yml down

# Restart
docker-compose -f docker-compose.superset.yml restart superset

# View logs
docker-compose -f docker-compose.superset.yml logs -f superset
```

### Generate Secrets

```bash
# SUPERSET_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(42))"

# GUEST_TOKEN_JWT_SECRET
python3 -c "import secrets; print(secrets.token_urlsafe(42))"
```

### Access Superset

- **URL**: http://localhost:8088
- **Username**: admin
- **Password**: admin

---

## Configuration Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Generate and set `SUPERSET_SECRET_KEY`
- [ ] Generate and set `GUEST_TOKEN_JWT_SECRET`
- [ ] Set `SUPERSET_DB_PASSWORD`
- [ ] Update CORS origins in `superset_config.py`
- [ ] Update Talisman frame-ancestors in `superset_config.py`
- [ ] Start Superset: `docker-compose -f docker-compose.superset.yml up -d`
- [ ] Connect to Quest Canada database
- [ ] Create dashboards
- [ ] Enable embedding for each dashboard
- [ ] Implement backend guest token endpoint
- [ ] Implement React frontend component
- [ ] Test RLS with different users

---

## Database Connection

### PostgreSQL Connection String

```
postgresql://grafana:password@host.docker.internal:5432/quest_canada
```

**Important**: Use `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux)

### Connect via Superset UI

1. **Data** → **Databases** → **+ Database**
2. Select **PostgreSQL**
3. Fill in:
   - Host: `host.docker.internal`
   - Port: `5432`
   - Database: `quest_canada`
   - Username: `grafana`
   - Password: Your password
4. **Test Connection** → **Connect**

---

## Guest Token Authentication

### Backend Endpoint (Python Flask)

```python
@app.route('/api/superset/guest-token', methods=['POST'])
def get_superset_guest_token():
    # 1. Authenticate with Superset
    access_token = get_superset_access_token()

    # 2. Generate guest token with RLS
    response = requests.post(
        f'{SUPERSET_URL}/api/v1/security/guest_token/',
        json={
            'user': {'username': user.email},
            'resources': [{'type': 'dashboard', 'id': dashboard_id}],
            'rls': [{'clause': f"communities.name = '{user.community}'"}]
        },
        headers={'Authorization': f'Bearer {access_token}'}
    )

    return jsonify({'token': response.json()['token']})
```

### React Component

```javascript
import SupersetDashboard from './components/SupersetDashboard';

<SupersetDashboard
  dashboardId="abc123-uuid"
  supersetDomain="http://localhost:8088"
  dashboardUiConfig={{
    hideTitle: false,
    filters: { expanded: true }
  }}
/>
```

---

## Row-Level Security (RLS)

### Basic RLS Rule

```javascript
{
  clause: "communities.name = 'Calgary'"
}
```

### Multi-Table RLS

```javascript
[
  { clause: "communities.name = 'Calgary'" },
  { clause: "community_projects.community_id IN (SELECT id FROM communities WHERE name = 'Calgary')" }
]
```

### Admin (No RLS)

```javascript
[]  // Empty array = no restrictions
```

---

## Troubleshooting Quick Fixes

### CORS Error

```python
# superset_config.py
CORS_OPTIONS = {
    'origins': ['http://localhost:3000'],
    'supports_credentials': True
}
```

Restart: `docker-compose -f docker-compose.superset.yml restart superset`

### Can't Connect to Database

Use `host.docker.internal` instead of `localhost`

### Permission Denied

Grant permission in Superset UI:
- **Security** → **List Roles** → **Admin**
- Add: `can_grant_guest_token on Security`

### Dashboard Won't Embed

Enable embedding:
- Dashboard → **Share** → **Embed dashboard**
- Add: `http://localhost:3000`

---

## File Structure

```
superset/
├── docker-compose.superset.yml    # Docker setup
├── superset_config.py              # Main config
├── .env.example                    # Environment template
├── README.md                       # Setup guide
├── TROUBLESHOOTING.md              # Problem solving
├── QUICK_REFERENCE.md              # This file
└── examples/
    ├── node-backend-endpoint.js
    ├── python-flask-endpoint.py
    ├── react-dashboard-component.jsx
    ├── SupersetDashboard.css
    └── package.json.example
```

---

## API Endpoints

### Superset API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/security/login` | POST | Authenticate and get access token |
| `/api/v1/security/guest_token/` | POST | Generate guest token |
| `/api/v1/dashboard/` | GET | List dashboards |
| `/api/v1/dashboard/{uuid}` | GET | Get dashboard details |
| `/health` | GET | Health check |

### Your Backend API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/superset/guest-token` | POST | Generate guest token for user |
| `/api/superset/dashboards` | GET | List available dashboards |

---

## Environment Variables

```bash
# Required
SUPERSET_SECRET_KEY=your-secret-key
GUEST_TOKEN_JWT_SECRET=your-guest-token-secret

# Optional
SUPERSET_ADMIN_USER=admin
SUPERSET_ADMIN_PASSWORD=admin
SUPERSET_LOAD_EXAMPLES=false
SUPERSET_PORT=8088
```

---

## Production Deployment

### Pre-Deployment

1. Generate strong secrets (42+ characters)
2. Change all default passwords
3. Update CORS origins to production URLs
4. Set `SUPERSET_LOAD_EXAMPLES=false`
5. Enable HTTPS in `TALISMAN_CONFIG`
6. Configure reverse proxy (nginx)
7. Set up database backups
8. Test RLS thoroughly

### Nginx Config

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.example.com;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Common SQL Queries

### Test RLS Filter

```sql
-- Test Calgary filter
SELECT *
FROM community_projects p
JOIN communities c ON p.community_id = c.id
WHERE c.name = 'Calgary';
```

### Count Data by Community

```sql
SELECT
  c.name as community,
  COUNT(DISTINCT p.id) as projects,
  COUNT(DISTINCT ba.id) as assessments
FROM communities c
LEFT JOIN community_projects p ON c.id = p.community_id
LEFT JOIN benchmark_assessments ba ON c.id = ba.community_id
GROUP BY c.name
ORDER BY c.name;
```

---

## Dashboard UI Configuration Options

```javascript
dashboardUiConfig: {
  hideTitle: false,           // boolean
  hideTab: false,             // boolean
  hideChartControls: false,   // boolean
  filters: {
    visible: true,            // boolean
    expanded: true            // boolean
  },
  urlParams: {
    city: 'Calgary',          // string
    year: 2024                // number
  }
}
```

---

## Resources

- **Main Guide**: `../SUPERSET_INTEGRATION_GUIDE.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Setup Instructions**: `README.md`
- **Code Examples**: `examples/`

---

## Support

For detailed information:
1. Check `SUPERSET_INTEGRATION_GUIDE.md`
2. Review `TROUBLESHOOTING.md`
3. Check logs: `docker-compose -f docker-compose.superset.yml logs superset`
4. Test in SQL Lab first
5. Verify configuration in `superset_config.py`
