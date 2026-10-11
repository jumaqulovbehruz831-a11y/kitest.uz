import React, { useState } from 'react';
import { Submission, User, CertificateData } from '../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  AlertTriangle,
  Award,
  Zap,
  Trophy,
  Search,
} from 'lucide-react';

interface SubmissionsViewProps {
  submissions: Submission[];
  currentUser: User | null;
  onSelectTestId: (testId: string) => void;
  onOpenCertificate?: (cert: CertificateData) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  currentUser,
  onSelectTestId,
  onOpenCertificate,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'certificates'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('Barchasi');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const subjects = [
    'Barchasi',
    ...Array.from(new Set(submissions.map((s) => s.subject))),
  ];

  const isPerfectSubmission = (sub: Submission) =>
    sub.percentage === 100 ||
    (sub.totalQuestions > 0 && sub.correctCount === sub.totalQuestions);

  const filtered = submissions.filter((s) => {
    if (filterMode === 'mine' && currentUser && s.userId !== currentUser.id) {
      return false;
    }
    if (filterMode === 'certificates' && !isPerfectSubmission(s)) {
      return false;
    }
    if (subjectFilter !== 'Barchasi' && s.subject !== subjectFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser =
        s.userName.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q);
      const matchTest =
        s.testTitle.toLowerCase().includes(q) ||
        String(s.testId).includes(q);
      if (!matchUser && !matchTest) return false;
    }
    return true;
  });

  const perfectCount = submissions.filter(isPerfectSubmission).length;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}d ${rem}s`;
  };

  const openCertFromSubmission = (sub: Submission) => {
    if (!onOpenCertificate) return;
    onOpenCertificate({
      serialNumber: `KT-${sub.id.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`,
      recipientName: sub.userName,
      recipientUsername: sub.username,
      testId: sub.testId,
      testTitle: sub.testTitle,
      subject: sub.subject,
      earnedPoints: sub.earnedPoints,
      maxPoints: sub.maxPoints,
      percentage: 100,
      grade: sub.grade || "5 (A'lo)",
      issuedAt: sub.submittedAt,
      acquiredVia: 'perfect_100',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-sky-400 mb-1">
            <span>JONLI CHSB BAYONNOMALARI VA SERTIFIKATLAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Barcha Yechilgan Test Natijalari
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            100% natija qayd etgan ishtirokchilarning rasmiy KITEST sertifikatlarini ko'rish va yuklab olish mumkin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ism yoki test qidirish..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {currentUser && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Barcha ({submissions.length})
              </button>
              <button
                onClick={() => setFilterMode('mine')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filterMode === 'mine'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mening natijalarim
              </button>
              <button
                onClick={() => setFilterMode('certificates')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                  filterMode === 'certificates'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-amber-300 hover:text-amber-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>100% Sertifikatlar ({perfectCount})</span>
              </button>
            </div>
          )}

          {!currentUser && (
            <button
              onClick={() =>
                setFilterMode(filterMode === 'certificates' ? 'all' : 'certificates')
              }
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                filterMode === 'certificates'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>🎓 100% Sertifikatlar ({perfectCount})</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              {subjects.map((subj) => (
                <option key={subj} value={subj} className="bg-slate-900 text-white">
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Ishtirokchi</th>
                <th className="py-3.5 px-4">Test Nomi</th>
                <th className="py-3.5 px-4">✅ To'g'ri / ❌ Xato</th>
                <th className="py-3.5 px-4">⚡ Ball & Baho</th>
                <th className="py-3.5 px-4">🎓 Sertifikat</th>
                <th className="py-3.5 px-4 text-right">Vaqt / Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Hozircha test natijalari topilmadi.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const isPerfect = isPerfectSubmission(sub);
                  const isGood = sub.percentage >= 70;
                  const wrongAndBlank = sub.wrongCount + sub.unansweredCount;

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isPerfect ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {sub.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{sub.userName}</span>
                          {isPerfect && (
                            <span
                              title="100% Oltin Sertifikat So'hibi"
                              className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold"
                            >
                              🎓 100%
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          @{sub.username}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => onSelectTestId(sub.testId)}
                          className="font-semibold text-sky-400 hover:underline text-left"
                        >
                          #{sub.testId}. {sub.testTitle}
                        </button>
                        <div className="text-xs text-slate-400">{sub.subject}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {sub.correctCount} to'g'ri
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            {wrongAndBlank} xato
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 font-mono font-bold text-amber-300 text-xs tabular-nums">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            +{sub.earnedPoints} / {sub.maxPoints} ball
                          </span>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              isPerfect
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isGood
                                ? 'bg-emerald-950/60 text-emerald-400'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {sub.percentage}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-sky-400" />
                          <span>{sub.grade}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isPerfect && onOpenCertificate ? (
                          <button
                            onClick={() => openCertFromSubmission(sub)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>🎓 Sertifikat</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">
                            — ({sub.percentage}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs text-slate-400 font-mono tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDuration(sub.timeSpentSeconds)}
                          </span>
                          {sub.warningsCount > 0 && (
                            <span
                              title="Ogohlantirish qayd etilgan"
                              className="inline-flex items-center gap-0.5 text-amber-400"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {sub.warningsCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(sub.submittedAt).toLocaleString('uz-UZ', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
