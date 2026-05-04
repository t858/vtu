const crypto = require('crypto');

const activeSessions = new Map();
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createAdminSession(email) {
  const token = generateSessionToken();
  activeSessions.set(token, {
    email,
    expiresAt: Date.now() + SESSION_DURATION_MS
  });

  return token;
}

function cleanupAndGetSession(token) {
  const session = activeSessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    activeSessions.delete(token);
    return null;
  }

  return session;
}

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const session = cleanupAndGetSession(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.admin = session;
  req.adminToken = token;
  return next();
}

function destroySession(token) {
  activeSessions.delete(token);
}

module.exports = {
  adminAuth,
  createAdminSession,
  destroySession
};
