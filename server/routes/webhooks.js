const express = require('express');
const crypto = require('crypto');
const { dispenseAirtime, dispenseExamPin } = require('../services/vtuService');
const { Transaction, Wallet } = require('../models/database');
const router = express.Router();

// Paystack Webhook endpoint
router.post('/paystack', async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto.createHmac('sha512', secret).update(req.body).digest('hex');

  // 1. Verify signature
  if (hash !== req.headers['x-paystack-signature']) {
    console.error('Webhook signature verification failed');
    return res.status(400).send('Invalid signature');
  }

  // 2. Parse the event
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch (error) {
    return res.status(400).send('Invalid JSON');
  }

  // 3. Handle successful charge
  if (event.event === 'charge.success') {
    const data = event.data;
    const metadata = data.metadata;
    const transaction = await Transaction.findOne({ where: { reference: data.reference } });
    
    console.log(`Payment successful for ₦${data.amount / 100}`);
    console.log(`Metadata:`, metadata);

    if (transaction) {
      transaction.status = 'successful';
      transaction.type = metadata?.type || transaction.type;
      transaction.amount = Math.floor(data.amount / 100);
      transaction.metadata = metadata || {};
      await transaction.save();
    }

    const wallet = await Wallet.findByPk(1);
    if (wallet) {
      wallet.balance += Math.floor(data.amount / 100);
      await wallet.save();
    }

    // 4. Trigger VTU Services based on what was purchased
    if (metadata && metadata.type === 'airtime') {
      dispenseAirtime(metadata.network, metadata.phone, data.amount / 100)
        .catch(err => console.error('Failed to dispense airtime:', err));
    } else if (metadata && metadata.type === 'exam_pin') {
      dispenseExamPin(metadata.examType, metadata.quantity, data.customer.email, metadata.phone)
        .catch(err => console.error('Failed to dispense exam pin:', err));
    }
  } else if (event.event === 'charge.failed') {
    const data = event.data;
    const transaction = await Transaction.findOne({ where: { reference: data.reference } });
    if (transaction) {
      transaction.status = 'failed';
      await transaction.save();
    }
  }

  // Important: Always return 200 OK to Paystack to prevent them from retrying
  res.status(200).send('Webhook received');
});

module.exports = router;
