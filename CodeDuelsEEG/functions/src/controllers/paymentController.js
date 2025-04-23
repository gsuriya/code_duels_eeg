/**
 * Payment Controller
 * Handles payment-related callable functions
 */

const functions = require('firebase-functions/v2');
const { admin } = require('../config/firebase');
const { getCheckoutSession } = require('../services/stripe');
const { updatePremiumStatus, recordPayment, getPaymentHistory } = require('../services/user');
const logger = require('firebase-functions/logger');

/**
 * Callable function to verify premium payment and update user status
 */
exports.verifyPremiumPayment = functions.https.onCall({
  timeoutSeconds: 300,
  memory: '256MiB',
  region: 'us-east1',
  minInstances: 0,
  cors: true,
  invoker: 'public'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be logged in.');
  }

  const userId = request.auth.uid;
  const email = request.auth.token.email;
  const sessionId = request.data.sessionId;

  if (!sessionId) {
    throw new Error('Session ID is required.');
  }

  try {
    // Check if this session ID has already been processed for this user
    const paymentRef = admin.database().ref(`premiumPayments/${userId}/${sessionId}`);
    const paymentSnapshot = await paymentRef.once('value');
    
    if (paymentSnapshot.exists()) {
      logger.info('Payment already verified for user', { userId, sessionId });
      return { success: true, message: 'Payment already verified.' };
    }

    // Retrieve the session from Stripe
    const session = await getCheckoutSession(sessionId);

    if (session.payment_status === 'paid') {
      // Payment successful, update user status in the database
      await updatePremiumStatus(userId, true);

      // Record the payment
      await recordPayment(userId, sessionId, {
        email: email || session.customer_email || 'unknown',
        paymentDate: admin.database.ServerValue.TIMESTAMP,
        amount: session.amount_total / 100, // Amount is in cents
        status: session.payment_status,
      });

      logger.info('Premium payment verified and user status updated', { userId, sessionId });
      return { success: true, message: 'Payment verified and status updated.' };
    } else {
      logger.warn('Payment verification failed: Payment not paid', { 
        userId, 
        sessionId, 
        status: session.payment_status 
      });
      throw new Error('Payment not successful.');
    }
  } catch (error) {
    logger.error('Error verifying premium payment:', { 
      userId, 
      sessionId, 
      error: error.message 
    });
    
    if (error.type === 'StripeInvalidRequestError') {
      throw new Error('Invalid session ID.');
    }
    
    throw new Error('Failed to verify payment.');
  }
});

/**
 * Callable function to get payment history for the authenticated user
 */
exports.getPaymentHistory = functions.https.onCall({
  timeoutSeconds: 300,
  memory: '256MiB',
  region: 'us-east1',
  minInstances: 0,
  cors: true,
  invoker: 'public'
}, async (request) => {
  if (!request.auth) {
    throw new Error('User must be logged in.');
  }

  const userId = request.auth.uid;

  try {
    const paymentHistory = await getPaymentHistory(userId);
    return paymentHistory;
  } catch (error) {
    logger.error('Error fetching payment history:', { userId, error: error.message });
    throw new Error('Failed to fetch payment history.');
  }
}); 