import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  TestItem,
  Contest,
  Submission,
  CertificateData,
  StoreCertificate,
  RankClass,
  RANK_CLASS_LIST,
  StarColor,
  STAR_COLOR_META,
  computeRankClass,
  ADMIN_EMAIL,
  OnlinePresenceUser,
  UserPermissions,
} from '../types';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  ShieldCheck,
  UserPlus,
  Users,
  FileText,
  Trophy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PlusCircle,
  Plus,
  Calendar,
  Clock,
  Lock,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  Award,
  Zap,
  Crown,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Search,
  Edit3,
  Send,
  X,
  GraduationCap,
  Youtube,
  ExternalLink,
  Upload,
  Save,
  Video,
  Radio,
  Activity,
  ScanFace,
  Sliders,
  ShoppingBag,
  Gamepad2,
} from 'lucide-react';
import { OFFICIAL_YOUTUBE_URL } from '../types';
import { KIDTEST_LOGO_DATA_URL } from './KitestEmblem';
import { FaceIdScannerModal } from './FaceIdScannerModal';

interface AdminPanelProps {
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  onUnlockAdmin: (passcode: string) => void;
  onLockAdmin: () => void;
  users: User[];
  tests: TestItem[];
  contests: Contest[];
  submissions?: Submission[];
  storeCertificates?: StoreCertificate[];
  screenshotProtectionEnabled?: boolean;
  onToggleScreenshotProtection?: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onNavigateCreateTest: () => void;
  onOpenCertificate?: (cert: CertificateData) => void;
  onOpenCertificatesStore?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenMajlis?: () => void;
}

