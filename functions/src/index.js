/**
 * Main entry point for Cloud Functions
 */

const functions = require('firebase-functions/v2');
const app = require('./server');

// Export HTTP functions
exports.api = functions.https.onRequest({
  timeoutSeconds: 300,
  memory: '256MiB',
  region: 'us-central1',
  cors: true,
  minInstances: 0
}, app);

// Export callable functions
exports.verifyPremiumPayment = require('./controllers/paymentController').verifyPremiumPayment;
exports.getPaymentHistory = require('./controllers/paymentController').getPaymentHistory;
exports.getUserRole = require('./controllers/userController').getUserRole; 