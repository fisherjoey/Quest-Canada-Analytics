# Quest Canada Database Schema Reference

Quick reference guide for all tables, fields, and relationships.

---

## Table: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | User unique identifier |
| email | String | UNIQUE, INDEXED | User email address |
| password_hash | String | NOT NULL | Bcrypt hashed password |
| first_name | String | NULLABLE | User's first name |
| last_name | String | NULLABLE | User's last name |
| role | Enum | DEFAULT: COMMUNITY_STAFF | ADMIN, COMMUNITY_STAFF, FUNDER, PUBLIC_VIEWER |
| is_active | Boolean | DEFAULT: true | Account active flag |
| community_id | UUID | FK → communities, INDEXED, NULLABLE | Multi-tenancy link |
| email_verified | Boolean | DEFAULT: false | Email verification status |
| verification_token | String | UNIQUE, NULLABLE | Email verification token |
| reset_token | String | UNIQUE, NULLABLE | Password reset token |
| reset_token_expiry | DateTime | NULLABLE | Reset token expiration |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |
| last_login_at | DateTime | NULLABLE | Last login timestamp |

**Relationships:**
- Belongs to: `Community` (optional, CASCADE delete)
- Has many: `Assessment` (as creator, SET NULL on delete)
- Has many: `Project` (as creator, SET NULL on delete)
- Has many: `AiExtractionLog` (CASCADE delete)

---

## Table: `communities`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Community unique identifier |
| name | String | UNIQUE, INDEXED | Community name (e.g., "Calgary") |
| province | Enum | INDEXED | AB, BC, MB, NB, NL, NS, NT, NU, ON, PE, QC, SK, YT |
| region | String | NULLABLE | Sub-region (e.g., "Southern Alberta") |
| population | Integer | NULLABLE | Total population |
| land_area_km2 | Float | NULLABLE | Land area in square kilometers |
| baseline_emissions_tco2e | Float | NULLABLE | Baseline GHG emissions (tonnes CO2e) |
| baseline_year | Integer | NULLABLE | Year of baseline measurement |
| primary_contact_name | String | NULLABLE | Main contact person |
| primary_contact_email | String | NULLABLE | Contact email |
| primary_contact_phone | String | NULLABLE | Contact phone |
| is_active | Boolean | DEFAULT: true, INDEXED | Community active flag |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |

**Relationships:**
- Has many: `User` (CASCADE delete)
- Has many: `Assessment` (CASCADE delete)
- Has many: `Project` (CASCADE delete)

---

## Table: `assessments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Assessment unique identifier |
| community_id | UUID | FK → communities, INDEXED, NOT NULL | Community being assessed |
| assessment_date | DateTime | NOT NULL | Date of assessment |
| assessment_year | Integer | INDEXED | Year of assessment |
| assessor_name | String | NOT NULL | Lead assessor name |
| assessor_organization | String | NOT NULL | Assessor's organization |
| assessor_email | String | NULLABLE | Assessor email |
| status | Enum | DEFAULT: DRAFT, INDEXED | DRAFT, IN_REVIEW, COMPLETED, PUBLISHED, ARCHIVED |
| overall_score | Float | NULLABLE | Total score across all indicators |
| max_possible_score | Float | DEFAULT: 100 | Maximum achievable score |
| certification_level | Enum | NULLABLE | SILVER, GOLD, PLATINUM, DIAMOND |
| general_notes | String | NULLABLE | Additional notes |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |
| created_by | UUID | FK → users, INDEXED, NULLABLE | User who created assessment |

**Unique Constraints:**
- (community_id, assessment_year) - One assessment per community per year

**Relationships:**
- Belongs to: `Community` (CASCADE delete)
- Belongs to: `User` (creator, SET NULL on delete)
- Has many: `IndicatorScore` (CASCADE delete)
- Has many: `Strength` (CASCADE delete)
- Has many: `Recommendation` (CASCADE delete)

---

## Table: `indicator_scores`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Indicator score unique identifier |
| assessment_id | UUID | FK → assessments, INDEXED, NOT NULL | Parent assessment |
| indicator_number | Integer | INDEXED | Indicator number (1-10) |
| indicator_name | String | NOT NULL | Name of indicator |
| category | Enum | NOT NULL | GOVERNANCE, CAPACITY, PLANNING, INFRASTRUCTURE, OPERATIONS, BUILDINGS, TRANSPORTATION, WASTE, ENERGY, OTHER |
| points_earned | Float | NOT NULL | Score achieved |
| points_possible | Float | NOT NULL | Maximum score |
| percentage_score | Float | NULLABLE | Calculated: (earned/possible) × 100 |
| notes | String | NULLABLE | Additional notes |
| evidence_files | String[] | DEFAULT: [] | Array of file paths |

