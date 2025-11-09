/**
 * Quest Canada Database Seed Script
 *
 * Populates database with demo data:
 * - 3 Communities (Calgary, Edmonton, Vancouver)
 * - 5 Users (1 admin, 2 community staff, 1 funder, 1 public viewer)
 * - 2 Assessments per community
 * - 5 Projects per community
 * - Funding sources and milestones for each project
 *
 * Usage: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Password hashing configuration
const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'QuestCanada2025!';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('👥 Creating users...');

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@questcanada.org',
      passwordHash: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    },
  });

  const funderUser = await prisma.user.create({
    data: {
      email: 'funder@federalgovernment.ca',
      passwordHash: hashedPassword,
      firstName: 'Emily',
      lastName: 'Thompson',
      role: 'FUNDER',
      emailVerified: true,
      isActive: true,
    },
  });

  const publicViewer = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      passwordHash: hashedPassword,
      firstName: 'Public',
      lastName: 'Viewer',
      role: 'PUBLIC_VIEWER',
      emailVerified: true,
      isActive: true,
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
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'COMMUNITY_STAFF',
      communityId: calgary.id,
      emailVerified: true,
      isActive: true,
    },
  });

  const edmontonStaff = await prisma.user.create({
    data: {
      email: 'staff@edmonton.ca',
      passwordHash: hashedPassword,
      firstName: 'James',
      lastName: 'Chen',
      role: 'COMMUNITY_STAFF',
      communityId: edmonton.id,
      emailVerified: true,
      isActive: true,
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
  // PROJECTS - CALGARY
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

  const calgaryProject4 = await prisma.project.create({
    data: {
      communityId: calgary.id,
      projectCode: 'CGY-2023-004',
      projectName: 'Solar Farm - Phase 1',
      description: '5 MW solar photovoltaic installation on city-owned land to power municipal operations.',
      projectType: 'Renewable Energy Generation',
      sector: 'RENEWABLE_ENERGY',
      status: 'COMPLETED',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 2400,
      estimatedEnergyReduction: 12000,
      estimatedCost: 6500000,
      totalBudget: 6500000,
      totalSecuredFunding: 6500000,
      fundingGap: 0,
      plannedStartDate: new Date('2023-03-01'),
      actualStartDate: new Date('2023-04-10'),
      estimatedCompletionDate: new Date('2024-06-30'),
      actualCompletionDate: new Date('2024-05-28'),
      completionPercentage: 100,
      createdBy: calgaryStaff.id,
    },
  });

  const calgaryProject5 = await prisma.project.create({
    data: {
      communityId: calgary.id,
      projectCode: 'CGY-2024-005',
      projectName: 'Electric Transit Bus Pilot',
      description: 'Purchase and deploy 10 electric buses on high-frequency routes with charging infrastructure.',
      projectType: 'Zero-Emission Vehicles',
      sector: 'TRANSPORTATION',
      status: 'FUNDED',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 950,
      estimatedCost: 8000000,
      totalBudget: 8000000,
      totalSecuredFunding: 8000000,
      fundingGap: 0,
      plannedStartDate: new Date('2025-01-15'),
      estimatedCompletionDate: new Date('2025-12-31'),
      completionPercentage: 5,
      createdBy: calgaryStaff.id,
    },
  });

  console.log(`✅ Created 5 projects for Calgary\n`);

  // ============================================================================
  // PROJECTS - EDMONTON
  // ============================================================================

  const edmontonProject1 = await prisma.project.create({
    data: {
      communityId: edmonton.id,
      projectCode: 'EDM-2024-001',
      projectName: 'District Energy System Expansion',
      description: 'Expand district heating network to serve downtown core using waste heat recovery.',
      projectType: 'District Energy',
      sector: 'ENERGY_EFFICIENCY',
      status: 'IN_PROGRESS',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 3500,
      estimatedEnergyReduction: 25000,
      estimatedCost: 15000000,
      totalBudget: 15000000,
      totalSecuredFunding: 10000000,
      fundingGap: 5000000,
      plannedStartDate: new Date('2024-06-01'),
      actualStartDate: new Date('2024-07-10'),
      estimatedCompletionDate: new Date('2026-12-31'),
      completionPercentage: 20,
      createdBy: edmontonStaff.id,
    },
  });

  const edmontonProject2 = await prisma.project.create({
    data: {
      communityId: edmonton.id,
      projectCode: 'EDM-2024-002',
      projectName: 'LED Streetlight Conversion',
      description: 'Replace all remaining HPS streetlights with energy-efficient LED fixtures.',
      projectType: 'Energy Efficiency',
      sector: 'ENERGY_EFFICIENCY',
      status: 'IN_PROGRESS',
      priorityLevel: 'MEDIUM',
      estimatedGhgReduction: 1100,
      estimatedEnergyReduction: 15000,
      estimatedCost: 3500000,
      totalBudget: 3500000,
      totalSecuredFunding: 3500000,
      fundingGap: 0,
      plannedStartDate: new Date('2024-03-01'),
      actualStartDate: new Date('2024-04-01'),
      estimatedCompletionDate: new Date('2025-09-30'),
      completionPercentage: 55,
      createdBy: edmontonStaff.id,
    },
  });

  const edmontonProject3 = await prisma.project.create({
    data: {
      communityId: edmonton.id,
      projectCode: 'EDM-2024-003',
      projectName: 'LRT Extension - Valley Line West',
      description: 'Extend light rail transit system westward to reduce vehicle trips and emissions.',
      projectType: 'Public Transit',
      sector: 'TRANSPORTATION',
      status: 'IN_DESIGN',
      priorityLevel: 'HIGH',
      estimatedGhgReduction: 4200,
      estimatedCost: 250000000,
      totalBudget: 250000000,
      totalSecuredFunding: 200000000,
      fundingGap: 50000000,
      plannedStartDate: new Date('2025-09-01'),
      estimatedCompletionDate: new Date('2030-06-30'),
      completionPercentage: 10,
      createdBy: edmontonStaff.id,
    },
  });

  const edmontonProject4 = await prisma.project.create({
    data: {
      communityId: edmonton.id,
      projectCode: 'EDM-2023-004',
      projectName: 'Energy Efficiency Rebate Program',
      description: 'Residential and commercial energy efficiency rebate program for insulation, windows, and HVAC upgrades.',
      projectType: 'Incentive Program',
      sector: 'BUILDINGS',
      status: 'COMPLETED',
      priorityLevel: 'MEDIUM',
      estimatedGhgReduction: 2800,
      estimatedEnergyReduction: 18000,
      estimatedCost: 5000000,
      totalBudget: 5000000,
      totalSecuredFunding: 5000000,
      fundingGap: 0,
      plannedStartDate: new Date('2023-01-01'),
      actualStartDate: new Date('2023-01-15'),
      estimatedCompletionDate: new Date('2024-12-31'),
      actualCompletionDate: new Date('2024-11-30'),
      completionPercentage: 100,
      createdBy: edmontonStaff.id,
    },
  });

  const edmontonProject5 = await prisma.project.create({
    data: {
      communityId: edmonton.id,
      projectCode: 'EDM-2024-005',
      projectName: 'Urban Forest Carbon Sequestration',
      description: 'Plant 100,000 trees across the city to increase carbon sequestration and reduce urban heat island effect.',
      projectType: 'Natural Climate Solutions',
      sector: 'LAND_USE',
      status: 'IN_PROGRESS',
      priorityLevel: 'MEDIUM',
      estimatedGhgReduction: 500,
      estimatedCost: 2000000,
      totalBudget: 2000000,
      totalSecuredFunding: 1500000,
      fundingGap: 500000,
      plannedStartDate: new Date('2024-04-01'),
      actualStartDate: new Date('2024-05-01'),
      estimatedCompletionDate: new Date('2027-10-31'),
      completionPercentage: 25,
      createdBy: edmontonStaff.id,
    },
  });

  console.log(`✅ Created 5 projects for Edmonton\n`);

  // ============================================================================
  // PROJECTS - VANCOUVER
  // ============================================================================

  await prisma.project.createMany({
    data: [
      {
        communityId: vancouver.id,
        projectCode: 'VAN-2024-001',
        projectName: 'Zero Emission Building Code',
        description: 'Implement building code requiring all new buildings to be zero-emission ready.',
        projectType: 'Policy Implementation',
        sector: 'BUILDINGS',
        status: 'COMPLETED',
        priorityLevel: 'HIGH',
        estimatedGhgReduction: 8000,
        estimatedCost: 500000,
        totalBudget: 500000,
        totalSecuredFunding: 500000,
        fundingGap: 0,
        plannedStartDate: new Date('2023-06-01'),
        actualStartDate: new Date('2023-07-01'),
        estimatedCompletionDate: new Date('2024-01-01'),
        actualCompletionDate: new Date('2024-01-01'),
        completionPercentage: 100,
        createdBy: adminUser.id,
      },
      {
        communityId: vancouver.id,
        projectCode: 'VAN-2024-002',
        projectName: 'False Creek Neighborhood Energy Utility',
        description: 'Low-carbon district energy system serving Southeast False Creek neighborhood.',
        projectType: 'District Energy',
        sector: 'ENERGY_EFFICIENCY',
        status: 'IN_PROGRESS',
        priorityLevel: 'HIGH',
        estimatedGhgReduction: 2500,
        estimatedEnergyReduction: 20000,
        estimatedCost: 12000000,
        totalBudget: 12000000,
        totalSecuredFunding: 12000000,
        fundingGap: 0,
        plannedStartDate: new Date('2023-09-01'),
        actualStartDate: new Date('2023-10-15'),
        estimatedCompletionDate: new Date('2025-06-30'),
        completionPercentage: 70,
        createdBy: adminUser.id,
      },
      {
        communityId: vancouver.id,
        projectCode: 'VAN-2024-003',
        projectName: 'Electric Vehicle Charging Network',
        description: 'Install 500 Level 2 EV charging stations in residential neighborhoods and 50 DC fast chargers at key locations.',
        projectType: 'EV Infrastructure',
        sector: 'TRANSPORTATION',
        status: 'IN_PROGRESS',
        priorityLevel: 'HIGH',
        estimatedGhgReduction: 1800,
        estimatedCost: 7500000,
        totalBudget: 7500000,
        totalSecuredFunding: 6000000,
        fundingGap: 1500000,
        plannedStartDate: new Date('2024-02-01'),
        actualStartDate: new Date('2024-03-15'),
        estimatedCompletionDate: new Date('2025-12-31'),
        completionPercentage: 40,
        createdBy: adminUser.id,
      },
      {
        communityId: vancouver.id,
        projectCode: 'VAN-2024-004',
        projectName: 'Residential Food Scraps Collection',
        description: 'Citywide organic waste collection with processing at Zero Waste Centre.',
        projectType: 'Waste Diversion',
        sector: 'WASTE_MANAGEMENT',
        status: 'COMPLETED',
        priorityLevel: 'MEDIUM',
        estimatedGhgReduction: 950,
        estimatedCost: 2500000,
        totalBudget: 2500000,
        totalSecuredFunding: 2500000,
        fundingGap: 0,
        plannedStartDate: new Date('2022-01-01'),
        actualStartDate: new Date('2022-02-01'),
        estimatedCompletionDate: new Date('2023-12-31'),
        actualCompletionDate: new Date('2023-11-15'),
        completionPercentage: 100,
        createdBy: adminUser.id,
      },
      {
        communityId: vancouver.id,
        projectCode: 'VAN-2024-005',
        projectName: 'Seawall Extension & Active Transportation',
        description: 'Extend seawall walking and cycling path to connect new neighborhoods.',
        projectType: 'Active Transportation',
        sector: 'TRANSPORTATION',
        status: 'PLANNED',
        priorityLevel: 'MEDIUM',
        estimatedGhgReduction: 600,
        estimatedCost: 8000000,
        totalBudget: 8000000,
        totalSecuredFunding: 3000000,
        fundingGap: 5000000,
        plannedStartDate: new Date('2025-06-01'),
        estimatedCompletionDate: new Date('2027-10-31'),
        completionPercentage: 0,
        createdBy: adminUser.id,
      },
    ],
  });

  console.log(`✅ Created 5 projects for Vancouver\n`);

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

  // Calgary Project 2 Funding
  await prisma.funding.createMany({
    data: [
      {
        projectId: calgaryProject2.id,
        funderName: 'Federation of Canadian Municipalities',
        funderType: 'OTHER',
        grantProgram: 'Green Municipal Fund',
        amount: 2000000,
        status: 'APPROVED',
        applicationDate: new Date('2024-03-01'),
        approvalDate: new Date('2024-06-15'),
      },
      {
        projectId: calgaryProject2.id,
        funderName: 'Natural Resources Canada',
        funderType: 'FEDERAL',
        grantProgram: 'Energy Efficiency Retrofit Program',
        amount: 500000,
        status: 'PENDING',
        applicationDate: new Date('2024-07-01'),
      },
    ],
  });

  // Calgary Project 3 Funding
  await prisma.funding.create({
    data: {
      projectId: calgaryProject3.id,
      funderName: 'City of Calgary',
      funderType: 'MUNICIPAL',
      amount: 1200000,
      status: 'RECEIVED',
      receivedDate: new Date('2023-12-15'),
    },
  });

  // Calgary Project 4 Funding
  await prisma.funding.createMany({
    data: [
      {
        projectId: calgaryProject4.id,
        funderName: 'Natural Resources Canada',
        funderType: 'FEDERAL',
        grantProgram: 'Smart Renewables and Electrification Pathways',
        amount: 3000000,
        status: 'RECEIVED',
        applicationDate: new Date('2022-11-01'),
        approvalDate: new Date('2023-02-15'),
        receivedDate: new Date('2023-03-15'),
      },
      {
        projectId: calgaryProject4.id,
        funderName: 'ENMAX',
        funderType: 'UTILITY',
        grantProgram: 'Renewable Energy Partnership',
        amount: 2000000,
        status: 'RECEIVED',
        receivedDate: new Date('2023-03-01'),
      },
      {
        projectId: calgaryProject4.id,
        funderName: 'City of Calgary',
        funderType: 'MUNICIPAL',
        amount: 1500000,
        status: 'RECEIVED',
        receivedDate: new Date('2023-03-01'),
      },
    ],
  });

  // Calgary Project 5 Funding
  await prisma.funding.createMany({
    data: [
      {
        projectId: calgaryProject5.id,
        funderName: 'Environment and Climate Change Canada',
        funderType: 'FEDERAL',
        grantProgram: 'Zero Emission Transit Fund',
        amount: 6000000,
        status: 'RECEIVED',
        applicationDate: new Date('2023-12-01'),
        approvalDate: new Date('2024-04-15'),
        receivedDate: new Date('2024-06-01'),
      },
      {
        projectId: calgaryProject5.id,
        funderName: 'City of Calgary',
        funderType: 'MUNICIPAL',
        amount: 2000000,
        status: 'RECEIVED',
        receivedDate: new Date('2024-06-01'),
      },
    ],
  });

  // Edmonton Project 1 Funding
  await prisma.funding.createMany({
    data: [
      {
        projectId: edmontonProject1.id,
        funderName: 'Infrastructure Canada',
        funderType: 'FEDERAL',
        grantProgram: 'Investing in Canada Infrastructure Program',
        amount: 6000000,
        status: 'APPROVED',
        applicationDate: new Date('2023-10-15'),
        approvalDate: new Date('2024-03-20'),
      },
      {
        projectId: edmontonProject1.id,
        funderName: 'Alberta Municipal Affairs',
        funderType: 'PROVINCIAL',
        amount: 4000000,
        status: 'APPROVED',
        applicationDate: new Date('2023-11-01'),
        approvalDate: new Date('2024-04-10'),
      },
    ],
  });

  // Edmonton Project 2 Funding
  await prisma.funding.create({
    data: {
      projectId: edmontonProject2.id,
      funderName: 'Federation of Canadian Municipalities',
      funderType: 'OTHER',
      grantProgram: 'Green Municipal Fund',
      amount: 3500000,
      status: 'RECEIVED',
      applicationDate: new Date('2023-08-01'),
      approvalDate: new Date('2023-11-15'),
      receivedDate: new Date('2024-01-10'),
    },
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
      {
        projectId: calgaryProject1.id,
        milestoneName: 'Phase 3 Construction (Residential Links)',
        description: 'Extend network to residential neighborhoods',
        targetDate: new Date('2025-09-30'),
        status: 'NOT_STARTED',
        displayOrder: 4,
      },
      {
        projectId: calgaryProject1.id,
        milestoneName: 'Project Completion & Evaluation',
        description: 'Final inspection, signage, and usage evaluation',
        targetDate: new Date('2025-10-31'),
        status: 'NOT_STARTED',
        displayOrder: 5,
      },
    ],
  });

  // Calgary Project 2 Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Energy Audit',
        description: 'Complete comprehensive building energy audit',
        targetDate: new Date('2024-12-31'),
        status: 'IN_PROGRESS',
        displayOrder: 1,
      },
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Design Development',
        description: 'Finalize retrofit design and specifications',
        targetDate: new Date('2025-02-28'),
        status: 'NOT_STARTED',
        displayOrder: 2,
      },
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Contractor Procurement',
        description: 'Issue RFP and award construction contracts',
        targetDate: new Date('2025-04-30'),
        status: 'NOT_STARTED',
        displayOrder: 3,
      },
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Phase 1 - HVAC Replacement',
        description: 'Install new high-efficiency HVAC systems',
        targetDate: new Date('2025-10-31'),
        status: 'NOT_STARTED',
        displayOrder: 4,
      },
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Phase 2 - Envelope & Lighting',
        description: 'Upgrade building envelope and install LED lighting',
        targetDate: new Date('2026-06-30'),
        status: 'NOT_STARTED',
        displayOrder: 5,
      },
      {
        projectId: calgaryProject2.id,
        milestoneName: 'Commissioning & Verification',
        description: 'Performance testing and energy savings verification',
        targetDate: new Date('2026-08-31'),
        status: 'NOT_STARTED',
        displayOrder: 6,
      },
    ],
  });

  // Calgary Project 3 Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: calgaryProject3.id,
        milestoneName: 'Pilot Program Launch',
        description: 'Launch pilot in 5 neighborhoods',
        targetDate: new Date('2024-03-31'),
        actualDate: new Date('2024-03-15'),
        status: 'COMPLETED',
        displayOrder: 1,
      },
      {
        projectId: calgaryProject3.id,
        milestoneName: 'Zone 1 Expansion',
        description: 'Expand to northeast quadrant',
        targetDate: new Date('2024-08-31'),
        actualDate: new Date('2024-08-20'),
        status: 'COMPLETED',
        displayOrder: 2,
      },
      {
        projectId: calgaryProject3.id,
        milestoneName: 'Zone 2 Expansion',
        description: 'Expand to northwest and southwest',
        targetDate: new Date('2024-12-31'),
        status: 'IN_PROGRESS',
        displayOrder: 3,
      },
      {
        projectId: calgaryProject3.id,
        milestoneName: 'Citywide Implementation',
        description: 'Achieve 100% residential coverage',
        targetDate: new Date('2025-03-31'),
        status: 'NOT_STARTED',
        displayOrder: 4,
      },
    ],
  });

  // Edmonton Project 1 Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: edmontonProject1.id,
        milestoneName: 'Feasibility Study',
        description: 'Complete district energy feasibility and business case',
        targetDate: new Date('2024-08-31'),
        actualDate: new Date('2024-08-15'),
        status: 'COMPLETED',
        displayOrder: 1,
      },
      {
        projectId: edmontonProject1.id,
        milestoneName: 'Design & Permitting',
        description: 'Detailed engineering design and regulatory approvals',
        targetDate: new Date('2025-03-31'),
        status: 'IN_PROGRESS',
        displayOrder: 2,
      },
      {
        projectId: edmontonProject1.id,
        milestoneName: 'Energy Centre Construction',
        description: 'Build central energy plant and waste heat recovery system',
        targetDate: new Date('2025-12-31'),
        status: 'NOT_STARTED',
        displayOrder: 3,
      },
      {
        projectId: edmontonProject1.id,
        milestoneName: 'Distribution Network Installation',
        description: 'Install underground piping network',
        targetDate: new Date('2026-08-31'),
        status: 'NOT_STARTED',
        displayOrder: 4,
      },
      {
        projectId: edmontonProject1.id,
        milestoneName: 'Customer Connections',
        description: 'Connect first 20 buildings to system',
        targetDate: new Date('2026-12-31'),
        status: 'NOT_STARTED',
        displayOrder: 5,
      },
    ],
  });

  // Edmonton Project 2 Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: edmontonProject2.id,
        milestoneName: 'Phase 1 - Arterial Roads',
        description: 'Replace 10,000 lights on major arterials',
        targetDate: new Date('2024-08-31'),
        actualDate: new Date('2024-08-25'),
        status: 'COMPLETED',
        displayOrder: 1,
      },
      {
        projectId: edmontonProject2.id,
        milestoneName: 'Phase 2 - Collector Roads',
        description: 'Replace 15,000 lights on collector streets',
        targetDate: new Date('2025-03-31'),
        status: 'IN_PROGRESS',
        displayOrder: 2,
      },
      {
        projectId: edmontonProject2.id,
        milestoneName: 'Phase 3 - Residential Streets',
        description: 'Complete remaining residential areas',
        targetDate: new Date('2025-09-30'),
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
      {
        userId: edmontonStaff.id,
        documentType: 'project',
        fileName: 'District_Energy_Proposal.pdf',
        fileSize: 2621440, // 2.5 MB
        filePath: '/uploads/projects/district-energy.pdf',
        status: 'COMPLETED',
        extractedData: {
          project: { name: 'District Energy System Expansion' },
        },
        confidenceScores: { overall: 88 },
        insertedRecordIds: { projectId: edmontonProject1.id },
        processingTimeMs: 8200,
        tokensUsed: 28000,
        costUsd: 0.42,
        createdAt: new Date('2024-10-15T14:20:00Z'),
        completedAt: new Date('2024-10-15T14:20:08Z'),
      },
      {
        userId: calgaryStaff.id,
        documentType: 'funding',
        fileName: 'Federal_Grant_Approval_Letter.pdf',
        fileSize: 524288, // 512 KB
        filePath: '/uploads/funding/federal-grant.pdf',
        status: 'COMPLETED',
        extractedData: {
          funding: { amount: 1000000, funderName: 'Infrastructure Canada' },
        },
        confidenceScores: { overall: 98 },
        processingTimeMs: 4500,
        tokensUsed: 8000,
        costUsd: 0.12,
        createdAt: new Date('2024-11-05T09:15:00Z'),
        completedAt: new Date('2024-11-05T09:15:05Z'),
      },
    ],
  });

  console.log(`✅ Created AI extraction logs\n`);

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
  console.log('=====================================\n');

  console.log('🔐 Login Credentials (all users):');
  console.log('Password: QuestCanada2025!');
  console.log('');
  console.log('Accounts:');
  console.log('- admin@questcanada.org (Admin)');
  console.log('- staff@calgary.ca (Calgary Staff)');
  console.log('- staff@edmonton.ca (Edmonton Staff)');
  console.log('- funder@federalgovernment.ca (Funder)');
  console.log('- viewer@example.com (Public Viewer)');
  console.log('');
  console.log('✅ Database seeding completed successfully!');
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
