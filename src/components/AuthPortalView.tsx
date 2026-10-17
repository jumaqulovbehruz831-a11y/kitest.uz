import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User, ADMIN_EMAIL, OFFICIAL_YOUTUBE_URL, computeRankClass } from '../types';
import {
  KitestEmblem,
  KIDTEST_LOGO_DATA_URL,
  AnimatedWords,
  AnimatedLetters,
  RotatingPlainText,
  TEXT_EFFECT_PRESETS,
  useTextEffectMode,
  playKitestSound,
} from './KitestEmblem';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  REGIONS_LIST,
  UZBEKISTAN_LOCATIONS,
} from '../constants/uzbekistanLocations';
import { readAndOptimizeAvatarFile } from './ProfileModal';
import { FaceIdScannerModal } from './FaceIdScannerModal';
import { GoogleContinueModal } from './GoogleContinueModal';
import { KitestGloriousKite } from './KitestKiteLogo';
import { KitestRotatingActionLoader } from './KitestRotatingActionLoader';
import {
  FlyingKitesAndEmotionsOverlay,
  InteractiveEmotionsStrip,
} from './FlyingKitesAndEmotionsOverlay';
import { signInWithRealGooglePopup } from '../firebase';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  ScanFace,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  Upload,
  Sparkles,
  Trophy,
  Award,
  Swords,
  Terminal,
  Palette,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Settings,
  Youtube,
  GraduationCap,
  Users,
  FileText,
  CheckCircle2,
  Zap,
  KeyRound,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Cpu,
  BookOpen,
} from 'lucide-react';

const STUDIO_SHOWCASE_SLIDES = [
  {
    id: 'arena',
    image: '/src/assets/images/studio_showcase_arena_1790855511159.jpg',
    tag: 'GOOGLE AI STUDIO USLUBIDAGI MUHIT',
    title: "KITEST.AI Studio — Intellektual Algoritm va Test Poligoni",
    subtitle:
      "Python, JavaScript, C++ va Java tillarida real vaqtda kod yechish, AI yordamida soniyalar ichida test tuzish hamda 1v1 RoboContest bilim duellari.",
    accent: 'from-sky-500/30 via-indigo-500/20 to-transparent',
    stat: '⚡ 4 ta Dasturlash Tili + AI Generator',
  },
  {
    id: 'science',
    image: '/src/assets/images/studio_showcase_science_1790855524330.jpg',
    tag: '3D KUTUBXONA VA VIDEO AKADEMIYA',
    title: "3D Varaqlanadigan Kitoblar va Ustozlar Video Kurslari",
    subtitle:
      "Interaktiv 3D kitoblarni sahifalab o'qing, video darslarga qo'shiling, ustozga savol yo'llang va dars ostidagi testlarni yechib ball hamda yulduzlar to'plang.",
    accent: 'from-indigo-500/30 via-emerald-500/20 to-transparent',
    stat: '📚 3D Kitoblar · 🎬 Video Darslar',
  },
  {
    id: 'champions',
    image: '/src/assets/images/studio_showcase_champions_1790855536619.jpg',
    tag: 'OLTIN SERTIFIKAT VA 2X–5X YULDUZLAR',
    title: "Rang-barang Yulduzlar (2x–5x Ball), Do'kon va 100% Diplomlar",
    subtitle:
      "F darajadan SSS darajagacha ko'tariling, tangalar evaziga Ko'k, Yashil, Qizil, Sariq va Binafsha yulduzlar olib ballaringizni 5x gacha ko'paytiring.",
    accent: 'from-amber-500/30 via-sky-500/20 to-transparent',
    stat: '🏆 100% QR-Sertifikat · ⭐ 2x–5x Ko‘paytirgich',
  },
  {
    id: 'biometrics',
    image: '/src/assets/images/founder_creator_portrait_1790488399852.jpg',
    tag: 'HAQIQIY BIOMETRIKA VA GOOGLE AUTH',
    title: '68-Nuqtali Haqiqiy Kamera Face ID va Rasmiy Google Account',
    subtitle:
      "Kamera orqali yuzingizni 68 ta biometrik nuqta bo'yicha skanerlab parolsiz kiring yoki rasmiy Google hisobingiz bilan 1-bosishda tizimga ulaning.",
    accent: 'from-emerald-500/30 via-sky-500/20 to-transparent',
    stat: '👁️ 68-Nuqta Face ID · 🌐 Rasmiy Google OAuth',
  },
];