**Unique Constraints:**
- (assessment_id, indicator_number)

**Relationships:**
- Belongs to: `Assessment` (CASCADE delete)

---

## Table: `strengths`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Strength unique identifier |
| assessment_id | UUID | FK → assessments, INDEXED, NOT NULL | Parent assessment |
| category | Enum | NOT NULL | Indicator category |
| title | String | NOT NULL | Brief title |
| description | String | NOT NULL | Detailed description |

**Relationships:**
- Belongs to: `Assessment` (CASCADE delete)

---

## Table: `recommendations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Recommendation unique identifier |
| assessment_id | UUID | FK → assessments, INDEXED, NOT NULL | Parent assessment |
| indicator_number | Integer | NULLABLE | Related indicator (1-10) |
| recommendation_text | String | NOT NULL | Recommendation description |
| priority_level | Enum | DEFAULT: MEDIUM, INDEXED | HIGH, MEDIUM, LOW |
| responsible_party | String | NULLABLE | Who should implement |
| implementation_status | Enum | DEFAULT: PLANNED, INDEXED | PLANNED, IN_PROGRESS, COMPLETED, DEFERRED, CANCELLED |
| target_date | DateTime | NULLABLE | Target completion date |
| completion_date | DateTime | NULLABLE | Actual completion date |
| estimated_cost | Float | NULLABLE | Budget estimate |
| estimated_ghg_reduction | Float | NULLABLE | Impact (tonnes CO2e) |

**Relationships:**
- Belongs to: `Assessment` (CASCADE delete)
- Many-to-many: `Project` (via junction table)

---

## Table: `projects`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Project unique identifier |
| community_id | UUID | FK → communities, INDEXED, NOT NULL | Community implementing project |
| project_code | String | UNIQUE | Project identifier (e.g., "CGY-2024-001") |
| project_name | String | NOT NULL | Project title |
| description | String | NULLABLE | Detailed description |
| project_type | String | NOT NULL | Type of project |
| sector | Enum | INDEXED | BUILDINGS, TRANSPORTATION, WASTE_MANAGEMENT, RENEWABLE_ENERGY, ENERGY_EFFICIENCY, LAND_USE, WATER, OTHER |
| status | Enum | DEFAULT: PLANNED, INDEXED | PLANNED, IN_DESIGN, FUNDED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED |
| priority_level | Enum | DEFAULT: MEDIUM, INDEXED | HIGH, MEDIUM, LOW |
| estimated_ghg_reduction | Float | NULLABLE | Estimated GHG reduction (tonnes CO2e/year) |
| estimated_energy_reduction | Float | NULLABLE | Energy savings (GJ or kWh/year) |
| estimated_cost | Float | NULLABLE | Total estimated cost |
| planned_start_date | DateTime | NULLABLE | Planned start date |
| actual_start_date | DateTime | NULLABLE | Actual start date |
| estimated_completion_date | DateTime | NULLABLE | Planned completion date |
| actual_completion_date | DateTime | NULLABLE | Actual completion date |
| completion_percentage | Integer | DEFAULT: 0 | Progress (0-100) |
| total_budget | Float | NULLABLE | Total project budget |
| total_secured_funding | Float | NULLABLE | Sum of secured funding |
| funding_gap | Float | NULLABLE | Budget - Secured funding |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |
| created_by | UUID | FK → users, INDEXED, NULLABLE | User who created project |

**Relationships:**
- Belongs to: `Community` (CASCADE delete)
- Belongs to: `User` (creator, SET NULL on delete)
- Has many: `Funding` (CASCADE delete)
- Has many: `Milestone` (CASCADE delete)
- Many-to-many: `Recommendation`

---

## Table: `funding`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Funding source unique identifier |
| project_id | UUID | FK → projects, INDEXED, NOT NULL | Parent project |
| funder_name | String | NOT NULL | Organization providing funds |
| funder_type | Enum | INDEXED | FEDERAL, PROVINCIAL, MUNICIPAL, FOUNDATION, CORPORATE, UTILITY, OTHER |
| grant_program | String | NULLABLE | Name of grant program |
| amount | Float | NOT NULL | Funding amount (CAD) |
| status | Enum | DEFAULT: PENDING, INDEXED | PENDING, APPROVED, RECEIVED, DENIED, WITHDRAWN |
| application_date | DateTime | NULLABLE | Application submission date |
| approval_date | DateTime | NULLABLE | Approval date |
| received_date | DateTime | NULLABLE | Date funds received |
| notes | String | NULLABLE | Additional notes |
| agreement_file | String | NULLABLE | Path to agreement PDF |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |

