import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ProblemList } from './components/ProblemList';
import { ProblemDetail } from './components/ProblemDetail';
import { TelegramQuizBuilder } from './components/TelegramQuizBuilder';
import { ContestView } from './components/ContestView';
import { SubmissionsView } from './components/SubmissionsView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { KitestEmblem, playKitestSound } from './components/KitestEmblem';
import { User, TestItem, Submission, Contest, ADMIN_EMAIL } from './types';

const AUTH_STORAGE_KEY = 'robocontest_clean_user_v2';
const THEME_STORAGE_KEY = 'kitest_theme_mode';
const SOUND_STORAGE_KEY = 'kitest_sound_enabled';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);

  // Theme state: 'dark' (Tun rejimi) or 'light' (Kun rejimi)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {}
    return 'dark';
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  const handleToggleTheme = () => {
    playKitestSound('click', soundEnabled);
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {}
      if (next) playKitestSound('click', true);
      return next;
    });
  };

  // Real platform state fetched from server (starts 100% empty)
  const [users, setUsers] = useState<User[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [creatorEmails, setCreatorEmails] = useState<string[]>([ADMIN_EMAIL]);

  // Authenticated user (null until user logs in or registers)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      localStorage.removeItem('kitest_user');
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [prefillAdmin, setPrefillAdmin] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchPlatformState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) return;
      const data = await res.json();

      const serverUsers: User[] = Array.isArray(data.users) ? data.users : [];
      const serverTests: TestItem[] = Array.isArray(data.tests) ? data.tests : [];
      const serverSubmissions: Submission[] = Array.isArray(data.submissions)
        ? data.submissions
        : [];
      const serverContests: Contest[] = Array.isArray(data.contests)
        ? data.contests
        : [];
      const serverCreatorEmails: string[] = Array.isArray(data.creatorEmails)
        ? data.creatorEmails
        : [ADMIN_EMAIL];

      setUsers(serverUsers);
      setTests(serverTests);
      setSubmissions(serverSubmissions);
      setContests(serverContests);
      setCreatorEmails(serverCreatorEmails);

      setCurrentUser((prev) => {
        if (!prev) return null;
        const found = serverUsers.find(
          (u) =>
            u.id === prev.id ||
            u.email.toLowerCase() === prev.email.toLowerCase()
        );
        if (found) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
          return found;
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlatformState();
  }, [fetchPlatformState]);

  const handleAuthSuccess = (user: User, openAdminAfter?: boolean) => {
    playKitestSound('success', soundEnabled);
    setCurrentUser(user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    fetchPlatformState();
    if (openAdminAfter && user.email.toLowerCase() === ADMIN_EMAIL) {
      setCurrentTab('admin');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (currentTab === 'admin' || currentTab === 'create_test') {
      setCurrentTab('home');
    }
  };

  const handleSelectTest = (test: TestItem) => {
    playKitestSound('click', soundEnabled);
    setSelectedTest(test);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        theme === 'light'
          ? 'kitest-bg-light text-slate-900'
          : 'kitest-bg-dark text-slate-100'
      }`}
    >
      {/* Top Animated Motto Ribbon: "DUNYO YOSHLAR QO'LIDA" */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-sky-950/90 border-b border-emerald-500/20 py-1.5 px-4 overflow-hidden">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 text-xs">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 font-bold tracking-wider text-emerald-300"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>DUNYO YOSHLAR QO'LIDA!</span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-slate-300 font-normal hidden sm:inline">
              KITEST Rasmiy CHSB va Telegram Quiz Imtihon Platformasi
            </span>
          </motion.div>

          <div className="text-[11px] font-mono text-slate-400 hidden md:block">
            Testlar: <strong className="text-emerald-400">{tests.length}</strong> · Ishtirokchilar:{' '}
            <strong className="text-sky-400">{users.length}</strong>
          </div>
        </div>
      </div>

      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          playKitestSound('click', soundEnabled);
          setSelectedTest(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenLogin={(adminPrefill = false) => {
          setPrefillAdmin(Boolean(adminPrefill));
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onOpenRegister={() => {
          setPrefillAdmin(false);
          setAuthMode('register');
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {selectedTest ? (
            <motion.div
              key={`test-${selectedTest.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ProblemDetail
                test={selectedTest}
                currentUser={currentUser}
                soundEnabled={soundEnabled}
                onBack={() => setSelectedTest(null)}
                onRequireLogin={() => {
                  setPrefillAdmin(false);
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                onSubmissionComplete={(_submission, updatedUser, updatedTest) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
                  setSelectedTest(updatedTest);
                  fetchPlatformState();
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {currentTab === 'home' ? (
                <HomeView
                  tests={tests}
                  users={users}
                  submissions={submissions}
                  contests={contests}
                  currentUser={currentUser}
                  soundEnabled={soundEnabled}
                  onSelectTest={handleSelectTest}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onOpenAuth={(mode, adminPrefill = false) => {
                    setPrefillAdmin(Boolean(adminPrefill));
                    setAuthMode(mode);
                    setIsAuthOpen(true);
                  }}
                />
              ) : currentTab === 'problems' ? (
                <ProblemList
                  tests={tests}
                  submissions={submissions}
                  currentUser={currentUser}
                  onSelectTest={handleSelectTest}
                  onOpenCreateTest={() => setCurrentTab('create_test')}
                />
              ) : currentTab === 'create_test' ? (
                <TelegramQuizBuilder
                  currentUser={currentUser}
                  soundEnabled={soundEnabled}
                  onTestCreated={(newTest) => {
                    fetchPlatformState();
                    setCurrentTab('problems');
                    setSelectedTest(newTest);
                  }}
                  onCancel={() => setCurrentTab('problems')}
                />
              ) : currentTab === 'contests' ? (
                <ContestView
                  contests={contests}
                  tests={tests}
                  submissions={submissions}
                  currentUser={currentUser}
                  onSelectTest={handleSelectTest}
                  onRequireLogin={() => {
                    setPrefillAdmin(false);
                    setAuthMode('login');
                    setIsAuthOpen(true);
                  }}
                  onRefreshState={fetchPlatformState}
                />
              ) : currentTab === 'submissions' ? (
                <SubmissionsView
                  submissions={submissions}
                  currentUser={currentUser}
                />
              ) : currentTab === 'leaderboard' ? (
                <LeaderboardView users={users} currentUser={currentUser} />
              ) : currentTab === 'admin' ? (
                <AdminPanel
                  currentUser={currentUser}
                  users={users}
                  tests={tests}
                  contests={contests}
                  creatorEmails={creatorEmails}
                  onRefreshState={fetchPlatformState}
                  onOpenCreateTest={() => setCurrentTab('create_test')}
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <KitestEmblem size="sm" showVerifiedSeal={true} />
            <span>· © {new Date().getFullYear()} Dunyo yoshlar qo'lida</span>
          </div>
          <div>
            Bosh Admin: <span className="text-slate-400 font-mono">{ADMIN_EMAIL}</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        prefillAdmin={prefillAdmin}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        user={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
          fetchPlatformState();
        }}
      />
    </div>
  );
}
