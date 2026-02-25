const SimpleTechMarkitScraper = require('./src/simple-techmarkit-scraper');

async function runSimpleScraper() {
  console.log('🚀 Starting Simple TechMarkIt Scraper...\n');
  
  try {
    const scraper = new SimpleTechMarkitScraper();
    
    // Scrape products
    const products = await scraper.scrapeProducts();
    
    if (products.length === 0) {
      console.log('❌ No products found!');
      return;
    }
    
    // Save products to JSON file
    const outputPath = await scraper.saveProducts();
    
    // Display summary
    console.log('\n📊 SCRAPING SUMMARY:');
    console.log('='.repeat(50));
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
    
    // Sample products
    console.log('\n📱 Sample Products:');
    products.slice(0, 8).forEach(product => {
      console.log(`  → ${product.name} - R${product.price.toLocaleString()} (${product.grade})`);
    });
    
    console.log(`\n✅ Simple scraping completed successfully!`);
    console.log(`📁 Data saved to: ${outputPath}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Run: cd ../backend && npm run import-data');
    console.log('   2. Check the storefront for new products');
    
  } catch (error) {
    console.error('❌ Simple scraper failed:', error);
    process.exit(1);
  }
}

// Run the scraper
runSimpleScraper();
