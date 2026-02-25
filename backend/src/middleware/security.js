const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Rate limiting configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: message || 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General rate limiter
const generalLimiter = createRateLimit();

// Strict rate limiter for auth endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

// Very strict rate limiter for password reset
const passwordResetLimiter = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts
  'Too many password reset attempts, please try again later.'
);

// Helmet security configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Input validation middleware
const validateInput = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  };
};

// Common validation rules
const validationRules = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  name: body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  phone: body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  productId: body('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer'),
  
  quantity: body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
};

// Validation sets for different endpoints
const validationSets = {
  register: [
    validationRules.email,
    validationRules.password,
    validationRules.name,
    validationRules.phone,
    body('last_name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
  ],
  
  login: [
    validationRules.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],
  
  createOrder: [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.product_id').isInt({ min: 1 }).withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Invalid quantity'),
    body('shipping_address').trim().isLength({ min: 10 }).withMessage('Shipping address is required'),
  ],
};

// Error handling middleware
const handleValidationErrors = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  next(err);
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  helmetConfig,
  validateInput,
  validationRules,
  validationSets,
  handleValidationErrors,
};
