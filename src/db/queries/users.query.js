import { db } from '../client.js';
import { users } from '../schema/users.schema.js';
import { eq, or } from 'drizzle-orm';

export class UsersQuery {
  /**
   * Find a user by ID
   */
  static async findById(id) {
    const results = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return results[0] || null;
  }

  /**
   * Find a user by email, username, or NISN
   */
  static async findByIdentifier(identifier) {
    const results = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.email, identifier),
          eq(users.username, identifier),
          eq(users.nisn, identifier)
        )
      )
      .limit(1);
    return results[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return results[0] || null;
  }

  /**
   * Create a new user (Admin / Teacher / Student)
   */
  static async create(userData) {
    const results = await db.insert(users).values(userData).returning();
    return results[0];
  }

  /**
   * Update user password and set must_change_password = false
   */
  static async updatePassword(userId, newPasswordHash) {
    const results = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }

  /**
   * Link Google ID to user account
   */
  static async linkGoogleId(userId, googleId) {
    const results = await db
      .update(users)
      .set({
        googleId,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return results[0];
  }
}
