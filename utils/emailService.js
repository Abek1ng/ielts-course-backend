const nodemailer = require('nodemailer');
const { EventEmitter } = require('events');

class EmailService extends EventEmitter {
    constructor() {
        super();
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            domain: 'gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // Use the App Password here
            },
            tls: {
                rejectUnauthorized: false // Don't fail on invalid certs
            }
        });

        // Verify transporter configuration
        this.verifyConnection();

        // Initialize retry queue
        this.retryQueue = [];
        this.maxRetries = 3;
        this.retryInterval = 5000; // 5 seconds
    }

    // Verify email configuration
    async verifyConnection() {
        try {
            const verification = await this.transporter.verify();
            console.log('Email service connected successfully:', verification);
        } catch (error) {
            console.error('Email service connection failed:', error);
            // Emit error but don't crash the app
            this.emit('connectionError', error);
        }
    }

    // Email templates with error handling
    async getEmailTemplate(template, data) {
        try {
            const templates = {
                welcomeEmail: (username) => ({
                    subject: 'Welcome to IELTS Course - Registration Received',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to IELTS Course!</h2>
              <p>Dear ${username},</p>
              <p>Thank you for registering with our IELTS course. Your registration is currently under review.</p>
              <p>What happens next:</p>
              <ul>
                <li>Our admin team will review your registration</li>
                <li>Once approved, you'll receive an email with access details</li>
                <li>You can then log in and start accessing the course materials</li>
              </ul>
              <p>If you have any questions, feel free to contact us.</p>
              <p>Best regards,<br>IELTS Course Team</p>
            </div>
          `
                }),
                accessGranted: (username, accessUntil) => ({
                    subject: 'IELTS Course Access Granted',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Access Granted!</h2>
              <p>Dear ${username},</p>
              <p>Your access to the IELTS course has been granted!</p>
              <p>Details:</p>
              <ul>
                <li>Access valid until: ${new Date(accessUntil).toLocaleDateString()}</li>
                <li>You can now log in and access all course materials</li>
              </ul>
              <p><a href="${process.env.SITE_URL}/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Access Course</a></p>
              <p>Best regards,<br>IELTS Course Team</p>
            </div>
          `
                })
            };

            return templates[template](data);
        } catch (error) {
            console.error('Error getting email template:', error);
            throw new Error('Email template error');
        }
    }

    // Async email sending with retry mechanism
    async sendEmail({ to, template, templateData, subject, html }) {
        let emailContent;
        let retryCount = 0;

        try {
            if (template && templateData) {
                emailContent = await this.getEmailTemplate(template, templateData);
            } else {
                emailContent = { subject, html };
            }

            const mailOptions = {
                from: `"IELTS Course" <${process.env.EMAIL_USER}>`,
                to,
                subject: emailContent.subject,
                html: emailContent.html
            };

            // Attempt to send email
            const sendWithRetry = async () => {
                try {
                    const info = await this.transporter.sendMail(mailOptions);
                    console.log('Email sent successfully:', info.messageId);
                    this.emit('emailSuccess', { to, messageId: info.messageId });
                    return info;
                } catch (error) {
                    console.error(`Email sending attempt ${retryCount + 1} failed:`, error);

                    if (retryCount < this.maxRetries) {
                        retryCount++;
                        await new Promise(resolve => setTimeout(resolve, this.retryInterval));
                        return sendWithRetry();
                    }

                    // Add to retry queue after max retries
                    this.addToRetryQueue({ mailOptions, retryCount: 0 });
                    throw new Error('Email sending failed after retries');
                }
            };

            return await sendWithRetry();

        } catch (error) {
            console.error('Email service error:', error);
            // Emit error event but don't throw
            this.emit('emailError', {
                error: error.message,
                to,
                template,
                retryCount
            });
            // Return null instead of throwing
            return null;
        }
    }

    // Add failed email to retry queue
    addToRetryQueue(emailData) {
        this.retryQueue.push(emailData);
        this.emit('emailQueued', {
            to: emailData.mailOptions.to,
            queueLength: this.retryQueue.length
        });
    }

    // Process retry queue
    async processRetryQueue() {
        while (this.retryQueue.length > 0) {
            const emailData = this.retryQueue[0];

            try {
                await this.transporter.sendMail(emailData.mailOptions);
                this.retryQueue.shift(); // Remove from queue if successful
                this.emit('retrySuccess', {
                    to: emailData.mailOptions.to,
                    remainingQueue: this.retryQueue.length
                });
            } catch (error) {
                if (emailData.retryCount < this.maxRetries) {
                    emailData.retryCount++;
                    await new Promise(resolve => setTimeout(resolve, this.retryInterval));
                } else {
                    this.retryQueue.shift(); // Remove after max retries
                    this.emit('retryFailed', {
                        to: emailData.mailOptions.to,
                        error: error.message
                    });
                }
            }
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

// Start retry queue processor
setInterval(() => {
    if (emailService.retryQueue.length > 0) {
        emailService.processRetryQueue();
    }
}, 60000); // Process queue every minute

module.exports = emailService;