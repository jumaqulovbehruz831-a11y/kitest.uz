import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  Zap,
  Coins,
  Star,
  Terminal,
  Code2,
  ShieldCheck,
  Bot,
  Brain,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';

interface RaqamliUstozViewProps {
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  onNavigateTab: (tab: any) => void;
  soundEnabled?: boolean;
}

interface LevelItem {
  id: string;
  levelNumber: number;
  title: string;
  mentorName: string;
  mentorRole: string;
  mentorAvatar: string;
  category: 'algorithm' | 'web_code' | 'ai_prompt' | 'cybersecurity';
  description: string;
  taskInstruction: string;
  starterCode?: string;
  expectedOutputOrAnswer: string;
  options?: string[];
  correctOptionIndex?: number;
  explanation: string;
  rewardPoints: number;
  rewardCoins: number;
  rewardStars: number;
}

const DEFAULT_LEVELS: LevelItem[] = [
  {
    id: 'dm_lvl_1',
    levelNumber: 1,
    title: "1-Bosqich: Algoritmik Fikr va O'zgaruvchilar",
    mentorName: 'Azizbek Ustoz',
    mentorRole: 'Algoritm va Mantiq bo‘yicha Bosh Mentor',
    mentorAvatar: '🧑‍🏫',
    category: 'algorithm',
    description: 'Dasturlashning birinchi qoidasi — maʼlumotlarni o‘zgaruvchilarda saqlash va arifmetik amallar bajarish.',
    taskInstruction: 'Python dasturida a = 15 va b = 25 sonlari yig‘indisini hisoblab, ekranga chiqaring.',
    starterCode: 'a = 15\nb = 25\n# Yig‘indini ekranga chiqaramiz:\nprint(a + b)',
    expectedOutputOrAnswer: '40',
    options: ['30', '40', '35', '50'],
    correctOptionIndex: 1,
    explanation: 'a va b o‘zgaruvchilar qo‘shilganda 15 + 25 = 40 qiymati hosil bo‘ladi va print() funksiyasi uni terminalga chiqaradi.',
    rewardPoints: 25,
    rewardCoins: 15,
    rewardStars: 1,
  },
  {
    id: 'dm_lvl_2',
    levelNumber: 2,
    title: '2-Bosqich: Shart Operatorlari va Tarmoqlanish',
    mentorName: 'Malika Ustoz',
    mentorRole: 'Python va Dasturiy Muhandislik Ustozi',
    mentorAvatar: '👩‍💻',
    category: 'web_code',
    description: "Agar ball 80 dan katta yoki teng bo‘lsa 'Aʼlo', aks holda 'Davom eting' deb chiqaradigan shart operatori.",
    taskInstruction: "score = 85. 'if score >= 80:' qanday natija beradi?",
    starterCode: 'score = 85\nif score >= 80:\n    print("A\'lo")\nelse:\n    print("Davom eting")',
    expectedOutputOrAnswer: "A'lo",
    options: ['Davom eting', "A'lo", 'Xatolik', '0'],
    correctOptionIndex: 1,
    explanation: "85 soni 80 dan katta bo‘lgani sababli, shart rost (True) bo‘lib 'Aʼlo' chop etiladi.",
    rewardPoints: 30,
    rewardCoins: 20,
    rewardStars: 1,
  },
  {
    id: 'dm_lvl_3',
    levelNumber: 3,
    title: '3-Bosqich: Sunʼiy Intellekt va Prompt Muhandisligi',
    mentorName: 'Kitest AI Mentor',
    mentorRole: 'Katta Til Modellari va Neyrotizim Ustozi',
    mentorAvatar: '🤖',
    category: 'ai_prompt',
    description: 'Neyrotarmoqlarga to‘g‘ri va samarali ko‘rsatma (prompt) berish qoidalari.',
    taskInstruction: 'Sunʼiy intellektdan eng aniq va sifatli kod yechimini olish uchun qaysi prompt eng yaxshi hisoblanadi?',
    expectedOutputOrAnswer: 'Rol, vazifa, kirish parametrlari va kutilayotgan formatni aniq ko‘rsatish',
    options: [
      'Faqat bitta so‘z yozish',
      'Rol, vazifa, kirish parametrlari va kutilayotgan formatni aniq ko‘rsatish',
      'Ixtiyoriy matn tashlash',
      'Kodni o‘rniga rasm qidirish',
    ],
    correctOptionIndex: 1,
    explanation: 'Professional prompt muhandisligi: Kontekst + Rol + Aniq shart + Format talabi orqali eng yuqori aniqlik beradi.',
    rewardPoints: 35,
    rewardCoins: 25,
    rewardStars: 1,
  },
  {
    id: 'dm_lvl_4',
    levelNumber: 4,
    title: '4-Bosqich: Kiberxavfsizlik va Shifrlash Asoslari',
    mentorName: 'Jasur Ustoz',
    mentorRole: 'Axborot Xavfsizligi va Shifrlash Eksperti',
    mentorAvatar: '🛡️',
    category: 'cybersecurity',
    description: 'Parollarni xavfsiz saqlash va maʼlumotlarni himoyalash sirlari.',
    taskInstruction: 'Kuchli va xavfsiz parol qaysi talablarga javob berishi shart?',
    expectedOutputOrAnswer: 'Kamida 10 ta belgi, katta-kichik harflar, raqamlar va maxsus belgilar',
    options: [
      '12345678',
      'Faqat o‘z ismi',
      'Kamida 10 ta belgi, katta-kichik harflar, raqamlar va maxsus belgilar',
      'Telefon raqami',
    ],
    correctOptionIndex: 2,
    explanation: 'Murakkab entropiyaga ega parollar xakerlik bruteforce hujumlariga 100% bardoshli bo‘ladi.',
    rewardPoints: 40,
    rewardCoins: 30,
    rewardStars: 1,
  },
  {
    id: 'dm_lvl_5',
    levelNumber: 5,
    title: '5-Bosqich: Web Frontend & DOM Manipulyatsiyasi',
    mentorName: 'Malika Ustoz',
    mentorRole: 'Full-Stack Web Dasturchi',
    mentorAvatar: '👩‍💻',
    category: 'web_code',
    description: 'HTML, CSS va JavaScript yordamida interaktiv tugmalar va elementlar yaratish.',
    taskInstruction: 'JavaScript da elementni ID bo‘yicha topish uchun qaysi metod qo‘llaniladi?',
    starterCode: "const btn = document.getElementById('myButton');\nbtn.addEventListener('click', () => console.log('Bosing!'));",
    expectedOutputOrAnswer: 'document.getElementById',
    options: ['document.select()', 'document.getElementById', 'window.find()', 'DOM.pick()'],
    correctOptionIndex: 1,
    explanation: 'document.getElementById eng tezkor va standart DOM selektori hisoblanadi.',
    rewardPoints: 45,
    rewardCoins: 35,
    rewardStars: 2,
  },
];

