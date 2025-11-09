-- ============================================================================
-- COMMUNITY PROJECTS PIPELINE EXTENSION FOR QUEST CANADA DATABASE
-- Based on: Client Requirements Area 2 - Community Projects Pipeline
-- Purpose: Track community climate action projects from planning to completion
-- ============================================================================

-- ============================================================================
-- TABLE 1: Community Projects (Main Project Records)
-- ============================================================================
CREATE TABLE community_projects (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

    -- Project identification
    project_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE, -- e.g., 'CALG-2024-RETROFIT-001'
    description TEXT,

    -- Categorization
    project_type VARCHAR(100) NOT NULL, -- e.g., 'building_retrofit', 'renewable_energy', 'active_transport'
    sector VARCHAR(50) NOT NULL, -- 'residential', 'commercial', 'industrial', 'transportation', 'waste', 'energy'

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'planned' CHECK (
        status IN ('concept', 'planned', 'approved', 'in_progress', 'on_hold', 'completed', 'cancelled')
    ),
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (
        priority_level IN ('critical', 'high', 'medium', 'low')
    ),

    -- Timeline
    start_date DATE,
    estimated_completion_date DATE,
    actual_completion_date DATE,

    -- Financial
    estimated_cost_cad NUMERIC(15,2),
    actual_cost_cad NUMERIC(15,2),
    funding_secured_cad NUMERIC(15,2) DEFAULT 0,

    -- GHG Impact
    estimated_ghg_reduction_tco2e NUMERIC(12,2), -- Estimated annual reduction
    actual_ghg_reduction_tco2e NUMERIC(12,2), -- Measured annual reduction after completion
    ghg_reduction_methodology TEXT, -- How the reduction was calculated

    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

    -- Ownership
    lead_organization VARCHAR(255), -- e.g., 'City of Calgary', 'Local Utility', 'Community Group'
    project_manager VARCHAR(255),
    project_manager_email VARCHAR(255),

    -- Additional info
    website_url TEXT,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),

    -- Constraints
    CONSTRAINT valid_dates CHECK (
        (estimated_completion_date IS NULL OR start_date IS NULL OR estimated_completion_date >= start_date) AND
        (actual_completion_date IS NULL OR start_date IS NULL OR actual_completion_date >= start_date)
    ),
    CONSTRAINT valid_costs CHECK (
        (actual_cost_cad IS NULL OR actual_cost_cad >= 0) AND
        (estimated_cost_cad IS NULL OR estimated_cost_cad >= 0) AND
        (funding_secured_cad >= 0)
    )
);

CREATE INDEX idx_community_projects_community ON community_projects(community_id);
CREATE INDEX idx_community_projects_status ON community_projects(status);
CREATE INDEX idx_community_projects_type ON community_projects(project_type);
CREATE INDEX idx_community_projects_sector ON community_projects(sector);
CREATE INDEX idx_community_projects_dates ON community_projects(start_date, estimated_completion_date);

-- ============================================================================
-- TABLE 2: Project Tags (Flexible categorization)
-- ============================================================================
CREATE TABLE project_tags (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50), -- e.g., 'funding_source', 'partnership', 'technology', 'sdg_goal'

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (project_id, tag_name)
);

CREATE INDEX idx_project_tags_project ON project_tags(project_id);
CREATE INDEX idx_project_tags_name ON project_tags(tag_name);
CREATE INDEX idx_project_tags_category ON project_tags(tag_category);

-- ============================================================================
-- TABLE 3: Project Milestones (Timeline tracking)
-- ============================================================================
CREATE TABLE project_milestones (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Timeline
    target_date DATE,
    actual_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')
    ),

    -- Dependencies
    depends_on_milestone_id INTEGER REFERENCES project_milestones(id),

    -- Order
    display_order INTEGER NOT NULL,

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id, display_order);
CREATE INDEX idx_project_milestones_dates ON project_milestones(target_date, actual_date);

