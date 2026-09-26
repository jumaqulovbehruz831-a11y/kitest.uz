import React from 'react';

interface KitestEmblemProps {
  size?: 'sm' | 'md' | 'lg';
  showVerifiedSeal?: boolean;
}

export const KitestEmblem: React.FC<KitestEmblemProps> = ({
  size = 'md',
  showVerifiedSeal = true,
}) => {
  const dimensions =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';

  return (
    <div className="inline-flex items-center gap-2 select-none">
      {/* Custom Animated KITEST Crest SVG */}
      <div
        className={`relative ${dimensions} rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-600 p-[1.5px] shadow-lg shadow-emerald-500/20 group`}
      >
        <div className="w-full h-full rounded-[10px] bg-[#070d19] flex items-center justify-center relative overflow-hidden">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-3/4 h-3/4"
          >
            {/* Outer Hexagonal Shield */}
            <path
              d="M20 3L34 10.5V23.5C34 30.8 27.9 35.9 20 38C12.1 35.9 6 30.8 6 23.5V10.5L20 3Z"
              stroke="url(#kitest_grad)"
              strokeWidth="2.4"
              fill="rgba(16, 185, 129, 0.12)"
            />
            {/* Inner Lightning / K Star Symbol */}
            <path
              d="M15 13V27M15 20L24 13M18.5 17.5L25.5 27"
              stroke="#34d399"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Top Crown Spark */}
            <circle cx="20" cy="8.5" r="1.8" fill="#38bdf8" />
            <defs>
              <linearGradient
                id="kitest_grad"
                x1="6"
                y1="3"
                x2="34"
                y2="38"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#34d399" />
                <stop offset="0.5" stopColor="#38bdf8" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Wordmark + Special Official Seal */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-extrabold tracking-tight text-white ${
              size === 'lg'
                ? 'text-2xl'
                : size === 'sm'
                ? 'text-base'
                : 'text-lg'
            }`}
          >
            KITEST
          </span>

          {/* Special Official Crest Badge next to KITEST */}
          {showVerifiedSeal && (
            <span
              title="KITEST Rasmiy Tasdiqlangan Platforma Belgisi"
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-400 text-slate-950 shadow-sm shadow-emerald-500/30"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1.5l2.15 1.65 2.7-.25.95 2.55 2.45 1.15-.6 2.65 1.35 2.35-1.95 1.9.1 2.7-2.6.65-1.5 2.25-2.55-.9-2.55.9-1.5-2.25-2.6-.65.1-2.7-1.95-1.9 1.35-2.35-.6-2.65 2.45-1.15.95-2.55 2.7.25L10 1.5zm3.7 6.8a.75.75 0 00-1.1-1.02L9.25 10.9 7.4 9.15a.75.75 0 00-1.04 1.08l2.4 2.3a.75.75 0 001.08-.04l3.86-4.19z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          )}

          <span className="text-[11px] font-mono font-bold text-emerald-400">
            .UZ
          </span>
        </div>
        <span className="text-[10px] font-medium text-slate-400 tracking-wide">
          Dunyo yoshlar qo'lida
        </span>
      </div>
    </div>
  );
};

// Web Audio API Sound Synthesizer (100% browser-native, zero external files)
export function playKitestSound(
  type: 'click' | 'success' | 'warning' | 'finish',
  enabled: boolean = true
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
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
    } else if (type === 'finish') {
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
