import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TestItem, User, Submission, Contest, ADMIN_EMAIL } from '../types';
import { KitestEmblem, playKitestSound } from './KitestEmblem';
import {
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trophy,
  FileText,
  Users,
  Activity,
  UserPlus,
  Play,
  Pause,
  RotateCcw,
  KeyRound,
  Target,
  Maximize2,
} from 'lucide-react';

interface HomeViewProps {
  tests: TestItem[];
  users: User[];
  submissions: Submission[];
  contests: Contest[];
  currentUser: User | null;
  soundEnabled?: boolean;
  onSelectTest: (test: TestItem) => void;
  onNavigate: (tab: any) => void;
  onOpenAuth: (mode: 'login' | 'register', prefillAdmin?: boolean) => void;
}

const MOTTO_WORDS = ['DUNYO', 'YOSHLAR', "QO'LIDA!"];

export const HomeView: React.FC<HomeViewProps> = ({
  tests,
  users,
  submissions,
  contests,
  currentUser,
  soundEnabled = true,
  onSelectTest,
  onNavigate,
  onOpenAuth,
}) => {
  const isAdmin =
    Boolean(currentUser) &&
    currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL;
  const isCreatorOrAdmin =
    isAdmin || (Boolean(currentUser) && currentUser!.role === 'creator');

  const solvedTestIds = new Set(
    submissions
      .filter((s) => currentUser && s.userId === currentUser.id && s.earnedPoints > 0)
      .map((s) => s.testId)
  );

  // Feature 1: Quick Test PIN / Code Launcher
  const [quickPin, setQuickPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleQuickPinLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const clean = quickPin.trim().replace('#', '');
    if (!clean) {
      setPinError('Test raqamini kiriting (masalan: 0001)');
      return;
    }
    const padded = clean.padStart(4, '0');
    const found = tests.find(
      (t) =>
        t.id === clean ||
        t.id === padded ||
        String(t.numericId) === clean ||
        t.title.toLowerCase() === clean.toLowerCase()
    );
    if (!found) {
      playKitestSound('warning', soundEnabled);
      setPinError(`#${padded} raqamli test topilmadi!`);
      return;
    }
    playKitestSound('click', soundEnabled);
    onSelectTest(found);
  };

  // Feature 2: Interactive Prep / Focus Timer
  const [focusDurationMin, setFocusDurationMin] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  useEffect(() => {
    if (!focusRunning) return;
    const t = setInterval(() => {
      setFocusSeconds((prev) => {
        if (prev <= 1) {
          setFocusRunning(false);
          playKitestSound('finish', soundEnabled);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [focusRunning, soundEnabled]);

  const formatFocus = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Feature 3: Daily Goal Tracker (persisted in localStorage)
  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('kitest_daily_goal')) || 3;
    } catch {
      return 3;
    }
  });

  const handleGoalChange = (newGoal: number) => {
    const valid = Math.max(1, Math.min(20, newGoal));
    setDailyGoal(valid);
    try {
      localStorage.setItem('kitest_daily_goal', String(valid));
    } catch {}
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const mySolvedToday = currentUser
    ? submissions.filter(
        (s) =>
          s.userId === currentUser.id &&
          s.submittedAt.startsWith(todayStr) &&
          s.earnedPoints > 0
      ).length
    : 0;
  const goalProgressPercent = Math.min(100, Math.round((mySolvedToday / dailyGoal) * 100));

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* ANIMATED HERO BANNER: "DUNYO YOSHLAR QO'LIDA!" + KITEST Special Badge */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative p-6 sm:p-10 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden"
      >
        {/* Subtle Animated Orbital Accent */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full border border-emerald-500/15 border-dashed"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-5">
            {/* Animated Motto Banner: DUNYO YOSHLAR QO'LIDA */}
            <div className="flex flex-wrap items-center gap-3">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-2">
                {MOTTO_WORDS.map((word, idx) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: idx * 0.14,
                      duration: 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      repeatDelay: 4,
                    }}
                    className="text-xs sm:text-sm font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </div>

            <motion.h1
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              Dunyo yoshlar qo'lida —{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                KITEST
              </span>{' '}
              CHSB va Quiz tizimi
            </motion.h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Telegram Quiz uslubida tezkor savollar tuzing, Zoom Ekran (To'liq ekran)
              tartibida haqiqiy CHSB imtihonlarini topshiring va har bir to'g'ri javob
              uchun balingizni oshirib boring.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playKitestSound('click', soundEnabled);
                  onNavigate('problems');
                }}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <span>Testlarni Yechish (Zoom Ekran)</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {isCreatorOrAdmin && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    playKitestSound('click', soundEnabled);
                    onNavigate('create_test');
                  }}
                  className="py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Test Yaratish (Telegram Quiz)</span>
                </motion.button>
              )}

              {isAdmin ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('admin')}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-xs sm:text-sm font-semibold text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Panel (+ Yaratuvchi qo'shish)</span>
                </motion.button>
              ) : !currentUser ? (
                <>
                  <button
                    onClick={() => onOpenAuth('register', false)}
                    className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-semibold text-slate-200 transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ro'yxatdan o'tish</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('login', true)}
                    className="py-3 px-5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-xs sm:text-sm font-semibold text-emerald-400 transition-colors flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panelga kirish</span>
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Animated Real Platform Counters */}
          <div className="grid grid-cols-2 gap-3 sm:w-80 shrink-0">
            {[
              {
                label: 'Jami testlar',
                value: tests.length,
                icon: FileText,
                color: 'text-emerald-400',
              },
              {
                label: 'Foydalanuvchilar',
                value: users.length,
                icon: Users,
                color: 'text-sky-400',
              },
              {
                label: 'CHSB Urinishlar',
                value: submissions.length,
                icon: Activity,
                color: 'text-amber-400',
              },
              {
                label: 'Olimpiadalar',
                value: contests.length,
                icon: Trophy,
                color: 'text-purple-400',
              },
            ].map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.07 }}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800"
                >
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <IconComp className={`w-3.5 h-3.5 ${stat.color}`} />
                    <span>{stat.label}</span>
                  </div>
                  <div className="mt-1.5 text-2xl font-extrabold text-white font-mono tabular-nums">
                    {stat.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* THREE DISTINCT 100%-WORKING INTERACTIVE MODERN WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Widget 1: Tezkor Test PIN / ID Kod orqali Kirish */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                <span>Tezkor Test PIN-Kodi</span>
              </span>
              <span className="font-mono">CHSB ZOOM</span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Test raqami orqali to'g'ridan-to'g'ri yechish
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Test kodini (masalan: <code className="font-mono text-emerald-400">0001</code>) yozib darhol Zoom Ekran imtihoniga kiring.
            </p>
          </div>

          <form onSubmit={handleQuickPinLaunch} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickPin}
                onChange={(e) => setQuickPin(e.target.value)}
                placeholder="Kod: #0001"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
            </div>
            {pinError && (
              <div className="text-[11px] text-rose-400">{pinError}</div>
            )}
          </form>
        </motion.div>

        {/* Widget 2: Kunlik Maqsad va Shaxsiy Ball Ko'rsatkichi */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                <span>Kunlik CHSB Maqsad</span>
              </span>
              <span className="font-mono tabular-nums">
                {mySolvedToday} / {dailyGoal} test
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              Shaxsiy faollik va yig'ilgan ball
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {currentUser
                ? `Sizning jami balingiz: ${currentUser.totalScore} ball (Reyting: ${currentUser.rating})`
                : "Natijalaringiz saqlanishi uchun tizimga kiring."}
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalProgressPercent}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-sky-400"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Kunlik reja:</span>
              <div className="flex items-center gap-1.5">
                {[3, 5, 10].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGoalChange(g)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] transition-colors ${
                      dailyGoal === g
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g} ta
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Widget 3: Olimpiada Tayyorgarlik Fokus Taymeri */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.29 }}
          className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4" />
                <span>Tayyorgarlik Fokus Taymeri</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Mashq vaqtini nazorat qilish
              </h3>
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
              {formatFocus(focusSeconds)}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {[15, 25, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setFocusRunning(false);
                    setFocusDurationMin(m);
                    setFocusSeconds(m * 60);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                    focusDurationMin === m
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playKitestSound('click', soundEnabled);
                  setFocusRunning(!focusRunning);
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1"
              >
                {focusRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>To'xtatish</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Boshlash</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusRunning(false);
                  setFocusSeconds(focusDurationMin * 60);
                }}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                title="Qayta tiklash"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Two-Column KITEST Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Latest Tests Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              CHSB va Quiz Testlar Ro'yxati
            </h2>
            <button
              onClick={() => onNavigate('problems')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Barcha testlar ({tests.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
            {tests.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="text-sm font-medium text-slate-300">
                  Hozircha platformada testlar mavjud emas
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Testlar Bosh Admin ({ADMIN_EMAIL}) yoki Admin Panel orqali qo'shilgan Test Yaratuvchilar tomonidan Telegram Quiz uslubida yaratiladi.
                </p>
                {isCreatorOrAdmin && (
                  <button
                    onClick={() => onNavigate('create_test')}
                    className="mt-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Birinchi testni yaratish</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                      <th className="py-3 px-4 font-medium">Kod</th>
                      <th className="py-3 px-4 font-medium">Test nomi</th>
                      <th className="py-3 px-4 font-medium">Fan</th>
                      <th className="py-3 px-4 font-medium">Vaqt / Savol / Ball</th>
                      <th className="py-3 px-4 font-medium text-right">Zoom Ekran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-sm">
                    {tests.slice(0, 8).map((t) => {
                      const isSolved = solvedTestIds.has(t.id);
                      return (
                        <tr
                          key={t.id}
                          onClick={() => onSelectTest(t)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              {isSolved && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              #{t.id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {t.title}
                            <div className="text-xs font-normal text-slate-400">
                              Tuzuvchi: {t.authorName}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-300">
                            {t.subject}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {t.durationMinutes} daq · {t.questions.length} savol · {t.totalPoints} ball
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTest(t);
                              }}
                              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors inline-flex items-center gap-1"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>Yechish</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Top Leaderboard Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">KITEST Reyting</h2>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>To'liq jadval</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Hozircha ro'yxatdan o'tgan foydalanuvchilar yo'q.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {users.slice(0, 7).map((u, index) => (
                  <div
                    key={u.id}
                    className="p-3.5 px-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs font-mono tabular-nums font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          @{u.username} · {u.solvedCount} test
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-sm font-bold text-emerald-400">
                        {u.totalScore} ball
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Reyting: {u.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
