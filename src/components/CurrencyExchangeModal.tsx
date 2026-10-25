import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  X,
  Zap,
  Coins,
  Star,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface CurrencyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  soundEnabled?: boolean;
}

export type CurrencyType = 'points' | 'coins' | 'stars';

export const CurrencyExchangeModal: React.FC<CurrencyExchangeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onRequireLogin,
  soundEnabled = true,
}) => {
  const [fromCurrency, setFromCurrency] = useState<CurrencyType>('points');
  const [toCurrency, setToCurrency] = useState<CurrencyType>('coins');
  const [amount, setAmount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const userPoints = Math.max(0, currentUser?.totalScore || 0);
  const userCoins = Math.max(0, currentUser?.coins || 0);
  const userStars = Math.max(0, currentUser?.stars || 0);

  const calculateTargetAmount = (val: number, from: CurrencyType, to: CurrencyType): number => {
    if (from === to) return val;
    if (from === 'points' && to === 'coins') return val;
    if (from === 'coins' && to === 'points') return val;
    if (from === 'points' && to === 'stars') return Math.floor(val / 50);
    if (from === 'coins' && to === 'stars') return Math.floor(val / 50);
    if (from === 'stars' && to === 'points') return val * 40;
    if (from === 'stars' && to === 'coins') return val * 40;
    return val;
  };

  const targetGained = calculateTargetAmount(amount, fromCurrency, toCurrency);

  const handleSwapCurrencies = () => {
    playKitestSound('click', soundEnabled);
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleExecuteExchange = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    if (fromCurrency === toCurrency) {
      setErrorMsg("Bir xil valyutalar tanlandi. Boshqa valyutani tanlang!");
      return;
    }

    if (amount <= 0) {
      setErrorMsg("Almashinuv miqdorini 0 dan katta kiriting!");
      return;
    }

    // Balance check
    if (fromCurrency === 'points' && userPoints < amount) {
      setErrorMsg(`Ball yetarli emas! Sizda ${userPoints} ball bor.`);
      return;
    }
    if (fromCurrency === 'coins' && userCoins < amount) {
      setErrorMsg(`Coins yetarli emas! Sizda ${userCoins} coin bor.`);
      return;
    }
    if (fromCurrency === 'stars' && userStars < amount) {
      setErrorMsg(`Yulduz yetarli emas! Sizda ${userStars} yulduz bor.`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/wallet/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          fromCurrency,
          toCurrency,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Almashishda xatolik yuz berdi");
      }

      playKitestSound('fanfare', soundEnabled);
      try {
        confetti({ particleCount: 65, spread: 60, origin: { y: 0.6 } });
      } catch {}

      if (data.user) {
        onUpdateUser(data.user);
      }

      setSuccessMsg(data.message || "Valyuta muvaffaqiyatli ayirboshlandi!");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Xatolik yuz berdi");
      playKitestSound('warning', soundEnabled);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-white font-sans space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Real-Vaqt Valyuta Ayirboshlash
                </h2>
                <p className="text-xs text-slate-400">
                  Ball, Coins va Yulduzlarni bir zumda almashtiring
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Live User Balances */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-sky-400 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>Ball</span>
              </div>
              <div className="text-base font-black text-white mt-0.5">{userPoints}</div>
            </div>

            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>Coins</span>
              </div>
              <div className="text-base font-black text-amber-300 mt-0.5">{userCoins}</div>
            </div>

            <div className="text-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[11px] text-purple-400 font-bold">
                <Star className="w-3.5 h-3.5" />
                <span>Yulduz ⭐</span>
              </div>
              <div className="text-base font-black text-purple-300 mt-0.5">{userStars}★</div>
            </div>
          </div>

          {/* Exchange Controls: FROM -> TO */}
          <div className="space-y-4">
            {/* FROM */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Qaysi valyutadan ayirboshlaysiz?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['points', 'coins', 'stars'] as CurrencyType[]).map((c) => (
                  <button
                    key={`from_${c}`}
                    type="button"
                    onClick={() => setFromCurrency(c)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fromCurrency === c
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {c === 'points' && <Zap className="w-3.5 h-3.5 text-sky-400" />}
                    {c === 'coins' && <Coins className="w-3.5 h-3.5 text-amber-400" />}
                    {c === 'stars' && <Star className="w-3.5 h-3.5 text-purple-400" />}
                    <span className="capitalize">{c === 'points' ? 'Ball' : c === 'coins' ? 'Coins' : 'Yulduz'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center -my-1">
              <button
                type="button"
                onClick={handleSwapCurrencies}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 hover:text-white transition-all cursor-pointer shadow-md"
                title="Valyutalarni almashtirish"
              >
                <ArrowRightLeft className="w-4 h-4 rotate-90 sm:rotate-0" />
              </button>
            </div>

            {/* TO */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Qaysi valyutaga qabul qilasiz?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['points', 'coins', 'stars'] as CurrencyType[]).map((c) => (
                  <button
                    key={`to_${c}`}
                    type="button"
                    onClick={() => setToCurrency(c)}
                    className={`py-2 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      toCurrency === c
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {c === 'points' && <Zap className="w-3.5 h-3.5 text-sky-400" />}
                    {c === 'coins' && <Coins className="w-3.5 h-3.5 text-amber-400" />}
                    {c === 'stars' && <Star className="w-3.5 h-3.5 text-purple-400" />}
                    <span className="capitalize">{c === 'points' ? 'Ball' : c === 'coins' ? 'Coins' : 'Yulduz'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input & Quick Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Miqdor:</span>
                <span className="font-mono">
                  Maksimal: {fromCurrency === 'points' ? userPoints : fromCurrency === 'coins' ? userCoins : userStars}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-blue-500 text-sm font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +{preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const maxVal = fromCurrency === 'points' ? userPoints : fromCurrency === 'coins' ? userCoins : userStars;
                    setAmount(Math.max(1, maxVal));
                  }}
                  className="py-1 px-3 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[11px] font-bold ml-auto transition-colors cursor-pointer"
                >
                  Hammasi (Max)
                </button>
              </div>
            </div>

            {/* Exchange Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-emerald-950/40 border border-slate-700 text-xs flex items-center justify-between font-mono">
              <span className="text-slate-400">Qabul qilinadigan qiymat:</span>
              <span className="text-emerald-400 font-black text-sm">
                +{targetGained} {toCurrency === 'points' ? 'Ball ⚡' : toCurrency === 'coins' ? 'Coins 🪙' : 'Yulduz ⭐'}
              </span>
            </div>
          </div>

          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleExecuteExchange}
            disabled={isLoading || amount <= 0}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Almashtirilmoqda...' : 'Real-Vaqtda Almashtirish'}</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
