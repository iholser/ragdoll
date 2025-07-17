import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { getUserById, getSessionByToken } from '../services/auth';
import '../types/auth';

// Routes that don't require authentication
const publicRoutes = [
  '/health',
  '/api/health',
  '/api/chat', // Widget endpoints are public
  '/api/auth/login', // Login endpoint
  '/api/auth/signup', // Signup endpoint  
  '/api/auth/join', // Join organization endpoint
  '/docs',
  '/documentation',
];

// Routes that require organization context but not user auth
const widgetRoutes = [
  '/api/chat',
];

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  const { url, method } = request;
  
  logger.info({ url, method }, 'Processing request in auth middleware');
  
  // Skip authentication for public routes
  if (publicRoutes.some(route => url.startsWith(route))) {
    logger.info({ url }, 'Skipping authentication for public route');
    return;
  }

  // For widget routes, validate agent ID instead of user auth
  if (widgetRoutes.some(route => url.startsWith(route))) {
    return validateWidgetRequest(request, reply);
  }

  logger.info({ url }, 'Processing protected route');

  // Extract token from Authorization header
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.info({ authHeader }, 'Missing or invalid authorization header');
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // First try to verify JWT token
    logger.debug({ token: token.substring(0, 20) + '...' }, 'Verifying JWT token');
    const payload = await request.jwtVerify() as any;
    logger.debug({ payload }, 'JWT token verified successfully');
    
    // Then validate session exists and is not expired
    const session = await getSessionByToken(token);
    if (!session) {
      logger.debug({ token: token.substring(0, 20) + '...' }, 'Session not found');
      return reply.status(401).send({
        success: false,
        error: 'Invalid session',
        message: 'Session not found or expired',
      });
    }

    // Get current user data
    const user = await getUserById(payload.sub);
    if (!user || !user.isActive) {
      logger.debug({ userId: payload.sub }, 'User not found or inactive');
      return reply.status(401).send({
        success: false,
        error: 'User not found',
        message: 'User account not found or inactive',
      });
    }

    // Attach user info to request
    request.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    };

    logger.debug({
      userId: request.user.id,
      organizationId: request.user.organizationId,
      route: url,
      method,
    }, 'Authenticated request');

  } catch (error) {
    logger.warn({
      error: (error as Error).message,
      route: url,
      method,
    }, 'Authentication failed');

    return reply.status(401).send({
      success: false,
      error: 'Invalid token',
      message: 'Authentication token is invalid or expired',
    });
  }
};

const validateWidgetRequest = async (request: FastifyRequest, reply: FastifyReply) => {
  // For widget requests, we need to validate the agent ID exists
  const agentId = (request.body as any)?.agentId || (request.params as any)?.agentId || (request.query as any)?.agentId;
  
  if (!agentId) {
    return reply.status(400).send({
      success: false,
      error: 'Missing agent ID',
      message: 'Agent ID is required for widget requests',
    });
  }

  // TODO: Validate agent exists and is active
  // This would typically query the database to ensure the agent exists
  // For now, we'll just attach the agentId to the request
  request.agentId = agentId;
  
  logger.debug({
    agentId,
    route: request.url,
    method: request.method,
  }, 'Widget request validated');
};

// Helper function to check if user has required role
export const requireRole = (requiredRole: 'admin' | 'user') => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    if (request.user.role !== 'admin' && request.user.role !== requiredRole) {
      return reply.status(403).send({
        success: false,
        error: 'Insufficient permissions',
        message: `Role '${requiredRole}' or higher required`,
      });
    }
  };
};

// Helper function to check if user belongs to organization
export const requireOrganization = (organizationId: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    if (request.user.organizationId !== organizationId) {
      return reply.status(403).send({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this organization',
      });
    }
  };
};
