const PepcellScraper = require('./scraper');
const scraperConfig = require('../config/scraper-config');

// Test configuration with limited pages
const testConfig = {
  ...scraperConfig,
  pagination: {
    ...scraperConfig.pagination,
    max_pages: 1 // Only test first page
  }
};

async function testScraper() {
  console.log('🧪 Testing PepCell scraper...');

  const scraper = new PepcellScraper(testConfig);

  try {
    // Test initialization
    const connected = await scraper.initialize();

    if (connected) {
      console.log('✅ Site connectivity test passed');

      // Test scraping
      console.log('📊 Testing product extraction...');
      const products = await scraper.scrapeProducts();

      if (products.length > 0) {
        console.log(`✅ Successfully extracted ${products.length} products`);
        console.log('Sample product:', JSON.stringify(products[0], null, 2));
      } else {
        console.log('⚠️  No products extracted, but sample data should be created');
      }
    } else {
      console.log('⚠️  Site not accessible, but scraper should create sample data');
      await scraper.scrapeProducts();
    }

    // Test saving
    if (scraper.products.length > 0) {
      console.log('💾 Testing data saving...');
      await scraper.saveProducts();
      console.log('✅ Data saved successfully');
    }

    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await scraper.close();
  }
}

if (require.main === module) {
  testScraper();
}

module.exports = testScraper;
