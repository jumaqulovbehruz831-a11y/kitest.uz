import React, { useState, useEffect } from 'react';
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
  Coins,
  Zap,
  Star,
  Trophy,
  CheckCircle2,
  MessageSquare,
  Radio,
  ShoppingBag,
  GraduationCap,
  ArrowRightLeft,
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
  | 'gemini_ai'
  | 'kitestgram'
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
  | 'shop'
  | 'raqamli_ustoz'
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
  onOpenCurrencyExchange?: () => void;
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
  onOpenCurrencyExchange,
  onRefreshState,
  onLogout,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const isMainAdmin =
    Boolean(isAdminUnlocked) ||
    (Boolean(currentUser) &&
      (currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
        currentUser!.role === 'admin' ||
        currentUser!.username?.toLowerCase() === 'behruz_admin'));

  const [realNotifications, setRealNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.notifications)) {
          setRealNotifications(data.notifications);
        }
      })
      .catch(() => {});
  }, [currentTab]);

  const activeNotifications = realNotifications.length > 0 ? realNotifications : [
    {
      id: 'notif_1',
      title: '🏆 Test va O\'yin Natijasi',
      text: 'O\'yinlarda 1-o\'rin uchun 3 ta ball, keyingi o\'rinlarga 1 tadan ball berilishi yoqildi!',
      time: 'Hozir',
      tab: 'gameball' as NavTab,
      icon: '🏆',
    },
    {
      id: 'notif_2',
      title: '🧑‍🏫 Google Raqamli Ustoz O\'yini Tayyor',
      text: 'Interaktiv algoritm, veb va AI vazifalarini yechib maxsus darajalarni oching!',
      time: 'Bugun',
      tab: 'raqamli_ustoz' as NavTab,
      icon: '🧑‍🏫',
    },
    {
      id: 'notif_3',
      title: '🛍️ Do\'kon & Bozor Ochildi',
      text: 'Ballaringiz evaziga sertifikatlar, yulduzlar va qurollarni xarid qiling!',
      time: 'Bugun',
      tab: 'shop' as NavTab,
      icon: '🛍️',
    },
  ];

  const unreadCount = activeNotifications.filter(
    (n) => !n.readBy?.includes(currentUser?.id || '') && !readNotifs.includes(n.id)
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 lg:px-6 py-2 flex items-center justify-between gap-3 shadow-xs">
      {/* Left side: Logo & Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title={sidebarOpen ? "Panelni yopish" : "Panelni ochish"}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
        >
          <KitestKiteLogo size={36} />
          <div className="hidden sm:block">
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-700 via-sky-600 to-indigo-600 bg-clip-text text-transparent">
              KITEST
            </span>
            <span className="ml-1 text-[10px] font-mono font-bold text-sky-600 px-1.5 py-0.5 rounded-full bg-sky-50 border border-sky-200">
              STUDIO
            </span>
          </div>
        </button>
      </div>

      {/* Middle: Search or Navigation */}
      <div className="flex-1 max-w-lg mx-2 hidden md:block">
        {onGlobalSearchChange && (
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 280)}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              placeholder="Kurslar, testlar, masalalar qidirish..."
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
          </div>
        )}
      </div>

      {/* Right Controls (Cleaned & Direct) */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* ✈️ Dedicated KitestGram Direct Online Chat Button */}
        <button
          type="button"
          onClick={() => setCurrentTab('kitestgram')}
          className={`py-1 px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            currentTab === 'kitestgram' || currentTab === 'chat'
              ? 'bg-[#2AABEE] text-white shadow-sky-500/30 ring-2 ring-sky-300'
              : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border border-sky-400/40'
          }`}
          title="KitestGram: Real-Vaqt Onlayn Yozishma va Kanallar"
        >
          <Send className="w-3.5 h-3.5 text-sky-500" />
          <span>KitestGram</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </button>

        {/* 🧑‍🏫 Raqamli Ustoz Quick Game Button */}
        <button
          type="button"
          onClick={() => setCurrentTab('raqamli_ustoz')}
          className={`py-1 px-2.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            currentTab === 'raqamli_ustoz'
              ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-300'
              : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-400/40'
          }`}
          title="Google Raqamli Ustoz: Interaktiv Ta'lim O'yini"
        >
          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Raqamli Ustoz</span>
        </button>

        {/* COIN, BALL, YULDUZ & REAL-TIME ALMASHISh SECTION */}
        {currentUser && (
          <div className="flex items-center gap-1.5">
            {/* 1. COIN (Oltin Tangalar) */}
            <button
              type="button"
              onClick={onOpenLuckyWheel}
              className="py-1 px-2 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-400/40 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title={`Oltin Tangalar (Coins): ${currentUser.coins ?? 250} ta. Baraban va Do'konda sarflanadi.`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-600 fill-amber-400 shrink-0" />
              <span className="font-mono text-amber-900 dark:text-amber-100">{currentUser.coins ?? 250}</span>
            </button>

            {/* 2. BALLAR (Jami Ochkolar) */}
            <button
              type="button"
              onClick={() => setCurrentTab('leaderboard')}
              className="py-1 px-2 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-800 dark:text-sky-200 border border-sky-400/40 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title={`Jami Ballar: ${currentUser.totalScore ?? 0} ball. Testlar, masalalar va o'yinlarda yutiladi.`}
            >
              <Zap className="w-3.5 h-3.5 text-sky-600 fill-sky-400 shrink-0" />
              <span className="font-mono text-sky-900 dark:text-sky-100">{currentUser.totalScore ?? 0}</span>
            </button>

            {/* 3. YULDUZCHALAR */}
            <button
              type="button"
              onClick={onOpenCertificatesStore}
              className="py-1 px-2 rounded-full bg-purple-500/15 hover:bg-purple-500/25 text-purple-800 dark:text-purple-200 border border-purple-400/40 text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
              title={`Yulduzchalar: ${currentUser.stars ?? 5} ta. Ball ko'paytirgich: ${currentUser.scoreMultiplier || 1}x.`}
            >
              <Star className="w-3.5 h-3.5 text-purple-600 fill-purple-400 shrink-0" />
              <span className="font-mono text-purple-900 dark:text-purple-100">{currentUser.stars ?? 5}★</span>
            </button>

            {/* Real-time Currency Exchange Button */}
            {onOpenCurrencyExchange && (
              <button
                type="button"
                onClick={onOpenCurrencyExchange}
                className="py-1 px-2 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-200 border border-indigo-400/40 text-[11px] font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title="Ball, Coins va Yulduzlarni bir zumda almashtirish"
              >
                <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
                <span className="hidden sm:inline">Almashish</span>
              </button>
            )}

            {/* 4. DO'KON TUGMASI */}
            <button
              type="button"
              onClick={() => setCurrentTab('shop')}
              className={`py-1 px-2.5 rounded-full text-xs font-black flex items-center gap-1 transition-all shadow-xs cursor-pointer ${
                currentTab === 'shop'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-400/40'
              }`}
              title="Do'kon: Ballar evaziga barcha tovarlarni sotib oling!"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Do'kon</span>
            </button>
          </div>
        )}

        {/* Theme Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className={`py-1.5 px-2 rounded-full text-xs font-black flex items-center gap-1 transition-all cursor-pointer border ${
              theme === 'light'
                ? 'bg-amber-100/80 hover:bg-amber-200 text-amber-800 border-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={theme === 'light' ? 'Tun rejimi' : 'Kun rejimi'}
          >
            {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-sky-300" />}
          </button>
        )}

        {/* Admin Panel button if unlocked */}
        {isMainAdmin && (
          <button
            type="button"
            onClick={() => setCurrentTab('admin')}
            className={`py-1.5 px-3 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              currentTab === 'admin'
                ? 'bg-amber-600 text-white shadow-amber-600/30'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/30'
            }`}
            title="Admin Panel"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Real Notification Bell with Popup */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Real Bildirishnomalar"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-slate-900">Platforma Bildirishnomalari</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                      {unreadCount} ta yangi
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReadNotifs(activeNotifications.map((n) => n.id));
                    if (currentUser) {
                      activeNotifications.forEach((n) => {
                        fetch(`/api/notifications/${n.id}/read`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId: currentUser.id }),
                        }).catch(() => {});
                      });
                    }
                  }}
                  className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  Barchasini o'qildi qilish
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activeNotifications.map((notif) => {
                  const isRead =
                    notif.readBy?.includes(currentUser?.id || '') ||
                    readNotifs.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        setReadNotifs((prev) => [...prev, notif.id]);
                        if (currentUser) {
                          fetch(`/api/notifications/${notif.id}/read`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: currentUser.id }),
                          }).catch(() => {});
                        }
                        if (notif.tab) setCurrentTab(notif.tab as NavTab);
                        if (notif.action) notif.action();
                        setNotificationsOpen(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isRead
                          ? 'bg-slate-50 border-slate-200 text-slate-600 opacity-80'
                          : 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs hover:bg-blue-100/70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg shrink-0">{notif.icon || '📢'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              {notif.time || 'Hozir'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{notif.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar + Direct Log Out Button */}
        {currentUser ? (
          <div className="relative flex items-center gap-1.5 pl-1 border-l border-slate-200">
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Profil va sozlamalar"
            >
              <img
                src={currentUser.avatarUrl || '/src/assets/images/founder_creator_portrait_1790488399852.jpg'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Chiqish (Log out) Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Tizimdan chiqish (Log out)"
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
