import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TestItem,
  User,
  Submission,
  Contest,
  ADMIN_EMAIL,
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
  Megaphone,
  Bell,
  Calendar,
  Pin,
  Play,
  Edit3,
  ExternalLink,
  Plus,
  Trash2,
  X,
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
  onOpenImageShowcase?: (imgOrUrl?: any) => void;
  onUpdateUser?: (user: User) => void;
  onRefreshState?: () => void;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: 'olimpiada' | 'coding' | 'yangilik' | 'tanlov';
  categoryLabel: string;
  categoryColor: string;
  emoji: string;
  date: string;
  isPinned?: boolean;
  linkUrl?: string;
  videoUrl?: string;
  targetTab?: NavTab;
  isGalleryTrigger?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tests,
  users,
  submissions,
  currentUser,
  isAdminUnlocked,
  onSelectTest,
  onNavigate,
  onOpenCertificatesStore,
  onOpenLuckyWheel,
  onOpenImageShowcase,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Barchasi');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [announcementCategory, setAnnouncementCategory] = useState<
    'all' | 'olimpiada' | 'coding' | 'yangilik'
  >('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');

  const isUserAdmin = Boolean(
    isAdminUnlocked ||
      currentUser?.role === 'admin' ||
      currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser?.username === 'behruz_admin'
  );

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const saved = localStorage.getItem('kitest_announcements_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'ann_1',
        title: '🏆 Respublika CHSB & Matematika Fan Olimpiadasi Boshlandi!',
        category: 'olimpiada',
        categoryLabel: 'Fan Olimpiadasi',
        categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
        emoji: '🏆',
        date: '24-Oktyabr, 2026',
        isPinned: true,
        content:
          'Barcha 5-11 sinf o‘quvchilari va abituriyentlar uchun yangi bosqich masalalari ochildi. Eng yuqori ball to‘plagan 3 kishiga rasmiy Oltin sertifikat va sovg‘alar taqdim etiladi.',
        targetTab: 'contests',
      },
      {
        id: 'ann_2',
        title: '🚀 Kiteshot 3D Real-Time Duel & Yangi Harakat Mexanikasi',
        category: 'coding',
        categoryLabel: 'Kiteshot 3D',
        categoryColor: 'bg-sky-100 text-sky-800 border-sky-300',
        emoji: '🎮',
        date: '23-Oktyabr, 2026',
        isPinned: true,
        content:
          'Roblox Hypershot uslubidagi harakatlar, raqiblarning lazer bilan otishi, o‘lganda qayta paydo bo‘lish (respawn) va himoya qalqoni tizimi ishga tushirildi! 1-o‘rin egalariga 3 ta ball beriladi.',
        targetTab: 'gameball',
      },
      {
        id: 'ann_3',
        title: '🤖 KitestAI Pro: Ultra-Tezkor Intellektual Neyrotizim Ishga Tushdi!',
        category: 'yangilik',
        categoryLabel: 'KitestAI Pro',
        categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        emoji: '⚡',
        date: 'Bugun',
        isPinned: true,
        content:
          'Matematika, Fizika, Dasturlash va barcha fan savollariga ultra-tezkor va xotirali rejimda 100% mukammal javob beruvchi yangi intellektual assistent tayyor!',
        targetTab: 'gemini_ai',
      },
      {
        id: 'ann_4',
        title: '✈️ KitestGram: Telegram Dek Haqiqiy Onlayn Muloqot',
        category: 'yangilik',
        categoryLabel: 'KitestGram',
        categoryColor: 'bg-sky-100 text-sky-800 border-sky-300',
        emoji: '✈️',
        date: 'Bugun',
        isPinned: true,
        content:
          'Telegram ko‘rinishidagi xabarlar, kanallar, guruhlar, ovozli xabarlar va jonli emotsiyalar bilan real vaqtda yozishing!',
        targetTab: 'kitestgram',
      },
    ];
  });

  useEffect(() => {
    fetch('/api/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (
          data &&
          Array.isArray(data.announcements) &&
          data.announcements.length > 0
        ) {
          setAnnouncements(data.announcements);
          try {
            localStorage.setItem(
              'kitest_announcements_v2',
              JSON.stringify(data.announcements)
            );
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annFormData, setAnnFormData] = useState<{
    title: string;
    content: string;
    category: 'olimpiada' | 'coding' | 'yangilik' | 'tanlov';
    categoryLabel: string;
    emoji: string;
    linkUrl: string;
    videoUrl: string;
    targetTab: NavTab;
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    category: 'yangilik',
    categoryLabel: 'Yangilik',
    emoji: '📢',
    linkUrl: '',
    videoUrl: '',
    targetTab: 'problems',
    isPinned: false,
  });

  const handleOpenCreateAnnouncement = () => {
    setEditingAnnId(null);
    setAnnFormData({
      title: '',
      content: '',
      category: 'yangilik',
      categoryLabel: 'Yangilik',
      emoji: '📢',
      linkUrl: '',
      videoUrl: '',
      targetTab: 'problems',
      isPinned: false,
    });
    setIsAnnModalOpen(true);
  };

  const handleOpenEditAnnouncement = (ann: AnnouncementItem) => {
    setEditingAnnId(ann.id);
    setAnnFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      categoryLabel: ann.categoryLabel,
      emoji: ann.emoji || '📢',
      linkUrl: ann.linkUrl || '',
      videoUrl: ann.videoUrl || '',
      targetTab: ann.targetTab || 'problems',
      isPinned: Boolean(ann.isPinned),
    });
    setIsAnnModalOpen(true);
  };

  const handleSaveAnnouncement = async () => {
    if (!annFormData.title.trim()) {
      alert("Iltimos, e'lon sarlavhasini kiriting!");
      return;
    }

    let cleanVideo = annFormData.videoUrl.trim();
    if (cleanVideo.includes('watch?v=')) {
      cleanVideo = cleanVideo.replace('watch?v=', 'embed/');
    }

    const payload = {
      title: annFormData.title.trim(),
      content: annFormData.content.trim(),
      category: annFormData.category,
      categoryLabel: annFormData.categoryLabel,
      emoji: annFormData.emoji,
      linkUrl: annFormData.linkUrl.trim() || undefined,
      videoUrl: cleanVideo || undefined,
      targetTab: annFormData.targetTab,
      isPinned: annFormData.isPinned,
    };

    if (editingAnnId) {
      // Edit existing
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === editingAnnId ? { ...item, ...payload } : item
        )
      );
      try {
        await fetch(`/api/admin/announcements/${editingAnnId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    } else {
      // Create new
      const newAnn: AnnouncementItem = {
        id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: 'Bugun',
        categoryColor:
          annFormData.category === 'olimpiada'
            ? 'bg-amber-100 text-amber-800 border-amber-300'
            : annFormData.category === 'coding'
            ? 'bg-sky-100 text-sky-800 border-sky-300'
            : 'bg-indigo-100 text-indigo-800 border-indigo-300',
        ...payload,
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
      try {
        await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {}
    }

    setIsAnnModalOpen(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Rostdan ham ushbu e'lonni o'chirmoqchimisiz?")) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      try {
        await fetch(`/api/admin/announcements/${id}`, {
          method: 'DELETE',
        });
      } catch {}
    }
  };

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
    const list = Array.from(new Set(tests.map((t) => t.subject))).filter(
      (s) => Boolean(s) && s !== 'Barchasi'
    );
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
      {/* 2. E'LONLAR VA YANGILIKLAR DOSKASI (ADMIN BOSHQARADI: LINK, VIDEO, YOZUV, EMOTSIYA, PERIXOD) */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 font-mono text-[11px] font-bold">
                <Pin className="w-3 h-3 text-amber-600" />
                <span>RASMIY E'LONLAR & YANGILIKLAR</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Muhim Xabarlar & Maxsus E'lonlar
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Admin Add Announcement Button */}
            {isUserAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateAnnouncement}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>E'lon Qo'shish (Admin)</span>
              </button>
            )}

            {onOpenImageShowcase && (
              <button
                type="button"
                onClick={() => onOpenImageShowcase()}
                className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>🖼️ Fotogalereya</span>
              </button>
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {[
                { id: 'all', label: 'Barchasi' },
                { id: 'olimpiada', label: '🏆 Olimpiada' },
                { id: 'coding', label: '🎮 Kiteshot' },
                { id: 'yangilik', label: '⚡ Yangilik' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAnnouncementCategory(tab.id as any)}
                  className={`py-1.5 px-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs ${
                    announcementCategory === tab.id
                      ? 'bg-white text-slate-900 shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Announcement Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {announcements
            .filter((item) =>
              announcementCategory === 'all' ? true : item.category === announcementCategory
            )
            .map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                  item.isPinned
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-sm'
                    : 'border-slate-200 hover:border-sky-300 bg-white hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Category + Date + Emoji */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{item.emoji || '📢'}</span>
                      <span className={`px-2.5 py-0.5 rounded-md font-bold border text-[11px] ${item.categoryColor || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                        {item.categoryLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300/60">
                          <Pin className="w-3 h-3 fill-current" />
                          Qadalgan
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-slate-400">{item.date}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {item.title}
                  </h3>

                  {/* Text / Content */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>

                  {/* Optional Video Embed */}
                  {item.videoUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 shadow-inner mt-2">
                      <iframe
                        src={item.videoUrl}
                        title={item.title}
                        className="w-full h-full object-cover"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Perixod */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    {/* External Link */}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                        <span>Havola</span>
                      </a>
                    )}

                    {/* Navigation Perixod */}
                    {item.targetTab && (
                      <button
                        type="button"
                        onClick={() => onNavigate(item.targetTab!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-sm transition-all cursor-pointer"
                      >
                        <span>Bo'limga o'tish</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {item.isGalleryTrigger && (
                      <button
                        type="button"
                        onClick={() => onOpenImageShowcase?.()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Rasmlarni ko'rish</span>
                      </button>
                    )}
                  </div>

                  {/* Admin Edit & Delete buttons */}
                  {isUserAdmin && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleOpenEditAnnouncement(item)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Admin Announcement Creation / Edit Modal */}
        {isAnnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{annFormData.emoji || '📢'}</span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      {editingAnnId ? "E'lonni Tahrirlash" : "Yangi E'lon Qo'shish"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Foydalanuvchilarga ko'rinadigan muhim yangilik va perixod
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Sarlavha */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">
                    Sarlavha (Yozuv): *
                  </label>
                  <input
                    type="text"
                    value={annFormData.title}
                    onChange={(e) =>
                      setAnnFormData({ ...annFormData, title: e.target.value })
                    }
                    placeholder="Masalan: 🏆 Katta Respublika Olimpiadasi boshlandi!"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Yozuv / Matn */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">
                    Batafsil matn (Yozuv):
                  </label>
                  <textarea
                    rows={3}
                    value={annFormData.content}
                    onChange={(e) =>
                      setAnnFormData({ ...annFormData, content: e.target.value })
                    }
                    placeholder="E'lon haqida to'liq tushuntirish va shartlar..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Emotsiya & Kategoriya */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-700 mb-1">
                      Emotsiya (Stiker):
                    </label>
                    <div className="flex items-center gap-1.5">
                      {['📢', '🏆', '🚀', '🤖', '🎮', '💎'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setAnnFormData({ ...annFormData, emoji: em })}
                          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border cursor-pointer ${
                            annFormData.emoji === em
                              ? 'border-amber-500 bg-amber-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 mb-1">
                      Kategoriya:
                    </label>
                    <select
                      value={annFormData.category}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        const labelMap: Record<string, string> = {
                          yangilik: 'Yangilik',
                          olimpiada: 'Fan Olimpiadasi',
                          coding: 'Kiteshot 3D',
                          tanlov: 'Maxsus Tanlov',
                        };
                        setAnnFormData({
                          ...annFormData,
                          category: val,
                          categoryLabel: labelMap[val] || 'Yangilik',
                        });
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="yangilik">⚡ Yangilik</option>
                      <option value="olimpiada">🏆 Fan Olimpiadasi</option>
                      <option value="coding">🎮 Kiteshot 3D</option>
                      <option value="tanlov">🎯 Maxsus Tanlov</option>
                    </select>
                  </div>
                </div>

                {/* Video havola */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">
                    Video havola (YouTube / embed):
                  </label>
                  <input
                    type="text"
                    value={annFormData.videoUrl}
                    onChange={(e) =>
                      setAnnFormData({ ...annFormData, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/embed/... yoki watch?v=..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Tashqi Link */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">
                    Tashqi Link (Havola):
                  </label>
                  <input
                    type="text"
                    value={annFormData.linkUrl}
                    onChange={(e) =>
                      setAnnFormData({ ...annFormData, linkUrl: e.target.value })
                    }
                    placeholder="https://t.me/... yoki https://kitest.uz/..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Perixod (Target Tab) */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">
                    Perixod (Bo'limga o'tish tugmasi):
                  </label>
                  <select
                    value={annFormData.targetTab}
                    onChange={(e) =>
                      setAnnFormData({
                        ...annFormData,
                        targetTab: e.target.value as NavTab,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="problems">📚 Testlar & Masalalar (problems)</option>
                    <option value="contests">🏆 Fan Olimpiadalari (contests)</option>
                    <option value="gameball">🎮 Kiteshot 3D O'yini (gameball)</option>
                    <option value="gemini_ai">🤖 KitestAI Gemini Universal (gemini_ai)</option>
                    <option value="kitestgram">✈️ KitestGram Onlayn Chat (kitestgram)</option>
                    <option value="majlis">🎥 Jonli Video Majlis (majlis)</option>
                    <option value="courses">🎓 Onlayn Kurslar (courses)</option>
                    <option value="duels">⚔️ Jonli Duellar (duels)</option>
                    <option value="leaderboard">🏅 Reyting & Pes HQadamlar (leaderboard)</option>
                  </select>
                </div>

                {/* Pinned checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPinnedCheck"
                    checked={annFormData.isPinned}
                    onChange={(e) =>
                      setAnnFormData({ ...annFormData, isPinned: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="isPinnedCheck"
                    className="font-bold text-slate-700 cursor-pointer select-none"
                  >
                    Ushbu e'lonni yuqoriga qadash (Pinned)
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {editingAnnId ? "Saqlash" : "E'lonni Chiqarish"}
                </button>
              </div>
            </div>
          </div>
        )}
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
          {subjectsList.slice(0, 7).map((sub, sIdx) => (
            <button
              key={`home_subj_${sub}_${sIdx}`}
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
          {filteredTests.slice(0, 6).map((test, tIdx) => (
            <div
              key={`home_test_${test.id}_${tIdx}`}
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
