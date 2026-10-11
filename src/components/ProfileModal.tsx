import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Submission,
  CertificateData,
  STAR_COLOR_META,
  StarColor,
  ADMIN_EMAIL,
} from '../types';
import { KIDTEST_LOGO_DATA_URL, playKitestSound } from './KitestEmblem';
import { FaceIdScannerModal } from './FaceIdScannerModal';
import { UZBEKISTAN_LOCATIONS, REGIONS_LIST } from '../constants/uzbekistanLocations';
import {
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Lock,
  Trophy,
  Zap,
  Award,
  Crown,
  Sparkles,
  Edit3,
  User as UserIcon,
  Building2,
  Send,
  Star,
  Download,
  ShieldCheck,
  Target,
  Camera,
  CameraOff,
  Upload,
  Trash2,
  Mail,
  AlertTriangle,
  ScanFace,
  Eye,
  EyeOff,
  Coins,
  Flame,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  user: User | null;
  submissions?: Submission[];
  soundEnabled?: boolean;
  initialTab?: 'overview_edit' | 'certificates' | 'history';
  onClose: () => void;
  onUpdateUser: (updated: User, allUsers?: User[]) => void;
  onDeleteAccount?: (remainingUsers?: User[]) => void;
  onOpenCertificate?: (cert: CertificateData) => void;
  onOpenCertificatesStore?: () => void;
}

const AVATAR_EMOJIS = ['🚀', '👑', '⚡', '🎯', '🧠', '🏆', '🔥', '💎', '🌟', '🛡️'];

const AVATAR_COLORS = [
  { id: 'sky', label: 'Moviy', class: 'bg-sky-600 border-sky-400' },
  { id: 'emerald', label: 'Zumrad', class: 'bg-emerald-600 border-emerald-400' },
  { id: 'amber', label: 'Oltin', class: 'bg-amber-500 border-amber-300 text-slate-950' },
  { id: 'violet', label: 'Binafsha', class: 'bg-violet-600 border-violet-400' },
  { id: 'rose', label: 'Qirmizi', class: 'bg-rose-600 border-rose-400' },
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-600 border-indigo-400' },
];