**Relationships:**
- Belongs to: `Project` (CASCADE delete)

---

## Table: `milestones`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Milestone unique identifier |
| project_id | UUID | FK → projects, INDEXED, NOT NULL | Parent project |
| milestone_name | String | NOT NULL | Milestone title |
| description | String | NULLABLE | Detailed description |
| target_date | DateTime | INDEXED | Planned completion date |
| actual_date | DateTime | NULLABLE | Actual completion date |
| status | Enum | DEFAULT: NOT_STARTED, INDEXED | NOT_STARTED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED |
| display_order | Integer | NOT NULL | Order for Gantt chart |
| depends_on_ids | UUID[] | DEFAULT: [] | Array of dependent milestone IDs |
| notes | String | NULLABLE | Additional notes |
| completion_notes | String | NULLABLE | Notes upon completion |
| created_at | DateTime | DEFAULT: now() | Record creation timestamp |
| updated_at | DateTime | AUTO_UPDATE | Last update timestamp |

**Relationships:**
- Belongs to: `Project` (CASCADE delete)

---

## Table: `ai_extraction_logs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Log entry unique identifier |
| user_id | UUID | FK → users, INDEXED, NOT NULL | User who initiated extraction |
| document_type | String | INDEXED | "assessment", "project", "funding" |
| file_name | String | NOT NULL | Original filename |
| file_size | Integer | NOT NULL | File size in bytes |
| file_path | String | NULLABLE | Storage path |
| status | Enum | INDEXED | PENDING, PROCESSING, COMPLETED, ERROR, CANCELLED |
| extracted_data | JSON | NULLABLE | Extracted structured data |
| confidence_scores | JSON | NULLABLE | Per-field confidence (0-100) |
| error_message | String | NULLABLE | Error message if failed |
| error_stack | String | NULLABLE | Error stack trace |
| inserted_record_ids | JSON | NULLABLE | IDs of created records |
| processing_time_ms | Integer | NULLABLE | Processing duration |
| tokens_used | Integer | NULLABLE | Claude API tokens consumed |
| cost_usd | Float | NULLABLE | Estimated API cost |
| created_at | DateTime | DEFAULT: now(), INDEXED | Record creation timestamp |
| completed_at | DateTime | NULLABLE | Processing completion time |

**Relationships:**
- Belongs to: `User` (CASCADE delete)

---

## Enums Summary

### Role
- `ADMIN` - Full system access
- `COMMUNITY_STAFF` - Edit own community data
- `FUNDER` - View funded projects
- `PUBLIC_VIEWER` - Limited dashboard access

### Province
- `AB`, `BC`, `MB`, `NB`, `NL`, `NS`, `NT`, `NU`, `ON`, `PE`, `QC`, `SK`, `YT`

### AssessmentStatus
- `DRAFT`, `IN_REVIEW`, `COMPLETED`, `PUBLISHED`, `ARCHIVED`

### CertificationLevel
- `SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`

### IndicatorCategory
- `GOVERNANCE`, `CAPACITY`, `PLANNING`, `INFRASTRUCTURE`, `OPERATIONS`
- `BUILDINGS`, `TRANSPORTATION`, `WASTE`, `ENERGY`, `OTHER`

### Priority
- `HIGH`, `MEDIUM`, `LOW`

### ImplementationStatus
- `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `DEFERRED`, `CANCELLED`

### ProjectSector
- `BUILDINGS`, `TRANSPORTATION`, `WASTE_MANAGEMENT`, `RENEWABLE_ENERGY`
- `ENERGY_EFFICIENCY`, `LAND_USE`, `WATER`, `OTHER`

### ProjectStatus
- `PLANNED`, `IN_DESIGN`, `FUNDED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`, `CANCELLED`

### FunderType
- `FEDERAL`, `PROVINCIAL`, `MUNICIPAL`, `FOUNDATION`, `CORPORATE`, `UTILITY`, `OTHER`

### FundingStatus
- `PENDING`, `APPROVED`, `RECEIVED`, `DENIED`, `WITHDRAWN`

### MilestoneStatus
- `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `DELAYED`, `CANCELLED`

