import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Heart, Sparkles, ChevronRight, Check, BookOpen, Feather } from 'lucide-react';
import {
  CHARACTER_SCENARIOS,
  CHARACTER_ARCHETYPES,
  CHARACTER_TRAITS,
} from '../constants';
import { CharacterTrait, CharacterScenario, CharacterArchetype, QualitiesGameResult } from '../types';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface QualitiesGameProps {
  onComplete: (result: QualitiesGameResult) => void;
}

// ============================================================
// Mirror Frame SVG
// ============================================================
const MirrorFrame: React.FC<{
  phase: 'cards' | 'revealing' | 'result';
  children: React.ReactNode;
}> = ({ phase, children }) => {
  const glowAnim =
    phase === 'revealing' ? 'mirrorReveal 1.5s ease-in-out' :
    phase === 'result' ? 'mirrorGlow 2.5s ease-in-out infinite' : undefined;

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: '360px' }}>
      {/* Outer ornament frame */}
      <div
        className="relative rounded-[2rem] border-2 border-love-200/60 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(253,242,248,0.95) 0%, rgba(255,255,255,0.9) 50%, rgba(237,233,254,0.9) 100%)',
          animation: glowAnim,
        }}
      >
        {/* Top ornament */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-love-300 to-love-500 flex items-center justify-center shadow-love">
            <span className="text-white text-sm">🪞</span>
          </div>
        </div>

        {/* Side ornaments */}
        <svg className="absolute top-4 left-2 w-4 h-16 opacity-20" viewBox="0 0 16 64">
          <path d="M8,0 Q0,16 8,32 Q16,48 8,64" stroke="#ec4899" fill="none" strokeWidth="1.5" />
        </svg>
        <svg className="absolute top-4 right-2 w-4 h-16 opacity-20" viewBox="0 0 16 64">
          <path d="M8,0 Q16,16 8,32 Q0,48 8,64" stroke="#ec4899" fill="none" strokeWidth="1.5" />
        </svg>

        {/* Content area */}
        <div className="pt-8 pb-6 px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Card Component (flip, select, diary)
// ============================================================
type CardState = 'locked' | 'active' | 'flipped' | 'selected' | 'answered';

interface CardProps {
  scenario: CharacterScenario;
  index: number;
  state: CardState;
  onFlip: () => void;
  onSelect: (choiceId: string, trait: CharacterTrait) => void;
  onConfirm: () => void;
  selectedChoiceId: string | null;
  answeredTrait: CharacterTrait | null;
  diaryValue: string;
  onDiaryChange: (val: string) => void;
}

const Card: React.FC<CardProps> = ({
  scenario, index, state, onFlip, onSelect, onConfirm,
  selectedChoiceId, answeredTrait, diaryValue, onDiaryChange,
}) => {
  const isClickable = state === 'active';
  const isFlipped = state === 'flipped' || state === 'selected';
  const isSelected = state === 'selected';
  const isAnswered = state === 'answered';
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when entering selected state
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [isSelected]);

  return (
    <div className="w-full">
      {/* Mini card when locked/active/answered (list item) */}
      {(state === 'locked' || state === 'active' || state === 'answered') && (
        <button
          onClick={() => isClickable && onFlip()}
          disabled={!isClickable}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
            isAnswered
              ? 'bg-love-50/80 border-love-200 opacity-75'
              : isClickable
              ? 'bg-white/90 border-love-300 shadow-md hover:shadow-love hover:scale-[1.02] cursor-pointer active:scale-[0.98]'
              : 'bg-white/40 border-love-100/50 opacity-40'
          }`}
        >
          {/* Number */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
            isAnswered
              ? 'bg-love-500 text-white'
              : isClickable
              ? 'bg-love-100 text-love-600'
              : 'bg-love-50 text-love-300'
          }`}>
            {isAnswered ? '✓' : index + 1}
          </div>

          {/* Card back emoji + question preview */}
          <div className="flex-1 text-left min-w-0">
            {isAnswered && answeredTrait ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{CHARACTER_TRAITS[answeredTrait].emoji}</span>
                <span className="text-love-600 text-sm font-medium">{CHARACTER_TRAITS[answeredTrait].name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{scenario.cardBack}</span>
                <span className={`text-sm truncate ${isClickable ? 'text-love-600' : 'text-love-300'}`}>
                  {isClickable ? scenario.question.slice(0, 35) + '...' : '???'}
                </span>
              </div>
            )}
          </div>

          {/* Arrow for active */}
          {isClickable && (
            <ChevronRight className="w-4 h-4 text-love-400 shrink-0" />
          )}
        </button>
      )}

      {/* Expanded card when flipped (showing scenario with choices) */}
      {state === 'flipped' && (
        <div className="card-scene">
          <div
            className="rounded-2xl border-2 border-love-300 shadow-love-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)',
              animation: 'traitReveal 0.5s ease-out',
            }}
          >
            {/* Question header */}
            <div className="px-5 pt-5 pb-3 text-center">
              <span className="text-2xl mb-2 block" style={{ animation: 'emojiPop 0.4s ease-out' }}>
                {scenario.emoji}
              </span>
              <p className="text-love-700 text-sm font-medium leading-relaxed break-words">
                {scenario.question}
              </p>
            </div>

            {/* Choices */}
            <div className="px-4 pb-5 space-y-2.5">
              {scenario.choices.map((choice, ci) => (
                <button
                  key={choice.id}
                  onClick={() => onSelect(choice.id, choice.trait)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-love-100 bg-white/80 hover:border-love-400 hover:bg-love-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.97] text-left group"
                  style={{ animationDelay: `${ci * 0.1}s`, animation: `fadeInUp 0.4s ease-out ${ci * 0.1}s both` }}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">{choice.emoji}</span>
                  <span className="text-love-700 text-sm flex-1 min-w-0 break-words leading-snug">{choice.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected state: chosen answer highlighted + diary textarea + Keyingi button */}
      {state === 'selected' && (
        <div className="card-scene">
          <div
            className="rounded-2xl border-2 border-love-400 shadow-love-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,242,248,0.95) 100%)',
              animation: 'traitReveal 0.4s ease-out',
            }}
          >
            {/* Question header (compact) */}
            <div className="px-5 pt-5 pb-2 text-center">
              <span className="text-xl mb-1 block">{scenario.emoji}</span>
              <p className="text-love-600 text-xs font-medium leading-relaxed opacity-80 break-words">
                {scenario.question}
              </p>
            </div>

            {/* All choices — selected one is highlighted */}
            <div className="px-4 pb-3 space-y-2">
              {scenario.choices.map((choice) => {
                const isChosen = choice.id === selectedChoiceId;
                return (
                  <div
                    key={choice.id}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-300 ${
                      isChosen
                        ? 'border-love-500 bg-love-50/90 shadow-md'
                        : 'border-love-100/60 bg-white/40 opacity-40'
                    }`}
                  >
                    {isChosen && (
                      <div className="w-5 h-5 rounded-full bg-love-500 flex items-center justify-center shrink-0" style={{ animation: 'emojiPop 0.3s ease-out' }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className={`text-lg ${isChosen ? '' : 'grayscale opacity-50'}`}>{choice.emoji}</span>
                    <span className={`text-sm flex-1 min-w-0 break-words leading-snug ${isChosen ? 'text-love-700 font-medium' : 'text-love-400'}`}>
                      {choice.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Diary textarea */}
            <div className="px-4 pb-3" style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none">
                  <Feather className="w-3.5 h-3.5 text-love-300" />
                </div>
                <textarea
                  ref={textareaRef}
                  value={diaryValue}
                  onChange={(e) => onDiaryChange(e.target.value)}
                  placeholder={scenario.diaryPlaceholder}
                  rows={3}
                  className="w-full rounded-xl border-2 border-love-200/60 bg-white/60 backdrop-blur-sm px-4 py-2.5 pl-9 text-love-700 text-sm placeholder:text-love-300 placeholder:italic focus:border-love-400 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-love-200/40 resize-none transition-all duration-300"
                  style={{ minHeight: '72px' }}
                />
              </div>
              <p className="text-love-300 text-[10px] mt-1 text-center italic">
                Ixtiyoriy — o'z fikringizni yozing yoki keyingisiga o'ting
              </p>
            </div>

            {/* Keyingi button */}
            <div className="px-4 pb-5 flex justify-center" style={{ animation: 'fadeInUp 0.4s ease-out 0.3s both' }}>
              <button
                onClick={onConfirm}
                className="inline-flex items-center gap-2 px-8 py-2.5 btn-gradient-love text-white rounded-full shadow-love hover:shadow-love-lg hover:scale-105 active:scale-95 transition-all duration-200 text-sm font-medium"
              >
                <span>Keyingi</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Trait revealed toast (shows after answering)
// ============================================================
const TraitToast: React.FC<{ trait: CharacterTrait; visible: boolean }> = ({ trait, visible }) => {
  const t = trait ? CHARACTER_TRAITS[trait] : null;
  return (
    <div
      className={`w-full flex justify-center overflow-hidden transition-all duration-300 ${
        visible && t ? 'max-h-24 opacity-100 mb-1' : 'max-h-0 opacity-0 mb-0'
      }`}
      aria-hidden={!visible}
    >
      {t && (
        <div
          className="pointer-events-none glass-card rounded-2xl px-5 py-3 shadow-love-lg flex items-center gap-2.5"
          style={{ animation: visible ? 'traitReveal 0.5s ease-out, fadeIn 0.3s ease-out' : undefined }}
        >
          <span className="text-xl">{t.emoji}</span>
          <div>
            <p className="text-love-300 text-[10px] uppercase tracking-wider font-medium">Xususiyat ochildi</p>
            <p className="text-love-700 text-sm font-semibold">{t.name}</p>
          </div>
          <Sparkles className="w-4 h-4 text-love-400" />
        </div>
      )}
    </div>
  );
};

// ============================================================
// Result Screen (with diary section)
// ============================================================
const ResultScreen: React.FC<{
  archetype: CharacterArchetype;
  traitScores: Record<CharacterTrait, number>;
  answers: Record<number, CharacterTrait>;
  diaryEntries: Record<number, string>;
  partnerFirstName: string;
  onComplete: () => void;
}> = ({ archetype, traitScores, answers, diaryEntries, partnerFirstName, onComplete }) => {
  // Sort traits by score for display
  const sortedTraits = useMemo(() =>
    Object.entries(traitScores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)
      .slice(0, 4),
  [traitScores]);

  const maxScore = Math.max(...Object.values(traitScores), 1);

  // Diary entries that have content
  const diaryItems = useMemo(() =>
    Object.entries(diaryEntries)
      .filter(([, text]) => text.trim().length > 0)
      .map(([idx, text]) => ({
        index: Number(idx),
        text,
        scenario: CHARACTER_SCENARIOS[Number(idx)],
        trait: answers[Number(idx)],
      })),
  [diaryEntries, answers]);

  return (
    <div className="text-center space-y-5 px-2" style={{ animation: 'archetypeReveal 0.8s ease-out' }}>
      {/* Archetype badge */}
      <div>
        <div
          className="text-5xl mb-3 inline-block"
          style={{ animation: 'emojiPop 0.6s ease-out 0.3s both' }}
        >
          {archetype.emoji}
        </div>
        <h3 className="text-2xl font-serif font-semibold mb-1" style={{ color: archetype.color }}>
          {archetype.name}
        </h3>
        <p className="text-love-400 text-xs font-light mb-3">
          {partnerFirstName}ning xarakter arxetipi
        </p>
      </div>

      {/* Description */}
      <div className="glass-card rounded-2xl px-5 py-4 text-left">
        <p className="text-love-700 text-sm leading-relaxed font-light">
          {archetype.description}
        </p>
      </div>

      {/* Trait bars */}
      <div className="space-y-2 px-2">
        <p className="text-love-400 text-xs font-medium uppercase tracking-wider mb-3">Xususiyat balllari</p>
        {sortedTraits.map(([trait, score], i) => {
          const t = CHARACTER_TRAITS[trait as CharacterTrait];
          const pct = Math.round((score / maxScore) * 100);
          return (
            <div key={trait} className="flex items-center gap-2" style={{ animation: `fadeInUp 0.4s ease-out ${0.3 + i * 0.1}s both` }}>
              <span className="text-sm w-6 text-center">{t.emoji}</span>
              <span className="text-love-600 text-xs w-24 text-left">{t.name}</span>
              <div className="flex-1 h-2.5 bg-love-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${archetype.color}88, ${archetype.color})`,
                    animation: `progressFill 0.6s ease-out ${0.5 + i * 0.15}s both`,
                  }}
                />
              </div>
              <span className="text-love-400 text-[10px] w-6 text-right font-medium">{score}</span>
            </div>
          );
        })}
      </div>

      {/* ========== Qalb Kundaligi (Diary Section) ========== */}
      {diaryItems.length > 0 && (
        <div
          className="space-y-3 pt-2"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-love-400" />
            <p className="text-love-500 text-xs font-semibold uppercase tracking-wider">
              Sizning qalb kundaligingiz
            </p>
            <BookOpen className="w-4 h-4 text-love-400" />
          </div>

          {diaryItems.map((item, i) => (
            <div
              key={item.index}
              className="glass-card rounded-xl px-4 py-3 text-left space-y-1.5"
              style={{ animation: `fadeInUp 0.4s ease-out ${0.8 + i * 0.12}s both` }}
            >
              {/* Question (small, muted) */}
              <p className="text-love-400 text-[11px] leading-snug flex items-start gap-1.5">
                <span className="shrink-0">{item.scenario.emoji}</span>
                <span>{item.scenario.question}</span>
              </p>
              {/* User's diary text */}
              <p className="text-love-700 text-sm italic leading-relaxed pl-5">
                "{item.text}"
              </p>
              {/* Trait badge */}
              {item.trait && (
                <div className="flex items-center gap-1.5 pl-5">
                  <span className="text-xs">{CHARACTER_TRAITS[item.trait].emoji}</span>
                  <span className="text-love-500 text-[10px] font-medium bg-love-50 rounded-full px-2 py-0.5">
                    {CHARACTER_TRAITS[item.trait].name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confetti emojis */}
      <div className="flex justify-center gap-2 py-2">
        {['✨', archetype.emoji, '💖', archetype.emoji, '✨'].map((e, i) => (
          <span
            key={i}
            className="text-lg"
            style={{ animation: `emojiPop 0.5s ease-out ${0.8 + i * 0.15}s both` }}
          >
            {e}
          </span>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={onComplete}
        className="inline-flex items-center gap-2 px-10 py-4 btn-gradient-love text-white rounded-full shadow-love-lg hover:shadow-love transition-all hover:scale-105 active:scale-95"
        style={{ animation: 'fadeInUp 0.5s ease-out 1.2s both' }}
      >
        <Heart className="w-5 h-5 fill-current" />
        <span className="text-lg font-light">Davom etish</span>
      </button>
    </div>
  );
};

// ============================================================
// Archetype determination logic
// ============================================================
function determineArchetype(scores: Record<CharacterTrait, number>): CharacterArchetype {
  // Get top 2 traits
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const top1 = sorted[0][0] as CharacterTrait;
  const top2 = sorted[1][0] as CharacterTrait;

  // Find best matching archetype
  let best: CharacterArchetype = CHARACTER_ARCHETYPES[0];
  let bestScore = 0;

  for (const arch of CHARACTER_ARCHETYPES) {
    let score = 0;
    if (arch.traits.includes(top1)) score += 2;
    if (arch.traits.includes(top2)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = arch;
    }
  }

  return best;
}

// ============================================================
// Main CharacterGame Component
// ============================================================
const QualitiesGame: React.FC<QualitiesGameProps> = ({ onComplete }) => {
  const { config, trackEvent } = useAppRuntime();
  const [currentCard, setCurrentCard] = useState(0);
  const [cardStates, setCardStates] = useState<CardState[]>(
    CHARACTER_SCENARIOS.map((_, i) => (i === 0 ? 'active' : 'locked'))
  );
  const [answers, setAnswers] = useState<Record<number, CharacterTrait>>({});
  const [selectedChoices, setSelectedChoices] = useState<Record<number, string>>({});
  const [diaryEntries, setDiaryEntries] = useState<Record<number, string>>({});
  const [traitScores, setTraitScores] = useState<Record<CharacterTrait, number>>({
    romantik: 0, mehribon: 0, sarguzashtsevar: 0, ijodkor: 0, aqlli: 0, kuchli: 0, quvnoq: 0,
  });
  const [phase, setPhase] = useState<'cards' | 'revealing' | 'result'>('cards');
  const [revealedTrait, setRevealedTrait] = useState<CharacterTrait | null>(null);

  const answeredCount = Object.keys(answers).length;
  const totalCards = CHARACTER_SCENARIOS.length;

  // Flip a card (show scenario)
  const handleFlip = useCallback((index: number) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch {}
    trackEvent('qualities_card_opened', { index });
    setCardStates(prev => {
      const next = [...prev];
      next[index] = 'flipped';
      return next;
    });
  }, [trackEvent]);

  // Select a choice (transitions to 'selected' state — show diary textarea)
  const handleSelect = useCallback((cardIndex: number, choiceId: string, trait: CharacterTrait) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}
    trackEvent('qualities_choice_selected', { cardIndex, choiceId, trait });

    // Record the trait + choiceId
    setAnswers(prev => ({ ...prev, [cardIndex]: trait }));
    setSelectedChoices(prev => ({ ...prev, [cardIndex]: choiceId }));
    setTraitScores(prev => ({ ...prev, [trait]: prev[trait] + 1 }));

    // Transition card to 'selected'
    setCardStates(prev => {
      const next = [...prev];
      next[cardIndex] = 'selected';
      return next;
    });
  }, [trackEvent]);

  // Confirm and move to next card (called from "Keyingi" button)
  const handleConfirm = useCallback((cardIndex: number) => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); } catch {}

    const trait = answers[cardIndex];
    trackEvent('qualities_card_confirmed', {
      cardIndex,
      trait,
      diaryLength: (diaryEntries[cardIndex] || '').trim().length,
    });

    // Show trait toast
    if (trait) {
      setRevealedTrait(trait);
      setTimeout(() => setRevealedTrait(null), 1800);
    }

    // Mark card as answered, unlock next
    setCardStates(prev => {
      const next = [...prev];
      next[cardIndex] = 'answered';
      if (cardIndex + 1 < totalCards) {
        next[cardIndex + 1] = 'active';
      }
      return next;
    });

    setCurrentCard(cardIndex + 1);

    // If all answered, transition to result
    if (cardIndex + 1 >= totalCards) {
      setTimeout(() => {
        setPhase('revealing');
        try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
        setTimeout(() => setPhase('result'), 1800);
      }, 1200);
    }
  }, [totalCards, answers, diaryEntries, trackEvent]);

  // Handle diary text change
  const handleDiaryChange = useCallback((cardIndex: number, value: string) => {
    setDiaryEntries(prev => ({ ...prev, [cardIndex]: value }));
  }, []);

  // Determine archetype when result phase
  const archetype = useMemo(() => {
    if (phase === 'result') {
      return determineArchetype(traitScores);
    }
    return null;
  }, [phase, traitScores]);

  const handleComplete = useCallback(() => {
    if (!archetype) {
      return;
    }

    const result: QualitiesGameResult = {
      archetypeId: archetype.id,
      archetypeName: archetype.name,
      traitScores,
      answers,
      selectedChoices,
      diaryEntries,
    };

    trackEvent('qualities_game_completed', result as unknown as Record<string, unknown>);
    onComplete(result);
  }, [answers, archetype, diaryEntries, onComplete, selectedChoices, trackEvent, traitScores]);

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center gap-4">
      {/* Trait reveal toast */}
      <TraitToast trait={revealedTrait!} visible={!!revealedTrait} />

      {/* Header */}
      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-love-100 mb-2">
          <Heart className="w-6 h-6 text-love-500 fill-love-500" />
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-semibold text-gradient-love mb-1">
          {config.partnerFirstName} qanday inson?
        </h2>
        <p className="text-love-400 font-light text-sm">
          {phase === 'result' ? 'Sizning xarakter arxetipingiz' : 'Qalb oynasi orqali kashf eting'}
        </p>
      </div>

      {/* Progress */}
      {phase === 'cards' && (
        <div className="w-full max-w-xs flex items-center gap-2 animate-fade-in">
          <div className="flex-1 h-2 bg-love-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-love-400 to-love-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(answeredCount / totalCards) * 100}%` }}
            />
          </div>
          <span className="text-love-400 text-xs font-medium">{answeredCount}/{totalCards}</span>
        </div>
      )}

      {/* Mirror + Content */}
      <MirrorFrame phase={phase}>
        {phase === 'result' && archetype ? (
          <ResultScreen
            archetype={archetype}
            traitScores={traitScores}
            answers={answers}
            diaryEntries={diaryEntries}
            partnerFirstName={config.partnerFirstName}
            onComplete={handleComplete}
          />
        ) : phase === 'revealing' ? (
          <div className="text-center py-12 space-y-4">
            <div className="text-4xl animate-spin-slow">🪞</div>
            <p className="text-love-500 text-sm font-light animate-pulse-soft">
              Qalb oynasi javoblarni tahlil qilmoqda...
            </p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-love-400"
                  style={{ animation: `pulseSoft 1s ease-in-out ${i * 0.3}s infinite` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {CHARACTER_SCENARIOS.map((scenario, i) => (
              <Card
                key={scenario.id}
                scenario={scenario}
                index={i}
                state={cardStates[i]}
                onFlip={() => handleFlip(i)}
                onSelect={(choiceId, trait) => handleSelect(i, choiceId, trait)}
                onConfirm={() => handleConfirm(i)}
                selectedChoiceId={selectedChoices[i] || null}
                answeredTrait={answers[i] || null}
                diaryValue={diaryEntries[i] || ''}
                onDiaryChange={(val) => handleDiaryChange(i, val)}
              />
            ))}
          </div>
        )}
      </MirrorFrame>
    </div>
  );
};

export default QualitiesGame;