type AdminSectionTab =
  | 'ratings'
  | 'wallet_grants'
  | 'announcements'
  | 'digital_game'
  | 'monitor'
  | 'certificates'
  | 'creators'
  | 'users'
  | 'tests'
  | 'contests'
  | 'platform_controls';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  onUnlockAdmin,
  onLockAdmin,
  users,
  tests,
  contests,
  submissions = [],
  storeCertificates = [],
  screenshotProtectionEnabled = true,
  onToggleScreenshotProtection,
  onRefreshData,
  onNavigateCreateTest,
  onOpenCertificate,
  onOpenCertificatesStore,
  onOpenLuckyWheel,
  onOpenMajlis,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSectionTab>('ratings');
  const [liveOnlineUsers, setLiveOnlineUsers] = useState<OnlinePresenceUser[]>([]);
  const [majlisParticipantCount, setMajlisParticipantCount] = useState<number>(0);

  // Edit Test Modal State
  const [editingTest, setEditingTest] = useState<TestItem | null>(null);
  const [editTestTitle, setEditTestTitle] = useState('');
  const [editTestSubject, setEditTestSubject] = useState('');
  const [editTestDesc, setEditTestDesc] = useState('');
  const [editTestDuration, setEditTestDuration] = useState(20);
  const [editTestDifficulty, setEditTestDifficulty] = useState<'Oson' | "O'rta" | 'Qiyin'>("O'rta");
  const [editUserName, setEditUserName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRegion, setEditUserRegion] = useState('Toshkent shahri');
  const [editUserSchool, setEditUserSchool] = useState('');
  const [editUserBio, setEditUserBio] = useState('');
  const [editUserPermissions, setEditUserPermissions] = useState<UserPermissions>({
    canCreateTests: true,
    canHostMajlis: false,
    canModerateChat: false,
    canUploadCourses: false,
    canTakeScreenshots: false,
  });

  // Create New User in Admin Panel state
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRegion, setNewUserRegion] = useState('Toshkent shahri');
  const [newUserScore, setNewUserScore] = useState(50);

  useEffect(() => {
    const fetchMonitor = async () => {
      try {
        const res = await fetch('/api/admin/online-monitor', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.onlineUsers)) {
          setLiveOnlineUsers(data.onlineUsers);
        }
        if (data.majlisRoom && Array.isArray(data.majlisRoom.participants)) {
          setMajlisParticipantCount(data.majlisRoom.participants.length);
        }
      } catch {}
    };
    fetchMonitor();
    const timer = setInterval(fetchMonitor, 3000);
    return () => clearInterval(timer);
  }, []);

  // Inline passcode & Face ID state when not unlocked yet
  const [inputPasscode, setInputPasscode] = useState('');
  const [showInputPasscode, setShowInputPasscode] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [isAdminFaceScannerOpen, setIsAdminFaceScannerOpen] = useState(false);

  // Add Creator form state
  const [creatorName, setCreatorName] = useState('');
  const [creatorUsername, setCreatorUsername] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorPassword, setCreatorPassword] = useState('');
  const [creatorBio, setCreatorBio] = useState('');
  const [creatorStatus, setCreatorStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmittingCreator, setIsSubmittingCreator] = useState(false);

  // Add Contest form state
  const [contestTitle, setContestTitle] = useState('');
  const [contestSubtitle, setContestSubtitle] = useState('');
  const [contestStartsAt, setContestStartsAt] = useState('Bugun, 19:00');
  const [contestDuration, setContestDuration] = useState(90);
  const [contestStatus, setContestStatus] = useState<
    'Upcoming' | 'Running' | 'Finished'
  >('Upcoming');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [isSubmittingContest, setIsSubmittingContest] = useState(false);

  // Search & Rating Management state
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editRating, setEditRating] = useState<number>(0);
  const [editCoins, setEditCoins] = useState<number>(0);
  const [editStars, setEditStars] = useState<number>(0);
  const [editRankClass, setEditRankClass] = useState<string>('auto');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editWheelSpins, setEditWheelSpins] = useState<number>(0);
  const [editIsPremium, setEditIsPremium] = useState<boolean>(false);
  const [editScreenshotAllowed, setEditScreenshotAllowed] =
    useState<boolean>(false);
  const [editChatMuted, setEditChatMuted] = useState<boolean>(false);
  const [editBadge, setEditBadge] = useState<string>('');
  const [editRole, setEditRole] = useState<'user' | 'creator' | 'admin'>('user');
  const [editStarColor, setEditStarColor] = useState<StarColor>('blue');
  const [editStarRankTitle, setEditStarRankTitle] = useState<string>('Noob');
  const [editScoreMultiplier, setEditScoreMultiplier] = useState<number>(1);
  const [ratingStatusMsg, setRatingStatusMsg] = useState<string | null>(null);
  const [isBusyAction, setIsBusyAction] = useState(false);

  // Dedicated "Ball / Tanga / Yulduz Qo'shish" Modal State
  const [isAddScoreModalOpen, setIsAddScoreModalOpen] = useState(false);
  const [scoreTargetUserId, setScoreTargetUserId] = useState<string>('');
  const [scoreDeltaAmount, setScoreDeltaAmount] = useState<number>(100);
  const [coinsDeltaAmount, setCoinsDeltaAmount] = useState<number>(25);
  const [starsDeltaAmount, setStarsDeltaAmount] = useState<number>(5);
  const [scoreCustomBadge, setScoreCustomBadge] = useState<string>('');

  // Custom Certificate Generator state
  const [certRecipientId, setCertRecipientId] = useState<string>(
    users[0]?.id || ''
  );
  const [certTitle, setCertTitle] = useState<string>(
    'Respublika CHSB va Fan Olimpiadasi — 100% Mukammal Natija'
  );
  const [certSubject, setCertSubject] = useState<string>('Matematika va Informatika');
  const [certPoints, setCertPoints] = useState<number>(100);
  const [certQuestions, setCertQuestions] = useState<number>(20);

  // Admin Store Certificate Upload ("admin da ham boladi sertificat joylash unda ballni jozadi va sertificat yuklaydi")
  const [storeCertTitle, setStoreCertTitle] = useState<string>('');
  const [storeCertSubject, setStoreCertSubject] = useState<string>('Matematika va Informatika');
  const [storeCertRequiredPoints, setStoreCertRequiredPoints] = useState<number>(50);
  const [storeCertBadge, setStoreCertBadge] = useState<string>('RASMIY SERTIFIKAT');
  const [storeCertImageUrl, setStoreCertImageUrl] = useState<string>('');
  const [storeCertDesc, setStoreCertDesc] = useState<string>('');
  const [storeCertStatus, setStoreCertStatus] = useState<string | null>(null);
  const storeCertFileRef = React.useRef<HTMLInputElement>(null);

  // Admin Broadcast Announcement state
  const [broadcastRoom, setBroadcastRoom] = useState<string>('global');
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // New Real Admin Tools State:
  // 1. Platform Notification Broadcasting
  const [notifTitle, setNotifTitle] = useState<string>('');
  const [notifText, setNotifText] = useState<string>('');
  const [notifIcon, setNotifIcon] = useState<string>('📢');
  const [notifTab, setNotifTab] = useState<string>('home');
  const [notifLinkUrl, setNotifLinkUrl] = useState<string>('');
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  // 2. Real-Time Dedicated Wallet Grant Console
  const [grantUserId, setGrantUserId] = useState<string>('all');
  const [grantDeltaScore, setGrantDeltaScore] = useState<number>(50);
  const [grantDeltaCoins, setGrantDeltaCoins] = useState<number>(25);
  const [grantDeltaStars, setGrantDeltaStars] = useState<number>(1);
  const [grantReason, setGrantReason] = useState<string>("Faollik va rag'bat uchun");
  const [grantStatusMsg, setGrantStatusMsg] = useState<string | null>(null);

  const isMainAdminAccount =
    currentUser &&
    (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser.role === 'admin' ||
      currentUser.username.toLowerCase() === 'behruz_admin');

  const hasAdminAccess = Boolean(isAdminUnlocked || isMainAdminAccount);
  const effectivePasscode = adminPasscode || ADMIN_PASSCODE_VALUE;

  const adminHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': currentUser?.email || ADMIN_EMAIL,
    'x-admin-passcode': effectivePasscode,
  };

  // All 100% submissions
  const perfectSubmissions = useMemo(
    () =>
      submissions.filter(
        (s) =>
          s.percentage === 100 ||
          (s.totalQuestions > 0 && s.correctCount === s.totalQuestions)
      ),
    [submissions]
  );

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.rating - a.rating;
      }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return sortedUsers;
    const q = userSearch.toLowerCase();
    return sortedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.region || '').toLowerCase().includes(q)
    );
  }, [sortedUsers, userSearch]);

  const handlePasscodeChange = (val: string) => {
    setInputPasscode(val);
    setPasscodeError(null);
    if (val.trim() === ADMIN_PASSCODE_VALUE) {
      onUnlockAdmin(ADMIN_PASSCODE_VALUE);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputPasscode.trim();
    if (trimmed === ADMIN_PASSCODE_VALUE) {
      onUnlockAdmin(ADMIN_PASSCODE_VALUE);
      return;
    }
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.unlocked) {
        onUnlockAdmin(trimmed);
      } else {
        setPasscodeError(
          data.error || "Maxsus admin paroli noto'g'ri kiritildi!"
        );
      }
    } catch {
      setPasscodeError("Server bilan bog'lanishda xatolik yuz berdi.");
    }
  };

  // Locked screen if Admin Panel is not unlocked
  if (!hasAdminAccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Maxsus Admin Panelga Kirish
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Admin panelga <strong className="text-sky-300">@behruz_admin Face ID</strong> yuz biometrik skaneri yoki maxsus admin paroli orqali kirishingiz mumkin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAdminFaceScannerOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600/30 via-indigo-600/30 to-amber-500/30 hover:from-sky-600/45 hover:to-amber-500/45 border border-sky-400/60 text-xs sm:text-sm font-black text-sky-200 flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer"
          >
            <ScanFace className="w-5 h-5 text-sky-400" />
            <span>👁️ @behruz_admin Face ID Orqali Ochish</span>
          </button>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            {passcodeError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maxsus Admin Parol
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showInputPasscode ? 'text' : 'password'}
                  required
                  value={inputPasscode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  placeholder="Admin parolni kiriting..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowInputPasscode(!showInputPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showInputPasscode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panelni Ochish</span>
            </button>
          </form>
        </div>

        <FaceIdScannerModal
          isOpen={isAdminFaceScannerOpen}
          mode="admin"
          title="@behruz_admin — Admin Face ID Tekshiruvi"
          subtitle="Bosh Admin (@behruz_admin) yuz biometrik tasdig'i orqali Admin Panelga kirish"
          onClose={() => setIsAdminFaceScannerOpen(false)}
          onAdminUnlocked={(code) => {
            setIsAdminFaceScannerOpen(false);
            onUnlockAdmin(code || ADMIN_PASSCODE_VALUE);
          }}
        />
      </div>
    );
  }

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================
  const handleQuickAdjustScore = async (userId: string, deltaScore: number) => {
    setIsBusyAction(true);
    setRatingStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/score`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          deltaScore,
          deltaRating: Math.round(deltaScore / 2),
        }),
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          `Ishtirokchi balliga ${deltaScore >= 0 ? `+${deltaScore}` : deltaScore} ball muvaffaqiyatli qo'shildi!`
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleQuickAdjustCoins = async (userId: string, deltaCoins: number) => {
    setIsBusyAction(true);
    setRatingStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/score`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          deltaCoins,
        }),
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          `🪙 Ishtirokchi hisobiga +${deltaCoins} Coins muvaffaqiyatli qo'shildi!`
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleQuickAdjustStars = async (userId: string, deltaStars: number) => {
    setIsBusyAction(true);
    setRatingStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/score`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          deltaStars,
        }),
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          `⭐ Ishtirokchi hisobiga +${deltaStars} Yulduz muvaffaqiyatli qo'shildi!`
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleOpenAddScoreModal = (targetUser?: User) => {
    const chosen = targetUser || users[0];
    if (chosen) {
      setScoreTargetUserId(chosen.id);
      setScoreCustomBadge(chosen.customBadge || '');
    }
    setScoreDeltaAmount(100);
    setCoinsDeltaAmount(25);
    setStarsDeltaAmount(5);
    setIsAddScoreModalOpen(true);
  };

  const handleSubmitAddScoreModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = scoreTargetUserId || users[0]?.id;
    if (!targetId) return;
    setIsBusyAction(true);
    try {
      const res = await fetch(`/api/admin/users/${targetId}/score`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          deltaScore: Number(scoreDeltaAmount) || 0,
          deltaRating: Math.round((Number(scoreDeltaAmount) || 0) / 2),
          deltaCoins: Number(coinsDeltaAmount) || 0,
          deltaStars: Number(starsDeltaAmount) || 0,
          customBadge: scoreCustomBadge.trim() || undefined,
        }),
      });
      if (res.ok) {
        await onRefreshData();
        const targetUser = users.find((u) => u.id === targetId);
        setRatingStatusMsg(
          `⚡ ${targetUser?.name || 'Ishtirokchi'} hisobiga +${scoreDeltaAmount} ball, 🪙 +${coinsDeltaAmount} tanga va ⭐ +${starsDeltaAmount} yulduz qo'shildi!`
        );
        setIsAddScoreModalOpen(false);
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleApprovePremiumCreator = async (userId: string) => {
    setIsBusyAction(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/approve-creator`, {
        method: 'POST',
        headers: adminHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          data.message ||
            "👑 Foydalanuvchi tasdiqlandi! Endi u Premium Test va Kurs Yaratuvchi hisoblanadi."
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleRejectPremiumCreator = async (userId: string) => {
    setIsBusyAction(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reject-creator`, {
        method: 'POST',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserName(u.name || '');
    setEditUserUsername(u.username || '');
    setEditUserEmail(u.email || '');
    setEditUserRegion(u.region || 'Toshkent shahri');
    setEditUserSchool(u.school || u.institution || '');
    setEditUserBio(u.bio || '');
    setEditScore(u.totalScore || 0);
    setEditRating(u.rating || 0);
    setEditCoins(u.coins ?? 0);
    setEditStars(u.stars ?? 0);
    setEditRankClass(u.rankClass || 'auto');
    setEditPassword(u.rawPassword || '');
    setEditWheelSpins(u.wheelSpinsLeft ?? 0);
    setEditIsPremium(Boolean(u.isPremium));
    setEditScreenshotAllowed(Boolean(u.screenshotAllowed));
    setEditChatMuted(Boolean(u.chatMuted));
    setEditBadge(u.customBadge || '');
    setEditRole(u.role);
    setEditStarColor(u.starColor || 'blue');
    setEditStarRankTitle(
      u.starRankTitle || STAR_COLOR_META[u.starColor || 'blue']?.rankTitle || 'Noob'
    );
    setEditScoreMultiplier(
      u.scoreMultiplier || STAR_COLOR_META[u.starColor || 'blue']?.multiplier || 1
    );
    setEditUserPermissions({
      canCreateTests: u.permissions?.canCreateTests ?? true,
      canHostMajlis: u.permissions?.canHostMajlis ?? (u.role === 'admin' || u.role === 'creator'),
      canModerateChat: u.permissions?.canModerateChat ?? (u.role === 'admin'),
      canUploadCourses: u.permissions?.canUploadCourses ?? (u.role === 'admin' || u.role === 'creator'),
      canTakeScreenshots: u.permissions?.canTakeScreenshots ?? Boolean(u.screenshotAllowed),
    });
  };

  const handleCreateNewUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    setIsBusyAction(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: newUserName.trim(),
          username: newUserUsername.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword.trim() || '123456',
          region: newUserRegion,
          totalScore: Number(newUserScore) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewUserName('');
        setNewUserUsername('');
        setNewUserEmail('');
        setNewUserPassword('123456');
        setRatingStatusMsg(data.message || "Yangi foydalanuvchi yaratildi!");
        await onRefreshData();
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsBusyAction(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}/score`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          name: editUserName.trim() || editingUser.name,
          username: editUserUsername.trim() || editingUser.username,
          email: editUserEmail.trim() || editingUser.email,
          region: editUserRegion.trim() || editingUser.region,
          school: editUserSchool.trim(),
          institution: editUserSchool.trim(),
          bio: editUserBio,
          setScore: Number(editScore),
          setRating: Number(editRating),
          setCoins: Number(editCoins),
          setStars: Number(editStars),
          rankClass: editRankClass,
          setPassword: editPassword.trim() ? editPassword.trim() : undefined,
          wheelSpinsLeft: Number(editWheelSpins),
          isPremium: editIsPremium,
          screenshotAllowed: editScreenshotAllowed || Boolean(editUserPermissions.canTakeScreenshots),
          chatMuted: editChatMuted,
          customBadge: editBadge.trim(),
          starColor: editStarColor,
          starRankTitle: editStarRankTitle.trim() || 'Noob',
          scoreMultiplier: Number(editScoreMultiplier) || 1,
          permissions: editUserPermissions,
        }),
      });

      if (
        editRole !== editingUser.role &&
        editingUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      ) {
        await fetch(`/api/admin/users/${editingUser.id}/role`, {
          method: 'PATCH',
          headers: adminHeaders,
          body: JSON.stringify({ role: editRole, isPremium: editIsPremium }),
        });
      }

      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          `💾 ${editUserName || editingUser.name} barcha ma'lumotlari va huquqlari muvaffaqiyatli saqlandi!`
        );
        setEditingUser(null);
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleOpenEditTest = (test: TestItem) => {
    setEditingTest(test);
    setEditTestTitle(test.title);
    setEditTestSubject(test.subject);
    setEditTestDesc(test.description || '');
    setEditTestDuration(test.durationMinutes || 20);
    setEditTestDifficulty((test.difficulty as any) || "O'rta");
  };

  const handleSaveEditedTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;
    setIsBusyAction(true);
    try {
      const res = await fetch(`/api/admin/tests/${editingTest.id}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          title: editTestTitle.trim() || editingTest.title,
          subject: editTestSubject.trim() || editingTest.subject,
          description: editTestDesc.trim(),
          durationMinutes: Number(editTestDuration) || 20,
          difficulty: editTestDifficulty,
        }),
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(`💾 "${editTestTitle}" testi muvaffaqiyatli tahrirlandi va saqlandi!`);
        setEditingTest(null);
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleRecalculateRatings = async () => {
    setIsBusyAction(true);
    try {
      const res = await fetch('/api/admin/ratings/recalculate', {
        method: 'POST',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          "Barcha o'rinlar (Rank) va Elo unvonlar qayta hisoblandi!"
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleResetAllRatings = async () => {
    setIsBusyAction(true);
    try {
      const res = await fetch('/api/admin/ratings/reset', {
        method: 'POST',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
        setRatingStatusMsg(
          "Barcha ishtirokchilar reytingi boshlang'ich (1200 Elo) holatga qaytarildi!"
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorStatus(null);
    setIsSubmittingCreator(true);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: creatorName,
          username: creatorUsername,
          email: creatorEmail,
          password: creatorPassword,
          bio: creatorBio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreatorStatus({
          type: 'error',
          text: data.error || "Xatolik yuz berdi.",
        });
      } else {
        setCreatorStatus({
          type: 'success',
          text: `${data.user.name} (@${data.user.username}) test yaratuvchi sifatida qo'shildi!`,
        });
        setCreatorName('');
        setCreatorUsername('');
        setCreatorEmail('');
        setCreatorPassword('');
        setCreatorBio('');
        await onRefreshData();
      }
    } catch {
      setCreatorStatus({
        type: 'error',
        text: "Server bilan bog'lanishda xatolik.",
      });
    } finally {
      setIsSubmittingCreator(false);
    }
  };

  const handleToggleUserRole = async (user: User) => {
    const nextRole = user.role === 'creator' ? 'user' : 'creator';
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
  };

  const handleDeleteTest = async (testId: string | number) => {
    try {
      const res = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestTitle.trim()) return;
    setIsSubmittingContest(true);
    try {
      const res = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: contestTitle,
          subtitle: contestSubtitle,
          startsAt: contestStartsAt,
          durationMinutes: contestDuration,
          status: contestStatus,
          testIds: selectedTestIds,
        }),
      });
      if (res.ok) {
        setContestTitle('');
        setContestSubtitle('');
        setSelectedTestIds([]);
        await onRefreshData();
      }
    } catch {}
    setIsSubmittingContest(false);
  };

  const handleDeleteContest = async (contestId: string) => {
    try {
      const res = await fetch(`/api/admin/contests/${contestId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
  };

  const toggleTestSelection = (id: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSendAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    setIsBusyAction(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch('/api/admin/chat/broadcast', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          roomId: broadcastRoom,
          text: broadcastText.trim(),
        }),
      });
      if (res.ok) {
        setBroadcastText('');
        setBroadcastStatus(
          "👑 Rasmiy Admin e'loni Onlayn Chatga oltin banner bilan yuborildi!"
        );
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleSendPlatformNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifText.trim()) return;
    setIsBusyAction(true);
    setNotifStatus(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: notifTitle.trim(),
          text: notifText.trim(),
          icon: notifIcon,
          tab: notifTab,
          linkUrl: notifLinkUrl.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNotifTitle('');
        setNotifText('');
        setNotifLinkUrl('');
        setNotifStatus("✅ Rasmiy bildirishnoma barcha foydalanuvchilarga real vaqtda yetkazildi!");
        await onRefreshData();
      } else {
        const d = await res.json();
        setNotifStatus(`❌ Xatolik: ${d.error || "Yuborib bo'lmadi"}`);
      }
    } catch {
      setNotifStatus("❌ Server bilan bog'lanishda xatolik yuz berdi.");
    }
    setIsBusyAction(false);
  };

  const handleExecuteWalletGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusyAction(true);
    setGrantStatusMsg(null);
    try {
      if (grantUserId === 'all') {
        for (const u of users) {
          await fetch(`/api/admin/users/${u.id}/score`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify({
              deltaScore: grantDeltaScore,
              deltaRating: Math.round(grantDeltaScore / 2),
              deltaCoins: grantDeltaCoins,
              deltaStars: grantDeltaStars,
            }),
          });
        }
        setGrantStatusMsg(`🎉 Barcha ${users.length} ta foydalanuvchiga: ${grantDeltaScore >= 0 ? `+${grantDeltaScore}` : grantDeltaScore} Ball, ${grantDeltaCoins >= 0 ? `+${grantDeltaCoins}` : grantDeltaCoins} Coins, ${grantDeltaStars >= 0 ? `+${grantDeltaStars}` : grantDeltaStars} Yulduz berildi!`);
      } else {
        const target = users.find((u) => u.id === grantUserId);
        if (!target) return;
        const res = await fetch(`/api/admin/users/${target.id}/score`, {
          method: 'PATCH',
          headers: adminHeaders,
          body: JSON.stringify({
            deltaScore: grantDeltaScore,
            deltaRating: Math.round(grantDeltaScore / 2),
            deltaCoins: grantDeltaCoins,
            deltaStars: grantDeltaStars,
          }),
        });
        if (res.ok) {
          setGrantStatusMsg(`⚡ ${target.name} ga: ${grantDeltaScore >= 0 ? `+${grantDeltaScore}` : grantDeltaScore} Ball, ${grantDeltaCoins >= 0 ? `+${grantDeltaCoins}` : grantDeltaCoins} Coins, ${grantDeltaStars >= 0 ? `+${grantDeltaStars}` : grantDeltaStars} Yulduz o'tkazildi! Izoh: ${grantReason}`);
        }
      }
      await onRefreshData();
    } catch {
      setGrantStatusMsg("❌ Ball o'tkazishda xatolik yuz berdi.");
    }
    setIsBusyAction(false);
  };

  const handleIssueCustomCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onOpenCertificate) return;
    const recipient =
      users.find((u) => u.id === certRecipientId) || users[0];
    if (!recipient) return;

    onOpenCertificate({
      serialNumber: `KT-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      recipientName: recipient.name,
      recipientUsername: recipient.username,
      region: recipient.region,
      district: recipient.district,
      institution: recipient.institution,
      testId: '0100',
      testTitle: certTitle.trim() || 'Respublika CHSB Maxsus Sertifikati',
      subject: certSubject.trim() || 'Umumiy Fanlar',
      earnedPoints: Number(certPoints) || 100,
      maxPoints: Number(certPoints) || 100,
      percentage: 100,
      grade: "5 (A'lo)",
      issuedAt: new Date().toISOString(),
      isSpecialAward: true,
    });
  };

  const handleStoreCertImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setStoreCertImageUrl(canvas.toDataURL('image/jpeg', 0.88));
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadStoreCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeCertTitle.trim()) return;
    setIsBusyAction(true);
    setStoreCertStatus(null);
    try {
      const res = await fetch('/api/admin/store-certificates', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          title: storeCertTitle.trim(),
          subject: storeCertSubject.trim(),
          description: storeCertDesc.trim(),
          requiredPoints: Number(storeCertRequiredPoints) || 0,
          imageUrl: storeCertImageUrl.trim(),
          badgeText: `${storeCertBadge.trim()} · ${Number(storeCertRequiredPoints) || 0} BALL`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStoreCertStatus(
          `✅ «${storeCertTitle}» sertifikati (${storeCertRequiredPoints} ball) muvaffaqiyatli yuklandi!`
        );
        setStoreCertTitle('');
        setStoreCertDesc('');
        setStoreCertImageUrl('');
        await onRefreshData();
      }
    } catch {}
    setIsBusyAction(false);
  };

  const handleDeleteStoreCertificate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/store-certificates/${id}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch {}
  };

  const handleGrantUserWheel = async (userId: string, allow: boolean = true) => {
    setIsBusyAction(true);
    setRatingStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/wheel/grant-user/${userId}`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ allow, spinsCount: 3 }),
      });
      const data = await res.json();
      if (res.ok) {
        setRatingStatusMsg(data.message || 'Baraban ruxsati yangilandi!');
        await onRefreshData();
      }
    } catch {}
    setIsBusyAction(false);
  };

  const creatorsList = users.filter(
    (u) =>
      u.role === 'creator' ||
      u.role === 'admin' ||
      u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const pendingCreatorRequests = users.filter(
    (u) => u.creatorRequestStatus === 'pending' && u.role === 'user'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Executive Admin Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-emerald-950/50 border-2 border-amber-500/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>👑 BOSH ADMIN MARKAZI • TO'LIQ NAZORAT TIZIMI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            KITEST Zamonaviy Admin Boshqaruv Paneli
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Ishtirokchilarga ball qo'shish, Premium va Test Yaratuvchi so'rovlarini tasdiqlash, 100% sertifikatlar taqdim etish hamda YouTube va onlayn chat e'lonlarini boshqarish markazi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dedicated "Ball va Coins Qo'shish" buttons requested on Page 6 */}
          <button
            type="button"
            onClick={() => handleOpenAddScoreModal()}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/30"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ Ball & 🪙 Coins Qo'shish</span>
          </button>

          {onOpenCertificatesStore && (
            <button
              type="button"
              onClick={onOpenCertificatesStore}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-xs font-extrabold text-white transition-all flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>🛍️ Do'konga Narsa Qo'shish (Yulduz + Coins + Rank)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveSection('certificates')}
            className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white transition-all flex items-center gap-2 shadow-lg"
          >
            <Award className="w-4 h-4" />
            <span>🎓 Sertifikat Joylash</span>
          </button>

          {onOpenLuckyWheel && (
            <button
              type="button"
              onClick={onOpenLuckyWheel}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-extrabold text-white transition-all flex items-center gap-2 shadow-lg"
            >
              <span>🎡 Baraban va Yutuqlar</span>
            </button>
          )}

          {onToggleScreenshotProtection && (
            <button
              type="button"
              onClick={onToggleScreenshotProtection}
              className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
                screenshotProtectionEnabled
                  ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200'
                  : 'bg-rose-600/25 border-rose-400 text-rose-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {screenshotProtectionEnabled
                  ? '🛡️ Skrinshot Himoyasi: YOQILGAN'
                  : '🔓 Skrinshot Himoyasi: O‘CHIRILGAN'}
              </span>
            </button>
          )}

          <button
            onClick={onNavigateCreateTest}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yangi Test Yaratish</span>
          </button>

          <a
            href={OFFICIAL_YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-200 flex items-center gap-1.5"
          >
            <Youtube className="w-4 h-4 text-rose-400" />
            <span>YouTube (@FC_UZB-67b)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onLockAdmin}
            className="py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-200 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Paneldan chiqish</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PENDING PREMIUM & CREATOR APPROVAL REQUESTS BANNER                     */}
      {/* ===================================================================== */}
      {pendingCreatorRequests.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-sky-950/50 border-2 border-amber-400/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>
                👑 Tasdiqlash Kutilayotgan Premium & Test Yaratuvchi So'rovlari ({pendingCreatorRequests.length} ta)
              </span>
            </div>
            <span className="text-xs text-slate-300">
              Tasdiqlasangiz foydalanuvchi avtomatik <strong className="text-amber-300">Premium</strong> va <strong className="text-sky-300">Test / Kurs Yaratuvchi</strong> bo'ladi!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCreatorRequests.map((reqUser) => (
              <div
                key={reqUser.id}
                className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-extrabold text-white text-sm flex items-center gap-2">
                    <span>{reqUser.name}</span>
                    <span className="text-xs font-mono text-sky-400">
                      @{reqUser.username}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {reqUser.email} · {reqUser.region}
                  </div>
                  {reqUser.creatorRequestNote && (
                    <div className="text-xs text-amber-200 mt-1">
                      Izoh: "{reqUser.creatorRequestNote}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isBusyAction}
                    onClick={() => handleApprovePremiumCreator(reqUser.id)}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tasdiqlash (Premium + Yaratuvchi)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isBusyAction}
                    onClick={() => handleRejectPremiumCreator(reqUser.id)}
                    className="py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-xs font-semibold text-rose-200"
                  >
                    Rad etish
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Modern Badged Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Ishtirokchilar</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-white font-mono tabular-nums">
            👥 {users.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30">
          <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>100% Sertifikat</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
            🎓 {perfectSubmissions.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30">
          <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yaratuvchilar</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
            ✨ {creatorsList.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Jami Testlar</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-sky-400 font-mono tabular-nums">
            📚 {tests.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yechilganlar</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-white font-mono tabular-nums">
            ✅ {submissions.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Olimpiadalar</span>
          </div>
          <div className="mt-1.5 text-2xl font-extrabold text-amber-300 font-mono tabular-nums">
            🏅 {contests.length}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveSection('ratings')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeSection === 'ratings'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ Reyting va Ball Boshqaruvi</span>
        </button>

        <button
          onClick={() => setActiveSection('wallet_grants')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'wallet_grants'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300'
              : 'bg-slate-900 text-amber-300 hover:text-white border border-amber-500/30'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>⚡ Real-Vaqt Ball, Coins & Yulduz Taqsimoti</span>
        </button>

        <button
          onClick={() => setActiveSection('announcements')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'announcements'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30 ring-1 ring-sky-300'
              : 'bg-slate-900 text-sky-300 hover:text-white border border-sky-500/30'
          }`}
        >
          <Megaphone className="w-4 h-4 text-sky-400" />
          <span>📢 E'lonlar & Bildirishnomalar</span>
        </button>

        <button
          onClick={() => setActiveSection('digital_game')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'digital_game'
              ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-300'
              : 'bg-slate-900 text-orange-300 hover:text-white border border-orange-500/30'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-orange-400" />
          <span>🧑‍🏫 Raqamli Ustoz Nazorati</span>
        </button>

        <button
          onClick={() => setActiveSection('monitor')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'monitor'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'bg-slate-900 text-emerald-300 hover:text-white border border-emerald-500/40'
          }`}
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>👁️ Onlayn Kuzatuv & Huquqlar ({Math.max(1, liveOnlineUsers.length)})</span>
        </button>

        {onOpenMajlis && (
          <button
            onClick={onOpenMajlis}
            className="py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>🎥 Video Majlis ({majlisParticipantCount})</span>
          </button>
        )}

        <button
          onClick={() => setActiveSection('certificates')}
          className={`py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'certificates'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-slate-900 text-amber-300 hover:text-white border border-amber-500/30'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>🎓 100% Sertifikatlar ({perfectSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('creators')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'creators'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>✨ Test Yaratuvchilar ({creatorsList.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'users'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Foydalanuvchilar ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('tests')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'tests'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📚 Testlar ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('contests')}
          className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'contests'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>🏅 Olimpiada va Chat E'lon</span>
        </button>

        <button
          onClick={() => setActiveSection('platform_controls')}
          className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSection === 'platform_controls'
              ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
              : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-500/40'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>🎮 Platforma Boshqaruvi (Do'kon, Baraban, Gameball, Jamoa)</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* SECTION 1: REYTING VA BALL BOSHQARUVI      */}
      {/* ========================================== */}
      {activeSection === 'ratings' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Ishtirokchilar Balli, Reytingi va Maxsus Unvonlarini Boshqarish</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Har qanday ishtirokchiga bonus ball qo'shishingiz, reytingini o'zgartirishingiz yoki maxsus nishon (badge) berishingiz mumkin.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenAddScoreModal()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Ball Qo'shish</span>
              </button>

              <button
                onClick={handleRecalculateRatings}
                disabled={isBusyAction}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>O'rinlarni Qayta Hisoblash</span>
              </button>

              <button
                onClick={handleResetAllRatings}
                disabled={isBusyAction}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-slate-300 hover:text-rose-200 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reytingni 1200 ga tiklash</span>
              </button>
            </div>
          </div>

          {ratingStatusMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{ratingStatusMsg}</span>
              </div>
              <button
                onClick={() => setRatingStatusMsg(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Ishtirokchi ismi, @username yoki viloyati bo'yicha qidirish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Ratings Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">O'rin / Daraja</th>
                    <th className="py-3.5 px-4">Ishtirokchi & Parol</th>
                    <th className="py-3.5 px-4">⚡ Ball · 🪙 Tanga · ⭐ Yulduz</th>
                    <th className="py-3.5 px-4">Tezkor Bonus Qo'shish</th>
                    <th className="py-3.5 px-4 text-right">To'liq Tahrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredUsers.map((u) => {
                    const isMainAdmin =
                      u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
                      u.role === 'admin';
                    const rankCls = computeRankClass(u.totalScore, u.rankClass);
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          <div className="flex items-center gap-2">
                            <span>#{u.rank}</span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-black">
                              {rankCls}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{u.name}</span>
                            {isMainAdmin && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                                👑 ADMIN
                              </span>
                            )}
                            {u.isPremium && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                                👑 VIP
                              </span>
                            )}
                            {u.customBadge && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                {u.customBadge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            @{u.username} · Parol:{' '}
                            <span className="text-amber-300 font-bold">
                              {u.rawPassword || '••••'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 font-extrabold text-amber-300">
                              ⚡ {u.totalScore}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-yellow-500/15 border border-yellow-500/30 font-extrabold text-yellow-300">
                              🪙 {u.coins ?? 0}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 font-extrabold text-sky-300">
                              ⭐ {u.stars ?? 0}
                            </span>
                            <span className="text-slate-400">
                              🎡 {u.wheelSpinsLeft ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => handleQuickAdjustScore(u.id, 50)}
                              disabled={isBusyAction}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-colors"
                            >
                              +50 ball
                            </button>
                            <button
                              onClick={() => handleQuickAdjustScore(u.id, 100)}
                              disabled={isBusyAction}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-colors"
                            >
                              +100 ball
                            </button>
                            <button
                              onClick={() => handleQuickAdjustCoins(u.id, 50)}
                              disabled={isBusyAction}
                              className="px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-300 text-xs font-mono font-bold transition-colors"
                            >
                              🪙 +50 coins
                            </button>
                            <button
                              onClick={() => handleQuickAdjustScore(u.id, -50)}
                              disabled={isBusyAction}
                              className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold transition-colors"
                            >
                              -50
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white inline-flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>To'liq Boshqaruv</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 1.5: ONLAYN KUZATUV & HUQUQLAR     */}
      {/* ========================================== */}
      {activeSection === 'monitor' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-[11px] font-black text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  JONLI RADAR
                </span>
                <h2 className="text-lg font-black text-white">
                  Onlayn Foydalanuvchilarni Kuzatish va Admin Huquqlari
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Hozir saytda kimlar onlayn ekanligini, qaysi bo'limda nima qilayotganini ko'ring, huquqlarini o'zgartirib saqlang yoki Video Majlisga chaqiring.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {onOpenMajlis && (
                <button
                  type="button"
                  onClick={onOpenMajlis}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-4 py-2.5 text-xs font-black text-white shadow-lg cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>🎥 Video Majlisni Ochish (Kamera bilan gaplashish)</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Online Users Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveOnlineUsers.map((ou, ouIdx) => {
              const matchedUser = users.find((u) => u.id === ou.userId);
              return (
                <div
                  key={`online_usr_${ou.userId || 'anon'}_${ouIdx}`}
                  className="rounded-2xl bg-slate-900/90 border border-emerald-500/30 p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-sm font-black text-white">
                        {ou.avatarEmoji || ou.name.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-white flex items-center gap-1.5">
                          <span>{ou.name}</span>
                          {ou.role === 'admin' && (
                            <span className="rounded bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-slate-950">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="truncate text-xs font-mono text-slate-400">
                          @{ou.username} · ⚡ {ou.totalScore} ball
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                      🟢 ONLAYN
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Hozirgi bo'lim:</span>
                      <span className="font-bold text-sky-300">
                        {ou.currentTab || 'Asosiy sahifa'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Faoliyati:</span>
                      <span className="font-semibold text-emerald-300 truncate max-w-[180px]">
                        {ou.currentActivity || 'Saytni kuzatmoqda'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Qurilma: {ou.deviceLabel || 'Web Brauzer'}</span>
                      <span>{ou.inMajlis ? '🎥 Majlisda' : 'Faol'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {matchedUser && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(matchedUser)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 py-2 px-3 text-xs font-bold text-amber-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Tahrirlash & Huquq</span>
                      </button>
                    )}
                    {onOpenMajlis && (
                      <button
                        type="button"
                        onClick={onOpenMajlis}
                        className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600/25 hover:bg-rose-600/40 border border-rose-500/40 py-2 px-3 text-xs font-bold text-rose-200 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Majlis</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: REAL-VAQT BALL, COINS VA YULDUZ TAQSIMOTI                    */}
      {/* ===================================================================== */}
      {activeSection === 'wallet_grants' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-yellow-950/40 border-2 border-amber-500/50 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Real-Vaqt Valyuta Markazi</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  ⚡ Ball, 🪙 Oltin Tanga (Coins) va ⭐ Yulduz Taqsimoti
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Istalgan ishtirokchiga yoki barcha a'zolarga bir zumda Ball, Tanga va Yulduzlarni o'tkazish, mukofotlash yoki jazo qo'llash markazi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setGrantDeltaScore(100);
                    setGrantDeltaCoins(50);
                    setGrantDeltaStars(2);
                    setGrantReason("🎁 Bosh Admin Umumiy Sovg'asi!");
                  }}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer hover:opacity-95"
                >
                  ⚡ Katta Paket (+100 Ball, +50 Coins, +2 ⭐)
                </button>
              </div>
            </div>

            {grantStatusMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs font-bold text-emerald-200 flex items-center justify-between">
                <span>{grantStatusMsg}</span>
                <button
                  type="button"
                  onClick={() => setGrantStatusMsg(null)}
                  className="text-emerald-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleExecuteWalletGrant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    👤 Qabul qiluvchi ishtirokchi *
                  </label>
                  <select
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">🌟 BARCHA FOYDALANUVCHILARGA ({users.length} ta)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (@{u.username}) — ⚡ {u.totalScore}b · 🪙 {u.coins || 0}c · ⭐ {u.stars || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center justify-between">
                    <span>⚡ Ball Miqdori</span>
                    <span className="text-[10px] text-slate-400">(Manfiy - jazo)</span>
                  </label>
                  <input
                    type="number"
                    value={grantDeltaScore}
                    onChange={(e) => setGrantDeltaScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm font-mono font-bold text-amber-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-yellow-300 mb-1.5">
                    🪙 Oltin Tanga (+Coins)
                  </label>
                  <input
                    type="number"
                    value={grantDeltaCoins}
                    onChange={(e) => setGrantDeltaCoins(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-yellow-500/40 text-sm font-mono font-bold text-yellow-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-sky-300 mb-1.5">
                    ⭐ Yulduz (+Stars)
                  </label>
                  <input
                    type="number"
                    value={grantDeltaStars}
                    onChange={(e) => setGrantDeltaStars(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-sky-500/40 text-sm font-mono font-bold text-sky-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Instant 1-Click Preset Buttons */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2">
                  ⚡ Tezkor Bir-Tugmali Miqdor Shabloni:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(50); setGrantDeltaCoins(20); setGrantDeltaStars(0); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    +50 Ball ⚡
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(100); setGrantDeltaCoins(50); setGrantDeltaStars(1); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer"
                  >
                    +100 Ball & +1 ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(500); setGrantDeltaCoins(200); setGrantDeltaStars(5); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-yellow-500/30 text-yellow-300 text-xs font-bold cursor-pointer"
                  >
                    +500 Ball & +5 ⭐ (Olimpiada G'olibi)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(0); setGrantDeltaCoins(100); setGrantDeltaStars(0); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-yellow-500/30 text-yellow-300 text-xs font-bold cursor-pointer"
                  >
                    +100 Coins 🪙
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(0); setGrantDeltaCoins(0); setGrantDeltaStars(3); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-sky-500/30 text-sky-300 text-xs font-bold cursor-pointer"
                  >
                    +3 Yulduz ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGrantDeltaScore(-50); setGrantDeltaCoins(0); setGrantDeltaStars(0); setGrantReason("Qoida buzilishi uchun jarima"); }}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer"
                  >
                    -50 Ball (Jarima) ⚠️
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  📝 Taqdim etish sababi / Izoh
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Masalan: Raqamli Ustoz musobaqasida 1-o'rin olgani uchun"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isBusyAction}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>
                    {isBusyAction ? "Yuborilmoqda..." : "⚡ Real-Vaqt Taqdimotini Amalga Oshirish"}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Balance Inspection Table */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>👥 Ishtirokchilarning Haqiqiy Balanslari ({users.length})</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Ishtirokchi</th>
                    <th className="py-2.5 px-3">Ball ⚡</th>
                    <th className="py-2.5 px-3">Coins 🪙</th>
                    <th className="py-2.5 px-3">Yulduz ⭐</th>
                    <th className="py-2.5 px-3">Ko'paytirgich</th>
                    <th className="py-2.5 px-3 text-right">Tezkor +Ball</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {users.slice(0, 15).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">@{u.username}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                        ⚡ {u.totalScore}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-yellow-300">
                        🪙 {u.coins || 0}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-sky-300">
                        ⭐ {u.stars || 0}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-purple-300">
                        {u.scoreMultiplier || 1}x
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustScore(u.id, 50)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/30 text-[10px] font-bold text-amber-200 cursor-pointer"
                          >
                            +50 ⚡
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustCoins(u.id, 25)}
                            className="px-2 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/30 text-[10px] font-bold text-yellow-200 cursor-pointer"
                          >
                            +25 🪙
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjustStars(u.id, 1)}
                            className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/30 text-[10px] font-bold text-sky-200 cursor-pointer"
                          >
                            +1 ⭐
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: RASMIY BILDIRISHNOMALAR VA E'LONLAR MARKAZI                   */}
      {/* ===================================================================== */}
      {activeSection === 'announcements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <form
                onSubmit={handleSendPlatformNotification}
                className="p-6 rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-900 border-2 border-sky-500/50 space-y-4 shadow-xl"
              >
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                  <Megaphone className="w-5 h-5 text-sky-400" />
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      📢 Barcha Foydalanuvchilarga Haqiqiy Bildirishnoma Yuborish
                    </h2>
                    <p className="text-xs text-slate-300">
                      Ushbu bildirishnoma sayt tepasidagi qo'ng'iroqchada barcha a'zolarga qizil nuqta bilan ko'rinadi va saqlanadi.
                    </p>
                  </div>
                </div>

                {notifStatus && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/40 text-xs font-bold text-sky-200">
                    {notifStatus}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Sarlavha *
                  </label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="🏆 Respublika CHSB Olimpiadasi #5 Ochildi!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Bildirishnoma Matni *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={notifText}
                    onChange={(e) => setNotifText(e.target.value)}
                    placeholder="Barcha 5-11 sinf o'quvchilari uchun yangi masalalar bosqichi yuklandi. Eng yuqori ball to'plaganlar Oltin sertifikat bilan taqdirlanadi!"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Belgi (Emoji)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['📢', '🏆', '🛍️', '🧑‍🏫', '⚡', '⭐', '🚀', '🎁'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNotifIcon(emoji)}
                          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border cursor-pointer ${
                            notifIcon === emoji
                              ? 'bg-sky-500/25 border-sky-400 ring-2 ring-sky-400'
                              : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      O'tish bo'limi (Tab)
                    </label>
                    <select
                      value={notifTab}
                      onChange={(e) => setNotifTab(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                    >
                      <option value="home">Bosh sahifa</option>
                      <option value="contests">Olimpiadalar</option>
                      <option value="shop">Do'kon & Bozor</option>
                      <option value="raqamli_ustoz">Raqamli Ustoz (O'yin)</option>
                      <option value="kitestgram">KitestGram (Chat)</option>
                      <option value="gameball">Kiteshot 3D</option>
                      <option value="courses">Video Kurslar</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tashqi havola (ixtiyoriy YouTube yoki kanal)
                  </label>
                  <input
                    type="url"
                    value={notifLinkUrl}
                    onChange={(e) => setNotifLinkUrl(e.target.value)}
                    placeholder="https://www.youtube.com/@FC_UZB-67b"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isBusyAction}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/25 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Haqiqiy Bildirishnomani Tarqatish</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Notification Live Card Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  👁️ Foydalanuvchi Ekranida Ko'rinishi (Preview):
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{notifIcon || '📢'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>{notifTitle || "Sarlavha bu yerda ko'rinadi"}</span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {notifText || "Bildirishnoma tavsifi matni bu yerda aks ettiriladi."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                          Bo'lim: {notifTab}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Hozirgina</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300">ℹ️ Qanday ishlaydi:</div>
                  <p>1. Bildirishnoma bazaga doimiy saqlanadi (hech qachon o'chib ketmaydi).</p>
                  <p>2. Har bir foydalanuvchining shaxsiy "O'qilgan" holati qayd qilinadi.</p>
                  <p>3. WebSocket orqali onlayn turgan foydalanuvchilarga bir zumda yetkaziladi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION: RAQAMLI USTOZ & KOD O'YINI NAZORATI                           */}
      {/* ===================================================================== */}
      {activeSection === 'digital_game' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/40 border-2 border-orange-500/50 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-black uppercase tracking-wider mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Google Ilhomlantirgan Raqamli Ta'lim</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">
                  🧑‍🏫 Raqamli Ustoz — Interaktiv Kod va Vazifalar Nazorati
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  5 ta interaktiv mentor bosqichi, Python kod poligonlari, savollar va ball mukofotlarini monitoring qilish.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                  🟢 5 ta Bosqich Faol
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-orange-500/30 space-y-2">
                <div className="flex items-center gap-2 text-orange-400 font-extrabold text-sm">
                  <span>🧑‍🏫 1. Azizbek Ustoz</span>
                  <span className="text-[10px] bg-orange-500/20 px-2 py-0.5 rounded text-orange-200">Algoritm</span>
                </div>
                <p className="text-xs text-slate-300">
                  O'zgaruvchilar, arifmetik ifodalar va xotira boshqaruvi.
                </p>
                <div className="text-xs font-mono text-amber-300">
                  🎁 Mukofot: +25 Ball · +15 Coins · +1 ⭐
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm">
                  <span>👩‍💻 2. Malika Ustoz</span>
                  <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded text-sky-200">Python</span>
                </div>
                <p className="text-xs text-slate-300">
                  Shart operatorlari (if/else), boolean mantiq va tarmoqlanish.
                </p>
                <div className="text-xs font-mono text-amber-300">
                  🎁 Mukofot: +30 Ball · +20 Coins · +1 ⭐
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-sm">
                  <span>🤖 3. KitestAI Pro</span>
                  <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-200">AI Prompt</span>
                </div>
                <p className="text-xs text-slate-300">
                  Prompt engineering, sun'iy intellektga aniq vazifa berish san'ati.
                </p>
                <div className="text-xs font-mono text-amber-300">
                  🎁 Mukofot: +40 Ball · +25 Coins · +2 ⭐
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                  <span>🛡️ 4. Jasur Ustoz</span>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">Kiberxavfsizlik</span>
                </div>
                <p className="text-xs text-slate-300">
                  Kuchli parollar, hashing, ikki bosqichli autentifikatsiya (2FA).
                </p>
                <div className="text-xs font-mono text-amber-300">
                  🎁 Mukofot: +50 Ball · +30 Coins · +2 ⭐
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
                  <span>⚔️ 5. Respublika Duellari</span>
                  <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded text-rose-200">Final</span>
                </div>
                <p className="text-xs text-slate-300">
                  Olimpiada murakkablik darajasi (Big-O, binary search, dinamik dasturlash).
                </p>
                <div className="text-xs font-mono text-amber-300">
                  🎁 Mukofot: +100 Ball · +60 Coins · +5 ⭐
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-pink-500/30 space-y-2">
                <div className="flex items-center gap-2 text-pink-400 font-extrabold text-sm">
                  <span>🎮 Kiteshot 3D Portal</span>
                  <span className="text-[10px] bg-pink-500/20 px-2 py-0.5 rounded text-pink-200">O'yin</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ball to'lab kirish portali. G'olibga +3 ball, boshqa o'rinlarga +1 ball taqsimlanadi.
                </p>
                <div className="text-xs font-mono text-emerald-300">
                  🟢 3D Muhit To'liq Faol
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 2: SERTIFIKAT JOYLASH & 100% MARKAZ */}
      {/* ========================================== */}
      {activeSection === 'certificates' && (
        <div className="space-y-8">
          {/* 1. ADMIN STORE CERTIFICATE UPLOAD ("admin da ham boladi sertificat joylash unda ballni jozadi va sertificat yuklaydi") */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <form
                onSubmit={handleUploadStoreCertificate}
                className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/35 to-slate-900 border-2 border-amber-500/60 space-y-4 shadow-xl"
              >
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-base font-black text-white">
                      Sertifikat Joylash (Ball Yozish va Rasm Yuklash)
                    </h2>
                    <p className="text-xs text-slate-300">
                      Ball narxini yozing va sertifikatni yuklang — foydalanuvchi o'sha ballga yetganda maxsus video chiqib sotib oladi!
                    </p>
                  </div>
                </div>

                {storeCertStatus && (
                  <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 font-bold">
                    {storeCertStatus}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    Sertifikat Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeCertTitle}
                    onChange={(e) => setStoreCertTitle(e.target.value)}
                    placeholder="Masalan: KidTest Oltin Olimpiada Sertifikati"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      ⚡ Kerakli Ball Miqdori *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={storeCertRequiredPoints}
                      onChange={(e) =>
                        setStoreCertRequiredPoints(Number(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/60 text-sm font-mono font-black text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Fan yo'nalishi
                    </label>
                    <input
                      type="text"
                      value={storeCertSubject}
                      onChange={(e) => setStoreCertSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Qisqacha Tavsif
                  </label>
                  <input
                    type="text"
                    value={storeCertDesc}
                    onChange={(e) => setStoreCertDesc(e.target.value)}
                    placeholder="Foydalanuvchi ushbu ballga yetganda..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                {/* Upload Certificate File */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      📄 Sertifikat Rasmini Yuklash:
                    </span>
                    <input
                      ref={storeCertFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleStoreCertImageFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => storeCertFileRef.current?.click()}
                      className="py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Rasm Tanlash</span>
                    </button>
                  </div>

                  {storeCertImageUrl && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={storeCertImageUrl}
                        alt="Cert"
                        className="w-20 h-14 object-cover rounded border border-amber-400"
                      />
                      <span className="text-xs text-emerald-400 font-bold">
                        ✅ Sertifikat rasmi tayyor!
                      </span>
                    </div>
                  )}

                  <input
                    type="text"
                    value={
                      storeCertImageUrl.startsWith('data:')
                        ? ''
                        : storeCertImageUrl
                    }
                    onChange={(e) => setStoreCertImageUrl(e.target.value)}
                    placeholder="Yoki sertifikat rasm URL manzilini kiriting..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBusyAction}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    🎓 Sertifikatni va Ballni Tizimga Joylash
                  </span>
                </button>
              </form>
            </div>

            {/* List of Uploaded Store Certificates */}
            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span>
                        Ball Bilan Sotib Olinadigan Sertifikatlar ({storeCertificates.length})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Foydalanuvchilar ushbu ballarga yetganda maxsus taqdimot videosi bilan sotib olishadi
                    </p>
                  </div>
                  {onOpenCertificatesStore && (
                    <button
                      type="button"
                      onClick={onOpenCertificatesStore}
                      className="py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-extrabold"
                    >
                      Do'konni Ko'rish
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1">
                  {storeCertificates.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={sc.imageUrl || KIDTEST_LOGO_DATA_URL}
                          alt={sc.title}
                          className="w-14 h-14 rounded-lg object-cover border border-amber-400 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono font-black text-[10px]">
                            ⚡ {sc.requiredPoints} BALL
                          </span>
                          <h4 className="text-xs font-extrabold text-white mt-1 line-clamp-2">
                            {sc.title}
                          </h4>
                          <div className="text-[11px] text-sky-400">
                            {sc.subject}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteStoreCertificate(sc.id)}
                          className="py-1 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Issue Custom Honorary / 100% Certificate */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleIssueCustomCertificate}
                className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-4 shadow-xl"
              >
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      Maxsus 100% Sertifikat Taqdim Etish
                    </h2>
                    <p className="text-xs text-slate-400">
                      Istalgan ishtirokchiga Admin nomidan rasmiy PNG sertifikat chiqarish
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ishtirokchini tanlang
                  </label>
                  <select
                    value={certRecipientId}
                    onChange={(e) => setCertRecipientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id} className="bg-slate-900">
                        {u.name} (@{u.username}) — {u.totalScore} ball
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sertifikat / Musobaqa Nomi
                  </label>
                  <input
                    type="text"
                    required
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fan yo'nalishi
                  </label>
                  <input
                    type="text"
                    required
                    value={certSubject}
                    onChange={(e) => setCertSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Berilgan Ball (100%)
                    </label>
                    <input
                      type="number"
                      value={certPoints}
                      onChange={(e) => setCertPoints(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Savollar Soni
                    </label>
                    <input
                      type="number"
                      value={certQuestions}
                      onChange={(e) => setCertQuestions(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>🎓 Sertifikat Yaratish va Yuklab Olish</span>
                </button>
              </form>
            </div>

            {/* List of all 100% Test Submissions */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>
                      Testlarni 100% Yechgan Ishtirokchilar ({perfectSubmissions.length})
                    </span>
                  </h2>
                </div>

                {perfectSubmissions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Hozircha 100% yechilgan test natijalari mavjud emas. Chap tarafdagi shakl orqali istalgan ishtirokchiga sertifikat yaratishingiz mumkin.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                    {perfectSubmissions.map((sub) => {
                      const owner = users.find((u) => u.id === sub.userId);
                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {sub.userName}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                @{sub.username}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                                🎓 100%
                              </span>
                            </div>
                            <div className="text-xs text-sky-400 font-semibold mt-0.5">
                              #{sub.testId}. {sub.testTitle} ({sub.subject})
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              ✅ {sub.correctCount}/{sub.totalQuestions} to'g'ri · ⚡ +{sub.earnedPoints} ball
                            </div>
                          </div>

                          {onOpenCertificate && (
                            <button
                              onClick={() =>
                                onOpenCertificate({
                                  serialNumber: `KT-${sub.id
                                    .replace(/[^A-Z0-9]/gi, '')
                                    .slice(-6)
                                    .toUpperCase()}`,
                                  recipientName: sub.userName,
                                  recipientUsername: sub.username,
                                  region: owner?.region,
                                  district: owner?.district,
                                  institution: owner?.institution,
                                  testId: sub.testId,
                                  testTitle: sub.testTitle,
                                  subject: sub.subject,
                                  earnedPoints: sub.earnedPoints,
                                  maxPoints: sub.maxPoints,
                                  percentage: 100,
                                  grade: sub.grade || "5 (A'lo)",
                                  issuedAt: sub.submittedAt,
                                })
                              }
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Sertifikatni Ochish</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 3: ADD & MANAGE TEST CREATORS      */}
      {/* ========================================== */}
      {activeSection === 'creators' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <form
              onSubmit={handleAddCreator}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
            >
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold text-white">
                    Yangi Test Yaratuvchi Qo'shish
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ustoz yoki ekspertga test yaratish huquqini berish
                  </p>
                </div>
              </div>

              {creatorStatus && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    creatorStatus.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  }`}
                >
                  {creatorStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{creatorStatus.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ism va Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Masalan: Sardor Alimov"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={creatorUsername}
                  onChange={(e) => setCreatorUsername(e.target.value)}
                  placeholder="sardor_ustoz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email manzili *
                </label>
                <input
                  type="email"
                  required
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  placeholder="ustoz@kitest.uz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kirish Paroli *
                </label>
                <input
                  type="text"
                  required
                  value={creatorPassword}
                  onChange={(e) => setCreatorPassword(e.target.value)}
                  placeholder="Kamida 4 ta belgi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mutaxassisligi / Izoh
                </label>
                <input
                  type="text"
                  value={creatorBio}
                  onChange={(e) => setCreatorBio(e.target.value)}
                  placeholder="Matematika va Fizika fani o'qituvchisi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingCreator}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-bold text-white transition-colors"
              >
                {isSubmittingCreator
                  ? "Qo'shilmoqda..."
                  : "Test Yaratuvchi Qo'shish"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-base font-bold text-white">
                  Faol Test Yaratuvchilar ({creatorsList.length})
                </h2>
              </div>

              <div className="space-y-3">
                {creatorsList.map((creator) => {
                  const isMainAdmin =
                    creator.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  return (
                    <div
                      key={creator.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {creator.name}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            @{creator.username}
                          </span>
                          {isMainAdmin ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[11px] font-black">
                              👑 Bosh Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[11px] font-semibold">
                              ✨ Test Yaratuvchi
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {creator.email}
                        </div>
                        {creator.bio && (
                          <div className="text-xs text-slate-500">
                            {creator.bio}
                          </div>
                        )}
                      </div>

                      {!isMainAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleUserRole(creator)}
                            className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300"
                          >
                            Huquqni olish
                          </button>
                          <button
                            onClick={() => handleDeleteUser(creator.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 4: ALL USERS & FULL USER EDITING   */}
      {/* ========================================== */}
      {activeSection === 'users' && (
        <div className="space-y-6">
          {/* Top Create New User + Search Panel */}
          <div className="p-5 rounded-2xl border border-emerald-500/40 bg-slate-900/85 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>👥 Foydalanuvchilarni Tahrirlash va Yangi Qo&apos;shish</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Istalgan foydalanuvchining ismi, @username, emaili, paroli, ballari, tangalari va huquqlarini tahrirlang va saqlang
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ism, @username yoki email qidirish..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <form
              onSubmit={handleCreateNewUserByAdmin}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Ism va Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Masalan: Jasur Karimov"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  @username
                </label>
                <input
                  type="text"
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="jasur_karimov"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-sky-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="jasur@gmail.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Parol
                </label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Boshlang&apos;ich Ball
                </label>
                <input
                  type="number"
                  value={newUserScore}
                  onChange={(e) => setNewUserScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300"
                />
              </div>
              <button
                type="submit"
                disabled={isBusyAction}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Qo&apos;shish &amp; Saqlash</span>
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Foydalanuvchi</th>
                    <th className="py-3.5 px-4">Email &amp; Hudud</th>
                    <th className="py-3.5 px-4">Roli va Parol</th>
                    <th className="py-3.5 px-4">⚡ Ball / 🪙 Tanga / ⭐ Yulduz</th>
                    <th className="py-3.5 px-4 text-right">Tahrirlash va Boshqaruv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredUsers.map((u) => {
                    const isMainAdmin =
                      u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            @{u.username}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-300">
                          <div className="font-mono">{u.email}</div>
                          {u.region && (
                            <div className="text-[11px] text-slate-400">
                              📍 {u.region}
                              {u.district ? `, ${u.district}` : ''}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isMainAdmin ? (
                              <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 text-xs font-black">
                                👑 Bosh Admin
                              </span>
                            ) : u.role === 'creator' ? (
                              <span className="px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                                ✨ Test Yaratuvchi
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                                🎓 Ishtirokchi
                              </span>
                            )}
                            {u.rawPassword && (
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300">
                                🔑 {u.rawPassword}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          ⚡ {u.totalScore} ball · 🪙 {u.coins ?? 0} · ⭐ {u.stars ?? 0}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>✏️ Tahrirlash (Edit)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAddScoreModal(u)}
                              className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>+Ball</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGrantUserWheel(u.id, true)}
                              className="py-1.5 px-3 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 border border-purple-400/50 text-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>🎡 +3 Baraban</span>
                            </button>

                            {!isMainAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Foydalanuvchini o'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 5: MANAGE TESTS                    */}
      {/* ========================================== */}
      {activeSection === 'tests' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Test Nomi</th>
                  <th className="py-3.5 px-4">Fan / Savollar</th>
                  <th className="py-3.5 px-4">Muallif</th>
                  <th className="py-3.5 px-4">Yechilgan</th>
                  <th className="py-3.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {tests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{t.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {t.title}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {t.subject} · {t.questions.length} savol ({t.totalPoints}{' '}
                      ball)
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {t.authorName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-emerald-400">
                      {t.passedAttempts}/{t.totalAttempts}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditTest(t)}
                          className="py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-xs font-bold text-amber-200 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Tahrirlash</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTest(t.id)}
                          className="py-1.5 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-medium text-rose-200 inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>O'chirish</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Test Modal with prominent Save buttons */}
          {editingTest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
              <form
                onSubmit={handleSaveEditedTest}
                className="w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-amber-500/50 p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      ✏️ Testni Tahrirlash (#{editingTest.id})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Test nomi, fani, vaqti va qiyinchilik darajasini o'zgartirib saqlang
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isBusyAction}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Saqlash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTest(null)}
                      className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Test Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTestTitle}
                    onChange={(e) => setEditTestTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Fan / Yo'nalish
                    </label>
                    <input
                      type="text"
                      value={editTestSubject}
                      onChange={(e) => setEditTestSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Vaqt (daqiqa)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={editTestDuration}
                      onChange={(e) => setEditTestDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tavsif
                  </label>
                  <input
                    type="text"
                    value={editTestDesc}
                    onChange={(e) => setEditTestDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTest(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    disabled={isBusyAction}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 6: CONTESTS & CHAT BROADCAST       */}
      {/* ========================================== */}
      {activeSection === 'contests' && (
        <div className="space-y-8">
          {/* Admin Broadcast to Online Chat */}
          <form
            onSubmit={handleSendAdminBroadcast}
            className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    👑 Onlayn Chatga Rasmiy Admin E'lon Yuborish
                  </h2>
                  <p className="text-xs text-slate-400">
                    Xabaringiz barcha ishtirokchilarga oltin BOSH ADMIN nishoni va e'lon banneri bilan ko'rsatiladi.
                  </p>
                </div>
              </div>
            </div>

            {broadcastStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
                {broadcastStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kanal (Xona)
                </label>
                <select
                  value={broadcastRoom}
                  onChange={(e) => setBroadcastRoom(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="global">Umumiy Muloqot</option>
                  <option value="chsb">CHSB va Olimpiada</option>
                  <option value="math">Matematika va Fizika</option>
                  <option value="it">Informatika va Dasturlash</option>
                </select>
              </div>
              <div className="sm:col-span-3 flex items-end gap-2">
                <input
                  type="text"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Masalan: Diqqat! Bugun soat 19:00 da Respublika CHSB Olimpiadasi boshlanadi!"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={isBusyAction || !broadcastText.trim()}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>E'lon Yuborish</span>
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <form
                onSubmit={handleCreateContest}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4"
              >
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Yangi Olimpiada / Musobaqa Yaratish
                    </h2>
                    <p className="text-xs text-slate-400">
                      Testlarni birlashtirib rasmiy musobaqa e'lon qilish
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Olimpiada Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    value={contestTitle}
                    onChange={(e) => setContestTitle(e.target.value)}
                    placeholder="KITEST Respublika Fan Olimpiadasi #4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Qisqacha Tavsif
                  </label>
                  <input
                    type="text"
                    value={contestSubtitle}
                    onChange={(e) => setContestSubtitle(e.target.value)}
                    placeholder="Barcha fanlardan saralash bosqichi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Boshlanish Vaqti
                    </label>
                    <input
                      type="text"
                      value={contestStartsAt}
                      onChange={(e) => setContestStartsAt(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Davomiyligi (daqiqa)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={300}
                      value={contestDuration}
                      onChange={(e) => setContestDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Holati
                  </label>
                  <select
                    value={contestStatus}
                    onChange={(e) => setContestStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    <option value="Running">Hozir davom etmoqda (Running)</option>
                    <option value="Upcoming">Kutilmoqda (Upcoming)</option>
                    <option value="Finished">Yakunlangan (Finished)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Olimpiadaga biriktirilgan testlar ({selectedTestIds.length}{' '}
                    ta tanlandi)
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {tests.map((t) => {
                      const checked = selectedTestIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer hover:text-white py-1"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTestSelection(t.id)}
                            className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                          />
                          <span>
                            #{t.id}. {t.title} ({t.subject})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContest}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-colors"
                >
                  {isSubmittingContest
                    ? 'Saqlanmoqda...'
                    : "Olimpiadani E'lon Qilish"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {contests.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                          c.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : c.status === 'Upcoming'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.status}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {c.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400">{c.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(c.startTime).toLocaleDateString('uz-UZ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {c.durationMinutes} daqiqa
                      </span>
                      <span>{c.testIds.length} ta test</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteContest(c.id)}
                    className="py-1.5 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-xs font-medium text-rose-200 inline-flex items-center gap-1.5 self-start sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>O'chirish</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DEDICATED "BALL QO'SHISH" MODAL                                       */}
      {/* ===================================================================== */}
      {isAddScoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitAddScoreModal}
            className="w-full max-w-md rounded-2xl bg-slate-900 border-2 border-amber-500/60 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    ⚡ Ishtirokchiga Ball Qo'shish
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tanlangan foydalanuvchiga bonus ball va unvon berish
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddScoreModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ishtirokchini tanlang *
              </label>
              <select
                value={scoreTargetUserId}
                onChange={(e) => setScoreTargetUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (@{u.username}) — Hozirgi: {u.totalScore} ball
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Qo'shiladigan Ball miqdori (+Ball) *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[25, 50, 100, 250, 500, 1000].map((amt, aIdx) => (
                  <button
                    key={`adm_amt_${amt}_${aIdx}`}
                    type="button"
                    onClick={() => setScoreDeltaAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      scoreDeltaAmount === amt
                        ? 'bg-amber-500 text-slate-950 border-amber-300'
                        : 'bg-slate-950 text-amber-300 border-slate-800'
                    }`}
                  >
                    +{amt} ball
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={scoreDeltaAmount}
                onChange={(e) => setScoreDeltaAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-sm font-mono font-bold text-amber-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-yellow-300 mb-1">
                  🪙 Qo'shiladigan Tanga (+Coins)
                </label>
                <input
                  type="number"
                  value={coinsDeltaAmount}
                  onChange={(e) => setCoinsDeltaAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-yellow-500/40 text-sm font-mono font-bold text-yellow-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-sky-300 mb-1">
                  ⭐ Qo'shiladigan Yulduz (+Stars)
                </label>
                <input
                  type="number"
                  value={starsDeltaAmount}
                  onChange={(e) => setStarsDeltaAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-sky-500/40 text-sm font-mono font-bold text-sky-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maxsus Unvon / Nishon (ixtiyoriy)
              </label>
              <input
                type="text"
                value={scoreCustomBadge}
                onChange={(e) => setScoreCustomBadge(e.target.value)}
                placeholder="Masalan: 🏆 Olimpiada G'olibi"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddScoreModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isBusyAction}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ Ball · 🪙 Tanga · ⭐ Yulduz Qo'shish</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* GLOBAL FULL USER EDIT MODAL (WORKS ON ALL TABS) */}
      {/* ========================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <form
            onSubmit={handleSaveEditedUser}
            className="w-full max-w-2xl rounded-2xl bg-slate-900 border-2 border-amber-500/50 p-6 space-y-4 shadow-2xl my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  ✏️ {editingUser.name} (@{editingUser.username}) — Foydalanuvchini To&apos;liq Tahrirlash
                </h3>
                <p className="text-xs text-slate-400">
                  Ism, Username, Email, Parol, Hudud, Maktab, Ball, Tanga, Yulduz va Huquqlarni o&apos;zgartirib saqlang
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isBusyAction}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>💾 Saqlash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* User Name, Username, Email & Region Editing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  👤 Ism va Familiya
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  🔗 Username (@login)
                </label>
                <input
                  type="text"
                  value={editUserUsername}
                  onChange={(e) => setEditUserUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  📧 Email manzili
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  📍 Viloyat / Hudud
                </label>
                <input
                  type="text"
                  value={editUserRegion}
                  onChange={(e) => setEditUserRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  🏫 Maktab / OTM
                </label>
                <input
                  type="text"
                  value={editUserSchool}
                  onChange={(e) => setEditUserSchool(e.target.value)}
                  placeholder="15-maktab / TATU"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  📝 Bio / Qisqacha
                </label>
                <input
                  type="text"
                  value={editUserBio}
                  onChange={(e) => setEditUserBio(e.target.value)}
                  placeholder="Foydalanuvchi haqida..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">
                  ⚡ Jami Ball
                </label>
                <input
                  type="number"
                  value={editScore}
                  onChange={(e) => setEditScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-amber-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-yellow-300 mb-1">
                  🪙 Tanga (Coins)
                </label>
                <input
                  type="number"
                  value={editCoins}
                  onChange={(e) => setEditCoins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-yellow-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-300 mb-1">
                  ⭐ Yulduz (Stars)
                </label>
                <input
                  type="number"
                  value={editStars}
                  onChange={(e) => setEditStars(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-sky-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-300 mb-1">
                  🎡 Baraban Soni
                </label>
                <input
                  type="number"
                  min={0}
                  value={editWheelSpins}
                  onChange={(e) => setEditWheelSpins(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-purple-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  🔑 Foydalanuvchi Paroli (Ko&apos;rish / Yangi parol o&apos;rnatish)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Yangi parol kiriting..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-sm font-mono text-amber-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  🏅 Daraja Sinfi (F dan SSS gacha)
                </label>
                <select
                  value={editRankClass}
                  onChange={(e) => setEditRankClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                >
                  <option value="auto">Avtomatik (Ball bo&apos;yicha)</option>
                  {RANK_CLASS_LIST.map((rc) => (
                    <option key={rc} value={rc}>
                      Daraja: {rc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Granular User Permissions Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
              <div className="text-xs font-extrabold text-indigo-300">
                🛡️ Foydalanuvchi Huquqlari (Ruxsatnomalar):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editUserPermissions.canCreateTests)}
                    onChange={(e) =>
                      setEditUserPermissions((p) => ({
                        ...p,
                        canCreateTests: e.target.checked,
                      }))
                    }
                  />
                  <span>✨ AI va Oddiy Test Yaratish</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editUserPermissions.canHostMajlis)}
                    onChange={(e) =>
                      setEditUserPermissions((p) => ({
                        ...p,
                        canHostMajlis: e.target.checked,
                      }))
                    }
                  />
                  <span>🎥 Video Majlis Boshqarish</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editUserPermissions.canModerateChat)}
                    onChange={(e) =>
                      setEditUserPermissions((p) => ({
                        ...p,
                        canModerateChat: e.target.checked,
                      }))
                    }
                  />
                  <span>💬 Chat Moderatorligi</span>
                </label>
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editUserPermissions.canUploadCourses)}
                    onChange={(e) =>
                      setEditUserPermissions((p) => ({
                        ...p,
                        canUploadCourses: e.target.checked,
                      }))
                    }
                  />
                  <span>🎬 Video Dars Yuklash</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isBusyAction}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white shadow-lg cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>💾 Saqlash (Barcha O&apos;zgarishlar)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
