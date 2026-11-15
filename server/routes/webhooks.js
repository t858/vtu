const express = require('express');
const crypto = require('crypto');
const { dispenseAirtime, dispenseDataBundle, dispenseExamPin } = require('../services/vtuService');
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
    const metadata = data.metadata || {};
    let transaction = await Transaction.findOne({ where: { reference: data.reference } });
    const amountInNaira = Math.floor(data.amount / 100);

    console.log(`[WEBHOOK] Payment successful for ₦${amountInNaira} (Ref: ${data.reference})`);

    if (!transaction) {
      transaction = await Transaction.create({
        reference: data.reference,
        email: data.customer?.email,
        amount: amountInNaira,
        type: metadata.type || 'unknown',
        status: 'pending',
        metadata
      });
    }

    const currentMeta = transaction.metadata || {};

    // Check if already fulfilled by /verify route to prevent double dispensing
    if (!currentMeta.fulfillment) {
      let fulfillment;
      if (metadata.type === 'airtime') {
        fulfillment = await dispenseAirtime(metadata.network, metadata.phone, amountInNaira, data.reference)
          .catch(err => { console.error('Failed to dispense airtime:', err); return null; });
      } else if (metadata.type === 'data') {
        fulfillment = await dispenseDataBundle(metadata.service, metadata.phone, metadata.dataPlan, data.reference, metadata.maxAmount)
          .catch(err => { console.error('Failed to dispense data:', err); return null; });
      } else if (metadata.type === 'exam_pin') {
        fulfillment = await dispenseExamPin(metadata.examType, metadata.quantity, data.customer?.email, metadata.phone, data.reference)
          .catch(err => { console.error('Failed to dispense exam pin:', err); return null; });
      }

      transaction.status = 'successful';
      transaction.failureReason = null;
      transaction.type = metadata.type || transaction.type;
      transaction.amount = amountInNaira;
      transaction.metadata = {
        ...currentMeta,
        ...metadata,
        fulfillment
      };
      await transaction.save();

      const wallet = await Wallet.findByPk(1);
      if (wallet) {
        wallet.balance += amountInNaira;
        await wallet.save();
      }
    }
  } else if (event.event === 'charge.failed') {
    const data = event.data;
    const transaction = await Transaction.findOne({ where: { reference: data.reference } });
    const reason = data.gateway_response || data.message || 'Payment declined by bank or customer';
    if (transaction) {
      transaction.status = 'failed';
      transaction.failureReason = reason;
      await transaction.save();
    }
  }

  // Important: Always return 200 OK to Paystack
  res.status(200).send('Webhook received');
});

// VTU Africa Webhook / Callback endpoint
router.all('/vtu', async (req, res) => {
  try {
    let payload = {};
    if (req.body && req.body.length > 0) {
      try {
        payload = JSON.parse(req.body.toString());
      } catch (e) {
        payload = { raw: req.body.toString() };
      }
    }
    const data = { ...req.query, ...payload };
    console.log('[VTU AFRICA WEBHOOK RECEIVED]:', data);

    const ref = data.ref || data.reference || data.ReferenceID;
    if (ref) {
      const transaction = await Transaction.findOne({ where: { reference: ref } });
      if (transaction) {
        const status = String(data.status || data.Status || '').toLowerCase();
        if (status === 'completed' || status === 'successful' || data.code === 101) {
          transaction.status = 'successful';
        } else if (status === 'failed' || status === 'reversed') {
          transaction.status = 'failed';
          transaction.failureReason = data.message || 'VTU transaction failed or reversed';
        }
        transaction.metadata = {
          ...(transaction.metadata || {}),
          vtuCallback: data
        };
        await transaction.save();
      }
    }

    // Always respond 200 OK
    return res.status(200).json({ status: 'success', message: 'VTU webhook acknowledged' });
  } catch (error) {
    console.error('[VTU AFRICA WEBHOOK ERROR]:', error);
    return res.status(200).json({ status: 'received' });
  }
});

module.exports = router;
