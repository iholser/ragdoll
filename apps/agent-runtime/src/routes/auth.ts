import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  authenticateUser, 
  createUser, 
  createOrganization, 
  createSession, 
  signUpWithOrganization,
  getOrganizationBySlug,
  getUserById,
  deleteSession,
  getSessionByToken
} from '../services/auth';
import { logger } from '../utils/logger';

interface LoginBody {
  email: string;
  password: string;
}

interface SignUpBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
  organizationSlug: string;
  organizationDescription?: string;
}

interface JoinOrganizationBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationSlug: string;
}

const JWT_EXPIRES_IN = '7d';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post<{ Body: LoginBody }>('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    organizationId: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = request.body;

      const user = await authenticateUser(email, password);
      if (!user) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Create JWT token
      const token = await reply.jwtSign(
        {
          sub: user.id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role
        },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      const sessionToken = token; // Using JWT as session token
      await createSession(
        user.id,
        sessionToken,
        expiresAt,
        request.ip,
        request.headers['user-agent']
      );

      logger.info({ userId: user.id, email }, 'User logged in');

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            role: user.role
          },
          token
        }
      };
    } catch (error) {
      logger.error({ error }, 'Login error');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during login'
      });
    }
  });

  // Sign up with new organization
  fastify.post<{ Body: SignUpBody }>('/signup', {
    schema: {
      tags: ['Authentication'],
      summary: 'Sign up with new organization',
      body: {
        type: 'object',
        required: ['email', 'password', 'organizationName', 'organizationSlug'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          organizationName: { type: 'string', minLength: 1 },
          organizationSlug: { type: 'string', minLength: 1 },
          organizationDescription: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    organizationId: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: SignUpBody }>, reply: FastifyReply) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        organizationName, 
        organizationSlug,
        organizationDescription 
      } = request.body;

      // Check if organization slug already exists
      const existingOrg = await getOrganizationBySlug(organizationSlug);
      if (existingOrg) {
        return reply.status(400).send({
          success: false,
          error: 'Organization slug already exists',
          message: 'Please choose a different organization slug'
        });
      }

      // Create user and organization
      const { user, organization } = await signUpWithOrganization(
        { email, password, firstName, lastName },
        { name: organizationName, slug: organizationSlug, description: organizationDescription }
      );

      // Create JWT token
      const token = await reply.jwtSign(
        {
          sub: user.id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role
        },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      await createSession(
        user.id,
        token,
        expiresAt,
        request.ip,
        request.headers['user-agent']
      );

      logger.info({ 
        userId: user.id, 
        organizationId: organization.id,
        email 
      }, 'User signed up with new organization');

      return reply.status(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            role: user.role
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          },
          token
        }
      });
    } catch (error) {
      logger.error({ error }, 'Sign up error');
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.status(400).send({
            success: false,
            error: 'Registration failed',
            message: error.message
          });
        }
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during registration'
      });
    }
  });

  // Join existing organization
  fastify.post<{ Body: JoinOrganizationBody }>('/join', {
    schema: {
      tags: ['Authentication'],
      summary: 'Join existing organization',
      body: {
        type: 'object',
        required: ['email', 'password', 'organizationSlug'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          organizationSlug: { type: 'string', minLength: 1 }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    organizationId: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    slug: { type: 'string' }
                  }
                },
                token: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: JoinOrganizationBody }>, reply: FastifyReply) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        organizationSlug 
      } = request.body;

      // Check if organization exists
      const organization = await getOrganizationBySlug(organizationSlug);
      if (!organization) {
        return reply.status(400).send({
          success: false,
          error: 'Organization not found',
          message: 'The specified organization does not exist'
        });
      }

      // Create user
      const user = await createUser({
        email,
        password,
        firstName,
        lastName,
        organizationId: organization.id,
        role: 'user'
      });

      // Create JWT token
      const token = await reply.jwtSign(
        {
          sub: user.id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role
        },
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Create session
      const expiresAt = new Date(Date.now() + SESSION_DURATION);
      await createSession(
        user.id,
        token,
        expiresAt,
        request.ip,
        request.headers['user-agent']
      );

      logger.info({ 
        userId: user.id, 
        organizationId: organization.id,
        email 
      }, 'User joined organization');

      return reply.status(201).send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            role: user.role
          },
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          },
          token
        }
      });
    } catch (error) {
      logger.error({ error }, 'Join organization error');
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return reply.status(400).send({
            success: false,
            error: 'Registration failed',
            message: error.message
          });
        }
      }
      
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: 'An error occurred during registration'
      });
    }
  });

  // Get current user
  fastify.get('/me', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get current user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    organizationId: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Authentication required'
        });
      }

      const user = await getUserById(request.user.id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            organizationId: user.organizationId,
            role: user.role
          }
        }
      };
    } catch (error) {
      logger.error({ error }, 'Get current user error');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      tags: ['Authentication'],
      summary: 'User logout',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const session = await getSessionByToken(token);
        if (session) {
          await deleteSession(session.id);
        }
      }

      logger.info({ userId: request.user?.id }, 'User logged out');

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      logger.error({ error }, 'Logout error');
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
