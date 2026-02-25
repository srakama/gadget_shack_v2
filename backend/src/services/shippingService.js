// Shipping Service for GadgetShack
// Integrates with South African shipping providers

class ShippingService {
  constructor() {
    this.providers = {
      postnet: null,
      aramex: null,
      dawn_wing: null,
      courier_guy: null
    };
    
    this.initialize();
  }

  initialize() {
    // Initialize shipping providers based on environment variables
    console.log('🚚 Initializing shipping service...');
    
    // PostNet (South African courier)
    if (process.env.POSTNET_API_KEY) {
      this.providers.postnet = {
        apiKey: process.env.POSTNET_API_KEY,
        baseUrl: process.env.POSTNET_BASE_URL || 'https://api.postnet.co.za'
      };
      console.log('✅ PostNet shipping provider configured');
    }

    // Aramex (International and local)
    if (process.env.ARAMEX_USERNAME) {
      this.providers.aramex = {
        username: process.env.ARAMEX_USERNAME,
        password: process.env.ARAMEX_PASSWORD,
        accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER,
        baseUrl: process.env.ARAMEX_BASE_URL || 'https://ws.aramex.net'
      };
      console.log('✅ Aramex shipping provider configured');
    }
  }

  // Calculate shipping costs
  async calculateShipping(orderData) {
    try {
      const { 
        fromAddress, 
        toAddress, 
        weight, 
        dimensions, 
        value,
        serviceType = 'standard' 
      } = orderData;

      const quotes = [];

      // PostNet quote
      if (this.providers.postnet) {
        try {
          const postnetQuote = await this.getPostNetQuote({
            fromAddress,
            toAddress,
            weight,
            dimensions,
            value,
            serviceType
          });
          quotes.push(postnetQuote);
        } catch (error) {
          console.error('PostNet quote failed:', error.message);
        }
      }

      // Aramex quote
      if (this.providers.aramex) {
        try {
          const aramexQuote = await this.getAramexQuote({
            fromAddress,
            toAddress,
            weight,
            dimensions,
            value,
            serviceType
          });
          quotes.push(aramexQuote);
        } catch (error) {
          console.error('Aramex quote failed:', error.message);
        }
      }

      // Fallback to standard rates if no providers configured
      if (quotes.length === 0) {
        quotes.push(this.getStandardRates(toAddress, weight, value));
      }

      return {
        success: true,
        quotes: quotes.sort((a, b) => a.cost - b.cost) // Sort by cost
      };

    } catch (error) {
      console.error('Shipping calculation failed:', error);
      return {
        success: false,
        error: error.message,
        quotes: [this.getStandardRates(orderData.toAddress, orderData.weight, orderData.value)]
      };
    }
  }

  // PostNet shipping quote
  async getPostNetQuote(data) {
    // Mock implementation - replace with actual PostNet API calls
    const baseCost = this.calculateBaseCost(data.weight, data.value);
    const deliveryDays = this.isLocalDelivery(data.toAddress) ? 1 : 3;

    return {
      provider: 'postnet',
      name: 'PostNet',
      service: data.serviceType === 'express' ? 'Express' : 'Standard',
      cost: baseCost * (data.serviceType === 'express' ? 1.5 : 1),
      currency: 'ZAR',
      estimatedDays: deliveryDays,
      trackingAvailable: true,
      description: `PostNet ${data.serviceType} delivery`
    };
  }

  // Aramex shipping quote
  async getAramexQuote(data) {
    // Mock implementation - replace with actual Aramex API calls
    const baseCost = this.calculateBaseCost(data.weight, data.value);
    const deliveryDays = this.isLocalDelivery(data.toAddress) ? 2 : 5;

    return {
      provider: 'aramex',
      name: 'Aramex',
      service: data.serviceType === 'express' ? 'Express' : 'Standard',
      cost: baseCost * 1.2 * (data.serviceType === 'express' ? 1.8 : 1),
      currency: 'ZAR',
      estimatedDays: deliveryDays,
      trackingAvailable: true,
      description: `Aramex ${data.serviceType} delivery`
    };
  }

