import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { UZBEKISTAN_LOCATIONS, REGIONS_LIST } from '../constants/uzbekistanLocations';
import { KitestKiteLogo } from './KitestKiteLogo';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  X,
  LogIn,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  ScanFace,
  Check,
} from 'lucide-react';
import { signInWithRealGooglePopup } from '../firebase';
import { FaceIdScannerModal } from './FaceIdScannerModal';
import { KitestRotatingActionLoader } from './KitestRotatingActionLoader';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User, allUsers?: User[]) => void;
  onOpenAdminModal: () => void;
  onDirectAdminUnlock?: (passcode: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
  onOpenAdminModal,
  onDirectAdminUnlock,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Register fields matching oK2Zj.jpg
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [region, setRegion] = useState<string>(REGIONS_LIST[0]);
  const [district, setDistrict] = useState<string>(
    UZBEKISTAN_LOCATIONS[REGIONS_LIST[0]][0]
  );
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceScannerMode, setFaceScannerMode] = useState<'login' | 'enroll' | 'forgot' | null>(null);
  const [enrolledFaceDataUrl, setEnrolledFaceDataUrl] = useState('');
  const [enrolledFaceDescriptor, setEnrolledFaceDescriptor] = useState<number[]>([]);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }, [initialMode, isOpen]);

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    const districtsForRegion = UZBEKISTAN_LOCATIONS[newRegion] || [];
    setDistrict(districtsForRegion[0] || '');
  };

  if (!isOpen) return null;

  const handlePasswordInput = (val: string) => {
    setPassword(val);
    if (error) setError('');
    if (mode === 'login' && val.trim() === ADMIN_PASSCODE_VALUE && onDirectAdminUnlock) {
      onDirectAdminUnlock(ADMIN_PASSCODE_VALUE);
      onClose();
    }
  };

  const handleRealGoogleModalSignIn = async () => {
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
        onSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
        onClose();
      } else {
        setError(data.error || 'Google orqali kirishda xatolik yuz berdi');
      }
    } catch (err: any) {
      const code = String(err?.code || '');
      if (!code.includes('popup-closed-by-user')) {
        setError('Google oynasi orqali tasdiqlashda xatolik yuz berdi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleMockSignIn = () => {
    setError("Apple ID orqali kirish xizmati tez kunda ishga tushiriladi. Hozircha Google, Face ID yoki Login orqali kiring!");
  };

  const handleFaceModalVerified = async (
    capturedDataUrl: string,
    modalLogin?: string,
    modalNewPassword?: string,
    faceDescriptor?: number[]
  ) => {
    setFaceScannerMode(null);
    if (mode === 'register') {
      setEnrolledFaceDataUrl(capturedDataUrl);
      if (faceDescriptor && faceDescriptor.length >= 64) {
        setEnrolledFaceDescriptor(faceDescriptor);
      }
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/face-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: modalLogin || loginInput.trim(),
          faceIdDataUrl: capturedDataUrl,
          faceDescriptor,
          newPassword: modalNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
        onClose();
      } else {
        setError(data.error || 'Face ID orqali kirishda xatolik');
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
      if (!loginInput.trim() || password.trim().length < 4) {
        setError('Username/Email va kamida 4 belgidan iborat yangi parolni kiriting!');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setError('Yangi parol va tasdiqlash paroli bir-biriga mos kelmadi!');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginInput.trim(),
            newPassword: password.trim(),
            confirmPassword: confirmPassword.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
          onClose();
        } else {
          setError(data.error || 'Parolni yangilashda xatolik yuz berdi');
        }
      } catch {
        setError("Server bilan bog'lanishda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      if (!loginInput.trim() || !password) {
        setError('Barcha maydonlarni to‘ldiring');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginInput.trim(),
            password,
          }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          onSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
          onClose();
        } else {
          setError(data.error || 'Login yoki parol noto‘g‘ri');
        }
      } catch {
        setError("Server bilan bog'lanishda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    } else {
      // Register Mode
      if (!username.trim() || !name.trim() || !email.trim() || !password) {
        setError('Barcha majburiy maydonlarni to‘ldiring');
        return;
      }

      if (password.length < 4) {
        setError('Parol kamida 4 ta belgidan iborat bo‘lishi kerak');
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        setError('Kiritilgan parollar bir-biriga mos kelmadi');
        return;
      }

      if (!agreeTerms) {
        setError('Davom etish uchun Foydalanish shartlariga rozilik bildiring');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            username: username.trim().replace(/^@+/, ''),
            email: email.trim().toLowerCase(),
            password,
            region,
            district,
            institution: institution.trim() || 'Umumiy ta\'lim maktabi',
            faceIdDataUrl: enrolledFaceDataUrl || undefined,
            faceDescriptor:
              enrolledFaceDescriptor.length >= 64
                ? enrolledFaceDescriptor
                : undefined,
            faceIdEnabled: Boolean(
              enrolledFaceDataUrl || enrolledFaceDescriptor.length >= 64
            ),
          }),
        });

        const data = await res.json();
        if (res.ok && data.user) {
          onSuccess(data.user, Array.isArray(data.users) ? data.users : undefined);
          onClose();
        } else {
          setError(data.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
        }
      } catch {
        setError("Server bilan bog'lanishda xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Soft Sky Blue Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        />

        {/* Modal Window matching oK2Zj.jpg */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative z-10 w-full max-w-[480px] bg-white rounded-3xl shadow-2xl border border-sky-100/80 p-6 sm:p-8 my-auto overflow-hidden text-slate-800"
        >
          {/* Close X Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header matching oK2Zj.jpg: Kite Emblem + Title + Subtitle */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <KitestKiteLogo size={42} showWordmark={true} />
            </div>

            <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 mb-1">
              {mode === 'register'
                ? 'Hisob yaratish'
                : mode === 'forgot'
                ? 'Parolni tiklash'
                : 'Tizimga kirish'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {mode === 'forgot'
                ? 'Yangi parol o‘rnatib hisobingizga kiring'
                : 'KITEST ta‘lim platformasiga xush kelibsiz!'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form matching oK2Zj.jpg */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' ? (
              <>
                {/* 1. Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username123"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 2. To'liq ismingiz */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    To&apos;liq ismingiz
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ism Familiya"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 3. Email manzilingiz */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email manzilingiz
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ism.familiya@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 4. Parol */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parol
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => handlePasswordInput(e.target.value)}
                      placeholder="Parolingizni yarating"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Parolni tasdiqlang */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Parolingizni qayta kiriting"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 6. Maktab nomi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maktab nomi
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Maktabingiz nomini kiriting"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* 7. Viloyat & Tuman (2 columns) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Viloyat
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={region}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="w-full pl-8 pr-6 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 outline-none appearance-none cursor-pointer focus:border-blue-500"
                      >
                        {REGIONS_LIST.map((r, rIdx) => (
                          <option key={`auth_m_reg_${r}_${rIdx}`} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tuman
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full pl-8 pr-6 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 outline-none appearance-none cursor-pointer focus:border-blue-500"
                      >
                        {(UZBEKISTAN_LOCATIONS[region] || []).map((d, dIdx) => (
                          <option key={`auth_m_dist_${d}_${dIdx}`} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Optional Face ID Enrollment Pill */}
                <button
                  type="button"
                  onClick={() => setFaceScannerMode('enroll')}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ScanFace className="w-4 h-4 text-sky-600" />
                  <span>
                    {enrolledFaceDataUrl
                      ? '✅ Face ID biriktirildi (1-bosishda kirish faol)'
                      : '👁️ Face ID qo‘shish (Kamera orqali 1-saqlash)'}
                  </span>
                </button>

                {/* 8. Terms Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 select-none cursor-pointer">
                    Shartlarga roziman,{' '}
                    <span className="text-blue-600 font-semibold hover:underline">
                      Foydalanish shartlari
                    </span>{' '}
                    bilan tanishib chiqdim
                  </label>
                </div>
              </>
            ) : mode === 'forgot' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username yoki Email manzili
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="Username yoki Email kiriting"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yangi parol (kamida 4 ta belgi)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Yangi parolni kiriting"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yangi parolni tasdiqlang
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yangi parolni qayta kiriting"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFaceScannerMode('forgot')}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ScanFace className="w-4 h-4 text-amber-600" />
                  <span>👁️ Yoki Face ID orqali parolni tiklash</span>
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email manzili yoki Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                      placeholder="ism.familiya@example.com yoki username"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Parol
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError('');
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Parolni unutdingizmi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => handlePasswordInput(e.target.value)}
                      placeholder="Parolingizni kiriting"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Face ID Direct Login Button */}
                <button
                  type="button"
                  onClick={() => setFaceScannerMode('login')}
                  className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ScanFace className="w-4 h-4 text-sky-600" />
                  <span>👁️ Face ID orqali 1-soniyada kirish (Kamera)</span>
                </button>
              </>
            )}

            {/* Main Action Button matching oK2Zj.jpg */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {mode === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Yaratilmoqda...' : 'Ro‘yxatdan o‘tish'}</span>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Saqlanmoqda...' : '💾 Yangi Parolni Saqlash va Kirish'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Kirilmoqda...' : 'Kirish'}</span>
                </>
              )}
            </button>

            {/* YOKI Divider matching oK2Zj.jpg */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
                YOKI
              </span>
            </div>

            {/* Social Buttons matching oK2Zj.jpg */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleRealGoogleModalSignIn}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                title="Google accountga kirish KITEST ilovasi uchun"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="truncate">Google bilan davom ettirish</span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={handleAppleMockSignIn}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0 fill-current text-slate-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.67-.82 1.13-1.96.99-3.11-.97.04-2.16.65-2.85 1.46-.61.71-1.14 1.87-.99 2.99 1.09.08 2.18-.52 2.85-1.34z"/>
                </svg>
                <span className="truncate">Apple bilan davom ettirish</span>
              </button>
            </div>

            {/* Bottom Toggle Link matching oK2Zj.jpg */}
            <div className="text-center pt-3 text-xs text-slate-500">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  ← Kirish oynasiga qaytish
                </button>
              ) : mode === 'register' ? (
                <span>
                  Allaqachon hisobingiz bormi?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Kirish
                  </button>
                </span>
              ) : (
                <span>
                  Hisobingiz yo‘qmi?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Ro‘yxatdan o‘tish
                  </button>
                </span>
              )}
            </div>
          </form>
        </motion.div>
      </div>

      {/* Real Face ID Scanner Modal */}
      {faceScannerMode && (
        <FaceIdScannerModal
          isOpen={Boolean(faceScannerMode)}
          mode={faceScannerMode}
          title={
            faceScannerMode === 'enroll'
              ? '📸 Face ID Kiritish va Saqlash'
              : faceScannerMode === 'forgot'
              ? '🔑 Parolni Tiklash (Face ID)'
              : '👁️ Face ID orqali Kirish'
          }
          onClose={() => setFaceScannerMode(null)}
          onEnrolled={(url, descriptor) => {
            setEnrolledFaceDataUrl(url);
            if (descriptor && descriptor.length >= 64) {
              setEnrolledFaceDescriptor(descriptor);
            }
            setFaceScannerMode(null);
          }}
          onLoginSuccess={(u, all) => {
            onSuccess(u, all);
            setFaceScannerMode(null);
            onClose();
          }}
          onAdminUnlocked={(code) => {
            onDirectAdminUnlock?.(code);
            setFaceScannerMode(null);
            onClose();
          }}
        />
      )}

      {/* Rotating Action Loader during Login & Account Creation */}
      <KitestRotatingActionLoader
        isOpen={loading}
        variant={mode === 'register' ? 'account' : 'login'}
        title={mode === 'register' ? 'Hisob yaratilmoqda' : 'Tizimga kirilmoqda'}
        subtitle={
          mode === 'register'
            ? "Yangi o'quvchi profili yaratilmoqda va bazaga kiritilmoqda..."
            : "Foydalanuvchi ma'lumotlari tekshirilmoqda va sessiya yuklanmoqda..."
        }
      />
    </AnimatePresence>
  );
};
