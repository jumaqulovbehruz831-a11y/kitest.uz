import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { KitestGloriousKite } from './KitestKiteLogo';

interface KitestRotatingActionLoaderProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  variant?: 'google' | 'account' | 'test' | 'login' | 'ai' | 'general';
  onCancel?: () => void;
}

export const KitestRotatingActionLoader: React.FC<KitestRotatingActionLoaderProps> = ({
  isOpen,
  title = "Jarayon bajarilmoqda...",
  subtitle = "Iltimos, kuting — ma'lumotlar saqlanmoqda va tayyorlanmoqda",
  variant = 'general',
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantDetails = () => {
    switch (variant) {
      case 'google':
        return {
          badge: "Google Cloud & Firebase",
          glow: "from-blue-500 via-sky-400 to-emerald-400",
          iconColor: "text-sky-400",
          ringColor: "border-sky-500/60 border-t-blue-400 border-r-emerald-400",
        };
      case 'account':
        return {
          badge: "KITEST Shaxsiy Profil",
          glow: "from-indigo-500 via-purple-500 to-pink-500",
          iconColor: "text-purple-400",
          ringColor: "border-purple-500/60 border-t-pink-400 border-r-indigo-400",
        };
      case 'test':
        return {
          badge: "CHSB & Fan Testi",
          glow: "from-emerald-500 via-teal-400 to-sky-400",
          iconColor: "text-emerald-400",
          ringColor: "border-emerald-500/60 border-t-teal-400 border-r-sky-400",
        };
      case 'ai':
        return {
          badge: "Gemini AI Intellekt",
          glow: "from-amber-400 via-rose-500 to-indigo-500",
          iconColor: "text-amber-400",
          ringColor: "border-amber-500/60 border-t-rose-400 border-r-indigo-400",
        };
      default:
        return {
          badge: "KITEST Tizimi",
          glow: "from-sky-500 via-indigo-500 to-emerald-400",
          iconColor: "text-sky-400",
          ringColor: "border-sky-500/60 border-t-indigo-400 border-r-emerald-400",
        };
    }
  };

  const details = getVariantDetails();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="relative max-w-sm w-full p-8 rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl shadow-sky-500/10 text-center overflow-hidden flex flex-col items-center"
        >
          {/* Ambient Glowing Background Aura */}
          <div
            className={`absolute -top-24 -left-24 w-56 h-56 rounded-full bg-gradient-to-br ${details.glow} opacity-20 blur-3xl pointer-events-none animate-pulse`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-56 h-56 rounded-full bg-gradient-to-br ${details.glow} opacity-20 blur-3xl pointer-events-none animate-pulse`}
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
            <span>{details.badge}</span>
          </div>

          {/* ROTATING ANIMATION CORE */}
          <div className="relative w-32 h-32 flex items-center justify-center my-2">
            {/* Outer Rotating Ring 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'linear' }}
              className={`absolute inset-0 rounded-full border-2 border-dashed ${details.ringColor}`}
            />

            {/* Middle Rotating Ring 2 (Counter-Clockwise) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'linear' }}
              className="absolute inset-2 rounded-full border border-dotted border-white/30"
            />

            {/* Orbiting Satellite Kites & Sparkles */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              className="absolute inset-0 flex items-start justify-center"
            >
              <div className="w-5 h-5 -mt-2.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 shadow-lg shadow-sky-400/80 flex items-center justify-center text-[10px]">
                🪁
              </div>
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
              className="absolute inset-0 flex items-end justify-center"
            >
              <div className="w-4 h-4 -mb-2 rounded-full bg-amber-400 shadow-md shadow-amber-400/80 flex items-center justify-center text-[9px]">
                ✨
              </div>
            </motion.div>

            {/* Center Pulsing Kite Logo */}
            <motion.div
              animate={{ scale: [0.94, 1.06, 0.94] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="relative z-10 w-20 h-20 rounded-2xl bg-slate-950/90 border border-white/15 flex items-center justify-center shadow-inner overflow-hidden"
            >
              <KitestGloriousKite className="w-16 h-16 transform scale-90" />
            </motion.div>
          </div>

          {/* Action Texts */}
          <div className="mt-6 space-y-2">
            <h3 className="text-lg font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>{title}</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="text-sky-400 inline-block font-mono"
              >
                ...
              </motion.span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs px-2">
              {subtitle}
            </p>
          </div>

          {/* Subtitle Progress Dots */}
          <div className="mt-5 flex items-center gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <motion.div
                key={idx}
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: idx * 0.2,
                }}
                className="w-2 h-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50"
              />
            ))}
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-6 text-xs text-slate-400 hover:text-white underline cursor-pointer transition-colors"
            >
              Bekor qilish
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
