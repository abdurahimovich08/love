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
const MAX_SPECIAL_IMAGE_BYTES = Number(process.env.MAX_SPECIAL_IMAGE_BYTES || 1200000);
const TELEGRAM_WEBAPP_BUTTON_TEXT = process.env.TELEGRAM_WEBAPP_BUTTON_TEXT || 'Love App';

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

const pickUploadPhoto = (photos) => {
  const ordered = [...photos].sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
  return (
    ordered.find((photo) => typeof photo.file_size !== 'number' || photo.file_size <= MAX_SPECIAL_IMAGE_BYTES) || null
  );
};

const loadTelegramPhotoAsDataUrl = async (fileId) => {
  const file = await bot.telegram.getFile(fileId);
  if (!file?.file_path) {
    throw new Error('Rasm fayli topilmadi.');
  }

  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error('Rasmni yuklab bo\'lmadi.');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_SPECIAL_IMAGE_BYTES) {
    throw new Error(`Rasm juda katta. ${Math.floor(MAX_SPECIAL_IMAGE_BYTES / 1024)}KB dan kichik rasm yuboring.`);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  return `data:${contentType};base64,${buffer.toString('base64')}`;
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

const finishCreatorFlow = async (ctx, state) => {
  const chatId = ctx.chat.id;
  const defaultTitle = `Sevgini ulashing - ${state.data.partnerFirstName}`;
  const campaignTitle = (state.data.campaignTitle || '').trim() || defaultTitle;

  const config = {
    partnerFirstName: state.data.partnerFirstName,
    partnerLastName: state.data.partnerLastName,
    myName: state.data.ownerName,
    specialContestantName: state.data.specialContestantName,
    specialContestantImage: state.data.specialContestantImage || '',
    campaignTitle,
  };

  const created = await createCampaign({
    title: campaignTitle,
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
};

const asRecord = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value;
};

const oneLine = (value, max = 180) => {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1)}…`;
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
    'To\'liq natijalar:',
  ];

  if (results.nameGame) {
    lines.push('');
    lines.push('1) Ism o\'yini');
    lines.push(`- Topilgan ism: ${results.nameGame.firstName || '-'} ${results.nameGame.lastName || '-'}`);
    lines.push(`- Xato urinishlar: ${results.nameGame.wrongAttempts ?? 0}`);
    lines.push(`- Jami urinishlar: ${results.nameGame.totalAttempts ?? 0}`);
  }

  if (results.qualitiesGame) {
    const qualities = results.qualitiesGame;
    const traitScores = asRecord(qualities.traitScores);
    const answers = asRecord(qualities.answers);
    const selectedChoices = asRecord(qualities.selectedChoices);
    const diaryEntries = asRecord(qualities.diaryEntries);
    const questionKeys = Array.from(
      new Set([...Object.keys(answers), ...Object.keys(selectedChoices), ...Object.keys(diaryEntries)]),
    ).sort((a, b) => Number(a) - Number(b));

    lines.push('');
    lines.push('2) Xarakter o\'yini');
    lines.push(`- Arxetip: ${qualities.archetypeName || '-'}`);
    if (Object.keys(traitScores).length) {
      const scoreLine = Object.entries(traitScores)
        .sort(([, a], [, b]) => Number(b) - Number(a))
        .map(([trait, score]) => `${trait}:${score}`)
        .join(', ');
      lines.push(`- Ballar: ${scoreLine}`);
    }

    if (questionKeys.length) {
      lines.push('- Tanlangan variantlar:');
      questionKeys.forEach((key) => {
        const questionNo = Number(key) + 1;
        const choiceId = selectedChoices[key] ?? '-';
        const trait = answers[key] ?? '-';
        lines.push(`  ${questionNo}) tanlov=${choiceId}, trait=${trait}`);

        const diary = oneLine(diaryEntries[key] ?? '', 220);
        if (diary) {
          lines.push(`     yozuv: "${diary}"`);
        }
      });
    }
  }

  if (results.dreamsGame?.wishes?.length) {
    lines.push('');
    lines.push('3) Tilaklar');
    results.dreamsGame.wishes.forEach((wish, index) => {
      const title = wish.title || wish.wishId || `Tilak ${index + 1}`;
      const text = oneLine(wish.text || '', 220) || '(matn yozilmagan)';
      lines.push(`  ${index + 1}) ${title}: ${text}`);
    });
  }

  if (results.favoritesGame?.favorites?.length) {
    lines.push('');
    lines.push('4) Sevimlilar');
    results.favoritesGame.favorites.forEach((item, index) => {
      const categoryName = item.categoryName || item.categoryId || `Kategoriya ${index + 1}`;
      const value = oneLine(item.value || '', 220) || '(yozilmagan)';
      lines.push(`  ${index + 1}) ${categoryName}: ${value}`);
    });
  }

  if (results.bestPersonGame) {
    const battle = results.bestPersonGame;
    const duelHistory = Array.isArray(battle.duelHistory) ? battle.duelHistory : [];
    const duelEvents = events.filter((event) => event.eventType === 'battle_duel_selected');

    lines.push('');
    lines.push('5) Battle natijalari');
    lines.push(`- Final g\'olib: ${battle.winnerName || battle.winnerId || '-'}`);
    lines.push(`- Duel soni: ${battle.totalDuels ?? duelHistory.length}`);
    lines.push(`- Finalda rad etishlar: ${battle.finalMissCount ?? 0}`);

    if (duelHistory.length) {
      lines.push('- Duel tarixchasi:');
      duelHistory.forEach((duel, index) => {
        const eventPayload = asRecord(duelEvents[index]?.payload);
        const pickedName = oneLine(eventPayload.pickedName || '', 80);
        const winnerName = oneLine(eventPayload.winnerName || '', 80);
        const pickedText = pickedName ? `${pickedName} (${duel.pickedId})` : duel.pickedId;
        const winnerText = winnerName ? `${winnerName} (${duel.winnerId})` : duel.winnerId;
        lines.push(
          `  ${index + 1}) [${duel.phase}] ${duel.leftId} vs ${duel.rightId} -> tanlov: ${pickedText}, g'olib: ${winnerText}`,
        );
        if (duel.interventionStage) {
          lines.push(`     intervention bosqichi: ${duel.interventionStage}`);
        }
      });
    }
  }

  if (results.proposal) {
    lines.push('');
    lines.push('6) Yakuniy taklif');
    lines.push(`- Javob: ${results.proposal.accepted ? 'Ha' : 'Yo\'q'}`);
    lines.push(`- "Yo\'q" bosishlar: ${results.proposal.noClickCount ?? 0}`);
  }

  if (lines[lines.length - 1] === 'To\'liq natijalar:') {
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
      state.step = 'campaign_title';
      creatorState.set(chatId, state);
      await ctx.reply('4/5. Ulashish nomini kiriting (masalan: Sevgini ulashing \u{1F496}). "-" yozsangiz avtomatik nom beriladi:');
      return;
    }

    if (state.step === 'campaign_title') {
      const defaultTitle = `Sevgini ulashing - ${state.data.partnerFirstName}`;
      state.data.campaignTitle = text === '-' ? defaultTitle : text;
      state.step = 'special_image_upload';
      creatorState.set(chatId, state);
      await ctx.reply(
        '5/5. Endi sevgilingiz rasmini yuboring (photo). Rasm qo\'shmaslik uchun "-" yozing, link kiritmoqchi bo\'lsangiz ham bo\'ladi.',
      );
      return;
    }

    if (state.step === 'special_image_upload') {
      if (text === '-') {
        state.data.specialContestantImage = '';
        creatorState.set(chatId, state);
        await finishCreatorFlow(ctx, state);
        return;
      }

      const normalized = sanitizeImageSource(text);
      if (normalized) {
        state.data.specialContestantImage = normalized;
        creatorState.set(chatId, state);
        await finishCreatorFlow(ctx, state);
        return;
      }

      await ctx.reply('Iltimos photo yuboring. Yoki rasm qo\'shmaslik uchun "-" yozing.');
    }
  });

  bot.on('photo', async (ctx) => {
    const chatId = ctx.chat.id;
    const state = creatorState.get(chatId);
    if (!state || state.step !== 'special_image_upload') {
      return;
    }

    const photos = ctx.message.photo || [];
    if (!photos.length) {
      await ctx.reply('Rasm topilmadi. Iltimos, qayta yuboring.');
      return;
    }

    const pickedPhoto = pickUploadPhoto(photos);
    if (!pickedPhoto) {
      await ctx.reply(`Rasm juda katta. ${Math.floor(MAX_SPECIAL_IMAGE_BYTES / 1024)}KB dan kichik rasm yuboring.`);
      return;
    }

    try {
      const dataUrl = await loadTelegramPhotoAsDataUrl(pickedPhoto.file_id);
      state.data.specialContestantImage = dataUrl;
      creatorState.set(chatId, state);
      await ctx.reply('\u{1F4F8} Rasm qabul qilindi. Ulashishni yakunlayapman...');
      await finishCreatorFlow(ctx, state);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rasmni qayta yuborib ko\'ring.';
      await ctx.reply(message);
    }
  });

  bot.on('document', async (ctx) => {
    const chatId = ctx.chat.id;
    const state = creatorState.get(chatId);
    if (!state || state.step !== 'special_image_upload') {
      return;
    }

    const document = ctx.message.document;
    const mimeType = document?.mime_type || '';
    if (!mimeType.startsWith('image/')) {
      await ctx.reply('Faqat rasm fayl yuboring. Yoki "-" deb yozib rasmni o\'tkazib yuboring.');
      return;
    }

    if (typeof document.file_size === 'number' && document.file_size > MAX_SPECIAL_IMAGE_BYTES) {
      await ctx.reply(`Rasm juda katta. ${Math.floor(MAX_SPECIAL_IMAGE_BYTES / 1024)}KB dan kichik rasm yuboring.`);
      return;
    }

    try {
      const dataUrl = await loadTelegramPhotoAsDataUrl(document.file_id);
      state.data.specialContestantImage = dataUrl;
      creatorState.set(chatId, state);
      await ctx.reply('\u{1F4F8} Rasm qabul qilindi. Ulashishni yakunlayapman...');
      await finishCreatorFlow(ctx, state);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rasmni qayta yuborib ko\'ring.';
      await ctx.reply(message);
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

const setupChatMenuButton = async () => {
  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: TELEGRAM_WEBAPP_BUTTON_TEXT,
      web_app: { url: WEB_APP_URL },
    },
  });
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
  try {
    await setupChatMenuButton();
  } catch (error) {
    console.warn('[bot] menu button setup failed. Check BotFather /setdomain and Web App URL.', error);
  }

  if (IS_WEBHOOK_MODE) {
    await launchWebhook();
    return;
  }

  await launchPolling();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

void boot();
