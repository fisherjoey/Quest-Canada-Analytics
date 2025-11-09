# Proxmox LXC 101 Deployment Guide

## Overview

Deploy Quest Canada Web App directly to **LXC Container 101** on your Proxmox server, bypassing WSL2 requirements entirely.

---

## Server Information

| Component | Details |
|-----------|---------|
| **Container** | LXC 101 on Proxmox |
| **IP Address** | 10.0.0.3 |
| **Domain** | cpsc405.joeyfishertech.com |
| **OS** | Linux (LXC container) |
| **Existing Services** | PostgreSQL 14, Nginx, Grafana, Flask API |

---

## Deployment Strategy

### Option A: Side-by-side with Grafana (Recommended)
- Keep Grafana running on port 3002
- Run new web app on port 3000
- Nginx routes different paths to different services
- Can migrate gradually

### Option B: Replace Grafana
- Shut down Grafana
- Run web app on port 3002
- Update Nginx to route all traffic to new app
- Grafana dashboards embedded in new app via Superset

**Recommendation:** Start with Option A, transition to Option B later

---

## Prerequisites Check

Before starting, verify on LXC 101:

```bash
# 1. SSH Access
lxc-attach -n 101

# 2. Check existing software
node --version     # Need >= 22.12
npm --version
docker --version
git --version
psql --version     # Should be 14.x

# 3. Check disk space
df -h /            # Need at least 5GB free

# 4. Check PostgreSQL
systemctl status postgresql
psql -U grafana -d quest_canada -c "SELECT version();"
```

---

## Installation Steps

### Step 1: Install Node.js 22+ (if needed)

```bash
# Check current version
node --version

# If < 22.12, install via NVM (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version  # Should show v22.x.x
npm --version
```

### Step 2: Install Wasp CLI

```bash
curl -sSL https://get.wasp.sh/installer.sh | sh

# Add to PATH
export PATH=$HOME/.local/bin:$PATH
echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc

# Verify
wasp version
```

### Step 3: Clone Repository

```bash
# Create projects directory
cd /opt
sudo mkdir -p quest-canada-web-app
sudo chown $USER:$USER quest-canada-web-app
cd quest-canada-web-app

# Clone from GitHub
git clone https://github.com/fisherjoey/quest-canada-web-app.git .

# Or if already on server, just cd to it
cd /opt/quest-canada-web-app
```

### Step 4: Initialize Open SaaS

```bash
cd /opt/quest-canada-web-app

# Create app directory
mkdir -p app
cd app

# Initialize Open SaaS template
wasp new . -t saas

# This creates the full Open SaaS structure
```

### Step 5: Configure Database Connection

```bash
cd /opt/quest-canada-web-app/app

# Copy environment example
cp .env.server.example .env.server

# Edit environment file
nano .env.server
```

**Set these variables:**

```bash
# Database (use existing PostgreSQL)
DATABASE_URL="postgresql://grafana:YOUR_PASSWORD@localhost:5432/quest_canada_v2"

# Create new database for web app (recommended)
# Or use existing quest_canada database

# JWT Secret (generate new)
JWT_SECRET=$(openssl rand -base64 32)

# App URL
WASP_WEB_CLIENT_URL="https://cpsc405.joeyfishertech.com"
WASP_SERVER_URL="https://cpsc405.joeyfishertech.com/api"
```

### Step 6: Create New Database (Recommended)

```bash
# Create separate database for new app
sudo -u postgres psql

CREATE DATABASE quest_canada_v2;
CREATE USER quest_app WITH PASSWORD 'GENERATE_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE quest_canada_v2 TO quest_app;
\q
```

### Step 7: Replace Prisma Schema

```bash
cd /opt/quest-canada-web-app/app

# Backup original schema
cp schema.prisma schema.prisma.original

# Copy our merged schema
cp ../prisma/schema.merged.prisma schema.prisma

# Copy seed script
cp ../prisma/seed.merged.ts prisma/seed.ts
```

### Step 8: Initialize Database

```bash
cd /opt/quest-canada-web-app/app

# Generate Prisma client
wasp db migrate-dev

# Seed with demo data
wasp db seed
```

### Step 9: Test Locally First

```bash
# Terminal 1: Start database
wasp start db

# Terminal 2: Start app
wasp start

# Should start on http://10.0.0.3:3000
# Access from your browser to test
```

