-- 004_create_messages.sql
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT,
    direction VARCHAR(10) DEFAULT 'incoming',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_phone ON messages(phone);
