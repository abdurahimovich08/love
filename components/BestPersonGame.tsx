import React, { useEffect, useMemo, useState } from 'react';
import {
  BATTLE_CONTESTANTS,
  BATTLE_LADDER_IDS,
} from '../constants';
import { BattleContestant, BattleDuelLog, BestPersonGameResult } from '../types';
import { Crown, Sparkles, Swords, Trophy } from 'lucide-react';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface BestPersonGameProps {
  onComplete: (result: BestPersonGameResult) => void;
}

type DuelSide = 'left' | 'right';
type FinalInterventionStage = 0 | 1 | 2 | 3;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
const resolvedImageExtensions = new Map<number, string>();

const GROUP_LABELS: Record<BattleContestant['group'], string> = {
  singer: 'Qoshiqchi',
  actress: 'Aktrisa',
  cartoon: 'Multfilm',
  icon: 'Afsona',
  special: 'Maxsus',
};

const EZOZA_ID = BATTLE_CONTESTANTS.find((contestant) => contestant.isEzoza)?.id ?? 'ezoza';

const hapticSelection = () => {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  } catch {}
};

const hapticImpact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  } catch {}
};

const hapticNotify = (type: 'success' | 'warning') => {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  } catch {}
};

const playSirenBurst = () => {
  try {
    const AudioContextCtor =
      (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const startAt = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.05, startAt + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.86);

    for (let index = 0; index < 8; index++) {
      const tickAt = startAt + index * 0.1;
      oscillator.frequency.setValueAtTime(index % 2 === 0 ? 770 : 540, tickAt);
    }

    oscillator.start(startAt);
    oscillator.stop(startAt + 0.9);
    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {}
};

const playCinematicBlast = () => {
  try {
    const AudioContextCtor =
      (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const master = audioContext.createGain();
    master.gain.value = 0.22;
    master.connect(audioContext.destination);

    const startAt = audioContext.currentTime;

    const boom = audioContext.createOscillator();
    const boomGain = audioContext.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(108, startAt);
    boom.frequency.exponentialRampToValueAtTime(42, startAt + 0.62);
    boomGain.gain.setValueAtTime(0.001, startAt);
    boomGain.gain.exponentialRampToValueAtTime(0.7, startAt + 0.03);
    boomGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.65);
    boom.connect(boomGain);
    boomGain.connect(master);
    boom.start(startAt);
    boom.stop(startAt + 0.7);

    const crack = audioContext.createOscillator();
    const crackGain = audioContext.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(290, startAt);
    crack.frequency.exponentialRampToValueAtTime(95, startAt + 0.24);
    crackGain.gain.setValueAtTime(0.001, startAt);
    crackGain.gain.exponentialRampToValueAtTime(0.32, startAt + 0.02);
    crackGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.24);
    crack.connect(crackGain);
    crackGain.connect(master);
    crack.start(startAt);
    crack.stop(startAt + 0.28);

    const noise = audioContext.createBufferSource();
    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.46, audioContext.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index++) {
      channel[index] = (Math.random() * 2 - 1) * (1 - index / channel.length);
    }
    noise.buffer = noiseBuffer;
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 320;
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.001, startAt);
    noiseGain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.45);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(startAt);
    noise.stop(startAt + 0.46);

    const afterShock = audioContext.createOscillator();
    const afterShockGain = audioContext.createGain();
    afterShock.type = 'sine';
    afterShock.frequency.setValueAtTime(64, startAt + 0.14);
    afterShock.frequency.exponentialRampToValueAtTime(48, startAt + 0.54);
    afterShockGain.gain.setValueAtTime(0.001, startAt + 0.14);
    afterShockGain.gain.exponentialRampToValueAtTime(0.26, startAt + 0.2);
    afterShockGain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.58);
    afterShock.connect(afterShockGain);
    afterShockGain.connect(master);
    afterShock.start(startAt + 0.14);
    afterShock.stop(startAt + 0.62);

    window.setTimeout(() => {
      void audioContext.close();
    }, 920);
  } catch {}
};

interface BattleImageProps {
  imageNumber: number;
  imageSrc?: string;
  alt: string;
}

const BattleImage: React.FC<BattleImageProps> = ({ imageNumber, imageSrc, alt }) => {
  const extensions = useMemo(() => {
    const cached = resolvedImageExtensions.get(imageNumber);
    if (!cached) {
      return IMAGE_EXTENSIONS;
    }

    return [cached, ...IMAGE_EXTENSIONS.filter((ext) => ext !== cached)];
  }, [imageNumber]);

  const [extIndex, setExtIndex] = useState(0);
  const [isBroken, setIsBroken] = useState(false);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  useEffect(() => {
    setExtIndex(0);
    setIsBroken(false);
    setFitMode('cover');
  }, [imageNumber, imageSrc]);

  const src = imageSrc || `/battle-images/${imageNumber}.${extensions[extIndex]}`;

  if (isBroken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-love-100 to-warm-100 text-love-500 text-sm font-medium px-3 text-center">
        Rasm topilmadi
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`w-full h-full transition-transform duration-300 ${fitMode === 'cover' ? 'object-cover' : 'object-contain p-2'}`}
      onLoad={(event) => {
        if (!imageSrc) {
          resolvedImageExtensions.set(imageNumber, extensions[extIndex]);
        }
        const { naturalWidth, naturalHeight } = event.currentTarget;

        if (naturalWidth < 320 || naturalHeight < 320) {
          setFitMode('contain');
        }
      }}
      onError={() => {
        if (imageSrc) {
          setIsBroken(true);
          return;
        }
        setExtIndex((currentIndex) => {
          if (currentIndex >= extensions.length - 1) {
            setIsBroken(true);
            return currentIndex;
          }
          return currentIndex + 1;
        });
      }}
    />
  );
};

interface ProfileRowProps {
  label: string;
  items: string[];
  chipClassName: string;
}

