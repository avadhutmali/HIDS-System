-- ============================================================
-- V2 Migration: Replace PostgreSQL ENUM types with VARCHAR
-- ============================================================

-- Drop existing tables that reference the ENUM types
DROP TABLE IF EXISTS patient_zero_clusters CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS heartbeats CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS access_policies CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- Drop ENUM types
DROP TYPE IF EXISTS severity CASCADE;
DROP TYPE IF EXISTS event_type CASCADE;
DROP TYPE IF EXISTS risk_level CASCADE;
DROP TYPE IF EXISTS device_type CASCADE;

-- Recreate tables with VARCHAR columns instead of ENUMs
-- ============================================================
-- Admin Users
-- ============================================================
CREATE TABLE admin_users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Devices
-- ============================================================
CREATE TABLE devices (
    id                 UUID PRIMARY KEY,
    prn                VARCHAR(20) NOT NULL,
    device_type        VARCHAR(50) NOT NULL,
    device_model       VARCHAR(100),
    current_score      INT NOT NULL DEFAULT 100,
    risk_level         VARCHAR(50) NOT NULL DEFAULT 'CLEAN',
    department         VARCHAR(50),
    last_seen          TIMESTAMP NOT NULL DEFAULT NOW(),
    erp_access_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    enrolled_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    consent_accepted   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- Security Events
-- ============================================================
CREATE TABLE security_events (
    id             BIGSERIAL PRIMARY KEY,
    device_id      UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_type     VARCHAR(50) NOT NULL,
    severity       VARCHAR(50) NOT NULL,
    payload        JSONB,
    acknowledged   BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledge_note TEXT,
    occurred_at    TIMESTAMP NOT NULL,
    received_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_device_occurred ON security_events(device_id, occurred_at DESC);
CREATE INDEX idx_events_type_severity_occurred ON security_events(event_type, severity, occurred_at DESC);

-- ============================================================
-- Heartbeats
-- ============================================================
CREATE TABLE heartbeats (
    id          BIGSERIAL PRIMARY KEY,
    device_id   UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    score       INT NOT NULL,
    wifi_bssid  VARCHAR(20),
    ip_address  INET,
    timestamp   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heartbeats_device_ts ON heartbeats(device_id, timestamp DESC);

-- ============================================================
-- Access Policies (singleton table)
-- ============================================================
CREATE TABLE access_policies (
    id                BIGSERIAL PRIMARY KEY,
    erp_min_score     INT NOT NULL DEFAULT 60,
    alert_thresholds  JSONB,
    app_whitelist     TEXT[],
    known_bssids      TEXT[],
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Patient Zero Clusters
-- ============================================================
CREATE TABLE patient_zero_clusters (
    id               BIGSERIAL PRIMARY KEY,
    threat_pattern   VARCHAR(100) NOT NULL,
    patient_zero_id  UUID REFERENCES devices(id) ON DELETE SET NULL,
    affected_devices UUID[],
    first_seen       TIMESTAMP NOT NULL,
    spread_count     INT NOT NULL DEFAULT 1
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Default admin user: admin / admin123  (bcrypt strength 12)
INSERT INTO admin_users (username, password, role)
VALUES ('admin', '$2a$12$LJ3m4ys3xZz0Yxa4YO1pOeRgJSRnI4Y5VqXoGKzSYoIG5bH4.nh7e', 'ADMIN');

-- Default access policy
INSERT INTO access_policies (erp_min_score, alert_thresholds, app_whitelist, known_bssids)
VALUES (
    60,
    '{"EVIL_TWIN": "CRITICAL", "APK_UNKNOWN_SOURCE": "HIGH", "FIM_CHANGE": "MEDIUM"}'::jsonb,
    ARRAY['com.phonepe.app', 'com.google.android.apps.nbu.paisa.user', 'in.amazon.mShop.android.shopping'],
    ARRAY['aa:bb:cc:dd:ee:ff']
);
