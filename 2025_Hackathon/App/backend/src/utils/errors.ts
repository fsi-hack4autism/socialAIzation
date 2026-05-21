/**
 * Standardized error handling system for the Metaverse Social Practice backend
 * 
 * This module provides a set of standardized error classes and utilities
 * for consistent error handling across the application.
 */

// Base application error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set the prototype explicitly
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// HTTP error classes
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

export class ValidationError extends BadRequestError {
  errors: any[];
  
  constructor(message = 'Validation error', errors: any[] = []) {
    super(message);
    this.errors = errors;
  }
}

// Database error classes
export class DatabaseError extends AppError {
  constructor(message = 'Database error', isOperational = true) {
    super(message, 500, isOperational);
  }
}

// Service error classes
export class ServiceError extends AppError {
  constructor(message = 'Service error', statusCode = 500) {
    super(message, statusCode);
  }
}

// External service error
export class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super(message, 502);
  }
}

/**
 * Converts any error to an AppError
 * @param error Any error object
 * @returns AppError instance
 */
export function normalizeError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return new ValidationError('Validation error', error.errors);
  }
  
  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return new DatabaseError(error.message, true);
  }
  
  // Handle other errors
  return new AppError(error.message || 'Unknown error', 500, false);
}
