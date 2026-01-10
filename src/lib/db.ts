import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

function getPoolConfig(): PoolConfig {
  // Connection pool settings
  const poolConfig: PoolConfig = {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // For Cloud SQL, we can use Unix sockets or TCP connections
  // Priority: DATABASE_URL > Individual env vars > Defaults
  
  if (process.env.DATABASE_URL) {
    // Use connection string if provided
    // Format for Unix socket: postgresql://user:password@/database?host=/cloudsql/PROJECT:REGION:INSTANCE
    // Format for TCP: postgresql://user:password@host:port/database
    return {
      ...poolConfig,
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  } else {
    // Use individual environment variables
    const config: PoolConfig = {
      ...poolConfig,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
    
    // For Cloud SQL Unix socket, use DB_SOCKET_PATH as host
    if (process.env.DB_SOCKET_PATH) {
      config.host = process.env.DB_SOCKET_PATH;
    }
    
    return config;
  }
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(getPoolConfig());
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}

export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
