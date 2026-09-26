import React from 'react';
import { motion } from 'motion/react';
import { User, ADMIN_EMAIL } from '../types';
import { KitestEmblem } from './KitestEmblem';
import {
  PlusCircle,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Volume2,
  VolumeX,
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'problems'
  | 'contests'
  | 'submissions'
  | 'leaderboard'
  | 'create_test'
  | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  currentUser: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenLogin: (prefillAdmin?: boolean) => void;
  onOpenRegister: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenLogin,
  onOpenRegister,
  onOpenProfile,
  onLogout,
}) => {
  const isAdmin =
    Boolean(currentUser) &&
    currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL;
  const isCreatorOrAdmin =
    isAdmin || (Boolean(currentUser) && currentUser!.role === 'creator');

  const navLinks: { id: NavTab; label: string; show: boolean }[] = [
    { id: 'home', label: 'Bosh sahifa', show: true },
    { id: 'problems', label: 'Testlar', show: true },
    { id: 'contests', label: 'Olimpiadalar', show: true },
    { id: 'submissions', label: 'Urinishlar', show: true },
    { id: 'leaderboard', label: 'Reyting', show: true },
    { id: 'create_test', label: 'Test yaratish', show: isCreatorOrAdmin },
    { id: 'admin', label: 'Admin panel', show: isAdmin },
  ];

  const getRoleLabel = (user: User) => {
    if (user.email.toLowerCase() === ADMIN_EMAIL) return 'Bosh Admin';
    if (user.role === 'creator') return 'Yaratuvchi';
    return 'Ishtirokchi';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1120]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand: KITEST + Special Emblem & Badge */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => setCurrentTab('home')}
            className="text-left focus:outline-none hover:opacity-95 transition-opacity"
          >
            <KitestEmblem size="md" showVerifiedSeal={true} />
          </button>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks
              .filter((item) => item.show)
              .map((item) => {
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`relative py-5 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.id === 'create_test' && (
                      <PlusCircle className="w-4 h-4 text-sky-400" />
                    )}
                    {item.id === 'admin' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="kitest-nav-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full"
                      />
                    )}
                  </button>
                );
              })}

            {!currentUser && (
              <button
                onClick={() => onOpenLogin(true)}
                className="py-1.5 px-3 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Controls: Sound Toggle + Kun/Tun Mode + User / Auth */}
        <div className="flex items-center gap-2">
          {/* Interactive Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Ovoz effektlari yoqilgan' : 'Ovoz effektlari o‘chirilgan'}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Modern Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Kun rejimiga o‘tish' : 'Tun rejimiga o‘tish'}
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Tun</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Kun</span>
              </>
            )}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {isAdmin && currentTab !== 'admin' && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className="hidden sm:flex py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
              )}

              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-slate-100 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-1.5">
                    <span>{getRoleLabel(currentUser)}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold">
                      {currentUser.totalScore} ball
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={onLogout}
                title="Tizimdan chiqish"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenLogin(false)}
                className="py-2 px-3.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>
              <button
                onClick={onOpenRegister}
                className="py-2 px-3.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ro'yxatdan o'tish</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden border-t border-slate-800/80 px-4 py-2 flex items-center gap-3 overflow-x-auto no-scrollbar">
        {navLinks
          .filter((item) => item.show)
          .map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`text-xs font-medium whitespace-nowrap py-1.5 px-2.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.id === 'create_test' && <PlusCircle className="w-3.5 h-3.5" />}
                {item.id === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            );
          })}

        {!currentUser && (
          <button
            onClick={() => onOpenLogin(true)}
            className="text-xs font-semibold whitespace-nowrap py-1.5 px-2.5 rounded-md bg-emerald-600/20 text-emerald-400 flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Panel</span>
          </button>
        )}
      </div>
    </header>
  );
};
