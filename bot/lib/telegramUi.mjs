import { Markup } from 'telegraf';

export const mainMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('\u{1F48C} Sevgini ulashing', 'menu:create')],
    [Markup.button.callback('\u{1F4E4} Ulashishlarim', 'menu:campaigns')],
    [Markup.button.callback('\u{1F4CA} Natijalarni ko\'rish', 'menu:results')],
    [Markup.button.callback('\u2139\uFE0F Yordam', 'menu:help')],
  ]);

export const campaignCreatedKeyboard = ({ campaignUrl, botStartUrl }) => {
  const rows = [];
  if (botStartUrl) {
    rows.push([Markup.button.url('\u{1F916} Telegram orqali ochish', botStartUrl)]);
  }
  rows.push([Markup.button.url('\u{1F496} To\'g\'ridan-to\'g\'ri ochish', campaignUrl)]);
  rows.push([Markup.button.callback('\u{1F4CA} Natijalarni ko\'rish', 'menu:results')]);
  return Markup.inlineKeyboard(rows);
};

export const incomingCampaignKeyboard = (campaignUrl) =>
  Markup.inlineKeyboard([
    [Markup.button.url('\u{1F339} Romantik sahifani ochish', campaignUrl)],
    [Markup.button.callback('\u2B05\uFE0F Asosiy menyu', 'menu:back')],
  ]);

export const campaignsKeyboard = (campaigns, mode = 'open') => {
  const rows = campaigns.slice(0, 12).map((campaign, index) => {
    const label = `${index + 1}. ${campaign.title}`.slice(0, 56);
    const prefix = mode === 'results' ? 'results:campaign:' : 'campaign:open:';
    return [Markup.button.callback(label, `${prefix}${campaign.slug}`)];
  });

  rows.push([Markup.button.callback('\u2B05\uFE0F Asosiy menyu', 'menu:back')]);
  return Markup.inlineKeyboard(rows);
};

export const sessionsKeyboard = (sessions) => {
  const rows = sessions.slice(0, 12).map((session, index) => {
    const label = `${index + 1}. ${session.id.slice(0, 8)} - ${session.completedAt ? 'Yakunlangan' : 'Jarayonda'}`;
    return [Markup.button.callback(label, `results:session:${session.id}`)];
  });

  rows.push([Markup.button.callback('\u2B05\uFE0F Asosiy menyu', 'menu:back')]);
  return Markup.inlineKeyboard(rows);
};
