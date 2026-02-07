const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const TABLES = {
  campaigns: 'love_campaigns',
  sessions: 'love_sessions',
  events: 'love_session_events',
};

const toIsoNow = () => new Date().toISOString();

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toSlug = (value) => {
  const trimmed = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${trimmed || 'campaign'}-${suffix}`;
};

const ensureConfigured = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_KEY not configured');
  }
};

const remoteRequest = async (path, init = {}) => {
  ensureConfigured();

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
};

const mapCampaign = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  ownerName: row.owner_name,
  ownerChatId: row.owner_chat_id || null,
  ownerUsername: row.owner_username || null,
  config: row.config || {},
  createdAt: row.created_at || toIsoNow(),
});

const mapSession = (row) => ({
  id: row.id,
  campaignSlug: row.campaign_slug || null,
  meta: row.meta || {},
  summary: row.summary || {},
  startedAt: row.started_at || toIsoNow(),
  completedAt: row.completed_at || null,
});

const mapEvent = (row) => ({
  id: String(row.id),
  sessionId: row.session_id,
  eventType: row.event_type,
  step: row.step,
  payload: row.payload || {},
  createdAt: row.created_at || toIsoNow(),
});

export const createCampaign = async ({ title, ownerName, ownerChatId, ownerUsername, config }) => {
  const slug = toSlug(`${config.partnerFirstName}-${config.partnerLastName}`);

  const rows = await remoteRequest(
    `${TABLES.campaigns}?select=id,slug,title,owner_name,owner_chat_id,owner_username,config,created_at`,
    {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify([
        {
          slug,
          title,
          owner_name: ownerName,
          owner_chat_id: ownerChatId,
          owner_username: ownerUsername || null,
          config,
        },
      ]),
    },
  );

  if (!rows || !rows.length) {
    throw new Error('Campaign create response empty');
  }

  return mapCampaign(rows[0]);
};

export const listCampaignsByOwner = async (ownerChatId) => {
  const rows = await remoteRequest(
    `${TABLES.campaigns}?select=id,slug,title,owner_name,owner_chat_id,owner_username,config,created_at&owner_chat_id=eq.${encodeURIComponent(String(ownerChatId))}&order=created_at.desc`,
  );

  return rows.map(mapCampaign);
};

export const listSessionsByCampaign = async (campaignSlug) => {
  const rows = await remoteRequest(
    `${TABLES.sessions}?select=id,campaign_slug,meta,summary,started_at,completed_at&campaign_slug=eq.${encodeURIComponent(campaignSlug)}&order=started_at.desc`,
  );

  return rows.map(mapSession);
};

export const getSessionWithEvents = async (sessionId) => {
  const [sessionRows, eventRows] = await Promise.all([
    remoteRequest(`${TABLES.sessions}?select=id,campaign_slug,meta,summary,started_at,completed_at&id=eq.${encodeURIComponent(sessionId)}&limit=1`),
    remoteRequest(`${TABLES.events}?select=id,session_id,event_type,step,payload,created_at&session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc`),
  ]);

  if (!sessionRows.length) {
    return null;
  }

  return {
    session: mapSession(sessionRows[0]),
    events: eventRows.map(mapEvent),
  };
};

export const checkConnection = async () => {
  await remoteRequest(`${TABLES.campaigns}?select=id&limit=1`);
  return true;
};

export const getConfigFromEnv = () => ({
  SUPABASE_URL,
  hasSupabaseKey: Boolean(SUPABASE_KEY),
  tables: TABLES,
});
