export enum GameStep {
  INTRO = 'INTRO',
  JOURNEY = 'JOURNEY',
  NAME_GAME = 'NAME_GAME',
  QUALITIES = 'QUALITIES',
  DREAMS = 'DREAMS',
  FAVORITES = 'FAVORITES',
  BEST_PERSON = 'BEST_PERSON',
  PROPOSAL = 'PROPOSAL',
  SUCCESS = 'SUCCESS',
}

export type JourneySceneType = 'korea' | 'turkey' | 'maldives' | 'paris' | 'home' | 'forever';

export interface JourneyStation {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  svgType: JourneySceneType;
}

export interface QualityOption {
  id: string;
  text: string;
  emoji: string;
  isGood: boolean;
}

export interface PersonOption {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isCorrect: boolean;
}

// Final battle game types
export type BattleGroup = 'singer' | 'actress' | 'cartoon' | 'icon' | 'special';

export interface BattleContestant {
  id: string;
  name: string;
  group: BattleGroup;
  imageNumber: number;
  beautyScore: number;
  popularityScore: number;
  characterTypes: string[];
  strengths: string[];
  charms: string[];
  isEzoza?: boolean;
}

// Character game types
export type CharacterTrait = 'romantik' | 'mehribon' | 'sarguzashtsevar' | 'ijodkor' | 'aqlli' | 'kuchli' | 'quvnoq';

export interface CharacterChoice {
  id: string;
  text: string;
  emoji: string;
  trait: CharacterTrait;
}

export interface CharacterScenario {
  id: string;
  question: string;
  emoji: string;
  cardBack: string; // emoji for card back
  choices: CharacterChoice[];
  diaryPlaceholder: string;
}

export interface CharacterArchetype {
  id: string;
  name: string;
  emoji: string;
  traits: [CharacterTrait, CharacterTrait];
  description: string;
  color: string;
}

// Dreams game types
export interface DreamWish {
  id: string;
  title: string;
  emoji: string;
  prompt: string;
  starColor: string;
}

// Favorites game types
export interface FavoriteCategory {
  id: string;
  name: string;
  emoji: string;
  question: string;
  shelfColor: string;
}

export interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
}

export interface AppConfig {
  partnerFirstName: string;
  partnerLastName: string;
  myName: string;
  specialContestantName: string;
  campaignTitle: string;
}

export interface NameGameResult {
  firstName: string;
  lastName: string;
  wrongAttempts: number;
  totalAttempts: number;
}

export interface QualitiesGameResult {
  archetypeId: string;
  archetypeName: string;
  traitScores: Record<CharacterTrait, number>;
  answers: Record<number, CharacterTrait>;
  selectedChoices: Record<number, string>;
  diaryEntries: Record<number, string>;
}

export interface DreamsGameResult {
  wishes: Array<{
    wishId: string;
    title: string;
    text: string;
  }>;
}

export interface FavoritesGameResult {
  favorites: Array<{
    categoryId: string;
    categoryName: string;
    value: string;
  }>;
}

export interface BattleDuelLog {
  leftId: string;
  rightId: string;
  pickedId: string;
  winnerId: string;
  phase: 'tournament' | 'grand_final';
  timestamp: string;
  interventionStage?: number;
}

export interface BestPersonGameResult {
  winnerId: string;
  winnerName: string;
  finalMissCount: number;
  totalDuels: number;
  duelHistory: BattleDuelLog[];
}

export interface ProposalResult {
  accepted: boolean;
  noClickCount: number;
}

export interface SessionResults {
  nameGame?: NameGameResult;
  qualitiesGame?: QualitiesGameResult;
  dreamsGame?: DreamsGameResult;
  favoritesGame?: FavoritesGameResult;
  bestPersonGame?: BestPersonGameResult;
  proposal?: ProposalResult;
}

// Telegram Web App types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'light' | 'dark';
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
          };
        };
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export {};
