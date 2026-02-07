import React, { useState, useRef, useCallback } from 'react';
import { NO_BUTTON_PHRASES } from '../constants';
import { Heart } from 'lucide-react';
import { ProposalResult } from '../types';
import { useAppRuntime } from '../context/AppRuntimeContext';

interface ProposalProps {
  onYes: (result: ProposalResult) => void;
}

const Proposal: React.FC<ProposalProps> = ({ onYes }) => {
  const { config, trackEvent } = useAppRuntime();
  const [noCount, setNoCount] = useState(0);
  const [noPosition, setNoPosition] = useState<{ x: number; y: number } | null>(null);
  const [isYesHovered, setIsYesHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getNoButtonText = () => {
    return NO_BUTTON_PHRASES[Math.min(noCount, NO_BUTTON_PHRASES.length - 1)];
  };

  // "Yo'q" tugmasi qochadi
  const moveNoButton = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const maxX = container.width - 120;
    const maxY = container.height - 50;
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;

    setNoPosition({ x: newX, y: newY });
    setNoCount((prev) => {
      const next = prev + 1;
      trackEvent('proposal_no_clicked', { noClickCount: next });
      return next;
    });

    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    } catch {}
  }, [trackEvent]);

  // "Yes" tugmasi kattalashadi
  const yesSize = Math.min(noCount * 4 + 18, 48);
  const yesPadding = Math.min(noCount * 4 + 32, 64);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      {/* Big Question */}
      <div className="mb-10 animate-fade-in-up">
        <div className="text-5xl mb-6 animate-heart-beat">💕</div>
        <h1 className="text-3xl md:text-5xl font-serif font-semibold text-gradient-love mb-4 leading-tight">
          {config.partnerFirstName},<br />
          Mening sevgilim bo'lasizmi?
        </h1>
        <p className="text-love-400 font-light text-lg">
          (Va balki abadiy hamrohim? 🥺)
        </p>
      </div>

      {/* Buttons Area */}
      <div
        ref={containerRef}
        className="relative w-full max-w-sm min-h-[200px] flex flex-col items-center justify-start gap-4"
      >
        {/* YES button - always centered, grows */}
        <button
          onClick={() => {
            trackEvent('proposal_accepted', { noClickCount: noCount });
            onYes({ accepted: true, noClickCount: noCount });
          }}
          onMouseEnter={() => setIsYesHovered(true)}
          onMouseLeave={() => setIsYesHovered(false)}
          style={{
            fontSize: `${yesSize}px`,
            padding: `16px ${yesPadding}px`,
          }}
          className="btn-gradient-love text-white font-medium rounded-full shadow-love-lg hover:shadow-love transition-all duration-300 hover:scale-110 active:scale-95 z-20 flex items-center gap-2"
        >
          <Heart
            className={`fill-current transition-transform ${
              isYesHovered ? 'animate-heart-beat' : ''
            }`}
            style={{ width: `${yesSize * 0.7}px`, height: `${yesSize * 0.7}px` }}
          />
          Ha! 💖
        </button>

        {/* NO button - runs away after first click */}
        {noCount < 3 ? (
          <button
            onClick={moveNoButton}
            className="bg-gray-200 hover:bg-gray-300 text-gray-500 font-light py-3 px-8 rounded-full transition-all duration-300 text-base z-10"
            style={{
              fontSize: `${Math.max(16 - noCount * 2, 10)}px`,
              opacity: Math.max(1 - noCount * 0.2, 0.4),
            }}
          >
            {noCount === 0 ? "Yo'q" : getNoButtonText()}
          </button>
        ) : (
          <button
            onClick={moveNoButton}
            className="bg-gray-200 text-gray-400 font-light py-2 px-6 rounded-full transition-all duration-200 text-xs absolute z-10"
            style={{
              left: noPosition ? `${noPosition.x}px` : '50%',
              top: noPosition ? `${noPosition.y}px` : '50%',
              transform: noPosition ? 'none' : 'translate(-50%, 0)',
              fontSize: `${Math.max(14 - noCount, 8)}px`,
              opacity: Math.max(1 - noCount * 0.05, 0.3),
            }}
          >
            {getNoButtonText()}
          </button>
        )}
      </div>

      {/* Funny messages based on no count */}
      {noCount > 0 && noCount < 5 && (
        <p className="mt-4 text-love-400 text-sm font-light animate-fade-in">
          Ha tugmasini bosing... bilasiz-ku javobni 😏
        </p>
      )}
      {noCount >= 5 && noCount < 10 && (
        <p className="mt-4 text-love-500 text-sm font-light animate-fade-in">
          Yo'q tugmasi qochib ketyapti! 😂
        </p>
      )}
      {noCount >= 10 && (
        <p className="mt-4 text-love-600 text-sm font-medium animate-pulse-soft">
          Iltimos... Yuragim sizni kutyapti! 💔
        </p>
      )}
    </div>
  );
};

export default Proposal;
