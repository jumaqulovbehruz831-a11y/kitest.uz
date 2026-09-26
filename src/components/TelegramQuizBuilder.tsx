import React, { useState } from 'react';
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
  Edit3,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TelegramQuizBuilderProps {
  currentUser: User | null;
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

export const TelegramQuizBuilder: React.FC<TelegramQuizBuilderProps> = ({
  currentUser,
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

  // Saved questions in this quiz pack
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Active question being edited in the Telegram Quiz Poll composer
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [showCodeField, setShowCodeField] = useState(false);
  const [qCode, setQCode] = useState('');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qPoints, setQPoints] = useState<number>(1);

  // Smart Bulk Text Parser state
  const [showBulkParser, setShowBulkParser] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Interactive preview test state
  const [previewSelected, setPreviewSelected] = useState<number | null>(null);

  // Submission status
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthorized =
    Boolean(currentUser) &&
    (currentUser!.email.toLowerCase() === ADMIN_EMAIL ||
      currentUser!.role === 'creator' ||
      currentUser!.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          Test yaratish faqat Test Yaratuvchilar uchun
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Faqat KITEST Bosh Admini ({ADMIN_EMAIL}) tomonidan tasdiqlangan Yaratuvchilar yangi test qo'sha oladi.
        </p>
        <button
          onClick={onCancel}
          className="py-2 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors"
        >
          Orqaga qaytish
        </button>
      </div>
    );
  }

  const handleDefaultPointsChange = (newPts: number) => {
    const validPts = Math.max(1, newPts || 1);
    setDefaultQuestionPoints(validPts);
    setQPoints(validPts);
    setQuestions((prev) => prev.map((q) => ({ ...q, points: validPts })));
  };

  const resetQuestionComposer = () => {
    setEditingIndex(null);
    setQText('');
    setShowCodeField(false);
    setQCode('');
    setQOptions(['', '', '', '']);
    setQCorrectIndex(0);
    setQExplanation('');
    setQPoints(defaultQuestionPoints);
    setPreviewSelected(null);
    setError('');
  };

  const handleAddOption = () => {
    if (qOptions.length >= 10) return;
    setQOptions([...qOptions, '']);
  };

  const handleRemoveOption = (idx: number) => {
    if (qOptions.length <= 2) return;
    const updated = qOptions.filter((_, i) => i !== idx);
    setQOptions(updated);
    if (qCorrectIndex === idx) {
      setQCorrectIndex(0);
    } else if (qCorrectIndex > idx) {
      setQCorrectIndex(qCorrectIndex - 1);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...qOptions];
    updated[idx] = val;
    setQOptions(updated);
  };

  const handleSaveQuestionToList = () => {
    setError('');
    setSuccessNotice('');
    if (!qText.trim()) {
      setError('Savol matnini kiriting!');
      return;
    }

    // Filter non-empty options while keeping track of the selected correct option
    const nonEmptyWithOriginalIdx = qOptions
      .map((text, idx) => ({ text: text.trim(), idx }))
      .filter((item) => item.text.length > 0);

    if (nonEmptyWithOriginalIdx.length < 2) {
      setError("Kamida 2 ta javob variantini to'ldiring!");
      return;
    }

    const mappedCorrectIdx = nonEmptyWithOriginalIdx.findIndex(
      (item) => item.idx === qCorrectIndex
    );
    const finalCorrectIdx = mappedCorrectIdx >= 0 ? mappedCorrectIdx : 0;

    const newQuestion: QuizQuestion = {
      id:
        editingIndex !== null
          ? questions[editingIndex].id
          : `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: qText.trim(),
      codeSnippet: showCodeField && qCode.trim() ? qCode.trim() : undefined,
      options: nonEmptyWithOriginalIdx.map((item) => item.text),
      correctOptionIndex: finalCorrectIdx,
      explanation: qExplanation.trim() ? qExplanation.trim() : undefined,
      points: Math.max(1, Number(qPoints) || defaultQuestionPoints || 1),
    };

    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = newQuestion;
      setQuestions(updated);
      setSuccessNotice(`${editingIndex + 1}-savol yangilandi!`);
    } else {
      setQuestions([...questions, newQuestion]);
      setSuccessNotice(`Savol #${questions.length + 1} ro'yxatga qo'shildi!`);
    }

    playKitestSound('success', soundEnabled);
    resetQuestionComposer();
  };

  // Smart Bulk Text Parser (e.g. pastes multiple questions with * marking the correct option)
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

    const parsedQuestions: QuizQuestion[] = [];
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
        parsedQuestions.push({
          id: `q_bulk_${Date.now()}_${i}`,
          text: questionLine,
          options: opts.slice(0, 10),
          correctOptionIndex: rightIdx,
          points: defaultQuestionPoints,
        });
      }
    }

    if (parsedQuestions.length === 0) {
      setError(
        "Savollar formatini tekshiring (1-qator savol, keyingi qatorlar variantlar, to'g'ri javob oldiga * belgisi qo'ying)."
      );
      return;
    }

    setQuestions((prev) => [...prev, ...parsedQuestions]);
    setBulkText('');
    setShowBulkParser(false);
    playKitestSound('success', soundEnabled);
    setSuccessNotice(`${parsedQuestions.length} ta savol muvaffaqiyatli qo'shildi!`);
  };

  const handleEditQuestion = (idx: number) => {
    const target = questions[idx];
    setEditingIndex(idx);
    setQText(target.text);
    setShowCodeField(Boolean(target.codeSnippet));
    setQCode(target.codeSnippet || '');
    setQOptions(
      target.options.length >= 2 ? [...target.options] : [...target.options, '']
    );
    setQCorrectIndex(target.correctOptionIndex);
    setQExplanation(target.explanation || '');
    setQPoints(target.points);
    setPreviewSelected(null);
    setError('');
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
    if (editingIndex === idx) {
      resetQuestionComposer();
    }
  };

  const handleMoveQuestion = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setQuestions(copy);
  };

  const handlePublishTest = async () => {
    setError('');

    let finalQuestions = [...questions];

    // Automatically include the question currently typed in the form if it has text + at least 2 non-empty options!
    const currentNonEmptyOpts = qOptions
      .map((text, idx) => ({ text: text.trim(), idx }))
      .filter((item) => item.text.length > 0);

    if (qText.trim() && currentNonEmptyOpts.length >= 2) {
      const mappedRight = currentNonEmptyOpts.findIndex(
        (item) => item.idx === qCorrectIndex
      );
      const pendingQ: QuizQuestion = {
        id:
          editingIndex !== null
            ? questions[editingIndex].id
            : `q_${Date.now()}_auto`,
        text: qText.trim(),
        codeSnippet: showCodeField && qCode.trim() ? qCode.trim() : undefined,
        options: currentNonEmptyOpts.map((item) => item.text),
        correctOptionIndex: mappedRight >= 0 ? mappedRight : 0,
        explanation: qExplanation.trim() ? qExplanation.trim() : undefined,
        points: Math.max(1, Number(qPoints) || defaultQuestionPoints || 1),
      };
      if (editingIndex !== null) {
        finalQuestions[editingIndex] = pendingQ;
      } else {
        finalQuestions.push(pendingQ);
      }
    }

    if (!title.trim()) {
      setError('Test nomini kiriting (1-bo‘limda)!');
      return;
    }

    if (finalQuestions.length === 0) {
      setError(
        "Testni saqlash uchun savol matni va kamida 2 ta javob variantini yozing!"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
        },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          difficulty,
          description: description.trim(),
          durationMinutes: Math.max(1, Number(durationMinutes) || 30),
          passingPercent: Number(passingPercent) || 60,
          shuffleQuestions,
          showExplanations,
          questions: finalQuestions,
          authorEmail: currentUser?.email,
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

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <KitestEmblem size="sm" showVerifiedSeal={true} />
          <div>
            <div className="text-xs text-sky-400 font-medium">
              Telegram Quiz Konstruktori · Yaratuvchi: {currentUser?.name}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Yangi Test Yaratish
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBulkParser(!showBulkParser)}
            className="py-2 px-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-sky-400 transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showBulkParser ? 'Oddiy rejim' : 'Matndan tezkor qo‘shish'}</span>
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
            className="py-2.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Saqlanmoqda...'
                : `Testni Saqlash va Nashr Qilish (${questions.length} savol)`}
            </span>
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="mt-6 p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-700/70 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Test Settings + Telegram Quiz Question Composer */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Test Nomi, Vaqti va 1 savolga ball */}
          <section className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">
              01. Test nomi, vaqti va 1 savolga beriladigan ball
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Test nomi *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Matematika CHSB 1-chorak testi"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Test vaqti (daqiqada) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  1 ta savolga ball *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={defaultQuestionPoints}
                  onChange={(e) => handleDefaultPointsChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-emerald-400 font-bold font-mono tabular-nums focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
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

          {/* Step 2: Telegram Quiz Mode Question Builder */}
          <section className="p-6 rounded-xl bg-[#0e1726] border border-sky-500/30 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-sky-400">
                  Telegram Quiz Mode · Viktorina savoli
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingIndex !== null
                    ? `${editingIndex + 1}-savolni tahrirlash`
                    : `02. Savol #${questions.length + 1} qo'shish`}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">Shu savol bali:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={qPoints}
                  onChange={(e) => setQPoints(Number(e.target.value))}
                  className="w-16 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono tabular-nums text-emerald-400 font-bold text-center focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Question Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Savolni yozing *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCodeField(!showCodeField)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{showCodeField ? 'Kod blokini yashirish' : '+ Kod / Formula qo‘shish'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Telegram Quiz savolini kiriting..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {showCodeField && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Dastur kodi yoki matematik ifoda
                </label>
                <textarea
                  rows={3}
                  value={qCode}
                  onChange={(e) => setQCode(e.target.value)}
                  placeholder="print(2 + 2 * 2)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}

            {/* Answer Options (Telegram Quiz Radio Style) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Javob variantlari (Chapdagi doirachani bosib TO'G'RI JAVOBNI belgilang)
                </label>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  {qOptions.length} / 10 variant
                </span>
              </div>

              <div className="space-y-2">
                {qOptions.map((opt, idx) => {
                  const isCorrect = qCorrectIndex === idx;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <motion.div
                      key={idx}
                      layout
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
                          setQCorrectIndex(idx);
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
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`${letter}-variant javobini yozing...`}
                        className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                      />

                      {isCorrect && (
                        <span className="text-[11px] font-semibold text-emerald-400 px-2">
                          To'g'ri javob
                        </span>
                      )}

                      {qOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Variantni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {qOptions.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-700 hover:border-sky-500/60 text-xs font-medium text-sky-400 hover:bg-sky-950/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Variant qo'shish</span>
                </button>
              )}
            </div>

            {/* Telegram Quiz Explanation Field */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Tushuntirish / Izoh (Telegram Quiz Izohi - ixtiyoriy)</span>
              </label>
              <input
                type="text"
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                placeholder="Foydalanuvchi javob berganda ko'rinadigan tushuntirish..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={resetQuestionComposer}
                  className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Bekor qilish
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSaveQuestionToList}
                className="py-2.5 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {editingIndex !== null
                    ? 'Savol o‘zgarishini saqlash'
                    : '+ Savolni ro‘yxatga qo‘shish'}
                </span>
              </motion.button>
            </div>
          </section>
        </div>

        {/* Right 5 Columns: Live Telegram Quiz Preview & Questions Queue */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Telegram Quiz Card Preview */}
          <section className="p-5 rounded-xl bg-[#17212b] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Telegram Quiz jonli sinov ko'rinishi</span>
              <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                +{qPoints} ball
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#182533] border border-slate-700/60 space-y-3">
              <div className="text-[11px] font-medium text-sky-400 flex items-center justify-between">
                <span>Viktorina · Quiz Mode</span>
                {qExplanation.trim() && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Izoh bor</span>
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-white whitespace-pre-wrap">
                {qText.trim() || 'Savol matni shu yerda ko‘rinadi...'}
              </div>

              {showCodeField && qCode.trim() && (
                <pre className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-emerald-300 overflow-x-auto">
                  {qCode}
                </pre>
              )}

              <div className="space-y-2 pt-1">
                {qOptions.map((opt, idx) => {
                  const isPicked = previewSelected === idx;
                  const isRight = qCorrectIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playKitestSound(isRight ? 'success' : 'click', soundEnabled);
                        setPreviewSelected(idx);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                        previewSelected !== null
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
                      {previewSelected !== null && isRight && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Added Questions Queue */}
          <section className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Qo'shilgan savollar ({questions.length} ta)
              </h3>
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                Umumiy ball: <span className="text-emerald-400 font-bold">{totalPoints} ball</span>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Hozircha savol qo'shilmagan. Savol va variantlarni yozib, "+ Savolni ro'yxatga qo'shish" tugmasini bosing.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      editingIndex === idx
                        ? 'bg-sky-950/30 border-sky-500/60'
                        : 'bg-slate-950 border-slate-800/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-white line-clamp-2">
                        <span className="font-mono text-emerald-400 mr-1.5">
                          #{idx + 1}
                        </span>
                        {q.text}
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-emerald-400 font-semibold shrink-0">
                        {q.points} ball
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {q.options.length} variant · To'g'ri:{' '}
                        <strong className="text-emerald-400">
                          {String.fromCharCode(65 + q.correctOptionIndex)}
                        </strong>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(idx)}
                          className="p-1 text-sky-400 hover:text-sky-300"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
};
