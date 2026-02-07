import { AppConfig } from '../types';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const CAMPAIGNS_KEY = 'love_app_campaigns_v1';
const SESSIONS_KEY = 'love_app_sessions_v1';
const EVENTS_KEY = 'love_app_session_events_v1';

export const isRemoteStoreEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export interface CampaignRecord {
  id: string;
  slug: string;
  title: string;
  ownerName: string;
  config: AppConfig;
  createdAt: string;
  source: 'remote' | 'local';
}

export interface SessionRecord {
  id: string;
  campaignSlug: string | null;
  meta: Record<string, unknown>;
  summary: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
  source: 'remote' | 'local';
}

export interface SessionEventRecord {
  id: string;
  sessionId: string;
  eventType: string;
  step: string;
  payload: Record<string, unknown>;
  createdAt: string;
  source: 'remote' | 'local';
}

export interface SessionWithEvents {
  session: SessionRecord;
  events: SessionEventRecord[];
}

interface CreateCampaignInput {
  title?: string;
  ownerName?: string;
  config: AppConfig;
}

interface CreateSessionInput {
  campaignSlug?: string | null;
  meta?: Record<string, unknown>;
}

interface CompleteSessionInput {
  sessionId: string;
  summary?: Record<string, unknown>;
}

interface AppendSessionEventInput {
  sessionId: string;
  eventType: string;
  step?: string;
  payload?: Record<string, unknown>;
}

