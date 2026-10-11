import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User, CELESTIAL_RANKS, CelestialRank } from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  Swords,
  Crosshair,
  Brain,
  Zap,
  Timer,
  Trophy,
  Users,
  Sparkles,
  ShieldAlert,
  Flame,
  Award,
  Plus,
  RefreshCw,
  Crown,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle2,
} from 'lucide-react';

interface KiteshotGameViewProps {
  currentUser: User | null;
  users: User[];
  soundEnabled?: boolean;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  onOpenPremium: () => void;
}

interface LivePlayer {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  score: number;
  health: number;
  kills: number;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  color: string;
  celestialRank?: string;
  lastSeenAt?: number;
}

interface Projectile {
  id: string;
  shooterId: string;
  shooterName: string;
  startX: number;
  startY: number;
  startZ: number;
  dirX: number;
  dirY: number;
  dirZ: number;
  color: string;
  timestamp: number;
}

interface TargetKite {
  id: string;
  x: number;
  y: number;
  z: number;
  points: number;
  speed: number;
  dir: number;
  type: 'bonus' | 'regular' | 'golden';
}

export const KiteshotGameView: React.FC<KiteshotGameViewProps> = ({
  currentUser,
  users,
  soundEnabled = true,
  onUpdateUser,
  onRequireLogin,
  onOpenPremium,
}) => {
  const [activeMode, setActiveMode] = useState<'kiteshot' | 'iq_memory'>('kiteshot');
  const [inGame, setInGame] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [killFeed, setKillFeed] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localScore, setLocalScore] = useState(0);

  // Player position in arena
  const playerPosRef = useRef({ x: 0, y: 0, z: -10, rotY: 0, health: 100 });
  const keysDownRef = useRef<{ [k: string]: boolean }>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Targets in 3D arena
  const targetsRef = useRef<TargetKite[]>([
    { id: 't1', x: -14, y: 5, z: 25, points: 20, speed: 0.08, dir: 1, type: 'regular' },
    { id: 't2', x: 0, y: 8, z: 35, points: 50, speed: 0.12, dir: -1, type: 'golden' },
    { id: 't3', x: 16, y: 6, z: 28, points: 20, speed: 0.09, dir: 1, type: 'regular' },
    { id: 't4', x: -8, y: 11, z: 42, points: 30, speed: 0.07, dir: 1, type: 'bonus' },
    { id: 't5', x: 12, y: 9, z: 40, points: 20, speed: 0.1, dir: -1, type: 'regular' },
  ]);

  const activeLasersRef = useRef<
    Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      life: number;
      color: string;
      shooterId: string;
    }>
  >([]);

  // User celestial multiplier
  const userRank: CelestialRank = (currentUser as any)?.celestialRank || 'moon';
  const celestialInfo = CELESTIAL_RANKS[userRank] || CELESTIAL_RANKS.moon;
  const multiplier = celestialInfo.multiplier;
  const isPremium = Boolean(currentUser?.isPremium);

  // IQ & Memory Game State
  const [iqStage, setIqStage] = useState<'idle' | 'showing' | 'answering' | 'result'>('idle');
  const [iqSequence, setIqSequence] = useState<number[]>([]);
  const [iqUserStep, setIqUserStep] = useState<number[]>([]);
  const [iqActiveTile, setIqActiveTile] = useState<number | null>(null);
  const [iqScore, setIqScore] = useState(0);
  const [iqLevel, setIqLevel] = useState(1);
  const [mathQuestion, setMathQuestion] = useState<{ q: string; opts: number[]; correct: number }>({
    q: '√144 + 5² - 7 = ?',
    opts: [30, 32, 28, 35],
    correct: 30,
  });

  // Handle joining game with 50 ball deduction or premium free time
  const handleStartGame = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setErrorMsg(null);
    try {
      const res = await fetch('/api/gameball/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          celestialRank: userRank,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "O'yinga kirishda xatolik yuz berdi");
      }

      playKitestSound('start', soundEnabled);
      setSessionTimeLeft(data.sessionDurationSeconds || 60);
      setInGame(true);
      setLocalScore(0);
      playerPosRef.current = { x: 0, y: 0, z: -10, rotY: 0, health: 100 };

      // Update user score
      onUpdateUser({
        ...currentUser,
        totalScore: data.userTotalScore !== undefined ? data.userTotalScore : currentUser.totalScore,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Ball yetarli emas (kamida 50 ball kerak)");
    }
  };

  // 1-minute countdown timer
  useEffect(() => {
    if (!inGame || sessionTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setInGame(false);
          playKitestSound('fanfare', soundEnabled);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [inGame, sessionTimeLeft, soundEnabled]);

  // Sync multiplayer state with backend
  useEffect(() => {
    if (!inGame || !currentUser) return;
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/gameball/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            x: playerPosRef.current.x,
            y: playerPosRef.current.y,
            z: playerPosRef.current.z,
            rotationY: playerPosRef.current.rotY,
            health: playerPosRef.current.health,
            score: localScore,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.players)) {
            setLivePlayers(data.players);
          }
        }
      } catch {
        // ignore network hiccup
      }
    }, 800);
    return () => clearInterval(syncInterval);
  }, [inGame, currentUser, localScore]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = true;
      if (e.code === 'Space' && inGame) {
        e.preventDefault();
        handleShoot();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [inGame]);

  // Fire laser projectile
  const handleShoot = useCallback(() => {
    if (!inGame || !currentUser) return;
    playKitestSound('click', soundEnabled);

    const pos = playerPosRef.current;
    const laserSpeed = 1.6;
    activeLasersRef.current.push({
      x: pos.x,
      y: pos.y + 1.2,
      z: pos.z,
      vx: Math.sin(pos.rotY) * laserSpeed,
      vy: 0.05,
      vz: Math.cos(pos.rotY) * laserSpeed,
      life: 60,
      color: '#38bdf8',
      shooterId: currentUser.id,
    });

    // Notify backend
    fetch('/api/gameball/shoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        startX: pos.x,
        startY: pos.y + 1.2,
        startZ: pos.z,
        dirX: Math.sin(pos.rotY) * laserSpeed,
        dirY: 0.05,
        dirZ: Math.cos(pos.rotY) * laserSpeed,
        color: '#38bdf8',
      }),
    }).catch(() => {});
  }, [inGame, currentUser, soundEnabled]);

  // Main 3D Canvas Rendering Loop (Kiteshot Arena)
  useEffect(() => {
    if (!inGame || activeMode !== 'kiteshot') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const W = (canvas.width = canvas.clientWidth || 800);
      const H = (canvas.height = canvas.clientHeight || 500);

      // Handle movement
      const pos = playerPosRef.current;
      const speed = 0.35;
      if (keysDownRef.current['w'] || keysDownRef.current['arrowup']) {
        pos.z += Math.cos(pos.rotY) * speed;
        pos.x += Math.sin(pos.rotY) * speed;
      }
      if (keysDownRef.current['s'] || keysDownRef.current['arrowdown']) {
        pos.z -= Math.cos(pos.rotY) * speed;
        pos.x -= Math.sin(pos.rotY) * speed;
      }
      if (keysDownRef.current['a'] || keysDownRef.current['arrowleft']) {
        pos.rotY -= 0.04;
      }
      if (keysDownRef.current['d'] || keysDownRef.current['arrowright']) {
        pos.rotY += 0.04;
      }

      // Constrain pos to arena bounds
      pos.x = Math.max(-28, Math.min(28, pos.x));
      pos.z = Math.max(-28, Math.min(28, pos.z));

      // 1. Draw Clean 3D Sky and Arena Floor
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#e0f2fe');
      skyGrad.addColorStop(0.5, '#f0f9ff');
      skyGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Horizon line
      const horizonY = H * 0.45;

      // Draw Perspective Grid Floor
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.2;
      for (let z = 1; z <= 25; z += 2) {
        const screenY = horizonY + (H - horizonY) * (1 / (1 + (26 - z) * 0.12));
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(W, screenY);
        ctx.stroke();
      }

      for (let x = -20; x <= 20; x += 4) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + (x - pos.x) * 3, horizonY);
        ctx.lineTo(W / 2 + (x - pos.x) * 45, H);
        ctx.stroke();
      }

      // 2. Update & Draw Target Kites
      targetsRef.current.forEach((t) => {
        t.x += t.speed * t.dir;
        if (t.x > 26 || t.x < -26) t.dir *= -1;

        // Project 3D point (t.x - pos.x, t.y, t.z - pos.z) to 2D
        const relZ = t.z - pos.z;
        if (relZ <= 2) return;

        const fov = 350;
        const scale = fov / relZ;
        const screenX = W / 2 + (t.x - pos.x) * scale;
        const screenY = horizonY - t.y * scale * 0.7;

        if (screenX > -50 && screenX < W + 50 && screenY > 0 && screenY < H) {
          ctx.save();
          ctx.translate(screenX, screenY);

          // Kite Diamond
          ctx.beginPath();
          ctx.moveTo(0, -18 * scale * 0.08);
          ctx.lineTo(14 * scale * 0.08, 0);
          ctx.lineTo(0, 22 * scale * 0.08);
          ctx.lineTo(-14 * scale * 0.08, 0);
          ctx.closePath();

          ctx.fillStyle =
            t.type === 'golden' ? '#f59e0b' : t.type === 'bonus' ? '#a855f7' : '#0284c7';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Target Label
          ctx.fillStyle = '#0f172a';
          ctx.font = `bold ${Math.max(10, Math.round(11 * scale * 0.07))}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`+${t.points} 🎯`, 0, -22 * scale * 0.08);
          ctx.restore();
        }
      });

      // 3. Draw Online Opponents in Arena
      livePlayers.forEach((lp) => {
        if (lp.id === currentUser?.id) return;
        const relZ = lp.z - pos.z;
        if (relZ <= 2) return;

        const fov = 350;
        const scale = fov / relZ;
        const screenX = W / 2 + (lp.x - pos.x) * scale;
        const screenY = horizonY - 1.2 * scale;

        // Draw Player Avatar / Model
        ctx.save();
        ctx.translate(screenX, screenY);

        // Name tag
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`👤 ${lp.name.split(' ')[0]} (${lp.score})`, 0, -28);

        // Health bar
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-20, -22, 40, 4);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-20, -22, (lp.health / 100) * 40, 4);

        // Body
        ctx.fillStyle = lp.color || '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, -8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      });

      // 4. Update and Draw Laser Beams
      activeLasersRef.current = activeLasersRef.current.filter((laser) => {
        laser.x += laser.vx;
        laser.y += laser.vy;
        laser.z += laser.vz;
        laser.life -= 1;

        // Check collision with targets
        targetsRef.current.forEach((t) => {
          const dist = Math.hypot(laser.x - t.x, laser.y - t.y, laser.z - t.z);
          if (dist < 3.5) {
            laser.life = 0;
            const won = Math.round(t.points * multiplier);
            setLocalScore((prev) => prev + won);
            playKitestSound('coin', soundEnabled);

            setKillFeed((kf) => [
              `🎯 Nishon urildi: +${won} Ball (${multiplier}X ${celestialInfo.symbol})`,
              ...kf.slice(0, 4),
            ]);

            // Notify backend hit
            fetch('/api/gameball/hit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shooterId: currentUser?.id,
                pointsWon: t.points,
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.newTotalScore !== undefined && currentUser) {
                  onUpdateUser({ ...currentUser, totalScore: d.newTotalScore });
                }
              })
              .catch(() => {});
          }
        });

        // Project laser to 2D
        const relZ = laser.z - pos.z;
        if (relZ > 1 && laser.life > 0) {
          const fov = 350;
          const scale = fov / relZ;
          const sx = W / 2 + (laser.x - pos.x) * scale;
          const sy = horizonY - laser.y * scale * 0.7;

          ctx.fillStyle = laser.color;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(3, 7 * scale * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }

        return laser.life > 0;
      });

      // 5. Draw Crosshair in Center
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      const cx = W / 2;
      const cy = H / 2 + 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inGame, activeMode, currentUser, multiplier, soundEnabled, livePlayers]);

  // IQ & Memory Game Logic
  const startIqGame = () => {
    setIqStage('showing');
    setIqScore(0);
    setIqLevel(1);
    const newSeq = [
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
      Math.floor(Math.random() * 4),
    ];
    setIqSequence(newSeq);
    setIqUserStep([]);
    playSequence(newSeq);
  };

  const playSequence = (seq: number[]) => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < seq.length) {
        setIqActiveTile(seq[i]);
        playKitestSound('tick', soundEnabled);
        setTimeout(() => setIqActiveTile(null), 450);
        i++;
      } else {
        clearInterval(timer);
        setIqStage('answering');
      }
    }, 800);
  };

  const handleTileClick = (idx: number) => {
    if (iqStage !== 'answering') return;
    playKitestSound('click', soundEnabled);
    setIqActiveTile(idx);
    setTimeout(() => setIqActiveTile(null), 300);

    const nextSteps = [...iqUserStep, idx];
    setIqUserStep(nextSteps);

    const stepIdx = nextSteps.length - 1;
    if (nextSteps[stepIdx] !== iqSequence[stepIdx]) {
      // Failed sequence
      playKitestSound('warning', soundEnabled);
      setIqStage('result');
      return;
    }

    if (nextSteps.length === iqSequence.length) {
      // Completed level!
      playKitestSound('success', soundEnabled);
      const earned = Math.round(25 * multiplier);
      setIqScore((prev) => prev + earned);
      setIqLevel((prev) => prev + 1);

      if (currentUser) {
        onUpdateUser({ ...currentUser, totalScore: currentUser.totalScore + earned });
      }

      const nextSeq = [...iqSequence, Math.floor(Math.random() * 4)];
      setIqSequence(nextSeq);
      setIqUserStep([]);
      setIqStage('showing');
      setTimeout(() => playSequence(nextSeq), 1000);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-slate-800">
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2">
            <Swords className="w-4 h-4 text-amber-300" />
            <span>3D Onlayn Multiplayer O'yin</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            KITESHOT 3D & IQ Matrix
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 font-medium mt-1 max-w-xl">
            Roblox va Hypershot uslubidagi otishma arenasi. Real onlayn foydalanuvchilar bilan 3D bellashuv.
            Kirish narxi: 1 daqiqa = 50 ball.
          </p>
        </div>

        {/* User Balance & Celestial Rank Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[110px]">
            <div className="text-[10px] font-mono uppercase text-sky-200">Hisobingiz:</div>
            <div className="text-xl font-black text-white">
              {currentUser?.totalScore || 0} <span className="text-xs font-bold">ball</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-400/20 backdrop-blur-md border border-amber-300/40 text-center min-w-[120px]">
            <div className="text-[10px] font-mono uppercase text-amber-200 flex items-center justify-center gap-1">
              <span>{celestialInfo.symbol}</span>
              <span>{celestialInfo.label}</span>
            </div>
            <div className="text-xl font-black text-amber-300">
              {multiplier}X <span className="text-xs font-bold">Rejim</span>
            </div>
          </div>

          {!isPremium && (
            <button
              type="button"
              onClick={onOpenPremium}
              className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-900 font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Premium (5 min bepul)</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveMode('kiteshot');
            setInGame(false);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
            activeMode === 'kiteshot'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Kiteshot 3D Otishma</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('iq_memory');
            setInGame(false);
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
            activeMode === 'iq_memory'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Xotira & IQ Matrix</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={onOpenPremium}
            className="py-1.5 px-3 rounded-lg bg-rose-600 text-white font-bold text-xs shrink-0"
          >
            Premiumga ulanish
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KITESHOT 3D FPS ARENA                                                  */}
      {/* ========================================================================= */}
      {activeMode === 'kiteshot' && (
        <div className="space-y-4">
          {!inGame ? (
            /* Lobby Before Playing */
            <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-sm text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                <Crosshair className="w-10 h-10" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-2xl font-black text-slate-900">
                  Kiteshot 3D Arenasiga Kirish
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Harakat: <kbd className="px-2 py-0.5 rounded bg-slate-100 font-mono">W A S D</kbd> yoki yo'nalish tugmalari.
                  Otish: <kbd className="px-2 py-0.5 rounded bg-slate-100 font-mono">Bo'shliq (Space)</kbd> yoki sichqoncha.
                </p>
                <div className="pt-2 text-xs font-bold text-sky-600">
                  Kirish narxi: 50 Ball = 1 minut (60 soniya)
                  {isPremium && <span className="text-emerald-600 ml-1">· VIP foydalanuvchilar bepul!</span>}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleStartGame}
                  className="py-4 px-8 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2.5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>50 Ball bilan O'yinni Boshlash (1 Minut)</span>
                </button>
              </div>

              {/* Online Players In Lobby */}
              <div className="pt-6 border-t border-slate-100 max-w-xl mx-auto">
                <div className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span>Onlayn O'yinchilar:</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {users.slice(0, 8).map((u) => (
                    <div
                      key={u.id}
                      className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{u.name.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-400">{u.totalScore} ball</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Active 3D Game Canvas */
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-sky-400/40 shadow-2xl">
              {/* Game HUD */}
              <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between text-white z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 text-xs font-black">
                    <Timer className="w-4 h-4 animate-spin" />
                    <span>00:{String(sessionTimeLeft).padStart(2, '0')}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-mono font-bold text-amber-300">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Yig'ilgan: +{localScore} Ball</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300 px-3 py-1 rounded-lg bg-sky-950/80 border border-sky-500/40">
                    {celestialInfo.symbol} {multiplier}X Multiplikator
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setInGame(false);
                      setSessionTimeLeft(0);
                    }}
                    className="py-1 px-3 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white text-xs font-bold"
                  >
                    Tugallash
                  </button>
                </div>
              </div>

              {/* Kill / Hit Feed */}
              {killFeed.length > 0 && (
                <div className="absolute top-16 left-4 space-y-1.5 z-10 pointer-events-none">
                  {killFeed.map((kf, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-sky-400/30 text-white text-[11px] font-bold shadow-md"
                    >
                      {kf}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Canvas viewport */}
              <canvas
                ref={canvasRef}
                onClick={handleShoot}
                className="w-full h-[520px] cursor-crosshair block"
              />

              {/* Mobile controls overlay */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10 pointer-events-auto sm:hidden">
                <div className="grid grid-cols-3 gap-1 w-32">
                  <div />
                  <button
                    type="button"
                    onTouchStart={() => (keysDownRef.current['w'] = true)}
                    onTouchEnd={() => (keysDownRef.current['w'] = false)}
                    className="w-10 h-10 rounded-xl bg-black/60 text-white font-bold"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    type="button"
                    onTouchStart={() => (keysDownRef.current['a'] = true)}
                    onTouchEnd={() => (keysDownRef.current['a'] = false)}
                    className="w-10 h-10 rounded-xl bg-black/60 text-white font-bold"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onTouchStart={() => (keysDownRef.current['s'] = true)}
                    onTouchEnd={() => (keysDownRef.current['s'] = false)}
                    className="w-10 h-10 rounded-xl bg-black/60 text-white font-bold"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onTouchStart={() => (keysDownRef.current['d'] = true)}
                    onTouchEnd={() => (keysDownRef.current['d'] = false)}
                    className="w-10 h-10 rounded-xl bg-black/60 text-white font-bold"
                  >
                    ▶
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleShoot}
                  className="w-16 h-16 rounded-full bg-rose-600 text-white font-black text-xs shadow-lg active:scale-95"
                >
                  OTISH
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 3D XOTIRA VA IQ MATRIX                                                 */}
      {/* ========================================================================= */}
      {activeMode === 'iq_memory' && (
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 mb-1">
                <Brain className="w-4 h-4" />
                <span>Miya va Diqqat Mashqi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Algoritmik Xotira va IQ Testi
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Yutuq:</div>
                <div className="text-lg font-black text-purple-600">+{iqScore} Ball</div>
              </div>

              <div className="text-right pl-3 border-l border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Daraja:</div>
                <div className="text-lg font-black text-slate-900">{iqLevel}-bosqich</div>
              </div>
            </div>
          </div>

          {iqStage === 'idle' ? (
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <p className="text-xs text-slate-600">
                Kvadratlar ketma-ketligi yonadi. Xotirangizda saqlang va xuddi shu tartibda bosing! Har bir muvaffaqiyatli bosqich uchun {multiplier}X multiplikator bilan ball beriladi.
              </p>
              <button
                type="button"
                onClick={startIqGame}
                className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>IQ Mashqini Boshlash</span>
              </button>
            </div>
          ) : iqStage === 'result' ? (
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <div className="text-3xl">🎯</div>
              <h3 className="text-lg font-black text-slate-900">Bosqich Yakunlandi!</h3>
              <p className="text-xs text-slate-600">
                Siz {iqLevel - 1} ta bosqichdan muvaffaqiyatli o'tdingiz va jami <strong>+{iqScore} ball</strong> to'pladingiz.
              </p>
              <button
                type="button"
                onClick={startIqGame}
                className="py-3 px-6 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Qaytadan O'ynash</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center text-xs font-bold text-slate-600">
                {iqStage === 'showing' ? '👀 Eslab qoling...' : '👉 Navbat sizda: Ketma-ketlikni bosing!'}
              </div>

              {/* 4-Tile Memory Matrix */}
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                {[
                  { id: 0, color: 'bg-sky-500', activeColor: 'bg-sky-300 ring-4 ring-sky-300' },
                  { id: 1, color: 'bg-emerald-500', activeColor: 'bg-emerald-300 ring-4 ring-emerald-300' },
                  { id: 2, color: 'bg-amber-500', activeColor: 'bg-amber-300 ring-4 ring-amber-300' },
                  { id: 3, color: 'bg-rose-500', activeColor: 'bg-rose-300 ring-4 ring-rose-300' },
                ].map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={iqStage !== 'answering'}
                    onClick={() => handleTileClick(tile.id)}
                    className={`h-28 rounded-3xl transition-all transform active:scale-95 cursor-pointer shadow-md ${
                      iqActiveTile === tile.id ? tile.activeColor : tile.color
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