export async function readAndOptimizeAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Rasmni o‘qishda xatolik'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl) {
        reject(new Error('Bo‘sh rasm'));
        return;
      }
      // If image is already small (< 350KB), keep exact data URL
      if (rawDataUrl.length < 350_000) {
        resolve(rawDataUrl);
        return;
      }
      // Resize large phone/camera images via canvas so they save fast and never exceed localStorage quota
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL('image/jpeg', 0.88);
          resolve(optimized);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  submissions = [],
  soundEnabled = true,
  initialTab = 'overview_edit',
  onClose,
  onUpdateUser,
  onDeleteAccount,
  onOpenCertificate,
  onOpenCertificatesStore,
}) => {
  const [activeTab, setActiveTab] = useState<'overview_edit' | 'certificates' | 'history'>(
    initialTab
  );

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState(REGIONS_LIST[0]);
  const [district, setDistrict] = useState('');
  const [institution, setInstitution] = useState('');
  const [telegram, setTelegram] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('');
  const [avatarColor, setAvatarColor] = useState('sky');
  const [customBadge, setCustomBadge] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [creatorNote, setCreatorNote] = useState('');
  const [requestingPremium, setRequestingPremium] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Camera selfie capture state inside Edit Profile
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Delete Account confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Face ID Enrollment / Update state & 3D Tilt state
  const [faceIdDataUrl, setFaceIdDataUrl] = useState('');
  const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    setActiveTab(initialTab);
    setShowDeleteConfirm(false);
    if (!isOpen) {
      stopCamera();
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const userRegion =
        user.region && UZBEKISTAN_LOCATIONS[user.region]
          ? user.region
          : REGIONS_LIST[0];
      const availableDistricts = UZBEKISTAN_LOCATIONS[userRegion] || [];
      const userDistrict =
        user.district && availableDistricts.includes(user.district)
          ? user.district
          : availableDistricts[0] || '';

      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
      setRegion(userRegion);
      setDistrict(userDistrict);
      setInstitution(user.institution || '');
      setTelegram(user.telegram || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || '');
      setAvatarEmoji(user.avatarEmoji || '');
      setAvatarColor(user.avatarColor || 'sky');
      setCustomBadge(user.customBadge || '');
      setCreatorNote(user.creatorRequestNote || '');
      const userDesc = Array.isArray((user as any).faceDescriptor)
        ? ((user as any).faceDescriptor as number[])
        : [];
      setFaceIdDataUrl(user.faceIdDataUrl || '');
      setFaceDescriptor(userDesc);
      setFaceIdEnabled(
        Boolean(user.faceIdEnabled || user.faceIdDataUrl || userDesc.length >= 64)
      );
      setNewPassword('');
      setConfirmNewPassword('');
      setMessage('');
      setError('');
    }
  }, [user, isOpen]);

  const mySubmissions = useMemo(() => {
    if (!user) return [];
    return submissions.filter((s) => s.userId === user.id);
  }, [submissions, user]);

  // Deduplicated 100% perfect submissions by testId for Certificates
  const perfectSubmissions = useMemo(() => {
    const map = new Map<string, Submission>();
    mySubmissions.forEach((s) => {
      if (s.percentage === 100 && !map.has(s.testId)) {
        map.set(s.testId, s);
      }
    });
    return Array.from(map.values());
  }, [mySubmissions]);

  const handleRegionChange = (newReg: string) => {
    setRegion(newReg);
    const list = UZBEKISTAN_LOCATIONS[newReg] || [];
    setDistrict(list[0] || '');
  };

  if (!isOpen || !user) return null;

  const isOwnerAdmin =
    user.email.toLowerCase() === ADMIN_EMAIL || user.role === 'admin';
  const isCreator = user.role === 'creator';

  const saveAvatarToServer = async (newDataUrl: string) => {
    setUploadingPhoto(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: newDataUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('success', soundEnabled);
        onUpdateUser(data.user, Array.isArray(data.users) ? data.users : undefined);
        setMessage(
          newDataUrl
            ? "Profil rasmingiz muvaffaqiyatli joylandi va saqlandi!"
            : "Profil rasmi tozalandi."
        );
      } else {
        setError(data.error || 'Rasmni saqlashda xatolik yuz berdi');
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Iltimos, faqat rasm faylini (JPG, PNG, WEBP) tanlang!');
      return;
    }
    try {
      setUploadingPhoto(true);
      const optimizedDataUrl = await readAndOptimizeAvatarFile(file);
      setAvatarUrl(optimizedDataUrl);
      await saveAvatarToServer(optimizedDataUrl);
    } catch {
      setError('Rasmni yuklashda xatolik yuz berdi!');
      setUploadingPhoto(false);
    }
    e.target.value = '';
  };

  const handleStartCamera = async () => {
    if (cameraOpen) {
      stopCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 80);
    } catch {
      setError("Kameraga ruxsat berilmadi. Iltimos, 'Rasm Tanlash' tugmasi orqali fayl yuklang.");
    }
  };

  const handleCaptureCameraPhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sx = ((video.videoWidth || 480) - size) / 2;
      const sy = ((video.videoHeight || 480) - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
      const capturedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();
      setAvatarUrl(capturedDataUrl);
      await saveAvatarToServer(capturedDataUrl);
    } catch {
      setError('Kameradan rasm olishda xatolik');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setDeletingAccount(true);
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}/account`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('click', soundEnabled);
        stopCamera();
        if (onDeleteAccount) {
          onDeleteAccount(Array.isArray(data.users) ? data.users : undefined);
        } else {
          onClose();
        }
      } else {
        setError(data.error || "Hisobni o'chirishda xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleRequestPremiumCreator = async () => {
    setRequestingPremium(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/users/${user.id}/request-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note:
            creatorNote.trim() ||
            "Premium va Test/Kurs Yaratuvchi bo'lish uchun so'rov",
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUpdateUser(data.user);
        setMessage(
          data.message ||
            "Premium va Test Yaratuvchi so'rovingiz Adminga yuborildi!"
        );
      } else {
        setError(data.error || "So'rov yuborishda xatolik");
      }
    } catch {
      setError('Server xatoligi');
    } finally {
      setRequestingPremium(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMessage('');
    setError('');

    const cleanUsername = username.trim().replace(/^@+/, '').replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();

    if (!name.trim() || !cleanUsername || !cleanEmail) {
      setError("Ism, Username va Email bo'sh bo'lishi mumkin emas!");
      return;
    }

    if (newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        setError("Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak!");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('Yangi parol va tasdiqlash paroli mos kelmadi!');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: cleanUsername,
          email: cleanEmail,
          region,
          district,
          institution: institution.trim(),
          telegram: telegram.trim(),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
          avatarEmoji: avatarEmoji.trim(),
          avatarColor,
          customBadge: customBadge.trim(),
          faceIdDataUrl: faceIdEnabled ? faceIdDataUrl || undefined : '',
          faceDescriptor:
            faceIdEnabled && faceDescriptor.length >= 64
              ? faceDescriptor
              : undefined,
          faceIdEnabled,
          clearFaceId: !faceIdEnabled,
          newPassword: newPassword.trim() || undefined,
          confirmNewPassword: newPassword.trim() ? confirmNewPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Saqlashda xatolik');
      } else {
        playKitestSound('success', soundEnabled);
        onUpdateUser(data.user, Array.isArray(data.users) ? data.users : undefined);
        setMessage("Profil ma'lumotlari va rasmingiz muvaffaqiyatli saqlandi!");
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch {
      setError('Server xatoligi');
    } finally {
      setSaving(false);
    }
  };

  const currentDistricts = UZBEKISTAN_LOCATIONS[region] || [];

  const buildCertificateFromSubmission = (sub: Submission): CertificateData => ({
    serialNumber: `KITEST-100-${sub.testId}-${sub.id.slice(-4).toUpperCase()}`,
    recipientName: user.name,
    recipientUsername: user.username,
    region: user.region,
    district: user.district,
    institution: user.institution,
    testId: sub.testId,
    testTitle: sub.testTitle,
    subject: sub.subject,
    percentage: 100,
    earnedPoints: sub.earnedPoints,
    maxPoints: sub.maxPoints,
    grade: sub.grade || "5 (A'lo)",
    issuedAt: sub.submittedAt,
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          className={`max-w-3xl w-full rounded-2xl bg-slate-900 border-2 shadow-2xl overflow-hidden my-auto ${
            isOwnerAdmin
              ? 'border-amber-500/70 shadow-amber-500/10'
              : isCreator
              ? 'border-sky-500/60 shadow-sky-500/10'
              : 'border-slate-800'
          }`}
        >
          {/* Top Profile Header */}
          <div
            className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isOwnerAdmin
                ? 'bg-slate-950 border-amber-500/30'
                : 'bg-slate-950/90 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Clickable Profile Avatar with Direct Upload Trigger */}
              <div
                onClick={() => avatarFileInputRef.current?.click()}
                className="relative group cursor-pointer shrink-0"
                title="Profilga rasm joylash uchun bosing"
              >
                <img
                  src={avatarUrl || KIDTEST_LOGO_DATA_URL}
                  alt={user.name}
                  className={`w-16 h-16 rounded-2xl bg-slate-950 border-2 border-sky-400 shadow-lg ${
                    avatarUrl ? 'object-cover' : 'object-contain p-1'
                  }`}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    avatarFileInputRef.current?.click();
                  }}
                  title="Profilga rasm joylash"
                  className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md transition-transform hover:scale-110"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <span
                  className={`absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                    isOwnerAdmin
                      ? 'bg-amber-400 text-slate-950 border-white'
                      : 'bg-slate-900 text-sky-400 border-sky-500/50'
                  }`}
                >
                  #{user.rank}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    {user.name}
                  </h2>

                  {/* ALWAYS VISIBLE COLORED STAR & RANK CLASS AT TOP OF PROFILE (5-sahifa & 8-sahifa) */}
                  {(() => {
                    const sCol: StarColor = user.starColor || 'blue';
                    const sMeta = STAR_COLOR_META[sCol] || STAR_COLOR_META.blue;
                    const sRank = user.starRankTitle || sMeta.rankTitle || 'Noob';
                    const sMult = user.scoreMultiplier || sMeta.multiplier || 1;
                    return (
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black border flex items-center gap-1 shadow-sm ${sMeta.badgeClass}`}
                      >
                        <span>{sMeta.starEmoji}</span>
                        <span>
                          {sRank} · {sMult}x Ball
                        </span>
                      </span>
                    );
                  })()}

                  {isOwnerAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-extrabold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>BOSH ADMIN</span>
                    </span>
                  ) : isCreator ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-400/50 text-sky-300 text-[11px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>PREMIUM YARATUVCHI</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{user.ratingTitle}</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2">
                  <span className="text-sky-400">@{user.username}</span>
                  <span>·</span>
                  <span>{user.email}</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">
                    🪙 {user.coins ?? 0} Coins · ⭐ {user.stars ?? 0} Yulduz
                  </span>
                  {user.region && (
                    <>
                      <span>·</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {user.region}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMessage('');
                  setIsFaceScannerOpen(true);
                }}
                className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                  faceIdEnabled
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950'
                }`}
              >
                <ScanFace className="w-4 h-4" />
                <span>
                  {faceIdEnabled ? "🔄 Face ID O'zgartirish" : '👁️ Face ID Kiritish'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Rasm Joylash</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={saving}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Yopish</span>
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="p-3.5 sm:px-6 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono tabular-nums">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-sky-500/30 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Ball</div>
                <div className="text-sm font-extrabold text-sky-400">
                  {user.totalScore}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Reyting</div>
                <div className="text-sm font-extrabold text-emerald-400">
                  {user.rating}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">O'rni</div>
                <div className="text-sm font-extrabold text-amber-400">
                  #{user.rank}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-violet-500/30 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Yechilgan</div>
                <div className="text-sm font-extrabold text-white">
                  {user.solvedCount} ta
                </div>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-900 border border-amber-400/40 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <div className="text-[10px] text-amber-300 uppercase">Obunachi</div>
                <div className="text-sm font-extrabold text-amber-300">
                  {user.followersUserIds?.length || 0} / {user.followingUserIds?.length || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview_edit')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'overview_edit'
                  ? 'border-sky-400 text-white bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              <span>Edit Profil (Rasm & Ma'lumotlar)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('certificates')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'certificates'
                  ? 'border-amber-400 text-amber-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Sertifikatlarim ({perfectSubmissions.length + (user.purchasedCertificates?.length || 0)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 ${
                activeTab === 'history'
                  ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Urinishlar Tarixi ({mySubmissions.length})</span>
            </button>
          </div>

          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'overview_edit' && (
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {message && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ======================================================== */}
              {/* 0. INTERACTIVE 3D HOLOGRAPHIC ID CARD ("3D formatda bo'lsin") */}
              {/* ======================================================== */}
              <div
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / rect.width - 0.5;
                  const y = (e.clientY - rect.top) / rect.height - 0.5;
                  setTilt({ rotateX: -y * 14, rotateY: x * 18 });
                }}
                onMouseLeave={() => setTilt({ rotateX: 0, rotateY: 0 })}
                style={{ perspective: '1000px' }}
                className="w-full"
              >
                <motion.div
                  animate={{
                    rotateX: tilt.rotateX,
                    rotateY: tilt.rotateY,
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-sky-950/90 border-2 border-sky-400/50 shadow-[0_18px_45px_rgba(14,165,233,0.22)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={avatarUrl || KIDTEST_LOGO_DATA_URL}
                        alt={name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
                      />
                      <span className="absolute -top-2 -left-2 text-lg">
                        {STAR_COLOR_META[user.starColor || 'blue']?.starEmoji || '💙'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[10px] font-mono font-black text-sky-300">
                          3D PROFIL KARTASI
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-black text-amber-300">
                          {user.starRankTitle || 'Noob'} · {user.scoreMultiplier || 1}x BALL
                        </span>
                      </div>
                      <div className="text-base font-black text-white mt-1">
                        {name || user.name} (@{username || user.username})
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {institution || 'Maktab/OTM kiritilmagan'} · {region}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenCertificatesStore && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCertificatesStore();
                        }}
                        className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>⭐ Yulduz / Rank Do'koni</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* ======================================================== */}
              {/* TOP QUICK FACE ID CARD IN EDIT PROFILE                   */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-sky-950/60 border-2 border-emerald-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  {faceIdDataUrl ? (
                    <img
                      src={faceIdDataUrl}
                      alt="Face ID"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shrink-0 shadow-md"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
                        faceIdEnabled
                          ? 'bg-emerald-500/20 border-emerald-400/50'
                          : 'bg-sky-500/15 border-sky-400/40'
                      }`}
                    >
                      <ScanFace
                        className={`w-7 h-7 ${
                          faceIdEnabled ? 'text-emerald-400' : 'text-sky-400'
                        }`}
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex flex-wrap items-center gap-2">
                      <span>👁️ Hisob Face ID Biometrikasi (1-Saqlashda)</span>
                      {faceIdEnabled ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
                          ✅ FACE ID KIRITILGAN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                          ⚠️ FACE ID KIRITILMAGAN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {faceIdEnabled
                        ? "Face ID hisobingizga biriktirilgan. «Face ID O'zgartirish» tugmasini bosib 1-urinishda yangilashingiz mumkin."
                        : "«Face ID Kiritish» tugmasini bosing — kamera yuzingizni 1-urinishdayoq ko'rib oladi va hisobingizga darhol saqlaydi."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMessage('');
                      setIsFaceScannerOpen(true);
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      faceIdEnabled
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>
                      {faceIdEnabled
                        ? "🔄 Face ID O'zgartirish"
                        : '👁️ Face ID Kiritish'}
                    </span>
                  </button>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 1. PROFILE PICTURE STUDIO (PROFILGA RASM JOYLASH)        */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-sky-400 overflow-hidden shrink-0 cursor-pointer group shadow-lg"
                    >
                      <img
                        src={avatarUrl || KIDTEST_LOGO_DATA_URL}
                        alt="Profil rasmi"
                        className={`w-full h-full ${
                          avatarUrl ? 'object-cover' : 'object-contain p-1.5'
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold text-white transition-opacity">
                        <Upload className="w-4 h-4 mb-0.5 text-sky-400" />
                        <span>Almashtirish</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-sky-400" />
                        <span>Profilga Shaxsiy Rasm Joylash</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Telefon galereyasidan, kompyuterdan yoki kameradan rasm yuklang.
                      </p>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1">
                        {uploadingPhoto
                          ? '⏳ Rasm saqlanmoqda...'
                          : avatarUrl
                          ? '✅ Shaxsiy rasm o‘rnatilgan'
                          : 'ℹ️ Hozircha standart emblema'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📸 Qurilmadan Rasm Tanlash</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCamera}
                      className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md"
                    >
                      {cameraOpen ? (
                        <>
                          <CameraOff className="w-3.5 h-3.5" />
                          <span>Kamerani Yopish</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>📷 Kameradan Olish</span>
                        </>
                      )}
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl('');
                          saveAvatarToServer('');
                        }}
                        className="py-2 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-xs font-semibold text-rose-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rasmni O'chirish</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Camera Selfie Box if opened */}
                {cameraOpen && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-28 h-28 rounded-xl object-cover bg-black border border-indigo-400 scale-x-[-1]"
                      />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-white">Kameradan profil rasmi olish</div>
                        <p className="text-[11px] text-slate-400">
                          Yuzingizni markazga to'g'rilab, "Suratga olish" tugmasini bosing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCaptureCameraPhoto}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Suratga Olish va Saqlash</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Yoki rasm havolasini (URL) kiriting:
                  </label>
                  <input
                    type="text"
                    value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* 2. ISM, USERNAME & EMAIL (FAQAT 1 MARTA ISHLATILADI)     */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Shaxsiy Identifikatorlar (Ism, Username va Email)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold">
                      Faqat 1 marta foydalaniladi
                    </span>
                    <button
                      type="submit"
                      disabled={saving}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Ism va Familiya *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Username (@login) *
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>Email manzili *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white font-mono focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Har bir <strong>Username</strong> va <strong>Email</strong> tizimda faqat bir marta ishlatiladi. Agar hisobingizni o'chirsangiz (Delete Account), ular bo'shatiladi.
                </p>
              </div>

              {/* ======================================================== */}
              {/* 3. HUDUD, MUASSASA VA QO'SHIMCHA MA'LUMOTLAR             */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Viloyat / Hudud</span>
                  </label>
                  <select
                    value={region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    {REGIONS_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tuman / Shahar
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    {currentDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-violet-400" />
                    <span>Maktab / OTM / Muassasa</span>
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Masalan: 15-IDUM / TATU"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    <span>Telegram manzili</span>
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Qisqacha Bio / Unvon
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Olimpiada ishtirokchisi..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* FACE ID BIOMETRIC SECURITY IN EDIT PROFILE               */}
              {/* ("profil da editda face id kiritish boladi kiritilgan bolsa o'zgartirish qilinadi") */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-950 to-emerald-950/40 border-2 border-sky-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  {faceIdDataUrl ? (
                    <img
                      src={faceIdDataUrl}
                      alt="Face ID"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400 shrink-0 shadow-md"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
                        faceIdEnabled
                          ? 'bg-emerald-500/20 border-emerald-400/50'
                          : 'bg-sky-500/15 border-sky-400/40'
                      }`}
                    >
                      <ScanFace
                        className={`w-7 h-7 ${
                          faceIdEnabled ? 'text-emerald-400' : 'text-sky-400'
                        }`}
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-xs sm:text-sm font-black text-white flex flex-wrap items-center gap-2">
                      <span>👁️ Hisob Face ID Biometrikasi (Edit Profil)</span>
                      {faceIdEnabled ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-mono font-bold">
                          ✅ FACE ID KIRITILGAN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold">
                          ⚠️ FACE ID KIRITILMAGAN
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {faceIdEnabled
                        ? "Hisobingizga Face ID kiritilgan. «Face ID O'zgartirish» tugmasi orqali 1-saqlashda yangi yuzga o'zgartirishingiz mumkin."
                        : "1-saqlashda yuzingizni ko'rib oladi va hisobingizga saqlaydi: parolsiz kirish va parolni tiklash imkonini beradi."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setMessage('');
                      setIsFaceScannerOpen(true);
                    }}
                    className={`py-2.5 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      faceIdEnabled
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    }`}
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>
                      {faceIdEnabled
                        ? "🔄 Face ID O'zgartirish"
                        : '👁️ Face ID Kiritish'}
                    </span>
                  </button>
                  {faceIdEnabled && (
                    <button
                      type="button"
                      onClick={async () => {
                        setFaceIdDataUrl('');
                        setFaceDescriptor([]);
                        setFaceIdEnabled(false);
                        try {
                          const res = await fetch(`/api/auth/profile/${user.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              clearFaceId: true,
                              faceIdDataUrl: '',
                              faceIdEnabled: false,
                            }),
                          });
                          const data = await res.json();
                          if (res.ok && data.user) {
                            onUpdateUser(
                              data.user,
                              Array.isArray(data.users) ? data.users : undefined
                            );
                          }
                        } catch {}
                        setMessage("Face ID o'chirildi. Istalgan vaqt qaytadan Face ID kiritishingiz mumkin.");
                      }}
                      className="py-2.5 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold cursor-pointer"
                    >
                      O'chirish
                    </button>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* PASSWORD & CONFIRM PASSWORD ("Confirm password qo'sh")   */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-sky-400" />
                    <span>Parolni Yangilash va Tasdiqlash (Confirm Password)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {newPassword && (
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          newPassword === confirmNewPassword
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {newPassword === confirmNewPassword
                          ? '✅ Parollar mos keldi'
                          : '⚠️ Parollar mos emas'}
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saqlanmoqda...' : 'Parolni Saqlash'}</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Yangi parol (kamida 4 belgi)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yangi parol kiriting..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:border-sky-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showNewPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Parolni tasdiqlang (Confirm Password) *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Yangi parolni qayta kiriting..."
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white focus:border-sky-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showConfirmPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* KITEST PREMIUM & CREATOR REQUEST ("Premium qo'sh opsiyasi") */}
              {/* ======================================================== */}
              {!isOwnerAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span>👑 Premium va Yaratuvchi (Creator) Qo'shish So'rovi</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Premium olsangiz: Test yaratish, Video Kurs joylash, 3D Kitob chop etish va maxsus imtiyozlar ochiladi.
                      </p>
                    </div>
                    {isCreator ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black">
                        ✅ Premium & Yaratuvchi Faol
                      </span>
                    ) : user.creatorRequestStatus === 'pending' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-black">
                        ⏳ Premium So'rovingiz Admin Tasdiqlashida
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={requestingPremium}
                        onClick={handleRequestPremiumCreator}
                        className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 shrink-0"
                      >
                        {requestingPremium
                          ? 'Yuborilmoqda...'
                          : "👑 Premium Qo'shish So'rovini Yuborish"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 4. DELETE ACCOUNT (HISOBNI O'CHIRISH)                    */}
              {/* ======================================================== */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-rose-300 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Delete Account (Hisobni Butunlay O'chirish)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Hisobingizni o'chirsangiz, barcha ma'lumotlaringiz o'chiriladi hamda <strong>@{user.username}</strong> va <strong>{user.email}</strong> qayta ro'yxatdan o'tish uchun bo'shatiladi.
                    </p>
                  </div>

                  {!showDeleteConfirm && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Account</span>
                    </button>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/60 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-extrabold text-white">
                          Haqiqatan ham hisobingizni o'chirmoqchimisiz?
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Ushbu amal qaytarilmaydi. Hisob o'chirilgach, <strong>@{user.username}</strong> va <strong>{user.email}</strong> bo'shaydi.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="py-1.5 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={handleDeleteAccountConfirm}
                        className="py-1.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {deletingAccount
                            ? "O'chirilmoqda..."
                            : "Ha, Hisobni O'chirish (Delete Account)"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STICKY SAVE BAR AT BOTTOM OF EDIT PROFILE */}
              <div className="sticky bottom-0 z-20 -mx-6 -mb-6 p-4 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>O'zgarishlarni kiritgach, <strong className="text-emerald-300">Saqlash</strong> tugmasini bosing</span>
                </div>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                  >
                    Yopish
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saqlanmoqda...' : "💾 Barcha O'zgarishlarni Saqlash"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: PURCHASED & 100% CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-extrabold text-amber-300">
                    🎓 Ball Bilan Sotib Olingan va 100% Yechilgan Sertifikatlar
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Joriy balingiz: <strong className="text-amber-300">{user.totalScore} ball</strong>
                  </p>
                </div>
                {onOpenCertificatesStore && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCertificatesStore();
                    }}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>Sertifikatlar Do'koniga O'tish</span>
                  </button>
                )}
              </div>

              {(user.purchasedCertificates || []).length === 0 &&
              perfectSubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <Award className="w-10 h-10 text-amber-400 mx-auto" />
                  <div className="text-base font-bold text-white">
                    Hozircha sertifikatlar yo'q
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    To'plagan ballaringiz bilan <strong className="text-amber-300">Sertifikatlar Do'koni</strong>dan sertifikat sotib oling yoki istalgan testni <strong className="text-amber-300">100% aniqlik</strong> bilan yeching!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user.purchasedCertificates || []).map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/60 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            ⚡ {p.costPoints} BALL SERTIFIKATI
                          </span>
                          <span className="text-slate-400">{p.serialNumber}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white">
                          {p.title}
                        </h4>
                        <div className="text-xs text-sky-400">{p.subject}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenCertificate) {
                            onOpenCertificate({
                              serialNumber: p.serialNumber,
                              recipientName: p.userName,
                              recipientUsername: p.username,
                              region: p.region || user.region,
                              district: p.district || user.district,
                              institution: p.institution || user.institution,
                              testId: p.storeCertificateId.slice(-4).toUpperCase(),
                              testTitle: p.title,
                              subject: p.subject,
                              percentage: 100,
                              earnedPoints: p.costPoints,
                              maxPoints: p.costPoints || 100,
                              grade: "5 (A'lo)",
                              issuedAt: p.purchasedAt,
                              customImageUrl: p.imageUrl || undefined,
                              costPoints: p.costPoints,
                            });
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Sertifikatni Ko'rish va Yuklab Olish</span>
                      </button>
                    </div>
                  ))}

                  {perfectSubmissions.map((sub) => {
                    const certData = buildCertificateFromSubmission(sub);
                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              🏅 100% SERTIFIKAT
                            </span>
                            <span className="text-slate-400">#{sub.testId}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-white">
                            {sub.testTitle}
                          </h4>
                          <div className="text-xs text-sky-400">{sub.subject}</div>
                          <div className="text-[11px] font-mono text-emerald-400">
                            Ball: {sub.earnedPoints}/{sub.maxPoints} · Baho: {sub.grade}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenCertificate) {
                              onOpenCertificate(certData);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          <span>Sertifikatni Ko'rish va Yuklab Olish</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUBMISSIONS HISTORY */}
          {activeTab === 'history' && (
            <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
              {mySubmissions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                  Siz hali birorta ham test topshirmagansiz.
                </div>
              ) : (
                mySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        <span className="font-mono text-sky-400 mr-1.5">#{sub.testId}</span>
                        {sub.testTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {sub.subject} · To'g'ri: {sub.correctCount}/{sub.totalQuestions}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-sky-400">
                        💎 {sub.earnedPoints} ball ({sub.percentage}%)
                      </span>
                      {sub.percentage === 100 && onOpenCertificate && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenCertificate(buildCertificateFromSubmission(sub))
                          }
                          className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Sertifikat</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Sticky Bottom Action Bar: Delete Account, Chiqish & Saqlash */}
          <div className="p-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Yopish</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview_edit');
                  setShowDeleteConfirm(true);
                }}
                className="py-2 px-3.5 rounded-xl bg-rose-950/70 hover:bg-rose-600 border border-rose-500/40 text-xs font-bold text-rose-200 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saqlanmoqda...' : "O'zgarishlarni Saqlash"}</span>
            </button>
          </div>
        </motion.div>

        <FaceIdScannerModal
          isOpen={isFaceScannerOpen}
          mode="enroll"
          targetUser={user}
          soundEnabled={soundEnabled}
          onClose={() => setIsFaceScannerOpen(false)}
          onEnrolled={async (capturedDataUrl, descriptor) => {
            const wasAlreadyEnabled = faceIdEnabled;
            setIsFaceScannerOpen(false);
            setFaceIdDataUrl(capturedDataUrl);
            if (Array.isArray(descriptor) && descriptor.length >= 64) {
              setFaceDescriptor(descriptor);
            }
            setFaceIdEnabled(true);
            setError('');
            try {
              const res = await fetch(`/api/auth/profile/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  faceIdDataUrl: capturedDataUrl,
                  faceDescriptor: descriptor,
                  faceIdEnabled: true,
                }),
              });
              const data = await res.json();
              if (res.ok && data.user) {
                playKitestSound('victory', soundEnabled);
                onUpdateUser(
                  data.user,
                  Array.isArray(data.users) ? data.users : undefined
                );
                setMessage(
                  wasAlreadyEnabled
                    ? "✅ Face ID muvaffaqiyatli o'zgartirildi va hisobingizga saqlandi!"
                    : "✅ Face ID 1-saqlashda ko'rib olindi va hisobingizga muvaffaqiyatli saqlandi!"
                );
              } else {
                setError(data.error || 'Face ID saqlashda xatolik yuz berdi');
              }
            } catch {
              setError("Server bilan bog'lanishda xatolik");
            }
          }}
        />
      </div>
    </AnimatePresence>
  );
};
