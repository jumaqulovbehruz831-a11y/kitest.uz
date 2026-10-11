import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { TestItem, User, Submission, QuizQuestion, CertificateData } from '../types';
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
  Award,
  Sparkles,
  Zap,
  Trophy,
  Eye,
  Camera,
  CameraOff,
  Sun,
  Moon,
  ShieldAlert,
  Lock,
  Image as ImageIcon,
} from 'lucide-react';
import { KitestRotatingActionLoader } from './KitestRotatingActionLoader';

interface ProblemDetailProps {
  test: TestItem;
  currentUser: User | null;
  submissions?: Submission[];
  soundEnabled?: boolean;
  onBack: () => void;
  onRequireLogin: () => void;
  onOpenCertificate?: (cert: CertificateData) => void;
  onOpenCertificatesStore?: () => void;
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
  submissions = [],
  soundEnabled = true,
  onBack,
  onRequireLogin,
  onOpenCertificate,
  onOpenCertificatesStore,
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

  // "Ko'z Qorachig'i" (Eye-Tracking Focus Guard + Camera Proctoring + Eye Comfort Mode)
  const [eyeCareWarmMode, setEyeCareWarmMode] = useState<boolean>(false);
  const [eyeCameraActive, setEyeCameraActive] = useState<boolean>(false);
  const [gazeFocusPercent, setGazeFocusPercent] = useState<number>(99);
  const [gazeStatusText, setGazeStatusText] = useState<string>(
    "Ko'z qorachig'i ekran markazida"
  );
  const [focusWarnings, setFocusWarnings] = useState<number>(0);
  const [cheatModalOpen, setCheatModalOpen] = useState(false);
  const [cheatVerificationCode, setCheatVerificationCode] = useState('');
  const [cheatEnteredCode, setCheatEnteredCode] = useState('');
  const [cheatCountdown, setCheatCountdown] = useState(60);
  const [cheatError, setCheatError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const hasSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<Record<string, number>>({});
  const enteredFullscreenRef = useRef<boolean>(false);

  // Check if currentUser has already solved/submitted this test before
  const priorUserSubmissions = useMemo(() => {
    if (!currentUser) return [];
    return submissions.filter(
      (s) => s.userId === currentUser.id && s.testId === test.id
    );
  }, [submissions, currentUser, test.id]);

  const hasSolvedBefore = priorUserSubmissions.length > 0;
  const firstAttemptEarnedPoints = useMemo(() => {
    if (priorUserSubmissions.length === 0) return 0;
    const earliest = priorUserSubmissions[priorUserSubmissions.length - 1];
    return earliest?.earnedPoints ?? 0;
  }, [priorUserSubmissions]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Stop webcam when leaving active exam or unmounting
  const stopEyeCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setEyeCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopEyeCamera();
    };
  }, []);

  const toggleEyeCamera = async () => {
    if (eyeCameraActive) {
      stopEyeCamera();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 240, height: 180, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setEyeCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 80);
    } catch {
      setGazeStatusText("Kamera ruxsati berilmadi — Ko'z harakati kursor orqali nazoratda");
    }
  };

  // Simulated + Mouse-driven Eye/Gaze attention tracker during active exam
  useEffect(() => {
    if (stage !== 'active_exam') return;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1000;
      const h = window.innerHeight || 800;
      const edgeDist = Math.min(e.clientX, w - e.clientX, e.clientY, h - e.clientY);
      if (edgeDist < 30) {
        setGazeFocusPercent(84);
        setGazeStatusText("Ko'z qorachig'i ekran chetiga yo'naldi — diqqatni savolga qarating");
      } else {
        setGazeFocusPercent(97 + (Math.floor(e.clientX + e.clientY) % 3));
        setGazeStatusText("Ko'z qorachig'i ekran markazida · Diqqat barqaror");
      }
    };

    const handleMouseLeave = () => {
      setGazeFocusPercent(65);
      setFocusWarnings((w) => w + 1);
      setGazeStatusText("Diqqat ogohlantirishi: Ko'z / kursor test maydonidan chetga chiqdi!");
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [stage]);

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
    setFocusWarnings(0);
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
    stopEyeCamera();

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
          warningsCount: reason === 'zoom_exit' ? focusWarnings + 1 : focusWarnings,
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

        if (data.submission.correctCount > 0 && (data.submission.addedPoints ?? 0) > 0) {
          const isPerfect =
            data.submission.percentage === 100 ||
            (data.submission.totalQuestions > 0 &&
              data.submission.correctCount === data.submission.totalQuestions);
          try {
            confetti({
              particleCount: isPerfect ? 150 : 80,
              spread: isPerfect ? 90 : 65,
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

    const triggerCheatChallenge = () => {
      if (hasSubmittedRef.current || cheatModalOpen) return;
      const code = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
      setCheatVerificationCode(code);
      setCheatEnteredCode('');
      setCheatCountdown(60);
      setCheatError('');
      setCheatModalOpen(true);
      playKitestSound('warning', soundEnabled);
    };

    const handleFullscreenChange = () => {
      if (
        enteredFullscreenRef.current &&
        !document.fullscreenElement &&
        stage === 'active_exam' &&
        !hasSubmittedRef.current
      ) {
        triggerCheatChallenge();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== 'active_exam' || hasSubmittedRef.current) return;
      if (e.key === 'Escape') {
        triggerCheatChallenge();
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
        triggerCheatChallenge();
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
  }, [stage, currentIndex, examQuestions, cheatModalOpen]);

  // 60-second anti-cheat challenge timer
  useEffect(() => {
    if (!cheatModalOpen) return;
    const interval = setInterval(() => {
      setCheatCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCheatModalOpen(false);
          submitExam('zoom_exit');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cheatModalOpen]);

  const handleVerifyCheatCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (cheatEnteredCode.trim().toUpperCase() === cheatVerificationCode.toUpperCase()) {
      setCheatModalOpen(false);
      playKitestSound('success', soundEnabled);
    } else {
      setCheatError("Kiritilgan xavfsizlik kodi noto‘g‘ri! Qaytadan tekshiring.");
      playKitestSound('warning', soundEnabled);
    }
  };

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
    const isFirst =
      resultSubmission.isFirstAttempt !== undefined
        ? resultSubmission.isFirstAttempt
        : (resultSubmission.attemptNumber || 1) === 1;
    const addedPts =
      resultSubmission.addedPoints !== undefined
        ? resultSubmission.addedPoints
        : isFirst
        ? resultSubmission.earnedPoints
        : 0;

    const content = `====================================================
KITEST.UZ — DUNYO YOSHLAR QO'LIDA!
RASMIY CHSB IMTIHON NATIJA BAYONNOMASI
====================================================
Bayonnoma ID: ${resultSubmission.id}
Sana: ${new Date(resultSubmission.submittedAt).toLocaleString('uz-UZ')}
Urinish tartibi: ${resultSubmission.attemptNumber || 1}-urinish (${
      isFirst ? '1-urinish — ball berildi' : 'Qayta yechish — ball berilmaydi'
    })

Ishtirokchi: ${resultSubmission.userName} (@${resultSubmission.username})
Test nomi: #${test.id} - ${test.title}
Fan: ${test.subject}

NATIJALAR:
- To'g'ri javoblar soni: ${resultSubmission.correctCount} ta
- Noto'g'ri / Bo'sh javoblar soni: ${
      resultSubmission.wrongCount + resultSubmission.unansweredCount
    } ta
- Test natijasi: ${resultSubmission.earnedPoints} / ${
      resultSubmission.maxPoints
    } ball (${resultSubmission.percentage}%)
- Hisobga qo'shilgan ball: +${addedPts} ball
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
  // STAGE 1: PRE-EXAM CHSB PASSPORT & 1ST ATTEMPT NOTICE
  // ==========================================
  if (stage === 'pre_exam') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4"
      >
        <button
          onClick={onBack}
          className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Testlar ro'yxatiga qaytish</span>
        </button>

        {/* STRICT 1ST ATTEMPT SCORING BANNER */}
        {hasSolvedBefore ? (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-extrabold text-amber-300 text-sm">
                Qayta yechish rejimi ({priorUserSubmissions.length + 1}-urinish) — Ball berilmaydi (+0 ball)
              </div>
              <p className="text-amber-100/90 mt-0.5">
                Siz ushbu testni avval yechgansiz (1-urinishda olgan balingiz:{' '}
                <strong>+{firstAttemptEarnedPoints} ball</strong>). Platforma qoidasiga binoan,{' '}
                <strong>faqat 1-urinishda ball beriladi</strong> — qayta yechish faqat mashq qilish uchun xizmat qiladi.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-extrabold text-emerald-300 text-sm">
                1-Urinish Imkoniyati — To'plagan balingiz hisobingizga qo'shiladi!
              </div>
              <p className="text-emerald-100/90 mt-0.5">
                Diqqat: Testda <strong>faqat birinchi urinishda</strong> ball beriladi (maksimal{' '}
                <strong>+{test.totalPoints} ball</strong>). Keyingi qayta urinishlarda ball berilmaydi!
              </p>
            </div>
          </div>
        )}

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
              <div className="text-xs text-slate-400">
                {hasSolvedBefore ? 'Qayta yechish balli' : '1-urinish balli'}
              </div>
              <div
                className={`mt-1 text-xl font-bold font-mono tabular-nums ${
                  hasSolvedBefore ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {hasSolvedBefore ? '0 ball (Mashq)' : `+${test.totalPoints} ball`}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-400">Nazorat tizimi</div>
              <div className="mt-1 text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>Ko'z Qorachig'i + Zoom</span>
              </div>
            </div>
          </div>

          {/* Official CHSB Zoom Screen + Ko'z Qorachig'i Instructions */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">
                KITEST Imtihon va Ko'z Qorachig'i Nazorati Qoidalari:
              </h2>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-amber-400 font-semibold">01.</span>
                  <span>
                    <strong className="text-amber-300">Faqat 1-urinishda ball beriladi:</strong>{' '}
                    Testni birinchi marta yechganingizdagina to'plagan balingiz hisobingizga qo'shiladi. Qayta yechishda ball berilmaydi (+0 ball).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-sky-400 font-semibold">02.</span>
                  <span>
                    <strong className="text-sky-300">👁️ Ko'z qorachig'i va Diqqat nazorati:</strong>{' '}
                    Imtihon vaqtida ko'z qorachig'i (kamera/fokus) hamda ko'z himoyasi (Kun/Tun filtri) funksiyasi ishlaydi.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rose-400 font-semibold">03.</span>
                  <span>
                    <strong className="text-rose-300">Zoom Ekran qoidasi:</strong> Agar Zoom ekrandan chiqsangiz (<code className="font-mono">Esc</code> bossangiz yoki boshqa oynaga o'tsangiz), test shu zahoti avtomatik yakunlanadi!
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
                    ? hasSolvedBefore
                      ? 'Qayta Mashq Qilish (+0 ball)'
                      : '1-Urinishni Boshlash (Ball uchun)'
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
  // STAGE 2: ACTIVE ZOOM EKRAN + KO'Z QORACHIG'I HUD
  // ==========================================
  if (stage === 'active_exam' && currentQuestion) {
    const selectedOption = answers[currentQuestion.id];
    const isFlagged = Boolean(flaggedIds[currentQuestion.id]);
    const isLowTime = secondsLeft <= 120;

    return (
      <div
        style={
          eyeCareWarmMode
            ? { filter: 'sepia(18%) brightness(92%) contrast(96%)' }
            : undefined
        }
        className="fixed inset-0 z-50 bg-gradient-to-br from-[#0c142b] via-[#111c3a] to-[#181133] text-slate-100 overflow-y-auto flex flex-col transition-all relative"
      >
        {/* Jingalakli va Matematik Ilmiy Fon Rasmlari (Rich Curly Doodles Wallpaper) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.24] overflow-hidden">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="curly-doodles" width="220" height="220" patternUnits="userSpaceOnUse">
                {/* Spiral curly swirls */}
                <path d="M30 40 Q70 10 110 40 T190 40 Q220 80 180 120 T130 160 Q80 200 40 160 Z" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M50 120 Q100 80 150 120 T200 170" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="5 5" />
                <path d="M10 180 Q60 140 110 180 T170 210" fill="none" stroke="#a855f7" strokeWidth="2" />
                <path d="M80 60 Q100 30 130 50 Q150 80 120 100 Q90 100 80 80" fill="none" stroke="#f59e0b" strokeWidth="2.2" />
                {/* Mathematical curly symbols & stars */}
                <circle cx="65" cy="65" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="160" cy="150" r="18" fill="none" stroke="#10b981" strokeWidth="2.2" />
                <path d="M35 170 L55 170 M45 160 L45 180" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M165 45 L180 50 L175 65 L160 60 Z" fill="none" stroke="#fbbf24" strokeWidth="2" />
                <path d="M110 110 Q125 95 140 110 Q125 125 110 110 Z" fill="none" stroke="#c084fc" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#curly-doodles)" />
          </svg>
        </div>
        {/* Ambient colored glowing orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* 60-Soniya Zoomdan Chiqqanda Firibgarlik Kodini So'rash Modali */}
        {cheatModalOpen && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 text-white p-6 sm:p-7 shadow-2xl border border-rose-500/50 text-center space-y-4 relative"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">
                ⚠️ Imtihon Ekranidan Chiqildi!
              </h3>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Siz to'liq ekran (Zoom) rejimidan chiqdingiz. Firibgarlikning oldini olish uchun <strong>1 minut (60s)</strong> ichida quyidagi xavfsizlik kodini kiriting:
              </p>
              <div className="py-2.5 px-4 rounded-2xl bg-black/60 border border-slate-700 font-mono text-2xl font-black tracking-widest text-amber-400">
                {cheatVerificationCode}
              </div>
              <div className="text-xs font-mono font-bold text-rose-400">
                Qolgan vaqt: {cheatCountdown} soniya (0:{String(cheatCountdown).padStart(2, '0')})
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(cheatCountdown / 60) * 100}%` }}
                />
              </div>
              <form onSubmit={handleVerifyCheatCode} className="space-y-3 pt-2">
                <input
                  type="text"
                  value={cheatEnteredCode}
                  onChange={(e) => setCheatEnteredCode(e.target.value)}
                  placeholder="Kodni kiriting (masalan: KT-1234)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm font-bold tracking-wider focus:outline-none focus:border-sky-400"
                  autoFocus
                />
                {cheatError && (
                  <div className="text-xs text-rose-400 font-bold">{cheatError}</div>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg cursor-pointer"
                >
                  Tasdiqlash va Imtihonni Davom Ettirish
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Top Locked Zoom Ekran Bar */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {test.title}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      hasSolvedBefore
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {hasSolvedBefore ? 'Qayta yechish (+0 ball)' : '1-Urinish (Ball beriladi)'}
                  </span>
                </div>
                <div className="text-[11px] text-sky-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{gazeStatusText}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Ko'z Qorachig'i Kamera Toggle */}
              <button
                type="button"
                onClick={toggleEyeCamera}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  eyeCameraActive
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Ko'z qorachig'i kamera nazorati"
              >
                {eyeCameraActive ? (
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <CameraOff className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden md:inline">Ko'z qorachig'i ({gazeFocusPercent}%)</span>
              </button>

              {/* Ko'z Himoyasi (Kun/Tun filtri) */}
              <button
                type="button"
                onClick={() => setEyeCareWarmMode((v) => !v)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  eyeCareWarmMode
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Ko'z himoyasi va iliq ekran rejimi"
              >
                {eyeCareWarmMode ? (
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span className="hidden md:inline">Ko'z himoyasi</span>
              </button>

              {/* Live Countdown Timer */}
              <div
                className={`px-3.5 py-1.5 rounded-lg border font-mono tabular-nums text-sm font-bold flex items-center gap-1.5 ${
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
                className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Yakunlanmoqda...' : 'Yakunlash'}</span>
              </button>

              <button
                type="button"
                onClick={() => submitExam('zoom_exit')}
                disabled={isSubmitting}
                title="Zoom ekrandan chiqish testni avtomatik yakunlaydi"
                className="py-1.5 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-xs font-semibold text-rose-200 transition-colors flex items-center gap-1"
              >
                <Minimize2 className="w-3.5 h-3.5" />
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
          {/* Left 8 Cols: Active Question Sheet */}
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
                        {hasSolvedBefore
                          ? `${currentQuestion.points} ball (Mashq)`
                          : `+${currentQuestion.points} ball`}
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

                  {/* Savol Rasmi / Diagrammasi (Read and Display Image) */}
                  {currentQuestion.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2.5 flex flex-col items-center justify-center">
                      <img
                        src={currentQuestion.imageUrl}
                        alt={`Savol #${currentIndex + 1} rasmi`}
                        className="max-h-72 w-auto object-contain rounded-lg shadow-lg"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[11px] text-slate-400 font-mono mt-1.5 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Savol chizmasi / diagrammasi</span>
                      </span>
                    </div>
                  )}

                  {/* Answer Options */}
                  <div className="space-y-3 pt-2">
                    {currentQuestion.options.map((optText, idx) => {
                      const isSelected = selectedOption === idx;
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          key={`opt_${currentQuestion.id}_${idx}`}
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
                      <span>Testni yakunlash</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right 4 Cols: Ko'z Qorachig'i Scanner + Question Matrix */}
          <div className="lg:col-span-4 space-y-4">
            {/* Ko'z Qorachig'i Live Control Card */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>Ko'z Qorachig'i Nazorati</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[11px] font-mono font-bold">
                  {gazeFocusPercent}% Diqqat
                </span>
              </div>

              {eyeCameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 h-36 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Eye Pupil Target Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-emerald-400/60 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  </div>
                  <div className="absolute bottom-1.5 left-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-emerald-300 text-center">
                    Ko'z qorachig'i skaneri faol
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Diqqat fokus ko'rsatkichi faol</span>
                  <button
                    type="button"
                    onClick={toggleEyeCamera}
                    className="text-sky-400 hover:underline font-semibold"
                  >
                    Kamerani yoqish
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
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

        {/* Rotating Action Loader during Test Submission */}
        <KitestRotatingActionLoader
          isOpen={isSubmitting}
          variant="test"
          title="Natijalar hisoblanmoqda"
          subtitle="CHSB imtihon javoblari tekshirilmoqda va ball hisoblanmoqda..."
        />
      </div>
    );
  }

  // ==========================================
  // STAGE 3: FINAL RESULT PROTOCOL
  // ==========================================
  if (stage === 'result_protocol' && resultSubmission) {
    const isFirst =
      resultSubmission.isFirstAttempt !== undefined
        ? resultSubmission.isFirstAttempt
        : (resultSubmission.attemptNumber || 1) === 1;
    const addedPts =
      resultSubmission.addedPoints !== undefined
        ? resultSubmission.addedPoints
        : isFirst
        ? resultSubmission.earnedPoints
        : 0;

    const finishReasonText =
      resultSubmission.submittedReason === 'zoom_exit'
        ? 'Zoom ekrandan chiqilgani sababli test avtomatik yakunlandi'
        : resultSubmission.submittedReason === 'timeout'
        ? 'Ajratilgan vaqt tugagani sababli test avtomatik yakunlandi'
        : 'Test muvaffaqiyatli yakunlandi';

    const isPerfectScore =
      resultSubmission.percentage === 100 ||
      (resultSubmission.totalQuestions > 0 &&
        resultSubmission.correctCount === resultSubmission.totalQuestions);

    const buildCertificatePayload = (): CertificateData => ({
      serialNumber: `KT-${resultSubmission.id.replace(/[^A-Z0-9]/gi, '').slice(-6).toUpperCase()}`,
      recipientName: resultSubmission.userName,
      recipientUsername: resultSubmission.username,
      region: currentUser?.region,
      district: currentUser?.district,
      institution: currentUser?.institution,
      testId: resultSubmission.testId,
      testTitle: resultSubmission.testTitle,
      subject: resultSubmission.subject,
      earnedPoints: resultSubmission.earnedPoints,
      maxPoints: resultSubmission.maxPoints,
      percentage: 100,
      grade: resultSubmission.grade || "5 (A'lo)",
      issuedAt: resultSubmission.submittedAt,
      acquiredVia: 'perfect_100',
    });

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

          <div className="flex flex-wrap items-center gap-2.5">
            {isPerfectScore && onOpenCertificate && (
              <button
                onClick={() => onOpenCertificate(buildCertificatePayload())}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all"
              >
                <Award className="w-4 h-4" />
                <span>🎓 100% Rasmiy Sertifikatni Olish</span>
              </button>
            )}

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
              <span>Qayta mashq qilish (+0 ball)</span>
            </button>
          </div>
        </div>

        {/* Notice if it was a repeat attempt (+0 points) */}
        {!isFirst && (
          <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-extrabold text-amber-300 text-sm">
                Qayta Yechish Natijasi ({resultSubmission.attemptNumber}-urinish) — Hisobga +0 ball qo'shildi
              </div>
              <p className="text-amber-100/90 mt-0.5">
                Qoidaga binoan testni faqat <strong>1-marta yechganda</strong> ball beriladi. Qayta yechishda umumiy balingiz o'zgarmaydi ({updatedUserScore} ball).
              </p>
            </div>
          </div>
        )}

        {/* 100% CERTIFICATE CELEBRATION BANNER */}
        {isPerfectScore && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-emerald-950/60 border-2 border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  100% Mukammal Natija — Oltin Sertifikat!
                </div>
                <h3 className="text-lg font-extrabold text-white mt-1">
                  Tabriklaymiz, {resultSubmission.userName}! Siz barcha savollarni 100% to'g'ri yechdingiz!
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onOpenCertificate && (
                <button
                  onClick={() => onOpenCertificate(buildCertificatePayload())}
                  className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Award className="w-4 h-4" />
                  <span>100% Sertifikatni Yuklash</span>
                </button>
              )}
              {onOpenCertificatesStore && (
                <button
                  onClick={onOpenCertificatesStore}
                  className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Sertifikat Do'koni</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Summary Protocol Card */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <KitestEmblem size="sm" showVerifiedSeal={true} />
              <div className="text-xs text-emerald-400 font-mono">
                {finishReasonText} · {resultSubmission.attemptNumber || 1}-urinish
              </div>
              <h1 className="text-2xl font-bold text-white">{test.title}</h1>
              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                <span>
                  Ishtirokchi:{' '}
                  <strong className="text-slate-200">{resultSubmission.userName}</strong>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-sky-400" />
                  {formatTimer(resultSubmission.timeSpentSeconds)}
                </span>
              </div>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className={`px-5 py-4 rounded-xl border text-right ${
                isFirst
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : 'bg-amber-950/30 border-amber-500/40'
              }`}
            >
              <div className="text-xs text-slate-300 font-medium flex items-center justify-end gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {isFirst
                    ? "1-urinish: Hisobga qo'shildi"
                    : 'Qayta yechish: Ball berilmaydi'}
                </span>
              </div>
              <div
                className={`text-2xl font-extrabold font-mono tabular-nums ${
                  isFirst ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                +{addedPts} ball
              </div>
              <div className="text-xs text-slate-200 font-mono tabular-nums mt-0.5">
                🏆 Jami balingiz: {updatedUserScore} ball
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-950/60">
            <div className="p-5">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>To'g'rilar soni</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">
                ✅ {resultSubmission.correctCount} ta
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Noto'g'rilar soni</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
                ❌ {resultSubmission.wrongCount + resultSubmission.unansweredCount} ta
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Test natijasi</span>
              </div>
              <div className="mt-1 text-2xl font-extrabold text-white font-mono tabular-nums">
                {resultSubmission.earnedPoints} / {resultSubmission.maxPoints}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-sky-400" />
                <span>CHSB Baho ({resultSubmission.percentage}%)</span>
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
                        key={`review_opt_${q.id}_${oIdx}`}
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
