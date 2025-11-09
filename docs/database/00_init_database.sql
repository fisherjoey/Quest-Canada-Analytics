-- ============================================================================
-- Quest Canada Database Initialization Script
-- This runs automatically when PostgreSQL container starts for the first time
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create grafana_readonly user for Grafana dashboards
CREATE USER grafana_readonly WITH PASSWORD 'grafana_read_2025';

-- Grant connection privileges
GRANT CONNECT ON DATABASE quest_canada TO grafana_readonly;

-- Note: Additional schema loading happens in quest_canada_schema.sql
-- Note: Benchmark and Projects schemas will be loaded manually after startup
