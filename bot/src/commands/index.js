'use strict';

const { startCommand, handleBtnCreate, handleBtnList, handleBtnHelp, handleBtnAdmin } = require('./start');
const { helpCommand } = require('./help');
const { createCommand } = require('./create');
const { addCommand, handleDocumentForAdd, handlePhotoForAdd, cancelCommand } = require('./add');
const { listCommand, infoCommand } = require('./list');
const { deleteCommand, handleConfirmDelete, handleCancelDelete } = require('./delete');
const { statsCommand, broadcastCommand, banCommand, unbanCommand, usersCommand } = require('./admin');
const { adminOnly } = require('../middleware/auth');
const db = require('../database/db');
const logger = require('../utils/logger');

function registerCommands(bot) {
  // ─── Core Commands ────────────────────────────────────────────
  bot.command('start', startCommand);
  bot.command('help', helpCommand);
  bot.command('create', createCommand);
  bot.command('add', addCommand);
  bot.command('list', listCommand);
  bot.command('info', infoCommand);
  bot.command('delete', deleteCommand);
  bot.command('cancel', cancelCommand);
  bot.command('ping', ctx => ctx.reply('🏓 Pong! Bot is alive.'));

  // ─── Admin Commands ───────────────────────────────────────────
  bot.command('stats', adminOnly, statsCommand);
  bot.command('broadcast', adminOnly, broadcastCommand);
  bot.command('ban', adminOnly, banCommand);
  bot.command('unban', adminOnly, unbanCommand);
  bot.command('users', adminOnly, usersCommand);

  // ─── Inline Button Actions ────────────────────────────────────
  bot.action('btn_create', handleBtnCreate);
  bot.action('btn_list', handleBtnList);
  bot.action('btn_help', handleBtnHelp);
  bot.action('btn_admin', handleBtnAdmin);
  bot.action(/^confirm_delete_/, handleConfirmDelete);
  bot.action('cancel_delete', handleCancelDelete);

  // ─── Message Handlers (for wizard sessions) ───────────────────
  bot.on('document', async (ctx, next) => {
    const session = db.getSession(ctx.from.id);
    if (session?.action === 'ADD_EMOJI') {
      return handleDocumentForAdd(ctx);
    }
    return next();
  });

  bot.on('photo', async (ctx, next) => {
    const session = db.getSession(ctx.from.id);
    if (session?.action === 'ADD_EMOJI') {
      return handlePhotoForAdd(ctx);
    }
    return next();
  });

  // ─── Fallback ─────────────────────────────────────────────────
  bot.on('text', async ctx => {
    const session = db.getSession(ctx.from.id);
    if (session?.action) {
      await ctx.reply('⚠️ Image/file ကို ပို့ပါ သို့မဟုတ် /cancel ဖြင့် cancel လုပ်ပါ။');
    } else {
      await ctx.reply('ℹ️ /help — Commands ကြည့်ရန်');
    }
  });

  logger.info('Commands registered');
}

module.exports = { registerCommands };