  // Standard fallback rates
  getStandardRates(address, weight, value) {
    const baseCost = this.calculateBaseCost(weight, value);
    const isLocal = this.isLocalDelivery(address);

    return {
      provider: 'standard',
      name: 'Standard Delivery',
      service: 'Standard',
      cost: baseCost,
      currency: 'ZAR',
      estimatedDays: isLocal ? 2 : 5,
      trackingAvailable: false,
      description: 'Standard delivery service'
    };
  }

  // Calculate base shipping cost
  calculateBaseCost(weight, value) {
    // Base cost calculation
    let cost = 50; // Base rate R50

    // Weight-based pricing
    if (weight > 1) {
      cost += (weight - 1) * 15; // R15 per additional kg
    }

    // Value-based insurance
    if (value > 1000) {
      cost += value * 0.01; // 1% insurance for high-value items
    }

    return Math.round(cost * 100) / 100; // Round to 2 decimal places
  }

  // Check if delivery is local (major cities)
  isLocalDelivery(address) {
    const localAreas = [
      'johannesburg', 'cape town', 'durban', 'pretoria', 
      'port elizabeth', 'bloemfontein', 'east london',
      'sandton', 'rosebank', 'centurion'
    ];

    const addressLower = address.toLowerCase();
    return localAreas.some(area => addressLower.includes(area));
  }

  // Create shipping label
  async createShippingLabel(orderData, selectedQuote) {
    try {
      const provider = selectedQuote.provider;

      if (provider === 'postnet' && this.providers.postnet) {
        return await this.createPostNetLabel(orderData, selectedQuote);
      } else if (provider === 'aramex' && this.providers.aramex) {
        return await this.createAramexLabel(orderData, selectedQuote);
      } else {
        // Generate mock label for standard delivery
        return this.createMockLabel(orderData, selectedQuote);
      }

    } catch (error) {
      console.error('Label creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create mock shipping label
  createMockLabel(orderData, quote) {
    const trackingNumber = `GS${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      success: true,
      trackingNumber,
      labelUrl: null, // In production, this would be a PDF URL
      provider: quote.provider,
      service: quote.service,
      cost: quote.cost,
      estimatedDelivery: this.calculateDeliveryDate(quote.estimatedDays)
    };
  }

  // Calculate estimated delivery date
  calculateDeliveryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  // Track shipment
  async trackShipment(trackingNumber, provider) {
    try {
      if (provider === 'postnet' && this.providers.postnet) {
        return await this.trackPostNet(trackingNumber);
      } else if (provider === 'aramex' && this.providers.aramex) {
        return await this.trackAramex(trackingNumber);
      } else {
        return this.getMockTrackingInfo(trackingNumber);
      }

    } catch (error) {
      console.error('Tracking failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mock tracking information
  getMockTrackingInfo(trackingNumber) {
    const statuses = [
      'Order Processed',
      'Picked Up',
      'In Transit',
      'Out for Delivery',
      'Delivered'
    ];

    // Simulate tracking progress based on tracking number
    const progress = Math.min(Math.floor(Math.random() * 5), 4);
    
    return {
      success: true,
      trackingNumber,
      status: statuses[progress],
      location: progress >= 2 ? 'Distribution Center' : 'Origin',
      estimatedDelivery: this.calculateDeliveryDate(1),
      history: statuses.slice(0, progress + 1).map((status, index) => ({
        status,
        timestamp: new Date(Date.now() - (progress - index) * 24 * 60 * 60 * 1000).toISOString(),
        location: index === 0 ? 'Origin' : index === progress ? 'Current' : 'In Transit'
      }))
    };
  }

  // Get shipping zones for South Africa
  getShippingZones() {
    return [
      {
        id: 'local',
        name: 'Local (Major Cities)',
        description: 'Johannesburg, Cape Town, Durban, Pretoria',
        baseRate: 50,
        estimatedDays: '1-2'
      },
      {
        id: 'regional',
        name: 'Regional',
        description: 'Other major towns and cities',
        baseRate: 75,
        estimatedDays: '2-3'
      },
      {
        id: 'remote',
        name: 'Remote Areas',
        description: 'Rural and remote locations',
        baseRate: 120,
        estimatedDays: '3-7'
      }
    ];
  }
}

module.exports = new ShippingService();
