'use strict';

/**
 * Simple in-memory database with JSON backup (Render-compatible)
 * Data resets on redeploy — for persistent storage, connect MongoDB Atlas
 * and set MONGODB_URI in Render environment variables.
 */

const NodeCache = require('node-cache');
const logger = require('../utils/logger');

const userCache = new NodeCache({ stdTTL: 0 }); // No expiry
const sessionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour sessions

const db = {
  // ─── Users ───────────────────────────────────────────────────
  getUser(userId) {
    return userCache.get(String(userId)) || null;
  },

  saveUser(userId, data) {
    const existing = this.getUser(userId) || {};
    const updated = { ...existing, ...data, userId, updatedAt: Date.now() };
    if (!updated.createdAt) updated.createdAt = Date.now();
    userCache.set(String(userId), updated);
    return updated;
  },

  getAllUsers() {
    const keys = userCache.keys();
    return keys.map(k => userCache.get(k)).filter(Boolean);
  },

  isBanned(userId) {
    const user = this.getUser(userId);
    return user?.banned === true;
  },

  banUser(userId) {
    return this.saveUser(userId, { banned: true, bannedAt: Date.now() });
  },

  unbanUser(userId) {
    return this.saveUser(userId, { banned: false, bannedAt: null });
  },

  // ─── Sessions (wizard state) ──────────────────────────────────
  getSession(userId) {
    return sessionCache.get(String(userId)) || {};
  },

  setSession(userId, data) {
    sessionCache.set(String(userId), data);
  },

  clearSession(userId) {
    sessionCache.del(String(userId));
  },

  // ─── Stats ───────────────────────────────────────────────────
  getStats() {
    const users = this.getAllUsers();
    return {
      totalUsers: users.length,
      bannedUsers: users.filter(u => u.banned).length,
      activeUsers: users.filter(u => !u.banned).length,
      totalPacksCreated: users.reduce((acc, u) => acc + (u.packsCreated || 0), 0),
    };
  },

  incrementPacksCreated(userId) {
    const user = this.getUser(userId) || {};
    this.saveUser(userId, { packsCreated: (user.packsCreated || 0) + 1 });
  },
};

logger.info('Database initialized (in-memory)');
module.exports = db;
