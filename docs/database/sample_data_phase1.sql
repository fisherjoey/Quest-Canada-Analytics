-- Phase 1 Sample Data for Quest Canada Gap Analysis
-- Creates comprehensive test data for benchmarks and projects

-- ============================================================================
-- PART 1: Additional Communities (if needed)
-- ============================================================================

-- Ensure we have diverse communities across Canada
INSERT INTO communities (name, population, province, community_type, baseline_emissions_tco2e)
VALUES
  ('Toronto', 2930000, 'ON', 'city', 15500000),
  ('Montreal', 1780000, 'QC', 'city', 12000000),
  ('Halifax', 430000, 'NS', 'city', 1200000),
  ('Saskatoon', 330000, 'SK', 'city', 850000),
  ('St. John''s', 220000, 'NL', 'city', 600000)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 2: Benchmark Assessments with Scores
-- ============================================================================

-- Create comprehensive benchmark assessments for major cities
-- Calgary Assessment (2024)
INSERT INTO benchmark_assessments (
  community_id, assessment_date, assessment_year,
  assessor_name, assessor_organization, assessment_status
)
SELECT
  id, '2024-03-15', 2024,
  'Dr. Sarah Chen', 'QUEST Canada', 'completed'
FROM communities WHERE name = 'Calgary'
ON CONFLICT DO NOTHING
RETURNING id;

-- Add scores for Calgary (High performer - 75% average)
WITH calgary_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Calgary' AND ba.assessment_year = 2024
  LIMIT 1
)
INSERT INTO benchmark_scores (assessment_id, indicator_id, indicator_points_earned, indicator_points_possible)
SELECT
  ca.assessment_id,
  bi.id,
  bi.default_max_points * 0.75,  -- 75% score
  bi.default_max_points
FROM calgary_assessment ca
CROSS JOIN benchmark_indicators bi
ON CONFLICT DO NOTHING;

-- Vancouver Assessment (2024) - Medium performer
INSERT INTO benchmark_assessments (
  community_id, assessment_date, assessment_year,
  assessor_name, assessor_organization, assessment_status
)
SELECT
  id, '2024-04-20', 2024,
  'Michael Wong', 'QUEST Canada', 'completed'
FROM communities WHERE name = 'Vancouver'
ON CONFLICT DO NOTHING;

WITH vancouver_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Vancouver' AND ba.assessment_year = 2024
  LIMIT 1
)
INSERT INTO benchmark_scores (assessment_id, indicator_id, indicator_points_earned, indicator_points_possible)
SELECT
  ca.assessment_id,
  bi.id,
  bi.default_max_points * 0.62,  -- 62% score
  bi.default_max_points
FROM vancouver_assessment ca
CROSS JOIN benchmark_indicators bi
ON CONFLICT DO NOTHING;

-- Toronto Assessment (2024) - High performer
INSERT INTO benchmark_assessments (
  community_id, assessment_date, assessment_year,
  assessor_name, assessor_organization, assessment_status
)
SELECT
  id, '2024-05-10', 2024,
  'Dr. Jennifer Liu', 'QUEST Canada', 'completed'
FROM communities WHERE name = 'Toronto'
ON CONFLICT DO NOTHING;

WITH toronto_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Toronto' AND ba.assessment_year = 2024
  LIMIT 1
)
INSERT INTO benchmark_scores (assessment_id, indicator_id, indicator_points_earned, indicator_points_possible)
SELECT
  ca.assessment_id,
  bi.id,
  bi.default_max_points * 0.82,  -- 82% score (top performer)
  bi.default_max_points
FROM toronto_assessment ca
CROSS JOIN benchmark_indicators bi
ON CONFLICT DO NOTHING;

-- Edmonton Assessment (2024) - Improving
INSERT INTO benchmark_assessments (
  community_id, assessment_date, assessment_year,
  assessor_name, assessor_organization, assessment_status
)
SELECT
  id, '2024-06-01', 2024,
  'Robert Singh', 'QUEST Canada', 'completed'
FROM communities WHERE name = 'Edmonton'
ON CONFLICT DO NOTHING;