const INITIAL_STUDIO_EMOTIONS = [
  { id: 'rocket', emoji: '🚀', label: 'Ilhomlandim', count: 0 },
  { id: 'fire', emoji: '🔥', label: 'Kuchli Platforma', count: 0 },
  { id: 'brain', emoji: '🧠', label: 'AI Intellekt', count: 0 },
  { id: 'zap', emoji: '⚡', label: 'Tezkor Tizim', count: 0 },
  { id: 'crown', emoji: '👑', label: 'Chempion Ruhi', count: 0 },
  { id: 'gem', emoji: '💎', label: 'Studio Dizayn', count: 0 },
  { id: 'target', emoji: '🎯', label: '100% Natija', count: 0 },
  { id: 'trophy', emoji: '🏆', label: 'Rekord Sari', count: 0 },
  { id: 'star', emoji: '🌟', label: '5x Yulduz', count: 0 },
  { id: 'heart', emoji: '❤️‍🔥', label: "Zo'r Loyiha", count: 0 },
  { id: 'party', emoji: '🎉', label: "G'alaba!", count: 0 },
  { id: 'magic', emoji: '✨', label: 'Zamonaviy UI', count: 0 },
];

interface AuthPortalViewProps {
  currentUser: User | null;
  initialMode?: 'login' | 'register' | 'admin';
  soundEnabled?: boolean;
  theme?: 'dark' | 'light';
  usersCount?: number;
  testsCount?: number;
  contestsCount?: number;
  submissionsCount?: number;
  recentUsers?: User[];
  onToggleTheme?: () => void;
  onToggleSound?: () => void;
  onOpenBgCustomizer?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenCertificatesStore?: () => void;
  onOpenOnboardingGuide?: () => void;
  onAuthSuccess: (user: User, allUsers?: User[]) => void;
  onUnlockAdmin: (passcode: string) => void;
  onEnterDashboard: () => void;
  onLogout?: () => void;
}

