'use strict';

const { Markup } = require('telegraf');
const db = require('../database/db');
const logger = require('../utils/logger');
const { sanitizePackName, buildPackName } = require('../utils/sticker');

async function deleteCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) {
    return ctx.replyWithMarkdown(
      '❌ *Usage:* `/delete <packname>`\n\n*Example:* `/delete mypack`'
    );
  }

  const botUsername = ctx.botInfo?.username;
  const shortName = sanitizePackName(args[0]);
  const fullName = buildPackName(shortName, botUsername);

  // Verify pack exists
  try {
    const set = await ctx.telegram.callApi('getStickerSet', { name: fullName });

    // Ask for confirmation
    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Yes, Delete', `confirm_delete_${fullName}`),
        Markup.button.callback('❌ Cancel', 'cancel_delete'),
      ],
    ]);

    await ctx.replyWithMarkdown(
      `⚠️ *Confirm Delete?*\n\n` +
      `📦 Pack: *${set.title}*\n` +
      `🔑 Name: \`${fullName}\`\n` +
      `🔢 Emojis: ${set.stickers?.length || 0}\n\n` +
      `⛔ This action cannot be undone!`,
      buttons
    );
  } catch (err) {
    const errMsg = err.description || err.message || '';
    if (errMsg.includes('STICKERSET_INVALID') || errMsg.includes('not found')) {
      return ctx.replyWithMarkdown(`❌ Pack \`${fullName}\` မတွေ့ပါ။`);
    }
    await ctx.reply(`❌ Error: ${errMsg}`);
  }
}

async function handleConfirmDelete(ctx) {
  await ctx.answerCbQuery();
  const fullName = ctx.callbackQuery.data.replace('confirm_delete_', '');

  const msg = await ctx.reply('⏳ Pack ဖျက်နေသည်...');

  try {
    await ctx.telegram.callApi('deleteStickerSet', { name: fullName });
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    await ctx.replyWithMarkdown(`✅ Pack \`${fullName}\` successfully deleted!`);
    logger.info(`User ${ctx.from.id} deleted pack: ${fullName}`);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    const errMsg = err.description || err.message || 'Unknown error';
    logger.error(`Delete pack error for ${ctx.from.id}: ${errMsg}`);
    await ctx.reply(`❌ Error: ${errMsg}`);
  }
}

async function handleCancelDelete(ctx) {
  await ctx.answerCbQuery('Cancelled');
  await ctx.editMessageText('❌ Delete cancelled.');
}

module.exports = { deleteCommand, handleConfirmDelete, handleCancelDelete };
