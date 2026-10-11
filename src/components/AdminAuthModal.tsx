import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KitestEmblem, playKitestSound } from './KitestEmblem';
import { FaceIdScannerModal } from './FaceIdScannerModal';
import {
  X,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Unlock,
  ScanFace,
} from 'lucide-react';

export const ADMIN_PASSCODE_VALUE = '23291031sila';

interface AdminAuthModalProps {
  isOpen: boolean;
  soundEnabled?: boolean;
  onClose: () => void;
  onUnlocked: (passcode: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  soundEnabled = true,
  onClose,
  onUnlocked,
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoUnlocked, setAutoUnlocked] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAdminPassword('');
      setError('');
      setAutoUnlocked(false);
      setIsFaceScannerOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const verifyAndOpenAdmin = async (passcodeToVerify: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passcodeToVerify.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        playKitestSound('warning', soundEnabled);
        setError(data.error || "Admin paroli noto'g'ri!");
        setLoading(false);
        return;
      }

      setAutoUnlocked(true);
      playKitestSound('victory', soundEnabled);
      onUnlocked(passcodeToVerify.trim());
      onClose();
    } catch {
      if (passcodeToVerify.trim() === ADMIN_PASSCODE_VALUE) {
        setAutoUnlocked(true);
        playKitestSound('victory', soundEnabled);
        onUnlocked(ADMIN_PASSCODE_VALUE);
        onClose();
      } else {
        setError('Server bilan bog‘lanishda xatolik');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (val: string) => {
    setAdminPassword(val);
    if (error) setError('');

    // Auto-unlock as soon as password is correct ("parol to'g'ri bo'lsa avtomatik ochsin")
    if (val.trim() === ADMIN_PASSCODE_VALUE && !loading && !autoUnlocked) {
      verifyAndOpenAdmin(val.trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Iltimos, maxsus admin parolini kiriting!');
      return;
    }
    verifyAndOpenAdmin(adminPassword);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="max-w-md w-full rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/15 overflow-hidden"
        >
          {/* Top Multi-Color Header */}
          <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-amber-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KitestEmblem size="sm" showVerifiedSeal={false} />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-300 via-fuchsia-300 to-sky-300 bg-clip-text text-transparent flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Maxsus Admin Panelga Kirish</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Parol yoki Yuz (Face ID) orqali avto-kirish
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-sky-500/10 border border-amber-500/30 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Admin paroli to'g'ri yozilishi bilan{' '}
                <strong className="text-amber-300">Admin Panel avtomatik ochiladi</strong>{' '}
                yoki pastdagi <strong className="text-sky-300">Face ID Skaner</strong> orqali yuzingizni tasdiqlab kiring!
              </span>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700 text-xs text-rose-200 flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Face ID Admin Login Button ("admin panelga kirish ham behruz_admin face id orqali bolsin") */}
            <button
              type="button"
              onClick={() => setIsFaceScannerOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-600/30 via-indigo-600/30 to-amber-500/30 hover:from-sky-600/45 hover:to-amber-500/45 border border-sky-400/60 text-xs sm:text-sm font-black text-sky-200 flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer"
            >
              <ScanFace className="w-5 h-5 text-sky-400" />
              <span>👁️ @behruz_admin Face ID Orqali Admin Panelni Ochish</span>
            </button>

            <div>
              <label className="block text-xs font-bold text-amber-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Maxsus Admin Paroli *</span>
                </span>
                <span className="text-[11px] font-normal text-emerald-400">
                  ⚡ Parol to'g'ri bo'lsa avto-ochiladi
                </span>
              </label>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Admin parolini kiriting..."
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-amber-500/40 focus:border-amber-400 text-sm text-white font-mono placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {autoUnlocked && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/60 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Admin tasdiqlandi! Admin panel ochilmoqda...</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-fuchsia-600 to-indigo-600 hover:from-amber-400 hover:via-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-xs sm:text-sm font-extrabold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Unlock className="w-4 h-4" />
              <span>{loading ? 'Tekshirilmoqda...' : 'Admin Panelni Ochish'}</span>
            </motion.button>
          </form>
        </motion.div>

        <FaceIdScannerModal
          isOpen={isFaceScannerOpen}
          mode="admin"
          title="@behruz_admin — Admin Face ID Tekshiruvi"
          subtitle="Bosh Admin (@behruz_admin) yuz biometrik tasdig'i orqali Admin Panelga kirish"
          soundEnabled={soundEnabled}
          onClose={() => setIsFaceScannerOpen(false)}
          onAdminUnlocked={(code) => {
            setIsFaceScannerOpen(false);
            setAutoUnlocked(true);
            playKitestSound('victory', soundEnabled);
            onUnlocked(code || ADMIN_PASSCODE_VALUE);
            onClose();
          }}
          onVerified={() => {
            setIsFaceScannerOpen(false);
            verifyAndOpenAdmin(ADMIN_PASSCODE_VALUE);
          }}
        />
      </div>
    </AnimatePresence>
  );
};
