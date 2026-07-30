import { pool } from '../client.js';

/**
 * Database Query Layer - Health Ping
 * Executes live query on Neon PostgreSQL
 */
export const checkDatabaseConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    return {
      connected: true,
      status: 'CONNECTED',
      provider: 'Neon PostgreSQL (Cloud)',
      database: result.rows[0]?.db_name,
      serverTime: result.rows[0]?.current_time,
    };
  } catch (error) {
    return {
      connected: false,
      status: 'DISCONNECTED',
      provider: 'Neon PostgreSQL',
      error: error.message,
    };
  }
};
