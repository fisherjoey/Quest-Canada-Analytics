# Quest Canada Web App - Implementation Plan

**Date Created:** January 2025
**Timeline:** 1 month
**Tech Stack:** Open SaaS (Wasp) + Apache Superset + AI Report Extraction

---

## Executive Summary

Building a comprehensive web application to replace the current Grafana-only system with:
- **Frontend:** React + TypeScript (via Open SaaS boilerplate)
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL (fresh start)
- **Visualization:** Apache Superset (embedded dashboards)
- **AI Feature:** Claude-powered report extraction and data insertion
- **Deployment:** Proxmox LXC 101 (10.0.0.3)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER LAYER                                                          │
│  • Community Staff (data entry, view own data)                      │
│  • Admins (full access, user management)                            │
│  • Funders (view-only access to funded projects)                    │
│  • Public Viewers (anonymous dashboard access)                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS (Nginx reverse proxy)
┌────────────────────────────▼────────────────────────────────────────┐
│  PRESENTATION LAYER - React Web App (Open SaaS)                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Core Pages                                                  │   │
│  │  • Landing page                                              │   │
│  │  • Login/Registration                                        │   │
│  │  • Dashboard (overview with embedded Superset charts)        │   │
│  │  • Assessment Management (CRUD forms)                        │   │
│  │  • Project Management (CRUD forms)                           │   │
│  │  • Funding Tracker                                           │   │
│  │  • Milestone Timeline                                        │   │
│  │  • User Management (admin only)                              │   │
│  │  • Community Management (multi-tenancy)                      │   │
│  │  • PDF Report Generator                                      │   │
│  │  • **AI Report Upload** (drag-drop PDF → extract data)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Embedded Superset Dashboards (via @superset-ui/embedded-sdk)│  │
│  │  • Benchmark comparison charts                               │   │
│  │  • Project portfolio views                                   │   │
│  │  • Funding breakdown visualizations                          │   │
│  │  • Milestone Gantt charts                                    │   │
│  │  • Users can create/customize in Superset UI                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  API LAYER - Node.js + Express                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  REST API Endpoints                                          │   │
│  │  • /api/auth/* - Login, register, logout, refresh tokens     │   │
│  │  • /api/users/* - User CRUD, role management                 │   │
│  │  • /api/communities/* - Community CRUD (multi-tenancy)       │   │
│  │  • /api/assessments/* - Benchmark assessments CRUD           │   │
│  │  • /api/projects/* - Project CRUD, funding, milestones       │   │
│  │  • /api/superset/guest-token - Generate Superset auth        │   │
│  │  • /api/reports/generate - PDF report generation             │   │
│  │  • **/api/ai/extract-report** - AI document processing       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AI Report Extraction Service (Claude API Integration)       │   │
│  │  • Upload handler (PDF, Word, images)                        │   │
│  │  • Claude API prompt engineering for data extraction         │   │
│  │  • Structured data validation (JSON schema)                  │   │
│  │  • Preview UI for user review before insertion               │   │
│  │  • Batch database insertion                                  │   │
│  │  • Error handling & fallback to manual entry                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  DATA LAYER - PostgreSQL                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Core Tables (Prisma Schema)                                 │   │
│  │  • users (id, email, password_hash, role, community_id)      │   │
│  │  • communities (id, name, province, population, etc.)        │   │
│  │  • assessments (id, community_id, year, status, scores)      │   │
│  │  • assessment_indicators (benchmark scores)                  │   │
│  │  • projects (id, community_id, name, type, status, etc.)     │   │
│  │  • project_funding (id, project_id, source, amount, date)    │   │
│  │  • project_milestones (id, project_id, name, date, status)   │   │
│  │  • recommendations (linked to assessments)                   │   │
│  │  • ai_extraction_logs (tracking AI processing history)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  VISUALIZATION LAYER - Apache Superset (port 8088)                 │
│  • Connects to PostgreSQL via psycopg2                              │
│  • Row-Level Security (users see only their community data)         │
│  • Embedded in web app via Guest Tokens                             │
│  • Non-technical users create/edit dashboards in Superset UI        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Details

### Frontend (React)
- **Framework:** React 18+ with TypeScript
- **Routing:** React Router v6
- **State Management:** TanStack Query (React Query) for server state
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Shadcn UI (included in Open SaaS)
- **Styling:** Tailwind CSS
- **Charts Embedding:** @superset-ui/embedded-sdk
- **File Upload:** react-dropzone for AI report upload

