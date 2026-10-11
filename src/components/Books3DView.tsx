import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book3DItem, Book3DPage, User, ADMIN_EMAIL } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Trash2,
  Eye,
  Heart,
  ShieldCheck,
  Layers,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Books3DViewProps {
  books: Book3DItem[];
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  canTakeScreenshot?: boolean;
  screenshotProtectionEnabled?: boolean;
  soundEnabled?: boolean;
  onRefreshState: () => Promise<void>;
  onRequireLogin: () => void;
}

const COVER_THEMES = [
  {
    id: 'from-sky-600 via-indigo-700 to-slate-900',
    label: 'Moviy Koinot',
  },
  {
    id: 'from-emerald-600 via-teal-700 to-slate-900',
    label: 'Zumrad Akademiya',
  },
  {
    id: 'from-amber-600 via-orange-700 to-slate-900',
    label: 'Oltin Olimpiada',
  },
  {
    id: 'from-purple-600 via-fuchsia-700 to-slate-900',
    label: 'Binafsha Grossmeyster',
  },
  {
    id: 'from-rose-600 via-red-700 to-slate-900',
    label: 'QizilChempion',
  },
];

export const Books3DView: React.FC<Books3DViewProps> = ({
  books,
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  canTakeScreenshot,
  soundEnabled = true,
  onRefreshState,
  onRequireLogin,
}) => {
  const isCreatorOrAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.role === 'creator' ||
          currentUser.role === 'admin' ||
          currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
    );

  const [selectedBookId, setSelectedBookId] = useState<string>(
    books[0]?.id || ''
  );
  const [currentPageIdx, setCurrentPageIdx] = useState<number>(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Builder state for Creators & Admin
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matematika');
  const [coverSubtitle, setCoverSubtitle] = useState('KITEST 3D DARSLIK');
  const [coverColor, setCoverColor] = useState(COVER_THEMES[0].id);
  const [description, setDescription] = useState('');
  const [pages, setPages] = useState<Book3DPage[]>([
    {
      pageNumber: 1,
      title: '1-Bob: Asosiy Qoidalar va Kirish',
      content: '',
      formulaOrHighlight: '',
    },
    {
      pageNumber: 2,
      title: '2-Bob: Amaliy Misollar va Yechimlar',
      content: '',
      formulaOrHighlight: '',
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeBook =
    books.find((b) => b.id === selectedBookId) || books[0] || null;
  const activePages = activeBook?.pages || [];
  const currentPage =
    activePages[Math.min(currentPageIdx, Math.max(0, activePages.length - 1))] ||
    null;

  const handleTurnPage = (dir: 'next' | 'prev') => {
    if (!activeBook) return;
    if (dir === 'next' && currentPageIdx < activePages.length - 1) {
      playKitestSound('click', soundEnabled);
      setFlipDirection('next');
      setCurrentPageIdx((p) => p + 1);
    } else if (dir === 'prev' && currentPageIdx > 0) {
      playKitestSound('click', soundEnabled);
      setFlipDirection('prev');
      setCurrentPageIdx((p) => p - 1);
    }
  };

  const handleLikeBook = async (bookId: string) => {
    if (!currentUser && !isAdminUnlocked) {
      onRequireLogin();
      return;
    }
    try {
      await fetch(`/api/books/${bookId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id || 'admin' }),
      });
      playKitestSound('success', soundEnabled);
      await onRefreshState();
    } catch {}
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
      });
      if (res.ok) {
        await onRefreshState();
      }
    } catch {}
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Kitob nomini kiriting!');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || '',
        },
        body: JSON.stringify({
          title: title.trim(),
          subject,
          coverColor,
          coverSubtitle: coverSubtitle.trim(),
          description: description.trim(),
          pages,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Xatolik yuz berdi');
      } else {
        playKitestSound('victory', soundEnabled);
        setTitle('');
        setDescription('');
        setIsBuilderOpen(false);
        await onRefreshState();
        if (data.book?.id) {
          setSelectedBookId(data.book.id);
          setCurrentPageIdx(0);
        }
      }
    } catch {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`space-y-6 ${
        !canTakeScreenshot ? 'select-none' : ''
      }`}
    >
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-indigo-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-extrabold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>INTERAKTIV 3D KITOBLAR KUTUBXONASI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            3D Formatdagi Kitoblar — Varaqlab O'qish Tizimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Yaratuvchilar va ustozlar tomonidan joylangan 3D kitoblarni sahifama-sahifa varaqlab o'qing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              canTakeScreenshot
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {canTakeScreenshot
                ? 'Admin Skrinshot Ruxsati: Faol'
                : 'Skrinshot Taqiqlangan (Faqat Admin ruxsati bilan)'}
            </span>
          </div>

          {isCreatorOrAdmin && (
            <button
              type="button"
              onClick={() => setIsBuilderOpen((prev) => !prev)}
              className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isBuilderOpen ? 'Yopish' : 'Yangi 3D Kitob Joylash'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Book Builder for Creators & Admin */}
      <AnimatePresence>
        {isBuilderOpen && isCreatorOrAdmin && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleCreateBook}
            className="p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Yangi 3D Kitob Yaratish (Yaratuvchilar va Admin uchun)</span>
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  3D Kitob nomi *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Olimpiada Geometriyasi 3D"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Fan yo'nalishi
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Matematika / Informatika"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  3D Muqova rangi
                </label>
                <select
                  value={coverColor}
                  onChange={(e) => setCoverColor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  {COVER_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={coverSubtitle}
                onChange={(e) => setCoverSubtitle(e.target.value)}
                placeholder="Muqova ostki yozuvi (masalan: MAXSUS 3D QO'LLANMA)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kitob haqida qisqacha tavsif..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-sky-300">
                  Kitob Varaqalari ({pages.length} sahifa)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPages((prev) => [
                      ...prev,
                      {
                        pageNumber: prev.length + 1,
                        title: `${prev.length + 1}-Bob: Yangi mavzu`,
                        content: '',
                        formulaOrHighlight: '',
                      },
                    ])
                  }
                  className="py-1.5 px-3 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 border border-sky-500/40 text-sky-200 text-xs font-bold"
                >
                  + Sahifa qo'shish
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pages.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {idx + 1}-sahifa
                      </span>
                      {pages.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setPages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-rose-400 hover:text-rose-300 text-xs"
                        >
                          O'chirish
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, title: e.target.value } : item
                          )
                        )
                      }
                      placeholder="Sahifa sarlavhasi"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <textarea
                      rows={3}
                      value={p.content}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, content: e.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="Sahifa matni..."
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={p.formulaOrHighlight || ''}
                      onChange={(e) =>
                        setPages((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, formulaOrHighlight: e.target.value }
                              : item
                          )
                        )
                      }
                      placeholder="Formula yoki kod ajratmasi (ixtiyoriy)"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
            >
              {saving ? 'Saqlanmoqda...' : '3D Kitobni Nashr Qilish'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 3D Bookshelf Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {books.map((book) => {
          const isSelected = activeBook?.id === book.id;
          return (
            <div
              key={book.id}
              onClick={() => {
                playKitestSound('click', soundEnabled);
                setSelectedBookId(book.id);
                setCurrentPageIdx(0);
              }}
              style={{ perspective: '1200px' }}
              className={`group cursor-pointer p-5 rounded-3xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-sky-500 shadow-2xl shadow-sky-500/15'
                  : 'bg-slate-900/75 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 3D Standing Book Cover */}
                <div
                  style={{
                    transform: 'rotateY(-18deg) rotateX(5deg)',
                    transformStyle: 'preserve-3d',
                  }}
                  className={`w-24 h-32 rounded-r-xl rounded-l-sm bg-gradient-to-br ${book.coverColor} border-l-4 border-amber-300/80 shadow-[8px_8px_20px_rgba(0,0,0,0.65)] p-2.5 flex flex-col justify-between shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <div className="text-[9px] font-mono font-bold text-amber-200 uppercase tracking-wider line-clamp-1">
                    {book.subject}
                  </div>
                  <div className="text-xs font-black text-white leading-tight line-clamp-3">
                    {book.title}
                  </div>
                  <div className="text-[9px] font-mono text-sky-200/90">
                    {book.pages.length} varaq · 3D
                  </div>
                </div>

                {/* Book Metadata */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[10px] font-mono font-bold">
                      {book.subject}
                    </span>
                    {isCreatorOrAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBook(book.id);
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-white line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {book.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>✍️ {book.authorName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeBook(book.id);
                      }}
                      className="flex items-center gap-1 text-rose-400 font-bold"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500/30" />
                      <span>{book.likesUserIds?.length || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Interactive Open Flipbook Reader */}
      {activeBook && currentPage && (
        <div
          style={{ perspective: '1800px' }}
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-slate-950 p-6 sm:p-10 overflow-y-auto flex flex-col justify-between space-y-6'
              : 'p-6 sm:p-8 rounded-3xl bg-slate-950/95 border-2 border-indigo-500/40 shadow-2xl space-y-6'
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                {activeBook.coverSubtitle} · Muallif: {activeBook.authorName}
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-white mt-0.5">
                {activeBook.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPageIdx === 0}
                onClick={() => handleTurnPage('prev')}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs font-extrabold text-white flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Oldingi varaq</span>
              </button>

              <span className="px-3.5 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-xs font-mono font-black text-indigo-200">
                Varaq: {currentPageIdx + 1} / {activePages.length}
              </span>

              <button
                type="button"
                disabled={currentPageIdx >= activePages.length - 1}
                onClick={() => handleTurnPage('next')}
                className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg shadow-sky-600/25"
              >
                <span>Keyingi varaq</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekranda o'qish"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFullscreen ? 'Kichraytirish' : "To'liq ekran"}</span>
              </button>
            </div>
          </div>

          {/* 3D Open Book Spread */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeBook.id}_page_${currentPageIdx}`}
              initial={{
                opacity: 0,
                rotateY: flipDirection === 'next' ? 28 : -28,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                rotateY: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                rotateY: flipDirection === 'next' ? -22 : 22,
                scale: 0.96,
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.75)] border-2 border-amber-500/40"
            >
              {/* Left 3D Cover / Chapter Side */}
              <div
                className={`lg:col-span-5 p-6 sm:p-8 bg-gradient-to-br ${activeBook.coverColor} border-b lg:border-b-0 lg:border-r-4 border-amber-400/50 flex flex-col justify-between space-y-6`}
              >
                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/30 text-amber-300 text-[11px] font-mono font-bold">
                    3D KITOB · {activeBook.subject.toUpperCase()}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug pt-2">
                    {currentPage.title}
                  </h3>
                  <p className="text-xs text-slate-200/85 leading-relaxed">
                    {activeBook.description}
                  </p>
                </div>

                {/* Page selector pills */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-amber-200/90 font-bold">
                    SAHIFALAR RO'YXATI:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePages.map((pg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setFlipDirection(i > currentPageIdx ? 'next' : 'prev');
                          setCurrentPageIdx(i);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          i === currentPageIdx
                            ? 'bg-amber-400 text-slate-950 shadow'
                            : 'bg-black/35 text-white hover:bg-black/50'
                        }`}
                      >
                        {i + 1}-bet
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 3D Open Page Content */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-900/95 flex flex-col justify-between space-y-5 relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2.5">
                    <span>KITEST 3D KUTUBXONASI</span>
                    <span className="text-amber-400 font-bold">
                      {currentPageIdx + 1}-SAHIFA
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line">
                    {currentPage.content}
                  </p>

                  {currentPage.formulaOrHighlight && (
                    <div className="p-4 rounded-2xl bg-slate-950 border-l-4 border-amber-400 font-mono text-xs sm:text-sm text-amber-300 whitespace-pre-wrap shadow-inner">
                      {currentPage.formulaOrHighlight}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span>Muallif: {activeBook.authorName}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPageIdx === 0}
                      onClick={() => handleTurnPage('prev')}
                      className="text-sky-400 hover:text-sky-300 disabled:opacity-30 font-bold"
                    >
                      ◀ Oldingi bet
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      disabled={currentPageIdx >= activePages.length - 1}
                      onClick={() => handleTurnPage('next')}
                      className="text-sky-400 hover:text-sky-300 disabled:opacity-30 font-bold"
                    >
                      Keyingi bet ▶
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
