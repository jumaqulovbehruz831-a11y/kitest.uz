import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar, NavTab } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { KitestSkyLandingView } from './components/KitestSkyLandingView';
import { FaceIdScannerModal } from './components/FaceIdScannerModal';
import { ProblemList } from './components/ProblemList';
import { ProblemDetail } from './components/ProblemDetail';
import { TelegramQuizBuilder } from './components/TelegramQuizBuilder';
import { ContestView } from './components/ContestView';
import { CoursesView } from './components/CoursesView';
import { SubmissionsView } from './components/SubmissionsView';
import { LeaderboardView } from './components/LeaderboardView';
import { OnlineChatView } from './components/OnlineChatView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { AdminAuthModal, ADMIN_PASSCODE_VALUE } from './components/AdminAuthModal';
import {
  ProfileModal,
  readAndOptimizeAvatarFile,
} from './components/ProfileModal';
import { CertificateModal } from './components/CertificateModal';
import { CertificatesStoreModal } from './components/CertificatesStoreModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';
import { Books3DView } from './components/Books3DView';
import { FlyingKitesAndEmotionsOverlay } from './components/FlyingKitesAndEmotionsOverlay';
import { MajlisView } from './components/MajlisView';
import { InteractiveTutorialModal } from './components/InteractiveTutorialModal';
import { PremiumModal } from './components/PremiumModal';
import { KiteshotGameView } from './components/KiteshotGameView';
import {
  GiantImageShowcaseModal,
  ShowcaseImageItem,
} from './components/GiantImageShowcaseModal';
import { KitestAIGeminiAssistant } from './components/KitestAIGeminiAssistant';
import { StoreShopView } from './components/StoreShopView';
import { KitestGramView } from './components/KitestGramView';
import {
  StudyPlansView,
  AlgorithmsView,
  RoadmapView,
  MyClassesView,
  BlogsView,
  HowItWorksView,
  OurTeamView,
} from './components/PlatformHubViews';
import { RoboContestHubViews } from './components/RoboContestHubViews';
import {
  BackgroundCustomizerModal,
  CustomBackgroundConfig,
  DEFAULT_BG_CONFIG,
  BACKGROUND_PRESETS,
} from './components/BackgroundCustomizerModal';
import { signInWithRealGooglePopup } from './firebase';
import {
  KitestKiteLogo,
  KitestSplashScreen,
} from './components/KitestKiteLogo';
import {
  KitestEmblem,
  KIDTEST_LOGO_DATA_URL,
  playKitestSound,
} from './components/KitestEmblem';
import {
  User,
  TestItem,
  Submission,
  Contest,
  CourseItem,
  StudyPlan,
  AlgorithmTopic,
  Classroom,
  BlogPost,
  TeamMember,
  ChatMessage,
  ChatGroup,
  OnlinePresenceUser,
  CertificateData,
  StoreCertificate,
  UserPurchasedCertificate,
  PlatformWheelConfig,
  Book3DItem,
  STAR_COLOR_META,
  StarColor,
  computeRankClass,
  ADMIN_EMAIL,
  OFFICIAL_YOUTUBE_URL,
} from './types';
import {
  MessageSquare,
  Sparkles,
  Youtube,
  ExternalLink,
  LayoutDashboard,
  FileText,
  Send,
  Trophy,
  ClipboardCheck,
  Target,
  Cpu,
  Compass,
  GraduationCap,
  Users,
  BookOpen,
  HelpCircle,
  HeartHandshake,
  Bell,
  PlusCircle,
  ShieldCheck,
  Award,
  Zap,
  Upload,
  PanelLeftClose,
  LogIn,
  UserPlus,
  LogOut,
  Swords,
  Terminal,
  Calendar,
  Video,
  Settings,
  ScanFace,
  Home as HomeIcon,
  X,
  ArrowLeft,
  PlaySquare,
  Star,
  Gamepad2,
  Image as ImageIcon,
  ShoppingBag,
} from 'lucide-react';

