/**
 * Quest Canada Database Seed Script - MERGED VERSION
 *
 * Compatible with Open SaaS (Wasp framework) authentication
 * Populates database with demo data:
 * - 3 Communities (Calgary, Edmonton, Vancouver)
 * - 5 Users (1 admin, 2 community staff, 1 funder, 1 public viewer)
 * - 2 Assessments per community
 * - 5 Projects per community
 * - Funding sources and milestones for each project
 *
 * Key differences from standalone version:
 * - Uses Wasp-compatible password hashing (if available via @wasp/auth)
 * - Sets isAdmin=true for ADMIN role users
 * - Compatible with both email and username auth
 * - Adds Open SaaS fields (credits, subscriptionStatus, etc.)
 *
 * Usage:
 * - Standalone Prisma: npx prisma db seed
 * - Wasp framework: wasp db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Password hashing configuration
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'QuestCanada2025!';

async function main() {
  console.log('🌱 Starting database seed (Open SaaS + Quest Canada merged schema)...\n');

  // ============================================================================
  // USERS - MERGED: Open SaaS + Quest Canada fields
  // ============================================================================
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // Admin User - maps to both Open SaaS isAdmin=true AND Quest Canada ADMIN role
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@questcanada.org',
      username: 'admin', // Open SaaS supports username
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isAdmin: true, // IMPORTANT: Set for Open SaaS admin dashboard access
      emailVerified: true,
      isActive: true,
      credits: 1000, // Open SaaS credits system (if using AI features)
      subscriptionStatus: null, // No subscription needed for admin
    },
  });

  const funderUser = await prisma.user.create({
    data: {
      email: 'funder@federalgovernment.ca',
      username: 'funder_gov',
      passwordHash: hashedPassword,
      firstName: 'Emily',
      lastName: 'Thompson',
      role: 'FUNDER',
      isAdmin: false,
      emailVerified: true,
      isActive: true,
      credits: 0,
    },
  });

  const publicViewer = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      username: 'public_viewer',
      passwordHash: hashedPassword,
      firstName: 'Public',
      lastName: 'Viewer',
      role: 'PUBLIC_VIEWER',
      isAdmin: false,
      emailVerified: true,
      isActive: true,
      credits: 0,
    },
  });

  console.log(`✅ Created ${3} system users\n`);

  // ============================================================================
  // COMMUNITIES
  // ============================================================================
  console.log('🏙️  Creating communities...');

  const calgary = await prisma.community.create({
    data: {
      name: 'Calgary',
      province: 'AB',
      region: 'Southern Alberta',
      population: 1336000,
      landAreaKm2: 825.56,
      baselineEmissionsTco2e: 15600000,
      baselineYear: 2018,
      primaryContactName: 'Sarah Mitchell',
      primaryContactEmail: 'sarah.mitchell@calgary.ca',
      primaryContactPhone: '+1-403-268-2489',
      isActive: true,
    },
  });

  const edmonton = await prisma.community.create({
    data: {
      name: 'Edmonton',
      province: 'AB',
      region: 'Central Alberta',
      population: 1010899,
      landAreaKm2: 684.37,
      baselineEmissionsTco2e: 11800000,
      baselineYear: 2019,
      primaryContactName: 'James Chen',
      primaryContactEmail: 'james.chen@edmonton.ca',
      primaryContactPhone: '+1-780-496-6000',
      isActive: true,
    },
  });

  const vancouver = await prisma.community.create({
    data: {
      name: 'Vancouver',
      province: 'BC',
      region: 'Lower Mainland',
      population: 675218,
      landAreaKm2: 115.0,
      baselineEmissionsTco2e: 2800000,
      baselineYear: 2020,
      primaryContactName: 'Maria Rodriguez',
      primaryContactEmail: 'maria.rodriguez@vancouver.ca',
      primaryContactPhone: '+1-604-873-7000',
      isActive: true,
    },
  });

  console.log(`✅ Created 3 communities\n`);

  // ============================================================================
  // COMMUNITY STAFF USERS
  // ============================================================================
  console.log('👤 Creating community staff users...');

  const calgaryStaff = await prisma.user.create({
    data: {
      email: 'staff@calgary.ca',
      username: 'calgary_staff',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'COMMUNITY_STAFF',
      communityId: calgary.id,
      isAdmin: false,
      emailVerified: true,
      isActive: true,
      credits: 100, // Some credits for staff users
    },
  });

  const edmontonStaff = await prisma.user.create({
    data: {
      email: 'staff@edmonton.ca',
      username: 'edmonton_staff',
      passwordHash: hashedPassword,
      firstName: 'James',
      lastName: 'Chen',
      role: 'COMMUNITY_STAFF',
      communityId: edmonton.id,
      isAdmin: false,
      emailVerified: true,
      isActive: true,
      credits: 100,
    },
  });

  console.log(`✅ Created 2 community staff users\n`);

  // ============================================================================
  // ASSESSMENTS
  // ============================================================================
  console.log('📊 Creating assessments...');

  // Calgary Assessment 2023
  const calgaryAssessment2023 = await prisma.assessment.create({
    data: {
      communityId: calgary.id,
      assessmentDate: new Date('2023-06-15'),
      assessmentYear: 2023,
      assessorName: 'Dr. Jennifer Park',
      assessorOrganization: 'Quest Canada',
      assessorEmail: 'jennifer.park@questcanada.org',
      status: 'PUBLISHED',
      overallScore: 78.5,
      maxPossibleScore: 100,
      certificationLevel: 'GOLD',
      generalNotes: 'Calgary demonstrates strong commitment to climate action with notable progress in building retrofits and renewable energy.',
      createdBy: calgaryStaff.id,
    },
  });

  // Calgary Assessment 2024
  const calgaryAssessment2024 = await prisma.assessment.create({
    data: {
      communityId: calgary.id,
      assessmentDate: new Date('2024-09-20'),
      assessmentYear: 2024,
      assessorName: 'Dr. Jennifer Park',
      assessorOrganization: 'Quest Canada',
      assessorEmail: 'jennifer.park@questcanada.org',
      status: 'IN_REVIEW',
      overallScore: 82.3,
      maxPossibleScore: 100,
      certificationLevel: 'PLATINUM',
      generalNotes: 'Significant improvement in waste management and transportation sectors.',
      createdBy: calgaryStaff.id,
    },
  });

  // Edmonton Assessment 2023
  const edmontonAssessment2023 = await prisma.assessment.create({
    data: {
      communityId: edmonton.id,
      assessmentDate: new Date('2023-08-10'),
      assessmentYear: 2023,
      assessorName: 'Michael Zhang',
      assessorOrganization: 'Quest Canada',
      assessorEmail: 'michael.zhang@questcanada.org',
      status: 'PUBLISHED',
      overallScore: 73.2,
      maxPossibleScore: 100,
      certificationLevel: 'GOLD',
      generalNotes: 'Edmonton shows strong governance and planning capacity.',
      createdBy: edmontonStaff.id,
    },
  });

  // Edmonton Assessment 2024
  const edmontonAssessment2024 = await prisma.assessment.create({
    data: {
      communityId: edmonton.id,
      assessmentDate: new Date('2024-10-05'),
      assessmentYear: 2024,
      assessorName: 'Michael Zhang',
      assessorOrganization: 'Quest Canada',
      assessorEmail: 'michael.zhang@questcanada.org',
      status: 'COMPLETED',
      overallScore: 76.8,
      maxPossibleScore: 100,
      certificationLevel: 'GOLD',
      generalNotes: 'Continued progress in energy efficiency programs.',
      createdBy: edmontonStaff.id,
    },
  });

  // Vancouver Assessment 2024
  const vancouverAssessment2024 = await prisma.assessment.create({
    data: {
      communityId: vancouver.id,
      assessmentDate: new Date('2024-11-01'),
      assessmentYear: 2024,
      assessorName: 'Dr. Jennifer Park',
      assessorOrganization: 'Quest Canada',
      assessorEmail: 'jennifer.park@questcanada.org',
      status: 'DRAFT',
      overallScore: 85.6,
      maxPossibleScore: 100,
      certificationLevel: 'PLATINUM',
      generalNotes: 'Vancouver leads in sustainable transportation and zero-emissions buildings.',
      createdBy: adminUser.id,
    },
  });

  console.log(`✅ Created 5 assessments\n`);

  // ============================================================================
  // INDICATOR SCORES
  // ============================================================================
  console.log('📈 Creating indicator scores...');

  // Calgary 2023 Indicators
  const calgaryIndicators2023 = [
    { number: 1, name: 'Governance & Leadership', category: 'GOVERNANCE', earned: 8.5, possible: 10 },
    { number: 2, name: 'Community Engagement', category: 'CAPACITY', earned: 7.2, possible: 10 },
    { number: 3, name: 'Climate Planning', category: 'PLANNING', earned: 8.8, possible: 10 },
    { number: 4, name: 'Infrastructure Investment', category: 'INFRASTRUCTURE', earned: 7.5, possible: 10 },
    { number: 5, name: 'Building Energy Efficiency', category: 'BUILDINGS', earned: 8.1, possible: 10 },
    { number: 6, name: 'Renewable Energy', category: 'ENERGY', earned: 7.9, possible: 10 },
    { number: 7, name: 'Sustainable Transportation', category: 'TRANSPORTATION', earned: 7.3, possible: 10 },
    { number: 8, name: 'Waste Reduction', category: 'WASTE', earned: 8.0, possible: 10 },
    { number: 9, name: 'Water Conservation', category: 'OPERATIONS', earned: 7.7, possible: 10 },
    { number: 10, name: 'Monitoring & Reporting', category: 'OPERATIONS', earned: 7.5, possible: 10 },
  ];

  for (const indicator of calgaryIndicators2023) {
    await prisma.indicatorScore.create({
      data: {
        assessmentId: calgaryAssessment2023.id,
        indicatorNumber: indicator.number,
        indicatorName: indicator.name,
        category: indicator.category,
        pointsEarned: indicator.earned,
        pointsPossible: indicator.possible,
        percentageScore: (indicator.earned / indicator.possible) * 100,
      },
    });
  }

  console.log(`✅ Created indicator scores for assessments\n`);

  // ============================================================================
  // STRENGTHS
  // ============================================================================
  console.log('💪 Creating strengths...');

  await prisma.strength.createMany({
    data: [
      {
        assessmentId: calgaryAssessment2023.id,
        category: 'GOVERNANCE',
        title: 'Strong Climate Leadership',
        description: 'City council has demonstrated consistent commitment to climate action with dedicated funding and staff resources.',
      },
      {
        assessmentId: calgaryAssessment2023.id,
        category: 'BUILDINGS',
        title: 'Successful Retrofit Program',
        description: 'The municipal building retrofit program has achieved 30% energy reduction across 50 facilities.',
      },
      {
        assessmentId: calgaryAssessment2023.id,
        category: 'ENERGY',
        title: 'Solar Installation Growth',
        description: 'Community solar gardens and rooftop installations have increased renewable energy capacity by 25 MW.',
      },
    ],
  });

  console.log(`✅ Created strengths\n`);

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================
  console.log('💡 Creating recommendations...');

  const recommendation1 = await prisma.recommendation.create({
    data: {
      assessmentId: calgaryAssessment2023.id,
      indicatorNumber: 7,
      recommendationText: 'Expand active transportation network with protected bike lanes on major corridors',
      priorityLevel: 'HIGH',
      responsibleParty: 'Transportation Planning Department',
      implementationStatus: 'IN_PROGRESS',
      targetDate: new Date('2025-12-31'),
      estimatedCost: 2500000,
      estimatedGhgReduction: 1200,
    },
  });

  const recommendation2 = await prisma.recommendation.create({
    data: {
      assessmentId: calgaryAssessment2023.id,
      indicatorNumber: 5,
      recommendationText: 'Implement mandatory energy disclosure for commercial buildings',
      priorityLevel: 'MEDIUM',
      responsibleParty: 'Building Services',
      implementationStatus: 'PLANNED',
      targetDate: new Date('2026-06-30'),
      estimatedCost: 500000,
      estimatedGhgReduction: 5000,
    },
  });

  const recommendation3 = await prisma.recommendation.create({
    data: {
      assessmentId: calgaryAssessment2023.id,
      indicatorNumber: 8,
      recommendationText: 'Launch community composting program to achieve 70% waste diversion',
      priorityLevel: 'HIGH',
      responsibleParty: 'Waste Management Division',
      implementationStatus: 'IN_PROGRESS',
      targetDate: new Date('2025-03-31'),
      estimatedCost: 1200000,
      estimatedGhgReduction: 800,
    },
  });

  console.log(`✅ Created recommendations\n`);

  // ============================================================================
  // PROJECTS - CALGARY (Sample projects - can add more)
  // ============================================================================
  console.log('🏗️  Creating projects...');

  const calgaryProject1 = await prisma.project.create({
    data: {
      communityId: calgary.id,
      projectCode: 'CGY-2024-001',
      projectName: 'Downtown Protected Bike Lane Network',
      description: 'Installation of 15 km of protected bike lanes connecting downtown to major transit hubs and residential areas.',
      projectType: 'Active Transportation Infrastructure',
      sector: 'TRANSPORTATION',
      status: 'IN_PROGRESS',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 1200,
      estimatedEnergyReduction: 5000,
      estimatedCost: 2500000,
      totalBudget: 2500000,
      totalSecuredFunding: 1800000,
      fundingGap: 700000,
      plannedStartDate: new Date('2024-04-01'),
      actualStartDate: new Date('2024-05-15'),
      estimatedCompletionDate: new Date('2025-10-31'),
      completionPercentage: 35,
      createdBy: calgaryStaff.id,
    },
  });

  const calgaryProject2 = await prisma.project.create({
    data: {
      communityId: calgary.id,
      projectCode: 'CGY-2024-002',
      projectName: 'Municipal Building Deep Energy Retrofit',
      description: 'Comprehensive energy retrofit of City Hall including HVAC upgrades, LED lighting, and building envelope improvements.',
      projectType: 'Building Retrofit',
      sector: 'BUILDINGS',
      status: 'IN_DESIGN',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 850,
      estimatedEnergyReduction: 8500,
      estimatedCost: 4200000,
      totalBudget: 4200000,
      totalSecuredFunding: 2500000,
      fundingGap: 1700000,
      plannedStartDate: new Date('2025-03-01'),
      estimatedCompletionDate: new Date('2026-08-31'),
      completionPercentage: 15,
      createdBy: calgaryStaff.id,
    },
  });

  const calgaryProject3 = await prisma.project.create({
    data: {
      communityId: calgary.id,
      projectCode: 'CGY-2024-003',
      projectName: 'Community Composting Expansion',
      description: 'Expand curbside organic waste collection to all residential neighborhoods and establish community composting hubs.',
      projectType: 'Waste Diversion Program',
      sector: 'WASTE_MANAGEMENT',
      status: 'IN_PROGRESS',
      priorityLevel: 'MEDIUM',
      estimatedGhgReduction: 800,
      estimatedCost: 1200000,
      totalBudget: 1200000,
      totalSecuredFunding: 1200000,
      fundingGap: 0,
      plannedStartDate: new Date('2024-01-15'),
      actualStartDate: new Date('2024-02-01'),
      estimatedCompletionDate: new Date('2025-03-31'),
      completionPercentage: 60,
      createdBy: calgaryStaff.id,
    },
  });

  console.log(`✅ Created 3 projects for Calgary\n`);

  // ============================================================================
  // FUNDING SOURCES
  // ============================================================================
  console.log('💰 Creating funding sources...');

  // Calgary Project 1 Funding
  await prisma.funding.createMany({
    data: [
      {
        projectId: calgaryProject1.id,
        funderName: 'Infrastructure Canada',
        funderType: 'FEDERAL',
        grantProgram: 'Active Transportation Fund',
        amount: 1000000,
        status: 'RECEIVED',
        applicationDate: new Date('2023-09-15'),
        approvalDate: new Date('2024-01-20'),
        receivedDate: new Date('2024-03-15'),
      },
      {
        projectId: calgaryProject1.id,
        funderName: 'Alberta Infrastructure',
        funderType: 'PROVINCIAL',
        grantProgram: 'Municipal Sustainability Initiative',
        amount: 500000,
        status: 'APPROVED',
        applicationDate: new Date('2023-10-01'),
        approvalDate: new Date('2024-02-15'),
      },
      {
        projectId: calgaryProject1.id,
        funderName: 'City of Calgary',
        funderType: 'MUNICIPAL',
        amount: 300000,
        status: 'RECEIVED',
        receivedDate: new Date('2024-04-01'),
      },
    ],
  });

  console.log(`✅ Created funding sources for projects\n`);

  // ============================================================================
  // MILESTONES
  // ============================================================================
  console.log('🎯 Creating project milestones...');

  // Calgary Project 1 Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: calgaryProject1.id,
        milestoneName: 'Design Approval',
        description: 'Complete detailed design and obtain city council approval',
        targetDate: new Date('2024-06-30'),
        actualDate: new Date('2024-06-15'),
        status: 'COMPLETED',
        displayOrder: 1,
      },
      {
        projectId: calgaryProject1.id,
        milestoneName: 'Phase 1 Construction (Downtown Core)',
        description: 'Install 5 km of protected lanes on major downtown streets',
        targetDate: new Date('2024-10-31'),
        status: 'IN_PROGRESS',
        displayOrder: 2,
      },
      {
        projectId: calgaryProject1.id,
        milestoneName: 'Phase 2 Construction (Transit Connections)',
        description: 'Connect bike lanes to LRT stations',
        targetDate: new Date('2025-05-31'),
        status: 'NOT_STARTED',
        displayOrder: 3,
      },
    ],
  });

  console.log(`✅ Created project milestones\n`);

  // ============================================================================
  // LINK RECOMMENDATIONS TO PROJECTS
  // ============================================================================
  console.log('🔗 Linking recommendations to projects...');

  await prisma.recommendation.update({
    where: { id: recommendation1.id },
    data: {
      linkedProjects: {
        connect: { id: calgaryProject1.id },
      },
    },
  });

  await prisma.recommendation.update({
    where: { id: recommendation3.id },
    data: {
      linkedProjects: {
        connect: { id: calgaryProject3.id },
      },
    },
  });

  console.log(`✅ Linked recommendations to projects\n`);

  // ============================================================================
  // AI EXTRACTION LOGS (Sample Data)
  // ============================================================================
  console.log('🤖 Creating AI extraction log samples...');

  await prisma.aiExtractionLog.createMany({
    data: [
      {
        userId: calgaryStaff.id,
        documentType: 'assessment',
        fileName: 'Quest_Calgary_Assessment_2023.pdf',
        fileSize: 5242880, // 5 MB
        filePath: '/uploads/assessments/quest-calgary-2023.pdf',
        status: 'COMPLETED',
        extractedData: {
          community: { name: 'Calgary', province: 'AB' },
          assessment: { year: 2023, assessorName: 'Dr. Jennifer Park' },
          indicators: [],
        },
        confidenceScores: { overall: 95 },
        insertedRecordIds: { assessmentId: calgaryAssessment2023.id },
        processingTimeMs: 12500,
        tokensUsed: 45000,
        costUsd: 0.68,
        createdAt: new Date('2024-09-01T10:30:00Z'),
        completedAt: new Date('2024-09-01T10:30:13Z'),
      },
    ],
  });

  console.log(`✅ Created AI extraction logs\n`);

  // ============================================================================
  // OPEN SAAS OPTIONAL: Create sample tasks (if using task feature)
  // ============================================================================
  console.log('✅ Creating sample Open SaaS tasks (optional feature)...');

  await prisma.task.createMany({
    data: [
      {
        description: 'Review Calgary 2024 assessment draft',
        isDone: false,
        userId: calgaryStaff.id,
      },
      {
        description: 'Update project milestone dates',
        isDone: false,
        userId: calgaryStaff.id,
      },
      {
        description: 'Submit funding application for Phase 2',
        isDone: true,
        userId: edmontonStaff.id,
      },
    ],
  });

  console.log(`✅ Created sample tasks\n`);

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('📊 Seed Summary:');
  console.log('=====================================');

  const userCount = await prisma.user.count();
  const communityCount = await prisma.community.count();
  const assessmentCount = await prisma.assessment.count();
  const projectCount = await prisma.project.count();
  const fundingCount = await prisma.funding.count();
  const milestoneCount = await prisma.milestone.count();
  const indicatorCount = await prisma.indicatorScore.count();
  const strengthCount = await prisma.strength.count();
  const recommendationCount = await prisma.recommendation.count();
  const aiLogCount = await prisma.aiExtractionLog.count();
  const taskCount = await prisma.task.count();

  console.log(`👥 Users: ${userCount}`);
  console.log(`🏙️  Communities: ${communityCount}`);
  console.log(`📊 Assessments: ${assessmentCount}`);
  console.log(`🏗️  Projects: ${projectCount}`);
  console.log(`💰 Funding Sources: ${fundingCount}`);
  console.log(`🎯 Milestones: ${milestoneCount}`);
  console.log(`📈 Indicator Scores: ${indicatorCount}`);
  console.log(`💪 Strengths: ${strengthCount}`);
  console.log(`💡 Recommendations: ${recommendationCount}`);
  console.log(`🤖 AI Extraction Logs: ${aiLogCount}`);
  console.log(`✅ Tasks (Open SaaS): ${taskCount}`);
  console.log('=====================================\n');

  console.log('🔐 Login Credentials (all users):');
  console.log('Password: QuestCanada2025!');
  console.log('');
  console.log('Accounts:');
  console.log('- admin@questcanada.org (username: admin) - ADMIN + isAdmin=true');
  console.log('- staff@calgary.ca (username: calgary_staff) - Calgary Staff');
  console.log('- staff@edmonton.ca (username: edmonton_staff) - Edmonton Staff');
  console.log('- funder@federalgovernment.ca (username: funder_gov) - Funder');
  console.log('- viewer@example.com (username: public_viewer) - Public Viewer');
  console.log('');
  console.log('✅ Database seeding completed successfully!');
  console.log('✅ Schema is compatible with both Open SaaS and Quest Canada features!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
