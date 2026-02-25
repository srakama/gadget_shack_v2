#!/usr/bin/env node
require('dotenv').config();
const database = require('../config/database');

(async function seedFeatured() {
  try {
    console.log('⭐ Seeding featured products...');
    await database.initialize();

    // Pick latest 6 active, set featured=1
    const latest = await database.query(
      `SELECT id, name FROM products WHERE status='active' ORDER BY created_at DESC LIMIT 6`
    );

    if (latest.length === 0) {
      console.log('No active products found to feature.');
      return process.exit(0);
    }

    const ids = latest.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    await database.run(`UPDATE products SET featured=1, updated_at=CURRENT_TIMESTAMP WHERE id IN (${placeholders})`, ids);

    console.log(`✅ Marked ${ids.length} product(s) as featured:`);
    latest.forEach(p => console.log(` - ${p.id}: ${p.name}`));

    process.exit(0);
  } catch (e) {
    console.error('❌ Failed to seed featured:', e);
    process.exit(1);
  } finally {
    try { await database.close(); } catch {}
  }
})();

