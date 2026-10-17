import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export type TextEffectMode =
  | 'rainbow'
  | 'neon'
  | 'aurora'
  | 'gold'
  | 'crystal'
  | 'plain';

export interface TextEffectPreset {
  id: TextEffectMode;
  name: string;
  badge: string;
  desc: string;
  previewClass: string;
}

export const TEXT_EFFECT_STORAGE_KEY = 'kitest_text_effect_mode_v1';
const TEXT_EFFECT_EVENT = 'kitest-text-effect-changed';

// High-definition SVG Data URL of the uploaded "KidTest — BILIM SINOVI" official profile image
const KIDTEST_RAW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="bgCosmos" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#102a5c"/>
      <stop offset="55%" stop-color="#071330"/>
      <stop offset="100%" stop-color="#030816"/>
    </radialGradient>
    <linearGradient id="ringCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <linearGradient id="ringGold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="50%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <linearGradient id="kidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="45%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="testGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <linearGradient id="goldLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="shieldBlue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="checkGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#86efac"/>
      <stop offset="50%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#15803d"/>
    </linearGradient>
    <linearGradient id="bannerBlue" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0c4a6e"/>
      <stop offset="50%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0c4a6e"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Dark Navy Badge Base -->
  <circle cx="200" cy="200" r="192" fill="url(#bgCosmos)"/>

  <!-- Glowing Outer Cyan & Gold Rings -->
  <circle cx="200" cy="200" r="186" fill="none" stroke="url(#ringCyan)" stroke-width="6" opacity="0.95"/>
  <circle cx="200" cy="200" r="174" fill="none" stroke="url(#ringGold)" stroke-width="3.5" opacity="0.9"/>
  <circle cx="200" cy="200" r="165" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.6"/>

  <!-- Starfield Sparkles -->
  <g fill="#ffffff" opacity="0.75">
    <circle cx="95" cy="90" r="1.8"/><circle cx="310" cy="85" r="2"/><circle cx="70" cy="145" r="1.5"/>
    <circle cx="330" cy="150" r="1.8"/><circle cx="80" cy="260" r="1.6"/><circle cx="320" cy="265" r="2"/>
    <circle cx="145" cy="65" r="1.4"/><circle cx="255" cy="65" r="1.4"/><circle cx="200" cy="135" r="1.5"/>
  </g>

  <!-- Outer Ring Stars (Left & Right) -->
  <g fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="0.8">
    <polygon points="34,170 37,177 45,178 39,183 41,190 34,186 27,190 29,183 23,178 31,177"/>
    <polygon points="28,200 31,207 39,208 33,213 35,220 28,216 21,220 23,213 17,208 25,207"/>
    <polygon points="36,230 39,237 47,238 41,243 43,250 36,246 29,250 31,243 25,238 33,237"/>
    <polygon points="366,170 369,177 377,178 371,183 373,190 366,186 359,190 361,183 355,178 363,177"/>
    <polygon points="372,200 375,207 383,208 377,213 379,220 372,216 365,220 367,213 361,208 369,207"/>
    <polygon points="364,230 367,237 375,238 369,243 371,250 364,246 357,250 359,243 353,238 361,237"/>
  </g>

  <!-- Golden Laurel Wreaths (Left & Right) -->
  <g fill="url(#goldLeaf)" opacity="0.95">
    <path d="M82,250 C52,205 55,135 95,92 C85,118 78,165 96,235 Z"/>
    <ellipse cx="68" cy="195" rx="14" ry="6" transform="rotate(-35 68 195)"/>
    <ellipse cx="64" cy="170" rx="14" ry="6" transform="rotate(-20 64 170)"/>
    <ellipse cx="68" cy="145" rx="14" ry="6" transform="rotate(-5 68 145)"/>
    <ellipse cx="78" cy="122" rx="14" ry="6" transform="rotate(15 78 122)"/>
    <ellipse cx="92" cy="102" rx="13" ry="5.5" transform="rotate(30 92 102)"/>

    <path d="M318,250 C348,205 345,135 305,92 C315,118 322,165 304,235 Z"/>
    <ellipse cx="332" cy="195" rx="14" ry="6" transform="rotate(35 332 195)"/>
    <ellipse cx="336" cy="170" rx="14" ry="6" transform="rotate(20 336 170)"/>
    <ellipse cx="332" cy="145" rx="14" ry="6" transform="rotate(5 332 145)"/>
    <ellipse cx="322" cy="122" rx="14" ry="6" transform="rotate(-15 322 122)"/>
    <ellipse cx="308" cy="102" rx="13" ry="5.5" transform="rotate(-30 308 102)"/>
  </g>

  <!-- Top 3 Golden Stars above Brain -->
  <g fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="1">
    <polygon points="200,38 205,49 217,50 208,58 210,70 200,64 190,70 192,58 183,50 195,49"/>
    <polygon points="162,48 166,57 175,58 168,64 170,73 162,68 154,73 156,64 149,58 158,57"/>
    <polygon points="238,48 242,57 251,58 244,64 246,73 238,68 230,73 232,64 225,58 234,57"/>
  </g>

  <!-- Glowing Golden Brain with Circuit Lines -->
  <g filter="url(#glow)">
    <path d="M197,78 C175,76 156,90 156,108 C146,112 144,126 154,134 C154,145 168,152 184,150 C192,150 197,145 197,138 Z" fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="2"/>
    <path d="M203,78 C225,76 244,90 244,108 C254,112 256,126 246,134 C246,145 232,152 216,150 C208,150 203,145 203,138 Z" fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="2"/>
    <!-- Brain Neural Circuit Details -->
    <path d="M168,98 H185 L190,106 M162,116 H180 L188,124 M170,134 H188" stroke="#040b1e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M232,98 H215 L210,106 M238,116 H220 L212,124 M230,134 H212" stroke="#040b1e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="168" cy="98" r="3" fill="#fef08a"/><circle cx="162" cy="116" r="3" fill="#fef08a"/>
    <circle cx="232" cy="98" r="3" fill="#fef08a"/><circle cx="238" cy="116" r="3" fill="#fef08a"/>
  </g>

  <!-- Center 3D Typography: KITEST -->
  <g font-family="Outfit, Plus Jakarta Sans, Arial Black, sans-serif" font-weight="900" font-size="68" text-anchor="middle">
    <!-- 3D Deep Shadow Extrusion -->
    <text x="200" y="216" fill="#020617" stroke="#020617" stroke-width="12" stroke-linejoin="round">KITEST</text>
    <text x="200" y="212" fill="#0f172a" stroke="#1e3a8a" stroke-width="8" stroke-linejoin="round">KITEST</text>
    <!-- Foreground Dual Gradient Text -->
    <text x="200" y="210">
      <tspan fill="url(#kidGrad)" stroke="#e0f2fe" stroke-width="1">KI</tspan><tspan fill="url(#testGrad)" stroke="#fef9c3" stroke-width="1">TEST</tspan>
    </text>
  </g>

  <!-- Lower Icons Trio: Trophy (Left), Shield Checkmark (Center), Target Bullseye (Right) -->
  <!-- 1. Left Golden Trophy -->
  <g transform="translate(105, 232)">
    <path d="M12,8 H36 V22 C36,33 24,38 24,38 C24,38 12,33 12,22 Z" fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="1.5"/>
    <path d="M12,12 H5 C5,22 12,24 12,24 M36,12 H43 C43,22 36,24 36,24" fill="none" stroke="url(#goldLeaf)" stroke-width="3" stroke-linecap="round"/>
    <rect x="20" y="37" width="8" height="10" fill="url(#goldLeaf)"/>
    <rect x="13" y="47" width="22" height="6" rx="2" fill="url(#goldLeaf)" stroke="#fef08a" stroke-width="1"/>
  </g>

  <!-- 2. Right Target Bullseye & Golden Arrow -->
  <g transform="translate(248, 232)">
    <circle cx="24" cy="28" r="21" fill="#ef4444" stroke="#fef08a" stroke-width="2"/>
    <circle cx="24" cy="28" r="15" fill="#ffffff"/>
    <circle cx="24" cy="28" r="9" fill="#ef4444"/>
    <circle cx="24" cy="28" r="4" fill="#fbbf24"/>
    <path d="M24,28 L46,6 M40,6 H46 V12" stroke="#fde047" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Glowing Cyan-Green Wave Swoosh -->
  <path d="M90,295 Q200,325 310,285 Q200,312 90,295 Z" fill="url(#checkGreen)" opacity="0.85"/>

  <!-- 3. Center Royal Shield with Glowing Green Checkmark -->
  <g transform="translate(164, 224)">
    <path d="M36,4 L68,16 V42 C68,64 52,78 36,86 C20,78 4,64 4,42 V16 Z" fill="url(#shieldBlue)" stroke="url(#goldLeaf)" stroke-width="4"/>
    <path d="M20,44 L32,56 L56,26" fill="none" stroke="url(#checkGreen)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  </g>

  <!-- Bottom Ribbon Banner: BILIM SINOVI -->
  <g transform="translate(0, 8)">
    <path d="M68,324 Q200,344 332,324 L318,360 Q200,378 82,360 Z" fill="url(#bannerBlue)" stroke="url(#goldLeaf)" stroke-width="3.5"/>
    <text x="200" y="353" font-family="Outfit, Plus Jakarta Sans, Arial, sans-serif" font-weight="900" font-size="23" fill="#ffffff" letter-spacing="2.5" text-anchor="middle">BILIM SINOVI</text>
  </g>
