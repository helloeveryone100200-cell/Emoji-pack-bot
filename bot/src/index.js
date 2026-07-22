'use strict';

const { createBot, launchBot } = require('./bot');
const { createServer, startServer } = require('./server');
const logger = require('./utils/logger');

async function main() {
  logger.info('═══════════════════════════════════════════');
  logger.info('   Premium Emoji Pack Creator Bot');
  logger.info('═══════════════════════════════════════════');

  // Create bot instance
  const bot = createBot();

  // Create and start HTTP server (for UptimeRobot health check)
  const app = createServer(bot);
  await startServer(app);

  // Launch bot (polling or webhook depending on env)
  await launchBot(bot);

  logger.info('✅ Bot is running and ready!');

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down...`);
    bot.stop(signal);
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
