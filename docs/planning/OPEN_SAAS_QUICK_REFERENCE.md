# Open SaaS Quick Reference Guide

## Quick Start Commands

```bash
# Install Wasp (Linux/macOS/WSL)
curl -sSL https://get.wasp.sh/installer.sh | sh

# Create new project
wasp new quest-canada-app -t saas

# Navigate to app directory
cd quest-canada-app/app

# Start database (keep terminal open)
wasp start db

# Run migrations (new terminal)
wasp db migrate-dev

# Start application
wasp start
```

**Access:**
- Client: http://localhost:3000
- Server: http://localhost:3001
- Database GUI: `wasp db studio`

---

## Essential Files to Customize

### Configuration
- `app/main.wasp` - App name, auth, routes
- `app/schema.prisma` - Database models
- `app/.env.server` - Environment variables
- `app/tailwind.config.js` - Styling/colors

### Branding
- `app/public/favicon.ico` - Browser icon
- `app/public/static/logo.webp` - Logo
- `app/src/landing-page/contentSections.ts` - Content

### Custom Features (Create New)
- `app/src/project/` - Project management
- `app/src/funding/` - Funding tracking
- `app/src/milestones/` - Milestone tracking

---

## Quest Canada Colors

```javascript
// Add to tailwind.config.js
colors: {
  'quest-blue': '#003D7A',
  'quest-orange': '#FF6B35',
  'quest-gray': '#4A5568',
  'quest-light': '#F7FAFC',
}
```

---

## Common Commands

```bash
# Database
wasp start db          # Start PostgreSQL
wasp db migrate-dev    # Create migration
wasp db studio         # Open database GUI
wasp db reset          # Reset database (deletes data!)

# Development
wasp start             # Start dev server
wasp clean             # Clear cache (if issues)

# Production
wasp deploy fly launch quest-canada-app    # Deploy to Fly.io
wasp deploy railway launch quest-canada-app # Deploy to Railway

# Testing
wasp test              # Run tests (if configured)
```

---

## Critical Windows Users

- MUST use WSL2 (Ubuntu)
- Store project on Linux filesystem (~/projects/)
- NOT on Windows filesystem (/mnt/c/)
- Git Bash/MSYS will NOT work

---

## Minimum Requirements

- Node.js >= 22.12
- Docker (running)
- WSL2 (Windows only)
- Rosetta (Apple Silicon Macs)

---

## Environment Variables Template

```env
# .env.server

# Database (auto-configured)
DATABASE_URL=postgresql://...

# Email (Dev: Dummy, Prod: SendGrid)
SENDGRID_API_KEY=SG...

# Stripe (if needed)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Social Auth (if needed)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AWS S3 (if needed)
AWS_S3_IAM_ACCESS_KEY_ID=...
AWS_S3_IAM_SECRET_ACCESS_KEY=...
```

---

## Troubleshooting Quick Fixes

### File changes not detected (WSL)
```bash
# Move project to Linux filesystem
mv /mnt/c/project ~/projects/
```

### Build errors
```bash
wasp clean
rm -rf node_modules
wasp start
```

### Database connection issues
```bash
# Verify Docker running
docker ps

# Restart database
wasp start db
```

### Stripe webhook not working
```bash
# Ensure Stripe CLI running
stripe listen --forward-to localhost:3001/payments-webhook

# Copy webhook secret to .env.server
```

---

## Project Structure Quick Reference

```
app/
├── main.wasp              # Main config
├── schema.prisma          # Database
├── .env.server            # Secrets
├── tailwind.config.js     # Styling
└── src/
    ├── admin/             # Admin dashboard
    ├── auth/              # Login/signup
    ├── client/            # Components
    ├── landing-page/      # Homepage
    ├── payment/           # Stripe
    └── user/              # User management
```

---

## Quest Canada Database Schema Example

```prisma
// schema.prisma

model User {
  id                   String    @id @default(uuid())
  email                String?   @unique
  isAdmin              Boolean   @default(false)

  // Quest Canada fields
  organizationRole     String?
  department           String?

  projects             Project[]
}

model Project {
  id          String    @id @default(uuid())
  name        String
  status      String
  startDate   DateTime
  endDate     DateTime?
  budget      Decimal?

  userId      String
  user        User      @relation(fields: [userId], references: [id])
  milestones  Milestone[]
}

model Milestone {
  id          String    @id @default(uuid())
  title       String
  dueDate     DateTime
  status      String

  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
}
```

After changes: `wasp db migrate-dev`

---

## Deployment Quick Guide

### Fly.io (Recommended)
```bash
# Deploy
wasp deploy fly launch quest-canada-app

# Set secrets
wasp deploy fly cmd --context server secrets set \
  STRIPE_API_KEY=sk_live_...

# View logs
wasp deploy fly cmd --context server logs
```

### Railway
```bash
# Deploy
wasp deploy railway launch quest-canada-app

# Or one-click: https://railway.com/deploy/open-saas
```

---

## Key Resources

- Setup Guide: `SETUP_GUIDE_OPEN_SAAS.md` (36 KB, comprehensive)
- Research Summary: `OPEN_SAAS_RESEARCH_SUMMARY.md` (23 KB)
- Wasp Docs: https://wasp.sh/docs
- Open SaaS Docs: https://docs.opensaas.sh
- Discord: https://discord.gg/aCamt5wCpS

---

## Configuration Checklist

### Initial Setup
- [ ] Node.js >= 22.12 installed
- [ ] Docker installed and running
- [ ] Wasp CLI installed
- [ ] Project created with `wasp new -t saas`
- [ ] Database running (`wasp start db`)
- [ ] Initial migrations (`wasp db migrate-dev`)

### Customization
- [ ] App title changed in `main.wasp`
- [ ] Logo replaced
- [ ] Colors updated in `tailwind.config.js`
- [ ] Landing page content updated
- [ ] Database schema customized
- [ ] `.env.server` configured

### Testing
- [ ] App starts successfully
- [ ] Can register new user
- [ ] Email verification works
- [ ] Database accessible via `wasp db studio`
- [ ] Custom features working

### Deployment
- [ ] Production environment variables set
- [ ] Deployment successful
- [ ] SSL active (HTTPS)
- [ ] Webhooks configured (if using Stripe)
- [ ] Social auth redirects updated (if enabled)

---

**Last Updated:** 2025-11-09
**Version:** 1.0
