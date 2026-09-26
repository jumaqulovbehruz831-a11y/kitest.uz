import React, { useState } from 'react';
import { Contest, TestItem, User, Submission, ADMIN_EMAIL } from '../types';
import {
  Trophy,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';

interface ContestViewProps {
  contests: Contest[];
  tests: TestItem[];
  submissions: Submission[];
  currentUser: User | null;
  onSelectTest: (test: TestItem) => void;
  onRequireLogin: () => void;
  onRefreshState: () => void;
}

export const ContestView: React.FC<ContestViewProps> = ({
  contests,
  tests,
  submissions,
  currentUser,
  onSelectTest,
  onRequireLogin,
  onRefreshState,
}) => {
  const [selectedContestId, setSelectedContestId] = useState<string | null>(
    contests[0]?.id || null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Informatika va Algoritmlar');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [description, setDescription] = useState('');
  const [pickedTestIds, setPickedTestIds] = useState<string[]>([]);

  const isCreatorOrAdmin =
    Boolean(currentUser) &&
    (currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL ||
      currentUser!.role === 'creator' ||
      currentUser!.role === 'admin');

  const handleRegisterContest = async (contestId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        onRefreshState();
      }
    } catch {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;
    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email,
        },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          durationMinutes,
          description: description.trim(),
          testIds: pickedTestIds,
        }),
      });
      if (res.ok) {
        setTitle('');
        setDescription('');
        setPickedTestIds([]);
        setShowCreateForm(false);
        onRefreshState();
      }
    } catch {}
  };

  const activeContest =
    contests.find((c) => c.id === selectedContestId) || contests[0] || null;

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Olimpiadalar va Musobaqalar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rasmiy musobaqalarda qatnashing va CHSB testlarini belgilangan vaqtda yeching
          </p>
        </div>

        {isCreatorOrAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showCreateForm ? 'Yopish' : "Olimpiada e'lon qilish"}</span>
          </button>
        )}
      </div>

      {showCreateForm && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreateContest}
          className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4"
        >
          <h2 className="text-base font-semibold text-white">
            Yangi Olimpiada / CHSB Musobaqasi yaratish
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Olimpiada nomi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Informatika va Matematika Respublika Olimpiadasi"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Davomiyligi (daqiqa)
              </label>
              <input
                type="number"
                min={10}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white font-mono tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Olimpiada tavsifi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ishtirokchilar uchun qoidalar..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          {tests.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Olimpiadaga kiritiladigan testlarni belgilang:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 max-h-40 overflow-y-auto">
                {tests.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={pickedTestIds.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPickedTestIds([...pickedTestIds, t.id]);
                        } else {
                          setPickedTestIds(pickedTestIds.filter((id) => id !== t.id));
                        }
                      }}
                    />
                    <span>
                      #{t.id} - {t.title} ({t.questions.length} savol)
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="py-2 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
            >
              Saqlash va E'lon qilish
            </button>
          </div>
        </form>
      )}

      {contests.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
          <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-medium text-slate-300">
            Hozircha olimpiadalar e'lon qilinmagan
          </div>
          <p className="text-xs text-slate-400">
            Yaratuvchilar yoki Bosh Admin tomonidan olimpiada e'lon qilinganda shu yerda ko'rinadi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Contests List */}
          <div className="lg:col-span-5 space-y-3">
            {contests.map((c) => {
              const isSelected = activeContest?.id === c.id;
              const isRegistered =
                Boolean(currentUser) && c.registeredUserIds.includes(currentUser!.id);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContestId(c.id)}
                  className={`p-5 rounded-xl border cursor-pointer transition-colors space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/60'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{c.subject}</span>
                    <span className="font-mono tabular-nums flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {c.durationMinutes} daqiqa
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{c.title}</h3>

                  {c.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {c.description}
                    </p>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5" />
                      {c.registeredUserIds.length} ishtirokchi
                    </span>

                    {isRegistered ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ro'yxatdan o'tilgan
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegisterContest(c.id);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                      >
                        Qatnashish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 7 Cols: Selected Contest Details & Tests */}
          {activeContest && (
            <div className="lg:col-span-7 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs text-emerald-400 font-mono mb-1">
                  OLIMPIADA TOPSHIRIQLARI · TUZUVCHI: {activeContest.authorName}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {activeContest.title}
                </h2>
                {activeContest.description && (
                  <p className="text-xs text-slate-300 mt-2">
                    {activeContest.description}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Olimpiada testlari ({activeContest.testIds.length} ta)
                </h3>

                {activeContest.testIds.length === 0 ? (
                  <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
                    Ushbu olimpiadaga hozircha alohida test biriktirilmagan. Umumiy Testlar arxividan foydalanishingiz mumkin.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeContest.testIds.map((tid) => {
                      const foundTest = tests.find((t) => t.id === tid);
                      if (!foundTest) return null;
                      return (
                        <div
                          key={foundTest.id}
                          onClick={() => onSelectTest(foundTest)}
                          className="p-4 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 cursor-pointer flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">
                              <span className="font-mono text-emerald-400 mr-2">
                                #{foundTest.id}
                              </span>
                              {foundTest.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                              {foundTest.questions.length} savol · {foundTest.durationMinutes} daqiqa ·{' '}
                              {foundTest.totalPoints} ball
                            </div>
                          </div>

                          <button className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>Boshlash</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
