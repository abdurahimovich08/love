import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { JOURNEY_STATIONS } from '../constants';

interface JourneyProps {
  onComplete: () => void;
}

// ============================================================
// Premium Animated Car SVG
// ============================================================
const CarSVG: React.FC<{ moving: boolean; nightMode: boolean }> = ({ moving, nightMode }) => (
  <div
    className="relative z-20"
    style={{
      animation: moving ? 'carBounce 0.4s ease-in-out infinite' : 'carIdle 2s ease-in-out infinite',
    }}
  >
    <svg width="110" height="58" viewBox="0 0 110 58" xmlns="http://www.w3.org/2000/svg">
      {/* Headlight beam (night mode) */}
      {nightMode && (
        <g opacity="0.25">
          <polygon points="96,30 140,10 140,50" fill="url(#headBeam)" />
          <defs>
            <linearGradient id="headBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
            </linearGradient>
          </defs>
        </g>
      )}
      {/* Shadow under car */}
      <ellipse cx="55" cy="54" rx="42" ry="3" fill="black" opacity="0.12" />
      {/* Car body — metallic look */}
      <rect x="10" y="22" width="84" height="24" rx="7" fill="url(#bodyGrad)" />
      <rect x="10" y="22" width="84" height="12" rx="7" fill="white" opacity="0.08" />
      {/* Car top/cabin */}
      <path d="M30,22 L40,6 L76,6 L84,22" fill="url(#cabinGrad)" />
      {/* Roof shine */}
      <path d="M42,7 L74,7 L80,18 L38,18 Z" fill="white" opacity="0.06" />
      {/* Windows */}
      <path d="M42,8 L36,20 L56,20 L56,8 Z" fill="#bae6fd" opacity="0.85" />
      <path d="M58,8 L58,20 L80,20 L74,8 Z" fill="#bae6fd" opacity="0.85" />
      {/* Window reflections */}
      <path d="M44,9 L40,17 L43,17 L47,9 Z" fill="white" opacity="0.25" />
      <path d="M62,9 L60,17 L63,17 L65,9 Z" fill="white" opacity="0.25" />
      {/* Headlight */}
      <rect x="92" y="28" width="7" height="7" rx="2.5" fill="#fef08a" />
      <circle cx="98" cy="31.5" r="10" fill="#fef08a" opacity={nightMode ? '0.2' : '0.08'}>
        {nightMode && <animate attributeName="opacity" values="0.2;0.12;0.2" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      {/* Tail light */}
      <rect x="5" y="29" width="6" height="6" rx="2" fill="#ef4444" />
      <circle cx="8" cy="32" r="5" fill="#ef4444" opacity="0.15" />
      {/* Body chrome line */}
      <line x1="16" y1="34" x2="88" y2="34" stroke="white" strokeWidth="0.8" opacity="0.15" />
      {/* Front bumper */}
      <rect x="90" y="38" width="10" height="6" rx="3" fill="#be185d" />
      {/* Rear bumper */}
      <rect x="4" y="38" width="10" height="6" rx="3" fill="#be185d" />
      {/* Door handle */}
      <rect x="56" y="28" width="7" height="2" rx="1" fill="white" opacity="0.2" />
      {/* Side mirror */}
      <rect x="84" y="18" width="5" height="4" rx="1.5" fill="#9d174d" />
      {/* Wheels — detailed */}
      <g>
        <circle cx="30" cy="46" r="10" fill="#111827" />
        <circle cx="30" cy="46" r="7.5" fill="#1f2937" />
        <circle cx="30" cy="46" r="3" fill="#4b5563" />
        <circle cx="30" cy="46" r="1.2" fill="#9ca3af" />
        <g style={{ transformOrigin: '30px 46px', animation: moving ? 'wheelSpin 0.4s linear infinite' : 'wheelSpin 4s linear infinite' }}>
          <line x1="30" y1="38.5" x2="30" y2="53.5" stroke="#4b5563" strokeWidth="1.2" />
          <line x1="22.5" y1="46" x2="37.5" y2="46" stroke="#4b5563" strokeWidth="1.2" />
          <line x1="24.5" y1="40.5" x2="35.5" y2="51.5" stroke="#4b5563" strokeWidth="0.8" />
          <line x1="35.5" y1="40.5" x2="24.5" y2="51.5" stroke="#4b5563" strokeWidth="0.8" />
        </g>
        {/* Tire shine */}
        <circle cx="30" cy="46" r="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.08" />
      </g>
      <g>
        <circle cx="78" cy="46" r="10" fill="#111827" />
        <circle cx="78" cy="46" r="7.5" fill="#1f2937" />
        <circle cx="78" cy="46" r="3" fill="#4b5563" />
        <circle cx="78" cy="46" r="1.2" fill="#9ca3af" />
        <g style={{ transformOrigin: '78px 46px', animation: moving ? 'wheelSpin 0.4s linear infinite' : 'wheelSpin 4s linear infinite' }}>
          <line x1="78" y1="38.5" x2="78" y2="53.5" stroke="#4b5563" strokeWidth="1.2" />
          <line x1="70.5" y1="46" x2="85.5" y2="46" stroke="#4b5563" strokeWidth="1.2" />
          <line x1="72.5" y1="40.5" x2="83.5" y2="51.5" stroke="#4b5563" strokeWidth="0.8" />
          <line x1="83.5" y1="40.5" x2="72.5" y2="51.5" stroke="#4b5563" strokeWidth="0.8" />
        </g>
        <circle cx="78" cy="46" r="10" fill="none" stroke="white" strokeWidth="0.5" opacity="0.08" />
      </g>
      {/* Exhaust smoke */}
      {moving && (
        <>
          <circle cx="2" cy="42" r="3" fill="#9ca3af" opacity="0.35">
            <animate attributeName="cx" values="2;-6;-16" dur="0.7s" repeatCount="indefinite" />
            <animate attributeName="r" values="3;5;6.5" dur="0.7s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0.15;0" dur="0.7s" repeatCount="indefinite" />
          </circle>
          <circle cx="-4" cy="40" r="2" fill="#9ca3af" opacity="0.25">
            <animate attributeName="cx" values="-4;-14;-26" dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="r" values="2;4;5.5" dur="0.9s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0.1;0" dur="0.9s" repeatCount="indefinite" />
          </circle>
          <circle cx="-8" cy="38" r="1.5" fill="#d1d5db" opacity="0.2">
            <animate attributeName="cx" values="-8;-20;-34" dur="1.1s" repeatCount="indefinite" />
            <animate attributeName="r" values="1.5;3;4" dur="1.1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0.08;0" dur="1.1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="cabinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f9a8d4" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// ============================================================
// Speed lines (during transitions)
// ============================================================
const SpeedLines: React.FC = () => (
  <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden">
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        className="absolute h-[1px] bg-white/20 rounded-full"
        style={{
          top: `${20 + i * 8}%`,
          left: '-20%',
          width: `${30 + Math.random() * 40}%`,
          animation: `roadDash ${0.3 + Math.random() * 0.3}s linear infinite`,
          animationDelay: `${i * 0.05}s`,
        }}
      />
    ))}
  </div>
);

// ============================================================
// Scene elements for each station
// ============================================================

const KoreaElements: React.FC = () => (
  <g>
    {/* Distant mountains */}
    <polygon points="0,180 50,90 100,180" fill="#e8b4b8" opacity="0.5" />
    <polygon points="70,180 140,55 210,180" fill="#d4a0a6" opacity="0.4" />
    <polygon points="180,180 260,70 340,180" fill="#e8b4b8" opacity="0.35" />
    <polygon points="300,180 370,95 440,180" fill="#d4a0a6" opacity="0.3" />
    {/* Pagoda */}
    <rect x="320" y="105" width="45" height="75" fill="#8d6e63" rx="2" />
    <polygon points="305,110 342,72 380,110" fill="#5d4037" />
    <polygon points="310,90 342,60 374,90" fill="#6d4c41" />
    <polygon points="316,72 342,48 368,72" fill="#795548" />
    <rect x="334" y="145" width="18" height="35" fill="#4e342e" rx="2" />
    {/* Windows on pagoda */}
    <rect x="328" y="116" width="8" height="10" fill="#fff9c4" opacity="0.3" rx="1" />
    <rect x="342" y="116" width="8" height="10" fill="#fff9c4" opacity="0.3" rx="1" />
    {/* Sakura tree 1 */}
    <rect x="55" y="125" width="7" height="55" fill="#5d4037" rx="2" />
    <path d="M58,125 Q40,115 35,125" stroke="#5d4037" strokeWidth="3" fill="none" />
    <circle cx="42" cy="110" r="18" fill="#f48fb1" opacity="0.8" />
    <circle cx="58" cy="104" r="22" fill="#f8bbd0" opacity="0.7" />
    <circle cx="72" cy="112" r="15" fill="#f48fb1" opacity="0.75" />
    <circle cx="50" cy="98" r="12" fill="#fce4ec" opacity="0.6" />
    {/* Sakura tree 2 */}
    <rect x="430" y="120" width="6" height="60" fill="#5d4037" rx="2" />
    <circle cx="422" cy="105" r="16" fill="#f48fb1" opacity="0.7" />
    <circle cx="435" cy="100" r="19" fill="#f8bbd0" opacity="0.65" />
    <circle cx="446" cy="108" r="13" fill="#f48fb1" opacity="0.8" />
    {/* Floating petals */}
    {[{ x: 140, d: 4 }, { x: 260, d: 5.5 }, { x: 190, d: 6.5 }, { x: 380, d: 4.5 }, { x: 100, d: 7 }].map((p, i) => (
      <circle key={i} cx={p.x} cy={30 + i * 10} r={2 + i * 0.3} fill={i % 2 ? '#f8bbd0' : '#f48fb1'} opacity="0.7">
        <animateTransform attributeName="transform" type="translate" values={`0,0; ${15 - i * 5},${30 + i * 8}; ${30 - i * 10},${70 + i * 12}`} dur={`${p.d}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.4;0" dur={`${p.d}s`} repeatCount="indefinite" />
      </circle>
    ))}
  </g>
);

const TurkeyElements: React.FC = () => (
  <g>
    {/* Sun with rays */}
    <circle cx="410" cy="55" r="38" fill="#ffeb3b" opacity="0.8">
      <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="410" cy="55" r="55" fill="#ffeb3b" opacity="0.1">
      <animate attributeName="r" values="55;65;55" dur="4s" repeatCount="indefinite" />
    </circle>
    {/* Sun rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 410 + Math.cos(rad) * 45;
      const y1 = 55 + Math.sin(rad) * 45;
      const x2 = 410 + Math.cos(rad) * 65;
      const y2 = 55 + Math.sin(rad) * 65;
      return (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffeb3b" strokeWidth="1" opacity="0.15">
          <animate attributeName="opacity" values="0.15;0.05;0.15" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" />
        </line>
      );
    })}
    {/* Sea */}
    <rect x="0" y="160" width="500" height="25" fill="#4fc3f7" opacity="0.3" />
    <path d="M0,168 Q50,158 100,168 Q150,178 200,168 Q250,158 300,168 Q350,178 400,168 Q450,158 500,168 L500,185 L0,185 Z" fill="#29b6f6" opacity="0.2">
      <animateTransform attributeName="transform" type="translate" values="0,0; -30,0; 0,0" dur="4s" repeatCount="indefinite" />
    </path>
    {/* Palm trees */}
    <path d="M80,180 Q84,130 88,95" stroke="#5d4037" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M88,95 Q55,78 25,90" stroke="#2e7d32" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M88,95 Q112,72 145,80" stroke="#2e7d32" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M88,95 Q70,65 48,62" stroke="#388e3c" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M88,95 Q108,60 135,55" stroke="#388e3c" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Right palm */}
    <path d="M390,180 Q394,140 396,110" stroke="#5d4037" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M396,110 Q370,95 348,105" stroke="#2e7d32" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M396,110 Q418,90 440,98" stroke="#2e7d32" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    {/* Birds */}
    {[{ x: 180, y: 48 }, { x: 220, y: 38 }, { x: 260, y: 52 }, { x: 300, y: 42 }].map((b, i) => (
      <path key={i} d={`M${b.x},${b.y} Q${b.x + 5},${b.y - 6} ${b.x + 10},${b.y}`} stroke="#5d4037" strokeWidth="1.5" fill="none" />
    ))}
    {/* Sailboat */}
    <g>
      <polygon points="450,135 462,100 474,135" fill="white" opacity="0.9" />
      <line x1="462" y1="100" x2="462" y2="146" stroke="#8d6e63" strokeWidth="1.5" />
      <path d="M445,146 Q462,154 479,146" fill="#8d6e63" />
      <animateTransform attributeName="transform" type="translate" values="0,0; -5,2; 0,0" dur="3s" repeatCount="indefinite" />
    </g>
  </g>
);

const MaldivesElements: React.FC = () => (
  <g>
    {/* Clouds */}
    <g opacity="0.8">
      <ellipse cx="80" cy="38" rx="44" ry="15" fill="white" opacity="0.7" />
      <ellipse cx="110" cy="33" rx="30" ry="12" fill="white" opacity="0.8" />
      <animateTransform attributeName="transform" type="translate" values="0,0; 15,0; 0,0" dur="12s" repeatCount="indefinite" />
    </g>
    <g opacity="0.6">
      <ellipse cx="360" cy="50" rx="38" ry="13" fill="white" opacity="0.7" />
      <ellipse cx="388" cy="46" rx="25" ry="10" fill="white" opacity="0.8" />
      <animateTransform attributeName="transform" type="translate" values="0,0; -10,0; 0,0" dur="15s" repeatCount="indefinite" />
    </g>
    {/* Crystal ocean */}
    <rect x="0" y="152" width="500" height="33" fill="#00bcd4" opacity="0.2" />
    {/* Shimmer lines */}
    {[60, 160, 280, 390].map((x, i) => (
      <line key={i} x1={x} y1={163 + i * 3} x2={x + 30} y2={163 + i * 3} stroke="white" strokeWidth="1" opacity="0.35">
        <animate attributeName="opacity" values="0.35;0.05;0.35" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
      </line>
    ))}
    {/* Overwater bungalow — detailed */}
    {/* Stilts */}
    {[220, 240, 260, 280, 300].map((x, i) => (
      <line key={i} x1={x} y1="140" x2={x} y2="168" stroke="#8d6e63" strokeWidth="2" />
    ))}
    {/* Walkway */}
    <rect x="210" y="138" width="100" height="5" fill="#a1887f" rx="1.5" />
    {/* Main bungalow */}
    <rect x="218" y="108" width="44" height="32" fill="#bcaaa4" rx="3" />
    <polygon points="212,112 240,82 268,112" fill="#795548" />
    <rect x="232" y="122" width="12" height="18" fill="#5d4037" rx="2" />
    {/* Second bungalow */}
    <rect x="272" y="114" width="32" height="26" fill="#a1887f" rx="3" />
    <polygon points="267,117 288,94 309,117" fill="#6d4c41" />
    {/* Small island */}
    <ellipse cx="430" cy="148" rx="34" ry="8" fill="#a5d6a7" />
    <rect x="426" y="112" width="5" height="36" fill="#5d4037" rx="1.5" />
    <circle cx="428" cy="106" r="14" fill="#66bb6a" />
    <circle cx="420" cy="112" r="9" fill="#81c784" />
    <circle cx="436" cy="110" r="7" fill="#4caf50" opacity="0.8" />
  </g>
);

const ParisElements: React.FC = () => (
  <g>
    {/* Night sky stars */}
    {[
      { cx: 50, cy: 25, r: 1.8 }, { cx: 120, cy: 45, r: 1.3 }, { cx: 200, cy: 15, r: 2 },
      { cx: 280, cy: 38, r: 1.5 }, { cx: 360, cy: 20, r: 1.8 }, { cx: 30, cy: 60, r: 1.2 },
      { cx: 420, cy: 50, r: 2 }, { cx: 170, cy: 55, r: 1 }, { cx: 310, cy: 65, r: 1.5 },
      { cx: 440, cy: 25, r: 1.3 }, { cx: 80, cy: 70, r: 1 }, { cx: 390, cy: 68, r: 1.2 },
    ].map((s, i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.15;0.7" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
      </circle>
    ))}
    {/* Moon */}
    <circle cx="400" cy="40" r="20" fill="#fff9c4" opacity="0.9" />
    <circle cx="393" cy="35" r="18" fill="#1a1a2e" />
    <circle cx="400" cy="40" r="30" fill="#fff9c4" opacity="0.06" />
    {/* Eiffel Tower — detailed */}
    <polygon points="240,42 212,180 218,180 240,75 262,180 268,180" fill="#546e7a" />
    {/* Cross beams */}
    <rect x="220" y="115" width="40" height="4" fill="#607d8b" rx="1" />
    <rect x="223" y="150" width="34" height="3.5" fill="#607d8b" rx="1" />
    {/* Tower top */}
    <rect x="237" y="30" width="6" height="16" fill="#607d8b" rx="1" />
    {/* Tower light */}
    <circle cx="240" cy="28" r="3.5" fill="#ffeb3b" opacity="0.95">
      <animate attributeName="opacity" values="0.95;0.4;0.95" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="240" cy="28" r="10" fill="#ffeb3b" opacity="0.1">
      <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
    </circle>
    {/* Tower feet */}
    <polygon points="218,180 205,185 223,185" fill="#455a64" />
    <polygon points="262,180 257,185 275,185" fill="#455a64" />
    {/* City buildings */}
    {[
      { x: 15, h: 42, w: 38 }, { x: 58, h: 32, w: 30 }, { x: 95, h: 48, w: 35 },
      { x: 340, h: 38, w: 32 }, { x: 378, h: 52, w: 40 }, { x: 425, h: 34, w: 32 },
    ].map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={180 - b.h} width={b.w} height={b.h} fill="#263238" rx="2" />
        {/* Random windows */}
        {Array.from({ length: 3 }, (_, j) => (
          <rect
            key={j}
            x={b.x + 5 + j * 10}
            y={180 - b.h + 6 + (j % 2) * 12}
            width="4"
            height="5"
            fill="#fff9c4"
            opacity={0.2 + Math.random() * 0.5}
            rx="0.5"
          >
            <animate attributeName="opacity" values={`${0.2 + j * 0.15};${0.05 + j * 0.1};${0.2 + j * 0.15}`} dur={`${3 + j}s`} repeatCount="indefinite" />
          </rect>
        ))}
      </g>
    ))}
    {/* Street lamp */}
    <rect x="170" y="166" width="2" height="19" fill="#78909c" />
    <circle cx="171" cy="163" r="5" fill="#ffeb3b" opacity="0.3">
      <animate attributeName="opacity" values="0.3;0.15;0.3" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="171" cy="163" r="2" fill="#fff9c4" opacity="0.7" />
  </g>
);

const HomeElements: React.FC = () => (
  <g>
    {/* Warm sun */}
    <circle cx="390" cy="48" r="32" fill="#fff176" opacity="0.7" />
    <circle cx="390" cy="48" r="45" fill="#fff176" opacity="0.1">
      <animate attributeName="r" values="45;52;45" dur="4s" repeatCount="indefinite" />
    </circle>
    {/* Clouds */}
    <g opacity="0.7">
      <ellipse cx="110" cy="38" rx="36" ry="12" fill="white" />
      <ellipse cx="132" cy="34" rx="24" ry="10" fill="white" />
    </g>
    {/* House */}
    <rect x="185" y="98" width="130" height="82" fill="#ffccbc" rx="4" />
    {/* Roof */}
    <polygon points="175,103 250,38 325,103" fill="#e57373" />
    <polygon points="180,103 250,42 320,103" fill="#ef5350" opacity="0.3" />
    {/* Chimney with heart smoke */}
    <rect x="280" y="48" width="14" height="30" fill="#a1887f" rx="2" />
    <text x="287" y="42" fontSize="13" fill="#e57373" opacity="0.5" textAnchor="middle">
      <animateTransform attributeName="transform" type="translate" values="0,0; -3,-15; 0,-32" dur="3.5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0.25;0" dur="3.5s" repeatCount="indefinite" />
      &#10084;
    </text>
    {/* Door */}
    <rect x="232" y="138" width="32" height="42" fill="#6d4c41" rx="4" />
    <circle cx="256" cy="162" r="2.5" fill="#ffb74d" />
    {/* Windows */}
    <rect x="196" y="115" width="28" height="22" fill="#bbdefb" rx="3" stroke="#8d6e63" strokeWidth="1.5" />
    <rect x="274" y="115" width="28" height="22" fill="#bbdefb" rx="3" stroke="#8d6e63" strokeWidth="1.5" />
    <rect x="198" y="118" width="24" height="16" fill="#fff9c4" opacity="0.3" rx="1" />
    <rect x="276" y="118" width="24" height="16" fill="#fff9c4" opacity="0.3" rx="1" />
    {/* Window crosses */}
    <line x1="210" y1="115" x2="210" y2="137" stroke="#8d6e63" strokeWidth="1" />
    <line x1="196" y1="126" x2="224" y2="126" stroke="#8d6e63" strokeWidth="1" />
    <line x1="288" y1="115" x2="288" y2="137" stroke="#8d6e63" strokeWidth="1" />
    <line x1="274" y1="126" x2="302" y2="126" stroke="#8d6e63" strokeWidth="1" />
    {/* Trees */}
    <rect x="68" y="125" width="7" height="55" fill="#5d4037" rx="2" />
    <circle cx="72" cy="112" r="22" fill="#4caf50" />
    <circle cx="60" cy="118" r="16" fill="#66bb6a" />
    <circle cx="86" cy="120" r="13" fill="#43a047" />
    <rect x="410" y="130" width="6" height="50" fill="#5d4037" rx="2" />
    <circle cx="413" cy="118" r="18" fill="#4caf50" />
    <circle cx="404" cy="124" r="12" fill="#66bb6a" />
    <circle cx="422" cy="122" r="10" fill="#43a047" />
    {/* Flowers */}
    {[130, 145, 160, 340, 355, 370].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={175} x2={x} y2={165 - (i % 3) * 2} stroke="#4caf50" strokeWidth="1.2" />
        <circle cx={x} cy={163 - (i % 3) * 2} r={3 + (i % 2)} fill={['#f48fb1', '#ce93d8', '#ff8a65', '#fff176', '#90caf9', '#a5d6a7'][i]} />
        <circle cx={x} cy={163 - (i % 3) * 2} r={1.5} fill="#fff176" />
      </g>
    ))}
    {/* Fence */}
    <line x1="145" y1="172" x2="180" y2="172" stroke="#bcaaa4" strokeWidth="1.5" />
    {[150, 160, 170].map((x, i) => (
      <line key={i} x1={x} y1="164" x2={x} y2="180" stroke="#bcaaa4" strokeWidth="1.5" />
    ))}
    <line x1="315" y1="172" x2="345" y2="172" stroke="#bcaaa4" strokeWidth="1.5" />
    {[320, 330, 340].map((x, i) => (
      <line key={i} x1={x} y1="164" x2={x} y2="180" stroke="#bcaaa4" strokeWidth="1.5" />
    ))}
  </g>
);

const ForeverElements: React.FC = () => (
  <g>
    {/* Sparkle stars */}
    {[
      { cx: 50, cy: 32, r: 2.5 }, { cx: 130, cy: 58, r: 2 }, { cx: 220, cy: 22, r: 3 },
      { cx: 300, cy: 48, r: 2 }, { cx: 380, cy: 28, r: 2.5 }, { cx: 90, cy: 78, r: 1.5 },
      { cx: 350, cy: 72, r: 2 }, { cx: 180, cy: 48, r: 1.8 }, { cx: 440, cy: 52, r: 2.2 },
      { cx: 60, cy: 50, r: 1.5 }, { cx: 420, cy: 35, r: 1.8 }, { cx: 160, cy: 28, r: 1.5 },
    ].map((s, i) => (
      <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#ffb74d" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.12;0.7" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
        <animate attributeName="r" values={`${s.r};${s.r * 1.7};${s.r}`} dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
      </circle>
    ))}
    {/* Big central heart */}
    <g transform="translate(240, 98)">
      <animateTransform attributeName="transform" type="translate" values="240,98; 240,92; 240,98" dur="2.5s" repeatCount="indefinite" />
      <path d="M0,-32 C-14,-54 -46,-50 -46,-22 C-46,6 -18,28 0,46 C18,28 46,6 46,-22 C46,-50 14,-54 0,-32 Z" fill="#ec407a" opacity="0.85" />
      {/* Heart glow */}
      <path d="M0,-32 C-14,-54 -46,-50 -46,-22 C-46,6 -18,28 0,46 C18,28 46,6 46,-22 C46,-50 14,-54 0,-32 Z" fill="none" stroke="#f48fb1" strokeWidth="2.5" opacity="0.2" transform="scale(1.25)">
        <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M0,-32 C-14,-54 -46,-50 -46,-22 C-46,6 -18,28 0,46 C18,28 46,6 46,-22 C46,-50 14,-54 0,-32 Z" fill="none" stroke="#f48fb1" strokeWidth="1.5" opacity="0.1" transform="scale(1.5)">
        <animate attributeName="opacity" values="0.1;0.02;0.1" dur="3s" repeatCount="indefinite" />
      </path>
      {/* Heart shine */}
      <ellipse cx="-14" cy="-18" rx="8" ry="6" fill="white" opacity="0.15" transform="rotate(-20)" />
    </g>
    {/* Infinity symbol */}
    <path d="M180,162 C180,140 202,135 222,152 C242,135 264,140 264,162 C264,184 242,189 222,172 C202,189 180,184 180,162 Z" fill="none" stroke="#f48fb1" strokeWidth="2.5" opacity="0.35" />
    {/* Floating hearts */}
    {[
      { x: 75, y: 128, s: 16, d: 5 },
      { x: 375, y: 118, s: 14, d: 6 },
      { x: 145, y: 168, s: 12, d: 5.5 },
      { x: 320, y: 145, s: 13, d: 7 },
    ].map((h, i) => (
      <text key={i} x={h.x} y={h.y} fontSize={h.s} opacity="0.35">
        <animateTransform attributeName="transform" type="translate" values={`0,0; ${i % 2 ? -5 : 4},${-18 - i * 4}; ${i % 2 ? -10 : 8},${-40 - i * 6}`} dur={`${h.d}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0.12;0" dur={`${h.d}s`} repeatCount="indefinite" />
        {i % 2 ? '\u{1F496}' : '\u{1F495}'}
      </text>
    ))}
    {/* Sparkle particles */}
    <text x="120" y="85" fontSize="14" opacity="0.3">
      <animateTransform attributeName="transform" type="translate" values="0,0; 3,-14; 8,-32" dur="5s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.3;0.1;0" dur="5s" repeatCount="indefinite" />
      &#x2728;
    </text>
    <text x="340" y="90" fontSize="12" opacity="0.25">
      <animateTransform attributeName="transform" type="translate" values="0,0; -4,-12; -10,-28" dur="6s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.25;0.08;0" dur="6s" repeatCount="indefinite" />
      &#x2728;
    </text>
  </g>
);

const SceneElements: React.FC<{ stationId: string }> = ({ stationId }) => {
  switch (stationId) {
    case 'korea': return <KoreaElements />;
    case 'turkey': return <TurkeyElements />;
    case 'maldives': return <MaldivesElements />;
    case 'paris': return <ParisElements />;
    case 'home': return <HomeElements />;
    case 'forever': return <ForeverElements />;
    default: return null;
  }
};

// ============================================================
// Premium Station sign
// ============================================================
const StationSign: React.FC<{
  station: typeof JOURNEY_STATIONS[0];
  index: number;
  total: number;
  visible: boolean;
}> = ({ station, index, total, visible }) => (
  <div
    className={`w-full overflow-hidden pointer-events-none flex flex-col items-center transition-all duration-500 ${
      visible ? 'max-h-64 opacity-100 translate-y-0 mb-2' : 'max-h-0 opacity-0 -translate-y-2 mb-0'
    }`}
  >
    <div
      className="rounded-2xl w-full px-5 py-3 shadow-love-lg text-center max-w-[96%] mx-auto transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(236,72,153,0.15)',
      }}
    >
      {/* Station number */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-love-300 text-[9px] font-medium uppercase tracking-widest">
          {index + 1} / {total} bekat
        </span>
      </div>
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <span className="text-lg">{station.emoji}</span>
        <span className="text-base md:text-lg font-serif font-semibold text-gradient-love">{station.title}</span>
      </div>
      {/* Description */}
      <p className="text-love-700 font-normal text-sm leading-relaxed break-words">
        {station.description}
      </p>
    </div>
  </div>
);

// ============================================================
// Main Journey Component
// ============================================================
const STATION_DURATION = 4500;
const TRANSITION_DURATION = 1200;
const SCENE_PREVIEW_DURATION = 1600;
const INFO_VISIBLE_DURATION = 2800;

const Journey: React.FC<JourneyProps> = ({ onComplete }) => {
  const [currentStation, setCurrentStation] = useState(0);
  const [phase, setPhase] = useState<'arriving' | 'showing' | 'departing'>('arriving');
  const [isComplete, setIsComplete] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const station = JOURNEY_STATIONS[currentStation];
  const isLast = currentStation === JOURNEY_STATIONS.length - 1;
  const isNight = station.id === 'paris' || station.id === 'forever';
  const isMoving = phase !== 'showing';

  const skyGradient = `linear-gradient(180deg, ${station.gradientFrom} 0%, ${station.gradientVia} 50%, ${station.gradientTo} 100%)`;

  // Auto-advance
  useEffect(() => {
    setPhase('arriving');
    setIsInfoVisible(false);

    timerRef.current = setTimeout(() => {
      setPhase('showing');
      try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch {}

      if (infoShowTimerRef.current) clearTimeout(infoShowTimerRef.current);
      if (infoHideTimerRef.current) clearTimeout(infoHideTimerRef.current);

      infoShowTimerRef.current = setTimeout(() => {
        setIsInfoVisible(true);
      }, SCENE_PREVIEW_DURATION);

      infoHideTimerRef.current = setTimeout(() => {
        setIsInfoVisible(false);
      }, SCENE_PREVIEW_DURATION + INFO_VISIBLE_DURATION);

      if (!isLast) {
        timerRef.current = setTimeout(() => {
          setIsInfoVisible(false);
          setPhase('departing');
          timerRef.current = setTimeout(() => {
            setCurrentStation(prev => prev + 1);
          }, TRANSITION_DURATION);
        }, STATION_DURATION);
      } else {
        timerRef.current = setTimeout(() => {
          setIsInfoVisible(false);
          setIsComplete(true);
          try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch {}
        }, STATION_DURATION);
      }
    }, TRANSITION_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (infoShowTimerRef.current) clearTimeout(infoShowTimerRef.current);
      if (infoHideTimerRef.current) clearTimeout(infoHideTimerRef.current);
      infoShowTimerRef.current = null;
      infoHideTimerRef.current = null;
      setIsInfoVisible(false);
    };
  }, [currentStation, isLast]);

  const sceneTransform =
    phase === 'arriving' ? 'translateX(100%) scale(0.95)' :
    phase === 'departing' ? 'translateX(-100%) scale(0.95)' :
    'translateX(0) scale(1)';

  const sceneOpacity =
    phase === 'arriving' ? 0.2 :
    phase === 'departing' ? 0.2 : 1;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Station info (outside scene card, top panel) */}
      <StationSign
        station={station}
        index={currentStation}
        total={JOURNEY_STATIONS.length}
        visible={phase === 'showing' && isInfoVisible}
      />

      {/* Scene card */}
      <div
        className="w-full aspect-[16/10] relative overflow-hidden rounded-2xl shadow-love-lg select-none"
        style={{ maxHeight: '230px' }}
      >
        {/* Sky */}
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
          style={{ background: skyGradient }}
        />

        {/* Speed lines during transitions */}
        {isMoving && <SpeedLines />}

        {/* Scene SVG */}
        <div
          className="absolute inset-0 bottom-10 z-[5] transition-all ease-in-out"
          style={{
            transform: sceneTransform,
            opacity: sceneOpacity,
            transitionDuration: `${TRANSITION_DURATION}ms`,
          }}
        >
          <svg viewBox="0 0 480 185" className="w-full h-full" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
            <SceneElements stationId={station.id} />
          </svg>
        </div>

        {/* Ground */}
        <div className="absolute bottom-10 left-0 right-0 h-3 z-[5]"
          style={{
            background: isNight
              ? 'linear-gradient(to bottom, rgba(46,125,50,0.3), rgba(27,94,32,0.4))'
              : 'linear-gradient(to bottom, rgba(129,199,132,0.5), rgba(76,175,80,0.6))',
          }}
        />

        {/* Road */}
        <div className="absolute bottom-0 left-0 right-0 h-10 z-10">
          <div className="absolute inset-0 rounded-t-sm" style={{ background: isNight ? '#1f2937' : '#374151' }} />
          <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: isNight ? '#4b5563' : '#6b7280' }} />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex gap-3 overflow-hidden">
            <div
              className="flex gap-3 shrink-0"
              style={{ animation: isMoving ? 'roadDash 0.5s linear infinite' : 'roadDash 2s linear infinite' }}
            >
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="w-6 h-[2px] bg-yellow-300 rounded-full shrink-0 opacity-75" />
              ))}
            </div>
          </div>
          {/* Road edge markings */}
          <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/10" />
        </div>

        {/* Car */}
        <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2 z-20 scale-[0.68]">
          <CarSVG moving={isMoving} nightMode={isNight} />
        </div>

      </div>

      {/* Progress — emoji dots */}
      <div className="flex items-center justify-center gap-1">
        {JOURNEY_STATIONS.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center justify-center rounded-full transition-all duration-500 ${
              i < currentStation
                ? 'w-6 h-6 bg-love-500/20'
                : i === currentStation
                ? 'w-7 h-7 bg-love-100 shadow-love'
                : 'w-6 h-6 bg-love-100/40'
            }`}
          >
            <span className={`transition-all duration-300 ${
              i === currentStation ? 'text-sm' : 'text-[10px] opacity-50'
            }`}>
              {i <= currentStation ? s.emoji : '•'}
            </span>
          </div>
        ))}
      </div>

      {/* "Davom etish" button */}
      {isComplete && (
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-8 py-3.5 btn-gradient-love text-white rounded-full shadow-love-lg hover:scale-105 active:scale-95 transition-all"
          style={{ animation: 'introButtonGlow 3s ease-in-out infinite, fadeInUp 0.5s ease-out' }}
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-light">Davom etish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Journey;