### ExtractionStatus
- `PENDING`, `PROCESSING`, `COMPLETED`, `ERROR`, `CANCELLED`

---

## Index Summary

Critical indexes for query performance:

| Table | Indexed Fields | Purpose |
|-------|----------------|---------|
| users | email (unique) | Login queries |
| users | community_id | Multi-tenancy filtering |
| users | role | Role-based filtering |
| communities | name (unique) | Lookup by name |
| communities | province | Regional filtering |
| communities | is_active | Active community filter |
| assessments | community_id | Multi-tenancy filtering |
| assessments | assessment_year | Temporal queries |
| assessments | status | Status filtering |
| assessments | created_by | Creator filtering |
| assessments | (community_id, assessment_year) unique | One per year constraint |
| indicator_scores | assessment_id | Parent lookup |
| indicator_scores | indicator_number | Indicator filtering |
| indicator_scores | (assessment_id, indicator_number) unique | No duplicates |
| recommendations | assessment_id | Parent lookup |
| recommendations | priority_level | Priority filtering |
| recommendations | implementation_status | Status filtering |
| projects | community_id | Multi-tenancy filtering |
| projects | status | Status filtering |
| projects | sector | Sector filtering |
| projects | priority_level | Priority filtering |
| projects | created_by | Creator filtering |
| funding | project_id | Parent lookup |
| funding | funder_type | Funder type filtering |
| funding | status | Status filtering |
| milestones | project_id | Parent lookup |
| milestones | status | Status filtering |
| milestones | target_date | Timeline queries |
| ai_extraction_logs | user_id | User's extraction history |
| ai_extraction_logs | status | Status filtering |
| ai_extraction_logs | document_type | Type filtering |
| ai_extraction_logs | created_at | Temporal queries |

---

## Cascade Delete Rules Summary

| Parent Table | Child Table | Delete Rule |
|--------------|-------------|-------------|
| Community | User | CASCADE |
| Community | Assessment | CASCADE |
| Community | Project | CASCADE |
| Assessment | IndicatorScore | CASCADE |
| Assessment | Strength | CASCADE |
| Assessment | Recommendation | CASCADE |
| Project | Funding | CASCADE |
| Project | Milestone | CASCADE |
| User | Assessment (creator) | SET NULL |
| User | Project (creator) | SET NULL |
| User | AiExtractionLog | CASCADE |

**Key Points:**
- Deleting a **Community** removes all associated users, assessments, and projects
- Deleting an **Assessment** removes all indicator scores, strengths, and recommendations
- Deleting a **Project** removes all funding sources and milestones
- Deleting a **User** sets creator fields to NULL (preserves data) except AI logs (CASCADE)

---

## Multi-Tenancy Fields

All these fields enforce data isolation:

| Table | Field | Index | Cascade |
|-------|-------|-------|---------|
| users | community_id | ✓ | CASCADE (from Community) |
| assessments | community_id | ✓ | CASCADE (from Community) |
| projects | community_id | ✓ | CASCADE (from Community) |

**Query Pattern:**
```typescript
// Always filter by communityId for non-admin users
where: {
  communityId: currentUser.communityId,
  // ... other filters
}
```

---

## Common Query Patterns

### Get user's community data
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    community: {
      include: {
        assessments: { orderBy: { assessmentYear: 'desc' } },
        projects: { where: { status: 'IN_PROGRESS' } },
      },
    },
  },
});
```

### Get latest assessment with all details
```typescript
const assessment = await prisma.assessment.findFirst({
  where: { communityId: user.communityId },
  orderBy: { assessmentYear: 'desc' },
  include: {
    indicators: { orderBy: { indicatorNumber: 'asc' } },
    strengths: true,
    recommendations: { where: { priorityLevel: 'HIGH' } },
  },
});
```

### Get projects with funding gap
```typescript
const projectsNeedingFunding = await prisma.project.findMany({
  where: {
    communityId: user.communityId,
    fundingGap: { gt: 0 },
  },
  include: {
    fundingSources: { where: { status: 'APPROVED' } },
  },
  orderBy: { fundingGap: 'desc' },
});
```

### Get upcoming milestones
```typescript
const upcomingMilestones = await prisma.milestone.findMany({
  where: {
    project: { communityId: user.communityId },
    targetDate: { gte: new Date(), lte: thirtyDaysFromNow },
    status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
  },
  include: {
    project: { select: { projectName: true, projectCode: true } },
  },
  orderBy: { targetDate: 'asc' },
});
```

---

**End of Schema Reference**
