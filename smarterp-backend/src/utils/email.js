const nodemailer = require('nodemailer');
const logger = require('./logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_PORT === '465',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            logger.info('Email transporter initialized');
        } else {
            logger.warn('Email configuration missing. Email features will be disabled.');
        }
    }

    async sendEmail(to, subject, html, text = null) {
        if (!this.transporter) {
            logger.warn('Email transporter not configured. Skipping email send.');
            return { success: false, message: 'Email service not configured' };
        }

        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || 'noreply@smarterp.com',
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    async sendVerificationEmail(email, token) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
        
        const subject = 'Verify Your Email - SmartERP';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SmartERP</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to SmartERP!</h2>
                        <p>Please verify your email address to get started.</p>
                        <p>Click the button below to verify your email:</p>
                        <p style="text-align: center;">
                            <a href="${verifyUrl}" class="button">Verify Email</a>
                        </p>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #2563eb;">${verifyUrl}</p>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by SmartERP. If you didn't request this, please ignore it.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email, token) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        
        const subject = 'Reset Your Password - SmartERP';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SmartERP</h1>
                    </div>
                    <div class="content">
                        <h2>Password Reset Request</h2>
                        <p>We received a request to reset your password.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </p>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent by SmartERP. If you didn't request this, please ignore it.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }

    async sendWelcomeEmail(email, name) {
        const subject = 'Welcome to SmartERP!';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9fafb; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>SmartERP</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome to SmartERP, ${name}!</h2>
                        <p>Your account has been successfully created.</p>
                        <p>You can now log in and start managing your business.</p>
                        <p>Here's what you can do with SmartERP:</p>
                        <ul>
                            <li>Manage your company accounts</li>
                            <li>Track inventory and stock</li>
                            <li>Create invoices and bills</li>
                            <li>Generate financial reports</li>
                            <li>And much more!</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This email was sent by SmartERP. Welcome aboard!</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return this.sendEmail(email, subject, html);
    }
}

module.exports = new EmailService();