WITH edmonton_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Edmonton' AND ba.assessment_year = 2024
  LIMIT 1
)
INSERT INTO benchmark_scores (assessment_id, indicator_id, indicator_points_earned, indicator_points_possible)
SELECT
  ca.assessment_id,
  bi.id,
  bi.default_max_points * 0.58,  -- 58% score
  bi.default_max_points
FROM edmonton_assessment ca
CROSS JOIN benchmark_indicators bi
ON CONFLICT DO NOTHING;

-- Update overall scores for all assessments
UPDATE benchmark_assessments
SET overall_score = (
  SELECT AVG(indicator_percentage)
  FROM benchmark_scores
  WHERE benchmark_scores.assessment_id = benchmark_assessments.id
)
WHERE overall_score IS NULL;

-- ============================================================================
-- PART 3: Benchmark Recommendations
-- ============================================================================

-- Add sample recommendations for Calgary
WITH calgary_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Calgary' AND ba.assessment_year = 2024
  LIMIT 1
)
INSERT INTO benchmark_recommendations (
  assessment_id, indicator_id, recommendation_text, priority_level, implementation_status, display_order
)
SELECT
  ca.assessment_id,
  (SELECT id FROM benchmark_indicators WHERE indicator_name = 'Buildings'),
  'Implement mandatory energy audits for municipal buildings and create retrofit program',
  'high',
  'in_progress',
  1
FROM calgary_assessment ca
UNION ALL
SELECT
  ca.assessment_id,
  (SELECT id FROM benchmark_indicators WHERE indicator_name = 'Transportation'),
  'Expand electric vehicle charging infrastructure in downtown core',
  'medium',
  'in_progress',
  2
FROM calgary_assessment ca
UNION ALL
SELECT
  ca.assessment_id,
  (SELECT id FROM benchmark_indicators WHERE indicator_name = 'Waste & Water'),
  'Develop organic waste diversion program for commercial sector',
  'high',
  'in_progress',
  3
FROM calgary_assessment ca
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: Community Projects
-- ============================================================================

-- Calgary Projects
INSERT INTO community_projects (
  community_id, project_name, description, project_type, sector,
  status, priority_level, estimated_ghg_reduction_tco2e, estimated_cost_cad,
  estimated_completion_date
)
SELECT
  c.id,
  'Municipal Building Retrofit Program',
  'Comprehensive energy retrofits for 15 municipal buildings including LED lighting, HVAC upgrades, and building envelope improvements',
  'building_retrofit',
  'commercial',
  'in_progress',
  'high',
  850.5,
  2500000,
  '2025-12-31'::date
FROM communities c WHERE c.name = 'Calgary'
UNION ALL
SELECT
  c.id,
  'Downtown EV Charging Network',
  'Installation of 50 Level 2 and 10 DC fast charging stations in downtown parking facilities',
  'transportation',
  'transportation',
  'approved',
  'medium',
  320.0,
  750000,
  '2025-06-30'::date
FROM communities c WHERE c.name = 'Calgary'
UNION ALL
SELECT
  c.id,
  'Commercial Organic Waste Program',
  'Pilot program for organic waste collection from restaurants and grocery stores',
  'waste_management',
  'waste',
  'in_progress',
  'high',
  180.0,
  450000,
  '2025-09-30'::date
FROM communities c WHERE c.name = 'Calgary'
ON CONFLICT DO NOTHING;

-- Vancouver Projects
INSERT INTO community_projects (
  community_id, project_name, description, project_type, sector,
  status, priority_level, estimated_ghg_reduction_tco2e, estimated_cost_cad,
  estimated_completion_date
)
SELECT
  c.id,
  'Zero Emissions Transit Fleet Conversion',
  'Procurement of 25 electric buses to replace aging diesel fleet',
  'transportation',
  'transportation',
  'in_progress',
  'critical',
  1250.0,
  15000000,
  '2026-03-31'::date
FROM communities c WHERE c.name = 'Vancouver'
UNION ALL
SELECT
  c.id,
  'District Energy Expansion - False Creek',
  'Extend neighborhood district energy system to serve additional 500 units',
  'district_energy',
  'energy',
  'planned',
  'high',
  680.0,
  8500000,
  '2026-12-31'::date