-- ============================================================================
-- TABLE 4: Project Funding Sources (Track multiple funders per project)
-- ============================================================================
CREATE TABLE project_funding_sources (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    funder_name VARCHAR(255) NOT NULL,
    funder_type VARCHAR(100), -- 'federal', 'provincial', 'municipal', 'private', 'ngo', 'utility'

    funding_amount_cad NUMERIC(15,2) NOT NULL CHECK (funding_amount_cad >= 0),
    funding_status VARCHAR(50) DEFAULT 'pending' CHECK (
        funding_status IN ('pending', 'applied', 'approved', 'received', 'rejected')
    ),

    grant_program_name VARCHAR(255),
    application_date DATE,
    approval_date DATE,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_project_funding_project ON project_funding_sources(project_id);
CREATE INDEX idx_project_funding_funder ON project_funding_sources(funder_name);

-- ============================================================================
-- TABLE 5: Project Partners (Collaboration tracking)
-- ============================================================================
CREATE TABLE project_partners (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    partner_name VARCHAR(255) NOT NULL,
    partner_type VARCHAR(100), -- 'municipality', 'utility', 'business', 'ngo', 'academic', 'community_group'
    role_description TEXT, -- What the partner contributes

    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (project_id, partner_name)
);

CREATE INDEX idx_project_partners_project ON project_partners(project_id);
CREATE INDEX idx_project_partners_name ON project_partners(partner_name);

-- ============================================================================
-- TABLE 6: Project Documents (File/link repository)
-- ============================================================================
CREATE TABLE project_documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- 'proposal', 'report', 'contract', 'permit', 'photo', 'presentation'
    file_url TEXT,

    description TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id),

    file_size_bytes BIGINT,
    mime_type VARCHAR(100)
);

CREATE INDEX idx_project_documents_project ON project_documents(project_id);

-- ============================================================================
-- TABLE 7: Project Updates (Activity log/news feed)
-- ============================================================================
CREATE TABLE project_updates (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    update_date TIMESTAMPTZ DEFAULT NOW(),
    update_type VARCHAR(50), -- 'status_change', 'milestone_completed', 'funding_secured', 'general_update'
    title VARCHAR(255) NOT NULL,
    description TEXT,

    posted_by INTEGER REFERENCES users(id),

    is_public BOOLEAN DEFAULT TRUE -- Can this update be shown in public dashboards?
);

CREATE INDEX idx_project_updates_project ON project_updates(project_id, update_date DESC);
CREATE INDEX idx_project_updates_date ON project_updates(update_date DESC);

-- ============================================================================
-- TABLE 8: Project-Benchmark Recommendations Link (Integration)
-- ============================================================================
CREATE TABLE project_recommendation_links (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,
    recommendation_id INTEGER NOT NULL REFERENCES benchmark_recommendations(id) ON DELETE CASCADE,

    -- Tracking
    link_type VARCHAR(50) DEFAULT 'addresses', -- 'addresses', 'supports', 'implements'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (project_id, recommendation_id)
);

CREATE INDEX idx_project_recommendation_links_project ON project_recommendation_links(project_id);
CREATE INDEX idx_project_recommendation_links_recommendation ON project_recommendation_links(recommendation_id);

-- ============================================================================
-- TABLE 9: Project Metrics (Tracked outcomes over time)
-- ============================================================================
CREATE TABLE project_metrics (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES community_projects(id) ON DELETE CASCADE,

    metric_date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- e.g., 'ghg_reduction', 'energy_savings', 'participants', 'buildings_retrofitted'
    metric_value NUMERIC(15,4) NOT NULL,
    metric_unit VARCHAR(50), -- e.g., 'tCO2e', 'GJ', 'people', 'buildings'

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (project_id, metric_date, metric_name)
);

CREATE INDEX idx_project_metrics_project ON project_metrics(project_id, metric_date);
CREATE INDEX idx_project_metrics_name ON project_metrics(metric_name);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- View: Active Projects Summary
CREATE VIEW active_projects_summary AS
SELECT
    c.name AS community_name,
    c.province,
    cp.id AS project_id,
    cp.project_name,
    cp.project_type,
    cp.sector,
    cp.status,
    cp.priority_level,
    cp.completion_percentage,
    cp.estimated_ghg_reduction_tco2e,
    cp.estimated_cost_cad,
    cp.funding_secured_cad,
    cp.start_date,
    cp.estimated_completion_date,
    CASE
        WHEN cp.estimated_completion_date < CURRENT_DATE AND cp.status NOT IN ('completed', 'cancelled')
        THEN 'Overdue'
        WHEN cp.estimated_completion_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        THEN 'Due Soon'
        ELSE 'On Track'
    END AS timeline_status