</svg>`;

export const KIDTEST_LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  KIDTEST_RAW_SVG
)}`;

export const KidTestLogo: React.FC<{
  className?: string;
  sizePx?: number;
}> = ({ className = 'w-10 h-10', sizePx }) => {
  return (
    <img
      src={KIDTEST_LOGO_DATA_URL}
      alt="KITEST — Bilim Sinovi"
      style={sizePx ? { width: sizePx, height: sizePx } : undefined}
      className={`rounded-full object-cover select-none shrink-0 shadow-lg shadow-sky-500/20 ${className}`}
    />
  );
};

export const TEXT_EFFECT_PRESETS: TextEffectPreset[] = [
  {
    id: 'rainbow',
    name: 'Gologramma Spektr',
    badge: 'HOLOGRAM',
    desc: 'Asosiy urg‘uli so‘zlarda yuqori texnologiyali safir-ultrabinarsha gologramma nuri',
    previewClass: 'kitest-text-rainbow',
  },
  {
    id: 'neon',
    name: 'Kiber Lazer Nur',
    badge: 'CYBER NEON',
    desc: 'Asosiy sarlavhalarda optik moviy-indigo lazer yog‘dusi',
    previewClass: 'kitest-text-neon',
  },
  {
    id: 'aurora',
    name: 'Zumrad-Safir Yog‘du',
    badge: 'AURORA',
    desc: 'Asosiy kalit so‘zlarda zumrad va moviy osmon oqimi',
    previewClass: 'kitest-text-aurora',
  },
  {
    id: 'gold',
    name: 'Platina va Oltin',
    badge: 'IMPERIAL GOLD',
    desc: 'Olimpiada chempionlariga xos platina va oltin jilvasi',
    previewClass: 'kitest-text-gold',
  },
  {
    id: 'crystal',
    name: 'Suyuq Titan Xrom',
    badge: 'TITANIUM',
    desc: 'Metallik kumush, billur va titan nurli oqim effekti',
    previewClass: 'kitest-text-crystal',
  },
  {
    id: 'plain',
    name: 'Sof Minimalist',
    badge: 'MINIMAL',
    desc: 'Barcha yozuvlar sof zamonaviy oq-platina optik animatsiyada',
    previewClass: 'text-white',
  },
];

