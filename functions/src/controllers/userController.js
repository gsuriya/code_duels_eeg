/**
 * User Controller
 * Handles user-related callable functions
 */

const functions = require('firebase-functions/v2');
const { admin } = require('../config/firebase');
const logger = require('firebase-functions/logger');

/**
 * Callable function to get user role information
 */
exports.getUserRole = functions.https.onCall({
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

  const email = request.auth.token.email;
  if (!email) {
    throw new Error('Email not found in auth token.');
  }

  try {
    // Check if user is an admin
    const adminRef = admin.database().ref('admins');
    const adminSnapshot = await adminRef.once('value');
    const admins = adminSnapshot.val() || {};
    const isAdmin = Object.values(admins).includes(email);

    // Check if user is premium
    const premiumRef = admin.database().ref(`users/${request.auth.uid}/premium`);
    const premiumSnapshot = await premiumRef.once('value');
    const isPremium = premiumSnapshot.val() || false;

    logger.info('User role check completed', { email, isAdmin, isPremium });
    return { isAdmin, isPremium };
  } catch (error) {
    logger.error('Error checking user role:', { email, error: error.message });
    throw new Error('Failed to check user role.');
  }
}); 