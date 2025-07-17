import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../database';
import { logger } from '../utils/logger';

/**
 * Run database migrations
 */
export const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Running database migrations...');
    
    // Read and execute schema file
    const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    // Split by statements and execute each one
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement);
      }
    }
    
    logger.info('✅ Database migrations completed successfully');
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  }
};

/**
 * Check if migrations are needed
 */
export const checkMigrations = async (): Promise<boolean> => {
  try {
    // Check if organizations table exists
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
      );
    `);
    
    return !result[0].exists;
  } catch (error) {
    logger.error('Error checking migrations:', error);
    return true; // Assume migrations are needed if check fails
  }
};

/**
 * Setup database with migrations
 */
export const setupDatabaseWithMigrations = async (): Promise<void> => {
  try {
    const needsMigration = await checkMigrations();
    
    if (needsMigration) {
      await runMigrations();
    } else {
      logger.info('Database schema is up to date');
    }
  } catch (error) {
    logger.error('Database setup with migrations failed:', error);
    throw error;
  }
};
