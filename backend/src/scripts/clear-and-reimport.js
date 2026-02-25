const database = require('../config/database');

async function clearAndReimport() {
  try {
    console.log('🧹 Clearing existing products...');
    await database.initialize();
    
    // Clear products and categories
    await database.run('DELETE FROM products');
    await database.run('DELETE FROM categories WHERE id > 4'); // Keep first 4 default categories
    
    console.log('✅ Database cleared');
    
    // Now run the import
    console.log('📦 Starting fresh import...');
    const { spawn } = require('child_process');
    
    const importProcess = spawn('npm', ['run', 'import-data'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    importProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Fresh import completed successfully!');
      } else {
        console.error('❌ Import failed with code:', code);
      }
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAndReimport();
