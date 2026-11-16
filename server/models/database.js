const path = require('path');
const fs = require('fs');

let sequelize = null;
let Transaction = null;
let Wallet = null;
let SiteVisit = null;

// Fallback in-memory store for serverless environments where SQLite binary cannot be bundled
const inMemoryStore = {
  transactions: new Map(),
  wallet: { id: 1, balance: 0, save: async function() {} },
  siteVisits: []
};

const FallbackTransaction = {
  create: async (data) => {
    const record = { 
      ...data, 
      save: async function() { 
        inMemoryStore.transactions.set(this.reference, this); 
        return this;
      } 
    };
    inMemoryStore.transactions.set(data.reference, record);
    return record;
  },
  findOne: async (query) => {
    const ref = query?.where?.reference;
    if (ref) {
      return inMemoryStore.transactions.get(ref) || null;
    }
    return null;
  },
  findAll: async () => Array.from(inMemoryStore.transactions.values()),
  count: async (query) => {
    const status = query?.where?.status;
    const all = Array.from(inMemoryStore.transactions.values());
    if (status) {
      return all.filter(t => t.status === status).length;
    }
    return all.length;
  }
};

const FallbackWallet = {
  findByPk: async () => inMemoryStore.wallet,
  findOrCreate: async () => [inMemoryStore.wallet, false],
  create: async () => inMemoryStore.wallet
};

const FallbackSiteVisit = {
  create: async (data) => {
    inMemoryStore.siteVisits.push(data);
    return data;
  },
  count: async () => inMemoryStore.siteVisits.length
};

try {
  const { Sequelize, DataTypes } = require('sequelize');

  const storagePath = process.env.DB_PATH || (process.env.VERCEL 
    ? path.join('/tmp', 'vtu_database.sqlite') 
    : path.join(__dirname, '..', 'vtu_database.sqlite'));

  if (process.env.VERCEL && !fs.existsSync('/tmp')) {
    try {
      fs.mkdirSync('/tmp', { recursive: true });
    } catch (e) {}
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });

  Transaction = sequelize.define('Transaction', {
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
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
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

  Wallet = sequelize.define('Wallet', {
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  });

  SiteVisit = sequelize.define('SiteVisit', {
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

  // Safe sync
  sequelize.sync().then(async () => {
    const existingWallet = await Wallet.findByPk(1).catch(() => null);
    if (!existingWallet) {
      await Wallet.create({ id: 1, balance: 0 }).catch(() => {});
    }
    console.log('Database synced');
  }).catch(err => {
    console.warn('SQLite sync warning (operating in resilient mode):', err.message);
  });

} catch (err) {
  console.warn('[DATABASE] SQLite could not be initialized in this serverless environment. Using in-memory store:', err.message);
  Transaction = FallbackTransaction;
  Wallet = FallbackWallet;
  SiteVisit = FallbackSiteVisit;
}

module.exports = {
  sequelize,
  Transaction: Transaction || FallbackTransaction,
  Wallet: Wallet || FallbackWallet,
  SiteVisit: SiteVisit || FallbackSiteVisit
};
