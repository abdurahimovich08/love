import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Anchor, Sparkles } from 'lucide-react';
import {
  FAKE_FIRST_NAMES,
  FAKE_LAST_NAMES,
  WRONG_NAME_PHRASES,
  WRONG_SURNAME_PHRASES,
} from '../constants';
import { NameGameResult } from '../types';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface NameGameProps {
  onComplete: (result: NameGameResult) => void;
}

// ============================================================
// Types
// ============================================================
interface PearlData {
  id: string;
  text: string;
  isCorrect: boolean;
  x: number;
  y: number;
  delay: number;
}

type PearlState = 'floating' | 'caught' | 'wrong' | 'bitten' | 'bumped' | 'removed';
type SharkMood = 'swimming' | 'angry' | 'happy' | 'bumping';

interface SharkVisual {
  x: number;
  y: number;
  mood: SharkMood;
  jawOpen: boolean;
  speed: number;   // CSS transition ms
  rotation: number; // degrees
}

interface ImpactFX {
  id: string;
  x: number;
  y: number;
  type: 'bump' | 'bite';
}

// ============================================================
// Helpers
// ============================================================
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPearls(names: string[], correctName: string): PearlData[] {
  const fakes = shuffleArray(names.filter(n => n.toLowerCase() !== correctName.toLowerCase())).slice(0, 7);
  const all = shuffleArray([...fakes, correctName]);
  const cols = 3;
  return all.map((text, i) => ({
    id: `pearl-${i}-${Math.random().toString(36).slice(2, 6)}`,
    text,
    isCorrect: text.toLowerCase() === correctName.toLowerCase(),
    x: 6 + (i % cols) * 28 + Math.random() * 14,
    y: 10 + Math.floor(i / cols) * 26 + Math.random() * 12,
    delay: Math.random() * 2,
  }));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================================================
// Ship SVG
// ============================================================
const ShipSVG: React.FC = () => (
  <div style={{ animation: 'shipRock 3s ease-in-out infinite' }}>
    <svg width="90" height="50" viewBox="0 0 90 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M5,30 L15,45 L75,45 L85,30 Z" fill="#5d4037" />
      <path d="M8,30 L16,43 L74,43 L82,30 Z" fill="#6d4c41" />
      <rect x="20" y="22" width="50" height="10" rx="2" fill="#8d6e63" />
      <rect x="30" y="10" width="30" height="14" rx="2" fill="#a1887f" />
      <rect x="35" y="13" width="8" height="7" rx="1" fill="#bbdefb" opacity="0.8" />
      <rect x="47" y="13" width="8" height="7" rx="1" fill="#bbdefb" opacity="0.8" />
      <rect x="55" y="2" width="8" height="10" rx="1" fill="#e57373" />
      <rect x="54" y="0" width="10" height="3" rx="1" fill="#c62828" />
      <circle cx="59" cy="-2" r="3" fill="#bdbdbd" opacity="0.4">
        <animate attributeName="cy" values="-2;-8;-16" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;5;6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0.2;0" dur="2s" repeatCount="indefinite" />
      </circle>
      <line x1="20" y1="18" x2="70" y2="18" stroke="#8d6e63" strokeWidth="0.8" />
    </svg>
  </div>
);

// ============================================================
// Fishing hook
// ============================================================
const HookSVG: React.FC = () => (
  <svg width="16" height="24" viewBox="0 0 16 24" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="0" x2="8" y2="14" stroke="#78909c" strokeWidth="1.5" />
    <path d="M8,14 Q8,20 4,22 Q0,24 2,20" stroke="#78909c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="2" cy="19" r="1.5" fill="#e0e0e0" />
  </svg>
);

// ============================================================
// Shark SVG — fully enhanced
// ============================================================
const SharkSVG: React.FC<{
  visual: SharkVisual;
  facingLeft: boolean;
  speech: string | null;
}> = ({ visual, facingLeft, speech }) => {
  const { x, y, mood, jawOpen, speed, rotation } = visual;
  const bodyColor = mood === 'angry' ? '#ef4444' : mood === 'happy' ? '#ec4899' : mood === 'bumping' ? '#f97316' : '#607d8b';
  const bellyColor = mood === 'angry' ? '#fca5a5' : mood === 'happy' ? '#fbcfe8' : '#cfd8dc';
  const eyeColor = mood === 'angry' ? '#7f1d1d' : mood === 'happy' ? '#9d174d' : '#1e293b';
  const moodScale = mood === 'angry' ? 1.18 : mood === 'bumping' ? 1.08 : 1;
  const moodAnim =
    mood === 'swimming' ? 'pearlFloat 2.8s ease-in-out infinite' :
    mood === 'angry'    ? 'shake 0.3s ease-in-out 3' :
    mood === 'bumping'  ? 'shake 0.2s ease-in-out 2' : undefined;

  return (
    <>
      {/* Position wrapper — moves at shark speed */}
      <div
        className="absolute z-30 pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transition: `left ${speed}ms cubic-bezier(0.25,0.1,0.25,1), top ${speed}ms cubic-bezier(0.25,0.1,0.25,1)`,
        }}
      >
        {/* Direction + rotation wrapper — snappy */}
        <div style={{
          transform: `translate(-50%, -50%) scaleX(${facingLeft ? -1 : 1}) rotate(${rotation}deg) scale(${moodScale})`,
          transition: 'transform 0.18s ease',
        }}>
          {/* Mood animation wrapper */}
          <div style={{ animation: moodAnim }}>
            <svg width="68" height="42" viewBox="0 0 72 44" xmlns="http://www.w3.org/2000/svg">
              {/* Shadow on sea floor */}
              <ellipse cx="34" cy="42" rx="20" ry="2" fill="black" opacity="0.08" />

              {/* Main body */}
              <ellipse cx="32" cy="20" rx="26" ry="14" fill={bodyColor} opacity="0.9">
                <animate attributeName="ry" values="14;13.5;14" dur="1.5s" repeatCount="indefinite" />
              </ellipse>

              {/* Belly */}
              <ellipse cx="36" cy="26" rx="18" ry="7" fill={bellyColor} opacity="0.35" />

              {/* Nose / snout */}
              <path d="M56,19 Q68,17.5 72,20 Q68,22.5 56,21" fill={bodyColor} />

              {/* Tail — animated wag */}
              <path fill={bodyColor} opacity="0.85">
                <animate attributeName="d"
                  values="M6,20 Q-2,8 0,2 Q4,10 6,20;M6,20 Q-4,10 -1,4 Q3,12 6,20;M6,20 Q-2,8 0,2 Q4,10 6,20"
                  dur={mood === 'angry' || mood === 'bumping' ? '0.3s' : '0.7s'} repeatCount="indefinite" />
              </path>
              <path fill={bodyColor} opacity="0.85">
                <animate attributeName="d"
                  values="M6,20 Q-2,32 0,38 Q4,30 6,20;M6,20 Q-4,30 -1,36 Q3,28 6,20;M6,20 Q-2,32 0,38 Q4,30 6,20"
                  dur={mood === 'angry' || mood === 'bumping' ? '0.3s' : '0.7s'} repeatCount="indefinite" />
              </path>

              {/* Dorsal fin */}
              <path d="M26,6 L34,-2 L38,6" fill={bodyColor} opacity="0.95" />

              {/* Pectoral fin */}
              <path d="M36,29 L42,37 L48,30" fill={bodyColor} opacity="0.65">
                <animate attributeName="d"
                  values="M36,29 L42,37 L48,30;M36,29 L43,35 L48,29;M36,29 L42,37 L48,30"
                  dur="1.2s" repeatCount="indefinite" />
              </path>

              {/* Gills */}
              <line x1="45" y1="15" x2="45" y2="25" stroke={bodyColor} strokeWidth="0.6" opacity="0.3" />
              <line x1="43" y1="15.5" x2="43" y2="24.5" stroke={bodyColor} strokeWidth="0.6" opacity="0.2" />
              <line x1="41" y1="16" x2="41" y2="24" stroke={bodyColor} strokeWidth="0.6" opacity="0.15" />

              {/* Eye white */}
              <circle cx="52" cy="16" r="4" fill="white" />
              {/* Pupil — looks in movement direction */}
              <circle cx={mood === 'angry' ? '53.5' : '53'} cy={mood === 'angry' ? '16.5' : '16'} r="2.2" fill={eyeColor} />
              {/* Eye shine */}
              <circle cx="54" cy="15" r="0.8" fill="white" opacity="0.8" />

              {/* Eyebrow */}
              {(mood === 'angry' || mood === 'bumping') && (
                <line x1="48" y1={mood === 'angry' ? '10' : '11'} x2="56" y2={mood === 'angry' ? '13.5' : '13'}
                  stroke={eyeColor} strokeWidth={mood === 'angry' ? '2' : '1.3'} strokeLinecap="round" />
              )}
              {mood === 'happy' && (
                <path d="M48,13 Q52,10.5 56,13" stroke={eyeColor} strokeWidth="1" fill="none" />
              )}

              {/* ====== MOUTH / JAW ====== */}
              {jawOpen ? (
                <>
                  {/* Upper jaw */}
                  <path d="M56,18 L67,15 L66,20" fill="#3b0000" opacity="0.85" />
                  {/* Upper teeth */}
                  <path d="M57,18 L59,19.5 L61,18 L63,19.5 L65,18" stroke="white" strokeWidth="0.9" fill="none" />
                  {/* Lower jaw — drops */}
                  <path d="M56,23 L67,26 L66,21" fill="#3b0000" opacity="0.85" />
                  {/* Lower teeth */}
                  <path d="M57,23 L59,21.5 L61,23 L63,21.5 L65,23" stroke="white" strokeWidth="0.9" fill="none" />
                  {/* Mouth interior */}
                  <ellipse cx="62" cy="20.5" rx="3" ry="2" fill="#7f1d1d" opacity="0.6" />
                </>
              ) : mood === 'angry' ? (
                <>
                  {/* Clenched teeth - biting */}
                  <path d="M56,19 L66,18 L65,23 L56,22" fill="#3b0000" opacity="0.7" />
                  <path d="M57,19.5 L59,21 L61,19.5 L63,21 L65,19.5" stroke="white" strokeWidth="0.8" fill="none" />
                  <path d="M57,22 L59,20.5 L61,22 L63,20.5 L65,22" stroke="white" strokeWidth="0.8" fill="none" />
                </>
              ) : mood === 'happy' ? (
                <path d="M56,22 Q61,27 66,22" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              ) : mood === 'bumping' ? (
                <>
                  <path d="M57,20 L65,19.5 L64,23 L57,22.5" fill="#1e293b" opacity="0.25" />
                  <line x1="59" y1="20.5" x2="59" y2="22" stroke="white" strokeWidth="0.5" opacity="0.5" />
                  <line x1="62" y1="20.3" x2="62" y2="22.2" stroke="white" strokeWidth="0.5" opacity="0.5" />
                </>
              ) : (
                <line x1="57" y1="22" x2="64" y2="22" stroke="white" strokeWidth="0.8" opacity="0.4" />
              )}

              {/* Happy blush */}
              {mood === 'happy' && (
                <>
                  <circle cx="49" cy="22" r="3" fill="#f9a8d4" opacity="0.4" />
                  <circle cx="60" cy="21" r="2" fill="#f9a8d4" opacity="0.3" />
                </>
              )}
            </svg>

            {/* Floating hearts when happy */}
            {mood === 'happy' && (
              <div
                className="absolute -top-3 left-1/2 flex gap-1.5 pointer-events-none"
                style={{ transform: `translateX(-50%) scaleX(${facingLeft ? -1 : 1})` }}
              >
                <span className="text-[11px] animate-float" style={{ animationDelay: '0s' }}>💕</span>
                <span className="text-[9px] animate-float" style={{ animationDelay: '0.35s' }}>❤️</span>
                <span className="text-[10px] animate-float" style={{ animationDelay: '0.7s' }}>💗</span>
              </div>
            )}

            {/* Speech bubble */}
            {speech && (
              <div
                className="absolute -top-8 left-1/2 z-50"
                style={{
                  transform: `translateX(-50%) scaleX(${facingLeft ? -1 : 1})`,
                  animation: 'toastIn 0.2s ease-out',
                }}
              >
                <div className={`text-white text-[9px] px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg font-semibold ${
                  mood === 'angry' ? 'bg-red-500' : mood === 'happy' ? 'bg-pink-500' : 'bg-orange-500'
                }`}>
                  {speech}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ============================================================
// Impact burst at collision point
// ============================================================
const ImpactBurst: React.FC<{ fx: ImpactFX }> = ({ fx }) => {
  const isBite = fx.type === 'bite';
  const color = isBite ? 'rgba(239,68,68,' : 'rgba(249,115,22,';
  return (
    <div
      className="absolute pointer-events-none z-40"
      style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      {/* Expanding ring */}
      <div style={{
        width: 0, height: 0,
        borderRadius: '50%',
        border: `2px solid ${color}0.8)`,
        animation: 'impactRingExpand 0.5s ease-out forwards',
      }} />
      {/* Particles */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: isBite ? '4px' : '3px',
            height: isBite ? '4px' : '3px',
            background: `${color}0.9)`,
            top: '50%', left: '50%',
            transform: `translate(-50%, -50%)`,
            animation: `impactParticleFly 0.45s ease-out forwards`,
            animationDelay: `${i * 0.03}s`,
            // @ts-ignore — CSS custom props
            '--angle': `${angle}deg`,
            '--dist': isBite ? '22px' : '15px',
          }}
        />
      ))}
      {/* Central emoji */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm" style={{
        animation: 'scaleIn 0.3s ease-out',
      }}>
        {isBite ? '💥' : '💨'}
      </div>
    </div>
  );
};

