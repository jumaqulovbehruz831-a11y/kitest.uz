import React, { useState } from 'react';
import {
  User,
  TestItem,
  ADMIN_EMAIL,
  computeRankClass,
  RANK_CLASS_META,
  STAR_COLOR_META,
  StarColor,
} from '../types';
import { KitestKiteLogo } from './KitestKiteLogo';
import {
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  PanelLeft,
  HelpCircle,
  Search,
  Settings,
  X,
  ChevronDown,
  Bell,
  ShieldCheck,
  RefreshCw,
  Crown,
  Sparkles,
  Send,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'auth_portal'
  | 'problems'
  | 'tests'
  | 'tests_list'
  | 'duels'
  | 'code_arena'
  | 'activity_map'
  | 'courses'
  | 'books_3d'
  | 'study_plans'
  | 'algorithms'
  | 'roadmap'
  | 'my_classes'
  | 'create_test'
  | 'contests'
  | 'submissions'
  | 'leaderboard'
  | 'all_users'
  | 'subscriptions'
  | 'blogs'
  | 'chat'
  | 'majlis'
  | 'gameball'
  | 'how_it_works'
  | 'our_team'
  | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenBgCustomizer?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  chatMessagesCount?: number;
  coursesCount?: number;
  contestsCount?: number;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenAdminModal: () => void;
  onOpenProfile: () => void;
  onOpenCertificatesStore: () => void;
  onOpenLuckyWheel: () => void;
  onOpenOnboardingGuide?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (q: string) => void;
  tests?: TestItem[];
  onSelectTest?: (test: TestItem) => void;
  onOpenPremium?: () => void;
  onRefreshState?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  isAdminUnlocked = false,
  theme,
  onToggleTheme,
  onOpenBgCustomizer,
  soundEnabled = true,
  onToggleSound,
  sidebarOpen = true,
  onToggleSidebar,
  onOpenLogin,
  onOpenRegister,
  onOpenAdminModal,
  onOpenProfile,
  onOpenCertificatesStore,
  onOpenLuckyWheel,
  onOpenOnboardingGuide,
  globalSearchQuery = '',
  onGlobalSearchChange,
  tests = [],
  onSelectTest,
  onOpenPremium,
  onRefreshState,
  onLogout,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const isMainAdmin =
    Boolean(isAdminUnlocked) ||
    (Boolean(currentUser) &&
      (currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
        currentUser!.role === 'admin' ||
        currentUser!.username?.toLowerCase() === 'behruz_admin'));

  // Nav links matching 53B5s.jpg
  const mainNavLinks: { label: string; tab: NavTab }[] = [
    { label: 'Kurslar', tab: 'courses' },
    { label: "Yo'nalishlar", tab: 'problems' },
    { label: "O'qituvchilar", tab: 'majlis' },
    { label: 'Yutuqlar', tab: 'leaderboard' },
    { label: 'Kitobxonlar uchun', tab: 'books_3d' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-sm text-slate-800">
      {/* Left: Mobile Sidebar Toggle + Wide Search Bar matching image.png */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 sm:hidden"
            title={sidebarOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Global Real-time Search matching image.png: Kurslarni qidirish... */}
        {onGlobalSearchChange && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 280)}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchFocused(false);
                  return;
                }
                if (e.key === 'Enter' && globalSearchQuery.trim()) {
                  const q = globalSearchQuery.trim().toLowerCase();
                  const matched = tests.filter(
                    (t) =>
                      t.title.toLowerCase().includes(q) ||
                      t.subject.toLowerCase().includes(q) ||
                      String(t.id).includes(q)
                  );
                  if (matched.length > 0 && onSelectTest) {
                    onSelectTest(matched[0]);
                  } else {
                    setCurrentTab('problems');
                  }
                  setSearchFocused(false);
                }
              }}
              placeholder="Kurslarni qidirish..."
              className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
            />
            {globalSearchQuery && (
              <button
                type="button"
                onClick={() => onGlobalSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Instant Search Popup Dropdown */}
            {searchFocused && globalSearchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 space-y-2 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-600 px-1">
                  <span>🔍 Natijalar: &quot;{globalSearchQuery}&quot;</span>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setCurrentTab('problems');
                      setSearchFocused(false);
                    }}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    Barchasini ko&apos;rish →
                  </button>
                </div>

                {/* Matching Tests & Platform Modules */}
                {(() => {
                  const q = globalSearchQuery.trim().toLowerCase();
                  const matchedModules = [
                    { id: 'duels', title: '1v1 Test Duellari', tab: 'duels' as NavTab, icon: '⚔️' },
                    { id: 'create_test', title: 'Sun\'iy Intellekt (AI Savol Tuzish)', tab: 'create_test' as NavTab, icon: '🧠' },
                    { id: 'books_3d', title: '3D Varaqlanadigan Kitoblar', tab: 'books_3d' as NavTab, icon: '📚' },
                    { id: 'contests', title: 'Olimpiadalar & ICPC', tab: 'contests' as NavTab, icon: '🏆' },
                    { id: 'code_arena', title: 'Kod Poligoni (Python, JS, C++)', tab: 'code_arena' as NavTab, icon: '💻' },
                    { id: 'majlis', title: 'Video Majlis & Darsxona', tab: 'majlis' as NavTab, icon: '🎥' },
                  ].filter((m) => m.title.toLowerCase().includes(q) || m.id.includes(q));

                  const matched = tests
                    .filter(
                      (t) =>
                        t.title.toLowerCase().includes(q) ||
                        t.subject.toLowerCase().includes(q) ||
                        String(t.id).includes(q)
                    )
                    .slice(0, 5);

                  if (matched.length === 0 && matchedModules.length === 0) {
                    return (
                      <div className="py-2 text-center text-xs text-slate-400">
                        Mos kurs, modul yoki test topilmadi.{' '}
                        <button
                          type="button"
                          onMouseDown={() => {
                            setCurrentTab('create_test');
                            setSearchFocused(false);
                          }}
                          className="text-blue-600 font-bold hover:underline cursor-pointer"
                        >
                          AI bilan yaratish →
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {/* Matching Platform Modules */}
                      {matchedModules.map((m) => (
                        <button
                          key={`nav_mod_${m.id}`}
                          type="button"
                          onMouseDown={() => {
                            setCurrentTab(m.tab);
                            setSearchFocused(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-sky-50 flex items-center justify-between gap-2 transition-colors cursor-pointer border border-sky-100/60"
                        >
                          <div className="flex items-center gap-2">
                            <span>{m.icon}</span>
                            <span className="text-xs font-bold text-slate-800">{m.title}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                            Modul
                          </span>
                        </button>
                      ))}

                      {/* Matching Tests */}
                      {matched.map((t) => (
                        <button
                          key={`nav_test_${t.id}`}
                          type="button"
                          onMouseDown={() => {
                            if (onSelectTest) {
                              onSelectTest(t);
                            } else {
                              setCurrentTab('problems');
                            }
                            setSearchFocused(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-blue-50/70 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              #{t.id} · {t.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {t.subject} · {t.questions.length} ta savol
                            </div>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                            Ochish
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls matching image.png */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Telegram Channel Button (t.me/kitestai) */}
        <a
          href="https://t.me/kitestai"
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-3 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 hover:text-sky-700 border border-sky-500/25 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          title="Rasmiy Telegram Kanalimiz: t.me/kitestai"
        >
          <Send className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline font-mono text-[11px]">@kitestai</span>
        </a>

        {/* Kun / Tun Rejimi (Light / Dark mode toggle) */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`py-1.5 px-2.5 sm:px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
              theme === 'light'
                ? 'bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={theme === 'light' ? 'Tun rejimiga o‘tish (Dark Mode)' : 'Kun rejimiga o‘tish (Light Mode)'}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline text-[11px]">Kun</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-300" />
                <span className="hidden sm:inline text-[11px]">Tun</span>
              </>
            )}
          </button>
        )}

        {isMainAdmin && (
          <button
            type="button"
            onClick={() => setCurrentTab('admin')}
            className={`py-1.5 px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              currentTab === 'admin'
                ? 'bg-amber-600 text-white shadow-amber-600/30'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/30'
            }`}
            title="Boshqaruv Paneli (@behruz_admin)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        )}

        {/* Refresh (↻) Button */}
        {onRefreshState && (
          <button
            type="button"
            onClick={onRefreshState}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
            title="Yangilash (Refresh)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Premium VIP Badge Button */}
        {onOpenPremium && (
          <button
            type="button"
            onClick={onOpenPremium}
            className={`py-1 px-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              currentUser?.isPremium
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-amber-500/20'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
            title="KITEST VIP Premium"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="hidden sm:inline">
              {currentUser?.isPremium ? 'VIP Premium' : 'Premium'}
            </span>
          </button>
        )}

        {/* Notification Bell with Badge (3) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenLuckyWheel) onOpenLuckyWheel();
          }}
          className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          title="Bildirishnomalar (3 ta yangi)"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shadow-sm">
            3
          </span>
        </button>

        {/* Help Circle */}
        {onOpenOnboardingGuide && (
          <button
            type="button"
            onClick={onOpenOnboardingGuide}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Yordam va Yo'riqnoma"
          >
            <HelpCircle className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* User Circular Avatar with dropdown arrow matching image.png */}
        {currentUser ? (
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <img
                src={currentUser.avatarUrl || '/src/assets/images/founder_creator_portrait_1790488399852.jpg'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenLogin}
              className="py-2 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Kirish
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
