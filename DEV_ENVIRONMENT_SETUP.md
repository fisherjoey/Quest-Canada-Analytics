# Quest Canada Web App - Development Environment Setup Guide

> Complete guide for setting up your local development environment on Windows with WSL2

**Target Audience:** Developers new to the Quest Canada web application
**Platform:** Windows 10/11 with WSL2
**Time Required:** 30-60 minutes
**Last Updated:** January 2025

---

## Table of Contents

1. [Prerequisites Overview](#prerequisites-overview)
2. [WSL2 Setup (Windows Users - Critical!)](#wsl2-setup-windows-users---critical)
3. [Installing Required Tools](#installing-required-tools)
4. [PostgreSQL Setup](#postgresql-setup)
5. [Project Setup](#project-setup)
6. [Environment Configuration](#environment-configuration)
7. [Database Initialization](#database-initialization)
8. [Verify Installation](#verify-installation)
9. [Common Troubleshooting](#common-troubleshooting)
10. [Development Workflow](#development-workflow)

---

## Prerequisites Overview

Before starting, you'll need:

- **Windows 10/11** (Version 1903 or higher, Build 18362 or higher)
- **Administrator access** to your Windows machine
- **Stable internet connection** for downloading packages
- **At least 10GB free disk space**

Required software stack:
- WSL2 with Ubuntu 22.04 LTS
- Node.js 22.12 or higher
- Docker Desktop for Windows
- Wasp CLI (Open SaaS framework)
- Git
- PostgreSQL 14+ (via Docker or local installation)

---

## WSL2 Setup (Windows Users - Critical!)

### Why WSL2?

The Quest Canada web app uses Wasp framework, which requires a Unix-like environment. WSL2 provides excellent compatibility and performance for Node.js development on Windows.

### Step 1: Enable WSL2

Open **PowerShell as Administrator** and run:

```powershell
# Enable WSL
wsl --install

# This command will:
# - Enable Windows Subsystem for Linux
# - Enable Virtual Machine Platform
# - Install Ubuntu 22.04 LTS
# - Restart your computer
```

**After restart**, continue with:

```powershell
# Verify WSL2 is the default version
wsl --set-default-version 2

# Check WSL status
wsl --status
```

### Step 2: Install Ubuntu 22.04 LTS

If Ubuntu wasn't automatically installed:

```powershell
# List available distributions
wsl --list --online

# Install Ubuntu 22.04
wsl --install -d Ubuntu-22.04
```

### Step 3: Set Up Your Ubuntu User

When you first launch Ubuntu:

1. Choose a username (lowercase, no spaces)
2. Create a password (you'll use this for `sudo` commands)
3. Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 4: Configure WSL2 for Development

**Increase memory allocation** (optional, recommended for large projects):

Create or edit `C:\Users\<YourUsername>\.wslconfig`:

```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

Restart WSL2:

```powershell
wsl --shutdown
wsl
```

### Step 5: Install Windows Terminal (Recommended)

Download from Microsoft Store or use this command in PowerShell:

```powershell
winget install Microsoft.WindowsTerminal
```

**Why Windows Terminal?**
- Better performance than default WSL console
- Multiple tabs
- Split panes
- Customizable themes

### WSL2 File System Tips

**Important:** Work within your WSL2 file system for best performance:

```bash
# Your WSL home directory (fast)
cd ~
pwd  # /home/your-username

# Windows drives (slower, avoid for development)
cd /mnt/c/Users/YourName/  # NOT RECOMMENDED for code
```

**Access WSL files from Windows Explorer:**
- Type `\\wsl$\Ubuntu-22.04\home\your-username` in Explorer address bar
- Or use VS Code's WSL extension to edit files

---

## Installing Required Tools

### 1. Install Git

```bash
# Install Git
sudo apt install git -y

# Verify installation
git --version  # Should show git version 2.x

# Configure Git (use your details)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Generate SSH key for GitHub (optional but recommended)
ssh-keygen -t ed25519 -C "your.email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add this to GitHub Settings > SSH Keys
```

### 2. Install Node.js 22.12+ via NVM

We use **NVM (Node Version Manager)** for easy Node.js version management:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Verify NVM installation
nvm --version

# Install Node.js 22.12 (or latest 22.x)
nvm install 22.12

# Set as default
nvm alias default 22.12

# Verify installation
node --version   # v22.12.x
npm --version    # 10.x.x
```

### 3. Install Docker Desktop for Windows

**Download:** https://www.docker.com/products/docker-desktop/

Installation steps:
1. Download Docker Desktop installer
2. Run installer with default settings
3. **Enable WSL2 backend** during installation
4. Restart your computer
5. Launch Docker Desktop
6. Go to **Settings > General** and ensure "Use the WSL 2 based engine" is checked
7. Go to **Settings > Resources > WSL Integration** and enable your Ubuntu distribution

**Verify Docker works in WSL2:**

```bash
docker --version
docker compose version

# Test Docker
docker run hello-world
```

### 4. Install Wasp CLI

Wasp is the full-stack framework we use (Open SaaS boilerplate):

```bash
# Install Wasp
curl -sSL https://get.wasp-lang.dev/installer.sh | sh

# Add Wasp to PATH (add to ~/.bashrc)
echo 'export PATH="$HOME/.wasp/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
wasp version  # Should show 0.13.x or higher
```

### 5. Install Additional Development Tools

```bash
# PostgreSQL client (for testing connections)
sudo apt install postgresql-client -y

# psql command for database connections
psql --version

# jq (for JSON processing in scripts)
sudo apt install jq -y

# curl and wget (if not already installed)
sudo apt install curl wget -y
```

---

## PostgreSQL Setup

You have two options for running PostgreSQL:

### Option A: Docker (Recommended for Development)

**Pros:** Isolated, easy cleanup, consistent across team
**Cons:** Requires Docker Desktop running

The project includes `docker-compose.dev.yml` with PostgreSQL 14:

```bash
# Navigate to project root
cd ~/quest-canada-web-app

# Start PostgreSQL container
docker compose -f docker-compose.dev.yml up -d postgres

# Check it's running
docker ps

# View logs
docker compose -f docker-compose.dev.yml logs postgres

# Test connection
psql -h localhost -U postgres -d quest_canada
# Password: postgres
```

### Option B: Local PostgreSQL Installation

**Pros:** Faster performance, no Docker needed
**Cons:** System-wide installation, harder to isolate

```bash
# Install PostgreSQL 14
sudo apt install postgresql-14 postgresql-contrib -y

# Start PostgreSQL service
sudo service postgresql start

# Check status
sudo service postgresql status

# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE quest_canada;
CREATE USER quest_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE quest_canada TO quest_user;
\q
```

**Auto-start PostgreSQL on WSL boot:**

Add to `~/.bashrc`:

```bash
# Auto-start PostgreSQL
if ! pgrep -x postgres > /dev/null; then
    sudo service postgresql start
fi
```

---

## Project Setup

### 1. Clone Repository

```bash
# Navigate to your workspace
cd ~

# Clone the repository (use SSH if you set up keys)
git clone https://github.com/fisherjoey/quest-canada-web-app.git

# Or with HTTPS
git clone https://github.com/fisherjoey/quest-canada-web-app.git

cd quest-canada-web-app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies (if package.json exists in root)
npm install

# If using Wasp (once app/ directory is created)
cd app
wasp build
cd ..
```

**Note:** As of January 2025, the Wasp application structure may not be fully initialized. Check the current README.md for updated instructions.

---

## Environment Configuration

### 1. Create `.env` File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Edit `.env` with Your Settings

Open `.env` in your editor:

```bash
# Using nano
nano .env

# Or VS Code (if you have WSL extension)
code .env
```

### 3. Configure Database Connection

For **Docker PostgreSQL** (Option A):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quest_canada?schema=public"
```

For **Local PostgreSQL** (Option B):

```env
DATABASE_URL="postgresql://quest_user:your_secure_password@localhost:5432/quest_canada?schema=public"
```

### 4. Configure Additional Services

```env
# Node environment
NODE_ENV=development

# Server port (Wasp default is 3000)
SERVER_PORT=3001

# JWT secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Anthropic Claude API (for AI extraction - optional for initial setup)
ANTHROPIC_API_KEY=sk-ant-your-api-key-here

# Superset (optional, for later integration)
SUPERSET_URL=http://localhost:8088
SUPERSET_USERNAME=admin
SUPERSET_PASSWORD=admin

# Email service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Database Initialization

### Option 1: Using Prisma (Recommended)

```bash
# Generate Prisma client from schema
npx prisma generate --schema=./docs/database/schema.prisma

# Push schema to database (creates tables)
npx prisma db push --schema=./docs/database/schema.prisma

# Seed database with sample data
npx tsx ./docs/database/seed.ts

# Open Prisma Studio (visual database browser)
npx prisma studio --schema=./docs/database/schema.prisma
```

### Option 2: Using Docker Compose (Legacy SQL Scripts)

If using the parent project's Docker setup:

```bash
# Navigate to parent directory
cd ..

# Start PostgreSQL with init scripts
docker compose up -d postgres

# The SQL scripts will run automatically:
# - 00_init_database.sql
# - 01_init_schema_basic.sql
```

### Verify Database Setup

```bash
# Connect to database
psql -h localhost -U postgres -d quest_canada

# List tables
\dt

# Check communities table
SELECT * FROM communities;

# Exit psql
\q
```

---

## Verify Installation

Run the setup verification script:

```bash
# Make script executable
chmod +x setup-check.sh

# Run verification
./setup-check.sh
```

The script will check:
- Node.js version (>= 22.12)
- NPM installation
- Docker is running
- Docker Compose availability
- Wasp CLI installation
- Git configuration
- PostgreSQL connectivity
- Environment variables

**Expected output:**

```
=====================================================
Quest Canada Web App - Setup Verification
=====================================================

[✓] Node.js 22.12.0 (OK)
[✓] NPM 10.8.1 (OK)
[✓] Docker 24.0.7 (OK)
[✓] Docker Compose 2.23.0 (OK)
[✓] Wasp 0.13.2 (OK)
[✓] Git 2.34.1 (OK)
[✓] PostgreSQL connection successful
[✓] Environment file exists

=====================================================
All checks passed! You're ready to develop.
=====================================================
```

---

## Common Troubleshooting

### WSL2 Issues

**Problem:** "WSL 2 requires an update to its kernel component"

**Solution:**
```powershell
# Download and install WSL2 Linux kernel update
# https://aka.ms/wsl2kernel

wsl --update
wsl --shutdown
wsl
```

**Problem:** "The system cannot find the file specified" when running `wsl`

**Solution:**
```powershell
# Enable required Windows features
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### Docker Issues

**Problem:** "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop
2. Wait for Docker to fully start (whale icon in system tray)
3. Check WSL integration in Docker Desktop settings
4. Restart WSL: `wsl --shutdown` then reopen Ubuntu

**Problem:** Docker containers can't access internet

**Solution:**
```bash
# Edit /etc/resolv.conf in WSL
sudo nano /etc/resolv.conf

# Add Google DNS
nameserver 8.8.8.8
nameserver 8.8.4.4
```

### PostgreSQL Issues

**Problem:** "Connection refused" when connecting to PostgreSQL

**Solution:**
```bash
# Check Docker container is running
docker ps | grep postgres

# Check container logs
docker logs quest_postgres

# Verify port mapping
docker port quest_postgres

# Try connecting with explicit host
psql -h 127.0.0.1 -U postgres -d quest_canada
```

**Problem:** "FATAL: password authentication failed"

**Solution:**
```bash
# Verify credentials in .env match docker-compose.dev.yml
# Default credentials:
# Username: postgres
# Password: postgres
# Database: quest_canada

# Test with explicit password
PGPASSWORD=postgres psql -h localhost -U postgres -d quest_canada
```

### Node.js Issues

**Problem:** "node: command not found" after installing NVM

**Solution:**
```bash
# Reload shell configuration
source ~/.bashrc

# Or manually add NVM to PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Verify NVM
nvm --version

# List installed Node versions
nvm list

# Use Node 22.12
nvm use 22.12
```

**Problem:** "npm ERR! EACCES: permission denied"

**Solution:**
```bash
# Never use sudo with npm!
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Wasp Issues

**Problem:** "wasp: command not found"

**Solution:**
```bash
# Add Wasp to PATH
echo 'export PATH="$HOME/.wasp/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify installation
which wasp
wasp version
```

**Problem:** Wasp build fails with "cannot find module"

**Solution:**
```bash
# Clean Wasp cache
wasp clean

# Reinstall dependencies
npm install

# Rebuild
wasp build
```

### Prisma Issues

**Problem:** "Prisma Client did not initialize yet"

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate --schema=./docs/database/schema.prisma

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

**Problem:** "Environment variable not found: DATABASE_URL"

**Solution:**
```bash
# Verify .env exists
ls -la .env

# Check DATABASE_URL is set
grep DATABASE_URL .env

# Manually export for testing
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quest_canada"
```

---

## Development Workflow

### Daily Development Routine

```bash
# 1. Start WSL2 (open Ubuntu terminal)
cd ~/quest-canada-web-app

# 2. Start PostgreSQL (if using Docker)
docker compose -f docker-compose.dev.yml up -d postgres

# 3. Pull latest changes
git pull origin main

# 4. Install any new dependencies
npm install

# 5. Apply database migrations (if any)
npx prisma db push --schema=./docs/database/schema.prisma

# 6. Start development server (once Wasp app is initialized)
wasp start
# Or for legacy Grafana system:
cd .. && docker compose up -d
```

### Working with Git

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Add: descriptive commit message"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
gh pr create  # If you have GitHub CLI installed
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio --schema=./docs/database/schema.prisma

# Reset database (WARNING: deletes all data)
npx prisma db push --schema=./docs/database/schema.prisma --force-reset

# Re-seed data
npx tsx ./docs/database/seed.ts

# Backup database
docker exec quest_postgres pg_dump -U postgres quest_canada > backup.sql

# Restore database
docker exec -i quest_postgres psql -U postgres quest_canada < backup.sql
```

### Running Tests

```bash
# Unit tests (once implemented)
npm test

# E2E tests (once implemented)
npm run test:e2e

# Run specific test file
npm test -- path/to/test-file.test.ts
```

### Viewing Logs

```bash
# Docker container logs
docker compose -f docker-compose.dev.yml logs -f postgres
docker compose -f docker-compose.dev.yml logs -f grafana

# Node.js application logs (once running)
tail -f logs/app.log

# PostgreSQL query logs
docker exec quest_postgres tail -f /var/lib/postgresql/data/log/postgresql.log
```

---

## Next Steps

After completing this setup:

1. Read [IMPLEMENTATION_PLAN.md](docs/planning/IMPLEMENTATION_PLAN.md) for project roadmap
2. Review [DATABASE_DOCUMENTATION.md](docs/database/DATABASE_DOCUMENTATION.md) for schema details
3. Check [docs/planning/SETUP_GUIDE_OPEN_SAAS.md](docs/planning/SETUP_GUIDE_OPEN_SAAS.md) for Wasp-specific setup
4. Explore [docs/ai-extraction/AI_EXTRACTION_SERVICE_DESIGN.md](docs/ai-extraction/AI_EXTRACTION_SERVICE_DESIGN.md) for AI features

### Recommended VS Code Extensions

Install these for better development experience:

```bash
# In WSL, open VS Code
code .
```

Search and install:
- **WSL** - Remote development in WSL
- **Prisma** - Syntax highlighting for schema.prisma
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **GitLens** - Enhanced Git features
- **Docker** - Docker container management

### Join the Development Team

- **GitHub Repository:** https://github.com/fisherjoey/quest-canada-web-app
- **Project Board:** [GitHub Projects link]
- **Slack/Discord:** [Team communication link]

---

## Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/fisherjoey/quest-canada-web-app/issues)
2. Search the [Wasp documentation](https://wasp-lang.dev/docs)
3. Ask in team Slack/Discord channel
4. Create a new issue with:
   - Operating system and version
   - Error message (full stack trace)
   - Steps to reproduce
   - Output of `./setup-check.sh`

---

**Last Updated:** January 2025
**Maintained by:** Quest Canada Development Team
**Version:** 1.0.0
