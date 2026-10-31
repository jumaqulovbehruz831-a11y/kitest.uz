import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Bot,
  User as UserIcon,
  Code2,
  Calculator,
  Compass,
  Lightbulb,
  BookOpen,
  Globe,
  HelpCircle,
  ThumbsUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  category?: string;
}

interface KitestAIGeminiAssistantProps {
  currentUser: User | null;
  soundEnabled?: boolean;
  onNavigateToTestMaker?: () => void;
  onNavigateToGram?: () => void;
}

const SUGGESTED_PROMPTS = [
  {
    icon: '📐',
    category: 'Matematika',
    prompt: "Matematikadan hosila va integral nima? Hayotiy misollar va formulasini tushuntirib ber.",
  },
  {
    icon: '💻',
    category: 'Dasturlash',
    prompt: "Python tilida QuickSort (Tezkor saralash) algoritmini yozib, vaqt murakkabligini tushuntir.",
  },
  {
    icon: '⚡',
    category: 'Fizika',
    prompt: "Nyutonning uchta asosiy qonuniyatini amaliy misollar va formulalar bilan izohlab ber.",
  },
  {
    icon: '🏆',
    category: 'Olimpiada',
    prompt: "CHSB va Respublika olimpiada masalalarini yechishda eng ko'p uchraydigan 5 ta xato nima?",
  },
  {
    icon: '🇬🇧',
    category: 'Ingliz tili',
    prompt: "IELTS Writing Task 2 uchun 10 ta eng kuchli akademik ibora va namunaviy gaplar tuzib ber.",
  },
  {
    icon: '💡',
    category: 'Mantiq',
    prompt: "Dasturchi yoki olim kabi fikrlashni rivojlantirish uchun qanday mantiqiy mashqlar qilish kerak?",
  },
];

