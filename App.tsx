import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BestPersonGameResult,
  DreamsGameResult,
  FavoritesGameResult,
  GameStep,
  NameGameResult,
  ProposalResult,
  QualitiesGameResult,
  SessionResults,
} from './types';
import { HEART_EMOJIS } from './constants';
import Intro from './components/Intro';
import NameGame from './components/NameGame';
import QualitiesGame from './components/QualitiesGame';
import DreamsGame from './components/DreamsGame';
import FavoritesGame from './components/FavoritesGame';
import BestPersonGame from './components/BestPersonGame';
import Proposal from './components/Proposal';
import Success from './components/Success';
import CampaignStudio from './components/CampaignStudio';
import { AppRuntimeProvider } from './context/AppRuntimeContext';
import { DEFAULT_APP_CONFIG, isStudioModeSearch, resolveRuntimeConfig } from './services/runtimeConfig';
import { appendSessionEvent, completeSession, createSession } from './services/sessionStore';

const tg = window.Telegram?.WebApp;

type AppMode = 'play' | 'studio';

interface QueuedEvent {
  eventType: string;
  step: string;
  payload: Record<string, unknown>;
}

const haptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  try {
    tg?.HapticFeedback?.impactOccurred(type);
  } catch {}
};

const hapticSuccess = () => {
  try {
    tg?.HapticFeedback?.notificationOccurred('success');
  } catch {}
};

