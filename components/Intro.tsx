import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { INTRO_MESSAGES } from '../constants';
import { useAppRuntime } from '../context/AppRuntimeContext';
import Journey from './Journey';

interface IntroProps {
  onComplete: () => void;
}

// ============================================================
// Floating petals (romantic ambient)
// ============================================================
interface Petal {
  id: number;
  emoji: string;
  left: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  driftRot: number;
}

function generatePetals(count: number): Petal[] {
  const emojis = ['🌸', '💗', '✨', '🩷', '💕', '🪻', '🌷', '💐'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    left: Math.random() * 100,
    size: Math.random() * 10 + 12,
    delay: Math.random() * 8,
    duration: Math.random() * 5 + 7,
    driftX: (Math.random() - 0.5) * 80,
    driftY: 150 + Math.random() * 200,
    driftRot: Math.random() * 360 - 180,
  }));
}

// ============================================================
// Soft background circles (depth effect)
// ============================================================
const SoftCircles: React.FC = () => (
  <>
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: '280px', height: '280px',
        top: '-40px', right: '-60px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
        animation: 'softBreathe 6s ease-in-out infinite',
      }}
    />
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: '200px', height: '200px',
        bottom: '10%', left: '-40px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
        animation: 'softBreathe 8s ease-in-out 2s infinite',
      }}
    />
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: '160px', height: '160px',
        top: '40%', left: '60%',
        background: 'radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)',
        animation: 'softBreathe 7s ease-in-out 4s infinite',
      }}
    />
  </>
);

// ============================================================
// Main Intro Component
// ============================================================
const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [textStep, setTextStep] = useState(-1);
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  const petals = useMemo(() => generatePetals(12), []);
  const introMessages = useMemo(
    () => [
      { text: `Salom, ${config.partnerFirstName}...`, delay: INTRO_MESSAGES[0]?.delay ?? 600, emoji: '💖' },
      INTRO_MESSAGES[1],
      INTRO_MESSAGES[2],
    ],
    [config.partnerFirstName],
  );

  // Progressive text reveal
  useEffect(() => {
    if (journeyStarted) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    introMessages.forEach((msg, i) => {
      timers.push(setTimeout(() => setTextStep(i), msg.delay));
    });
    // Button appears after last message
    const lastDelay = introMessages[introMessages.length - 1].delay;
    timers.push(setTimeout(() => setButtonVisible(true), lastDelay + 800));
    return () => timers.forEach(clearTimeout);
  }, [introMessages, journeyStarted]);

  const handleStart = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    } catch {}

    trackEvent('intro_started', { partnerFirstName: config.partnerFirstName });
    setJourneyStarted(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-6 relative overflow-hidden">

      {/* === Ambient background === */}
      <SoftCircles />

      {/* Floating petals */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none z-0"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            fontSize: `${p.size}px`,
            '--drift-x': `${p.driftX}px`,
            '--drift-y': `${p.driftY}px`,
            '--drift-rot': `${p.driftRot}deg`,
            animation: `petalDrift ${p.duration}s ease-in-out ${p.delay}s infinite`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}

      {/* === Main content === */}
      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm">

        {/* Heart icon with pulse ring */}
        <div className="relative mb-2">
          {/* Outer pulse rings */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              margin: '-12px',
              animation: 'heartPulseRing 2.5s ease-in-out infinite',
              border: '2px solid rgba(236,72,153,0.15)',
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              margin: '-24px',
              animation: 'heartPulseRing 2.5s ease-in-out 0.5s infinite',
              border: '1.5px solid rgba(236,72,153,0.08)',
            }}
          />

          {/* Main heart circle */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(244,63,94,0.08) 100%)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(236,72,153,0.15)',
              animation: 'introHeartFloat 4s ease-in-out infinite',
            }}
          >
            <Heart className="w-9 h-9 text-love-500 fill-love-500" style={{ filter: 'drop-shadow(0 2px 8px rgba(236,72,153,0.3))' }} />
          </div>
        </div>

        {/* Text messages — premium reveal */}
        <div className="space-y-3 min-h-[140px] flex flex-col items-center justify-center">
          {/* Message 1: Main greeting */}
          {textStep >= 0 && (
            <h1
              className="text-3xl md:text-4xl font-serif font-semibold text-gradient-love leading-tight"
              style={{ animation: 'introTextReveal 0.8s ease-out forwards' }}
            >
              {introMessages[0].text}
            </h1>
          )}

          {/* Message 2 */}
          {textStep >= 1 && (
            <div style={{ animation: 'introTextReveal 0.8s ease-out forwards' }}>
              <p className="text-base md:text-lg font-light text-love-600 leading-relaxed">
                {introMessages[1].text} {introMessages[1].emoji}
              </p>
            </div>
          )}

          {/* Decorative line */}
          {textStep >= 1 && (
            <div
              className="w-16 h-[1.5px] mx-auto rounded-full mt-1"
              style={{
                background: 'linear-gradient(90deg, transparent, #f9a8d4, transparent)',
                animation: 'lineExpand 0.6s ease-out 0.3s both',
                transformOrigin: 'center',
              }}
            />
          )}

          {/* Message 3: call to action */}
          {textStep >= 2 && (
            <div style={{ animation: 'introTextReveal 0.8s ease-out forwards' }}>
              <p className="text-sm font-light text-love-400 leading-relaxed italic">
                {introMessages[2].text}
              </p>
            </div>
          )}
        </div>

        {/* === Button or Journey === */}
        {buttonVisible && !journeyStarted && (
          <div style={{ animation: 'introTextReveal 0.8s ease-out forwards' }} className="pt-2">
            <button
              onClick={handleStart}
              className="group relative inline-flex items-center gap-3 px-10 py-4 text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #ef4444 100%)',
                animation: 'introButtonGlow 3s ease-in-out infinite',
              }}
            >
              {/* Sparkle decoration */}
              <Sparkles className="w-5 h-5 opacity-80" />
              <span className="text-lg font-light tracking-wide">Boshladik</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Subtle hint below button */}
            <p className="text-love-300 text-[10px] mt-3 font-light animate-pulse-soft">
              bosing va sehrni his qiling
            </p>
          </div>
        )}

        {/* Journey compact window */}
        {journeyStarted && (
          <div className="w-full max-w-sm pt-1" style={{ animation: 'introTextReveal 0.6s ease-out' }}>
            <Journey onComplete={onComplete} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Intro;
