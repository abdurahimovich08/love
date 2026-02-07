import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Star, Sparkles, ChevronRight } from 'lucide-react';
import { DREAM_WISHES } from '../constants';
import { DreamWish, DreamsGameResult } from '../types';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface DreamsGameProps {
  onComplete: (result: DreamsGameResult) => void;
}

// ============================================================
// Ambient star data (static background)
// ============================================================
interface AmbientStar {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
}

function generateAmbientStars(count: number): AmbientStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.8,
    opacity: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }));
}

// Pre-calculated positions for placed stars (spread across the sky)
const PLACED_STAR_POSITIONS: { x: number; y: number }[] = [
  { x: 18, y: 10 },
  { x: 75, y: 8 },
  { x: 45, y: 20 },
  { x: 85, y: 25 },
  { x: 28, y: 30 },
  { x: 60, y: 12 },
  { x: 50, y: 5 },
];

type GamePhase =
  | 'intro'
  | 'idle'
  | 'flying'
  | 'waiting'
  | 'catching'
  | 'wishing'
  | 'ascending'
  | 'placed'
  | 'complete';

// ============================================================
// Night Sky Background
// ============================================================
const NightSkyBg: React.FC<{ placedCount: number }> = ({ placedCount }) => {
  const ambientStars = useMemo(() => generateAmbientStars(40), []);

  // Sky gets slightly brighter with more stars
  const skyBrightness = Math.min(placedCount * 3, 25);

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-all duration-1000"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, rgba(30,30,${80 + skyBrightness},1) 0%, rgba(10,10,${46 + skyBrightness * 0.5},1) 50%, rgba(5,5,${30 + skyBrightness * 0.3},1) 100%)`,
      }}
    >
      {/* Ambient stars */}
      {ambientStars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--base-opacity': `${s.opacity}`,
            animation: `starTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}

      {/* Moon (crescent) */}
      <div
        className="absolute"
        style={{
          top: '6%',
          left: '8%',
          animation: 'moonGlow 4s ease-in-out infinite',
        }}
      >
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" fill="#fcd34d" opacity="0.9" />
          <circle cx="26" cy="16" r="13" fill="rgba(10,10,46,1)" />
        </svg>
      </div>

      {/* Subtle gradient overlay at bottom for depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, rgba(5,5,30,0.6) 0%, transparent 100%)',
        }}
      />
    </div>
  );
};

// ============================================================
// Shooting Star (animated)
// ============================================================
const ShootingStar: React.FC<{
  color: string;
  onAnimEnd: () => void;
  direction: 'ltr' | 'rtl';
}> = ({ color, onAnimEnd, direction }) => {
  const isLTR = direction === 'ltr';

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: `${10 + Math.random() * 25}%`,
        [isLTR ? 'left' : 'right']: '-80px',
        animation: `${isLTR ? 'shootingStar' : 'shootingStarReverse'} 2.8s ease-in-out forwards`,
        zIndex: 10,
      }}
      onAnimationEnd={onAnimEnd}
    >
      {/* Trail */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          [isLTR ? 'right' : 'left']: '12px',
          width: '60px',
          height: '2px',
          background: `linear-gradient(${isLTR ? 'to left' : 'to right'}, ${color}, transparent)`,
          borderRadius: '2px',
        }}
      />
      {/* Star head */}
      <div
        className="relative w-4 h-4 rounded-full"
        style={{
          background: `radial-gradient(circle, white 0%, ${color} 60%, transparent 100%)`,
          boxShadow: `0 0 12px ${color}, 0 0 24px ${color}88`,
        }}
      />
    </div>
  );
};

// ============================================================
// Placed Star (wish star in the sky)
// ============================================================
const PlacedStar: React.FC<{
  wish: DreamWish;
  text: string;
  position: { x: number; y: number };
  index: number;
  isNew: boolean;
  isComplete: boolean;
}> = ({ wish, text, position, index, isNew, isComplete }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="absolute cursor-pointer z-20 group"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        animation: isNew
          ? `starSettle 0.8s ease-out ${index * 0.05}s both`
          : isComplete
          ? `starSettle 0.6s ease-out ${index * 0.12}s both`
          : undefined,
      }}
      onClick={() => setShowTooltip(!showTooltip)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full -m-2"
        style={{
          '--glow-color': `${wish.starColor}66`,
          animation: `starGlow 3s ease-in-out ${index * 0.4}s infinite`,
        } as React.CSSProperties}
      />

      {/* Star emoji */}
      <div
        className="text-lg relative"
        style={{
          '--glow-color': wish.starColor,
          animation: `starGlowText 3s ease-in-out ${index * 0.3}s infinite`,
          filter: `drop-shadow(0 0 6px ${wish.starColor})`,
        } as React.CSSProperties}
      >
        ⭐
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none"
          style={{ animation: 'wishFadeIn 0.25s ease-out', minWidth: '140px' }}
        >
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{
              background: 'rgba(15,15,50,0.9)',
              border: `1px solid ${wish.starColor}44`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <p className="text-[10px] mb-0.5" style={{ color: wish.starColor }}>
              {wish.emoji} {wish.title}
            </p>
            <p className="text-white/80 text-[11px] italic leading-snug">
              "{text.length > 50 ? text.slice(0, 50) + '...' : text}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Catching Star (descends to user)
// ============================================================
const CatchingStar: React.FC<{
  color: string;
  onDone: () => void;
}> = ({ color, onDone }) => {
  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
      style={{
        '--from-x': `${(Math.random() - 0.5) * 150}px`,
        '--from-y': '-220px',
        animation: 'starDescend 1s ease-out forwards',
      } as React.CSSProperties}
      onAnimationEnd={onDone}
    >
      {/* Glow */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
          boxShadow: `0 0 30px ${color}66, 0 0 60px ${color}33`,
        }}
      >
        <span className="text-2xl" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>⭐</span>
      </div>
    </div>
  );
};

// ============================================================
// Ascending Star (wish going up to sky)
// ============================================================
const AscendingStar: React.FC<{
  color: string;
  targetPos: { x: number; y: number };
  onDone: () => void;
}> = ({ color, targetPos, onDone }) => {
  // Calculate the offset from center to target
  const toX = `${(targetPos.x - 50) * 3}px`;
  const toY = `-${300 + Math.random() * 100}px`;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none"
      style={{
        bottom: '35%',
        '--to-x': toX,
        '--to-y': toY,
        animation: 'starAscend 1.4s ease-in forwards',
      } as React.CSSProperties}
      onAnimationEnd={(e) => {
        // Only fire for the parent's own animation, not child bubbling
        if (e.currentTarget === e.target) onDone();
      }}
    >
      {/* Star with trail */}
      <div className="relative">
        {/* Trail below */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            width: '2px',
            height: '40px',
            background: `linear-gradient(to bottom, ${color}, transparent)`,
            animation: 'trailFade 1.4s ease-in forwards',
          }}
        />
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${color}88`,
          }}
        >
          <span className="text-xl" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>⭐</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Wish Prompt (input area)