FROM communities c WHERE c.name = 'Vancouver'
UNION ALL
SELECT
  c.id,
  'Green Building Incentive Program',
  'Financial incentives for commercial buildings achieving LEED Gold or better',
  'policy_program',
  'commercial',
  'approved',
  'medium',
  420.0,
  1200000,
  '2025-12-31'::date
FROM communities c WHERE c.name = 'Vancouver'
ON CONFLICT DO NOTHING;

-- Toronto Projects
INSERT INTO community_projects (
  community_id, project_name, description, project_type, sector,
  status, priority_level, estimated_ghg_reduction_tco2e, estimated_cost_cad,
  estimated_completion_date
)
SELECT
  c.id,
  'Solar Installation Program - Municipal Facilities',
  'Rooftop solar installations on 30 municipal buildings and recreation centers',
  'renewable_energy',
  'energy',
  'in_progress',
  'high',
  540.0,
  3200000,
  '2025-11-30'::date
FROM communities c WHERE c.name = 'Toronto'
UNION ALL
SELECT
  c.id,
  'Complete Streets Infrastructure Upgrade',
  'Protected bike lanes, pedestrian improvements, and transit priority on 5 major corridors',
  'transportation',
  'transportation',
  'in_progress',
  'critical',
  890.0,
  12000000,
  '2026-06-30'::date
FROM communities c WHERE c.name = 'Toronto'
UNION ALL
SELECT
  c.id,
  'Smart Building Energy Management System',
  'AI-powered building management system for 50 municipal buildings',
  'building_retrofit',
  'commercial',
  'approved',
  'medium',
  310.0,
  1800000,
  '2025-08-31'::date
FROM communities c WHERE c.name = 'Toronto'
ON CONFLICT DO NOTHING;

-- Edmonton Projects
INSERT INTO community_projects (
  community_id, project_name, description, project_type, sector,
  status, priority_level, estimated_ghg_reduction_tco2e, estimated_cost_cad,
  estimated_completion_date
)
SELECT
  c.id,
  'Industrial Waste Heat Recovery',
  'Capture and utilize waste heat from industrial facilities for district heating',
  'district_energy',
  'industrial',
  'planned',
  'high',
  2100.0,
  18000000,
  '2027-12-31'::date
FROM communities c WHERE c.name = 'Edmonton'
UNION ALL
SELECT
  c.id,
  'LED Street Lighting Conversion',
  'Replace all 45,000 street lights with LED fixtures and smart controls',
  'building_retrofit',
  'cross-cutting',
  'in_progress',
  'medium',
  450.0,
  6500000,
  '2025-10-31'::date
FROM communities c WHERE c.name = 'Edmonton'
UNION ALL
SELECT
  c.id,
  'Transit Electrification Feasibility Study',
  'Comprehensive study of bus fleet electrification costs and infrastructure needs',
  'policy_program',
  'transportation',
  'concept',
  'medium',
  0.0,
  250000,
  '2025-12-31'::date
FROM communities c WHERE c.name = 'Edmonton'
ON CONFLICT DO NOTHING;

-- Winnipeg Projects
INSERT INTO community_projects (
  community_id, project_name, description, project_type, sector,
  status, priority_level, estimated_ghg_reduction_tco2e, estimated_cost_cad,
  estimated_completion_date
)
SELECT
  c.id,
  'Residential Energy Efficiency Program',
  'Free home energy audits and rebates for insulation and heating upgrades',
  'building_retrofit',
  'residential',
  'in_progress',
  'high',
  620.0,
  3500000,
  '2026-03-31'::date
FROM communities c WHERE c.name = 'Winnipeg'
UNION ALL
SELECT
  c.id,
  'Wind Power Purchase Agreement',
  'Long-term PPA for 50MW wind farm to power municipal operations',
  'renewable_energy',
  'energy',
  'approved',
  'critical',
  15000.0,
  75000000,
  '2027-06-30'::date
FROM communities c WHERE c.name = 'Winnipeg'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: Link Projects to Benchmark Recommendations
-- ============================================================================

