const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @returns {Promise} Resend response
 */
exports.sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'atweb <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      ...(text && { text })
    });

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

/**
 * Send order confirmation email
 */
exports.sendOrderConfirmation = async (order, userEmail) => {
  const orderItems = order.items.map(item => 
    `<li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total { font-size: 1.2em; font-weight: bold; color: #667eea; margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee; }
          ul { list-style: none; padding: 0; }
          li { padding: 10px 0; border-bottom: 1px solid #eee; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your order!</p>
          </div>
          <div class="content">
            <h2>Order #${order.orderNumber}</h2>
            <p>Hi ${order.shippingAddress.fullName},</p>
            <p>We've received your order and it's being processed. Here are the details:</p>
            
            <div class="order-details">
              <h3>Order Items:</h3>
              <ul>${orderItems}</ul>
              
              <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
              <p><strong>Shipping:</strong> $${order.shippingCost.toFixed(2)}</p>
              <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
              <p class="total">Total: $${order.total.toFixed(2)}</p>
            </div>
            
            <div class="order-details">
              <h3>Shipping Address:</h3>
              <p>
                ${order.shippingAddress.fullName}<br>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
                ${order.shippingAddress.country || 'USA'}<br>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p>We'll send you another email when your order ships.</p>
            
            <div class="footer">
              <p>Thanks for shopping with atweb!</p>
              <p>If you have any questions, please contact us.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return exports.sendEmail({
    to: userEmail,
    subject: `Order Confirmation - ${order.orderNumber}`,
    html
  });
};

/**
 * Send password reset email
 */
exports.sendPasswordReset = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>You requested a password reset for your atweb account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <div class="footer">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return exports.sendEmail({
    to: email,
    subject: 'Password Reset Request - atweb',
    html
  });
};

/**
 * Send welcome email
 */
exports.sendWelcomeEmail = async (email, username) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to atweb! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${username},</p>
            <p>Thank you for creating an account with atweb - your premium laptop & accessories store!</p>
            <p>We're excited to have you as part of our community.</p>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/products" class="button">Start Shopping</a>
            </p>
            <p>Explore our wide range of laptops, accessories, and more. If you have any questions, feel free to reach out to our support team.</p>
            <div class="footer">
              <p>Happy shopping!</p>
              <p>The atweb Team</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return exports.sendEmail({
    to: email,
    subject: 'Welcome to atweb! 🎉',
    html
  });
};
