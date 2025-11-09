# Quest Canada Web App - Quick Setup Guide

> 5-minute setup for experienced developers on WSL2

**For detailed instructions, see [DEV_ENVIRONMENT_SETUP.md](DEV_ENVIRONMENT_SETUP.md)**

---

## Prerequisites

- Windows 10/11 with WSL2 (Ubuntu 22.04)
- Docker Desktop for Windows
- 10GB free disk space

---

## Quick Start (Copy & Paste)

### 1. Enable WSL2 (PowerShell as Admin)

```powershell
wsl --install
# Restart computer, then:
wsl --set-default-version 2
```

### 2. Install Tools (In WSL Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Git & PostgreSQL client
sudo apt install git postgresql-client jq -y

# Install NVM & Node.js 22.12
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 22.12
nvm alias default 22.12

# Install Wasp CLI
curl -sSL https://get.wasp-lang.dev/installer.sh | sh
echo 'export PATH="$HOME/.wasp/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Clone & Setup Project

```bash
# Clone repository
cd ~
git clone https://github.com/fisherjoey/quest-canada-web-app.git
cd quest-canada-web-app

# Create environment file
cp .env.example .env

# Edit .env (set DATABASE_URL and JWT_SECRET at minimum)
nano .env
```

### 4. Start PostgreSQL

```bash
# Start PostgreSQL with Docker
docker compose -f docker-compose.dev.yml up -d postgres

# Verify connection
psql -h localhost -U postgres -d quest_canada
# Password: postgres
# Type \q to exit
```

### 5. Initialize Database

```bash
# Generate Prisma client
npx prisma generate --schema=./docs/database/schema.prisma

# Push schema to database
npx prisma db push --schema=./docs/database/schema.prisma

# Seed sample data
npx tsx ./docs/database/seed.ts

# Open database browser
npx prisma studio --schema=./docs/database/schema.prisma
```

### 6. Verify Setup

```bash
# Run setup check script
chmod +x setup-check.sh
./setup-check.sh
```

---

## Essential Commands

```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d postgres

# Stop PostgreSQL
docker compose -f docker-compose.dev.yml down

# View database
npx prisma studio --schema=./docs/database/schema.prisma

# Connect to database
psql -h localhost -U postgres -d quest_canada

# Reset database (WARNING: deletes all data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d postgres
npx prisma db push --schema=./docs/database/schema.prisma --force-reset
npx tsx ./docs/database/seed.ts
```

---

## Troubleshooting

**Docker not working?**
```bash
# Check Docker Desktop is running (Windows system tray)
docker ps  # Should show running containers
```

**Can't connect to PostgreSQL?**
```bash
# Verify container is running
docker ps | grep postgres

# Check logs
docker logs quest_dev_postgres

# Verify .env DATABASE_URL
cat .env | grep DATABASE_URL
```

**Wasp command not found?**
```bash
# Add to PATH
echo 'export PATH="$HOME/.wasp/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
wasp version
```

---

## Next Steps

1. Read [DEV_ENVIRONMENT_SETUP.md](DEV_ENVIRONMENT_SETUP.md) for full details
2. Review [IMPLEMENTATION_PLAN.md](docs/planning/IMPLEMENTATION_PLAN.md) for project roadmap
3. Check [DATABASE_DOCUMENTATION.md](docs/database/DATABASE_DOCUMENTATION.md) for schema details

---

## Default Credentials

**PostgreSQL (Docker):**
- Host: `localhost`
- Port: `5432`
- Database: `quest_canada`
- User: `postgres`
- Password: `postgres`

**Superset (when enabled):**
- URL: `http://localhost:8088`
- User: `admin`
- Password: `admin`

---

**Need Help?** See full documentation in [DEV_ENVIRONMENT_SETUP.md](DEV_ENVIRONMENT_SETUP.md)
