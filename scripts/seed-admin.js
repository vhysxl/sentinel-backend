/**
 * Creates the first Finance Lead.
 *
 * Chicken-and-egg: POST /users requires an admin, so the first one cannot come
 * from an endpoint. This script is the only way to grant admin status —
 * see docs/auth_user_technical.md.
 *
 * Usage:
 *   npm run db:seed -- lead@company.com "Nama Lengkap"
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_NAME=... npm run db:seed
 *
 * Idempotent: re-running promotes and reactivates the existing account rather
 * than creating a duplicate.
 */
import { eq } from 'drizzle-orm';
import { db, pool } from '../src/db/client.js';
import { users } from '../src/db/schema/users.js';
import { hashPassword, generateTempPassword } from '../src/utils/password.util.js';

const email = (process.argv[2] || process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
const fullname = (process.argv[3] || process.env.SEED_ADMIN_NAME || 'Finance Lead').trim();

if (!email) {
  console.error('Email is required.');
  console.error('Usage: npm run db:seed -- lead@company.com "Nama Lengkap"');
  process.exit(1);
}

const seed = async () => {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  if (existing) {
    await db
      .update(users)
      .set({
        passwordHash,
        isAdmin: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, existing.id));

    console.log(`Existing account ${email} promoted to Finance Lead, password reset.`);
  } else {
    await db.insert(users).values({
      email,
      fullname,
      passwordHash,
      isAdmin: true,
      mustChangePassword: true
    });

    console.log(`Finance Lead created: ${email}`);
  }

  // Shown once, exactly like the temp password a Lead hands to a new member.
  console.log('');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${tempPassword}`);
  console.log('');
  console.log('Save it now — it cannot be retrieved later. You must change it on first login.');
};

seed()
  .catch((error) => {
    console.error('[SEED] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
