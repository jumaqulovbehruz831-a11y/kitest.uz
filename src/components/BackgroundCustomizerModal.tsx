import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User } from '../types';
import {
  playKitestSound,
  AnimatedWords,
  TEXT_EFFECT_PRESETS,
  useTextEffectMode,
  KIDTEST_LOGO_DATA_URL,
} from './KitestEmblem';
import { REGIONS_LIST, UZBEKISTAN_LOCATIONS } from '../constants/uzbekistanLocations';
import { readAndOptimizeAvatarFile } from './ProfileModal';
import {
  X,
  Image as ImageIcon,
  Palette,
  Upload,
  RotateCcw,
  Check,
  Sliders,
  Sparkles,
  Save,
  Settings,
  User as UserIcon,
  Lock,
  Volume2,
  Eye,
  Zap,
  Smile,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  Mail,
  AtSign,
} from 'lucide-react';

export interface CustomBackgroundConfig {
  mode: 'preset' | 'solid' | 'gradient' | 'image';
  presetId: string;
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  imageUrl: string;
  overlayOpacity: number; // 0.15 to 0.90
  blurPx: number; // 0 to 16
  accentTheme?: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose';
  fontScale?: number; // 95 | 100 | 105 | 110
  fontFamily?: 'default' | 'mono' | 'serif' | 'rounded';
  animationSpeed?: 'slow' | 'normal' | 'fast';
  floatingEmotionsEnabled?: boolean;
  eyeCareWarmth?: number; // 0 to 40
}

export const DEFAULT_BG_CONFIG: CustomBackgroundConfig = {
  mode: 'preset',
  presetId: 'clean-light',
  solidColor: '#ffffff',
  gradientStart: '#f8fafc',
  gradientEnd: '#f1f5f9',
  gradientAngle: 135,
  imageUrl: '',
  overlayOpacity: 0.15,
  blurPx: 0,
  accentTheme: 'sky',
  fontScale: 100,
  animationSpeed: 'normal',
  floatingEmotionsEnabled: false,
  eyeCareWarmth: 0,
};

export interface BackgroundPresetItem {
  id: string;
  name: string;
  subtitle: string;
  cssBackground: string;
  isLight?: boolean;
}

export const BACKGROUND_PRESETS: BackgroundPresetItem[] = [
  {
    id: 'default-dark',
    name: 'Klassik Tungi Ko‘k',
    subtitle: 'Standart rasmiy fon',
    cssBackground:
      'radial-gradient(at 15% 15%, rgba(56, 189, 248, 0.12) 0px, transparent 45%), radial-gradient(at 85% 15%, rgba(168, 85, 247, 0.12) 0px, transparent 45%), #060913',
  },
  {
    id: 'clean-light',
    name: 'Toza Kunlik Oq',
    subtitle: 'Yorug‘ va tiniq kunduzgi fon',
    cssBackground:
      'radial-gradient(at 15% 15%, rgba(56, 189, 248, 0.14) 0px, transparent 45%), #f4f7fb',
    isLight: true,
  },
  {
    id: 'deep-ocean',
    name: 'Moviy Okean',
    subtitle: 'Chuqur moviy dengiz to‘lqini',
    cssBackground: 'linear-gradient(135deg, #041527 0%, #0a2948 50%, #05101f 100%)',
  },
  {
    id: 'royal-indigo',
    name: 'Qirollik Binafsha',
    subtitle: 'Zamonaviy indigo va binafsha',
    cssBackground: 'linear-gradient(135deg, #130929 0%, #1e1b4b 50%, #090d1a 100%)',
  },
  {
    id: 'emerald-academy',
    name: 'Zumrad Akademiya',
    subtitle: 'Ilmiy zumrad va to‘q ko‘k',
    cssBackground: 'linear-gradient(135deg, #04221f 0%, #083833 50%, #07121e 100%)',
  },
  {
    id: 'sunset-horizon',
    name: 'Shom Shu’lasi',
    subtitle: 'Iliq shafaq va tungi osmon',
    cssBackground: 'linear-gradient(135deg, #2b0f1c 0%, #381a2c 50%, #0c1324 100%)',
  },
  {
    id: 'cyber-graphite',
    name: 'Minimalist Grafit',
    subtitle: 'Sof kulrang-qora ish maydoni',
    cssBackground: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
  },
  {
    id: 'amber-cosmos',
    name: 'Oltin Kosmos',
    subtitle: 'To‘q qahrabo va tungi moviy',
    cssBackground: 'linear-gradient(135deg, #231707 0%, #17182f 55%, #070b14 100%)',
  },
];

