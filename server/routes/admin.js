const express = require('express');
const { Op } = require('sequelize');
const { adminAuth, createAdminSession, destroySession } = require('../middleware/adminAuth');
const { Transaction, Wallet } = require('../models/database');

const router = express.Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'myadmin@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Myadminpassword123';

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

router.post('/logout', adminAuth, (req, res) => {
  destroySession(req.adminToken);
  return res.status(200).json({ success: true });
});

router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        status: {
          [Op.in]: ['pending', 'successful', 'failed']
        }
      },
      order: [['createdAt', 'DESC']]
    });

    const formatted = transactions.map((transaction) => {
      const metadata = transaction.metadata || {};
      return {
        id: transaction.id,
        reference: transaction.reference,
        phone: metadata.phone || 'N/A',
        item: metadata.type || transaction.type,
        amount: transaction.amount,
        quantity: metadata.quantity || 1,
        status: transaction.status,
        createdAt: transaction.createdAt
      };
    });

    return res.status(200).json({ transactions: formatted });
  } catch (error) {
    console.error('Failed to fetch transactions:', error.message);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

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
