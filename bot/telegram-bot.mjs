import dotenv from 'dotenv';
import { createServer } from 'node:http';
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
  incomingCampaignKeyboard,
  mainMenuKeyboard,
  sessionsKeyboard,
} from './lib/telegramUi.mjs';

dotenv.config({ path: '.env.bot' });
dotenv.config({ path: '.env.local' });
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEB_APP_URL = (process.env.WEB_APP_URL || process.env.VERCEL_PUBLIC_URL || '').replace(/\/$/, '');
const BOT_MODE = (process.env.BOT_MODE || (process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL ? 'webhook' : 'polling')).toLowerCase();
const IS_WEBHOOK_MODE = BOT_MODE === 'webhook';
const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_BASE_URL = (process.env.BOT_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const WEBHOOK_PATH = process.env.BOT_WEBHOOK_PATH || `/telegram/webhook/${BOT_TOKEN}`;
let BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN kiritilmagan.');
}

if (!WEB_APP_URL) {
  throw new Error('WEB_APP_URL kiritilmagan. Masalan: https://your-app.vercel.app');
}

if (IS_WEBHOOK_MODE && !WEBHOOK_BASE_URL) {
  throw new Error('Webhook rejimida BOT_WEBHOOK_URL yoki RENDER_EXTERNAL_URL kiritilishi shart.');
}

const bot = new Telegraf(BOT_TOKEN);
const creatorState = new Map();

const START_INFO = [
  '\u{1F49E} Romantik Creator Bot',
  '',
  'Bot nima qiladi:',
  '1) Sevgiga mos sahifa (ulashish) yaratadi',
  '2) Sizga ulashish linkini beradi',
  '3) O\'ynaganlarning natijasini ko\'rsatadi',
  '',
  'Boshlash uchun: \u{1F48C} Sevgini ulashing tugmasini bosing yoki /create yozing.',
].join('\n');

const buildCampaignLink = (slug) => `${WEB_APP_URL}/?campaign=${encodeURIComponent(slug)}`;

