// services/smsService.js
const axios = require('axios');

/**
 * Sends an SMS message via Ethio Telecom SMS Gateway in Production,
 * or logs to console during Development/Testing.
 * 
 * @param {string} phone - Recipient phone number (e.g., '0911223344' or '+251911223344')
 * @param {string} message - Message text body
 */
exports.sendSms = async (phone, message) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const gatewayUrl = process.env.ETHIO_TELECOM_SMS_URL;

  if (isProduction && gatewayUrl) {
    try {
      // Standard Ethio Telecom REST/HTTP Request payload pattern
      const payload = {
        username: process.env.ETHIO_TELECOM_USERNAME,
        password: process.env.ETHIO_TELECOM_PASSWORD,
        sender_id: process.env.ETHIO_TELECOM_SHORTCODE || 'FCOMMERCE',
        to: phone,
        message: message,
      };

      const response = await axios.post(gatewayUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000, // 8-second timeout
      });

      console.log(`[ETHIO TELECOM SMS] Sent successfully to ${phone}. Gateway Status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error('[ETHIO TELECOM SMS ERROR]: Failed to send SMS via Gateway:', error.message);
      // In production, throw or handle fallback so auth flow can alert user
      throw new Error('Failed to deliver SMS via network provider.');
    }
  } else {
    // Simulator Mode for local development & testing
    console.log(`\n========================================`);
    console.log(`[ETHIO TELECOM SMS SIMULATOR - DEV MODE]`);
    console.log(`Recipient Phone : ${phone}`);
    console.log(`Message Content : ${message}`);
    console.log(`========================================\n`);
    return { success: true, simulated: true };
  }
};