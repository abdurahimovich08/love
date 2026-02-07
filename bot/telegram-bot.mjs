import 'dotenv/config';
import { Telegraf } from 'telegraf';
import {
  checkConnection,
  createCampaign,
  getConfigFromEnv,
  getSessionWithEvents,
  listCampaignsByOwner,
  listSessionsByCampaign,
} from './lib/supabaseStore.mjs';
import {
  campaignCreatedKeyboard,
  campaignsKeyboard,
  mainMenuKeyboard,
  sessionsKeyboard,
} from './lib/telegramUi.mjs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEB_APP_URL = (process.env.WEB_APP_URL || process.env.VERCEL_PUBLIC_URL || '').replace(/\/$/, '');

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN kiritilmagan.');
}

if (!WEB_APP_URL) {
  throw new Error('WEB_APP_URL kiritilmagan. Masalan: https://your-app.vercel.app');
}

const bot = new Telegraf(BOT_TOKEN);

const creatorState = new Map();

const buildCampaignLink = (slug) => `${WEB_APP_URL}/?campaign=${encodeURIComponent(slug)}`;

const resetCreator = (chatId) => {
  creatorState.delete(chatId);
};

const startCreatorFlow = async (ctx) => {
  const chatId = ctx.chat.id;
  creatorState.set(chatId, {
    step: 'partner_first_name',
    data: {
      ownerName: ctx.from?.first_name || 'Owner',
      ownerChatId: chatId,
      ownerUsername: ctx.from?.username || null,
    },
  });

  await ctx.reply(
    "1/4. Partner ismini kiriting (masalan: E'zoza):",
  );
};

const formatSummary = (detail) => {
  if (!detail) {
    return 'Session topilmadi.';
  }

  const { session, events } = detail;
  const summary = session.summary || {};
  const results = summary.results || {};

  const lines = [
    `🧾 Session: ${session.id}`,
    `🕒 Boshlangan: ${new Date(session.startedAt).toLocaleString()}`,
    `✅ Tugagan: ${session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Yo\'q'}`,
    `📍 Eventlar soni: ${events.length}`,
    '',
    'Natijalar:',
  ];

  if (results.nameGame) {
    lines.push(`- Ism o\'yini: ${results.nameGame.firstName || '-'} ${results.nameGame.lastName || '-'}`);
    lines.push(`  xato urinishlar: ${results.nameGame.wrongAttempts ?? 0}`);
  }

  if (results.qualitiesGame) {
    lines.push(`- Xarakter arxetipi: ${results.qualitiesGame.archetypeName || '-'}`);
  }

  if (results.dreamsGame?.wishes?.length) {
    lines.push(`- Tilaklar: ${results.dreamsGame.wishes.length} ta`);
  }

  if (results.favoritesGame?.favorites?.length) {
    lines.push(`- Sevimlilar: ${results.favoritesGame.favorites.length} ta`);
  }

  if (results.bestPersonGame) {
    lines.push(`- Final g\'olib: ${results.bestPersonGame.winnerName || '-'}`);
    lines.push(`  duel soni: ${results.bestPersonGame.totalDuels ?? 0}`);
  }

  if (results.proposal) {
    lines.push(`- Taklif: ${results.proposal.accepted ? 'Ha' : 'Yo\'q'}`);
    lines.push(`  yo\'q bosishlar: ${results.proposal.noClickCount ?? 0}`);
  }

  if (lines[lines.length - 1] === 'Natijalar:') {
    lines.push('- Hali summary yozilmagan.');
  }

  return lines.join('\n');
};

bot.start(async (ctx) => {
  await ctx.reply(
    "💘 Premium Love Bot\n\nBu bot orqali campaign yaratish, link ulashish va natijalarni ko\'rish mumkin.",
    mainMenuKeyboard(),
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    [
      'Buyruqlar:',
      '/start - asosiy menyu',
      '/create - yangi campaign yaratish',
      '/campaigns - campaignlarim',
      '/results - natijalarni ko\'rish',
      '/cancel - joriy creator jarayonini bekor qilish',
    ].join('\n'),
    mainMenuKeyboard(),
  );
});

bot.command('create', async (ctx) => {
  await startCreatorFlow(ctx);
});

bot.command('cancel', async (ctx) => {
  resetCreator(ctx.chat.id);
  await ctx.reply('Jarayon bekor qilindi.', mainMenuKeyboard());
});

bot.command('campaigns', async (ctx) => {
  const chatId = ctx.chat.id;
  const campaigns = await listCampaignsByOwner(chatId);
  if (!campaigns.length) {
    await ctx.reply('Sizda hali campaign yo\'q. /create bilan boshlang.', mainMenuKeyboard());
    return;
  }

  await ctx.reply('Campaignlar ro\'yxati:', campaignsKeyboard(campaigns, 'open'));
});

bot.command('results', async (ctx) => {
  const chatId = ctx.chat.id;
  const campaigns = await listCampaignsByOwner(chatId);
  if (!campaigns.length) {
    await ctx.reply('Natija ko\'rish uchun avval campaign yarating: /create', mainMenuKeyboard());
    return;
  }

  await ctx.reply('Qaysi campaign natijalarini ko\'rmoqchisiz?', campaignsKeyboard(campaigns, 'results'));
});