export const KitestAIGeminiAssistant: React.FC<KitestAIGeminiAssistantProps> = ({
  currentUser,
  soundEnabled = true,
  onNavigateToTestMaker,
  onNavigateToGram,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('kitest_ai_pro_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg_welcome',
        role: 'model',
        text: `Salom, **${currentUser?.name || "O'quvchi"}**! 👋\n\nMen **KitestAI Pro** — sizning eng ilg'or, ultra-tezkor universal sun'iy intellekt yordamchingizman.\n\nSiz menga **har qanday fan va sohada savol** berishingiz mumkin:\n- 📐 Matematika, Fizika, Kimyo, Biologiya masalalari va formulalari\n- 💻 Python, C++, JavaScript, Algoritmlar va kod yechimlari\n- 📝 Insho yozish, grammatika, xorijiy tillar va mantiqiy tahlillar\n- 🏆 CHSB va Respublika Olimpiadalariga professional tayyorgarlik\n\nSavolingizni pastga yozing yoki quyidagi tayyor mavzulardan birini tanlang! 🚀`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('kitest_ai_pro_history_v1', JSON.stringify(messages));
    } catch {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = String(textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/ai/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: conversationHistory,
          userName: currentUser?.name || "O'quvchi",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Server xatosi (${res.status})`);
      }

      const answer = data.answer || "Kechirasiz, javob olib bo'lmadi. Qayta urinib ko'ring.";

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        role: 'model',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('KitestAI Pro error:', err);
      const errorMsg: Message = {
        id: `ai_err_${Date.now()}`,
        role: 'model',
        text: `⚠️ **Sun'iy Intellekt Bildirishi:**\n\n${err?.message || "Aloqa vaqtinchalik uzildi."}\n\nIltimos, savolingizni qayta yuboring yoki birozdan so'ng takrorlang.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanSpeech = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/```[\s\S]*?```/g, 'Kod bloki mavjud.');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'uz-UZ';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeakingId(null);
    utterance.onerror = () => setIsSpeakingId(null);

    setIsSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleClearHistory = () => {
    if (window.confirm("Barcha suhbat tarixini o'chirmoqchimisiz?")) {
      const reset = [
        {
          id: `msg_${Date.now()}`,
          role: 'model' as const,
          text: `Suhbat tarixi tozalandi. Yangi savolingizni bering, sizga yordam berishga tayyorman! ✨`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(reset);
      try {
        localStorage.removeItem('kitest_ai_pro_history_v1');
      } catch {}
    }
  };

  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(renderTextWithFormatting(content.slice(lastIndex, match.index), `txt_${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const codeBlockId = `code_${match.index}`;

      parts.push(
        <div key={codeBlockId} className="my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5" />
              {lang}
            </span>
            <button
              type="button"
              onClick={() => handleCopyText(codeBlockId, code)}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedId === codeBlockId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Nusxa olindi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kodni ko'chirish</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed selection:bg-indigo-500 selection:text-white">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(renderTextWithFormatting(content.slice(lastIndex), `txt_${lastIndex}`));
    }

    return parts;
  };

  const renderTextWithFormatting = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return (
      <div key={keyPrefix} className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={`${keyPrefix}_${idx}`} className="h-2" />;

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={`${keyPrefix}_${idx}`} className="text-sm font-extrabold text-amber-300 pt-2 pb-0.5">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={`${keyPrefix}_${idx}`} className="text-base font-black text-indigo-300 pt-2.5 pb-1">
                {line.replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h2 key={`${keyPrefix}_${idx}`} className="text-lg font-black text-white pt-3 pb-1 border-b border-indigo-500/20">
                {line.replace('# ', '')}
              </h2>
            );
          }

          // Bullet points
          const isBullet = line.startsWith('- ') || line.startsWith('* ');
          const lineText = isBullet ? line.substring(2) : line;

          // Parse bold (**text**)
          const boldParts = lineText.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={`${keyPrefix}_${idx}`} className={isBullet ? "flex items-start gap-2 pl-2" : ""}>
              {isBullet && <span className="text-indigo-400 mt-1 font-bold">•</span>}
              <span>
                {boldParts.map((bp, bIdx) => {
                  if (bp.startsWith('**') && bp.endsWith('**')) {
                    return (
                      <strong key={bIdx} className="font-extrabold text-white">
                        {bp.slice(2, -2)}
                      </strong>
                    );
                  }
                  return bp;
                })}
              </span>
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto rounded-3xl border border-indigo-500/30 bg-slate-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>KitestAI Pro</span>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm border border-sky-400/40">
                  ULTRA-TEZKOR NEYROTIZIM
                </span>
              </h2>
            </div>
            <p className="text-xs text-sky-200/80">
              Universal intellektual yordamchi • Barcha fanlar, kodlar va masalalarga 100% javob
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToTestMaker && (
            <button
              type="button"
              onClick={onNavigateToTestMaker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-bold text-indigo-300 transition-all cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Savol/Test Tuzish AI</span>
            </button>
          )}

          {onNavigateToGram && (
            <button
              type="button"
              onClick={onNavigateToGram}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-bold text-sky-300 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>KitestGram</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-all cursor-pointer"
            title="Suhbat tarixini tozalash"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Topic Chips */}
      <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
          Mavzular:
        </span>
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <button
            key={`prompt_chip_${idx}`}
            type="button"
            onClick={() => handleSendMessage(item.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-800/70 hover:bg-indigo-600/30 border border-slate-700/60 hover:border-indigo-400/50 text-slate-200 transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            <span>{item.icon}</span>
            <span>{item.category}</span>
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-sm shadow-md ${
                  isUser
                    ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold'
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-indigo-500/30'
                }`}
              >
                {isUser ? (
                  currentUser?.avatarEmoji || currentUser?.name?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-900/90 border border-indigo-500/20 text-slate-100 rounded-tl-sm backdrop-blur-md'
                }`}
              >
                {/* Header for AI */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-500/20 text-xs">
                    <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      KITEST AI (Gemini)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="text-sm">
                  {renderFormattedContent(msg.text)}
                </div>

                {/* Bottom Tools for AI message */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Aniq & Ilmiy Javob
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.id, msg.text)}
                        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                          isSpeakingId === msg.id ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-white'
                        }`}
                        title={isSpeakingId === msg.id ? "Ovozni to'xtatish" : "Ovozli eshitish"}
                      >
                        {isSpeakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Javobni nusxalash"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* User message timestamp */}
                {isUser && (
                  <div className="mt-1 text-right text-[10px] text-white/70 font-mono">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading shimmer */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="rounded-3xl p-4 bg-slate-900/90 border border-indigo-500/20 text-slate-200 rounded-tl-sm flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
              </div>
              <span className="text-xs font-medium text-indigo-300">
                Gemini javob tayyorlamoqda...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 border-t border-indigo-500/20 bg-slate-900/90 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2 rounded-2xl border-2 border-indigo-500/40 bg-slate-950 p-2 shadow-2xl focus-within:border-indigo-400 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Matematika, kod, fizika yoki istalgan savolingizni yozing (Enter — yuborish)..."
            className="flex-1 max-h-32 min-h-[44px] resize-none bg-transparent px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className={`inline-flex items-center justify-center w-11 h-11 rounded-xl font-bold transition-all ${
              inputPrompt.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-2 text-center text-[10px] text-slate-400 font-medium">
          KITEST AI xuddi Google Gemini kabi ishlaydi. Masalalar, dasturlash va imtihon savollarida eng aniq javoblarni taqdim etadi.
        </p>
      </div>
    </div>
  );
};
