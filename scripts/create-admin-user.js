/**
 * Script to create the first admin user
 * 
 * Usage:
 *   node scripts/create-admin-user.js <username> <password>
 * 
 * Or set environment variables:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=password node scripts/create-admin-user.js
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const table = process.env.SUPABASE_ADMIN_USERS_TABLE || 'admin_users';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

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
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from(table)
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      console.error(`Error: Username "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const { data, error } = await supabase
      .from(table)
      .insert({
        username,
        password_hash: passwordHash,
      })
      .select('id, username, created_at')
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      process.exit(1);
    }

    console.log('✓ Admin user created successfully!');
    console.log(`  Username: ${data.username}`);
    console.log(`  ID: ${data.id}`);
    console.log(`  Created: ${data.created_at}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();

