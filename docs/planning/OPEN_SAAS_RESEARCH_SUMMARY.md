# Open SaaS Research Summary

## Mission Completion Report - Agent 1

**Date:** 2025-11-09
**Agent:** Agent 1 - Open SaaS Setup Specialist
**Status:** COMPLETE

---

## Executive Summary

Open SaaS is a production-ready, feature-rich SaaS boilerplate built on the Wasp framework that provides an excellent foundation for the Quest Canada web application. It includes pre-built authentication, payment processing, admin dashboard, and modern UI components, significantly reducing development time.

### Key Findings

1. **Technology Stack is Modern and Well-Suited:**
   - React + Node.js + PostgreSQL (matches existing Quest Canada infrastructure)
   - Type-safe with Prisma ORM
   - Tailwind CSS for styling (highly customizable)
   - Built-in integration capabilities

2. **Rapid Setup Process:**
   - Single command installation: `wasp new -t saas`
   - Database auto-configured with Docker
   - Development environment ready in ~10 minutes

3. **Quest Canada Integration Potential:**
   - Can connect to existing PostgreSQL database
   - Extensible user roles system
   - Easy to add custom data models (Projects, Milestones, Funding)
   - Can coexist with existing Grafana dashboards

4. **Production Ready:**
   - One-command deployment to Fly.io or Railway
   - Built-in security best practices
   - Scalable architecture
   - Active community support

---

## Installation Requirements

### Minimum Requirements
- **Node.js:** >= 22.12
- **NPM:** Included with Node.js
- **Docker:** For PostgreSQL database
- **Wasp CLI:** Latest version (installed via curl)
- **Git:** For version control

### Platform Specific
- **Windows:** MUST use WSL2 (Ubuntu) - Native Windows NOT supported
- **macOS (Apple Silicon):** Requires Rosetta (`softwareupdate --install-rosetta`)
- **Linux:** Direct installation supported

### Installation Commands

```bash
# Install Wasp (Linux/macOS/WSL)
curl -sSL https://get.wasp.sh/installer.sh | sh

# Verify installation
wasp version

# Create new project
wasp new quest-canada-app -t saas

# Start database
cd quest-canada-app/app
wasp start db

# Run migrations
wasp db migrate-dev

# Start application
wasp start
```

**Expected Ports:**
- Client: http://localhost:3000
- Server: http://localhost:3001
- Database: localhost:5432

---

## Project Structure Overview

```
quest-canada-app/
├── app/                          # Main Wasp application
│   ├── main.wasp                 # Core configuration file
│   ├── schema.prisma             # Database schema
│   ├── tailwind.config.js        # Styling configuration
│   ├── .env.server               # Server environment variables
│   ├── .env.client               # Client environment variables
│   └── src/
│       ├── admin/                # Admin dashboard
│       ├── auth/                 # Authentication pages
│       ├── client/               # React components and hooks
│       ├── landing-page/         # Marketing homepage
│       ├── payment/              # Stripe/payment integration
│       ├── user/                 # User management
│       └── server/               # Server utilities
├── blog/                         # Astro documentation site
└── e2e-tests/                    # Playwright tests
```

---

## Configuration Files That Need Modification

### 1. Core Configuration
- **`app/main.wasp`** - App name, auth methods, routes, email sender
- **`app/schema.prisma`** - Database models (add Quest Canada entities)
- **`app/.env.server`** - API keys, database URL, secrets
- **`app/.env.client`** - Public client-side variables

### 2. Branding & Styling
- **`app/tailwind.config.js`** - Quest Canada colors and theme
- **`app/src/client/Main.css`** - Global styles
- **`app/src/landing-page/contentSections.ts`** - Navigation, features, FAQs
- **`app/src/landing-page/landingPage.tsx`** - Landing page structure

### 3. Static Assets
- **`app/public/favicon.ico`** - Browser icon
- **`app/public/static/logo.webp`** - Main logo
- **`app/public/public-banner.webp`** - Social preview image
- **`app/public/static/open-saas-banner.webp`** - Hero banner

### 4. Custom Features (To Be Created)
- **`app/src/project/`** - Project management (NEW)
- **`app/src/funding/`** - Funding tracking (NEW)
- **`app/src/reporting/`** - Report generation (NEW)
- **`app/src/milestones/`** - Milestone management (NEW)

---

## Environment Variables Needed

### Required for Basic Functionality

```env
# Database (Auto-configured by Wasp)
DATABASE_URL=postgresql://...

# Admin User
ADMIN_EMAIL=admin@questcanada.org
```

