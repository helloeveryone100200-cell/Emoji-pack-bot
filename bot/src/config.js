'use strict';

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_IDS: (process.env.ADMIN_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)
    .map(Number),
  PORT: parseInt(process.env.PORT || '3000', 10),
  WEBHOOK_URL: process.env.WEBHOOK_URL || null,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BOT_USERNAME: process.env.BOT_USERNAME || null,
};

if (!config.BOT_TOKEN) {
  console.error('[CONFIG] BOT_TOKEN environment variable is required!');
  process.exit(1);
}

if (config.ADMIN_IDS.length === 0) {
  console.warn('[CONFIG] No ADMIN_IDS set. Admin commands will be unavailable.');
}

module.exports = config;
