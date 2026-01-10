/**
 * Script to add admin user: kevin
 * 
 * Usage:
 *   DATABASE_URL=your_connection_string node scripts/add-kevin-user.js
 * 
 * Or set individual DB variables:
 *   DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=... node scripts/add-kevin-user.js
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
    host: '34.47.198.220',
    port: 5432,
    database: 'ssyvform',
    user: 'postgres',
    password: 'SSYV@Postgres1',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  if (process.env.DB_SOCKET_PATH) {
    config.host = process.env.DB_SOCKET_PATH;
  }

  return config;
}

const pool = new Pool(getPoolConfig());
const table = process.env.ADMIN_USERS_TABLE || 'admin_users';

const username = 'kevin';
const password = 'kevin@2000';

async function addAdminUser() {
  try {
    console.log(`Adding admin user: ${username}...`);

    // Check if username already exists
    const existingResult = await pool.query(
      `SELECT id FROM ${table} WHERE username = $1`,
      [username]
    );

    if (existingResult.rows.length > 0) {
      console.log(`User "${username}" already exists. Updating password...`);
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE ${table} SET password_hash = $1 WHERE username = $2`,
        [passwordHash, username]
      );
      
      console.log(`✓ Password updated for user "${username}"`);
    } else {
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
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addAdminUser();
