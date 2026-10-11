import React from 'react';
import { motion } from 'motion/react';

/**
 * Official KITEST Kite Logo matching the design pictures:
 * - Geometric faceted kite with cyan/blue/indigo facets
 * - Cross struts and tail with ribbon bows
 */
export const KitestKiteLogo: React.FC<{
  className?: string;
  size?: number;
  showWordmark?: boolean;
  showSlogan?: boolean;
  variant?: 'flying' | 'faceted' | 'vortex';
}> = ({
  className = '',
  size = 40,
  showWordmark = false,
  showSlogan = false,
  variant = 'flying',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {variant === 'flying' && (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
        >
          <defs>
            <linearGradient id="kiteLeft" x1="20" y1="10" x2="50" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="kiteRight" x1="50" y1="10" x2="80" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="kiteBottom" x1="50" y1="40" x2="50" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="kiteRibbon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>

          {/* Kite Body Facets */}
          <path d="M50 8 L22 42 L50 72 Z" fill="url(#kiteLeft)" />
          <path d="M50 8 L78 42 L50 72 Z" fill="url(#kiteRight)" />
          <path d="M50 42 L22 42 L50 72 Z" fill="#0284c7" opacity="0.3" />
          <path d="M50 42 L78 42 L50 72 Z" fill="#1e40af" opacity="0.4" />

          {/* Kite Inner Cross Structure */}
          <line x1="50" y1="8" x2="50" y2="72" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
          <line x1="22" y1="42" x2="78" y2="42" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />

          {/* Tail String */}
          <path
            d="M50 72 Q42 82 46 90 T38 98"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Ribbon Bows on Tail */}
          <circle cx="44" cy="81" r="2.2" fill="#38bdf8" />
          <path d="M41 79 L47 83 M47 79 L41 83" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />

          <circle cx="42" cy="89" r="2.2" fill="#60a5fa" />
          <path d="M39 87 L45 91 M45 87 L39 91" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />

          <circle cx="38" cy="97" r="2.2" fill="#38bdf8" />
        </svg>
      )}

      {variant === 'vortex' && (
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]"
          >
            <defs>
              <linearGradient id="vortexG1" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="60%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            {/* Glowing Orbit Rings */}
            <circle cx="50" cy="50" r="42" stroke="rgba(56,189,248,0.3)" strokeWidth="1.5" strokeDasharray="6 3" />
            <ellipse cx="50" cy="50" rx="44" ry="24" stroke="rgba(147,197,253,0.4)" strokeWidth="2" transform="rotate(-25 50 50)" />

            {/* 3 Curved Kite Aerodynamic Blades */}
            <path
              d="M50 50 Q56 22 75 25 Q68 45 50 50 Z"
              fill="url(#vortexG1)"
              className="drop-shadow-sm"
            />
            <path
              d="M50 50 Q28 32 24 50 Q42 64 50 50 Z"
              fill="#0ea5e9"
            />
            <path
              d="M50 50 Q52 78 70 70 Q62 55 50 50 Z"
              fill="#2563eb"
            />
          </svg>
        </div>
      )}

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
              KITEST
            </span>
          </div>
          {showSlogan && (
            <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase leading-tight mt-0.5">
              BILIM • IMKON • KELAJAK
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Floating Sky Kites Background matching the uploaded images (k3BbK.jpg, 53B5s.jpg, LfU09.jpg)
 * Colorful kites (pink, yellow, green, purple) gracefully drifting among soft clouds.
 */
export const KitestSkyBackground: React.FC<{
  children?: React.ReactNode;
  showKites?: boolean;
  className?: string;
}> = ({ children, showKites = true, className = '' }) => {
  return (
    <div className={`relative min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#ffffff] text-slate-900 overflow-x-hidden ${className}`}>
      {/* Soft Sky Ambient Lights & Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Cloud silhouettes */}
        <div className="absolute -top-16 -left-20 w-96 h-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute top-40 right-[-10%] w-[38rem] h-[38rem] rounded-full bg-sky-100/60 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-[32rem] h-[32rem] rounded-full bg-blue-50/80 blur-3xl" />

        {/* Floating Decorative Kites */}
        {showKites && (
          <>
            {/* Top-left Pink Kite */}
            <motion.div
              animate={{
                y: [-8, 8, -8],
                x: [-4, 6, -4],
                rotate: [-4, 5, -4],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-12 left-[6%] sm:left-[10%] w-14 h-18 opacity-85 select-none"
            >
              <svg viewBox="0 0 60 80" className="w-full h-full drop-shadow-[0_8px_16px_rgba(244,114,182,0.3)]">
                <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#f472b6" />
                <path d="M30 32 L50 32 L30 56 Z" fill="#ec4899" opacity="0.4" />
                <line x1="30" y1="4" x2="30" y2="56" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <line x1="10" y1="32" x2="50" y2="32" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <path d="M30 56 Q24 64 27 72 T20 80" stroke="#f472b6" strokeWidth="1.2" fill="none" />
                <circle cx="25" cy="65" r="1.8" fill="#fb7185" />
                <circle cx="23" cy="73" r="1.8" fill="#fda4af" />
              </svg>
            </motion.div>

            {/* Bottom-left Purple Kite */}
            <motion.div
              animate={{
                y: [6, -10, 6],
                x: [5, -4, 5],
                rotate: [5, -5, 5],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute top-80 sm:top-96 left-[3%] sm:left-[5%] w-12 h-16 opacity-80 select-none"
            >
              <svg viewBox="0 0 60 80" className="w-full h-full drop-shadow-[0_8px_16px_rgba(168,85,247,0.3)]">
                <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#a855f7" />
                <path d="M30 32 L50 32 L30 56 Z" fill="#9333ea" opacity="0.4" />
                <line x1="30" y1="4" x2="30" y2="56" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <line x1="10" y1="32" x2="50" y2="32" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <path d="M30 56 Q36 65 32 73 T38 80" stroke="#a855f7" strokeWidth="1.2" fill="none" />
                <circle cx="34" cy="66" r="1.8" fill="#c084fc" />
              </svg>
            </motion.div>

            {/* Top-right Mint-Green Kite */}
            <motion.div
              animate={{
                y: [-10, 6, -10],
                x: [4, -5, 4],
                rotate: [-6, 4, -6],
              }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-16 right-[8%] sm:right-[12%] w-14 h-18 opacity-85 select-none"
            >
              <svg viewBox="0 0 60 80" className="w-full h-full drop-shadow-[0_8px_16px_rgba(52,211,153,0.3)]">
                <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#34d399" />
                <path d="M30 32 L50 32 L30 56 Z" fill="#059669" opacity="0.35" />
                <line x1="30" y1="4" x2="30" y2="56" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <line x1="10" y1="32" x2="50" y2="32" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <path d="M30 56 Q35 64 31 72 T37 80" stroke="#34d399" strokeWidth="1.2" fill="none" />
                <circle cx="33" cy="64" r="1.8" fill="#6ee7b7" />
              </svg>
            </motion.div>

            {/* Mid-right Golden-Yellow Kite */}
            <motion.div
              animate={{
                y: [8, -8, 8],
                x: [-3, 5, -3],
                rotate: [4, -4, 4],
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              className="absolute top-64 sm:top-80 right-[4%] sm:right-[7%] w-12 h-16 opacity-85 select-none"
            >
              <svg viewBox="0 0 60 80" className="w-full h-full drop-shadow-[0_8px_16px_rgba(251,191,36,0.35)]">
                <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#fbbf24" />
                <path d="M30 32 L50 32 L30 56 Z" fill="#d97706" opacity="0.35" />
                <line x1="30" y1="4" x2="30" y2="56" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <line x1="10" y1="32" x2="50" y2="32" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />
                <path d="M30 56 Q25 65 28 73 T22 80" stroke="#fbbf24" strokeWidth="1.2" fill="none" />
                <circle cx="26" cy="65" r="1.8" fill="#fde047" />
              </svg>
            </motion.div>
          </>
        )}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * KITEST Splash / Loading Screen matching k3BbK.jpg:
 * - 3D glowing blue curved kite pinwheel spinning smoothly inside orbit rings
 * - "Yuklanmoqda..."
 * - Percentage counter (e.g. 67% -> 100%)
 * - Sleek rounded progress bar
 * - Floating clouds and pastel kites in background
 */
export const KitestSplashScreen: React.FC<{
  progress?: number;
  onFinish?: () => void;
}> = ({ progress = 67, onFinish }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#dbeafe] via-[#eff6ff] to-[#ffffff] px-6 select-none">
      {/* Decorative Floating Kites */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Pink Kite Top-Left */}
        <motion.div
          animate={{ y: [-6, 6, -6], rotate: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 left-[12%] w-16 h-20 opacity-90"
        >
          <svg viewBox="0 0 60 80" className="w-full h-full">
            <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#f472b6" />
            <line x1="30" y1="4" x2="30" y2="56" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <line x1="10" y1="32" x2="50" y2="32" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <path d="M30 56 Q22 66 26 74 T18 80" stroke="#f472b6" strokeWidth="1.4" fill="none" />
          </svg>
        </motion.div>

        {/* Green Kite Top-Right */}
        <motion.div
          animate={{ y: [6, -6, 6], rotate: [4, -4, 4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-[14%] w-16 h-20 opacity-90"
        >
          <svg viewBox="0 0 60 80" className="w-full h-full">
            <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#34d399" />
            <line x1="30" y1="4" x2="30" y2="56" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <line x1="10" y1="32" x2="50" y2="32" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <path d="M30 56 Q36 66 32 74 T38 80" stroke="#34d399" strokeWidth="1.4" fill="none" />
          </svg>
        </motion.div>

        {/* Purple Kite Bottom-Left */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-28 left-[10%] w-14 h-18 opacity-85"
        >
          <svg viewBox="0 0 60 80" className="w-full h-full">
            <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#a855f7" />
            <line x1="30" y1="4" x2="30" y2="56" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <line x1="10" y1="32" x2="50" y2="32" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <path d="M30 56 Q24 66 27 74 T20 80" stroke="#a855f7" strokeWidth="1.4" fill="none" />
          </svg>
        </motion.div>

        {/* Yellow Kite Bottom-Right */}
        <motion.div
          animate={{ y: [8, -8, 8], rotate: [5, -5, 5] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-32 right-[12%] w-14 h-18 opacity-85"
        >
          <svg viewBox="0 0 60 80" className="w-full h-full">
            <path d="M30 4 L10 32 L30 56 L50 32 Z" fill="#fbbf24" />
            <line x1="30" y1="4" x2="30" y2="56" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <line x1="10" y1="32" x2="50" y2="32" stroke="#fff" strokeWidth="1.4" opacity="0.8" />
            <path d="M30 56 Q36 66 32 74 T38 80" stroke="#fbbf24" strokeWidth="1.4" fill="none" />
          </svg>
        </motion.div>
      </div>

      {/* Center Animated 3D Kite Vortex Emblem */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Soft Glowing Backlight Halo */}
        <div className="absolute w-64 h-64 rounded-full bg-sky-300/40 blur-3xl animate-pulse" />

        {/* Orbit Rings with Glass Sheen */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          className="absolute w-52 h-52 rounded-full border-2 border-dashed border-sky-300/50"
        />

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute w-44 h-28 rounded-full border border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.4)]"
          style={{ transform: 'rotate(-20deg)' }}
        />

        {/* 3D Cyan Curved Kite Vortex Blades */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="relative z-10 w-36 h-36 flex items-center justify-center drop-shadow-[0_12px_28px_rgba(37,99,235,0.4)]"
        >
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <linearGradient id="bladeGradTop" x1="60" y1="10" x2="95" y2="55" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="bladeGradLeft" x1="15" y1="60" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="bladeGradBottom" x1="60" y1="60" x2="85" y2="105" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
              <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Top Blade */}
            <path
              d="M60 60 Q68 20 95 30 Q85 55 60 60 Z"
              fill="url(#bladeGradTop)"
              filter="url(#whiteGlow)"
            />
            {/* Left Blade */}
            <path
              d="M60 60 Q26 35 20 60 Q45 78 60 60 Z"
              fill="url(#bladeGradLeft)"
              filter="url(#whiteGlow)"
            />
            {/* Bottom Blade */}
            <path
              d="M60 60 Q62 98 88 88 Q78 68 60 60 Z"
              fill="url(#bladeGradBottom)"
              filter="url(#whiteGlow)"
            />
            {/* Center Core */}
            <circle cx="60" cy="60" r="4" fill="#ffffff" />
          </svg>
        </motion.div>
      </div>

      {/* Loading Text & Percentage matching k3BbK.jpg */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1e3a8a] tracking-tight mb-2">
        Yuklanmoqda...
      </h2>

      <div className="text-lg sm:text-xl font-bold text-[#2563eb] mb-5 font-mono">
        {Math.round(progress)}%
      </div>

      {/* Rounded Glow Progress Bar */}
      <div className="w-64 sm:w-80 h-2.5 rounded-full bg-blue-100/80 p-0.5 border border-sky-200/60 shadow-inner overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

/**
 * Magnificent 3D Flying Kite Illustration matching image.png:
 * - Rich 3D shaded geometric kite facets
 * - High-tech specular light edges
 * - Gracefully flowing tail with cute ribbon bows
 */
export const Kitest3DKiteIllustration: React.FC<{
  className?: string;
  size?: number;
}> = ({ className = '', size = 110 }) => {
  return (
    <motion.div
      animate={{
        y: [-6, 6, -6],
        x: [-2, 3, -2],
        rotate: [-3, 3, -3],
      }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size * 1.25 }}
    >
      <svg
        viewBox="0 0 120 150"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(37,99,235,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="facetTopLeft" x1="20" y1="15" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="facetTopRight" x1="60" y1="15" x2="100" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="facetBottomLeft" x1="30" y1="65" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
          <linearGradient id="facetBottomRight" x1="90" y1="65" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* Shaded 3D Facets */}
        <path d="M60 12 L22 65 L60 106 Z" fill="url(#facetTopLeft)" />
        <path d="M60 12 L98 65 L60 106 Z" fill="url(#facetTopRight)" />
        <path d="M60 65 L22 65 L60 106 Z" fill="url(#facetBottomLeft)" opacity="0.6" />
        <path d="M60 65 L98 65 L60 106 Z" fill="url(#facetBottomRight)" opacity="0.7" />

        {/* Specular Edge Highlights */}
        <line x1="60" y1="12" x2="60" y2="106" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />
        <line x1="22" y1="65" x2="98" y2="65" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.95" />

        {/* Diagonal Tension Ribs */}
        <line x1="32" y1="36" x2="88" y2="92" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
        <line x1="88" y1="36" x2="32" y2="92" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />

        {/* Flowing Kite Tail */}
        <path
          d="M60 106 C50 118 45 125 54 135 C60 142 48 146 40 148"
          stroke="#2563eb"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Ribbon Bows on Tail */}
        <circle cx="50" cy="120" r="3" fill="#38bdf8" />
        <path d="M44 117 L56 123 M56 117 L44 123" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />

        <circle cx="51" cy="132" r="3" fill="#60a5fa" />
        <path d="M45 129 L57 135 M57 129 L45 135" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />

        <circle cx="43" cy="144" r="3" fill="#f472b6" />
        <path d="M37 141 L49 147 M49 141 L37 147" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
};

/**
 * Super Glorious Animated Kite with Glowing Aura, Specular Facets & Wind Trails:
 * 100% matches user request: "varak rasmii ajoyibroq qil"
 */
export const KitestGloriousKite: React.FC<{
  className?: string;
  size?: number;
  showRays?: boolean;
}> = ({ className = '', size = 160, showRays = true }) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Outer Glow Halo & Ambient Radial Light */}
      <div
        className="absolute rounded-full bg-gradient-to-tr from-sky-400/30 via-blue-500/20 to-indigo-500/30 blur-2xl pointer-events-none animate-pulse"
        style={{ width: size * 1.5, height: size * 1.5 }}
      />

      {/* Orbiting Sparkle Rings */}
      {showRays && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute rounded-full border border-sky-300/30 border-dashed pointer-events-none"
          style={{ width: size * 1.35, height: size * 1.35 }}
        />
      )}

      {/* Main Flying Kite Motion Frame */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          x: [-4, 5, -4],
          rotate: [-4, 4, -4],
        }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: size, height: size * 1.28 }}
        className="relative z-10 drop-shadow-[0_16px_32px_rgba(37,99,235,0.4)]"
      >
        <svg
          viewBox="0 0 160 200"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich multi-stop crystalline gradients */}
            <linearGradient id="gFacetTL" x1="20" y1="20" x2="80" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="gFacetTR" x1="80" y1="20" x2="140" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="gFacetBL" x1="30" y1="90" x2="80" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="gFacetBR" x1="130" y1="90" x2="80" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="gGoldenCore" x1="80" y1="20" x2="80" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
            <filter id="softKiteGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Wind Stream Particles */}
          <path d="M10 60 Q40 45 60 70" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <path d="M110 30 Q130 50 150 40" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

          {/* 3D Geometric Diamond Facets */}
          <path d="M80 15 L25 85 L80 145 Z" fill="url(#gFacetTL)" filter="url(#softKiteGlow)" />
          <path d="M80 15 L135 85 L80 145 Z" fill="url(#gFacetTR)" filter="url(#softKiteGlow)" />
          <path d="M80 85 L25 85 L80 145 Z" fill="url(#gFacetBL)" opacity="0.75" />
          <path d="M80 85 L135 85 L80 145 Z" fill="url(#gFacetBR)" opacity="0.85" />

          {/* Structural High-Strength Spine and Crossbars */}
          <line x1="80" y1="15" x2="80" y2="145" stroke="url(#gGoldenCore)" strokeWidth="3" strokeLinecap="round" />
          <line x1="25" y1="85" x2="135" y2="85" stroke="url(#gGoldenCore)" strokeWidth="3" strokeLinecap="round" />

          {/* Fine Crystalline Internal Facet Lines */}
          <line x1="38" y1="48" x2="122" y2="122" stroke="#ffffff" strokeWidth="1" opacity="0.45" />
          <line x1="122" y1="48" x2="38" y2="122" stroke="#ffffff" strokeWidth="1" opacity="0.45" />

          {/* Specular White Light Star at the Apex */}
          <circle cx="80" cy="15" r="3.5" fill="#ffffff" />
          <circle cx="80" cy="85" r="4.5" fill="#ffffff" />
          <circle cx="25" cy="85" r="3" fill="#ffffff" />
          <circle cx="135" cy="85" r="3" fill="#ffffff" />

          {/* Flowing Graceful Silk Tail */}
          <path
            d="M80 145 C65 160 60 172 74 182 C85 190 70 196 55 198"
            stroke="#2563eb"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tail Ribbon Bow 1 (Cyan) */}
          <circle cx="68" cy="162" r="3.5" fill="#38bdf8" />
          <path d="M60 158 L76 166 M76 158 L60 166" stroke="#0284c7" strokeWidth="2.4" strokeLinecap="round" />

          {/* Tail Ribbon Bow 2 (Royal Blue) */}
          <circle cx="70" cy="177" r="3.5" fill="#60a5fa" />
          <path d="M62 173 L78 181 M78 173 L62 181" stroke="#1d4ed8" strokeWidth="2.4" strokeLinecap="round" />

          {/* Tail Ribbon Bow 3 (Pink/Rose) */}
          <circle cx="62" cy="192" r="3.5" fill="#f472b6" />
          <path d="M54 188 L70 196 M70 188 L54 196" stroke="#ec4899" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  );
};

