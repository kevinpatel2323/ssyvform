-- -- Create admin_users table
-- CREATE TABLE IF NOT EXISTS admin_users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   username TEXT UNIQUE NOT NULL,
--   password_hash TEXT NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- -- Create index on username for faster lookups
-- CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- -- Add comment to table
-- COMMENT ON TABLE admin_users IS 'Admin users for the registration system';

