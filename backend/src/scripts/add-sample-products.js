const database = require('../config/database');

const sampleProducts = [
  // Smartphones
  {
    sku: 'TECH-006',
    name: 'Samsung Galaxy S23 Ultra 256GB Phantom Black',
    description: 'Premium flagship smartphone with S Pen, 200MP camera, and 5000mAh battery. Features a stunning 6.8" Dynamic AMOLED display.',
    price: 24999.99,
    category: 'Smartphones',
    images: ['https://techmarkit.co.za/cdn/shop/files/Samsung_S23_Ultra_Black_2000x.jpg'],
    stock_quantity: 50
  },
  {
    sku: 'TECH-007',
    name: 'iPhone 14 Pro Max 128GB Deep Purple',
    description: 'Latest iPhone with A16 Bionic chip, 48MP Pro camera system, and Dynamic Island. Premium titanium design.',
    price: 28999.99,
    category: 'Smartphones',
    images: ['https://techmarkit.co.za/cdn/shop/files/iPhone_14_Pro_Max_Purple_2000x.jpg'],
    stock_quantity: 30
  },
  {
    sku: 'TECH-008',
    name: 'Google Pixel 7 Pro 128GB Snow White',
    description: 'Google flagship with Tensor G2 chip, exceptional camera AI, and pure Android experience.',
    price: 18999.99,
    category: 'Smartphones',
    images: ['https://techmarkit.co.za/cdn/shop/files/Pixel_7_Pro_White_2000x.jpg'],
    stock_quantity: 40
  },
  {
    sku: 'TECH-009',
    name: 'OnePlus 11 256GB Titan Black',
    description: 'Flagship killer with Snapdragon 8 Gen 2, 100W fast charging, and Hasselblad camera system.',
    price: 16999.99,
    category: 'Smartphones',
    images: ['https://techmarkit.co.za/cdn/shop/files/OnePlus_11_Black_2000x.jpg'],
    stock_quantity: 35
  },
  {
    sku: 'TECH-010',
    name: 'Xiaomi 13 Pro 256GB Ceramic White',
    description: 'Premium smartphone with Leica camera system, Snapdragon 8 Gen 2, and 120W charging.',
    price: 19999.99,
    category: 'Smartphones',
    images: ['https://techmarkit.co.za/cdn/shop/files/Xiaomi_13_Pro_White_2000x.jpg'],
    stock_quantity: 25
  },

  // Laptops
  {
    sku: 'TECH-011',
    name: 'MacBook Pro 14" M2 Pro 512GB Space Gray',
    description: 'Professional laptop with M2 Pro chip, 14" Liquid Retina XDR display, and up to 18 hours battery life.',
    price: 45999.99,
    category: 'Laptops',
    images: ['https://techmarkit.co.za/cdn/shop/files/MacBook_Pro_14_Gray_2000x.jpg'],
    stock_quantity: 15
  },
  {
    sku: 'TECH-012',
    name: 'ASUS ROG Strix G15 RTX 4060 Gaming Laptop',
    description: 'High-performance gaming laptop with AMD Ryzen 7, RTX 4060, 16GB RAM, and 144Hz display.',
    price: 28999.99,
    category: 'Laptops',
    images: ['https://techmarkit.co.za/cdn/shop/files/ASUS_ROG_Strix_G15_2000x.jpg'],
    stock_quantity: 20
  },
  {
    sku: 'TECH-013',
    name: 'Lenovo ThinkPad X1 Carbon Gen 11 i7',
    description: 'Business ultrabook with 11th Gen Intel i7, 16GB RAM, 1TB SSD, and 14" 2K display.',
    price: 35999.99,
    category: 'Laptops',
    images: ['https://techmarkit.co.za/cdn/shop/files/ThinkPad_X1_Carbon_2000x.jpg'],
    stock_quantity: 12
  },
  {
    sku: 'TECH-014',
    name: 'Microsoft Surface Laptop 5 i5 8GB 256GB',
    description: 'Elegant laptop with 12th Gen Intel i5, premium Alcantara keyboard, and vibrant PixelSense display.',
    price: 22999.99,
    category: 'Laptops',
    images: ['https://techmarkit.co.za/cdn/shop/files/Surface_Laptop_5_2000x.jpg'],
    stock_quantity: 18
  },

  // Tablets
  {
    sku: 'TECH-015',
    name: 'iPad Pro 12.9" M2 256GB Space Gray',
    description: 'Professional tablet with M2 chip, 12.9" Liquid Retina XDR display, and Apple Pencil support.',
    price: 24999.99,
    category: 'Tablets',
    images: ['https://techmarkit.co.za/cdn/shop/files/iPad_Pro_12_Gray_2000x.jpg'],
    stock_quantity: 25
  },
  {
    sku: 'TECH-016',
    name: 'Samsung Galaxy Tab S9 Ultra 256GB Graphite',
    description: 'Premium Android tablet with 14.6" AMOLED display, S Pen included, and DeX desktop mode.',
    price: 21999.99,
    category: 'Tablets',
    images: ['https://techmarkit.co.za/cdn/shop/files/Galaxy_Tab_S9_Ultra_2000x.jpg'],
    stock_quantity: 20
  },

  // Audio
  {
    sku: 'TECH-017',
    name: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    description: 'Industry-leading noise canceling headphones with 30-hour battery and premium sound quality.',
    price: 7999.99,
    category: 'Audio',
    images: ['https://techmarkit.co.za/cdn/shop/files/Sony_WH1000XM5_2000x.jpg'],
    stock_quantity: 45
  },
  {
    sku: 'TECH-018',
    name: 'Apple AirPods Pro 2nd Generation',
    description: 'Premium wireless earbuds with active noise cancellation, spatial audio, and MagSafe charging.',
    price: 4999.99,
    category: 'Audio',
    images: ['https://techmarkit.co.za/cdn/shop/files/AirPods_Pro_2_2000x.jpg'],
    stock_quantity: 60
  },
  {
    sku: 'TECH-019',
    name: 'Bose QuietComfort 45 Wireless Headphones',
    description: 'Comfortable over-ear headphones with world-class noise cancellation and 24-hour battery.',
    price: 6999.99,
    category: 'Audio',
    images: ['https://techmarkit.co.za/cdn/shop/files/Bose_QC45_2000x.jpg'],
    stock_quantity: 35
  },

  // Wearables
  {
    sku: 'TECH-020',
    name: 'Apple Watch Series 9 45mm GPS Midnight Aluminum',
    description: 'Advanced smartwatch with S9 chip, Always-On Retina display, and comprehensive health tracking.',
    price: 8999.99,
    category: 'Wearables',
    images: ['https://techmarkit.co.za/cdn/shop/files/Apple_Watch_S9_Midnight_2000x.jpg'],
    stock_quantity: 40
  },
  {
    sku: 'TECH-021',
    name: 'Samsung Galaxy Watch 6 Classic 47mm Black',
    description: 'Premium smartwatch with rotating bezel, comprehensive health monitoring, and 4-day battery.',
    price: 7499.99,
    category: 'Wearables',
    images: ['https://techmarkit.co.za/cdn/shop/files/Galaxy_Watch_6_Classic_2000x.jpg'],
    stock_quantity: 30
  },

  // Accessories
  {
    sku: 'TECH-022',
    name: 'Anker PowerCore 26800mAh Portable Charger',
    description: 'High-capacity power bank with fast charging, multiple ports, and premium build quality.',
    price: 1299.99,
    category: 'Accessories',
    images: ['https://techmarkit.co.za/cdn/shop/files/Anker_PowerCore_26800_2000x.jpg'],
    stock_quantity: 80
  },
  {
    sku: 'TECH-023',
    name: 'Belkin 3-in-1 Wireless Charger with MagSafe',
    description: 'Premium wireless charging station for iPhone, Apple Watch, and AirPods with MagSafe technology.',
    price: 2499.99,
    category: 'Accessories',
    images: ['https://techmarkit.co.za/cdn/shop/files/Belkin_3in1_Charger_2000x.jpg'],
    stock_quantity: 50
  },
  {
    sku: 'TECH-024',
    name: 'Logitech MX Master 3S Wireless Mouse',
    description: 'Professional wireless mouse with precision tracking, customizable buttons, and ergonomic design.',
    price: 1899.99,
    category: 'Accessories',
    images: ['https://techmarkit.co.za/cdn/shop/files/Logitech_MX_Master_3S_2000x.jpg'],
    stock_quantity: 65
  },
  {
    sku: 'TECH-025',
    name: 'SanDisk Extreme Pro 1TB USB-C SSD',
    description: 'Ultra-fast portable SSD with USB-C connectivity, perfect for content creators and professionals.',
    price: 3999.99,
    category: 'Accessories',
    images: ['https://techmarkit.co.za/cdn/shop/files/SanDisk_Extreme_Pro_SSD_2000x.jpg'],
    stock_quantity: 40
  }
];

