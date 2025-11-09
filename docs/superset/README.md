# Apache Superset Integration for Quest Canada

This directory contains all files needed to integrate Apache Superset with the Quest Canada Gap Analysis System.

## Quick Start

### 1. Generate Secrets

```bash
# Generate SUPERSET_SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(42))"

# Generate GUEST_TOKEN_JWT_SECRET
python3 -c "import secrets; print(secrets.token_urlsafe(42))"
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your secrets and configuration
nano .env
```

### 3. Start Superset

```bash
# Start all services
docker-compose -f docker-compose.superset.yml up -d

# Check logs
docker-compose -f docker-compose.superset.yml logs -f superset

# Check status
docker-compose -f docker-compose.superset.yml ps
```

### 4. Access Superset

- **URL**: http://localhost:8088
- **Username**: admin (or value from SUPERSET_ADMIN_USER)
- **Password**: admin (or value from SUPERSET_ADMIN_PASSWORD)

### 5. Connect to Quest Canada Database

1. Log in to Superset
2. Navigate to **Data** → **Databases** → **+ Database**
3. Select **PostgreSQL**
4. Configure connection:
   - **Host**: `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux)
   - **Port**: `5432`
   - **Database**: `quest_canada`
   - **Username**: `grafana`
   - **Password**: Your PostgreSQL password
5. Click **Test Connection** → **Connect**

### 6. Create Dashboard

1. Navigate to **SQL Lab**
2. Run queries against `quest_canada` database
3. Create charts from query results
4. Add charts to a new dashboard
5. Enable embedding: **Dashboard** → **Share** → **Embed dashboard**
6. Copy dashboard UUID for use in React app

## File Structure

```
superset/
├── docker-compose.superset.yml  # Production-ready Docker Compose
├── superset_config.py            # Superset configuration (CORS, embedding, RLS)
├── .env.example                  # Environment variables template
├── README.md                     # This file
└── examples/                     # Code examples
    ├── node-backend-endpoint.js      # Node.js guest token API
    ├── python-flask-endpoint.py      # Python Flask guest token API
    ├── react-dashboard-component.jsx # React embedding component
    └── SupersetDashboard.css         # Component styles
```

## Integration Steps

### Backend (Choose One)

#### Option A: Python Flask

Add to `server/api/forms_api.py`:

```python
# Copy code from examples/python-flask-endpoint.py
```

#### Option B: Node.js Express

1. Install dependencies:
```bash
cd server/api
npm install axios
```

2. Add route:
```javascript
const supersetRoutes = require('./examples/node-backend-endpoint');
app.use('/api/superset', supersetRoutes);
```

### Frontend (React)

1. Install SDK:
```bash
npm install @superset-ui/embedded-sdk
```

2. Copy component:
```bash
cp examples/react-dashboard-component.jsx src/components/
cp examples/SupersetDashboard.css src/components/
```

3. Use in your app:
```javascript
import SupersetDashboard from './components/SupersetDashboard';

function App() {
  return (
    <div style={{ height: '800px' }}>
      <SupersetDashboard
        dashboardId="your-dashboard-uuid"
        supersetDomain="http://localhost:8088"
      />
    </div>
  );
}
```

## Configuration Options

### Dashboard UI Config

```javascript
<SupersetDashboard
  dashboardId="abc123"
  dashboardUiConfig={{
    hideTitle: false,           // Show/hide dashboard title
    hideTab: false,             // Show/hide tabs
    hideChartControls: false,   // Show/hide chart controls
    filters: {
      visible: true,            // Show filters
      expanded: true            // Expand filters by default
    },
    urlParams: {
      city: 'Calgary'           // Pass parameters to dashboard
    }
  }}
/>
```

### Row-Level Security (RLS)

RLS rules are automatically applied based on user context:

```javascript
// Example: User from Calgary
// RLS clause: communities.name = 'Calgary'
// Result: User sees only Calgary data

// Example: Admin user
// RLS clause: (none)
// Result: User sees all data
```

## Troubleshooting

### Issue: CORS Errors

**Solution**: Update `superset_config.py` with your React app URL:

```python
CORS_OPTIONS = {
    'origins': ['http://localhost:3000']  # Add your URL
}
```

Restart Superset:
```bash
docker-compose -f docker-compose.superset.yml restart superset
```

### Issue: "Can't connect to database"

**Solution**: Use correct Docker host:

- **Mac/Windows**: `host.docker.internal`
- **Linux**: `172.17.0.1`

Test connection:
```bash
docker exec -it quest_superset ping host.docker.internal
```

### Issue: Guest token generation fails

**Solution**: Grant permission to admin user:

1. Go to **Security** → **List Roles** → **Admin**
2. Click **Edit**
3. Find permission: `can_grant_guest_token on Security`
4. Check the box
5. Save

### Issue: Dashboard won't embed

**Solution**: Enable embedding for dashboard:

1. Open dashboard in Superset
2. Click **Share** → **Embed dashboard**
3. Add allowed domain: `http://localhost:3000`
4. Save

## Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Generate strong secrets (42+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Update CORS origins to production URLs
- [ ] Block Superset port 8088 from public (use reverse proxy)
- [ ] Set `SUPERSET_LOAD_EXAMPLES=false`
- [ ] Configure database backups
- [ ] Set up monitoring
- [ ] Test RLS thoroughly

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name analytics.example.com;

    location / {
        proxy_pass http://localhost:8088;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Backups

```bash
#!/bin/bash
# backup-superset.sh

docker exec quest_superset_db pg_dump -U superset superset > \
  /backups/superset-$(date +%Y%m%d-%H%M%S).sql

# Keep last 7 days
find /backups -name "superset-*.sql" -mtime +7 -delete
```

## Resources

- [Apache Superset Documentation](https://superset.apache.org/docs/intro)
- [Embedded SDK](https://github.com/apache/superset/tree/master/superset-embedded-sdk)
- [SUPERSET_INTEGRATION_GUIDE.md](../SUPERSET_INTEGRATION_GUIDE.md) - Complete technical guide

## Support

For detailed documentation, see:
- `SUPERSET_INTEGRATION_GUIDE.md` - Complete integration guide
- `examples/` - Working code examples

For issues:
1. Check logs: `docker-compose -f docker-compose.superset.yml logs superset`
2. Verify configuration: `superset_config.py`
3. Test connection: `curl http://localhost:8088/health`
