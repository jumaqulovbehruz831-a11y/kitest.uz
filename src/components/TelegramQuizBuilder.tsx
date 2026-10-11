import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, QuizQuestion, TestItem, Difficulty, ADMIN_EMAIL } from '../types';
import { KitestEmblem, playKitestSound } from './KitestEmblem';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Lightbulb,
  Code2,
  Send,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileText,
  Sparkles,
  Copy,
  Loader2,
  Wand2,
  Layers,
  Eye,
  Image as ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { KitestRotatingActionLoader } from './KitestRotatingActionLoader';

interface TelegramQuizBuilderProps {
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  adminPasscode?: string;
  soundEnabled?: boolean;
  onTestCreated: (newTest: TestItem) => void;
  onCancel: () => void;
}

const SUBJECT_LIST = [
  'Informatika va Algoritmlar',
  'Matematika',
  'Fizika',
  'Ingliz tili',
  'Ona tili va Adabiyot',
  'Tarix',
  'Kimyo',
  'Biologiya',
  'Mantiq va IQ',
];

interface DraftQuestionCard {
  id: string;
  text: string;
  showCodeField: boolean;
  codeSnippet: string;
  imageUrl?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  points: number;
}

function createEmptyQuestionCard(points = 1): DraftQuestionCard {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    text: '',
    showCodeField: false,
    codeSnippet: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
    points,
  };
}

