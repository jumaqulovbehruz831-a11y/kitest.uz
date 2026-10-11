import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User, CELESTIAL_RANKS } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  Crown,
  Sparkles,
  CreditCard,
  Zap,
  CheckCircle2,
  Gift,
  Clock,
  RotateCw,
  FilePlus2,
  X,
  ShieldCheck,
  Coins,
  Send,
  AlertCircle,
  Flame,
  Award,
} from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  currentUser: User | null;
  soundEnabled?: boolean;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  onOpenLuckyWheel?: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  currentUser,
  soundEnabled = true,
  onClose,
  onUpdateUser,
  onRequireLogin,
  onOpenLuckyWheel,
}) => {
  const [payMethod, setPayMethod] = useState<'card' | 'qiwi' | 'points'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || '');
  const [qiwiPhone, setQiwiPhone] = useState('+998 ');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [dailyClaimLoading, setDailyClaimLoading] = useState(false);

  if (!isOpen) return null;

  const isUserPremium = Boolean(currentUser?.isPremium);
  const userScore = currentUser?.totalScore || 0;
  const targetEmail = 'jumaqulovbehr2831@gmail.com';

  const handleFormatCard = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  const handleFormatExpiry = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    if (payMethod === 'points') {
      if (userScore < 1000) {
        setErrorMsg(
          `Sizda 1000 ball yetarli emas! Hozirda sizda ${userScore} ball mavjud. Test yechib ball to'plang yoki bank karta orqali ulaning.`
        );
        return;
      }
    } else if (payMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length !== 16) {
        setErrorMsg('Iltimos, to‘liq 16 xonali karta raqamini kiriting (Uzcard, Humo, Visa).');
        return;
      }
      if (cardExpiry.length < 5) {
        setErrorMsg('Karta amal qilish muddatini kiriting (MM/YY).');
        return;
      }
    } else if (payMethod === 'qiwi') {
      if (qiwiPhone.trim().length < 9) {
        setErrorMsg('Qiwi hamyon raqamini to‘liq kiriting.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/premium/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          method: payMethod,
          cardData: {
            cardNumber,
            expiry: cardExpiry,
            cvv: cardCvv,
            holder: cardHolder,
            qiwiPhone,
            recipientEmail: targetEmail,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'To‘lovni amalga oshirishda xatolik yuz berdi');
      }

      playKitestSound('fanfare', soundEnabled);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      if (data.user) {
        onUpdateUser(data.user);
      }
      setSuccessMsg(
        `Tabriklaymiz! Siz VIP Premium a'zoligini muvaffaqiyatli qo‘lga kiritdingiz! To‘lov ${targetEmail} hisobiga qabul qilindi.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDaily = async () => {
    if (!currentUser) return;
    setDailyClaimLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/users/premium/claim-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kunlik bonusni olishda xatolik');
      }

      playKitestSound('victory', soundEnabled);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      if (data.user) onUpdateUser(data.user);
      setSuccessMsg("Kunlik Premium bonusi muvaffaqiyatli olindi: +50 Ball, +5 minut Kiteshot, +1 Baraban!");
    } catch (err: any) {
      setErrorMsg(err.message || 'Bonusni olib bo‘lmadi');
    } finally {
      setDailyClaimLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-amber-200 overflow-hidden my-auto"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-6 sm:p-7 text-white">
            <div className="absolute top-0 right-0 p-4">
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-amber-100 shadow-lg">
                <Crown className="w-9 h-9 fill-amber-200 text-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-amber-100 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>VIP Oltin A'zolik</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  KITEST Premium Klub
                </h2>
                <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5">
                  Har kuni 50 ball, 5 daqiqa Kiteshot 3D, baraban aylantirish va 2X rejim!
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* If user is already Premium */}
            {isUserPremium ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                      Siz faol Premium a'zosisiz!
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      30 kunlik VIP imtiyozlar yoqilgan (2X Ball Multiplikatori faol)
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={dailyClaimLoading}
                  onClick={handleClaimDaily}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  <Gift className="w-4 h-4" />
                  <span>{dailyClaimLoading ? 'Olinmoqda...' : 'Kunlik 50 Ballni Olish'}</span>
                </button>
              </div>
            ) : null}

            {/* Premium Perks Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-slate-900">+50 Ball / Kun</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Har kuni avtomatik</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-slate-900">+5 Min Kiteshot</div>
                <div className="text-[10px] text-slate-500 mt-0.5">3D Otishma bepul</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-slate-900">+1 Baraban</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Har kuni aylanadi</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-black text-slate-900">Test Yaratuvchi</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Cheksiz ruxsat</div>
              </div>
            </div>

            {/* Celestial Multiplier Rank Preview: Moon, Sun, Star */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Samoviy Rank Multiplikatorlari:</span>
                </span>
                <span className="text-[11px] font-mono text-amber-300">Yulduzcha oshganda ball 2X bo'ladi</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <div className="text-base">🌙</div>
                  <div className="font-bold text-sky-300">Hilol Oy</div>
                  <div className="text-[10px] font-mono text-slate-300">1.5X Rejim</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40">
                  <div className="text-base">☀️</div>
                  <div className="font-black text-amber-300">Quyosh Radiatsiyasi</div>
                  <div className="text-[10px] font-mono text-amber-200">2.0X Rejim</div>
                </div>
                <div className="p-2 rounded-xl bg-pink-500/20 border border-pink-400/40">
                  <div className="text-base"></div>
                  <div className="font-black text-pink-300">Yulduzlar Qiroli</div>
                  <div className="text-[10px] font-mono text-pink-200">3.0X Rejim</div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                To'lov yoki Faollashtirish usulini tanlang:
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod('card')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'card'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 mx-auto text-amber-600 mb-1" />
                  <div className="text-xs font-bold text-slate-900">Bank Karta</div>
                  <div className="text-[10px] text-slate-500">Uzcard / Humo / Visa</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('qiwi')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'qiwi'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-400/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <Zap className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                  <div className="text-xs font-bold text-slate-900">QIWI Hamyon</div>
                  <div className="text-[10px] text-slate-500">Tezkor to'lov</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('points')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'points'
                      ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-400/40 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                  }`}
                >
                  <Coins className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                  <div className="text-xs font-bold text-slate-900">1000 Ballga olish</div>
                  <div className="text-[10px] text-slate-500">Sizda: {userScore} ball</div>
                </button>
              </div>
            </div>

            {/* Payment Fields */}
            {payMethod === 'card' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-amber-300 uppercase font-black">
                    UZCARD / HUMO / VISA / MASTERCARD
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Qabul qiluvchi: <span className="text-white font-bold">{targetEmail}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Karta raqami:
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => handleFormatCard(e.target.value)}
                    placeholder="8600 0000 0000 0000"
                    maxLength={19}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-sm tracking-wider focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Muddati (MM/YY):
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => handleFormatExpiry(e.target.value)}
                      placeholder="12/28"
                      maxLength={5}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      CVC / CVV:
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.slice(0, 3))}
                      placeholder="•••"
                      maxLength={3}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {payMethod === 'qiwi' && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-3">
                <div className="text-xs font-bold text-orange-950">
                  QIWI hamyon orqali xarid:
                </div>
                <input
                  type="text"
                  value={qiwiPhone}
                  onChange={(e) => setQiwiPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-orange-300 text-slate-900 text-xs font-mono"
                />
                <div className="text-[11px] text-slate-600">
                  Hisobdan to‘lov qabul qilinadi va tasdiqnoma{' '}
                  <strong className="text-slate-900">{targetEmail}</strong> ga yuboriladi.
                </div>
              </div>
            )}

            {payMethod === 'points' && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span>Ballar bilan xarid narxi:</span>
                  <span className="text-sm font-black text-purple-700">1000 Ball</span>
                </div>
                <div className="text-xs text-slate-600">
                  Sizning joriy balingiz: <strong className="text-slate-900">{userScore} ball</strong>.
                  {userScore >= 1000 ? (
                    <span className="text-emerald-600 font-bold ml-1">
                      ✓ Yetarli, faollashtirishingiz mumkin!
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold ml-1">
                      ✗ Yana {1000 - userScore} ball kerak.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Error or Success feedback */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Yopish
              </button>

              <button
                type="button"
                disabled={loading || (payMethod === 'points' && userScore < 1000)}
                onClick={handleSubscribe}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Ulanmoqda...'
                    : payMethod === 'points'
                    ? '1000 Ball evaziga Faollashtirish'
                    : 'VIP Premiumga A\'zo Bo‘lish'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