export function getSavedTextEffect(): TextEffectMode {
  if (typeof window === 'undefined') return 'rainbow';
  try {
    const saved = localStorage.getItem(TEXT_EFFECT_STORAGE_KEY) as TextEffectMode | null;
    if (
      saved &&
      ['rainbow', 'neon', 'aurora', 'gold', 'crystal', 'plain'].includes(saved)
    ) {
      return saved;
    }
  } catch {}
  return 'rainbow';
}

export function setGlobalTextEffect(mode: TextEffectMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEXT_EFFECT_STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(TEXT_EFFECT_EVENT, { detail: mode }));
  } catch {}
}

export function useTextEffectMode(): [TextEffectMode, (m: TextEffectMode) => void] {
  const [mode, setMode] = useState<TextEffectMode>(() => getSavedTextEffect());

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<TextEffectMode>;
      if (custom.detail) {
        setMode(custom.detail);
      } else {
        setMode(getSavedTextEffect());
      }
    };
    window.addEventListener(TEXT_EFFECT_EVENT, handler);
    return () => window.removeEventListener(TEXT_EFFECT_EVENT, handler);
  }, []);

  const updateMode = (next: TextEffectMode) => {
    setMode(next);
    setGlobalTextEffect(next);
  };

  return [mode, updateMode];
}

