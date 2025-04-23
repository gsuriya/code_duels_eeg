/**
 * Firebase Configuration
 * Initializes Firebase Admin SDK and exports configuration settings
 */

const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Database
const db = admin.database();

// Get config values from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.APP_URL;
const authorizedAdminEmails = (process.env.AUTHORIZED_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);
const authorizedPremiumEmails = (process.env.AUTHORIZED_PREMIUM_EMAILS || '')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean);

// Validate required configuration
if (!stripeSecretKey) {
  logger.warn('Stripe secret key is not configured. Set STRIPE_SECRET_KEY environment variable');
}

if (!appUrl) {
  logger.warn('App URL is not configured. Set APP_URL environment variable');
}

module.exports = {
  admin,
  db,
  stripeSecretKey,
  appUrl,
  authorizedAdminEmails,
  authorizedPremiumEmails,
}; 