const ProfileRow: React.FC<ProfileRowProps> = ({ label, items, chipClassName }) => {
  return (
    <div>
      <p className="text-[11px] font-semibold text-love-600 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={`${label}-${item}`} className={`px-2 py-1 rounded-full text-[10px] font-medium border ${chipClassName}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

interface DuelCardProps {
  contestant: BattleContestant;
  customImageSrc?: string;
  onSelect: (id: string) => void;
  selectedId: string | null;
  disabled: boolean;
}

const DuelCard: React.FC<DuelCardProps> = ({ contestant, customImageSrc, onSelect, selectedId, disabled }) => {
  const isSelected = selectedId === contestant.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(contestant.id)}
      disabled={disabled}
      className={`glass-card rounded-3xl border text-left overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'border-love-500 ring-4 ring-love-200 scale-[1.01]'
          : disabled
          ? 'border-love-100 opacity-85'
          : 'border-love-200 hover:border-love-400 hover:shadow-love-lg hover:scale-[1.01]'
      }`}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-love-100 via-white to-warm-100">
        <BattleImage imageNumber={contestant.imageNumber} imageSrc={customImageSrc} alt={contestant.name} />
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold bg-white/90 text-love-700 border border-love-100">
          {GROUP_LABELS[contestant.group]}
        </div>
        {contestant.isEzoza && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-semibold bg-love-500 text-white shadow">
            Maxsus
          </div>
        )}
      </div>

      <div className="p-4 bg-white/90 space-y-2.5">
        <p className="text-love-900 font-semibold text-base leading-tight">{contestant.name}</p>

        <ProfileRow
          label="Xarakter"
          items={contestant.characterTypes}
          chipClassName="bg-sky-50 border-sky-200 text-sky-700"
        />
        <ProfileRow
          label="Joziba"
          items={contestant.charms}
          chipClassName="bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700"
        />
      </div>
    </button>
  );
};

interface FinalInterventionBannerProps {
  stage: FinalInterventionStage;
  token: number;
  targetName: string | null;
}

const FinalInterventionBanner: React.FC<FinalInterventionBannerProps> = ({ stage, token, targetName }) => {
  if (stage === 0) {
    return null;
  }

  return (
    <div
      key={`intervention-${stage}-${token}`}
      className={`glass-card rounded-2xl border p-3 md:p-4 overflow-hidden relative ${
        stage === 1
          ? 'border-amber-300 bg-amber-50/70'
          : stage === 2
          ? 'border-red-300 bg-red-50/80'
          : 'border-rose-400 bg-rose-50/85'
      }`}
    >
      <style>
        {`
          @keyframes cannonShotTrail {
            0% { transform: translateX(-120px) scale(0.7); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateX(220px) scale(1.05); opacity: 0; }
          }
          @keyframes sirenBlink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes ambulancePass {
            0% { transform: translateX(-120%); opacity: 0.2; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translateX(130%); opacity: 0; }
          }
          @keyframes finalBlastShake {
            0%, 100% { transform: translateX(0px); }
            20% { transform: translateX(-2px); }
            40% { transform: translateX(2px); }
            60% { transform: translateX(-1px); }
            80% { transform: translateX(1px); }
          }
          @keyframes blastPulse {
            0% { transform: scale(0.7); opacity: 0.25; }
            60% { transform: scale(1.18); opacity: 0.85; }
            100% { transform: scale(1.35); opacity: 0; }
          }
        `}
      </style>

      {stage === 1 && (
        <div className="relative min-h-[52px] flex items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-amber-800 text-sm font-semibold">Qalbimiz allaqachon o'z malikasini tanlagan.</p>
            <p className="text-amber-700 text-xs">{targetName ?? 'Raqib'} zambarak signalidan keyin ortga surildi.</p>
          </div>
          <span className="absolute left-7 top-6 text-xl" style={{ animation: 'cannonShotTrail 860ms ease-out 1' }}>
            💥
          </span>
        </div>
      )}

      {stage === 2 && (
        <div className="relative min-h-[60px] flex items-center gap-3">
          <div className="text-2xl" style={{ animation: 'sirenBlink 320ms steps(2, end) infinite' }}>🚨</div>
          <div className="flex-1">
            <p className="text-red-800 text-sm font-semibold">Haqiqiy go'zallikni farqlash qiyin bo'lyapti.</p>
            <p className="text-red-700 text-xs">Iltimos, ko'z shifokoriga uchrashing. Tez yordam yo'lda.</p>
          </div>
          <span className="absolute bottom-0 left-0 text-xl" style={{ animation: 'ambulancePass 1300ms linear 1' }}>
            🚑
          </span>
        </div>
      )}

      {stage === 3 && (
        <div className="relative min-h-[64px] flex items-center gap-3" style={{ animation: 'finalBlastShake 380ms ease-in-out 2' }}>
          <span className="text-2xl">💣</span>
          <div className="flex-1">
            <p className="text-rose-800 text-sm font-semibold">Hayotimda boshqasiga joy yo'q.</p>
            <p className="text-rose-700 text-xs">{targetName ?? 'Raqib'} sahnadan chiqarildi. Endi faqat maxsus personaj qoldi.</p>
          </div>
          <span className="absolute right-4 top-1 text-xl">💥</span>
          <span
            className="absolute right-3 top-0 w-8 h-8 rounded-full bg-rose-300/70"
            style={{ animation: 'blastPulse 620ms ease-out 1' }}
          />
        </div>
      )}
    </div>
  );
};

interface EliminatedContestantCardProps {
  name: string;
}

const EliminatedContestantCard: React.FC<EliminatedContestantCardProps> = ({ name }) => {
  return (
    <div className="glass-card rounded-3xl border border-rose-200/80 bg-rose-50/60 overflow-hidden relative p-4 flex flex-col items-center justify-center min-h-[240px]">
      <style>
        {`
          @keyframes ashFloat {
            0% { transform: translateY(0px); opacity: 0.65; }
            100% { transform: translateY(-10px); opacity: 0; }
          }
        `}
      </style>
      <div className="absolute inset-0 bg-gradient-to-b from-rose-100/55 to-transparent" />
      <span className="text-5xl relative">💥</span>
      <p className="relative mt-2 text-rose-800 font-semibold text-sm text-center">{name} sahnadan chiqarildi</p>
      <p className="relative mt-1 text-rose-600 text-xs text-center">Finalda faqat bitta tanlov qoldi.</p>
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={`ash-${index}`}
          className="absolute text-[10px] text-rose-400"
          style={{
            left: `${14 + index * 11}%`,
            bottom: `${12 + (index % 2) * 5}%`,
            animation: `ashFloat ${0.9 + index * 0.1}s ease-out infinite`,
          }}
        >
          •
        </span>
      ))}
    </div>
  );
};

