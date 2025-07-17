import bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { query, transaction } from '../database';
import { logger } from '../utils/logger';

const BCRYPT_ROUNDS = 12;

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  settings: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessed: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  role?: 'admin' | 'user';
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a secure random token
 */
export const generateToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex');
};

/**
 * Hash a token for storage
 */
export const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

/**
 * Create a new organization
 */
export const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
  const { name, slug, description, logoUrl } = data;
  
  // Check if slug already exists
  const existingOrg = await query(
    'SELECT id FROM organizations WHERE slug = $1',
    [slug]
  );
  
  if (existingOrg.length > 0) {
    throw new Error('Organization slug already exists');
  }
  
  const organizations = await query(`
    INSERT INTO organizations (name, slug, description, logo_url)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id,
      name,
      slug,
      description,
      logo_url as "logoUrl",
      settings,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [name, slug, description, logoUrl]);
  
  const organization = organizations[0];
  logger.info({ organizationId: organization.id, slug }, 'Organization created');
  
  return organization;
};

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = async (slug: string): Promise<Organization | null> => {
  const organizations = await query(`
    SELECT 
      id,
      name,
      slug,
      description,
      logo_url as "logoUrl",
      settings,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM organizations
    WHERE slug = $1 AND is_active = true
  `, [slug]);
  
  return organizations[0] || null;
};

/**
 * Get organization by ID
 */
export const getOrganizationById = async (id: string): Promise<Organization | null> => {
  const organizations = await query(`
    SELECT 
      id,
      name,
      slug,
      description,
      logo_url as "logoUrl",
      settings,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM organizations
    WHERE id = $1 AND is_active = true
  `, [id]);
  
  return organizations[0] || null;
};

/**
 * Create a new user
 */
export const createUser = async (data: CreateUserData): Promise<User> => {
  const { email, password, firstName, lastName, organizationId, role = 'user' } = data;
  
  // Check if email already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  
  if (existingUser.length > 0) {
    throw new Error('Email already exists');
  }
  
  // Verify organization exists
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }
  
  const passwordHash = await hashPassword(password);
  
  const users = await query(`
    INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING 
      id,
      email,
      first_name as "firstName",
      last_name as "lastName",
      organization_id as "organizationId",
      role,
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      email_verified as "emailVerified",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `, [email, passwordHash, firstName, lastName, organizationId, role]);
  
  const user = users[0];
  logger.info({ userId: user.id, email, organizationId }, 'User created');
  
  return user;
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const users = await query(`
    SELECT 
      id,
      email,
      first_name as "firstName",
      last_name as "lastName",
      organization_id as "organizationId",
      role,
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      email_verified as "emailVerified",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE email = $1 AND is_active = true
  `, [email]);
  
  return users[0] || null;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User | null> => {
  const users = await query(`
    SELECT 
      id,
      email,
      first_name as "firstName",
      last_name as "lastName",
      organization_id as "organizationId",
      role,
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      email_verified as "emailVerified",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE id = $1 AND is_active = true
  `, [id]);
  
  return users[0] || null;
};

/**
 * Authenticate user with email and password
 */
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  const users = await query(`
    SELECT 
      id,
      email,
      password_hash as "passwordHash",
      first_name as "firstName",
      last_name as "lastName",
      organization_id as "organizationId",
      role,
      is_active as "isActive",
      last_login_at as "lastLoginAt",
      email_verified as "emailVerified",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM users
    WHERE email = $1 AND is_active = true
  `, [email]);
  
  if (users.length === 0) {
    return null;
  }
  
  const user = users[0];
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  
  if (!isValidPassword) {
    return null;
  }
  
  // Update last login time
  await query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );
  
  // Remove password hash from returned user
  delete user.passwordHash;
  user.lastLoginAt = new Date();
  
  logger.info({ userId: user.id, email }, 'User authenticated');
  
  return user;
};

/**
 * Create a new session
 */
export const createSession = async (
  userId: string,
  token: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<Session> => {
  const tokenHash = hashToken(token);
  
  const sessions = await query(`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING 
      id,
      user_id as "userId",
      token_hash as "tokenHash",
      expires_at as "expiresAt",
      created_at as "createdAt",
      last_accessed as "lastAccessed",
      ip_address as "ipAddress",
      user_agent as "userAgent"
  `, [userId, tokenHash, expiresAt, ipAddress, userAgent]);
  
  const session = sessions[0];
  logger.debug({ sessionId: session.id, userId }, 'Session created');
  
  return session;
};

/**
 * Get session by token
 */
export const getSessionByToken = async (token: string): Promise<Session | null> => {
  const tokenHash = hashToken(token);
  
  const sessions = await query(`
    SELECT 
      id,
      user_id as "userId",
      token_hash as "tokenHash",
      expires_at as "expiresAt",
      created_at as "createdAt",
      last_accessed as "lastAccessed",
      ip_address as "ipAddress",
      user_agent as "userAgent"
    FROM sessions
    WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP
  `, [tokenHash]);
  
  if (sessions.length === 0) {
    return null;
  }
  
  const session = sessions[0];
  
  // Update last accessed time
  await query(
    'UPDATE sessions SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
    [session.id]
  );
  
  return session;
};

/**
 * Delete a session
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  logger.debug({ sessionId }, 'Session deleted');
};

/**
 * Delete expired sessions
 */
export const deleteExpiredSessions = async (): Promise<void> => {
  const result = await query(
    'DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP'
  );
  logger.debug({ deletedCount: result.length }, 'Expired sessions cleaned up');
};

/**
 * Sign up a new user and organization
 */
export const signUpWithOrganization = async (
  userData: Omit<CreateUserData, 'organizationId'>,
  organizationData: CreateOrganizationData
): Promise<{ user: User; organization: Organization }> => {
  return await transaction(async (client) => {
    // Create organization first
    const orgResult = await client.query(`
      INSERT INTO organizations (name, slug, description, logo_url)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        name,
        slug,
        description,
        logo_url as "logoUrl",
        settings,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [organizationData.name, organizationData.slug, organizationData.description, organizationData.logoUrl]);
    
    const organization = orgResult.rows[0];
    
    // Create user as admin of the organization
    const passwordHash = await hashPassword(userData.password);
    
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, organization_id, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        email,
        first_name as "firstName",
        last_name as "lastName",
        organization_id as "organizationId",
        role,
        is_active as "isActive",
        last_login_at as "lastLoginAt",
        email_verified as "emailVerified",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `, [userData.email, passwordHash, userData.firstName, userData.lastName, organization.id, 'admin']);
    
    const user = userResult.rows[0];
    
    logger.info({ 
      userId: user.id, 
      organizationId: organization.id,
      email: user.email,
      organizationSlug: organization.slug
    }, 'User and organization created');
    
    return { user, organization };
  });
};