FROM community_projects cp
JOIN communities c ON cp.community_id = c.id
WHERE cp.status IN ('planned', 'approved', 'in_progress')
ORDER BY c.name, cp.priority_level, cp.estimated_completion_date;

-- View: Project Portfolio by Community
CREATE VIEW project_portfolio_by_community AS
SELECT
    c.id AS community_id,
    c.name AS community_name,
    c.province,
    COUNT(*) AS total_projects,
    COUNT(*) FILTER (WHERE cp.status = 'completed') AS completed_projects,
    COUNT(*) FILTER (WHERE cp.status IN ('in_progress', 'approved')) AS active_projects,
    COUNT(*) FILTER (WHERE cp.status = 'planned') AS planned_projects,
    SUM(cp.estimated_cost_cad) AS total_estimated_cost,
    SUM(cp.funding_secured_cad) AS total_funding_secured,
    SUM(cp.estimated_ghg_reduction_tco2e) AS total_estimated_ghg_reduction,
    SUM(cp.actual_ghg_reduction_tco2e) AS total_actual_ghg_reduction
FROM communities c
LEFT JOIN community_projects cp ON c.id = cp.community_id
GROUP BY c.id, c.name, c.province
ORDER BY c.name;

-- View: Projects by Sector
CREATE VIEW projects_by_sector_summary AS
SELECT
    cp.sector,
    COUNT(*) AS project_count,
    COUNT(*) FILTER (WHERE cp.status = 'completed') AS completed_count,
    SUM(cp.estimated_ghg_reduction_tco2e) AS total_estimated_ghg_reduction,
    SUM(cp.actual_ghg_reduction_tco2e) AS total_actual_ghg_reduction,
    SUM(cp.estimated_cost_cad) AS total_estimated_cost,
    AVG(cp.completion_percentage) AS avg_completion_percentage
FROM community_projects cp
GROUP BY cp.sector
ORDER BY total_estimated_ghg_reduction DESC NULLS LAST;

-- View: Project Funding Gap Analysis
CREATE VIEW project_funding_gap_analysis AS
SELECT
    cp.id AS project_id,
    c.name AS community_name,
    cp.project_name,
    cp.estimated_cost_cad,
    cp.funding_secured_cad,
    (cp.estimated_cost_cad - cp.funding_secured_cad) AS funding_gap,
    CASE
        WHEN cp.estimated_cost_cad > 0
        THEN ROUND((cp.funding_secured_cad / cp.estimated_cost_cad * 100)::numeric, 1)
        ELSE 0
    END AS funding_percentage,
    cp.status,
    cp.priority_level
FROM community_projects cp
JOIN communities c ON cp.community_id = c.id
WHERE cp.estimated_cost_cad > 0
  AND cp.status NOT IN ('cancelled', 'completed')
ORDER BY funding_gap DESC NULLS LAST;

-- View: Provincial Project Statistics
CREATE VIEW provincial_project_statistics AS
SELECT
    c.province,
    COUNT(DISTINCT cp.id) AS total_projects,
    COUNT(DISTINCT cp.community_id) AS communities_with_projects,
    COUNT(*) FILTER (WHERE cp.status = 'completed') AS completed_projects,
    SUM(cp.estimated_ghg_reduction_tco2e) AS total_estimated_ghg_reduction,
    SUM(cp.actual_ghg_reduction_tco2e) AS total_actual_ghg_reduction,
    SUM(cp.estimated_cost_cad) AS total_investment,
    AVG(cp.completion_percentage) AS avg_completion_percentage
FROM communities c
JOIN community_projects cp ON c.id = cp.community_id
GROUP BY c.province
ORDER BY total_projects DESC;

-- View: Overdue Projects
CREATE VIEW overdue_projects AS
SELECT
    c.name AS community_name,
    cp.project_name,
    cp.status,
    cp.priority_level,
    cp.estimated_completion_date,
    CURRENT_DATE - cp.estimated_completion_date AS days_overdue,
    cp.completion_percentage,
    cp.project_manager,
    cp.project_manager_email
FROM community_projects cp
JOIN communities c ON cp.community_id = c.id
WHERE cp.estimated_completion_date < CURRENT_DATE
  AND cp.status NOT IN ('completed', 'cancelled')