// ============================================================
// Inline keyframes for impact (injected once)
// ============================================================
const ImpactStyles: React.FC = () => (
  <style>{`
    @keyframes impactRingExpand {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: 36px; height: 36px; margin: -18px 0 0 -18px; opacity: 0; }
    }
    @keyframes impactParticleFly {
      0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0); opacity: 1; }
      100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)); opacity: 0; }
    }
  `}</style>
);

// ============================================================
// Sea floor
// ============================================================
const SeaFloorSVG: React.FC = () => (
  <svg className="absolute bottom-0 left-0 w-full h-12 z-0" viewBox="0 0 400 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="30" width="400" height="20" fill="#d7ccc8" opacity="0.5" />
    <ellipse cx="200" cy="32" rx="220" ry="8" fill="#bcaaa4" opacity="0.4" />
    <path d="M40,50 Q38,35 42,20 Q44,30 40,50" fill="#66bb6a" opacity="0.5" />
    <path d="M45,50 Q43,30 48,15 Q50,28 45,50" fill="#81c784" opacity="0.4" />
    <path d="M160,50 Q158,38 162,25 Q164,36 160,50" fill="#81c784" opacity="0.35" />
    <path d="M240,50 Q237,36 242,22 Q244,34 240,50" fill="#66bb6a" opacity="0.4" />
    <path d="M320,50 Q318,32 322,18 Q325,30 320,50" fill="#66bb6a" opacity="0.5" />
    <path d="M350,50 Q347,36 352,22 Q354,34 350,50" fill="#4caf50" opacity="0.4" />
    <ellipse cx="100" cy="42" rx="5" ry="3" fill="#ffccbc" opacity="0.5" />
    <ellipse cx="280" cy="44" rx="4" ry="2.5" fill="#f8bbd0" opacity="0.5" />
    <text x="180" y="46" fontSize="10" opacity="0.3">⭐</text>
    <text x="60" y="44" fontSize="8" opacity="0.25">🐚</text>
    <text x="330" y="43" fontSize="8" opacity="0.25">🐚</text>
  </svg>
);

