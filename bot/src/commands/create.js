'use strict';

const db = require('../database/db');
const logger = require('../utils/logger');
const { sanitizePackName, buildPackName, getPackUrl, uploadStickerFile } = require('../utils/sticker');

async function createCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (args.length < 2) {
    return ctx.replyWithMarkdown(
      '❌ *Usage:* `/create <shortname> <title>`\n\n' +
      '*Example:* `/create mypack My Cool Pack`\n\n' +
      '📌 shortname: lowercase letters, numbers, underscore သာ သုံးနိုင်သည်'
    );
  }

  const rawName = args[0];
  const title = args.slice(1).join(' ');
  const shortName = sanitizePackName(rawName);

  if (!shortName || shortName.length < 1) {
    return ctx.reply('❌ Invalid pack name. Use letters, numbers, underscore only.');
  }

  if (title.length > 64) {
    return ctx.reply('❌ Title is too long. Max 64 characters.');
  }

  const botUsername = ctx.botInfo?.username;
  if (!botUsername) {
    return ctx.reply('⚠️ Bot username not available. Try again later.');
  }

  const fullName = buildPackName(shortName, botUsername);
  const msg = await ctx.reply(`⏳ Pack "${title}" create လုပ်နေသည်...`);

  try {
    const sharp = require('sharp');
    const botToken = process.env.BOT_TOKEN;

    // Step 1: Create a 100x100 transparent WebP placeholder
    const placeholderBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 128, g: 128, b: 255, alpha: 255 },
      },
    }).webp().toBuffer();

    // Step 2: Upload the placeholder to get a file_id (String)
    const fileId = await uploadStickerFile(botToken, ctx.from.id, placeholderBuffer, 'static');

    // Step 3: Create sticker set using file_id (String) — NOT buffer
    await ctx.telegram.callApi('createNewStickerSet', {
      user_id: ctx.from.id,
      name: fullName,
      title: title,
      stickers: [
        {
          sticker: fileId,        // ← Must be String (file_id)
          emoji_list: ['⭐'],
          format: 'static',
        },
      ],
      sticker_type: 'custom_emoji',
    });

    db.incrementPacksCreated(ctx.from.id);
    const packUrl = getPackUrl(fullName);

    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    await ctx.replyWithMarkdown(
      `✅ *Pack Successfully Created!*\n\n` +
      `📦 *Title:* ${title}\n` +
      `🔑 *Name:* \`${fullName}\`\n` +
      `🔗 *Link:* ${packUrl}\n\n` +
      `➕ Emoji ထပ်ထည့်ရန်: \`/add ${shortName}\` ပြီး image ပို့ပါ`
    );

    logger.info(`User ${ctx.from.id} created pack: ${fullName}`);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    const errMsg = err.description || err.message || 'Unknown error';

    if (errMsg.includes('STICKERSET_INVALID') || errMsg.includes('already occupied') || errMsg.includes('already exists')) {
      return ctx.replyWithMarkdown(
        `❌ Pack name \`${fullName}\` is already taken.\n\nDifferent name ကို သုံးပါ: \`/create newname ${title}\``
      );
    }

    logger.error(`Create pack error for user ${ctx.from.id}: ${errMsg}`);
    await ctx.reply(`❌ Error: ${errMsg}`);
  }
}

module.exports = { createCommand };