-- Link Calgary projects to their benchmark recommendations
WITH calgary_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Calgary' AND ba.assessment_year = 2024
  LIMIT 1
),
building_recommendation AS (
  SELECT br.id as recommendation_id
  FROM benchmark_recommendations br
  JOIN calgary_assessment ca ON br.assessment_id = ca.assessment_id
  WHERE br.recommendation_text LIKE '%municipal buildings%'
  LIMIT 1
),
building_project AS (
  SELECT cp.id as project_id
  FROM community_projects cp
  JOIN communities c ON cp.community_id = c.id
  WHERE c.name = 'Calgary' AND cp.project_name LIKE '%Municipal Building Retrofit%'
  LIMIT 1
)
INSERT INTO project_recommendation_links (project_id, recommendation_id, link_type)
SELECT bp.project_id, br.recommendation_id, 'addresses'
FROM building_project bp, building_recommendation br
ON CONFLICT DO NOTHING;

-- Link more Calgary projects
WITH calgary_assessment AS (
  SELECT ba.id as assessment_id
  FROM benchmark_assessments ba
  JOIN communities c ON ba.community_id = c.id
  WHERE c.name = 'Calgary' AND ba.assessment_year = 2024
  LIMIT 1
),
ev_recommendation AS (
  SELECT br.id as recommendation_id
  FROM benchmark_recommendations br
  JOIN calgary_assessment ca ON br.assessment_id = ca.assessment_id
  WHERE br.recommendation_text LIKE '%electric vehicle%'
  LIMIT 1
),
ev_project AS (
  SELECT cp.id as project_id
  FROM community_projects cp
  JOIN communities c ON cp.community_id = c.id
  WHERE c.name = 'Calgary' AND cp.project_name LIKE '%EV Charging%'
  LIMIT 1
)
INSERT INTO project_recommendation_links (project_id, recommendation_id, link_type)
SELECT ep.project_id, er.recommendation_id, 'addresses'
FROM ev_project ep, ev_recommendation er
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 6: Project Progress Updates
-- ============================================================================

-- Update some projects with completion percentages and actual metrics
UPDATE community_projects
SET
  completion_percentage = 45,
  actual_cost_cad = 1200000
WHERE project_name = 'Municipal Building Retrofit Program';

UPDATE community_projects
SET
  completion_percentage = 65,
  actual_cost_cad = 420000
WHERE project_name = 'Downtown EV Charging Network';

UPDATE community_projects
SET
  completion_percentage = 30,
  actual_ghg_reduction_tco2e = 85.0,
  actual_cost_cad = 190000
WHERE project_name = 'Commercial Organic Waste Program';

UPDATE community_projects
SET
  completion_percentage = 55,
  actual_cost_cad = 1850000
WHERE project_name = 'Solar Installation Program - Municipal Facilities';

UPDATE community_projects
SET
  completion_percentage = 70,
  actual_cost_cad = 3100000
WHERE project_name = 'LED Street Lighting Conversion';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Summary of created data
SELECT
  'Communities' as entity,
  COUNT(*) as count
FROM communities
UNION ALL
SELECT
  'Benchmark Assessments',
  COUNT(*)
FROM benchmark_assessments
UNION ALL
SELECT
  'Benchmark Scores',
  COUNT(*)
FROM benchmark_scores
UNION ALL
SELECT
  'Benchmark Recommendations',
  COUNT(*)
FROM benchmark_recommendations
UNION ALL
SELECT
  'Community Projects',
  COUNT(*)
FROM community_projects
UNION ALL
SELECT
  'Project-Recommendation Links',
  COUNT(*)
FROM project_recommendation_links
ORDER BY entity;

-- Show project summary by status
SELECT
  status,
  COUNT(*) as project_count,
  SUM(estimated_ghg_reduction_tco2e) as total_estimated_ghg,
  SUM(estimated_cost_cad) as total_estimated_cost
FROM community_projects
GROUP BY status
ORDER BY project_count DESC;

-- Show assessment summary by community
SELECT
  c.name,
  c.province,
  ba.assessment_year,
  ROUND(ba.overall_score::numeric, 1) as overall_score_pct
FROM benchmark_assessments ba
JOIN communities c ON ba.community_id = c.id
WHERE ba.overall_score IS NOT NULL
ORDER BY ba.overall_score DESC;