// ============================================================
// Bubbles (stable data to avoid re-render jitter)
// ============================================================
const BUBBLE_DATA = [...Array(8)].map((_, i) => ({
  k: i,
  w: 3 + Math.random() * 5,
  l: 5 + Math.random() * 90,
  b: Math.random() * 50,
  d: 3 + Math.random() * 3,
  dl: Math.random() * 5,
}));

const Bubbles: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {BUBBLE_DATA.map((b) => (
      <div
        key={b.k}
        className="absolute rounded-full bg-white/20 border border-white/10"
        style={{ width: `${b.w}px`, height: `${b.w}px`, left: `${b.l}%`, bottom: `${b.b}%`,
          animation: `bubbleRise ${b.d}s ease-out infinite`, animationDelay: `${b.dl}s`,
        }}
      />
    ))}
  </div>
);

// ============================================================
// Wave surface
// ============================================================
const WaveSurface: React.FC = () => (
  <div className="absolute top-0 left-0 right-0 h-4 z-10 overflow-hidden" style={{ animation: 'seaWave 4s ease-in-out infinite' }}>
    <svg viewBox="0 0 500 20" preserveAspectRatio="none" className="w-[200%] h-full" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,10 Q30,0 60,10 Q90,20 120,10 Q150,0 180,10 Q210,20 240,10 Q270,0 300,10 Q330,20 360,10 Q390,0 420,10 Q450,20 500,10 L500,20 L0,20 Z" fill="#1e88e5" opacity="0.3" />
      <path d="M0,12 Q25,4 50,12 Q75,20 100,12 Q125,4 150,12 Q175,20 200,12 Q225,4 250,12 Q275,20 300,12 L500,12 L500,20 L0,20 Z" fill="#1565c0" opacity="0.2" />
    </svg>
  </div>
);

