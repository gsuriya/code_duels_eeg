const express = require('express');
const cors = require('cors');
const { createCheckoutSession } = require('./services/stripe');
const { appUrl } = require('./config/firebase');
const logger = require('firebase-functions/logger');

const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Checkout session endpoint
app.post('/createCheckoutSession', async (req, res) => {
  try {
    const { priceId, customerEmail } = req.body;

    if (!priceId) {
      logger.error('Missing priceId in request');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    const successUrl = `${appUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/premium`;

    const session = await createCheckoutSession(
      priceId, 
      customerEmail, 
      successUrl,
      cancelUrl
    );

    res.json({ id: session.id });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Start server if running locally
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app; 