import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the Neon pool with retry settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pooling to allow better handling of temporarily lost connections
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can be idle before being closed
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection fails
});

// Event listeners for pool connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the server, but log the error
});

// Create the drizzle ORM instance
export const db = drizzle({ client: pool, schema });

// Helper function to execute database operations with retries
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Log the error
      console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Check if it's a known recoverable error (like a terminated connection)
      const isRecoverableError = 
        error.code === '57P01' || // terminated by administrator command
        error.code === '08006' || // connection failure
        error.code === '08003' || // connection does not exist
        error.code === '08000';   // connection exception
      
      if (!isRecoverableError && attempt >= maxRetries) {
        console.error(`Giving up after ${attempt} attempts. Last error:`, error);
        throw error;
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        const backoffMs = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  throw lastError;
}