export const AuthPortalView: React.FC<AuthPortalViewProps> = ({
  currentUser,
  initialMode = 'login',
  soundEnabled = true,
  theme = 'dark',
  usersCount = 0,
  testsCount = 0,
  contestsCount = 0,
  submissionsCount = 0,
  recentUsers = [],
  onToggleTheme,
  onToggleSound,
  onOpenBgCustomizer,
  onOpenLuckyWheel,
  onOpenCertificatesStore,
  onOpenOnboardingGuide,
  onAuthSuccess,
  onUnlockAdmin,
  onEnterDashboard,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Quick 1-click guest/student entry state
  const [quickName, setQuickName] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Password reset state inside Login tab
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetLogin, setResetLogin] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const [textEffect, setTextEffect] = useTextEffectMode();

  const defaultRegion =
    REGIONS_LIST.find((r) => r !== 'Barchasi') || 'Toshkent shahri';
  const [region, setRegion] = useState(defaultRegion);
  const [district, setDistrict] = useState(
    (UZBEKISTAN_LOCATIONS[defaultRegion] || [])[0] || ''
  );
  const [institution, setInstitution] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [faceIdDataUrl, setFaceIdDataUrl] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);

  // Face ID Modal & Google Account Picker Modal states
  const [faceModalMode, setFaceModalMode] = useState<
    'login' | 'enroll' | 'forgot' | 'admin' | null
  >(null);
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [isGoogleContinueModalOpen, setIsGoogleContinueModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  // Google AI Studio Rotating Image Carousel State ("rasmlar aylanadi xullas google studio kirgandagi oyna")
  const [activeSlide, setActiveSlide] = useState(0);
  const [emotions, setEmotions] = useState(INITIAL_STUDIO_EMOTIONS);
  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: number; emoji: string; label: string; x: number }[]
  >([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % STUDIO_SHOWCASE_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerEmotion = (emotionId: string, emoji: string, label: string) => {
    playKitestSound('coin', soundEnabled);
    confetti({
      particleCount: 28,
      spread: 60,
      origin: { y: 0.72 },
    });
    setEmotions((prev) =>
      prev.map((item) =>
        item.id === emotionId ? { ...item, count: item.count + 1 } : item
      )
    );
    const burstId = Date.now() + Math.random();
    const randomX = Math.floor(Math.random() * 65) + 12;
    setFloatingEmojis((prev) => [
      ...prev.slice(-10),
      { id: burstId, emoji, label, x: randomX },
    ]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((f) => f.id !== burstId));
    }, 1600);
  };

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode]);

  const availableDistricts = UZBEKISTAN_LOCATIONS[region] || [];

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const districts = UZBEKISTAN_LOCATIONS[newRegion] || [];
    setDistrict(districts[0] || '');
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Faqat rasm faylini tanlang');
      return;
    }
    try {
      const optimized = await readAndOptimizeAvatarFile(file);
      if (optimized) {
        setAvatarUrl(optimized);
        playKitestSound('success', soundEnabled);
      }
    } catch {
      setError('Rasmni yuklashda xatolik');
    }
    e.target.value = '';
  };

  // 1-Click Quick Login with an existing account from recentUsers
  const handleQuickAccountLogin = async (targetUser: User) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickUserId: targetUser.id,
          login: targetUser.username || targetUser.email,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('success', soundEnabled);
        onAuthSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
      } else {
        setEmailOrUsername(targetUser.username || targetUser.email);
        setMode('login');
        loginInputRef.current?.focus();
      }
    } catch {
      setEmailOrUsername(targetUser.username || targetUser.email);
      setMode('login');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Incognito / Accountless Entry ("Accountsiz kirishni ikiʼonikto kirishdek boladi")
  const handleIncognitoEnter = () => {
    setError('');
    playKitestSound('victory', soundEnabled);
    confetti({ particleCount: 45, spread: 65, origin: { y: 0.65 } });
    const customAlias = quickName.trim();
    const incognitoUser: User = {
      id: `incognito_${Date.now()}`,
      name: customAlias ? `${customAlias} (Inkognito)` : 'Inkognito Foydalanuvchi',
      username: 'inkognito_rejim',
      email: 'incognito@kitest.uz',
      role: 'user',
      rating: 1200,
      ratingTitle: '🕵️ Inkognito (Accountsiz)',
      solvedCount: 0,
      totalScore: 0,
      coins: 25,
      stars: 1,
      starColor: 'blue',
      starRankTitle: 'Inkognito',
      scoreMultiplier: 1,
      rank: 0,
      region: 'Maxfiy (Inkognito)',
      district: 'Accountsiz Sessiya',
      institution: 'Inkognito Rejim',
      bio: "Accountsiz (Inkognito) maxfiy rejim orqali kirilgan — shaxsiy hisob va tarix saqlanmaydi.",
      avatarEmoji: '🕵️',
      customBadge: '🕵️ INKOGNITO',
      isIncognito: true,
    };
    onAuthSuccess(incognitoUser);
  };

  const handleQuickFirstTimeEnter = handleIncognitoEnter;

  // Password Reset Handler inside Login Tab
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    const targetLogin = resetLogin.trim() || emailOrUsername.trim();
    if (!targetLogin || resetNewPassword.trim().length < 4) {
      setError(
        'Username/Email va kamida 4 belgidan iborat yangi parolni kiriting!'
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: targetLogin,
          newPassword: resetNewPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Parolni tiklashda xatolik');
      } else if (data.user) {
        setResetMessage('Parol yangilandi! Hisobingizga kirilmoqda...');
        playKitestSound('success', soundEnabled);
        onAuthSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Real Google Account OAuth Popup Handler ("google orqali kirishda haqiqiy google account tekshirilsin boshqa zamonaviy platformadagidek")
  const handleRealGoogleSignIn = async () => {
    playKitestSound('click', soundEnabled);
    setError('');
    setLoading(true);
    try {
      const verifiedGoogle = await signInWithRealGooglePopup();
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedGoogle.email,
          name: verifiedGoogle.name,
          avatarUrl: verifiedGoogle.photoURL,
          idToken: verifiedGoogle.idToken,
          googleUid: verifiedGoogle.uid,
          region,
          district,
          institution: institution.trim() || 'Google Account Foydalanuvchisi',
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('victory', soundEnabled);
        onAuthSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
      } else {
        setError(data.error || 'Google orqali kirishda xatolik');
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (!code.includes('popup-closed-by-user')) {
        setError(
          "Google oynasi orqali kirishda xatolik yuz berdi. Brauzerda popup oynaga ruxsat bering yoki Login/Face ID orqali kiring."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fallback Google Account Login Handler
  const handleGoogleAccountSelect = async (
    gEmail: string,
    gName: string,
    gAvatar?: string
  ) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gEmail.trim().toLowerCase(),
          name: gName.trim(),
          avatarUrl: gAvatar,
          region,
          district,
          institution: institution.trim() || 'Google Account Foydalanuvchisi',
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setIsGooglePickerOpen(false);
        playKitestSound('victory', soundEnabled);
        onAuthSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
      } else {
        setError(data.error || 'Google orqali kirishda xatolik');
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Face ID Verification Handler (Login / Enroll / Forgot Password / Admin)
  const handleFaceVerified = async (
    capturedDataUrl: string,
    modalLogin?: string,
    modalNewPassword?: string,
    faceDescriptor?: number[]
  ) => {
    const activeMode = faceModalMode;
    setFaceModalMode(null);

    if (activeMode === 'enroll') {
      setFaceIdDataUrl(capturedDataUrl);
      playKitestSound('success', soundEnabled);
      return;
    }

    if (activeMode === 'admin') {
      playKitestSound('victory', soundEnabled);
      onUnlockAdmin(ADMIN_PASSCODE_VALUE);
      return;
    }

    // Login or Reset via Real Camera Face ID
    setLoading(true);
    setError('');
    try {
      const effectiveLogin =
        modalLogin ||
        resetLogin.trim() ||
        emailOrUsername.trim() ||
        username.trim() ||
        name.trim();
      const effectiveNewPassword =
        modalNewPassword ||
        (activeMode === 'forgot' && resetNewPassword.trim().length >= 4
          ? resetNewPassword.trim()
          : undefined);

      const res = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: effectiveLogin,
          faceIdDataUrl: capturedDataUrl,
          faceDescriptor,
          newPassword: effectiveNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('victory', soundEnabled);
        onAuthSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
      } else {
        setError(data.error || 'Face ID orqali kirishda xatolik');
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Auto-open when user types correct password ("Keyin parol to'g'ri bo'lsa avtomatik ochsin")
  const handleLoginPasswordChange = async (val: string) => {
    setPassword(val);
    if (error) setError('');

    if (val.trim() === ADMIN_PASSCODE_VALUE) {
      playKitestSound('victory', soundEnabled);
      onUnlockAdmin(ADMIN_PASSCODE_VALUE);
      return;
    }

    if (mode === 'login' && val.trim().length >= 4 && emailOrUsername.trim()) {
      const targetLogin = emailOrUsername.trim().toLowerCase().replace(/^@+/, '');
      const matched = recentUsers.find(
        (u) =>
          u.username.toLowerCase() === targetLogin ||
          u.email.toLowerCase() === targetLogin ||
          u.name.toLowerCase() === targetLogin
      );
      if (matched && matched.rawPassword && matched.rawPassword === val) {
        setLoading(true);
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              login: emailOrUsername.trim(),
              password: val,
            }),
          });
          const data = await res.json();
          if (res.ok && data.user) {
            playKitestSound('success', soundEnabled);
            onAuthSuccess(
              data.user,
              Array.isArray(data.users) ? data.users : undefined
            );
          }
        } catch {
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'admin') {
      if (adminCode.trim() === ADMIN_PASSCODE_VALUE) {
        playKitestSound('victory', soundEnabled);
        onUnlockAdmin(ADMIN_PASSCODE_VALUE);
      } else {
        setError("Admin paroli noto'g'ri");
      }
      return;
    }

    if (
      mode === 'login' &&
      (password.trim() === ADMIN_PASSCODE_VALUE ||
        emailOrUsername.trim() === ADMIN_PASSCODE_VALUE)
    ) {
      playKitestSound('victory', soundEnabled);
      onUnlockAdmin(ADMIN_PASSCODE_VALUE);
      return;
    }

    if (
      mode === 'register' &&
      confirmPassword.trim().length > 0 &&
      password !== confirmPassword
    ) {
      setError('Parol va tasdiqlash paroli bir-biriga mos emas!');
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        mode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const cleanName =
        name.trim() || username.trim() || emailOrUsername.trim();
      const cleanUsername = (
        username.trim() ||
        emailOrUsername.trim().split('@')[0] ||
        cleanName
      )
        .toLowerCase()
        .replace(/^@+/, '')
        .replace(/\s+/g, '_');
      const cleanEmail = emailOrUsername.trim().includes('@')
        ? emailOrUsername.trim()
        : `${cleanUsername}@kitest.uz`;

      const body =
        mode === 'login'
          ? {
              login: emailOrUsername.trim() || username.trim() || name.trim(),
              email: emailOrUsername.trim() || username.trim() || name.trim(),
              password,
            }
          : {
              name: cleanName,
              username: cleanUsername,
              email: cleanEmail,
              password,
              confirmPassword: confirmPassword || undefined,
              region,
              district,
              institution: institution.trim() || "O'quvchi",
              avatarUrl: avatarUrl || undefined,
              faceIdDataUrl: faceIdDataUrl || undefined,
              faceDescriptor:
                faceDescriptor.length >= 64 ? faceDescriptor : undefined,
              faceIdEnabled: Boolean(faceIdDataUrl || faceDescriptor.length >= 64),
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Xatolik yuz berdi');
      } else if (data.user) {
        let finalUser: User = data.user;
        let finalUsers: User[] | undefined = Array.isArray(data.users)
          ? data.users
          : undefined;

        if (mode === 'register' && avatarUrl && !finalUser.avatarUrl) {
          try {
            const profRes = await fetch(`/api/users/${finalUser.id}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: finalUser.name,
                username: finalUser.username,
                region: finalUser.region,
                district: finalUser.district,
                school: finalUser.school || finalUser.institution,
                avatarUrl,
              }),
            });
            const profData = await profRes.json();
            if (profRes.ok && profData.user) {
              finalUser = profData.user;
              if (Array.isArray(profData.users)) {
                finalUsers = profData.users;
              }
            }
          } catch {}
        }

        playKitestSound('success', soundEnabled);
        onAuthSuccess(finalUser, finalUsers);
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      {/* Glowing Cosmic & Aurora Ambient Background Layers */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
      </div>

      {/* Top Navigation & Studio Command Bar on Entry Screen */}
      <header className="relative z-20 w-full border-b border-white/[0.08] bg-[#0b0f17]/90 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <KitestEmblem size="md" showVerifiedSeal={true} />
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 border-l border-white/10 pl-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI STUDIO WORKSPACE</span>
            </span>
          </div>

          {/* Clean Studio Controls */}

          {/* Right Sleek Studio Controls (Non-toyish, clean architectural buttons) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playKitestSound('click', soundEnabled);
                setMode('login');
                setError('');
                setTimeout(() => loginInputRef.current?.focus(), 80);
              }}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                mode === 'login'
                  ? 'bg-white text-slate-950 border-white shadow-sm'
                  : 'bg-[#111622] hover:bg-slate-800/80 text-slate-200 border-white/10'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Kirish</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playKitestSound('click', soundEnabled);
                setMode('register');
                setError('');
              }}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold hidden sm:flex items-center gap-1.5 transition-all border ${
                mode === 'register'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm'
                  : 'bg-[#111622] hover:bg-slate-800/80 text-slate-200 border-white/10'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Ro'yxatdan o'tish</span>
            </button>

            <button
              type="button"
              onClick={handleIncognitoEnter}
              className="py-1.5 px-3.5 rounded-lg bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/50 hover:to-fuchsia-600/50 border border-violet-400/50 text-violet-200 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Accountsiz (Inkognito) maxfiy rejimda darhol kirish"
            >
              <span>🕵️</span>
              <span>Inkognito Kirish</span>
            </button>

            {onOpenOnboardingGuide && (
              <button
                type="button"
                onClick={onOpenOnboardingGuide}
                className="py-1.5 px-3 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-sky-500/30 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Onlayn Tutorial va Yo'riqnoma"
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>🎓 Tutorial</span>
              </button>
            )}

            {/* Quick Live Emotions in Header matching user request */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111622] border border-white/10">
              <span className="text-[11px] text-amber-300 font-bold mr-1 hidden sm:inline">✨ Emotsiyalar:</span>
              {emotions.slice(0, 5).map((emo, eIdx) => (
                <button
                  key={`hdr_emo_${emo.id}_${eIdx}`}
                  type="button"
                  onClick={() => handleTriggerEmotion(emo.id, emo.emoji, emo.label)}
                  className="hover:scale-130 active:scale-95 transition-transform text-sm cursor-pointer p-0.5"
                  title={`${emo.label} (${emo.count})`}
                >
                  {emo.emoji}
                </button>
              ))}
            </div>

            {onOpenLuckyWheel && (
              <button
                type="button"
                onClick={onOpenLuckyWheel}
                className="py-1.5 px-3 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-white/10 text-slate-200 text-xs font-medium hidden md:flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Baraban</span>
              </button>
            )}

            {onOpenCertificatesStore && (
              <button
                type="button"
                onClick={onOpenCertificatesStore}
                className="py-1.5 px-3 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-white/10 text-slate-200 text-xs font-medium hidden xl:flex items-center gap-1.5 transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Do'kon</span>
              </button>
            )}

            <a
              href={OFFICIAL_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title="KITEST Rasmiy YouTube Kanali"
            >
              <Youtube className="w-4 h-4 text-rose-400" />
            </a>

            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                className="p-2 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-white/10 text-slate-300"
                title="Ovoz effektlari"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 rounded-lg bg-[#111622] hover:bg-slate-800/80 border border-white/10 text-slate-300"
                title="Mavzuni almashtirish"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-700" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Split Entry Content: Left Google AI Studio Showcase + Right Clean Auth Workspace */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT 7 COLUMNS: GOOGLE AI STUDIO HERO, ROTATING SHOWCASE CAROUSEL & LIVE EMOTIONS */}
        <div className="lg:col-span-7 space-y-5 relative">


          {/* Sleek Studio Brand Header & Animated Typography with Ajoyib Varrak */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 text-xs font-mono text-sky-400 tracking-wider uppercase">
                <img
                  src={KIDTEST_LOGO_DATA_URL}
                  alt="KITEST"
                  className="w-8 h-8 rounded-lg object-cover border border-white/15"
                />
                <span>KITEST.AI STUDIO</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">MILLIY INTELLEKTUAL PLATFORMA</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-black tracking-tight leading-[1.12] text-white">
                <AnimatedWords
                  text="KITEST TA'LIM VA ALGORITM STUDIYASI"
                  variant="colorful"
                  className="block"
                />
                <span className="block mt-1 text-xl sm:text-3xl font-extrabold text-slate-200">
                  <AnimatedLetters
                    text="DUNYO YOSHLAR QO'LIDA — BILIM, KOD VA AI!"
                    colorful={true}
                    effectOverride="gold"
                  />
                </span>
              </h1>

              <div className="text-xs sm:text-sm text-slate-400 font-medium flex flex-wrap items-center gap-2">
                <span className="text-slate-300 font-semibold">Jonli modul:</span>
                <RotatingPlainText
                  phrases={[
                    '🚀 Google Account va Haqiqiy Kamera Face ID orqali 1-soniyada kirish',
                    '🧠 AI Test Tuzuvchi: Mavzu va savol sonini kiriting — AI tayyorlaydi',
                    '📚 3D Varaqlanadigan Kitoblar, Video Kurslar va Ustozga Savol',
                    '⭐ Rang-barang Yulduzlar (Ko‘k, Yashil, Qizil, Sariq, Binafsha) • 2x–5x Ball',
                  ]}
                />
              </div>
            </div>

            {/* AJOYIB VARRAK RASMI (Glorious Flying Kite matching user request) */}
            <div className="shrink-0 flex items-center justify-center p-2 relative">
              <KitestGloriousKite size={120} />
            </div>
          </div>

          {/* JONLI EMOTSIYALAR VA UCHADIGAN VARRAKLAR (Expanded emotions and kites) */}
          <div className="p-3.5 rounded-2xl bg-[#0d121c]/95 border border-sky-500/20 backdrop-blur-xl shadow-lg space-y-3">
            <InteractiveEmotionsStrip
              soundEnabled={soundEnabled}
              onEmotionClick={(emoji) => handleTriggerEmotion('custom', emoji, 'Reaksiya')}
            />
          </div>

          {/* AUTO-ROTATING GOOGLE AI STUDIO VISUAL SHOWCASE CAROUSEL ("rasmlar aylanadi xullas google studio kirgandagi oyna") */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d121c] shadow-2xl group">
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              <AnimatePresence mode="wait">
                {(() => {
                  const slide = STUDIO_SHOWCASE_SLIDES[activeSlide];
                  return (
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.65, ease: 'easeOut' }}
                      className="absolute inset-0"
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/65 to-transparent" />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`}
                      />

                      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex flex-col justify-end space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                            {slide.tag}
                          </span>
                          <span className="text-[11px] font-mono text-amber-300">
                            {slide.stat}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-xl font-bold text-white leading-snug">
                          {slide.title}
                        </h3>
                        <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
                          {slide.subtitle}
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Carousel Prev / Next Studio Controls */}
              <button
                type="button"
                onClick={() =>
                  setActiveSlide(
                    (prev) =>
                      (prev - 1 + STUDIO_SHOWCASE_SLIDES.length) %
                      STUDIO_SHOWCASE_SLIDES.length
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/75 border border-white/15 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                title="Oldingi rasm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveSlide(
                    (prev) => (prev + 1) % STUDIO_SHOWCASE_SLIDES.length
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/50 hover:bg-black/75 border border-white/15 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                title="Keyingi rasm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Carousel Slide Switcher Bar + Studio Quick Actions */}
            <div className="px-4 py-3 bg-[#0b0f17] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {STUDIO_SHOWCASE_SLIDES.map((s, idx) => (
                  <button
                    key={`showcase_slide_${s.id}_${idx}`}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeSlide
                        ? 'w-8 bg-sky-400'
                        : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                    title={s.title}
                  />
                ))}
                <span className="text-[11px] font-mono text-slate-400 ml-1">
                  0{activeSlide + 1} / 0{STUDIO_SHOWCASE_SLIDES.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGoogleContinueModalOpen(true)}
                  className="py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Continue to KITEST (Google)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFaceModalMode('login')}
                  className="py-1.5 px-3 rounded-lg bg-[#161f30] hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ScanFace className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kamera Face ID</span>
                </button>
                <button
                  type="button"
                  onClick={handleIncognitoEnter}
                  className="py-1.5 px-3 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>🕵️</span>
                  <span>Inkognito Kirish</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clean Google AI Studio Telemetry & Feature Strip (100% Real stats) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0d121c] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>O&apos;quvchilar</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {usersCount} ta
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Haqiqiy foydalanuvchilar
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d121c] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Darsliklar & Test</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {testsCount} ta
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Mavjud sinov savollari
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d121c] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Natijalar</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {submissionsCount ?? 0} ta
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Topshirilgan natijalar
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d121c] border border-white/[0.08]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Olimpiada & ICPC</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {contestsCount ?? 0} ta
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                1v1 Duellar va Bellashuv
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: GOOGLE AI STUDIO ARCHITECTURAL AUTH WORKSPACE */}
        <div className="lg:col-span-5 space-y-4">
          {/* MAIN GOOGLE AI STUDIO LOGIN / REGISTER / ADMIN WORKSPACE CARD */}
          <div className="w-full rounded-2xl bg-[#0d121c]/95 border border-white/10 shadow-2xl backdrop-blur-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-sky-400 mb-0.5">
                  KITEST.AI STUDIO AUTHENTICATION
                </div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4 text-sky-400" />
                      <span>Shaxsiy Hisobga Kirish</span>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Yangi Studio Hisob Yaratish</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Bosh Admin Boshqaruv Tizimi</span>
                    </>
                  )}
                </h2>
              </div>
            </div>

            {/* Sleek Segmented 3-Tab Mode Switcher (Non-toyish Studio style) */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#090c14] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setIsResetOpen(false);
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                  setIsResetOpen(false);
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'register'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ro'yxatdan o'tish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('admin');
                  setError('');
                  setIsResetOpen(false);
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 font-medium">
                {error}
              </div>
            )}

            {resetMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 font-medium">
                {resetMessage}
              </div>
            )}

            {/* GOOGLE ACCOUNTGA KIRISH - KITEST ILOVASI UCHUN */}
            {mode !== 'admin' && (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsGoogleContinueModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg cursor-pointer border border-slate-200"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="block font-black text-slate-950 text-xs sm:text-sm">
                      Continue to KITEST (Google)
                    </span>
                    <span className="block text-[10px] text-slate-600 font-semibold">
                      Google hisobingiz orqali 1-bosishda xavfsiz kiring
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    yoki biometrik & login
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playKitestSound('click', soundEnabled);
                    setFaceModalMode(mode === 'register' ? 'enroll' : 'login');
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#141c2e] hover:bg-[#1a253d] border border-sky-500/35 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ScanFace className="w-4 h-4 text-sky-400" />
                  <span>
                    {mode === 'register'
                      ? faceIdDataUrl
                        ? '✅ Face ID Saqlandi'
                        : '👁️ Face ID Kiritish (Kamera)'
                      : '👁️ Face ID Orqali Kirish'}
                  </span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'admin' ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setFaceModalMode('admin')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600/25 to-amber-500/25 hover:from-sky-600/40 hover:to-amber-500/40 border border-sky-400/50 text-sky-200 font-extrabold text-xs flex items-center justify-center gap-2"
                  >
                    <ScanFace className="w-4 h-4 text-sky-400" />
                    <span>👁️ Yuz Orqali (Face ID) Admin Panelni Ochish</span>
                  </button>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Maxsus Admin Paroli</span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ⚡ To'g'ri bo'lsa avto-ochiladi
                      </span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={adminCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdminCode(val);
                          if (val.trim() === ADMIN_PASSCODE_VALUE) {
                            playKitestSound('victory', soundEnabled);
                            onUnlockAdmin(ADMIN_PASSCODE_VALUE);
                          }
                        }}
                        placeholder="Admin kodini kiriting..."
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panelga Kirish</span>
                  </button>
                </div>
              ) : (
                <>
                  {mode === 'register' && (
                    <>
                      {/* Photo Upload Row */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={avatarUrl || KIDTEST_LOGO_DATA_URL}
                            alt="Avatar"
                            className="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-slate-800 p-0.5 shrink-0"
                          />
                          <div>
                            <div className="text-xs font-semibold text-white">
                              Profil rasmi (ixtiyoriy)
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Asl holicha saqlanadi
                            </div>
                          </div>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                          <span>Tanlash</span>
                        </button>
                      </div>

                      {/* Face ID Enrollment for New Users */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-950 border border-emerald-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          {faceIdDataUrl ? (
                            <img
                              src={faceIdDataUrl}
                              alt="Face ID"
                              className="w-9 h-9 rounded-lg object-cover border border-emerald-400 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                              <ScanFace className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Face ID Biometrikasi</span>
                              {faceIdDataUrl ? (
                                <span className="text-[10px] text-emerald-400 font-bold">
                                  ✓ Saqlandi
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-300 font-bold">
                                  (1-urinishda)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {faceIdDataUrl
                                ? "Yuzingiz muvaffaqiyatli saqlandi"
                                : "Kamera orqali 1-saqlashda yuzni kiritish"}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playKitestSound('click', soundEnabled);
                            setFaceModalMode('enroll');
                          }}
                          className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                            faceIdDataUrl
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          }`}
                        >
                          <ScanFace className="w-3.5 h-3.5" />
                          <span>{faceIdDataUrl ? "O'zgartirish" : 'Yuzni Kiritish'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Ism va familiya *
                          </label>
                          <div className="relative">
                            <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Ali Valiyev"
                              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Username (@login — faqat 1 marta) *
                          </label>
                          <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="ali_valiyev"
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Viloyat / Hudud *
                          </label>
                          <div className="relative">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                              value={region}
                              onChange={(e) => handleRegionChange(e.target.value)}
                              className="w-full pl-8 pr-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                            >
                              {REGIONS_LIST.filter((r) => r !== 'Barchasi').map(
                                (r, rIdx) => (
                                  <option
                                    key={`auth_reg_${r}_${rIdx}`}
                                    value={r}
                                    className="bg-slate-900"
                                  >
                                    {r}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            Tuman / Shahar *
                          </label>
                          <select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            {availableDistricts.map((d, dIdx) => (
                              <option
                                key={`auth_dist_${d}_${dIdx}`}
                                value={d}
                                className="bg-slate-900"
                              >
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Maktab yoki OTM (ixtiyoriy)
                        </label>
                        <div className="relative">
                          <Building2 className="w-3.5 h-3.5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="Masalan: Prezident maktabi, 15-maktab"
                            className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {mode === 'login'
                        ? 'Email, @username yoki Ism *'
                        : 'Email (faqat 1 marta foydalaniladi) *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={loginInputRef}
                        type="text"
                        required={mode === 'login'}
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        placeholder={
                          mode === 'login'
                            ? 'username, ism yoki email@kitest.uz'
                            : 'email@kitest.uz'
                        }
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className={mode === 'register' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5' : ''}>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Parol *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => handleLoginPasswordChange(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Parolni tasdiqlang *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Qayta kiriting"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  {mode === 'login' && (
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                        />
                        <span>Meni eslab qolish</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          playKitestSound('click', soundEnabled);
                          setFaceModalMode('forgot');
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Parolni unutdingizmi? (Username + Face ID)</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm text-white flex items-center justify-center gap-2 transition-colors shadow-lg ${
                      mode === 'register'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                        : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {loading
                        ? 'Yuklanmoqda...'
                        : mode === 'register'
                        ? "Ro'yxatdan o'tish va Platformaga kirish"
                        : 'Hisobga Kirish (Login)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </form>

            {/* INCOGNITO (ACCOUNTSIZ) ENTRY MODE CARD */}
            <div className="pt-3.5 border-t border-slate-800/90 space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-950/50 via-slate-900 to-fuchsia-950/40 border border-violet-500/40 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-sm">
                      🕵️
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-violet-200 flex items-center gap-1.5">
                        <span>Inkognito (Accountsiz) Kirish</span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/25 border border-violet-400/40 text-[9px] font-black text-violet-300 uppercase">
                          MAXFIY REJIM
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Account ochmasdan va parolsiz inkognito rejimda darhol kiring
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Taxallus (ixtiyoriy, masalan: Mehmon)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950/90 border border-violet-500/30 text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                  <button
                    type="button"
                    onClick={handleIncognitoEnter}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-extrabold text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all cursor-pointer"
                  >
                    <span>🕵️</span>
                    <span>Inkognito Kirish</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REAL CAMERA FACE ID BIOMETRIC SCANNER MODAL */}
      <FaceIdScannerModal
        isOpen={faceModalMode !== null}
        mode={faceModalMode || 'login'}
        initialLogin={emailOrUsername}
        soundEnabled={soundEnabled}
        onClose={() => setFaceModalMode(null)}
        onEnrolled={(dataUrl, descriptor) => {
          setFaceIdDataUrl(dataUrl);
          if (Array.isArray(descriptor) && descriptor.length >= 64) {
            setFaceDescriptor(descriptor);
          }
          playKitestSound('success', soundEnabled);
          setFaceModalMode(null);
        }}
        onLoginSuccess={(user, allUsers) => {
          const wasAdminMode = faceModalMode === 'admin';
          setFaceModalMode(null);
          onAuthSuccess(user, allUsers);
          if (wasAdminMode) {
            onUnlockAdmin(ADMIN_PASSCODE_VALUE);
          }
        }}
        onAdminUnlocked={(code) => {
          setFaceModalMode(null);
          onUnlockAdmin(code || ADMIN_PASSCODE_VALUE);
        }}
      />

      {/* GOOGLE "CONTINUE TO KITEST" MODAL - 100% matches user request */}
      <GoogleContinueModal
        isOpen={isGoogleContinueModalOpen}
        onClose={() => setIsGoogleContinueModalOpen(false)}
        onSuccess={(user, allUsers) => {
          setIsGoogleContinueModalOpen(false);
          onAuthSuccess(user, allUsers);
        }}
        soundEnabled={soundEnabled}
      />

      {/* UCHADIGAN VARRAK VA EMOTSIYALAR (Faqat harakat yoki so'z ustiga kelganda paydo bo'ladi) */}
      <FlyingKitesAndEmotionsOverlay
        soundEnabled={soundEnabled}
        enableAmbientKites={false}
      />

      {/* ROTATING ACTION LOADER - Spinning animation when creating account or logging in */}
      <KitestRotatingActionLoader
        isOpen={loading}
        variant={mode === 'register' ? 'account' : 'login'}
        title={mode === 'register' ? 'Hisob yaratilmoqda' : 'Tizimga kirilmoqda'}
        subtitle={
          mode === 'register'
            ? "Yangi o'quvchi hisobi yaratilmoqda va barcha modullar sozlanmoqda..."
            : "Foydalanuvchi ma'lumotlari tasdiqlanmoqda va platforma ochilmoqda..."
        }
      />

      {/* FLOATING JOYFUL EMOJI BURSTS */}
      {floatingEmojis.map((f, fIdx) => (
        <motion.div
          key={`float_emo_${f.id}_${fIdx}`}
          initial={{ opacity: 1, y: 0, scale: 0.9 }}
          animate={{ opacity: 0, y: -200, scale: 1.6 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ left: `${f.x}%` }}
          className="fixed bottom-16 pointer-events-none z-50 flex items-center gap-1.5 text-3xl font-black drop-shadow-2xl"
        >
          <span>{f.emoji}</span>
          <span className="text-xs font-black text-amber-300 bg-slate-950/90 px-2.5 py-1 rounded-full border border-amber-400/40 shadow-lg">
            {f.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
