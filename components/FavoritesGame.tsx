import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ShoppingCart, Check, ChevronRight, Sparkles, Gift, X } from 'lucide-react';
import { FAVORITE_CATEGORIES } from '../constants';
import { FavoriteCategory, FavoritesGameResult } from '../types';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface FavoritesGameProps {
  onComplete: (result: FavoritesGameResult) => void;
}

interface CartItem {
  categoryId: string;
  userText: string;
}

const MIN_ITEMS = 5;

// ============================================================
// Item Card (single category tile on the shelf)
// ============================================================
const ItemCard: React.FC<{
  category: FavoriteCategory;
  index: number;
  isSelected: boolean;
  userText?: string;
  onTap: () => void;
}> = ({ category, index, isSelected, userText, onTap }) => {
  return (
    <button
      onClick={onTap}
      className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 transition-all duration-300 hover:scale-[1.04] active:scale-[0.96] ${
        isSelected
          ? 'border-love-500 bg-white/90 shadow-love'
          : 'border-love-100/60 bg-white/70 hover:border-love-300 hover:shadow-md'
      }`}
      style={{
        animation: `shelfSlideIn 0.4s ease-out ${index * 0.06}s both`,
        minHeight: '100px',
      }}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-love-500 flex items-center justify-center z-10"
          style={{ animation: 'emojiPop 0.3s ease-out' }}
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Price tag (heart) */}
      <div className="absolute top-1.5 left-1.5">
        <span className="text-[10px] text-love-300">💕</span>
      </div>

      {/* Emoji */}
      <span className="text-3xl">{category.emoji}</span>

      {/* Name */}
      <span className={`text-[11px] font-medium leading-tight text-center ${
        isSelected ? 'text-love-600' : 'text-love-500'
      }`}>
        {category.name}
      </span>

      {/* User text preview (when selected) */}
      {isSelected && userText && (
        <span className="text-[9px] text-love-400 italic leading-tight text-center truncate w-full px-1">
          {userText.length > 20 ? userText.slice(0, 20) + '...' : userText}
        </span>
      )}
    </button>
  );
};

// ============================================================
// Bottom Sheet (question + textarea)
// ============================================================
const BottomSheet: React.FC<{
  category: FavoriteCategory;
  initialText: string;
  onAdd: (text: string) => void;
  onRemove: () => void;
  onClose: () => void;
  isEditing: boolean;
}> = ({ category, initialText, onAdd, onRemove, onClose, isEditing }) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const canSubmit = text.trim().length > 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh]"
        style={{ animation: 'sheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        <div
          className="mx-auto max-w-lg rounded-t-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(253,242,248,0.97) 100%)',
            backdropFilter: 'blur(20px)',
            borderTop: '2px solid rgba(236,72,153,0.15)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-love-200" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 w-7 h-7 rounded-full bg-love-100 flex items-center justify-center hover:bg-love-200 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-love-500" />
          </button>

          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Header */}
            <div className="text-center">
              <span className="text-3xl mb-1.5 block" style={{ animation: 'emojiPop 0.4s ease-out' }}>
                {category.emoji}
              </span>
              <h3 className="text-love-700 text-base font-semibold">{category.name}</h3>
              <p className="text-love-400 text-sm font-light mt-0.5">{category.question}</p>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Yozing..."
              rows={2}
              className="w-full rounded-xl border-2 border-love-200/60 bg-white/80 px-4 py-3 text-love-700 text-sm placeholder:text-love-300 placeholder:italic focus:border-love-400 focus:outline-none focus:ring-2 focus:ring-love-200/40 resize-none transition-all duration-300"
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              {isEditing && (
                <button
                  onClick={onRemove}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-love-200 text-love-400 text-sm font-medium hover:bg-love-50 transition-all active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Olib tashlash</span>
                </button>
              )}
              <button
                onClick={() => canSubmit && onAdd(text.trim())}
                disabled={!canSubmit}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-300 active:scale-95 ${
                  canSubmit
                    ? 'btn-gradient-love shadow-love hover:shadow-love-lg hover:scale-[1.02]'
                    : 'bg-love-200 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isEditing ? 'Yangilash' : "Savatchaga qo'shish"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Cart Bar (bottom strip)
// ============================================================
const CartBar: React.FC<{
  cart: CartItem[];
  canCheckout: boolean;
  onCheckout: () => void;
}> = ({ cart, canCheckout, onCheckout }) => {
  const [bounce, setBounce] = useState(false);

  // Bounce when cart updates
  useEffect(() => {
    if (cart.length > 0) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(t);
    }
  }, [cart.length]);

  return (
    <div
      className="w-full rounded-2xl border-2 border-love-200/60 overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(253,242,248,0.9) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Cart icon with badge */}
        <div
          className="relative"
          style={{ animation: bounce ? 'cartBounce 0.4s ease-out' : undefined }}
        >
          <ShoppingCart className="w-6 h-6 text-love-500" />
          {cart.length > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-love-500 text-white text-[9px] font-bold flex items-center justify-center">
              {cart.length}
            </div>
          )}
        </div>

        {/* Mini emoji list */}
        <div className="flex-1 flex items-center gap-1 overflow-hidden">
          {cart.length === 0 ? (
            <span className="text-love-300 text-xs italic">Savatchaga narsalar qo'shing...</span>
          ) : (
            cart.map((item) => {
              const cat = FAVORITE_CATEGORIES.find(c => c.id === item.categoryId);
              return (
                <span
                  key={item.categoryId}
                  className="text-sm shrink-0"
                  style={{ animation: 'emojiPop 0.3s ease-out' }}
                  title={item.userText}
                >
                  {cat?.emoji}
                </span>
              );
            })
          )}
        </div>

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={!canCheckout}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 shrink-0 ${
            canCheckout
              ? 'btn-gradient-love text-white shadow-love hover:shadow-love-lg hover:scale-105 active:scale-95'
              : 'bg-love-100 text-love-300 cursor-not-allowed'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Kassaga</span>
        </button>
      </div>

      {/* Minimum hint */}
      {!canCheckout && cart.length > 0 && (
        <div className="px-4 pb-2 -mt-1">
          <p className="text-love-300 text-[10px] text-center">
            Yana kamida {MIN_ITEMS - cart.length} ta tanlang
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sparkle particle for gift scene
// ============================================================
const GiftSparkle: React.FC<{
  delay: number;
  radius: number;
  size: number;
  duration: number;
  emoji?: string;
}> = ({ delay, radius, size, duration, emoji }) => (
  <div
    className="absolute left-1/2 top-1/2 pointer-events-none z-10"
    style={{
      '--orbit-r': `${radius}px`,
      animation: `sparkleOrbit ${duration}s linear ${delay}s infinite`,
      fontSize: `${size}px`,
    } as React.CSSProperties}
  >
    {emoji || '✨'}
  </div>
);

// ============================================================
// Confetti burst particle
// ============================================================
const ConfettiBurstParticle: React.FC<{
  index: number;
  total: number;
  color: string;
  emoji: string;
}> = ({ index, total, color, emoji }) => {
  const angle = (index / total) * 360;
  const dist = 60 + Math.random() * 80;
  const bx = Math.cos((angle * Math.PI) / 180) * dist;
  const by = Math.sin((angle * Math.PI) / 180) * dist - 40;
  const rot = Math.random() * 720 - 360;

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{
        '--burst-x': `${bx}px`,
        '--burst-y': `${by}px`,
        '--burst-rot': `${rot}deg`,
        animation: `confettiBurst 1.2s ease-out ${index * 0.04}s forwards`,
        fontSize: '16px',
      } as React.CSSProperties}
    >
      {emoji}
    </div>
  );
};

// ============================================================
// Gift Wrap Screen (checkout animation — premium)
// ============================================================
const GiftWrapScreen: React.FC<{
  cart: CartItem[];
  partnerFirstName: string;
  onComplete: () => void;
}> = ({ cart, partnerFirstName, onComplete }) => {
  // Animation phases
  const [step, setStep] = useState<'appear' | 'filling' | 'closing' | 'ribbon' | 'shake' | 'done'>('appear');
  const [flyingIndex, setFlyingIndex] = useState(-1);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [sparklesActive, setSparklesActive] = useState(false);
  const [confettiBurst, setConfettiBurst] = useState(false);

  // Orchestrate the full animation sequence
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Box appears (0-800ms)
    timeouts.push(setTimeout(() => {
      setStep('filling');
      setSparklesActive(true);
    }, 900));

    // Phase 2: Items fly in one by one
    cart.forEach((item, i) => {
      const cat = FAVORITE_CATEGORIES.find(c => c.id === item.categoryId);
      const startTime = 1000 + i * 550;

      // Show label just before item flies
      timeouts.push(setTimeout(() => {
        setActiveLabel(`${cat?.emoji} ${cat?.name}`);
      }, startTime));

      // Fly item
      timeouts.push(setTimeout(() => {
        setFlyingIndex(i);
        try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
      }, startTime + 200));

      // Clear label
      timeouts.push(setTimeout(() => {
        setActiveLabel(null);
      }, startTime + 650));
    });

    // Phase 3: Close lid
    const afterFill = 1000 + cart.length * 550 + 400;
    timeouts.push(setTimeout(() => {
      setStep('closing');
      setSparklesActive(false);
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy'); } catch {}
    }, afterFill));

    // Phase 4: Ribbon
    timeouts.push(setTimeout(() => {
      setStep('ribbon');
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch {}
    }, afterFill + 900));

    // Phase 5: Shake + confetti
    timeouts.push(setTimeout(() => {
      setStep('shake');
      setConfettiBurst(true);
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
    }, afterFill + 1700));

    // Phase 6: Done
    timeouts.push(setTimeout(() => {
      setStep('done');
    }, afterFill + 2600));

    return () => timeouts.forEach(clearTimeout);
  }, [cart]);

  const filledCount = Math.min(flyingIndex + 1, cart.length);
  const progressPct = (filledCount / cart.length) * 100;

  const isLidOpen = step === 'appear' || step === 'filling';
  const showRibbon = step === 'ribbon' || step === 'shake' || step === 'done';
  const isDone = step === 'done';

  // Confetti emojis for burst
  const confettiEmojis = useMemo(() =>
    ['💝', '✨', '🎀', '💕', '🌟', '💖', '🎁', '💗', '⭐', '🎊', '💘', '🌸'].slice(0, Math.max(cart.length, 8)),
  [cart.length]);

  return (
    <div className="w-full flex flex-col items-center gap-5 py-2 relative" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Title — changes per phase */}
      <div className="text-center z-10" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        {!isDone ? (
          <>
            <h3 className="text-love-700 text-lg font-serif font-semibold mb-0.5">
              {step === 'appear' ? 'Sovg\'a tayyorlanmoqda...' :
               step === 'filling' ? 'Sevimlilar qadoqlanmoqda' :
               step === 'closing' ? 'Quti yopilmoqda...' :
               step === 'ribbon' ? 'Lenta bog\'lanmoqda...' :
               'Tayyor!'}
            </h3>
            <p className="text-love-400 text-xs font-light">
              {partnerFirstName} uchun maxsus sovg'a
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-1.5 mb-2">
              {['✨', '🎁', '💝', '🎁', '✨'].map((e, i) => (
                <span key={i} className="text-base" style={{ animation: `emojiPop 0.4s ease-out ${i * 0.1}s both` }}>{e}</span>
              ))}
            </div>
            <h3 className="text-love-700 text-xl font-serif font-semibold mb-0.5">
              {partnerFirstName}ning sevimlilari tayyor!
            </h3>
            <p className="text-love-400 text-xs font-light">
              {cart.length} ta sevimli narsa qadoqlandi
            </p>
          </>
        )}
      </div>

      {/* Progress bar (during filling) */}
      {(step === 'filling' || step === 'appear') && (
        <div className="w-full max-w-[200px] flex items-center gap-2" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="flex-1 h-1.5 bg-love-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #ec4899, #f43f5e)',
                animation: filledCount > 0 ? 'progressGlow 0.5s ease-out' : undefined,
              }}
            />
          </div>
          <span className="text-love-400 text-[10px] font-medium">{filledCount}/{cart.length}</span>
        </div>
      )}

      {/* Active item label */}
      {activeLabel && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          style={{ animation: 'itemLabel 0.65s ease-out forwards' }}
        >
          <div className="rounded-full px-4 py-1.5 bg-white/90 shadow-love border border-love-200/50">
            <span className="text-love-600 text-sm font-medium">{activeLabel}</span>
          </div>
        </div>
      )}

      {/* === Gift Box Area === */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: '220px',
          height: '220px',
          animation: step === 'appear' ? 'boxAppear 0.8s ease-out' :
                     step === 'shake' ? 'giftShake 0.8s ease-out, giftReveal 0.8s ease-out' :
                     isDone ? 'giftGlow 3s ease-in-out infinite' : undefined,
        }}
      >
        {/* Orbiting sparkles during filling */}
        {sparklesActive && (
          <>
            <GiftSparkle delay={0} radius={85} size={12} duration={4} emoji="✨" />
            <GiftSparkle delay={0.8} radius={75} size={10} duration={3.5} emoji="💕" />
            <GiftSparkle delay={1.6} radius={90} size={11} duration={4.5} emoji="🌟" />
            <GiftSparkle delay={2.4} radius={70} size={9} duration={3} emoji="💖" />
          </>
        )}

        {/* Confetti burst */}
        {confettiBurst && confettiEmojis.map((emoji, i) => (
          <ConfettiBurstParticle
            key={i}
            index={i}
            total={confettiEmojis.length}
            color="#ec4899"
            emoji={emoji}
          />
        ))}

        {/* Flying items */}
        {cart.map((item, i) => {
          const cat = FAVORITE_CATEGORIES.find(c => c.id === item.categoryId);
          if (i > flyingIndex) return null;
          const angle = (i / cart.length) * 360 + 90;
          const radius = 95;
          const startX = Math.cos((angle * Math.PI) / 180) * radius;
          const startY = Math.sin((angle * Math.PI) / 180) * radius - 20;
          return (
            <div
              key={item.categoryId}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
              style={{
                '--start-x': `${startX}px`,
                '--start-y': `${startY}px`,
                animation: 'itemFlyToBox 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              } as React.CSSProperties}
            >
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 2px 8px rgba(236,72,153,0.3))' }}>
                {cat?.emoji}
              </span>
            </div>
          );
        })}

        {/* Box SVG — more detailed */}
        <div className="relative" style={{ marginTop: '20px' }}>
          {/* Box shadow */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[140px] h-3 rounded-[50%] opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)' }}
          />

          {/* Box base */}
          <svg width="160" height="110" viewBox="0 0 160 110" className="relative z-[2]">
            <defs>
              <linearGradient id="boxBody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fce7f3" />
                <stop offset="50%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#f9a8d4" />
              </linearGradient>
              <linearGradient id="boxSide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#fbcfe8" />
              </linearGradient>
            </defs>
            {/* Front face */}
            <rect x="10" y="5" width="140" height="95" rx="10" fill="url(#boxBody)" stroke="#ec4899" strokeWidth="2" />
            {/* Left edge highlight */}
            <rect x="10" y="5" width="6" height="95" rx="3" fill="url(#boxSide)" opacity="0.5" />
            {/* Decorative patterns */}
            <circle cx="40" cy="55" r="4" fill="#ec4899" opacity="0.08" />
            <circle cx="80" cy="40" r="6" fill="#ec4899" opacity="0.06" />
            <circle cx="120" cy="65" r="5" fill="#ec4899" opacity="0.07" />
            {/* Heart pattern */}
            <text x="80" y="62" textAnchor="middle" fontSize="20" opacity="0.15">💕</text>
            <text x="45" y="80" textAnchor="middle" fontSize="12" opacity="0.1">💗</text>
            <text x="115" y="45" textAnchor="middle" fontSize="12" opacity="0.1">💖</text>
          </svg>

          {/* Box lid */}
          <div
            className="absolute -top-5 left-1/2 -translate-x-1/2 z-[3]"
            style={{
              transformOrigin: 'bottom center',
              animation: isLidOpen
                ? 'boxLidOpen 0.7s ease-out forwards'
                : 'boxLidClose 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            }}
          >
            <svg width="170" height="28" viewBox="0 0 170 28">
              <defs>
                <linearGradient id="lidGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f9a8d4" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="170" height="26" rx="8" fill="url(#lidGrad)" stroke="#ec4899" strokeWidth="2" />
              {/* Center stripe */}
              <rect x="75" y="0" width="20" height="26" fill="#ec4899" opacity="0.2" rx="4" />
            </svg>
          </div>

          {/* Ribbon — vertical + horizontal + bow */}
          {showRibbon && (
            <>
              {/* Vertical ribbon */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-[4]"
                style={{
                  top: '-3px',
                  width: '14px',
                  height: '108px',
                  background: 'linear-gradient(180deg, #fcd34d 0%, #fbbf24 50%, #f59e0b 100%)',
                  borderRadius: '2px',
                  animation: 'ribbonVertical 0.4s ease-out forwards',
                  transformOrigin: 'top center',
                  boxShadow: '0 0 8px rgba(251,191,36,0.3)',
                }}
              />
              {/* Horizontal ribbon */}
              <div
                className="absolute left-[10px] z-[4]"
                style={{
                  top: '45px',
                  width: '140px',
                  height: '14px',
                  background: 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 50%, #fbbf24 100%)',
                  borderRadius: '2px',
                  animation: 'ribbonHorizontal 0.4s ease-out 0.2s both',
                  transformOrigin: 'left center',
                  boxShadow: '0 0 8px rgba(251,191,36,0.3)',
                }}
              />
              {/* Bow SVG */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-[5]"
                style={{
                  top: '-22px',
                  animation: 'ribbonAppear 0.6s ease-out 0.4s both',
                }}
              >
                <svg width="50" height="36" viewBox="0 0 50 36">
                  {/* Left loop */}
                  <ellipse cx="13" cy="14" rx="12" ry="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                  <ellipse cx="13" cy="14" rx="7" ry="5" fill="#fcd34d" opacity="0.5" />
                  {/* Right loop */}
                  <ellipse cx="37" cy="14" rx="12" ry="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
                  <ellipse cx="37" cy="14" rx="7" ry="5" fill="#fcd34d" opacity="0.5" />
                  {/* Center knot */}
                  <circle cx="25" cy="16" r="6" fill="#f59e0b" />
                  <circle cx="25" cy="16" r="3" fill="#fbbf24" />
                  {/* Tails */}
                  <path d="M20,22 Q15,30 10,35" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M30,22 Q35,30 40,35" stroke="#fbbf24" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Done: summary + button */}
      {isDone && (
        <div className="w-full space-y-4 z-10" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          {/* Summary list */}
          <div className="glass-card rounded-2xl px-4 py-3.5 mx-auto max-w-xs">
            <p className="text-love-400 text-[10px] font-medium uppercase tracking-wider text-center mb-2.5">
              Sovg'a ichida
            </p>
            <div className="space-y-2">
              {cart.map((item, i) => {
                const cat = FAVORITE_CATEGORIES.find(c => c.id === item.categoryId);
                return (
                  <div
                    key={item.categoryId}
                    className="flex items-center gap-2.5 text-left"
                    style={{ animation: `fadeInUp 0.3s ease-out ${0.1 + i * 0.06}s both` }}
                  >
                    <span className="text-base shrink-0">{cat?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-love-500 text-[10px]">{cat?.name}</span>
                      <p className="text-love-700 text-xs font-medium truncate">{item.userText}</p>
                    </div>
                    <span className="text-love-300 text-[10px]">💕</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Continue button */}
          <div className="text-center">
            <button
              onClick={onComplete}
              className="inline-flex items-center gap-2 px-10 py-3.5 btn-gradient-love text-white rounded-full shadow-love-lg hover:shadow-love hover:scale-105 active:scale-95 transition-all"
              style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-base font-light">Davom etish</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main FavoritesGame Component
// ============================================================
const FavoritesGame: React.FC<FavoritesGameProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [phase, setPhase] = useState<'shopping' | 'wrapping' | 'done'>('shopping');

  const canCheckout = cart.length >= MIN_ITEMS;

  // Find category by id
  const getCategory = useCallback((id: string) =>
    FAVORITE_CATEGORIES.find(c => c.id === id)
  , []);

  // Check if a category is in cart
  const getCartItem = useCallback((categoryId: string) =>
    cart.find(item => item.categoryId === categoryId)
  , [cart]);

  // Open bottom sheet for a category
  const handleTapCategory = useCallback((categoryId: string) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch {}
    trackEvent('favorites_category_opened', { categoryId });
    setActiveSheet(categoryId);
  }, [trackEvent]);

  // Add item to cart (or update)
  const handleAddToCart = useCallback((categoryId: string, text: string) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
    trackEvent('favorites_item_saved', {
      categoryId,
      text,
      textLength: text.length,
    });

    setCart(prev => {
      const existing = prev.findIndex(item => item.categoryId === categoryId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { categoryId, userText: text };
        return next;
      }
      return [...prev, { categoryId, userText: text }];
    });
    setActiveSheet(null);
  }, [trackEvent]);

  // Remove item from cart
  const handleRemoveFromCart = useCallback((categoryId: string) => {
    trackEvent('favorites_item_removed', { categoryId });
    setCart(prev => prev.filter(item => item.categoryId !== categoryId));
    setActiveSheet(null);
  }, [trackEvent]);

  // Close sheet
  const handleCloseSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  // Go to checkout
  const handleCheckout = useCallback(() => {
    if (!canCheckout) return;
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch {}
    trackEvent('favorites_checkout_started', { items: cart.length });
    setPhase('wrapping');
  }, [canCheckout, cart.length, trackEvent]);

  const handleComplete = useCallback(() => {
    const result: FavoritesGameResult = {
      favorites: cart.map((item) => ({
        categoryId: item.categoryId,
        categoryName: FAVORITE_CATEGORIES.find((category) => category.id === item.categoryId)?.name ?? item.categoryId,
        value: item.userText,
      })),
    };

    trackEvent('favorites_game_completed', {
      totalFavorites: result.favorites.length,
      favorites: result.favorites,
    });
    onComplete(result);
  }, [cart, onComplete, trackEvent]);

  // Active sheet category
  const activeCategory = activeSheet ? getCategory(activeSheet) : null;
  const activeCartItem = activeSheet ? getCartItem(activeSheet) : null;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {phase === 'shopping' && (
        <>
          {/* Header */}
          <div className="text-center animate-fade-in-up px-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-love-100 mb-2">
              <ShoppingCart className="w-6 h-6 text-love-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-gradient-love mb-1">
              Sevimlilar do'koni
            </h2>
            <p className="text-love-400 font-light text-sm">
              Sevimli narsalaringizni savatchaga qo'shing!
            </p>
          </div>

          {/* Shelf grid */}
          <div className="grid grid-cols-3 gap-2.5 px-1">
            {FAVORITE_CATEGORIES.map((cat, i) => {
              const cartItem = getCartItem(cat.id);
              return (
                <ItemCard
                  key={cat.id}
                  category={cat}
                  index={i}
                  isSelected={!!cartItem}
                  userText={cartItem?.userText}
                  onTap={() => handleTapCategory(cat.id)}
                />
              );
            })}
          </div>

          {/* Cart bar */}
          <CartBar
            cart={cart}
            canCheckout={canCheckout}
            onCheckout={handleCheckout}
          />

          {/* Bottom sheet */}
          {activeSheet && activeCategory && (
            <BottomSheet
              category={activeCategory}
              initialText={activeCartItem?.userText || ''}
              onAdd={(text) => handleAddToCart(activeSheet, text)}
              onRemove={() => handleRemoveFromCart(activeSheet)}
              onClose={handleCloseSheet}
              isEditing={!!activeCartItem}
            />
          )}
        </>
      )}

      {(phase === 'wrapping' || phase === 'done') && (
        <GiftWrapScreen
          cart={cart}
          partnerFirstName={config.partnerFirstName}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
};

export default FavoritesGame;
