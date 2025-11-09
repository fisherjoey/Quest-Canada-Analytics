# Open SaaS (Wasp) Setup Guide for Quest Canada

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation Requirements](#installation-requirements)
4. [Initial Setup](#initial-setup)
5. [Database Configuration](#database-configuration)
6. [Environment Variables](#environment-variables)
7. [Project Structure](#project-structure)
8. [Customization Guide](#customization-guide)
9. [Authentication Setup](#authentication-setup)
10. [Payment Integration](#payment-integration)
11. [User Roles & Permissions](#user-roles--permissions)
12. [Deployment](#deployment)
13. [Common Issues & Gotchas](#common-issues--gotchas)
14. [Configuration Checklist](#configuration-checklist)

---

## Overview

Open SaaS is a free, open-source SaaS application starter built on:
- **Wasp Framework** - Full-stack React, Node.js, and Prisma framework
- **React** - Frontend UI
- **Node.js** - Backend server
- **PostgreSQL** - Database (via Prisma ORM)
- **Tailwind CSS + ShadCN UI** - Styling and components
- **Stripe/Lemon Squeezy** - Payment processing
- **Astro Starlight** - Documentation and blog

### Key Features
- Full-stack authentication (email, Google, GitHub, Discord)
- End-to-end type safety
- Background jobs and cron scheduling
- Subscription and one-time payment support
- Admin dashboard
- AWS S3 file upload integration
- OpenAI API integration
- Analytics ready (Plausible/Google Analytics)
- One-command deployment (Railway/Fly.io)

**Repository:** https://github.com/wasp-lang/open-saas
**Documentation:** https://docs.opensaas.sh
**Live Demo:** https://opensaas.sh

---

## Prerequisites

### Required Software

1. **Node.js >= 22.12**
   - Install via [nvm](https://github.com/nvm-sh/nvm) (recommended) or [Node.js official site](https://nodejs.org/)
   - Verify: `node --version`

2. **NPM** (comes with Node.js)
   - Verify: `npm --version`

3. **Docker** (for PostgreSQL database)
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Ensure Docker is running before starting the app
   - Complete [post-install steps](https://docs.docker.com/engine/install/linux-postinstall/) for WSL users

4. **Git**
   - For version control and cloning repositories

### Platform-Specific Requirements

#### Windows Users (CRITICAL)
- **Must use WSL2** (Windows Subsystem for Linux) with Ubuntu
- Native Windows installation is NOT supported
- Git Bash/MSYS will NOT work
- **IMPORTANT:** Store project files on the Linux file system (NOT Windows file system) to enable proper file change detection

#### Apple Silicon Mac Users
- Install Rosetta translation layer:
  ```bash
  softwareupdate --install-rosetta
  ```

---

## Installation Requirements

### 1. Install Wasp

#### Linux and macOS
```bash
curl -sSL https://get.wasp.sh/installer.sh | sh
```

#### Windows (via WSL2)
First install WSL2, then run the same command in your Ubuntu terminal:
```bash
curl -sSL https://get.wasp.sh/installer.sh | sh
```

### 2. Verify Installation
```bash
wasp version
```

Expected output: Latest Wasp version (e.g., `0.13.2` or higher)

### 3. Install Wasp VSCode Extension (Optional but Recommended)
- Search for "Wasp" in VSCode extensions
- Provides syntax highlighting and autocompletion

---

## Initial Setup

### Clone the Template

Navigate to your desired project directory:

```bash
wasp new quest-canada-app
```

When prompted, select option `[3] saas` from the template list.

**Alternative Command:**
```bash
wasp new quest-canada-app -t saas
```

This creates a new directory `quest-canada-app` with the complete Open SaaS template.

### Project Root Structure

```
quest-canada-app/
├── app/              # Main Wasp project (React + Node.js)
├── blog/             # Astro Starlight documentation/blog
├── e2e-tests/        # Playwright end-to-end tests
└── README.md         # Project documentation
```

---

## Database Configuration

### Start PostgreSQL Database

Open a terminal in the `app/` directory:

```bash
cd quest-canada-app/app
wasp start db
```

This command:
- Starts a PostgreSQL database in Docker
- Automatically connects it to your app
- **Must remain running** - keep this terminal open during development

### Create Initial Database Migrations

```bash
wasp db migrate-dev
```

### View Database GUI (Optional)

To inspect your database:

```bash
wasp db studio
```

This opens Prisma Studio in your browser for viewing and editing database records.

---

## Environment Variables

### Server Environment Variables

1. Copy the example file:
   ```bash
   cp .env.server.example .env.server
   ```

2. Required variables in `.env.server`:

#### Database (Auto-configured by Wasp)
```env
DATABASE_URL=postgresql://...
```

#### Stripe Payment Configuration
```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/...
PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID=price_...
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_...
PAYMENTS_CREDITS_10_PLAN_ID=price_...
```

#### Email Service (Development uses Dummy provider)
```env
# For production with SendGrid:
SENDGRID_API_KEY=SG...
```

#### Social Authentication (Optional)
```env
# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub OAuth
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Discord OAuth
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
```

#### AWS S3 File Upload (Optional)
```env
AWS_S3_IAM_ACCESS_KEY_ID=...
AWS_S3_IAM_SECRET_ACCESS_KEY=...
AWS_S3_FILES_BUCKET=...
AWS_S3_REGION=...
```

#### OpenAI Integration (Optional)
```env
OPENAI_API_KEY=sk-...
```

#### Analytics (Optional)
```env
# Google Analytics
GOOGLE_ANALYTICS_ID=G-...

# Plausible Analytics
PLAUSIBLE_ANALYTICS_SCRIPT_URL=...
```

### Client Environment Variables

Create `.env.client` for public-facing API keys:

```env
REACT_APP_GOOGLE_ANALYTICS_ID=G-...
```

**Note:** Unused variables can be removed after implementing only needed features.

---

## Project Structure

### App Directory Structure

```
app/
├── src/
│   ├── admin/              # Admin dashboard pages and components
│   ├── analytics/          # Stats processing and background jobs
│   ├── auth/               # Authentication pages and logic
│   ├── client/             # Shared React components, hooks, landing page
│   │   ├── components/     # Reusable React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── icons/          # SVG icon library
│   │   ├── App.tsx         # Root app wrapper
│   │   └── Main.css        # Global styles
│   ├── demo-ai-app/        # Example AI-powered features
│   ├── file-upload/        # S3 integration logic
│   ├── landing-page/       # Marketing homepage
│   ├── messages/           # User messaging functionality
│   ├── payment/            # Stripe/Lemon Squeezy integration
│   ├── server/             # Server utilities and scripts
│   ├── shared/             # Shared constants and helpers
│   └── user/               # User account management
├── main.wasp               # Main configuration file (IMPORTANT)
├── schema.prisma           # Database schema (Prisma)
├── tailwind.config.js      # Tailwind CSS configuration
├── .env.server             # Server environment variables
├── .env.client             # Client environment variables
└── public/                 # Static assets
    └── static/             # Logos and images
```

### Feature-Based Organization

Open SaaS uses **vertical feature-based organization** where each feature folder contains both React (client) and Node.js (server) code together.

---

## Customization Guide

### 1. Branding & Visual Identity

#### Logo Replacement

Replace Quest Canada logo in:
- `app/public/favicon.ico` - Browser favicon
- `app/public/static/logo.webp` - Main application logo
- `app/public/public-banner.webp` - Social media preview image
- `app/public/static/open-saas-banner.webp` - Hero banner image

**Recommended formats:**
- Logo: PNG or WebP with transparency
- Banner: WebP or JPEG (1200x630px for social media)

#### Color Scheme (Quest Canada Colors)

Edit `app/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Quest Canada primary colors
        'quest-blue': '#003D7A',      // Primary blue
        'quest-orange': '#FF6B35',    // Accent orange
        'quest-gray': '#4A5568',      // Text gray
        'quest-light': '#F7FAFC',     // Background light

        // Override default brand colors
        'brand-primary': '#003D7A',
        'brand-secondary': '#FF6B35',
      }
    }
  }
}
```

**Global Styles:** Modify `app/src/client/Main.css` for additional custom styling.

#### Landing Page Content

Edit `app/src/landing-page/contentSections.ts`:

```typescript
export const navigation = {
  logo: "Quest Canada",
  // Navbar links
}

export const features = [
  // Feature cards
]

export const testimonials = [
  // Client testimonials
]

export const faqs = [
  // FAQ items
]
```

Edit `app/src/landing-page/landingPage.tsx` for structural changes.

#### App Title

Edit `app/main.wasp`:

```wasp
app QuestCanadaApp {
  wasp: { version: "^0.13.2" },
  title: "Quest Canada - Project Management",
  // ...
}
```

### 2. Database Schema Customization

Edit `app/schema.prisma` to modify database models:

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String?   @unique
  username             String?   @unique

  // Quest Canada specific fields
  organizationRole     String?   // e.g., "researcher", "coordinator", "admin"
  department           String?
  phoneNumber          String?

  // Existing Open SaaS fields
  isAdmin              Boolean   @default(false)
  subscriptionStatus   String?

  // Relations
  projects             Project[]
  tasks                Task[]
}

model Project {
  id                   String    @id @default(uuid())
  name                 String
  description          String?
  status               String    // e.g., "active", "completed", "on-hold"
  startDate            DateTime
  endDate              DateTime?
  budget               Decimal?

  // Relations
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  tasks                Task[]
}

model Task {
  id                   String    @id @default(uuid())
  title                String
  description          String?
  status               String
  priority             String?
  dueDate              DateTime?

  // Relations
  projectId            String
  project              Project   @relation(fields: [projectId], references: [id])
  assigneeId           String
  assignee             User      @relation(fields: [assigneeId], references: [id])
}
```

After schema changes, run:
```bash
wasp db migrate-dev
```

### 3. Connecting to Existing PostgreSQL Database

If Quest Canada already has a PostgreSQL database:

1. Edit `.env.server`:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
   ```

2. For Grafana integration (existing setup):
   ```env
   DATABASE_URL="postgresql://grafana_user:password@postgres.cpsc405.cjd9xqwi03fi.us-east-2.rds.amazonaws.com:5432/quest_canada"
   ```

3. Update `schema.prisma` to match existing database schema

4. Use Prisma introspection to generate models from existing database:
   ```bash
   wasp db pull
   ```

---

## Authentication Setup

### Configure Authentication Methods

Edit `app/main.wasp`:

```wasp
app QuestCanadaApp {
  // ...
  auth: {
    userEntity: User,
    methods: {
      email: {},        // Email/password auth (default enabled)
      // google: {},    // Uncomment to enable
      // gitHub: {},    // Uncomment to enable
      // discord: {},   // Uncomment to enable
    },
    onAuthFailedRedirectTo: "/",
    onAuthSucceededRedirectTo: "/dashboard"
  },

  emailSender: {
    provider: Dummy,  // Development: logs to console
    // provider: SendGrid,  // Production: uncomment and configure
    defaultFrom: {
      name: "Quest Canada",
      email: "noreply@questcanada.org"
    }
  }
}
```

### Email Verification Setup

#### Development (Default)
- Uses "Dummy" provider
- Verification links logged to console
- No external service needed

#### Production with SendGrid

1. Create SendGrid account and get API key

2. Update `main.wasp`:
   ```wasp
   emailSender: {
     provider: SendGrid,
     defaultFrom: {
       name: "Quest Canada",
       email: "noreply@questcanada.org"  // Must match SendGrid sender
     }
   }
   ```

3. Add to `.env.server`:
   ```env
   SENDGRID_API_KEY=SG...
   ```

### Social OAuth Configuration

#### Google Authentication

1. Create OAuth app in [Google Cloud Console](https://console.cloud.google.com/)
2. Get Client ID and Client Secret
3. Add to `.env.server`:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
4. Uncomment `google: {}` in `main.wasp`

#### GitHub Authentication

1. Create OAuth app in [GitHub Settings](https://github.com/settings/developers)
2. Get Client ID and Client Secret
3. Add to `.env.server`:
   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```
4. Uncomment `gitHub: {}` in `main.wasp`

Wasp automatically updates authentication UI when methods are enabled.

---

## Payment Integration

### Choose Payment Provider

Open SaaS supports:
- **Stripe** (Recommended)
- **Lemon Squeezy**
- Polar.sh (coming soon)
- Paddle (coming soon)

### Stripe Setup

#### 1. Select Stripe as Processor

Edit `app/src/payment/paymentProcessor.ts`:
```typescript
import { stripePaymentProcessor } from './stripe/paymentProcessor';

export const paymentProcessor = stripePaymentProcessor;
```

#### 2. Remove Unused Dependencies

```bash
npm uninstall @lemonsqueezy/lemonsqueezy.js
```

Clean up unused payment code from other providers.

#### 3. Get API Keys

1. Create Stripe account at https://stripe.com
2. Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/test/apikeys)
3. Reveal and copy "Secret key"
4. Add to `.env.server`:
   ```env
   STRIPE_API_KEY=sk_test_...
   ```

#### 4. Create Products

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add Product"
3. Select "Software as a service (SaaS)"

**For Subscriptions:**
- Select "Recurring"
- Add pricing tiers (e.g., Hobby $9/month, Pro $19/month)
- Copy Price IDs to `.env.server`:
  ```env
  PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID=price_...
  PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_...
  ```

**For One-Time Purchases (Credits):**
- Select "One-time"
- Set price (e.g., 10 credits for $10)
- Copy Price ID to `.env.server`:
  ```env
  PAYMENTS_CREDITS_10_PLAN_ID=price_...
  ```

#### 5. Configure Webhooks (Development)

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Start webhook listener:
```bash
stripe listen --forward-to localhost:3001/payments-webhook
```

Copy webhook signing secret (`whsec_...`) to `.env.server`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 6. Set Up Customer Portal

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Click "Activate"
3. Copy customer portal link
4. Add to `.env.server`:
   ```env
   STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/...
   ```
5. Enable "Subscriptions" > "Allow switching plans" (optional)

#### 7. Test Payment Flow

With Stripe CLI running:

1. Start app: `wasp start`
2. Navigate to payment page
3. Use test card: `4242 4242 4242 4242`
4. Expiration: Any future date
5. CVC: Any 3 digits
6. Verify in database: `wasp db studio`
7. Check `subscriptionStatus` is "active"

---

## User Roles & Permissions

### Default Roles

Open SaaS includes two built-in roles:

1. **Admin**
   - Access to Admin dashboard
   - View and edit user table
   - Manually update user information
   - Defined by `isAdmin: true` in User entity

2. **User**
   - Access to user-facing app
   - No Admin dashboard access

### Check Admin Status in Code

```typescript
// In a Wasp query or action
if (!context.user.isAdmin) {
  throw new HttpError(403, "Admin access required");
}
```

### Implementing Custom Roles (Quest Canada)

#### 1. Update Database Schema

Edit `app/schema.prisma`:

```prisma
model User {
  id       String   @id @default(uuid())
  email    String?  @unique
  isAdmin  Boolean  @default(false)

  // Add role field
  role     Role     @default(USER)

  // Optional: organization-specific role
  organizationRole  String?  // e.g., "project_manager", "researcher"
}

enum Role {
  SUPERADMIN        // Full system access
  ADMIN             // Organization admin
  PROJECT_MANAGER   // Can manage projects
  RESEARCHER        // Can view/edit own projects
  USER              // Basic access
}
```

Migrate database:
```bash
wasp db migrate-dev
```

#### 2. Create Permission Checks

Create `app/src/shared/permissions.ts`:

```typescript
import { User, Role } from '@wasp/entities';
import HttpError from '@wasp/core/HttpError';

export function requireRole(user: User, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw new HttpError(403, "Insufficient permissions");
  }
}

export function canManageProjects(user: User): boolean {
  return [Role.SUPERADMIN, Role.ADMIN, Role.PROJECT_MANAGER].includes(user.role);
}

export function canViewAllProjects(user: User): boolean {
  return [Role.SUPERADMIN, Role.ADMIN].includes(user.role);
}

export function canEditUser(currentUser: User, targetUser: User): boolean {
  if (currentUser.role === Role.SUPERADMIN) return true;
  if (currentUser.role === Role.ADMIN && targetUser.role !== Role.SUPERADMIN) return true;
  return currentUser.id === targetUser.id;  // Can edit own profile
}
```

#### 3. Use Permissions in Queries/Actions

Edit `app/main.wasp`:

```wasp
query getProjects {
  fn: import { getProjects } from "@src/project/operations",
  entities: [Project]
}

action createProject {
  fn: import { createProject } from "@src/project/operations",
  entities: [Project]
}
```

Edit `app/src/project/operations.ts`:

```typescript
import { Project, User } from '@wasp/entities';
import { GetProjects, CreateProject } from '@wasp/queries/types';
import { requireRole, canManageProjects } from '../shared/permissions';

export const getProjects: GetProjects<void, Project[]> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Authentication required");
  }

  // Admins see all projects, users see only their own
  if (canViewAllProjects(context.user)) {
    return context.entities.Project.findMany();
  }

  return context.entities.Project.findMany({
    where: { userId: context.user.id }
  });
};

export const createProject: CreateProject<ProjectData, Project> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Authentication required");
  }

  requireRole(context.user, [Role.SUPERADMIN, Role.ADMIN, Role.PROJECT_MANAGER]);

  return context.entities.Project.create({
    data: {
      ...args,
      userId: context.user.id
    }
  });
};
```

#### 4. Restrict Routes by Role

Edit `app/main.wasp`:

```wasp
route AdminDashboardRoute { path: "/admin", to: AdminDashboard }
page AdminDashboard {
  component: import { AdminDashboard } from "@src/admin/pages/Dashboard",
  authRequired: true
}
```

Edit `app/src/admin/pages/Dashboard.tsx`:

```typescript
import { useAuth } from '@wasp/auth/useAuth';
import { Role } from '@wasp/entities';
import { Navigate } from 'react-router-dom';

export function AdminDashboard() {
  const { data: user } = useAuth();

  if (!user || ![Role.SUPERADMIN, Role.ADMIN].includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <div>Admin Dashboard Content</div>;
}
```

### Best Practices for Authorization

1. **Layer of Indirection:** Use permission functions instead of checking roles directly
2. **Server-Side Validation:** Always validate permissions in Queries/Actions (never trust client)
3. **Client-Side UI:** Hide UI elements based on permissions for better UX
4. **Audit Logging:** Log permission checks for security compliance

---

## Deployment

### Deployment Options

Open SaaS supports one-command deployment to:
- **Fly.io** (Recommended)
- **Railway**

### Deploying to Fly.io

#### Prerequisites
- Fly.io account (free tier available)
- Fly CLI installed: https://fly.io/docs/hands-on/install-flyctl/

#### Deploy Command

```bash
wasp deploy fly launch quest-canada-app
```

This command:
- Creates Fly.io app
- Sets up PostgreSQL database
- Deploys client and server
- Configures environment variables

#### Set Environment Variables

```bash
wasp deploy fly cmd --context server secrets set \
  STRIPE_API_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  SENDGRID_API_KEY=SG... \
  # Add all production env vars
```

#### Configure Stripe Webhook (Production)

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://quest-canada-app-server.fly.dev/payments-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, etc.
4. Copy signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in Fly.io

#### Update Social Auth Redirects

Add production callback URLs to OAuth apps:
- Google: `https://quest-canada-app.fly.dev/auth/google/callback`
- GitHub: `https://quest-canada-app.fly.dev/auth/github/callback`

### Deploying to Railway

#### Deploy with One Click

1. Go to https://railway.com/deploy/open-saas
2. Click "Deploy Now"
3. Connect GitHub account
4. Fork repository to your account

#### Manual Deployment

```bash
wasp deploy railway launch quest-canada-app
```

#### Set Environment Variables

1. Open Railway dashboard
2. Select your project
3. Go to Variables tab
4. Add all production environment variables
5. Use Railway variable references: `${{Postgres.DATABASE_URL}}`

### Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] Stripe webhook endpoint configured
- [ ] Social auth redirect URLs updated
- [ ] Email sender configured (SendGrid)
- [ ] Analytics configured (optional)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Test payment flow with real card
- [ ] Test email verification flow
- [ ] Test social authentication
- [ ] Monitor logs for errors

---

## Common Issues & Gotchas

### Windows/WSL Issues

#### Issue: File changes not detected
**Symptom:** App doesn't reload when files are modified
**Cause:** Project stored on Windows file system instead of Linux file system
**Solution:**
- Move project to Linux file system (e.g., `~/projects/`)
- Access via WSL terminal, not Windows File Explorer
- Verify with: `pwd` (should show `/home/username/...` not `/mnt/c/...`)

#### Issue: Wasp installation fails in Git Bash
**Symptom:** Installer script errors or command not found
**Cause:** Git Bash/MSYS not supported
**Solution:**
- Must use WSL2 with Ubuntu
- Install WSL: `wsl --install`
- Run Wasp installer in WSL terminal

#### Issue: Docker not connecting in WSL
**Symptom:** `wasp start db` fails with connection error
**Cause:** Docker Desktop not properly configured for WSL
**Solution:**
- Enable WSL 2 integration in Docker Desktop settings
- Restart Docker Desktop
- Complete [Docker post-install steps](https://docs.docker.com/engine/install/linux-postinstall/)

### Database Issues

#### Issue: Database connection failed
**Symptom:** `Error: Can't reach database server`
**Cause:** Database not running or wrong `DATABASE_URL`
**Solution:**
- Ensure `wasp start db` is running in separate terminal
- Verify `DATABASE_URL` in `.env.server`
- Check Docker containers: `docker ps`

#### Issue: Migration fails with "relation already exists"
**Symptom:** Prisma migration error
**Cause:** Database state out of sync with schema
**Solution:**
- Reset database: `wasp db reset` (WARNING: deletes all data)
- Or manually fix in `wasp db studio`

#### Issue: Cannot connect to existing PostgreSQL
**Symptom:** Connection timeout or authentication failed
**Cause:** Firewall, wrong credentials, or SSL required
**Solution:**
- Verify connection string format
- Add `?sslmode=require` for cloud databases
- Check PostgreSQL allows external connections
- Verify user has proper permissions

### Build Issues

#### Issue: Vite/esbuild errors in dev mode
**Symptom:** "Symbol already declared" errors
**Cause:** Corrupt cache or dependency issues
**Solution:**
- Run: `wasp clean`
- Delete `node_modules`: `rm -rf node_modules`
- Reinstall: `wasp start` (auto-installs dependencies)

#### Issue: Node.js version incompatible
**Symptom:** Installation or build fails
**Cause:** Node.js version < 22.12
**Solution:**
- Update Node.js: `nvm install 22.12` or `nvm use 22.12`
- Verify: `node --version`

### Stripe/Payment Issues

#### Issue: Webhook not receiving events
**Symptom:** Payment completes but subscription not updated
**Cause:** Stripe CLI not running or wrong secret
**Solution (Development):**
- Ensure `stripe listen --forward-to localhost:3001/payments-webhook` is running
- Copy fresh webhook secret to `.env.server`
- Restart app: `wasp start`

**Solution (Production):**
- Verify webhook endpoint in Stripe dashboard
- Check webhook signing secret matches environment variable
- View webhook logs in Stripe dashboard for errors

#### Issue: "No prices found" error
**Symptom:** Payment page doesn't load
**Cause:** Missing or incorrect Price IDs in environment variables
**Solution:**
- Copy Price IDs from Stripe dashboard
- Verify environment variable names match exactly
- Restart server after updating `.env.server`

### Authentication Issues

#### Issue: Email verification link not working
**Symptom:** Click verification link, nothing happens
**Cause:** Email sender not configured or wrong redirect URL
**Solution (Development):**
- Check console for verification link
- Copy link manually to browser
- Ensure using `http://localhost:3000` not `127.0.0.1`

**Solution (Production):**
- Configure SendGrid API key
- Verify sender email in SendGrid
- Check email delivery logs

#### Issue: Social auth fails with redirect error
**Symptom:** "Redirect URI mismatch" error
**Cause:** Wrong callback URL in OAuth app settings
**Solution:**
- Development: `http://localhost:3000/auth/google/callback`
- Production: `https://yourdomain.com/auth/google/callback`
- Update in Google/GitHub OAuth settings

### Deployment Issues

#### Issue: Railway deployment crashed
**Symptom:** App shows as crashed immediately after deploy
**Cause:** Missing `DATABASE_URL` environment variable
**Solution:**
- Add database service in Railway
- Set `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- Redeploy

#### Issue: Fly.io health check failing
**Symptom:** "No healthy machines found"
**Cause:** App not listening on correct port or host
**Solution:**
- Verify app listens on `0.0.0.0` (not `localhost`)
- Check `internal_port` in `fly.toml` matches app port
- View logs: `wasp deploy fly cmd --context server logs`

#### Issue: Build succeeds but app shows 502 error
**Symptom:** Deployment successful but site unreachable
**Cause:** Environment variables not set or database not connected
**Solution:**
- Verify all required environment variables
- Check database connection string
- View server logs for detailed error

### Performance Issues

#### Issue: Slow first load after deployment
**Symptom:** 10-30 second initial page load
**Cause:** Cold start on free tier hosting
**Solution:**
- Normal behavior for free tier (machines sleep when idle)
- Upgrade to paid tier for always-on instances
- Or implement warming script to keep alive

#### Issue: Large bundle size
**Symptom:** Slow page loads, large JavaScript files
**Cause:** Importing entire libraries instead of specific components
**Solution:**
- Use tree-shaking compatible imports
- Lazy load routes with React.lazy()
- Remove unused dependencies

---

## Configuration Checklist

### Initial Setup
- [ ] Node.js >= 22.12 installed
- [ ] Docker installed and running
- [ ] Wasp CLI installed (`wasp version` works)
- [ ] VSCode Wasp extension installed (optional)
- [ ] Project created with `wasp new -t saas`

### Database Setup
- [ ] PostgreSQL running (`wasp start db`)
- [ ] Initial migrations created (`wasp db migrate-dev`)
- [ ] Can access database GUI (`wasp db studio`)
- [ ] Custom schema changes applied (if needed)
- [ ] Existing database connected (if applicable)

### Environment Variables
- [ ] `.env.server` created from `.env.server.example`
- [ ] `.env.client` created (if needed)
- [ ] All placeholder values replaced with real keys
- [ ] Unused variables removed

### Branding Customization
- [ ] App title changed in `main.wasp`
- [ ] Logo replaced in `public/static/logo.webp`
- [ ] Favicon replaced in `public/favicon.ico`
- [ ] Colors updated in `tailwind.config.js`
- [ ] Landing page content updated in `contentSections.ts`
- [ ] Hero banner replaced (if applicable)

### Authentication
- [ ] Email authentication tested
- [ ] Email verification working (Dummy in dev, SendGrid in prod)
- [ ] Social auth enabled (if needed)
- [ ] OAuth credentials configured (Google, GitHub, Discord)
- [ ] Redirect URLs set correctly

### Payment Integration (if applicable)
- [ ] Payment provider selected (Stripe/Lemon Squeezy)
- [ ] Stripe account created
- [ ] API keys configured
- [ ] Products and prices created
- [ ] Webhook endpoint configured
- [ ] Customer portal activated
- [ ] Test payment flow successful

### User Roles & Permissions
- [ ] Default admin user created
- [ ] Custom roles defined (if needed)
- [ ] Permission checks implemented
- [ ] Protected routes configured
- [ ] Authorization tested

### Deployment Preparation
- [ ] Production environment variables documented
- [ ] Deployment target chosen (Fly.io/Railway)
- [ ] Database migration strategy planned
- [ ] Monitoring/logging configured
- [ ] Backup strategy defined

### Pre-Launch Testing
- [ ] User registration flow tested
- [ ] Email verification tested
- [ ] Login/logout tested
- [ ] Payment flow tested (if applicable)
- [ ] Admin dashboard accessible
- [ ] Responsive design verified
- [ ] Cross-browser testing done
- [ ] Security audit completed

### Post-Deployment
- [ ] Production deployment successful
- [ ] SSL certificate active (HTTPS)
- [ ] Custom domain configured (if applicable)
- [ ] Production webhooks configured
- [ ] Social auth redirects updated
- [ ] Error monitoring active
- [ ] Analytics configured
- [ ] Backup schedule active
- [ ] Documentation updated

---

## Files That Need Customization for Quest Canada

### Essential Files

1. **`app/main.wasp`** - Core configuration
   - App name and title
   - Authentication methods
   - Email sender configuration
   - Routes and pages

2. **`app/schema.prisma`** - Database schema
   - User model (add Quest Canada fields)
   - Project model
   - Task/milestone models
   - Funding models
   - Custom relations

3. **`app/.env.server`** - Server environment variables
   - Database URL (existing Quest Canada DB)
   - Stripe keys (if payment needed)
   - Email service keys
   - AWS S3 keys (if file upload needed)

4. **`app/tailwind.config.js`** - Styling
   - Quest Canada brand colors
   - Custom theme extensions

5. **`app/src/landing-page/contentSections.ts`** - Landing page content
   - Navigation
   - Features
   - Testimonials
   - FAQs

6. **`app/src/landing-page/landingPage.tsx`** - Landing page structure
   - Hero section
   - Call-to-action buttons
   - Layout

### Branding Assets

7. **`app/public/favicon.ico`** - Browser icon
8. **`app/public/static/logo.webp`** - Main logo
9. **`app/public/public-banner.webp`** - Social preview
10. **`app/public/static/open-saas-banner.webp`** - Hero banner

### Custom Feature Implementation

11. **`app/src/project/`** (CREATE NEW) - Project management
    - Models, queries, actions
    - Project dashboard
    - Milestone tracking

12. **`app/src/funding/`** (CREATE NEW) - Funding management
    - Budget tracking
    - Expense reports
    - Financial dashboards

13. **`app/src/reporting/`** (CREATE NEW) - Report generation
    - Custom report templates
    - Data export functionality
    - Integration with existing Grafana dashboards

### Optional Files

14. **`app/src/client/Main.css`** - Global styles
15. **`app/src/admin/pages/Dashboard.tsx`** - Admin dashboard
16. **`blog/`** - Documentation and blog (optional)

---

## Next Steps

1. **Complete this setup guide** following each section
2. **Test the vanilla Open SaaS** to understand default functionality
3. **Plan Quest Canada specific features:**
   - Project management workflows
   - Milestone tracking
   - Funding management
   - Reporting and analytics
   - Integration with existing Grafana dashboards
4. **Customize database schema** for Quest Canada data model
5. **Implement custom features** one at a time
6. **Test thoroughly** in development
7. **Deploy to staging** environment
8. **User acceptance testing**
9. **Deploy to production**

---

## Additional Resources

### Official Documentation
- **Wasp Docs:** https://wasp.sh/docs
- **Open SaaS Docs:** https://docs.opensaas.sh
- **Prisma Docs:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Community Support
- **Wasp Discord:** https://discord.gg/aCamt5wCpS
- **GitHub Issues:** https://github.com/wasp-lang/open-saas/issues
- **GitHub Discussions:** https://github.com/wasp-lang/wasp/discussions

### Integration Guides
- **Stripe Integration:** https://docs.opensaas.sh/guides/payments-integration/
- **Email Setup:** https://wasp.sh/docs/guides/email-sending
- **Deployment Guide:** https://docs.opensaas.sh/guides/deploying/
- **Authentication:** https://docs.opensaas.sh/guides/authentication/

---

## Conclusion

This setup guide provides a comprehensive roadmap for implementing Open SaaS for the Quest Canada project. The template offers significant advantages:

- **Rapid Development:** Pre-built authentication, payments, and admin features
- **Type Safety:** End-to-end TypeScript with Prisma
- **Modern Stack:** React, Node.js, PostgreSQL, Tailwind CSS
- **Production Ready:** Built-in deployment, monitoring, and scaling

By following this guide, you'll have a solid foundation for building Quest Canada's web application while leveraging industry best practices and avoiding common pitfalls.

**Remember:** Start with the vanilla template, understand how it works, then customize incrementally. Don't try to customize everything at once.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-09
**Prepared for:** Quest Canada Project Team
**Prepared by:** Agent 1 - Open SaaS Setup Specialist
