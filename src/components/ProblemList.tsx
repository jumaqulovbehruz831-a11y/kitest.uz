import React, { useState } from 'react';
import { TestItem, User, Submission, ADMIN_EMAIL } from '../types';
import {
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ProblemListProps {
  tests: TestItem[];
  submissions: Submission[];
  currentUser: User | null;
  onSelectTest: (test: TestItem) => void;
  onOpenCreateTest: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  tests,
  submissions,
  currentUser,
  onSelectTest,
  onOpenCreateTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const isCreatorOrAdmin =
    Boolean(currentUser) &&
    (currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL ||
      currentUser!.role === 'creator' ||
      currentUser!.role === 'admin');

  const solvedTestIds = new Set(
    submissions
      .filter((s) => currentUser && s.userId === currentUser.id && s.verdict === 'Accepted')
      .map((s) => s.testId)
  );

  const uniqueSubjects = Array.from(new Set(tests.map((t) => t.subject)));

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.includes(searchQuery) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' || t.subject === selectedSubject;
    const matchesDiff =
      selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
    return matchesSearch && matchesSubject && matchesDiff;
  });

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CHSB va Olimpiada Testlar Arxivi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Jami nashr qilingan testlar: {tests.length} ta
          </p>
        </div>

        {isCreatorOrAdmin && (
          <button
            onClick={onOpenCreateTest}
            className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yangi Test Yaratish (Telegram Quiz)</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Test raqami (#0001) yoki nomi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Barcha fanlar</option>
            {uniqueSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Barcha qiyinliklar</option>
            <option value="Oson">Oson</option>
            <option value="O'rta">O'rta</option>
            <option value="Qiyin">Qiyin</option>
            <option value="Olimpiada">Olimpiada</option>
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        {filteredTests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-medium text-slate-300">
              {tests.length === 0
                ? 'Hozircha platformada birorta ham test yaratilmagan.'
                : 'Qidiruv bo‘yicha test topilmadi.'}
            </div>
            {tests.length === 0 && isCreatorOrAdmin && (
              <button
                onClick={onOpenCreateTest}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Birinchi testni yaratish</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4 font-medium">ID</th>
                  <th className="py-3.5 px-4 font-medium">Test sarlavhasi</th>
                  <th className="py-3.5 px-4 font-medium">Fan / Yo'nalish</th>
                  <th className="py-3.5 px-4 font-medium">Qiyinlik</th>
                  <th className="py-3.5 px-4 font-medium">Savollar / Vaqt</th>
                  <th className="py-3.5 px-4 font-medium">Qabul %</th>
                  <th className="py-3.5 px-4 font-medium text-right">CHSB Imtihon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredTests.map((t) => {
                  const isSolved = solvedTestIds.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTest(t)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 font-mono text-xs text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          {isSolved && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                          #{t.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{t.title}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Tuzuvchi: {t.authorName} · Max: {t.totalPoints} ball
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {t.subject}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {t.difficulty}
                      </td>
                      <td className="py-4 px-4 font-mono tabular-nums text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {t.questions.length} savol · {t.durationMinutes} daq
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono tabular-nums text-xs text-slate-300">
                        {t.acceptanceRate}% ({t.passedAttempts}/{t.totalAttempts})
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTest(t);
                          }}
                          className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>Topshirish</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
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