async function addSampleProducts() {
  try {
    console.log('🚀 Adding sample products for pagination testing...\n');
    
    // Initialize database connection
    await database.initialize();
    
    // Get category IDs
    const categories = await database.query('SELECT id, name FROM categories');
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    console.log('📂 Available categories:', Object.keys(categoryMap));
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const product of sampleProducts) {
      try {
        // Check if product already exists
        const existing = await database.query('SELECT id FROM products WHERE sku = ?', [product.sku]);
        
        if (existing.length > 0) {
          console.log(`⏭️  Skipped: ${product.name} (already exists)`);
          skippedCount++;
          continue;
        }
        
        // Get category ID
        const categoryId = categoryMap[product.category];
        if (!categoryId) {
          console.log(`⚠️  Warning: Category '${product.category}' not found for ${product.name}`);
          continue;
        }
        
        // Insert product
        await database.query(`
          INSERT INTO products (
            sku, name, description, price, category_id, 
            images, stock_quantity, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
        `, [
          product.sku,
          product.name,
          product.description,
          product.price,
          categoryId,
          JSON.stringify(product.images),
          product.stock_quantity
        ]);
        
        console.log(`✅ Added: ${product.name} - R${product.price}`);
        addedCount++;
        
      } catch (error) {
        console.error(`❌ Error adding ${product.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Sample products added successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Added: ${addedCount} products`);
    console.log(`   - Skipped: ${skippedCount} products`);
    console.log(`   - Total attempted: ${sampleProducts.length} products`);
    
    // Check final count
    const finalCount = await database.query('SELECT COUNT(*) as total FROM products');
    console.log(`\n📈 Total products in database: ${finalCount[0].total}`);
    
    if (finalCount[0].total >= 12) {
      console.log('✅ Pagination will now be visible (12+ products per page)');
    }
    
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  } finally {
    process.exit(0);
  }
}

addSampleProducts();
