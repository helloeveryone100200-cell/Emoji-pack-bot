'use strict';

const db = require('../database/db');
const logger = require('../utils/logger');

async function statsCommand(ctx) {
  const stats = db.getStats();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  await ctx.replyWithMarkdown(
    `📊 *Bot Statistics*\n\n` +
    `👥 Total Users: *${stats.totalUsers}*\n` +
    `✅ Active: *${stats.activeUsers}*\n` +
    `⛔ Banned: *${stats.bannedUsers}*\n` +
    `📦 Packs Created: *${stats.totalPacksCreated}*\n\n` +
    `⏱ Uptime: *${hours}h ${minutes}m ${seconds}s*\n` +
    `🖥 Node.js: *${process.version}*\n` +
    `💾 Memory: *${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB*`
  );
}

async function broadcastCommand(ctx) {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) {
    return ctx.replyWithMarkdown('❌ *Usage:* `/broadcast <message>`');
  }

  const users = db.getAllUsers().filter(u => !u.banned);
  if (users.length === 0) {
    return ctx.reply('ℹ️ No users to broadcast to.');
  }

  const statusMsg = await ctx.reply(`📡 Broadcasting to ${users.length} users...`);
  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await ctx.telegram.sendMessage(user.userId, `📢 *Broadcast Message*\n\n${text}`, {
        parse_mode: 'Markdown',
      });
      success++;
      // Rate limiting: 30 messages/sec max
      await new Promise(r => setTimeout(r, 35));
    } catch {
      failed++;
    }
  }

  await ctx.telegram.editMessageText(
    ctx.chat.id,
    statusMsg.message_id,
    undefined,
    `✅ Broadcast complete!\n\n✅ Sent: ${success}\n❌ Failed: ${failed}`
  );

  logger.info(`Admin ${ctx.from.id} broadcast to ${success}/${users.length} users`);
}

async function banCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const targetId = parseInt(args[0]);
  if (!targetId) {
    return ctx.replyWithMarkdown('❌ *Usage:* `/ban <user_id>`');
  }

  db.banUser(targetId);
  await ctx.replyWithMarkdown(`⛔ User \`${targetId}\` banned.`);
  logger.info(`Admin ${ctx.from.id} banned user ${targetId}`);

  // Notify the banned user
  try {
    await ctx.telegram.sendMessage(targetId, '⛔ You have been banned from this bot.');
  } catch {}
}

async function unbanCommand(ctx) {
  const args = ctx.message.text.split(' ').slice(1);
  const targetId = parseInt(args[0]);
  if (!targetId) {
    return ctx.replyWithMarkdown('❌ *Usage:* `/unban <user_id>`');
  }

  db.unbanUser(targetId);
  await ctx.replyWithMarkdown(`✅ User \`${targetId}\` unbanned.`);
  logger.info(`Admin ${ctx.from.id} unbanned user ${targetId}`);

  try {
    await ctx.telegram.sendMessage(targetId, '✅ You have been unbanned. Welcome back!');
  } catch {}
}

async function usersCommand(ctx) {
  const users = db.getAllUsers();
  if (users.length === 0) {
    return ctx.reply('ℹ️ No users yet.');
  }

  const lines = users.slice(0, 50).map((u, i) => {
    const name = u.firstName || 'Unknown';
    const username = u.username ? `@${u.username}` : `ID: ${u.userId}`;
    const status = u.banned ? '⛔' : '✅';
    return `${status} ${i + 1}. ${name} (${username})`;
  });

  await ctx.replyWithMarkdown(
    `👥 *Users* (showing ${Math.min(users.length, 50)} of ${users.length})\n\n` +
    lines.join('\n')
  );
}

module.exports = { statsCommand, broadcastCommand, banCommand, unbanCommand, usersCommand };
