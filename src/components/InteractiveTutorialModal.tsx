import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Video,
  MessageSquare,
  Settings,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  Play,
  Radio,
} from 'lucide-react';
import { OnlinePresenceUser } from '../types';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: OnlinePresenceUser[];
  onNavigate?: (tab: string) => void;
  onOpenSettings?: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: 'search',
    icon: Search,
    badge: '1-QADAM • TEZKOR QIDIRUV',
    title: 'Aqlli Qidiruv Tizimi (Smart Search)',
    description:
      "Yuqori paneldagi Qidiruv maydoniga istalgan fan, test nomi, video dars yoki bo'lim nomini yozing. Tizim bir zumda mos testlar, kurslar va sahifalarni topib beradi.",
    tips: [
      'Masalan: "JavaScript", "Python", "Matematika" yoki "Majlis" deb yozing',
      "Qidiruv natijasidan to'g'ridan-to'g'ri testni boshlash yoki bo'limga o'tish mumkin",
    ],
    actionLabel: 'Asosiy sahifada qidirish',
    targetTab: 'home',
  },
  {
    id: 'ai-builder',
    icon: Sparkles,
    badge: '2-QADAM • AI SAVOL TUZISH',
    title: "Sun'iy Intellekt (Gemini AI) Yordamida Savol Tuzish",
    description:
      "Har bir foydalanuvchi 'Test Yaratish' bo'limiga kirib, mavzuni yozishi va 'AI Savol Tuzish' tugmasini bosib sanoqli soniyada professional testlar yaratishi mumkin!",
    tips: [
      "Mavzu va qiyinchilik darajasini tanlang — AI o'zi 4 variantli savollar va izohlar tuzadi",
      "Tayyor testni '💾 Saqlash' tugmasi orqali bazaga qo'shing",
    ],
    actionLabel: 'AI Test Yaratishga o‘tish',
    targetTab: 'quiz-builder',
  },
  {
    id: 'majlis',
    icon: Video,
    badge: '3-QADAM • JONLI VIDEO MAJLIS',
    title: 'Kamera va Mikrofon Orqali Jonli Video Majlis',
    description:
      "Majlis bo'limida Bosh Admin va onlayn foydalanuvchilar kamera yoqib, ko'rishib, ovozli va ekran ulashish orqali jonli muloqot qilishlari mumkin.",
    tips: [
      "Kamera va mikrofonni bir tugma bilan yoqish/o'chirish mumkin",
      "Qo'l ko'tarish ✋, jonli emotsiyalar 🔥 va majlis ichidagi chat mavjud",
    ],
    actionLabel: 'Video Majlisni ochish',
    targetTab: 'majlis',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    badge: '4-QADAM • KUCHAYTIRILGAN CHAT',
    title: 'Onlayn Foydalanuvchilar Chati va Bellashuv',
    description:
      "Onlayn Chat bo'limida hozir saytda kimlar borligini ko'rishingiz, ular bilan yozishishingiz, emotsiyalar qoldirishingiz va bir tugma bilan Video Majlisga o'tishingiz mumkin.",
    tips: [
      "Har bir onlayn foydalanuvchining hozir qaysi bo'limda ekanligi ko'rinib turadi",
      "Xabarlarga javob qaytarish (Reply) va tezkor reaksiyalar ishlaydi",
    ],
    actionLabel: 'Onlayn Chatga o‘tish',
    targetTab: 'online-chat',
  },
  {
    id: 'settings-admin',
    icon: Settings,
    badge: '5-QADAM • NASTROYKA VA ADMIN HUQUQLARI',
    title: 'Sozlamalar (Nastroyka) va Admin Kuzatuv Tizimi',
    description:
      "⚙️ Nastroyka tugmasi orqali fon rasmi, shriftlar, ovoz va profilni tahrirlab '💾 Saqlash' tugmasi bilan saqlang. Admin esa barcha onlayn odamlarni jonli kuzatishi va ularga huquqlar berishi mumkin.",
    tips: [
      "Har bir tahrirlash oynasida '💾 Saqlash' tugmasi mavjud",
      "Admin Panelda onlayn foydalanuvchilar faoliyati real vaqtda ko'rsatiladi",
    ],
    actionLabel: 'Nastroykani ochish',
    targetTab: 'settings',
  },
];

export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  onNavigate,
  onOpenSettings,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const current = TUTORIAL_STEPS[activeStep];
  const IconComp = current.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-purple-950/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Interaktiv Platforma Qo'llanmasi (Tutorial)
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                  {onlineUsers.length} kishi onlayn ko'rmoqda
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Barcha yangi funksiyalar, Qidiruv, AI Test, Video Majlis va Nastroyka bo'yicha to'liq tushuntirish
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Step Selector + tutorial content */}
          <div className="lg:col-span-8 p-6 space-y-6">
            {/* Step Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {TUTORIAL_STEPS.map((s, idx) => {
                const StepIcon = s.icon;
                const active = idx === activeStep;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(idx)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                    {idx + 1}-Qadam
                  </button>
                );
              })}
            </div>

            {/* Active Step Card */}
            <div className="rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 p-6 space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 text-[11px] font-black text-indigo-300">
                <IconComp className="w-3.5 h-3.5" />
                {current.badge}
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                {current.title}
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                {current.description}
              </p>

              <div className="space-y-2 pt-2">
                {current.tips.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-2xl bg-white/5 border border-white/10 p-3 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    if (current.targetTab === 'settings') {
                      onClose();
                      onOpenSettings?.();
                    } else if (onNavigate) {
                      onClose();
                      onNavigate(current.targetTab);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2.5 text-xs font-black text-white shadow-lg cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  {current.actionLabel}
                </button>

                <div className="flex items-center gap-2">
                  {activeStep > 0 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className="rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      Orqaga
                    </button>
                  )}
                  {activeStep < TUTORIAL_STEPS.length - 1 ? (
                    <button
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white cursor-pointer"
                    >
                      Keyingi qadam
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white cursor-pointer"
                    >
                      Tushunarli, Boshlash!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Online Users Watching Now */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-950/70 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4 animate-pulse" />
                Hozir Onlayn ({onlineUsers.length})
              </h4>
              <span className="text-[11px] text-slate-400">Jonli holat</span>
            </div>

            <p className="text-xs text-slate-400">
              Platformada hozir faol bo'lgan foydalanuvchilar va ular ko'rayotgan bo'limlar:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {onlineUsers.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 border border-white/10 p-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 text-xs font-black text-white">
                      {u.avatarEmoji || u.name.charAt(0).toUpperCase()}
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{u.name}</p>
                      <p className="truncate text-[10px] text-emerald-300">
                        {u.currentActivity || `Faol: ${u.currentTab || 'Asosiy'}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
