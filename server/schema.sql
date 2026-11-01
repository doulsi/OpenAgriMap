-- OpenAgriMap - P1 target schema: PostgreSQL + PostGIS.
-- The JSON store (server/store.js) is the zero-dependency prototype;
-- migrate to this schema when a database is provisioned (plan M1-M3).

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         CITEXT UNIQUE NOT NULL,
  display_name  VARCHAR(80) NOT NULL,
  password_hash TEXT NOT NULL,               -- scrypt$N$salt$hash
  role          TEXT NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor','moderator','admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS observations (
  id            TEXT PRIMARY KEY,            -- rep-NNN
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  geom          GEOMETRY(POINT, 4326) NOT NULL,
  bioaggressor  TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  crop          VARCHAR(120) NOT NULL,
  variety       VARCHAR(120),
  stage         VARCHAR(80),
  observed_at   TIMESTAMPTZ NOT NULL,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'pending_moderation'
                  CHECK (status IN ('pending_moderation','confirmed','rejected')),
  notes         TEXT,
  photo_url     VARCHAR(500),
  reporter_role TEXT NOT NULL,
  reporter_name TEXT NOT NULL,               -- public display name (anti-anonymous, P2)
  origin        TEXT NOT NULL DEFAULT 'community' CHECK (origin IN ('community','seed'))
);

CREATE INDEX IF NOT EXISTS idx_observations_geom ON observations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_observations_status ON observations (status);
CREATE INDEX IF NOT EXISTS idx_observations_user ON observations (user_id);