// ============================================================
const WishPrompt: React.FC<{
  wish: DreamWish;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  wishNumber: number;
  totalWishes: number;
}> = ({ wish, value, onChange, onSubmit, wishNumber, totalWishes }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-4"
      style={{
        background: 'linear-gradient(to top, rgba(5,5,35,0.95) 0%, rgba(5,5,35,0.7) 70%, transparent 100%)',
        animation: 'wishFadeIn 0.5s ease-out',
      }}
    >
      <div className="max-w-sm mx-auto space-y-3">
        {/* Header */}
        <div className="text-center">
          <span className="text-2xl mb-1 block" style={{ animation: 'emojiPop 0.4s ease-out' }}>
            {wish.emoji}
          </span>
          <h3 className="text-white/90 text-sm font-medium">{wish.title}</h3>
          <p className="text-white/40 text-[10px]">Tilak {wishNumber}/{totalWishes}</p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={wish.prompt}
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-white/90 text-sm placeholder:text-white/30 placeholder:italic resize-none focus:outline-none transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1.5px solid ${wish.starColor}44`,
              backdropFilter: 'blur(8px)',
            }}
            onFocus={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = `${wish.starColor}88`;
            }}
            onBlur={(e) => {
              (e.target as HTMLTextAreaElement).style.borderColor = `${wish.starColor}44`;
            }}
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-center">
          <button
            onClick={onSubmit}
            disabled={value.trim().length === 0}
            className="inline-flex items-center gap-2 px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: value.trim().length > 0
                ? `linear-gradient(135deg, ${wish.starColor}, ${wish.starColor}cc)`
                : 'rgba(255,255,255,0.1)',
              color: 'white',
              boxShadow: value.trim().length > 0
                ? `0 4px 20px ${wish.starColor}44`
                : 'none',
            }}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Tiladim ✨</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// "Tilak tila" floating button
// ============================================================
const WishButton: React.FC<{
  color: string;
  onClick: () => void;
}> = ({ color, onClick }) => {
  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30"
      style={{ animation: 'wishFadeIn 0.5s ease-out' }}
    >
      <button
        onClick={onClick}
        className="relative inline-flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-medium transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${color}cc, ${color})`,
          boxShadow: `0 0 20px ${color}44, 0 4px 15px rgba(0,0,0,0.3)`,
          animation: 'wishPulse 2s ease-in-out infinite',
        }}
      >
        <span className="text-lg">🌠</span>
        <span>Tilak tila</span>
        <Sparkles className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================================
