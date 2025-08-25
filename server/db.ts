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

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Ensure DB schema exists on first boot (idempotent)
export async function initDb() {
  // Use a single connection for setup
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS consumers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        department text,
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS presences (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        consumer_id varchar NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
        date text NOT NULL,
        is_present boolean DEFAULT true,
        created_at timestamp DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS consumptions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        consumer_id varchar NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
        amount integer NOT NULL,
        date text NOT NULL,
        created_at timestamp DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
      CREATE INDEX IF NOT EXISTS idx_consumptions_date ON consumptions(date);
      CREATE INDEX IF NOT EXISTS idx_consumptions_consumer ON consumptions(consumer_id);
    `);
  } finally {
    client.release();
  }
}