'use strict';

const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./utils/logger');
const { banCheck } = require('./middleware/auth');
const { registerCommands } = require('./commands/index');

function createBot() {
  const bot = new Telegraf(config.BOT_TOKEN);

  // ─── Expose token for sticker utils ──────────────────────────
  process.env.BOT_TOKEN = config.BOT_TOKEN;

  // ─── Global error handler ─────────────────────────────────────
  bot.catch((err, ctx) => {
    logger.error(`Bot error for update ${ctx.updateType}: ${err.message}`);
    if (ctx.chat) {
      ctx.reply('⚠️ An error occurred. Please try again.').catch(() => {});
    }
  });

  // ─── Global middleware ────────────────────────────────────────
  bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    if (ctx.from) {
      logger.info(
        `[${ctx.updateType}] User ${ctx.from.id} (@${ctx.from.username || 'no_username'}) — ${ms}ms`
      );
    }
  });

  bot.use(banCheck);

  // ─── Register all commands ────────────────────────────────────
  registerCommands(bot);

  return bot;
}

async function launchBot(bot) {
  if (config.WEBHOOK_URL) {
    // Webhook mode (production on Render)
    const webhookPath = `/webhook/${config.BOT_TOKEN}`;
    const webhookUrl = `${config.WEBHOOK_URL}${webhookPath}`;

    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`Bot launched in webhook mode: ${webhookUrl}`);
  } else {
    // Long polling mode (development)
    await bot.telegram.deleteWebhook();
    bot.launch();
    logger.info('Bot launched in polling mode');
  }

  // Fetch and cache bot info
  const botInfo = await bot.telegram.getMe();
  logger.info(`Bot info: @${botInfo.username} (ID: ${botInfo.id})`);

  return botInfo;
}

module.exports = { createBot, launchBot };