### Optional but Recommended

```env
# Email Service (Production)
SENDGRID_API_KEY=SG...

# Stripe Payments (if needed)
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/...
PAYMENTS_HOBBY_SUBSCRIPTION_PLAN_ID=price_...
PAYMENTS_PRO_SUBSCRIPTION_PLAN_ID=price_...

# Google OAuth (if needed)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# GitHub OAuth (if needed)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# AWS S3 File Upload (if needed)
AWS_S3_IAM_ACCESS_KEY_ID=...
AWS_S3_IAM_SECRET_ACCESS_KEY=...
AWS_S3_FILES_BUCKET=...
AWS_S3_REGION=...

# OpenAI Integration (if needed)
OPENAI_API_KEY=sk-...

# Analytics (if needed)
GOOGLE_ANALYTICS_ID=G-...
```

---

## Customization Areas for Quest Canada

### 1. Branding
**Quest Canada Colors:**
- Primary Blue: `#003D7A`
- Accent Orange: `#FF6B35`
- Text Gray: `#4A5568`
- Background Light: `#F7FAFC`

**Files to modify:**
- `tailwind.config.js` - Color scheme
- `contentSections.ts` - Landing page content
- Logo assets in `public/static/`

### 2. Database Connection
**Connect to Existing PostgreSQL:**

```env
# In .env.server
DATABASE_URL="postgresql://grafana_user:password@postgres.cpsc405.cjd9xqwi03fi.us-east-2.rds.amazonaws.com:5432/quest_canada"
```

**Schema Extension:**
```prisma
// Add to schema.prisma
model User {
  id                   String    @id @default(uuid())
  email                String?   @unique
  isAdmin              Boolean   @default(false)

  // Quest Canada fields
  organizationRole     String?
  department           String?
  phoneNumber          String?

  projects             Project[]
}

model Project {
  id                   String    @id @default(uuid())
  name                 String
  description          String?
  status               String
  startDate            DateTime
  endDate              DateTime?
  budget               Decimal?
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  milestones           Milestone[]
}

model Milestone {
  id                   String    @id @default(uuid())
  title                String
  description          String?
  dueDate              DateTime
  status               String
  projectId            String
  project              Project   @relation(fields: [projectId], references: [id])
}
```

### 3. Authentication Configuration

**Email Authentication (Default):**
- Pre-configured out of the box
- Development: Console logging
- Production: SendGrid integration

**Social OAuth (Optional):**
- Google, GitHub, Discord supported
- Uncomment in `main.wasp`
- Add OAuth credentials to `.env.server`

**Configuration in `main.wasp`:**
```wasp
auth: {
  userEntity: User,
  methods: {
    email: {},        // Enabled by default
    // google: {},    // Uncomment to enable
    // gitHub: {},    // Uncomment to enable
  },
  onAuthFailedRedirectTo: "/",
  onAuthSucceededRedirectTo: "/dashboard"
}
```

### 4. User Roles and Permissions

**Default Roles:**
- Admin (via `isAdmin: true`)
- User (regular access)

**Custom Role Implementation for Quest Canada:**

```prisma
// Add to schema.prisma
enum Role {
  SUPERADMIN        // Full system access
  ADMIN             // Organization admin
  PROJECT_MANAGER   // Manage projects
  RESEARCHER        // View/edit own projects
  USER              // Basic access
}

model User {
  // ... other fields
  role     Role     @default(USER)
}
```

**Permission Checking:**
```typescript
// In queries/actions
if (!canManageProjects(context.user)) {
  throw new HttpError(403, "Insufficient permissions");
}
```

**Best Practice:** Use permission functions (not direct role checks) for flexibility.

---

## Potential Issues and Gotchas

### Critical Issues

#### 1. Windows File System Issue (CRITICAL)
**Problem:** File changes not detected in WSL
**Cause:** Project on Windows file system (/mnt/c/) instead of Linux file system
**Solution:** Store project in Linux home directory (~/projects/)
**Impact:** Development workflow breaks without this fix

#### 2. WSL2 Required for Windows
**Problem:** Installer fails in Git Bash/MSYS
**Cause:** Windows native installation not supported
**Solution:** Must use WSL2 with Ubuntu
**Impact:** Cannot run on Windows without WSL2

#### 3. Docker Must Be Running
**Problem:** `wasp start db` fails
**Cause:** Docker not running or not configured for WSL
**Solution:** Start Docker Desktop and enable WSL2 integration
**Impact:** Cannot start database

### Common Issues

