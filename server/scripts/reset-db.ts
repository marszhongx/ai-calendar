import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

async function resetDb() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL })
  const db = drizzle(pool)
  await db.execute(sql`DROP TABLE IF EXISTS schedules`)
  await db.execute(sql`DROP TABLE IF EXISTS devices`)
  await pool.end()
  console.log('Tables dropped')
}

resetDb().catch(console.error)
