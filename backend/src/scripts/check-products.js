const database = require('../config/database');

async function checkProducts() {
  try {
    console.log('🔍 Checking current product data...\n');

    // Initialize database connection
    await database.initialize();
    
    // Get total product count
    const totalResult = await database.query('SELECT COUNT(*) as total FROM products');
    const totalProducts = totalResult[0].total;
    
    console.log(`📊 Total Products: ${totalProducts}`);
    
    // Get products by category
    const categoryResult = await database.query(`
      SELECT c.name as category_name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `);
    
    console.log('\n📂 Products by Category:');
    categoryResult.forEach(cat => {
      console.log(`  → ${cat.category_name}: ${cat.product_count} products`);
    });
    
    // Get sample products
    const sampleProducts = await database.query(`
      SELECT p.name, p.price, c.name as category_name, p.stock_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    console.log('\n📱 Sample Products:');
    sampleProducts.forEach(product => {
      console.log(`  → ${product.name} - R${product.price} (${product.category_name}) - Stock: ${product.stock_quantity}`);
    });
    
    console.log(`\n✅ Database check complete!`);
    
    if (totalProducts < 20) {
      console.log(`\n⚠️  Warning: Only ${totalProducts} products found. Pagination will not be visible with less than 12 products per page.`);
      console.log('💡 Consider running the scraper to get more products or adding sample data.');
    }
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    process.exit(0);
  }
}

checkProducts();
