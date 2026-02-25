const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class EnhancedTechMarkitScraper {
  constructor() {
    this.baseUrl = 'https://techmarkit.co.za';
    this.products = [];
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
  }

  async scrapeProducts() {
    console.log('🚀 Starting enhanced TechMarkIt scraper...');
    
    // Define the main collection URLs based on the website structure
    const collections = [
      { url: '/collections/used-refurbished-new-smartphones', name: 'Smartphones', category: 'Smartphones' },
      { url: '/collections/used-refurbished-new-laptops', name: 'Laptops', category: 'Laptops' },
      { url: '/collections/used-refurbished-new-tablets-ereaders', name: 'Tablets', category: 'Tablets' },
      { url: '/collections/monitors', name: 'Monitors', category: 'Electronics' },
      { url: '/collections/keyboards', name: 'Keyboards', category: 'Accessories' },
      { url: '/collections/mice', name: 'Mice', category: 'Accessories' },
      { url: '/collections/fitness-watches-1', name: 'Fitness & Watches', category: 'Wearables' },
      { url: '/collections/audio-speakers', name: 'Audio & Speakers', category: 'Audio' },
      { url: '/collections/power-banks', name: 'Power Banks', category: 'Accessories' },
      { url: '/collections/refurbished-used-second-hand-iphones', name: 'iPhones', category: 'Smartphones' },
      { url: '/collections/used-refurbished-second-hand-samsung-phones', name: 'Samsung Phones', category: 'Smartphones' },
      { url: '/collections/used-refurbished-new-apple-ipad', name: 'iPads', category: 'Tablets' }
    ];

    for (const collection of collections) {
      console.log(`\n🔍 Scraping ${collection.name}...`);
      await this.scrapeCollection(collection);
      
      // Add delay between collections
      await this.delay(2000);
      
      // Stop if we have enough products
      if (this.products.length >= 100) {
        console.log(`✅ Reached target of 100+ products (${this.products.length}), stopping...`);
        break;
      }
    }

    console.log(`\n🎉 Scraping completed! Total products found: ${this.products.length}`);
    return this.products;
  }

  async scrapeCollection(collection) {
    let page = 1;
    let hasNextPage = true;
    let productsFromCollection = 0;

    while (hasNextPage && page <= 5) { // Limit to 5 pages per collection
      try {
        const url = page === 1 
          ? `${this.baseUrl}${collection.url}`
          : `${this.baseUrl}${collection.url}?page=${page}`;

        console.log(`  📄 Page ${page}: ${url}`);

        const response = await this.axiosInstance.get(url);
        const $ = cheerio.load(response.data);

        // Extract products from the page
        const pageProducts = this.extractProductsFromPage($, collection.category);
        
        if (pageProducts.length === 0) {
          console.log(`    ❌ No products found on page ${page}`);
          hasNextPage = false;
        } else {
          // Filter duplicates
          const newProducts = this.filterDuplicates(pageProducts);
          this.products.push(...newProducts);
          productsFromCollection += newProducts.length;
          
          console.log(`    ✅ Found ${newProducts.length} new products (${pageProducts.length - newProducts.length} duplicates filtered)`);
          
          // Check if there's a next page
          hasNextPage = this.hasNextPage($);
          page++;
        }

        // Add delay between pages
        await this.delay(1500);

      } catch (error) {
        console.log(`    ⚠️  Error on page ${page}: ${error.message}`);
        hasNextPage = false;
      }
    }

    console.log(`  📊 Total from ${collection.name}: ${productsFromCollection} products`);
  }

  extractProductsFromPage($, category) {
    const products = [];

    // TechMarkIt uses specific product card structure - based on the actual HTML structure
    const productElements = $('a[href*="/products/"]').parent();

    console.log(`    Found ${productElements.length} product elements`);

    productElements.each((index, element) => {
      try {
        const $element = $(element);

        // Extract product data
        const productLink = $element.find('a[href*="/products/"]').first();
        const productUrl = productLink.attr('href');

        if (!productUrl) return;

        // Extract name from the link text or image alt
        const name = productLink.text().trim() ||
                    $element.find('img').attr('alt') ||
                    productLink.attr('title');

        // Extract price - TechMarkIt shows prices like "R 2 099 R 2 499"
        const priceText = $element.text();
        const price = this.extractPrice(priceText);

        // Extract image
        const imageElement = $element.find('img').first();
        const imageUrl = imageElement.attr('src') || imageElement.attr('data-src');

        // Clean and format image URL
        let fullImageUrl = null;
        if (imageUrl) {
          if (imageUrl.startsWith('//')) {
            fullImageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            fullImageUrl = this.baseUrl + imageUrl;
          } else if (imageUrl.startsWith('http')) {
            fullImageUrl = imageUrl;
          }

          // Ensure we get the full resolution image
          if (fullImageUrl && fullImageUrl.includes('_2000x')) {
            fullImageUrl = fullImageUrl.replace(/_\d+x\.(jpg|jpeg|png|webp)/i, '_2000x.$1');
          }
        }

        // Extract grade/condition from text
        const elementText = $element.text();
        let grade = 'Used';
        if (elementText.includes('Grade: New')) grade = 'New';
        else if (elementText.includes('Grade: A+')) grade = 'A+';
        else if (elementText.includes('Grade: A')) grade = 'A';
        else if (elementText.includes('Grade: B')) grade = 'B';
        else if (elementText.includes('Grade: C')) grade = 'C';

        // Generate SKU
        const sku = this.generateSku(name, productUrl);

        if (name && name.length > 5 && price > 0) {
          const product = {
            sku: sku,
            name: name,
            description: this.generateDescription(name, grade),
            price: price,
            category: category,
            images: fullImageUrl ? [fullImageUrl] : [],
            stock_quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
            grade: grade,
            source_url: this.baseUrl + productUrl
          };

          products.push(product);
        }

      } catch (error) {
        console.log(`    ⚠️  Error extracting product ${index}: ${error.message}`);
      }
    });

    return products;
  }

  extractPrice(priceText) {
    if (!priceText) return 0;

    // TechMarkIt shows prices like "R 2 099 R 2 499" (sale price and original price)
    // We want the first price (sale price)
    const priceMatches = priceText.match(/R\s*([\d\s,]+)/g);

    if (priceMatches && priceMatches.length > 0) {
      // Take the first price found
      const firstPrice = priceMatches[0];
      const cleanPrice = firstPrice.replace(/[^\d]/g, '');
      const price = parseFloat(cleanPrice);
      return isNaN(price) ? 0 : price;
    }

    // Fallback: extract any number
    const cleanPrice = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(/,/g, ''));

    return isNaN(price) ? 0 : price;
  }

  generateSku(name, url) {
    // Create SKU from product name and URL
    const nameSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 20);
    
    const urlSlug = url.split('/').pop().substring(0, 10);
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    
    return `TM-${nameSlug}-${urlSlug}-${randomSuffix}`.toUpperCase();
  }

  generateDescription(name, grade) {
    const gradeDescriptions = {
      'Grade: New': 'Brand new device with full warranty and original packaging.',
      'Grade: A+': 'Excellent condition with minimal signs of use. Fully tested and certified.',
      'Grade: A': 'Very good condition with light signs of use. Fully functional and tested.',
      'Grade: B': 'Good condition with moderate signs of use. Fully functional and tested.',
      'Grade: C': 'Fair condition with visible signs of use. Fully functional and tested.'
    };

    const baseDescription = `${name} available at TechMarkIt. `;
    const gradeDescription = gradeDescriptions[grade] || 'Pre-owned device in working condition.';
    const warranty = ' Comes with TechMarkIt warranty and 14-day return policy.';

    return baseDescription + gradeDescription + warranty;
  }

  filterDuplicates(newProducts) {
    const existingSkus = new Set(this.products.map(p => p.sku));
    const existingNames = new Set(this.products.map(p => p.name.toLowerCase()));

    return newProducts.filter(product => {
      // Check for duplicate SKU
      if (existingSkus.has(product.sku)) return false;
      
      // Check for duplicate name
      if (existingNames.has(product.name.toLowerCase())) return false;
      
      // Add to sets for future checks
      existingSkus.add(product.sku);
      existingNames.add(product.name.toLowerCase());
      
      return true;
    });
  }

  hasNextPage($) {
    // Check for pagination indicators
    const nextButton = $('.pagination .next, .pagination-next, [rel="next"]');
    const pageNumbers = $('.pagination a[href*="page="]');
    
    return nextButton.length > 0 || pageNumbers.length > 0;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveProducts() {
    const outputPath = path.join(__dirname, '../data/techmarkit-products.json');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeJson(outputPath, this.products, { spaces: 2 });
    console.log(`💾 Products saved to: ${outputPath}`);
    return outputPath;
  }
}

module.exports = EnhancedTechMarkitScraper;
