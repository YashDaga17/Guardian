import { Pool } from '@neondatabase/serverless';

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
};

let pool: Pool | null = null;

export function getDatabase(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool(dbConfig);
  }
  
  return pool;
}

// Close database connection (useful for testing)
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Health check for database connection
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = getDatabase();
    const result = await db.query('SELECT 1 as health');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default getDatabase;
