-- ============================================================================
-- BENCHMARK ASSESSMENT EXTENSION FOR QUEST CANADA DATABASE
-- Based on: Draft-Benchmark Assessment Final Report.pdf (72 pages)
-- Purpose: Track QUEST Canada's 10-indicator benchmark framework
-- ============================================================================

-- ============================================================================
-- TABLE 1: Benchmark Assessments (Main Assessment Record)
-- ============================================================================
CREATE TABLE benchmark_assessments (
    id SERIAL PRIMARY KEY,
    community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    assessment_year INTEGER NOT NULL,
    overall_score NUMERIC(5,2) CHECK (overall_score BETWEEN 0 AND 100),
    overall_points_earned NUMERIC(8,2),
    overall_points_possible NUMERIC(8,2),

    -- Assessment metadata
    assessment_type VARCHAR(100) DEFAULT 'QUEST Benchmark', -- e.g., 'Initial', 'Follow-up', 'Annual'
    assessor_name VARCHAR(255),
    assessor_organization VARCHAR(255) DEFAULT 'QUEST Canada',
    assessment_status VARCHAR(50) DEFAULT 'completed' CHECK (assessment_status IN ('draft', 'in_progress', 'completed', 'published')),

    -- Report outputs
    report_pdf_url TEXT,
    executive_summary TEXT,

    -- Tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one assessment per community per year
    UNIQUE (community_id, assessment_year)
);

CREATE INDEX idx_benchmark_assessments_community ON benchmark_assessments(community_id, assessment_date DESC);
CREATE INDEX idx_benchmark_assessments_year ON benchmark_assessments(assessment_year DESC);

