import { UsersQuery, toSafeUser } from '../db/queries/users.query.js';
import { hashPassword, generateTempPassword } from '../utils/password.util.js';
import { createError } from '../utils/api-response.util.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * Someone who has never signed in is Pending — that is what tells a Finance
 * Lead the handover has not happened yet.
 */
const withStatus = (user) => {
  const safe = toSafeUser(user);
  let status = 'Active';
  if (!user.isActive) {
    status = 'Inactive';
  } else if (!user.lastLoginAt) {
    status = 'Pending';
  }
  return { ...safe, status };
};

export class UserService {
  static async list() {
    const rows = await UsersQuery.findAll();
    return rows.map(withStatus);
  }

  /**
   * Creates a member and returns the temporary password ONCE. It is never
   * stored in plain text and no endpoint can read it back — a lost password
   * has to be replaced through resetPassword().
   */
  static async create({ email, fullname }) {
    const existing = await UsersQuery.findByEmail(email);
    if (existing) {
      console.error(`[USERS][create] email ${email} already exists`);
      throw createError(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
    }

    const tempPassword = generateTempPassword();
    const created = await UsersQuery.create({
      email,
      fullname,
      passwordHash: await hashPassword(tempPassword)
    });

    console.log(`[USERS][create] user ${created.id} created (${email})`);
    return { user: withStatus(created), tempPassword };
  }

  static async resetPassword(userId) {
    const user = await UsersQuery.findById(userId);
    if (!user) {
      throw createError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const tempPassword = generateTempPassword();
    const updated = await UsersQuery.setPassword(userId, await hashPassword(tempPassword), {
      mustChangePassword: true
    });

    console.log(`[USERS][reset-password] temp password issued for user ${userId}`);
    return { user: withStatus(updated), tempPassword };
  }

  static async setStatus(actorId, targetId, isActive) {
    // Guards against a Lead locking themselves out; there is no endpoint that
    // could grant admin back, only the seed script.
    if (actorId === targetId && !isActive) {
      console.error(`[USERS][status] user ${actorId} tried to deactivate themselves`);
      throw createError(ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF, HTTP_STATUS.BAD_REQUEST);
    }

    const user = await UsersQuery.findById(targetId);
    if (!user) {
      throw createError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updated = await UsersQuery.setActive(targetId, isActive);
    console.log(`[USERS][status] user ${targetId} set isActive=${isActive} by ${actorId}`);
    return withStatus(updated);
  }
}