### Backend (Node.js)
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **ORM:** Prisma (type-safe database client)
- **Authentication:** JWT tokens (included in Open SaaS)
- **File Processing:** multer (file uploads) + pdf-parse (PDF text extraction)
- **AI Integration:** Anthropic Claude API (@anthropic-ai/sdk)
- **PDF Generation:** puppeteer or jsPDF + html2canvas

### Database
- **PostgreSQL 14+**
- **Fresh schema** (no migration from existing Grafana DB)
- **Extensions:** uuid-ossp for UUID generation

### Visualization
- **Apache Superset 3.x**
- **Deployment:** Docker Compose
- **Auth:** Guest Token API for embedding
- **Row-Level Security:** Filter by community_id

### Infrastructure
- **Web Server:** Nginx (reverse proxy)
- **Hosting:** Proxmox LXC 101 (10.0.0.3)
- **SSL:** Cloudflare SSL certificates
- **Domain:** cpsc405.joeyfishertech.com

---

## Feature Breakdown

### Phase 1: Foundation (Week 1)

#### 1.1 Setup & Boilerplate Configuration
- [ ] Clone Open SaaS boilerplate
- [ ] Configure Wasp for Quest Canada project
- [ ] Setup PostgreSQL database
- [ ] Configure environment variables
- [ ] Update branding (Quest Canada logo, colors)
- [ ] Setup Nginx routing

#### 1.2 Authentication & User Management
- [ ] Email/password authentication (already in Open SaaS)
- [ ] User roles: Admin, Community Staff, Funder, Public Viewer
- [ ] User registration with email verification
- [ ] Password reset flow
- [ ] Role-based access control middleware

#### 1.3 Multi-Tenancy Setup
- [ ] Add `community_id` to user schema
- [ ] Community CRUD operations
- [ ] Data isolation by community
- [ ] Admin can manage all communities
- [ ] Community Staff see only their community

### Phase 2: Core Features (Week 2)

#### 2.1 Assessment Management
- [ ] Assessment CRUD forms
  - Community selection
  - Assessment year, date, status
  - Assessor information
- [ ] Benchmark indicator scoring (10 indicators)
- [ ] Strengths documentation
- [ ] Recommendations tracking with priority
- [ ] Assessment list view with filtering
- [ ] Assessment detail view

#### 2.2 Project Management
- [ ] Project CRUD forms
  - Project name, code, description
  - Type, sector, status, priority
  - Estimated cost and GHG reduction
  - Timeline fields
- [ ] Project list view (table with search/filter)
- [ ] Project detail page
- [ ] Link projects to assessment recommendations

#### 2.3 Funding Tracker
- [ ] Add funding sources to projects
  - Funder name, type (Federal/Provincial/Municipal/etc.)
  - Amount, status, dates
  - Grant program name
- [ ] Funding breakdown table per project
- [ ] Total funding calculation
- [ ] Funding gap analysis

#### 2.4 Milestone Management
- [ ] Add milestones to projects
  - Milestone name, description
  - Target date, actual completion date
  - Status (Not Started, In Progress, Completed, Delayed)
  - Dependencies between milestones
- [ ] Milestone timeline view
- [ ] Status tracking and updates

### Phase 3: Visualization Integration (Week 2-3)

#### 3.1 Apache Superset Setup
- [ ] Deploy Superset via Docker Compose
- [ ] Connect to PostgreSQL database
- [ ] Configure authentication (admin account)
- [ ] Enable embedding feature in config
- [ ] Configure CORS and allowed domains
- [ ] Setup Guest Token API endpoint

#### 3.2 Dashboard Creation
- [ ] Benchmark comparison charts
  - Overall scores by community
  - Indicator breakdown (radar/spider chart)
  - Year-over-year trends
- [ ] Project portfolio dashboards
  - Projects by status (pie chart)
  - Projects by sector (bar chart)
  - GHG reduction potential
- [ ] Funding visualizations
  - Funding sources breakdown
  - Secured vs needed (progress bars)
  - Funding timeline
- [ ] Milestone Gantt chart
- [ ] Community comparison leaderboard

#### 3.3 Embedding Integration
- [ ] Install @superset-ui/embedded-sdk
- [ ] Create dashboard containers in React
- [ ] Implement Guest Token generation endpoint
- [ ] Apply Row-Level Security filters
- [ ] Test interactivity (filters, drill-downs)
- [ ] Mobile responsive embedding

