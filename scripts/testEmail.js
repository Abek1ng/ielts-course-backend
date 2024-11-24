// Save as scripts/testEmail.js
require('dotenv').config();
const emailService = require('../utils/emailService');

async function testEmailConfiguration() {
  console.log('Testing email configuration...');
  console.log('Using email:', process.env.EMAIL_USER);
  
  try {
    const result = await emailService.sendEmail({
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify the email service configuration.</p>
        <p>If you receive this, your email service is configured correctly!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `
    });

    console.log('Test email sent successfully:', result);
  } catch (error) {
    console.error('Test email failed:', error);
  } finally {
    // Wait a bit before exiting to allow for error events
    setTimeout(() => process.exit(), 1000);
  }
}

// Add event listeners for debugging
emailService.on('emailError', ({ error, to }) => {
  console.error('Email Error Event:', { error, to });
});

emailService.on('emailSuccess', (info) => {
  console.log('Email Success Event:', info);
});

testEmailConfiguration();