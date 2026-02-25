// Payment Service for GadgetShack
// This is a basic implementation that can be extended with actual payment providers

class PaymentService {
  constructor() {
    this.providers = {
      stripe: null,
      paypal: null,
      payfast: null // South African payment gateway
    };
    
    this.initialize();
  }

  initialize() {
    // Initialize payment providers based on environment variables
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        this.providers.stripe = stripe;
        console.log('✅ Stripe payment provider initialized');
      } catch (error) {
        console.error('Failed to initialize Stripe:', error.message);
      }
    }

    // TODO: Initialize other payment providers
    // PayFast is popular in South Africa
    if (process.env.PAYFAST_MERCHANT_ID) {
      console.log('✅ PayFast configuration detected');
      // Initialize PayFast
    }
  }

  // Create payment intent (Stripe)
  async createPaymentIntent(amount, currency = 'ZAR', metadata = {}) {
    try {
      if (!this.providers.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.providers.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Confirm payment (Stripe)
  async confirmPayment(paymentIntentId) {
    try {
      if (!this.providers.stripe) {
        throw new Error('Stripe not configured');
      }

      const paymentIntent = await this.providers.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create PayFast payment (South African gateway)
  createPayFastPayment(orderData) {
    const {
      merchant_id = process.env.PAYFAST_MERCHANT_ID,
      merchant_key = process.env.PAYFAST_MERCHANT_KEY,
      return_url = process.env.PAYFAST_RETURN_URL,
      cancel_url = process.env.PAYFAST_CANCEL_URL,
      notify_url = process.env.PAYFAST_NOTIFY_URL
    } = process.env;

    if (!merchant_id || !merchant_key) {
      return {
        success: false,
        error: 'PayFast not configured'
      };
    }

    const paymentData = {
      merchant_id,
      merchant_key,
      return_url,
      cancel_url,
      notify_url,
      name_first: orderData.customer.first_name,
      name_last: orderData.customer.last_name,
      email_address: orderData.customer.email,
      m_payment_id: orderData.orderId,
      amount: orderData.amount.toFixed(2),
      item_name: `GadgetShack Order #${orderData.orderId}`,
      item_description: `Order containing ${orderData.itemCount} items`,
    };

    // Generate signature for PayFast
    const signature = this.generatePayFastSignature(paymentData);
    paymentData.signature = signature;

    return {
      success: true,
      paymentUrl: 'https://www.payfast.co.za/eng/process',
      paymentData
    };
  }

  // Generate PayFast signature
  generatePayFastSignature(data) {
    const crypto = require('crypto');
    
    // Create parameter string
    const paramString = Object.keys(data)
      .filter(key => key !== 'signature' && data[key] !== '')
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');

    // Add passphrase if configured
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const stringToHash = passphrase ? `${paramString}&passphrase=${passphrase}` : paramString;

    return crypto.createHash('md5').update(stringToHash).digest('hex');
  }

  // Validate PayFast payment notification
  validatePayFastPayment(postData) {
    try {
      const receivedSignature = postData.signature;
      delete postData.signature;

      const calculatedSignature = this.generatePayFastSignature(postData);
      
      return {
        valid: receivedSignature === calculatedSignature,
        status: postData.payment_status,
        orderId: postData.m_payment_id,
        amount: parseFloat(postData.amount_gross)
      };
    } catch (error) {
      console.error('PayFast validation failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Mock payment for development
  async mockPayment(amount, orderId) {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 90% success rate
    const success = Math.random() > 0.1;

    return {
      success,
      transactionId: `mock_${Date.now()}_${orderId}`,
      amount,
      status: success ? 'completed' : 'failed',
      message: success ? 'Payment processed successfully' : 'Payment failed - insufficient funds'
    };
  }

  // Process refund
  async processRefund(paymentIntentId, amount) {
    try {
      if (!this.providers.stripe) {
        throw new Error('Stripe not configured');
      }

      const refund = await this.providers.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      };
    } catch (error) {
      console.error('Refund failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get payment methods available
  getAvailablePaymentMethods() {
    const methods = [];

    if (this.providers.stripe) {
      methods.push({
        id: 'stripe',
        name: 'Credit/Debit Card',
        description: 'Pay securely with your credit or debit card',
        currencies: ['ZAR', 'USD', 'EUR']
      });
    }

    if (process.env.PAYFAST_MERCHANT_ID) {
      methods.push({
        id: 'payfast',
        name: 'PayFast',
        description: 'South African payment gateway supporting EFT, credit cards, and more',
        currencies: ['ZAR']
      });
    }

    // Always available for development
    if (process.env.NODE_ENV === 'development') {
      methods.push({
        id: 'mock',
        name: 'Mock Payment',
        description: 'Development payment method for testing',
        currencies: ['ZAR']
      });
    }

    return methods;
  }
}

module.exports = new PaymentService();