const buildBotStartLink = (slug) => {
  if (!BOT_USERNAME) {
    return null;
  }
  const payload = `campaign_${slug}`;
  return `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
};

const buildShareLinks = (slug) => ({
  campaignUrl: buildCampaignLink(slug),
  botStartUrl: buildBotStartLink(slug),
});

const sanitizeImageSource = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === '-') {
    return '';
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    return '';
  }

  return '';
};

const getStartPayload = (ctx) => {
  if (typeof ctx.startPayload === 'string' && ctx.startPayload.trim()) {
    return ctx.startPayload.trim();
  }

  const text = ctx.message?.text || '';
  const parts = text.trim().split(/\s+/);
  if (parts.length < 2) {
    return '';
  }

  const rawPayload = parts.slice(1).join(' ').trim();
  if (!rawPayload) {
    return '';
  }

  try {
    return decodeURIComponent(rawPayload);
  } catch {
    return rawPayload;
  }
};

const parseCampaignSlugFromStartPayload = (payload) => {
  if (!payload || !payload.startsWith('campaign_')) {
    return null;
  }

  const slug = payload.slice('campaign_'.length).trim().toLowerCase();
  if (!slug) {
    return null;
  }

  return /^[a-z0-9-]+$/.test(slug) ? slug : null;
};

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

  await ctx.reply("1/5. Partner ismini kiriting (masalan: E'zoza):");
};

const formatSummary = (detail) => {
  if (!detail) {
    return 'Session topilmadi.';
  }

  const { session, events } = detail;
  const summary = session.summary || {};
  const results = summary.results || {};

  const lines = [
    `\u{1F9FE} Session: ${session.id}`,
    `\u{1F552} Boshlangan: ${new Date(session.startedAt).toLocaleString()}`,
    `\u2705 Tugagan: ${session.completedAt ? new Date(session.completedAt).toLocaleString() : 'Yo\'q'}`,
    `\u{1F4CD} Eventlar soni: ${events.length}`,
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

const setupHandlers = () => {
  bot.start(async (ctx) => {
    const payload = getStartPayload(ctx);
    const campaignSlug = parseCampaignSlugFromStartPayload(payload);

    if (campaignSlug) {
      const { campaignUrl } = buildShareLinks(campaignSlug);
      await ctx.reply(
        [
          '\u{1F48C} Sizga maxsus romantik ulashish yuborilgan!',
          `\u{1F194} Ulashish kodi: ${campaignSlug}`,
          '',
          'Quyidagi tugma orqali kampaniyani oching:',
        ].join('\n'),
        incomingCampaignKeyboard(campaignUrl),
      );
      return;
    }

    await ctx.reply(START_INFO, mainMenuKeyboard());
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      [
        'Ish tartibi:',
        '1) Sevgiga mos ulashish yaratasiz',
        '2) Bot sizga ulashish linkini beradi',
        '3) Qabul qilgan odam o\'ynaydi',
        '4) Siz natijani shu botdan ko\'rasiz',
        '',
        'Buyruqlar:',
        '/start - asosiy menyu',
        '/create - sevgini ulashishni yaratish (maxsus rasm bilan)',
        '/campaigns - ulashishlarim',
        '/results - natijalarni ko\'rish',
        '/cancel - joriy jarayonni bekor qilish',
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
      await ctx.reply('Sizda hali ulashish yo\'q. /create bilan boshlang.', mainMenuKeyboard());
      return;
    }

    await ctx.reply('\u{1F4E4} Ulashishlar ro\'yxati:', campaignsKeyboard(campaigns, 'open'));
  });

  bot.command('results', async (ctx) => {
    const chatId = ctx.chat.id;
    const campaigns = await listCampaignsByOwner(chatId);
    if (!campaigns.length) {
      await ctx.reply('Natija ko\'rish uchun avval ulashish yarating: /create', mainMenuKeyboard());
      return;
    }

    await ctx.reply('Qaysi ulashish natijalarini ko\'rmoqchisiz?', campaignsKeyboard(campaigns, 'results'));
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
      await ctx.reply('Sizda hali ulashish yo\'q. /create bilan boshlang.', mainMenuKeyboard());
      return;
    }

    await ctx.reply('\u{1F4E4} Ulashishlar ro\'yxati:', campaignsKeyboard(campaigns, 'open'));
  });

  bot.action('menu:results', async (ctx) => {
    await ctx.answerCbQuery();
    const campaigns = await listCampaignsByOwner(ctx.chat.id);
    if (!campaigns.length) {
      await ctx.reply('Sizda hali ulashish yo\'q. /create bilan boshlang.', mainMenuKeyboard());
      return;
    }

    await ctx.reply('Qaysi ulashish natijalarini ko\'rmoqchisiz?', campaignsKeyboard(campaigns, 'results'));
  });

  bot.action('menu:help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      [
        'Premium ishlash tartibi:',
        '1) Ulashish yarating',
        '2) Telegram deep-linkni ulashing',
        '3) Qabul qiluvchi linkni bossa botga keladi',
        '4) Bot uni aniq o\'sha ulashish sahifasiga yo\'naltiradi',
        '5) Natijani /results orqali kuzatasiz',
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
    const links = buildShareLinks(slug);

    await ctx.reply(
      [
        '\u{1F49E} Ulashish havolalari tayyor!',
        `\u{1F916} Telegram orqali ochish: ${links.botStartUrl || '(bot username aniqlanmadi)'}`,
        `\u{1F310} To\'g\'ridan-to\'g\'ri ochish: ${links.campaignUrl}`,
      ].join('\n'),
      campaignCreatedKeyboard(links),
    );
  });

  bot.action(/results:campaign:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const slug = ctx.match[1];
    const sessions = await listSessionsByCampaign(slug);

    if (!sessions.length) {
      await ctx.reply('Bu ulashish bo\'yicha hali session yo\'q.', mainMenuKeyboard());
      return;
    }

    await ctx.reply(`Ulashish: ${slug}\nSessionlar:`, sessionsKeyboard(sessions));
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
      await ctx.reply('2/5. Partner familiyasini kiriting:');
      return;
    }

    if (state.step === 'partner_last_name') {
      state.data.partnerLastName = text;
      state.step = 'special_name';
      creatorState.set(chatId, state);
      await ctx.reply('3/5. Maxsus personaj nomi (bo\'sh qoldirmoqchi bo\'lsangiz "-") :');
      return;
    }

    if (state.step === 'special_name') {
      state.data.specialContestantName = text === '-' ? state.data.partnerFirstName : text;
      state.step = 'special_image_url';
      creatorState.set(chatId, state);
      await ctx.reply('4/5. Maxsus personaj rasmi linkini kiriting (https://... yoki /battle-images/...). O\'tkazib yuborish uchun "-" yozing:');
      return;
    }

    if (state.step === 'special_image_url') {
      state.data.specialContestantImage = sanitizeImageSource(text);
      state.step = 'campaign_title';
      creatorState.set(chatId, state);
      await ctx.reply('5/5. Ulashish nomini kiriting (masalan: Sevgini ulashing \u{1F496}). "-" yozsangiz avtomatik nom beriladi:');
      return;
    }

    if (state.step === 'campaign_title') {
      const defaultTitle = `Sevgini ulashing - ${state.data.partnerFirstName}`;
      state.data.campaignTitle = text === '-' ? defaultTitle : text;

      const config = {
        partnerFirstName: state.data.partnerFirstName,
        partnerLastName: state.data.partnerLastName,
        myName: state.data.ownerName,
        specialContestantName: state.data.specialContestantName,
        specialContestantImage: state.data.specialContestantImage || '',
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

      const links = buildShareLinks(created.slug);
      await ctx.reply(
        [
          '\u2705 Ulashish yaratildi!',
          `\u{1F496} Nomi: ${created.title}`,
          `\u{1F194} Slug: ${created.slug}`,
          '',
          `\u{1F916} Telegram havola: ${links.botStartUrl || '(bot username aniqlanmadi)'}`,
          `\u{1F310} Web havola: ${links.campaignUrl}`,
        ].join('\n'),
        campaignCreatedKeyboard(links),
      );
    }
  });

  bot.catch((error, ctx) => {
    console.error('Bot error:', error);
    void ctx.reply('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  });
};

const setupBotCommands = async () => {
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Bot tavsifi va menyu' },
    { command: 'create', description: 'Sevgini ulashish + maxsus rasm' },
    { command: 'campaigns', description: 'Ulashishlarim' },
    { command: 'results', description: 'Natijalarni ko\'rish' },
    { command: 'cancel', description: 'Joriy jarayonni bekor qilish' },
  ]);
};

