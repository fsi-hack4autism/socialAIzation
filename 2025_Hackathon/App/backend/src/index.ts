import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cors from 'cors';
import container from './di/container';
import TYPES from './di/types';
import { registerDependencies, initializeServices } from './di/register';
import { IConfig } from './di/config';
import { ILoggerService } from './services/logger.service';
import { IDatabaseService } from './services/database.service';
import { registerRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Register all dependencies first, before any imports might try to use them
registerDependencies();

async function bootstrap() {
  // Get services from container
  const config = container.get<IConfig>(TYPES.Config);
  const logger = container.get<ILoggerService>(TYPES.LoggerService);
  const databaseService = container.get<IDatabaseService>(TYPES.DatabaseService);
  
  // Create Express app
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(cors(config.server.cors));
  
  // Initialize all services
  try {
    await initializeServices();
  } catch (error) {
    logger.error('Failed to initialize services', error);
    process.exit(1);
  }
  
  // Register routes
  registerRoutes(app, logger);
  
  // Basic health check route
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok', 
      environment: config.env,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // Not found handler - must be after all routes
  app.use(notFoundHandler);
  
  // Error handling middleware - must be the last middleware
  app.use(errorHandler);
  
  // Start server
  const PORT = config.server.port;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${config.env} environment`);
  });
  
  // Handle termination
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await databaseService.close();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason);
    process.exit(1);
  });
}

bootstrap().catch(error => {
  console.error('Failed to start application', error);
  process.exit(1);
});