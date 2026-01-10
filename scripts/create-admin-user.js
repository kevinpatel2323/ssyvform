/**
 * Script to create the first admin user
 * 
 * Usage:
 *   node scripts/create-admin-user.js <username> <password>
 * 
 * Or set environment variables:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=password DATABASE_URL=... node scripts/create-admin-user.js
 * 
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string
 *   OR individual DB variables:
 *     DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *   ADMIN_USERS_TABLE - Table name (default: admin_users)
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

function getPoolConfig() {
  // Try connection string first
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  // Fall back to individual env vars
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  if (process.env.DB_SOCKET_PATH) {
    config.host = process.env.DB_SOCKET_PATH;
  }

  return config;
}

const pool = new Pool(getPoolConfig());
const table = process.env.ADMIN_USERS_TABLE || 'admin_users';

const username = process.env.ADMIN_USERNAME || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!username || !password) {
  console.error('Error: Username and password are required');
  console.error('Usage: node scripts/create-admin-user.js <username> <password>');
  console.error('Or set ADMIN_USERNAME and ADMIN_PASSWORD environment variables');
  process.exit(1);
}

if (username.length < 3) {
  console.error('Error: Username must be at least 3 characters');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Error: Password must be at least 8 characters');
  process.exit(1);
}

async function createAdminUser() {
  try {
    // Check if username already exists
    const existingResult = await pool.query(
      `SELECT id FROM ${table} WHERE username = $1`,
      [username]
    );

    if (existingResult.rows.length > 0) {
      console.error(`Error: Username "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO ${table} (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`,
      [username, passwordHash]
    );

    if (result.rows.length === 0) {
      console.error('Error: Failed to create user');
      process.exit(1);
    }

    const data = result.rows[0];
    console.log('✓ Admin user created successfully!');
    console.log(`  Username: ${data.username}`);
    console.log(`  ID: ${data.id}`);
    console.log(`  Created: ${data.created_at}`);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createAdminUser();