#### 4. Node.js Version Incompatibility
**Problem:** Build or installation fails
**Cause:** Node.js < 22.12
**Solution:** Update Node.js: `nvm install 22.12`
**Impact:** App won't build

#### 5. Stripe Webhook Not Receiving Events
**Problem:** Payments complete but subscription not updated
**Cause:** Stripe CLI not running or wrong webhook secret
**Solution:** Ensure `stripe listen` is running; copy fresh secret
**Impact:** Payment processing incomplete

#### 6. Database Migration Conflicts
**Problem:** "Relation already exists" error
**Cause:** Database schema out of sync
**Solution:** `wasp db reset` (WARNING: deletes data) or manual fix
**Impact:** Cannot modify schema

#### 7. Email Verification Not Working
**Problem:** Verification emails not received
**Cause:** SendGrid not configured or wrong API key
**Solution (Dev):** Check console for verification link
**Solution (Prod):** Configure SendGrid with verified sender
**Impact:** Users cannot complete registration

#### 8. Social Auth Redirect Mismatch
**Problem:** "Redirect URI mismatch" error
**Cause:** Wrong callback URL in OAuth settings
**Solution:** Update OAuth app settings with correct URLs:
  - Dev: `http://localhost:3000/auth/google/callback`
  - Prod: `https://yourdomain.com/auth/google/callback`
**Impact:** Social login doesn't work

#### 9. Railway Deployment Crashes
**Problem:** App shows as crashed after deploy
**Cause:** Missing `DATABASE_URL` environment variable
**Solution:** Set `DATABASE_URL=${{Postgres.DATABASE_URL}}`
**Impact:** Production app doesn't start

#### 10. Slow First Load (Cold Start)
**Problem:** 10-30 second initial load after deployment
**Cause:** Free tier machines sleep when idle
**Solution:** Normal behavior; upgrade to paid tier for always-on
**Impact:** Poor user experience on first visit

### Apple Silicon Specific

#### 11. Wasp Binary Architecture
**Problem:** Wasp fails to run on M1/M2 Mac
**Cause:** Wasp binary is x86, needs Rosetta
**Solution:** `softwareupdate --install-rosetta`
**Impact:** Cannot install Wasp

---

## Deployment Considerations

### Recommended: Fly.io

**Pros:**
- Free tier available
- One-command deploy: `wasp deploy fly launch quest-canada-app`
- Hosts full-stack app in one place
- Scales well
- Good for production

**Cons:**
- Requires Fly CLI installation
- Cold starts on free tier

**Setup:**
```bash
# Deploy
wasp deploy fly launch quest-canada-app

# Set environment variables
wasp deploy fly cmd --context server secrets set STRIPE_API_KEY=sk_live_...

# View logs
wasp deploy fly cmd --context server logs
```

### Alternative: Railway

**Pros:**
- One-click deployment
- Easy environment variable management
- GitHub integration
- Auto-deploys on push

**Cons:**
- Free trial limited
- Requires GitHub account
- Slightly more complex variable syntax

**Setup:**
```bash
# Deploy
wasp deploy railway launch quest-canada-app

# Or use one-click: https://railway.com/deploy/open-saas
```

### Production Checklist

- [ ] All environment variables set (use production keys, not test)
- [ ] Database migrations run successfully
- [ ] Stripe webhook endpoint configured with production URL
- [ ] Social auth redirect URLs updated to production domain
- [ ] Email sender configured (SendGrid with verified sender)
- [ ] SSL certificate active (HTTPS)
- [ ] Custom domain configured (optional)
- [ ] Test payment flow with real card
- [ ] Test email verification flow
- [ ] Monitor logs for errors
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure backups

---

## Integration with Existing Quest Canada Infrastructure

### Database Integration

**Option 1: Separate Database (Recommended for MVP)**
- Use Wasp's auto-configured PostgreSQL
- Easier setup and testing
- Can sync data later if needed

**Option 2: Connect to Existing Database**
- Use existing Quest Canada PostgreSQL instance
- Requires careful schema mapping
- Risk of conflicts with Grafana dashboards
- Use Prisma introspection: `wasp db pull`

**Recommendation:** Start with separate database for faster iteration, plan data sync/migration later.

### Grafana Coexistence

**Current Setup:**
- Grafana reads from PostgreSQL
- Custom dashboards for gap analysis

**Integration Strategy:**
1. Keep Grafana separate (read-only access)
2. Open SaaS writes to same database (different tables/schema)
3. Grafana can query new tables if needed
4. Avoid modifying existing Grafana-related tables