#### 3.4 Dashboard Management UI
- [ ] "Edit in Superset" button (opens Superset UI)
- [ ] Dashboard selector dropdown
- [ ] Refresh data button
- [ ] Export to PNG/PDF from embedded view

### Phase 4: AI Report Extraction (Week 3)

#### 4.1 Upload Interface
- [ ] Drag-and-drop file upload component
- [ ] Support formats: PDF, Word, images (JPG/PNG)
- [ ] File size validation (max 50MB)
- [ ] Upload progress indicator
- [ ] Multiple file upload queue

#### 4.2 AI Extraction Service
- [ ] Integrate Anthropic Claude API
- [ ] Design prompts for data extraction:
  - Assessment reports → extract scores, strengths, recommendations
  - Project reports → extract project details, funding, milestones
  - Financial reports → extract funding data
- [ ] Structured JSON output with schema validation
- [ ] Handle extraction errors gracefully

#### 4.3 Preview & Review Interface
- [ ] Display extracted data in editable form
- [ ] Side-by-side view: PDF preview + extracted data
- [ ] Field-by-field review with confidence scores
- [ ] Edit/correct extracted values
- [ ] Approve/reject mechanism

#### 4.4 Batch Insertion
- [ ] Validate against database schema
- [ ] Insert assessments with related data
- [ ] Insert projects with funding and milestones
- [ ] Transaction handling (all-or-nothing)
- [ ] Success/error notifications
- [ ] Extraction history log

#### 4.5 Claude Skill-like Interface
- [ ] Chat-like UI for AI interaction
- [ ] User can ask: "Extract assessment data from uploaded report"
- [ ] AI responds with structured data and asks for confirmation
- [ ] User can refine with natural language: "That GHG value looks wrong"
- [ ] AI re-analyzes and corrects
- [ ] Final confirmation: "Insert this data into the database"

### Phase 5: Reports & Admin Features (Week 4)

#### 5.1 PDF Report Generation
- [ ] Report templates
  - Assessment summary report
  - Project portfolio report
  - Funding status report
  - Custom date range reports
- [ ] Embed Superset charts in PDFs
- [ ] Quest Canada branding
- [ ] Download/email options

#### 5.2 Admin Panel
- [ ] User management dashboard
  - List all users with roles
  - Invite new users (send email invitation)
  - Assign/change user roles
  - Deactivate users
- [ ] Community management
  - Create/edit/delete communities
  - Assign users to communities
  - View community statistics
- [ ] System settings
  - Superset connection settings
  - AI API key configuration
  - Email notification settings

#### 5.3 Role-Based Views
- [ ] Admin dashboard (full system overview)
- [ ] Community Staff dashboard (their community only)
- [ ] Funder dashboard (funded projects view-only)
- [ ] Public dashboard (anonymous, limited data)

#### 5.4 Mobile Responsiveness
- [ ] Test all pages on mobile devices
- [ ] Optimize forms for mobile input
- [ ] Responsive dashboard layouts
- [ ] Touch-friendly UI elements

### Phase 6: Testing & Deployment (Week 4)

#### 6.1 Testing
- [ ] Unit tests for API endpoints
- [ ] Integration tests for database operations
- [ ] End-to-end tests for critical flows
- [ ] Test AI extraction with sample reports
- [ ] Test multi-tenancy data isolation
- [ ] Security testing (auth, permissions)

#### 6.2 Deployment
- [ ] Setup production environment on LXC 101
- [ ] Configure Nginx for multiple services
  - / → React app
  - /api → Node.js API
  - /superset → Superset (proxied)
- [ ] SSL certificates
- [ ] Environment variables for production
- [ ] Database migrations
- [ ] Backup strategy

#### 6.3 Documentation
- [ ] User guide (how to use the system)
- [ ] Admin guide (user management, configuration)
- [ ] API documentation
- [ ] AI extraction guide (how to prepare reports)
- [ ] Deployment guide (for future updates)

---

## AI Report Extraction - Detailed Design

### Use Cases

#### Use Case 1: Quest Canada Benchmark Assessment Upload
**Input:** 72-page PDF Quest Canada assessment report

**AI Extraction Process:**
1. User uploads PDF to "AI Assistant" page
2. AI (Claude) analyzes document structure
3. Extracts:
   - Community name, province, population
   - Assessment date and year
   - Assessor name and organization
   - 10 indicator scores (points earned/possible)
   - Strengths (category, description)
   - Recommendations (priority, responsible party, status)