-- ============================================================================
-- TABLE 2: Benchmark Indicators (10 Standard Categories)
-- ============================================================================
CREATE TABLE benchmark_indicators (
    id SERIAL PRIMARY KEY,
    indicator_name VARCHAR(100) NOT NULL UNIQUE,
    indicator_number INTEGER NOT NULL UNIQUE CHECK (indicator_number BETWEEN 1 AND 10),
    description TEXT,
    default_max_points NUMERIC(6,2) DEFAULT 0,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 10 standard QUEST indicators
INSERT INTO benchmark_indicators (indicator_number, indicator_name, description, default_max_points, display_order) VALUES
(1, 'Governance', 'Cross-sector leadership and organizational capacity for climate action', 14.5, 1),
(2, 'Staff', 'Staff capacity, expertise, and resources dedicated to climate planning', 26.0, 2),
(3, 'Data', 'Information availability, GHG inventories, and tracking systems', 23.0, 3),
(4, 'Financials', 'Budget allocation, funding sources, and financial planning for climate action', 42.0, 4),
(5, 'Strategy', 'Climate action plans, targets, and policy integration', 27.0, 5),
(6, 'Land Use', 'Land use planning, zoning, and density policies', 17.5, 6),
(7, 'Energy Networks', 'Energy delivery optimization, district energy, and renewable integration', 24.0, 7),
(8, 'Waste & Water', 'Waste management, water conservation, and circular economy initiatives', 23.0, 8),
(9, 'Transportation', 'Active transportation, transit, and sustainable mobility planning', 27.0, 9),
(10, 'Buildings', 'Building codes, retrofits, and energy efficiency programs', 32.0, 10);

-- ============================================================================
-- TABLE 3: Benchmark Measures (Sub-questions within each indicator)
-- ============================================================================
CREATE TABLE benchmark_measures (
    id SERIAL PRIMARY KEY,
    indicator_id INTEGER NOT NULL REFERENCES benchmark_indicators(id) ON DELETE CASCADE,
    measure_code VARCHAR(20) NOT NULL, -- e.g., 'GOV-1', 'STAFF-2a'
    measure_text TEXT NOT NULL, -- The actual question/measure
    measure_type VARCHAR(20) NOT NULL CHECK (measure_type IN ('checklist', 'scale', 'numeric', 'text')),

    -- Scoring
    max_points NUMERIC(6,2) NOT NULL DEFAULT 0,
    scale_type VARCHAR(50), -- e.g., '1-5', 'yes/no/partial', 'percentage'

    -- Display
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    help_text TEXT, -- Guidance for assessors

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (indicator_id, measure_code)
);

CREATE INDEX idx_benchmark_measures_indicator ON benchmark_measures(indicator_id, display_order);

-- ============================================================================
-- TABLE 4: Benchmark Scores (Actual assessment scores)
-- ============================================================================
CREATE TABLE benchmark_scores (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES benchmark_assessments(id) ON DELETE CASCADE,
    indicator_id INTEGER NOT NULL REFERENCES benchmark_indicators(id),

    -- Indicator-level scores
    indicator_points_earned NUMERIC(8,2) NOT NULL DEFAULT 0,
    indicator_points_possible NUMERIC(8,2) NOT NULL,
    indicator_percentage NUMERIC(5,2) CHECK (indicator_percentage BETWEEN 0 AND 100),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (assessment_id, indicator_id)
);

CREATE INDEX idx_benchmark_scores_assessment ON benchmark_scores(assessment_id);
CREATE INDEX idx_benchmark_scores_indicator ON benchmark_scores(indicator_id);

-- ============================================================================
-- TABLE 5: Benchmark Measure Responses (Individual measure scores)
-- ============================================================================
CREATE TABLE benchmark_measure_responses (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES benchmark_assessments(id) ON DELETE CASCADE,
    measure_id INTEGER NOT NULL REFERENCES benchmark_measures(id),

    -- Response data
    response_value TEXT, -- Stores: numeric value, yes/no/partial, scale rating, or text
    points_earned NUMERIC(6,2) NOT NULL DEFAULT 0,
    points_possible NUMERIC(6,2) NOT NULL,

    -- Additional context
    assessor_notes TEXT,
    evidence_references TEXT, -- Links to supporting documents

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (assessment_id, measure_id)
);

CREATE INDEX idx_benchmark_measure_responses_assessment ON benchmark_measure_responses(assessment_id);
CREATE INDEX idx_benchmark_measure_responses_measure ON benchmark_measure_responses(measure_id);

-- ============================================================================
-- TABLE 6: Benchmark Strengths (Per indicator)
-- ============================================================================
CREATE TABLE benchmark_strengths (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES benchmark_assessments(id) ON DELETE CASCADE,
    indicator_id INTEGER NOT NULL REFERENCES benchmark_indicators(id),

    -- Strength details
    strength_text TEXT NOT NULL, -- The actual strength bullet point
    display_order INTEGER NOT NULL, -- Order within the indicator section

    -- Optional categorization
    strength_category VARCHAR(100), -- e.g., 'Policy', 'Infrastructure', 'Community Engagement'

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_strengths_assessment ON benchmark_strengths(assessment_id, indicator_id);

-- ============================================================================
-- TABLE 7: Benchmark Recommendations (Per indicator)
-- ============================================================================
CREATE TABLE benchmark_recommendations (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES benchmark_assessments(id) ON DELETE CASCADE,
    indicator_id INTEGER NOT NULL REFERENCES benchmark_indicators(id),

    -- Recommendation details
    recommendation_text TEXT NOT NULL,
    lead_party VARCHAR(255), -- Who is responsible (e.g., 'Municipal Council', 'Sustainability Staff')
    priority_level VARCHAR(50) CHECK (priority_level IN ('high', 'medium', 'low', 'immediate', 'short-term', 'long-term')),

    -- Timeline
    estimated_timeframe VARCHAR(100), -- e.g., '6 months', '1-2 years', 'Ongoing'
    target_completion_date DATE,

    -- Tracking implementation
    implementation_status VARCHAR(50) DEFAULT 'not_started' CHECK (implementation_status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    implementation_notes TEXT,

    -- Display
    display_order INTEGER NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_benchmark_recommendations_assessment ON benchmark_recommendations(assessment_id, indicator_id);
CREATE INDEX idx_benchmark_recommendations_priority ON benchmark_recommendations(priority_level, implementation_status);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- View: Latest assessment per community
CREATE VIEW latest_benchmark_assessments AS
SELECT DISTINCT ON (c.id)
    c.id AS community_id,
    c.name AS community_name,
    ba.id AS assessment_id,
    ba.assessment_date,
    ba.assessment_year,
    ba.overall_score,
    ba.overall_points_earned,
    ba.overall_points_possible,
    ba.assessment_status
FROM communities c
LEFT JOIN benchmark_assessments ba ON c.id = ba.community_id
ORDER BY c.id, ba.assessment_date DESC;

-- View: Indicator scores comparison across communities
CREATE VIEW benchmark_indicator_comparison AS
SELECT
    ba.assessment_year,
    c.name AS community_name,
    c.province,
    bi.indicator_name,
    bs.indicator_percentage,
    bs.indicator_points_earned,
    bs.indicator_points_possible
FROM benchmark_scores bs
JOIN benchmark_assessments ba ON bs.assessment_id = ba.id
JOIN communities c ON ba.community_id = c.id
JOIN benchmark_indicators bi ON bs.indicator_id = bi.id
ORDER BY ba.assessment_year DESC, c.name, bi.display_order;

-- View: Provincial benchmark averages
CREATE VIEW provincial_benchmark_averages AS
SELECT
    ba.assessment_year,
    c.province,
    bi.indicator_name,
    AVG(bs.indicator_percentage) AS avg_score,
    COUNT(DISTINCT ba.community_id) AS community_count
FROM benchmark_scores bs
JOIN benchmark_assessments ba ON bs.assessment_id = ba.id
JOIN communities c ON ba.community_id = c.id
JOIN benchmark_indicators bi ON bs.indicator_id = bi.id
WHERE ba.assessment_status = 'completed'
GROUP BY ba.assessment_year, c.province, bi.indicator_name
ORDER BY ba.assessment_year DESC, c.province, bi.indicator_name;

-- View: Community benchmark progress (year-over-year)
CREATE VIEW benchmark_progress_tracking AS
SELECT
    c.id AS community_id,
    c.name AS community_name,
    ba1.assessment_year AS current_year,
    ba1.overall_score AS current_score,
    ba2.assessment_year AS previous_year,
    ba2.overall_score AS previous_score,
    ROUND((ba1.overall_score - ba2.overall_score)::numeric, 2) AS score_change,
    CASE
        WHEN ba1.overall_score > ba2.overall_score THEN 'Improved'
        WHEN ba1.overall_score < ba2.overall_score THEN 'Declined'
        ELSE 'No Change'
    END AS trend
FROM communities c
JOIN benchmark_assessments ba1 ON c.id = ba1.community_id
LEFT JOIN LATERAL (
    SELECT assessment_year, overall_score
    FROM benchmark_assessments
    WHERE community_id = c.id
      AND assessment_year < ba1.assessment_year
    ORDER BY assessment_year DESC
    LIMIT 1
) ba2 ON TRUE
WHERE ba1.assessment_status = 'completed'
ORDER BY c.name, ba1.assessment_year DESC;

-- View: Recommendation implementation tracking
CREATE VIEW recommendation_implementation_summary AS
SELECT
    c.name AS community_name,
    ba.assessment_year,
    bi.indicator_name,
    COUNT(*) AS total_recommendations,
    COUNT(*) FILTER (WHERE br.implementation_status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE br.implementation_status = 'in_progress') AS in_progress,
    COUNT(*) FILTER (WHERE br.implementation_status = 'not_started') AS not_started,
    COUNT(*) FILTER (WHERE br.priority_level IN ('high', 'immediate')) AS high_priority_count
FROM benchmark_recommendations br
JOIN benchmark_assessments ba ON br.assessment_id = ba.id
JOIN communities c ON ba.community_id = c.id
JOIN benchmark_indicators bi ON br.indicator_id = bi.id
GROUP BY c.name, ba.assessment_year, bi.indicator_name
ORDER BY c.name, ba.assessment_year DESC, bi.display_order;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate overall assessment score from indicator scores
CREATE OR REPLACE FUNCTION calculate_assessment_overall_score(p_assessment_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_total_earned NUMERIC;
    v_total_possible NUMERIC;
    v_percentage NUMERIC;
BEGIN
    SELECT
        SUM(indicator_points_earned),
        SUM(indicator_points_possible)
    INTO v_total_earned, v_total_possible
    FROM benchmark_scores
    WHERE assessment_id = p_assessment_id;

    IF v_total_possible > 0 THEN
        v_percentage := ROUND((v_total_earned / v_total_possible * 100)::numeric, 2);
    ELSE
        v_percentage := 0;
    END IF;

    -- Update the assessment record
    UPDATE benchmark_assessments
    SET
        overall_points_earned = v_total_earned,
        overall_points_possible = v_total_possible,
        overall_score = v_percentage,
        updated_at = NOW()
    WHERE id = p_assessment_id;

    RETURN v_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function: Get community ranking by indicator
CREATE OR REPLACE FUNCTION get_community_ranking_by_indicator(
    p_indicator_name VARCHAR(100),
    p_assessment_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
)
RETURNS TABLE (
    rank INTEGER,
    community_name VARCHAR(255),
    score NUMERIC(5,2),
    province CHAR(2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY bs.indicator_percentage DESC)::INTEGER AS rank,
        c.name AS community_name,
        bs.indicator_percentage AS score,
        c.province
    FROM benchmark_scores bs
    JOIN benchmark_assessments ba ON bs.assessment_id = ba.id
    JOIN communities c ON ba.community_id = c.id
    JOIN benchmark_indicators bi ON bs.indicator_id = bi.id
    WHERE bi.indicator_name = p_indicator_name
      AND ba.assessment_year = p_assessment_year
      AND ba.assessment_status = 'completed'
    ORDER BY bs.indicator_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (Extend existing Grafana read-only access)
-- ============================================================================

-- Grant SELECT on new benchmark tables
GRANT SELECT ON benchmark_assessments TO grafana_readonly;
GRANT SELECT ON benchmark_indicators TO grafana_readonly;
GRANT SELECT ON benchmark_measures TO grafana_readonly;
GRANT SELECT ON benchmark_scores TO grafana_readonly;
GRANT SELECT ON benchmark_measure_responses TO grafana_readonly;
GRANT SELECT ON benchmark_strengths TO grafana_readonly;
GRANT SELECT ON benchmark_recommendations TO grafana_readonly;

-- Grant SELECT on views
GRANT SELECT ON latest_benchmark_assessments TO grafana_readonly;
GRANT SELECT ON benchmark_indicator_comparison TO grafana_readonly;
GRANT SELECT ON provincial_benchmark_averages TO grafana_readonly;
GRANT SELECT ON benchmark_progress_tracking TO grafana_readonly;
GRANT SELECT ON recommendation_implementation_summary TO grafana_readonly;

-- Grant EXECUTE on functions
GRANT EXECUTE ON FUNCTION calculate_assessment_overall_score(INTEGER) TO grafana_readonly;
GRANT EXECUTE ON FUNCTION get_community_ranking_by_indicator(VARCHAR, INTEGER) TO grafana_readonly;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE benchmark_assessments IS 'Main benchmark assessment records for communities. One assessment per community per year using QUEST 10-indicator framework.';
COMMENT ON TABLE benchmark_indicators IS 'The 10 standard QUEST benchmark indicators (Governance, Staff, Data, Financials, Strategy, Land Use, Energy Networks, Waste & Water, Transportation, Buildings)';
COMMENT ON TABLE benchmark_measures IS 'Sub-measures/questions within each indicator for detailed assessment scoring';
COMMENT ON TABLE benchmark_scores IS 'Indicator-level scores for each assessment showing points earned and percentages';
COMMENT ON TABLE benchmark_measure_responses IS 'Individual measure responses with points and evidence references';
COMMENT ON TABLE benchmark_strengths IS 'Community strengths identified for each indicator during assessment';
COMMENT ON TABLE benchmark_recommendations IS 'Recommendations and action items per indicator with implementation tracking';

-- ============================================================================
-- SCHEMA EXTENSION COMPLETE
-- Benchmark Assessment Framework for Quest Canada
-- Version 1.0 - Based on 72-page Benchmark Assessment Report
-- ============================================================================