// ============================================================
// Pearl component
// ============================================================
interface PearlProps {
  pearl: PearlData;
  onTap: (pearl: PearlData) => void;
  state: PearlState;
  offsetX: number;
  offsetY: number;
}

const Pearl: React.FC<PearlProps> = ({ pearl, onTap, state, offsetX, offsetY }) => {
  if (state === 'removed') return null;

  const isBitten = state === 'bitten';
  const canTap = state === 'floating' || state === 'bumped';

  const stateClasses =
    state === 'floating'
      ? 'bg-white/90 text-love-700 border-2 border-love-200 shadow-md hover:border-love-400 hover:scale-105 active:scale-95 cursor-pointer'
      : state === 'caught'
      ? 'bg-love-500 text-white border-2 border-love-400 shadow-love-lg scale-110'
      : state === 'wrong'
      ? 'bg-red-100 text-red-500 border-2 border-red-300'
      : state === 'bitten'
      ? 'bg-red-50/60 text-red-300 border-2 border-red-200 border-dashed cursor-not-allowed opacity-60'
      : state === 'bumped'
      ? 'bg-white/80 text-love-700 border-2 border-orange-300 shadow-md cursor-pointer'
      : '';

  const stateAnim =
    state === 'floating'
      ? `pearlFloat ${2.5 + pearl.delay}s ease-in-out infinite`
      : state === 'caught'
      ? 'pearlCatch 0.6s ease-out forwards'
      : state === 'wrong'
      ? 'shake 0.35s ease-in-out 2'
      : state === 'bumped'
      ? 'shake 0.25s ease-in-out'
      : undefined;

  return (
    <button
      onClick={() => canTap && onTap(pearl)}
      disabled={!canTap}
      className={`absolute px-2 py-0.5 rounded-full text-[10px] font-medium select-none z-10 ${stateClasses}`}
      style={{
        left: `calc(${pearl.x}% + ${offsetX}px)`,
        top: `calc(${pearl.y}% + ${offsetY}px)`,
        transition: 'left 0.5s ease-out, top 0.5s ease-out, opacity 0.3s ease',
        animation: stateAnim,
        animationDelay: state === 'floating' ? `${pearl.delay}s` : undefined,
      }}
    >
      <span className="flex items-center gap-0.5 whitespace-nowrap">
        {isBitten ? (
          <>
            <span className="text-[8px]">💥</span>
            <span className="line-through decoration-red-400 decoration-2">{pearl.text}</span>
            <span className="text-[7px] ml-0.5">🦷</span>
          </>
        ) : (
          <>
            <span className="opacity-40 text-[8px]">🦪</span>
            {pearl.text}
          </>
        )}
      </span>
    </button>
  );
};

