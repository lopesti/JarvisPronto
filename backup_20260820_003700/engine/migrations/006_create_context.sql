-- 006_create_context.sql
CREATE TABLE IF NOT EXISTS context (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    context JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_phone ON context(phone);
