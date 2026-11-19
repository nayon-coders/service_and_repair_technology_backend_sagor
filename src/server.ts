import app from './app';
import { env } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/prisma';

const startServer = async (): Promise<void> => {
  // Test and connect database
  await connectDatabase();

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 Business Management Server running in [${env.nodeEnv}] mode on port ${env.port}`);
    console.log(`🔗 Health check available at: http://127.0.0.1:${env.port}/api/v1/health`);
  });

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force close after 10s timeout
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

