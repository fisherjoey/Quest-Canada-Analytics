--
-- PostgreSQL database dump
--

\restrict zzDQnVLe5pjBIEUCQDOSRbDXMZul8ysC3ir9ms7y3x9vZdSC6DGoVhhWApLHwft

-- Dumped from database version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.19 (Ubuntu 14.19-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: timescaledb; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS timescaledb WITH SCHEMA public;


--
-- Name: EXTENSION timescaledb; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION timescaledb IS 'Enables scalable inserts and complex queries for time-series data (Community Edition)';


--
-- Name: get_per_capita_emissions(integer, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_per_capita_emissions(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_emissions NUMERIC;
    population INTEGER;
    per_capita NUMERIC;
BEGIN
    -- Get total emissions for the period
    SELECT SUM(emissions_tco2e) INTO total_emissions
    FROM energy_emissions_data
    WHERE community_id = p_community_id
      AND time BETWEEN p_start_date AND p_end_date;

    -- Get community population
    SELECT communities.population INTO population
    FROM communities
    WHERE id = p_community_id;

    -- Calculate per capita (return NULL if no data)
    IF total_emissions IS NOT NULL AND population > 0 THEN
        per_capita := total_emissions / population;
    ELSE
        per_capita := NULL;
    END IF;

    RETURN per_capita;
END;
$$;


ALTER FUNCTION public.get_per_capita_emissions(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

--
-- Name: get_renewable_percentage(integer, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_renewable_percentage(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_consumption NUMERIC;
    renewable_consumption NUMERIC;
    percentage NUMERIC;
BEGIN
    -- Get total energy consumption
    SELECT SUM(consumption_gj) INTO total_consumption
    FROM energy_emissions_data
    WHERE community_id = p_community_id
      AND time BETWEEN p_start_date AND p_end_date;

    -- Get renewable energy consumption
    SELECT SUM(consumption_gj) INTO renewable_consumption
    FROM energy_emissions_data
    WHERE community_id = p_community_id
      AND time BETWEEN p_start_date AND p_end_date
      AND energy_source IN ('solar', 'wind', 'biomass', 'geothermal', 'other_renewable');

    -- Calculate percentage
    IF total_consumption > 0 THEN
        percentage := (COALESCE(renewable_consumption, 0) / total_consumption) * 100;
    ELSE
        percentage := 0;
    END IF;

    RETURN ROUND(percentage, 2);
END;
$$;


ALTER FUNCTION public.get_renewable_percentage(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _compressed_hypertable_4; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._compressed_hypertable_4 (
);


ALTER TABLE _timescaledb_internal._compressed_hypertable_4 OWNER TO postgres;

--
-- Name: energy_emissions_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_emissions_data (
    "time" timestamp with time zone NOT NULL,
    community_id integer NOT NULL,
    sector character varying(50) NOT NULL,
    energy_source character varying(50) NOT NULL,
    consumption_gj numeric(12,2) NOT NULL,
    emissions_tco2e numeric(12,2) NOT NULL,
    cost_cad numeric(12,2),
    data_source character varying(100),
    data_quality_score integer,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT energy_emissions_data_consumption_gj_check CHECK ((consumption_gj >= (0)::numeric)),
    CONSTRAINT energy_emissions_data_data_quality_score_check CHECK (((data_quality_score >= 1) AND (data_quality_score <= 5))),
    CONSTRAINT energy_emissions_data_emissions_tco2e_check CHECK ((emissions_tco2e >= (0)::numeric)),
    CONSTRAINT energy_emissions_data_energy_source_check CHECK (((energy_source)::text = ANY ((ARRAY['electricity_grid'::character varying, 'natural_gas'::character varying, 'heating_oil'::character varying, 'propane'::character varying, 'diesel'::character varying, 'gasoline'::character varying, 'solar'::character varying, 'wind'::character varying, 'biomass'::character varying, 'geothermal'::character varying, 'other_renewable'::character varying])::text[]))),
    CONSTRAINT energy_emissions_data_sector_check CHECK (((sector)::text = ANY ((ARRAY['residential'::character varying, 'commercial'::character varying, 'industrial'::character varying, 'transportation'::character varying, 'waste'::character varying, 'agriculture'::character varying])::text[])))
);


ALTER TABLE public.energy_emissions_data OWNER TO postgres;

--
-- Name: TABLE energy_emissions_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.energy_emissions_data IS 'Time-series data for energy consumption and GHG emissions. TimescaleDB hypertable with 1-month chunks.';


--
-- Name: _direct_view_2; Type: VIEW; Schema: _timescaledb_internal; Owner: postgres
--

CREATE VIEW _timescaledb_internal._direct_view_2 AS
 SELECT public.time_bucket('1 mon'::interval, energy_emissions_data."time") AS month,
    energy_emissions_data.community_id,
    energy_emissions_data.sector,
    energy_emissions_data.energy_source,
    sum(energy_emissions_data.consumption_gj) AS total_consumption_gj,
    sum(energy_emissions_data.emissions_tco2e) AS total_emissions_tco2e,
    sum(energy_emissions_data.cost_cad) AS total_cost_cad,
    avg(energy_emissions_data.data_quality_score) AS avg_data_quality,
    count(*) AS data_point_count
   FROM public.energy_emissions_data
  GROUP BY (public.time_bucket('1 mon'::interval, energy_emissions_data."time")), energy_emissions_data.community_id, energy_emissions_data.sector, energy_emissions_data.energy_source;


ALTER TABLE _timescaledb_internal._direct_view_2 OWNER TO postgres;

--
-- Name: _direct_view_3; Type: VIEW; Schema: _timescaledb_internal; Owner: postgres
--

CREATE VIEW _timescaledb_internal._direct_view_3 AS
 SELECT public.time_bucket('1 year'::interval, energy_emissions_data."time") AS year,
    energy_emissions_data.community_id,
    energy_emissions_data.sector,
    sum(energy_emissions_data.consumption_gj) AS total_consumption_gj,
    sum(energy_emissions_data.emissions_tco2e) AS total_emissions_tco2e,
    sum(energy_emissions_data.cost_cad) AS total_cost_cad,
    avg(energy_emissions_data.data_quality_score) AS avg_data_quality
   FROM public.energy_emissions_data
  GROUP BY (public.time_bucket('1 year'::interval, energy_emissions_data."time")), energy_emissions_data.community_id, energy_emissions_data.sector;


ALTER TABLE _timescaledb_internal._direct_view_3 OWNER TO postgres;

--
-- Name: _hyper_1_10_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_10_chunk (
    CONSTRAINT constraint_10 CHECK ((("time" >= '2023-09-20 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-10-20 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_10_chunk OWNER TO postgres;

--
-- Name: _hyper_1_11_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_11_chunk (
    CONSTRAINT constraint_11 CHECK ((("time" >= '2023-10-20 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-11-19 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_11_chunk OWNER TO postgres;

--
-- Name: _hyper_1_12_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_12_chunk (
    CONSTRAINT constraint_12 CHECK ((("time" >= '2023-11-19 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-12-19 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_12_chunk OWNER TO postgres;

--
-- Name: _hyper_1_13_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_13_chunk (
    CONSTRAINT constraint_13 CHECK ((("time" >= '2023-12-19 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-01-18 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_13_chunk OWNER TO postgres;

--
-- Name: _hyper_1_14_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_14_chunk (
    CONSTRAINT constraint_14 CHECK ((("time" >= '2024-01-18 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-02-17 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_14_chunk OWNER TO postgres;

--
-- Name: _hyper_1_15_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_15_chunk (
    CONSTRAINT constraint_15 CHECK ((("time" >= '2024-02-17 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-03-18 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_15_chunk OWNER TO postgres;

--
-- Name: _hyper_1_16_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_16_chunk (
    CONSTRAINT constraint_16 CHECK ((("time" >= '2024-03-18 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-04-17 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_16_chunk OWNER TO postgres;

--
-- Name: _hyper_1_17_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_17_chunk (
    CONSTRAINT constraint_17 CHECK ((("time" >= '2024-04-17 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-05-17 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_17_chunk OWNER TO postgres;

--
-- Name: _hyper_1_18_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_18_chunk (
    CONSTRAINT constraint_18 CHECK ((("time" >= '2024-05-17 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-06-16 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_18_chunk OWNER TO postgres;

--
-- Name: _hyper_1_19_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_19_chunk (
    CONSTRAINT constraint_19 CHECK ((("time" >= '2024-06-16 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-07-16 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_19_chunk OWNER TO postgres;

--
-- Name: _hyper_1_1_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_1_chunk (
    CONSTRAINT constraint_1 CHECK ((("time" >= '2022-12-24 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-01-23 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_1_chunk OWNER TO postgres;

--
-- Name: _hyper_1_20_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_20_chunk (
    CONSTRAINT constraint_20 CHECK ((("time" >= '2024-07-16 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-08-15 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_20_chunk OWNER TO postgres;

--
-- Name: _hyper_1_21_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_21_chunk (
    CONSTRAINT constraint_21 CHECK ((("time" >= '2024-08-15 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-09-14 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_21_chunk OWNER TO postgres;

--
-- Name: _hyper_1_22_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_22_chunk (
    CONSTRAINT constraint_22 CHECK ((("time" >= '2024-09-14 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-10-14 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_22_chunk OWNER TO postgres;

--
-- Name: _hyper_1_23_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_23_chunk (
    CONSTRAINT constraint_23 CHECK ((("time" >= '2024-10-14 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-11-13 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_23_chunk OWNER TO postgres;

--
-- Name: _hyper_1_24_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_24_chunk (
    CONSTRAINT constraint_24 CHECK ((("time" >= '2024-11-13 00:00:00+00'::timestamp with time zone) AND ("time" < '2024-12-13 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_24_chunk OWNER TO postgres;

--
-- Name: _hyper_1_2_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_2_chunk (
    CONSTRAINT constraint_2 CHECK ((("time" >= '2023-01-23 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-02-22 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_2_chunk OWNER TO postgres;

--
-- Name: _hyper_1_3_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_3_chunk (
    CONSTRAINT constraint_3 CHECK ((("time" >= '2023-02-22 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-03-24 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_3_chunk OWNER TO postgres;

--
-- Name: _hyper_1_4_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_4_chunk (
    CONSTRAINT constraint_4 CHECK ((("time" >= '2023-03-24 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-04-23 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_4_chunk OWNER TO postgres;

--
-- Name: _hyper_1_5_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_5_chunk (
    CONSTRAINT constraint_5 CHECK ((("time" >= '2023-04-23 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-05-23 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_5_chunk OWNER TO postgres;

--
-- Name: _hyper_1_6_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_6_chunk (
    CONSTRAINT constraint_6 CHECK ((("time" >= '2023-05-23 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-06-22 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_6_chunk OWNER TO postgres;

--
-- Name: _hyper_1_7_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_7_chunk (
    CONSTRAINT constraint_7 CHECK ((("time" >= '2023-06-22 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-07-22 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_7_chunk OWNER TO postgres;

--
-- Name: _hyper_1_8_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_8_chunk (
    CONSTRAINT constraint_8 CHECK ((("time" >= '2023-07-22 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-08-21 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_8_chunk OWNER TO postgres;

--
-- Name: _hyper_1_9_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_1_9_chunk (
    CONSTRAINT constraint_9 CHECK ((("time" >= '2023-08-21 00:00:00+00'::timestamp with time zone) AND ("time" < '2023-09-20 00:00:00+00'::timestamp with time zone)))
)
INHERITS (public.energy_emissions_data);


ALTER TABLE _timescaledb_internal._hyper_1_9_chunk OWNER TO postgres;

--
-- Name: _materialized_hypertable_2; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._materialized_hypertable_2 (
    month timestamp with time zone NOT NULL,
    community_id integer,
    sector character varying(50),
    energy_source character varying(50),
    total_consumption_gj numeric,
    total_emissions_tco2e numeric,
    total_cost_cad numeric,
    avg_data_quality numeric,
    data_point_count bigint
);


ALTER TABLE _timescaledb_internal._materialized_hypertable_2 OWNER TO postgres;

--
-- Name: _hyper_2_25_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_2_25_chunk (
    CONSTRAINT constraint_25 CHECK (((month >= '2023-05-23 00:00:00+00'::timestamp with time zone) AND (month < '2024-03-18 00:00:00+00'::timestamp with time zone)))
)
INHERITS (_timescaledb_internal._materialized_hypertable_2);


ALTER TABLE _timescaledb_internal._hyper_2_25_chunk OWNER TO postgres;

--
-- Name: _hyper_2_26_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_2_26_chunk (
    CONSTRAINT constraint_26 CHECK (((month >= '2022-07-27 00:00:00+00'::timestamp with time zone) AND (month < '2023-05-23 00:00:00+00'::timestamp with time zone)))
)
INHERITS (_timescaledb_internal._materialized_hypertable_2);


ALTER TABLE _timescaledb_internal._hyper_2_26_chunk OWNER TO postgres;

--
-- Name: _hyper_2_27_chunk; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._hyper_2_27_chunk (
    CONSTRAINT constraint_27 CHECK (((month >= '2024-03-18 00:00:00+00'::timestamp with time zone) AND (month < '2025-01-12 00:00:00+00'::timestamp with time zone)))
)
INHERITS (_timescaledb_internal._materialized_hypertable_2);


ALTER TABLE _timescaledb_internal._hyper_2_27_chunk OWNER TO postgres;

--
-- Name: _materialized_hypertable_3; Type: TABLE; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TABLE _timescaledb_internal._materialized_hypertable_3 (
    year timestamp with time zone NOT NULL,
    community_id integer,
    sector character varying(50),
    total_consumption_gj numeric,
    total_emissions_tco2e numeric,
    total_cost_cad numeric,
    avg_data_quality numeric
);


ALTER TABLE _timescaledb_internal._materialized_hypertable_3 OWNER TO postgres;

--
-- Name: _partial_view_2; Type: VIEW; Schema: _timescaledb_internal; Owner: postgres
--

CREATE VIEW _timescaledb_internal._partial_view_2 AS
 SELECT public.time_bucket('1 mon'::interval, energy_emissions_data."time") AS month,
    energy_emissions_data.community_id,
    energy_emissions_data.sector,
    energy_emissions_data.energy_source,
    sum(energy_emissions_data.consumption_gj) AS total_consumption_gj,
    sum(energy_emissions_data.emissions_tco2e) AS total_emissions_tco2e,
    sum(energy_emissions_data.cost_cad) AS total_cost_cad,
    avg(energy_emissions_data.data_quality_score) AS avg_data_quality,
    count(*) AS data_point_count
   FROM public.energy_emissions_data
  GROUP BY (public.time_bucket('1 mon'::interval, energy_emissions_data."time")), energy_emissions_data.community_id, energy_emissions_data.sector, energy_emissions_data.energy_source;


ALTER TABLE _timescaledb_internal._partial_view_2 OWNER TO postgres;

--
-- Name: _partial_view_3; Type: VIEW; Schema: _timescaledb_internal; Owner: postgres
--

CREATE VIEW _timescaledb_internal._partial_view_3 AS
 SELECT public.time_bucket('1 year'::interval, energy_emissions_data."time") AS year,
    energy_emissions_data.community_id,
    energy_emissions_data.sector,
    sum(energy_emissions_data.consumption_gj) AS total_consumption_gj,
    sum(energy_emissions_data.emissions_tco2e) AS total_emissions_tco2e,
    sum(energy_emissions_data.cost_cad) AS total_cost_cad,
    avg(energy_emissions_data.data_quality_score) AS avg_data_quality
   FROM public.energy_emissions_data
  GROUP BY (public.time_bucket('1 year'::interval, energy_emissions_data."time")), energy_emissions_data.community_id, energy_emissions_data.sector;


ALTER TABLE _timescaledb_internal._partial_view_3 OWNER TO postgres;

--
-- Name: ceep_plans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ceep_plans (
    id integer NOT NULL,
    community_id integer NOT NULL,
    plan_year integer NOT NULL,
    plan_name character varying(255),
    target_year integer DEFAULT 2050 NOT NULL,
    target_emissions_reduction_percent numeric(5,2) NOT NULL,
    plan_status character varying(50) NOT NULL,
    implementation_start_date date,
    last_updated timestamp with time zone DEFAULT now(),
    document_url text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ceep_plans_plan_status_check CHECK (((plan_status)::text = ANY ((ARRAY['draft'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'implemented'::character varying, 'under_review'::character varying])::text[]))),
    CONSTRAINT ceep_plans_target_emissions_reduction_percent_check CHECK (((target_emissions_reduction_percent >= (0)::numeric) AND (target_emissions_reduction_percent <= (100)::numeric)))
);


ALTER TABLE public.ceep_plans OWNER TO postgres;

--
-- Name: TABLE ceep_plans; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ceep_plans IS 'Community Energy and Emissions Plans tracking and status';


--
-- Name: ceep_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ceep_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ceep_plans_id_seq OWNER TO postgres;

--
-- Name: ceep_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ceep_plans_id_seq OWNED BY public.ceep_plans.id;


--
-- Name: communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    population integer NOT NULL,
    region character varying(100),
    province character(2) NOT NULL,
    community_type character varying(50) NOT NULL,
    baseline_year integer DEFAULT 2020 NOT NULL,
    baseline_emissions_tco2e numeric(12,2) NOT NULL,
    net_zero_target_year integer DEFAULT 2050,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT communities_baseline_emissions_tco2e_check CHECK ((baseline_emissions_tco2e >= (0)::numeric)),
    CONSTRAINT communities_community_type_check CHECK (((community_type)::text = ANY ((ARRAY['rural'::character varying, 'urban'::character varying, 'suburban'::character varying, 'indigenous'::character varying, 'industrial'::character varying])::text[]))),
    CONSTRAINT communities_population_check CHECK ((population > 0))
);


ALTER TABLE public.communities OWNER TO postgres;

--
-- Name: TABLE communities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.communities IS 'Communities participating in Quest Canada Net-Zero Communities Accelerator program';


--
-- Name: communities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.communities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.communities_id_seq OWNER TO postgres;

--
-- Name: communities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.communities_id_seq OWNED BY public.communities.id;


--
-- Name: data_quality_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.data_quality_summary AS
 SELECT c.name AS community_name,
    date_trunc('month'::text, e."time") AS month,
    avg(e.data_quality_score) AS avg_quality_score,
    count(*) AS data_points,
    string_agg(DISTINCT (e.data_source)::text, ', '::text) AS sources
   FROM (public.energy_emissions_data e
     JOIN public.communities c ON ((e.community_id = c.id)))
  GROUP BY c.name, (date_trunc('month'::text, e."time"))
  ORDER BY (date_trunc('month'::text, e."time")) DESC, c.name;


ALTER TABLE public.data_quality_summary OWNER TO postgres;

--
-- Name: data_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_sources (
    id integer NOT NULL,
    source_name character varying(255) NOT NULL,
    source_type character varying(100) NOT NULL,
    description text,
    provider_organization character varying(255),
    update_frequency character varying(50),
    last_sync timestamp with time zone,
    next_scheduled_sync timestamp with time zone,
    data_quality_avg integer,
    is_active boolean DEFAULT true,
    connection_info jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT data_sources_data_quality_avg_check CHECK (((data_quality_avg >= 1) AND (data_quality_avg <= 5))),
    CONSTRAINT data_sources_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['utility_esg'::character varying, 'government_database'::character varying, 'community_survey'::character varying, 'manual_entry'::character varying, 'api_feed'::character varying, 'csv_upload'::character varying])::text[])))
);


ALTER TABLE public.data_sources OWNER TO postgres;

--
-- Name: TABLE data_sources; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.data_sources IS 'External data sources being integrated into the platform';


--
-- Name: data_sources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_sources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.data_sources_id_seq OWNER TO postgres;

--
-- Name: data_sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_sources_id_seq OWNED BY public.data_sources.id;


--
-- Name: emissions_progress; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.emissions_progress AS
 SELECT c.id AS community_id,
    c.name AS community_name,
    c.baseline_year,
    c.baseline_emissions_tco2e,
    date_trunc('year'::text, e."time") AS year,
    sum(e.emissions_tco2e) AS annual_emissions,
    (c.baseline_emissions_tco2e - sum(e.emissions_tco2e)) AS reduction_amount,
    round((((c.baseline_emissions_tco2e - sum(e.emissions_tco2e)) / c.baseline_emissions_tco2e) * (100)::numeric), 2) AS reduction_percentage
   FROM (public.communities c
     LEFT JOIN public.energy_emissions_data e ON ((c.id = e.community_id)))
  GROUP BY c.id, c.name, c.baseline_year, c.baseline_emissions_tco2e, (date_trunc('year'::text, e."time"))
  ORDER BY (date_trunc('year'::text, e."time")) DESC, c.name;


ALTER TABLE public.emissions_progress OWNER TO postgres;

--
-- Name: energy_emissions_monthly; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.energy_emissions_monthly AS
 SELECT _materialized_hypertable_2.month,
    _materialized_hypertable_2.community_id,
    _materialized_hypertable_2.sector,
    _materialized_hypertable_2.energy_source,
    _materialized_hypertable_2.total_consumption_gj,
    _materialized_hypertable_2.total_emissions_tco2e,
    _materialized_hypertable_2.total_cost_cad,
    _materialized_hypertable_2.avg_data_quality,
    _materialized_hypertable_2.data_point_count
   FROM _timescaledb_internal._materialized_hypertable_2;


ALTER TABLE public.energy_emissions_monthly OWNER TO postgres;

--
-- Name: energy_emissions_yearly; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.energy_emissions_yearly AS
 SELECT _materialized_hypertable_3.year,
    _materialized_hypertable_3.community_id,
    _materialized_hypertable_3.sector,
    _materialized_hypertable_3.total_consumption_gj,
    _materialized_hypertable_3.total_emissions_tco2e,
    _materialized_hypertable_3.total_cost_cad,
    _materialized_hypertable_3.avg_data_quality
   FROM _timescaledb_internal._materialized_hypertable_3;


ALTER TABLE public.energy_emissions_yearly OWNER TO postgres;

--
-- Name: energy_mapping_inputs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.energy_mapping_inputs (
    id integer NOT NULL,
    community_id integer NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    stakeholder_type character varying(100),
    input_category character varying(100),
    input_data jsonb NOT NULL,
    source_document text,
    facilitator_name character varying(255),
    session_date date,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.energy_mapping_inputs OWNER TO postgres;

--
-- Name: TABLE energy_mapping_inputs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.energy_mapping_inputs IS 'Stakeholder engagement data from energy mapping exercises';


--
-- Name: energy_mapping_inputs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.energy_mapping_inputs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.energy_mapping_inputs_id_seq OWNER TO postgres;

--
-- Name: energy_mapping_inputs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.energy_mapping_inputs_id_seq OWNED BY public.energy_mapping_inputs.id;


--
-- Name: funding_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.funding_reports (
    id integer NOT NULL,
    community_id integer,
    report_date timestamp with time zone DEFAULT now() NOT NULL,
    report_type character varying(100) NOT NULL,
    funder_name character varying(255),
    report_title character varying(500) NOT NULL,
    generated_by character varying(255),
    file_path text,
    file_format character varying(20) DEFAULT 'PDF'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT funding_reports_report_type_check CHECK (((report_type)::text = ANY ((ARRAY['funder_progress'::character varying, 'policymaker_briefing'::character varying, 'community_status'::character varying, 'annual_summary'::character varying, 'custom'::character varying])::text[])))
);


ALTER TABLE public.funding_reports OWNER TO postgres;

--
-- Name: TABLE funding_reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.funding_reports IS 'Generated reports for funders and policymakers';


--
-- Name: funding_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.funding_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.funding_reports_id_seq OWNER TO postgres;

--
-- Name: funding_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.funding_reports_id_seq OWNED BY public.funding_reports.id;


--
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activity_log (
    id integer NOT NULL,
    user_id integer,
    activity_type character varying(100) NOT NULL,
    activity_details jsonb,
    ip_address inet,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_activity_log OWNER TO postgres;

--
-- Name: user_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_activity_log_id_seq OWNER TO postgres;

--
-- Name: user_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_activity_log_id_seq OWNED BY public.user_activity_log.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255),
    role character varying(50) NOT NULL,
    community_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'quest_staff'::character varying, 'funder'::character varying, 'policymaker'::character varying, 'community_stakeholder'::character varying, 'citizen'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: _hyper_1_10_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_10_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_11_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_11_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_12_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_12_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_13_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_13_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_14_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_14_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_15_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_15_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_16_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_16_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_17_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_17_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_18_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_18_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_19_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_19_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_1_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_20_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_20_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_21_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_21_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_22_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_22_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_23_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_23_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_24_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_24_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_2_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_2_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_3_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_3_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_4_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_4_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_5_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_5_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_6_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_6_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_7_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_7_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_8_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_8_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: _hyper_1_9_chunk created_at; Type: DEFAULT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_9_chunk ALTER COLUMN created_at SET DEFAULT now();


--
-- Name: ceep_plans id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ceep_plans ALTER COLUMN id SET DEFAULT nextval('public.ceep_plans_id_seq'::regclass);


--
-- Name: communities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities ALTER COLUMN id SET DEFAULT nextval('public.communities_id_seq'::regclass);


--
-- Name: data_sources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_sources ALTER COLUMN id SET DEFAULT nextval('public.data_sources_id_seq'::regclass);


--
-- Name: energy_mapping_inputs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_mapping_inputs ALTER COLUMN id SET DEFAULT nextval('public.energy_mapping_inputs_id_seq'::regclass);


--
-- Name: funding_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funding_reports ALTER COLUMN id SET DEFAULT nextval('public.funding_reports_id_seq'::regclass);


--
-- Name: user_activity_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_log ALTER COLUMN id SET DEFAULT nextval('public.user_activity_log_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: _hyper_1_10_chunk 10_20_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_10_chunk
    ADD CONSTRAINT "10_20_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_11_chunk 11_22_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_11_chunk
    ADD CONSTRAINT "11_22_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_12_chunk 12_24_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_12_chunk
    ADD CONSTRAINT "12_24_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_13_chunk 13_26_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_13_chunk
    ADD CONSTRAINT "13_26_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_14_chunk 14_28_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_14_chunk
    ADD CONSTRAINT "14_28_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_15_chunk 15_30_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_15_chunk
    ADD CONSTRAINT "15_30_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_16_chunk 16_32_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_16_chunk
    ADD CONSTRAINT "16_32_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_17_chunk 17_34_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_17_chunk
    ADD CONSTRAINT "17_34_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_18_chunk 18_36_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_18_chunk
    ADD CONSTRAINT "18_36_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_19_chunk 19_38_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_19_chunk
    ADD CONSTRAINT "19_38_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_1_chunk 1_2_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk
    ADD CONSTRAINT "1_2_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_20_chunk 20_40_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_20_chunk
    ADD CONSTRAINT "20_40_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_21_chunk 21_42_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_21_chunk
    ADD CONSTRAINT "21_42_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_22_chunk 22_44_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_22_chunk
    ADD CONSTRAINT "22_44_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_23_chunk 23_46_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_23_chunk
    ADD CONSTRAINT "23_46_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_24_chunk 24_48_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_24_chunk
    ADD CONSTRAINT "24_48_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_2_chunk 2_4_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_2_chunk
    ADD CONSTRAINT "2_4_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_3_chunk 3_6_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_3_chunk
    ADD CONSTRAINT "3_6_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_4_chunk 4_8_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_4_chunk
    ADD CONSTRAINT "4_8_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_5_chunk 5_10_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_5_chunk
    ADD CONSTRAINT "5_10_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_6_chunk 6_12_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_6_chunk
    ADD CONSTRAINT "6_12_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_7_chunk 7_14_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_7_chunk
    ADD CONSTRAINT "7_14_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_8_chunk 8_16_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_8_chunk
    ADD CONSTRAINT "8_16_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: _hyper_1_9_chunk 9_18_energy_emissions_data_pkey; Type: CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_9_chunk
    ADD CONSTRAINT "9_18_energy_emissions_data_pkey" PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: ceep_plans ceep_plans_community_id_plan_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ceep_plans
    ADD CONSTRAINT ceep_plans_community_id_plan_year_key UNIQUE (community_id, plan_year);


--
-- Name: ceep_plans ceep_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ceep_plans
    ADD CONSTRAINT ceep_plans_pkey PRIMARY KEY (id);


--
-- Name: communities communities_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_name_key UNIQUE (name);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: data_sources data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_pkey PRIMARY KEY (id);


--
-- Name: data_sources data_sources_source_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT data_sources_source_name_key UNIQUE (source_name);


--
-- Name: energy_emissions_data energy_emissions_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_emissions_data
    ADD CONSTRAINT energy_emissions_data_pkey PRIMARY KEY ("time", community_id, sector, energy_source);


--
-- Name: energy_mapping_inputs energy_mapping_inputs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_mapping_inputs
    ADD CONSTRAINT energy_mapping_inputs_pkey PRIMARY KEY (id);


--
-- Name: funding_reports funding_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funding_reports
    ADD CONSTRAINT funding_reports_pkey PRIMARY KEY (id);


--
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: _hyper_1_10_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_10_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_10_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_10_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_10_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_10_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_10_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_10_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_10_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_10_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_10_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_10_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_11_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_11_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_11_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_11_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_11_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_11_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_11_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_11_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_11_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_11_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_11_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_11_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_12_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_12_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_12_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_12_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_12_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_12_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_12_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_12_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_12_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_12_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_12_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_12_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_13_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_13_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_13_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_13_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_13_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_13_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_13_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_13_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_13_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_13_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_13_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_13_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_14_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_14_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_14_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_14_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_14_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_14_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_14_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_14_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_14_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_14_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_14_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_14_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_15_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_15_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_15_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_15_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_15_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_15_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_15_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_15_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_15_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_15_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_15_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_15_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_16_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_16_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_16_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_16_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_16_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_16_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_16_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_16_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_16_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_16_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_16_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_16_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_17_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_17_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_17_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_17_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_17_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_17_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_17_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_17_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_17_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_17_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_17_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_17_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_18_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_18_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_18_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_18_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_18_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_18_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_18_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_18_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_18_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_18_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_18_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_18_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_19_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_19_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_19_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_19_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_19_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_19_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_19_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_19_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_19_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_19_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_19_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_19_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_1_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_1_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_1_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_1_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_1_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_1_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_1_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_1_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_1_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_1_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_1_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_1_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_20_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_20_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_20_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_20_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_20_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_20_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_20_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_20_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_20_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_20_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_20_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_20_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_21_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_21_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_21_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_21_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_21_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_21_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_21_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_21_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_21_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_21_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_21_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_21_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_22_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_22_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_22_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_22_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_22_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_22_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_22_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_22_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_22_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_22_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_22_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_22_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_23_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_23_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_23_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_23_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_23_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_23_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_23_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_23_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_23_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_23_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_23_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_23_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_24_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_24_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_24_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_24_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_24_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_24_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_24_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_24_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_24_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_24_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_24_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_24_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_2_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_2_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_2_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_2_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_2_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_2_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_2_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_2_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_2_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_2_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_2_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_2_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_3_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_3_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_3_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_3_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_3_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_3_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_3_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_3_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_3_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_3_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_3_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_3_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_4_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_4_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_4_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_4_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_4_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_4_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_4_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_4_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_4_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_4_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_4_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_4_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_5_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_5_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_5_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_5_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_5_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_5_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_5_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_5_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_5_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_5_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_5_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_5_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_6_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_6_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_6_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_6_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_6_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_6_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_6_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_6_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_6_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_6_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_6_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_6_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_7_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_7_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_7_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_7_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_7_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_7_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_7_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_7_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_7_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_7_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_7_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_7_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_8_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_8_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_8_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_8_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_8_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_8_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_8_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_8_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_8_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_8_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_8_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_8_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_1_9_chunk_energy_emissions_data_time_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_9_chunk_energy_emissions_data_time_idx ON _timescaledb_internal._hyper_1_9_chunk USING btree ("time" DESC);


--
-- Name: _hyper_1_9_chunk_idx_energy_emissions_community; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_9_chunk_idx_energy_emissions_community ON _timescaledb_internal._hyper_1_9_chunk USING btree (community_id, "time" DESC);


--
-- Name: _hyper_1_9_chunk_idx_energy_emissions_sector; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_9_chunk_idx_energy_emissions_sector ON _timescaledb_internal._hyper_1_9_chunk USING btree (sector, "time" DESC);


--
-- Name: _hyper_1_9_chunk_idx_energy_emissions_source; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_1_9_chunk_idx_energy_emissions_source ON _timescaledb_internal._hyper_1_9_chunk USING btree (energy_source, "time" DESC);


--
-- Name: _hyper_2_25_chunk__materialized_hypertable_2_community_id_month; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_25_chunk__materialized_hypertable_2_community_id_month ON _timescaledb_internal._hyper_2_25_chunk USING btree (community_id, month DESC);


--
-- Name: _hyper_2_25_chunk__materialized_hypertable_2_energy_source_mont; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_25_chunk__materialized_hypertable_2_energy_source_mont ON _timescaledb_internal._hyper_2_25_chunk USING btree (energy_source, month DESC);


--
-- Name: _hyper_2_25_chunk__materialized_hypertable_2_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_25_chunk__materialized_hypertable_2_month_idx ON _timescaledb_internal._hyper_2_25_chunk USING btree (month DESC);


--
-- Name: _hyper_2_25_chunk__materialized_hypertable_2_sector_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_25_chunk__materialized_hypertable_2_sector_month_idx ON _timescaledb_internal._hyper_2_25_chunk USING btree (sector, month DESC);


--
-- Name: _hyper_2_26_chunk__materialized_hypertable_2_community_id_month; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_26_chunk__materialized_hypertable_2_community_id_month ON _timescaledb_internal._hyper_2_26_chunk USING btree (community_id, month DESC);


--
-- Name: _hyper_2_26_chunk__materialized_hypertable_2_energy_source_mont; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_26_chunk__materialized_hypertable_2_energy_source_mont ON _timescaledb_internal._hyper_2_26_chunk USING btree (energy_source, month DESC);


--
-- Name: _hyper_2_26_chunk__materialized_hypertable_2_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_26_chunk__materialized_hypertable_2_month_idx ON _timescaledb_internal._hyper_2_26_chunk USING btree (month DESC);


--
-- Name: _hyper_2_26_chunk__materialized_hypertable_2_sector_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_26_chunk__materialized_hypertable_2_sector_month_idx ON _timescaledb_internal._hyper_2_26_chunk USING btree (sector, month DESC);


--
-- Name: _hyper_2_27_chunk__materialized_hypertable_2_community_id_month; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_27_chunk__materialized_hypertable_2_community_id_month ON _timescaledb_internal._hyper_2_27_chunk USING btree (community_id, month DESC);


--
-- Name: _hyper_2_27_chunk__materialized_hypertable_2_energy_source_mont; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_27_chunk__materialized_hypertable_2_energy_source_mont ON _timescaledb_internal._hyper_2_27_chunk USING btree (energy_source, month DESC);


--
-- Name: _hyper_2_27_chunk__materialized_hypertable_2_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_27_chunk__materialized_hypertable_2_month_idx ON _timescaledb_internal._hyper_2_27_chunk USING btree (month DESC);


--
-- Name: _hyper_2_27_chunk__materialized_hypertable_2_sector_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _hyper_2_27_chunk__materialized_hypertable_2_sector_month_idx ON _timescaledb_internal._hyper_2_27_chunk USING btree (sector, month DESC);


--
-- Name: _materialized_hypertable_2_community_id_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_2_community_id_month_idx ON _timescaledb_internal._materialized_hypertable_2 USING btree (community_id, month DESC);


--
-- Name: _materialized_hypertable_2_energy_source_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_2_energy_source_month_idx ON _timescaledb_internal._materialized_hypertable_2 USING btree (energy_source, month DESC);


--
-- Name: _materialized_hypertable_2_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_2_month_idx ON _timescaledb_internal._materialized_hypertable_2 USING btree (month DESC);


--
-- Name: _materialized_hypertable_2_sector_month_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_2_sector_month_idx ON _timescaledb_internal._materialized_hypertable_2 USING btree (sector, month DESC);


--
-- Name: _materialized_hypertable_3_community_id_year_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_3_community_id_year_idx ON _timescaledb_internal._materialized_hypertable_3 USING btree (community_id, year DESC);


--
-- Name: _materialized_hypertable_3_sector_year_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_3_sector_year_idx ON _timescaledb_internal._materialized_hypertable_3 USING btree (sector, year DESC);


--
-- Name: _materialized_hypertable_3_year_idx; Type: INDEX; Schema: _timescaledb_internal; Owner: postgres
--

CREATE INDEX _materialized_hypertable_3_year_idx ON _timescaledb_internal._materialized_hypertable_3 USING btree (year DESC);


--
-- Name: energy_emissions_data_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX energy_emissions_data_time_idx ON public.energy_emissions_data USING btree ("time" DESC);


--
-- Name: idx_activity_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_type ON public.user_activity_log USING btree (activity_type, "timestamp" DESC);


--
-- Name: idx_activity_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_user ON public.user_activity_log USING btree (user_id, "timestamp" DESC);


--
-- Name: idx_ceep_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ceep_community ON public.ceep_plans USING btree (community_id);


--
-- Name: idx_ceep_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ceep_status ON public.ceep_plans USING btree (plan_status);


--
-- Name: idx_communities_province; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communities_province ON public.communities USING btree (province);


--
-- Name: idx_communities_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communities_type ON public.communities USING btree (community_type);


--
-- Name: idx_data_sources_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_data_sources_active ON public.data_sources USING btree (is_active, last_sync DESC);


--
-- Name: idx_energy_emissions_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_emissions_community ON public.energy_emissions_data USING btree (community_id, "time" DESC);


--
-- Name: idx_energy_emissions_sector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_emissions_sector ON public.energy_emissions_data USING btree (sector, "time" DESC);


--
-- Name: idx_energy_emissions_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_emissions_source ON public.energy_emissions_data USING btree (energy_source, "time" DESC);


--
-- Name: idx_energy_mapping_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_mapping_community ON public.energy_mapping_inputs USING btree (community_id, "timestamp" DESC);


--
-- Name: idx_energy_mapping_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_mapping_data ON public.energy_mapping_inputs USING gin (input_data);


--
-- Name: idx_energy_mapping_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_energy_mapping_type ON public.energy_mapping_inputs USING btree (stakeholder_type);


--
-- Name: idx_funding_reports_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funding_reports_community ON public.funding_reports USING btree (community_id, report_date DESC);


--
-- Name: idx_funding_reports_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_funding_reports_type ON public.funding_reports USING btree (report_type);


--
-- Name: idx_users_community; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_community ON public.users USING btree (community_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: _hyper_1_10_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_10_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_11_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_11_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_12_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_12_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_13_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_13_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_14_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_14_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_15_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_15_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_16_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_16_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_17_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_17_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_18_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_18_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_19_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_19_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_1_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_1_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_20_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_20_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_21_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_21_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_22_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_22_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_23_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_23_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_24_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_24_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_2_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_2_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_3_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_3_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_4_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_4_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_5_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_5_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_6_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_6_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_7_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_7_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_8_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_8_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _hyper_1_9_chunk ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON _timescaledb_internal._hyper_1_9_chunk FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: _compressed_hypertable_4 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_insert_blocker BEFORE INSERT ON _timescaledb_internal._compressed_hypertable_4 FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.insert_blocker();


--
-- Name: _materialized_hypertable_2 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_insert_blocker BEFORE INSERT ON _timescaledb_internal._materialized_hypertable_2 FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.insert_blocker();


--
-- Name: _materialized_hypertable_3 ts_insert_blocker; Type: TRIGGER; Schema: _timescaledb_internal; Owner: postgres
--

CREATE TRIGGER ts_insert_blocker BEFORE INSERT ON _timescaledb_internal._materialized_hypertable_3 FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.insert_blocker();


--
-- Name: energy_emissions_data ts_cagg_invalidation_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ts_cagg_invalidation_trigger AFTER INSERT OR DELETE OR UPDATE ON public.energy_emissions_data FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.continuous_agg_invalidation_trigger('1');


--
-- Name: energy_emissions_data ts_insert_blocker; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ts_insert_blocker BEFORE INSERT ON public.energy_emissions_data FOR EACH ROW EXECUTE FUNCTION _timescaledb_functions.insert_blocker();


--
-- Name: _hyper_1_10_chunk 10_19_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_10_chunk
    ADD CONSTRAINT "10_19_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_11_chunk 11_21_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_11_chunk
    ADD CONSTRAINT "11_21_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_12_chunk 12_23_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_12_chunk
    ADD CONSTRAINT "12_23_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_13_chunk 13_25_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_13_chunk
    ADD CONSTRAINT "13_25_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_14_chunk 14_27_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_14_chunk
    ADD CONSTRAINT "14_27_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_15_chunk 15_29_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_15_chunk
    ADD CONSTRAINT "15_29_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_16_chunk 16_31_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_16_chunk
    ADD CONSTRAINT "16_31_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_17_chunk 17_33_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_17_chunk
    ADD CONSTRAINT "17_33_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_18_chunk 18_35_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_18_chunk
    ADD CONSTRAINT "18_35_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_19_chunk 19_37_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_19_chunk
    ADD CONSTRAINT "19_37_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_1_chunk 1_1_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_1_chunk
    ADD CONSTRAINT "1_1_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_20_chunk 20_39_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_20_chunk
    ADD CONSTRAINT "20_39_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_21_chunk 21_41_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_21_chunk
    ADD CONSTRAINT "21_41_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_22_chunk 22_43_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_22_chunk
    ADD CONSTRAINT "22_43_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_23_chunk 23_45_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_23_chunk
    ADD CONSTRAINT "23_45_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_24_chunk 24_47_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_24_chunk
    ADD CONSTRAINT "24_47_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_2_chunk 2_3_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_2_chunk
    ADD CONSTRAINT "2_3_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_3_chunk 3_5_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_3_chunk
    ADD CONSTRAINT "3_5_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_4_chunk 4_7_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_4_chunk
    ADD CONSTRAINT "4_7_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_5_chunk 5_9_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_5_chunk
    ADD CONSTRAINT "5_9_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_6_chunk 6_11_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_6_chunk
    ADD CONSTRAINT "6_11_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_7_chunk 7_13_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_7_chunk
    ADD CONSTRAINT "7_13_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_8_chunk 8_15_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_8_chunk
    ADD CONSTRAINT "8_15_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: _hyper_1_9_chunk 9_17_energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: _timescaledb_internal; Owner: postgres
--

ALTER TABLE ONLY _timescaledb_internal._hyper_1_9_chunk
    ADD CONSTRAINT "9_17_energy_emissions_data_community_id_fkey" FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: ceep_plans ceep_plans_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ceep_plans
    ADD CONSTRAINT ceep_plans_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: energy_emissions_data energy_emissions_data_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_emissions_data
    ADD CONSTRAINT energy_emissions_data_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: energy_mapping_inputs energy_mapping_inputs_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.energy_mapping_inputs
    ADD CONSTRAINT energy_mapping_inputs_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: funding_reports funding_reports_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.funding_reports
    ADD CONSTRAINT funding_reports_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;


--
-- Name: user_activity_log user_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users users_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA public TO grafana_readonly;


--
-- Name: FUNCTION add_compression_policy(hypertable regclass, compress_after "any", if_not_exists boolean, schedule_interval interval, initial_start timestamp with time zone, timezone text, compress_created_before interval, hypercore_use_access_method boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_compression_policy(hypertable regclass, compress_after "any", if_not_exists boolean, schedule_interval interval, initial_start timestamp with time zone, timezone text, compress_created_before interval, hypercore_use_access_method boolean) TO grafana_readonly;


--
-- Name: FUNCTION add_continuous_aggregate_policy(continuous_aggregate regclass, start_offset "any", end_offset "any", schedule_interval interval, if_not_exists boolean, initial_start timestamp with time zone, timezone text, include_tiered_data boolean, buckets_per_batch integer, max_batches_per_execution integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_continuous_aggregate_policy(continuous_aggregate regclass, start_offset "any", end_offset "any", schedule_interval interval, if_not_exists boolean, initial_start timestamp with time zone, timezone text, include_tiered_data boolean, buckets_per_batch integer, max_batches_per_execution integer) TO grafana_readonly;


--
-- Name: FUNCTION add_dimension(hypertable regclass, dimension _timescaledb_internal.dimension_info, if_not_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_dimension(hypertable regclass, dimension _timescaledb_internal.dimension_info, if_not_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION add_dimension(hypertable regclass, column_name name, number_partitions integer, chunk_time_interval anyelement, partitioning_func regproc, if_not_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_dimension(hypertable regclass, column_name name, number_partitions integer, chunk_time_interval anyelement, partitioning_func regproc, if_not_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION add_job(proc regproc, schedule_interval interval, config jsonb, initial_start timestamp with time zone, scheduled boolean, check_config regproc, fixed_schedule boolean, timezone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_job(proc regproc, schedule_interval interval, config jsonb, initial_start timestamp with time zone, scheduled boolean, check_config regproc, fixed_schedule boolean, timezone text) TO grafana_readonly;


--
-- Name: FUNCTION add_reorder_policy(hypertable regclass, index_name name, if_not_exists boolean, initial_start timestamp with time zone, timezone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_reorder_policy(hypertable regclass, index_name name, if_not_exists boolean, initial_start timestamp with time zone, timezone text) TO grafana_readonly;


--
-- Name: FUNCTION add_retention_policy(relation regclass, drop_after "any", if_not_exists boolean, schedule_interval interval, initial_start timestamp with time zone, timezone text, drop_created_before interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_retention_policy(relation regclass, drop_after "any", if_not_exists boolean, schedule_interval interval, initial_start timestamp with time zone, timezone text, drop_created_before interval) TO grafana_readonly;


--
-- Name: FUNCTION alter_job(job_id integer, schedule_interval interval, max_runtime interval, max_retries integer, retry_period interval, scheduled boolean, config jsonb, next_start timestamp with time zone, if_exists boolean, check_config regproc, fixed_schedule boolean, initial_start timestamp with time zone, timezone text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.alter_job(job_id integer, schedule_interval interval, max_runtime interval, max_retries integer, retry_period interval, scheduled boolean, config jsonb, next_start timestamp with time zone, if_exists boolean, check_config regproc, fixed_schedule boolean, initial_start timestamp with time zone, timezone text) TO grafana_readonly;


--
-- Name: FUNCTION approximate_row_count(relation regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.approximate_row_count(relation regclass) TO grafana_readonly;


--
-- Name: FUNCTION attach_tablespace(tablespace name, hypertable regclass, if_not_attached boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.attach_tablespace(tablespace name, hypertable regclass, if_not_attached boolean) TO grafana_readonly;


--
-- Name: FUNCTION by_hash(column_name name, number_partitions integer, partition_func regproc); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.by_hash(column_name name, number_partitions integer, partition_func regproc) TO grafana_readonly;


--
-- Name: FUNCTION by_range(column_name name, partition_interval anyelement, partition_func regproc); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.by_range(column_name name, partition_interval anyelement, partition_func regproc) TO grafana_readonly;


--
-- Name: FUNCTION chunk_columnstore_stats(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.chunk_columnstore_stats(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION chunk_compression_stats(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.chunk_compression_stats(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION chunks_detailed_size(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.chunks_detailed_size(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION compress_chunk(uncompressed_chunk regclass, if_not_compressed boolean, recompress boolean, hypercore_use_access_method boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.compress_chunk(uncompressed_chunk regclass, if_not_compressed boolean, recompress boolean, hypercore_use_access_method boolean) TO grafana_readonly;


--
-- Name: FUNCTION create_hypertable(relation regclass, dimension _timescaledb_internal.dimension_info, create_default_indexes boolean, if_not_exists boolean, migrate_data boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_hypertable(relation regclass, dimension _timescaledb_internal.dimension_info, create_default_indexes boolean, if_not_exists boolean, migrate_data boolean) TO grafana_readonly;


--
-- Name: FUNCTION create_hypertable(relation regclass, time_column_name name, partitioning_column name, number_partitions integer, associated_schema_name name, associated_table_prefix name, chunk_time_interval anyelement, create_default_indexes boolean, if_not_exists boolean, partitioning_func regproc, migrate_data boolean, chunk_target_size text, chunk_sizing_func regproc, time_partitioning_func regproc); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_hypertable(relation regclass, time_column_name name, partitioning_column name, number_partitions integer, associated_schema_name name, associated_table_prefix name, chunk_time_interval anyelement, create_default_indexes boolean, if_not_exists boolean, partitioning_func regproc, migrate_data boolean, chunk_target_size text, chunk_sizing_func regproc, time_partitioning_func regproc) TO grafana_readonly;


--
-- Name: FUNCTION decompress_chunk(uncompressed_chunk regclass, if_compressed boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decompress_chunk(uncompressed_chunk regclass, if_compressed boolean) TO grafana_readonly;


--
-- Name: FUNCTION delete_job(job_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.delete_job(job_id integer) TO grafana_readonly;


--
-- Name: FUNCTION detach_tablespace(tablespace name, hypertable regclass, if_attached boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.detach_tablespace(tablespace name, hypertable regclass, if_attached boolean) TO grafana_readonly;


--
-- Name: FUNCTION detach_tablespaces(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.detach_tablespaces(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION disable_chunk_skipping(hypertable regclass, column_name name, if_not_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.disable_chunk_skipping(hypertable regclass, column_name name, if_not_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION drop_chunks(relation regclass, older_than "any", newer_than "any", "verbose" boolean, created_before "any", created_after "any"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.drop_chunks(relation regclass, older_than "any", newer_than "any", "verbose" boolean, created_before "any", created_after "any") TO grafana_readonly;


--
-- Name: FUNCTION enable_chunk_skipping(hypertable regclass, column_name name, if_not_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.enable_chunk_skipping(hypertable regclass, column_name name, if_not_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION get_per_capita_emissions(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_per_capita_emissions(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION get_renewable_percentage(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_renewable_percentage(p_community_id integer, p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION get_telemetry_report(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_telemetry_report() TO grafana_readonly;


--
-- Name: FUNCTION hypertable_approximate_detailed_size(relation regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_approximate_detailed_size(relation regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_approximate_size(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_approximate_size(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_columnstore_stats(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_columnstore_stats(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_compression_stats(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_compression_stats(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_detailed_size(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_detailed_size(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_index_size(index_name regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_index_size(index_name regclass) TO grafana_readonly;


--
-- Name: FUNCTION hypertable_size(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hypertable_size(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION interpolate(value real, prev record, next record); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.interpolate(value real, prev record, next record) TO grafana_readonly;


--
-- Name: FUNCTION interpolate(value double precision, prev record, next record); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.interpolate(value double precision, prev record, next record) TO grafana_readonly;


--
-- Name: FUNCTION interpolate(value smallint, prev record, next record); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.interpolate(value smallint, prev record, next record) TO grafana_readonly;


--
-- Name: FUNCTION interpolate(value integer, prev record, next record); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.interpolate(value integer, prev record, next record) TO grafana_readonly;


--
-- Name: FUNCTION interpolate(value bigint, prev record, next record); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.interpolate(value bigint, prev record, next record) TO grafana_readonly;


--
-- Name: FUNCTION locf(value anyelement, prev anyelement, treat_null_as_missing boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.locf(value anyelement, prev anyelement, treat_null_as_missing boolean) TO grafana_readonly;


--
-- Name: FUNCTION move_chunk(chunk regclass, destination_tablespace name, index_destination_tablespace name, reorder_index regclass, "verbose" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.move_chunk(chunk regclass, destination_tablespace name, index_destination_tablespace name, reorder_index regclass, "verbose" boolean) TO grafana_readonly;


--
-- Name: FUNCTION remove_compression_policy(hypertable regclass, if_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_compression_policy(hypertable regclass, if_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION remove_continuous_aggregate_policy(continuous_aggregate regclass, if_not_exists boolean, if_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_continuous_aggregate_policy(continuous_aggregate regclass, if_not_exists boolean, if_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION remove_reorder_policy(hypertable regclass, if_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_reorder_policy(hypertable regclass, if_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION remove_retention_policy(relation regclass, if_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.remove_retention_policy(relation regclass, if_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION reorder_chunk(chunk regclass, index regclass, "verbose" boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.reorder_chunk(chunk regclass, index regclass, "verbose" boolean) TO grafana_readonly;


--
-- Name: FUNCTION set_adaptive_chunking(hypertable regclass, chunk_target_size text, INOUT chunk_sizing_func regproc, OUT chunk_target_size bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_adaptive_chunking(hypertable regclass, chunk_target_size text, INOUT chunk_sizing_func regproc, OUT chunk_target_size bigint) TO grafana_readonly;


--
-- Name: FUNCTION set_chunk_time_interval(hypertable regclass, chunk_time_interval anyelement, dimension_name name); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_chunk_time_interval(hypertable regclass, chunk_time_interval anyelement, dimension_name name) TO grafana_readonly;


--
-- Name: FUNCTION set_integer_now_func(hypertable regclass, integer_now_func regproc, replace_if_exists boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_integer_now_func(hypertable regclass, integer_now_func regproc, replace_if_exists boolean) TO grafana_readonly;


--
-- Name: FUNCTION set_number_partitions(hypertable regclass, number_partitions integer, dimension_name name); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_number_partitions(hypertable regclass, number_partitions integer, dimension_name name) TO grafana_readonly;


--
-- Name: FUNCTION set_partitioning_interval(hypertable regclass, partition_interval anyelement, dimension_name name); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_partitioning_interval(hypertable regclass, partition_interval anyelement, dimension_name name) TO grafana_readonly;


--
-- Name: FUNCTION show_chunks(relation regclass, older_than "any", newer_than "any", created_before "any", created_after "any"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.show_chunks(relation regclass, older_than "any", newer_than "any", created_before "any", created_after "any") TO grafana_readonly;


--
-- Name: FUNCTION show_tablespaces(hypertable regclass); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.show_tablespaces(hypertable regclass) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width smallint, ts smallint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width smallint, ts smallint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width integer, ts integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width integer, ts integer) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width bigint, ts bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width bigint, ts bigint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts date) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp without time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width smallint, ts smallint, "offset" smallint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width smallint, ts smallint, "offset" smallint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width integer, ts integer, "offset" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width integer, ts integer, "offset" integer) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width bigint, ts bigint, "offset" bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width bigint, ts bigint, "offset" bigint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts date, origin date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts date, origin date) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts date, "offset" interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts date, "offset" interval) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp without time zone, "offset" interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp without time zone, "offset" interval) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp without time zone, origin timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp without time zone, origin timestamp without time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp with time zone, "offset" interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp with time zone, "offset" interval) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp with time zone, origin timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp with time zone, origin timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket(bucket_width interval, ts timestamp with time zone, timezone text, origin timestamp with time zone, "offset" interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket(bucket_width interval, ts timestamp with time zone, timezone text, origin timestamp with time zone, "offset" interval) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width smallint, ts smallint, start smallint, finish smallint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width smallint, ts smallint, start smallint, finish smallint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width integer, ts integer, start integer, finish integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width integer, ts integer, start integer, finish integer) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width bigint, ts bigint, start bigint, finish bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width bigint, ts bigint, start bigint, finish bigint) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width interval, ts date, start date, finish date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width interval, ts date, start date, finish date) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width interval, ts timestamp without time zone, start timestamp without time zone, finish timestamp without time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width interval, ts timestamp without time zone, start timestamp without time zone, finish timestamp without time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width interval, ts timestamp with time zone, start timestamp with time zone, finish timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width interval, ts timestamp with time zone, start timestamp with time zone, finish timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION time_bucket_gapfill(bucket_width interval, ts timestamp with time zone, timezone text, start timestamp with time zone, finish timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.time_bucket_gapfill(bucket_width interval, ts timestamp with time zone, timezone text, start timestamp with time zone, finish timestamp with time zone) TO grafana_readonly;


--
-- Name: FUNCTION timescaledb_post_restore(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.timescaledb_post_restore() TO grafana_readonly;


--
-- Name: FUNCTION timescaledb_pre_restore(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.timescaledb_pre_restore() TO grafana_readonly;


--
-- Name: FUNCTION first(anyelement, "any"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.first(anyelement, "any") TO grafana_readonly;


--
-- Name: FUNCTION histogram(double precision, double precision, double precision, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.histogram(double precision, double precision, double precision, integer) TO grafana_readonly;


--
-- Name: FUNCTION last(anyelement, "any"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.last(anyelement, "any") TO grafana_readonly;


--
-- Name: TABLE _compressed_hypertable_4; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._compressed_hypertable_4 TO grafana_readonly;


--
-- Name: TABLE energy_emissions_data; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.energy_emissions_data TO grafana_readonly;


--
-- Name: TABLE _direct_view_2; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._direct_view_2 TO grafana_readonly;


--
-- Name: TABLE _direct_view_3; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._direct_view_3 TO grafana_readonly;


--
-- Name: TABLE _hyper_1_10_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_10_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_11_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_11_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_12_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_12_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_13_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_13_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_14_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_14_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_15_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_15_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_16_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_16_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_17_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_17_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_18_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_18_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_19_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_19_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_1_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_1_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_20_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_20_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_21_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_21_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_22_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_22_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_23_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_23_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_24_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_24_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_2_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_2_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_3_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_3_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_4_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_4_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_5_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_5_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_6_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_6_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_7_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_7_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_8_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_8_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_1_9_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_1_9_chunk TO grafana_readonly;


--
-- Name: TABLE _materialized_hypertable_2; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._materialized_hypertable_2 TO grafana_readonly;


--
-- Name: TABLE _hyper_2_25_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_2_25_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_2_26_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_2_26_chunk TO grafana_readonly;


--
-- Name: TABLE _hyper_2_27_chunk; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._hyper_2_27_chunk TO grafana_readonly;


--
-- Name: TABLE _materialized_hypertable_3; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._materialized_hypertable_3 TO grafana_readonly;


--
-- Name: TABLE _partial_view_2; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._partial_view_2 TO grafana_readonly;


--
-- Name: TABLE _partial_view_3; Type: ACL; Schema: _timescaledb_internal; Owner: postgres
--

GRANT SELECT ON TABLE _timescaledb_internal._partial_view_3 TO grafana_readonly;


--
-- Name: TABLE ceep_plans; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.ceep_plans TO grafana_readonly;


--
-- Name: TABLE communities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.communities TO grafana_readonly;


--
-- Name: TABLE data_quality_summary; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.data_quality_summary TO grafana_readonly;


--
-- Name: TABLE data_sources; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.data_sources TO grafana_readonly;


--
-- Name: TABLE emissions_progress; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.emissions_progress TO grafana_readonly;


--
-- Name: TABLE energy_emissions_monthly; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.energy_emissions_monthly TO grafana_readonly;


--
-- Name: TABLE energy_emissions_yearly; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.energy_emissions_yearly TO grafana_readonly;


--
-- Name: TABLE energy_mapping_inputs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.energy_mapping_inputs TO grafana_readonly;


--
-- Name: TABLE funding_reports; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.funding_reports TO grafana_readonly;


--
-- Name: TABLE user_activity_log; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.user_activity_log TO grafana_readonly;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.users TO grafana_readonly;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES  TO grafana_readonly;


--
-- PostgreSQL database dump complete
--

\unrestrict zzDQnVLe5pjBIEUCQDOSRbDXMZul8ysC3ir9ms7y3x9vZdSC6DGoVhhWApLHwft

