const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const transactionRoutes = require('./routes/transactions');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');
const { SiteVisit } = require('./models/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Important: Webhook route needs raw body for signature verification
// Mount under both /api/webhook and /webhook to handle any Vercel rewrite configuration
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// Other routes use standard JSON parsing
app.use(express.json());

// Routes mounted with and without /api prefix
app.use('/api/transactions', transactionRoutes);
app.use('/transactions', transactionRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// Public site visit tracking endpoint
const trackVisitHandler = async (req, res) => {
  try {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ip = String(rawIp).split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { path } = req.body || {};

    if (SiteVisit && SiteVisit.create) {
      await SiteVisit.create({
        ip,
        path: path || '/',
        userAgent
      }).catch(() => {});
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(200).json({ success: false });
  }
};

app.post('/api/track-visit', trackVisitHandler);
app.post('/track-visit', trackVisitHandler);

// Basic health check
app.get(['/', '/api', '/api/health', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', message: 'VTU Backend is running.' });
});

// Start server locally (on Vercel serverless, Vercel invokes the exported app directly)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
