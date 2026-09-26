import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { TestItem, User, Submission, QuizQuestion } from '../types';
import { KitestEmblem, playKitestSound } from './KitestEmblem';
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Lightbulb,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
} from 'lucide-react';

interface ProblemDetailProps {
  test: TestItem;
  currentUser: User | null;
  soundEnabled?: boolean;
  onBack: () => void;
  onRequireLogin: () => void;
  onSubmissionComplete: (
    submission: Submission,
    updatedUser: User,
    updatedTest: TestItem
  ) => void;
}

type ExamStage = 'pre_exam' | 'active_exam' | 'result_protocol';

export const ProblemDetail: React.FC<ProblemDetailProps> = ({
  test,
  currentUser,
  soundEnabled = true,
  onBack,
  onRequireLogin,
  onSubmissionComplete,
}) => {
  const [stage, setStage] = useState<ExamStage>('pre_exam');
  const [examQuestions, setExamQuestions] = useState<QuizQuestion[]>(test.questions);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Map of questionId -> selectedOptionIndex
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});

  // Timer & Submission state
  const [secondsLeft, setSecondsLeft] = useState<number>(test.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultSubmission, setResultSubmission] = useState<Submission | null>(null);
  const [updatedUserScore, setUpdatedUserScore] = useState<number>(
    currentUser?.totalScore || 0
  );

  const startTimeRef = useRef<number>(Date.now());
  const hasSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<Record<string, number>>({});
  const enteredFullscreenRef = useRef<boolean>(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Enter Fullscreen / Zoom Screen & Start Exam
  const handleStartExam = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    playKitestSound('click', soundEnabled);

    const ordered = test.shuffleQuestions
      ? [...test.questions].sort(() => Math.random() - 0.5)
      : [...test.questions];

    setExamQuestions(ordered);
    setCurrentIndex(0);
    setAnswers({});
    answersRef.current = {};
    setFlaggedIds({});
    setSecondsLeft(test.durationMinutes * 60);
    hasSubmittedRef.current = false;
    enteredFullscreenRef.current = false;
    startTimeRef.current = Date.now();
    setStage('active_exam');

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        enteredFullscreenRef.current = true;
      }
    } catch {}
  };

  // Submit exam to backend
  const submitExam = async (
    reason: 'manual' | 'timeout' | 'anticheat' | 'zoom_exit'
  ) => {
    if (hasSubmittedRef.current || !currentUser) return;
    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {}

    const timeSpentSeconds = Math.max(
      1,
      Math.min(
        test.durationMinutes * 60,
        Math.round((Date.now() - startTimeRef.current) / 1000)
      )
    );

    try {
      const res = await fetch(`/api/tests/${test.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          answers: answersRef.current,
          timeSpentSeconds,
          warningsCount: reason === 'zoom_exit' ? 1 : 0,
          submittedReason: reason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.submission) {
        setResultSubmission(data.submission);
        if (data.user) {
          setUpdatedUserScore(data.user.totalScore);
        }
        onSubmissionComplete(data.submission, data.user, data.test);
        setStage('result_protocol');
        playKitestSound('finish', soundEnabled);

        if (data.submission.correctCount > 0) {
          try {
            confetti({
              particleCount: 80,
              spread: 65,
              origin: { y: 0.6 },
            });
          } catch {}
        }
      } else {
        hasSubmittedRef.current = false;
      }
    } catch {
      hasSubmittedRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Countdown Timer Effect
  useEffect(() => {
    if (stage !== 'active_exam') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage]);

  // ZOOM EKRAN MONITOR + KEYBOARD SHORTCUTS
  useEffect(() => {
    if (stage !== 'active_exam') return;

    const handleFullscreenChange = () => {
      if (
        enteredFullscreenRef.current &&
        !document.fullscreenElement &&
        stage === 'active_exam' &&
        !hasSubmittedRef.current
      ) {
        submitExam('zoom_exit');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'active_exam' || hasSubmittedRef.current) return;
      if (e.key === 'Escape') {
        submitExam('zoom_exit');
        return;
      }
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(examQuestions.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else {
        const q = examQuestions[currentIndex];
        if (!q) return;
        const numKey = parseInt(e.key, 10);
        if (numKey >= 1 && numKey <= q.options.length) {
          handleSelectOption(q.id, numKey - 1);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && stage === 'active_exam' && !hasSubmittedRef.current) {
        submitExam('zoom_exit');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stage, currentIndex, examQuestions]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQuestion = examQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = examQuestions.length - answeredCount;
  const progressPercent =
    examQuestions.length > 0
      ? Math.round((answeredCount / examQuestions.length) * 100)
      : 0;

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    playKitestSound('click', soundEnabled);
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: optionIdx };
      answersRef.current = next;
      return next;
    });
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedIds((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Download Official KITEST Certificate / Protocol
  const handleDownloadCertificate = () => {
    if (!resultSubmission) return;
    const content = `====================================================
KITEST.UZ — DUNYO YOSHLAR QO'LIDA!
RASMIY CHSB IMTIHON NATIJA BAYONNOMASI
====================================================
Bayonnoma ID: ${resultSubmission.id}
Sana: ${new Date(resultSubmission.submittedAt).toLocaleString('uz-UZ')}

Ishtirokchi: ${resultSubmission.userName} (@${resultSubmission.username})
Test nomi: #${test.id} - ${test.title}
Fan: ${test.subject}

NATIJALAR:
- To'g'ri javoblar soni: ${resultSubmission.correctCount} ta
- Noto'g'ri / Bo'sh javoblar soni: ${
      resultSubmission.wrongCount + resultSubmission.unansweredCount
    } ta
- Testdan to'plangan ball: ${resultSubmission.earnedPoints} / ${
      resultSubmission.maxPoints
    } ball (${resultSubmission.percentage}%)
- CHSB Baho: ${resultSubmission.grade}
- Foydalanuvchi jami balli: ${updatedUserScore} ball
====================================================
KITEST Rasmiy Tekshiruv Tizimi tomonidan tasdiqlangan.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KITEST_Natija_${test.id}_${resultSubmission.username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // STAGE 1: PRE-EXAM CHSB PASSPORT & ZOOM EKRAN NOTICE
  // ==========================================
  if (stage === 'pre_exam') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8"
      >
        <button
          onClick={onBack}
          className="mb-6 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Testlar ro'yxatiga qaytish</span>
        </button>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">#{test.id}</span>
                <span>·</span>
                <span>{test.subject}</span>
                <span>·</span>
                <span>Tuzuvchi: {test.authorName}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {test.title}
            </h1>

            {test.description && (
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {test.description}
              </p>
            )}
          </div>

          {/* CHSB Exam Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-950/60 border-b border-slate-800">
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-400">Savollar soni</div>
              <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
                {test.questions.length} ta
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-400">Test vaqti</div>
              <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
                {test.durationMinutes} daqiqa
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-400">Umumiy ball</div>
              <div className="mt-1 text-xl font-bold text-emerald-400 font-mono tabular-nums">
                {test.totalPoints} ball
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-400">Imtihon rejimi</div>
              <div className="mt-1 text-sm font-bold text-sky-400 flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4" />
                <span>Zoom Ekran (CHSB)</span>
              </div>
            </div>
          </div>

          {/* Official CHSB Zoom Screen Instructions */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">
                KITEST CHSB Zoom Ekran imtihon qoidalari:
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-emerald-400 font-semibold">01.</span>
                  <span>
                    Testga kirishingiz bilan <strong className="text-white">Zoom Ekran (To'liq ekran)</strong> rejimi ishga tushadi.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rose-400 font-semibold">02.</span>
                  <span>
                    <strong className="text-rose-300">Qat'iy qoida:</strong> Agar Zoom ekrandan chiqsangiz (<code className="font-mono">Esc</code> bossangiz yoki boshqa oynaga o'tsangiz), <strong className="text-white">test shu zahoti avtomatik yakunlanadi</strong>!
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-emerald-400 font-semibold">03.</span>
                  <span>
                    Oxirida <strong className="text-white">to'g'rilar soni</strong> va <strong className="text-white">noto'g'rilar soni</strong> ko'rsatiladi hamda to'plagan balingiz sizning <strong className="text-emerald-400">umumiy foydalanuvchi balingizga qo'shiladi</strong>.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                {currentUser ? (
                  <span>
                    Ishtirokchi: <strong className="text-white">{currentUser.name}</strong> ·{' '}
                    Joriy balingiz:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {currentUser.totalScore} ball
                    </strong>
                  </span>
                ) : (
                  <span className="text-amber-400">
                    Testni boshlash uchun avval tizimga kiring.
                  </span>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartExam}
                className="py-3.5 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Maximize2 className="w-4 h-4" />
                <span>
                  {currentUser
                    ? 'Zoom Ekranda Testni Boshlash'
                    : 'Tizimga kirish va Boshlash'}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // STAGE 2: ACTIVE ZOOM EKRAN (FULLSCREEN OVERLAY)
  // ==========================================
  if (stage === 'active_exam' && currentQuestion) {
    const selectedOption = answers[currentQuestion.id];
    const isFlagged = Boolean(flaggedIds[currentQuestion.id]);
    const isLowTime = secondsLeft <= 120;

    return (
      <div className="fixed inset-0 z-50 bg-[#060a12] text-slate-100 overflow-y-auto flex flex-col">
        {/* Top Locked Zoom Ekran Bar */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {test.title}
                </h2>
                <div className="text-[11px] text-rose-400 font-medium">
                  Zoom Ekran faol — ekrandan chiqilsa test avtomatik tugaydi!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live Countdown Timer */}
              <div
                className={`px-4 py-1.5 rounded-lg border font-mono tabular-nums text-base font-bold flex items-center gap-2 ${
                  isLowTime
                    ? 'bg-rose-950/70 border-rose-600 text-rose-300 animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-emerald-400'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>

              <button
                type="button"
                onClick={() => submitExam('manual')}
                disabled={isSubmitting}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Yakunlanmoqda...' : 'Testni yakunlash'}</span>
              </button>

              <button
                type="button"
                onClick={() => submitExam('zoom_exit')}
                disabled={isSubmitting}
                title="Zoom ekrandan chiqish testni avtomatik yakunlaydi"
                className="py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-xs font-semibold text-rose-200 transition-colors flex items-center gap-1.5"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zoomdan chiqish</span>
              </button>
            </div>
          </div>

          {/* Animated Exam Progress Line */}
          <div className="w-full h-1 bg-slate-950">
            <motion.div
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-sky-400"
            />
          </div>
        </div>

        {/* Main Exam Content inside Zoom Screen */}
        <div className="max-w-[1320px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Active Telegram-Quiz style Question Sheet */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between min-h-[480px]"
              >
                <div className="space-y-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white font-mono tabular-nums">
                        Savol № {currentIndex + 1} / {examQuestions.length}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-mono tabular-nums text-emerald-400 font-bold">
                        +{currentQuestion.points} ball
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFlag(currentQuestion.id)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                        isFlagged
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{isFlagged ? 'Belgilangan' : 'Bayroqcha'}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-base sm:text-lg font-semibold text-white leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.text}
                  </div>

                  {currentQuestion.codeSnippet && (
                    <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto">
                      {currentQuestion.codeSnippet}
                    </pre>
                  )}

                  {/* Answer Options (Telegram Quiz feel) */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((optText, idx) => {
                      const isSelected = selectedOption === idx;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          key={idx}
                          type="button"
                          onClick={() => handleSelectOption(currentQuestion.id, idx)}
                          className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between gap-3.5 ${
                            isSelected
                              ? 'bg-emerald-950/50 border-emerald-500 text-white'
                              : 'bg-slate-950/90 hover:bg-slate-950 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'border-2 border-slate-700 text-slate-400'
                              }`}
                            >
                              {letter}
                            </div>
                            <span className="text-sm sm:text-base leading-snug">
                              {optText}
                            </span>
                          </div>

                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Question Footer Controls */}
                <div className="pt-6 mt-8 border-t border-slate-800 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Oldingi savol</span>
                  </button>

                  {currentIndex < examQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) =>
                          Math.min(examQuestions.length - 1, prev + 1)
                        )
                      }
                      className="py-2.5 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>Keyingi savol</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => submitExam('manual')}
                      disabled={isSubmitting}
                      className="py-2.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      <span>Testni yakunlash va natijani ko'rish</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right 4 Cols: CHSB Question Matrix */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Savollar xaritasi ({answeredCount} / {examQuestions.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Savol raqamini bosib o'tishingiz mumkin
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {examQuestions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = answers[q.id] !== undefined;
                  const isQFlagged = Boolean(flaggedIds[q.id]);

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative h-10 rounded-lg font-mono tabular-nums text-xs font-bold transition-all border ${
                        isCurrent
                          ? 'ring-2 ring-white border-white bg-slate-800 text-white'
                          : isAnswered
                          ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {idx + 1}
                      {isQFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Belgilangan javoblar:</span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-400">
                    {answeredCount} ta
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Belgilanmagan:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-400">
                    {unansweredCount} ta
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => submitExam('manual')}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Hisoblanmoqda...' : 'Testni Hoziroq Yakunlash'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STAGE 3: FINAL RESULT PROTOCOL (TO'G'RILAR, NOTO'G'RILAR VA QO'SHILGAN BALL)
  // ==========================================
  if (stage === 'result_protocol' && resultSubmission) {
    const addedPts =
      resultSubmission.addedPoints !== undefined
        ? resultSubmission.addedPoints
        : resultSubmission.earnedPoints;

    const finishReasonText =
      resultSubmission.submittedReason === 'zoom_exit'
        ? 'Zoom ekrandan chiqilgani sababli test avtomatik yakunlandi'
        : resultSubmission.submittedReason === 'timeout'
        ? 'Ajratilgan vaqt tugagani sababli test avtomatik yakunlandi'
        : 'Test muvaffaqiyatli yakunlandi';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Testlar ro'yxatiga qaytish</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadCertificate}
              className="py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Natija bayonnomasini yuklab olish</span>
            </button>

            <button
              onClick={handleStartExam}
              className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Qayta yechish</span>
            </button>
          </div>
        </div>

        {/* Summary Protocol Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <div className="text-xs text-emerald-400 font-mono">
                {finishReasonText}
              </div>
              <h1 className="text-2xl font-bold text-white">{test.title}</h1>
              <div className="text-xs text-slate-400">
                Ishtirokchi:{' '}
                <strong className="text-slate-200">{resultSubmission.userName}</strong> ·{' '}
                Sarflangan vaqt:{' '}
                <span className="font-mono tabular-nums">
                  {formatTimer(resultSubmission.timeSpentSeconds)}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="px-5 py-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-right"
            >
              <div className="text-xs text-emerald-300 font-medium">
                Foydalanuvchi balliga qo'shildi
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400">
                +{addedPts} ball
              </div>
              <div className="text-xs text-slate-200 font-mono tabular-nums mt-0.5">
                Jami balingiz: {updatedUserScore} ball
              </div>
            </motion.div>
          </div>

          {/* Explicit To'g'rilar soni / Noto'g'rilar soni / Ball */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-950/60">
            <div className="p-5">
              <div className="text-xs text-slate-400">To'g'rilar soni</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                {resultSubmission.correctCount} ta
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400">Noto'g'rilar soni</div>
              <div className="mt-1 text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
                {resultSubmission.wrongCount + resultSubmission.unansweredCount} ta
              </div>
              {resultSubmission.unansweredCount > 0 && (
                <div className="text-[11px] text-slate-500">
                  ({resultSubmission.wrongCount} xato, {resultSubmission.unansweredCount} bo'sh)
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400">Testdan olgan ball</div>
              <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
                {resultSubmission.earnedPoints} / {resultSubmission.maxPoints}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400">
                CHSB Baho ({resultSubmission.percentage}%)
              </div>
              <div className="mt-1 text-xl font-bold text-sky-400 font-mono tabular-nums">
                {resultSubmission.grade}
              </div>
            </div>
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">
            Savollar tahlili (To'g'ri va noto'g'ri javoblar)
          </h2>

          {test.questions.map((q, idx) => {
            const qRes = resultSubmission.questionResults.find(
              (r) => r.questionId === q.id
            );
            const selectedIdx = qRes?.selectedOptionIndex ?? null;
            const isCorrect = Boolean(qRes?.isCorrect);

            return (
              <div
                key={q.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold text-white">
                    <span className="font-mono text-slate-400 mr-2">
                      #{idx + 1}.
                    </span>
                    {q.text}
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold shrink-0 ${
                      isCorrect ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCorrect ? `+${q.points} ball (To'g'ri)` : `0 ball (Noto'g'ri)`}
                  </span>
                </div>

                {q.codeSnippet && (
                  <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto">
                    {q.codeSnippet}
                  </pre>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, oIdx) => {
                    const isUserChoice = selectedIdx === oIdx;
                    const isRightAnswer = q.correctOptionIndex === oIdx;

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          isRightAnswer
                            ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-medium'
                            : isUserChoice
                            ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <span>
                          <strong className="font-mono mr-1.5">
                            {String.fromCharCode(65 + oIdx)})
                          </strong>
                          {opt}
                        </span>
                        {isRightAnswer && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {isUserChoice && !isRightAnswer && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {test.showExplanations && q.explanation && (
                  <div className="p-3 rounded-lg bg-amber-950/25 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Izoh: </strong>
                      {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return null;
};
