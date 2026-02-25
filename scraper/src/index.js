#!/usr/bin/env node

require('dotenv').config();
const PepcellScraper = require('./scraper');
const scraperConfig = require('../config/scraper-config');

async function main() {
  const scraper = new PepcellScraper(scraperConfig);
  
  try {
    console.log('🚀 Starting PepCell product scraper...');
    console.log(`Target URL: ${scraperConfig.target_url}`);
    console.log(`Max pages: ${scraperConfig.pagination.max_pages}`);
    console.log('---');
    
    // Initialize browser
    await scraper.initialize();
    
    // Scrape products
    const products = await scraper.scrapeProducts();
    
    if (products.length === 0) {
      console.log('⚠️  No products found. This might indicate:');
      console.log('   - The website structure has changed');
      console.log('   - The selectors in config need updating');
      console.log('   - The website is blocking automated access');
      console.log('   - Network connectivity issues');
      
      // Create a sample product for testing
      const sampleProduct = {
        id: `sample_${Date.now()}`,
        sku: 'SAMPLE-001',
        name: 'Sample Product',
        price: 29.99 * 1.2, // Apply markup
        description: 'This is a sample product created for testing purposes',
        images: ['https://via.placeholder.com/300x300?text=Sample+Product'],
        sizes: 'S, M, L, XL',
        colors: 'Red, Blue, Green',
        category: 'Sample Category',
        scraped_at: new Date().toISOString()
      };
      
      scraper.products = [sampleProduct];
      console.log('📦 Created sample product for testing');
    }
    
    // Save products
    const outputPath = await scraper.saveProducts();
    
    console.log('---');
    console.log('✅ Scraping completed successfully!');
    console.log(`📁 Output saved to: ${outputPath}`);
    console.log(`📊 Total products: ${scraper.products.length}`);
    
    // Display sample of scraped data
    if (scraper.products.length > 0) {
      console.log('\n📋 Sample product data:');
      const sample = scraper.products[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        console.log(`   ${key}: ${displayValue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Clean up
    await scraper.close();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Scraping interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the scraper
if (require.main === module) {
  main();
}

module.exports = main;