4. Returns structured JSON
5. User reviews extracted data in form
6. User clicks "Insert into Database"

**Prompt Template:**
```
You are a data extraction assistant for Quest Canada benchmark assessments.

Extract the following information from the uploaded PDF assessment report:

1. Community Information:
   - Community name
   - Province
   - Population

2. Assessment Details:
   - Assessment date
   - Assessment year
   - Assessor name
   - Assessor organization
   - Assessment status

3. Indicator Scores (extract all 10):
   For each indicator, extract:
   - Indicator number (1-10)
   - Indicator name
   - Points earned
   - Points possible

4. Strengths (extract all):
   - Category (one of: Governance, Capacity, Infrastructure, etc.)
   - Description

5. Recommendations (extract all):
   - Related indicator
   - Recommendation text
   - Priority level (High/Medium/Low)
   - Responsible party
   - Implementation status

Return the data as a JSON object following this schema:
{
  "community": {...},
  "assessment": {...},
  "indicators": [...],
  "strengths": [...],
  "recommendations": [...]
}

If any information is unclear or missing, mark it as null and include a "confidence" field (high/medium/low).
```

#### Use Case 2: Project Report Upload
**Input:** Municipal climate action plan PDF or project proposal

**Extracts:**
- Project name, code, description
- Project type, sector, status
- Estimated cost, GHG reduction
- Timeline
- Funding sources
- Milestones

#### Use Case 3: Funding Report Upload
**Input:** Grant allocation spreadsheet or financial report

**Extracts:**
- List of projects with funding amounts
- Funding sources (funder names, types)
- Dates (application, approval, receipt)
- Grant program names

### API Endpoints

```typescript
// Upload document
POST /api/ai/upload
Content-Type: multipart/form-data
Body: { file: File, documentType: "assessment" | "project" | "funding" }
Response: { uploadId: string, status: "processing" }

// Check extraction status
GET /api/ai/extraction/{uploadId}
Response: {
  status: "processing" | "completed" | "error",
  extractedData: {...},
  confidence: {...}
}

// Review and correct extraction
PUT /api/ai/extraction/{uploadId}
Body: { correctedData: {...} }
Response: { success: boolean }

// Insert into database
POST /api/ai/extraction/{uploadId}/insert
Response: {
  success: boolean,
  insertedIds: {
    assessmentId?: number,
    projectIds?: number[],
    fundingIds?: number[]
  }
}

// Chat with AI for clarification
POST /api/ai/chat
Body: {
  uploadId: string,
  message: "The GHG value seems wrong, can you check again?"
}
Response: {
  reply: "I re-analyzed the document...",
  updatedData: {...}
}
```

### Error Handling

- **Low confidence extraction:** Flag fields with confidence < 70% for manual review
- **Parsing errors:** Fallback to OCR if PDF text extraction fails
- **Missing data:** Prompt user to manually fill required fields
- **Validation errors:** Show specific field errors before insertion
- **API rate limits:** Queue extractions, show estimated wait time

### Cost Estimation

Using Claude 3.5 Sonnet:
- **Input tokens:** ~10,000-50,000 per 72-page PDF (depending on text density)
- **Output tokens:** ~2,000-5,000 (structured JSON response)
- **Cost per extraction:** ~$0.50-$2.50
- **Expected usage:** 20-30 assessments/year = $10-75/year

**Optimization:** Use Claude Haiku for simpler extractions, Sonnet for complex reports

---

## Database Schema (Prisma)