function getExecutiveEffectClass(mode: TextEffectMode, idx: number): string {
  if (mode === 'plain') return 'text-sky-400';
  if (mode === 'rainbow') {
    return idx % 2 === 0 ? 'kitest-word-p0' : 'kitest-word-p1';
  }
  if (mode === 'neon') {
    return 'kitest-text-neon';
  }
  if (mode === 'aurora') {
    return 'kitest-text-aurora';
  }
  if (mode === 'gold') {
    return 'kitest-text-gold';
  }
  if (mode === 'crystal') {
    return 'kitest-text-crystal';
  }
  return 'kitest-text-rainbow';
}

const KEY_ACCENT_TERMS = [
  'kitest',
  'kidtest',
  'chsb,',
  'chsb',
  "sun'iy",
  'intellekt',
  'olimpiada',
  '100%',
  'sertifikat',
  'sertifikatlar',
  'reyting',
  'reytingi',
  'ai',
  'quiz',
  'baraban',
];

function isKeyAccentWord(word: string): boolean {
  const clean = word
    .toLowerCase()
    .replace(/[.,!?:;—\-()«»"']/g, '')
    .trim();
  return KEY_ACCENT_TERMS.includes(clean);
}

interface KitestEmblemProps {
  size?: 'sm' | 'md' | 'lg';
  showVerifiedSeal?: boolean;
}

export const KitestEmblem: React.FC<KitestEmblemProps> = ({
  size = 'md',
  showVerifiedSeal = true,
}) => {
  const [effectMode] = useTextEffectMode();
  const dimensions =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';

  const brandEffectClass =
    effectMode === 'plain'
      ? 'text-white'
      : effectMode === 'gold'
      ? 'kitest-text-gold'
      : effectMode === 'aurora'
      ? 'kitest-text-aurora'
      : effectMode === 'neon'
      ? 'kitest-text-neon'
      : 'kitest-text-crystal';

  return (
    <div className="inline-flex items-center gap-2.5 select-none group">
      {/* Official KITEST — BILIM SINOVI Emblem */}
      <motion.div
        whileHover={{ scale: 1.07, rotate: 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative ${dimensions} rounded-full p-[1.5px] bg-gradient-to-tr from-sky-400 via-amber-400 to-sky-500 shadow-lg shadow-sky-500/25 shrink-0`}
      >
        <img
          src={KIDTEST_LOGO_DATA_URL}
          alt="KITEST Bilim Sinovi"
          className="w-full h-full rounded-full object-cover"
        />
      </motion.div>

      {/* Razor-Sharp Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <motion.span
            initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`font-black tracking-[-0.03em] inline-flex items-center ${brandEffectClass} ${
              size === 'lg'
                ? 'text-2xl'
                : size === 'sm'
                ? 'text-base'
                : 'text-lg'
            }`}
          >
            KITEST
          </motion.span>

          {showVerifiedSeal && (
            <span
              title="KITEST Rasmiy Tasdiqlangan Platforma Belgisi"
              className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-400"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-2.5 h-2.5"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}

          <span className="text-[10px] font-mono font-bold tracking-wider text-amber-400">
            .UZ
          </span>
        </div>
        <span className="text-[10px] font-semibold text-sky-300/90 tracking-wider uppercase">
          Bilim Sinovi · Dunyo yoshlar qo'lida
        </span>
      </div>
    </div>
  );
};

interface AnimatedWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  continuousWave?: boolean;
  stagger?: number;
  variant?: 'modern' | 'accent' | 'colorful';
  effectOverride?: TextEffectMode;
}

export const AnimatedWords: React.FC<AnimatedWordsProps> = ({
  text,
  className = '',
  wordClassName = '',
  stagger = 0.045,
  variant = 'modern',
  effectOverride,
}) => {
  const [globalEffect] = useTextEffectMode();
  const activeEffect = effectOverride || globalEffect;
  const words = text.split(' ').filter(Boolean);

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-[0.28em] ${className}`}>
      {words.map((word, idx) => {
        const shouldAccentWord =
          variant === 'colorful' ||
          (variant === 'accent' && isKeyAccentWord(word));

        const colorEffectClass = shouldAccentWord
          ? getExecutiveEffectClass(activeEffect, idx)
          : 'kitest-modern-word';

        return (
          <motion.span
            key={`${word}-${idx}`}
            initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 24,
              delay: idx * stagger,
            }}
            whileHover={{
              y: -2,
              scale: 1.02,
              transition: { duration: 0.18 },
            }}
            className={`inline-block cursor-default transition-all ${colorEffectClass} ${wordClassName}`}
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
};

interface AnimatedLettersProps {
  text: string;
  className?: string;
  continuousWave?: boolean;
  colorful?: boolean;
  effectOverride?: TextEffectMode;
}

export const AnimatedLetters: React.FC<AnimatedLettersProps> = ({
  text,
  className = '',
  colorful = true,
  effectOverride,
}) => {
  const [globalEffect] = useTextEffectMode();
  const activeEffect = effectOverride || globalEffect;
  const chars = Array.from(text);

  const shaderClass = colorful
    ? activeEffect === 'plain'
      ? 'text-sky-400'
      : activeEffect === 'gold'
      ? 'kitest-text-gold'
      : activeEffect === 'aurora'
      ? 'kitest-text-aurora'
      : activeEffect === 'neon'
      ? 'kitest-text-neon'
      : activeEffect === 'crystal'
      ? 'kitest-text-crystal'
      : 'kitest-text-rainbow'
    : '';

  return (
    <span className={`inline-block tracking-[0.08em] ${shaderClass} ${className}`}>
      {chars.map((char, idx) => {
        if (char === ' ') {
          return (
            <span key={idx} className="inline-block w-[0.3em]">
              &nbsp;
            </span>
          );
        }
        return (
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.35,
              delay: idx * 0.02,
              ease: 'easeOut',
            }}
            className="inline-block"
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
};

interface RotatingPlainTextProps {
  phrases: string[];
  intervalMs?: number;
  className?: string;
}

export const RotatingPlainText: React.FC<RotatingPlainTextProps> = ({
  phrases,
  intervalMs = 3200,
  className = '',
}) => {
  const [index, setIndex] = useState(0);
  const [effectMode] = useTextEffectMode();

  useEffect(() => {
    if (phrases.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [phrases, intervalMs]);

  const effectClass =
    effectMode === 'plain'
      ? 'text-sky-400'
      : effectMode === 'neon'
      ? 'kitest-text-neon'
      : effectMode === 'aurora'
      ? 'kitest-text-aurora'
      : effectMode === 'gold'
      ? 'kitest-text-gold'
      : effectMode === 'crystal'
      ? 'kitest-text-crystal'
      : 'kitest-text-rainbow';

  return (
    <span className={`inline-flex relative overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={`rot_phrase_${index}_${phrases[index] || ''}`}
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className={`inline-block font-bold tracking-tight ${effectClass}`}
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

// Web Audio API Sound Synthesizer
export function playKitestSound(
  type: 'click' | 'success' | 'warning' | 'finish' | 'victory' | 'tick' | 'fanfare' | 'coin',
  enabled: boolean = true
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'tick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.035);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === 'warning') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.12);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'fanfare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.12);
      osc.frequency.setValueAtTime(783.99, now + 0.24);
      osc.frequency.setValueAtTime(1046.5, now + 0.36);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.85);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {}
}
