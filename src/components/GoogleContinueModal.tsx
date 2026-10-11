import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { KitestGloriousKite } from './KitestKiteLogo';
import { KitestRotatingActionLoader } from './KitestRotatingActionLoader';
import { signInWithRealGooglePopup, VerifiedGoogleAccount } from '../firebase';
import { User } from '../types';

interface GoogleContinueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, allUsers?: User[]) => void;
  soundEnabled?: boolean;
}

export const GoogleContinueModal: React.FC<GoogleContinueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleContinueWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const verifiedGoogle: VerifiedGoogleAccount = await signInWithRealGooglePopup();
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verifiedGoogle.email,
          name: verifiedGoogle.name,
          avatarUrl: verifiedGoogle.photoURL,
          idToken: verifiedGoogle.idToken,
          googleUid: verifiedGoogle.uid,
          institution: 'Google Account Foydalanuvchisi',
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(
          data.user,
          Array.isArray(data.users) ? data.users : undefined
        );
        onClose();
      } else {
        setError(data.error || 'Google orqali ulanishda xatolik');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(
        "Google oynasiga ruxsat berilmadi yoki bekor qilindi. Qaytadan urinib ko'ring."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        >
          {/* Top Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header Strip with Google G Logo */}
          <div className="pt-7 pb-4 px-6 text-center flex flex-col items-center">
            {/* Google Multicolor Logo */}
            <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7" viewBox="0 0 48 48">
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
            </div>

            {/* Exactly Matching User Request: "Continue to KITEST" */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <span>Continue to KITEST</span>
            </h2>

            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Google orqali KITEST ta'lim va test platformasiga xavfsiz ulanish
            </p>
          </div>

          {/* Central Glorious Animated Kite Illustration */}
          <div className="py-2 flex flex-col items-center justify-center relative">
            <div className="w-28 h-32 flex items-center justify-center">
              <KitestGloriousKite size={110} />
            </div>

            <div className="mt-2 text-center px-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>KITEST • Bilim va Imkoniyat</span>
              </div>
            </div>
          </div>

          {/* Body and Action Buttons */}
          <div className="p-6 pt-3 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
                {error}
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>To continue, Google will share with KITEST:</span>
              </div>
              <ul className="list-disc list-inside pl-1 text-[11px] text-slate-500 space-y-0.5">
                <li>Sizning ismingiz va profilingiz surati</li>
                <li>Elektron pochta manzilingiz (Gmail)</li>
                <li>Xavfsiz hisob identifikatori</li>
              </ul>
            </div>

            {/* Primary Continue Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleContinueWithGoogle}
              className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#fff"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#fff"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#fff"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#fff"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{loading ? 'Ulanmoqda...' : 'Continue to KITEST'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Bekor qilish
            </button>
          </div>
        </motion.div>

        {/* High-Tech Rotating Action Loader */}
        <KitestRotatingActionLoader
          isOpen={loading}
          variant="google"
          title="Google hisobiga ulanmoqda"
          subtitle="Google xavfsiz OAuth protokoli orqali KITEST profilingiz faollashtirilmoqda..."
        />
      </div>
    </AnimatePresence>
  );
};
