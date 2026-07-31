import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set in environment.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

const SALT_ROUNDS = 10;
const STUDENT_NISN = '0012345678';
const STUDENT_USERNAME = 'budi.santoso.42';
const STUDENT_NAME = 'Budi Santoso';
const STUDENT_PASSWORD = 'Siswa123!';

async function seedStudent() {
  const client = await pool.connect();
  try {
    console.log('🔄 Checking student account...');

    const existing = await client.query(
      'SELECT id, nisn FROM users WHERE nisn = $1',
      [STUDENT_NISN]
    );

    if (existing.rows.length > 0) {
      console.log(`⏭️  Student already exists (NISN ${STUDENT_NISN}), skipping.`);
      return;
    }

    const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, SALT_ROUNDS);
    const result = await client.query(
      `INSERT INTO users (role, name, username, nisn, password_hash, must_change_password, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, nisn, role`,
      ['STUDENT', STUDENT_NAME, STUDENT_USERNAME, STUDENT_NISN, passwordHash, true, true]
    );

    console.log(`✅ Student seeded:`, result.rows[0]);
    console.log(`   NISN: ${STUDENT_NISN}`);
    console.log(`   Username: ${STUDENT_USERNAME}`);
    console.log(`   Password: ${STUDENT_PASSWORD}`);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedStudent();
