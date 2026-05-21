import { Express } from 'express';
import { scenarioRoutes } from './scenario.routes';
import { ILoggerService } from '../services/logger.service';

/**
 * Register all application routes
 * @param app Express application instance
 * @param logger Logger service
 */
export function registerRoutes(app: Express, logger: ILoggerService): void {
  // API routes
  app.use('/api', scenarioRoutes);
  
  // Health check route
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  logger.info('Routes registered successfully');
}