interface HeartCoreProps {
  fillPercent: number;
  ignited: boolean;
  pourToken: number;
}

const HeartCore: React.FC<HeartCoreProps> = ({ fillPercent, ignited, pourToken }) => {
  const safePercent = Math.max(0, Math.min(100, fillPercent));
  const fillHeight = Math.max(2, (safePercent / 100) * 90);
  const fillY = 90 - fillHeight;
  const [isPouring, setIsPouring] = useState(false);

  useEffect(() => {
    if (pourToken === 0) {
      return;
    }

    setIsPouring(true);
    const timer = window.setTimeout(() => setIsPouring(false), 900);
    return () => clearTimeout(timer);
  }, [pourToken]);

  const drops = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        id: `${pourToken}-${index}`,
        left: 42 + Math.random() * 16,
        delay: index * 0.07,
        size: 4 + Math.random() * 4,
      })),
    [pourToken],
  );

  return (
    <div className="flex flex-col items-center">
      <style>
        {`
          @keyframes bloodDropFall {
            0% { transform: translateY(-24px) scale(0.5); opacity: 0; }
            25% { opacity: 0.95; }
            100% { transform: translateY(68px) scale(1); opacity: 0; }
          }
          @keyframes bloodSurfaceWave {
            0%, 100% { transform: translateX(0px); opacity: 0.35; }
            50% { transform: translateX(2px); opacity: 0.75; }
          }
          @keyframes bloodBubbleRise {
            0% { transform: translateY(0px) scale(1); opacity: 0.8; }
            100% { transform: translateY(-10px) scale(0.5); opacity: 0; }
          }
        `}
      </style>

      <div className={`relative w-44 h-40 transition-all duration-700 ${ignited ? 'scale-105 animate-heart-beat' : ''}`}>
        {ignited && <div className="absolute inset-0 bg-love-400/35 blur-2xl rounded-full" />}
        {isPouring && (
          <>
            <div className="absolute left-1/2 -top-4 -translate-x-1/2 w-2 h-10 bg-gradient-to-b from-red-300/0 via-red-400/55 to-red-700/80 rounded-full pointer-events-none" />
            {drops.map((drop) => (
              <span
                key={drop.id}
                className="absolute -top-2 rounded-full bg-red-600/90 pointer-events-none"
                style={{
                  width: `${drop.size}px`,
                  height: `${drop.size}px`,
                  left: `${drop.left}%`,
                  animation: `bloodDropFall ${0.55 + drop.delay}s ease-in forwards`,
                }}
              />
            ))}
          </>
        )}

        <svg viewBox="0 0 100 90" className="relative w-full h-full">
          <defs>
            <clipPath id="heart-shape-clip">
              <path d="M50 82 C20 60 5 46 5 28 C5 15 15 6 28 6 C38 6 46 11 50 19 C54 11 62 6 72 6 C85 6 95 15 95 28 C95 46 80 60 50 82 Z" />
            </clipPath>
            <linearGradient id="heart-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="35%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>

          <g clipPath="url(#heart-shape-clip)">
            <rect x="0" y="0" width="100" height="90" fill="#ffe4ef" />
            <rect
              x="0"
              y={fillY}
              width="100"
              height={fillHeight}
              fill="url(#heart-fill-gradient)"
              style={{ transition: 'all 500ms ease' }}
            />
            <rect
              x="0"
              y={Math.max(fillY - 3, 0)}
              width="100"
              height={5}
              fill="rgba(254,202,202,0.78)"
              style={{ transition: 'all 500ms ease', animation: 'bloodSurfaceWave 1.1s ease-in-out infinite' }}
            />
            <path
              d={`M0 ${Math.max(fillY - 1, 0)} C 18 ${Math.max(fillY - 5, 0)}, 35 ${Math.max(fillY + 3, 0)}, 52 ${Math.max(fillY - 1, 0)} C 70 ${Math.max(fillY - 4, 0)}, 86 ${Math.max(fillY + 3, 0)}, 100 ${Math.max(fillY, 0)} L100 ${Math.max(fillY + 3, 0)} L0 ${Math.max(fillY + 3, 0)} Z`}
              fill="rgba(255,255,255,0.22)"
              style={{ transition: 'all 500ms ease', animation: 'bloodSurfaceWave 1.35s ease-in-out infinite' }}
            />
            {fillHeight > 8 && (
              <>
                <circle cx="24" cy={fillY + fillHeight - 6} r="1.6" fill="rgba(255,241,242,0.8)" style={{ animation: 'bloodBubbleRise 1.1s ease-out infinite' }} />
                <circle cx="52" cy={fillY + fillHeight - 8} r="1.3" fill="rgba(255,241,242,0.72)" style={{ animation: 'bloodBubbleRise 1.4s ease-out infinite' }} />
                <circle cx="76" cy={fillY + fillHeight - 5} r="1.4" fill="rgba(255,241,242,0.76)" style={{ animation: 'bloodBubbleRise 1.3s ease-out infinite' }} />
              </>
            )}
          </g>

          <path
            d="M50 82 C20 60 5 46 5 28 C5 15 15 6 28 6 C38 6 46 11 50 19 C54 11 62 6 72 6 C85 6 95 15 95 28 C95 46 80 60 50 82 Z"
            fill="none"
            stroke={ignited ? '#db2777' : '#f472b6'}
            strokeWidth="3"
          />
        </svg>
      </div>
    </div>
  );
};

interface KnightRiderProps {
  side: DuelSide;
  variant: 'neutral' | 'winner' | 'loser';
  phase: 'idle' | 'charge' | 'impact' | 'resolve';
}

const KNIGHT_IMAGE_BY_SIDE: Record<DuelSide, string> = {
  left: '/battle-images/knight-horse-left.png',
  right: '/battle-images/knight-horse-right.png',
};

