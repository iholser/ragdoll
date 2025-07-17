import { config } from './config';
import { setupDatabase } from './database';
import { logger } from './utils/logger';

async function testDatabase() {
  try {
    console.log('Testing database setup...');
    await setupDatabase();
    console.log('Database setup successful!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

testDatabase();
