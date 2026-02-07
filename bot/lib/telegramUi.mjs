import { Markup } from 'telegraf';

export const mainMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✨ Yangi campaign', 'menu:create')],
    [Markup.button.callback('📁 Campaignlarim', 'menu:campaigns')],
    [Markup.button.callback('📊 Natijalarni ko\'rish', 'menu:results')],
    [Markup.button.callback('ℹ️ Yordam', 'menu:help')],
  ]);

export const campaignCreatedKeyboard = (campaignUrl) =>
  Markup.inlineKeyboard([
    [Markup.button.url('💖 Linkni ochish', campaignUrl)],
    [Markup.button.callback('📊 Natijalarni ko\'rish', 'menu:results')],
  ]);

export const campaignsKeyboard = (campaigns, mode = 'open') => {
  const rows = campaigns.slice(0, 12).map((campaign, index) => {
    const label = `${index + 1}. ${campaign.title}`.slice(0, 56);
    const prefix = mode === 'results' ? 'results:campaign:' : 'campaign:open:';
    return [Markup.button.callback(label, `${prefix}${campaign.slug}`)];
  });

  rows.push([Markup.button.callback('⬅️ Asosiy menyu', 'menu:back')]);
  return Markup.inlineKeyboard(rows);
};

export const sessionsKeyboard = (sessions) => {
  const rows = sessions.slice(0, 12).map((session, index) => {
    const label = `${index + 1}. ${session.id.slice(0, 8)} • ${session.completedAt ? 'Yakunlangan' : 'Jarayonda'}`;
    return [Markup.button.callback(label, `results:session:${session.id}`)];
  });

  rows.push([Markup.button.callback('⬅️ Asosiy menyu', 'menu:back')]);
  return Markup.inlineKeyboard(rows);
};