const KnightRider: React.FC<KnightRiderProps> = ({ side, variant, phase }) => {
  const isCharging = phase === 'charge' || phase === 'impact';
  const isImpact = phase === 'impact';
  const isWinner = variant === 'winner';
  const isLoser = variant === 'loser';
  const imageSrc = KNIGHT_IMAGE_BY_SIDE[side];
  const lanceTone = isWinner ? 'bg-amber-100' : 'bg-slate-200';
  const lanceTipTone = isWinner ? 'border-amber-100' : 'border-slate-200';
  const lanceShift = isImpact ? (side === 'left' ? 6 : -6) : 0;
  const spriteAnimation = isCharging
    ? side === 'left'
      ? 'knightSpriteFrameLeft 250ms steps(2, end) infinite'
      : 'knightSpriteFrameRight 250ms steps(2, end) infinite'
    : undefined;

  const motionAnimation =
    phase === 'resolve' && isWinner
      ? 'knightWinnerLift 560ms ease-out'
      : phase === 'resolve' && isLoser
      ? side === 'left'
        ? 'knightLoserRecoilLeft 540ms ease-out'
        : 'knightLoserRecoilRight 540ms ease-out'
      : isCharging
      ? 'knightGallop 220ms ease-in-out infinite'
      : undefined;

  return (
    <div
      className="relative w-[148px] h-[102px] select-none pointer-events-none"
      style={{
        animation: motionAnimation,
        opacity: phase === 'resolve' && isLoser ? 0.68 : 1,
      }}
    >
      <img
        src={imageSrc}
        alt={`${side} knight`}
        draggable={false}
        className={`absolute inset-0 w-full h-full object-contain ${
          isWinner
            ? 'drop-shadow-[0_0_12px_rgba(244,63,94,0.45)]'
            : 'drop-shadow-[0_8px_8px_rgba(30,41,59,0.18)]'
        } ${isLoser ? 'grayscale-[0.55] saturate-75' : ''}`}
        style={{ animation: spriteAnimation, transformOrigin: '52% 78%' }}
      />

      <div
        className={`absolute top-[44%] h-[3px] rounded-full shadow-sm ${lanceTone}`}
        style={{
          width: isImpact ? '74px' : '84px',
          left: side === 'left' ? '53%' : undefined,
          right: side === 'right' ? '53%' : undefined,
          transform: `translateX(${lanceShift}px)`,
        }}
      />
      <div
        className={`absolute top-[42.5%] w-0 h-0 border-t-[5px] border-b-[5px] border-t-transparent border-b-transparent ${lanceTipTone} ${
          side === 'left' ? 'border-l-[8px]' : 'border-r-[8px]'
        }`}
        style={{
          left: side === 'left' ? 'calc(53% + 82px)' : undefined,
          right: side === 'right' ? 'calc(53% + 82px)' : undefined,
          transform: `translateX(${lanceShift}px)`,
        }}
      />

      {phase === 'resolve' && isWinner && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-base">✨</span>}
    </div>
  );
};

interface KnightDuelTrackProps {
  duelToken: number;
  winnerSide: DuelSide | null;
  leftName: string;
  rightName: string;
  fillPercent: number;
  ignited: boolean;
  pourToken: number;
}

const KnightDuelTrack: React.FC<KnightDuelTrackProps> = ({
  duelToken,
  winnerSide,
  leftName,
  rightName,
  fillPercent,
  ignited,
  pourToken,
}) => {
  const [phase, setPhase] = useState<'idle' | 'charge' | 'impact' | 'resolve'>('idle');

  useEffect(() => {
    if (duelToken === 0 || !winnerSide) {
      return;
    }

    setPhase('charge');
    const t1 = window.setTimeout(() => setPhase('impact'), 520);
    const t2 = window.setTimeout(() => setPhase('resolve'), 760);
    const t3 = window.setTimeout(() => setPhase('idle'), 1320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [duelToken, winnerSide]);

  const leftPos = phase === 'idle' ? 12 : phase === 'charge' ? 44 : phase === 'impact' ? 49 : winnerSide === 'left' ? 58 : 18;
  const rightPos = phase === 'idle' ? 88 : phase === 'charge' ? 56 : phase === 'impact' ? 51 : winnerSide === 'right' ? 42 : 82;
  const showResult = Boolean(winnerSide) && (phase === 'resolve' || (phase === 'idle' && duelToken > 0));
  const leftWon = showResult && winnerSide === 'left';
  const rightWon = showResult && winnerSide === 'right';
  const leftVariant = showResult ? (leftWon ? 'winner' : 'loser') : 'neutral';
  const rightVariant = showResult ? (rightWon ? 'winner' : 'loser') : 'neutral';
  const impactSparks = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        id: `${duelToken}-${index}`,
        angle: -72 + index * 14 + Math.random() * 6,
        length: 10 + Math.random() * 10,
        distance: 24 + Math.random() * 20,
        delay: index * 12,
        duration: 260 + Math.random() * 130,
      })),
    [duelToken],
  );

  return (
    <div className="glass-card rounded-3xl border border-love-200 shadow-love p-4 md:p-5">
      <style>
        {`
          @keyframes knightGallop {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
          @keyframes knightSpriteFrameLeft {
            0%, 49% { transform: translateY(0px) rotate(0deg); }
            50%, 100% { transform: translateY(-2px) rotate(-1.2deg); }
          }
          @keyframes knightSpriteFrameRight {
            0%, 49% { transform: translateY(0px) rotate(0deg); }
            50%, 100% { transform: translateY(-2px) rotate(1.2deg); }
          }
          @keyframes knightWinnerLift {
            0% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-7px) scale(1.04); }
            100% { transform: translateY(0px) scale(1); }
          }
          @keyframes knightLoserRecoilLeft {
            0% { transform: translateY(0px) translateX(0px) scale(1); }
            35% { transform: translateY(-2px) translateX(-5px) scale(0.98); }
            100% { transform: translateY(0px) translateX(-10px) scale(0.96); }
          }
          @keyframes knightLoserRecoilRight {
            0% { transform: translateY(0px) translateX(0px) scale(1); }
            35% { transform: translateY(-2px) translateX(5px) scale(0.98); }
            100% { transform: translateY(0px) translateX(10px) scale(0.96); }
          }
          @keyframes duelImpactPulse {
            0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
            40% { opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.25); opacity: 0; }
          }
          @keyframes lanceShardLeft {
            0% { transform: translate(-100%, -50%) rotate(-10deg) scaleX(1); opacity: 0.95; }
            100% { transform: translate(calc(-100% - 28px), calc(-50% - 9px)) rotate(-28deg) scaleX(0.9); opacity: 0; }
          }
          @keyframes lanceShardRight {
            0% { transform: translate(0%, -50%) rotate(10deg) scaleX(1); opacity: 0.95; }
            100% { transform: translate(28px, calc(-50% - 9px)) rotate(28deg) scaleX(0.9); opacity: 0; }
          }
          @keyframes duelImpactFlash {
            0% { transform: translate(-50%, -50%) scale(0.45); opacity: 0; }
            25% { opacity: 0.95; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
          }
          @keyframes sparkFly {
            0% { transform: translateX(0px) scaleX(0.25); opacity: 0; }
            22% { opacity: 1; }
            100% { transform: translateX(var(--spark-distance)) scaleX(1); opacity: 0; }
          }
        `}
      </style>

      <div className="relative h-[278px] rounded-3xl border border-love-100 bg-gradient-to-b from-warm-50 via-love-50/90 to-white overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-love-100/70 to-transparent" />

        <div className="absolute left-1/2 top-3 -translate-x-1/2 w-[min(94%,680px)] h-[92px] rounded-2xl border border-love-200/75 bg-white/50 backdrop-blur-[1px] z-20">
          <div className="absolute inset-x-6 bottom-4 h-[4px] rounded-full bg-love-300/70" />
          <div className="absolute left-1/2 top-3 bottom-3 w-px bg-love-300/80" />

          {showResult && (
            <>
              <div
                className={`absolute left-3 top-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  leftWon
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {leftWon ? "G'olib 👑" : "Mag'lub"}
              </div>
              <div
                className={`absolute right-3 top-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  rightWon
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {rightWon ? "G'olib 👑" : "Mag'lub"}
              </div>
            </>
          )}

          <div className="absolute bottom-2 transition-all duration-300 ease-out" style={{ left: `${leftPos}%`, transform: 'translateX(-50%)' }}>
            <KnightRider side="left" variant={leftVariant} phase={phase} />
          </div>

          <div className="absolute bottom-2 transition-all duration-300 ease-out" style={{ left: `${rightPos}%`, transform: 'translateX(-50%)' }}>
            <KnightRider side="right" variant={rightVariant} phase={phase} />
          </div>

          {phase !== 'idle' && (
            <>
              <div className="absolute left-1/2 top-[48%] text-2xl -translate-x-1/2 -translate-y-1/2">⚔️</div>
              <div
                className="absolute left-1/2 top-[48%] w-16 h-16 rounded-full border-2 border-rose-300/70"
                style={{ animation: phase === 'impact' ? 'duelImpactPulse 380ms ease-out 1' : undefined }}
              />
            </>
          )}

          {phase === 'impact' && (
            <>
              <div
                className="absolute left-1/2 top-[48%] h-[4px] w-[50px] rounded-full bg-amber-100/95 shadow-[0_0_10px_rgba(254,243,199,0.7)]"
                style={{ animation: 'lanceShardLeft 430ms cubic-bezier(0.22, 1, 0.36, 1) 1' }}
              />
              <div
                className="absolute left-1/2 top-[48%] h-[4px] w-[50px] rounded-full bg-amber-100/95 shadow-[0_0_10px_rgba(254,243,199,0.7)]"
                style={{ animation: 'lanceShardRight 430ms cubic-bezier(0.22, 1, 0.36, 1) 1' }}
              />
              <div
                className="absolute left-1/2 top-[48%] w-10 h-10 rounded-full bg-amber-100/80"
                style={{ animation: 'duelImpactFlash 280ms ease-out 1' }}
              />
              {impactSparks.map((spark) => (
                <span
                  key={spark.id}
                  className="absolute left-1/2 top-[48%] block"
                  style={{ transform: `translate(-50%, -50%) rotate(${spark.angle}deg)` }}
                >
                  <span
                    className="block h-[2px] rounded-full bg-amber-100/95 shadow-[0_0_7px_rgba(253,224,71,0.75)]"
                    style={
                      {
                        width: `${spark.length}px`,
                        ['--spark-distance' as string]: `${spark.distance}px`,
                        animation: `sparkFly ${spark.duration}ms ease-out ${spark.delay}ms 1 both`,
                      } as React.CSSProperties
                    }
                  />
                </span>
              ))}
            </>
          )}
        </div>

        <div className="absolute left-1/2 top-[92px] -translate-x-1/2 z-10">
          <HeartCore fillPercent={fillPercent} ignited={ignited} pourToken={pourToken} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-love-600 font-medium">
        <span
          className={`truncate max-w-[45%] ${
            leftWon ? 'text-rose-700 font-semibold' : showResult ? 'text-slate-400' : 'text-love-600'
          }`}
        >
          {leftName}
          {leftWon ? " - G'olib" : showResult ? " - Mag'lub" : ''}
        </span>
        <span
          className={`truncate max-w-[45%] text-right ${
            rightWon ? 'text-rose-700 font-semibold' : showResult ? 'text-slate-400' : 'text-love-600'
          }`}
        >
          {rightName}
          {rightWon ? " - G'olib" : showResult ? " - Mag'lub" : ''}
        </span>
      </div>
    </div>
  );
};

