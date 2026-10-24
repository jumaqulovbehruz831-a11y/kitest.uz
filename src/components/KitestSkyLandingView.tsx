import React from 'react';
import { motion } from 'motion/react';
import {
  KitestKiteLogo,
  Kitest3DKiteIllustration,
  KitestSkyBackground,
} from './KitestKiteLogo';
import { User, TestItem, ADMIN_EMAIL } from '../types';
import { NavTab } from './Navbar';
import {
  BookOpen,
  Award,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Swords,
  Layers,
  Terminal,
  Video,
  ScanFace,
  Gift,
  CheckCircle2,
  Play,
  Edit3,
  X,
  ExternalLink,
} from 'lucide-react';

interface KitestSkyLandingViewProps {
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  tests: TestItem[];
  users: User[];
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenFaceId: () => void;
  onOpenIncognito: () => void;
  onSelectTest: (test: TestItem) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const KitestSkyLandingView: React.FC<KitestSkyLandingViewProps> = ({
  currentUser,
  isAdminUnlocked,
  tests,
  users,
  onOpenAuth,
  onOpenFaceId,
  onOpenIncognito,
  onSelectTest,
  onNavigateTab,
}) => {
  const [entranceVideoUrl, setEntranceVideoUrl] = React.useState<string>(() => {
    try {
      return (
        localStorage.getItem('kitest_entrance_video_url') ||
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      );
    } catch {
      return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    }
  });
  const [isEditingVideo, setIsEditingVideo] = React.useState(false);
  const [videoInput, setVideoInput] = React.useState('');
  const [activeHeroTab, setActiveHeroTab] = React.useState<'video' | 'photo'>(
    'video'
  );

  React.useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.entranceVideoUrl) {
          setEntranceVideoUrl(data.entranceVideoUrl);
          try {
            localStorage.setItem('kitest_entrance_video_url', data.entranceVideoUrl);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const isUserAdmin = Boolean(
    isAdminUnlocked ||
      currentUser?.role === 'admin' ||
      currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser?.username === 'behruz_admin'
  );

  const handleSaveVideoUrl = async () => {
    let clean = videoInput.trim();
    if (!clean) return;
    if (clean.includes('watch?v=')) {
      clean = clean.replace('watch?v=', 'embed/');
    }
    setEntranceVideoUrl(clean);
    try {
      localStorage.setItem('kitest_entrance_video_url', clean);
      await fetch('/api/admin/entrance-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: clean }),
      });
    } catch {}
    setIsEditingVideo(false);
    setVideoInput('');
  };
  return (
    <KitestSkyBackground showKites={true} className="min-h-screen flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (100% Matching Image 1)                                     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <KitestKiteLogo size={42} showWordmark={true} showSlogan={true} />
          </div>

          {/* Nav Links Matching Image 1 */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => onNavigateTab('problems')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Kurslar
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('duels')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Yo&apos;nalishlar
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('majlis')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              O&apos;qituvchilar
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('leaderboard')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Yutuqlar
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('books_3d')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Kitobxonlar uchun
            </button>
          </nav>

          {/* Right Action Buttons Matching Image 1 */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="py-2.5 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm border border-slate-200/80 shadow-sm transition-all cursor-pointer"
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="py-2.5 px-6 rounded-xl bg-[#155dfc] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Ro&apos;yxatdan o&apos;tish
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (100% Matching Image 1)                                   */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Text Column */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight leading-[1.06] text-slate-950">
                <span className="block">Kelajagingizni</span>
                <span className="block text-[#155dfc]">KITEST bilan</span>
                <span className="block">quring</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-medium pt-2 max-w-lg leading-relaxed">
                Minglab o&apos;quvchilar allaqachon o&apos;zgarishni boshladi
              </p>
            </div>

            {/* Hero Buttons Matching Image 1 */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="py-3.5 px-8 rounded-2xl bg-[#155dfc] hover:bg-blue-700 text-white font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <span>Boshlash</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="py-3.5 px-8 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-black text-sm sm:text-base flex items-center gap-2.5 shadow-md border border-slate-200/80 transition-all cursor-pointer group hover:scale-[1.02]"
              >
                <span>Kirish</span>
                <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>

            {/* Quick Access to Custom Features: Face ID & Incognito */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenFaceId}
                className="py-2 px-3.5 rounded-xl bg-white/90 hover:bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <ScanFace className="w-4 h-4 text-emerald-600" />
                <span>Haqiqiy Kamera Face ID</span>
              </button>

              <button
                type="button"
                onClick={onOpenIncognito}
                className="py-2 px-3.5 rounded-xl bg-white/90 hover:bg-violet-50 border border-violet-300 text-violet-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>🕵️</span>
                <span>Accountsiz (Inkognito) Kirish</span>
              </button>
            </div>
          </div>

          {/* Right Hero Column: Entrance Video / Photo Showcase */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            {/* Ambient Sky Cloud Backdrops */}
            <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-blue-300/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />

            {/* Showcase Header Controls */}
            <div className="relative z-20 w-full max-w-lg flex items-center justify-between pb-2 px-1">
              <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-sky-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('video')}
                  className={`py-1 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeHeroTab === 'video'
                      ? 'bg-[#155dfc] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>🎬 Kirish Videosi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHeroTab('photo')}
                  className={`py-1 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeHeroTab === 'photo'
                      ? 'bg-[#155dfc] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📸 Fotolavha</span>
                </button>
              </div>

              {isUserAdmin && activeHeroTab === 'video' && (
                <button
                  type="button"
                  onClick={() => {
                    setVideoInput(entranceVideoUrl);
                    setIsEditingVideo(true);
                  }}
                  className="py-1 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  title="Admin uchun videoni o'zgartirish"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Videoni O'zgartirish</span>
                </button>
              )}
            </div>

            {/* Display Media */}
            <div className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 border-white/90 bg-slate-950 aspect-video">
              {activeHeroTab === 'video' ? (
                <iframe
                  src={entranceVideoUrl}
                  title="KITEST Rasmiy Kirish Videosi"
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src="/src/assets/images/kitest_hero_students_1791123717659.jpg"
                  alt="KITEST Kelajagingizni quring"
                  className="w-full h-full object-cover object-center"
                />
              )}
            </div>

            {/* Admin Video URL Editor Modal */}
            {isEditingVideo && (
              <div className="relative z-20 w-full max-w-lg mt-3 p-4 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-amber-400 shadow-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>👑 Admin: Kirish Videosi Havolasi</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingVideo(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="https://www.youtube.com/embed/... yoki MP4 URL"
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveVideoUrl}
                    className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THREE FEATURE CARDS (100% Matching Image 2)                            */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Minglab kurslar */}
          <div
            onClick={() => onNavigateTab('problems')}
            className="bg-white rounded-3xl p-5 border border-sky-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Minglab kurslar
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Har qanday yo&apos;nalishda va har darajada bilim oling – minglab kurslar siz uchun.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 mt-2">
              <img
                src="/src/assets/images/kitest_feature_course_1791123745671.jpg"
                alt="Minglab kurslar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 2: Sertifikatlar */}
          <div
            onClick={() => onNavigateTab('leaderboard')}
            className="bg-white rounded-3xl p-5 border border-purple-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                  Sertifikatlar
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Bilimingizni tasdiqlang va karyerangizda yangi imkoniyatlar eshigini oching.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 mt-2">
              <img
                src="/src/assets/images/kitest_feature_certificate_1791123766331.jpg"
                alt="Sertifikatlar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 3: O'qituvchilar */}
          <div
            onClick={() => onNavigateTab('majlis')}
            className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  O&apos;qituvchilar
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                Tajribali va yetakchi o&apos;qituvchilardan ilhomlaning va eng sifatli ta&apos;lim oling.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden h-48 bg-slate-100 mt-2">
              <img
                src="/src/assets/images/kitest_feature_teacher_1791123783954.jpg"
                alt="O'qituvchilar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. STATS STRIP (100% Matching Image 2)                                    */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="rounded-3xl bg-blue-50/80 border border-sky-200/70 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-sky-200/80 shadow-sm">
          {/* Stat 1: 50 000+ o'quvchi */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                50 000+
              </div>
              <div className="text-xs font-bold text-slate-600">
                o&apos;quvchi
              </div>
            </div>
          </div>

          {/* Stat 2: 1200+ kurs */}
          <div className="flex items-center justify-center gap-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                1200+
              </div>
              <div className="text-xs font-bold text-slate-600">
                kurs
              </div>
            </div>
          </div>

          {/* Stat 3: 98% muvaffaqiyat */}
          <div className="flex items-center justify-center gap-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono">
                98%
              </div>
              <div className="text-xs font-bold text-slate-600">
                muvaffaqiyat
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PLATFORMA VOSITALARI (Our Custom Functions Integrated)                  */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                KITEST Milliy Platforma Modullari
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Barcha imkoniyatlar sizning muvaffaqiyatingiz uchun tayyorlandi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('duels')}
              className="p-4 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 text-left transition-all cursor-pointer group"
            >
              <Swords className="w-6 h-6 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">1v1 Duellar</div>
              <div className="text-[10px] text-slate-500">Jonli bellashuv</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('create_test')}
              className="p-4 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-left transition-all cursor-pointer group"
            >
              <Sparkles className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">AI Savol Tuzish</div>
              <div className="text-[10px] text-slate-500">Sun&apos;iy intellekt</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('books_3d')}
              className="p-4 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 text-left transition-all cursor-pointer group"
            >
              <Layers className="w-6 h-6 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">3D Kitoblar</div>
              <div className="text-[10px] text-slate-500">Varaqlanadigan darslik</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('code_arena')}
              className="p-4 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 text-left transition-all cursor-pointer group"
            >
              <Terminal className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Kod Poligoni</div>
              <div className="text-[10px] text-slate-500">Python, JS, C++</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('majlis')}
              className="p-4 rounded-2xl bg-cyan-50/70 hover:bg-cyan-100/70 border border-cyan-200 text-left transition-all cursor-pointer group"
            >
              <Video className="w-6 h-6 text-cyan-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Video Majlis</div>
              <div className="text-[10px] text-slate-500">Jonli o&apos;quv zali</div>
            </button>

            <button
              type="button"
              onClick={onOpenFaceId}
              className="p-4 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 text-left transition-all cursor-pointer group"
            >
              <ScanFace className="w-6 h-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Face ID Kirish</div>
              <div className="text-[10px] text-slate-500">Haqiqiy biometrika</div>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BLUE CTA BANNER (100% Matching Image 2)                                */}
      {/* ========================================================================= */}
      <section className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-[#0a38af] via-[#1043cc] to-[#1e58eb] text-white p-8 sm:p-12 relative flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          {/* Confetti & Particle Glows */}
          <div className="absolute top-0 right-1/3 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Text */}
          <div className="space-y-4 max-w-xl relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Hozir boshlang – bepul ro&apos;yxatdan o&apos;ting
            </h2>
            <p className="text-sm sm:text-base text-blue-100 font-medium leading-relaxed">
              Birinchi qadam – katta muvaffaqiyatga olib boradigan yo&apos;l.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="py-3 px-8 rounded-xl bg-[#155dfc] hover:bg-blue-500 text-white font-extrabold text-sm sm:text-base border border-blue-400/40 shadow-lg shadow-black/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <span>Bepul ro&apos;yxatdan o&apos;ting</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Image Matching Image 2 */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 shrink-0">
            <img
              src="/src/assets/images/kitest_cta_students_1791123732576.jpg"
              alt="Hozir boshlang"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER (100% Matching Image 2)                                         */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-sky-100 bg-white/90 backdrop-blur-md pt-12 pb-8 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand Column */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <KitestKiteLogo size={36} showWordmark={true} />
              </div>
              <p className="text-xs text-slate-500 font-semibold tracking-wide">
                Bilim. Ilhom. Kelajak.
              </p>
            </div>

            {/* Platforma Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Platforma
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li><button type="button" onClick={() => onNavigateTab('problems')} className="hover:text-blue-600">Barcha kurslar</button></li>
                <li><button type="button" onClick={() => onNavigateTab('problems')} className="hover:text-blue-600">Kategoriyalar</button></li>
                <li><button type="button" onClick={() => onNavigateTab('leaderboard')} className="hover:text-blue-600">Sertifikatlar</button></li>
                <li><button type="button" onClick={() => onNavigateTab('majlis')} className="hover:text-blue-600">Yordam markazi</button></li>
              </ul>
            </div>

            {/* Kompaniya Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kompaniya
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li><span className="hover:text-blue-600 cursor-pointer">Biz haqimizda</span></li>
                <li><button type="button" onClick={() => onNavigateTab('blogs')} className="hover:text-blue-600">Blog</button></li>
                <li><span className="hover:text-blue-600 cursor-pointer">Karyera</span></li>
                <li><span className="hover:text-blue-600 cursor-pointer">Aloqa</span></li>
              </ul>
            </div>

            {/* Tezkor Havolalar Column */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tezkor havolalar
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li><span className="hover:text-blue-600 cursor-pointer">Shartlar</span></li>
                <li><span className="hover:text-blue-600 cursor-pointer">Maxfiylik siyosati</span></li>
                <li><span className="hover:text-blue-600 cursor-pointer">Foydalanish shartlari</span></li>
                <li><span className="hover:text-blue-600 cursor-pointer">FAQ</span></li>
              </ul>
            </div>
          </div>

          {/* Socials & Copyright */}
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2024 KITEST. Barcha huquqlar himoyalangan.
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 mr-1">Biz bilan bog&apos;laning:</span>
              <a href="#" className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                f
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                📸
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                ▶
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                ✈
              </a>
            </div>
          </div>
        </div>
      </footer>
    </KitestSkyBackground>
  );
};
