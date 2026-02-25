const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

class SimpleTechMarkitScraper {
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
    console.log('🚀 Starting simple TechMarkIt scraper...');
    
    // Define the main collection URLs
    const collections = [
      { url: '/collections/used-refurbished-new-smartphones', name: 'Smartphones', category: 'Smartphones' },
      { url: '/collections/used-refurbished-new-laptops', name: 'Laptops', category: 'Laptops' },
      { url: '/collections/refurbished-used-second-hand-iphones', name: 'iPhones', category: 'Smartphones' },
      { url: '/collections/used-refurbished-second-hand-samsung-phones', name: 'Samsung Phones', category: 'Smartphones' }
    ];

    for (const collection of collections) {
      console.log(`\n🔍 Scraping ${collection.name}...`);
      await this.scrapeCollection(collection);
      
      // Add delay between collections
      await this.delay(3000);
      
      // Stop if we have enough products
      if (this.products.length >= 50) {
        console.log(`✅ Reached target of 50+ products (${this.products.length}), stopping...`);
        break;
      }
    }

    console.log(`\n🎉 Scraping completed! Total products found: ${this.products.length}`);
    return this.products;
  }

  async scrapeCollection(collection) {
    try {
      const url = `${this.baseUrl}${collection.url}`;
      console.log(`  📄 Fetching: ${url}`);

      const response = await this.axiosInstance.get(url);
      const $ = cheerio.load(response.data);

      // Look for product links in the HTML
      const productLinks = $('a[href*="/products/"]');
      console.log(`  📦 Found ${productLinks.length} product links`);

      const seenProducts = new Set();

      productLinks.each((index, element) => {
        try {
          const $link = $(element);
          const href = $link.attr('href');
          
          if (!href || seenProducts.has(href)) return;
          seenProducts.add(href);

          // Extract product name from link text or nearby elements
          let name = $link.text().trim();
          
          // If link text is empty, try to find name in parent elements
          if (!name || name.length < 5) {
            const $parent = $link.parent();
            name = $parent.find('h3, .product-title, [class*="title"]').text().trim() ||
                   $link.attr('title') ||
                   $link.find('img').attr('alt') ||
                   '';
          }

          // Clean up the name
          name = name.replace(/\s+/g, ' ').trim();

          // Skip if name is too short or generic
          if (!name || name.length < 10 || name.toLowerCase().includes('shop now')) {
            return;
          }

          // Extract price from surrounding elements
          const $container = $link.closest('div, article, section');
          const containerText = $container.text();
          const price = this.extractPrice(containerText);

          // Extract image
          const $img = $link.find('img').first();
          let imageUrl = $img.attr('src') || $img.attr('data-src');
          
          if (imageUrl) {
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = this.baseUrl + imageUrl;
            }
            
            // Ensure high resolution
            if (imageUrl.includes('_2000x')) {
              imageUrl = imageUrl.replace(/_\d+x\.(jpg|jpeg|png|webp)/i, '_2000x.$1');
            }
          }

          // Extract grade
          let grade = 'Used';
          if (containerText.includes('Grade: New')) grade = 'New';
          else if (containerText.includes('Grade: A+')) grade = 'A+';
          else if (containerText.includes('Grade: A')) grade = 'A';
          else if (containerText.includes('Grade: B')) grade = 'B';
          else if (containerText.includes('Grade: C')) grade = 'C';

          if (name && price > 0) {
            const product = {
              sku: this.generateSku(name, href),
              name: name,
              description: this.generateDescription(name, grade),
              price: price,
              category: collection.category,
              images: imageUrl ? [imageUrl] : [],
              stock_quantity: Math.floor(Math.random() * 50) + 10,
              grade: grade,
              source_url: this.baseUrl + href
            };

            this.products.push(product);
            console.log(`    ✅ ${name} - R${price}`);
          }

        } catch (error) {
          console.log(`    ⚠️  Error processing product ${index}: ${error.message}`);
        }
      });

      // Remove duplicates
      this.products = this.removeDuplicates(this.products);

    } catch (error) {
      console.log(`  ❌ Error scraping ${collection.name}: ${error.message}`);
    }
  }

  extractPrice(text) {
    if (!text) return 0;
    
    // Look for South African Rand prices
    const priceMatches = text.match(/R\s*([\d\s,]+)/g);
    
    if (priceMatches && priceMatches.length > 0) {
      // Take the first price found (usually the sale price)
      const firstPrice = priceMatches[0];
      const cleanPrice = firstPrice.replace(/[^\d]/g, '');
      const price = parseFloat(cleanPrice);
      return isNaN(price) ? 0 : price;
    }
    
    return 0;
  }

  generateSku(name, url) {
    const nameSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 15);
    
    const urlSlug = url.split('/').pop().substring(0, 8);
    const randomSuffix = Math.random().toString(36).substring(2, 4);
    
    return `TM-${nameSlug}-${urlSlug}-${randomSuffix}`.toUpperCase();
  }

  generateDescription(name, grade) {
    const gradeDescriptions = {
      'New': 'Brand new device with full warranty and original packaging.',
      'A+': 'Excellent condition with minimal signs of use. Fully tested and certified.',
      'A': 'Very good condition with light signs of use. Fully functional and tested.',
      'B': 'Good condition with moderate signs of use. Fully functional and tested.',
      'C': 'Fair condition with visible signs of use. Fully functional and tested.',
      'Used': 'Pre-owned device in working condition.'
    };

    const baseDescription = `${name} available at TechMarkIt South Africa. `;
    const gradeDescription = gradeDescriptions[grade] || gradeDescriptions['Used'];
    const warranty = ' Comes with TechMarkIt warranty and 14-day return policy.';

    return baseDescription + gradeDescription + warranty;
  }

  removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
      const key = product.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
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

module.exports = SimpleTechMarkitScraper;
