'use strict';

const { Markup } = require('telegraf');
const config = require('../config');

async function startCommand(ctx) {
  const user = ctx.from;
  const isAdmin = config.ADMIN_IDS.includes(user.id);

  const text = `
✨ *Premium Emoji Pack Creator Bot*

👋 မင်္ဂလာပါ, *${user.first_name}*!

Telegram Premium Emoji Pack တွေကို လွယ်ကူစွာ create လုပ်နိုင်ပါတယ်။

━━━━━━━━━━━━━━━━━━━
🎯 *Bot Features:*
• ✅ Custom emoji pack create လုပ်ခြင်း
• ✅ Emoji add / remove လုပ်ခြင်း
• ✅ Pack list ကြည့်ခြင်း
• ✅ Pack link share လုပ်ခြင်း
• ✅ Image → WebP auto-convert

💎 *Premium users* တွေ emoji react နဲ့ message ထဲ သုံးနိုင်သည်။

/help — Full command list ကြည့်ရန်
  `.trim();

  const buttons = Markup.inlineKeyboard([
    [
      Markup.button.callback('📦 Create Pack', 'btn_create'),
      Markup.button.callback('📋 My Packs', 'btn_list'),
    ],
    [
      Markup.button.callback('❓ Help', 'btn_help'),
      ...(isAdmin ? [Markup.button.callback('⚙️ Admin', 'btn_admin')] : []),
    ],
  ]);

  await ctx.replyWithMarkdown(text, buttons);
}

async function handleBtnCreate(ctx) {
  await ctx.answerCbQuery();
  await ctx.replyWithMarkdown(
    '📦 *Pack Create လုပ်ရန်:*\n\n`/create <shortname> <title>`\n\n*Example:*\n`/create mypack My Emoji Pack`\n\n⚠️ shortname: lowercase letters, numbers, underscore သာ သုံးနိုင်သည်'
  );
}

async function handleBtnList(ctx) {
  await ctx.answerCbQuery();
  await ctx.reply('📋 /list command သုံးပြီး သင့် pack list ကြည့်ပါ။');
}

async function handleBtnHelp(ctx) {
  await ctx.answerCbQuery();
  const { helpCommand } = require('./help');
  await helpCommand(ctx);
}

async function handleBtnAdmin(ctx) {
  await ctx.answerCbQuery();
  if (!config.ADMIN_IDS.includes(ctx.from.id)) return;
  await ctx.replyWithMarkdown(
    '⚙️ *Admin Commands:*\n\n/stats — Bot statistics\n/broadcast — All users ထံ message ပို့ခြင်း\n/ban \\<user\\_id\\> — User ban\n/unban \\<user\\_id\\> — User unban\n/users — User list'
  );
}

module.exports = { startCommand, handleBtnCreate, handleBtnList, handleBtnHelp, handleBtnAdmin };
