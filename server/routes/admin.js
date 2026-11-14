const express = require('express');
const { Op } = require('sequelize');
const { adminAuth, createAdminSession, destroySession } = require('../middleware/adminAuth');
const { Transaction, Wallet, SiteVisit } = require('../models/database');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'myadmin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Myadminpassword123';

// Admin Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = createAdminSession(email);
  return res.status(200).json({
    token,
    admin: {
      email
    }
  });
});

// Admin Logout
router.post('/logout', adminAuth, (req, res) => {
  destroySession(req.adminToken);
  return res.status(200).json({ success: true });
});

// Overview KPI Stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalVisits = await SiteVisit.count();
    const uniqueVisitors = await SiteVisit.count({
      distinct: true,
      col: 'ip'
    });

    const totalSuccessfulPurchases = await Transaction.count({
      where: { status: 'successful' }
    });

    const totalFailedPurchases = await Transaction.count({
      where: { status: 'failed' }
    });

    const totalPendingPurchases = await Transaction.count({
      where: { status: 'pending' }
    });

    const uniqueBuyers = await Transaction.count({
      where: { status: 'successful' },
      distinct: true,
      col: 'email'
    });

    const totalRevenue = (await Transaction.sum('amount', {
      where: { status: 'successful' }
    })) || 0;

    const wallet = await Wallet.findByPk(1);

    return res.status(200).json({
      totalVisits,
      uniqueVisitors,
      totalPurchases: totalSuccessfulPurchases,
      uniqueBuyers,
      failedPurchases: totalFailedPurchases,
      pendingPurchases: totalPendingPurchases,
      totalRevenue,
      walletBalance: wallet?.balance || 0
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error.message);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Detailed Transactions List
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      order: [['createdAt', 'DESC']]
    });

    const formatted = transactions.map((transaction) => {
      const metadata = transaction.metadata || {};

      let itemTitle = 'Service';
      if (transaction.type === 'airtime' || metadata.type === 'airtime') {
        itemTitle = `${metadata.network || ''} Airtime`.trim();
      } else if (transaction.type === 'exam_pin' || metadata.type === 'exam_pin') {
        itemTitle = `${metadata.examType || 'Exam'} Pin`;
      } else if (metadata.type === 'data') {
        itemTitle = `${metadata.network || ''} Data`.trim();
      }

      return {
        id: transaction.id,
        reference: transaction.reference,
        email: transaction.email,
        phone: metadata.phone || 'N/A',
        item: itemTitle,
        type: transaction.type,
        amount: transaction.amount,
        quantity: metadata.quantity || 1,
        status: transaction.status,
        failureReason: transaction.failureReason || null,
        metadata,
        createdAt: transaction.createdAt
      };
    });

    return res.status(200).json({ transactions: formatted });
  } catch (error) {
    console.error('Failed to fetch transactions:', error.message);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Wallet balance & actions
router.get('/wallet', adminAuth, async (req, res) => {
  try {
    const wallet = await Wallet.findByPk(1);
    return res.status(200).json({ balance: wallet?.balance || 0 });
  } catch (error) {
    console.error('Failed to fetch wallet:', error.message);
    return res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

router.post('/wallet/deposit', adminAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Deposit amount must be greater than 0' });
    }

    const wallet = await Wallet.findByPk(1);
    wallet.balance += Math.floor(amount);
    await wallet.save();

    return res.status(200).json({ balance: wallet.balance });
  } catch (error) {
    console.error('Failed to deposit wallet:', error.message);
    return res.status(500).json({ error: 'Failed to deposit funds' });
  }
});

router.post('/wallet/withdraw', adminAuth, async (req, res) => {
  try {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Withdrawal amount must be greater than 0' });
    }

    const wallet = await Wallet.findByPk(1);
    const withdrawalAmount = Math.floor(amount);

    if (wallet.balance < withdrawalAmount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    wallet.balance -= withdrawalAmount;
    await wallet.save();

    return res.status(200).json({ balance: wallet.balance });
  } catch (error) {
    console.error('Failed to withdraw wallet:', error.message);
    return res.status(500).json({ error: 'Failed to withdraw funds' });
  }
});

module.exports = router;
