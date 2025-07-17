import { setupDatabase } from './database';
import { config } from './config';

async function test() {
  try {
    console.log('Testing database setup...');
    await setupDatabase();
    console.log('Database setup successful!');
    
    console.log('Testing config...');
    console.log('PORT:', config.PORT);
    console.log('HOST:', config.HOST);
    console.log('Config loaded successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
