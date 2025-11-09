# Quest Canada + Open SaaS Schema Integration Guide

**Version:** 1.0
**Date:** January 2025
**Author:** Agent 7 - Prisma Schema Integration Specialist
**Purpose:** Comprehensive guide for integrating Quest Canada's custom Prisma schema with Open SaaS boilerplate

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Schema Analysis](#schema-analysis)
3. [Integration Strategy](#integration-strategy)
4. [Field Mapping](#field-mapping)
5. [Conflict Resolution](#conflict-resolution)
6. [Migration Plan](#migration-plan)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Instructions](#deployment-instructions)
9. [Troubleshooting](#troubleshooting)
10. [Reference](#reference)

---

## Executive Summary

### What This Guide Covers

This document explains how the Quest Canada custom database schema (10 tables, multi-tenancy support) has been merged with Open SaaS's default authentication and subscription schema to create a unified data model that supports:

- **Open SaaS Features:** Authentication, admin dashboard, user management, optional payments
- **Quest Canada Features:** Multi-tenant communities, assessments, projects, funding, milestones, AI extraction

### Key Integration Points

| Component | Open SaaS | Quest Canada | Merged Solution |
|-----------|-----------|--------------|-----------------|
| User Model | Basic auth fields | Enhanced with roles & multi-tenancy | Combined model with all fields |
| Authentication | Wasp framework | Custom password hashing | Uses Wasp auth with Quest Canada extensions |
| Admin Access | `isAdmin` boolean | `ADMIN` role enum | Both fields maintained for compatibility |
| Multi-tenancy | Not built-in | `communityId` foreign key | Quest Canada approach preserved |
| Payments | Stripe integration | Not needed | Optional - can be removed if not used |

### Files Created

1. **`schema.merged.prisma`** - Combined Prisma schema (Open SaaS + Quest Canada)
2. **`seed.merged.ts`** - Seed script with demo data compatible with both systems
3. **`SCHEMA_INTEGRATION_GUIDE.md`** - This documentation

---

## Schema Analysis

### Open SaaS Default Schema

Open SaaS (via Wasp framework) provides:

#### User Model (Core)
```prisma
model User {
  id                   String   @id @default(uuid())
  email                String?  @unique
  username             String?  @unique
  isAdmin              Boolean  @default(false)

  // Payment fields (if using Stripe)
  subscriptionStatus   String?
  stripeId             String?  @unique
  credits              Int      @default(0)

  // Auth tracking
  emailVerified        Boolean  @default(false)
  emailVerificationSentAt DateTime?
  passwordResetSentAt  DateTime?
  lastActiveTimestamp  DateTime?
}
```

#### Session Model (Wasp Auto-Generated)
Wasp automatically handles sessions - no explicit model needed in schema.

#### Optional Features
- `Task` model (simple todo list)
- `File` model (if using file uploads)
- `GptResponse` model (if using OpenAI integration)

**Total Tables:** 2-5 depending on features enabled

---

### Quest Canada Custom Schema

Quest Canada's standalone schema includes:

#### User Model
```prisma
model User {
  id               String   @id @default(uuid())
  email            String   @unique
  passwordHash     String
  firstName        String?
  lastName         String?
  role             Role     @default(COMMUNITY_STAFF)
  communityId      String?

  // Email verification
  emailVerified    Boolean  @default(false)
  verificationToken String? @unique
  resetToken       String?  @unique
  resetTokenExpiry DateTime?
}

enum Role {
  ADMIN
  COMMUNITY_STAFF
  FUNDER
  PUBLIC_VIEWER
}
```

#### Additional Models
1. **Community** - Multi-tenant municipality data
2. **Assessment** - Quest Canada benchmark assessments
3. **IndicatorScore** - Assessment indicator details
4. **Strength** - Community strengths
5. **Recommendation** - Improvement recommendations
6. **Project** - Climate action projects
7. **Funding** - Project funding sources
8. **Milestone** - Project milestones
9. **AiExtractionLog** - AI document processing audit

**Total Tables:** 10

---

## Integration Strategy

### Approach: Additive Merge

We chose an **additive merge** strategy rather than replacement:

1. **Keep Open SaaS Core** - Preserve all authentication and session management
2. **Add Quest Canada Extensions** - Append custom fields to User model
3. **Preserve Quest Canada Models** - Add all 9 custom models unchanged
4. **Maintain Compatibility** - Ensure both systems work simultaneously

### Why This Approach?

- **Minimal Risk:** Open SaaS features continue to work out-of-the-box
- **Maximum Flexibility:** Can use or ignore payment features as needed
- **Future-Proof:** Easy to add/remove Open SaaS features later
- **Type Safety:** Full TypeScript support maintained

---

## Field Mapping

### User Model Field Mapping

The merged User model combines fields from both schemas:

| Field | Source | Purpose | Required? | Default |
|-------|--------|---------|-----------|---------|
| **Core Identity** |
| `id` | Both | Primary key | Yes | `uuid()` |
| `email` | Both | Email address | No* | - |
| `username` | Open SaaS | Username (alternative to email) | No | - |
| **Authentication** |
| `passwordHash` | Quest Canada | Hashed password | No** | - |
| `emailVerified` | Both | Email verification status | Yes | `false` |
| `verificationToken` | Quest Canada | Legacy email verification | No | - |
| `resetToken` | Quest Canada | Legacy password reset | No | - |
| `resetTokenExpiry` | Quest Canada | Token expiration | No | - |
| `emailVerificationSentAt` | Open SaaS | Wasp auth tracking | No | - |
| `passwordResetSentAt` | Open SaaS | Wasp auth tracking | No | - |
| **Profile** |
| `firstName` | Quest Canada | User first name | No | - |
| `lastName` | Quest Canada | User last name | No | - |
| **Access Control** |
| `isAdmin` | Open SaaS | Admin dashboard access | Yes | `false` |
| `role` | Quest Canada | Granular role system | Yes | `COMMUNITY_STAFF` |
| `isActive` | Quest Canada | Soft delete flag | Yes | `true` |
| **Multi-Tenancy** |
| `communityId` | Quest Canada | Community assignment | No | - |
| **Payments (Optional)** |
| `subscriptionStatus` | Open SaaS | Stripe subscription | No | - |
| `stripeId` | Open SaaS | Stripe customer ID | No | - |
| `checkoutSessionId` | Open SaaS | Payment tracking | No | - |
| `credits` | Open SaaS | Credit balance | Yes | `0` |
| **Audit** |
| `createdAt` | Both | Creation timestamp | Yes | `now()` |
| `updatedAt` | Both | Last update timestamp | Yes | Auto |
| `lastLoginAt` | Quest Canada | Last login time | No | - |
| `lastActiveTimestamp` | Open SaaS | Activity tracking | No | - |

\* Email optional to support username-only auth
** PasswordHash null if using OAuth

### Role Mapping Strategy

We maintain **both** role systems for maximum compatibility:

| Open SaaS | Quest Canada | Merged Approach |
|-----------|--------------|-----------------|
| `isAdmin: true` | `role: ADMIN` | Set both for admin users |
| `isAdmin: false` | `role: COMMUNITY_STAFF` | Most common user type |
| N/A | `role: FUNDER` | Quest Canada specific |
| N/A | `role: PUBLIC_VIEWER` | Quest Canada specific |

**Implementation:**
```typescript
// Creating admin user
const admin = await prisma.user.create({
  data: {
    email: 'admin@example.com',
    role: 'ADMIN',
    isAdmin: true, // Set both!
  }
});

// Checking permissions
function canAccessAdminDashboard(user: User): boolean {
  return user.isAdmin; // Open SaaS uses this
}

function canManageCommunity(user: User, communityId: string): boolean {
  return user.role === 'ADMIN' || user.communityId === communityId;
}
```

---

## Conflict Resolution

### Potential Conflicts and Solutions

#### 1. Email Field Optionality

**Conflict:**
- Open SaaS: `email String? @unique` (optional for username auth)
- Quest Canada: `email String @unique` (required)

**Resolution:**
Use Open SaaS approach - make email optional to support username-only authentication.

```prisma
email String? @unique // Merged: Optional
```

**Impact:** Quest Canada code must handle null emails if username auth is enabled.

---

#### 2. Password Hashing

**Conflict:**
- Open SaaS: Password hashing handled internally by Wasp
- Quest Canada: Manual bcrypt hashing with `passwordHash` field

**Resolution:**
Keep `passwordHash` field for compatibility but allow null for OAuth-only users.

```prisma
passwordHash String? @map("password_hash") // Merged: Optional
```

**Wasp Integration:**
Wasp will manage its own password hashing. The `passwordHash` field is for Quest Canada-specific use cases or as a backup.

---

#### 3. Email Verification Tokens

**Conflict:**
- Open SaaS: Uses Wasp's internal verification system (`emailVerificationSentAt`)
- Quest Canada: Uses custom tokens (`verificationToken`, `resetToken`)

**Resolution:**
Keep both systems. Wasp will use its built-in mechanism; Quest Canada tokens remain for legacy support.

```prisma
// Wasp auth
emailVerificationSentAt DateTime? @map("email_verification_sent_at")
passwordResetSentAt     DateTime? @map("password_reset_sent_at")

// Quest Canada legacy
verificationToken String? @unique @map("verification_token")
resetToken        String? @unique @map("reset_token")
resetTokenExpiry  DateTime? @map("reset_token_expiry")
```

**Migration Path:**
Over time, migrate from Quest Canada tokens to Wasp's system. Keep both during transition.

---

#### 4. Admin Role vs. isAdmin Flag

**Conflict:**
- Open SaaS: Binary `isAdmin` boolean
- Quest Canada: Multi-level `Role` enum

**Resolution:**
Maintain both. Map `ADMIN` role to `isAdmin: true`.

```typescript
// Seed script example
const admin = await prisma.user.create({
  data: {
    email: 'admin@questcanada.org',
    role: 'ADMIN',
    isAdmin: true, // Explicitly set both!
  },
});
```

**Best Practice:**
```typescript
// Permission checking function
function isSystemAdmin(user: User): boolean {
  return user.isAdmin || user.role === 'ADMIN';
}
```

---

#### 5. Table Naming Conventions

**Conflict:**
- Open SaaS: Uses `@@map()` sparingly
- Quest Canada: Uses `@@map()` extensively for snake_case database names

**Resolution:**
Preserve Quest Canada's snake_case database table names for consistency.

```prisma
model User {
  // ...
  @@map("users")
}

model Community {
  // ...
  @@map("communities")
}
```

**Why:** Database naming consistency is critical for existing integrations (Grafana, backups, etc.)

---

## Migration Plan

### Phase 1: Initial Setup (Week 1)

#### Step 1: Create Wasp Project
```bash
# Install Wasp
curl -sSL https://get.wasp.sh/installer.sh | sh

# Create new project with Open SaaS template
wasp new quest-canada-app -t saas

cd quest-canada-app/app
```

#### Step 2: Replace Schema
```bash
# Backup original schema
cp schema.prisma schema.prisma.backup

# Copy merged schema
cp ../../quest-canada-web-app/prisma/schema.merged.prisma schema.prisma
```

#### Step 3: Update Wasp Configuration

Edit `main.wasp` to configure authentication:

```wasp
app QuestCanadaApp {
  wasp: { version: "^0.13.2" },
  title: "Quest Canada - Project Management",

  auth: {
    userEntity: User,
    methods: {
      email: {
        // Email/password authentication
        fromField: {
          name: "Quest Canada",
          email: "noreply@questcanada.org"
        },
        emailVerification: {
          clientRoute: EmailVerificationRoute,
          getEmailContentFn: import { getVerificationEmailContent } from "@src/auth/email"
        },
        passwordReset: {
          clientRoute: PasswordResetRoute,
          getEmailContentFn: import { getPasswordResetEmailContent } from "@src/auth/email"
        }
      },
    },
    onAuthFailedRedirectTo: "/",
    onAuthSucceededRedirectTo: "/dashboard"
  },

  db: {
    seeds: [
      import { seedDatabase } from "@src/server/seeds"
    ]
  }
}
```

#### Step 4: Run Initial Migration
```bash
# Start database
wasp start db

# Create initial migration
wasp db migrate-dev --name "init-merged-schema"

# Verify migration
wasp db studio
```

---

### Phase 2: Seed Data (Week 1)

#### Step 1: Copy Seed Script
```bash
cp ../../quest-canada-web-app/prisma/seed.merged.ts src/server/seeds.ts
```

#### Step 2: Update Package Dependencies

Add to `package.json`:
```json
{
  "dependencies": {
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2"
  }
}
```

#### Step 3: Run Seed
```bash
wasp db seed
```

#### Step 4: Verify Data
```bash
wasp db studio
# Check:
# - 5 users created
# - 3 communities
# - 5 assessments
# - Projects, funding, milestones populated
```

---

### Phase 3: Test Authentication (Week 2)

#### Test Cases

1. **Email Login**
   - Use: `admin@questcanada.org` / `QuestCanada2025!`
   - Verify: Can access admin dashboard
   - Check: `isAdmin` flag is true

2. **Username Login** (if enabled)
   - Use: `admin` / `QuestCanada2025!`
   - Verify: Same user, different login method

3. **Email Verification**
   - Create new user
   - Check console for verification link
   - Verify email verification flow

4. **Password Reset**
   - Trigger password reset
   - Check console for reset link
   - Verify reset flow

5. **Role-Based Access**
   - Login as `staff@calgary.ca`
   - Verify: Can only see Calgary data
   - Verify: Cannot access admin dashboard

---

### Phase 4: Custom Features (Weeks 3-4)

#### Step 1: Create Quest Canada Queries

Create `src/server/queries.ts`:
```typescript
import { Project, Community, Assessment } from '@wasp/entities';
import { GetProjects } from '@wasp/queries/types';
import { HttpError } from '@wasp/core/HttpError';

export const getProjects: GetProjects<{ communityId?: string }, Project[]> =
  async (args, context) => {
    if (!context.user) {
      throw new HttpError(401, "Authentication required");
    }

    // Admin sees all, community staff see only their community
    const where = context.user.role === 'ADMIN'
      ? {}
      : { communityId: context.user.communityId };

    return context.entities.Project.findMany({
      where,
      include: {
        community: true,
        fundingSources: true,
        milestones: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  };
```

#### Step 2: Create Quest Canada Actions

Create `src/server/actions.ts`:
```typescript
import { Project } from '@wasp/entities';
import { CreateProject } from '@wasp/actions/types';
import { HttpError } from '@wasp/core/HttpError';

type CreateProjectInput = {
  projectCode: string;
  projectName: string;
  description?: string;
  sector: string;
  communityId: string;
};

export const createProject: CreateProject<CreateProjectInput, Project> =
  async (args, context) => {
    if (!context.user) {
      throw new HttpError(401, "Authentication required");
    }

    // Check permissions
    if (context.user.role !== 'ADMIN' &&
        context.user.communityId !== args.communityId) {
      throw new HttpError(403, "Cannot create projects for other communities");
    }

    return context.entities.Project.create({
      data: {
        ...args,
        status: 'PLANNED',
        createdBy: context.user.id,
      },
    });
  };
```

#### Step 3: Define in main.wasp
```wasp
query getProjects {
  fn: import { getProjects } from "@src/server/queries",
  entities: [Project, Community, Funding, Milestone]
}

action createProject {
  fn: import { createProject } from "@src/server/actions",
  entities: [Project]
}
```

---

### Phase 5: UI Integration (Weeks 5-6)

#### Step 1: Create Project Dashboard Page

Create `src/client/pages/ProjectsPage.tsx`:
```tsx
import { useQuery } from '@wasp/queries';
import { getProjects } from '@wasp/queries/getProjects';
import { useAuth } from '@wasp/auth/useAuth';

export function ProjectsPage() {
  const { data: user } = useAuth();
  const { data: projects, isLoading } = useQuery(getProjects);

  if (isLoading) return <div>Loading projects...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>

      <div className="grid gap-4">
        {projects?.map((project) => (
          <div key={project.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold">{project.projectName}</h2>
            <p className="text-gray-600">{project.description}</p>
            <div className="mt-2 flex gap-4 text-sm">
              <span>Status: {project.status}</span>
              <span>Progress: {project.completionPercentage}%</span>
              <span>Budget: ${project.totalBudget?.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Step 2: Add Route to main.wasp
```wasp
route ProjectsRoute { path: "/projects", to: ProjectsPage }
page ProjectsPage {
  component: import { ProjectsPage } from "@src/client/pages/ProjectsPage",
  authRequired: true
}
```

---

## Testing Strategy

### Unit Tests

#### Test User Creation
```typescript
import { PrismaClient } from '@prisma/client';

describe('User Model', () => {
  const prisma = new PrismaClient();

  it('should create admin user with both role and isAdmin set', async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin@example.com',
        role: 'ADMIN',
        isAdmin: true,
        emailVerified: true,
      },
    });

    expect(admin.role).toBe('ADMIN');
    expect(admin.isAdmin).toBe(true);
  });

  it('should enforce community_id for COMMUNITY_STAFF', async () => {
    const community = await prisma.community.create({
      data: { name: 'Test City', province: 'AB' },
    });

    const staff = await prisma.user.create({
      data: {
        email: 'staff@testcity.ca',
        role: 'COMMUNITY_STAFF',
        communityId: community.id,
      },
    });

    expect(staff.communityId).toBe(community.id);
  });
});
```

#### Test Multi-Tenancy
```typescript
describe('Multi-Tenancy', () => {
  it('should isolate projects by community', async () => {
    const calgary = await prisma.community.create({
      data: { name: 'Calgary Test', province: 'AB' },
    });

    const edmonton = await prisma.community.create({
      data: { name: 'Edmonton Test', province: 'AB' },
    });

    await prisma.project.create({
      data: {
        projectCode: 'CGY-TEST-001',
        projectName: 'Calgary Project',
        communityId: calgary.id,
        sector: 'BUILDINGS',
      },
    });

    const calgaryProjects = await prisma.project.findMany({
      where: { communityId: calgary.id },
    });

    expect(calgaryProjects.length).toBe(1);
    expect(calgaryProjects[0].projectName).toBe('Calgary Project');
  });
});
```

---

### Integration Tests

#### Test Authentication Flow
```typescript
describe('Authentication', () => {
  it('should login with email and verify role', async () => {
    const response = await fetch('http://localhost:3001/auth/email/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@questcanada.org',
        password: 'QuestCanada2025!',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.user.role).toBe('ADMIN');
    expect(data.user.isAdmin).toBe(true);
  });
});
```

#### Test Query Permissions
```typescript
describe('Query Permissions', () => {
  it('should restrict community staff to their community', async () => {
    const staffUser = await prisma.user.findUnique({
      where: { email: 'staff@calgary.ca' },
    });

    const projects = await getProjects(
      {},
      { user: staffUser, entities: prisma }
    );

    // Staff should only see Calgary projects
    expect(projects.every(p => p.communityId === staffUser.communityId)).toBe(true);
  });

  it('should allow admin to see all projects', async () => {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@questcanada.org' },
    });

    const projects = await getProjects(
      {},
      { user: adminUser, entities: prisma }
    );

    // Admin sees projects from all communities
    const communities = new Set(projects.map(p => p.communityId));
    expect(communities.size).toBeGreaterThan(1);
  });
});
```

---

## Deployment Instructions

### Development Environment

```bash
# 1. Start database
wasp start db

# 2. Run migrations
wasp db migrate-dev

# 3. Seed database
wasp db seed

# 4. Start development server
wasp start
```

Access at:
- Client: http://localhost:3000
- Server: http://localhost:3001
- Database: http://localhost:5432

---

### Production Deployment (Fly.io)

#### Step 1: Prepare Environment Variables

Create `.env.server.production`:
```env
DATABASE_URL="postgresql://username:password@host:5432/quest_canada_prod?schema=public"
WASP_WEB_CLIENT_URL="https://quest-canada.fly.dev"
WASP_SERVER_URL="https://quest-canada-server.fly.dev"

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx

# Optional: Stripe (if using payments)
STRIPE_API_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Optional: OAuth
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
```

#### Step 2: Deploy
```bash
# Deploy to Fly.io
wasp deploy fly launch quest-canada-app

# Set environment variables
wasp deploy fly cmd --context server secrets set \
  DATABASE_URL="postgresql://..." \
  SENDGRID_API_KEY="SG...."

# Run production migration
wasp deploy fly cmd --context server -- npx prisma migrate deploy

# Seed production database (first time only)
wasp deploy fly cmd --context server -- npm run seed
```

#### Step 3: Verify Deployment
```bash
# Check logs
wasp deploy fly cmd --context server logs

# Test login
curl -X POST https://quest-canada-server.fly.dev/auth/email/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@questcanada.org","password":"QuestCanada2025!"}'
```

---

## Troubleshooting

### Issue 1: Migration Fails - "Column already exists"

**Symptom:**
```
Error: Column "email_verified" already exists
```

**Cause:** Database state out of sync with schema

**Solution:**
```bash
# Development: Reset database
wasp db reset

# Production: Create manual migration
wasp db migrate-dev --create-only
# Edit migration file to handle existing columns
# Then apply:
wasp db migrate-dev
```

---

### Issue 2: User Login Fails - "Invalid credentials"

**Symptom:**
```
401 Unauthorized - Invalid credentials
```

**Possible Causes:**
1. Password hash mismatch (Wasp vs. bcrypt)
2. Email not verified
3. User inactive

**Solution:**
```typescript
// Check user in database
const user = await prisma.user.findUnique({
  where: { email: 'admin@questcanada.org' },
});

console.log({
  exists: !!user,
  emailVerified: user?.emailVerified,
  isActive: user?.isActive,
  hasPassword: !!user?.passwordHash,
});

// Reset password via seed script or manual update
```

---

### Issue 3: Admin Dashboard Access Denied

**Symptom:**
```
403 Forbidden - Admin access required
```

**Cause:** `isAdmin` flag not set correctly

**Solution:**
```typescript
// Ensure both role and isAdmin are set for admin users
await prisma.user.update({
  where: { email: 'admin@questcanada.org' },
  data: {
    role: 'ADMIN',
    isAdmin: true, // Must set this!
  },
});
```

---

### Issue 4: Multi-Tenancy Leaking Data

**Symptom:** Users see data from other communities

**Cause:** Missing `communityId` filter in queries

**Solution:**
```typescript
// Always filter by communityId for non-admin users
export const getProjects: GetProjects<void, Project[]> = async (args, context) => {
  const where = context.user.role === 'ADMIN'
    ? {} // Admin sees all
    : { communityId: context.user.communityId }; // Filter by community

  return context.entities.Project.findMany({ where });
};
```

---

### Issue 5: Seed Script Fails - "Unique constraint violation"

**Symptom:**
```
Error: Unique constraint failed on the fields: (`email`)
```

**Cause:** Running seed multiple times

**Solution:**
```bash
# Clear database before re-seeding
wasp db reset

# Or update seed script to use upsert
await prisma.user.upsert({
  where: { email: 'admin@questcanada.org' },
  update: {},
  create: { /* ... */ },
});
```

---

## Reference

### File Locations

| File | Location | Purpose |
|------|----------|---------|
| Merged Schema | `quest-canada-web-app/prisma/schema.merged.prisma` | Combined Prisma schema |
| Merged Seed | `quest-canada-web-app/prisma/seed.merged.ts` | Seed script with demo data |
| Integration Guide | `quest-canada-web-app/prisma/SCHEMA_INTEGRATION_GUIDE.md` | This document |
| Original Quest Schema | `quest-canada-web-app/docs/database/schema.prisma` | Reference only |
| Original Quest Seed | `quest-canada-web-app/docs/database/seed.ts` | Reference only |

---

### Key Differences: Standalone vs. Merged

| Aspect | Quest Canada Standalone | Merged with Open SaaS |
|--------|-------------------------|----------------------|
| Authentication | Manual bcrypt + custom tokens | Wasp framework managed |
| User Model | 15 fields | 25+ fields (combined) |
| Admin Check | `role === 'ADMIN'` | `isAdmin === true` OR `role === 'ADMIN'` |
| Session Management | Manual JWT | Wasp auto-managed |
| Email Verification | Custom token system | Wasp built-in |
| Password Reset | Custom token system | Wasp built-in |
| Payments | Not included | Optional Stripe integration |
| Deployment | Manual Docker/AWS | One-command Fly.io/Railway |

---

### Migration Checklist

Use this checklist when migrating from standalone Quest Canada to Open SaaS merged schema:

#### Pre-Migration
- [ ] Backup existing database
- [ ] Export current user data
- [ ] Document custom authentication logic
- [ ] Review Open SaaS documentation
- [ ] Install Wasp CLI

#### Schema Migration
- [ ] Create Wasp project
- [ ] Copy merged schema to `schema.prisma`
- [ ] Update `main.wasp` configuration
- [ ] Run initial migration
- [ ] Verify schema in Prisma Studio

#### Data Migration
- [ ] Copy merged seed script
- [ ] Install dependencies (bcrypt, etc.)
- [ ] Run seed script
- [ ] Verify users created correctly
- [ ] Check admin user has `isAdmin=true`
- [ ] Verify communities and projects

#### Authentication Testing
- [ ] Test email login
- [ ] Test username login (if enabled)
- [ ] Verify email verification flow
- [ ] Test password reset
- [ ] Check role-based access
- [ ] Verify multi-tenancy isolation

#### Feature Migration
- [ ] Migrate custom queries to Wasp
- [ ] Migrate custom actions to Wasp
- [ ] Update API endpoints
- [ ] Test query permissions
- [ ] Test action permissions

#### UI Migration
- [ ] Create dashboard pages
- [ ] Integrate with Wasp auth
- [ ] Add navigation
- [ ] Style with Tailwind
- [ ] Test responsive design

#### Deployment
- [ ] Set production environment variables
- [ ] Deploy to Fly.io/Railway
- [ ] Run production migrations
- [ ] Seed production database (if needed)
- [ ] Verify production login
- [ ] Test production features
- [ ] Monitor logs for errors

---

### Support and Resources

#### Documentation
- **Open SaaS Docs:** https://docs.opensaas.sh
- **Wasp Docs:** https://wasp.sh/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Quest Canada Database Docs:** `docs/database/DATABASE_DOCUMENTATION.md`

#### Community
- **Wasp Discord:** https://discord.gg/aCamt5wCpS
- **Open SaaS GitHub:** https://github.com/wasp-lang/open-saas
- **Quest Canada Project Team:** CPSC 405 Group

#### Related Files
- Setup Guide: `docs/planning/SETUP_GUIDE_OPEN_SAAS.md`
- Research Summary: `docs/planning/OPEN_SAAS_RESEARCH_SUMMARY.md`
- Original Schema Docs: `docs/database/SCHEMA_REFERENCE.md`

---

## Conclusion

This integration strategy successfully merges Quest Canada's multi-tenant climate action platform with Open SaaS's production-ready authentication and admin framework. The merged schema preserves all Quest Canada features while gaining:

- **Battle-tested authentication** via Wasp framework
- **Admin dashboard** out-of-the-box
- **Type-safe queries and actions** with end-to-end TypeScript
- **One-command deployment** to production
- **Optional payment integration** for future monetization

The additive merge approach ensures both systems work harmoniously without sacrificing features from either platform.

**Next Steps:**
1. Review this guide with development team
2. Test merged schema in development environment
3. Migrate custom Quest Canada features to Wasp
4. Deploy to staging for user acceptance testing
5. Deploy to production

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Prepared by:** Agent 7 - Prisma Schema Integration Specialist
**Status:** Ready for Implementation
