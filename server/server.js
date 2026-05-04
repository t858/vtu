const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const transactionRoutes = require('./routes/transactions');
const webhookRoutes = require('./routes/webhooks');
const adminRoutes = require('./routes/admin');

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

// Basic health check
app.get('/', (req, res) => {
  res.send('VTU Backend is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
