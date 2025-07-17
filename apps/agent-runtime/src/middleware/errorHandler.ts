import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  logger.error({
    err: error,
    req: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  }, 'Request error');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation error',
      details: error.validation,
    });
  }

  // Handle authentication errors
  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      message: 'Invalid or missing authentication token',
    });
  }

  // Handle authorization errors
  if (error.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden',
      message: 'Insufficient permissions',
    });
  }

  // Handle not found errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: 'Not found',
      message: 'Resource not found',
    });
  }

  // Handle rate limiting errors
  if (error.statusCode === 429) {
    return reply.status(429).send({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
    });
  }

  // Handle database connection errors
  if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
    return reply.status(503).send({
      success: false,
      error: 'Service unavailable',
      message: 'Database connection error',
    });
  }

  // Handle file upload errors
  if (error.statusCode === 413) {
    return reply.status(413).send({
      success: false,
      error: 'File too large',
      message: 'Uploaded file exceeds size limit',
    });
  }

  // Handle generic client errors
  if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      success: false,
      error: 'Client error',
      message: error.message || 'Bad request',
    });
  }

  // Handle generic server errors
  const statusCode = error.statusCode || 500;
  return reply.status(statusCode).send({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
};