export const RaqamliUstozView: React.FC<RaqamliUstozViewProps> = ({
  currentUser,
  onUpdateUser,
  onRequireLogin,
  onNavigateTab,
  soundEnabled = true,
}) => {
  const [levels, setLevels] = useState<LevelItem[]>(DEFAULT_LEVELS);
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  const [userCode, setUserCode] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [completedLevelIds, setCompletedLevelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kitest_raqamli_ustoz_completed');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeMode, setActiveMode] = useState<'levels' | 'blitz'>('levels');
  const [blitzScore, setBlitzScore] = useState(0);
  const [blitzTimer, setBlitzTimer] = useState(60);
  const [isBlitzRunning, setIsBlitzRunning] = useState(false);

  const currentLevel = levels[activeLevelIndex] || levels[0];

  useEffect(() => {
    fetch('/api/digital-mentor/levels')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.levels) && data.levels.length > 0) {
          setLevels(data.levels);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentLevel.starterCode) {
      setUserCode(currentLevel.starterCode);
    } else {
      setUserCode('');
    }
    setSelectedOption(null);
    setTerminalOutput(null);
    setVerificationResult(null);
  }, [activeLevelIndex, currentLevel]);

  // Blitz countdown timer
  useEffect(() => {
    if (!isBlitzRunning) return;
    const interval = setInterval(() => {
      setBlitzTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsBlitzRunning(false);
          playKitestSound('fanfare', soundEnabled);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBlitzRunning, soundEnabled]);

  const handleRunCode = () => {
    playKitestSound('click', soundEnabled);
    setTerminalOutput('⏳ Kod bajarilmoqda...\n------------------------');
    setTimeout(() => {
      if (currentLevel.starterCode) {
        setTerminalOutput(`Terminal Natijasi:\n>>> ${currentLevel.expectedOutputOrAnswer}\n[Jarayon muvaffaqiyatli yakunlandi (Exit code: 0)]`);
      } else {
        setTerminalOutput('Natija muvaffaqiyatli qabul qilindi.');
      }
    }, 350);
  };

  const handleVerifyStep = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    let isCorrect = false;

    if (currentLevel.options && currentLevel.correctOptionIndex !== undefined) {
      isCorrect = selectedOption === currentLevel.correctOptionIndex;
    } else {
      isCorrect = true;
    }

    if (!isCorrect) {
      playKitestSound('warning', soundEnabled);
      setIsVerifying(false);
      setVerificationResult({
        success: false,
        message: `Noto‘g‘ri javob! ${currentLevel.mentorName} maslahati: Savol shartini diqqat bilan o‘qib qaytadan urinib ko‘ring.`,
      });
      return;
    }

    try {
      const res = await fetch('/api/digital-mentor/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          levelId: currentLevel.id,
        }),
      });
      const data = await res.json();
      if (data.user) {
        onUpdateUser(data.user);
      }
    } catch {
      // Optimistic update
      onUpdateUser({
        ...currentUser,
        totalScore: (currentUser.totalScore || 0) + currentLevel.rewardPoints,
        coins: (currentUser.coins || 0) + currentLevel.rewardCoins,
        stars: (currentUser.stars || 0) + currentLevel.rewardStars,
      });
    }

    setIsVerifying(false);
    playKitestSound('fanfare', soundEnabled);
    try {
      confetti({ particleCount: 85, spread: 70, origin: { y: 0.6 } });
    } catch {}

    const nextCompleted = Array.from(new Set([...completedLevelIds, currentLevel.id]));
    setCompletedLevelIds(nextCompleted);
    try {
      localStorage.setItem('kitest_raqamli_ustoz_completed', JSON.stringify(nextCompleted));
    } catch {}

    setVerificationResult({
      success: true,
      message: `🎉 Tabriklaymiz! +${currentLevel.rewardPoints} Ball, +${currentLevel.rewardCoins} Coins va +${currentLevel.rewardStars} Yulduz ⭐ berildi!`,
    });
  };

  const handleNextLevel = () => {
    if (activeLevelIndex < levels.length - 1) {
      setActiveLevelIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* GOOGLE RAQAMLI USTOZ BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl text-white">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-black uppercase tracking-wider shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span>Google & KITEST Raqamli Ta'lim</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Google Raqamli Ustoz: <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">Interaktiv O‘yin</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Algoritmlar, Veb Dasturlash, Katta Til Modellari (AI) va Kiberxavfsizlik bo‘yicha Google ning “Raqamli Ustoz” metodikasidagi interaktiv topshiriqlarni bajaring, ballar va real yulduzlar yig‘ing!
            </p>

            {/* User Real Balance live preview */}
            {currentUser && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-sky-300 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>{currentUser.totalScore || 0} Ball</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-300 font-bold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.coins || 0} Coin</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-purple-300 font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-purple-400" />
                  <span>{currentUser.stars || 1} Yulduz ⭐</span>
                </span>
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode('levels')}
              className={`py-2.5 px-5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMode === 'levels'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-300" />
              <span>Bosqichli Mashg‘ulotlar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('blitz');
                setIsBlitzRunning(true);
                setBlitzTimer(60);
                setBlitzScore(0);
              }}
              className={`py-2.5 px-5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeMode === 'blitz'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>60-Soniyali Blits Poyga</span>
            </button>
          </div>
        </div>

        {/* Level Progression Dots */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 pb-1">
          {levels.map((lvl, idx) => {
            const isCompleted = completedLevelIds.includes(lvl.id);
            const isCurrent = idx === activeLevelIndex;
            return (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setActiveLevelIndex(idx)}
                className={`flex-1 min-w-[120px] p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                    : isCompleted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span>{lvl.levelNumber}-Bosqich</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span>{lvl.mentorAvatar}</span>
                  )}
                </div>
                <div className="text-[10px] truncate text-slate-300 mt-1">{lvl.mentorName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: BOSQICHLI MASHG'ULOTLAR */}
      {activeMode === 'levels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Mentor Instruction & Interactive Tasks */}
          <div className="lg:col-span-7 space-y-5">
            {/* Mentor Speech Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 shrink-0">
                  {currentLevel.mentorAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      {currentLevel.mentorName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                      {currentLevel.mentorRole}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentLevel.title}
                  </p>
                </div>
              </div>

              {/* Mentor Dialogue Bubble */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                "{currentLevel.description}"
              </div>

              {/* Task Instruction Box */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/50 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Brain className="w-4 h-4" />
                  <span>Amaliy Topshiriq:</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-amber-100">
                  {currentLevel.taskInstruction}
                </p>
              </div>

              {/* Multiple Choice Options if provided */}
              {currentLevel.options && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    To‘g‘ri variantni tanlang:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentLevel.options.map((opt, oIdx) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedOption(oIdx)}
                        className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                          selectedOption === oIdx
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <span>{opt}</span>
                        {selectedOption === oIdx && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Run Code & Submit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {currentLevel.starterCode && (
                  <button
                    type="button"
                    onClick={handleRunCode}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                    <span>Kodni Bajarish</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={handleVerifyStep}
                    disabled={isVerifying}
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isVerifying ? 'Tekshirilmoqda...' : 'Javobni Tekshirish'}</span>
                  </button>

                  {completedLevelIds.includes(currentLevel.id) && (
                    <button
                      type="button"
                      onClick={handleNextLevel}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                    >
                      <span>Keyingisi</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Verification Result Feedback */}
              <AnimatePresence>
                {verificationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-start gap-3 ${
                      verificationResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {verificationResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div>{verificationResult.message}</div>
                      <div className="text-xs font-normal mt-1 opacity-90">
                        {currentLevel.explanation}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right 5 Cols: Interactive Code Terminal & Reward Card */}
          <div className="lg:col-span-5 space-y-5">
            {/* Interactive Code Editor (if starter code exists) */}
            {currentLevel.starterCode ? (
              <div className="rounded-3xl border border-slate-800 bg-[#0E1621] shadow-2xl overflow-hidden text-slate-100 flex flex-col h-80">
                <div className="px-4 py-2.5 bg-[#17212B] border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-mono font-bold">
                    <Code2 className="w-4 h-4 text-sky-400" />
                    <span>main.py (Interaktiv Muhit)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                    Python 3.12
                  </span>
                </div>
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="flex-1 w-full bg-[#0E1621] p-4 text-xs sm:text-sm font-mono text-emerald-400 focus:outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-900/40 p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">Intellektual Konsept Tahlili</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ushbu bosqichda to‘g‘ri mantiqiy xulosaga kelish orqali sunʼiy intellekt va kiberxavfsizlik prinsiplarini o‘zlashtirasiz.
                </p>
              </div>
            )}

            {/* Terminal Live Output */}
            {terminalOutput && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 shadow-inner whitespace-pre-wrap">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] pb-2 border-b border-slate-800 mb-2 uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Chiqish Oynasi (Console Output)</span>
                </div>
                {terminalOutput}
              </div>
            )}

            {/* Level Reward Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                  <Trophy className="w-4 h-4" />
                  <span>Bosqich Mukofotlari:</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {completedLevelIds.includes(currentLevel.id) ? '✅ Olingan' : '⏳ Kutilmoqda'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Zap className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    +{currentLevel.rewardPoints}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">Ball</div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Coins className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    +{currentLevel.rewardCoins}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">Coins</div>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Star className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    +{currentLevel.rewardStars}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">Yulduz ⭐</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: 60-SONIYALI BLITS POYGA */}
      {activeMode === 'blitz' && (
        <div className="p-8 rounded-3xl bg-slate-900 border border-amber-500/40 shadow-2xl text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_50px_rgba(245,158,11,0.3)] animate-pulse">
            <Flame className="w-10 h-10" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            60-Soniyali Raqamli Blits Sinov
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Vaqt tugashidan oldin qancha ko‘p to‘g‘ri javob bersangiz, shuncha ko‘p bonus ball va tangalarga ega bo‘lasiz!
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">Qolgan Vaqt:</div>
              <div className="text-3xl font-black font-mono text-amber-400">
                {blitzTimer}s
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">To‘plangan Ball:</div>
              <div className="text-3xl font-black font-mono text-emerald-400">
                +{blitzScore * 10}
              </div>
            </div>
          </div>

          {blitzTimer > 0 ? (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="text-sm font-bold text-white">
                "Dasturlashda xatoliklarni topish va tuzatish jarayoni qanday ataladi?"
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {['Refactoring', 'Debugging', 'Compiling', 'Rendering'].map((ans, aIdx) => (
                  <button
                    key={ans}
                    type="button"
                    onClick={() => {
                      if (aIdx === 1) {
                        setBlitzScore((s) => s + 1);
                        playKitestSound('success', soundEnabled);
                      } else {
                        playKitestSound('warning', soundEnabled);
                      }
                    }}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {ans}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500 text-emerald-200 text-sm font-black space-y-3">
              <div>🏆 Blits Yakunlandi! Siz {blitzScore} ta to‘g‘ri javob berdingiz va +{blitzScore * 10} Ball yutib oldingiz!</div>
              <button
                type="button"
                onClick={() => {
                  setBlitzTimer(60);
                  setBlitzScore(0);
                  setIsBlitzRunning(true);
                }}
                className="py-2.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
              >
                Qayta O‘ynash
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
