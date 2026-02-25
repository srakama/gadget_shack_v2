const ShopifyTechMarkitScraper = require('./src/shopify-techmarkit-scraper');

async function runShopifyScraper() {
  console.log('🛍️ Starting Shopify TechMarkIt Scraper...\n');

  try {
    const args = process.argv.slice(2);
    const full = args.includes('--full');
    const incremental = !full;
    const scraper = new ShopifyTechMarkitScraper({ incremental });

    // Scrape products
    const products = await scraper.scrapeProducts();
    
    if (products.length === 0) {
      console.log('❌ No products found!');
      return;
    }
    
    // Save products to JSON file
    const outputPath = await scraper.saveProducts();
    
    // Display summary
    console.log('\n📊 SHOPIFY SCRAPING SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Products: ${products.length}`);
    
    // Group by category
    const categories = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });
    
    console.log('\n📂 Products by Category:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  → ${category}: ${count} products`);
    });
    
    // Grade distribution
    const grades = {};
    products.forEach(product => {
      grades[product.grade] = (grades[product.grade] || 0) + 1;
    });
    
    console.log('\n🏷️ Products by Grade:');
    Object.entries(grades).forEach(([grade, count]) => {
      console.log(`  → ${grade}: ${count} products`);
    });
    
    // Price range
    const prices = products.map(p => p.price).filter(p => p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      console.log('\n💰 Price Range:');
      console.log(`  → Min: R${minPrice.toLocaleString()}`);
      console.log(`  → Max: R${maxPrice.toLocaleString()}`);
      console.log(`  → Avg: R${Math.round(avgPrice).toLocaleString()}`);
    }
    
    // Stock analysis
    const stockLevels = products.map(p => p.stock_quantity).filter(s => s > 0);
    if (stockLevels.length > 0) {
      const totalStock = stockLevels.reduce((a, b) => a + b, 0);
      console.log('\n📦 Stock Analysis:');
      console.log(`  → Total Stock: ${totalStock.toLocaleString()} units`);
      console.log(`  → Avg per Product: ${Math.round(totalStock / stockLevels.length)} units`);
    }
    
    // Sample products
    console.log('\n📱 Sample Products:');
    products.slice(0, 10).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     → R${product.price.toLocaleString()} | ${product.grade} | Stock: ${product.stock_quantity}`);
    });
    
    // Image analysis
    const withImages = products.filter(p => p.images && p.images.length > 0);
    console.log(`\n🖼️ Images: ${withImages.length}/${products.length} products have images (${Math.round(withImages.length/products.length*100)}%)`);
    
    console.log(`\n✅ Shopify scraping completed successfully!`);
    console.log(`📁 Data saved to: ${outputPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Run: cd ../backend && npm run import-data');
    console.log('   2. Check the storefront for new TechMarkIt products');
    console.log('   3. Verify pagination is working with real products');
    
  } catch (error) {
    console.error('❌ Shopify scraper failed:', error);
    process.exit(1);
  }
}

// Run the scraper
runShopifyScraper();