**Future Enhancement:**
- Embed Grafana dashboards in Open SaaS via iframe
- Create unified navigation
- SSO integration between Grafana and Open SaaS

### API Integration

**Open SaaS provides:**
- Built-in REST API endpoints (via Wasp operations)
- Type-safe queries and actions
- Easy to expose custom endpoints

**Can expose APIs for:**
- Grafana to read project/milestone data
- External tools to submit data
- Mobile app integration (future)

---

## Development Timeline Estimate

### Phase 1: Setup and Familiarization (3-5 days)
- [ ] Install prerequisites (Node.js, Docker, Wasp)
- [ ] Clone and run vanilla Open SaaS
- [ ] Explore default features
- [ ] Test authentication flow
- [ ] Test payment flow (optional)
- [ ] Review codebase structure

### Phase 2: Basic Customization (3-5 days)
- [ ] Update branding (colors, logo, content)
- [ ] Configure database schema for Quest Canada
- [ ] Set up environment variables
- [ ] Remove unused features (payment, social auth, etc.)
- [ ] Test with Quest Canada mock data

### Phase 3: Custom Feature Development (2-3 weeks)
- [ ] Implement project management module
- [ ] Implement milestone tracking
- [ ] Implement funding management
- [ ] Implement user role system
- [ ] Create custom dashboards
- [ ] Implement reporting features

### Phase 4: Integration and Testing (1-2 weeks)
- [ ] Connect to existing PostgreSQL (if needed)
- [ ] Integrate with Grafana dashboards
- [ ] Comprehensive testing
- [ ] Bug fixes and refinement
- [ ] User acceptance testing

### Phase 5: Deployment (2-3 days)
- [ ] Set up production environment (Fly.io/Railway)
- [ ] Configure production environment variables
- [ ] Deploy application
- [ ] Configure custom domain
- [ ] Set up monitoring and backups
- [ ] Final production testing

**Total Estimated Time:** 4-7 weeks for full implementation

---

## Advantages of Open SaaS for Quest Canada

### 1. Time Savings
- **Authentication:** Pre-built (saves 1-2 weeks)
- **Admin Dashboard:** Ready to use (saves 1 week)
- **UI Components:** ShadCN library (saves 1-2 weeks)
- **Deployment:** One-command setup (saves 2-3 days)
- **Email System:** Pre-configured (saves 3-5 days)

**Estimated Time Saved:** 4-6 weeks compared to building from scratch

### 2. Best Practices Built-In
- Type safety (TypeScript + Prisma)
- Security (auth, CSRF protection, secure sessions)
- Performance (optimized builds, lazy loading)
- SEO ready
- Responsive design
- Accessibility considerations

### 3. Active Community
- 10,000+ GitHub stars
- Active Discord community
- Regular updates and bug fixes
- Good documentation
- Example implementations

### 4. Flexibility
- Easy to add custom features
- Can remove unused functionality
- Extensible architecture
- Not opinionated about business logic

### 5. Production Ready
- Built-in deployment scripts
- Error handling
- Logging infrastructure
- Database migrations
- Testing setup (Playwright)

---

## Disadvantages and Limitations

### 1. Learning Curve
- Need to learn Wasp framework concepts
- Different from traditional React/Node.js setup
- Unique configuration syntax in `.wasp` files

**Mitigation:** Good documentation available; concepts are similar to other frameworks

### 2. Framework Lock-In
- Tied to Wasp framework
- Cannot easily migrate to plain React/Node.js
- Wasp updates may require code changes

**Mitigation:** Wasp is open-source and actively maintained; large community

### 3. Windows Development Limitations
- Must use WSL2 (cannot use native Windows)
- File system requirements can be confusing
- Docker setup more complex

**Mitigation:** WSL2 is well-documented; one-time setup issue

### 4. Database Limited to PostgreSQL
- SQLite only for development
- Cannot use MySQL, MongoDB, etc.

**Mitigation:** Quest Canada already uses PostgreSQL (perfect match)

### 5. Customization Boundaries
- Some behaviors hard-coded in Wasp
- Generated code not always transparent
- Debugging can be challenging

**Mitigation:** Wasp provides escape hatches; community support for edge cases

---

## Recommended Next Steps

### Immediate (This Week)
1. **Review this documentation** with development team
2. **Set up development environment** on at least one machine
3. **Run vanilla Open SaaS** to see default functionality
4. **Identify must-have features** for Quest Canada MVP
5. **Make go/no-go decision** on using Open SaaS

