const express = require('express');
const axios = require('axios');
const { Transaction, Wallet } = require('../models/database');
const { dispenseAirtime, dispenseDataBundle, dispenseExamPin } = require('../services/vtuService');
const router = express.Router();

// Initialize Paystack Transaction
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;

    const frontendUrl = process.env.FRONTEND_URL 
      || req.headers.origin 
      || (req.headers.host ? `https://${req.headers.host}` : null)
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const callbackUrl = `${frontendUrl.replace(/\/$/, '')}/payment/success`;

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(Number(amount) * 100), // Paystack expects amount in kobo
        callback_url: callbackUrl,
        metadata
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
        amount: Math.floor(Number(amount)),
        type: metadata?.type || 'unknown',
        status: 'pending',
        metadata: metadata || {}
      });
    }

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Paystack Initialization Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.message || 'Failed to initialize transaction' 
    });
  }
});

// Verify Paystack Transaction
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, error: 'Reference is required' });
    }

    // 1. Verify directly with Paystack API
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paystackData = paystackResponse?.data?.data;
    if (!paystackData || paystackData.status !== 'success') {
      const reason = paystackData?.gateway_response || 'Payment cancelled or abandoned by user';
      let existingTx = await Transaction.findOne({ where: { reference } });
      if (existingTx) {
        existingTx.status = 'failed';
        existingTx.failureReason = reason;
        await existingTx.save();
      }
      return res.status(400).json({
        success: false,
        status: paystackData?.status || 'failed',
        message: reason
      });
    }

    // 2. Fetch or create local transaction
    let transaction = await Transaction.findOne({ where: { reference } });
    const metadata = paystackData.metadata || transaction?.metadata || {};
    const amountInNaira = Math.floor(paystackData.amount / 100);

    if (!transaction) {
      transaction = await Transaction.create({
        reference,
        email: paystackData.customer?.email || metadata?.email,
        amount: amountInNaira,
        type: metadata?.type || 'unknown',
        status: 'successful',
        failureReason: null,
        metadata: metadata || {}
      });
    }

    // 3. Fulfill service if not already fulfilled
    const currentMeta = transaction.metadata || {};
    let fulfillment = currentMeta.fulfillment;

    if (!fulfillment) {
      if (metadata.type === 'airtime') {
        fulfillment = await dispenseAirtime(metadata.network, metadata.phone, amountInNaira, reference);
      } else if (metadata.type === 'data') {
        fulfillment = await dispenseDataBundle(metadata.service, metadata.phone, metadata.dataPlan, reference, metadata.maxAmount);
      } else if (metadata.type === 'exam_pin') {
        fulfillment = await dispenseExamPin(
          metadata.examType,
          metadata.quantity,
          paystackData.customer?.email || transaction.email,
          metadata.phone,
          reference
        );
      }

      transaction.status = 'successful';
      transaction.failureReason = null;
      transaction.amount = amountInNaira;
      transaction.metadata = {
        ...currentMeta,
        ...metadata,
        fulfillment
      };
      await transaction.save();

      // Update admin wallet
      const wallet = await Wallet.findByPk(1);
      if (wallet) {
        wallet.balance += amountInNaira;
        await wallet.save();
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        email: transaction.email,
        type: transaction.type,
        metadata: transaction.metadata,
        fulfillment: transaction.metadata?.fulfillment,
        paidAt: paystackData.paid_at
      }
    });
  } catch (error) {
    console.error('Verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Payment verification failed'
    });
  }
});

module.exports = router;
