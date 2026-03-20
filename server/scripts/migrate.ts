import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function runMigrate() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
  console.log('Migration complete');
}

runMigrate().catch(console.error);
