import React, { useState } from 'react';
import { Submission, User } from '../types';
import { CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';

interface SubmissionsViewProps {
  submissions: Submission[];
  currentUser: User | null;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  submissions,
  currentUser,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

  const displayedSubmissions = submissions.filter((s) => {
    if (filterMode === 'mine' && currentUser) {
      return s.userId === currentUser.id;
    }
    return true;
  });

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins} daq ${secs} s`;
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CHSB Imtihon Urinishlari (Submissions)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real vaqt rejimida topshirilgan testlar va CHSB baholash natijalari
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilterMode('all')}
              className={`py-1.5 px-3.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Barcha urinishlar ({submissions.length})
            </button>
            <button
              onClick={() => setFilterMode('mine')}
              className={`py-1.5 px-3.5 rounded-md text-xs font-medium transition-colors ${
                filterMode === 'mine'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mening natijalarim
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        {displayedSubmissions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Hozircha birorta ham test topshirilmagan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4 font-medium">Vaqt</th>
                  <th className="py-3.5 px-4 font-medium">Ishtirokchi</th>
                  <th className="py-3.5 px-4 font-medium">Test</th>
                  <th className="py-3.5 px-4 font-medium">Holat (Verdict)</th>
                  <th className="py-3.5 px-4 font-medium">Ball / Foiz</th>
                  <th className="py-3.5 px-4 font-medium">CHSB Baho</th>
                  <th className="py-3.5 px-4 font-medium text-right">Sarflangan vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {displayedSubmissions.map((sub) => {
                  const isAccepted = sub.verdict === 'Accepted';
                  const isDisqualified = sub.verdict === 'Disqualified';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-400">
                        {new Date(sub.submittedAt).toLocaleString('uz-UZ', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{sub.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">@{sub.username}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">
                          <span className="font-mono text-emerald-400 mr-1.5">
                            #{sub.testId}
                          </span>
                          {sub.testTitle}
                        </div>
                        <div className="text-xs text-slate-400">{sub.subject}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold">
                        {isAccepted ? (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Accepted ({sub.correctCount}/{sub.totalQuestions})</span>
                          </span>
                        ) : isDisqualified ? (
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            <span>Chetlatildi (Anti-Cheat)</span>
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4" />
                            <span>O'tmadi ({sub.correctCount}/{sub.totalQuestions})</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-white">
                        {sub.earnedPoints} / {sub.maxPoints} ({sub.percentage}%)
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-xs font-semibold text-sky-400">
                        {sub.grade}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(sub.timeSpentSeconds)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
