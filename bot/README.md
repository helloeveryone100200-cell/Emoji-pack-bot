# 💎 Premium Emoji Pack Creator Bot

Telegram Premium users များအတွက် custom animated emoji pack create လုပ်ပေးနိုင်သော advanced Telegram bot။

---

## 🚀 Features

- 📦 Custom emoji pack create / delete
- ➕ Emoji add (PNG, JPG, WebP, TGS animated, WEBM video)
- 🖼 Auto image → WebP 100×100 conversion
- 📋 Pack info / link share
- ⚙️ Admin panel (stats, broadcast, ban/unban)
- 🏥 Health check HTTP server (UptimeRobot compatible)
- 🔒 User ban system

---

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/start` | Bot ကို စတင်သုံးရန် |
| `/help` | Command list ကြည့်ရန် |
| `/create <name> <title>` | Emoji pack အသစ် create |
| `/add <packname>` | Pack ထဲ emoji ထည့်ရန် |
| `/info <packname>` | Pack details ကြည့်ရန် |
| `/delete <packname>` | Pack ဖျက်ရန် |
| `/list` | Pack guide |
| `/cancel` | လက်ရှိ action cancel |
| `/ping` | Bot alive check |

**Admin Only:**

| Command | Description |
|---------|-------------|
| `/stats` | Bot statistics |
| `/broadcast <msg>` | All users ထံ message |
| `/ban <user_id>` | User ban |
| `/unban <user_id>` | User unban |
| `/users` | User list |

---

## ⚙️ Setup

### 1. BotFather မှ bot create

1. [@BotFather](https://t.me/BotFather) ကိုဖွင့်ပြီး `/newbot` command ပို့ပါ
2. Bot name နဲ့ username ထည့်ပါ
3. Bot token ကို copy ထားပါ

### 2. GitHub push

```bash
git init
git add .
git commit -m "Initial bot setup"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 3. Render Deploy

1. [render.com](https://render.com) ဝင်ပြီး **New → Web Service** ကိုနှိပ်ပါ
2. GitHub repo ကို connect လုပ်ပါ
3. Settings:
   - **Root Directory:** `bot`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/index.js`
   - **Instance Type:** Free

4. **Environment Variables** ထည့်ပါ:

| Key | Value |
|-----|-------|
| `BOT_TOKEN` | BotFather မှ ရသော token |
| `ADMIN_IDS` | သင်၏ Telegram user ID (comma-separated) |
| `WEBHOOK_URL` | Render service URL (deploy ပြီးမှ ရမည်) |
| `NODE_ENV` | `production` |

5. **Deploy** နှိပ်ပါ → Logs မှ URL ကို ကူးထားပါ

### 4. WEBHOOK_URL update

Render logs မှ URL (e.g. `https://my-bot.onrender.com`) ကို copy ပြီး:
- Render → Environment → `WEBHOOK_URL` ထဲ paste လုပ်ပါ
- **Save Changes** → Auto redeploy ဖြစ်မည်

### 5. UptimeRobot Setup (Always On)

1. [uptimerobot.com](https://uptimerobot.com) ဝင်ပါ
2. **Add New Monitor:**
   - Type: `HTTP(s)`
   - URL: `https://your-bot.onrender.com/health`
   - Interval: `5 minutes`
3. Save → Bot always running ဖြစ်မည်

---

## 📁 Project Structure

```
bot/
├── src/
│   ├── index.js          # Entry point
│   ├── bot.js            # Telegraf bot setup
│   ├── config.js         # Environment config
│   ├── server.js         # Express health check server
│   ├── database/
│   │   └── db.js         # In-memory storage
│   ├── commands/
│   │   ├── index.js      # Command registry
│   │   ├── start.js      # /start
│   │   ├── help.js       # /help
│   │   ├── create.js     # /create
│   │   ├── add.js        # /add
│   │   ├── list.js       # /list
│   │   ├── delete.js     # /delete
│   │   └── admin.js      # Admin commands
│   ├── middleware/
│   │   └── auth.js       # Ban check, admin guard
│   └── utils/
│       ├── sticker.js    # Sticker/emoji utilities
│       └── logger.js     # Winston logger
├── .env.example          # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ Yes | Telegram Bot Token |
| `ADMIN_IDS` | ✅ Yes | Admin user IDs (comma-separated) |
| `PORT` | Auto | Render sets this automatically |
| `WEBHOOK_URL` | Recommended | Render service URL |
| `NODE_ENV` | Optional | `production` or `development` |
| `LOG_LEVEL` | Optional | `info`, `debug`, `error` |

---

## 💎 Premium Emoji Notes

- Custom emoji ကို **Telegram Premium users** မှသာ message ထဲ သုံးနိုင်သည်
- Emoji size: **100×100 pixels** (bot မှ auto-resize)
- Formats: Static (WebP), Animated (TGS), Video (WEBM)
- Pack တစ်ခုထဲ emoji **အများဆုံး 200 ခု** ထည့်နိုင်သည်
- Pack link: `https://t.me/addemoji/<packname>_by_<botusername>`

---

## 🛠 Local Development

```bash
cd bot
cp .env.example .env
# .env ထဲ BOT_TOKEN နဲ့ ADMIN_IDS ထည့်ပါ
npm install
npm run dev
```
