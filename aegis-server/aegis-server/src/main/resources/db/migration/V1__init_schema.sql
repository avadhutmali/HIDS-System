-- ============================================================
-- Aegis HIDS — V1 Database Schema
-- ============================================================

-- Enum types
CREATE TYPE device_type AS ENUM ('ANDROID', 'PC');
CREATE TYPE risk_level AS ENUM ('CLEAN', 'SUSPICIOUS', 'COMPROMISED');
CREATE TYPE event_type AS ENUM (
    'EVIL_TWIN', 'APK_UNKNOWN_SOURCE', 'OTP_READER_APP',
    'ERP_BRUTEFORCE', 'FIM_CHANGE', 'PROCESS_ANOMALY',
    'PORT_SCAN', 'MALICIOUS_IP'
);
CREATE TYPE severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

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
    device_type        device_type NOT NULL,
    device_model       VARCHAR(100),
    current_score      INT NOT NULL DEFAULT 100,
    risk_level         risk_level NOT NULL DEFAULT 'CLEAN',
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
    event_type     event_type NOT NULL,
    severity       severity NOT NULL,
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
