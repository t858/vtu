const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'vtu_database.sqlite'),
  logging: false
});

const Transaction = sequelize.define('Transaction', {
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: { // 'airtime' or 'exam_pin'
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending, successful, failed
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.TEXT,
    get: function() {
      return JSON.parse(this.getDataValue('metadata') || '{}');
    },
    set: function(value) {
      this.setDataValue('metadata', JSON.stringify(value));
    }
  }
});

const Wallet = sequelize.define('Wallet', {
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
});

const SiteVisit = sequelize.define('SiteVisit', {
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

async function ensureDefaultWallet() {
  const existingWallet = await Wallet.findByPk(1);
  if (!existingWallet) {
    await Wallet.create({ id: 1, balance: 0 });
  }
}

// Sync database
sequelize.sync().then(async () => {
  await ensureDefaultWallet();
  console.log('Database synced');
}).catch(err => {
  console.error('Failed to sync database:', err);
});

module.exports = {
  sequelize,
  Transaction,
  Wallet,
  SiteVisit
};