const toIsoNow = (): string => new Date().toISOString();

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toSlug = (value: string): string => {
  const trimmed = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${trimmed || 'campaign'}-${suffix}`;
};

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage quota and serialization errors.
  }
};

const getLocalCampaigns = (): CampaignRecord[] => readJson<CampaignRecord[]>(CAMPAIGNS_KEY, []);
const setLocalCampaigns = (campaigns: CampaignRecord[]): void => writeJson(CAMPAIGNS_KEY, campaigns);

const getLocalSessions = (): SessionRecord[] => readJson<SessionRecord[]>(SESSIONS_KEY, []);
const setLocalSessions = (sessions: SessionRecord[]): void => writeJson(SESSIONS_KEY, sessions);

const getLocalEvents = (): SessionEventRecord[] => readJson<SessionEventRecord[]>(EVENTS_KEY, []);
const setLocalEvents = (events: SessionEventRecord[]): void => writeJson(EVENTS_KEY, events);

const remoteRequest = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials are not configured.');
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const createLocalCampaign = (input: CreateCampaignInput): CampaignRecord => {
  const now = toIsoNow();
  const slug = toSlug(`${input.config.partnerFirstName}-${input.config.partnerLastName}`);
  const campaign: CampaignRecord = {
    id: makeId(),
    slug,
    title: input.title?.trim() || `${input.config.partnerFirstName} uchun kampaniya`,
    ownerName: input.ownerName?.trim() || input.config.myName,
    config: input.config,
    createdAt: now,
    source: 'local',
  };

  const campaigns = getLocalCampaigns();
  campaigns.unshift(campaign);
  setLocalCampaigns(campaigns);

  return campaign;
};

const mapRemoteCampaign = (row: any): CampaignRecord => ({
  id: row.id,
  slug: row.slug,
  title: row.title ?? 'Campaign',
  ownerName: row.owner_name ?? 'Unknown',
  config: row.config,
  createdAt: row.created_at ?? toIsoNow(),
  source: 'remote',
});

const mapRemoteSession = (row: any): SessionRecord => ({
  id: row.id,
  campaignSlug: row.campaign_slug ?? null,
  meta: row.meta ?? {},
  summary: row.summary ?? {},
  startedAt: row.started_at ?? toIsoNow(),
  completedAt: row.completed_at ?? null,
  source: 'remote',
});

const mapRemoteEvent = (row: any): SessionEventRecord => ({
  id: String(row.id),
  sessionId: row.session_id,
  eventType: row.event_type,
  step: row.step ?? 'UNKNOWN',
  payload: row.payload ?? {},
  createdAt: row.created_at ?? toIsoNow(),
  source: 'remote',
});

export const createCampaign = async (input: CreateCampaignInput): Promise<CampaignRecord> => {
  if (!isRemoteStoreEnabled) {
    return createLocalCampaign(input);
  }

  const slug = toSlug(`${input.config.partnerFirstName}-${input.config.partnerLastName}`);

  try {
    const rows = await remoteRequest<any[]>(
      'campaigns?select=id,slug,title,owner_name,config,created_at',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            slug,
            title: input.title?.trim() || `${input.config.partnerFirstName} uchun kampaniya`,
            owner_name: input.ownerName?.trim() || input.config.myName,
            config: input.config,
          },
        ]),
      },
    );

    const created = rows[0];
    if (!created) {
      throw new Error('Campaign create returned empty response.');
    }

    return mapRemoteCampaign(created);
  } catch (error) {
    console.warn('Falling back to local campaign storage:', error);
    return createLocalCampaign(input);
  }
};

export const listCampaigns = async (): Promise<CampaignRecord[]> => {
  if (!isRemoteStoreEnabled) {
    return getLocalCampaigns().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  try {
    const rows = await remoteRequest<any[]>(
      'campaigns?select=id,slug,title,owner_name,config,created_at&order=created_at.desc',
    );
    return rows.map(mapRemoteCampaign);
  } catch (error) {
    console.warn('Remote campaign list failed, reading local cache:', error);
    return getLocalCampaigns().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
};

export const getCampaignBySlug = async (slug: string): Promise<CampaignRecord | null> => {
  const safeSlug = slug.trim();
  if (!safeSlug) {
    return null;
  }

  if (!isRemoteStoreEnabled) {
    return getLocalCampaigns().find((campaign) => campaign.slug === safeSlug) ?? null;
  }

  try {
    const rows = await remoteRequest<any[]>(
      `campaigns?select=id,slug,title,owner_name,config,created_at&slug=eq.${encodeURIComponent(safeSlug)}&limit=1`,
    );
    if (!rows.length) {
      return null;
    }
    return mapRemoteCampaign(rows[0]);
  } catch (error) {
    console.warn('Remote campaign fetch failed, trying local cache:', error);
    return getLocalCampaigns().find((campaign) => campaign.slug === safeSlug) ?? null;
  }
};

const createLocalSession = (input: CreateSessionInput): SessionRecord => {
  const session: SessionRecord = {
    id: makeId(),
    campaignSlug: input.campaignSlug ?? null,
    meta: input.meta ?? {},
    summary: {},
    startedAt: toIsoNow(),
    completedAt: null,
    source: 'local',
  };

  const sessions = getLocalSessions();
  sessions.unshift(session);
  setLocalSessions(sessions);

  return session;
};

export const createSession = async (input: CreateSessionInput): Promise<SessionRecord> => {
  if (!isRemoteStoreEnabled) {
    return createLocalSession(input);
  }

  try {
    const rows = await remoteRequest<any[]>(
      'sessions?select=id,campaign_slug,meta,summary,started_at,completed_at',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=representation',
        },
        body: JSON.stringify([
          {
            campaign_slug: input.campaignSlug ?? null,
            meta: input.meta ?? {},
            summary: {},
          },
        ]),
      },
    );

    const created = rows[0];
    if (!created) {
      throw new Error('Session create returned empty response.');
    }

    return mapRemoteSession(created);
  } catch (error) {
    console.warn('Falling back to local session storage:', error);
    return createLocalSession(input);
  }
};

const appendLocalSessionEvent = (input: AppendSessionEventInput): void => {
  const events = getLocalEvents();
  events.push({
    id: makeId(),
    sessionId: input.sessionId,
    eventType: input.eventType,
    step: input.step ?? 'UNKNOWN',
    payload: input.payload ?? {},
    createdAt: toIsoNow(),
    source: 'local',
  });
  setLocalEvents(events);
};

export const appendSessionEvent = async (input: AppendSessionEventInput): Promise<void> => {
  if (!isRemoteStoreEnabled) {
    appendLocalSessionEvent(input);
    return;
  }

  try {
    await remoteRequest<any[]>(
      'session_events',
      {
        method: 'POST',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify([
          {
            session_id: input.sessionId,
            event_type: input.eventType,
            step: input.step ?? 'UNKNOWN',
            payload: input.payload ?? {},
          },
        ]),
      },
    );
  } catch (error) {
    console.warn('Remote event append failed, saving locally:', error);
    appendLocalSessionEvent(input);
  }
};

const completeLocalSession = (input: CompleteSessionInput): void => {
  const sessions = getLocalSessions();
  const updated = sessions.map((session) => {
    if (session.id !== input.sessionId) {
      return session;
    }
    return {
      ...session,
      completedAt: toIsoNow(),
      summary: input.summary ?? session.summary,
    };
  });
  setLocalSessions(updated);
};

export const completeSession = async (input: CompleteSessionInput): Promise<void> => {
  if (!isRemoteStoreEnabled) {
    completeLocalSession(input);
    return;
  }

  try {
    await remoteRequest<any[]>(
      `sessions?id=eq.${encodeURIComponent(input.sessionId)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          completed_at: toIsoNow(),
          summary: input.summary ?? {},
        }),
      },
    );
  } catch (error) {
    console.warn('Remote session complete failed, writing locally:', error);
    completeLocalSession(input);
  }
};