const BestPersonGame: React.FC<BestPersonGameProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [battlePhase, setBattlePhase] = useState<'tournament' | 'grand_final'>('tournament');
  const [roundIds, setRoundIds] = useState<string[]>(BATTLE_LADDER_IDS);
  const [matchIndex, setMatchIndex] = useState(0);
  const [roundWinners, setRoundWinners] = useState<string[]>([]);
  const [tournamentStage, setTournamentStage] = useState(1);
  const [tournamentMatchCount, setTournamentMatchCount] = useState(0);
  const [grandFinalOpponentId, setGrandFinalOpponentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [statusTitle, setStatusTitle] = useState('PRINCESS QIDIRILMOQDA 👑✨');
  const [statusDescription, setStatusDescription] = useState('Ikki nomzoddan birini tanlang.');
  const [completed, setCompleted] = useState(false);
  const [heartIgnited, setHeartIgnited] = useState(false);
  const [heartCharge, setHeartCharge] = useState(0);
  const [pourToken, setPourToken] = useState(0);
  const [duelToken, setDuelToken] = useState(0);
  const [duelWinnerSide, setDuelWinnerSide] = useState<DuelSide | null>(null);
  const [finalMissCount, setFinalMissCount] = useState(0);
  const [finalInterventionStage, setFinalInterventionStage] = useState<FinalInterventionStage>(0);
  const [finalInterventionToken, setFinalInterventionToken] = useState(0);
  const [lastRejectedName, setLastRejectedName] = useState<string | null>(null);
  const [singleChoiceMode, setSingleChoiceMode] = useState(false);
  const [finalBlastToken, setFinalBlastToken] = useState(0);
  const [finalBlastActive, setFinalBlastActive] = useState(false);
  const [duelHistory, setDuelHistory] = useState<BattleDuelLog[]>([]);

  const specialName = config.specialContestantName || config.partnerFirstName;
  const specialImageSrc = config.specialContestantImage?.trim() || '';
  const contestants = useMemo(
    () =>
      BATTLE_CONTESTANTS.map((contestant) =>
        contestant.id === EZOZA_ID
          ? {
              ...contestant,
              name: specialName,
            }
          : contestant,
      ),
    [specialName],
  );
  const contestantById = useMemo(
    () => new Map(contestants.map((contestant) => [contestant.id, contestant])),
    [contestants],
  );

  const totalRounds = Math.max(BATTLE_LADDER_IDS.length, 1);
  const maxHeartCharge = Math.max(totalRounds + 4, 1);
  const inFinalRound = battlePhase === 'grand_final';
  const matchesInCurrentRound = Math.floor(roundIds.length / 2);
  const hasByeInCurrentRound = roundIds.length % 2 === 1;
  const byeId = hasByeInCurrentRound ? roundIds[roundIds.length - 1] : null;
  const tournamentLeftId = battlePhase === 'tournament' ? roundIds[matchIndex * 2] : null;
  const tournamentRightId = battlePhase === 'tournament' ? roundIds[matchIndex * 2 + 1] : null;
  const leftId = inFinalRound ? grandFinalOpponentId : tournamentLeftId;
  const opponentId = inFinalRound ? EZOZA_ID : tournamentRightId;
  const leftContestant = leftId ? contestantById.get(leftId) : null;
  const rightContestant = opponentId ? contestantById.get(opponentId) : null;
  const currentRound = inFinalRound ? totalRounds : Math.min(tournamentMatchCount + 1, totalRounds);
  const progressPercent = totalRounds > 0 ? Math.round((currentRound / totalRounds) * 100) : 100;
  const rawHeartPercent = Math.round((heartCharge / maxHeartCharge) * 100);
  const heartFillPercent = heartIgnited ? 100 : Math.min(88, rawHeartPercent);
  const finalSingleChoice = inFinalRound && singleChoiceMode;
  const blastParticles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: `blast-${finalBlastToken}-${index}`,
        left: 8 + Math.random() * 84,
        top: 12 + Math.random() * 68,
        size: 4 + Math.random() * 5,
        delay: index * 18,
        duration: 520 + Math.random() * 260,
      })),
    [finalBlastToken],
  );

  useEffect(() => {
    trackEvent('battle_state_changed', {
      battlePhase,
      tournamentStage,
      matchIndex,
      finalMissCount,
      singleChoiceMode,
    });
  }, [battlePhase, finalMissCount, matchIndex, singleChoiceMode, tournamentStage, trackEvent]);

  useEffect(() => {
    if (battlePhase !== 'tournament') {
      return;
    }

    if (roundIds.length <= 1) {
      const finalistId = roundIds[0] ?? BATTLE_LADDER_IDS[0] ?? EZOZA_ID;
      const finalistName = contestantById.get(finalistId)?.name ?? 'Finalist';
      setGrandFinalOpponentId(finalistId);
      setBattlePhase('grand_final');
      setStatusTitle('Yakuniy battle boshlandi.');
      setStatusDescription(`${finalistName} va ${specialName} o'rtasida so'nggi duel.`);
    }
  }, [battlePhase, contestantById, roundIds, specialName]);

  const pourIntoHeart = (incrementCharge: boolean) => {
    setPourToken((prev) => prev + 1);
    if (incrementCharge) {
      setHeartCharge((prev) => Math.min(prev + 1, maxHeartCharge));
    }
  };

  const handleSelect = (pickedId: string) => {
    if (!leftContestant || !rightContestant || isLocked || completed) {
      return;
    }

    hapticSelection();
    setSelectedId(pickedId);
    setIsLocked(true);

    const pickedContestant = contestantById.get(pickedId);
    if (!pickedContestant) {
      setSelectedId(null);
      setIsLocked(false);
      return;
    }

    const pickedSide: DuelSide = pickedId === leftContestant.id ? 'left' : 'right';
    const ezozaSide: DuelSide = leftContestant.id === EZOZA_ID ? 'left' : 'right';
    const winnerSide: DuelSide = inFinalRound && pickedId !== EZOZA_ID ? ezozaSide : pickedSide;
    const winnerId = winnerSide === 'left' ? leftContestant.id : rightContestant.id;
    const winnerName = contestantById.get(winnerId)?.name ?? rightContestant.name;

    setDuelWinnerSide(winnerSide);
    setDuelToken((prev) => prev + 1);

    if (inFinalRound) {
      if (pickedId === EZOZA_ID) {
        const duelLog: BattleDuelLog = {
          leftId: leftContestant.id,
          rightId: rightContestant.id,
          pickedId,
          winnerId,
          phase: 'grand_final',
          timestamp: new Date().toISOString(),
        };
        const nextHistory = [...duelHistory, duelLog];
        setDuelHistory(nextHistory);
        trackEvent('battle_duel_selected', {
          ...duelLog,
          pickedName: pickedContestant.name,
          winnerName,
        });

        pourIntoHeart(true);
        setHeartIgnited(true);
        setFinalInterventionStage(0);
        setFinalBlastActive(false);
        hapticNotify('success');
        setCompleted(true);
        setStatusTitle(`Tabriklaymiz, ${specialName} golib bo'ldi!`);
        setStatusDescription('Yurakdagi barcha jamlanmalar porladi. Keyingi bosqichga o`tamiz...');

        const winnerContestant = contestantById.get(EZOZA_ID) ?? rightContestant;
        const result: BestPersonGameResult = {
          winnerId: winnerContestant.id,
          winnerName: winnerContestant.name,
          finalMissCount,
          totalDuels: nextHistory.length,
          duelHistory: nextHistory,
        };

        trackEvent('battle_game_completed', {
          winnerId: result.winnerId,
          winnerName: result.winnerName,
          totalDuels: result.totalDuels,
          finalMissCount: result.finalMissCount,
        });

        setTimeout(() => {
          onComplete(result);
        }, 1500);
        return;
      }

      pourIntoHeart(true);
      hapticImpact('heavy');
      hapticNotify('warning');

      const nextMissCount = finalMissCount + 1;
      const duelLog: BattleDuelLog = {
        leftId: leftContestant.id,
        rightId: rightContestant.id,
        pickedId,
        winnerId,
        phase: 'grand_final',
        timestamp: new Date().toISOString(),
        interventionStage: nextMissCount,
      };
      const nextHistory = [...duelHistory, duelLog];
      setDuelHistory(nextHistory);
      trackEvent('battle_duel_selected', {
        ...duelLog,
        pickedName: pickedContestant.name,
        winnerName,
      });

      setFinalMissCount(nextMissCount);
      setLastRejectedName(pickedContestant.name);
      setFinalInterventionToken((current) => current + 1);

      if (nextMissCount === 1) {
        setFinalInterventionStage(1);
        setStatusTitle("🚫 Qalbimiz allaqachon o'z malikasini tanlagan!");
        setStatusDescription(`${pickedContestant.name} zambarak zarbasi bilan ortga surildi. Final yo'nalishi o'zgarmaydi.`);
      } else if (nextMissCount === 2) {
        setFinalInterventionStage(2);
        playSirenBurst();
        setStatusTitle('🚨 Favqulodda tekshiruv ishga tushdi!');
        setStatusDescription("Haqiqiy go'zallikni farqlash qiyin bo'lyapti. Iltimos, ko'z shifokoriga uchrashing.");
      } else {
        setFinalInterventionStage(3);
        setSingleChoiceMode(true);
        playSirenBurst();
        playCinematicBlast();
        setFinalBlastToken((current) => current + 1);
        setFinalBlastActive(true);
        setStatusTitle("💥 Hayotimda boshqasiga joy yo'q!");
        setStatusDescription(`${pickedContestant.name} final sahnasidan chiqarildi. Endi faqat ${specialName} qoldi.`);
        window.setTimeout(() => setFinalBlastActive(false), 980);
      }

      trackEvent('battle_final_intervention_triggered', {
        stage: nextMissCount,
        rejectedName: pickedContestant.name,
      });

      setTimeout(() => {
        setSelectedId(null);
        setIsLocked(false);
      }, nextMissCount >= 3 ? 1450 : 1100);
      return;
    }

    const duelLog: BattleDuelLog = {
      leftId: leftContestant.id,
      rightId: rightContestant.id,
      pickedId,
      winnerId,
      phase: 'tournament',
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...duelHistory, duelLog];
    setDuelHistory(nextHistory);
    trackEvent('battle_duel_selected', {
      ...duelLog,
      pickedName: pickedContestant.name,
      winnerName,
    });

    pourIntoHeart(true);
    hapticImpact('light');
    setStatusTitle(`${pickedContestant.name} bu duelda ustun keldi.`);
    setStatusDescription(`${pickedContestant.name} keyingi bosqichga o'tdi.`);

    const nextMatchIndex = matchIndex + 1;
    const nextWinners = [...roundWinners, pickedContestant.id];
    setRoundWinners(nextWinners);
    setTournamentMatchCount((current) => current + 1);

    setTimeout(() => {
      if (nextMatchIndex < matchesInCurrentRound) {
        setMatchIndex(nextMatchIndex);
        setSelectedId(null);
        setIsLocked(false);
        return;
      }

      const nextRoundIds = [...nextWinners];
      let byeName: string | null = null;

      if (hasByeInCurrentRound && byeId) {
        nextRoundIds.push(byeId);
        byeName = contestantById.get(byeId)?.name ?? null;
      }

      if (nextRoundIds.length <= 1) {
        const finalistId = nextRoundIds[0] ?? pickedContestant.id;
        const finalistName = contestantById.get(finalistId)?.name ?? 'Finalist';
        setGrandFinalOpponentId(finalistId);
        setBattlePhase('grand_final');
        setFinalMissCount(0);
        setFinalInterventionStage(0);
        setFinalInterventionToken(0);
        setLastRejectedName(null);
        setSingleChoiceMode(false);
        setStatusTitle('Yakuniy battle boshlandi.');
        setStatusDescription(`${finalistName} va ${specialName} o'rtasida so'nggi duel.`);
      } else {
        const nextStage = tournamentStage + 1;
        setRoundIds(nextRoundIds);
        setRoundWinners([]);
        setMatchIndex(0);
        setTournamentStage(nextStage);
        setStatusTitle(`Bosqich ${nextStage} boshlandi.`);
        setStatusDescription(
          byeName
            ? `${byeName} bu bosqichga avtomatik o'tdi. Endi yangi juftliklar battle qiladi.`
            : "Yangi juftliklar tayyor. G'oliblar keyingi bosqichga o'tadi.",
        );
      }

      setSelectedId(null);
      setIsLocked(false);
    }, 900);
  };

  if (!leftContestant || !rightContestant) {
    return (
      <div className="w-full max-w-lg mx-auto p-4">
        <div className="glass-card rounded-2xl p-5 text-center text-love-600">Battle malumotlari toliq topilmadi.</div>
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-5xl mx-auto px-1 md:px-2 flex flex-col gap-4 relative"
      style={{ animation: finalBlastActive ? 'finalArenaShake 620ms cubic-bezier(0.36, 0.07, 0.19, 0.97) 1' : undefined }}
    >
      <style>
        {`
          @keyframes finalArenaShake {
            0%, 100% { transform: translate3d(0, 0, 0); }
            10% { transform: translate3d(-2px, 1px, 0); }
            20% { transform: translate3d(2px, -1px, 0); }
            30% { transform: translate3d(-3px, 1px, 0); }
            40% { transform: translate3d(3px, -1px, 0); }
            50% { transform: translate3d(-2px, 0px, 0); }
            60% { transform: translate3d(2px, 1px, 0); }
            70% { transform: translate3d(-1px, -1px, 0); }
            80% { transform: translate3d(1px, 1px, 0); }
            90% { transform: translate3d(0px, -1px, 0); }
          }
          @keyframes finalBlastFlash {
            0% { opacity: 0; }
            12% { opacity: 0.95; }
            45% { opacity: 0.24; }
            100% { opacity: 0; }
          }
          @keyframes finalBlastCrimson {
            0% { opacity: 0.65; transform: scale(0.7); }
            100% { opacity: 0; transform: scale(1.25); }
          }
          @keyframes finalBlastShockwave {
            0% { opacity: 0.45; transform: translate(-50%, -50%) scale(0.28); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(2.4); }
          }
          @keyframes finalBlastParticle {
            0% { opacity: 0; transform: translateY(0px) scale(0.35); }
            20% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-34px) scale(1); }
          }
        `}
      </style>

      {finalBlastActive && (
        <div key={`final-blast-${finalBlastToken}`} className="fixed inset-0 pointer-events-none z-[120] overflow-hidden">
          <div className="absolute inset-0 bg-white/90" style={{ animation: 'finalBlastFlash 560ms ease-out 1' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/45 via-red-500/35 to-orange-400/30" style={{ animation: 'finalBlastCrimson 820ms ease-out 1' }} />
          <div className="absolute left-1/2 top-1/2 w-[36vmax] h-[36vmax] rounded-full bg-rose-300/40" style={{ animation: 'finalBlastShockwave 760ms ease-out 1' }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[52px]">💥</div>
          {blastParticles.map((particle) => (
            <span
              key={particle.id}
              className="absolute rounded-full bg-amber-100/95 shadow-[0_0_10px_rgba(254,243,199,0.9)]"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animation: `finalBlastParticle ${particle.duration}ms ease-out ${particle.delay}ms 1 both`,
              }}
            />
          ))}
        </div>
      )}

      <header className="glass-card rounded-3xl p-4 md:p-5 border border-love-200 shadow-love z-20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-love-500 text-xs uppercase tracking-[0.18em] font-semibold mb-2">My Princess 👑💖</p>
            <h2 className="text-xl md:text-2xl font-serif text-gradient-love leading-tight">Qalbim Chechagi 🌸💘</h2>
            <p className="text-love-400 text-sm mt-1.5">💎 ✨ 🌹 ✨ 💎</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-love-100 flex items-center justify-center shrink-0">
            {inFinalRound ? <Trophy className="w-5 h-5 text-love-500" /> : <Crown className="w-5 h-5 text-love-500" />}
          </div>
        </div>

        <div className="mt-4 mb-3">
          <div className="flex items-center justify-between text-xs text-love-500 mb-1.5">
            <span>Raund {currentRound}/{Math.max(totalRounds, 1)}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-love-100 rounded-full overflow-hidden">
            <div className="h-full btn-gradient-love transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 border border-love-100 p-3">
          <p className="text-love-700 text-sm font-semibold leading-normal">{statusTitle}</p>
          <p className="text-love-500 text-xs mt-1.5 leading-relaxed">{statusDescription}</p>
        </div>
      </header>

      {inFinalRound && !completed && (
        <FinalInterventionBanner
          stage={finalInterventionStage}
          token={finalInterventionToken}
          targetName={lastRejectedName}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        {finalSingleChoice ? (
          <EliminatedContestantCard name={lastRejectedName ?? leftContestant.name} />
        ) : (
          <DuelCard
            contestant={leftContestant}
            customImageSrc={leftContestant.id === EZOZA_ID ? specialImageSrc : undefined}
            onSelect={handleSelect}
            selectedId={selectedId}
            disabled={isLocked}
          />
        )}

        <div className="flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 border border-love-200 shadow-love flex items-center justify-center shrink-0">
            {finalSingleChoice ? <Crown className="w-5 h-5 text-love-500" /> : <Swords className="w-5 h-5 text-love-500" />}
          </div>
        </div>

        <DuelCard
          contestant={rightContestant}
          customImageSrc={rightContestant.id === EZOZA_ID ? specialImageSrc : undefined}
          onSelect={handleSelect}
          selectedId={selectedId}
          disabled={isLocked || (finalSingleChoice && !rightContestant.isEzoza)}
        />
      </div>

      <KnightDuelTrack
        duelToken={duelToken}
        winnerSide={duelWinnerSide}
        leftName={leftContestant.name}
        rightName={rightContestant.name}
        fillPercent={heartFillPercent}
        ignited={heartIgnited}
        pourToken={pourToken}
      />

      {inFinalRound && !completed && (
        <div className="glass-card rounded-2xl border border-love-200 p-3 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-love-500 mt-0.5 shrink-0" />
          <p className="text-love-600 text-xs leading-relaxed">
            {finalSingleChoice
              ? `Endi faqat ${specialName} qoldi. Yakunlash uchun maxsus personajni tanlang.`
              : `${specialName} tanlanmaguncha final davom etadi. Har tanlov yurak jamlanmasiga saqlanadi.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default BestPersonGame;
