import React, { useState, useEffect, useMemo } from 'react';
import { Contest, TestItem, User, Submission, ADMIN_EMAIL } from '../types';
import {
  Trophy,
  Clock,
  Users,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  Play,
  ListChecks,
  BarChart3,
  Timer,
} from 'lucide-react';

interface ContestViewProps {
  contests: Contest[];
  tests: TestItem[];
  submissions: Submission[];
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  adminPasscode?: string;
  onSelectTest: (test: TestItem) => void;
  onRequireLogin: () => void;
  onRefreshState: () => void;
}

export const ContestView: React.FC<ContestViewProps> = ({
  contests,
  tests,
  submissions,
  currentUser,
  isAdminUnlocked = false,
  adminPasscode = '',
  onSelectTest,
  onRequireLogin,
  onRefreshState,
}) => {
  const [selectedContestId, setSelectedContestId] = useState<string | null>(
    contests[0]?.id || null
  );
  const [contestTab, setContestTab] = useState<'problems' | 'standings' | 'virtual'>(
    'problems'
  );
  const [virtualActive, setVirtualActive] = useState(false);
  const [virtualSecondsLeft, setVirtualSecondsLeft] = useState(0);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Umumiy fanlar');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [pickedTestIds, setPickedTestIds] = useState<string[]>([]);

  const isCreatorOrAdmin =
    Boolean(isAdminUnlocked) ||
    (Boolean(currentUser) &&
      (currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL ||
        currentUser!.role === 'creator' ||
        currentUser!.role === 'admin'));

  const activeContest =
    contests.find((c) => c.id === selectedContestId) || contests[0] || null;

  useEffect(() => {
    if (!virtualActive) return;
    if (virtualSecondsLeft <= 0) {
      setVirtualActive(false);
      return;
    }
    const timer = setInterval(() => {
      setVirtualSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [virtualActive, virtualSecondsLeft]);

  const handleStartVirtualContest = () => {
    if (!activeContest) return;
    setVirtualSecondsLeft((activeContest.durationMinutes || 60) * 60);
    setVirtualActive(true);
    setContestTab('problems');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleRegisterContest = async (contestId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      await fetch(`/api/contests/${contestId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      onRefreshState();
    } catch {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreatorOrAdmin || !title.trim()) return;

    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPasscode ? { 'x-admin-passcode': adminPasscode } : {}),
        },
        body: JSON.stringify({
          authorEmail: currentUser?.email || ADMIN_EMAIL,
          authorName: currentUser?.name || 'Bosh Admin',
          adminPasscode,
          title: title.trim(),
          description: description.trim(),
          subject,
          durationMinutes,
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

  // Build RoboContest / ICPC Standings Table for activeContest
  const contestTests = useMemo(() => {
    if (!activeContest) return tests;
    const found = activeContest.testIds
      .map((tid) => tests.find((t) => t.id === tid))
      .filter(Boolean) as TestItem[];
    return found.length > 0 ? found : tests.slice(0, 5);
  }, [activeContest, tests]);

  const icpcStandings = useMemo(() => {
    const map = new Map<
      string,
      {
        userId: string;
        userName: string;
        totalPoints: number;
        solvedByLetter: Record<string, number>;
      }
    >();

    submissions.forEach((sub) => {
      const tIdx = contestTests.findIndex((t) => t.id === sub.testId);
      if (tIdx === -1) return;
      const letter = String.fromCharCode(65 + tIdx);
      const curr = map.get(sub.userId) || {
        userId: sub.userId,
        userName: sub.userName || 'Ishtirokchi',
        totalPoints: 0,
        solvedByLetter: {},
      };
      const earned = sub.earnedPoints || sub.score || (sub.verdict === 'Accepted' ? 20 : 0);
      const prevBest = curr.solvedByLetter[letter] || 0;
      if (earned > prevBest) {
        curr.totalPoints += earned - prevBest;
        curr.solvedByLetter[letter] = earned;
      }
      map.set(sub.userId, curr);
    });

    return Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [submissions, contestTests]);

  return (
    <div className="max-w-[1360px] mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-1">
            ROBOCONTEST OLIMPIADA TIZIMI · ICPC STANDINGS VA VIRTUAL MUSOBAQA
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Olimpiadalar, Turnir Jadvali (A, B, C, D) va Virtual Qatnashish
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rasmiy olimpiadalarda qatnashing, ICPC jadvalida natijalarni kuzating yoki Virtual Olimpiada rejimida o‘z vaqtingizda yeching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {virtualActive && (
            <div className="px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/50 text-rose-300 font-mono text-xs font-extrabold flex items-center gap-2">
              <Timer className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Virtual Taymer: {formatTimer(virtualSecondsLeft)}</span>
            </div>
          )}

          {isCreatorOrAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showCreateForm ? 'Yopish' : "Olimpiada e'lon qilish"}</span>
            </button>
          )}
        </div>
      </div>

      {showCreateForm && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreateContest}
          className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
        >
          <h2 className="text-base font-extrabold text-white">
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
                placeholder="Masalan: KITEST Respublika Algoritm va Matematika Olimpiadasi"
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
                Olimpiadaga kiritiladigan masalalar (A, B, C, D...):
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
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
          <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-medium text-slate-300">
            Hozircha olimpiadalar e'lon qilinmagan
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 4 Cols: Contests List */}
          <div className="lg:col-span-4 space-y-3">
            {contests.map((c) => {
              const isSelected = activeContest?.id === c.id;
              const isRegistered =
                Boolean(currentUser) && c.registeredUserIds.includes(currentUser!.id);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContestId(c.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-colors space-y-3 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60 shadow-lg'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-bold text-amber-300">{c.subject}</span>
                    <span className="font-mono tabular-nums flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {c.durationMinutes} daqiqa
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-white">{c.title}</h3>

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

          {/* Right 8 Cols: RoboContest Contest Workspace (Topshiriqlar | Turnir Jadvali | Virtual Olimpiada) */}
          {activeContest && (
            <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs text-emerald-400 font-mono mb-1">
                    OLIMPIADA MARKAZI · {activeContest.authorName || 'KITEST Hakamlar Hayʼati'}
                  </div>
                  <h2 className="text-xl font-black text-white">
                    {activeContest.title}
                  </h2>
                </div>

                {/* RoboContest 3 Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setContestTab('problems')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 ${
                      contestTab === 'problems'
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Masalalar (A, B, C...)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContestTab('standings')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 ${
                      contestTab === 'standings'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Turnir Jadvali</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContestTab('virtual')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center gap-1.5 ${
                      contestTab === 'virtual'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Virtual Olimpiada</span>
                  </button>
                </div>
              </div>

              {contestTab === 'problems' && (
                <div className="space-y-2.5">
                  {contestTests.map((foundTest, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={foundTest.id}
                        onClick={() => onSelectTest(foundTest)}
                        className="p-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 cursor-pointer flex items-center justify-between gap-4 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono font-black text-sm flex items-center justify-center shrink-0">
                            {letter}
                          </span>
                          <div>
                            <div className="text-sm font-extrabold text-white">
                              {foundTest.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">
                              #{foundTest.id} · {foundTest.questions.length} savol · Maksimal:{' '}
                              <span className="text-amber-300">+{foundTest.totalPoints} ball</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTest(foundTest);
                          }}
                          className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shrink-0"
                        >
                          <span>Yechish</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {contestTab === 'standings' && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-mono">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Ishtirokchi</th>
                        <th className="py-3 px-3 text-right">Jami Ball</th>
                        {contestTests.map((t, idx) => (
                          <th key={t.id} className="py-3 px-3 text-center">
                            {String.fromCharCode(65 + idx)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {icpcStandings.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3 + contestTests.length}
                            className="py-8 text-center text-slate-400"
                          >
                            Hali ushbu olimpiada masalalari bo‘yicha urinishlar yuborilmagan. Birinchi bo‘lib yeching!
                          </td>
                        </tr>
                      ) : (
                        icpcStandings.map((row, rIdx) => (
                          <tr key={row.userId} className="hover:bg-slate-900/60">
                            <td className="py-3 px-3 font-mono font-bold text-slate-300">
                              #{rIdx + 1}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-white">
                              {row.userName}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-black text-amber-400">
                              {row.totalPoints}
                            </td>
                            {contestTests.map((t, idx) => {
                              const letter = String.fromCharCode(65 + idx);
                              const pts = row.solvedByLetter[letter];
                              return (
                                <td key={t.id} className="py-3 px-3 text-center font-mono">
                                  {pts ? (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                                      +{pts}
                                    </span>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {contestTab === 'virtual' && (
                <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/40 text-center space-y-4">
                  <Timer className="w-10 h-10 text-purple-400 mx-auto" />
                  <h3 className="text-lg font-black text-white">
                    Virtual Olimpiada Rejimi ({activeContest.durationMinutes} daqiqa)
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    RoboContest kabi istalgan olimpiadani o‘zingizga qulay vaqtda shaxsiy taymer bilan boshlang va natijangizni Turnir Jadvalida qayd eting!
                  </p>
                  <button
                    type="button"
                    onClick={handleStartVirtualContest}
                    className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    <span>
                      {virtualActive
                        ? 'Virtual Olimpiada Davom Etmoqda — Masalalarga O‘tish'
                        : 'Virtual Olimpiadani Boshlash'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
