// Dynamic import for pg to handle ESM compatibility
import pg from "pg";
const { Pool } = pg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

// Create a connection pool for PostgreSQL with optimal settings
const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Set optimal pool size based on Postgres recommended formula:
  // connections = (num_cpu_cores * 2) + effective_spindle_count
  // For most cloud environments, 20 is a reasonable default
  max: 20,
  // Idle timeout in milliseconds
  idleTimeoutMillis: 30000,
  // Connection timeout in milliseconds
  connectionTimeoutMillis: 5000,
});

// Add error handler to prevent app crashes on connection issues
connectionPool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Export drizzle instance with proper typing from schema
export const db = drizzle(connectionPool, { schema });

// Export a function to manually release the pool when needed (e.g., for testing or graceful shutdown)
export const closePool = async () => {
  await connectionPool.end();
};

// Export function to check database health
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await connectionPool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Database health check failed:", err);
    return false;
  }
};