const launchPolling = async () => {
  await bot.launch();
  console.log('[bot] mode: polling');
};

const launchWebhook = async () => {
  const webhookUrl = `${WEBHOOK_BASE_URL}${WEBHOOK_PATH}`;
  const webhookHandler = bot.webhookCallback(WEBHOOK_PATH);

  await bot.telegram.setWebhook(webhookUrl, { drop_pending_updates: true });

  const server = createServer((req, res) => {
    const requestPath = (req.url || '').split('?')[0];

    if (requestPath === '/' || requestPath === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, mode: 'webhook' }));
      return;
    }

    if (req.method === 'POST' && requestPath === WEBHOOK_PATH) {
      webhookHandler(req, res);
      return;
    }

    res.statusCode = 404;
    res.end('Not found');
  });

  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });

  const shutdown = async (signal) => {
    console.log(`[bot] stopping: ${signal}`);
    try {
      await bot.telegram.deleteWebhook();
    } catch {
      // noop
    }
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  console.log('[bot] mode: webhook');
  console.log('[bot] webhook url:', webhookUrl);
  console.log('[bot] health:', `${WEBHOOK_BASE_URL}/health`);
};

const boot = async () => {
  const config = getConfigFromEnv();
  console.log('[bot] starting...');
  console.log('[bot] supabase:', config.SUPABASE_URL || '(missing)');
  console.log('[bot] tables:', config.tables);
  console.log('[bot] web app:', WEB_APP_URL);

  const me = await bot.telegram.getMe();
  if (!BOT_USERNAME && me?.username) {
    BOT_USERNAME = me.username;
  }
  console.log('[bot] username:', BOT_USERNAME ? `@${BOT_USERNAME}` : '(missing)');

  await checkConnection();
  setupHandlers();
  await setupBotCommands();

  if (IS_WEBHOOK_MODE) {
    await launchWebhook();
    return;
  }

  await launchPolling();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

void boot();