ORDER BY days_overdue DESC;

-- View: Project-Recommendation Integration
CREATE VIEW projects_addressing_recommendations AS
SELECT
    c.name AS community_name,
    ba.assessment_year,
    bi.indicator_name,
    br.recommendation_text,
    br.priority_level AS recommendation_priority,
    cp.project_name,
    cp.status AS project_status,
    cp.completion_percentage,
    prl.link_type
FROM project_recommendation_links prl
JOIN community_projects cp ON prl.project_id = cp.id
JOIN benchmark_recommendations br ON prl.recommendation_id = br.id
JOIN benchmark_assessments ba ON br.assessment_id = ba.id
JOIN benchmark_indicators bi ON br.indicator_id = bi.id
JOIN communities c ON ba.community_id = c.id
ORDER BY c.name, ba.assessment_year DESC, bi.indicator_name;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate project completion status
CREATE OR REPLACE FUNCTION update_project_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status to 'completed' if completion_percentage = 100 and status is 'in_progress'
    IF NEW.completion_percentage = 100 AND NEW.status = 'in_progress' THEN
        NEW.status := 'completed';
        NEW.actual_completion_date := CURRENT_DATE;
    END IF;

    -- Update the updated_at timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_status
    BEFORE UPDATE ON community_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_project_status();

