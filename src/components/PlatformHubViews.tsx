import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  TestItem,
  CourseItem,
  StudyPlan,
  StudyPlanStep,
  AlgorithmTopic,
  Classroom,
  BlogPost,
  TeamMember,
  Difficulty,
  ADMIN_EMAIL,
  OFFICIAL_YOUTUBE_URL,
  FOUNDER_PORTRAIT_URL,
} from '../types';
import {
  KIDTEST_LOGO_DATA_URL,
  AnimatedWords,
  playKitestSound,
} from './KitestEmblem';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  BookOpen,
  Cpu,
  Compass,
  GraduationCap,
  FileText,
  HelpCircle,
  Users,
  PlusCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Play,
  ArrowRight,
  Trash2,
  Save,
  X,
  Sparkles,
  Trophy,
  Zap,
  Award,
  Heart,
  MessageSquare,
  Send,
  Upload,
  Camera,
  Youtube,
  ExternalLink,
  Crown,
  ShieldCheck,
  Code2,
  Layers,
  Target,
  KeyRound,
  Edit3,
} from 'lucide-react';

// ============================================================================
// 1. O'QUV REJALARI (STUDY PLANS VIEW)
// ============================================================================
interface StudyPlansViewProps {
  studyPlans: StudyPlan[];
  tests: TestItem[];
  courses?: CourseItem[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onSelectTest: (test: TestItem) => void;
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
  onUpdateUser?: (user: User) => void;
}

export const StudyPlansView: React.FC<StudyPlansViewProps> = ({
  studyPlans,
  tests,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onSelectTest,
  onNavigateTab,
  onNavigate,
  onRequireLogin,
  onRefreshState,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.role === 'creator' ||
          currentUser.role === 'admin' ||
          currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    studyPlans[0]?.id || null
  );
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika va Algoritmlar');
  const [level, setLevel] = useState<Difficulty>("O'rta");
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<StudyPlanStep[]>([
    {
      id: `step_${Date.now()}_1`,
      stepNumber: 1,
      title: '1-bosqich: Nazariy asoslar va kirish',
      description: 'Mavzu bo‘yicha asosiy qoidalarni o‘rganish va mashq bajarish',
      type: 'practice',
      targetPoints: 10,
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activePlan =
    studyPlans.find((p) => p.id === selectedPlanId) || studyPlans[0] || null;

  const handleAddStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step_${Date.now()}_${prev.length + 1}`,
        stepNumber: prev.length + 1,
        title: `${prev.length + 1}-bosqich: Amaliy test va mustahkamlash`,
        description: '',
        type: 'test',
        targetPoints: 15,
      },
    ]);
  };

  const handleRemoveStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) =>
      prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("O'quv reja nomini kiriting!");
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/study-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': isAdminUnlocked
            ? adminPasscode || ADMIN_PASSCODE_VALUE
            : '',
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          level,
          durationWeeks,
          description: description.trim(),
          steps,
        }),
      });
      const data = await res.json();
      if (res.ok && data.studyPlan) {
        playKitestSound('success', soundEnabled);
        setTitle('');
        setDescription('');
        setShowCreateForm(false);
        await onRefreshState();
        setSelectedPlanId(data.studyPlan.id);
      } else {
        setError(data.error || 'Saqlashda xatolik');
      }
    } catch {
      setError('Server xatoligi');
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (planId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    playKitestSound('click', soundEnabled);
    await fetch(`/api/study-plans/${planId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    await onRefreshState();
  };

  const handleToggleStep = async (planId: string, stepId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    playKitestSound('success', soundEnabled);
    await fetch(`/api/study-plans/${planId}/toggle-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, stepId }),
    });
    await onRefreshState();
  };

  const handleDeletePlan = async (planId: string) => {
    await fetch(`/api/study-plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
        'x-admin-passcode': isAdminUnlocked
          ? adminPasscode || ADMIN_PASSCODE_VALUE
          : '',
      },
    });
    await onRefreshState();
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>O'RGANISH BO'LIMI · BOSQICHMA-BOSQICH DASTURLAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="O'quv Rejalari va Tayyorgarlik Dasturlari"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fanlar, CHSB imtihonlari va olimpiadalarga bosqichma-bosqich tayyorlanish rejalari. Jami: {studyPlans.length} ta reja.
          </p>
        </div>

        {isCreatorOrAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-2 self-start sm:self-auto shadow-lg"
          >
            {showCreateForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Formani Yopish</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>+ Yangi O'quv Reja Yaratish</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Creator / Admin Study Plan Builder */}
      {showCreateForm && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreatePlan}
          className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Yangi O'quv Reja Tuzish (Yaratuvchi / Admin)</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                O'quv reja nomi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: CHSB Matematika va Mantiq 100% Tayyorgarlik"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fan / Yo'nalish
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Daraja va Muddat (hafta)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as Difficulty)}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Oson">Oson</option>
                  <option value="O'rta">O'rta</option>
                  <option value="Qiyin">Qiyin</option>
                  <option value="Olimpiada">Olimpiada</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Qisqacha tavsif
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ushbu o'quv rejada o'quvchilar nimalarni o'rganadi..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          {/* Steps Builder */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                O'quv Reja Bosqichlari ({steps.length} ta qadam):
              </span>
              <button
                type="button"
                onClick={handleAddStep}
                className="py-1.5 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Qadam Qo'shish</span>
              </button>
            </div>

            {steps.map((st, idx) => (
              <div
                key={st.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={st.title}
                    onChange={(e) => {
                      const next = [...steps];
                      next[idx] = { ...st, title: e.target.value };
                      setSteps(next);
                    }}
                    placeholder={`${idx + 1}-bosqich sarlavhasi`}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={st.description}
                    onChange={(e) => {
                      const next = [...steps];
                      next[idx] = { ...st, description: e.target.value };
                      setSteps(next);
                    }}
                    placeholder="Bosqich vazifasi..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={st.linkedTestId || ''}
                    onChange={(e) => {
                      const next = [...steps];
                      next[idx] = {
                        ...st,
                        linkedTestId: e.target.value || undefined,
                        type: e.target.value ? 'test' : 'practice',
                      };
                      setSteps(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  >
                    <option value="">Biriktirilgan test (ixtiyoriy)</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} - {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saqlanmoqda...' : "O'quv Rejani Saqlash"}</span>
            </button>
          </div>
        </form>
      )}

      {studyPlans.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-sky-400 mx-auto" />
          <div className="text-base font-bold text-white">
            Hozircha o'quv rejalari kiritilmagan (0 ta)
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Yaratuvchilar va Bosh Admin yuqoridagi tugma orqali bosqichma-bosqich o'quv rejalari qo'shishi mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {studyPlans.map((plan) => {
              const isSelected = activePlan?.id === plan.id;
              const myCompleted =
                (currentUser && plan.completedStepMap?.[currentUser.id]) || [];
              const pct =
                plan.steps.length > 0
                  ? Math.round((myCompleted.length / plan.steps.length) * 100)
                  : 0;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                    isSelected
                      ? 'bg-slate-900 border-sky-500 shadow-lg'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-sky-400 font-bold">{plan.subject}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {plan.level} · {plan.durationWeeks} hafta
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{plan.title}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{plan.steps.length} ta bosqich</span>
                    <span className="font-mono text-emerald-400">{pct}% bajarildi</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            {activePlan && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-sky-400">
                      {activePlan.subject} · Tuzuvchi: {activePlan.authorName}
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {activePlan.title}
                    </h2>
                    {activePlan.description && (
                      <p className="text-xs text-slate-300 mt-1.5">
                        {activePlan.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEnroll(activePlan.id)}
                      className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white"
                    >
                      {currentUser &&
                      activePlan.enrolledUserIds.includes(currentUser.id)
                        ? "✅ A'zo bo'lingan"
                        : "O'quv Rejani Boshlash"}
                    </button>
                    {isCreatorOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(activePlan.id)}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {activePlan.steps.map((step, idx) => {
                    const isDone = Boolean(
                      currentUser &&
                        activePlan.completedStepMap?.[currentUser.id]?.includes(
                          step.id
                        )
                    );
                    const linkedTest = step.linkedTestId
                      ? tests.find((t) => t.id === step.linkedTestId)
                      : undefined;

                    return (
                      <div
                        key={step.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-emerald-950/25 border-emerald-500/50'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStep(activePlan.id, step.id)
                            }
                            className={`w-7 h-7 rounded-lg font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </button>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {step.title}
                            </div>
                            {step.description && (
                              <div className="text-xs text-slate-400 mt-0.5">
                                {step.description}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {linkedTest && (
                            <button
                              type="button"
                              onClick={() => onSelectTest(linkedTest)}
                              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                            >
                              <span>Testni Yechish (#{linkedTest.id})</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStep(activePlan.id, step.id)
                            }
                            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                          >
                            {isDone ? 'Bajarildi ✅' : 'Belgilash'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. ALGORITMLAR (ALGORITHMS & FORMULAS ENCYCLOPEDIA VIEW)
// ============================================================================
interface AlgorithmsViewProps {
  algorithms: AlgorithmTopic[];
  tests: TestItem[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onSelectTest: (test: TestItem) => void;
  onRequireLogin?: () => void;
  onRefreshState: () => Promise<void>;
}

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  algorithms,
  tests,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onSelectTest,
  onRequireLogin = () => {},
  onRefreshState,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.role === 'creator' ||
          currentUser.role === 'admin' ||
          currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

  const [showForm, setShowForm] = useState(false);
  const [selectedAlgId, setSelectedAlgId] = useState<string | null>(
    algorithms[0]?.id || null
  );
  const [stepIdx, setStepIdx] = useState(0);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Qidiruv va Saralash');
  const [difficulty, setDifficulty] = useState<Difficulty>("O'rta");
  const [timeComplexity, setTimeComplexity] = useState('O(log N)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [formulaOrCode, setFormulaOrCode] = useState('');
  const [stepsRaw, setStepsRaw] = useState('');
  const [linkedTestId, setLinkedTestId] = useState('');
  const [saving, setSaving] = useState(false);

  const activeAlg =
    algorithms.find((a) => a.id === selectedAlgId) || algorithms[0] || null;

  const handleCreateAlgorithm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const exampleSteps = stepsRaw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/algorithms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': isAdminUnlocked
            ? adminPasscode || ADMIN_PASSCODE_VALUE
            : '',
        },
        body: JSON.stringify({
          title: title.trim(),
          category,
          difficulty,
          timeComplexity,
          spaceComplexity,
          summary: summary.trim(),
          content: content.trim(),
          formulaOrCode: formulaOrCode.trim(),
          exampleSteps,
          linkedTestId: linkedTestId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.algorithm) {
        playKitestSound('success', soundEnabled);
        setTitle('');
        setSummary('');
        setContent('');
        setFormulaOrCode('');
        setStepsRaw('');
        setShowForm(false);
        await onRefreshState();
        setSelectedAlgId(data.algorithm.id);
      }
    } catch {}
    setSaving(false);
  };

  const handleToggleLearned = async (algId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    playKitestSound('success', soundEnabled);
    await fetch(`/api/algorithms/${algId}/learned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    await onRefreshState();
  };

  const handleDeleteAlg = async (algId: string) => {
    await fetch(`/api/algorithms/${algId}`, {
      method: 'DELETE',
      headers: {
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
        'x-admin-passcode': isAdminUnlocked
          ? adminPasscode || ADMIN_PASSCODE_VALUE
          : '',
      },
    });
    await onRefreshState();
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>O'RGANISH BO'LIMI · ALGORITMLAR VA FORMULALAR BAZASI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="Algoritmlar, Formulalar va Yechim Usullari"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Olimpiada va CHSB masalalarini yechish uchun zarur algoritmlar va nazariy qo'llanmalar. Jami: {algorithms.length} ta mavzu.
          </p>
        </div>

        {isCreatorOrAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="py-2.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-extrabold text-white flex items-center gap-2 self-start sm:self-auto shadow-lg"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                <span>Formani Yopish</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>+ Algoritm / Formula Qo'shish</span>
              </>
            )}
          </button>
        )}
      </div>

      {showForm && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreateAlgorithm}
          className="p-6 rounded-2xl bg-slate-900 border border-violet-500/50 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white">
              Yangi Algoritm yoki Ilmiy Formula Kiritish
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Algoritm / Mavzu nomi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Ikkilik Qidiruv (Binary Search) yoki Pifagor Teoremasi"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bo'lim / Kategoriya
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vaqt / Xotira murakkabligi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                  placeholder="O(log N)"
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="Oson">Oson</option>
                  <option value="O'rta">O'rta</option>
                  <option value="Qiyin">Qiyin</option>
                  <option value="Olimpiada">Olimpiada</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Batafsil tushuntirish *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Algoritm qanday ishlashi va qayerda qo'llanilishi haqida tushuntirish..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kod namunasi yoki Formula
              </label>
              <textarea
                rows={4}
                value={formulaOrCode}
                onChange={(e) => setFormulaOrCode(e.target.value)}
                placeholder="Kod yoki formula matni..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Qadamma-qadam ishlash misoli (har bir qator — 1 qadam)
              </label>
              <textarea
                rows={4}
                value={stepsRaw}
                onChange={(e) => setStepsRaw(e.target.value)}
                placeholder={"1-qadam: Massiv o'rtasini topamiz\n2-qadam: Qidirilayotgan son bilan solishtiramiz"}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <select
              value={linkedTestId}
              onChange={(e) => setLinkedTestId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              <option value="">Amaliyot uchun test biriktirish (ixtiyoriy)</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.id} - {t.title}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Chiqish</span>
              </button>
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-extrabold text-white flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {algorithms.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <Cpu className="w-10 h-10 text-violet-400 mx-auto" />
          <div className="text-base font-bold text-white">
            Hozircha algoritmlar qo'shilmagan (0 ta)
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Yaratuvchilar va Bosh Admin yuqoridagi tugma orqali yangi algoritm, formula va misollarni joylashi mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2.5">
            {algorithms.map((alg) => {
              const isSelected = activeAlg?.id === alg.id;
              const isLearned = Boolean(
                currentUser && alg.learnedUserIds.includes(currentUser.id)
              );
              return (
                <div
                  key={alg.id}
                  onClick={() => {
                    setSelectedAlgId(alg.id);
                    setStepIdx(0);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 border-violet-500 shadow-lg'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-violet-400 font-bold">{alg.category}</span>
                    <span className="text-emerald-400">{alg.timeComplexity}</span>
                  </div>
                  <div className="text-sm font-extrabold text-white flex items-center justify-between">
                    <span>{alg.title}</span>
                    {isLearned && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            {activeAlg && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-violet-400">
                      {activeAlg.category} · Murakkablik: {activeAlg.timeComplexity}
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {activeAlg.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLearned(activeAlg.id)}
                      className={`py-2 px-4 rounded-xl text-xs font-extrabold ${
                        currentUser &&
                        activeAlg.learnedUserIds.includes(currentUser.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {currentUser &&
                      activeAlg.learnedUserIds.includes(currentUser.id)
                        ? "✅ O'zlashtirildi"
                        : "O'rgandim deb belgilash"}
                    </button>
                    {isCreatorOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAlg(activeAlg.id)}
                        className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeAlg.content}
                </div>

                {activeAlg.formulaOrCode && (
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto">
                    {activeAlg.formulaOrCode}
                  </pre>
                )}

                {activeAlg.exampleSteps.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-violet-300">
                        ⚡ Interaktiv Qadamma-Qadam Simulyator ({stepIdx + 1} /{' '}
                        {activeAlg.exampleSteps.length})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStepIdx((p) => Math.max(0, p - 1))}
                          className="px-2.5 py-1 rounded bg-slate-800 text-xs text-white"
                        >
                          Oldingi
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setStepIdx((p) =>
                              Math.min(activeAlg.exampleSteps.length - 1, p + 1)
                            )
                          }
                          className="px-2.5 py-1 rounded bg-violet-600 text-xs font-bold text-white"
                        >
                          Keyingi qadam
                        </button>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 text-xs sm:text-sm text-white font-mono">
                      {activeAlg.exampleSteps[stepIdx]}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. YO'L XARITASI (LEARNING ROADMAP VIEW - STRICT 0-POINT START)
// ============================================================================
interface RoadmapViewProps {
  currentUser: User | null;
  testsCount?: number;
  coursesCount?: number;
  tests?: TestItem[];
  courses?: CourseItem[];
  studyPlans?: StudyPlan[];
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onOpenCertificatesStore?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  currentUser,
  onNavigateTab,
  onNavigate,
  onOpenCertificatesStore,
}) => {
  const nav = onNavigateTab || onNavigate || (() => {});
  const userScore = currentUser ? currentUser.totalScore : 0;
  const userSolved = currentUser ? currentUser.solvedCount : 0;

  const stages = [
    {
      step: 1,
      title: "1-Bosqich: Yangi A'zo (0 Balldan Boshlash)",
      minScore: 0,
      badge: "🌱 0 BALL START",
      desc: "Platformada barcha foydalanuvchilar 0 ball va 0 reyting bilan adolatli boshlaydi. Birinchi test yoki masalani yechib dastlabki ballingizni qo'lga kiriting!",
      actionLabel: "Masalalar va Testlarni Boshlash",
      targetTab: 'problems',
    },
    {
      step: 2,
      title: "2-Bosqich: Faol O'quvchi (15+ Ball)",
      minScore: 15,
      badge: "📘 O'QUVCHI UNVONI",
      desc: "O'quv rejalari va CHSB testlarini yechib 15 ball to'plang hamda O'quvchi darajasiga ko'tariling.",
      actionLabel: "O'quv Rejalarini Ochish",
      targetTab: 'study_plans',
    },
    {
      step: 3,
      title: "3-Bosqich: Fan Mutaxassisi (50+ Ball)",
      minScore: 50,
      badge: "⚡ MUTAXASSIS VA SERTIFIKAT",
      desc: "50 ball yig'ib yoki testni 100% yechib Sertifikatlar Do'konidan rasmiy KITEST sertifikatini qabul qilib oling.",
      actionLabel: "Sertifikatlar Do'konini Ochish",
      targetTab: 'cert_store',
    },
    {
      step: 4,
      title: "4-Bosqich: KITEST Eksperti (100+ Ball)",
      minScore: 100,
      badge: "🏅 EKSPERT DARAJASI",
      desc: "Olimpiadalar va murakkab masalalarni yechib viloyat va tuman reytingida peshqadamlar qatoriga kiring.",
      actionLabel: "Olimpiadalarda Qatnashish",
      targetTab: 'contests',
    },
    {
      step: 5,
      title: "5-Bosqich: Ustoz va Grossmeyster (300+ Ball)",
      minScore: 300,
      badge: "👑 GROSSMEYSTER CHEMPION",
      desc: "Respublika miqyosida eng yuqori ball to'plab Grossmeyster unvoni va Oltin/Olmos sertifikatlar sohibiga aylaning!",
      actionLabel: "Respublika Reytingini Ko'rish",
      targetTab: 'leaderboard',
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>O'RGANISH BO'LIMI · SHAXSIY RIVOJLANISH XARITASI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="0 Balldan Grossmeystergacha Yo'l Xaritasi"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Har bir foydalanuvchi 0 dan boshlaydi va faqat o'z bilimi bilan bosqichlarni ochadi.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Sizning Joriy Natijangiz
            </div>
            <div className="text-lg font-extrabold text-amber-300 font-mono tabular-nums">
              ⚡ {userScore} ball · ✅ {userSolved} ta yechilgan
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((st) => {
          const unlocked = userScore >= st.minScore;
          return (
            <div
              key={st.step}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                unlocked
                  ? 'bg-slate-900/95 border-emerald-500/60 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800 opacity-85'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-2xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                    unlocked
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {unlocked ? '✓' : st.step}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold text-white">
                      {st.title}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        unlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {st.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl">{st.desc}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (st.targetTab === 'cert_store') {
                    if (onOpenCertificatesStore) onOpenCertificatesStore();
                  } else {
                    nav(st.targetTab);
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white flex items-center gap-1.5 self-start sm:self-center shrink-0"
              >
                <span>{st.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 4. MENING SINFLARIM (VIRTUAL CLASSROOMS VIEW)
// ============================================================================
interface MyClassesViewProps {
  classrooms: Classroom[];
  tests: TestItem[];
  courses?: CourseItem[];
  users: User[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onSelectTest: (test: TestItem) => void;
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
}

export const MyClassesView: React.FC<MyClassesViewProps> = ({
  classrooms,
  tests,
  users,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onSelectTest,
  onRequireLogin,
  onRefreshState,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.role === 'creator' ||
          currentUser.role === 'admin' ||
          currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

  const [showCreate, setShowCreate] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(
    classrooms[0]?.id || null
  );
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Create class form
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('Matematika va Informatika');
  const [gradeLevel, setGradeLevel] = useState('5-11 sinf');
  const [description, setDescription] = useState('');
  const [pickedTestIds, setPickedTestIds] = useState<string[]>([]);
  const [announcementText, setAnnouncementText] = useState('');

  const activeClass =
    classrooms.find((c) => c.id === selectedClassId) || classrooms[0] || null;

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setErrorMsg('');
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': isAdminUnlocked
            ? adminPasscode || ADMIN_PASSCODE_VALUE
            : '',
        },
        body: JSON.stringify({
          name: className.trim(),
          subject,
          gradeLevel,
          description: description.trim(),
          assignedTestIds: pickedTestIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.classroom) {
        playKitestSound('success', soundEnabled);
        setClassName('');
        setDescription('');
        setPickedTestIds([]);
        setShowCreate(false);
        setStatusMsg(
          `«${data.classroom.name}» sinfi ochildi! Qo'shilish kodi: ${data.classroom.joinCode}`
        );
        await onRefreshState();
        setSelectedClassId(data.classroom.id);
      } else {
        setErrorMsg(data.error || 'Xatolik');
      }
    } catch {
      setErrorMsg('Server xatoligi');
    }
  };

  const handleJoinClass = async (codeOrId?: string, isDirectId = false) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setErrorMsg('');
    setStatusMsg('');
    const res = await fetch('/api/classrooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        isDirectId
          ? { userId: currentUser.id, classroomId: codeOrId }
          : { userId: currentUser.id, joinCode: codeOrId || joinCodeInput }
      ),
    });
    const data = await res.json();
    if (res.ok && data.classroom) {
      playKitestSound('success', soundEnabled);
      setJoinCodeInput('');
      setStatusMsg(`«${data.classroom.name}» sinfiga muvaffaqiyatli qo'shildingiz!`);
      await onRefreshState();
      setSelectedClassId(data.classroom.id);
    } else {
      setErrorMsg(data.error || 'Sinf topilmadi');
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !announcementText.trim()) return;
    const res = await fetch(`/api/classrooms/${activeClass.id}/announce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': currentUser?.email || ADMIN_EMAIL,
        'x-admin-passcode': isAdminUnlocked
          ? adminPasscode || ADMIN_PASSCODE_VALUE
          : '',
      },
      body: JSON.stringify({
        text: announcementText.trim(),
        authorName: currentUser?.name || 'Ustoz',
      }),
    });
    if (res.ok) {
      setAnnouncementText('');
      await onRefreshState();
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>O'RGANISH BO'LIMI · VIRTUAL SINFLAR VA GURUHLAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="Mening Sinflarim va O'quv Guruhlarim"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maxsus PIN-kod orqali ustozingiz sinfiga qo'shiling va biriktirilgan vazifalarni bajaring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
            <KeyRound className="w-4 h-4 text-amber-400 ml-2" />
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Sinf kodi (KT-1234)"
              className="bg-transparent text-xs text-white font-mono px-2 py-1 focus:outline-none w-36"
            />
            <button
              type="button"
              onClick={() => handleJoinClass()}
              className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
            >
              Qo'shilish
            </button>
          </div>

          {isCreatorOrAdmin && (
            <button
              type="button"
              onClick={() => setShowCreate(!showCreate)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5"
            >
              {showCreate ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Yopish</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Yangi Sinf Ochish</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 font-bold">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 font-bold">
          {errorMsg}
        </div>
      )}

      {showCreate && isCreatorOrAdmin && (
        <form
          onSubmit={handleCreateClassroom}
          className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/50 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white">
              Yangi Sinf / O'quv Guruhi Yaratish
            </h2>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sinf nomi *
              </label>
              <input
                type="text"
                required
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Masalan: 9-A Olimpiada Guruhi"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fan
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sinf / Bosqich
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          {tests.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Sinf o'quvchilariga biriktiriladigan testlar:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-36 overflow-y-auto">
                {tests.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={pickedTestIds.includes(t.id)}
                      onChange={(e) =>
                        setPickedTestIds(
                          e.target.checked
                            ? [...pickedTestIds, t.id]
                            : pickedTestIds.filter((id) => id !== t.id)
                        )
                      }
                    />
                    <span>
                      #{t.id} - {t.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Chiqish
            </button>
            <button
              type="submit"
              className="py-2 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Sinfni Saqlash</span>
            </button>
          </div>
        </form>
      )}

      {classrooms.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <GraduationCap className="w-10 h-10 text-amber-400 mx-auto" />
          <div className="text-base font-bold text-white">
            Hozircha sinflar ochilmagan (0 ta)
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Yaratuvchilar (Ustozlar) va Bosh Admin yangi sinf ochib, o'quvchilarga maxsus PIN kod ulashishi mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {classrooms.map((cls) => {
              const isSelected = activeClass?.id === cls.id;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-lg'
                      : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold">
                      KOD: {cls.joinCode}
                    </span>
                    <span className="text-slate-400">
                      {cls.studentUserIds.length} o'quvchi
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{cls.name}</h3>
                  <div className="text-xs text-slate-400">
                    Ustoz: {cls.teacherName} · {cls.subject}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            {activeClass && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                      <span>SINF KODI: {activeClass.joinCode}</span>
                      <span>·</span>
                      <span>{activeClass.gradeLevel}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {activeClass.name}
                    </h2>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Ustoz: {activeClass.teacherName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleJoinClass(activeClass.id, true)}
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs"
                  >
                    {currentUser &&
                    activeClass.studentUserIds.includes(currentUser.id)
                      ? "✅ Sinf A'zosisiz"
                      : "Sinfga Qo'shilish"}
                  </button>
                </div>

                {/* Assigned Tests */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Biriktirilgan Vazifa va Testlar ({activeClass.assignedTestIds.length})
                  </h3>
                  {activeClass.assignedTestIds.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      Hozircha sinfga test biriktirilmagan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeClass.assignedTestIds.map((tid) => {
                        const found = tests.find((t) => t.id === tid);
                        if (!found) return null;
                        return (
                          <div
                            key={tid}
                            className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-mono text-emerald-400">
                                #{found.id}
                              </div>
                              <div className="text-sm font-bold text-white">
                                {found.title}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onSelectTest(found)}
                              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                            >
                              Yechish
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Class Leaderboard */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Sinf O'quvchilari Reytingi ({activeClass.studentUserIds.length} ta)
                  </h3>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/70">
                    {users
                      .filter((u) => activeClass.studentUserIds.includes(u.id))
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .map((stu, idx) => (
                        <div
                          key={stu.id}
                          className="p-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            <img
                              src={stu.avatarUrl || KIDTEST_LOGO_DATA_URL}
                              alt={stu.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <span className="font-bold text-white">{stu.name}</span>
                          </div>
                          <span className="font-mono font-extrabold text-amber-300">
                            ⚡ {stu.totalScore} ball
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. BLOGLAR (COMMUNITY BLOGS VIEW)
// ============================================================================
interface BlogsViewProps {
  blogs: BlogPost[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onRequireLogin: () => void;
  onRefreshState: () => Promise<void>;
}

export const BlogsView: React.FC<BlogsViewProps> = ({
  blogs,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onRequireLogin,
  onRefreshState,
}) => {
  const [showWrite, setShowWrite] = useState(false);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(
    blogs[0]?.id || null
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Olimpiada va Tajriba');
  const [content, setContent] = useState('');
  const [commentText, setCommentText] = useState('');

  const activeBlog =
    blogs.find((b) => b.id === selectedBlogId) || blogs[0] || null;

  const handlePublishBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !isAdminUnlocked) {
      onRequireLogin();
      return;
    }
    if (!title.trim() || !content.trim()) return;
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        category,
        content: content.trim(),
        authorId: currentUser?.id || 'admin',
        authorName: currentUser?.name || 'Behruz Jumaqulov',
        authorUsername: currentUser?.username || 'behruz_admin',
        authorEmail: currentUser?.email || ADMIN_EMAIL,
        authorRole: currentUser?.role || 'admin',
        authorAvatarUrl: currentUser?.avatarUrl || FOUNDER_PORTRAIT_URL,
      }),
    });
    const data = await res.json();
    if (res.ok && data.blog) {
      playKitestSound('success', soundEnabled);
      setTitle('');
      setContent('');
      setShowWrite(false);
      await onRefreshState();
      setSelectedBlogId(data.blog.id);
    }
  };

  const handleLike = async (blogId: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    playKitestSound('click', soundEnabled);
    await fetch(`/api/blogs/${blogId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    });
    await onRefreshState();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (!activeBlog || !commentText.trim()) return;
    await fetch(`/api/blogs/${activeBlog.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name,
        username: currentUser.username,
        userAvatarUrl: currentUser.avatarUrl,
        text: commentText.trim(),
      }),
    });
    setCommentText('');
    await onRefreshState();
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>HAMJAMIYAT BO'LIMI · MAQOLALAR VA BLOGLAR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="Hamjamiyat Bloglari va Ilmiy Maqolalar"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Foydalanuvchilar va ustozlar tomonidan yozilgan foydali maqolalar. Jami: {blogs.length} ta maqola.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowWrite(!showWrite)}
          className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white flex items-center gap-2 self-start sm:self-auto"
        >
          {showWrite ? (
            <>
              <X className="w-4 h-4" />
              <span>Yopish</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>+ Yangi Blog / Maqola Yozish</span>
            </>
          )}
        </button>
      </div>

      {showWrite && (
        <form
          onSubmit={handlePublishBlog}
          className="p-6 rounded-2xl bg-slate-900 border border-sky-500/50 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maqola sarlavhasi *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Maqola nomi..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mavzu yo'nalishi
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Maqola matni *
            </label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Fikr va bilimlaringizni yozing..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowWrite(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
            >
              Chiqish
            </button>
            <button
              type="submit"
              className="py-2 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Chop Etish</span>
            </button>
          </div>
        </form>
      )}

      {blogs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
          <FileText className="w-10 h-10 text-sky-400 mx-auto" />
          <div className="text-base font-bold text-white">
            Hozircha blog maqolalari yo'q (0 ta)
          </div>
          <p className="text-xs text-slate-400">
            Birinchi bo'lib ilmiy maqola yoki olimpiada tajribangizni yozib qoldiring!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            {blogs.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBlogId(b.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  activeBlog?.id === b.id
                    ? 'bg-slate-900 border-sky-500 shadow-lg'
                    : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="text-[11px] font-mono text-sky-400">{b.category}</div>
                <h3 className="text-sm font-extrabold text-white">{b.title}</h3>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{b.authorName}</span>
                  <span>❤️ {b.likesUserIds.length} · 💬 {b.comments.length}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-8">
            {activeBlog && (
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-xs font-mono text-sky-400">
                      {activeBlog.category} · Muallif: {activeBlog.authorName}
                    </div>
                    <h2 className="text-xl font-extrabold text-white mt-1">
                      {activeBlog.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLike(activeBlog.id)}
                    className="py-2 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{activeBlog.likesUserIds.length}</span>
                  </button>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeBlog.content}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300">
                    Izohlar ({activeBlog.comments.length})
                  </h4>
                  <form onSubmit={handleComment} className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Izoh yozing..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-xl bg-sky-600 text-xs font-bold text-white"
                    >
                      Yuborish
                    </button>
                  </form>
                  <div className="space-y-2">
                    {activeBlog.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="font-bold text-sky-400">{c.userName}</div>
                        <div className="text-slate-200 mt-0.5">{c.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. QANDAY ISHLAYDI (HOW IT WORKS VIEW)
// ============================================================================
interface HowItWorksViewProps {
  onNavigateTab?: (tab: any) => void;
  onNavigate?: (tab: any) => void;
  onOpenCertificatesStore: () => void;
  onOpenLuckyWheel: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({
  onNavigateTab,
  onNavigate,
  onOpenCertificatesStore,
  onOpenLuckyWheel,
}) => {
  const nav = onNavigateTab || onNavigate || (() => {});
  const features = [
    {
      num: '01',
      title: 'Har Bir Foydalanuvchi 0 dan Adolatli Boshlaydi',
      desc: "Ro'yxatdan o'tgan har bir yangi ishtirokchi 0 ball, 0 reyting va 0 ta yechilgan masala bilan boshlaydi. Hech kimga sun'iy ravishda tayyor ball yozilmaydi — barcha natijalar faqat mehnat va bilim bilan yig'iladi.",
      btn: 'Reyting Jadvalini Ko‘rish',
      action: () => nav('leaderboard'),
    },
    {
      num: '02',
      title: 'Mashq: Masalalar, CHSB Testlar, Urinishlar va Olimpiadalar',
      desc: "CHSB imtihonlari, Olimpiada masalalari va Telegram Quiz uslubidagi tezkor savollarni yeching. Har bir to'g'ri javob uchun balingiz va reytingingiz real vaqtda oshib boradi.",
      btn: 'Masalalar va Testlarga O‘tish',
      action: () => nav('problems'),
    },
    {
      num: '03',
      title: "O'rganish: O'quv Rejalari, Algoritmlar, Yo'l Xaritasi va Sinflar",
      desc: "Bosqichma-bosqich o'quv rejalari orqali bilimingizni oshiring, algoritmlarni o'rganing va ustozingizning virtual sinfiga qo'shiling.",
      btn: "O'quv Rejalarini Ochish",
      action: () => nav('study_plans'),
    },
    {
      num: '04',
      title: "Obuna Bo'lish va Hamjamiyat Tizimi",
      desc: "Boshqa foydalanuvchilarga obuna bo'ling, do'stlaringiz natijalarini kuzating va Bloglar hamda Onlayn Chatda fikr almashing.",
      btn: "Obuna Bo'lish Markazini Ochish",
      action: () => nav('subscriptions'),
    },
    {
      num: '05',
      title: '100% Sertifikat va Admin Ruxsati Bilan Ishlaydigan Omadli Baraban',
      desc: "Testni 100% yechsangiz yoki ball to'plasangiz, rasmiy KITEST sertifikatini yuklab olasiz. Omad Barabani esa faqat Bosh Admin ruxsat berganda ishlaydi.",
      btn: "Sertifikatlar Do'konini Ochish",
      action: onOpenCertificatesStore,
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="text-xs font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          <span>PLATFORMA BO'LIMI · TIZIM QO'LLANMASI</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          <AnimatedWords
            text="KITEST Platformasi Qanday Ishlaydi?"
            variant="accent"
          />
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
          Platformaning barcha bo'limlari — Mashq, O'rganish, Hamjamiyat, Sertifikatlar va Baraban tizimi 100% real vaqtda ishlaydi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((f) => (
          <div
            key={f.num}
            className="p-6 rounded-2xl bg-slate-900/85 border border-slate-800 flex flex-col justify-between gap-4"
          >
            <div className="space-y-2.5">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 font-mono font-black text-xs text-sky-400">
                QADAM #{f.num}
              </span>
              <h3 className="text-lg font-extrabold text-white">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {f.desc}
              </p>
            </div>
            <button
              type="button"
              onClick={f.action}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-sky-600 text-xs font-extrabold text-white transition-colors flex items-center justify-center gap-1.5 self-start"
            >
              <span>{f.btn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 7. BIZNING JAMOA (OUR TEAM VIEW - FEATURING FOUNDER PORTRAIT IN SUIT & TIE)
// ============================================================================
interface OurTeamViewProps {
  teamMembers: TeamMember[];
  users?: User[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onRefreshState: () => Promise<void>;
  onRequireLogin?: () => void;
  onUpdateUser?: (updated: User) => void;
}

export const OurTeamView: React.FC<OurTeamViewProps> = ({
  teamMembers,
  users = [],
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onRefreshState,
  onRequireLogin,
  onUpdateUser,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.role === 'creator' ||
          currentUser.role === 'admin' ||
          currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skillsText, setSkillsText] = useState(
    'Platforma Arxitekturasi, CHSB va Olimpiada Tizimi, Sun’iy Intellekt'
  );
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickFounderPhotoRef = useRef<HTMLInputElement>(null);

  const adminUserAccount = useMemo(
    () =>
      users.find(
        (u) =>
          u.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
          u.role === 'admin'
      ) || null,
    [users]
  );

  const founderMember = useMemo(() => {
    const found = teamMembers.find((m) => m.isFounder);
    const syncedAvatar =
      (found?.avatarUrl && found.avatarUrl !== '/founder_portrait.jpg'
        ? found.avatarUrl
        : '') ||
      (adminUserAccount?.avatarUrl &&
      adminUserAccount.avatarUrl !== '/founder_portrait.jpg'
        ? adminUserAccount.avatarUrl
        : '');

    if (found) {
      return {
        ...found,
        avatarUrl: syncedAvatar,
      };
    }
    return {
      id: 'team_founder_behruz',
      name: 'Jumaqulov Behruz',
      username: 'behruz_founder',
      roleTitle: 'KITEST Asoschisi, Bosh Dasturchi va Bosh Admin',
      badge: '👑 LOYIHA ASOSCHISI & YARATUVCHI',
      bio: "KITEST milliy intellektual CHSB, Olimpiada va Sun'iy Intellekt platformasi muallifi hamda bosh arxitektori.",
      email: ADMIN_EMAIL,
      telegram: '@behruz_kitest',
      youtubeUrl: OFFICIAL_YOUTUBE_URL,
      avatarUrl: syncedAvatar,
      skills: [
        'Platforma Arxitekturasi',
        'CHSB va Olimpiada Tizimi',
        "Sun'iy Intellekt Integratsiyasi",
        'Full-Stack Dasturlash',
      ],
      isFounder: true,
      order: 1,
    };
  }, [teamMembers, adminUserAccount]);

  const startEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setUsername(m.username);
    setRoleTitle(m.roleTitle);
    setBadge(m.badge);
    setBio(m.bio);
    setAvatarUrl(m.avatarUrl || '');
    setSkillsText((m.skills || []).join(', '));
    setShowAddForm(true);
  };

  // Reads the user's photo 100% unmodified (no canvas resize, no crop, no compression)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct 1-click upload for Founder's exact unmodified photo
  const handleDirectFounderPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const exactOriginalDataUrl = reader.result;
        setSaving(true);
        try {
          const res = await fetch('/api/team', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': currentUser?.email || ADMIN_EMAIL,
              'x-admin-passcode': isAdminUnlocked
                ? adminPasscode || ADMIN_PASSCODE_VALUE
                : ADMIN_PASSCODE_VALUE,
            },
            body: JSON.stringify({
              id: founderMember.id,
              name: founderMember.name,
              username: founderMember.username,
              roleTitle: founderMember.roleTitle,
              badge: founderMember.badge,
              bio: founderMember.bio,
              avatarUrl: exactOriginalDataUrl,
              skills: founderMember.skills,
              isFounder: true,
            }),
          });
          if (res.ok) {
            playKitestSound('success', soundEnabled);
            setStatusMsg(
              "Rasmingiz hech qanday o'zgarishsiz (100% asl holicha) o'rnatildi va saqlandi!"
            );
            await onRefreshState();
            setTimeout(() => setStatusMsg(''), 4000);
          }
        } catch {}
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubscribeFounder = async () => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!adminUserAccount || currentUser.id === adminUserAccount.id) return;
    setSubscribing(true);
    try {
      const res = await fetch(`/api/users/${adminUserAccount.id}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        if (data.currentUser && onUpdateUser) {
          onUpdateUser(data.currentUser);
        }
        if (data.message) {
          setStatusMsg(data.message);
          setTimeout(() => setStatusMsg(''), 3500);
        }
        await onRefreshState();
      }
    } catch {}
    setSubscribing(false);
  };

  const isSubscribedToFounder = Boolean(
    currentUser &&
      adminUserAccount &&
      ((adminUserAccount.followersUserIds || []).includes(currentUser.id) ||
        (currentUser.followingUserIds || []).includes(adminUserAccount.id))
  );

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': isAdminUnlocked
            ? adminPasscode || ADMIN_PASSCODE_VALUE
            : '',
        },
        body: JSON.stringify({
          id: editingMember?.id,
          name: name.trim(),
          username: username.trim() || 'kitest_creator',
          roleTitle: roleTitle.trim() || "KITEST Jamoasi A'zosi",
          badge: badge.trim() || '✨ YARATUVCHI',
          bio: bio.trim(),
          avatarUrl: avatarUrl,
          skills: skillsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          isFounder: editingMember?.isFounder ?? false,
        }),
      });
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        setShowAddForm(false);
        setEditingMember(null);
        await onRefreshState();
      }
    } catch {}
    setSaving(false);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-extrabold flex items-center justify-between">
          <span>✓ {statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg('')}
            className="text-emerald-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1">
            <Crown className="w-3.5 h-3.5" />
            <span>PLATFORMA BO'LIMI · BIZNING JAMOA VA LOYIHA YARATUVCHISI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            <AnimatedWords
              text="Bizning Jamoa va Loyiha Asoschisi"
              variant="accent"
            />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            KITEST intellektual platformasi ijodkorlari, ustozlari va texnik jamoasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={quickFounderPhotoRef}
            type="file"
            accept="image/*"
            onChange={handleDirectFounderPhotoUpload}
            className="hidden"
          />
          {isCreatorOrAdmin && (
            <>
              <button
                type="button"
                onClick={() => quickFounderPhotoRef.current?.click()}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>📸 Rasmimni O'zgartirmasdan (Asl Holicha) Qo'yish</span>
              </button>
              <button
                type="button"
                onClick={() => startEditMember(founderMember)}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Camera className="w-4 h-4" />
                <span>Ma'lumotni Tahrirlash</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setName('');
                  setUsername('');
                  setRoleTitle('Test Yaratuvchi Ustoz');
                  setBadge('✨ YARATUVCHI USTOZ');
                  setBio('');
                  setAvatarUrl('');
                  setShowAddForm(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Jamoaga A'zo Qo'shish</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit / Add Team Member Form */}
      {showAddForm && isCreatorOrAdmin && (
        <form
          onSubmit={handleSaveMember}
          className="p-6 rounded-2xl bg-slate-900 border-2 border-amber-500/60 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>
                {editingMember
                  ? `${editingMember.name} ma'lumotlari va rasmini yangilash`
                  : "Bizning Jamoaga Yangi A'zo Qo'shish"}
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <img
              src={avatarUrl || KIDTEST_LOGO_DATA_URL}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-28 h-28 rounded-2xl object-contain border-2 border-amber-400 bg-slate-900 shrink-0"
            />
            <div className="space-y-2 flex-1">
              <div className="text-xs font-bold text-white">
                Shaxsiy Rasm (Hech qanday kesish va o'zgartirishsiz — 100% asl holicha saqlanadi)
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📸 Rasmni O'zgartirmasdan Yuklash</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="py-2 px-3.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-xs font-bold text-rose-200"
                  >
                    Rasmni Tozalash
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ism va Familiya *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lavozimi / Vazifasi
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maxsus Nishon (Badge)
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Qisqacha ma'lumot (Bio)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-extrabold text-slate-950 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Featured Founder & Creator Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a1226] to-slate-950 border-2 border-amber-500/60 shadow-2xl flex flex-col md:flex-row items-center gap-8"
      >
        <div className="relative shrink-0 flex flex-col items-center gap-3">
          <div className="w-52 h-60 sm:w-60 sm:h-68 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-slate-950 flex items-center justify-center">
            <img
              src={founderMember.avatarUrl || KIDTEST_LOGO_DATA_URL}
              alt={founderMember.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="px-3.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-[11px] whitespace-nowrap shadow-lg">
            👑 LOYIHA YARATUVCHISI
          </div>
          {isCreatorOrAdmin && (
            <button
              type="button"
              onClick={() => quickFounderPhotoRef.current?.click()}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 text-[11px] font-bold flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Rasmni o'zgartirmasdan qo'yish</span>
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{founderMember.badge}</span>
            </div>

            {adminUserAccount && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                🔔 Obunachilar: {adminUserAccount.followersUserIds?.length || 0} ta
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {founderMember.name}
            </h2>
            <div className="text-sm sm:text-base font-bold text-sky-400 mt-1">
              {founderMember.roleTitle}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {founderMember.bio}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {(founderMember.skills || []).map((sk) => (
              <span
                key={sk}
                className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-emerald-300"
              >
                ✓ {sk}
              </span>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {adminUserAccount && currentUser?.id !== adminUserAccount.id && (
              <button
                type="button"
                disabled={subscribing}
                onClick={handleSubscribeFounder}
                className={`py-2.5 px-5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all ${
                  isSubscribedToFounder
                    ? 'bg-slate-800 hover:bg-rose-950 text-emerald-300 border border-emerald-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>
                  {isSubscribedToFounder
                    ? "✓ Obuna bo'lingan"
                    : "➕ Asoschiga Obuna bo'lish"}
                </span>
              </button>
            )}

            <a
              href={OFFICIAL_YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white flex items-center gap-2 shadow-lg"
            >
              <Youtube className="w-4 h-4" />
              <span>Rasmiy YouTube Kanal (@FC_UZB-67b)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              📧 {ADMIN_EMAIL}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Additional Team Members Grid */}
      {teamMembers.filter((m) => !m.isFounder).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {teamMembers
            .filter((m) => !m.isFounder)
            .map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={member.avatarUrl || KIDTEST_LOGO_DATA_URL}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-contain border border-sky-500/50 bg-slate-950 shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-sky-400">
                      {member.badge}
                    </span>
                    <h3 className="text-base font-extrabold text-white">
                      {member.name}
                    </h3>
                    <div className="text-xs text-slate-400">{member.roleTitle}</div>
                  </div>
                </div>
                {member.bio && (
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {member.bio}
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
