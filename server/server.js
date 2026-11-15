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
app.use('/api/webhook', express.raw({ type: 'application/json' }), webhookRoutes);
// Other routes can use standard JSON parsing
app.use(express.json());

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// Public site visit tracking endpoint
app.post('/api/track-visit', async (req, res) => {
  try {
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const ip = String(rawIp).split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { path } = req.body || {};

    await SiteVisit.create({
      ip,
      path: path || '/',
      userAgent
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(200).json({ success: false });
  }
});

// Basic health check
app.get('/', (req, res) => {
  res.send('VTU Backend is running.');
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
