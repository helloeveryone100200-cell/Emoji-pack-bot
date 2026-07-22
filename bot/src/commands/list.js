'use strict';

const { buildPackName, getPackUrl, sanitizePackName } = require('../utils/sticker');

async function listCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  // If pack name provided, show info instead
  if (args[0]) {
    return infoCommand(ctx);
  }

  await ctx.reply('⏳ Pack list ရယူနေသည်...');

  const botUsername = ctx.botInfo?.username;
  const userId = ctx.from.id;

  // Telegram API doesn't provide a direct "list user's sticker sets" endpoint.
  // We track pack names in session; remind user to use /info <packname>
  await ctx.replyWithMarkdown(
    `📋 *Your Emoji Packs*\n\n` +
    `ℹ️ Telegram API သည် user ၏ pack list တိုက်ရိုက် return မပေးပါ။\n\n` +
    `*Pack ကြည့်ရန်:*\n` +
    `\`/info <shortname>\` — Pack details ကြည့်ရန်\n\n` +
    `*Pack link format:*\n` +
    `\`https://t.me/addemoji/<shortname>_by_${botUsername}\`\n\n` +
    `*Pack create လုပ်ရန်:*\n` +
    `\`/create mypack My Pack Title\``
  );
}

async function infoCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  if (!args[0]) {
    return ctx.replyWithMarkdown('❌ *Usage:* `/info <packname>`\n\n*Example:* `/info mypack`');
  }

  const botUsername = ctx.botInfo?.username;
  const shortName = sanitizePackName(args[0]);
  const fullName = buildPackName(shortName, botUsername);

  const msg = await ctx.reply('⏳ Pack info ရယူနေသည်...');

  try {
    const stickerSet = await ctx.telegram.callApi('getStickerSet', { name: fullName });

    const count = stickerSet.stickers?.length || 0;
    const type = stickerSet.sticker_type || 'regular';
    const isAnimated = stickerSet.is_animated;
    const isVideo = stickerSet.is_video;

    let formatLabel = '🖼 Static';
    if (isAnimated) formatLabel = '✨ Animated';
    if (isVideo) formatLabel = '🎬 Video';

    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    await ctx.replyWithMarkdown(
      `📦 *Pack Info*\n\n` +
      `📝 *Title:* ${stickerSet.title}\n` +
      `🔑 *Name:* \`${fullName}\`\n` +
      `🎨 *Type:* ${type === 'custom_emoji' ? '💎 Custom Emoji' : '🗂 Sticker'}\n` +
      `📊 *Format:* ${formatLabel}\n` +
      `🔢 *Count:* ${count}/200\n` +
      `🔗 *Link:* ${getPackUrl(fullName)}\n\n` +
      `➕ Emoji ထပ်ထည့်ရန်: \`/add ${shortName}\`\n` +
      `🗑 Pack ဖျက်ရန်: \`/delete ${shortName}\``
    );
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    const errMsg = err.description || err.message || 'Unknown error';
    if (errMsg.includes('STICKERSET_INVALID') || errMsg.includes('not found')) {
      return ctx.replyWithMarkdown(`❌ Pack \`${fullName}\` မတွေ့ပါ။\n\nCreate လုပ်ရန်: \`/create ${shortName} Your Title\``);
    }
    await ctx.reply(`❌ Error: ${errMsg}`);
  }
}

module.exports = { listCommand, infoCommand };
