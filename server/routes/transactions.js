const express = require('express');
const axios = require('axios');
const { Transaction } = require('../models/database');
const router = express.Router();

// Initialize Paystack Transaction
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack expects amount in kobo (lowest denomination)
        metadata // We pass along what they are buying (e.g. { type: 'airtime', network: 'MTN', phone: '080...' })
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const transactionReference = response?.data?.data?.reference;

    if (transactionReference) {
      await Transaction.create({
        reference: transactionReference,
        email,
        amount: Math.floor(amount),
        type: metadata?.type || 'unknown',
        status: 'pending',
        metadata: metadata || {}
      });
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Paystack Initialization Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to initialize transaction' });
  }
});

module.exports = router;