```prisma
// schema.prisma

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  role         Role      @default(COMMUNITY_STAFF)
  communityId  String?
  community    Community? @relation(fields: [communityId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role {
  ADMIN
  COMMUNITY_STAFF
  FUNDER
  PUBLIC_VIEWER
}

model Community {
  id                    String       @id @default(uuid())
  name                  String       @unique
  province              String
  population            Int?
  baselineEmissionsTco2e Float?
  users                 User[]
  assessments           Assessment[]
  projects              Project[]
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
}

model Assessment {
  id                   String              @id @default(uuid())
  communityId          String
  community            Community           @relation(fields: [communityId], references: [id])
  assessmentDate       DateTime
  assessmentYear       Int
  assessorName         String
  assessorOrganization String
  status               AssessmentStatus    @default(DRAFT)
  overallScore         Float?
  indicators           IndicatorScore[]
  strengths            Strength[]
  recommendations      Recommendation[]
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
}

enum AssessmentStatus {
  DRAFT
  IN_REVIEW
  COMPLETED
  PUBLISHED
}

model IndicatorScore {
  id              String     @id @default(uuid())
  assessmentId    String
  assessment      Assessment @relation(fields: [assessmentId], references: [id])
  indicatorNumber Int        // 1-10
  indicatorName   String
  pointsEarned    Float
  pointsPossible  Float
  notes           String?
}

model Strength {
  id           String     @id @default(uuid())
  assessmentId String
  assessment   Assessment @relation(fields: [assessmentId], references: [id])
  category     String
  description  String
}

model Recommendation {
  id                   String     @id @default(uuid())
  assessmentId         String
  assessment           Assessment @relation(fields: [assessmentId], references: [id])
  indicatorNumber      Int?
  recommendationText   String
  priorityLevel        Priority   @default(MEDIUM)
  responsibleParty     String?
  implementationStatus String     @default("planned")
  linkedProjects       Project[]  @relation("RecommendationToProject")
}

enum Priority {
  HIGH
  MEDIUM
  LOW
}

model Project {
  id                       String       @id @default(uuid())
  communityId              String
  community                Community    @relation(fields: [communityId], references: [id])
  projectCode              String       @unique
  projectName              String
  description              String?
  projectType              String
  sector                   String
  status                   ProjectStatus @default(PLANNED)
  priorityLevel            Priority     @default(MEDIUM)
  estimatedGhgReduction    Float?
  estimatedCost            Float?
  estimatedCompletionDate  DateTime?
  actualCompletionDate     DateTime?
  completionPercentage     Int          @default(0)
  fundingSources           Funding[]
  milestones               Milestone[]
  recommendations          Recommendation[] @relation("RecommendationToProject")
  createdAt                DateTime     @default(now())
  updatedAt                DateTime     @updatedAt
}

enum ProjectStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  CANCELLED
}

model Funding {
  id               String   @id @default(uuid())
  projectId        String
  project          Project  @relation(fields: [projectId], references: [id])
  funderName       String
  funderType       FunderType
  amount           Float
  status           FundingStatus @default(PENDING)
  grantProgram     String?
  applicationDate  DateTime?
  approvalDate     DateTime?
  notes            String?
  createdAt        DateTime @default(now())
}

enum FunderType {
  FEDERAL
  PROVINCIAL
  MUNICIPAL
  FOUNDATION
  CORPORATE
  OTHER
}

enum FundingStatus {
  PENDING
  APPROVED
  RECEIVED
  DENIED
}

model Milestone {
  id             String          @id @default(uuid())
  projectId      String
  project        Project         @relation(fields: [projectId], references: [id])
  milestoneName  String
  description    String?
  targetDate     DateTime
  actualDate     DateTime?
  status         MilestoneStatus @default(NOT_STARTED)
  displayOrder   Int
  notes          String?
  createdAt      DateTime        @default(now())
}

enum MilestoneStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  DELAYED
}

model AiExtractionLog {
  id               String   @id @default(uuid())
  userId           String
  documentType     String   // "assessment", "project", "funding"
  fileName         String
  fileSize         Int
  status           String   // "processing", "completed", "error"
  extractedData    Json?
  confidenceScores Json?
  errorMessage     String?
  insertedRecordIds Json?   // { assessmentId: "...", projectIds: [...] }
  processingTimeMs  Int?
  tokensUsed       Int?
  costUsd          Float?
  createdAt        DateTime @default(now())
  completedAt      DateTime?
}
```

---

## Nginx Configuration

```nginx
# /etc/nginx/sites-available/cpsc405.conf

server {
    listen 443 ssl http2;
    server_name cpsc405.joeyfishertech.com;

    ssl_certificate /path/to/cloudflare/cert.pem;
    ssl_certificate_key /path/to/cloudflare/key.pem;

    # React App (SPA)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Node.js API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # For file uploads
        client_max_body_size 50M;
    }

    # Apache Superset
    location /superset/ {
        proxy_pass http://localhost:8088/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS for embedding
        add_header Access-Control-Allow-Origin "https://cpsc405.joeyfishertech.com";
        add_header Access-Control-Allow-Credentials "true";
    }
}
```

---

## Deployment Checklist

### Prerequisites
- [ ] LXC 101 accessible via SSH
- [ ] PostgreSQL 14+ installed
- [ ] Node.js 20+ installed
- [ ] Docker and Docker Compose installed (for Superset)
- [ ] Nginx installed
- [ ] Cloudflare SSL certificates obtained

