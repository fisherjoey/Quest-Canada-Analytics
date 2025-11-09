-- ============================================================================
-- Quest Canada Database - Basic Schema (Without Continuous Aggregates)
-- This runs at container startup - we'll add continuous aggregates later
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ====================================================================================
-- Communities Table
-- ====================================================================================
CREATE TABLE communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    population INTEGER NOT NULL CHECK (population > 0),
    region VARCHAR(100),
    province CHAR(2) NOT NULL,
    community_type VARCHAR(50) NOT NULL,
    baseline_year INTEGER NOT NULL DEFAULT 2020,
    baseline_emissions_tco2e NUMERIC(12,2) NOT NULL,
    net_zero_target_year INTEGER DEFAULT 2050,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================================
-- Energy & Emissions Data (Hypertable)
-- ====================================================================================
CREATE TABLE energy_emissions_data (
    time TIMESTAMPTZ NOT NULL,
    community_id INTEGER NOT NULL REFERENCES communities(id),
    sector VARCHAR(50) NOT NULL,
    energy_source VARCHAR(50) NOT NULL,
    consumption_gj NUMERIC(12,2) NOT NULL CHECK (consumption_gj >= 0),
    emissions_tco2e NUMERIC(12,2) NOT NULL CHECK (emissions_tco2e >= 0),
    cost_cad NUMERIC(12,2),
    data_quality_score INTEGER CHECK (data_quality_score BETWEEN 1 AND 5),
    notes TEXT
);

-- Convert to hypertable
SELECT create_hypertable('energy_emissions_data', 'time');

-- Indexes
CREATE INDEX idx_energy_emissions_community_time ON energy_emissions_data (community_id, time DESC);
CREATE INDEX idx_energy_emissions_sector ON energy_emissions_data (sector);
CREATE INDEX idx_energy_emissions_source ON energy_emissions_data (energy_source);

-- ====================================================================================
-- Users Table
-- ====================================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'funder', 'stakeholder', 'citizen')),
    community_id INTEGER REFERENCES communities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================================
-- Sample Data
-- ====================================================================================

-- Insert sample communities
INSERT INTO communities (name, population, province, community_type, baseline_emissions_tco2e) VALUES
('Calgary', 1300000, 'AB', 'city', 15000000),
('Edmonton', 1000000, 'AB', 'city', 12000000),
('Vancouver', 700000, 'BC', 'city', 3500000),
('Victoria', 400000, 'BC', 'city', 1800000),
('Winnipeg', 750000, 'MB', 'city', 8000000);

-- Grant permissions to grafana_readonly user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_readonly;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO grafana_readonly;

-- Done!
SELECT 'Quest Canada database initialized successfully!' AS status;
