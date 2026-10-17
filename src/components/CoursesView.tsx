import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CourseItem,
  CourseLessonPart,
  VideoSizePreset,
  QuizQuestion,
  TestItem,
  User,
  ADMIN_EMAIL,
  OFFICIAL_YOUTUBE_URL,
} from '../types';
import { AnimatedWords, playKitestSound } from './KitestEmblem';
import {
  Video,
  PlusCircle,
  Play,
  Layers,
  Maximize2,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Trash2,
  Crown,
  Sparkles,
  Upload,
  ExternalLink,
  Youtube,
  Send,
  Sliders,
  BookOpen,
  UserCheck,
  Lock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface CoursesViewProps {
  courses: CourseItem[];
  tests: TestItem[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onRefreshState: () => Promise<void>;
  onSelectTest: (test: TestItem) => void;
  onRequireLogin: () => void;
  onUpdateUser?: (user: User) => void;
}

const SUBJECT_OPTIONS = [
  'Matematika',
  'Informatika va Algoritmlar',
  'Fizika',
  'Ingliz tili (IELTS / CEFR)',
  'Kimyo va Biologiya',
  'Tarix va Huquq',
  'Ona tili va Adabiyot',
  'Mantiqiy va IQ',
];

const VIDEO_SIZE_OPTIONS: {
  id: VideoSizePreset;
  label: string;
  desc: string;
  widthPx?: number;
}[] = [
  { id: 'sm', label: 'Kichik (480px)', desc: 'Ixcham video oyna', widthPx: 480 },
  { id: 'md', label: "O'rta (680px)", desc: 'Standart dars hajmi', widthPx: 680 },
  { id: 'lg', label: 'Katta (920px)', desc: 'Keng kino formati', widthPx: 920 },
  { id: 'full', label: "To'liq kenglik (100%)", desc: 'Maksimal ekran', widthPx: 1280 },
  { id: 'custom', label: "Maxsus o'lcham (px)", desc: "Xohlagan o'lchamni kiriting" },
];

function extractYouTubeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed;
    }
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch?.[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watchMatch?.[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shortsMatch?.[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  } catch {}
  return null;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  tests,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onRefreshState,
  onSelectTest,
  onRequireLogin,
  onUpdateUser,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    (Boolean(currentUser) &&
      (currentUser!.role === 'creator' ||
        currentUser!.role === 'admin' ||
        currentUser!.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()));

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courses[0]?.id || null
  );
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('Barchasi');

  // Viewer override for video size so user or creator can also resize live
  const [viewerSizeOverride, setViewerSizeOverride] = useState<VideoSizePreset | null>(
    null
  );
  const [viewerCustomWidth, setViewerCustomWidth] = useState<number>(820);

  // Course Builder Form State (Strictly for Creators & Admin)
  const [courseTitle, setCourseTitle] = useState('');
  const [courseSubject, setCourseSubject] = useState(SUBJECT_OPTIONS[0]);
  const [courseDescription, setCourseDescription] = useState('');
  const [courseAttachedTestId, setCourseAttachedTestId] = useState('');
  const [courseRequiresApproval, setCourseRequiresApproval] = useState(false);
  const [enrollStatusMsg, setEnrollStatusMsg] = useState<string | null>(null);
  const [builderLessons, setBuilderLessons] = useState<CourseLessonPart[]>([
    {
      id: `part_${Date.now()}_1`,
      partNumber: 1,
      title: '1-qism: Kirish va asosiy tushunchalar',
      videoUrl: '',
      videoSizePreset: 'lg',
      customWidthPx: 860,
      aspectRatio: '16:9',
      authorMessage: '',
      attachedTestId: '',
      inlineQuestions: [],
    },
  ]);
  const [activeBuilderPartIdx, setActiveBuilderPartIdx] = useState(0);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderSuccess, setBuilderSuccess] = useState<string | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Inline Quiz state inside Course Builder
  const [newQText, setNewQText] = useState('');
  const [newQOpts, setNewQOpts] = useState<string[]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQExplanation, setNewQExplanation] = useState('');

  // Viewer Inline Quiz interactive state
  const [inlineAnswers, setInlineAnswers] = useState<Record<string, number>>({});
  const [quizResultBanner, setQuizResultBanner] = useState<{
    earnedPoints: number;
    earnedCoins: number;
    earnedStars: number;
    percentage: number;
    multiplier: number;
  } | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Comment / Creator message state below video
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Request Premium / Creator state for regular participants
  const [requestNote, setRequestNote] = useState('');
  const [requestStatusMsg, setRequestStatusMsg] = useState<string | null>(null);
  const [isRequestingCreator, setIsRequestingCreator] = useState(false);

  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const filteredCourses = useMemo(() => {
    if (subjectFilter === 'Barchasi') return courses;
    return courses.filter((c) => c.subject === subjectFilter);
  }, [courses, subjectFilter]);

  const activeCourse = useMemo(() => {
    if (!filteredCourses.length) return null;
    return (
      filteredCourses.find((c) => c.id === selectedCourseId) || filteredCourses[0]
    );
  }, [filteredCourses, selectedCourseId]);

  const currentLessonPart: CourseLessonPart | null = useMemo(() => {
    if (!activeCourse || !activeCourse.lessons.length) return null;
    const validIdx = Math.min(
      Math.max(0, activePartIndex),
      activeCourse.lessons.length - 1
    );
    return activeCourse.lessons[validIdx];
  }, [activeCourse, activePartIndex]);

  // Handle changing total number of parts quickly
  const handleSetPartsCount = (count: number) => {
    const targetCount = Math.min(20, Math.max(1, count));
    setBuilderLessons((prev) => {
      if (targetCount === prev.length) return prev;
      if (targetCount < prev.length) {
        return prev.slice(0, targetCount);
      }
      const added: CourseLessonPart[] = [...prev];
      for (let i = prev.length; i < targetCount; i++) {
        added.push({
          id: `part_${Date.now()}_${i + 1}`,
          partNumber: i + 1,
          title: `${i + 1}-qism: Yangi video dars`,
          videoUrl: '',
          videoSizePreset: prev[0]?.videoSizePreset || 'lg',
          customWidthPx: prev[0]?.customWidthPx || 860,
          aspectRatio: prev[0]?.aspectRatio || '16:9',
          authorMessage: '',
          attachedTestId: '',
          inlineQuestions: [],
        });
      }
      return added;
    });
    if (activeBuilderPartIdx >= targetCount) {
      setActiveBuilderPartIdx(targetCount - 1);
    }
  };

  const updateCurrentBuilderPart = (patch: Partial<CourseLessonPart>) => {
    setBuilderLessons((prev) =>
      prev.map((part, idx) =>
        idx === activeBuilderPartIdx ? { ...part, ...patch } : part
      )
    );
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 24 * 1024 * 1024) {
      setBuilderError(
        "Video fayl hajmi juda katta (maksimal 24 MB). Katta videolar uchun YouTube yoki to'g'ridan-to'g'ri video havolasini kiriting!"
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateCurrentBuilderPart({ videoUrl: reader.result });
        setBuilderError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddInlineQuestionToPart = () => {
    const currentPart = builderLessons[activeBuilderPartIdx];
    if (!currentPart) return;
    const cleanOpts = newQOpts.map((o) => o.trim()).filter(Boolean);
    if (!newQText.trim() || cleanOpts.length < 2) {
      setBuilderError(
        "Dars ostidagi savol uchun savol matni va kamida 2 ta variant kiriting!"
      );
      return;
    }
    const newQ: QuizQuestion = {
      id: `inline_q_${Date.now()}`,
      text: newQText.trim(),
      options: cleanOpts,
      correctOptionIndex: Math.min(newQCorrect, cleanOpts.length - 1),
      explanation: newQExplanation.trim() || undefined,
      points: 10,
    };
    updateCurrentBuilderPart({
      inlineQuestions: [...(currentPart.inlineQuestions || []), newQ],
    });
    setNewQText('');
    setNewQOpts(['', '', '', '']);
    setNewQCorrect(0);
    setNewQExplanation('');
    setBuilderError(null);
  };

  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError(null);
    setBuilderSuccess(null);

    if (!courseTitle.trim()) {
      setBuilderError('Kurs nomini kiriting!');
      return;
    }

    const hasAnyVideoOrMsg = builderLessons.some(
      (p) => p.videoUrl.trim() || p.authorMessage.trim()
    );
    if (!hasAnyVideoOrMsg) {
      setBuilderError(
        "Kamida 1-qism uchun video havolasi (yoki fayli) va muallif xabarini kiriting!"
      );
      return;
    }

    setIsSavingCourse(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
        body: JSON.stringify({
          title: courseTitle.trim(),
          subject: courseSubject,
          description: courseDescription.trim(),
          attachedTestId: courseAttachedTestId || undefined,
          requiresApproval: courseRequiresApproval,
          lessons: builderLessons,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuilderError(data.error || 'Kursni saqlashda xatolik yuz berdi.');
      } else {
        playKitestSound('victory', soundEnabled);
        setBuilderSuccess('Video kurs va barcha qismlar muvaffaqiyatli joylandi!');
        setCourseTitle('');
        setCourseDescription('');
        setCourseAttachedTestId('');
        await onRefreshState();
        if (data.course?.id) {
          setSelectedCourseId(data.course.id);
          setActivePartIndex(0);
        }
        setTimeout(() => {
          setIsBuilderOpen(false);
          setBuilderSuccess(null);
        }, 900);
      }
    } catch {
      setBuilderError("Server bilan bog'lanishda xatolik.");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
      });
      if (res.ok) {
        await onRefreshState();
        if (selectedCourseId === courseId) {
          setSelectedCourseId(null);
          setActivePartIndex(0);
        }
      }
    } catch {}
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !commentText.trim()) return;
    if (!currentUser && !isAdminUnlocked) {
      onRequireLogin();
      return;
    }
    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/courses/${activeCourse.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: currentLessonPart?.id,
          userId: currentUser?.id || 'admin',
          userName: currentUser?.name || 'KITEST Bosh Admin',
          username: currentUser?.username || 'bosh_admin',
          userRole: currentUser?.role || 'admin',
          userAvatarUrl: currentUser?.avatarUrl,
          text: commentText.trim(),
        }),
      });
      if (res.ok) {
        setCommentText('');
        await onRefreshState();
      }
    } catch {}
    setIsPostingComment(false);
  };

  const handleRequestPremiumCreator = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setIsRequestingCreator(true);
    setRequestStatusMsg(null);
    try {
      const res = await fetch(`/api/users/${currentUser.id}/request-creator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note:
            requestNote.trim() ||
            "Men KITEST Premium olib, Test va Video Kurs yaratuvchi bo'lmoqchiman!",
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setRequestStatusMsg(data.message);
        if (onUpdateUser) onUpdateUser(data.user);
        await onRefreshState();
      }
    } catch {}
    setIsRequestingCreator(false);
  };

  const handleRequestJoinCourse = async (courseId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setEnrollStatusMsg(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/request-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        setEnrollStatusMsg(data.message || "Kursga qo'shilish so'rovi yuborildi!");
        await onRefreshState();
      }
    } catch {}
  };

  const handleApproveCourseJoin = async (
    courseId: string,
    userId: string,
    approve: boolean
  ) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/approve-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
        body: JSON.stringify({ userId, approve }),
      });
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        await onRefreshState();
      }
    } catch {}
  };

  const activeBuilderPart = builderLessons[activeBuilderPartIdx] || builderLessons[0];

  // Calculate active video display width and aspect ratio
  const effectiveSizePreset: VideoSizePreset =
    viewerSizeOverride || currentLessonPart?.videoSizePreset || 'lg';

  const getVideoWrapperStyle = (): React.CSSProperties => {
    if (effectiveSizePreset === 'sm') return { maxWidth: '480px', width: '100%' };
    if (effectiveSizePreset === 'md') return { maxWidth: '680px', width: '100%' };
    if (effectiveSizePreset === 'lg') return { maxWidth: '920px', width: '100%' };
    if (effectiveSizePreset === 'full') return { maxWidth: '100%', width: '100%' };
    const customW = viewerSizeOverride === 'custom'
      ? viewerCustomWidth
      : currentLessonPart?.customWidthPx || 820;
    return { maxWidth: `${customW}px`, width: '100%' };
  };

  const getAspectRatioClass = (ratio?: string) => {
    if (ratio === '4:3') return 'aspect-[4/3]';
    if (ratio === '21:9') return 'aspect-[21/9]';
    if (ratio === '9:16') return 'aspect-[9/16] max-h-[640px]';
    return 'aspect-video';
  };

  // Linked test for current part or whole course
  const linkedTest: TestItem | undefined = useMemo(() => {
    const targetId =
      currentLessonPart?.attachedTestId || activeCourse?.attachedTestId;
    if (!targetId) return undefined;
    return tests.find(
      (t) => t.id === targetId || String(t.numericId) === String(targetId)
    );
  }, [currentLessonPart, activeCourse, tests]);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Hero Header for Courses + Official YouTube Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d162c] to-slate-950 border border-sky-500/30 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/40 text-sky-300 text-xs font-bold">
            <Video className="w-3.5 h-3.5 text-sky-400" />
            <span>KO'P QISMLI VIDEO KURSLAR VA INTERAKTIV DARSLAR MARKAZI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="KITEST Video Kurslar, Ustoz Xabarlari va Amaliy Testlar"
              variant="accent"
            />
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tasdiqlangan <strong className="text-sky-300">Test Yaratuvchilar (Ustozlar)</strong> tomonidan bir necha qismli video kurslar, xohlagan o'lchamdagi video pleyer, video ostida muallif konspekt-xabarlari hamda mavzulashtirilgan testlar joylanadi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={OFFICIAL_YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-xs font-extrabold text-rose-200 flex items-center gap-2 transition-all shadow-lg"
          >
            <Youtube className="w-4 h-4 text-rose-400" />
            <span>YouTube Kanalimiz (@FC_UZB-67b)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {isCreatorOrAdmin ? (
            <button
              onClick={() => {
                playKitestSound('click', soundEnabled);
                setIsBuilderOpen((prev) => !prev);
              }}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 shadow-xl shadow-sky-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isBuilderOpen ? 'Yopish' : '+ Yangi Video Kurs Yaratish'}</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Kurs yaratish — faqat Test Yaratuvchilar uchun</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* PREMIUM & CREATOR UPGRADE BANNER FOR REGULAR USERS                    */}
      {/* ===================================================================== */}
      {!isCreatorOrAdmin && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>👑 KITEST PREMIUM VA TEST / KURS YARATUVCHI MAQOMI</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Siz ham platformada o'z <strong className="text-white">Testlaringizni</strong> va <strong className="text-white">Ko'p qismli Video Kurslaringizni</strong> yaratmoqchimisiz? Premium so'rov yuboring — <strong className="text-amber-300">Bosh Admin tasdiqlashi bilan</strong> sizga rasmiy Test va Kurs Yaratuvchi huquqi beriladi!
            </p>
            {requestStatusMsg && (
              <div className="text-xs font-semibold text-emerald-300 pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{requestStatusMsg}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {currentUser?.creatorRequestStatus === 'pending' ? (
              <span className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>So'rovingiz Admin tasdiqlashini kutmoqda...</span>
              </span>
            ) : (
              <>
                <input
                  type="text"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Fan yoki izoh (masalan: Matematika ustozi)"
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  disabled={isRequestingCreator}
                  onClick={handleRequestPremiumCreator}
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {isRequestingCreator
                      ? 'Yuborilmoqda...'
                      : "👑 Premium va Yaratuvchi So'rovi Yuborish"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CREATOR-ONLY MULTI-PART VIDEO COURSE BUILDER                          */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isCreatorOrAdmin && isBuilderOpen && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onSubmit={handleCreateCourseSubmit}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-sky-500/50 shadow-2xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Yaratuvchilar Uchun Maxsus Studiya</span>
                </div>
                <h2 className="text-xl font-extrabold text-white mt-0.5">
                  Yangi Ko'p Qismli Video Kurs va Darslik Joylash
                </h2>
              </div>

              {/* Number of Parts Selector ("kurslar bir necha qism bo'ladi uni yaratuvchilar tanlaydi") */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  Kurs qismlari soni:
                </span>
                {[1, 2, 3, 4, 5, 7, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetPartsCount(num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                      builderLessons.length === num
                        ? 'bg-sky-500 text-slate-950 border-sky-300'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {num} qism
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSetPartsCount(builderLessons.length + 1)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                >
                  + Qism qo'shish
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourse}
                  className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold"
                >
                  {isSavingCourse ? 'Saqlanmoqda...' : '💾 Saqlash'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-slate-200 text-xs font-bold"
                >
                  ✕ Chiqish
                </button>
              </div>
            </div>

            {builderError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                {builderError}
              </div>
            )}
            {builderSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200">
                {builderSuccess}
              </div>
            )}

            {/* Course General Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kurs nomi *
                </label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="Masalan: CHSB Matematika 100% Tayyorgarlik Kursi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fan yo'nalishi
                </label>
                <select
                  value={courseSubject}
                  onChange={(e) => setCourseSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {SUBJECT_OPTIONS.map((subj, idx) => (
                    <option key={`crs_opt_${subj}_${idx}`} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kursga Umumiy Test Biriktirish (ixtiyoriy)
                </label>
                <select
                  value={courseAttachedTestId}
                  onChange={(e) => setCourseAttachedTestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value="">-- Test tanlanmagan (ixtiyoriy) --</option>
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} · {t.title} ({t.questions.length} savol)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kurs haqida qisqacha ma'lumot
                </label>
                <input
                  type="text"
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Kurs kimlar uchun mo'ljallangan va nimalar o'rgatiladi..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="md:col-span-4 pt-4">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-amber-500/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseRequiresApproval}
                    onChange={(e) => setCourseRequiresApproval(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <div>
                    <div className="text-xs font-extrabold text-amber-300">
                      🔒 Ruxsat bilan qo'shilish
                    </div>
                    <div className="text-[10px] text-slate-400">
                      O'quvchilar so'rov yuborib kiradi
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Part Tabs inside Builder */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>
                    Kurs qismlarini tahrirlash ({builderLessons.length} ta qism):
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {builderLessons.map((part, idx) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => setActiveBuilderPartIdx(idx)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        activeBuilderPartIdx === idx
                          ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      {idx + 1}-qism
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Part Editor Box */}
              {activeBuilderPart && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-sky-300">
                      {activeBuilderPartIdx + 1}-QISM SOZLAMALARI (VIDEO, O'LCHAM, XABAR VA TEST)
                    </h3>
                    {builderLessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setBuilderLessons((prev) =>
                            prev
                              .filter((_, i) => i !== activeBuilderPartIdx)
                              .map((p, i) => ({ ...p, partNumber: i + 1 }))
                          );
                          setActiveBuilderPartIdx((prev) => Math.max(0, prev - 1));
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Shu qismni o'chirish</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {activeBuilderPartIdx + 1}-qism sarlavhasi *
                      </label>
                      <input
                        type="text"
                        value={activeBuilderPart.title}
                        onChange={(e) =>
                          updateCurrentBuilderPart({ title: e.target.value })
                        }
                        placeholder={`${activeBuilderPartIdx + 1}-qism mavzusi`}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Video manzili (YouTube link, MP4 link) yoki Fayl yuklash *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeBuilderPart.videoUrl}
                          onChange={(e) =>
                            updateCurrentBuilderPart({ videoUrl: e.target.value })
                          }
                          placeholder="https://www.youtube.com/watch?v=... yoki .mp4 link"
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono"
                        />
                        <input
                          ref={videoFileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => videoFileInputRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-sky-300 flex items-center gap-1.5 shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Video Fayl</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* VIDEO SIZE & ASPECT RATIO CUSTOMIZER ("unda video joylaydi xohlagan o'lchamini") */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-sky-400" />
                        <span>Video O'lchami (Xohlagan o'lchamni tanlang):</span>
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Tomonlar nisbati:</span>
                        {(['16:9', '4:3', '21:9', '9:16'] as const).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() =>
                              updateCurrentBuilderPart({ aspectRatio: ratio })
                            }
                            className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                              (activeBuilderPart.aspectRatio || '16:9') === ratio
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {VIDEO_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            updateCurrentBuilderPart({
                              videoSizePreset: opt.id,
                              customWidthPx:
                                opt.widthPx || activeBuilderPart.customWidthPx || 800,
                            })
                          }
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            activeBuilderPart.videoSizePreset === opt.id
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className="text-[10px] opacity-75">{opt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {activeBuilderPart.videoSizePreset === 'custom' && (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="text-xs font-semibold text-sky-300">
                          Maxsus video kengligi (px):{' '}
                          <strong className="font-mono">
                            {activeBuilderPart.customWidthPx || 800}px
                          </strong>
                        </label>
                        <input
                          type="range"
                          min={320}
                          max={1280}
                          step={20}
                          value={activeBuilderPart.customWidthPx || 800}
                          onChange={(e) =>
                            updateCurrentBuilderPart({
                              customWidthPx: Number(e.target.value),
                            })
                          }
                          className="flex-1 accent-sky-500"
                        />
                        <input
                          type="number"
                          min={280}
                          max={1400}
                          value={activeBuilderPart.customWidthPx || 800}
                          onChange={(e) =>
                            updateCurrentBuilderPart({
                              customWidthPx: Number(e.target.value),
                            })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* CREATOR MESSAGE BELOW VIDEO ("va o'zi pastiga xabar joylaydi") */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Video pastida ko'rinadigan Muallif Xabari / Konspekt / Izoh *
                    </label>
                    <textarea
                      rows={3}
                      value={activeBuilderPart.authorMessage}
                      onChange={(e) =>
                        updateCurrentBuilderPart({ authorMessage: e.target.value })
                      }
                      placeholder="Ushbu video dars ostida o'quvchilarga ko'rinadigan xabar, formulalar, muhim qoidalar yoki topshiriqlarni yozing..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* OPTIONAL TEST BELOW THIS LESSON PART ("va istasa pastidan test ham joylashi mumkin") */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                        <span>
                          Video Dars Pastiga Test Biriktirish (Ixtiyoriy — xohlasangiz tayyor test tanlang yoki savol qo'shing)
                        </span>
                      </div>

                      <select
                        value={activeBuilderPart.attachedTestId || ''}
                        onChange={(e) =>
                          updateCurrentBuilderPart({
                            attachedTestId: e.target.value,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      >
                        <option value="">-- Mavjud testni biriktirish (ixtiyoriy) --</option>
                        {tests.map((t) => (
                          <option key={t.id} value={t.id}>
                            #{t.id} · {t.title} ({t.questions.length} savol)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Inline Quiz Question Adder right under the video */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end pt-2 border-t border-slate-800/80">
                      <div className="md:col-span-4">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Yoki video ostiga tezkor savol matni:
                        </label>
                        <input
                          type="text"
                          value={newQText}
                          onChange={(e) => setNewQText(e.target.value)}
                          placeholder="Savol matni..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      {newQOpts.map((opt, oIdx) => (
                        <div key={oIdx} className="md:col-span-2">
                          <label className="block text-[11px] text-slate-400 mb-1 flex items-center justify-between">
                            <span>Variant {String.fromCharCode(65 + oIdx)}</span>
                            <input
                              type="radio"
                              name="inline_correct_opt"
                              checked={newQCorrect === oIdx}
                              onChange={() => setNewQCorrect(oIdx)}
                              title="To'g'ri javob sifatida belgilash"
                            />
                          </label>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...newQOpts];
                              next[oIdx] = e.target.value;
                              setNewQOpts(next);
                            }}
                            placeholder={`${String.fromCharCode(65 + oIdx)} javob`}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        Qo'shilgan tezkor savollar:{' '}
                        <strong className="text-emerald-400">
                          {(activeBuilderPart.inlineQuestions || []).length} ta
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddInlineQuestionToPart}
                        className="py-1.5 px-3.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                      >
                        + Video ostiga savolni qo'shish
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={isSavingCourse}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl"
              >
                {isSavingCourse
                  ? 'Saqlanmoqda...'
                  : '🚀 Video Kursni Nashr Qilish'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* SUBJECT FILTER & MAIN COURSES PLAYER WORKSPACE                        */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['Barchasi', ...SUBJECT_OPTIONS].map((subj, idx) => (
          <button
            key={`filter_btn_${subj}_${idx}`}
            onClick={() => setSubjectFilter(subj)}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
              subjectFilter === subj
                ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-white'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/85 border border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
            <Video className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white">
              Hozircha bu bo'limda video kurslar joylanmagan
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tasdiqlangan Test Yaratuvchilar bir necha qismli video darslar, muallif xabari va mavzulashtirilgan testlarni joylashlari mumkin.
            </p>
          </div>
          {isCreatorOrAdmin && (
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Birinchi Video Kursni Joylash</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 4 COLS: COURSES LIST & MULTI-PART LESSON SELECTOR */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Mavjud Kurslar ({filteredCourses.length})</span>
            </h3>

            <div className="space-y-3">
              {filteredCourses.map((course) => {
                const isSelected = activeCourse?.id === course.id;
                const canDelete =
                  isAdminUnlocked ||
                  currentUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
                  currentUser?.email.toLowerCase() === course.authorEmail.toLowerCase();

                return (
                  <div
                    key={course.id}
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setActivePartIndex(0);
                      setViewerSizeOverride(null);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-300">
                          {course.subject} · {course.lessons.length} qism
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-1.5">
                          {course.title}
                        </h4>
                      </div>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
                          title="Kursni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {course.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    {/* 📐 2-Chizma: Video / Kanal bloki interfeysi: (O) [===================] va pastda o'ngda Tugma */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 border-2 border-sky-300 flex items-center justify-center shrink-0 shadow-md">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                        <div className="flex-1 h-7 rounded-lg bg-slate-900 border border-slate-800 px-3 flex items-center justify-between text-[11px] font-mono text-sky-300">
                          <span className="truncate">
                            🎬 {course.authorName} · Video Kanal ({course.lessons.length} dars)
                          </span>
                          <span className="text-emerald-400 font-bold shrink-0 ml-2">
                            HD
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          {course.requiresApproval
                            ? '🔒 Admin/Ustoz ruxsati bilan'
                            : '✅ Ochiq video kurs'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourseId(course.id);
                            setActivePartIndex(0);
                            setQuizResultBanner(null);
                          }}
                          className="py-1.5 px-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow"
                        >
                          <span>
                            {course.requiresApproval &&
                            !(course.enrolledUserIds || []).includes(
                              currentUser?.id || ''
                            )
                              ? 'Ruxsat so‘rash / Kirish'
                              : 'Darsga Qatnashish'}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT 8 COLS: ACTIVE COURSE PLAYER, PARTS BAR, AUTHOR MESSAGE & ATTACHED TEST */}
          {activeCourse && currentLessonPart && (
            <div className="lg:col-span-8 space-y-6">
              {/* Pending Enrollment Requests Panel for Course Author / Admin */}
              {(isAdminUnlocked ||
                currentUser?.role === 'admin' ||
                currentUser?.email.toLowerCase() ===
                  activeCourse.authorEmail.toLowerCase()) &&
                (activeCourse.pendingUserIds || []).length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
                    <div className="text-xs font-extrabold text-amber-300 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>
                        Kursga Qo'shilish So'rovlari (
                        {(activeCourse.pendingUserIds || []).length} ta)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(activeCourse.pendingUserIds || []).map((uid: string) => (
                        <div
                          key={uid}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs"
                        >
                          <span className="font-mono text-slate-200">
                            ID: {uid}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveCourseJoin(activeCourse.id, uid, true)
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            ✓ Ruxsat berish
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleApproveCourseJoin(activeCourse.id, uid, false)
                            }
                            className="px-2 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-800 text-rose-200 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Enrollment Gate if course requiresApproval and student is not yet enrolled */}
              {activeCourse.requiresApproval &&
              !isAdminUnlocked &&
              currentUser?.role !== 'admin' &&
              currentUser?.email.toLowerCase() !==
                activeCourse.authorEmail.toLowerCase() &&
              !(activeCourse.enrolledUserIds || []).includes(
                currentUser?.id || ''
              ) ? (
                <div className="p-8 rounded-3xl bg-slate-900/95 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    {activeCourse.title} — Yopiq Kurs (Ruxsat Bilan)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                    Ushbu kursga kirish va video darslarni ko'rish uchun kurs muallifi ({activeCourse.authorName}) yoki Bosh Admin ruxsati talab etiladi.
                  </p>
                  {enrollStatusMsg && (
                    <div className="text-xs font-bold text-emerald-400">
                      {enrollStatusMsg}
                    </div>
                  )}
                  {(activeCourse.pendingUserIds || []).includes(
                    currentUser?.id || ''
                  ) ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-extrabold">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>
                        So'rovingiz yuborilgan — Ustoz yoki Admin tasdiqlashini kutmoqda...
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestJoinCourse(activeCourse.id)}
                      className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Kursga Qo'shilish Uchun Ruxsat So'rash</span>
                    </button>
                  )}
                </div>
              ) : (
              /* Course Header & Multi-Part Switcher */
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-bold text-sky-400">
                      {activeCourse.subject} • Ustoz: {activeCourse.authorName}
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-0.5">
                      {activeCourse.title}
                    </h2>
                  </div>

                  {/* Live Video Size Controller */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">
                      Video o'lchami:
                    </span>
                    {VIDEO_SIZE_OPTIONS.map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setViewerSizeOverride(sz.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          effectiveSizePreset === sz.id
                            ? 'bg-sky-500 text-slate-950 border-sky-300'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {sz.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {effectiveSizePreset === 'custom' && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-sky-300 font-semibold">
                      Video kengligi: {viewerCustomWidth}px
                    </span>
                    <input
                      type="range"
                      min={320}
                      max={1280}
                      step={20}
                      value={viewerCustomWidth}
                      onChange={(e) => setViewerCustomWidth(Number(e.target.value))}
                      className="flex-1 accent-sky-500"
                    />
                  </div>
                )}

                {/* Multi-Part Navigation Pills ("kurslar bir necha qism bo'ladi") */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activeCourse.lessons.map((part, idx) => {
                    const active = idx === activePartIndex;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => {
                          playKitestSound('click', soundEnabled);
                          setActivePartIndex(idx);
                        }}
                        className={`py-2 px-4 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 border transition-all ${
                          active
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-sky-300 shadow-lg'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {idx + 1}-qism: {part.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Resizable Video Player Container */}
                <div className="flex justify-center pt-2">
                  <div
                    style={getVideoWrapperStyle()}
                    className="rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl transition-all duration-300"
                  >
                    {(() => {
                      const ytEmbed = extractYouTubeEmbedUrl(
                        currentLessonPart.videoUrl
                      );
                      const ratioClass = getAspectRatioClass(
                        currentLessonPart.aspectRatio
                      );

                      if (ytEmbed) {
                        return (
                          <div className={`w-full ${ratioClass}`}>
                            <iframe
                              src={ytEmbed}
                              title={currentLessonPart.title}
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        );
                      }

                      if (currentLessonPart.videoUrl) {
                        return (
                          <video
                            src={currentLessonPart.videoUrl}
                            controls
                            className={`w-full ${ratioClass} bg-black object-contain`}
                          />
                        );
                      }

                      return (
                        <div
                          className={`w-full ${ratioClass} flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2`}
                        >
                          <Video className="w-10 h-10 text-sky-400" />
                          <div className="text-sm font-bold text-white">
                            {currentLessonPart.title}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* AUTHOR MESSAGE DIRECTLY BELOW VIDEO ("va o'zi pastiga xabar joylaydi") */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/50 via-slate-950 to-indigo-950/40 border border-sky-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-sky-300 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-sky-400" />
                      <span>
                        Muallif ({activeCourse.authorName}) Xabari va Dars Konspekti —{' '}
                        {activePartIndex + 1}-qism:
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentLessonPart.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 whitespace-pre-line leading-relaxed">
                    {currentLessonPart.authorMessage ||
                      "Ushbu video qismni diqqat bilan ko'rib chiqing va pastdagi amaliy test savollarini yeching."}
                  </p>
                </div>
              </div>
              )}

              {/* ================================================================= */}
              {/* ATTACHED TEST OR INLINE QUIZ BELOW VIDEO ("istasa pastidan test") */}
              {/* ================================================================= */}
              {(linkedTest ||
                (currentLessonPart.inlineQuestions &&
                  currentLessonPart.inlineQuestions.length > 0)) && (
                <div className="p-6 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/40 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4" />
                        <span>Darsga Biriktirilgan Amaliy Test</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        {linkedTest
                          ? `#${linkedTest.id} · ${linkedTest.title}`
                          : `${currentLessonPart.title} — Mavzu Yuzasidan Savollar`}
                      </h3>
                    </div>

                    {linkedTest && (
                      <button
                        type="button"
                        onClick={() => onSelectTest(linkedTest)}
                        className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-extrabold text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20 shrink-0"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>
                          To'liq Testni Yechish ({linkedTest.questions.length} savol ·{' '}
                          {linkedTest.totalPoints} ball)
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Render Inline Questions right below the video */}
                  {currentLessonPart.inlineQuestions &&
                    currentLessonPart.inlineQuestions.length > 0 && (
                      <div className="space-y-4">
                        {currentLessonPart.inlineQuestions.map((q, qIdx) => {
                          const chosen = inlineAnswers[q.id];
                          const answered = chosen !== undefined;

                          return (
                            <div
                              key={q.id}
                              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                            >
                              <div className="text-sm font-bold text-white flex items-start gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs">
                                  #{qIdx + 1}
                                </span>
                                <span>{q.text}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => {
                                  const isThisChosen = chosen === oIdx;
                                  const isCorrect = oIdx === q.correctOptionIndex;

                                  let style =
                                    'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200';
                                  if (answered) {
                                    if (isCorrect) {
                                      style =
                                        'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold';
                                    } else if (isThisChosen) {
                                      style =
                                        'bg-rose-950/70 border-rose-500 text-rose-200';
                                    }
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => {
                                        playKitestSound(
                                          oIdx === q.correctOptionIndex
                                            ? 'success'
                                            : 'warning',
                                          soundEnabled
                                        );
                                        setInlineAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: oIdx,
                                        }));
                                      }}
                                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${style}`}
                                    >
                                      <span>
                                        <strong className="font-mono mr-1.5">
                                          {String.fromCharCode(65 + oIdx)}.
                                        </strong>
                                        {opt}
                                      </span>
                                      {answered && isCorrect && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                      )}
                                      {answered && isThisChosen && !isCorrect && (
                                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {answered && q.explanation && (
                                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2">
                                  <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                  <span>{q.explanation}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* INLINE COURSE QUIZ GRADING & % PROGRESS BAR ("pastida testi bo'ladi. Keyin ball beriladi va % ko'tariladi") */}
                        {(() => {
                          const qs = currentLessonPart.inlineQuestions || [];
                          const totalQ = qs.length;
                          const correctQ = qs.filter(
                            (q) => inlineAnswers[q.id] === q.correctOptionIndex
                          ).length;
                          const livePct =
                            totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;

                          return (
                            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="text-xs font-extrabold text-emerald-300">
                                    📊 Kurs Testi Natijasi va O'zlashtirish Foizi: {livePct}%
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    To'g'ri javoblar: {correctQ} / {totalQ} ta savol
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={isSubmittingQuiz}
                                  onClick={async () => {
                                    if (!currentUser) {
                                      onRequireLogin();
                                      return;
                                    }
                                    setIsSubmittingQuiz(true);
                                    try {
                                      const res = await fetch(
                                        `/api/courses/${activeCourse.id}/complete-quiz`,
                                        {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            userId: currentUser.id,
                                            partId: currentLessonPart.id,
                                            correctCount: correctQ,
                                            totalQuestions: totalQ,
                                          }),
                                        }
                                      );
                                      const data = await res.json();
                                      if (res.ok && data.success) {
                                        playKitestSound('victory', soundEnabled);
                                        setQuizResultBanner({
                                          earnedPoints: data.earnedPoints,
                                          earnedCoins: data.earnedCoins,
                                          earnedStars: data.earnedStars,
                                          percentage: data.percentage,
                                          multiplier: data.multiplier || 1,
                                        });
                                        if (data.user && onUpdateUser) {
                                          onUpdateUser(data.user);
                                        }
                                        await onRefreshState();
                                      }
                                    } catch {
                                    } finally {
                                      setIsSubmittingQuiz(false);
                                    }
                                  }}
                                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>
                                    {isSubmittingQuiz
                                      ? 'Baholanmoqda...'
                                      : '✅ Testni Baholash va Ball / Yulduz / % Olish'}
                                  </span>
                                </button>
                              </div>

                              <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                                <div
                                  style={{ width: `${livePct}%` }}
                                  className="h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-400 transition-all duration-500"
                                />
                              </div>

                              {quizResultBanner && (
                                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-400/50 text-xs text-emerald-200 font-bold flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    🎉 Dars testi yakunlandi ({quizResultBanner.percentage}%):{' '}
                                    +{quizResultBanner.earnedPoints} Ball ({quizResultBanner.multiplier}x) · +{quizResultBanner.earnedCoins} Coins · +{quizResultBanner.earnedStars} Yulduz qo'shildi!
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                </div>
              )}

              {/* Discussion / Messages below Lesson */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>
                    Dars Ostidagi Xabarlar va Savol-Javoblar ({activeCourse.comments.length})
                  </span>
                </h3>

                <form onSubmit={handlePostComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Video dars bo'yicha xabar, izoh yoki savol qoldiring..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isPostingComment || !commentText.trim()}
                    className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-extrabold text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Joylashtirish</span>
                  </button>
                </form>

                {activeCourse.comments.length > 0 && (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {activeCourse.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                      >
                        {c.userAvatarUrl ? (
                          <img
                            src={c.userAvatarUrl}
                            alt={c.userName}
                            className="w-8 h-8 rounded-lg object-cover border border-sky-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-500/40 flex items-center justify-center text-xs font-extrabold text-white shrink-0">
                            {c.userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-white">{c.userName}</span>
                            <span className="font-mono text-slate-400">@{c.username}</span>
                            {(c.userRole === 'creator' || c.userRole === 'admin') && (
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold">
                                USTOZ
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 mt-1">{c.text}</p>
                        </div>
                      </div>
                    ))}
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
