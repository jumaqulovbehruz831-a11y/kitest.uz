import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  User,
  PlatformWheelConfig,
  WheelPrizeSegment,
  WheelPrizeType,
  DEFAULT_WHEEL_SEGMENTS,
  computeRankClass,
  ADMIN_EMAIL,
} from '../types';
import { KIDTEST_LOGO_DATA_URL, playKitestSound } from './KitestEmblem';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  X,
  Zap,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trophy,
  RotateCw,
  Users,
  Hand,
  Settings,
  Coins,
  Star,
  Award,
  Crown,
} from 'lucide-react';

interface LuckyWheelModalProps {
  isOpen: boolean;
  currentUser: User | null;
  users: User[];
  wheelConfig: PlatformWheelConfig;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  soundEnabled?: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  onUpdateUser: (user: User) => void;
  onRefreshState: () => Promise<void>;
}

const SEGMENT_COLORS = [
  { bg: '#0284c7', border: '#38bdf8', text: '#ffffff' },
  { bg: '#d97706', border: '#fbbf24', text: '#ffffff' },
  { bg: '#059669', border: '#34d399', text: '#ffffff' },
  { bg: '#7c3aed', border: '#a78bfa', text: '#ffffff' },
  { bg: '#e11d48', border: '#fb7185', text: '#ffffff' },
  { bg: '#eab308', border: '#fef08a', text: '#020617' },
  { bg: '#2563eb', border: '#60a5fa', text: '#ffffff' },
  { bg: '#0d9488', border: '#2dd4bf', text: '#ffffff' },
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  currentUser,
  users,
  wheelConfig,
  isAdminUnlocked,
  adminPasscode,
  soundEnabled = true,
  onClose,
  onRequireLogin,
  onUpdateUser,
  onRefreshState,
}) => {
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonResult, setWonResult] = useState<{
    points: number;
    label: string;
    type: WheelPrizeType;
    amount: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [grantSpinsCount, setGrantSpinsCount] = useState<number>(3);
  const [isBusyAdmin, setIsBusyAdmin] = useState<boolean>(false);
  const [showSegmentEditor, setShowSegmentEditor] = useState<boolean>(false);

  const activeSegments: WheelPrizeSegment[] =
    Array.isArray(wheelConfig.segments) && wheelConfig.segments.length === 8
      ? wheelConfig.segments
      : DEFAULT_WHEEL_SEGMENTS;

  const [editableSegments, setEditableSegments] =
    useState<WheelPrizeSegment[]>(activeSegments);

  useEffect(() => {
    if (
      Array.isArray(wheelConfig.segments) &&
      wheelConfig.segments.length === 8
    ) {
      setEditableSegments(wheelConfig.segments);
    }
  }, [wheelConfig.segments]);

  const tickTimeoutsRef = useRef<number[]>([]);

  if (!isOpen) return null;

  const isAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
          currentUser.role === 'admin')
    );

  const canSpin =
    isAdmin ||
    wheelConfig.globalEnabled ||
    Boolean(
      currentUser &&
        currentUser.wheelSpinAllowed &&
        (currentUser.wheelSpinsLeft === undefined ||
          currentUser.wheelSpinsLeft > 0)
    );

  const pendingWheelUsers = users.filter(
    (u) => u.wheelRequestStatus === 'pending' && !u.wheelSpinAllowed
  );

  const clearTickTimers = () => {
    tickTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    tickTimeoutsRef.current = [];
  };

  const scheduleWheelTicks = () => {
    clearTickTimers();
    const totalDuration = 4000;
    let elapsed = 80;
    let step = 95;
    while (elapsed < totalDuration - 150) {
      const tId = window.setTimeout(() => {
        playKitestSound('tick', soundEnabled);
      }, elapsed);
      tickTimeoutsRef.current.push(tId);
      elapsed += step;
      step = Math.round(step * 1.11);
    }
  };

  const handleSpinWheel = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    if (isSpinning) return;

    setErrorMsg(null);
    setStatusMsg(null);
    setWonResult(null);

    if (!canSpin) {
      playKitestSound('warning', soundEnabled);
      setErrorMsg(
        "Baraban faqat Bosh Admin ruxsat berganda ishlaydi! Pastdagi tugma orqali Admindan ruxsat so'rang."
      );
      return;
    }

    setIsSpinning(true);

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          adminUnlocked: isAdminUnlocked,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsSpinning(false);
        playKitestSound('warning', soundEnabled);
        setErrorMsg(
          data.error || 'Barabanni aylantirish uchun Admin ruxsati kerak!'
        );
        return;
      }

      const prizeIndex = Number(data.prizeIndex);
      const points = Number(data.wonPoints);
      const seg: WheelPrizeSegment =
        data.prizeSegment || activeSegments[prizeIndex] || activeSegments[0];

      const targetModAngle = (360 - prizeIndex * 45) % 360;
      const currentMod = ((rotationDeg % 360) + 360) % 360;
      let deltaAngle = targetModAngle - currentMod;
      if (deltaAngle <= 0) deltaAngle += 360;

      const nextRotation = rotationDeg + 360 * 6 + deltaAngle;
      setRotationDeg(nextRotation);
      scheduleWheelTicks();

      window.setTimeout(async () => {
        clearTickTimers();
        setIsSpinning(false);
        setWonResult({
          points,
          label: seg.label,
          type: seg.type,
          amount: seg.amount,
        });
        playKitestSound('fanfare', soundEnabled);

        if (data.user) {
          onUpdateUser(data.user);
        }
        await onRefreshState();

        try {
          confetti({
            particleCount: points >= 30 || seg.type === 'certificate' ? 160 : 95,
            spread: 85,
            origin: { y: 0.55 },
          });
        } catch {}
      }, 4200);
    } catch {
      setIsSpinning(false);
      setErrorMsg("Server bilan bog'lanishda xatolik yuz berdi");
    }
  };

  const handleRequestPermission = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/wheel/request-permission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        playKitestSound('success', soundEnabled);
        onUpdateUser(data.user);
        setStatusMsg(
          data.message ||
            "Baraban aylantirish uchun so'rovingiz Bosh Adminga yuborildi!"
        );
        await onRefreshState();
      } else {
        setErrorMsg(data.error || "So'rov yuborishda xatolik");
      }
    } catch {
      setErrorMsg('Server xatoligi');
    }
  };

  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-email': currentUser?.email || ADMIN_EMAIL,
    'x-admin-passcode': adminPasscode || ADMIN_PASSCODE_VALUE,
  };

  const handleAdminToggleGlobal = async () => {
    setIsBusyAdmin(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/wheel/toggle-global', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ enabled: !wheelConfig.globalEnabled }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        setStatusMsg(data.message);
        await onRefreshState();
      }
    } catch {}
    setIsBusyAdmin(false);
  };

  const handleAdminGrantUser = async (
    targetId: string,
    allow: boolean,
    spinsCount: number = 3,
    exactSpins?: number
  ) => {
    if (!targetId) return;
    setIsBusyAdmin(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/wheel/grant-user/${targetId}`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ allow, spinsCount, exactSpins }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        setStatusMsg(data.message);
        if (currentUser && data.user && data.user.id === currentUser.id) {
          onUpdateUser(data.user);
        }
        await onRefreshState();
      }
    } catch {}
    setIsBusyAdmin(false);
  };

  const handleAdminGrantAll = async () => {
    setIsBusyAdmin(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/wheel/grant-all', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ spinsCount: grantSpinsCount }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('victory', soundEnabled);
        setStatusMsg(data.message);
        await onRefreshState();
      }
    } catch {}
    setIsBusyAdmin(false);
  };

  const handleUpdateEditableSegment = (
    idx: number,
    patch: Partial<WheelPrizeSegment>
  ) => {
    setEditableSegments((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const next = { ...item, ...patch };
        if (patch.type || patch.amount !== undefined) {
          const amt = next.amount || 10;
          if (next.type === 'points') next.label = `+${amt} Ball`;
          else if (next.type === 'coins') next.label = `+${amt} Tanga 🪙`;
          else if (next.type === 'stars') next.label = `+${amt} Yulduz ⭐`;
          else if (next.type === 'certificate')
            next.label = `Sertifikat 🏅 (+${amt})`;
          else if (next.type === 'premium') next.label = `Premium 👑 (+${amt})`;
        }
        return next;
      })
    );
  };

  const handleSaveWheelSegments = async () => {
    setIsBusyAdmin(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/wheel/segments', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ segments: editableSegments }),
      });
      const data = await res.json();
      if (res.ok) {
        playKitestSound('success', soundEnabled);
        setStatusMsg(
          data.message || 'Baraban yutuqlari muvaffaqiyatli saqlandi!'
        );
        setShowSegmentEditor(false);
        await onRefreshState();
      } else {
        setErrorMsg(data.error || 'Saqlashda xatolik');
      }
    } catch {
      setErrorMsg('Server xatoligi');
    }
    setIsBusyAdmin(false);
  };

  const buildSegmentPath = (
    idx: number,
    radius: number,
    cx: number,
    cy: number
  ) => {
    const centerAngleDeg = idx * 45 - 90;
    const startAngleRad = ((centerAngleDeg - 22.5) * Math.PI) / 180;
    const endAngleRad = ((centerAngleDeg + 22.5) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startAngleRad);
    const y1 = cy + radius * Math.sin(startAngleRad);
    const x2 = cx + radius * Math.cos(endAngleRad);
    const y2 = cy + radius * Math.sin(endAngleRad);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const getSegmentShortText = (seg: WheelPrizeSegment) => {
    if (seg.type === 'coins') return { top: `+${seg.amount}`, sub: '🪙 TANGA' };
    if (seg.type === 'stars') return { top: `+${seg.amount}`, sub: '⭐ YULDUZ' };
    if (seg.type === 'certificate')
      return { top: '🏅 CERT', sub: `+${seg.amount} B` };
    if (seg.type === 'premium')
      return { top: '👑 VIP', sub: `+${seg.amount} B` };
    return { top: `+${seg.amount}`, sub: '⚡ BALL' };
  };

  const userRankClass = currentUser
    ? computeRankClass(currentUser.totalScore, currentUser.rankClass)
    : 'F';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 18 }}
          className="max-w-5xl w-full rounded-3xl bg-slate-900 border-2 border-amber-500/60 shadow-[0_0_70px_rgba(245,158,11,0.2)] overflow-hidden my-auto"
        >
          {/* Top Bar */}
          <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={KIDTEST_LOGO_DATA_URL}
                alt="KidTest"
                className="w-11 h-11 rounded-full border-2 border-amber-400"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-xl font-black text-white">
                    🎡 KITEST OMAD BARABANI (BALL · TANGA 🪙 · YULDUZ ⭐ · SERTIFIKAT 🏅)
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                      canSpin
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-rose-500/20 border-rose-400 text-rose-300'
                    }`}
                  >
                    {canSpin ? '✅ RUXSAT BERILGAN' : '🔒 ADMIN RUXSATI KERAK'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Barabanni aylantiring va Ball, Tanga (🪙), Yulduz (⭐) yoki Maxsus Sertifikat yutib oling!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentUser && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 font-mono text-xs">
                  <span className="text-amber-300 font-black">
                    ⚡ {currentUser.totalScore}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-yellow-300 font-black">
                    🪙 {currentUser.coins ?? 0}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-sky-300 font-black">
                    ⭐ {currentUser.stars ?? 0}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-200 text-[10px] font-black">
                    {userRankClass}
                  </span>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-h-[82vh] overflow-y-auto">
            {/* LEFT 7 COLS: THE SPINNING BARABAN */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-5">
              <div className="relative flex flex-col items-center">
                <div className="z-20 -mb-4 drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
                  <svg width="46" height="42" viewBox="0 0 46 42">
                    <polygon
                      points="23,40 4,6 42,6"
                      fill="#fbbf24"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    <circle cx="23" cy="12" r="5" fill="#dc2626" />
                  </svg>
                </div>

                <div className="relative w-[310px] h-[310px] sm:w-[370px] sm:h-[370px] rounded-full p-3 bg-gradient-to-tr from-amber-500 via-sky-400 to-amber-300 shadow-[0_0_60px_rgba(56,189,248,0.25)]">
                  <div
                    style={{
                      transform: `rotate(${rotationDeg}deg)`,
                      transition: isSpinning
                        ? 'transform 4.15s cubic-bezier(0.14, 0.88, 0.18, 1)'
                        : 'none',
                    }}
                    className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-slate-950"
                  >
                    <svg viewBox="0 0 360 360" className="w-full h-full">
                      <circle
                        cx="180"
                        cy="180"
                        r="178"
                        fill="#020617"
                        stroke="#fbbf24"
                        strokeWidth="4"
                      />

                      {activeSegments.map((seg, idx) => {
                        const col = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                        const centerAngleDeg = idx * 45 - 90;
                        const labelRad = (centerAngleDeg * Math.PI) / 180;
                        const labelR = 115;
                        const lx = 180 + labelR * Math.cos(labelRad);
                        const ly = 180 + labelR * Math.sin(labelRad);

                        const studRad =
                          ((centerAngleDeg - 22.5) * Math.PI) / 180;
                        const sx = 180 + 168 * Math.cos(studRad);
                        const sy = 180 + 168 * Math.sin(studRad);
                        const shortTxt = getSegmentShortText(seg);

                        return (
                          <g key={seg.id || idx}>
                            <path
                              d={buildSegmentPath(idx, 172, 180, 180)}
                              fill={col.bg}
                              stroke="#0f172a"
                              strokeWidth="2.5"
                            />
                            <circle
                              cx={sx}
                              cy={sy}
                              r="4.5"
                              fill="#fef08a"
                              stroke="#020617"
                              strokeWidth="1.5"
                            />
                            <g
                              transform={`translate(${lx}, ${ly}) rotate(${
                                idx * 45
                              })`}
                            >
                              <text
                                x="0"
                                y="-4"
                                textAnchor="middle"
                                fill={col.text}
                                fontFamily="JetBrains Mono, Outfit, sans-serif"
                                fontWeight="900"
                                fontSize="21"
                              >
                                {shortTxt.top}
                              </text>
                              <text
                                x="0"
                                y="14"
                                textAnchor="middle"
                                fill={col.text}
                                fontFamily="Inter, sans-serif"
                                fontWeight="800"
                                fontSize="10"
                              >
                                {shortTxt.sub}
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 rounded-full bg-slate-950 border-4 border-amber-400 shadow-2xl flex items-center justify-center p-1">
                        <img
                          src={KIDTEST_LOGO_DATA_URL}
                          alt="KidTest"
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Won Result Celebration Banner */}
              <AnimatePresence>
                {wonResult !== null && (
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 text-center shadow-2xl"
                  >
                    <div className="text-xs font-black uppercase tracking-wider">
                      🎉 TABRIKLAYMIZ! OMAD BARABANI YUTUG'I:
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono mt-0.5">
                      {wonResult.label}
                    </div>
                    <div className="text-xs font-bold mt-1">
                      ⚡ +{wonResult.points} ball hisobingizga qo'shildi! (Jami:{' '}
                      {currentUser?.totalScore} ball · 🪙 {currentUser?.coins ?? 0} · ⭐{' '}
                      {currentUser?.stars ?? 0})
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Spin Button */}
              <div className="w-full max-w-md space-y-2.5">
                <motion.button
                  whileHover={canSpin && !isSpinning ? { scale: 1.03 } : {}}
                  whileTap={canSpin && !isSpinning ? { scale: 0.97 } : {}}
                  disabled={isSpinning || !canSpin}
                  onClick={canSpin ? handleSpinWheel : undefined}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                    isSpinning
                      ? 'bg-sky-600 text-white cursor-wait'
                      : canSpin
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isSpinning ? (
                    <>
                      <RotateCw className="w-5 h-5 animate-spin" />
                      <span>Baraban Aylanmoqda...</span>
                    </>
                  ) : canSpin ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>
                        🎡 BARABANNI AYLANTIRISH
                        {!isAdmin &&
                        !wheelConfig.globalEnabled &&
                        currentUser?.wheelSpinsLeft
                          ? ` (${currentUser.wheelSpinsLeft} marta qoldi)`
                          : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 text-rose-400" />
                      <span>🔒 Faqat Admin Ruxsat Berganda Ishlaydi</span>
                    </>
                  )}
                </motion.button>

                {!canSpin && currentUser && (
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    disabled={currentUser.wheelRequestStatus === 'pending'}
                    className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2"
                  >
                    <Hand className="w-4 h-4 text-amber-300" />
                    <span>
                      {currentUser.wheelRequestStatus === 'pending'
                        ? "⏳ So'rovingiz Adminga Yuborilgan (Tasdiqlash Kutilmoqda)"
                        : "✋ Bosh Admindan Baraban Ruxsatini So'rash"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT 5 COLS: PRIZE TABLE, SEGMENT EDITOR & ADMIN PERMISSION PANEL */}
            <div className="lg:col-span-5 space-y-4">
              {statusMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Prize Segments Strip */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-extrabold text-white flex items-center justify-between">
                  <span>🎯 Barabandagi Yutuqlar (8 bo'lak):</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowSegmentEditor(!showSegmentEditor)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>
                        {showSegmentEditor ? 'Yopish' : "Yutuqlarni o'zgartirish"}
                      </span>
                    </button>
                  )}
                </div>

                {!showSegmentEditor ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {activeSegments.map((seg, i) => (
                      <div
                        key={seg.id || i}
                        className="p-2 rounded-xl border bg-slate-900 border-slate-800 text-center font-mono font-bold text-[11px] text-sky-200 truncate"
                      >
                        {seg.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="text-[11px] text-amber-300 font-bold">
                      ⚙️ Har bir bo'lakka Ball, Tanga (🪙), Yulduz (⭐), Sertifikat yoki Premium biriktiring:
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {editableSegments.map((seg, idx) => (
                        <div
                          key={seg.id || idx}
                          className="p-2 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-12 gap-1.5 items-center text-xs"
                        >
                          <span className="col-span-1 font-mono text-slate-400 font-bold">
                            #{idx + 1}
                          </span>
                          <select
                            value={seg.type}
                            onChange={(e) =>
                              handleUpdateEditableSegment(idx, {
                                type: e.target.value as WheelPrizeType,
                              })
                            }
                            className="col-span-4 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
                          >
                            <option value="points">⚡ Ball</option>
                            <option value="coins">🪙 Tanga</option>
                            <option value="stars">⭐ Yulduz</option>
                            <option value="certificate">🏅 Sertifikat</option>
                            <option value="premium">👑 Premium</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={5000}
                            value={seg.amount}
                            onChange={(e) =>
                              handleUpdateEditableSegment(idx, {
                                amount: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="col-span-3 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px]"
                          />
                          <input
                            type="text"
                            value={seg.label}
                            onChange={(e) =>
                              handleUpdateEditableSegment(idx, {
                                label: e.target.value,
                              })
                            }
                            className="col-span-4 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={isBusyAdmin}
                      onClick={handleSaveWheelSegments}
                      className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs"
                    >
                      💾 Baraban Yutuqlarini Saqlash
                    </button>
                  </div>
                )}
              </div>

              {/* ADMIN PERMISSION CONTROLS */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border-2 border-amber-500/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>👑 ADMIN: NECHA MARTA AYLANTIRISHNI BELGILASH</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isBusyAdmin}
                    onClick={handleAdminToggleGlobal}
                    className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all ${
                      wheelConfig.globalEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    {wheelConfig.globalEnabled ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>
                          Hozir Barchaga Cheksiz Ochiq (Limitli rejimga o'tish)
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          Barcha Foydalanuvchilarga Cheksiz Yoqish
                        </span>
                      </>
                    )}
                  </button>

                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Foydalanuvchi va aylantirish sonini tanlang:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedTargetUserId}
                        onChange={(e) => setSelectedTargetUserId(e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                      >
                        <option value="">— Ishtirokchini tanlang —</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} (@{u.username}){' '}
                            {u.wheelSpinAllowed
                              ? `[✅ ${u.wheelSpinsLeft || 1} marta]`
                              : u.wheelRequestStatus === 'pending'
                              ? '[⏳ So‘ragan]'
                              : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={grantSpinsCount}
                        onChange={(e) =>
                          setGrantSpinsCount(Number(e.target.value) || 1)
                        }
                        title="Aylantirishlar soni"
                        className="w-16 px-2 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 text-center"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 5, 10].map((cnt) => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setGrantSpinsCount(cnt)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold border ${
                            grantSpinsCount === cnt
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          {cnt} marta
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={!selectedTargetUserId || isBusyAdmin}
                        onClick={() =>
                          handleAdminGrantUser(
                            selectedTargetUserId,
                            true,
                            grantSpinsCount,
                            grantSpinsCount
                          )
                        }
                        className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs"
                      >
                        ✅ {grantSpinsCount} marta ruxsat berish
                      </button>

                      <button
                        type="button"
                        disabled={isBusyAdmin}
                        onClick={handleAdminGrantAll}
                        className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Barchaga +{grantSpinsCount} marta</span>
                      </button>
                    </div>
                  </div>

                  {pendingWheelUsers.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-300">
                        ⏳ Ruxsat so'raganlar ({pendingWheelUsers.length}):
                      </div>
                      <div className="max-h-28 overflow-y-auto space-y-1.5">
                        {pendingWheelUsers.map((pu) => (
                          <div
                            key={pu.id}
                            className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-white font-bold truncate">
                              {pu.name} (@{pu.username})
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAdminGrantUser(
                                  pu.id,
                                  true,
                                  grantSpinsCount,
                                  grantSpinsCount
                                )
                              }
                              className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shrink-0"
                            >
                              +{grantSpinsCount} marta ruxsat
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Spin Winners Feed */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Oxirgi Baraban G'oliblari</span>
                </div>

                {wheelConfig.recentSpins.length === 0 ? (
                  <div className="text-xs text-slate-500 py-4 text-center">
                    Hozircha baraban aylantirilmagan. Birinchi bo'lib omadingizni sinang!
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {wheelConfig.recentSpins.slice(0, 10).map((rec) => (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            {rec.userName}
                          </span>{' '}
                          <span className="text-slate-400 font-mono">
                            @{rec.username}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black">
                          {rec.prizeLabel || `+${rec.wonPoints} ball`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
