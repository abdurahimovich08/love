import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { SUCCESS_LETTER, CONFETTI_COLORS } from '../constants';
import { useAppRuntime } from '../context/AppRuntimeContext';

// Confetti particle
interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'circle' | 'square' | 'heart';
}

const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const items: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      shape: (['circle', 'square', 'heart'] as const)[Math.floor(Math.random() * 3)],
    }));
    setParticles(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.shape === 'heart' ? (
            <span style={{ fontSize: `${p.size + 4}px`, color: p.color }}>💖</span>
          ) : (
            <div
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: p.shape === 'circle' ? '50%' : '2px',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Heart rain in background
const HeartRain: React.FC = () => {
  const [hearts, setHearts] = useState<Array<{ id: number; emoji: string; x: number; delay: number; duration: number; size: number }>>([]);

  useEffect(() => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: ['💖', '💕', '💗', '🌸', '✨', '💝'][Math.floor(Math.random() * 6)],
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: Math.random() * 5 + 5,
      size: Math.random() * 16 + 12,
    }));
    setHearts(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((h) => (
        <div
          key={h.id}
          className="absolute floating-heart"
          style={{
            '--left': `${h.x}%`,
            '--delay': `${h.delay}s`,
            '--duration': `${h.duration}s`,
            '--size': `${h.size}px`,
          } as React.CSSProperties}
        >
          {h.emoji}
        </div>
      ))}
    </div>
  );
};

const Success: React.FC = () => {
  const { config, trackEvent } = useAppRuntime();
  const [showConfetti, setShowConfetti] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const letter = useMemo(
    () => ({
      ...SUCCESS_LETTER,
      greeting: `Aziz ${config.partnerFirstName},`,
      signature: config.myName,
    }),
    [config.myName, config.partnerFirstName],
  );

  useEffect(() => {
    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 500);

    // Stop confetti after 4 seconds
    setTimeout(() => setShowConfetti(false), 4000);

    // Telegram haptic
    try {
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch {}
    trackEvent('success_screen_opened', { partnerFirstName: config.partnerFirstName });
  }, [config.partnerFirstName, trackEvent]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center relative px-4 py-8">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Heart Rain */}
      <HeartRain />

      {/* Main Card */}
      {showContent && (
        <div className="w-full max-w-md mx-auto animate-fade-in-up z-10">
          {/* Top decoration */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 animate-heart-beat">
              <span className="text-4xl">💖</span>
              <span className="text-3xl">💕</span>
              <span className="text-4xl">💖</span>
            </div>
          </div>

          {/* Letter Card */}
          <div className="glass-card rounded-3xl p-8 shadow-love-lg relative overflow-hidden">
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-love-100 to-transparent rounded-bl-full opacity-50" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-love-100 to-transparent rounded-tr-full opacity-50" />

            {/* Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-love-400" />
              <h1 className="text-2xl md:text-3xl font-serif font-semibold text-gradient-love">
                Siz meni eng baxtli qildingiz!
              </h1>
              <Sparkles className="w-5 h-5 text-love-400" />
            </div>

            {/* Letter Content */}
            <div className="space-y-4 text-base font-light text-love-700 leading-relaxed relative z-10">
              <p className="font-serif text-love-500 text-lg italic">{letter.greeting}</p>

              {letter.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 0.3 + 0.5}s` }}
                >
                  {p}
                </p>
              ))}

              <div className="pt-4 border-t border-love-100 mt-6">
                <p className="text-love-500 font-medium text-right font-serif italic">
                  {letter.closing}
                </p>
                <p className="text-love-600 font-semibold text-right font-serif text-lg mt-1">
                  {letter.signature} 💕
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="text-center mt-8 space-y-3">
            <p className="text-love-400 text-sm font-light animate-pulse-soft">
              Bu xabar faqat siz uchun yaratilgan, {config.partnerFirstName} 💖
            </p>
            
            {/* Close button for Telegram */}
            <button
              onClick={() => {
                try {
                  window.Telegram?.WebApp?.close();
                } catch {}
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-love-100 text-love-600 rounded-full text-sm font-light hover:bg-love-200 transition-all"
            >
              <Heart className="w-4 h-4 fill-current" />
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Success;
