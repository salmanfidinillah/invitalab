CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    submission_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    attendance TEXT NOT NULL CHECK (attendance IN ('hadir', 'tidak_hadir', 'ragu')),
    guest_count INTEGER NOT NULL DEFAULT 0 CHECK (guest_count BETWEEN 0 AND 10),
    message TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE (event_id, submission_id)
);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_created
ON rsvps (event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS rsvp_rate_limits (
    rate_key TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 1,
    expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rsvp_rate_limits_expiry
ON rsvp_rate_limits (expires_at);
