import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Copy, ExternalLink, Link2, Loader2, Settings } from 'lucide-react';
import {
  CampaignRecord,
  SessionRecord,
  SessionWithEvents,
  createCampaign,
  getSessionWithEvents,
  isRemoteStoreEnabled,
  listCampaigns,
  listSessionsByCampaign,
} from '../services/sessionStore';
import {
  DEFAULT_APP_CONFIG,
  buildCampaignShareLink,
  buildShareLink,
  normalizeConfig,
} from '../services/runtimeConfig';

const formatDate = (iso?: string | null): string => {
  if (!iso) {
    return '-';
  }

  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const CampaignStudio: React.FC = () => {
  const [partnerFirstName, setPartnerFirstName] = useState(DEFAULT_APP_CONFIG.partnerFirstName);
  const [partnerLastName, setPartnerLastName] = useState(DEFAULT_APP_CONFIG.partnerLastName);
  const [myName, setMyName] = useState(DEFAULT_APP_CONFIG.myName);
  const [specialContestantName, setSpecialContestantName] = useState(DEFAULT_APP_CONFIG.specialContestantName);
  const [campaignTitle, setCampaignTitle] = useState(DEFAULT_APP_CONFIG.campaignTitle);

  const [isCreating, setIsCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkMode, setLinkMode] = useState<'campaign' | 'config' | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [activeCampaignSlug, setActiveCampaignSlug] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeSessionDetail, setActiveSessionDetail] = useState<SessionWithEvents | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);

  const remoteStatusLabel = useMemo(
    () => (isRemoteStoreEnabled ? "Remote (Supabase) yoqilgan" : 'Faqat local rejim (bir qurilmada)'),
    [],
  );

  const refreshCampaigns = useCallback(async () => {
    setIsLoadingCampaigns(true);
    try {
      const rows = await listCampaigns();
      setCampaigns(rows);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, []);

  const refreshSessions = useCallback(async (campaignSlug: string) => {
    setIsLoadingSessions(true);
    try {
      const rows = await listSessionsByCampaign(campaignSlug);
      setSessions(rows);
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void refreshCampaigns();
  }, [refreshCampaigns]);

  const handleCreateCampaign = useCallback(async () => {
    setIsCreating(true);
    try {
      const config = normalizeConfig({
        partnerFirstName,
        partnerLastName,
        myName,
        specialContestantName,
        campaignTitle,
      });

      const created = await createCampaign({
        title: campaignTitle,
        ownerName: myName,
        config,
      });

      if (created.source === 'remote') {
        setGeneratedLink(buildCampaignShareLink(created.slug));
        setLinkMode('campaign');
      } else {
        setGeneratedLink(buildShareLink(config));
        setLinkMode('config');
      }

      setActiveCampaignSlug(created.slug);
      setActiveSessionDetail(null);
      await refreshCampaigns();
      await refreshSessions(created.slug);
    } finally {
      setIsCreating(false);
    }
  }, [campaignTitle, myName, partnerFirstName, partnerLastName, refreshCampaigns, refreshSessions, specialContestantName]);

  const handleCopyLink = useCallback(async () => {
    if (!generatedLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedLink);
    } catch {
      // Clipboard not available in some embedded webviews.
    }
  }, [generatedLink]);

  const handleSelectCampaign = useCallback(async (slug: string) => {
    setActiveCampaignSlug(slug);
    setActiveSessionDetail(null);
    await refreshSessions(slug);
  }, [refreshSessions]);

  const handleViewSession = useCallback(async (sessionId: string) => {
    setIsLoadingSessionDetail(true);
    try {
      const detail = await getSessionWithEvents(sessionId);
      setActiveSessionDetail(detail);
    } finally {
      setIsLoadingSessionDetail(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-love px-4 py-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-4">
        <section className="glass-card rounded-3xl border border-love-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-love-100 flex items-center justify-center">
              <Settings className="w-4 h-4 text-love-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-love-800">Creator Studio</h1>
              <p className="text-xs text-love-500">{remoteStatusLabel}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs text-love-600 font-medium">Partner ismi</label>
            <input
              value={partnerFirstName}
              onChange={(event) => setPartnerFirstName(event.target.value)}
              className="w-full rounded-xl border border-love-200 bg-white/90 px-3 py-2 text-sm text-love-700 focus:outline-none focus:border-love-400"
            />

            <label className="block text-xs text-love-600 font-medium">Partner familiyasi</label>
            <input
              value={partnerLastName}
              onChange={(event) => setPartnerLastName(event.target.value)}
              className="w-full rounded-xl border border-love-200 bg-white/90 px-3 py-2 text-sm text-love-700 focus:outline-none focus:border-love-400"
            />

            <label className="block text-xs text-love-600 font-medium">Maxsus personaj nomi</label>
            <input
              value={specialContestantName}
              onChange={(event) => setSpecialContestantName(event.target.value)}
              className="w-full rounded-xl border border-love-200 bg-white/90 px-3 py-2 text-sm text-love-700 focus:outline-none focus:border-love-400"
            />

            <label className="block text-xs text-love-600 font-medium">Sizning ismingiz</label>
            <input
              value={myName}
              onChange={(event) => setMyName(event.target.value)}
              className="w-full rounded-xl border border-love-200 bg-white/90 px-3 py-2 text-sm text-love-700 focus:outline-none focus:border-love-400"
            />

            <label className="block text-xs text-love-600 font-medium">Kampaniya nomi</label>
            <input
              value={campaignTitle}
              onChange={(event) => setCampaignTitle(event.target.value)}
              className="w-full rounded-xl border border-love-200 bg-white/90 px-3 py-2 text-sm text-love-700 focus:outline-none focus:border-love-400"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateCampaign}
            disabled={isCreating}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl btn-gradient-love text-white text-sm font-medium disabled:opacity-60"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            <span>Share link yaratish</span>
          </button>

          {generatedLink && (
            <div className="rounded-2xl border border-love-200 bg-white/90 p-3 space-y-2">
              <p className="text-xs text-love-500">
                {linkMode === 'campaign'
                  ? 'Kampaniya linki (cross-device tracking).'
                  : 'Konfig linki (fallback, kampaniya IDsiz).'}
              </p>
              <p className="text-[11px] text-love-700 break-all">{generatedLink}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 rounded-lg border border-love-200 px-3 py-1.5 text-xs text-love-600 hover:bg-love-50"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </button>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-love-200 px-3 py-1.5 text-xs text-love-600 hover:bg-love-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ochish
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="glass-card rounded-3xl border border-love-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-love-500" />
              <h2 className="text-sm font-semibold text-love-800">Kampaniyalar va natijalar</h2>
            </div>

            {isLoadingCampaigns ? (
              <div className="py-6 flex justify-center text-love-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-love-500">Hozircha kampaniya yo'q.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => void handleSelectCampaign(campaign.slug)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                      activeCampaignSlug === campaign.slug
                        ? 'border-love-400 bg-love-50'
                        : 'border-love-200 bg-white/90 hover:bg-love-50/60'
                    }`}
                  >
                    <p className="text-sm font-semibold text-love-700">{campaign.title}</p>
                    <p className="text-xs text-love-500">
                      {campaign.slug} • {formatDate(campaign.createdAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl border border-love-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-love-800">Sessionlar</h3>
              {activeCampaignSlug && (
                <span className="text-xs text-love-500">campaign: {activeCampaignSlug}</span>
              )}
            </div>

            {!activeCampaignSlug ? (
              <p className="text-sm text-love-500">Sessionlarni ko'rish uchun kampaniya tanlang.</p>
            ) : isLoadingSessions ? (
              <div className="py-6 flex justify-center text-love-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-love-500">Hali javoblar yo'q.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-love-200 bg-white/90 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-love-600">{session.id}</p>
                        <p className="text-[11px] text-love-500">
                          Boshlangan: {formatDate(session.startedAt)} • Tugagan: {formatDate(session.completedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleViewSession(session.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-love-200 px-2 py-1 text-[11px] text-love-600 hover:bg-love-50"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ko'rish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl border border-love-200 p-4">
            <h3 className="text-sm font-semibold text-love-800 mb-3">Session detali</h3>
            {isLoadingSessionDetail ? (
              <div className="py-6 flex justify-center text-love-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : !activeSessionDetail ? (
              <p className="text-sm text-love-500">Session tanlang.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-love-200 bg-white/90 p-3">
                  <p className="text-xs font-semibold text-love-700 mb-1">Summary</p>
                  <pre className="text-[11px] text-love-700 whitespace-pre-wrap break-words">
                    {JSON.stringify(activeSessionDetail.session.summary, null, 2)}
                  </pre>
                </div>
                <div className="rounded-xl border border-love-200 bg-white/90 p-3">
                  <p className="text-xs font-semibold text-love-700 mb-1">
                    Events ({activeSessionDetail.events.length})
                  </p>
                  <pre className="text-[11px] text-love-700 whitespace-pre-wrap break-words max-h-72 overflow-auto">
                    {JSON.stringify(activeSessionDetail.events, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CampaignStudio;
