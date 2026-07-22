'use strict';

const config = require('../config');

async function helpCommand(ctx) {
  const isAdmin = config.ADMIN_IDS.includes(ctx.from?.id);

  const text = `
📖 *Command List*

━━━━━━━━━━━━━━━━━━━
🎨 *Emoji Pack Commands:*

/create \`shortname\` \`title\`
  → Emoji pack အသစ် create လုပ်ရန်
  _Example: /create myfun My Fun Pack_

/add \`packname\`
  → Pack ထဲ emoji ထပ်ထည့်ရန် (ပြီးရင် image ပို့ပါ)
  _Example: /add myfun_

/list
  → သင် create လုပ်ထားသော pack list ကြည့်ရန်

/info \`packname\`
  → Pack details ကြည့်ရန်
  _Example: /info myfun_

/delete \`packname\`
  → Pack ဖျက်ရန် (confirm လုပ်ရပါမည်)

/cancel
  → လက်ရှိ action ကို cancel လုပ်ရန်

━━━━━━━━━━━━━━━━━━━
📌 *Rules:*
• Pack name: lowercase, numbers, underscore သာ
• Image: PNG/JPG/WebP (100×100 px အကောင်းဆုံး)
• Animated: TGS file တိုက်ရိုက် upload
• Video: WEBM file တိုက်ရိုက် upload
• Pack တစ်ခုထဲ emoji အများဆုံး 200 ခု

💎 Pack ကို Premium users များ emoji အဖြစ် သုံးနိုင်သည်
${isAdmin ? `
━━━━━━━━━━━━━━━━━━━
⚙️ *Admin Commands:*
/stats — Bot statistics
/broadcast — Message broadcast
/ban \`id\` — User ban
/unban \`id\` — User unban
/users — User list
` : ''}
━━━━━━━━━━━━━━━━━━━
❓ Problems? @support ဆက်သွယ်ပါ
  `.trim();

  await ctx.replyWithMarkdown(text);
}

module.exports = { helpCommand };