// Main DreamsGame Component
// ============================================================
const DreamsGame: React.FC<DreamsGameProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [currentWishIndex, setCurrentWishIndex] = useState(0);
  const [wishes, setWishes] = useState<Record<number, string>>({});
  const [currentText, setCurrentText] = useState('');
  const [placedStars, setPlacedStars] = useState<number[]>([]);
  const [newestStar, setNewestStar] = useState<number | null>(null);
  const [flyDirection, setFlyDirection] = useState<'ltr' | 'rtl'>('ltr');

  const totalWishes = DREAM_WISHES.length;
  const currentWish = DREAM_WISHES[currentWishIndex] || DREAM_WISHES[0];

  useEffect(() => {
    trackEvent('dreams_phase_changed', {
      phase,
      currentWishIndex,
    });
  }, [currentWishIndex, phase, trackEvent]);

  // Intro → first star
  useEffect(() => {
    if (phase === 'intro') {
      const t = setTimeout(() => {
        setPhase('idle');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // idle → flying
  useEffect(() => {
    if (phase === 'idle') {
      const t = setTimeout(() => {
        setFlyDirection(Math.random() > 0.5 ? 'ltr' : 'rtl');
        setPhase('flying');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // placed → next idle (or complete)
  useEffect(() => {
    if (phase === 'placed') {
      const t = setTimeout(() => {
        setNewestStar(null);
        if (currentWishIndex >= totalWishes) {
          setPhase('complete');
          try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
        } else {
          setPhase('idle');
        }
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [phase, currentWishIndex, totalWishes]);

  // Shooting star finished flying → show "Tilak tila" button
  const handleShootEnd = useCallback(() => {
    setPhase('waiting');
  }, []);

  // "Tilak tila" pressed → catching star
  const handleWishBtnClick = useCallback(() => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
    trackEvent('dreams_wish_button_clicked', {
      wishId: currentWish.id,
      wishTitle: currentWish.title,
    });
    setPhase('catching');
  }, [currentWish.id, currentWish.title, trackEvent]);

  // Star descended to user → show wish input
  const handleCatchDone = useCallback(() => {
    setPhase('wishing');
  }, []);

  // Wish submitted → ascending star
  const handleWishSubmit = useCallback(() => {
    if (currentText.trim().length === 0) return;
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch {}

    const text = currentText.trim();
    trackEvent('dreams_wish_submitted', {
      wishId: currentWish.id,
      wishTitle: currentWish.title,
      textLength: text.length,
      text,
    });

    setWishes(prev => ({ ...prev, [currentWishIndex]: text }));
    setPhase('ascending');
  }, [currentText, currentWish.id, currentWish.title, currentWishIndex, trackEvent]);

  // Star ascended → place it
  const handleAscendDone = useCallback(() => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}

    setPlacedStars(prev => [...prev, currentWishIndex]);
    setNewestStar(currentWishIndex);
    setCurrentText('');
    setCurrentWishIndex(prev => prev + 1);
    setPhase('placed');
  }, [currentWishIndex]);

  // Complete screen
  const isComplete = phase === 'complete';

  const handleComplete = useCallback(() => {
    const result: DreamsGameResult = {
      wishes: placedStars.map((wishIndex) => ({
        wishId: DREAM_WISHES[wishIndex].id,
        title: DREAM_WISHES[wishIndex].title,
        text: wishes[wishIndex] || '',
      })),
    };

    trackEvent('dreams_game_completed', {
      totalWishes: result.wishes.length,
      wishes: result.wishes,
    });

    onComplete(result);
  }, [onComplete, placedStars, trackEvent, wishes]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{ height: '75vh', minHeight: '500px', maxHeight: '700px' }}
    >
      {/* Night sky background */}
      <NightSkyBg placedCount={placedStars.length} />

      {/* Placed stars */}
      {placedStars.map((wishIdx) => (
        <PlacedStar
          key={wishIdx}
          wish={DREAM_WISHES[wishIdx]}
          text={wishes[wishIdx] || ''}
          position={PLACED_STAR_POSITIONS[wishIdx]}
          index={wishIdx}
          isNew={newestStar === wishIdx}
          isComplete={isComplete}
        />
      ))}

      {/* Intro overlay */}
      {phase === 'intro' && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
          style={{ animation: 'fadeIn 1s ease-out' }}
        >
          <span className="text-4xl mb-3" style={{ animation: 'emojiPop 0.6s ease-out 0.3s both' }}>🌙</span>
          <h2 className="text-white/90 text-xl font-serif font-semibold mb-2">
            Orzular osmoni
          </h2>
          <p className="text-white/50 text-sm font-light max-w-[260px]">
            Tungi osmon sizning tilak va orzularingizni kutmoqda...
          </p>
        </div>
      )}

      {/* Shooting star */}
      {phase === 'flying' && (
        <ShootingStar
          color={currentWish.starColor}
          onAnimEnd={handleShootEnd}
          direction={flyDirection}
        />
      )}

      {/* "Tilak tila" button */}
      {phase === 'waiting' && (
        <WishButton
          color={currentWish.starColor}
          onClick={handleWishBtnClick}
        />
      )}

      {/* Catching star (descending) */}
      {phase === 'catching' && (
        <CatchingStar
          color={currentWish.starColor}
          onDone={handleCatchDone}
        />
      )}

      {/* Wish prompt (input area) */}
      {phase === 'wishing' && (
        <WishPrompt
          wish={currentWish}
          value={currentText}
          onChange={setCurrentText}
          onSubmit={handleWishSubmit}
          wishNumber={currentWishIndex + 1}
          totalWishes={totalWishes}
        />
      )}

      {/* Ascending star */}
      {phase === 'ascending' && (
        <AscendingStar
          color={currentWish.starColor}
          targetPos={PLACED_STAR_POSITIONS[currentWishIndex]}
          onDone={handleAscendDone}
        />
      )}

      {/* Progress counter (when not in intro or complete) */}
      {phase !== 'intro' && phase !== 'complete' && (
        <div
          className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
          <span className="text-white/70 text-xs font-medium">
            {placedStars.length}/{totalWishes}
          </span>
        </div>
      )}

      {/* Complete overlay */}
      {isComplete && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-8 px-6"
          style={{
            background: 'linear-gradient(to top, rgba(5,5,35,0.85) 0%, transparent 50%)',
            animation: 'finalGlow 1.5s ease-out',
          }}
        >
          <div className="text-center space-y-3" style={{ animation: 'wishFadeIn 0.6s ease-out 0.5s both' }}>
            {/* Sparkle emojis */}
            <div className="flex justify-center gap-2 mb-2">
              {['✨', '🌟', '⭐', '🌟', '✨'].map((e, i) => (
                <span
                  key={i}
                  className="text-lg"
                  style={{ animation: `emojiPop 0.5s ease-out ${0.8 + i * 0.15}s both` }}
                >
                  {e}
                </span>
              ))}
            </div>

            <h3 className="text-white/90 text-lg font-serif font-semibold">
              Orzular osmoni tayyor!
            </h3>
            <p className="text-white/50 text-xs font-light max-w-[260px] mx-auto">
              {config.partnerFirstName}ning {totalWishes} ta tilagi osmonni yoritdi. Har bir yulduz — yurakdan chiqqan orzu.
            </p>

            {/* Star count */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-yellow-200/80 text-sm font-medium">{totalWishes} / {totalWishes} tilak</span>
            </div>

            {/* Continue button */}
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full text-white text-base font-light transition-all duration-300 hover:scale-105 active:scale-95 mt-2"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #8b5cf6 100%)',
                boxShadow: '0 0 30px rgba(236,72,153,0.3), 0 4px 15px rgba(0,0,0,0.3)',
                animation: 'fadeInUp 0.5s ease-out 1.2s both',
              }}
            >
              <Sparkles className="w-5 h-5" />
              <span>Davom etish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DreamsGame;