-- Function: Get total GHG impact by community
CREATE OR REPLACE FUNCTION get_community_ghg_impact(
    p_community_id INTEGER,
    p_include_estimated BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    total_ghg_reduction NUMERIC(15,2),
    completed_projects_ghg NUMERIC(15,2),
    active_projects_ghg NUMERIC(15,2),
    project_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(
            CASE
                WHEN cp.status = 'completed' THEN COALESCE(cp.actual_ghg_reduction_tco2e, cp.estimated_ghg_reduction_tco2e)
                WHEN p_include_estimated AND cp.status IN ('in_progress', 'approved') THEN cp.estimated_ghg_reduction_tco2e
                ELSE 0
            END
        ) AS total_ghg_reduction,
        SUM(
            CASE WHEN cp.status = 'completed'
            THEN COALESCE(cp.actual_ghg_reduction_tco2e, cp.estimated_ghg_reduction_tco2e)
            ELSE 0 END
        ) AS completed_projects_ghg,
        SUM(
            CASE WHEN cp.status IN ('in_progress', 'approved')
            THEN cp.estimated_ghg_reduction_tco2e
            ELSE 0 END
        ) AS active_projects_ghg,
        COUNT(*)::INTEGER AS project_count
    FROM community_projects cp
    WHERE cp.community_id = p_community_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get project timeline summary
CREATE OR REPLACE FUNCTION get_project_timeline_summary(p_project_id INTEGER)
RETURNS TABLE (
    total_milestones INTEGER,
    completed_milestones INTEGER,
    pending_milestones INTEGER,
    overdue_milestones INTEGER,
    next_milestone_name VARCHAR(255),
    next_milestone_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_milestones,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_milestones,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_milestones,
        COUNT(*) FILTER (WHERE target_date < CURRENT_DATE AND status != 'completed')::INTEGER AS overdue_milestones,
        (SELECT milestone_name FROM project_milestones
         WHERE project_id = p_project_id AND status = 'pending'
         ORDER BY target_date ASC LIMIT 1) AS next_milestone_name,
        (SELECT target_date FROM project_milestones
         WHERE project_id = p_project_id AND status = 'pending'
         ORDER BY target_date ASC LIMIT 1) AS next_milestone_date
    FROM project_milestones
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (Extend existing Grafana read-only access)
-- ============================================================================

-- Grant SELECT on new project tables
GRANT SELECT ON community_projects TO grafana_readonly;
GRANT SELECT ON project_tags TO grafana_readonly;
GRANT SELECT ON project_milestones TO grafana_readonly;
GRANT SELECT ON project_funding_sources TO grafana_readonly;
GRANT SELECT ON project_partners TO grafana_readonly;
GRANT SELECT ON project_documents TO grafana_readonly;
GRANT SELECT ON project_updates TO grafana_readonly;
GRANT SELECT ON project_recommendation_links TO grafana_readonly;
GRANT SELECT ON project_metrics TO grafana_readonly;

-- Grant SELECT on views
GRANT SELECT ON active_projects_summary TO grafana_readonly;
GRANT SELECT ON project_portfolio_by_community TO grafana_readonly;
GRANT SELECT ON projects_by_sector_summary TO grafana_readonly;
GRANT SELECT ON project_funding_gap_analysis TO grafana_readonly;
GRANT SELECT ON provincial_project_statistics TO grafana_readonly;
GRANT SELECT ON overdue_projects TO grafana_readonly;
GRANT SELECT ON projects_addressing_recommendations TO grafana_readonly;

-- Grant EXECUTE on functions
GRANT EXECUTE ON FUNCTION get_community_ghg_impact(INTEGER, BOOLEAN) TO grafana_readonly;
GRANT EXECUTE ON FUNCTION get_project_timeline_summary(INTEGER) TO grafana_readonly;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE community_projects IS 'Main project tracking table for community climate action initiatives from concept to completion';
COMMENT ON TABLE project_tags IS 'Flexible tagging system for categorizing projects by funding source, partnership, technology, SDG goals, etc.';
COMMENT ON TABLE project_milestones IS 'Timeline tracking with milestone dependencies for project management';
COMMENT ON TABLE project_funding_sources IS 'Multiple funders per project with status tracking (pending/applied/approved/received)';
COMMENT ON TABLE project_partners IS 'Collaboration tracking for municipal, utility, business, NGO, and community partners';
COMMENT ON TABLE project_documents IS 'Document repository linking to proposals, reports, contracts, permits, photos, presentations';
COMMENT ON TABLE project_updates IS 'Activity log and news feed for project progress and announcements';
COMMENT ON TABLE project_recommendation_links IS 'Links projects to benchmark assessment recommendations showing implementation of action items';
COMMENT ON TABLE project_metrics IS 'Time-series tracking of project outcomes (GHG reduction, energy savings, participants, etc.)';

COMMENT ON VIEW active_projects_summary IS 'Shows all planned, approved, and in-progress projects with timeline status indicators';
COMMENT ON VIEW project_portfolio_by_community IS 'Aggregated project statistics per community including counts, costs, and GHG impact';
COMMENT ON VIEW projects_by_sector_summary IS 'Project counts and impact metrics grouped by sector (residential, commercial, etc.)';
COMMENT ON VIEW project_funding_gap_analysis IS 'Identifies projects with funding shortfalls to prioritize fundraising efforts';
COMMENT ON VIEW overdue_projects IS 'Projects past their estimated completion date that need attention';
COMMENT ON VIEW projects_addressing_recommendations IS 'Shows which projects implement specific benchmark assessment recommendations';

-- ============================================================================
-- SAMPLE PROJECT TYPES (For reference - not inserted)
-- ============================================================================

-- Common project_type values:
-- 'building_retrofit' - Energy efficiency upgrades to existing buildings
-- 'renewable_energy' - Solar, wind, geothermal installations
-- 'district_energy' - District heating/cooling systems
-- 'active_transport' - Bike lanes, pedestrian infrastructure
-- 'public_transit' - Bus rapid transit, light rail, etc.
-- 'ev_infrastructure' - Electric vehicle charging stations
-- 'waste_reduction' - Composting programs, circular economy initiatives
-- 'water_conservation' - Water efficiency programs
-- 'urban_forestry' - Tree planting, green space creation
-- 'land_use_planning' - Zoning changes, density increases
-- 'community_engagement' - Education, outreach, behavior change programs
-- 'policy_development' - Climate action plans, bylaws, regulations

-- Common tag_category values:
-- 'funding_source' - Tags: 'federal_funded', 'provincial_funded', 'municipal_funded', 'private_funded'
-- 'partnership' - Tags: 'utility_partnership', 'community_led', 'academic_partnership'
-- 'technology' - Tags: 'heat_pump', 'solar_pv', 'led_lighting', 'smart_grid'
-- 'sdg_goal' - Tags: 'sdg_7_energy', 'sdg_11_cities', 'sdg_13_climate'
-- 'program' - Tags: 'nca_program', 'fcm_grant', 'retrofit_accelerator'

-- ============================================================================
-- SCHEMA EXTENSION COMPLETE
-- Community Projects Pipeline for Quest Canada
-- Version 1.0 - Based on Client Requirements Area 2
-- ============================================================================
