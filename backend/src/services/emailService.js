const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      if (process.env.NODE_ENV === 'production') {
        // Production email configuration (SendGrid, Mailgun, etc.)
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'sendgrid',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_API_KEY
          }
        });
      } else {
        // Development: Use Ethereal Email for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        console.log('Email service not initialized, skipping email send');
        return { success: false, error: 'Email service not available' };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@gadgetshack.co.za',
        to,
        subject,
        html,
        text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  // Email templates
  getWelcomeEmailTemplate(userName) {
    return {
      subject: 'Welcome to GadgetShack!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to GadgetShack!</h1>
          <p>Hi ${userName},</p>
          <p>Thank you for joining GadgetShack! We're excited to have you as part of our community.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse our extensive collection of tech products</li>
            <li>Track your orders in real-time</li>
            <li>Enjoy exclusive member discounts</li>
          </ul>
          <p>Happy shopping!</p>
          <p>Best regards,<br>The GadgetShack Team</p>
        </div>
      `,
      text: `Welcome to GadgetShack! Hi ${userName}, thank you for joining us. You can now browse our products, track orders, and enjoy member discounts. Happy shopping!`
    };
  }

  getOrderConfirmationTemplate(order) {
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product_name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    return {
      subject: `Order Confirmation #${order.id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Order Confirmation</h1>
          <p>Thank you for your order! Here are the details:</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Order #${order.id}</h3>
            <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold;">R${order.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${order.shipping_address ? `
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Shipping Address:</h4>
              <p>${order.shipping_address}</p>
            </div>
          ` : ''}

          <p>We'll send you another email when your order ships.</p>
          <p>Best regards,<br>The GadgetShack Team</p>
        </div>
      `,
      text: `Order Confirmation #${order.id}. Thank you for your order! Total: R${order.total_amount.toFixed(2)}. We'll notify you when it ships.`
    };
  }

  getPasswordResetTemplate(resetLink) {
    return {
      subject: 'Reset Your GadgetShack Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>You requested to reset your password for your GadgetShack account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>The GadgetShack Team</p>
        </div>
      `,
      text: `Password reset requested. Click this link to reset: ${resetLink}. Link expires in 1 hour.`
    };
  }

  // Convenience methods
  async sendWelcomeEmail(email, userName) {
    const template = this.getWelcomeEmailTemplate(userName);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  async sendOrderConfirmation(email, order) {
    const template = this.getOrderConfirmationTemplate(order);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  async sendPasswordReset(email, resetLink) {
    const template = this.getPasswordResetTemplate(resetLink);
    return this.sendEmail({
      to: email,
      ...template
    });
  }
}

module.exports = new EmailService();