const FloatingHearts: React.FC = () => {
  const [hearts, setHearts] = useState<Array<{ id: number; emoji: string; left: string; size: string; duration: string; delay: string }>>([]);

  useEffect(() => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 16 + 12}px`,
      duration: `${Math.random() * 6 + 6}s`,
      delay: `${Math.random() * 8}s`,
    }));
    setHearts(items);
  }, []);

  return (
    <>
      {hearts.map((h) => (
        <div
          key={h.id}
          className="floating-heart"
          style={{
            '--left': h.left,
            '--size': h.size,
            '--duration': h.duration,
            '--delay': h.delay,
          } as React.CSSProperties}
        >
          {h.emoji}
        </div>
      ))}
    </>
  );
};

const STEPS_ORDER = [
  GameStep.INTRO,
  GameStep.NAME_GAME,
  GameStep.QUALITIES,
  GameStep.DREAMS,
  GameStep.FAVORITES,
  GameStep.BEST_PERSON,
  GameStep.PROPOSAL,
  GameStep.SUCCESS,
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('play');
  const [runtimeReady, setRuntimeReady] = useState(false);
  const [runtimeSource, setRuntimeSource] = useState<'default' | 'query' | 'campaign'>('default');
  const [campaignSlug, setCampaignSlug] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState(DEFAULT_APP_CONFIG);

  const [currentStep, setCurrentStep] = useState<GameStep>(GameStep.INTRO);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const pendingEventsRef = useRef<QueuedEvent[]>([]);
  const resultsRef = useRef<SessionResults>({});
  const sessionIdRef = useRef<string | null>(null);
  const stepRef = useRef<GameStep>(GameStep.INTRO);
  const sessionCompletedRef = useRef(false);

  sessionIdRef.current = sessionId;
  stepRef.current = currentStep;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#fdf2f8');
        tg.setBackgroundColor('#fdf2f8');
      } catch {}
    }
  }, []);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const search = window.location.search;
      if (isStudioModeSearch(search)) {
        if (!active) {
          return;
        }

        setMode('studio');
        setRuntimeReady(true);
        return;
      }

      try {
        const runtime = await resolveRuntimeConfig(search);
        if (!active) {
          return;
        }

        setRuntimeConfig(runtime.config);
        setCampaignSlug(runtime.campaignSlug);
        setRuntimeSource(runtime.source);
      } catch (error) {
        console.warn('Runtime config load failed. Falling back to defaults.', error);
        if (!active) {
          return;
        }

        setRuntimeConfig(DEFAULT_APP_CONFIG);
        setCampaignSlug(null);
        setRuntimeSource('default');
      } finally {
        if (active) {
          setRuntimeReady(true);
        }
      }
    };

    void boot();

    return () => {
      active = false;
    };
  }, []);

  const trackEvent = useCallback((eventType: string, payload: Record<string, unknown> = {}) => {
    const event: QueuedEvent = {
      eventType,
      step: stepRef.current,
      payload,
    };

    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) {
      pendingEventsRef.current.push(event);
      return;
    }

    void appendSessionEvent({
      sessionId: activeSessionId,
      eventType: event.eventType,
      step: event.step,
      payload: event.payload,
    }).catch((error) => {
      console.warn('Event tracking failed:', error);
    });
  }, []);

  const flushPendingEvents = useCallback((activeSessionId: string) => {
    if (!pendingEventsRef.current.length) {
      return;
    }

    const queued = [...pendingEventsRef.current];
    pendingEventsRef.current = [];

    queued.forEach((event) => {
      void appendSessionEvent({
        sessionId: activeSessionId,
        eventType: event.eventType,
        step: event.step,
        payload: event.payload,
      }).catch((error) => {
        console.warn('Pending event flush failed:', error);
      });
    });
  }, []);

  useEffect(() => {
    if (!runtimeReady || mode !== 'play' || sessionIdRef.current) {
      return;
    }

    let active = true;

    const startSession = async () => {
      const session = await createSession({
        campaignSlug,
        meta: {
          runtimeSource,
          path: window.location.pathname,
          userAgent: navigator.userAgent,
          language: navigator.language,
        },
      });

      if (!active) {
        return;
      }

      setSessionId(session.id);
      sessionIdRef.current = session.id;
      flushPendingEvents(session.id);
    };

    void startSession().catch((error) => {
      console.warn('Session start failed:', error);
    });

    return () => {
      active = false;
    };
  }, [campaignSlug, flushPendingEvents, mode, runtimeReady, runtimeSource]);

  useEffect(() => {
    if (!runtimeReady || mode !== 'play') {
      return;
    }

    trackEvent('app_loaded', {
      runtimeSource,
      campaignSlug,
      partnerFirstName: runtimeConfig.partnerFirstName,
      partnerLastName: runtimeConfig.partnerLastName,
      specialContestantName: runtimeConfig.specialContestantName,
    });
  }, [
    campaignSlug,
    mode,
    runtimeConfig.partnerFirstName,
    runtimeConfig.partnerLastName,
    runtimeConfig.specialContestantName,
    runtimeReady,
    runtimeSource,
    trackEvent,
  ]);

  useEffect(() => {
    if (!runtimeReady || mode !== 'play') {
      return;
    }

    trackEvent('step_viewed', { step: currentStep });
  }, [currentStep, mode, runtimeReady, trackEvent]);

  const recordSectionResult = useCallback(<K extends keyof SessionResults>(key: K, value: SessionResults[K]) => {
    resultsRef.current = {
      ...resultsRef.current,
      [key]: value,
    };

    trackEvent('section_result_saved', {
      section: key,
      value,
    });
  }, [trackEvent]);

  const finalizeSession = useCallback(() => {
    if (sessionCompletedRef.current) {
      return;
    }

    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) {
      return;
    }

    sessionCompletedRef.current = true;

    const completedAt = new Date().toISOString();
    const summary = {
      completedAt,
      runtimeSource,
      campaignSlug,
      config: {
        partnerFirstName: runtimeConfig.partnerFirstName,
        partnerLastName: runtimeConfig.partnerLastName,
        specialContestantName: runtimeConfig.specialContestantName,
      },
      results: resultsRef.current,
      finalStep: GameStep.SUCCESS,
    };

    trackEvent('session_completed', { completedAt });

    void completeSession({
      sessionId: activeSessionId,
      summary,
    }).catch((error) => {
      console.warn('Session completion failed:', error);
    });
  }, [campaignSlug, runtimeConfig.partnerFirstName, runtimeConfig.partnerLastName, runtimeConfig.specialContestantName, runtimeSource, trackEvent]);

  useEffect(() => {
    if (currentStep === GameStep.SUCCESS) {
      finalizeSession();
    }
  }, [currentStep, finalizeSession]);

  const goToStep = useCallback((step: GameStep) => {
    const fromStep = stepRef.current;
    trackEvent('step_transition', { fromStep, toStep: step });

    haptic('light');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(step);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  }, [trackEvent]);

  const currentIndex = STEPS_ORDER.indexOf(currentStep);
  const progressPercent = currentIndex / (STEPS_ORDER.length - 1);

  const runtimeContextValue = useMemo(() => ({
    config: runtimeConfig,
    campaignSlug,
    sessionId,
    trackEvent,
  }), [campaignSlug, runtimeConfig, sessionId, trackEvent]);

  const renderStep = () => {
    switch (currentStep) {
      case GameStep.INTRO:
        return <Intro onComplete={() => goToStep(GameStep.NAME_GAME)} />;
      case GameStep.NAME_GAME:
        return (
          <NameGame
            onComplete={(result: NameGameResult) => {
              recordSectionResult('nameGame', result);
              hapticSuccess();
              goToStep(GameStep.QUALITIES);
            }}
          />
        );
      case GameStep.QUALITIES:
        return (
          <QualitiesGame
            onComplete={(result: QualitiesGameResult) => {
              recordSectionResult('qualitiesGame', result);
              hapticSuccess();
              goToStep(GameStep.DREAMS);
            }}
          />
        );
      case GameStep.DREAMS:
        return (
          <DreamsGame
            onComplete={(result: DreamsGameResult) => {
              recordSectionResult('dreamsGame', result);
              hapticSuccess();
              goToStep(GameStep.FAVORITES);
            }}
          />
        );
      case GameStep.FAVORITES:
        return (
          <FavoritesGame
            onComplete={(result: FavoritesGameResult) => {
              recordSectionResult('favoritesGame', result);
              hapticSuccess();
              goToStep(GameStep.BEST_PERSON);
            }}
          />
        );
      case GameStep.BEST_PERSON:
        return (
          <BestPersonGame
            onComplete={(result: BestPersonGameResult) => {
              recordSectionResult('bestPersonGame', result);
              hapticSuccess();
              goToStep(GameStep.PROPOSAL);
            }}
          />
        );
      case GameStep.PROPOSAL:
        return (
          <Proposal
            onYes={(result: ProposalResult) => {
              recordSectionResult('proposal', result);
              hapticSuccess();
              goToStep(GameStep.SUCCESS);
            }}
          />
        );
      case GameStep.SUCCESS:
        return <Success />;
      default:
        return null;
    }
  };

  if (!runtimeReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-love">
        <div className="glass-card rounded-2xl px-6 py-5 text-love-600 text-sm">Yuklanmoqda...</div>
      </div>
    );
  }

  if (mode === 'studio') {
    return <CampaignStudio />;
  }

  return (
    <AppRuntimeProvider value={runtimeContextValue}>
      <div className="min-h-screen bg-gradient-love flex flex-col items-center relative overflow-hidden">
        <FloatingHearts />

        {currentStep !== GameStep.SUCCESS && currentStep !== GameStep.INTRO && (
          <div className="w-full max-w-md px-6 pt-4 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-love-400 font-light">
                {currentIndex}/{STEPS_ORDER.length - 1}
              </span>
              <div className="flex gap-1">
                {STEPS_ORDER.slice(1, -1).map((step, i) => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i < currentIndex - 1
                        ? 'bg-love-500'
                        : i === currentIndex - 1
                        ? 'bg-love-400 animate-pulse-soft'
                        : 'bg-love-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full h-1 bg-love-100 rounded-full overflow-hidden">
              <div
                className="h-full btn-gradient-love rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent * 100}%` }}
              />
            </div>
          </div>
        )}

        <main
          className={`w-full max-w-lg flex-1 flex flex-col justify-center px-4 py-6 z-10 transition-all duration-400 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          {renderStep()}
        </main>

        {currentStep !== GameStep.SUCCESS && (
          <footer className="py-4 text-center text-love-300 text-xs font-light z-10">
            <a
              href="https://t.me/mdra088"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-love-500 transition-colors duration-300"
            >
              sevgi bilan yaratilgan 💖
            </a>
          </footer>
        )}
      </div>
    </AppRuntimeProvider>
  );
};

export default App;
