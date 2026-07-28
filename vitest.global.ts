import { execSync } from 'child_process';
import { Pool } from 'pg';

const TEST_DB_URL = process.env.DATABASE_URL!;
const ADMIN_URL = TEST_DB_URL.replace('/meet_schedule_lab_test', '/postgres');

export async function setup(): Promise<void> {
  const pool = new Pool({ connectionString: ADMIN_URL });

  try {
    await pool.query('CREATE DATABASE "meet_schedule_lab_test"');
  } catch {
    // database already exists
  }

  await pool.end();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  });
}

export async function teardown(): Promise<void> {
  const pool = new Pool({ connectionString: ADMIN_URL });

  try {
    await pool.query('DROP DATABASE IF EXISTS "meet_schedule_lab_test"');
  } catch {
    // ignore cleanup errors
  }

  await pool.end();
}