export const listSessionsByCampaign = async (campaignSlug: string): Promise<SessionRecord[]> => {
  const safeSlug = campaignSlug.trim();
  if (!safeSlug) {
    return [];
  }

  if (!isRemoteStoreEnabled) {
    return getLocalSessions()
      .filter((session) => session.campaignSlug === safeSlug)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  try {
    const rows = await remoteRequest<any[]>(
      `sessions?select=id,campaign_slug,meta,summary,started_at,completed_at&campaign_slug=eq.${encodeURIComponent(safeSlug)}&order=started_at.desc`,
    );
    return rows.map(mapRemoteSession);
  } catch (error) {
    console.warn('Remote session list failed, reading local cache:', error);
    return getLocalSessions()
      .filter((session) => session.campaignSlug === safeSlug)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }
};

export const getSessionWithEvents = async (sessionId: string): Promise<SessionWithEvents | null> => {
  const safeSessionId = sessionId.trim();
  if (!safeSessionId) {
    return null;
  }

  if (!isRemoteStoreEnabled) {
    const session = getLocalSessions().find((item) => item.id === safeSessionId);
    if (!session) {
      return null;
    }

    const events = getLocalEvents()
      .filter((event) => event.sessionId === safeSessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return { session, events };
  }

  try {
    const [sessionRows, eventRows] = await Promise.all([
      remoteRequest<any[]>(
        `sessions?select=id,campaign_slug,meta,summary,started_at,completed_at&id=eq.${encodeURIComponent(safeSessionId)}&limit=1`,
      ),
      remoteRequest<any[]>(
        `session_events?select=id,session_id,event_type,step,payload,created_at&session_id=eq.${encodeURIComponent(safeSessionId)}&order=created_at.asc`,
      ),
    ]);

    if (!sessionRows.length) {
      return null;
    }

    return {
      session: mapRemoteSession(sessionRows[0]),
      events: eventRows.map(mapRemoteEvent),
    };
  } catch (error) {
    console.warn('Remote session detail failed, reading local cache:', error);

    const session = getLocalSessions().find((item) => item.id === safeSessionId);
    if (!session) {
      return null;
    }

    const events = getLocalEvents()
      .filter((event) => event.sessionId === safeSessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return { session, events };
  }
};
