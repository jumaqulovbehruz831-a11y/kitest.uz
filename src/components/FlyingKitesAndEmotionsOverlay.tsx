import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Wind } from 'lucide-react';
import { playKitestSound } from './KitestEmblem';

export interface EmotionOption {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export const EXPANDED_EMOTIONS_CATALOG: EmotionOption[] = [
  { id: 'kite', emoji: '🪁', label: 'Varrak Parvozi', color: '#38bdf8' },
  { id: 'rocket', emoji: '🚀', label: 'Ilhom & Parvoz', color: '#f97316' },
  { id: 'fire', emoji: '🔥', label: 'Kuch & Olov', color: '#ef4444' },
  { id: 'brain', emoji: '🧠', label: 'AI & Intellekt', color: '#ec4899' },
  { id: 'zap', emoji: '⚡', label: 'Tezkor Fikr', color: '#eab308' },
  { id: 'diamond', emoji: '💎', label: 'Olmos Bilim', color: '#06b6d4' },
  { id: 'crown', emoji: '👑', label: 'CHSB Qiroli', color: '#f59e0b' },
  { id: 'star', emoji: '⭐', label: 'Yulduzli Natija', color: '#fbbf24' },
  { id: 'target', emoji: '🎯', label: '100% Aniq Nishon', color: '#10b981' },
  { id: 'trophy', emoji: '🏆', label: 'Olimpiada Chempioni', color: '#eab308' },
  { id: 'lightbulb', emoji: '💡', label: 'Kashfiyot', color: '#facc15' },
  { id: 'eagle', emoji: '🦅', label: 'Yuksak Parvoz', color: '#6366f1' },
  { id: 'hundred', emoji: '💯', label: 'Mukammal 100', color: '#f43f5e' },
  { id: 'sparkles', emoji: '✨', label: 'Sehrli Muvaffaqiyat', color: '#a855f7' },
  { id: 'heart', emoji: '❤️', label: 'Ilmga Muhabbat', color: '#ef4444' },
  { id: 'rainbow', emoji: '🌈', label: 'Porloq Kelajak', color: '#14b8a6' },
];

interface FlyingItem {
  id: string;
  type: 'kite' | 'emoji';
  content: string;
  startX: number;
  startY: number;
  swayAmount: number;
  duration: number;
  size: number;
  rotation: number;
}

interface FlyingKitesAndEmotionsOverlayProps {
  soundEnabled?: boolean;
  enableAmbientKites?: boolean;
}

export const FlyingKitesAndEmotionsOverlay: React.FC<FlyingKitesAndEmotionsOverlayProps> = ({
  soundEnabled = true,
  enableAmbientKites = false,
}) => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  // Spawn initial ambient flying kites that gently drift across the sky
  useEffect(() => {
    if (!enableAmbientKites) return;

    const interval = setInterval(() => {
      setFlyingItems((prev) => {
        if (prev.length >= 25) return prev;
        const isKite = Math.random() > 0.4;
        const randomEmotion =
          EXPANDED_EMOTIONS_CATALOG[
            Math.floor(Math.random() * EXPANDED_EMOTIONS_CATALOG.length)
          ];

        const newItem: FlyingItem = {
          id: `ambient_${Date.now()}_${Math.random()}`,
          type: isKite ? 'kite' : 'emoji',
          content: isKite ? '🪁' : randomEmotion.emoji,
          startX: Math.random() * 92 + 4,
          startY: 105,
          swayAmount: (Math.random() - 0.5) * 80,
          duration: 10 + Math.random() * 8,
          size: isKite ? 36 + Math.random() * 24 : 26 + Math.random() * 18,
          rotation: (Math.random() - 0.5) * 45,
        };

        return [...prev, newItem];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [enableAmbientKites]);

  // Clean up completed flying items
  const handleItemComplete = (id: string) => {
    setFlyingItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Launch a burst of flying kites and emotions
  const triggerBurst = (customEmoji?: string) => {
    playKitestSound('coin', soundEnabled);
    try {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    const newBurst: FlyingItem[] = [];
    const count = 12;

    for (let i = 0; i < count; i++) {
      const isKite = i % 2 === 0;
      const emojiChoice =
        customEmoji ||
        EXPANDED_EMOTIONS_CATALOG[
          Math.floor(Math.random() * EXPANDED_EMOTIONS_CATALOG.length)
        ].emoji;

      newBurst.push({
        id: `burst_${Date.now()}_${i}_${Math.random()}`,
        type: isKite ? 'kite' : 'emoji',
        content: isKite ? '🪁' : emojiChoice,
        startX: 15 + Math.random() * 70,
        startY: 95 + Math.random() * 10,
        swayAmount: (Math.random() - 0.5) * 140,
        duration: 4.5 + Math.random() * 3.5,
        size: isKite ? 42 + Math.random() * 24 : 32 + Math.random() * 20,
        rotation: (Math.random() - 0.5) * 50,
      });
    }

    setFlyingItems((prev) => [...prev, ...newBurst]);
  };

  return (
    <>
      {/* Floating Kites & Emotions in the Sky */}
      <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden">
        <AnimatePresence>
          {flyingItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                x: `${item.startX}vw`,
                y: '105vh',
                rotate: item.rotation,
                scale: 0.6,
              }}
              animate={{
                opacity: [0, 0.95, 0.9, 0],
                x: [
                  `${item.startX}vw`,
                  `${item.startX + item.swayAmount * 0.05}vw`,
                  `${item.startX - item.swayAmount * 0.03}vw`,
                  `${item.startX + item.swayAmount * 0.08}vw`,
                ],
                y: '-15vh',
                rotate: [
                  item.rotation,
                  item.rotation + 15,
                  item.rotation - 15,
                  item.rotation + 25,
                ],
                scale: [0.6, 1.15, 1, 0.9],
              }}
              transition={{
                duration: item.duration,
                ease: 'easeInOut',
              }}
              onAnimationComplete={() => handleItemComplete(item.id)}
              className="absolute select-none flex flex-col items-center drop-shadow-2xl"
              style={{
                fontSize: `${item.size}px`,
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.35))',
              }}
            >
              {item.type === 'kite' ? (
                <div className="relative group flex flex-col items-center">
                  <span className="animate-pulse">🪁</span>
                  {/* Fluttering Kite Tail Ribbon */}
                  <div className="w-1 h-8 -mt-1 bg-gradient-to-b from-sky-400 via-amber-300 to-transparent rounded-full opacity-70 animate-bounce" />
                </div>
              ) : (
                <span>{item.content}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

// Interactive Bar for multiple emotions with counts and flying kite triggers
interface InteractiveEmotionsStripProps {
  onEmotionClick?: (emoji: string) => void;
  soundEnabled?: boolean;
}

export const InteractiveEmotionsStrip: React.FC<InteractiveEmotionsStripProps> = ({
  onEmotionClick,
  soundEnabled = true,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    EXPANDED_EMOTIONS_CATALOG.forEach((e) => {
      initial[e.id] = 0;
    });
    return initial;
  });

  const [activeFlyingKites, setActiveFlyingKites] = useState<
    Array<{ id: string; x: number; y: number; emoji: string }>
  >([]);

  const handleTap = (emotion: EmotionOption, e: React.MouseEvent) => {
    playKitestSound('coin', soundEnabled);
    setCounts((prev) => ({
      ...prev,
      [emotion.id]: (prev[emotion.id] || 0) + 1,
    }));

    // Trigger parent callback
    if (onEmotionClick) {
      onEmotionClick(emotion.emoji);
    }

    // Launch local flying burst right from the tapped button
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const burstKites = [0, 1, 2].map((i) => ({
      id: `tap_${Date.now()}_${i}_${Math.random()}`,
      x: rect.left + rect.width / 2 + (i - 1) * 20,
      y: rect.top,
      emoji: i === 0 ? '🪁' : emotion.emoji,
    }));

    setActiveFlyingKites((prev) => [...prev, ...burstKites]);
  };

  return (
    <div className="w-full relative">
      {/* Floating bursts from this strip */}
      <AnimatePresence>
        {activeFlyingKites.map((k) => (
          <motion.div
            key={k.id}
            initial={{ opacity: 1, x: k.x, y: k.y, scale: 0.8 }}
            animate={{
              opacity: 0,
              y: k.y - 180,
              x: k.x + (Math.random() - 0.5) * 80,
              scale: 1.6,
            }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            onAnimationComplete={() =>
              setActiveFlyingKites((prev) => prev.filter((item) => item.id !== k.id))
            }
            className="fixed pointer-events-none z-[999] text-2xl select-none"
          >
            {k.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-bold font-mono">
          <Wind className="w-4 h-4 text-sky-400 animate-spin" />
          <span>UCHADIGAN VARRAK VA EMOTSIYALAR:</span>
        </div>

        {EXPANDED_EMOTIONS_CATALOG.map((emotion) => {
          const count = counts[emotion.id] || 0;
          return (
            <motion.button
              key={emotion.id}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => handleTap(emotion, e)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-sky-400/50 text-xs transition-all shadow-md group cursor-pointer"
              title={`${emotion.label} — bosib varrak uchiring!`}
            >
              <span className="text-base group-hover:scale-125 transition-transform">
                {emotion.emoji}
              </span>
              <span className="text-slate-300 font-medium hidden sm:inline text-[11px]">
                {emotion.label}
              </span>
              <span className="font-mono text-[10px] font-black text-amber-300 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 min-w-[20px] text-center">
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
