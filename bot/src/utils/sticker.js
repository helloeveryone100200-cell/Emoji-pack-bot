'use strict';

const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger');

const EMOJI_SIZE = 100; // Telegram custom emoji: 100x100
const STICKER_SIZE = 512; // Regular sticker: 512x512

/**
 * Download file from Telegram and return buffer
 */
async function downloadTelegramFile(bot, fileId) {
  const file = await bot.telegram.getFile(fileId);
  const url = `https://api.telegram.org/file/bot${bot.token || process.env.BOT_TOKEN}/${file.file_path}`;
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return { buffer: Buffer.from(response.data), filePath: file.file_path };
}

/**
 * Convert image buffer → WebP at given size (100 for emoji, 512 for sticker)
 */
async function convertToWebP(inputBuffer, size = EMOJI_SIZE) {
  return sharp(inputBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ lossless: true, quality: 100 })
    .toBuffer();
}

/**
 * Convert image buffer → PNG at given size (for preview thumbnails)
 */
async function convertToPNG(inputBuffer, size = 100) {
  return sharp(inputBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/**
 * Detect file type from buffer magic bytes
 */
function detectFileType(buffer) {
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) return 'tgs'; // gzip = TGS animated
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return 'webm'; // RIFF = might be WebM
  if (buffer[0] === 0x1a && buffer[1] === 0x45) return 'webm'; // EBML = WebM
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpeg';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'gif';
  if (buffer[0] === 0x52 && buffer[2] === 0x45) return 'webp'; // RIFF+WEBP
  return 'unknown';
}

/**
 * Build InputSticker object for Telegram API
 * format: 'static' | 'animated' | 'video'
 */
function buildInputSticker(webpBuffer, emojiList = ['⭐']) {
  return {
    sticker: { source: webpBuffer },
    emoji_list: emojiList,
    format: 'static',
  };
}

/**
 * Upload sticker file via multipart form and return file_id
 */
async function uploadStickerFile(botToken, userId, buffer, format = 'static') {
  const form = new FormData();
  form.append('user_id', userId);
  form.append('sticker_format', format);
  form.append('sticker', buffer, {
    filename: format === 'animated' ? 'sticker.tgs' : format === 'video' ? 'sticker.webm' : 'sticker.webp',
    contentType: format === 'animated' ? 'application/x-tgsticker'
      : format === 'video' ? 'video/webm'
      : 'image/webp',
  });

  const response = await axios.post(
    `https://api.telegram.org/bot${botToken}/uploadStickerFile`,
    form,
    { headers: form.getHeaders() }
  );

  if (!response.data.ok) {
    throw new Error(response.data.description || 'Failed to upload sticker');
  }
  return response.data.result.file_id;
}

/**
 * Sanitize pack short name: lowercase alphanum + underscore, max 64 chars
 */
function sanitizePackName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

/**
 * Build full sticker set name: <name>_by_<botusername>
 */
function buildPackName(shortName, botUsername) {
  return `${sanitizePackName(shortName)}_by_${botUsername}`;
}

/**
 * Get sticker set URL
 */
function getPackUrl(fullName) {
  return `https://t.me/addemoji/${fullName}`;
}

module.exports = {
  downloadTelegramFile,
  convertToWebP,
  convertToPNG,
  detectFileType,
  buildInputSticker,
  uploadStickerFile,
  sanitizePackName,
  buildPackName,
  getPackUrl,
  EMOJI_SIZE,
  STICKER_SIZE,
};