bot.action('menu:create', async (ctx) => {
  await ctx.answerCbQuery();
  await startCreatorFlow(ctx);
});

bot.action('menu:campaigns', async (ctx) => {
  await ctx.answerCbQuery();
  const chatId = ctx.chat.id;
  const campaigns = await listCampaignsByOwner(chatId);
  if (!campaigns.length) {
    await ctx.reply('Sizda hali campaign yo\'q. /create bilan boshlang.', mainMenuKeyboard());
    return;
  }

  await ctx.reply('Campaignlar ro\'yxati:', campaignsKeyboard(campaigns, 'open'));
});

bot.action('menu:results', async (ctx) => {
  await ctx.answerCbQuery();
  const campaigns = await listCampaignsByOwner(ctx.chat.id);
  if (!campaigns.length) {
    await ctx.reply('Sizda hali campaign yo\'q. /create bilan boshlang.', mainMenuKeyboard());
    return;
  }

  await ctx.reply('Qaysi campaign natijalarini ko\'rmoqchisiz?', campaignsKeyboard(campaigns, 'results'));
});

bot.action('menu:help', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    [
      'Ish tartibi:',
      '1) Campaign yarating',
      '2) Bot bergan linkni yuboring',
      '3) Foydalanuvchi o\'ynagach, natijani shu botdan ko\'ring',
      '',
      'Buyruqlar: /create /campaigns /results /cancel',
    ].join('\n'),
    mainMenuKeyboard(),
  );
});

bot.action('menu:back', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Asosiy menyu:', mainMenuKeyboard());
});

bot.action(/campaign:open:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const slug = ctx.match[1];
  const link = buildCampaignLink(slug);
  await ctx.reply(
    `🔗 Campaign link:\n${link}`,
    campaignCreatedKeyboard(link),
  );
});

bot.action(/results:campaign:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const slug = ctx.match[1];
  const sessions = await listSessionsByCampaign(slug);

  if (!sessions.length) {
    await ctx.reply('Bu campaign bo\'yicha hali session yo\'q.', mainMenuKeyboard());
    return;
  }

  await ctx.reply(`Campaign: ${slug}\nSessionlar:`, sessionsKeyboard(sessions));
});

bot.action(/results:session:(.+)/, async (ctx) => {
  await ctx.answerCbQuery();
  const sessionId = ctx.match[1];
  const detail = await getSessionWithEvents(sessionId);

  if (!detail) {
    await ctx.reply('Session topilmadi.', mainMenuKeyboard());
    return;
  }

  await ctx.reply(formatSummary(detail), mainMenuKeyboard());
});

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = creatorState.get(chatId);
  if (!state) {
    return;
  }

  const text = (ctx.message.text || '').trim();
  if (!text) {
    await ctx.reply('Matn kiriting.');
    return;
  }

  if (text.startsWith('/')) {
    return;
  }

  if (state.step === 'partner_first_name') {
    state.data.partnerFirstName = text;
    state.step = 'partner_last_name';
    creatorState.set(chatId, state);
    await ctx.reply('2/4. Partner familiyasini kiriting:');
    return;
  }

  if (state.step === 'partner_last_name') {
    state.data.partnerLastName = text;
    state.step = 'special_name';
    creatorState.set(chatId, state);
    await ctx.reply('3/4. Maxsus personaj nomi (bo\'sh qoldirmoqchi bo\'lsangiz "-") :');
    return;
  }

  if (state.step === 'special_name') {
    state.data.specialContestantName = text === '-' ? state.data.partnerFirstName : text;
    state.step = 'campaign_title';
    creatorState.set(chatId, state);
    await ctx.reply('4/4. Campaign nomini kiriting:');
    return;
  }

  if (state.step === 'campaign_title') {
    state.data.campaignTitle = text;

    const config = {
      partnerFirstName: state.data.partnerFirstName,
      partnerLastName: state.data.partnerLastName,
      myName: state.data.ownerName,
      specialContestantName: state.data.specialContestantName,
      campaignTitle: state.data.campaignTitle,
    };

    const created = await createCampaign({
      title: state.data.campaignTitle,
      ownerName: state.data.ownerName,
      ownerChatId: state.data.ownerChatId,
      ownerUsername: state.data.ownerUsername,
      config,
    });

    resetCreator(chatId);

    const campaignUrl = buildCampaignLink(created.slug);
    await ctx.reply(
      [
        '✅ Campaign yaratildi!',
        `📌 Nomi: ${created.title}`,
        `🆔 Slug: ${created.slug}`,
        '',
        `🔗 Link: ${campaignUrl}`,
      ].join('\n'),
      campaignCreatedKeyboard(campaignUrl),
    );

    return;
  }
});

bot.catch((error, ctx) => {
  console.error('Bot error:', error);
  void ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
});

const boot = async () => {
  const config = getConfigFromEnv();
  console.log('[bot] starting...');
  console.log('[bot] supabase:', config.SUPABASE_URL || '(missing)');
  console.log('[bot] tables:', config.tables);
  await checkConnection();
  await bot.launch();
  console.log('[bot] started');
};

void boot();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
