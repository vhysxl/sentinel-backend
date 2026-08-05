import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 Sentinel Backend running on http://localhost:${port}`);
  console.log(`🏥 Health Check available at http://localhost:${port}/health`);
});

const gracefulShutdown = (signal) => {
  console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
