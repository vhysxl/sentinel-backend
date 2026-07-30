import { checkDatabaseConnection } from '../db/queries/health.query.js';

export class HealthService {
  /**
   * Service Layer - Calculates API health metrics and coordinates DB status check
   */
  static async getHealthStatus() {
    const dbHealth = await checkDatabaseConnection();

    return {
      status: 'UP',
      app: 'Eleva LMS Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      database: dbHealth.status,
    };
  }
}
