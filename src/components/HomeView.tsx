import React, { useState, useMemo } from 'react';
import {
  TestItem,
  User,
  Submission,
  Contest,
} from '../types';
import { NavTab } from './Navbar';
import { Kitest3DKiteIllustration } from './KitestKiteLogo';
import {
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Swords,
  Sparkles,
  Terminal,
  Video,
  Gift,
  Clock,
  ChevronRight,
  Layers,
  Flame,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface HomeViewProps {
  tests: TestItem[];
  users: User[];
  submissions: Submission[];
  contests: Contest[];
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  soundEnabled?: boolean;
  bgConfig?: any;
  onChangeBgConfig?: any;
  onOpenBgCustomizer?: () => void;
  onSelectTest: (test: TestItem) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAdminModal: () => void;
  onOpenCertificatesStore?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenProfile?: () => void;
  onUpdateUser?: (user: User) => void;
  onRefreshState?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tests,
  users,
  submissions,
  currentUser,
  onSelectTest,
  onNavigate,
  onOpenCertificatesStore,
  onOpenLuckyWheel,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Barchasi');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [promoVideoPlaying, setPromoVideoPlaying] = useState<boolean>(false);
  const [promoVideoSeconds, setPromoVideoSeconds] = useState<number>(0);
  const [activeVideoChapter, setActiveVideoChapter] = useState<number>(0);

  // 2-minute promotional video timer
  useEffect(() => {
    if (!promoVideoPlaying) return;
    const interval = setInterval(() => {
      setPromoVideoSeconds((prev) => {
        if (prev >= 120) {
          clearInterval(interval);
          setPromoVideoPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [promoVideoPlaying]);

  // 100% REAL statistics based on actual user activity and database records
  const completedTestsCount = useMemo(() => {
    if (!currentUser) return 0;
    return submissions.filter((s) => s.userId === currentUser.id).length;
  }, [currentUser, submissions]);

  const certificateCount = useMemo(() => {
    if (!currentUser) return 0;
    return currentUser.purchasedCertificates?.length || 0;
  }, [currentUser]);

  const overallMasteryPct = useMemo(() => {
    if (!currentUser) return 0;
    const userSubs = submissions.filter((s) => s.userId === currentUser.id);
    if (userSubs.length === 0) return 0;
    const passedSubs = userSubs.filter(
      (s) => s.verdict === 'Accepted' || (s.score && s.score >= 60)
    ).length;
    return Math.min(100, Math.round((passedSubs / userSubs.length) * 100));
  }, [currentUser, submissions]);

  // Showcase courses matching image.png exactly
  const showcaseCourses = [
    {
      id: 'c_web',
      tag: 'Web Development',
      tagColor: 'bg-blue-100 text-blue-700',
      title: 'Web Development to‘liq kurs',
      author: 'Sardor Abduqodirov',
      avatar: '/src/assets/images/kitest_feature_certificate_1791123766331.jpg',
      rating: 4.8,
      progress: 35,
      image: '/src/assets/images/kitest_feature_course_1791123745671.jpg',
      targetTab: 'courses' as NavTab,
    },
    {
      id: 'c_ds',
      tag: 'Data Science',
      tagColor: 'bg-purple-100 text-purple-700',
      title: 'Data Science asoslari',
      author: 'Nigora Karimova',
      avatar: '/src/assets/images/kitest_feature_teacher_1791123783954.jpg',
      rating: 4.7,
      progress: 20,
      image: '/src/assets/images/kitest_feature_teacher_1791123783954.jpg',
      targetTab: 'courses' as NavTab,
    },
    {
      id: 'c_uiux',
      tag: 'UI/UX Design',
      tagColor: 'bg-amber-100 text-amber-700',
      title: 'UI/UX Design amaliyot',
      author: 'Azizbek Rakhimov',
      avatar: '/src/assets/images/kitest_feature_course_1791123745671.jpg',
      rating: 4.9,
      progress: 50,
      image: '/src/assets/images/kitest_feature_certificate_1791123766331.jpg',
      targetTab: 'courses' as NavTab,
    },
    {
      id: 'c_mkt',
      tag: 'Marketing',
      tagColor: 'bg-emerald-100 text-emerald-700',
      title: 'Raqamli marketing strategiyasi',
      author: 'Diyor Khaydarov',
      avatar: '/src/assets/images/founder_creator_portrait_1790488399852.jpg',
      rating: 4.6,
      progress: 10,
      image: '/src/assets/images/kitest_hero_students_1791123717659.jpg',
      targetTab: 'courses' as NavTab,
    },
  ];

  // Subject filters
  const subjectsList = useMemo(() => {
    const list = Array.from(new Set(tests.map((t) => t.subject))).filter(Boolean);
    return ['Barchasi', ...list];
  }, [tests]);

  // Filtered tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSubject =
        selectedSubject === 'Barchasi' ||
        t.subject.toLowerCase() === selectedSubject.toLowerCase();
      const matchSearch =
        !searchFilter.trim() ||
        t.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchFilter.toLowerCase()) ||
        String(t.id).includes(searchFilter);
      return matchSubject && matchSearch;
    });
  }, [tests, selectedSubject, searchFilter]);

  return (
    <div className="space-y-8 pb-16 text-slate-800">
      {/* ========================================================================= */}
      {/* 1. HERO WELCOME BANNER (100% Matching image.png)                          */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-50 via-blue-50/70 to-indigo-50/40 border border-sky-100 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background Delicate Curve Lines matching image.png */}
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-40">
          <svg width="340" height="150" viewBox="0 0 340 150" fill="none">
            <path
              d="M0 80 Q80 20 180 90 T340 60"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
            <path
              d="M20 110 Q100 40 200 110 T360 80"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              fill="none"
            />
          </svg>
        </div>

        {/* Left Side: 3D Flying Kite Illustration + Welcome Text */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 drop-shadow-md flex items-center justify-center">
            <Kitest3DKiteIllustration size={72} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Xush kelibsiz, {currentUser ? currentUser.name.split(' ')[0] : 'o‘quvchi'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 max-w-lg leading-relaxed">
              Bugun yangi bilimlar o‘rganing va maqsadlaringizga yana bir qadam yaqinlashing.
            </p>
          </div>
        </div>

        {/* Right Streak / Daily Activity Pill matching image.png */}
        <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-sm flex items-center gap-3.5 shrink-0 relative z-10 w-full md:w-auto">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-current text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-base sm:text-lg font-black text-slate-900 leading-none">
              <span>7</span>
              <span className="text-xs font-bold text-slate-500">Kunlik seriya</span>
            </div>
            <div className="text-[11px] text-blue-600 font-bold mt-1">
              Ajoyib! Ketishda davom eting
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-MINUTLIK RASMIY REKLAMA VIDEOSI (ZAMONAVIY USLUBDA)                      */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-mono text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-sky-500" />
                <span>RASMIY TAQDIMOT REKLAMASI</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                KITEST Education: Barcha imkoniyatlar 2 daqiqada
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1 rounded-full bg-slate-100">
              ⏱️ {String(Math.floor(promoVideoSeconds / 60)).padStart(2, '0')}:
              {String(promoVideoSeconds % 60).padStart(2, '0')} / 02:00
            </span>

            <button
              type="button"
              onClick={() => setPromoVideoPlaying(!promoVideoPlaying)}
              className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              {promoVideoPlaying ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>To'xtatish</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Videoni Ko'rish (2 min)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 flex items-center justify-center shadow-inner group">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.4)_0%,transparent_70%)]" />

          {/* Chapter Presentation Visualizer */}
          <div className="relative text-center p-6 space-y-3 z-10 max-w-lg">
            {promoVideoSeconds < 30 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="ch1" className="space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/40">
                  <Kitest3DKiteIllustration size={44} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Oq va Zamonaviy Dizaynda Ilm Maskani
                </h3>
                <p className="text-xs text-slate-300">
                  CHSB, BSB, Fan olimpiadalari va dasturlash bo'yicha eng kuchli o'zbek ta'lim platformasi.
                </p>
              </motion.div>
            ) : promoVideoSeconds < 60 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="ch2" className="space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/40">
                  <Swords className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                  Kiteshot 3D & Roblox Uslubidagi Otishma
                </h3>
                <p className="text-xs text-slate-300">
                  Real onlayn bolalar bilan 3D shaklda bilimlar va reflekslar bellashuvi!
                </p>
              </motion.div>
            ) : promoVideoSeconds < 90 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="ch3" className="space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/40">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-300">
                  Jonli Video Majlis & Telegram Chat
                </h3>
                <p className="text-xs text-slate-300">
                  Ustozlar va adminlar bilan yuzma-yuz video konferensiyalar hamda qulay guruhlar.
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="ch4" className="space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-400/40">
                  <Star className="w-8 h-8 fill-current text-purple-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-purple-300">
                  Apple Face ID & Rasmiy Sertifikatlar
                </h3>
                <p className="text-xs text-slate-300">
                  1 soniyada xavfsiz Face ID orqali kirish va avtomatik ism-familiyali rasmiy sertifikatlar!
                </p>
              </motion.div>
            )}

            {!promoVideoPlaying && (
              <button
                type="button"
                onClick={() => setPromoVideoPlaying(true)}
                className="mt-3 py-2.5 px-6 rounded-full bg-white text-slate-900 font-black text-xs shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>▶ Ijroni boshlash</span>
              </button>
            )}
          </div>

          {/* Progress Scrub Bar */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-800">
            <div
              className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full transition-all duration-300"
              style={{ width: `${(promoVideoSeconds / 120) * 100}%` }}
            />
          </div>
        </div>

        {/* Video Bookmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setPromoVideoSeconds(0);
              setPromoVideoPlaying(true);
            }}
            className={`p-2 rounded-xl text-left border transition-all ${
              promoVideoSeconds < 30 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400">00:00 - 00:30</div>
            <div className="font-bold truncate">1. Oq zamonaviy platforma</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPromoVideoSeconds(30);
              setPromoVideoPlaying(true);
            }}
            className={`p-2 rounded-xl text-left border transition-all ${
              promoVideoSeconds >= 30 && promoVideoSeconds < 60 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400">00:30 - 01:00</div>
            <div className="font-bold truncate">2. Kiteshot 3D Otishma</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPromoVideoSeconds(60);
              setPromoVideoPlaying(true);
            }}
            className={`p-2 rounded-xl text-left border transition-all ${
              promoVideoSeconds >= 60 && promoVideoSeconds < 90 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400">01:00 - 01:30</div>
            <div className="font-bold truncate">3. Majlis & Telegram Chat</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setPromoVideoSeconds(90);
              setPromoVideoPlaying(true);
            }}
            className={`p-2 rounded-xl text-left border transition-all ${
              promoVideoSeconds >= 90 ? 'bg-sky-50 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400">01:30 - 02:00</div>
            <div className="font-bold truncate">4. Face ID & Sertifikat</div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MENING YUTUQLARIM (100% Matching image.png with REAL Data)             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Mening yutuqlarim
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('leaderboard')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Barcha yutuqlarni ko‘rish</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Umumiy o'zlashtirish (REAL %) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e0f2fe"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeDasharray={`${overallMasteryPct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-black text-sm text-slate-900 font-mono">
                {overallMasteryPct}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Umumiy o‘zlashtirish
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {overallMasteryPct > 0
                  ? 'Barqaror boring! Oldinga siljishda davom eting.'
                  : 'Testlarni yeching va o‘zlashtirish ballini to‘plang.'}
              </p>
              {/* Blue Wave line matching image.png */}
              <div className="mt-2 text-blue-500">
                <svg width="60" height="8" viewBox="0 0 60 8" fill="none">
                  <path d="M0 4 Q15 0 30 4 T60 4" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Yakunlangan kurslar / testlar (REAL Count) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#dcfce7"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeDasharray={`${Math.min(100, completedTestsCount * 10)}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-black text-sm text-slate-900 font-mono">
                {completedTestsCount}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Yakunlangan kurslar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {completedTestsCount > 0
                  ? 'Tabriklaymiz! Ajoyib natija.'
                  : 'Hozircha yakunlangan darslar yo‘q.'}
              </p>
              {/* Green Wave line matching image.png */}
              <div className="mt-2 text-emerald-500">
                <svg width="60" height="8" viewBox="0 0 60 8" fill="none">
                  <path d="M0 4 Q15 0 30 4 T60 4" stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 3: Olingan sertifikatlar (REAL Count) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f3e8ff"
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3.5"
                  strokeDasharray={`${Math.min(100, certificateCount * 20)}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-black text-sm text-slate-900 font-mono">
                {certificateCount}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                Olingan sertifikatlar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {certificateCount > 0
                  ? 'Sertifikatlaringizni boshqalar bilan ulashing.'
                  : 'Kurs va testlarni yakunlab sertifikat oling.'}
              </p>
              {/* Purple Wave line matching image.png */}
              <div className="mt-2 text-purple-500">
                <svg width="60" height="8" viewBox="0 0 60 8" fill="none">
                  <path d="M0 4 Q15 0 30 4 T60 4" stroke="#a855f7" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TAVSIYA ETILGAN KURSLAR (100% Matching image.png)                       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Tavsiya etilgan kurslar
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('courses')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Barcha kurslarni ko‘rish</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {showcaseCourses.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate(c.targetTab)}
              className="group bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Course Banner Preview */}
                <div className="relative rounded-2xl overflow-hidden h-36 bg-slate-900 mb-3.5">
                  <img
                    src={c.image}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${c.tagColor} shadow-sm backdrop-blur-md`}>
                      {c.tag}
                    </span>
                  </div>
                </div>

                {/* Course Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {c.title}
                </h3>

                {/* Author & Rating */}
                <div className="flex items-center justify-between mt-2.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={c.avatar}
                      alt={c.author}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-slate-600 truncate text-[11px] font-medium">
                      {c.author}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{c.rating}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Percentage */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {c.progress}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FAN TESTLARI & BARCHA FUNKSIYALAR RO'YXATI                             */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Fan testlari va Masalalar arxivi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Haqiqiy testlar soni: {tests.length} ta · Bosganda oynasi bevosita ustida ochiladi
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('problems')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Barcha testlar ({tests.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {subjectsList.slice(0, 7).map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTests.slice(0, 6).map((test) => (
            <div
              key={test.id}
              onClick={() => onSelectTest(test)}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                    {test.subject}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{test.id}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {test.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {test.description || `${test.subject} fanidan maxsus savollar to‘plami`}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{test.durationMinutes || 25} daqiqa · {test.questions.length} savol</span>
                </span>
                <span className="font-bold text-blue-600 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Yechish <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TEZKOR BOSHQARUV VA ASOSIY FUNKSIYALAR RO'YXATI                        */}
      {/* ========================================================================= */}
      <section className="bg-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200/70">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Platforma vositalari va Modullar
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('duels')}
            className="p-3.5 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Swords className="w-5 h-5 text-rose-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">1v1 Duellar</div>
            <div className="text-[10px] text-slate-500">Jonli bellashuv</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('create_test')}
            className="p-3.5 rounded-2xl bg-white hover:bg-purple-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-purple-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">AI Savol Tuzish</div>
            <div className="text-[10px] text-slate-500">Sun&apos;iy intellekt</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('books_3d')}
            className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Layers className="w-5 h-5 text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">3D Kitoblar</div>
            <div className="text-[10px] text-slate-500">Varaqlanadigan darslik</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('code_arena')}
            className="p-3.5 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Terminal className="w-5 h-5 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Kod Poligoni</div>
            <div className="text-[10px] text-slate-500">Python, JS, C++</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('majlis')}
            className="p-3.5 rounded-2xl bg-white hover:bg-cyan-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Video className="w-5 h-5 text-cyan-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Video Majlis</div>
            <div className="text-[10px] text-slate-500">Jonli o&apos;quv zali</div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenLuckyWheel) onOpenLuckyWheel();
            }}
            className="p-3.5 rounded-2xl bg-white hover:bg-amber-50 border border-slate-200 text-left transition-all cursor-pointer group"
          >
            <Gift className="w-5 h-5 text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
            <div className="text-xs font-bold text-slate-900">Omad Barabani</div>
            <div className="text-[10px] text-slate-500">Har kunlik sovg&apos;a</div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. REAL STATISTIKA (0 bo'lsa 0 ta, 1 bo'lsa 1 ta)                          */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
              {users.length} ta
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Ro&apos;yxatdan o&apos;tgan foydalanuvchilar</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              {tests.length} ta
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Mavjud testlar to&apos;plami</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
              {submissions.length} ta
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Topshirilgan test natijalari</div>
          </div>
          <div className="pt-2 md:pt-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
              {submissions.length > 0
                ? `${Math.round(
                    (submissions.filter((s) => s.verdict === 'Accepted' || (s.score && s.score >= 60)).length /
                      submissions.length) *
                      100
                  )}%`
                : '0%'}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-1">Haqiqiy o&apos;rtacha natijadorlik</div>
          </div>
        </div>
      </section>
    </div>
  );
};
