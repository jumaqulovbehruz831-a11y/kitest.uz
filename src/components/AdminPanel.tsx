import React, { useState, useRef } from 'react';
import { User, TestItem, Contest, ADMIN_EMAIL } from '../types';
import {
  ShieldCheck,
  UserPlus,
  Users,
  FileText,
  Trophy,
  Trash2,
  Ban,
  CheckCircle2,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User | null;
  users: User[];
  tests: TestItem[];
  contests: Contest[];
  creatorEmails: string[];
  onRefreshState: () => void;
  onOpenCreateTest: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  users,
  tests,
  contests,
  creatorEmails,
  onRefreshState,
  onOpenCreateTest,
}) => {
  const [activeSection, setActiveSection] = useState<'creators' | 'users' | 'tests' | 'contests'>('creators');

  // Add Creator Form State
  const [creatorEmail, setCreatorEmail] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [creatorUsername, setCreatorUsername] = useState('');
  const [creatorPassword, setCreatorPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Create Contest Form State
  const [contestTitle, setContestTitle] = useState('');
  const [contestSubject, setContestSubject] = useState('Informatika va Algoritmlar');
  const [contestDuration, setContestDuration] = useState<number>(90);
  const [contestDescription, setContestDescription] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  const isAdmin =
    Boolean(currentUser) &&
    currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          KITEST Admin Panelga kirish taqiqlangan
        </h2>
        <p className="text-sm text-slate-400">
          Ushbu boshqaruv paneliga faqat Bosh Admin ({ADMIN_EMAIL}) kira oladi.
        </p>
      </div>
    );
  }

  const handleFocusAddCreator = () => {
    setActiveSection('creators');
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
  };

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    setErrorMessage('');

    if (!creatorEmail.trim()) {
      setErrorMessage('Test yaratuvchi email manzilini kiriting!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser!.email,
        },
        body: JSON.stringify({
          email: creatorEmail.trim(),
          name: creatorName.trim() || undefined,
          username: creatorUsername.trim() || undefined,
          password: creatorPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Xatolik yuz berdi');
      } else {
        setStatusMessage(data.message || "Test yaratuvchi muvaffaqiyatli qo'shildi!");
        setCreatorEmail('');
        setCreatorName('');
        setCreatorUsername('');
        setCreatorPassword('');
        onRefreshState();
      }
    } catch {
      setErrorMessage('Server bilan bog‘lanishda xatolik');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCreatorEmail = async (emailToRemove: string) => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await fetch(`/api/admin/creators/${encodeURIComponent(emailToRemove)}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser!.email },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Xatolik yuz berdi');
      } else {
        setStatusMessage(data.message || 'Test yaratuvchi huquqi olib tashlandi');
        onRefreshState();
      }
    } catch {
      setErrorMessage('Server xatoligi');
    }
  };

  const handleToggleUserRole = async (targetUser: User) => {
    const nextRole = targetUser.role === 'creator' ? 'user' : 'creator';
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser!.email,
        },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) {
        setStatusMessage(
          `${targetUser.name} roli "${nextRole === 'creator' ? 'Test Yaratuvchi' : 'Ishtirokchi'}" ga o'zgartirildi.`
        );
        onRefreshState();
      }
    } catch {
      setErrorMessage('Rolni o‘zgartirishda xatolik');
    }
  };

  const handleToggleBanUser = async (targetUser: User) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/ban`, {
        method: 'PATCH',
        headers: { 'x-user-email': currentUser!.email },
      });
      if (res.ok) {
        onRefreshState();
      }
    } catch {}
  };

  const handleDeleteUser = async (targetUser: User) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser!.email },
      });
      if (res.ok) {
        onRefreshState();
      }
    } catch {}
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser!.email },
      });
      if (res.ok) {
        setStatusMessage(`Test #${testId} o'chirildi.`);
        onRefreshState();
      }
    } catch {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestTitle.trim()) return;

    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser!.email,
        },
        body: JSON.stringify({
          title: contestTitle.trim(),
          subject: contestSubject,
          durationMinutes: contestDuration,
          description: contestDescription.trim(),
          testIds: selectedTestIds,
        }),
      });
      if (res.ok) {
        setContestTitle('');
        setContestDescription('');
        setSelectedTestIds([]);
        setStatusMessage("Yangi olimpiada muvaffaqiyatli e'lon qilindi!");
        onRefreshState();
      }
    } catch {}
  };

  const handleDeleteContest = async (contestId: string) => {
    try {
      const res = await fetch(`/api/contests/${contestId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': currentUser!.email },
      });
      if (res.ok) {
        onRefreshState();
      }
    } catch {}
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* KITEST Admin Top Header with prominent "+ Test Yaratuvchi Qo'shish" button */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>KITEST BOSH ADMIN PANELI · {ADMIN_EMAIL}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            KITEST Boshqaruv va Test Yaratuvchilar Paneli
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleFocusAddCreator}
            className="py-2.5 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Test Yaratuvchi Qo'shish</span>
          </button>

          <button
            onClick={onOpenCreateTest}
            className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yangi Test Yaratish</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-700/70 text-emerald-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {statusMessage}
          </span>
          <button onClick={() => setStatusMessage('')} className="text-emerald-400 hover:underline">
            Yopish
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-700/70 text-rose-200 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:underline">
            Yopish
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSection('creators')}
          className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSection === 'creators'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Test yaratuvchi qo'shish ({creatorEmails.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSection === 'users'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Barcha foydalanuvchilar ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('tests')}
          className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSection === 'tests'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Testlar arxivi ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('contests')}
          className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeSection === 'contests'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Olimpiadalar ({contests.length})</span>
        </button>
      </div>

      {/* SECTION 1: ADD & MANAGE CREATORS */}
      {activeSection === 'creators' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Creator Form */}
          <div className="lg:col-span-6 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Test Yaratuvchi (Creator) Qo'shish</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Quyida email kiritib "Test Yaratuvchi Qo'shish" tugmasini bosing. Faqat shu ro'yxatdagilar Telegram Quiz uslubida test yarata oladi.
              </p>
            </div>

            <form onSubmit={handleAddCreator} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Test yaratuvchi Email manzili *
                </label>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={creatorEmail}
                  onChange={(e) => setCreatorEmail(e.target.value)}
                  placeholder="ustoz@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-3">
                <div className="text-xs text-slate-400">
                  Agar ushbu yaratuvchi hali ro'yxatdan o'tmagan bo'lsa, unga tayyor profil va parol ham yaratib berishingiz mumkin:
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ism va Familiya
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Masalan: Anvar Karimov"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={creatorUsername}
                      onChange={(e) => setCreatorUsername(e.target.value)}
                      placeholder="anvar_ustoz"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Kirish paroli (kamida 4 belgi)
                    </label>
                    <input
                      type="text"
                      value={creatorPassword}
                      onChange={(e) => setCreatorPassword(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Test Yaratuvchi Qo'shish</span>
              </button>
            </form>
          </div>

          {/* Authorized Creators List */}
          <div className="lg:col-span-6 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">
              Tasdiqlangan Test Yaratuvchilar ({creatorEmails.length})
            </h2>

            <div className="space-y-2.5">
              {creatorEmails.map((email) => {
                const matchedUser = users.find(
                  (u) => u.email.toLowerCase() === email.toLowerCase()
                );
                const isOwner = email.toLowerCase() === ADMIN_EMAIL;

                return (
                  <div
                    key={email}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {matchedUser ? matchedUser.name : email}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {email} ·{' '}
                        {isOwner
                          ? 'Bosh Admin & Test Yaratuvchi'
                          : matchedUser
                          ? `@${matchedUser.username} (Faol Yaratuvchi)`
                          : "Ushbu email bilan kirgan zahoti Yaratuvchi bo'ladi"}
                      </div>
                    </div>

                    {!isOwner && (
                      <button
                        onClick={() => handleRemoveCreatorEmail(email)}
                        className="py-1.5 px-3 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/60 text-xs font-medium text-rose-300 transition-colors"
                      >
                        Huquqni olish
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REGISTERED USERS TABLE */}
      {activeSection === 'users' && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              Hozircha hech kim ro'yxatdan o'tmagan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                    <th className="py-3.5 px-4 font-medium">Foydalanuvchi</th>
                    <th className="py-3.5 px-4 font-medium">Email</th>
                    <th className="py-3.5 px-4 font-medium">Roli</th>
                    <th className="py-3.5 px-4 font-medium">Ball / Yechgan</th>
                    <th className="py-3.5 px-4 font-medium text-right">Boshqaruv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {users.map((u) => {
                    const isOwner = u.email.toLowerCase() === ADMIN_EMAIL;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {isOwner ? (
                            <span className="text-emerald-400 font-semibold">Bosh Admin</span>
                          ) : u.role === 'creator' ? (
                            <span className="text-sky-400 font-semibold">Test Yaratuvchi</span>
                          ) : (
                            <span className="text-slate-400">Ishtirokchi</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-300">
                          {u.totalScore} ball · {u.solvedCount} ta test
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {!isOwner && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleUserRole(u)}
                                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                              >
                                {u.role === 'creator'
                                  ? 'Yaratuvchilikni olish'
                                  : '+ Test Yaratuvchi qilish'}
                              </button>
                              <button
                                onClick={() => handleToggleBanUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-300"
                                title={u.isBanned ? 'Blokdan ochish' : 'Bloklash'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300"
                                title="O'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ALL TESTS MANAGEMENT */}
      {activeSection === 'tests' && (
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          {tests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="text-sm text-slate-400">
                Platformada hozircha birorta ham test yo'q.
              </div>
              <button
                onClick={onOpenCreateTest}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Birinchi testni yaratish
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                    <th className="py-3.5 px-4 font-medium">ID</th>
                    <th className="py-3.5 px-4 font-medium">Test nomi</th>
                    <th className="py-3.5 px-4 font-medium">Fan</th>
                    <th className="py-3.5 px-4 font-medium">Savollar / Vaqt / Ball</th>
                    <th className="py-3.5 px-4 font-medium">Yaratuvchi</th>
                    <th className="py-3.5 px-4 font-medium text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {tests.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono text-xs text-emerald-400">
                        #{t.id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {t.title}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-300">
                        {t.questions.length} savol · {t.durationMinutes} daq · {t.totalPoints} ball
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {t.authorName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTest(t.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300"
                          title="Testni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: CONTESTS / OLYMPIADS MANAGEMENT */}
      {activeSection === 'contests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-white">
              Yangi Olimpiada / Musobaqa yaratish
            </h2>
            <form onSubmit={handleCreateContest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Olimpiada nomi *
                </label>
                <input
                  type="text"
                  required
                  value={contestTitle}
                  onChange={(e) => setContestTitle(e.target.value)}
                  placeholder="Masalan: KITEST Matematika Olimpiadasi"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Yo'nalish
                  </label>
                  <input
                    type="text"
                    value={contestSubject}
                    onChange={(e) => setContestSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vaqt (daqiqa)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={contestDuration}
                    onChange={(e) => setContestDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tavsif
                </label>
                <textarea
                  rows={2}
                  value={contestDescription}
                  onChange={(e) => setContestDescription(e.target.value)}
                  placeholder="Musobaqa shartlari..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              {tests.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Olimpiadaga biriktiriladigan testlar:
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {tests.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTestIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestIds([...selectedTestIds, t.id]);
                            } else {
                              setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id));
                            }
                          }}
                        />
                        <span>
                          #{t.id} - {t.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Olimpiadani e'lon qilish
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h2 className="text-base font-semibold text-white">
              Mavjud Olimpiadalar ({contests.length})
            </h2>
            {contests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Hozircha olimpiadalar e'lon qilinmagan.
              </div>
            ) : (
              <div className="space-y-3">
                {contests.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{c.title}</div>
                      <div className="text-xs text-slate-400">
                        {c.subject} · {c.durationMinutes} daqiqa ·{' '}
                        {c.registeredUserIds.length} ishtirokchi
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteContest(c.id)}
                      className="p-2 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
