// SEO Service for GadgetShack
// Handles SEO optimization, meta tags, and structured data

const database = require('../config/database');

class SEOService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'https://gadgetshack.co.za';
    this.siteName = 'GadgetShack South Africa';
    this.defaultDescription = 'South Africa\'s premier destination for quality tech products. Shop laptops, smartphones, accessories and more with fast delivery and great prices.';
  }

  // Generate product meta tags
  generateProductMeta(product) {
    const title = `${product.name} | ${this.siteName}`;
    const description = this.truncateText(product.description, 160) || this.defaultDescription;
    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;
    const productUrl = `${this.baseUrl}/products/${product.id}`;

    return {
      title,
      description,
      canonical: productUrl,
      openGraph: {
        title,
        description,
        url: productUrl,
        type: 'product',
        image: imageUrl,
        siteName: this.siteName,
        locale: 'en_ZA'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: imageUrl
      },
      structuredData: this.generateProductStructuredData(product)
    };
  }

  // Generate category meta tags
  generateCategoryMeta(category, products = []) {
    const title = `${category.name} | ${this.siteName}`;
    const description = category.description || 
      `Shop ${category.name.toLowerCase()} at GadgetShack. Quality tech products with fast delivery across South Africa.`;
    const categoryUrl = `${this.baseUrl}/categories/${category.id}`;

    return {
      title,
      description,
      canonical: categoryUrl,
      openGraph: {
        title,
        description,
        url: categoryUrl,
        type: 'website',
        siteName: this.siteName,
        locale: 'en_ZA'
      },
      twitter: {
        card: 'summary',
        title,
        description
      },
      structuredData: this.generateCategoryStructuredData(category, products)
    };
  }

  // Generate homepage meta tags
  generateHomepageMeta() {
    const title = `${this.siteName} | Quality Tech Products with Fast Delivery`;
    const description = this.defaultDescription;

    return {
      title,
      description,
      canonical: this.baseUrl,
      openGraph: {
        title,
        description,
        url: this.baseUrl,
        type: 'website',
        siteName: this.siteName,
        locale: 'en_ZA'
      },
      twitter: {
        card: 'summary',
        title,
        description
      },
      structuredData: this.generateOrganizationStructuredData()
    };
  }

  // Generate product structured data (JSON-LD)
  generateProductStructuredData(product) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.sku,
      brand: {
        '@type': 'Brand',
        name: this.extractBrand(product.name)
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'ZAR',
        availability: product.stock_quantity > 0 ? 
          'https://schema.org/InStock' : 
          'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: this.siteName
        }
      }
    };

    if (product.images && product.images.length > 0) {
      structuredData.image = product.images;
    }

    if (product.category_name) {
      structuredData.category = product.category_name;
    }

    return structuredData;
  }

  // Generate category structured data
  generateCategoryStructuredData(category, products) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.description,
      url: `${this.baseUrl}/categories/${category.id}`
    };

    if (products && products.length > 0) {
      structuredData.mainEntity = {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            url: `${this.baseUrl}/products/${product.id}`,
            image: product.images && product.images.length > 0 ? product.images[0] : null,
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'ZAR'
            }
          }
        }))
      };
    }

    return structuredData;
  }

  // Generate organization structured data
  generateOrganizationStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      description: this.defaultDescription,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'ZA',
        addressRegion: 'Gauteng'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+27-11-123-4567',
        contactType: 'customer service',
        availableLanguage: ['English', 'Afrikaans']
      },
      sameAs: [
        'https://facebook.com/gadgetshack',
        'https://twitter.com/gadgetshack',
        'https://instagram.com/gadgetshack'
      ]
    };
  }

  // Generate XML sitemap
  async generateSitemap() {
    try {
      const [products, categories] = await Promise.all([
        database.query('SELECT id, updated_at FROM products WHERE status = "active" ORDER BY id'),
        database.query('SELECT id, updated_at FROM categories ORDER BY id')
      ]);

      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Homepage
      sitemap += this.generateSitemapUrl(this.baseUrl, new Date(), 'daily', '1.0');

      // Categories
      categories.forEach(category => {
        const url = `${this.baseUrl}/categories/${category.id}`;
        const lastmod = category.updated_at || new Date();
        sitemap += this.generateSitemapUrl(url, lastmod, 'weekly', '0.8');
      });

      // Products
      products.forEach(product => {
        const url = `${this.baseUrl}/products/${product.id}`;
        const lastmod = product.updated_at || new Date();
        sitemap += this.generateSitemapUrl(url, lastmod, 'weekly', '0.6');
      });

      // Static pages
      const staticPages = [
        { path: '/about', priority: '0.5' },
        { path: '/contact', priority: '0.5' },
        { path: '/privacy', priority: '0.3' },
        { path: '/terms', priority: '0.3' }
      ];

      staticPages.forEach(page => {
        const url = `${this.baseUrl}${page.path}`;
        sitemap += this.generateSitemapUrl(url, new Date(), 'monthly', page.priority);
      });

      sitemap += '</urlset>';
      return sitemap;

    } catch (error) {
      console.error('Error generating sitemap:', error);
      throw error;
    }
  }

  // Generate robots.txt
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Disallow admin and API endpoints
Disallow: /admin/
Disallow: /api/

# Disallow checkout and user account pages
Disallow: /checkout
Disallow: /profile
Disallow: /orders

# Allow product and category pages
Allow: /products/
Allow: /categories/

# Sitemap location
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl delay
Crawl-delay: 1`;
  }

  // Helper methods
  generateSitemapUrl(url, lastmod, changefreq, priority) {
    const lastmodDate = new Date(lastmod).toISOString().split('T')[0];
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  extractBrand(productName) {
    // Simple brand extraction from product name
    const brands = ['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Google', 'Sony'];
    const nameLower = productName.toLowerCase();
    
    for (const brand of brands) {
      if (nameLower.includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return 'GadgetShack';
  }

  // Generate breadcrumb structured data
  generateBreadcrumbStructuredData(breadcrumbs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${this.baseUrl}${crumb.path}`
      }))
    };
  }

  // Generate FAQ structured data
  generateFAQStructuredData(faqs) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  // Generate review structured data
  generateReviewStructuredData(product, reviews) {
    if (!reviews || reviews.length === 0) return null;

    const aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1
    };

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      aggregateRating,
      review: reviews.map(review => ({
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: review.author_name
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1
        },
        reviewBody: review.comment,
        datePublished: review.created_at
      }))
    };
  }
}

module.exports = new SEOService();
