import { eq, asc } from 'drizzle-orm';
import { db } from '../client.js';
import { users } from '../schema/users.js';

/**
 * Every read/write against the users table lives here. Services never touch
 * drizzle directly, so the query shapes stay in one place.
 */
export class UsersQuery {
  static async findById(id) {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return rows[0] || null;
  }

  static async findAll() {
    return await db.select().from(users).orderBy(asc(users.fullname));
  }

  static async create({ email, fullname, passwordHash, isAdmin = false }) {
    const rows = await db
      .insert(users)
      .values({
        email,
        fullname,
        passwordHash,
        isAdmin,
        mustChangePassword: true
      })
      .returning();
    return rows[0];
  }

  static async setPassword(id, passwordHash, { mustChangePassword }) {
    const rows = await db
      .update(users)
      .set({ passwordHash, mustChangePassword, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }

  /**
   * Burns the temporary password after a Google sign-in proved it was never
   * needed. The account becomes Google-only until the owner sets their own
   * password via /auth/set-password.
   */
  static async clearPassword(id) {
    const rows = await db
      .update(users)
      .set({ passwordHash: null, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }

  static async linkGoogleSub(id, googleSub) {
    const rows = await db
      .update(users)
      .set({ googleSub, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }

  static async setActive(id, isActive) {
    const rows = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }

  static async touchLastLogin(id) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }
}

/**
 * Strips the password hash before a user object can reach a response.
 */
export const toSafeUser = (user) => {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
};
