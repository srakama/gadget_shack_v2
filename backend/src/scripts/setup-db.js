#!/usr/bin/env node

require('dotenv').config();
const database = require('../config/database');

async function setupDatabase() {
  try {
    console.log('🗄️  Setting up GadgetShack database...');
    
    // Initialize database and create tables
    await database.initialize();
    
    console.log('✅ Database setup completed successfully!');
    console.log('📍 Database location: backend/data/gadgetshack.db');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run scraper: cd scraper && npm run scrape');
    console.log('   2. Import data: npm run import-data');
    console.log('   3. Start server: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