const AUTH_STORAGE_KEY = 'kitest_clean_user_v3';
const ADMIN_PASSCODE_STORAGE_KEY = 'kitest_admin_passcode_v1';
const THEME_STORAGE_KEY = 'kitest_theme_mode';
const SOUND_STORAGE_KEY = 'kitest_sound_enabled';
const BG_CONFIG_STORAGE_KEY = 'kitest_custom_bg_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [authPortalMode, setAuthPortalMode] = useState<
    'login' | 'register' | 'admin'
  >('login');
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const quickPhotoInputRef = useRef<HTMLInputElement>(null);

  // Theme state: 'dark' (Tun rejimi) or 'light' (Kun rejimi)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {}
    return 'light';
  });

  // User-customizable Dashboard & Platform Background State
  const [bgConfig, setBgConfig] = useState<CustomBackgroundConfig>(() => {
    try {
      const saved = localStorage.getItem(BG_CONFIG_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_BG_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_BG_CONFIG;
  });

  const [isBgCustomizerOpen, setIsBgCustomizerOpen] = useState(false);

  const handleChangeBgConfig = (nextConfig: CustomBackgroundConfig) => {
    setBgConfig(nextConfig);
    try {
      localStorage.setItem(BG_CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
    } catch {}
    if (nextConfig.mode === 'preset') {
      const preset = BACKGROUND_PRESETS.find((p) => p.id === nextConfig.presetId);
      if (preset?.isLight) {
        setTheme('light');
      } else {
        setTheme('dark');
      }
    }
  };

  const handleResetBgConfig = () => {
    setBgConfig(DEFAULT_BG_CONFIG);
    setTheme('dark');
    try {
      localStorage.removeItem(BG_CONFIG_STORAGE_KEY);
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } catch {}
  };

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
      setBgConfig((curr) => {
        if (curr.mode === 'preset') {
          const updated: CustomBackgroundConfig = {
            ...curr,
            presetId: next === 'light' ? 'clean-light' : 'default-dark',
          };
          try {
            localStorage.setItem(BG_CONFIG_STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return curr;
      });
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

  // Real platform state fetched from server
  const [users, setUsers] = useState<User[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmTopic[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [books, setBooks] = useState<Book3DItem[]>([]);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [storeCertificates, setStoreCertificates] = useState<StoreCertificate[]>([]);
  const [purchasedCertificates, setPurchasedCertificates] = useState<
    UserPurchasedCertificate[]
  >([]);
  const [wheelConfig, setWheelConfig] = useState<PlatformWheelConfig>({
    globalEnabled: false,
    globalWheelEnabled: false,
    defaultSpinsPerGrant: 1,
    recentSpins: [],
    updatedAt: '',
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePresenceUser[]>([]);
  const [screenshotProtectionEnabled, setScreenshotProtectionEnabled] =
    useState<boolean>(true);
  const [screenshotBlockedAlert, setScreenshotBlockedAlert] =
    useState<boolean>(false);

  // Step-by-step Interactive Onboarding Tour ("foydalanuvchi saytga kirganda unga maxsus saytdan foydalanish uchun yo'riqnoma ko'rinishi kerak bittalab ko'rsatib berishi kerak")
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  // Entry gate & Splash Loading state matching k3BbK.jpg
  const [hasEnteredPortal, setHasEnteredPortal] = useState<boolean>(true);
  const [splashLoading, setSplashLoading] = useState<boolean>(true);
  const [splashProgress, setSplashProgress] = useState<number>(25);

  useEffect(() => {
    const timer = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setSplashLoading(false), 250);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 22) + 15);
      });
    }, 110);
    return () => clearInterval(timer);
  }, []);

  // Authenticated regular user (Participant / Creator)
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

  // Separate Admin Panel Passcode State (23291031sila)
  const [adminPasscode, setAdminPasscode] = useState<string>(() => {
    try {
      const savedCode = sessionStorage.getItem(ADMIN_PASSCODE_STORAGE_KEY);
      if (savedCode === ADMIN_PASSCODE_VALUE) return savedCode;
    } catch {}
    return '';
  });

  const isBehruzAdmin = Boolean(
    currentUser &&
      (currentUser.username?.toLowerCase() === 'behruz_admin' ||
        currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
        currentUser.role === 'admin')
  );

  const isAdminUnlocked = adminPasscode === ADMIN_PASSCODE_VALUE || isBehruzAdmin;

  // Separate Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCertificatesStoreOpen, setIsCertificatesStoreOpen] = useState(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] =
    useState<CertificateData | null>(null);
  const [isImageShowcaseOpen, setIsImageShowcaseOpen] = useState(false);
  const [showcaseTargetImage, setShowcaseTargetImage] =
    useState<ShowcaseImageItem | null>(null);
  const [showcaseTargetUrl, setShowcaseTargetUrl] = useState<string | undefined>(
    undefined
  );

  const handleOpenImageShowcase = useCallback(
    (target?: ShowcaseImageItem | string) => {
      if (typeof target === 'string') {
        setShowcaseTargetUrl(target);
        setShowcaseTargetImage(null);
      } else if (target && typeof target === 'object') {
        setShowcaseTargetImage(target);
        setShowcaseTargetUrl(undefined);
      } else {
        setShowcaseTargetImage(null);
        setShowcaseTargetUrl(undefined);
      }
      setIsImageShowcaseOpen(true);
    },
    []
  );

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
      const serverCourses: CourseItem[] = Array.isArray(data.courses)
        ? data.courses
        : [];
      const serverStudyPlans: StudyPlan[] = Array.isArray(data.studyPlans)
        ? data.studyPlans
        : [];
      const serverAlgorithms: AlgorithmTopic[] = Array.isArray(data.algorithms)
        ? data.algorithms
        : [];
      const serverClassrooms: Classroom[] = Array.isArray(data.classrooms)
        ? data.classrooms
        : [];
      const serverBlogs: BlogPost[] = Array.isArray(data.blogs)
        ? data.blogs
        : [];
      const serverTeamMembers: TeamMember[] = Array.isArray(data.teamMembers)
        ? data.teamMembers
        : [];
      const serverBooks: Book3DItem[] = Array.isArray(data.books)
        ? data.books
        : [];
      const serverStoreCertificates: StoreCertificate[] = Array.isArray(
        data.storeCertificates
      )
        ? data.storeCertificates
        : [];
      const serverPurchasedCertificates: UserPurchasedCertificate[] =
        Array.isArray(data.purchasedCertificates)
          ? data.purchasedCertificates
          : [];
      const serverMessages: ChatMessage[] = Array.isArray(data.messages)
        ? data.messages
        : [];
      const serverChatGroups: ChatGroup[] = Array.isArray(data.chatGroups)
        ? data.chatGroups
        : [];
      const serverOnlineUsers: OnlinePresenceUser[] = Array.isArray(
        data.onlineUsers
      )
        ? data.onlineUsers
        : [];

      setUsers(serverUsers);
      setTests(serverTests);
      setSubmissions(serverSubmissions);
      setContests(serverContests);
      setCourses(serverCourses);
      setStudyPlans(serverStudyPlans);
      setAlgorithms(serverAlgorithms);
      setClassrooms(serverClassrooms);
      setBlogs(serverBlogs);
      setTeamMembers(serverTeamMembers);
      setBooks(serverBooks);
      setStoreCertificates(serverStoreCertificates);
      setPurchasedCertificates(serverPurchasedCertificates);
      if (data.wheelConfig) {
        setWheelConfig(data.wheelConfig);
      }
      if (typeof data.screenshotProtectionEnabled === 'boolean') {
        setScreenshotProtectionEnabled(data.screenshotProtectionEnabled);
      }
      setMessages(serverMessages);
      setChatGroups(serverChatGroups);
      setOnlineUsers(serverOnlineUsers);

      setCurrentUser((prev) => {
        if (!prev) return null;
        const found = serverUsers.find(
          (u) =>
            u.id === prev.id ||
            (prev.email && u.email.toLowerCase() === prev.email.toLowerCase()) ||
            (prev.username &&
              u.username.toLowerCase() === prev.username.toLowerCase())
        );
        if (found) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(found));
          return found;
        } else {
          // Automatically sync existing client session into server db.users so they are added to Foydalanuvchilar
          fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: prev }),
          })
            .then((r) => r.json())
            .then((syncData) => {
              if (syncData?.user) {
                localStorage.setItem(
                  AUTH_STORAGE_KEY,
                  JSON.stringify(syncData.user)
                );
                setCurrentUser(syncData.user);
              }
              if (Array.isArray(syncData?.users)) {
                setUsers(syncData.users);
              }
            })
            .catch(() => {});
          return prev;
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchPlatformState();
  }, [fetchPlatformState]);

  const handleAuthSuccess = (user: User, allUsers?: User[]) => {
    playKitestSound('success', soundEnabled);
    setCurrentUser(user);
    setHasEnteredPortal(true);
    try {
      if (user.isIncognito) {
        // Incognito mode does not persist credentials to localStorage
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }
      sessionStorage.setItem('kitest_entered_session_v1', 'true');
    } catch {}
    if (!user.isIncognito) {
      setUsers((prev) => {
        if (Array.isArray(allUsers) && allUsers.length > 0) {
          return allUsers;
        }
        const exists = prev.some(
          (u) =>
            u.id === user.id ||
            u.email.toLowerCase() === user.email.toLowerCase()
        );
        if (exists) {
          return prev.map((u) =>
            u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
              ? user
              : u
          );
        }
        return [...prev, user];
      });
    }
    if (
      user.role === 'user' &&
      user.email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
      setAdminPasscode('');
      try {
        sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
      } catch {}
    }
    setCurrentTab('home');
    fetchPlatformState();
    try {
      const seenTour = localStorage.getItem('kitest_onboarding_seen_v2');
      if (!seenTour) {
        setOnboardingStep(0);
        setIsOnboardingOpen(true);
        localStorage.setItem('kitest_onboarding_seen_v2', 'true');
      }
    } catch {}
  };

  const handleUnlockAdmin = (passcode: string) => {
    playKitestSound('victory', soundEnabled);
    setAdminPasscode(passcode);
    setHasEnteredPortal(true);
    try {
      sessionStorage.setItem(ADMIN_PASSCODE_STORAGE_KEY, passcode);
      sessionStorage.setItem('kitest_entered_session_v1', 'true');
    } catch {}
    setSelectedTest(null);
    setIsAdminModalOpen(false);
    setIsAuthOpen(false);
    setCurrentTab('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockAdmin = () => {
    playKitestSound('click', soundEnabled);
    setAdminPasscode('');
    try {
      sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
    } catch {}
    if (currentTab === 'admin') {
      setCurrentTab('home');
    }
  };

  const handleLogout = () => {
    playKitestSound('click', soundEnabled);
    setCurrentUser(null);
    setAdminPasscode('');
    setHasEnteredPortal(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
      sessionStorage.removeItem('kitest_entered_session_v1');
    } catch {}
    setSelectedTest(null);
    setAuthPortalMode('login');
    setCurrentTab('home');
  };

  const handleSelectTest = (test: TestItem) => {
    playKitestSound('click', soundEnabled);
    setSelectedTest(test);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveUserToLocalStorage = (userObj: User | null) => {
    try {
      if (!userObj) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userObj));
      }
    } catch {}
  };

  // Direct Photo Upload handler from Sidebar
  const handleDirectUnmodifiedPhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith('image/')) return;
    try {
      const optimizedDataUrl = await readAndOptimizeAvatarFile(file);
      if (!optimizedDataUrl) return;
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: optimizedDataUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('success', soundEnabled);
        setCurrentUser(data.user);
        saveUserToLocalStorage(data.user);
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        }
        await fetchPlatformState();
      }
    } catch {}
    e.target.value = '';
  };

  const isMainAdmin =
    Boolean(isAdminUnlocked) ||
    Boolean(
      currentUser &&
        (currentUser.email.trim().toLowerCase() === ADMIN_EMAIL ||
          currentUser.role === 'admin' ||
          currentUser.username?.toLowerCase() === 'behruz_admin')
    );

  // Global Screenshot Protection Enforcement ("saytdagi ma'lumotlarni skrinshot qilib bo'lmasin faqat admin ruxsat bergan odamgina qila olsin")
  const canTakeScreenshot =
    !screenshotProtectionEnabled ||
    isMainAdmin ||
    Boolean(currentUser?.screenshotAllowed);

  useEffect(() => {
    if (canTakeScreenshot) return;

    const triggerBlockAlert = () => {
      setScreenshotBlockedAlert(true);
      try {
        navigator.clipboard?.writeText(
          "KITEST: Skrinshot qilish taqiqlangan! Faqat Bosh Admin ruxsat bergan foydalanuvchilar skrinshot qila oladi."
        );
      } catch {}
      setTimeout(() => setScreenshotBlockedAlert(false), 3500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key.toLowerCase() === 's')) ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        (e.ctrlKey && e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        triggerBlockAlert();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        triggerBlockAlert();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('contextmenu', handleContextMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canTakeScreenshot]);

  const handleToggleGlobalScreenshotProtection = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/security/toggle-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        setScreenshotProtectionEnabled(enabled);
        await fetchPlatformState();
      }
    } catch {}
  };

  const isCreatorOrAdmin = true;

  // Send real-time presence & current activity heartbeat so Online Users, Tutorial, and Admin Monitor see live activity
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        const activityLabel = selectedTest
          ? `Test yechmoqda: #${selectedTest.id} ${selectedTest.title}`
          : currentTab === 'majlis'
          ? '🎥 Video Majlisda'
          : currentTab === 'chat'
          ? '💬 Onlayn Chatda'
          : currentTab === 'create_test'
          ? '✨ AI Savol va Test yaratmoqda'
          : currentTab === 'courses'
          ? '🎬 Video Kurs ko‘rmoqda'
          : currentTab === 'problems' || currentTab === 'tests'
          ? '📚 Testlar arxivida'
          : currentTab === 'admin'
          ? '🛡️ Admin Panelda'
          : 'Asosiy sahifada';

        const res = await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser?.id || 'guest_active',
            name: currentUser?.name || 'Mehmon Foydalanuvchi',
            username: currentUser?.username || 'mehmon',
            role: currentUser?.role || 'user',
            region: currentUser?.region || 'Toshkent',
            rating: currentUser?.rating || 1200,
            totalScore: currentUser?.totalScore || 0,
            avatarUrl: currentUser?.avatarUrl,
            avatarEmoji: currentUser?.avatarEmoji || '🚀',
            currentTab,
            currentActivity: activityLabel,
            deviceLabel: window.innerWidth < 768 ? 'Mobil Qurilma' : 'Kompyuter (Web)',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.onlineUsers)) {
            setOnlineUsers(data.onlineUsers);
          }
        }
      } catch {}
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(timer);
  }, [currentUser, currentTab, selectedTest]);

  const customContainerStyle = useMemo<React.CSSProperties>(() => {
    const baseStyle: React.CSSProperties = {};
    if (bgConfig.fontFamily === 'mono') {
      baseStyle.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    } else if (bgConfig.fontFamily === 'serif') {
      baseStyle.fontFamily = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
    } else if (bgConfig.fontFamily === 'rounded') {
      baseStyle.fontFamily = '"Nunito", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    }
    if (bgConfig.fontScale && bgConfig.fontScale !== 100) {
      baseStyle.zoom = `${bgConfig.fontScale}%`;
    }

    if (bgConfig.mode === 'solid') {
      return { ...baseStyle, backgroundColor: bgConfig.solidColor, backgroundImage: 'none' };
    }
    if (bgConfig.mode === 'gradient') {
      return {
        ...baseStyle,
        background: `linear-gradient(${bgConfig.gradientAngle || 135}deg, ${bgConfig.gradientStart} 0%, ${bgConfig.gradientEnd} 100%)`,
      };
    }
    if (bgConfig.mode === 'preset') {
      const found = BACKGROUND_PRESETS.find((p) => p.id === bgConfig.presetId);
      if (found && found.id !== 'default-dark' && found.id !== 'clean-light') {
        return { ...baseStyle, background: found.cssBackground };
      }
    }
    return baseStyle;
  }, [bgConfig]);

  const navigateTab = (tab: NavTab) => {
    playKitestSound('click', soundEnabled);
    setSelectedTest(null);
    setCurrentTab(tab);
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDedicatedAuthPage = (
    mode: 'login' | 'register' | 'admin' = 'login'
  ) => {
    playKitestSound('click', soundEnabled);
    setSelectedTest(null);
    if (mode === 'admin') {
      setIsAdminModalOpen(true);
      return;
    }
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const goToFullAuthPortal = (
    mode: 'login' | 'register' | 'admin' = 'login'
  ) => {
    playKitestSound('click', soundEnabled);
    setSelectedTest(null);
    setAuthPortalMode(mode);
    setCurrentTab('auth_portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={customContainerStyle}
      className={`min-h-screen flex flex-col font-sans relative ${
        theme === 'light'
          ? 'kitest-bg-light text-slate-900'
          : 'kitest-bg-dark text-slate-100'
      }`}
    >
      {/* Hidden input for 100% unmodified user photo upload */}
      <input
        ref={quickPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleDirectUnmodifiedPhotoUpload}
        className="hidden"
      />

      {/* Fixed User-Uploaded Custom Wallpaper Layer (if mode === 'image') */}
      {bgConfig.mode === 'image' && bgConfig.imageUrl && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-300"
            style={{
              backgroundImage: `url(${bgConfig.imageUrl})`,
              filter: bgConfig.blurPx > 0 ? `blur(${bgConfig.blurPx}px)` : undefined,
              transform: bgConfig.blurPx > 0 ? 'scale(1.04)' : undefined,
            }}
          />
          <div
            className="absolute inset-0 bg-slate-950 transition-opacity duration-300"
            style={{ opacity: bgConfig.overlayOpacity }}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* STRICT 2-SCREEN SEPARATION:                                           */}
      {/* OYNA 1 (!hasEnteredPortal || (!currentUser && !isAdminUnlocked)):     */}
      {/*         BIRINCHI KIRGANDAGI KIRISH (LOGIN / REGISTER) OYNASI          */}
      {/* OYNA 2 (hasEnteredPortal && (currentUser || isAdminUnlocked)):        */}
      {/*         KIRISHDAN KEYINGI ASOSIY DASHBOARD OYNA                       */}
      {/* 0. SPLASH / LOADING SCREEN (100% Matching k3BbK.jpg) */}
      {splashLoading && (
        <KitestSplashScreen
          progress={splashProgress}
          onFinish={() => setSplashLoading(false)}
        />
      )}

      {(!currentUser && !isAdminUnlocked) || currentTab === 'auth_portal' ? (
        <div className="relative z-10 min-h-screen flex flex-col">
          <KitestSkyLandingView
            currentUser={currentUser}
            isAdminUnlocked={isAdminUnlocked}
            tests={tests}
            users={users}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setIsAuthOpen(true);
            }}
            onOpenFaceId={() => setIsFaceScannerOpen(true)}
            onOpenIncognito={() => {
              const incognitoUser: User = {
                id: `incognito_${Date.now()}`,
                name: 'Inkognito Foydalanuvchi',
                username: 'inkognito_rejim',
                email: 'incognito@kitest.uz',
                role: 'user',
                rating: 1200,
                ratingTitle: '🕵️ Inkognito',
                solvedCount: 0,
                totalScore: 0,
                coins: 25,
                stars: 1,
                starColor: 'blue',
                starRankTitle: 'Inkognito',
                scoreMultiplier: 1,
                rank: 0,
                region: 'Toshkent shahri',
                district: 'Yunusobod tumani',
                institution: 'Inkognito Sessiya',
                bio: "Accountsiz inkognito rejim orqali kirilgan.",
                avatarEmoji: '🕵️',
                customBadge: '🕵️ INKOGNITO',
                isIncognito: true,
              };
              handleAuthSuccess(incognitoUser);
            }}
            onSelectTest={handleSelectTest}
            onNavigateTab={(tab) => {
              navigateTab(tab);
            }}
          />
        </div>
      ) : (
        <div className="relative z-10 h-screen overflow-hidden flex flex-row">
          {/* Mobile backdrop when sidebar is open on small screens */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 sm:hidden"
            />
          )}

          {/* LEFT SIDEBAR: Always on the left, never stacked above the page */}
          {sidebarOpen && (
            <aside className="fixed sm:static inset-y-0 left-0 w-60 shrink-0 bg-slate-950 border-r border-slate-800/90 flex flex-col h-screen overflow-y-auto z-40">
              {/* Brand Header */}
              <div className="h-14 px-4 border-b border-slate-800/90 flex items-center justify-between gap-2 shrink-0">
                <div
                  onClick={() => navigateTab('home')}
                  className="cursor-pointer"
                >
                  <KitestEmblem size="sm" showVerifiedSeal={true} />
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                  title="Menyuni yopish"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-4 flex-1">
                {/* Compact User Card with Always-On-Top Colored Star & Multiplier (or Incognito Badge) */}
                {currentUser && (
                  <div
                    className={`p-2.5 rounded-xl border space-y-2 ${
                      currentUser.isIncognito
                        ? 'bg-gradient-to-br from-violet-950/70 via-slate-900 to-fuchsia-950/60 border-violet-500/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {currentUser.isIncognito ? (
                      <div className="px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-between text-[10px] font-extrabold text-violet-200">
                        <span className="flex items-center gap-1">
                          <span>🕵️</span>
                          <span>INKOGNITO (ACCOUNTSIZ)</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-black/40 text-fuchsia-300 font-mono text-[9px]">
                          MAXFIY
                        </span>
                      </div>
                    ) : (
                      (() => {
                        const sc: StarColor = currentUser.starColor || 'blue';
                        const sMeta = STAR_COLOR_META[sc] || STAR_COLOR_META.blue;
                        const mult = currentUser.scoreMultiplier || sMeta.multiplier || 1;
                        return (
                          <div
                            onClick={() => setIsCertificatesStoreOpen(true)}
                            className={`px-2 py-1 rounded-lg border flex items-center justify-between text-[10px] font-extrabold cursor-pointer ${sMeta.bgClass} ${sMeta.colorClass}`}
                          >
                            <span className="flex items-center gap-1 truncate">
                              <span style={{ color: sMeta.hex }}>★</span>
                              <span className="truncate">
                                {sMeta.label} ({currentUser.starRankTitle || sMeta.rankTitle})
                              </span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-black/40 text-amber-300 font-mono">
                              {mult}x
                            </span>
                          </div>
                        );
                      })()
                    )}

                    <div className="flex items-center gap-2.5">
                      {currentUser.isIncognito ? (
                        <div className="w-10 h-10 rounded-lg bg-violet-950 border border-violet-400/50 flex items-center justify-center text-xl shrink-0">
                          🕵️
                        </div>
                      ) : (
                        <img
                          src={currentUser.avatarUrl || KIDTEST_LOGO_DATA_URL}
                          alt={currentUser.name}
                          onClick={() => setIsProfileOpen(true)}
                          className={`w-10 h-10 rounded-lg bg-slate-950 border border-sky-500/40 shrink-0 cursor-pointer ${
                            currentUser.avatarUrl ? 'object-cover' : 'object-contain p-0.5'
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span className="truncate">{currentUser.name}</span>
                          {!currentUser.isIncognito && (
                            <span className="px-1.5 py-0.2 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono text-[10px] font-black">
                              {currentUser.rankClass ||
                                computeRankClass(currentUser.totalScore)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-amber-400">
                          {currentUser.isIncognito
                            ? "Tarix saqlanmaydi · Maxfiy"
                            : `⚡ ${currentUser.totalScore} · 🪙 ${currentUser.coins ?? 0} · ⭐ ${currentUser.stars ?? 0}`}
                        </div>
                      </div>
                    </div>

                    {currentUser.isIncognito ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Haqiqiy Hisobga Kirish</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => quickPhotoInputRef.current?.click()}
                            className="py-1 px-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Rasm</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsProfileOpen(true)}
                            className="py-1 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 font-semibold text-[11px] border border-slate-800 cursor-pointer"
                          >
                            Edit Profil
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsProfileOpen(true)}
                          className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                            currentUser.faceIdEnabled
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                              : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                          }`}
                        >
                          <ScanFace className="w-3.5 h-3.5" />
                          <span>
                            {currentUser.faceIdEnabled
                              ? 'Face ID Faol ✓'
                              : 'Face ID Kiritish (1-urinishda)'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Guest / Visitor Quick Sign-In Card */}
                {!currentUser && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sm font-bold text-sky-300">
                        KT
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          Mehmon rejimi
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          Testlar va natijalarni saqlash
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openDedicatedAuthPage('login')}
                        className="py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Kirish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openDedicatedAuthPage('register')}
                        className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Ro&apos;yxatdan</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setIsAuthOpen(true);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ScanFace className="w-3.5 h-3.5" />
                      <span>Face ID orqali kirish</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const verified = await signInWithRealGooglePopup();
                          if (verified) {
                            const res = await fetch('/api/auth/google-login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: verified.email,
                                name: verified.name,
                                avatarUrl: verified.photoURL,
                                idToken: verified.idToken,
                                googleUid: verified.uid,
                              }),
                            });
                            const data = await res.json();
                            if (res.ok && data.user) {
                              handleAuthSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
                            }
                          }
                        } catch {}
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-200 text-[10px] font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span className="truncate">Google accountga kirish — KITEST</span>
                    </button>
                  </div>
                )}

                {/* ASOSIY */}
                <div className="space-y-0.5">
                  <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Asosiy
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('home')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      currentTab === 'home' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-sky-400" />
                    <span>Bosh sahifa</span>
                  </button>
                </div>

                {/* MASHQ VA BELLASHUV */}
                <div className="space-y-0.5 pt-2 border-t border-slate-800/70">
                  <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Mashq va Musobaqa
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('problems')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'problems' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>Masalalar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tests.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('tests_list')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'tests_list' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                      <span>Testlar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tests.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('code_arena')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'code_arena' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>Kod Poligoni</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('duels')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'duels' && !selectedTest
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Swords className="w-4 h-4 text-rose-400" />
                      <span>1v1 Duellar</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('gameball')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all ${
                      currentTab === 'gameball' && !selectedTest
                        ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-lg shadow-pink-500/25 ring-1 ring-pink-400'
                        : 'text-pink-300 hover:text-white bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-pink-400" />
                      <span>🎮 Kiteshot (Gameball 3D)</span>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-500/30 text-pink-200">
                      ONLAYN
                    </span>
                  </button>

                  {/* 🛍️ DO'KON & BOZOR (Ballar evaziga barcha tovarlar) */}
                  <button
                    type="button"
                    onClick={() => navigateTab('shop')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'shop' && !selectedTest
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400'
                        : 'text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      <span>🛍️ Do'kon & Bozor</span>
                    </span>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">
                      YANGI 🎁
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('contests')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'contests' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>Olimpiadalar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {Math.max(1, contests.length)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('submissions')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'submissions' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Urinishlar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {submissions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('activity_map')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'activity_map' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span>Faollik kalendari</span>
                    </span>
                  </button>
                </div>

                {/* TA'LIM */}
                <div className="space-y-0.5 pt-2 border-t border-slate-800/70">
                  <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Ta'lim va 3D Kitoblar
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('courses')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'courses' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Youtube className="w-4 h-4 text-rose-400" />
                      <span>Video Kurslar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {courses.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('books_3d')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'books_3d' && !selectedTest
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>3D Kitoblar</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">
                      {books.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('study_plans')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'study_plans' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Target className="w-4 h-4 text-sky-400" />
                      <span>O'quv rejalari</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('algorithms')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'algorithms' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span>Algoritmlar</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('roadmap')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'roadmap' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Compass className="w-4 h-4 text-purple-400" />
                      <span>Yo'l xaritasi</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('my_classes')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'my_classes' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-rose-400" />
                      <span>Mening sinflarim</span>
                    </span>
                  </button>
                </div>

                {/* HAMJAMIYAT */}
                <div className="space-y-0.5 pt-2 border-t border-slate-800/70">
                  <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Hamjamiyat
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('all_users')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      (currentTab === 'all_users' || currentTab === 'leaderboard') &&
                      !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Reyting va A'zolar</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {users.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('subscriptions')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'subscriptions' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-rose-400" />
                      <span>Obunalar</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('blogs')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'blogs' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Maqolalar</span>
                    </span>
                  </button>

                  {/* Dedicated KitestAI Pro (Ultra-tezkor neyrotizim) */}
                  <button
                    type="button"
                    onClick={() => navigateTab('gemini_ai')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'gemini_ai' && !selectedTest
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'text-indigo-300 hover:bg-indigo-500/15'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>🤖 KitestAI Pro</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-[9px] font-black text-indigo-200">
                      PRO AI
                    </span>
                  </button>

                  {/* Dedicated AI Savol va Test Tuzish */}
                  <button
                    type="button"
                    onClick={() => navigateTab('create_test')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'create_test' && !selectedTest
                        ? 'bg-purple-600 text-white'
                        : 'text-purple-300 hover:bg-purple-500/15'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-purple-400" />
                      <span>✨ KitestAI: Test Tuzuvchi</span>
                    </span>
                  </button>

                  {/* Dedicated KitestGram (xuddi Telegram dek) */}
                  <button
                    type="button"
                    onClick={() => navigateTab('kitestgram')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                      (currentTab === 'kitestgram' || currentTab === 'chat') && !selectedTest
                        ? 'bg-[#2AABEE] text-white shadow-lg shadow-sky-500/30'
                        : 'text-sky-300 hover:bg-sky-500/15'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-[#2AABEE] -rotate-12 translate-x-0.5" />
                      <span>✈️ KitestGram (Onlayn)</span>
                    </span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('majlis')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                      currentTab === 'majlis' && !selectedTest
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-300 hover:bg-rose-500/15'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-rose-400" />
                      <span>🎥 Video Majlis</span>
                    </span>
                  </button>
                </div>

                {/* TIZIM */}
                <div className="space-y-0.5 pt-2 border-t border-slate-800/70">
                  <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Tizim va Sozlamalar
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBgCustomizerOpen(true)}
                    className="sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-bold text-sky-300 hover:bg-sky-500/15 flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-sky-400" />
                    <span>⚙️ Nastroyka (Dizayn)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenImageShowcase()}
                    className="sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-bold text-amber-300 hover:bg-amber-500/15 flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>🖼️ Katta Rasmlar (Ultra HD)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCertificatesStoreOpen(true)}
                    className="sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Sertifikatlar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLuckyWheelOpen(true)}
                    className="sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Omad barabani</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('our_team')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      currentTab === 'our_team' && !selectedTest
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    <span>Bizning jamoa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(true)}
                    className="sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-bold text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>📖 Interaktiv Tutorial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTab('create_test')}
                    className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all cursor-pointer ${
                      currentTab === 'create_test' && !selectedTest
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-300 hover:bg-emerald-500/15'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>✨ AI Savol va Test Tuzish</span>
                  </button>

                  {isMainAdmin && (
                    <button
                      type="button"
                      onClick={() => navigateTab('admin')}
                      className={`sidebar-neon-hover w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        currentTab === 'admin' && !selectedTest
                          ? 'bg-amber-600 text-white'
                          : 'text-amber-300 hover:bg-amber-500/15'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Boshqaruv paneli</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openDedicatedAuthPage('login')}
                    className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold text-sky-300 hover:bg-sky-500/15 flex items-center gap-2.5 mt-1"
                  >
                    <LogIn className="w-4 h-4 text-sky-400" />
                    <span>Kirish / Hisob almashtirish</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 px-2.5 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/15 flex items-center gap-2.5 mt-0.5"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Chiqish</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* RIGHT WORKSPACE: Scrollable side-by-side results panel */}
          <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
            <Navbar
              currentTab={currentTab}
              setCurrentTab={navigateTab}
              currentUser={currentUser}
              isAdminUnlocked={isAdminUnlocked}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenBgCustomizer={() => setIsBgCustomizerOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              chatMessagesCount={messages.length}
              coursesCount={courses.length}
              contestsCount={Math.max(1, contests.length)}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
              onOpenLogin={() => openDedicatedAuthPage('login')}
              onOpenRegister={() => openDedicatedAuthPage('register')}
              onOpenAdminModal={() => openDedicatedAuthPage('admin')}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
              onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
              onOpenOnboardingGuide={() => {
                setOnboardingStep(0);
                setIsOnboardingOpen(true);
              }}
              globalSearchQuery={globalSearchQuery}
              onGlobalSearchChange={setGlobalSearchQuery}
              tests={tests}
              onSelectTest={handleSelectTest}
              onOpenPremium={() => setIsPremiumModalOpen(true)}
              onRefreshState={fetchPlatformState}
              onLogout={handleLogout}
            />

            {/* Main Right Results Area */}
            <main className="flex-1 p-4 sm:p-6 max-w-[1360px] w-full mx-auto">
              <AnimatePresence mode="wait">
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
                        isAdminUnlocked={isAdminUnlocked}
                        soundEnabled={soundEnabled}
                        bgConfig={bgConfig}
                        onChangeBgConfig={handleChangeBgConfig}
                        onOpenBgCustomizer={() => setIsBgCustomizerOpen(true)}
                        onSelectTest={handleSelectTest}
                        onNavigate={(tab) => navigateTab(tab)}
                        onOpenAuth={(mode) => openDedicatedAuthPage(mode)}
                        onOpenAdminModal={() => openDedicatedAuthPage('admin')}
                        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                        onOpenProfile={() => setIsProfileOpen(true)}
                        onOpenImageShowcase={handleOpenImageShowcase}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                        onRefreshState={fetchPlatformState}
                      />
                    ) : currentTab === 'problems' ||
                      currentTab === 'tests_list' ||
                      currentTab === 'tests' ? (
                      <ProblemList
                        mode={
                          currentTab === 'tests_list' || currentTab === 'tests'
                            ? 'tests_list'
                            : 'problems'
                        }
                        tests={tests}
                        submissions={submissions}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        externalSearchQuery={globalSearchQuery}
                        onSelectTest={handleSelectTest}
                        onOpenCreateTest={() => navigateTab('create_test')}
                      />
                    ) : currentTab === 'courses' ? (
                      <CoursesView
                        courses={courses}
                        tests={tests}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onSelectTest={handleSelectTest}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                      />
                    ) : currentTab === 'books_3d' ? (
                      <Books3DView
                        books={books}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        screenshotProtectionEnabled={screenshotProtectionEnabled}
                        onRefreshState={fetchPlatformState}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                      />
                    ) : currentTab === 'study_plans' ? (
                      <StudyPlansView
                        studyPlans={studyPlans}
                        tests={tests}
                        courses={courses}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onSelectTest={handleSelectTest}
                        onNavigateTab={(tab) => navigateTab(tab)}
                        onNavigate={(tab) => navigateTab(tab)}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                      />
                    ) : currentTab === 'algorithms' ? (
                      <AlgorithmsView
                        algorithms={algorithms}
                        tests={tests}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onSelectTest={handleSelectTest}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                      />
                    ) : currentTab === 'roadmap' ? (
                      <RoadmapView
                        currentUser={currentUser}
                        tests={tests}
                        courses={courses}
                        studyPlans={studyPlans}
                        onNavigateTab={(tab) => navigateTab(tab)}
                        onNavigate={(tab) => navigateTab(tab)}
                        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                      />
                    ) : currentTab === 'my_classes' ? (
                      <MyClassesView
                        classrooms={classrooms}
                        users={users}
                        tests={tests}
                        courses={courses}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onSelectTest={handleSelectTest}
                        onNavigateTab={(tab) => navigateTab(tab)}
                        onNavigate={(tab) => navigateTab(tab)}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                      />
                    ) : currentTab === 'blogs' ? (
                      <BlogsView
                        blogs={blogs}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                      />
                    ) : currentTab === 'how_it_works' ? (
                      <HowItWorksView
                        onNavigateTab={(tab) => navigateTab(tab)}
                        onNavigate={(tab) => navigateTab(tab)}
                        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                      />
                    ) : currentTab === 'our_team' ? (
                      <OurTeamView
                        teamMembers={teamMembers}
                        users={users}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onRefreshState={fetchPlatformState}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                      />
                    ) : currentTab === 'create_test' ? (
                      <TelegramQuizBuilder
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        soundEnabled={soundEnabled}
                        onTestCreated={(newTest) => {
                          fetchPlatformState();
                          setCurrentTab('problems');
                          setSelectedTest(newTest);
                        }}
                        onCancel={() => navigateTab('problems')}
                      />
                    ) : currentTab === 'contests' ? (
                      <ContestView
                        contests={contests}
                        tests={tests}
                        submissions={submissions}
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        onSelectTest={handleSelectTest}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onRefreshState={fetchPlatformState}
                      />
                    ) : currentTab === 'submissions' ? (
                      <SubmissionsView
                        submissions={submissions}
                        currentUser={currentUser}
                        onSelectTestId={(testId) => {
                          const found = tests.find((t) => t.id === testId);
                          if (found) handleSelectTest(found);
                        }}
                        onOpenCertificate={(cert) => setActiveCertificate(cert)}
                      />
                    ) : currentTab === 'leaderboard' ||
                      currentTab === 'all_users' ||
                      currentTab === 'subscriptions' ? (
                      <LeaderboardView
                        key={currentTab === 'subscriptions' ? 'sub-view' : 'users-view'}
                        users={users}
                        submissions={submissions}
                        purchasedCertificates={purchasedCertificates}
                        currentUser={currentUser}
                        soundEnabled={soundEnabled}
                        initialViewMode={
                          currentTab === 'subscriptions' ? 'subscriptions' : 'users'
                        }
                        onOpenCertificate={(cert) => setActiveCertificate(cert)}
                        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                        onOpenMyProfile={() => setIsProfileOpen(true)}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                        onRefreshState={fetchPlatformState}
                      />
                    ) : currentTab === 'gemini_ai' ? (
                      <KitestAIGeminiAssistant
                        currentUser={currentUser}
                        soundEnabled={soundEnabled}
                        onNavigateToTestMaker={() => navigateTab('create_test')}
                        onNavigateToGram={() => navigateTab('kitestgram')}
                      />
                    ) : currentTab === 'kitestgram' || currentTab === 'chat' ? (
                      <KitestGramView
                        currentUser={currentUser}
                        users={users}
                        soundEnabled={soundEnabled}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onOpenMajlis={() => navigateTab('majlis')}
                      />
                    ) : currentTab === 'majlis' ? (
                      <MajlisView
                        user={
                          currentUser || {
                            id: 'guest_user',
                            name: 'Mehmon Ishtirokchi',
                            username: 'mehmon',
                            email: 'guest@kitest.uz',
                            role: isAdminUnlocked ? 'admin' : 'user',
                            rating: 1200,
                            ratingTitle: 'Boshlovchi',
                            totalScore: 0,
                            solvedCount: 0,
                            rank: 1,
                            joinedAt: new Date().toISOString(),
                          }
                        }
                        onlineUsers={onlineUsers}
                        onNavigate={(tab) => {
                          if (tab === 'quiz-builder') navigateTab('create_test');
                          else if (tab === 'online-chat') navigateTab('chat');
                          else navigateTab(tab as NavTab);
                        }}
                      />
                    ) : currentTab === 'duels' ||
                      currentTab === 'code_arena' ||
                      currentTab === 'activity_map' ? (
                      <RoboContestHubViews
                        currentUser={currentUser}
                        users={users}
                        submissions={submissions}
                        tests={tests}
                        initialSection={
                          currentTab === 'code_arena'
                            ? 'code_arena'
                            : currentTab === 'activity_map'
                            ? 'activity'
                            : 'duels'
                        }
                        soundEnabled={soundEnabled}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(
                            AUTH_STORAGE_KEY,
                            JSON.stringify(updated)
                          );
                        }}
                        onRefreshState={fetchPlatformState}
                        onSelectTest={handleSelectTest}
                      />
                    ) : currentTab === 'admin' ? (
                      <AdminPanel
                        currentUser={currentUser}
                        isAdminUnlocked={isAdminUnlocked}
                        adminPasscode={adminPasscode}
                        users={users}
                        tests={tests}
                        contests={contests}
                        submissions={submissions}
                        storeCertificates={storeCertificates}
                        screenshotProtectionEnabled={screenshotProtectionEnabled}
                        onToggleScreenshotProtection={async () => {
                          await handleToggleGlobalScreenshotProtection(!screenshotProtectionEnabled);
                        }}
                        onRefreshData={fetchPlatformState}
                        onNavigateCreateTest={() => navigateTab('create_test')}
                        onUnlockAdmin={handleUnlockAdmin}
                        onLockAdmin={handleLockAdmin}
                        onOpenCertificate={(cert) => setActiveCertificate(cert)}
                        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                        onOpenMajlis={() => navigateTab('majlis')}
                      />
                    ) : currentTab === 'gameball' ? (
                      <KiteshotGameView
                        currentUser={currentUser}
                        users={users}
                        soundEnabled={soundEnabled}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
                        }}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onOpenPremium={() => setIsPremiumModalOpen(true)}
                      />
                    ) : currentTab === 'shop' ? (
                      <StoreShopView
                        currentUser={currentUser}
                        soundEnabled={soundEnabled}
                        onUpdateUser={(updated) => {
                          setCurrentUser(updated);
                          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
                        }}
                        onRequireLogin={() => openDedicatedAuthPage('login')}
                        onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                        onNavigateTab={(tab) => navigateTab(tab)}
                      />
                    ) : null}
                </motion.div>
              </AnimatePresence>
            </main>

            <footer className="border-t border-slate-800/80 py-5 px-6 bg-slate-950/80 backdrop-blur-sm">
              <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2.5">
                  <KitestEmblem size="sm" showVerifiedSeal={true} />
                  <span>· © {new Date().getFullYear()} Dunyo yoshlar qo'lida</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={OFFICIAL_YOUTUBE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-1 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-200 font-bold flex items-center gap-1.5"
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-400" />
                    <span>YouTube: @FC_UZB-67b</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span>
                    Bosh Admin:{' '}
                    <strong className="text-slate-200 font-mono">{ADMIN_EMAIL}</strong>
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Floating Sun'iy Intellekt (AI) Launcher Button (NO CHAT) */}
      {!selectedTest && currentTab !== 'create_test' && currentTab !== 'auth_portal' && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigateTab('create_test')}
          className="fixed bottom-6 right-6 z-30 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-purple-600/30 border border-white/20 flex items-center gap-2.5 cursor-pointer"
        >
          <div className="relative flex items-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-300 animate-ping" />
          </div>
          <span>Sun'iy Intellekt (AI)</span>
          <Cpu className="w-3.5 h-3.5 text-sky-200" />
        </motion.button>
      )}

      {/* ========================================================================= */}
      {/* TEST YECHISH OYNASI - USTIDAN OCHILADIGAN MAXSUS OYNA (MODAL OVERLAY)     */}
      {/* 100% Matching: "funksiyalar bosilganda uning pastidan emas ustidan ochilsin" */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedTest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto flex flex-col"
          >
            {/* Window Top Bar */}
            <div className="sticky top-0 z-30 bg-white/95 border-b border-sky-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div onClick={() => setSelectedTest(null)} className="cursor-pointer">
                  <KitestKiteLogo size={32} showWordmark={true} />
                </div>
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                    {selectedTest.subject}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    #{selectedTest.id} · {selectedTest.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTest(null)}
                  className="px-4 py-2 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <X className="w-4 h-4" />
                  <span>Yopish (Orqaga)</span>
                </button>
              </div>
            </div>

            {/* Test Content */}
            <div className="flex-1 p-3 sm:p-6 max-w-5xl w-full mx-auto">
              <ProblemDetail
                test={selectedTest}
                currentUser={currentUser}
                submissions={submissions}
                soundEnabled={soundEnabled}
                onBack={() => setSelectedTest(null)}
                onRequireLogin={() => openDedicatedAuthPage('login')}
                onOpenCertificate={(cert) => setActiveCertificate(cert)}
                onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
                onSubmissionComplete={(_submission, updatedUser, updatedTest) => {
                  setCurrentUser(updatedUser);
                  localStorage.setItem(
                    AUTH_STORAGE_KEY,
                    JSON.stringify(updatedUser)
                  );
                  setSelectedTest(updatedTest);
                  fetchPlatformState();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
        onOpenAdminModal={() => {
          setIsAuthOpen(false);
          setIsAdminModalOpen(true);
        }}
        onDirectAdminUnlock={handleUnlockAdmin}
      />

      <AdminAuthModal
        isOpen={isAdminModalOpen}
        soundEnabled={soundEnabled}
        onClose={() => setIsAdminModalOpen(false)}
        onUnlocked={handleUnlockAdmin}
      />

      <FaceIdScannerModal
        isOpen={isFaceScannerOpen}
        mode="login"
        soundEnabled={soundEnabled}
        onClose={() => setIsFaceScannerOpen(false)}
        onLoginSuccess={(user, allUsers) => {
          setIsFaceScannerOpen(false);
          handleAuthSuccess(user, allUsers);
        }}
        onAdminUnlocked={(code) => {
          setIsFaceScannerOpen(false);
          handleUnlockAdmin(code || ADMIN_PASSCODE_VALUE);
        }}
      />

      <BackgroundCustomizerModal
        isOpen={isBgCustomizerOpen}
        config={bgConfig}
        soundEnabled={soundEnabled}
        currentUser={currentUser}
        onToggleSound={handleToggleSound}
        onChangeConfig={handleChangeBgConfig}
        onReset={handleResetBgConfig}
        onClose={() => setIsBgCustomizerOpen(false)}
        onOpenFullProfile={() => {
          setIsBgCustomizerOpen(false);
          setIsProfileOpen(true);
        }}
        onUpdateUser={(updated, allUsers) => {
          setCurrentUser(updated);
          saveUserToLocalStorage(updated);
          if (Array.isArray(allUsers)) {
            setUsers(allUsers);
          }
          fetchPlatformState();
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        user={currentUser}
        submissions={submissions}
        soundEnabled={soundEnabled}
        onClose={() => setIsProfileOpen(false)}
        onOpenCertificate={(cert) => setActiveCertificate(cert)}
        onOpenCertificatesStore={() => setIsCertificatesStoreOpen(true)}
        onUpdateUser={(updated, allUsers) => {
          setCurrentUser(updated);
          saveUserToLocalStorage(updated);
          if (Array.isArray(allUsers)) {
            setUsers(allUsers);
          }
          fetchPlatformState();
        }}
        onDeleteAccount={(remainingUsers) => {
          setIsProfileOpen(false);
          setCurrentUser(null);
          setAdminPasscode('');
          setHasEnteredPortal(false);
          saveUserToLocalStorage(null);
          try {
            sessionStorage.removeItem(ADMIN_PASSCODE_STORAGE_KEY);
            sessionStorage.removeItem('kitest_entered_session_v1');
          } catch {}
          if (Array.isArray(remainingUsers)) {
            setUsers(remainingUsers);
          }
          setSelectedTest(null);
          setAuthPortalMode('login');
          setCurrentTab('home');
          fetchPlatformState();
        }}
      />

      <CertificatesStoreModal
        isOpen={isCertificatesStoreOpen}
        currentUser={currentUser}
        isAdminUnlocked={isAdminUnlocked}
        adminPasscode={adminPasscode}
        storeCertificates={storeCertificates}
        submissions={submissions}
        soundEnabled={soundEnabled}
        onClose={() => setIsCertificatesStoreOpen(false)}
        onRefreshState={fetchPlatformState}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }}
        onOpenCertificateModal={(cert) => setActiveCertificate(cert)}
        onRequireLogin={() => {
          setIsCertificatesStoreOpen(false);
          openDedicatedAuthPage('login');
        }}
      />

      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        currentUser={currentUser}
        isAdminUnlocked={isAdminUnlocked}
        adminPasscode={adminPasscode}
        users={users}
        wheelConfig={wheelConfig}
        soundEnabled={soundEnabled}
        onClose={() => setIsLuckyWheelOpen(false)}
        onRefreshState={fetchPlatformState}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }}
        onRequireLogin={() => {
          setIsLuckyWheelOpen(false);
          openDedicatedAuthPage('login');
        }}
      />

      <CertificateModal
        isOpen={Boolean(activeCertificate)}
        certificate={activeCertificate}
        soundEnabled={soundEnabled}
        onClose={() => setActiveCertificate(null)}
      />

      <PremiumModal
        isOpen={isPremiumModalOpen}
        currentUser={currentUser}
        soundEnabled={soundEnabled}
        onClose={() => setIsPremiumModalOpen(false)}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
        }}
        onRequireLogin={() => {
          setIsPremiumModalOpen(false);
          openDedicatedAuthPage('login');
        }}
        onOpenLuckyWheel={() => {
          setIsPremiumModalOpen(false);
          setIsLuckyWheelOpen(true);
        }}
      />

      <GiantImageShowcaseModal
        isOpen={isImageShowcaseOpen}
        initialImage={showcaseTargetImage}
        initialImageUrl={showcaseTargetUrl}
        onClose={() => {
          setIsImageShowcaseOpen(false);
          setShowcaseTargetImage(null);
          setShowcaseTargetUrl(undefined);
        }}
      />

      {/* Screenshot Protection Blocked Warning Overlay */}
      <AnimatePresence>
        {screenshotBlockedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center select-none"
          >
            <div className="max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-rose-500/60 space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-2xl">
                🛡️
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Skrinshot Qilish Taqiqlangan!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Platformadagi test savollari va ma'lumotlarni skrinshot qilish himoyalangan. Faqat <strong className="text-amber-300">Bosh Admin</strong> ruxsat bergan foydalanuvchilargina skrinshot qila oladi.
              </p>
              <button
                type="button"
                onClick={() => setScreenshotBlockedAlert(false)}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white"
              >
                Tushunarli
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Step-by-Step Platform Tutorial with Live Online Users */}
      <InteractiveTutorialModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onlineUsers={onlineUsers}
        onOpenSettings={() => setIsBgCustomizerOpen(true)}
        onNavigate={(tab) => {
          if (tab === 'quiz-builder') navigateTab('create_test');
          else if (tab === 'online-chat') navigateTab('chat');
          else if (tab === 'majlis') navigateTab('majlis');
          else navigateTab('home');
        }}
      />

      {/* Emotsiyalar va Varraklar (Faqat harakat yoki so'z ustiga kelganda paydo bo'ladi) */}
      <FlyingKitesAndEmotionsOverlay
        soundEnabled={soundEnabled}
        enableAmbientKites={false}
      />
    </div>
  );
}
