import app from './app.js';
import { config } from './config/env.config.js';
import { pool } from './db/client.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 Sentinel Backend running on http://localhost:${config.port}`);
  console.log(`🏥 Health Check available at http://localhost:${config.port}/health`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await pool.end();
    console.log('✅ HTTP server and database pool closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
