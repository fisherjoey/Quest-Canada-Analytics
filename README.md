# Quest Canada Gap Analysis System - Web Application

> Modern web application for tracking climate action progress across Canadian municipalities

**Live Demo (Legacy):** https://cpsc405.joeyfishertech.com (Grafana-based system)
**Status:** 🚧 In Development
**Timeline:** 4 weeks (January-February 2025)

---

## Overview

A comprehensive web platform for Quest Canada to manage climate action assessments, track community projects, monitor funding sources, and visualize progress with interactive dashboards.

### Key Features

- 🔐 **Authentication & Multi-Tenancy** - Secure login with role-based access for multiple communities
- 📊 **Interactive Dashboards** - Embedded Apache Superset visualizations
- 📝 **Data Management** - Complete CRUD for assessments, projects, funding, and milestones
- 🤖 **AI-Powered Data Entry** - Upload PDF reports, Claude AI extracts structured data
- 📈 **Benchmark Tracking** - Quest Canada's 10-indicator framework built-in
- 💰 **Funding Tracker** - Multi-source funding management and gap analysis
- 📅 **Project Milestones** - Timeline tracking with dependencies
- 📄 **PDF Reports** - Automated report generation with custom branding

---

## Technology Stack

### Frontend
- **React 18+** with TypeScript
- **Shadcn UI** component library
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for state management
- **@superset-ui/embedded-sdk** for dashboard embedding

### Backend
- **Node.js 20+** with Express.js
- **Prisma ORM** for type-safe database access
- **JWT** authentication
- **Anthropic Claude API** for AI extraction

### Database
- **PostgreSQL 14+**
- 10 tables with comprehensive relationships
- Multi-tenancy with row-level security

### Visualization
- **Apache Superset 3.x** (Docker)
- Guest token authentication
- Embedded dashboards with RLS

### Infrastructure
- **Nginx** reverse proxy
- **Proxmox LXC** container hosting
- **Cloudflare SSL**
- **GitHub Actions** CI/CD

---

## Project Structure

```
quest-canada-web-app/
├── docs/                           # All planning documentation
│   ├── planning/                   # Implementation plan, setup guides
│   ├── database/                   # Prisma schema, seed data, DB docs
│   ├── superset/                   # Superset integration guides
│   └── ai-extraction/              # AI service design, prompts
├── src/                            # Source code (to be added)
│   ├── app/                        # Open SaaS Wasp application
│   ├── client/                     # React frontend
│   ├── server/                     # Node.js backend
│   └── shared/                     # Shared types
├── superset/                       # Apache Superset configuration
└── README.md                       # This file
```

---

## Documentation

### Planning & Architecture
- [Implementation Plan](docs/planning/IMPLEMENTATION_PLAN.md) - Complete 4-week roadmap
- [Open SaaS Setup Guide](docs/planning/SETUP_GUIDE_OPEN_SAAS.md) - Boilerplate installation
- [Open SaaS Research](docs/planning/OPEN_SAAS_RESEARCH_SUMMARY.md) - Technology evaluation

### Database
- [Database Schema](docs/database/schema.prisma) - Prisma schema (10 tables)
- [Seed Data](docs/database/seed.ts) - Demo data for 3 communities
- [Database Documentation](docs/database/DATABASE_DOCUMENTATION.md) - Complete reference

### Apache Superset
- [Superset Integration Guide](docs/superset/SUPERSET_INTEGRATION_GUIDE.md) - Embedding docs
- [Docker Compose](docs/superset/docker-compose.superset.yml) - Superset deployment
- [Configuration](docs/superset/superset_config.py) - Production config

### AI Extraction
- [AI Service Design](docs/ai-extraction/AI_EXTRACTION_SERVICE_DESIGN.md) - Architecture
- [Prompt Templates](docs/ai-extraction/prompts/) - Claude prompts for extraction
- [JSON Schemas](docs/ai-extraction/json-schemas/) - Validation schemas
- [API Specification](docs/ai-extraction/api-specification/) - OpenAPI spec

---

## Quick Start

### Prerequisites
- Node.js >= 22.12
- Docker Desktop (for PostgreSQL & Superset)
- Wasp CLI (for Open SaaS)
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/fisherjoey/quest-canada-web-app.git
cd quest-canada-web-app

# 2. Install Wasp CLI (if not installed)
curl -sSL https://get.wasp-lang.dev/installer.sh | sh

# 3. Initialize Open SaaS (coming soon)
# wasp new quest-canada-app -t saas
# cd quest-canada-app

# 4. Install dependencies
# npm install

# 5. Setup database
# npm run db:setup

# 6. Start development
# wasp start
```

### Environment Variables

See [`.env.example`](docs/planning/.env.example) for required configuration.

---

## Development Roadmap

### ✅ Phase 0: Planning & Research (Week 0 - COMPLETED)
- [x] Research Open SaaS boilerplate
- [x] Design database schema with Prisma
- [x] Plan Apache Superset integration
- [x] Design AI extraction service
- [x] Create comprehensive documentation

### 🚧 Phase 1: Foundation (Week 1 - IN PROGRESS)
- [ ] Initialize Open SaaS boilerplate
- [ ] Setup PostgreSQL with Prisma
- [ ] Configure authentication
- [ ] Implement multi-tenancy
- [ ] Deploy Apache Superset

### 📋 Phase 2: Core Features (Week 2)
- [ ] Build assessment CRUD forms
- [ ] Build project management interface
- [ ] Build funding tracker
- [ ] Build milestone manager
- [ ] Create dashboard layouts

### 📊 Phase 3: Visualization (Week 2-3)
- [ ] Create Superset dashboards
- [ ] Implement dashboard embedding
- [ ] Configure Row-Level Security
- [ ] Test multi-tenancy filtering

### 🤖 Phase 4: AI Integration (Week 3)
- [ ] Implement file upload service
- [ ] Integrate Claude API
- [ ] Build chat interface
- [ ] Create review/approval workflow
- [ ] Test with sample reports

### 🚀 Phase 5: Production (Week 4)
- [ ] Implement PDF report generation
- [ ] Build admin panel
- [ ] Mobile responsive testing
- [ ] Deploy to LXC 101
- [ ] User training documentation

---

## Legacy System

The current production system uses Grafana + Flask + PostgreSQL:
- **Repository:** [Quest Canada Gap Analysis](https://github.com/fisherjoey/quest-canada-gap-analysis) (if separate repo)
- **Production:** https://cpsc405.joeyfishertech.com
- **Stack:** Grafana 12.2.0, Python Flask, PostgreSQL 14
- **Status:** Operational, will be replaced by this web app

---

## Team

**Developer:** Kaden Rothlander
**Course:** CPSC 405 Software Entrepreneurship / ENTI 415 Software Venturing
**Institution:** University of Calgary
**Term:** Fall 2025
**Partner:** Quest Canada

---

## License

[Add license information]

---

## Contact

For questions or issues, please open a GitHub issue or contact the development team.

---

**Last Updated:** January 2025
**Version:** 0.1.0-alpha
**Status:** Planning Complete, Implementation Starting
