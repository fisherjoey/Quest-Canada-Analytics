# Quest Canada Database Setup

This directory contains the complete Prisma schema, seed data, and configuration for the Quest Canada web application database.

## Contents

- `schema.prisma` - Complete database schema with all tables, relationships, and indexes
- `seed.ts` - Demo data seeding script (3 communities, 5 users, 15 projects, etc.)
- `DATABASE_DOCUMENTATION.md` - Comprehensive documentation with ERD and API examples
- `package.json` - NPM scripts for database operations
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variable template

## Quick Start

### Prerequisites

- Node.js 20+ installed
- PostgreSQL 14+ running
- Database created (e.g., `quest_canada_v2`)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

4. **Push schema to database:**
   ```bash
   npm run db:push
   ```

5. **Seed demo data:**
   ```bash
   npm run db:seed
   ```

6. **Open Prisma Studio (optional):**
   ```bash
   npm run db:studio
   ```
   Visit http://localhost:5555 to browse data

## Database Schema Highlights

### Multi-Tenancy
- All data is scoped to `communities`
- Users belong to a community (except ADMIN/PUBLIC_VIEWER)
- Enforced via foreign keys and indexes on `community_id`

### Tables
- **users** - Authentication and user profiles
- **communities** - Municipalities (Calgary, Edmonton, Vancouver, etc.)
- **assessments** - Quest Canada benchmark assessments
- **indicator_scores** - Individual indicator scores (1-10)
- **strengths** - Community strengths
- **recommendations** - Recommendations for improvement
- **projects** - Climate action projects
- **funding** - Funding sources (grants, contributions)
- **milestones** - Project milestones and deadlines
- **ai_extraction_logs** - AI document processing audit log

### Key Features
- UUIDs for all primary keys
- Proper cascade delete rules
- Comprehensive indexes for performance
- Audit fields (created_at, updated_at, created_by)
- Enums for consistent data values
- JSON fields for flexible data storage

## Seed Data Overview

The seed script creates realistic demo data:

### Communities (3)
- Calgary, AB (population: 1,336,000)
- Edmonton, AB (population: 1,010,899)
- Vancouver, BC (population: 675,218)

### Users (5)
All users have password: `QuestCanada2025!`

- admin@questcanada.org - System Administrator
- staff@calgary.ca - Calgary Community Staff
- staff@edmonton.ca - Edmonton Community Staff
- funder@federalgovernment.ca - Federal Funder
- viewer@example.com - Public Viewer

### Assessments (5)
- Calgary: 2023 (Gold), 2024 (Platinum, in review)
- Edmonton: 2023 (Gold), 2024 (Gold, completed)
- Vancouver: 2024 (Platinum, draft)

### Projects (15 total)
- 5 per community
- Mix of statuses: COMPLETED, IN_PROGRESS, PLANNED, FUNDED
- Realistic funding sources and milestones

### Additional Data
- 10+ indicator scores per assessment
- 3+ strengths per assessment
- 3+ recommendations per assessment
- 2-5 funding sources per project
- 3-6 milestones per project
- 3 AI extraction log samples

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:push` | Push schema to database (no migrations) |
| `npm run db:migrate` | Create a new migration |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run db:seed` | Run seed script to populate demo data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database (WARNING: deletes all data) |
| `npm run db:format` | Format schema.prisma file |

## Usage Examples

### Query all projects for a community
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const projects = await prisma.project.findMany({
  where: { communityId: 'calgary-uuid' },
  include: {
    fundingSources: true,
    milestones: true,
  },
});
```

### Create a new assessment
```typescript
const assessment = await prisma.assessment.create({
  data: {
    communityId: 'calgary-uuid',
    assessmentDate: new Date(),
    assessmentYear: 2025,
    assessorName: 'Dr. Jane Smith',
    assessorOrganization: 'Quest Canada',
    status: 'DRAFT',
    createdBy: 'user-uuid',
  },
});
```

### Get projects with funding gap
```typescript
const projectsNeedingFunding = await prisma.project.findMany({
  where: {
    communityId: 'calgary-uuid',
    fundingGap: { gt: 0 },
  },
  orderBy: { fundingGap: 'desc' },
});
```

See `DATABASE_DOCUMENTATION.md` for more examples.

## Migration Strategy

### Development
Use `db:push` for rapid iteration without migration files:
```bash
npm run db:push
```

### Production
Create and apply migrations:
```bash
# Create migration
npm run db:migrate

# Deploy to production
npm run db:migrate:deploy
```

## Multi-Tenancy Enforcement

### At Database Level
- Foreign key constraints on `community_id`
- Indexes on `community_id` for performance

### At API Level (Recommended)
Use Prisma middleware to auto-filter queries:

```typescript
prisma.$use(async (params, next) => {
  if (params.model === 'Project' && params.action === 'findMany') {
    // Non-admin users only see their community's data
    if (currentUser.role !== 'ADMIN') {
      params.args.where = {
        ...params.args.where,
        communityId: currentUser.communityId
      };
    }
  }
  return next(params);
});
```

### At Visualization Level (Apache Superset)
Apply Row-Level Security filters:
```sql
WHERE community_id = '{{ current_user_attr("community_id") }}'
```

## Performance Considerations

### Indexes
All critical query paths have indexes:
- `users(email)` - Login queries
- `users(community_id)` - User listing
- `assessments(community_id)` - Assessment filtering
- `projects(community_id)` - Project filtering
- `projects(status)` - Status filtering
- `milestones(target_date)` - Timeline queries

### Query Optimization Tips
1. Always use `select` to limit returned fields
2. Use `include` strategically (avoid N+1 queries)
3. Paginate large result sets with `skip` and `take`
4. Use `cursor` pagination for better performance on large tables

### Monitoring
Use Prisma's built-in query logging:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Backup & Recovery

### Create Backup
```bash
pg_dump -h localhost -U postgres quest_canada_v2 > backup.sql
```

### Restore Backup
```bash
psql -h localhost -U postgres quest_canada_v2 < backup.sql
```

### Scheduled Backups (Production)
Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * pg_dump quest_canada_v2 > /backups/quest_$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### "Database does not exist"
Create the database first:
```bash
psql -U postgres
CREATE DATABASE quest_canada_v2;
\q
```

### "Relation already exists"
Reset the database:
```bash
npm run db:reset
# WARNING: This deletes all data!
```

### "Cannot find module @prisma/client"
Regenerate the Prisma Client:
```bash
npm run db:generate
```

### Seed script fails
Check your environment variables:
```bash
cat .env
# Ensure DATABASE_URL is correct
```

### Connection refused
Verify PostgreSQL is running:
```bash
pg_isready
# Or on Windows:
psql -U postgres -c "SELECT 1"
```

## Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use strong passwords** - Minimum 12 characters
3. **Rotate JWT secrets** - Change in production
4. **Enable SSL in production:**
   ```
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```
5. **Restrict database access** - Use firewall rules

## Next Steps

1. Review `DATABASE_DOCUMENTATION.md` for detailed schema info
2. Customize seed data in `seed.ts` if needed
3. Integrate Prisma Client into your API routes
4. Setup Apache Superset to connect to this database
5. Implement Row-Level Security in API middleware

## Support

For questions or issues:
- Review `DATABASE_DOCUMENTATION.md`
- Check Prisma docs: https://www.prisma.io/docs
- Contact: CPSC 405 Group

---

**Happy coding!**
