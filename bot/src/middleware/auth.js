'use strict';

const config = require('../config');
const db = require('../database/db');
const logger = require('../utils/logger');

/**
 * Register user on first interaction
 */
function registerUser(ctx) {
  const user = ctx.from;
  if (!user) return;
  db.saveUser(user.id, {
    username: user.username || null,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    languageCode: user.language_code || 'en',
    isPremium: user.is_premium || false,
  });
}

/**
 * Check if user is banned
 */
function banCheck(ctx, next) {
  if (!ctx.from) return next();
  registerUser(ctx);
  if (db.isBanned(ctx.from.id)) {
    logger.info(`Banned user ${ctx.from.id} attempted interaction`);
    return ctx.reply('⛔ You have been banned from using this bot.');
  }
  return next();
}

/**
 * Require admin privileges
 */
function adminOnly(ctx, next) {
  if (!ctx.from) return;
  if (!config.ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ This command is for admins only.');
  }
  return next();
}

/**
 * Only allow private chats
 */
function privateOnly(ctx, next) {
  if (ctx.chat?.type !== 'private') {
    return ctx.reply('🔒 Please use this bot in private chat only.');
  }
  return next();
}

module.exports = { banCheck, adminOnly, privateOnly, registerUser };