### Short-Term (Next 2 Weeks)
1. **Design Quest Canada data model** (Projects, Milestones, Funding)
2. **Create mockups** for custom pages/dashboards
3. **Plan user roles and permissions** system
4. **Determine authentication requirements** (email only? social auth?)
5. **Decide on deployment platform** (Fly.io vs Railway)

### Medium-Term (Next 4-6 Weeks)
1. **Implement custom database schema**
2. **Build core features** (project management, milestones, funding)
3. **Customize branding** (Quest Canada colors, logo, content)
4. **Implement user role system**
5. **Create admin workflows**
6. **Integrate with existing Grafana dashboards**

### Long-Term (Next 2-3 Months)
1. **Comprehensive testing**
2. **User acceptance testing** with Quest Canada team
3. **Deploy to staging environment**
4. **Deploy to production**
5. **User training and onboarding**
6. **Ongoing maintenance and feature additions**

---

## Risk Assessment

### Low Risk
- **Technology maturity:** Wasp is stable and production-ready
- **Community support:** Active development and large community
- **Documentation quality:** Comprehensive and up-to-date
- **Basic functionality:** Authentication, database, UI components all solid

### Medium Risk
- **Learning curve:** Team needs to learn Wasp framework
- **Windows development:** WSL2 setup can be tricky
- **Custom feature development:** Depends on team's React/Node.js experience
- **Integration complexity:** Connecting with existing Grafana may have challenges

### High Risk
- **Framework lock-in:** Difficult to migrate away from Wasp if needed
- **Deployment dependencies:** Requires third-party hosting (Fly.io/Railway)
- **Database migration:** If connecting to existing DB, schema conflicts possible

**Overall Risk Level:** LOW to MEDIUM

**Recommendation:** Benefits significantly outweigh risks for Quest Canada use case.

---

## Final Recommendation

### Strong GO Recommendation

**Reasons:**
1. **Perfect Technology Match:** React + Node.js + PostgreSQL aligns with current Quest Canada infrastructure
2. **Significant Time Savings:** 4-6 weeks of development time saved
3. **Production Ready:** Battle-tested, secure, and scalable
4. **Extensible:** Easy to add Quest Canada specific features
5. **Active Community:** Strong support and ongoing development
6. **Cost Effective:** Free and open-source; low hosting costs

**Best Suited For:**
- Quick MVP development
- Teams with React/Node.js experience
- Projects needing authentication and admin features
- PostgreSQL-based applications
- SaaS-style applications

**Not Recommended If:**
- Team has no React/Node.js experience
- Need for non-PostgreSQL database
- Cannot use WSL2 on Windows
- Require full control over generated code

**For Quest Canada:** Open SaaS is an excellent choice that will significantly accelerate development while providing a solid, maintainable foundation.

---

## Deliverables Completed

1. [x] Comprehensive setup guide: `SETUP_GUIDE_OPEN_SAAS.md`
2. [x] Research summary: `OPEN_SAAS_RESEARCH_SUMMARY.md` (this document)
3. [x] Installation requirements documented
4. [x] Configuration files identified
5. [x] Environment variables documented
6. [x] Customization guide created
7. [x] Branding customization instructions
8. [x] Database connection strategy
9. [x] Authentication configuration guide
10. [x] User roles and permissions implementation
11. [x] Common issues and gotchas documented
12. [x] Deployment options evaluated
13. [x] Configuration checklist provided
14. [x] Integration strategy with existing infrastructure

---

## Support and Resources

### Documentation
- **Setup Guide:** `SETUP_GUIDE_OPEN_SAAS.md` (detailed step-by-step instructions)
- **Official Wasp Docs:** https://wasp.sh/docs
- **Open SaaS Docs:** https://docs.opensaas.sh
- **Prisma Docs:** https://www.prisma.io/docs

### Community
- **Wasp Discord:** https://discord.gg/aCamt5wCpS (highly active, fast responses)
- **GitHub Issues:** https://github.com/wasp-lang/open-saas/issues
- **GitHub Discussions:** https://github.com/wasp-lang/wasp/discussions

### Example Code
- **Official Repo:** https://github.com/wasp-lang/open-saas
- **Live Demo:** https://opensaas.sh
- **Starter Templates:** https://wasp.sh/docs/project/starter-templates

---

**Mission Status:** COMPLETE
**Confidence Level:** HIGH
**Ready for Next Phase:** YES

**Prepared by:** Agent 1 - Open SaaS Setup Specialist
**Date:** 2025-11-09
**Document Version:** 1.0