export const TelegramQuizBuilder: React.FC<TelegramQuizBuilderProps> = ({
  currentUser,
  isAdminUnlocked = false,
  adminPasscode = '',
  soundEnabled = true,
  onTestCreated,
  onCancel,
}) => {
  // Test metadata: Test nomi, Vaqt, 1 savolga ball
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECT_LIST[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [defaultQuestionPoints, setDefaultQuestionPoints] = useState<number>(1);
  const [passingPercent, setPassingPercent] = useState<number>(60);
  const [description, setDescription] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(false);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);

  // Stacked sequential question cards: starts with 1-savol, then + adds 2-savol, + adds 3-savol, etc.
  const [questionCards, setQuestionCards] = useState<DraftQuestionCard[]>(() => [
    createEmptyQuestionCard(1),
  ]);

  // AI Question Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState<number>(3);
  const [isAiGeneratingBulk, setIsAiGeneratingBulk] = useState(false);
  const [aiLoadingCardId, setAiLoadingCardId] = useState<string | null>(null);

  // Smart Bulk Text Parser state
  const [showBulkParser, setShowBulkParser] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Interactive preview state in right sidebar
  const [activePreviewIdx, setActivePreviewIdx] = useState<number>(0);
  const [previewSelectedOption, setPreviewSelectedOption] = useState<number | null>(null);

  // Submission status
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Keyin hamma ham test yarata olmasin: faqat Admin, Creator, ruxsat olganlar yoki VIP Premium
  const isAuthorized = Boolean(
    currentUser &&
      (currentUser.role === 'admin' ||
        currentUser.role === 'creator' ||
        currentUser.permissions?.canCreateTests ||
        currentUser.isPremium ||
        isAdminUnlocked ||
        currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
  );

  const handleDefaultPointsChange = (newPts: number) => {
    const validPts = Math.max(1, newPts || 1);
    setDefaultQuestionPoints(validPts);
    setQuestionCards((prev) => prev.map((c) => ({ ...c, points: validPts })));
  };

  // Add next sequential question card (1 -> 2 -> 3 -> ...)
  const handleAddNextQuestionCard = (afterIndex?: number, countToAdd = 1) => {
    playKitestSound('click', soundEnabled);
    setError('');

    const newCards: DraftQuestionCard[] = Array.from({ length: countToAdd }, () =>
      createEmptyQuestionCard(defaultQuestionPoints)
    );

    setQuestionCards((prev) => {
      if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < prev.length) {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, ...newCards);
        return copy;
      }
      return [...prev, ...newCards];
    });

    const firstNewId = newCards[0].id;
    setTimeout(() => {
      const el = cardRefs.current[firstNewId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  const handleDuplicateCard = (idx: number) => {
    playKitestSound('click', soundEnabled);
    const source = questionCards[idx];
    const cloned: DraftQuestionCard = {
      ...source,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      options: [...source.options],
    };
    setQuestionCards((prev) => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, cloned);
      return copy;
    });
    setSuccessNotice(`${idx + 1}-savol nusxalandi -> ${idx + 2}-savol ochildi!`);
  };

  const handleRemoveQuestionCard = (idx: number) => {
    if (questionCards.length <= 1) {
      // Reset the single card if it's the only one
      setQuestionCards([createEmptyQuestionCard(defaultQuestionPoints)]);
      return;
    }
    playKitestSound('click', soundEnabled);
    setQuestionCards((prev) => prev.filter((_, i) => i !== idx));
    if (activePreviewIdx >= questionCards.length - 1) {
      setActivePreviewIdx(Math.max(0, questionCards.length - 2));
    }
  };

  const handleMoveQuestionCard = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questionCards.length) return;
    playKitestSound('click', soundEnabled);
    setQuestionCards((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const updateCard = (idx: number, updater: (card: DraftQuestionCard) => DraftQuestionCard) => {
    setQuestionCards((prev) => prev.map((c, i) => (i === idx ? updater(c) : c)));
  };

  // AI: Enhance or generate a single question card
  const handleAiFillSingleCard = async (idx: number) => {
    const card = questionCards[idx];
    setError('');
    setSuccessNotice('');
    setAiLoadingCardId(card.id);

    try {
      const res = await fetch('/api/ai/enhance-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: card.text.trim() || aiTopic.trim() || title.trim(),
          subject,
          difficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.question) {
        setError(data.error || "AI savol tuzishda xatolik yuz berdi.");
        return;
      }

      const q = data.question;
      updateCard(idx, (prev) => ({
        ...prev,
        text: q.text || prev.text,
        showCodeField: Boolean(q.codeSnippet),
        codeSnippet: q.codeSnippet || '',
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : prev.options,
        correctOptionIndex:
          typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
        explanation: q.explanation || prev.explanation,
      }));

      playKitestSound('success', soundEnabled);
      setActivePreviewIdx(idx);
      setPreviewSelectedOption(null);
      setSuccessNotice(
        `✨ ${idx + 1}-savol Sun'iy Intellekt (AI) yordamida muvaffaqiyatli to'ldirildi!`
      );
    } catch {
      setError("AI serveri bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setAiLoadingCardId(null);
    }
  };

  // AI: Read and analyze an attached question image using Multimodal Gemini ("rasmlarni hammasini oʻqi va qur")
  const handleAiAnalyzeImage = async (cardIdx: number) => {
    const card = questionCards[cardIdx];
    if (!card || !card.imageUrl) {
      setError("Iltimos, avval rasm yuklang yoki rasm URL manzilini kiriting!");
      return;
    }

    setAiLoadingCardId(card.id);
    playKitestSound('click', soundEnabled);
    try {
      const res = await fetch('/api/ai/analyze-image-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: card.imageUrl,
          subject,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.question) {
        setError(data.error || "Rasmni o'qishda xatolik yuz berdi.");
        return;
      }

      const q = data.question;
      updateCard(cardIdx, (c) => ({
        ...c,
        text: q.text || c.text,
        codeSnippet: q.codeSnippet || c.codeSnippet,
        showCodeField: Boolean(q.codeSnippet),
        options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : c.options,
        correctOptionIndex:
          typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : c.correctOptionIndex,
        explanation: q.explanation || c.explanation,
      }));

      playKitestSound('success', soundEnabled);
      setActivePreviewIdx(cardIdx);
      setPreviewSelectedOption(null);
      setSuccessNotice(
        `📸 Rasmdagi savol, variantlar va yechim AI orqali muvaffaqiyatli o'qildi va joylandi!`
      );
    } catch {
      setError("Rasmni tahlil qilishda server xatoligi yuz berdi.");
    } finally {
      setAiLoadingCardId(null);
    }
  };

  // AI: Generate multiple questions by topic and append them as sequential cards (1, 2, 3...)
  const handleAiGenerateBulkQuestions = async () => {
    setError('');
    setSuccessNotice('');
    const topicToUse = aiTopic.trim() || title.trim() || subject;

    setIsAiGeneratingBulk(true);
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic: topicToUse,
          difficulty,
          count: aiCount,
          defaultPoints: defaultQuestionPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) {
        setError(data.error || "AI orqali savollar yaratishda xatolik yuz berdi");
        return;
      }

      const newAiCards: DraftQuestionCard[] = data.questions.map((q: QuizQuestion) => ({
        id: q.id || `q_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: q.text || '',
        showCodeField: Boolean(q.codeSnippet),
        codeSnippet: q.codeSnippet || '',
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options
            : ['', '', '', ''],
        correctOptionIndex:
          typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0,
        explanation: q.explanation || '',
        points: q.points || defaultQuestionPoints,
      }));

      setQuestionCards((prev) => {
        // If the first card is completely empty, replace it; otherwise append!
        const isFirstCardEmpty =
          prev.length === 1 &&
          !prev[0].text.trim() &&
          prev[0].options.every((o) => !o.trim());
        return isFirstCardEmpty ? newAiCards : [...prev, ...newAiCards];
      });

      if (!title.trim() && aiTopic.trim()) {
        setTitle(`${subject}: ${aiTopic.trim()}`);
      }

      playKitestSound('success', soundEnabled);
      setSuccessNotice(
        `✨ Sun'iy Intellekt "${topicToUse}" mavzusida ${newAiCards.length} ta yangi savol tuzib ro'yxatga qo'shdi!`
      );
    } catch {
      setError("AI xizmati bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setIsAiGeneratingBulk(false);
    }
  };

  // Smart Bulk Text Parser
  const handleParseBulkText = () => {
    setError('');
    setSuccessNotice('');
    const blocks = bulkText
      .trim()
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);

    if (blocks.length === 0) {
      setError('Matn kiritilmadi!');
      return;
    }

    const parsedCards: DraftQuestionCard[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const lines = blocks[i]
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 3) continue;

      const questionLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      const opts: string[] = [];
      let rightIdx = 0;

      for (let j = 1; j < lines.length; j++) {
        let line = lines[j];
        const isCorrectMarked = line.startsWith('*') || line.startsWith('+');
        if (isCorrectMarked) {
          line = line.replace(/^[\*\+]\s*/, '');
        }
        line = line.replace(/^[A-Za-z][\.\)]\s*/, '').trim();
        if (line) {
          if (isCorrectMarked) {
            rightIdx = opts.length;
          }
          opts.push(line);
        }
      }

      if (questionLine && opts.length >= 2) {
        parsedCards.push({
          id: `q_bulk_${Date.now()}_${i}`,
          text: questionLine,
          showCodeField: false,
          codeSnippet: '',
          options: opts.slice(0, 10),
          correctOptionIndex: rightIdx,
          explanation: '',
          points: defaultQuestionPoints,
        });
      }
    }

    if (parsedCards.length === 0) {
      setError(
        "Savollar formatini tekshiring (1-qator savol, keyingi qatorlar variantlar, to'g'ri javob oldiga * belgisi qo'ying)."
      );
      return;
    }

    setQuestionCards((prev) => {
      const isFirstEmpty =
        prev.length === 1 &&
        !prev[0].text.trim() &&
        prev[0].options.every((o) => !o.trim());
      return isFirstEmpty ? parsedCards : [...prev, ...parsedCards];
    });
    setBulkText('');
    setShowBulkParser(false);
    playKitestSound('success', soundEnabled);
    setSuccessNotice(`${parsedCards.length} ta savol muvaffaqiyatli qo'shildi!`);
  };

  const handlePublishTest = async () => {
    setError('');
    setSuccessNotice('');

    const effectiveTitle =
      title.trim() ||
      (aiTopic.trim() ? `AI Test: ${aiTopic.trim()}` : `${subject} Testi`);
    if (!title.trim()) {
      setTitle(effectiveTitle);
    }

    // Validate all cards that have content (or report which card number needs fixing)
    const finalQuestions: QuizQuestion[] = [];

    for (let i = 0; i < questionCards.length; i++) {
      const card = questionCards[i];
      const nonEmptyWithOriginalIdx = card.options
        .map((text, idx) => ({ text: text.trim(), idx }))
        .filter((item) => item.text.length > 0);

      const isCompletelyEmpty =
        !card.text.trim() && nonEmptyWithOriginalIdx.length === 0;

      // If user opened an extra blank card at the end and left it empty, skip it if there is at least 1 valid question
      if (isCompletelyEmpty && questionCards.length > 1) {
        continue;
      }

      if (!card.text.trim()) {
        setError(`${i + 1}-savol matnini kiriting!`);
        const el = cardRefs.current[card.id];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (nonEmptyWithOriginalIdx.length < 2) {
        setError(`${i + 1}-savolda kamida 2 ta javob variantini to'ldiring!`);
        const el = cardRefs.current[card.id];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const mappedCorrectIdx = nonEmptyWithOriginalIdx.findIndex(
        (item) => item.idx === card.correctOptionIndex
      );
      const finalCorrectIdx = mappedCorrectIdx >= 0 ? mappedCorrectIdx : 0;

      finalQuestions.push({
        id: card.id,
        text: card.text.trim(),
        codeSnippet:
          card.showCodeField && card.codeSnippet.trim()
            ? card.codeSnippet.trim()
            : undefined,
        imageUrl: card.imageUrl?.trim() || undefined,
        options: nonEmptyWithOriginalIdx.map((item) => item.text),
        correctOptionIndex: finalCorrectIdx,
        explanation: card.explanation.trim() ? card.explanation.trim() : undefined,
        points: Math.max(1, Number(card.points) || defaultQuestionPoints || 1),
      });
    }

    if (finalQuestions.length === 0) {
      setError(
        "Testni saqlash uchun kamida 1 ta savol matni va 2 ta javob variantini yozing!"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': isAdminUnlocked ? adminPasscode || '23291031sila' : '',
        },
        body: JSON.stringify({
          title: effectiveTitle,
          subject,
          difficulty,
          description: description.trim(),
          durationMinutes: Math.max(1, Number(durationMinutes) || 30),
          passingPercent: Number(passingPercent) || 60,
          shuffleQuestions,
          showExplanations,
          questions: finalQuestions,
          authorName: currentUser?.name || 'KITEST Foydalanuvchisi',
          authorEmail: currentUser?.email || ADMIN_EMAIL,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Testni saqlashda xatolik yuz berdi');
        setIsSubmitting(false);
        return;
      }

      playKitestSound('finish', soundEnabled);
      onTestCreated(data.test);
    } catch {
      setError('Server bilan bog‘lanishda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPoints = questionCards.reduce(
    (sum, q) => sum + (Number(q.points) || defaultQuestionPoints || 1),
    0
  );
  const previewCard =
    questionCards[activePreviewIdx] || questionCards[0] || createEmptyQuestionCard(1);

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-purple-500/40 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              Test Yaratish Cheklangan
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              Platforma sifatini ta'minlash maqsadida test yaratish faqat <strong>Tasdiqlangan Test Yaratuvchilar</strong>, <strong>Ustozlar</strong> yoki <strong>👑 VIP Premium</strong> a'zolar uchun ochiq.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5 text-left">
            <div className="font-bold text-slate-200">Qanday qilib ruxsat olish mumkin?</div>
            <div>• Bosh Admin bilan bog'lanib 'Creator' maqomini olish;</div>
            <div>• Yoki 1000 ball / Bank karta orqali VIP Premium a'zo bo'lish (kunlik test yaratish huquqi beriladi).</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all cursor-pointer"
            >
              Orqaga qaytish
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!currentUser) return;
                try {
                  await fetch('/api/creators/request', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.id, note: "Test yaratish uchun ruxsat so'rovi" }),
                  });
                  alert("Ruxsat so'rovingiz Bosh Adminga yuborildi!");
                } catch {}
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-black text-white transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Admindan Ruxsat So'rash
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <KitestEmblem size="sm" showVerifiedSeal={true} />
          <div>
            <div className="text-xs text-sky-400 font-medium flex items-center gap-1.5">
              <span>Ketma-ket Savollar Konstruktori + Sun'iy Intellekt</span>
              <span>·</span>
              <span>Yaratuvchi: {currentUser?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Yangi Test Yaratish ({questionCards.length} ta savol)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBulkParser(!showBulkParser)}
            className="py-2 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-sky-400 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showBulkParser ? 'Yopish' : 'Matndan tezkor qo‘shish'}</span>
          </button>

          <button
            onClick={onCancel}
            className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            Bekor qilish
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublishTest}
            disabled={isSubmitting}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-extrabold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/25"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Saqlanmoqda...'
                : `💾 Saqlash va Nashr Qilish (${questionCards.length} savol · ${totalPoints} ball)`}
            </span>
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="mt-6 p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 8 COLUMNS: Test Settings + AI Generator + Stacked Question Cards (1, 2, 3...) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 01. Test Nomi, Fan, Vaqt va Ball */}
          <section className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                01. Test nomi, fani va vaqti
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                Jami: {questionCards.length} ta savol · {totalPoints} ball
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Test nomi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Matematika CHSB 1-chorak yakuniy testi"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Fan / Yo'nalish
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  {SUBJECT_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Qiyinchilik
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Oson">Oson</option>
                  <option value="O'rta">O'rta</option>
                  <option value="Qiyin">Qiyin</option>
                  <option value="Olimpiada">Olimpiada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Vaqt (daq)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white font-mono text-center focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    1 savol bali
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={defaultQuestionPoints}
                    onChange={(e) => handleDefaultPointsChange(Number(e.target.value))}
                    className="w-full px-2.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-emerald-400 font-bold font-mono text-center focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-slate-800/80">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Savollar tartibini aralashtirish</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showExplanations}
                  onChange={(e) => setShowExplanations(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                />
                <span>Yakunlangach javob izohlarini ko'rsatish</span>
              </label>
            </div>
          </section>

          {/* SUN'IY INTELLEKT (AI) SAVOL GENERATORI */}
          <section className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-sky-950/60 border border-sky-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>KITEST Sun'iy Intellekt (AI) Test Generatori</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      AI Yordamchi
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Mavzuni yozing va AI sizga tayyor variantlar, to'g'ri javob va izohlar bilan savollarni ketma-ket tuzib beradi.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder={`Mavzuni yozing (masalan: "${subject} bo'yicha olimpiada savollari" yoki "Kvadrat tenglamalar")`}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950/90 border border-slate-700 text-xs sm:text-sm text-white font-semibold focus:outline-none focus:border-sky-400"
                >
                  <option value={1}>+1 ta savol</option>
                  <option value={3}>+3 ta savol</option>
                  <option value={5}>+5 ta savol</option>
                  <option value={10}>+10 ta savol</option>
                  <option value={15}>+15 ta savol</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleAiGenerateBulkQuestions}
                  disabled={isAiGeneratingBulk}
                  className="w-full h-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20"
                >
                  {isAiGeneratingBulk ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI tuzmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>AI Savol Tuzish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Optional Bulk Text Parser */}
          <AnimatePresence>
            {showBulkParser && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-6 rounded-xl bg-slate-900 border border-sky-500/40 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Matndan bir nechta savolni avtomatik qo'shish
                  </h3>
                  <span className="text-[11px] text-sky-400">
                    To'g'ri javob oldiga * belgisini qo'ying
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`1. O'zbekiston poytaxti qaysi shahar?\n*A) Toshkent\nB) Samarqand\nC) Buxoro\n\n2. 5 * 8 nechaga teng?\nA) 35\n*B) 40\nC) 45`}
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseBulkText}
                    className="py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white"
                  >
                    Savollarni ajratib ro'yxatga qo'shish
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* STACKED SEQUENTIAL QUESTION CARDS: 1-savol, 2-savol, 3-savol... */}
          <div className="space-y-6">
            {questionCards.map((card, cardIdx) => {
              const questionNumber = cardIdx + 1;
              const nextQuestionNumber = cardIdx + 2;
              const isAiBusy = aiLoadingCardId === card.id;

              return (
                <motion.div
                  key={card.id}
                  ref={(el) => {
                    cardRefs.current[card.id] = el;
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    if (activePreviewIdx !== cardIdx) {
                      setActivePreviewIdx(cardIdx);
                      setPreviewSelectedOption(null);
                    }
                  }}
                  className={`p-6 rounded-xl bg-[#0e1726] border transition-all space-y-5 ${
                    activePreviewIdx === cardIdx
                      ? 'border-sky-500/70 shadow-lg shadow-sky-950/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Top Header: Savol #1, AI Fill button, Points, Move/Duplicate/Delete */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/90">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                        {questionNumber}-SAVOL
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        Telegram Quiz Viktorina Savoli #{questionNumber}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* AI Auto-Fill / Generate for this specific card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAiFillSingleCard(cardIdx);
                        }}
                        disabled={isAiBusy}
                        className="py-1.5 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-semibold text-sky-300 transition-colors flex items-center gap-1.5"
                        title="Sun'iy intellekt yordamida shu savolni va variantlarini avtomatik tuzish"
                      >
                        {isAiBusy ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>AI tuzmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                            <span>
                              {card.text.trim()
                                ? 'AI bilan variantlarni to‘ldirish'
                                : 'AI savol tuzib bersin'}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Points for this question */}
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        <span className="text-[11px] text-slate-400">Ball:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={card.points}
                          onChange={(e) =>
                            updateCard(cardIdx, (c) => ({
                              ...c,
                              points: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-12 bg-transparent text-xs font-mono font-bold text-emerald-400 text-center focus:outline-none"
                        />
                      </div>

                      {/* Move Up / Down / Duplicate / Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestionCard(cardIdx, 'up');
                          }}
                          disabled={cardIdx === 0}
                          title="Yuqoriga ko'tarish"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestionCard(cardIdx, 'down');
                          }}
                          disabled={cardIdx === questionCards.length - 1}
                          title="Pastga tushirish"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateCard(cardIdx);
                          }}
                          title="Shu savoldan nusxa olish"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-sky-400"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {questionCards.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveQuestionCard(cardIdx);
                            }}
                            title={`${questionNumber}-savolni o'chirish`}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Question Text Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-200">
                        {questionNumber}-savol matnini yozing *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateCard(cardIdx, (c) => ({
                            ...c,
                            showCodeField: !c.showCodeField,
                          }))
                        }
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>
                          {card.showCodeField
                            ? 'Kod blokini yashirish'
                            : '+ Kod / Formula qo‘shish'}
                        </span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={card.text}
                      onChange={(e) =>
                        updateCard(cardIdx, (c) => ({ ...c, text: e.target.value }))
                      }
                      placeholder={`${questionNumber}-savol matnini kiriting (yoki mavzu yozib tepasidagi "AI bilan to'ldirish" tugmasini bosing)...`}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {card.showCodeField && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Dastur kodi yoki matematik formula
                      </label>
                      <textarea
                        rows={3}
                        value={card.codeSnippet}
                        onChange={(e) =>
                          updateCard(cardIdx, (c) => ({
                            ...c,
                            codeSnippet: e.target.value,
                          }))
                        }
                        placeholder="print(2 + 2 * 2)"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}

                  {/* Savol Rasmi / Diagrammasi (Read and Build Images) */}
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Savolga rasm / chizma / diagramma biriktirish (Ixtiyoriy)</span>
                      </label>
                      {card.imageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            updateCard(cardIdx, (c) => ({ ...c, imageUrl: undefined }))
                          }
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Rasmni o'chirish</span>
                        </button>
                      )}
                    </div>

                    {card.imageUrl ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 max-h-48 flex items-center justify-center p-2">
                          <img
                            src={card.imageUrl}
                            alt={`${questionNumber}-savol rasmi`}
                            className="max-h-44 object-contain rounded"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAiAnalyzeImage(cardIdx)}
                          disabled={aiLoadingCardId === card.id}
                          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {aiLoadingCardId === card.id
                              ? "AI rasmni o'qimoqda va tahlil qilmoqda..."
                              : "✨ AI bilan rasmni o'qish (savol va javoblarni chiqarish)"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <label className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0">
                          <Upload className="w-3.5 h-3.5 text-sky-400" />
                          <span>Fayldan rasm yuklash</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                const result = reader.result as string;
                                updateCard(cardIdx, (c) => ({ ...c, imageUrl: result }));
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                        <input
                          type="url"
                          placeholder="Yoki rasm URL manzilini kiriting (https://...)"
                          value={card.imageUrl || ''}
                          onChange={(e) =>
                            updateCard(cardIdx, (c) => ({
                              ...c,
                              imageUrl: e.target.value.trim() || undefined,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Options List (A, B, C, D...) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Javob variantlari (Chapdagi doirachani bosib{' '}
                        <span className="text-emerald-400 font-semibold">TO'G'RI JAVOBNI</span>{' '}
                        belgilang)
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {card.options.length} / 10 variant
                      </span>
                    </div>

                    <div className="space-y-2">
                      {card.options.map((opt, optIdx) => {
                        const isCorrect = card.correctOptionIndex === optIdx;
                        const letter = String.fromCharCode(65 + optIdx);
                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                              isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/70'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                playKitestSound('click', soundEnabled);
                                updateCard(cardIdx, (c) => ({
                                  ...c,
                                  correctOptionIndex: optIdx,
                                }));
                              }}
                              title="To'g'ri javob sifatida belgilash"
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'border-2 border-slate-600 hover:border-sky-400 text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            <span className="text-xs font-mono font-semibold text-slate-400 w-5">
                              {letter})
                            </span>

                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateCard(cardIdx, (c) => {
                                  const nextOpts = [...c.options];
                                  nextOpts[optIdx] = val;
                                  return { ...c, options: nextOpts };
                                });
                              }}
                              placeholder={`${questionNumber}-savolning ${letter}-variant javobini yozing...`}
                              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                            />

                            {isCorrect && (
                              <span className="text-[11px] font-semibold text-emerald-400 px-2 shrink-0">
                                To'g'ri javob
                              </span>
                            )}

                            {card.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateCard(cardIdx, (c) => {
                                    const filtered = c.options.filter(
                                      (_, i) => i !== optIdx
                                    );
                                    let nextCorrect = c.correctOptionIndex;
                                    if (nextCorrect === optIdx) nextCorrect = 0;
                                    else if (nextCorrect > optIdx)
                                      nextCorrect = nextCorrect - 1;
                                    return {
                                      ...c,
                                      options: filtered,
                                      correctOptionIndex: nextCorrect,
                                    };
                                  });
                                }}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Variantni o'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {card.options.length < 10 && (
                      <button
                        type="button"
                        onClick={() => {
                          updateCard(cardIdx, (c) => ({
                            ...c,
                            options: [...c.options, ''],
                          }));
                        }}
                        className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-700 hover:border-sky-500/60 text-xs font-medium text-sky-400 hover:bg-sky-950/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Variant qo'shish ({String.fromCharCode(65 + card.options.length)})</span>
                      </button>
                    )}
                  </div>

                  {/* Explanation Field */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tushuntirish / Izoh (ixtiyoriy)</span>
                    </label>
                    <input
                      type="text"
                      value={card.explanation}
                      onChange={(e) =>
                        updateCard(cardIdx, (c) => ({
                          ...c,
                          explanation: e.target.value,
                        }))
                      }
                      placeholder="Ishtirokchi javob berganda ko'rinadigan yechim izohi..."
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* BOTTOM OF THIS QUESTION CARD: "+ Keyingi testni (savolni) qo'shish -> 2-savol / 3-savol..." */}
                  <div className="pt-3 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400">
                      {questionNumber}-savol tayyormi? Pastdagi tugma orqali keyingi savolni qo'shing:
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNextQuestionCard(cardIdx, 1);
                        }}
                        className="py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-md shadow-sky-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          + Test Savoli Qo'shish ({nextQuestionNumber}-savolni ochish)
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* BIG BOTTOM BAR TO ADD MORE QUESTIONS (e.g., +1 savol, +3 savol, +5 savol) */}
          <div className="p-5 rounded-xl bg-slate-900/90 border-2 border-dashed border-sky-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">
                Savollar sonini ko'paytirish (Hozir: {questionCards.length} ta savol)
              </div>
              <div className="text-xs text-slate-400">
                Tugmani har bosganingizda pastidan yangi {questionCards.length + 1}-savol, keyin {questionCards.length + 2}-savol ochilib boraveradi.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAddNextQuestionCard(undefined, 1)}
                className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ {questionCards.length + 1}-savolni qo'shish</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNextQuestionCard(undefined, 3)}
                className="py-2.5 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-300 transition-colors flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+3 ta savol</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddNextQuestionCard(undefined, 5)}
                className="py-2.5 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-300 transition-colors flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+5 ta savol</span>
              </button>
            </div>
          </div>

          {/* BOTTOM SAVE & EXIT ACTION BAR */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
            <button
              type="button"
              onClick={onCancel}
              className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/40 text-xs font-bold text-slate-200 transition-colors"
            >
              ✕ Chiqish / Bekor qilish
            </button>

            <button
              type="button"
              onClick={handlePublishTest}
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs sm:text-sm font-extrabold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/25"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saqlanmoqda...'
                  : `💾 Testni Saqlash va Nashr Qilish (${questionCards.length} ta savol · ${totalPoints} ball)`}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: Sticky Live Preview + Quick Question Navigator */}
        <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          {/* Quick Question Number Grid Navigator */}
          <section className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Savollar xaritasi ({questionCards.length} ta)
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {totalPoints} ball
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questionCards.map((c, idx) => {
                const isFilled =
                  c.text.trim().length > 0 &&
                  c.options.filter((o) => o.trim().length > 0).length >= 2;
                const isCurrent = activePreviewIdx === idx;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActivePreviewIdx(idx);
                      setPreviewSelectedOption(null);
                      const el = cardRefs.current[c.id];
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`py-2 rounded-lg font-mono text-xs font-bold border transition-all ${
                      isCurrent
                        ? 'bg-sky-600 border-sky-400 text-white shadow-md shadow-sky-600/30'
                        : isFilled
                        ? 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleAddNextQuestionCard(undefined, 1)}
                title="Yangi savol qo'shish"
                className="py-2 rounded-lg font-mono text-xs font-bold border border-dashed border-sky-500/50 text-sky-400 hover:bg-sky-950/30 flex items-center justify-center"
              >
                +{questionCards.length + 1}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePublishTest}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Saqlanmoqda...'
                    : `💾 Testni Saqlash va Nashr Qilish (${questionCards.length} ta savol)`}
                </span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                ✕ Chiqish / Bekor qilish
              </button>
            </div>
          </section>

          {/* Live Telegram Quiz Card Preview for Active Question */}
          <section className="p-5 rounded-xl bg-[#17212b] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{activePreviewIdx + 1}-savol jonli ko'rinishi</span>
              </span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                +{previewCard.points} ball
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#182533] border border-slate-700/60 space-y-3">
              <div className="text-[11px] font-medium text-sky-400 flex items-center justify-between">
                <span>
                  Savol #{activePreviewIdx + 1} / {questionCards.length} · Quiz Mode
                </span>
                {previewCard.explanation.trim() && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Izoh bor</span>
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-white whitespace-pre-wrap">
                {previewCard.text.trim() ||
                  `${activePreviewIdx + 1}-savol matni shu yerda ko'rinadi...`}
              </div>

              {previewCard.showCodeField && previewCard.codeSnippet.trim() && (
                <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {previewCard.codeSnippet}
                </pre>
              )}

              <div className="space-y-2 pt-1">
                {previewCard.options.map((opt, idx) => {
                  const isPicked = previewSelectedOption === idx;
                  const isRight = previewCard.correctOptionIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playKitestSound(isRight ? 'success' : 'click', soundEnabled);
                        setPreviewSelectedOption(idx);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                        previewSelectedOption !== null
                          ? isRight
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                            : isPicked
                            ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt.trim() || `${idx + 1}-variant`}</span>
                      </span>
                      {previewSelectedOption !== null && isRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {previewSelectedOption !== null && previewCard.explanation.trim() && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{previewCard.explanation}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Rotating Action Loader during Test Creation & AI Generation */}
      <KitestRotatingActionLoader
        isOpen={isSubmitting || isAiGeneratingBulk}
        variant={isAiGeneratingBulk ? 'ai' : 'test'}
        title={
          isAiGeneratingBulk
            ? "Gemini AI savollar tuzmoqda"
            : "Yangi test yaratilmoqda"
        }
        subtitle={
          isAiGeneratingBulk
            ? "Sun'iy intellekt mavzu bo'yicha ilmiy savollar, javoblar va izohlarni shakllantirmoqda..."
            : "Test bazaga kiritilmoqda, savollar tekshirilmoqda va platformaga yuklanmoqda..."
        }
      />
    </motion.div>
  );
};