// ============================================================
// Toast
// ============================================================
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div
    className={`absolute bottom-2 left-2 right-2 z-40 flex justify-center transition-all ${
      visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    style={{ animation: visible ? 'toastIn 0.3s ease-out' : undefined }}
  >
    <div className="glass-card rounded-xl px-4 py-2 shadow-love text-center max-w-[90%]">
      <p className="text-love-600 text-xs font-medium">{message}</p>
    </div>
  </div>
);

// ============================================================
// Shark phrases
// ============================================================
const BUMP_PHRASES = ["Hmph! 😤", "Ketaqol!", "Yoqmas! 🦈", "Bu emas!", "Yo'qol! 💢", "Ishqilib..."];
const LOVE_PHRASES = ["Buni tanla! 💕", "Ana shu! 😍", "Aynan shu! ❤️", "Mana bu! 💖", "Tanlang! 🥰", "Go'zal! 💗"];
const BITE_PHRASES = ["G'ajib tashladim! 🦷", "Xom-xom! 😤🦷", "Tishlaldim! 💥", "Chaqib oldim! 🦈"];

// ============================================================
// Main NameGame Component
// ============================================================
const NameGame: React.FC<NameGameProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [round, setRound] = useState<1 | 2>(1);
  const [foundName, setFoundName] = useState<string | null>(null);
  const [foundSurname, setFoundSurname] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [pearlStates, setPearlStates] = useState<Record<string, PearlState>>({});
  const [pearlOffsets, setPearlOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [impacts, setImpacts] = useState<ImpactFX[]>([]);
  const [targetPearl, setTargetPearl] = useState<{ id: string; type: 'angry' | 'love' } | null>(null);

  // Shark visual state
  const [shark, setShark] = useState<SharkVisual>({
    x: 18, y: 50, mood: 'swimming', jawOpen: false, speed: 1200, rotation: 0,
  });
  const [sharkFacing, setSharkFacing] = useState(false);
  const [sharkSpeech, setSharkSpeech] = useState<string | null>(null);

  // Refs
  const prevSharkX = useRef(18);
  const sharkBusy = useRef(false);
  const animTimers = useRef<number[]>([]);
  const toastTimer = useRef<number | null>(null);
  const speechTimer = useRef<number | null>(null);
  const pearlStatesRef = useRef(pearlStates);
  pearlStatesRef.current = pearlStates;

  // ---- Helpers ----
  const schedule = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    animTimers.current.push(id);
    return id;
  }, []);

  const cancelAnims = useCallback(() => {
    animTimers.current.forEach(clearTimeout);
    animTimers.current = [];
  }, []);

  const moveShark = useCallback((updates: Partial<SharkVisual>) => {
    if (updates.x !== undefined) {
      setSharkFacing(updates.x < prevSharkX.current);
      prevSharkX.current = updates.x;
    }
    setShark(prev => ({ ...prev, ...updates }));
  }, []);

  const addImpact = useCallback((px: number, py: number, type: 'bump' | 'bite') => {
    const id = `fx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setImpacts(prev => [...prev, { id, x: px, y: py, type }]);
    schedule(() => setImpacts(prev => prev.filter(f => f.id !== id)), 700);
  }, [schedule]);

  const showSpeech = useCallback((msg: string, dur = 2500) => {
    if (speechTimer.current) clearTimeout(speechTimer.current);
    setSharkSpeech(msg);
    speechTimer.current = window.setTimeout(() => setSharkSpeech(null), dur);
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // ---- Build pearls ----
  const pearls = useMemo(() => {
    return round === 1
      ? buildPearls(FAKE_FIRST_NAMES, config.partnerFirstName)
      : buildPearls(FAKE_LAST_NAMES, config.partnerLastName);
  }, [config.partnerFirstName, config.partnerLastName, round]);

  // Reset on round change
  useEffect(() => {
    cancelAnims();
    const states: Record<string, PearlState> = {};
    const offsets: Record<string, { x: number; y: number }> = {};
    pearls.forEach((p) => { states[p.id] = 'floating'; offsets[p.id] = { x: 0, y: 0 }; });
    setPearlStates(states);
    setPearlOffsets(offsets);
    setShark({ x: 15, y: 50, mood: 'swimming', jawOpen: false, speed: 1200, rotation: 0 });
    setSharkSpeech(null);
    setImpacts([]);
    setTargetPearl(null);
    sharkBusy.current = false;
    prevSharkX.current = 15;
  }, [pearls, cancelAnims]);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnims();
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (speechTimer.current) clearTimeout(speechTimer.current);
  }, [cancelAnims]);

  useEffect(() => {
    trackEvent('name_game_round_started', {
      round,
      target: round === 1 ? 'first_name' : 'last_name',
    });
  }, [round, trackEvent]);

  // ============================================================
  // SHARK AUTONOMOUS PATROL — slow & clear
  // ============================================================
  useEffect(() => {
    if (isComplete) return;

    const patrol = () => {
      if (sharkBusy.current) return;

      const curStates = pearlStatesRef.current;
      const active = pearls.filter(
        (p) => curStates[p.id] === 'floating' || curStates[p.id] === 'bumped'
      );
      if (active.length === 0) return;

      const roll = Math.random();

      // ====== BUMP A WRONG PEARL (40%) ======
      if (roll < 0.4) {
        const wrongOnes = active.filter((p) => !p.isCorrect);
        if (wrongOnes.length > 0) {
          const target = pick(wrongOnes);
          sharkBusy.current = true;

          const comingFromLeft = prevSharkX.current < target.x;
          const windUpX = comingFromLeft ? target.x - 22 : target.x + 16;
          const windUpY = target.y + (Math.random() - 0.5) * 4;

          // 0ms: Highlight pearl + cruise to wind-up
          setTargetPearl({ id: target.id, type: 'angry' });
          moveShark({ x: windUpX, y: windUpY, mood: 'bumping', speed: 1300, jawOpen: false, rotation: 0 });

          // 1500ms: Pause near pearl, show speech with NAME
          schedule(() => {
            showSpeech(`"${target.text}" — ${pick(BUMP_PHRASES)}`, 2800);
          }, 1500);

          // 2600ms: Accelerate into pearl!
          schedule(() => {
            const hitX = comingFromLeft ? target.x - 3 : target.x + 3;
            moveShark({ x: hitX, y: target.y, speed: 280, rotation: comingFromLeft ? -5 : 5 });
          }, 2600);

          // 2950ms: IMPACT!
          schedule(() => {
            moveShark({ rotation: 0 });
            addImpact(target.x, target.y, 'bump');

            const pushX = comingFromLeft ? (12 + Math.random() * 10) : -(12 + Math.random() * 10);
            const pushY = (Math.random() - 0.5) * 8;
            setPearlStates(prev => ({ ...prev, [target.id]: 'bumped' }));
            setPearlOffsets(prev => ({
              ...prev,
              [target.id]: {
                x: (prev[target.id]?.x || 0) + pushX,
                y: (prev[target.id]?.y || 0) + pushY,
              },
            }));
          }, 2950);

          // 3600ms: Swim through/past
          schedule(() => {
            const pastX = comingFromLeft ? target.x + 24 : target.x - 20;
            const pastY = target.y + (Math.random() - 0.5) * 12;
            moveShark({ x: Math.max(3, Math.min(42, pastX)), y: Math.max(10, Math.min(85, pastY)), mood: 'swimming', speed: 900 });
          }, 3600);

          // 4800ms: Clear highlight, reset pearl
          schedule(() => {
            setTargetPearl(null);
            setPearlStates(prev => {
              const next = { ...prev };
              if (next[target.id] === 'bumped') next[target.id] = 'floating';
              return next;
            });
            sharkBusy.current = false;
          }, 4800);

          return;
        }
      }

      // ====== ORBIT CORRECT PEARL (30%) ======
      if (roll < 0.7) {
        const correct = active.find((p) => p.isCorrect);
        if (correct) {
          sharkBusy.current = true;

          const orbitR = 14;
          const orbitPositions = [
            { x: correct.x - orbitR, y: correct.y - 3 },
            { x: correct.x + 3,     y: correct.y - 10 },
            { x: correct.x + orbitR - 1, y: correct.y + 3 },
            { x: correct.x - 3,     y: correct.y + 9 },
          ];

          // 0ms: Highlight pearl + swim to first orbit point
          setTargetPearl({ id: correct.id, type: 'love' });
          moveShark({ x: orbitPositions[0].x, y: orbitPositions[0].y, mood: 'happy', speed: 1400, jawOpen: false, rotation: 0 });

          // 1600ms: Show speech with NAME
          schedule(() => {
            showSpeech(`"${correct.text}" — ${pick(LOVE_PHRASES)}`, 3500);
          }, 1600);

          // 2400ms-4800ms: Orbit points (1000ms each)
          orbitPositions.slice(1).forEach((pos, i) => {
            schedule(() => {
              moveShark({ x: pos.x, y: pos.y, speed: 900 });
            }, 2400 + i * 1000);
          });

          // 5800ms: Leave orbit
          schedule(() => {
            const awayX = 5 + Math.random() * 35;
            const awayY = 15 + Math.random() * 60;
            moveShark({ x: awayX, y: awayY, mood: 'swimming', speed: 1200 });
            setTargetPearl(null);
          }, 5800);

          // 6800ms: Free
          schedule(() => {
            sharkBusy.current = false;
          }, 6800);

          return;
        }
      }

      // ====== RANDOM SWIM (30%) ======
      const rx = 3 + Math.random() * 42;
      const ry = 10 + Math.random() * 70;
      moveShark({ x: rx, y: ry, mood: 'swimming', speed: 1400 + Math.random() * 400, jawOpen: false, rotation: 0 });
    };

    const interval = setInterval(patrol, 5500);
    const init = setTimeout(patrol, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(init);
    };
  }, [pearls, isComplete, moveShark, addImpact, showSpeech, schedule]);

  // ============================================================
  // HANDLE PEARL TAP
  // ============================================================
  const handlePearlTap = useCallback((pearl: PearlData) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch {}

    // Cancel any patrol animation
    cancelAnims();
    sharkBusy.current = true;
    setTargetPearl(null);

    trackEvent('name_game_pearl_selected', {
      round,
      value: pearl.text,
      correct: pearl.isCorrect,
    });

    if (pearl.isCorrect) {
      // ====== CORRECT! ======
      setPearlStates(prev => ({ ...prev, [pearl.id]: 'caught' }));
      setTargetPearl({ id: pearl.id, type: 'love' });
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}

      // 0ms: Shark swims to pearl, happy
      moveShark({ x: pearl.x - 12, y: pearl.y, mood: 'happy', speed: 500, jawOpen: false, rotation: 0 });
      showSpeech(`"${pearl.text}" — to'g'ri! 🎉💖`, 3000);

      // 1200ms: Remove pearl, register name
      schedule(() => {
        setPearlStates(prev => ({ ...prev, [pearl.id]: 'removed' }));
        setTargetPearl(null);

        if (round === 1) {
          setFoundName(pearl.text);
          trackEvent('name_game_first_name_confirmed', { firstName: pearl.text });
          schedule(() => {
            sharkBusy.current = false;
            setRound(2);
          }, 1000);
        } else {
          setFoundSurname(pearl.text);
          const result: NameGameResult = {
            firstName: foundName ?? config.partnerFirstName,
            lastName: pearl.text,
            wrongAttempts,
            totalAttempts: wrongAttempts + 2,
          };
          schedule(() => {
            setIsComplete(true);
            trackEvent('name_game_completed', result);
            schedule(() => onComplete(result), 1500);
          }, 800);
        }
      }, 1200);

    } else {
      // ====== WRONG — SHARK BITES (slow & dramatic) ======
      setPearlStates(prev => ({ ...prev, [pearl.id]: 'wrong' }));
      setTargetPearl({ id: pearl.id, type: 'angry' });
      setWrongAttempts((prev) => prev + 1);
      try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error'); } catch {}

      const phrases = round === 1 ? WRONG_NAME_PHRASES : WRONG_SURNAME_PHRASES;
      showToast(pick(phrases));
      trackEvent('name_game_wrong_pick', {
        round,
        value: pearl.text,
      });

      const comingFromLeft = prevSharkX.current < pearl.x;

      // 0ms: Shark turns toward pearl with JAW OPEN, tilts
      moveShark({
        x: comingFromLeft ? pearl.x - 18 : pearl.x + 12,
        y: pearl.y,
        mood: 'angry',
        jawOpen: true,
        speed: 450,
        rotation: comingFromLeft ? -8 : 8,
      });

      // 550ms: Dramatic pause — jaw open, visible near pearl
      schedule(() => {
        showSpeech(`"${pearl.text}" — ${pick(BITE_PHRASES)}`, 3000);
      }, 550);

      // 1100ms: CHOMP! Rush into pearl, jaw CLOSES
      schedule(() => {
        const chopX = comingFromLeft ? pearl.x - 2 : pearl.x + 2;
        moveShark({ x: chopX, y: pearl.y, jawOpen: false, speed: 160, rotation: comingFromLeft ? -3 : 3 });
        addImpact(pearl.x, pearl.y, 'bite');
      }, 1100);

      // 1350ms-2100ms: Head shake — 6 slow oscillations
      schedule(() => moveShark({ rotation: 7 }), 1350);
      schedule(() => moveShark({ rotation: -6 }), 1500);
      schedule(() => moveShark({ rotation: 5 }), 1650);
      schedule(() => moveShark({ rotation: -4 }), 1800);
      schedule(() => moveShark({ rotation: 3 }), 1950);
      schedule(() => moveShark({ rotation: 0 }), 2100);

      // 1600ms: Pearl becomes bitten
      schedule(() => {
        setPearlStates(prev => ({ ...prev, [pearl.id]: 'bitten' }));
      }, 1600);

      // 2500ms: Shark swims away, clear highlight
      schedule(() => {
        setTargetPearl(null);
        const awayX = comingFromLeft ? pearl.x + 28 : pearl.x - 22;
        moveShark({
          x: Math.max(3, Math.min(42, awayX)),
          y: 15 + Math.random() * 55,
          mood: 'swimming',
          speed: 1000,
          rotation: 0,
        });
      }, 2500);

      // 3500ms: Free
      schedule(() => {
        sharkBusy.current = false;
      }, 3500);
    }
  }, [round, cancelAnims, moveShark, addImpact, showSpeech, showToast, schedule, trackEvent, foundName, config.partnerFirstName, wrongAttempts, onComplete]);

  // ============================================================
  // RENDER
  // ============================================================
  const roundLabel = round === 1 ? 'Ismni toping!' : 'Familiyani toping!';

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center gap-3">
      <ImpactStyles />

      {/* Header */}
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-love-100 mb-2">
          <Anchor className="w-6 h-6 text-love-500" />
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-semibold text-gradient-love mb-1">
          Hayot Marvaridini toping
        </h2>
        <p className="text-love-400 font-light text-sm">{roundLabel}</p>
      </div>

      {/* Name Slots */}
      <div className="flex items-center gap-3 mb-1">
        <div className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-500 min-w-[90px] text-center ${
          foundName
            ? 'bg-love-500 text-white border-love-500 shadow-love'
            : round === 1
            ? 'bg-white/70 text-love-400 border-love-300 border-dashed animate-pulse-soft'
            : 'bg-white/50 text-love-300 border-love-200 border-dashed'
        }`}>
          {foundName || 'Ism?'}
        </div>
        <div className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-500 min-w-[90px] text-center ${
          foundSurname
            ? 'bg-love-500 text-white border-love-500 shadow-love'
            : round === 2
            ? 'bg-white/70 text-love-400 border-love-300 border-dashed animate-pulse-soft'
            : 'bg-white/50 text-love-300 border-love-200 border-dashed'
        }`}>
          {foundSurname || 'Familiya?'}
        </div>
      </div>

      {/* Sea Scene */}
      {!isComplete ? (
        <div className="w-full rounded-2xl overflow-hidden shadow-love-lg relative" style={{ height: '300px' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-300 to-blue-500 z-0" />

          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <ShipSVG />
          </div>

          <div className="absolute top-12 left-1/2 -translate-x-[3px] z-[15] flex flex-col items-center" style={{ animation: 'hookSwing 3s ease-in-out infinite' }}>
            <div className="w-px bg-gray-400/60" style={{ height: '50px' }} />
            <HookSVG />
          </div>

          <div className="absolute top-[52px] left-0 right-0 z-10">
            <WaveSurface />
          </div>

          <div className="absolute top-[56px] left-0 right-0 bottom-0 bg-gradient-to-b from-blue-500/80 via-blue-600/70 to-blue-800/80 z-[5]">
            <Bubbles />

            <div className="relative w-full h-full">
              {pearls.map((pearl) => (
                <Pearl
                  key={pearl.id}
                  pearl={pearl}
                  state={pearlStates[pearl.id] || 'floating'}
                  onTap={handlePearlTap}
                  offsetX={pearlOffsets[pearl.id]?.x || 0}
                  offsetY={pearlOffsets[pearl.id]?.y || 0}
                />
              ))}

              {/* Pearl highlight glow — shows which pearl shark targets */}
              {targetPearl && (() => {
                const tp = pearls.find(p => p.id === targetPearl.id);
                if (!tp) return null;
                const off = pearlOffsets[tp.id] || { x: 0, y: 0 };
                const isLove = targetPearl.type === 'love';
                return (
                  <div
                    className="absolute rounded-full pointer-events-none z-[9]"
                    style={{
                      left: `calc(${tp.x}% + ${off.x}px - 10px)`,
                      top: `calc(${tp.y}% + ${off.y}px - 10px)`,
                      width: '80px',
                      height: '36px',
                      transition: 'left 0.5s ease, top 0.5s ease',
                      boxShadow: isLove
                        ? '0 0 20px 8px rgba(236,72,153,0.5), 0 0 40px 16px rgba(236,72,153,0.2)'
                        : '0 0 20px 8px rgba(239,68,68,0.5), 0 0 40px 16px rgba(239,68,68,0.2)',
                      background: isLove
                        ? 'radial-gradient(ellipse, rgba(236,72,153,0.15) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse, rgba(239,68,68,0.15) 0%, transparent 70%)',
                      animation: 'pulseSoft 1s ease-in-out infinite',
                    }}
                  />
                );
              })()}

              {/* Impact effects */}
              {impacts.map((fx) => (
                <ImpactBurst key={fx.id} fx={fx} />
              ))}

              {/* SHARK */}
              <SharkSVG visual={shark} facingLeft={sharkFacing} speech={sharkSpeech} />
            </div>
          </div>

          <SeaFloorSVG />
          <Toast message={toast || ''} visible={!!toast} />
        </div>
      ) : (
        <div className="w-full text-center animate-scale-in space-y-3 py-8">
          <div className="text-5xl animate-heart-beat">💖</div>
          <p className="text-love-600 text-lg font-light">
            Xush kelibsiz, <span className="font-semibold">{foundName} {foundSurname}</span>!
          </p>
          <div className="flex justify-center gap-1">
            <Sparkles className="w-4 h-4 text-love-400" />
            <p className="text-love-400 text-sm font-light">Dengiz sizni tanidi!</p>
            <Sparkles className="w-4 h-4 text-love-400" />
          </div>
        </div>
      )}

      {!isComplete && (
        <p className="text-love-300 text-xs font-light text-center">
          🦈 Akula noto'g'ri ismlarni turtadi va g'ajiydi — to'g'risini yoqtiradi!
        </p>
      )}
    </div>
  );
};

export default NameGame;
