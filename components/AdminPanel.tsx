import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ExternalLink, Filter, Loader2, ShieldCheck } from 'lucide-react';
import {
  CampaignRecord,
  SessionRecord,
  SessionWithEvents,
  getSessionWithEvents,
  isRemoteStoreEnabled,
  listCampaigns,
  listSessions,
  listSessionsByCampaign,
} from '../services/sessionStore';
import { buildCampaignShareLink } from '../services/runtimeConfig';

interface AdminPanelProps {
  isAuthorized: boolean;
}

const ALL_CAMPAIGNS_KEY = '__all__';

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

const AdminPanel: React.FC<AdminPanelProps> = ({ isAuthorized }) => {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeCampaignSlug, setActiveCampaignSlug] = useState<string>(ALL_CAMPAIGNS_KEY);
  const [activeSessionDetail, setActiveSessionDetail] = useState<SessionWithEvents | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);

  const remoteStatusLabel = useMemo(
    () => (isRemoteStoreEnabled ? "Remote (Supabase) yoqilgan" : 'Faqat local rejim (admin panel cheklangan)'),
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
      if (campaignSlug === ALL_CAMPAIGNS_KEY) {
        const rows = await listSessions();
        setSessions(rows);
      } else {
        const rows = await listSessionsByCampaign(campaignSlug);
        setSessions(rows);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    void refreshCampaigns();
    void refreshSessions(ALL_CAMPAIGNS_KEY);
  }, [isAuthorized, refreshCampaigns, refreshSessions]);

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

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((session) => Boolean(session.completedAt)).length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    return {
      totalCampaigns,
      totalSessions,
      completedSessions,
      completionRate,
    };
  }, [campaigns, sessions]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-love flex items-center justify-center p-4">
        <div className="glass-card rounded-3xl border border-love-200 p-6 max-w-md text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-love-100 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-love-500" />
          </div>
          <h1 className="text-xl font-semibold text-love-800 mb-2">Admin Panel yopiq</h1>
          <p className="text-sm text-love-600">
            `mode=admin` uchun kalit noto&apos;g&apos;ri yoki berilmagan. To&apos;g&apos;ri `key` bilan qayta oching.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-love px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <section className="glass-card rounded-3xl border border-love-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-love-800">Admin Panel</h1>
              <p className="text-xs text-love-500">{remoteStatusLabel}</p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs text-love-600 bg-white/80 border border-love-200 rounded-full px-3 py-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>
                {activeCampaignSlug === ALL_CAMPAIGNS_KEY ? 'Barcha kampaniyalar' : `campaign: ${activeCampaignSlug}`}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-love-200 bg-white/85 p-3">
              <p className="text-[11px] text-love-500">Jami ulashish</p>
              <p className="text-lg font-semibold text-love-700">{stats.totalCampaigns}</p>
            </div>
            <div className="rounded-xl border border-love-200 bg-white/85 p-3">
              <p className="text-[11px] text-love-500">Jami session</p>
              <p className="text-lg font-semibold text-love-700">{stats.totalSessions}</p>
            </div>
            <div className="rounded-xl border border-love-200 bg-white/85 p-3">
              <p className="text-[11px] text-love-500">Yakunlangan</p>
              <p className="text-lg font-semibold text-love-700">{stats.completedSessions}</p>
            </div>
            <div className="rounded-xl border border-love-200 bg-white/85 p-3">
              <p className="text-[11px] text-love-500">Yakunlash foizi</p>
              <p className="text-lg font-semibold text-love-700">{stats.completionRate}%</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr_1fr] gap-4">
          <section className="glass-card rounded-3xl border border-love-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-love-500" />
              <h2 className="text-sm font-semibold text-love-800">Ulashishlar</h2>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void handleSelectCampaign(ALL_CAMPAIGNS_KEY)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition-colors ${
                  activeCampaignSlug === ALL_CAMPAIGNS_KEY
                    ? 'border-love-400 bg-love-50'
                    : 'border-love-200 bg-white/90 hover:bg-love-50/60'
                }`}
              >
                <p className="text-sm font-semibold text-love-700">Barcha kampaniyalar</p>
              </button>

              {isLoadingCampaigns ? (
                <div className="py-6 flex justify-center text-love-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : campaigns.length === 0 ? (
                <p className="text-sm text-love-500">Hozircha campaign yo&apos;q.</p>
              ) : (
                campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`rounded-xl border px-3 py-2 transition-colors ${
                      activeCampaignSlug === campaign.slug
                        ? 'border-love-400 bg-love-50'
                        : 'border-love-200 bg-white/90'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void handleSelectCampaign(campaign.slug)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-semibold text-love-700">{campaign.title}</p>
                      <p className="text-xs text-love-500">
                        owner: {campaign.ownerName} • {formatDate(campaign.createdAt)}
                      </p>
                      <p className="text-[11px] text-love-500 break-all">{campaign.slug}</p>
                    </button>
                    <a
                      href={buildCampaignShareLink(campaign.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[11px] text-love-600 hover:text-love-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Linkni ochish
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="glass-card rounded-3xl border border-love-200 p-4">
            <h2 className="text-sm font-semibold text-love-800 mb-3">Sessionlar</h2>

            {isLoadingSessions ? (
              <div className="py-6 flex justify-center text-love-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-love-500">Session topilmadi.</p>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-auto pr-1">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-love-200 bg-white/90 px-3 py-2">
                    <p className="text-xs text-love-600 break-all">{session.id}</p>
                    <p className="text-[11px] text-love-500">
                      campaign: {session.campaignSlug || 'null'} • {session.completedAt ? 'Yakunlangan' : 'Jarayonda'}
                    </p>
                    <p className="text-[11px] text-love-500">
                      start: {formatDate(session.startedAt)} • end: {formatDate(session.completedAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleViewSession(session.id)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-love-200 px-2 py-1 text-[11px] text-love-600 hover:bg-love-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Batafsil
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card rounded-3xl border border-love-200 p-4">
            <h2 className="text-sm font-semibold text-love-800 mb-3">Session detali</h2>
            {isLoadingSessionDetail ? (
              <div className="py-6 flex justify-center text-love-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : !activeSessionDetail ? (
              <p className="text-sm text-love-500">Sessionni tanlang.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-love-200 bg-white/90 p-3">
                  <p className="text-xs font-semibold text-love-700 mb-1">Summary</p>
                  <pre className="text-[11px] text-love-700 whitespace-pre-wrap break-words max-h-72 overflow-auto">
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