### Environment Variables

```bash
# .env file

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/quest_canada_v2"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRY="7d"

# Claude API
ANTHROPIC_API_KEY="sk-ant-your-api-key"

# Superset
SUPERSET_URL="http://localhost:8088"
SUPERSET_ADMIN_USERNAME="admin"
SUPERSET_ADMIN_PASSWORD="your-superset-password"
SUPERSET_GUEST_TOKEN_SECRET="your-guest-token-secret"

# Email (for user invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# App Config
NODE_ENV="production"
FRONTEND_URL="https://cpsc405.joeyfishertech.com"
API_URL="https://cpsc405.joeyfishertech.com/api"
```

### Deployment Steps

1. **Clone and Setup**
   ```bash
   cd /opt
   git clone [your-repo] quest-canada-app
   cd quest-canada-app
   npm install
   ```

2. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed  # Optional: seed with demo data
   ```

3. **Build Frontend**
   ```bash
   npm run build
   ```

4. **Start Node API**
   ```bash
   # Using PM2 for process management
   npm install -g pm2
   pm2 start npm --name "quest-api" -- start
   pm2 save
   pm2 startup  # Enable auto-start on reboot
   ```

5. **Deploy Superset**
   ```bash
   cd superset
   docker-compose up -d
   # Wait for Superset to start (~2 minutes)
   # Access http://localhost:8088 and complete setup wizard
   ```

6. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/cpsc405.conf
   sudo ln -s /etc/nginx/sites-available/cpsc405.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Verify**
   - Visit https://cpsc405.joeyfishertech.com
   - Test login/registration
   - Check Superset embedding
   - Test AI upload with sample PDF

---

## Success Metrics

### Technical Metrics
- [ ] All pages load in < 2 seconds
- [ ] API response time < 500ms (95th percentile)
- [ ] Zero authentication bypass vulnerabilities
- [ ] Multi-tenancy data isolation verified
- [ ] AI extraction accuracy > 90% for structured reports

### User Metrics
- [ ] 3+ communities onboarded
- [ ] 10+ users registered
- [ ] 50+ assessments/projects entered
- [ ] 20+ AI-assisted report uploads
- [ ] 90%+ user satisfaction (if surveyed)

### Feature Completeness
- [ ] All Phase 1-6 tasks completed
- [ ] Mobile responsive on iOS and Android
- [ ] PDF reports generate successfully
- [ ] Superset dashboards customizable by non-tech users
- [ ] AI extraction handles 3+ document types

---

## Timeline Summary

| Week | Focus Area | Key Deliverables |
|------|------------|------------------|
| **Week 1** | Foundation | Auth, user management, multi-tenancy, database setup |
| **Week 2** | Core Features | Assessment/project/funding/milestone CRUD, forms |
| **Week 2-3** | Visualization | Superset deployment, dashboard creation, embedding |
| **Week 3** | AI Integration | Report upload, extraction, preview, insertion |
| **Week 4** | Polish & Deploy | PDF reports, admin panel, testing, deployment |

---

## Risk Mitigation

### Risk 1: Superset Embedding Complexity
**Mitigation:**
- Start with simple iframe embedding if Guest Token API proves difficult
- Allocate 2 days for troubleshooting
- Fallback: Keep Grafana if Superset integration fails

### Risk 2: AI Extraction Accuracy
**Mitigation:**
- Always provide manual review/edit interface
- Start with simple document types (structured PDFs)
- Have fallback to manual data entry
- Use confidence scores to flag uncertain extractions

### Risk 3: Timeline Overrun
**Mitigation:**
- Prioritize ruthlessly: Auth + CRUD + Superset embedding = MVP
- AI feature can slip to Phase 2 if needed
- Cut PDF generation if running late (use Superset export)

### Risk 4: Multi-Tenancy Bugs
**Mitigation:**
- Write integration tests for data isolation
- Test with 2+ communities from day 1
- Use Prisma middleware to enforce community filters

---

## Next Steps

1. **Decision Time:** Confirm this plan works for you
2. **Setup Meeting:** Review timeline and adjust if needed
3. **Kickoff:** Clone Open SaaS, setup dev environment
4. **Sprint 1:** Start Week 1 tasks (auth + multi-tenancy)

---

**Questions? Comments? Let's discuss before we start coding!**
