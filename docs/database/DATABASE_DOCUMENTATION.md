# Quest Canada Database Documentation

**Version:** 1.0
**Database:** PostgreSQL
**ORM:** Prisma
**Multi-Tenancy:** Enforced via `communityId` field

---

## Overview

The Quest Canada database is designed to support a multi-tenant web application for tracking community climate action. The schema enforces data isolation between communities while enabling comprehensive tracking of assessments, projects, funding, and milestones.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-TENANCY & USERS                              │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Community      │
                    ├──────────────────┤
                    │ id (PK)          │
                    │ name (unique)    │
                    │ province         │
                    │ population       │
                    │ baseline_emissions│
                    └────────┬─────────┘
                             │
                             │ 1:N
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
        ▼                    ▼                     ▼
┌───────────────┐    ┌──────────────┐     ┌──────────────┐
│     User      │    │  Assessment  │     │   Project    │
├───────────────┤    ├──────────────┤     ├──────────────┤
│ id (PK)       │    │ id (PK)      │     │ id (PK)      │
│ email (unique)│    │ community_id │     │ community_id │
│ password_hash │    │ year (unique)│     │ project_code │
│ role          │    │ status       │     │ status       │
│ community_id  │    │ overall_score│     │ priority     │
│ is_active     │    └──────┬───────┘     └──────┬───────┘
└───────────────┘           │                    │
                            │                    │
                            │ 1:N                │ 1:N
                            │                    │
        ┌───────────────────┼────────────┐      │
        │                   │            │      │
        ▼                   ▼            ▼      │
┌────────────────┐  ┌─────────────┐  ┌─────────────────┐
│ IndicatorScore │  │  Strength   │  │ Recommendation  │
├────────────────┤  ├─────────────┤  ├─────────────────┤
│ id (PK)        │  │ id (PK)     │  │ id (PK)         │
│ assessment_id  │  │ assess_id   │  │ assessment_id   │
│ indicator_num  │  │ category    │  │ priority_level  │
│ points_earned  │  │ description │  │ implementation  │
│ points_possible│  └─────────────┘  │ status          │
└────────────────┘                   └─────────┬───────┘
                                               │
                                               │ M:N
                                               │
                                     ┌─────────▼────────┐
                                     │ Recommendation   │
                                     │      To          │
                                     │    Project       │
                                     └─────────┬────────┘
                                               │
                                               │
        ┌──────────────────────────────────────┘
        │
        │ 1:N                  1:N
        │                       │
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   Funding    │        │  Milestone   │
├──────────────┤        ├──────────────┤
│ id (PK)      │        │ id (PK)      │
│ project_id   │        │ project_id   │
│ funder_name  │        │ milestone_name│
│ funder_type  │        │ target_date  │
│ amount       │        │ actual_date  │
│ status       │        │ status       │
└──────────────┘        │ display_order│
                        └──────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI EXTRACTION TRACKING                              │
└─────────────────────────────────────────────────────────────────────────────┘

        ┌──────────────────────┐
        │  AiExtractionLog     │
        ├──────────────────────┤
        │ id (PK)              │
        │ user_id (FK → User)  │
        │ document_type        │
        │ file_name            │
        │ status               │
        │ extracted_data (JSON)│
        │ confidence_scores    │
        │ tokens_used          │
        │ cost_usd             │
        └──────────────────────┘
