import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/prisma.js';
import { initSocket } from './websocket/socket.js';

const PORT = env.PORT || 5000;

/**
 * Start Server
 */
const server = app.listen(PORT, async () => {
  console.log(`🚀 Sentinel Backend running in ${env.NODE_ENV} mode on port ${PORT}`);
  
  // Initialize Socket.IO
  initSocket(server);
  console.log('🔌 Socket.IO initialized');
  
  try {
    // Verify database connection on startup
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // In production, we might want to exit if the DB is critical
    // process.exit(1);
  }
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Process terminated.');
  });
});
