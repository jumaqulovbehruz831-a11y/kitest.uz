import React, { useState, useEffect } from 'react';
import { TestItem, User, Submission, ADMIN_EMAIL } from '../types';
import { AnimatedWords } from './KitestEmblem';
import {
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  ClipboardCheck,
  Trophy,
  Filter,
  Download,
  Shuffle,
  BookOpen,
} from 'lucide-react';

interface ProblemListProps {
  tests: TestItem[];
  submissions: Submission[];
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  mode?: 'problems' | 'tests_list';
  externalSearchQuery?: string;
  onSelectTest: (test: TestItem) => void;
  onOpenCreateTest: () => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({
  tests,
  submissions,
  currentUser,
  isAdminUnlocked = false,
  mode = 'problems',
  externalSearchQuery = '',
  onSelectTest,
  onOpenCreateTest,
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'unsolved'>('all');

  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  // Allow all users to create tests and AI questions
  const isCreatorOrAdmin = true;

  const solvedTestIds = new Set(
    submissions
      .filter((s) => currentUser && s.userId === currentUser.id)
      .map((s) => s.testId)
  );

  const uniqueSubjects = Array.from(new Set(tests.map((t) => t.subject)));

  const getDifficultyPercent = (diff: string) => {
    if (diff === 'Oson') return 15;
    if (diff === "O'rta") return 40;
    if (diff === 'Qiyin') return 70;
    return 95;
  };

  // RoboContest Feature 1: Masalalar Kitobini Yuklab Olish
  const handleDownloadProblemBook = () => {
    const lines: string[] = [
      '====================================================================',
      '        KITEST.UZ — RASMIY MASALALAR VA TESTLAR KITOBI              ',
      `        Jami masalalar soni: ${tests.length} ta | Sana: ${new Date().toLocaleDateString('uz-UZ')}`,
      '====================================================================',
      '',
    ];

    tests.forEach((t, idx) => {
      lines.push(
        `${idx + 1}. [#${t.id}] ${t.title} (${t.subject} · Qiyinlik: ${t.difficulty} / ${getDifficultyPercent(
          t.difficulty
        )}% · +${t.totalPoints} ball)`
      );
      if (t.description) {
        lines.push(`   Tavsif: ${t.description}`);
      }
      t.questions.forEach((q, qIdx) => {
        lines.push(`   Savol ${qIdx + 1}: ${q.text}`);
        q.options.forEach((opt, oIdx) => {
          lines.push(`      ${String.fromCharCode(65 + oIdx)}) ${opt}`);
        });
      });
      lines.push('--------------------------------------------------------------------');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KITEST_Masalalar_Kitobi.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // RoboContest Feature 2: Tasodifiy Masala Tanlash
  const handlePickRandomProblem = () => {
    if (tests.length === 0) return;
    const unsolved = tests.filter((t) => !solvedTestIds.has(t.id));
    const pool = unsolved.length > 0 ? unsolved : tests;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (picked) {
      onSelectTest(picked);
    }
  };

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.includes(searchQuery) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === 'all' || t.subject === selectedSubject;
    const matchesDiff =
      selectedDifficulty === 'all' || t.difficulty === selectedDifficulty;
    const isSolved = solvedTestIds.has(t.id);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'solved' && isSolved) ||
      (statusFilter === 'unsolved' && !isSolved);

    return matchesSearch && matchesSubject && matchesDiff && matchesStatus;
  });

  const isTestsView = mode === 'tests_list';

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
            {isTestsView ? (
              <>
                <ClipboardCheck className="w-4 h-4 text-indigo-400" />
                <span>MASHQ BO'LIMI · FAN TESTLARI VA CHSB IMTIHONLARI</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-sky-400" />
                <span>MASHQ BO'LIMI · MASALALAR ARXIVI VA KITOBI</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text={
                isTestsView
                  ? 'KITEST Fan Testlari va CHSB Sinovlari'
                  : 'KITEST Masalalar va Olimpiada Topshiriqlari'
              }
              variant="accent"
              continuousWave={true}
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Jami mavjud: <strong className="text-white">{tests.length} ta</strong> · Siz yechganlar:{' '}
            <strong className="text-emerald-400">{solvedTestIds.size} ta</strong>
          </p>
        </div>

        {/* RoboContest Action Toolbar: Masalalar Kitobi + Tasodifiy Masala + Create */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadProblemBook}
            className="py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-2 transition-all"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Masalalar Kitobini Yuklab Olish</span>
            <Download className="w-3.5 h-3.5" />
          </button>

          {tests.length > 0 && (
            <button
              type="button"
              onClick={handlePickRandomProblem}
              className="py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 text-xs font-extrabold flex items-center gap-2 transition-all"
            >
              <Shuffle className="w-4 h-4 text-purple-400" />
              <span>Tasodifiy Masala</span>
            </button>
          )}

          {isCreatorOrAdmin && (
            <button
              type="button"
              onClick={onOpenCreateTest}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Yangi Qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Pills + Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Holati:</span>
            </span>
            {[
              { id: 'all', label: `Barchasi (${tests.length})` },
              { id: 'solved', label: `Yechilgan (${solvedTestIds.size})` },
              {
                id: 'unsolved',
                label: `Yechilmagan (${Math.max(0, tests.length - solvedTestIds.size)})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-sky-600 text-white shadow'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Natijalar: <strong className="text-sky-400">{filteredTests.length}</strong> ta
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Raqami (#0001), nomi yoki turkumi bo'yicha qidirish..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Barcha turkumlar / fanlar</option>
              {uniqueSubjects.filter(Boolean).map((sub, idx) => (
                <option key={`prob_sub_${sub}_${idx}`} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
            >
              <option value="all">Barcha murakkablik darajalari</option>
              <option value="Oson">Beginner · Oson (15%)</option>
              <option value="O'rta">Mutaxassis · O'rta (40%)</option>
              <option value="Qiyin">Ekspert · Qiyin (70%)</option>
              <option value="Olimpiada">Grossmeyster · Olimpiada (95%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 📐 1-Chizma: Test oynasi interfeysi ("Testlar bo'limida testlar joylashuvi uzun-choq emas") */}
      <div>
        {filteredTests.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
            <div className="text-sm font-bold text-slate-200">
              {tests.length === 0
                ? 'Hozircha platformada test yoki masala yaratilmagan.'
                : 'Tanlangan filtr bo‘yicha natija topilmadi.'}
            </div>
            {isCreatorOrAdmin && (
              <button
                type="button"
                onClick={onOpenCreateTest}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Yangi Test / Masala Yaratish</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTests.map((t, tIdx) => {
              const isSolved = solvedTestIds.has(t.id);
              const diffPercent = getDifficultyPercent(t.difficulty);
              const firstQ = t.questions[0];
              const hasImages = t.questions.some((q) => Boolean(q.imageUrl));

              return (
                <div
                  key={`prob_test_${t.id}_${tIdx}`}
                  onClick={() => onSelectTest(t)}
                  className="rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-sky-500/70 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                >
                  {/* 📋 CHSB TEPADAGI MA'LUMOTLAR PANELI (Top Metadata Header) */}
                  <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/70 space-y-3">
                    {/* Top Row: Subject Badge + CHSB Level + Difficulty */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 font-mono text-xs font-black text-sky-300 flex items-center gap-1">
                          {isSolved && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>#{t.id}</span>
                          <span className="text-slate-500">·</span>
                          <span>{t.subject}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
                          CHSB Standart
                        </span>

                        {hasImages && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1">
                            <span>📸 Rasmli</span>
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] shrink-0 ${
                          t.difficulty === 'Oson'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : t.difficulty === "O'rta"
                            ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                            : t.difficulty === 'Qiyin'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {t.difficulty} ({diffPercent}%)
                      </span>
                    </div>

                    {/* CHSB Ma'lumotlar To'rtburchak Qutisi (4 ustunli rasmiy parametrlar) */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800/80 text-center text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">Savollar</span>
                        <span className="font-bold font-mono text-white text-xs sm:text-sm">
                          {t.questions.length} ta
                        </span>
                      </div>
                      <div className="space-y-0.5 border-x border-slate-800">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">Vaqt</span>
                        <span className="font-bold font-mono text-sky-300 text-xs sm:text-sm">
                          {t.durationMinutes} daq
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">Maksimal Ball</span>
                        <span className="font-bold font-mono text-amber-400 text-xs sm:text-sm">
                          +{t.totalPoints} ball
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 📝 CHSB TEST MARKAZI (Test Nomi & Tavsifi) */}
                  <div className="p-4 sm:p-5 flex-1 space-y-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                      {t.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {firstQ
                        ? `1-savol: ${firstQ.text}`
                        : t.description || 'CHSB nazorat ishi va imtihon sinov testi.'}
                    </p>

                    {/* Muallif va O'tish Bali */}
                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Tuzuvchi: <strong className="text-slate-300">{t.authorName || 'KITEST'}</strong></span>
                      <span className="text-emerald-400 font-bold">O'tish: {t.passingPercent || 60}%</span>
                    </div>
                  </div>

                  {/* 🟢 CHSB PASTIDAGI "YECHISH" TUGMASI (Prominent Bottom Button) */}
                  <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTest(t);
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                        isSolved
                          ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-slate-900/50'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 shadow-emerald-600/25 active:scale-[0.99]'
                      }`}
                    >
                      {isSolved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Qayta Ko‘rish / Yechish</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">✍️</span>
                          <span>Yechish</span>
                          <ArrowRight className="w-4 h-4 text-emerald-200" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