const NASTROYKA_EMOTIONS = [
  { id: 'rocket', emoji: '🚀', label: 'Kosmik Tezlik', count: 240 },
  { id: 'fire', emoji: '🔥', label: 'Olovli Energiya', count: 318 },
  { id: 'brain', emoji: '🧠', label: 'AI Intellekt', count: 275 },
  { id: 'crown', emoji: '👑', label: 'Qirollik Darajasi', count: 290 },
  { id: 'gem', emoji: '💎', label: 'Olmos Sifat', count: 214 },
  { id: 'zap', emoji: '⚡', label: 'Chaqmoq Reaksiya', count: 263 },
  { id: 'trophy', emoji: '🏆', label: 'Chempionlik', count: 305 },
  { id: 'star', emoji: '🌟', label: '5x Yulduz', count: 288 },
  { id: 'heart', emoji: '❤️‍🔥', label: 'Sevimli Platforma', count: 342 },
  { id: 'party', emoji: '🎉', label: 'Salyut & Bayram', count: 229 },
  { id: 'target', emoji: '🎯', label: '100% Aniq Nishon', count: 251 },
  { id: 'magic', emoji: '✨', label: 'Zamonaviy Dizayn', count: 277 },
];

interface BackgroundCustomizerModalProps {
  isOpen: boolean;
  config: CustomBackgroundConfig;
  soundEnabled?: boolean;
  currentUser?: User | null;
  onUpdateUser?: (updated: User, allUsers?: User[]) => void;
  onToggleSound?: () => void;
  onChangeConfig: (newConfig: CustomBackgroundConfig) => void;
  onOpenFullProfile?: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const BackgroundCustomizerModal: React.FC<BackgroundCustomizerModalProps> = ({
  isOpen,
  config,
  soundEnabled = true,
  currentUser,
  onUpdateUser,
  onToggleSound,
  onChangeConfig,
  onReset,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'animations' | 'profile_edit' | 'system'>('design');
  const [textEffect, setTextEffect] = useTextEffectMode();
  const [imageUrlInput, setImageUrlInput] = useState(
    config.mode === 'image' && !config.imageUrl.startsWith('data:')
      ? config.imageUrl
      : ''
  );
  const [uploadStatus, setUploadStatus] = useState('');

  // Emotions & Floating Emoji Burst State inside Nastroyka
  const [emotions, setEmotions] = useState(NASTROYKA_EMOTIONS);
  const [floatingBursts, setFloatingBursts] = useState<
    { id: number; emoji: string; label: string; x: number }[]
  >([]);

  // Profile Quick-Edit State inside Nastroyka ("nastroykaga koproq narsa qosh editni")
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editRegion, setEditRegion] = useState(
    currentUser?.region || REGIONS_LIST[0] || 'Toshkent shahri'
  );
  const [editDistrict, setEditDistrict] = useState(
    currentUser?.district ||
      (UZBEKISTAN_LOCATIONS[currentUser?.region || 'Toshkent shahri'] || [])[0] ||
      ''
  );
  const [editSchool, setEditSchool] = useState(
    currentUser?.school || currentUser?.institution || ''
  );
  const [editBadge, setEditBadge] = useState(currentUser?.customBadge || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  useEffect(() => {
    if (currentUser && isOpen) {
      setEditName(currentUser.name || '');
      setEditUsername(currentUser.username || '');
      setEditEmail(currentUser.email || '');
      setEditBio(currentUser.bio || '');
      setEditRegion(currentUser.region || 'Toshkent shahri');
      setEditDistrict(
        currentUser.district ||
          (UZBEKISTAN_LOCATIONS[currentUser.region || 'Toshkent shahri'] || [])[0] ||
          ''
      );
      setEditSchool(currentUser.school || currentUser.institution || '');
      setEditBadge(currentUser.customBadge || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setEditNewPassword('');
      setEditConfirmPassword('');
      setProfileMsg('');
      setProfileErr('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const triggerEmotionBurst = (id: string, emoji: string, label: string) => {
    playKitestSound('coin', soundEnabled);
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.65 },
    });
    setEmotions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, count: e.count + 1 } : e))
    );
    const burstId = Date.now() + Math.random();
    const x = 15 + Math.floor(Math.random() * 70);
    setFloatingBursts((prev) => [...prev.slice(-10), { id: burstId, emoji, label, x }]);
    setTimeout(() => {
      setFloatingBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Rasm tayyorlanmoqda...');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1600;
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          playKitestSound('success', soundEnabled);
          onChangeConfig({
            ...config,
            mode: 'image',
            imageUrl: dataUrl,
          });
          setUploadStatus('Shaxsiy rasm dashboard foniga o‘rnatildi!');
        }
      };
      img.src = String(event.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await readAndOptimizeAvatarFile(file);
      if (optimized) {
        setEditAvatarUrl(optimized);
        playKitestSound('success', soundEnabled);
      }
    } catch {
      setProfileErr('Avatar rasmni yuklashda xatolik');
    }
    e.target.value = '';
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    playKitestSound('success', soundEnabled);
    onChangeConfig({
      ...config,
      mode: 'image',
      imageUrl: imageUrlInput.trim(),
    });
    setUploadStatus('Rasm havolasi dashboard foniga o‘rnatildi!');
  };

  const handleSaveProfileFromNastroyka = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) {
      setUploadStatus("✅ Barcha dizayn va tizim sozlamalari saqlandi!");
      playKitestSound('success', soundEnabled);
      return;
    }

    setProfileErr('');
    setProfileMsg('');

    if (editNewPassword && editConfirmPassword && editNewPassword !== editConfirmPassword) {
      setProfileErr('Yangi parollar bir-biriga mos kelmadi!');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await fetch(`/api/auth/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          username: editUsername.trim().replace(/^@+/, ''),
          email: editEmail.trim(),
          bio: editBio.trim(),
          region: editRegion,
          district: editDistrict,
          school: editSchool.trim(),
          institution: editSchool.trim(),
          customBadge: editBadge.trim(),
          avatarUrl: editAvatarUrl,
          newPassword: editNewPassword.trim() || undefined,
          confirmNewPassword: editConfirmPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileErr(data.error || "Saqlashda xatolik yuz berdi");
      } else if (data.user) {
        playKitestSound('victory', soundEnabled);
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.6 } });
        onUpdateUser?.(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
        setEditNewPassword('');
        setEditConfirmPassword('');
        setProfileMsg("💾 Barcha profil va nastroyka o'zgarishlari muvaffaqiyatli saqlandi!");
        setUploadStatus("💾 Barcha o'zgarishlar saqlandi!");
      }
    } catch {
      setProfileErr("Server bilan bog'lanishda xatolik");
    } finally {
      setProfileSaving(false);
    }
  };

  const districtsForSelectedRegion = UZBEKISTAN_LOCATIONS[editRegion] || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22 }}
          className="max-w-3xl w-full rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto relative"
        >
          {/* Floating Emoji Bursts Overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-40">
            <AnimatePresence>
              {floatingBursts.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 1, y: 420, x: `${b.x}%`, scale: 0.7 }}
                  animate={{ opacity: 0, y: 30, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="absolute px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-400/50 text-xs font-extrabold text-white shadow-xl flex items-center gap-1.5"
                >
                  <span className="text-lg">{b.emoji}</span>
                  <span>{b.label}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Header */}
          <div className="p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '9s' }} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  <AnimatedWords text="⚙️ Kengaytirilgan Nastroyka va Tahrirlash Markazi (Edit Studio)" />
                </h2>
                <p className="text-xs text-slate-400">
                  Dizayn, Orqa fon, Animatsiya & Emotsiyalar, Shaxsiy Profil, Parol va Tizim sozlamalarini tahrirlang
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (activeTab === 'profile_edit' && currentUser) {
                    await handleSaveProfileFromNastroyka();
                  } else {
                    playKitestSound('success', soundEnabled);
                    setUploadStatus("✅ Barcha o'zgarishlar va sozlamalar saqlandi!");
                    setTimeout(() => onClose(), 350);
                  }
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>💾 Saqlash</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Tab Navigation Bar */}
          <div className="px-5 pt-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap gap-2 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                activeTab === 'design'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>🎨 Fon, Ranglar va Shrift Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('animations')}
              className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                activeTab === 'animations'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>✨ Animatsiya va Emotsiyalar Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile_edit')}
              className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                activeTab === 'profile_edit'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>👤 Profil, Username va Parol Edit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('system')}
              className={`py-2 px-3.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all border ${
                activeTab === 'system'
                  ? 'bg-violet-500 text-white border-violet-400 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>🔊 Ovoz, Ko&apos;z Himoya va Tizim</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
            {uploadStatus && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-center justify-between">
                <span>{uploadStatus}</span>
                <button
                  type="button"
                  onClick={() => setUploadStatus('')}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* =========================================================
                TAB 1: DESIGN, BACKGROUND, ACCENT COLORS & FONT SCALE EDIT
               ========================================================= */}
            {activeTab === 'design' && (
              <div className="space-y-5">
                {/* 1. Custom Image Upload & URL */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      <span>1. Shaxsiy Rasm Yoki Wallpaper O&apos;rnatish</span>
                    </div>
                    {config.mode === 'image' && (
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        Faol: Shaxsiy rasm
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Qurilmadan Rasm Yuklash</span>
                    </button>

                    <form onSubmit={handleApplyUrl} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="Yoki rasm URL manzilini kiriting..."
                        className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="submit"
                        className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white shrink-0"
                      >
                        Qo&apos;llash
                      </button>
                    </form>
                  </div>

                  {/* Image Overlay & Blur Controls */}
                  <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-sky-400" />
                          <span>Fon qoramtirligi (Shaffoflik)</span>
                        </span>
                        <span className="font-mono">{Math.round(config.overlayOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.15}
                        max={0.92}
                        step={0.05}
                        value={config.overlayOpacity}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            overlayOpacity: Number(e.target.value),
                          })
                        }
                        className="w-full accent-sky-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                        <span>Fon xiraligi (Blur effekti)</span>
                        <span className="font-mono">{config.blurPx}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={16}
                        step={1}
                        value={config.blurPx}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            blurPx: Number(e.target.value),
                          })
                        }
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Custom Color, Gradient & Angle Picker */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>2. O&apos;zingiz Xohlagan Rang, Gradient va Burchak Edit</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">Bir tekis rang</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {config.solidColor}
                        </div>
                      </div>
                      <input
                        type="color"
                        value={config.solidColor}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            mode: 'solid',
                            solidColor: e.target.value,
                          })
                        }
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">Gradient 1-rang</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {config.gradientStart}
                        </div>
                      </div>
                      <input
                        type="color"
                        value={config.gradientStart}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            mode: 'gradient',
                            gradientStart: e.target.value,
                          })
                        }
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-white">Gradient 2-rang</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {config.gradientEnd}
                        </div>
                      </div>
                      <input
                        type="color"
                        value={config.gradientEnd}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            mode: 'gradient',
                            gradientEnd: e.target.value,
                          })
                        }
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  </div>

                  {/* Gradient Angle & Font Scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Gradient yo&apos;nalish burchagi</span>
                        <span className="font-mono text-sky-400">{config.gradientAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        step={15}
                        value={config.gradientAngle}
                        onChange={(e) =>
                          onChangeConfig({
                            ...config,
                            mode: 'gradient',
                            gradientAngle: Number(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Shrift va Interfeys Masshtabi</span>
                        <span className="font-mono text-emerald-400">
                          {config.fontScale || 100}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[95, 100, 105, 110].map((scale) => (
                          <button
                            key={scale}
                            type="button"
                            onClick={() => {
                              onChangeConfig({ ...config, fontScale: scale });
                              document.documentElement.style.fontSize = `${(scale / 100) * 16}px`;
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold border ${
                              (config.fontScale || 100) === scale
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800'
                            }`}
                          >
                            {scale}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Curated Presets */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white">
                    3. Tayyor Zamonaviy Fonlar To&apos;plami
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const isSelected =
                        config.mode === 'preset' && config.presetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            playKitestSound('click', soundEnabled);
                            onChangeConfig({
                              ...config,
                              mode: 'preset',
                              presetId: preset.id,
                            });
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-sky-400 bg-slate-800/90 shadow-md'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className="w-full h-12 rounded-lg border border-white/10 flex items-center justify-end p-2"
                            style={{ background: preset.cssBackground }}
                          >
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">
                              {preset.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {preset.subtitle}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 2: ANIMATIONS & EMOTIONS EDIT ("anomatsiya emotsiyalar qosh")
               ========================================================= */}
            {activeTab === 'animations' && (
              <div className="space-y-5">
                {/* 1. Live Interactive Emotions & Fireworks Generator */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/35 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
                      <Smile className="w-4 h-4 text-amber-400" />
                      <span>🎉 Jonli Emotsiyalar va Animatsiya Impulsi (Bosib ko&apos;ring!)</span>
                    </div>
                    <span className="text-[11px] font-mono text-sky-400">
                      Jami: {emotions.reduce((acc, item) => acc + item.count, 0)} ta reaksiya
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {emotions.map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => triggerEmotionBurst(item.id, item.emoji, item.label)}
                        className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{item.emoji}</span>
                          <span className="text-[11px] font-bold text-slate-200 truncate">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-extrabold text-amber-400 shrink-0">
                          {item.count}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* 2. Colorful Word & Text Effects Selector */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>🌈 So&apos;zlardagi Rang-Barang Animatsiya Effektlari</span>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-400">
                      Faol: {TEXT_EFFECT_PRESETS.find((p) => p.id === textEffect)?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {TEXT_EFFECT_PRESETS.map((preset) => {
                      const active = textEffect === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            playKitestSound('click', soundEnabled);
                            setTextEffect(preset.id);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                            active
                              ? 'bg-slate-800/95 border-sky-400 ring-2 ring-sky-400/30 shadow-md'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-extrabold ${preset.previewClass}`}>
                              {preset.badge}
                            </span>
                            {active && (
                              <span className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-white">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-2">
                            {preset.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Animation Speed & Particle Settings */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-white mb-2">
                      ⚡ Animatsiya Tezligi Rejimi
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'slow', label: 'Sekin' },
                        { id: 'normal', label: "O'rtacha" },
                        { id: 'fast', label: 'Tezkor' },
                      ].map((spd) => (
                        <button
                          key={spd.id}
                          type="button"
                          onClick={() =>
                            onChangeConfig({
                              ...config,
                              animationSpeed: spd.id as 'slow' | 'normal' | 'fast',
                            })
                          }
                          className={`py-2 px-3 rounded-xl text-xs font-bold border ${
                            (config.animationSpeed || 'normal') === spd.id
                              ? 'bg-sky-500 text-slate-950 border-sky-400'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          {spd.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white mb-2">
                      🎆 Konfetti Salyut O&apos;tish Sinovi
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playKitestSound('victory', soundEnabled);
                        confetti({
                          particleCount: 90,
                          spread: 90,
                          origin: { y: 0.6 },
                        });
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>🎉 Bayram Salyutini Otish!</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                TAB 3: PROFILE, USERNAME, PASSWORD & AVATAR QUICK EDIT
                ("nastroykaga koproq narsa qosh editni")
               ========================================================= */}
            {activeTab === 'profile_edit' && (
              <div className="space-y-4">
                {!currentUser ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <UserIcon className="w-8 h-8 text-sky-400 mx-auto" />
                    <div className="text-sm font-bold text-white">
                      Shaxsiy profilni tahrirlash uchun avval hisobingizga kiring
                    </div>
                    <p className="text-xs text-slate-400">
                      Tizimga kirganingizdan so&apos;ng bu yerdan Ism, Username, Email, Viloyat, Maktab va Parolingizni bevosita tahrirlashingiz mumkin.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfileFromNastroyka} className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={editAvatarUrl || KIDTEST_LOGO_DATA_URL}
                          alt={editName}
                          className="w-14 h-14 rounded-2xl object-cover bg-slate-900 border border-emerald-400/40"
                        />
                        <div>
                          <div className="text-sm font-black text-white">{editName}</div>
                          <div className="text-xs font-mono text-emerald-400">
                            @{editUsername} · {currentUser.totalScore} ball
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 border border-slate-700"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                          <span>Rasmni Yangilash</span>
                        </button>
                      </div>
                    </div>

                    {profileErr && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{profileErr}</span>
                      </div>
                    )}

                    {profileMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{profileMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Ism va Familiya
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Username (@foydalanuvchi_nomi)
                        </label>
                        <div className="relative">
                          <AtSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Email manzili
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Maktab / OTM / Muassasa
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={editSchool}
                            onChange={(e) => setEditSchool(e.target.value)}
                            placeholder="15-maktab / TATU"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Viloyat / Hudud
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <select
                            value={editRegion}
                            onChange={(e) => {
                              const r = e.target.value;
                              setEditRegion(r);
                              setEditDistrict((UZBEKISTAN_LOCATIONS[r] || [])[0] || '');
                            }}
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                          >
                            {REGIONS_LIST.filter((r) => r !== 'Barchasi').map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Tuman / Shahar
                        </label>
                        <select
                          value={editDistrict}
                          onChange={(e) => setEditDistrict(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                        >
                          {districtsForSelectedRegion.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Bio / Maqsad
                        </label>
                        <input
                          type="text"
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="O'zingiz haqingizda qisqacha..."
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Maxsus Unvon (Badge)
                        </label>
                        <input
                          type="text"
                          value={editBadge}
                          onChange={(e) => setEditBadge(e.target.value)}
                          placeholder="Masalan: 🚀 Olimpiada Chempioni"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          🔑 Yangi Parol (o&apos;zgartirish uchun)
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={editNewPassword}
                            onChange={(e) => setEditNewPassword(e.target.value)}
                            placeholder="Yangi parol (ixtiyoriy)"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          🔑 Yangi Parolni Tasdiqlang
                        </label>
                        <input
                          type="password"
                          value={editConfirmPassword}
                          onChange={(e) => setEditConfirmPassword(e.target.value)}
                          placeholder="Yangi parolni qayta kiriting"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {profileSaving
                          ? 'Saqlanmoqda...'
                          : "💾 Profil va Parol O'zgarishlarini Saqlash"}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* =========================================================
                TAB 4: SOUND, EYE CARE & SYSTEM SETTINGS
               ========================================================= */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>🔊 Ovoz Effektlari va Audio Sinov</span>
                    </div>
                    {onToggleSound && (
                      <button
                        type="button"
                        onClick={onToggleSound}
                        className={`py-1.5 px-3.5 rounded-xl text-xs font-extrabold ${
                          soundEnabled
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {soundEnabled ? '🔊 Ovoz Yoqilgan' : "🔇 Ovoz O'chirilgan"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => playKitestSound('click', true)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200"
                    >
                      🎵 Tugma Ovozi
                    </button>
                    <button
                      type="button"
                      onClick={() => playKitestSound('coin', true)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-amber-300"
                    >
                      🪙 Tanga Ovozi
                    </button>
                    <button
                      type="button"
                      onClick={() => playKitestSound('success', true)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-emerald-300"
                    >
                      ✅ Muvaffaqiyat
                    </button>
                    <button
                      type="button"
                      onClick={() => playKitestSound('victory', true)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-sky-300"
                    >
                      🏆 G&apos;alaba Fanfar
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>👁️ Ko&apos;z Himoya Nuri (Night Shield Filter)</span>
                    </span>
                    <span className="font-mono text-amber-400">
                      {config.eyeCareWarmth || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={35}
                    step={5}
                    value={config.eyeCareWarmth || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onChangeConfig({ ...config, eyeCareWarmth: val });
                      document.body.style.filter =
                        val > 0 ? `sepia(${val / 100})` : 'none';
                    }}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                playKitestSound('click', soundEnabled);
                onReset();
                setImageUrlInput('');
                setUploadStatus('Standart rasmiy fonga qaytarildi');
              }}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standart holatga qaytarish</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (activeTab === 'profile_edit' && currentUser) {
                    await handleSaveProfileFromNastroyka();
                  } else {
                    playKitestSound('success', soundEnabled);
                    setUploadStatus("✅ Barcha o'zgarishlar va sozlamalar saqlandi!");
                    setTimeout(() => onClose(), 350);
                  }
                }}
                className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>💾 Barchasini Saqlash</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