### Step 10: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/cpsc405.conf
```

**Add new location blocks:**

```nginx
server {
    listen 443 ssl http2;
    server_name cpsc405.joeyfishertech.com;

    # ... existing SSL config ...

    # NEW: Web App Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # NEW: Web App API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # OPTIONAL: Keep Grafana accessible at /grafana
    location /grafana/ {
        proxy_pass http://localhost:3002/;
        # ... existing Grafana config ...
    }

    # Flask API (keep for backward compatibility)
    location /data-api/ {
        proxy_pass http://localhost:5000/api/;
        # ... existing config ...
    }

    # Superset (add later)
    location /superset/ {
        proxy_pass http://localhost:8088/;
        # ... config ...
    }
}
```

**Test and reload:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 11: Setup PM2 for Production

```bash
# Install PM2
npm install -g pm2

# Build production version
cd /opt/quest-canada-web-app/app
wasp build

# Start with PM2
cd .wasp/build
pm2 start npm --name "quest-web-client" -- run start:client
pm2 start npm --name "quest-web-server" -- run start:server

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

---

## Directory Structure on LXC 101

```
/opt/quest-canada-web-app/
├── app/                          # Open SaaS Wasp application
│   ├── main.wasp                 # Wasp configuration
│   ├── schema.prisma             # Database schema (merged)
│   ├── src/                      # React + Node.js source
│   ├── .env.server               # Environment variables
│   └── .wasp/                    # Wasp build artifacts
├── docs/                         # Planning documentation
├── prisma/                       # Schema integration files
├── docker-compose.dev.yml        # For Superset later
└── README.md
```

---

## Port Allocation

| Service | Port | Nginx Path | Status |
|---------|------|------------|--------|
| **React App** | 3000 | / | NEW |
| **Node API** | 3001 | /api/ | NEW |
| **Grafana** | 3002 | /grafana/ (optional) | EXISTING |
| **Flask API** | 5000 | /data-api/ | EXISTING |
| **PostgreSQL** | 5432 | N/A | EXISTING |
| **Superset** | 8088 | /superset/ | FUTURE |

---

## Database Strategy

### Option A: New Database (Recommended)
```bash
quest_canada     # Existing Grafana data (keep)
quest_canada_v2  # New web app data
```

**Pros:** Clean separation, no conflicts, easy rollback
**Cons:** Data not automatically shared

### Option B: Shared Database
```bash
quest_canada     # Both systems use same DB
```

**Pros:** Data automatically synced
**Cons:** Schema conflicts, harder to debug

**Recommendation:** Use Option A, sync data as needed

---

## Verification Checklist

After deployment, verify:

- [ ] Node.js >= 22.12 installed
- [ ] Wasp CLI installed and working
- [ ] Repository cloned to /opt/quest-canada-web-app
- [ ] Open SaaS initialized in app/ directory
- [ ] Database quest_canada_v2 created
- [ ] Prisma schema migrated successfully
- [ ] Demo data seeded
- [ ] App runs locally (http://10.0.0.3:3000)
- [ ] Nginx configured and reloaded
- [ ] HTTPS works (https://cpsc405.joeyfishertech.com)
- [ ] Can create account and login
- [ ] PM2 running and auto-start enabled

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill if needed
sudo kill -9 <PID>
```

### Database Connection Errors
```bash
# Test connection
psql -U quest_app -d quest_canada_v2 -h localhost

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Errors
```bash
# Check logs
sudo tail -f /var/log/nginx/error.log

# Verify config
sudo nginx -t
```

### Wasp Build Failures
```bash
# Clear Wasp cache
wasp clean

# Rebuild
wasp build
```

---

## Next Steps After Deployment

1. **Customize Open SaaS**
   - Update branding (Quest Canada logo, colors)
   - Modify landing page content
   - Configure authentication

2. **Deploy Superset**
   - Setup Docker Compose
   - Configure guest tokens
   - Create dashboards

3. **Implement Features**
   - Assessment CRUD forms
   - Project management
   - Funding tracker
   - AI extraction

4. **Testing**
   - Create test accounts
   - Test multi-tenancy
   - Verify role-based access

---

## Rollback Plan

If something goes wrong:

```bash
# Stop new services
pm2 stop quest-web-client quest-web-server

# Restore Nginx config
sudo cp /etc/nginx/sites-available/cpsc405.conf.backup /etc/nginx/sites-available/cpsc405.conf
sudo systemctl reload nginx

# Grafana should still be running and accessible
```

---

## Support

- **Wasp Docs:** https://wasp.sh/docs
- **Open SaaS Docs:** https://docs.opensaas.sh
- **Internal Docs:** /opt/quest-canada-web-app/docs/

---

**Ready to deploy!** Start with Step 1 and work through sequentially.
