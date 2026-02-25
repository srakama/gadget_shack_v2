const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ShopifyTechMarkitScraper {
  constructor(options = {}) {
    this.baseUrl = process.env.TM_BASE_URL || 'https://techmarkit.co.za';
    this.pageLimit = parseInt(process.env.TM_LIMIT || '250', 10);
    this.products = [];
    this.incremental = options.incremental !== false; // default incremental
    this.updatedAtMin = options.updatedAtMin || null;
    this.lastRunFile = path.join(__dirname, '../data/last_run.json');
    this.axiosInstance = axios.create({
      headers: {
        'User-Agent': 'GadgetShackBot/1.0 (+https://gadgetshack.local)'
      },
      timeout: 30000
    });
  }

  async getWithRetry(url, tries = 5) {
    let delay = 500;
    for (let i = 0; i < tries; i++) {
      try {
        const res = await this.axiosInstance.get(url);
        return res;
      } catch (err) {
        const status = err.response && err.response.status;
        if (status === 429) {
          const retryAfter = parseInt((err.response && err.response.headers && err.response.headers['retry-after']) || '2', 10) * 1000;
          await this.delay(retryAfter);
        } else if (i < tries - 1) {
          await this.delay(delay);
          delay *= 2; // exponential backoff
        } else {
          throw err;
        }
      }
    }
  }

  async loadLastRun() {
    try {
      const exists = await fs.pathExists(this.lastRunFile);
      if (!exists) return null;
      const data = await fs.readJson(this.lastRunFile);
      return data?.last_run || null;
    } catch {
      return null;
    }
  }

  async saveLastRun(isoString) {
    try {
      await fs.ensureFile(this.lastRunFile);
      await fs.writeJson(this.lastRunFile, { last_run: isoString }, { spaces: 2 });
    } catch (e) {
      console.warn('⚠️ Failed to write last_run.json:', e.message);
    }
  }

  async scrapeProducts() {
    console.log('🚀 Starting Shopify TechMarkIt scraper...');
    
    // Shopify collection handles (fallback)
    const collections = [
      { handle: 'used-refurbished-new-smartphones', name: 'Smartphones', category: 'Smartphones' },
      { handle: 'used-refurbished-new-laptops', name: 'Laptops', category: 'Laptops' },
      { handle: 'refurbished-used-second-hand-iphones', name: 'iPhones', category: 'Smartphones' },
      { handle: 'used-refurbished-second-hand-samsung-phones', name: 'Samsung Phones', category: 'Smartphones' },
      { handle: 'used-refurbished-new-tablets-ereaders', name: 'Tablets', category: 'Tablets' },
      { handle: 'monitors', name: 'Monitors', category: 'Electronics' },
      { handle: 'audio-speakers', name: 'Audio & Speakers', category: 'Audio' },
      { handle: 'fitness-watches-1', name: 'Fitness & Watches', category: 'Wearables' }
    ];

    // Decide incremental window
    let updatedAtMin = this.updatedAtMin;
    if (this.incremental && !updatedAtMin) {
      const last = await this.loadLastRun();
      if (last) updatedAtMin = last;
    }

    // First, try to get all products via the products.json API
    await this.scrapeAllProducts(updatedAtMin);

    // Save last run timestamp
    await this.saveLastRun(new Date().toISOString());

    // If that doesn't work well, try collection-specific scraping
    if (this.products.length < 20) {
      console.log('\n🔄 Trying collection-specific scraping...');
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
    }

    console.log(`\n🎉 Scraping completed! Total products found: ${this.products.length}`);
    return this.products;
  }

  async scrapeAllProducts(updatedAtMin = null) {
    console.log('\n📦 Fetching products via Shopify API...');

    let page = 1;
    let hasMore = true;
    const limit = this.pageLimit; // Shopify's max limit per request

    while (hasMore && page <= 10) { // Limit to 10 pages
      try {
        const params = new URLSearchParams({ limit: String(limit), page: String(page) });
        if (updatedAtMin) params.set('updated_at_min', updatedAtMin);
        const url = `${this.baseUrl}/products.json?${params.toString()}`;
        console.log(`  📄 Page ${page}: ${url}`);

        const response = await this.getWithRetry(url);
        const data = response.data;

        if (data.products && data.products.length > 0) {
          console.log(`    ✅ Found ${data.products.length} products`);

          for (const shopifyProduct of data.products) {
            const product = this.convertShopifyProduct(shopifyProduct);
            if (product && !this.isDuplicate(product)) {
              this.products.push(product);
            }
          }

          // Check if there are more products
          hasMore = data.products.length === limit;
          page++;
        } else {
          hasMore = false;
        }

        // polite delay with jitter
        await this.delay(300 + Math.floor(Math.random() * 500));

      } catch (error) {
        console.log(`    ❌ Error on page ${page}: ${error.message}`);
        hasMore = false;
      }
    }

    console.log(`📊 Total products from API: ${this.products.length}`);
  }

  async scrapeCollection(collection) {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) { // Limit to 5 pages per collection
      try {
        const url = `${this.baseUrl}/collections/${collection.handle}/products.json?limit=250&page=${page}`;
        console.log(`  📄 Page ${page}: ${url}`);

        const response = await this.axiosInstance.get(url);
        const data = response.data;

        if (data.products && data.products.length > 0) {
          console.log(`    ✅ Found ${data.products.length} products`);
          
          for (const shopifyProduct of data.products) {
            const product = this.convertShopifyProduct(shopifyProduct, collection.category);
            if (product && !this.isDuplicate(product)) {
              this.products.push(product);
            }
          }

          hasMore = data.products.length === 250;
          page++;
        } else {
          hasMore = false;
        }

        await this.delay(1500);

      } catch (error) {
        console.log(`    ❌ Error on page ${page}: ${error.message}`);
        hasMore = false;
      }
    }
  }

  convertShopifyProduct(shopifyProduct, categoryOverride = null) {
    try {
      const name = shopifyProduct.title;
      const handle = shopifyProduct.handle;
      
      if (!name || name.length < 5) return null;

      // Some items returned by products.json can be unpublished/drafts.
      // These often render as "product not found" on the storefront even if the API returns them.
      const isPublished = !!shopifyProduct.published_at;

      // Get the price and compare_at_price from the first variant
      let price = 0;
      let compareAt = null;
      if (shopifyProduct.variants && shopifyProduct.variants.length > 0) {
        const v0 = shopifyProduct.variants[0];
        price = parseFloat(v0.price);
        compareAt = v0.compare_at_price ? parseFloat(v0.compare_at_price) : null;
      }

      if (price <= 0) return null;

      // Build images array (ensure https)
      let images = [];
      if (shopifyProduct.images && shopifyProduct.images.length > 0) {
        images = shopifyProduct.images.map(img => {
          let src = img?.src;
          if (src && src.startsWith('//')) src = 'https:' + src;
          return src;
        }).filter(Boolean);
      }
      // Fallback to variant featured image if product has no images
      if (images.length === 0 && shopifyProduct.variants && shopifyProduct.variants[0]?.featured_image?.src) {
        let vsrc = shopifyProduct.variants[0].featured_image.src;
        if (vsrc && vsrc.startsWith('//')) vsrc = 'https:' + vsrc;
        images = vsrc ? [vsrc] : [];
      }

      // Determine category
      let category = categoryOverride || 'Electronics';
      const productType = (shopifyProduct.product_type || '').toLowerCase();
      const tags = shopifyProduct.tags || [];
      const allText = `${name} ${productType} ${tags.join(' ')}`.toLowerCase();

      // Refined category mapping using multiple signals (name, product_type, tags)
      if (/\b(phone|iphone|samsung|galaxy|xiaomi|pixel|oppo|vivo|nova|note|ultra)\b/.test(allText)) {
        category = 'Smartphones';
      } else if (/\b(laptop|notebook|macbook|thinkpad|ideapad|pavilion|envy|xps|zenbook|vivobook|raider|tuf|modern|thin|latitude|elitebook|vostro|surface)\b/.test(allText)) {
        category = 'Laptops';
      } else if (/\b(tablet|ipad|matepad|tab|ereader|e-reader)\b/.test(allText)) {
        category = 'Tablets';
      } else if (/\b(watch|wearable|fitness|fitbit|galaxy watch|apple watch)\b/.test(allText)) {
        category = 'Wearables';
      } else if (/\b(headphone|earbud|earphone|speaker|audio|jbl|bose|sony|skullcandy)\b/.test(allText)) {
        category = 'Audio';
      } else if (/\b(keyboard|mouse|monitor|ssd|charger|power bank|case|cable|dock|adapter)\b/.test(allText)) {
        category = 'Accessories';
      }

      // Extract grade from tags or title
      let grade = 'Used';
      const titleLower = name.toLowerCase();
      const allTags = tags.join(' ').toLowerCase();
      
      if (titleLower.includes('new') || allTags.includes('new')) grade = 'New';
      else if (allTags.includes('grade a+') || allTags.includes('grade: a+')) grade = 'A+';
      else if (allTags.includes('grade a') || allTags.includes('grade: a')) grade = 'A';
      else if (allTags.includes('grade b') || allTags.includes('grade: b')) grade = 'B';
      else if (allTags.includes('grade c') || allTags.includes('grade: c')) grade = 'C';

      // Generate stable SKU (product + first variant)
      const variantId = (shopifyProduct.variants && shopifyProduct.variants[0]?.id) || shopifyProduct.id;
      const slug = handle.toUpperCase().replace(/[^A-Z0-9-]/g, '-').slice(0, 12);
      const sku = `TM-${shopifyProduct.id}-${variantId}-${slug}`;

      // Create description
      const description = shopifyProduct.body_html 
        ? this.stripHtml(shopifyProduct.body_html).substring(0, 500) + '...'
        : this.generateDescription(name, grade);

      // Stock quantity from first variant
      let stockQuantity = 10; // Default
      if (shopifyProduct.variants && shopifyProduct.variants.length > 0) {
        const variant = shopifyProduct.variants[0];
        if (variant.inventory_quantity !== null && variant.inventory_quantity >= 0) {
          stockQuantity = variant.inventory_quantity;
        }
      }

      const discountPercent = (compareAt && compareAt > price) ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

      return {
        sku: sku,
        name: name,
        description: description,
        price: price,
        compare_at_price: compareAt,
        discount_percent: discountPercent,
        category: category,
        images: images,
        stock_quantity: stockQuantity,
        grade: grade,
        vendor: shopifyProduct.vendor || null,
        source_url: (isPublished && handle)
          ? `${this.baseUrl}/products/${handle}`
          : `${this.baseUrl}/search?q=${encodeURIComponent(name)}`,
        shopify_id: shopifyProduct.id,
        product_type: shopifyProduct.product_type,
        tags: tags
      };

    } catch (error) {
      console.log(`    ⚠️  Error converting product: ${error.message}`);
      return null;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

  isDuplicate(product) {
    return this.products.some(existing => 
      existing.name.toLowerCase() === product.name.toLowerCase() ||
      existing.sku === product.sku
    );
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

module.exports = ShopifyTechMarkitScraper;
