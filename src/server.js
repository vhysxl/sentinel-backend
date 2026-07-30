import app from './app.js';
import { config } from './config/env.config.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 Eleva LMS Backend running on http://localhost:${config.port} [${config.nodeEnv}]`);
  console.log(`🏥 Health Check available at http://localhost:${config.port}/health`);
});

// Graceful Shutdown Handling
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
