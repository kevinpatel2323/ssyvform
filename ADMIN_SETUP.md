# Admin Panel Setup Guide

This guide will help you set up the admin panel for the registration system.

## Database Setup

1. Run the migration to create the `admin_users` table:

```sql
-- Run this in your Supabase SQL editor or database client
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
```

Or use the migration file: `supabase/migrations/create_admin_users.sql`

## Environment Variables

Make sure you have these environment variables set:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)
- `SUPABASE_ADMIN_USERS_TABLE` - (Optional) Table name for admin users (defaults to `admin_users`)
- `SUPABASE_REGISTRATIONS_TABLE` - (Optional) Table name for registrations (defaults to `registrations`)

## Creating the First Admin User

After setting up the database, you'll need to create your first admin user. You can do this by:

1. Making a POST request to `/api/admin/users` with authentication (once you're logged in), or
2. Manually inserting a user into the database with a hashed password

### Option 1: Using the API (after first login)

Once you have at least one admin user, you can create additional users by:

```bash
# First, login to get a session cookie
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}' \
  -c cookies.txt

# Then create a new user
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"username": "newadmin", "password": "secure-password"}' \
  -b cookies.txt
```

### Option 2: Manual Database Insert (for first user)

You can create a simple script or use a Node.js REPL to hash a password and insert it:

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = await bcrypt.hash(password, 10);
// Then insert: INSERT INTO admin_users (username, password_hash) VALUES ('admin', hash);
```

Or use a SQL function (if available in your database):

```sql
-- Note: This requires the pgcrypto extension
-- You'll need to hash the password in your application code
```

## Accessing the Admin Panel

1. Navigate to `/admin/login`
2. Enter your username and password
3. You'll be redirected to `/admin` (the dashboard)

## Route Structure

The admin routes are structured as follows:
- `/admin/login` - Login page (accessible without authentication)
- `/admin` - Dashboard (requires authentication, protected by route group)

Protected routes use Next.js route groups to ensure proper authentication checks.

## Features

- **Authentication**: Secure session-based authentication with password hashing
- **Dashboard**: View all registrations in a sortable, searchable table
- **Pagination**: Navigate through large datasets efficiently
- **Search**: Search across name, phone, city, state, native place, and ZIP code
- **Sorting**: Sort by any column (default: most recent first)
- **Photo Viewing**: Click "View Photo" to see registration photos (loaded on demand for performance)

## Security Notes

- Passwords are hashed using bcrypt with a cost factor of 10
- Sessions are stored in httpOnly cookies
- All admin routes require authentication
- The admin panel is protected by middleware that redirects unauthenticated users to the login page

