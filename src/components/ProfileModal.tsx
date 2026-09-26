import React, { useState, useEffect } from 'react';
import { User, ADMIN_EMAIL } from '../types';
import { X, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onUpdateUser,
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsername(user.username || '');
      setRegion(user.region || '');
      setInstitution(user.institution || '');
      setBio(user.bio || '');
      setNewPassword('');
      setMessage('');
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          region: region.trim(),
          institution: institution.trim(),
          bio: bio.trim(),
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Saqlashda xatolik');
      } else {
        onUpdateUser(data.user);
        setMessage("Profil ma'lumotlari yangilandi!");
        setNewPassword('');
      }
    } catch {
      setError('Server xatoligi');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel =
    user.email.toLowerCase() === ADMIN_EMAIL
      ? 'Bosh Admin'
      : user.role === 'creator'
      ? 'Yaratuvchi (Creator)'
      : 'Ishtirokchi';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Shaxsiy Profil</h2>
            <p className="text-xs text-slate-400 font-mono">
              {user.email} · {roleLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {message && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono tabular-nums">
            <div>
              <div className="text-[11px] text-slate-400">Reyting</div>
              <div className="text-base font-bold text-emerald-400">{user.rating}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Yechilgan</div>
              <div className="text-base font-bold text-white">{user.solvedCount}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Jami ball</div>
              <div className="text-base font-bold text-sky-400">{user.totalScore}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ism va Familiya
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Hudud
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Maktab / OTM
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              O'zingiz haqingizda (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Yangi parol (o'zgartirish uchun kiriting)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Yopish
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
