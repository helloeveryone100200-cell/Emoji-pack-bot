'use strict';

const db = require('../database/db');
const logger = require('../utils/logger');
const {
  downloadTelegramFile,
  convertToWebP,
  detectFileType,
  uploadStickerFile,
  sanitizePackName,
  buildPackName,
  getPackUrl,
} = require('../utils/sticker');

async function addCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) {
    return ctx.replyWithMarkdown(
      '❌ *Usage:* `/add <packname>`\n\n' +
      '*Example:* `/add mypack`\n\nPack name သာ ထည့်ပါ (full name မဟုတ်)'
    );
  }

  const botUsername = ctx.botInfo?.username;
  const shortName = sanitizePackName(args[0]);
  const fullName = buildPackName(shortName, botUsername);

  // Verify pack exists
  try {
    await ctx.telegram.callApi('getStickerSet', { name: fullName });
  } catch {
    return ctx.replyWithMarkdown(
      `❌ Pack \`${fullName}\` မတွေ့ပါ။\n\nPack create လုပ်ရန်: \`/create ${shortName} Your Title\``
    );
  }

  // Save session waiting for image
  db.setSession(ctx.from.id, {
    action: 'ADD_EMOJI',
    packName: fullName,
    shortName,
    startedAt: Date.now(),
  });

  await ctx.replyWithMarkdown(
    `✅ Ready! Pack: \`${fullName}\`\n\n` +
    `📤 *Image ကို ပေးပို့ပါ:*\n` +
    `• PNG / JPG / WebP image\n` +
    `• TGS (animated)\n` +
    `• WEBM (video)\n\n` +
    `⚠️ As *file* (document) ပို့ပါ — photo ဖြင့် ပို့ပါက quality ကျမည်\n\n` +
    `/cancel — cancel လုပ်ရန်`
  );
}

async function handleDocumentForAdd(ctx) {
  const session = db.getSession(ctx.from.id);
  if (!session?.action === 'ADD_EMOJI' && session?.action !== 'ADD_EMOJI') return;

  const doc = ctx.message.document;
  if (!doc) return;

  const botToken = process.env.BOT_TOKEN;
  const packName = session.packName;

  const msg = await ctx.reply('⏳ Processing emoji...');

  try {
    const { buffer, filePath } = await downloadTelegramFile(ctx, doc.file_id);
    const fileType = detectFileType(buffer);

    let stickerBuffer;
    let format = 'static';

    if (fileType === 'tgs') {
      stickerBuffer = buffer;
      format = 'animated';
    } else if (fileType === 'webm') {
      stickerBuffer = buffer;
      format = 'video';
    } else {
      // Convert image to 100x100 WebP
      stickerBuffer = await convertToWebP(buffer, 100);
      format = 'static';
    }

    // Upload sticker file first
    const fileId = await uploadStickerFile(botToken, ctx.from.id, stickerBuffer, format);

    // Add to set
    await ctx.telegram.callApi('addStickerToSet', {
      user_id: ctx.from.id,
      name: packName,
      sticker: {
        sticker: fileId,
        emoji_list: ['⭐'],
        format,
      },
    });

    const packUrl = getPackUrl(packName);

    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    await ctx.replyWithMarkdown(
      `✅ *Emoji added successfully!*\n\n` +
      `📦 Pack: \`${packName}\`\n` +
      `🔗 ${packUrl}\n\n` +
      `➕ More emoji ထပ်ထည့်ရန် image ပို့ဆက်ပါ\n` +
      `/cancel — finish လုပ်ရန်`
    );

    logger.info(`User ${ctx.from.id} added emoji to ${packName} (format: ${format})`);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    const errMsg = err.description || err.message || 'Unknown error';
    logger.error(`Add emoji error for user ${ctx.from.id}: ${errMsg}`);
    await ctx.reply(`❌ Error: ${errMsg}\n\nAnother image try ပါ။`);
  }
}

async function handlePhotoForAdd(ctx) {
  const session = db.getSession(ctx.from.id);
  if (session?.action !== 'ADD_EMOJI') return;

  await ctx.replyWithMarkdown(
    '⚠️ Photo ဖြင့် ပို့ပါက Telegram မှ compress လုပ်ပြီး quality ကျသွားနိုင်သည်။\n\n' +
    '📤 *File/Document အနေဖြင့် ပို့ပါ:*\n' +
    'Attachment → File → Image ကို ရွေးပါ'
  );
}

async function cancelCommand(ctx) {
  const session = db.getSession(ctx.from.id);
  db.clearSession(ctx.from.id);

  if (session?.action) {
    await ctx.reply('✅ Cancelled. /help — Commands ကြည့်ရန်');
  } else {
    await ctx.reply('ℹ️ No active action to cancel.');
  }
}

module.exports = { addCommand, handleDocumentForAdd, handlePhotoForAdd, cancelCommand };