```

---

## Table Descriptions

### Core Tables

#### `users`
Stores user authentication and profile information. Users are assigned to communities for multi-tenancy.

**Key Fields:**
- `id` - UUID primary key
- `email` - Unique email address (indexed)
- `role` - Enum: ADMIN, COMMUNITY_STAFF, FUNDER, PUBLIC_VIEWER
- `community_id` - Foreign key to communities (null for ADMIN/PUBLIC_VIEWER)
- `is_active` - Soft delete flag

**Indexes:**
- `email` (unique)
- `community_id`
- `role`

**Relationships:**
- Belongs to `Community` (optional)
- Has many `Assessment` (as creator)
- Has many `Project` (as creator)
- Has many `AiExtractionLog`

---

#### `communities`
Central entity for multi-tenancy. Represents municipalities participating in Quest Canada.

**Key Fields:**
- `id` - UUID primary key
- `name` - Unique community name (indexed)
- `province` - Enum of Canadian provinces/territories
- `population` - Total population
- `baseline_emissions_tco2e` - GHG baseline in tonnes CO2e
- `baseline_year` - Year of baseline measurement

**Indexes:**
- `name` (unique)
- `province`
- `is_active`

**Relationships:**
- Has many `User`
- Has many `Assessment`
- Has many `Project`

---

#### `assessments`
Quest Canada benchmark assessments conducted periodically (every 2-3 years).

**Key Fields:**
- `id` - UUID primary key
- `community_id` - Foreign key (ON DELETE CASCADE)
- `assessment_year` - Year of assessment
- `status` - Enum: DRAFT, IN_REVIEW, COMPLETED, PUBLISHED, ARCHIVED
- `overall_score` - Calculated total score
- `certification_level` - Enum: SILVER, GOLD, PLATINUM, DIAMOND

**Constraints:**
- Unique constraint: `(community_id, assessment_year)` - One assessment per community per year

**Indexes:**
- `community_id`
- `assessment_year`
- `status`
- `created_by`

**Relationships:**
- Belongs to `Community`
- Belongs to `User` (creator)
- Has many `IndicatorScore`
- Has many `Strength`
- Has many `Recommendation`

---

#### `indicator_scores`
Individual indicator scores within assessments. Quest Canada has 10 indicators.

**Key Fields:**
- `indicator_number` - Integer 1-10
- `indicator_name` - Name of the indicator
- `category` - Enum: GOVERNANCE, CAPACITY, PLANNING, etc.
- `points_earned` - Score achieved
- `points_possible` - Maximum score
- `percentage_score` - Calculated field

**Constraints:**
- Unique constraint: `(assessment_id, indicator_number)`

**Indexes:**
- `assessment_id`
- `indicator_number`

---

#### `strengths`
Community strengths identified during assessments.

**Key Fields:**
- `category` - Indicator category
- `title` - Brief title
- `description` - Detailed description

**Cascade Delete:** Yes (when parent assessment deleted)

---

#### `recommendations`
Recommendations for improvement from assessments.

**Key Fields:**
- `priority_level` - Enum: HIGH, MEDIUM, LOW
- `implementation_status` - Enum: PLANNED, IN_PROGRESS, COMPLETED, DEFERRED, CANCELLED
- `estimated_cost` - Budget estimate
- `estimated_ghg_reduction` - Impact in tonnes CO2e

**Indexes:**
- `assessment_id`
- `priority_level`
- `implementation_status`

**Relationships:**
- Belongs to `Assessment`
- Many-to-many with `Project` (via implicit junction table)

---

#### `projects`
Climate action projects implementing recommendations.

**Key Fields:**
- `id` - UUID primary key
- `community_id` - Foreign key (ON DELETE CASCADE)
- `project_code` - Unique identifier (e.g., "CGY-2024-001")
- `sector` - Enum: BUILDINGS, TRANSPORTATION, WASTE_MANAGEMENT, etc.
- `status` - Enum: PLANNED, IN_DESIGN, FUNDED, IN_PROGRESS, COMPLETED, etc.
- `priority_level` - Enum: HIGH, MEDIUM, LOW
- `completion_percentage` - Integer 0-100
- `total_budget` - Total project budget
- `total_secured_funding` - Calculated from funding sources
- `funding_gap` - Calculated: budget - secured funding

**Indexes:**
- `community_id` (multi-tenancy enforcement)
- `status`
- `sector`
- `priority_level`
- `created_by`

**Relationships:**
- Belongs to `Community`
- Belongs to `User` (creator)
- Has many `Funding`
- Has many `Milestone`
- Many-to-many with `Recommendation`

---

#### `funding`
Funding sources for projects (grants, contributions, etc.).

**Key Fields:**
- `funder_name` - Organization providing funds
- `funder_type` - Enum: FEDERAL, PROVINCIAL, MUNICIPAL, FOUNDATION, CORPORATE, UTILITY, OTHER
- `grant_program` - Name of grant program
- `amount` - Funding amount in CAD
- `status` - Enum: PENDING, APPROVED, RECEIVED, DENIED, WITHDRAWN
- `application_date` - When applied
- `approval_date` - When approved
- `received_date` - When funds received

**Indexes:**
- `project_id`
- `funder_type`
- `status`

**Cascade Delete:** Yes (when parent project deleted)

---

#### `milestones`
Key deliverables and deadlines within projects.

**Key Fields:**
- `milestone_name` - Brief title
- `target_date` - Planned completion date
- `actual_date` - Actual completion date
- `status` - Enum: NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
- `display_order` - Integer for sorting (Gantt chart)
- `depends_on_ids` - Array of milestone IDs (dependencies)

**Indexes:**
- `project_id`
- `status`
- `target_date`

**Cascade Delete:** Yes (when parent project deleted)

---

#### `ai_extraction_logs`
Audit log for AI-powered document extraction using Claude API.

**Key Fields:**
- `user_id` - Who initiated extraction
- `document_type` - "assessment", "project", "funding"
- `status` - Enum: PENDING, PROCESSING, COMPLETED, ERROR, CANCELLED
- `extracted_data` - JSON field with extracted data
- `confidence_scores` - JSON field with per-field confidence (0-100)
- `inserted_record_ids` - JSON field mapping inserted records
- `tokens_used` - Claude API tokens consumed
- `cost_usd` - Estimated API cost
- `processing_time_ms` - Time taken to process

**Indexes:**
- `user_id`
- `status`
- `document_type`
- `created_at`

---

## Enums Reference

### Role
```
ADMIN              - Full system access
COMMUNITY_STAFF    - Edit own community data
FUNDER             - View funded projects
PUBLIC_VIEWER      - Limited dashboard access
```

### Province
```
AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT
```

### AssessmentStatus
```
DRAFT         - Being prepared
IN_REVIEW     - Under review
COMPLETED     - Finalized
PUBLISHED     - Public-facing
ARCHIVED      - Historical
```

### CertificationLevel
```
SILVER, GOLD, PLATINUM, DIAMOND
```

### IndicatorCategory
```
GOVERNANCE, CAPACITY, PLANNING, INFRASTRUCTURE, OPERATIONS,
BUILDINGS, TRANSPORTATION, WASTE, ENERGY, OTHER
```

### Priority
```
HIGH, MEDIUM, LOW
```

### ImplementationStatus
```
PLANNED, IN_PROGRESS, COMPLETED, DEFERRED, CANCELLED
```

### ProjectSector
```
BUILDINGS, TRANSPORTATION, WASTE_MANAGEMENT, RENEWABLE_ENERGY,
ENERGY_EFFICIENCY, LAND_USE, WATER, OTHER
```

### ProjectStatus
```
PLANNED, IN_DESIGN, FUNDED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
```

### FunderType
```
FEDERAL, PROVINCIAL, MUNICIPAL, FOUNDATION, CORPORATE, UTILITY, OTHER
```

### FundingStatus
```
PENDING, APPROVED, RECEIVED, DENIED, WITHDRAWN
```

### MilestoneStatus
```
NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED
```

### ExtractionStatus
```
PENDING, PROCESSING, COMPLETED, ERROR, CANCELLED
```

---

## Multi-Tenancy Implementation

### Data Isolation Strategy

1. **Community-scoped tables** have `community_id` foreign key with CASCADE delete:
   - `assessments`
   - `projects`

2. **User table** has optional `community_id`:
   - ADMIN and PUBLIC_VIEWER: `community_id = null`
   - COMMUNITY_STAFF and FUNDER: `community_id = <community-id>`

3. **Middleware enforcement:**
   ```typescript
   // Prisma middleware to auto-filter by communityId
   prisma.$use(async (params, next) => {
     if (params.model === 'Project' && params.action === 'findMany') {
       // Automatically add communityId filter for non-admin users
       params.args.where = {
         ...params.args.where,
         communityId: currentUser.communityId
       };
     }
     return next(params);
   });
   ```

4. **Row-Level Security in Apache Superset:**
   ```sql
   -- Superset RLS filter
   WHERE community_id = '{{ current_user_attr("community_id") }}'
   ```

---

## Performance Indexes

### Critical Indexes for Query Performance

1. **Multi-tenancy queries:**
   - `assessments(community_id)`
   - `projects(community_id)`
   - `users(community_id)`

2. **Status filtering:**
   - `assessments(status)`
   - `projects(status)`
   - `funding(status)`
   - `milestones(status)`

3. **Temporal queries:**
   - `assessments(assessment_year)`
   - `milestones(target_date)`
   - `ai_extraction_logs(created_at)`

4. **Authentication:**
   - `users(email)` - unique index for login

---

## Cascade Delete Rules

### When a Community is deleted:
- All associated `User` records (CASCADE)
- All `Assessment` records (CASCADE)
  - Which cascades to: `IndicatorScore`, `Strength`, `Recommendation`
- All `Project` records (CASCADE)
  - Which cascades to: `Funding`, `Milestone`

### When a User is deleted:
- `Assessment.created_by` → SET NULL
- `Project.created_by` → SET NULL
- All `AiExtractionLog` records → CASCADE

### When an Assessment is deleted:
- All `IndicatorScore` records → CASCADE
- All `Strength` records → CASCADE
- All `Recommendation` records → CASCADE

### When a Project is deleted:
- All `Funding` records → CASCADE
- All `Milestone` records → CASCADE

---

## Default Values

| Field | Default Value | Notes |
|-------|--------------|-------|
| `User.role` | `COMMUNITY_STAFF` | Most common role |
| `User.is_active` | `true` | New users active by default |
| `User.email_verified` | `false` | Require verification |
| `Assessment.status` | `DRAFT` | New assessments start as draft |
| `Assessment.max_possible_score` | `100` | Standard Quest scoring |
| `Project.status` | `PLANNED` | New projects start planned |
| `Project.priority_level` | `MEDIUM` | Default priority |
| `Project.completion_percentage` | `0` | Not started |
| `Funding.status` | `PENDING` | New funding pending |
| `Milestone.status` | `NOT_STARTED` | New milestones not started |
| `Recommendation.priority_level` | `MEDIUM` | Default recommendation priority |
| `Recommendation.implementation_status` | `PLANNED` | Default implementation status |

---

## Validation Constraints

### Application-Level Validations (Not Enforced in DB)

These should be implemented in the API layer:

1. **Email format:** Valid email pattern
2. **Positive numbers:**
   - `Community.population > 0`
   - `Community.baseline_emissions_tco2e > 0`
   - `IndicatorScore.points_earned >= 0`
   - `IndicatorScore.points_possible > 0`
   - `Project.estimated_cost > 0`
   - `Funding.amount > 0`
3. **Percentage range:**
   - `IndicatorScore.percentage_score: 0-100`
   - `Project.completion_percentage: 0-100`
4. **Date logic:**
   - `actual_date >= planned_date` (for projects)
   - `approval_date >= application_date` (for funding)
5. **GHG reduction:**
   - `estimated_ghg_reduction > 0` (when provided)

---

## Database Size Estimates

Assuming moderate usage (10 communities, 5 years of data):

| Table | Estimated Rows | Size per Row | Total Size |
|-------|----------------|--------------|------------|
| communities | 10 | 500 bytes | 5 KB |
| users | 50 | 400 bytes | 20 KB |
| assessments | 50 (10 communities × 5 years) | 600 bytes | 30 KB |
| indicator_scores | 500 (50 assessments × 10 indicators) | 300 bytes | 150 KB |
| strengths | 150 | 400 bytes | 60 KB |
| recommendations | 250 | 500 bytes | 125 KB |
| projects | 500 | 700 bytes | 350 KB |
| funding | 1,500 | 400 bytes | 600 KB |
| milestones | 2,500 | 350 bytes | 875 KB |
| ai_extraction_logs | 200 | 2,000 bytes | 400 KB |

**Total Estimated Size:** ~3 MB (data only, excluding indexes)

With indexes and overhead, expect ~10-20 MB for initial deployment.

---

## Backup & Maintenance

### Recommended Backup Strategy

1. **Daily full backups:**
   ```bash
   pg_dump -h localhost -U postgres quest_canada_v2 > backup_$(date +%Y%m%d).sql
   ```

2. **Weekly archival backups:**
   - Compress and store off-site
   - Retain for 1 year

3. **Point-in-time recovery:**
   - Enable WAL archiving for production

### Maintenance Tasks

1. **Weekly:**
   - `VACUUM ANALYZE` to optimize query performance
   - Review slow query logs

2. **Monthly:**
   - Check index usage: `SELECT * FROM pg_stat_user_indexes`
   - Archive old AI extraction logs (>1 year)

3. **Quarterly:**
   - Review and archive ARCHIVED assessments
   - Clean up deleted user records (if soft deletes implemented)

---

## Migration Guide

### From Current Grafana Database

**Important:** This is a **fresh schema**, not a migration from the existing Grafana database.

**Data Migration Steps:**

1. **Export existing data from Grafana database:**
   ```sql
   -- Export communities
   COPY (SELECT * FROM public.communities) TO '/tmp/communities.csv' CSV HEADER;

   -- Export assessments
   COPY (SELECT * FROM public.assessments) TO '/tmp/assessments.csv' CSV HEADER;

   -- Export projects
   COPY (SELECT * FROM public.projects) TO '/tmp/projects.csv' CSV HEADER;
   ```

2. **Transform data to new schema:**
   - Write transformation scripts to map old column names to new ones
   - Generate UUIDs for new ID fields
   - Map old enum values to new enum values

3. **Import into new database:**
   ```bash
   npx prisma db push  # Apply schema
   node scripts/migrate-from-grafana.ts  # Run migration script
   ```

4. **Verify data integrity:**
   - Check foreign key constraints
   - Verify record counts
   - Test multi-tenancy isolation

---

## Security Considerations

### SQL Injection Prevention
- **Prisma ORM provides automatic parameterization** - safe by default
- Never concatenate user input into raw SQL queries

### Authentication
- Store password hashes using bcrypt (salt rounds: 10+)
- Implement JWT token rotation
- Enforce strong password policies

### Authorization
- Implement role-based access control (RBAC) middleware
- Always filter queries by `community_id` for non-admin users
- Log all data access in sensitive tables

### Data Privacy
- Consider encrypting PII fields (email, phone)
- Implement audit logging for GDPR compliance
- Provide data export functionality for users

---

## API Integration Examples

### Prisma Query Examples

#### Get all projects for a community (with pagination)
```typescript
const projects = await prisma.project.findMany({
  where: { communityId: user.communityId },
  include: {
    fundingSources: true,
    milestones: { orderBy: { displayOrder: 'asc' } },
    recommendations: true,
  },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' },
});
```

#### Get assessment with all related data
```typescript
const assessment = await prisma.assessment.findUnique({
  where: { id: assessmentId },
  include: {
    indicators: { orderBy: { indicatorNumber: 'asc' } },
    strengths: true,
    recommendations: {
      include: {
        linkedProjects: { select: { id: true, projectName: true } },
      },
    },
    community: { select: { name: true, province: true } },
  },
});
```

#### Calculate total secured funding for a project
```typescript
const totalSecured = await prisma.funding.aggregate({
  where: {
    projectId: projectId,
    status: { in: ['APPROVED', 'RECEIVED'] },
  },
  _sum: { amount: true },
});

await prisma.project.update({
  where: { id: projectId },
  data: { totalSecuredFunding: totalSecured._sum.amount || 0 },
});
```

#### Get projects with funding gap
```typescript
const projectsNeedingFunding = await prisma.project.findMany({
  where: {
    communityId: user.communityId,
    fundingGap: { gt: 0 },
  },
  orderBy: { fundingGap: 'desc' },
  take: 10,
});
```

---

## Changelog

### Version 1.0 (January 2025)
- Initial schema design
- Implemented multi-tenancy with community-based isolation
- Added comprehensive indexes for performance
- Included AI extraction logging
- Cascade delete rules for data integrity
- Audit fields (created_at, updated_at, created_by)

---

## Support & Contact

For schema questions or database issues, contact:
- **Database Architect:** Agent 2
- **Project Team:** CPSC 405 Group
- **Institution:** University of Calgary

---

**End of Documentation**
