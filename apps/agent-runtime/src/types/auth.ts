import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
      organizationId: string;
      role: 'admin' | 'user';
    };
    user: {
      id: string;
      email: string;
      organizationId: string;
      role: 'admin' | 'user';
    };
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    agentId?: string;
  }
}

export interface UserContext {
  id: string;
  email: string;
  organizationId: string;
  role: 'admin' | 'user';
}

export interface JWTPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}
