/**
 * Error handling middleware for the Metaverse Social Practice backend
 * 
 * This middleware provides consistent error handling for all routes.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError, normalizeError } from '../utils/errors';
import { ILoggerService } from '../services/logger.service';
import container from '../di/container';
import TYPES from '../di/types';

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const logger = container.get<ILoggerService>(TYPES.LoggerService);
  
  // Normalize the error to an AppError
  const appError = normalizeError(err);
  
  // Log the error
  if (appError.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} - ${appError.message}`, {
      error: appError,
      stack: appError.stack,
      body: (req as any).validatedBody || req.body,
      params: (req as any).validatedParams || req.params,
      query: (req as any).validatedQuery || req.query
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} - ${appError.message}`, {
      statusCode: appError.statusCode,
      body: (req as any).validatedBody || req.body,
      params: (req as any).validatedParams || req.params,
      query: (req as any).validatedQuery || req.query
    });
  }
  
  // Prepare the response
  const response: any = {
    status: 'error',
    message: appError.message
  };
  
  // Add validation errors if available
  if (appError instanceof ValidationError && appError.errors.length > 0) {
    response.errors = appError.errors;
  }
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV !== 'production' && appError.stack) {
    response.stack = appError.stack;
  }
  
  // Send the response
  res.status(appError.statusCode).json(response);
}

/**
 * Async handler to catch errors in async route handlers
 */
export function asyncErrorHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation middleware for request body using Zod schema
 * Compatible with Express 5 where req properties are read-only
 */
export function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the body but don't modify req.body directly
      const validatedBody = schema.parse(req.body);
      // Attach the validated data to the request object as a custom property
      (req as any).validatedBody = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation error', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validation middleware for request query parameters using Zod schema
 * Compatible with Express 5 where req properties are read-only
 */
export function validateQuery(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the query but don't modify req.query directly
      const validatedQuery = schema.parse(req.query);
      // Attach the validated data to the request object as a custom property
      (req as any).validatedQuery = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid query parameters', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validation middleware for request parameters using Zod schema
 * Compatible with Express 5 where req properties are read-only
 */
export function validateParams(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the params but don't modify req.params directly
      const validatedParams = schema.parse(req.params);
      // Attach the validated data to the request object as a custom property
      (req as any).validatedParams = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid path parameters', error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Not found handler middleware
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
}
