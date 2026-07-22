'use strict';

const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');

function createServer(bot) {
  const app = express();
  app.use(express.json());

  // ─── Health Check (UptimeRobot ping target) ───────────────────
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      bot: 'Premium Emoji Pack Creator Bot',
      uptime: Math.floor(process.uptime()),
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/ping', (req, res) => {
    res.send('pong');
  });

  // ─── Webhook endpoint (if WEBHOOK_URL is set) ─────────────────
  if (config.WEBHOOK_URL) {
    app.post(`/webhook/${config.BOT_TOKEN}`, (req, res) => {
      bot.handleUpdate(req.body, res);
    });
    logger.info(`Webhook endpoint: /webhook/${config.BOT_TOKEN.slice(0, 10)}...`);
  }

  return app;
}

function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`HTTP server running on port ${config.PORT}`);
      resolve(server);
    });
  });
}

module.exports = { createServer, startServer };
