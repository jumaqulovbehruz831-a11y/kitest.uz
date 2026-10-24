import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Hand,
  PhoneOff,
  Users,
  MessageSquare,
  Send,
  Sparkles,
  ShieldAlert,
  Crown,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Camera,
  RefreshCw,
  Radio,
  Smile,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Settings,
  Save,
  Play,
} from 'lucide-react';
import { User, MajlisRoomState, MajlisParticipant, OnlinePresenceUser } from '../types';

interface MajlisViewProps {
  user: User;
  onlineUsers: OnlinePresenceUser[];
  onNavigate?: (tab: string) => void;
  onShowToast?: (msg: string) => void;
}

const QUICK_REACTIONS = ['👏', '🔥', '👍', '❤️', '🚀', '💡', '🎉', '✋'];

export const MajlisView: React.FC<MajlisViewProps> = ({
  user,
  onlineUsers,
  onNavigate,
  onShowToast,
}) => {
  const [room, setRoom] = useState<MajlisRoomState | null>(null);
  const [allOnline, setAllOnline] = useState<OnlinePresenceUser[]>(onlineUsers || []);
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [roomTitleInput, setRoomTitleInput] = useState('Bosh Admin va Onlayn Foydalanuvchilar Video Majlisi');
  const [roomTopicInput, setRoomTopicInput] = useState('Platforma yangiliklari, Jonli Savol-Javob va Bilimlar bellashuvi');
  const [isEditingRoomInfo, setIsEditingRoomInfo] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight'>('grid');
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [recordingsList, setRecordingsList] = useState<any[]>([]);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [recordingNotes, setRecordingNotes] = useState('');
  const [isSavingRecording, setIsSavingRecording] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isAdminOrHost =
    user.role === 'admin' ||
    user.role === 'creator' ||
    Boolean(user.permissions?.canHostMajlis) ||
    room?.hostId === user.id;

  const fetchMajlisState = useCallback(async () => {
    try {
      const res = await fetch('/api/majlis/state', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.room || data.majlisState) {
        setRoom(data.room || data.majlisState);
      }
      if (Array.isArray(data.onlineUsers)) {
        setAllOnline(data.onlineUsers);
      }
    } catch {
      // ignore network error
    }
  }, []);

  const fetchRecordings = useCallback(async () => {
    try {
      const res = await fetch('/api/majlis/recordings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.recordings)) setRecordingsList(data.recordings);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchMajlisState();
    fetchRecordings();
    const interval = setInterval(fetchMajlisState, 2000);
    return () => clearInterval(interval);
  }, [fetchMajlisState, fetchRecordings]);

  const handleSaveRecording = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRecording(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/majlis/save-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: recordingTitle || room?.title || 'Video Majlis Yozuvi',
          topic: room?.topic || 'Jonli video dars va savol-javob',
          hostName: user.name,
          notes: recordingNotes || 'Barcha ishtirokchilar bilan sermazmun muloqot o‘tkazildi.',
          durationMinutes: 25,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg('🎥 Majlis yozuvi va tafsilotlari muvaffaqiyatli saqlandi!');
        setRecordingsList(data.recordings || []);
        setRecordingTitle('');
        setRecordingNotes('');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch {
      setSaveSuccessMsg("Xatolik yuz berdi, qaytadan urinib ko'ring.");
    } finally {
      setIsSavingRecording(false);
    }
  };

  // Capture frame from local video and send to server every 1.6s when joined
  const captureFrameBase64 = useCallback((): string | undefined => {
    if (!cameraOn && !screenSharing) return undefined;
    const videoEl = localVideoRef.current;
    if (!videoEl || videoEl.readyState < 2) return undefined;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    try {
      return canvas.toDataURL('image/jpeg', 0.55);
    } catch {
      return undefined;
    }
  }, [cameraOn, screenSharing]);

  // Sync participant state + video snapshot with backend
  useEffect(() => {
    if (!joined) return;
    const syncFrame = async () => {
      const frameData = captureFrameBase64();
      try {
        const res = await fetch('/api/majlis/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            avatarUrl: user.avatarUrl,
            avatarEmoji: user.avatarEmoji,
            cameraOn,
            micOn,
            screenSharing,
            handRaised,
            speaking,
            frameData,
            reaction: activeReaction || undefined,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.room || data.majlisState) setRoom(data.room || data.majlisState);
        }
      } catch {
        // ignore transient error
      }
    };

    syncFrame();
    const timer = setInterval(syncFrame, 1600);
    return () => clearInterval(timer);
  }, [
    joined,
    cameraOn,
    micOn,
    screenSharing,
    handRaised,
    speaking,
    activeReaction,
    captureFrameBase64,
    user,
  ]);

  // Attach stream to video element whenever localVideoRef or camera state changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [joined, cameraOn, screenSharing]);

  // Stop media tracks on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startLocalMedia = async (wantVideo: boolean, wantAudio: boolean) => {
    setCameraError(null);
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (!wantVideo && !wantAudio) {
        localStreamRef.current = null;
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        setCameraOn(false);
        setMicOn(false);
        setSpeaking(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo
          ? { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' }
          : false,
        audio: wantAudio,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }
      setCameraOn(wantVideo && stream.getVideoTracks().length > 0);
      setMicOn(wantAudio && stream.getAudioTracks().length > 0);

      // Voice activity detector
      if (wantAudio && stream.getAudioTracks().length > 0) {
        try {
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setSpeaking(avg > 18);
          };
          const audioTimer = setInterval(checkAudio, 350);
          stream.getAudioTracks()[0].addEventListener('ended', () => clearInterval(audioTimer));
        } catch {
          // ignore audio context issues
        }
      }
    } catch (err: any) {
      setCameraError(
        "Kamera yoki mikrofonga ruxsat berilmadi. Brauzer ruxsatini tekshiring yoki kamera yoqmasdan majlisda qatnashing."
      );
      if (wantVideo && wantAudio) {
        // Fallback to audio only or no media
        setCameraOn(false);
      }
    }
  };

  const handleJoinMajlis = async (withCamera = true) => {
    if (withCamera) {
      await startLocalMedia(true, true);
    }
    try {
      const res = await fetch('/api/majlis/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
          avatarEmoji: user.avatarEmoji,
          cameraOn: withCamera,
          micOn: withCamera,
          screenSharing: false,
          handRaised: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room || data.majlisState) setRoom(data.room || data.majlisState);
      }
      setJoined(true);
      onShowToast?.("🎥 Video Majlisga muvaffaqiyatli qo'shildingiz!");
    } catch {
      setJoined(true);
    }
  };

  const handleLeaveMajlis = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setCameraOn(false);
    setMicOn(false);
    setScreenSharing(false);
    setHandRaised(false);
    setJoined(false);

    try {
      await fetch('/api/majlis/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id }),
      });
      fetchMajlisState();
      onShowToast?.('Majlisdan chiqdingiz.');
    } catch {
      // ignore
    }
  };

  const toggleCamera = async () => {
    const nextCam = !cameraOn;
    setScreenSharing(false);
    await startLocalMedia(nextCam, micOn);
  };

  const toggleMic = async () => {
    const nextMic = !micOn;
    if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextMic;
      });
      setMicOn(nextMic);
      if (!nextMic) setSpeaking(false);
    } else {
      await startLocalMedia(cameraOn, nextMic);
    }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      setScreenSharing(false);
      await startLocalMedia(cameraOn, micOn);
      return;
    }
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = displayStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
        await localVideoRef.current.play().catch(() => {});
      }
      setScreenSharing(true);
      setCameraOn(true);
      displayStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        setCameraOn(false);
      };
    } catch {
      onShowToast?.("Ekran ulashish bekor qilindi.");
    }
  };

  const handleSaveRoomInfo = async () => {
    try {
      const res = await fetch('/api/majlis/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: roomTitleInput,
          topic: roomTopicInput,
          hostId: user.id,
          hostName: user.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room || data.majlisState) setRoom(data.room || data.majlisState);
        setIsEditingRoomInfo(false);
        onShowToast?.('💾 Majlis mavzusi va sozlamalari saqlandi!');
      }
    } catch {
      onShowToast?.('Xatolik yuz berdi');
    }
  };

  const handleSendMajlisChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await fetch('/api/majlis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          name: user.name,
          role: user.role,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room || data.majlisState) setRoom(data.room || data.majlisState);
      }
    } catch {
      // ignore
    }
  };

  const handleTriggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 4000);
  };

  const handleHostAction = async (action: string, targetUserId?: string) => {
    try {
      const res = await fetch('/api/majlis/host-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, targetUserId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.room || data.majlisState) setRoom(data.room || data.majlisState);
        onShowToast?.('Admin buyrug‘i bajarildi!');
      }
    } catch {
      // ignore
    }
  };

  const participants: MajlisParticipant[] = room?.participants || [];
  const pinnedParticipant = participants.find(
    (p) => p.userId === (pinnedUserId || room?.pinnedUserId)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Majlis Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/95 via-indigo-950/90 to-purple-950/90 p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 border border-rose-500/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                🎥 JONLI VIDEO MAJLIS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                <Users className="w-3.5 h-3.5" />
                Majlisda: {participants.length} kishi
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-300">
                <Radio className="w-3.5 h-3.5" />
                Saytda onlayn: {allOnline.length} kishi
              </span>
            </div>

            {isEditingRoomInfo ? (
              <div className="mt-3 flex flex-col sm:flex-row gap-2 max-w-2xl">
                <input
                  type="text"
                  value={roomTitleInput}
                  onChange={(e) => setRoomTitleInput(e.target.value)}
                  placeholder="Majlis nomi..."
                  className="flex-1 rounded-xl bg-slate-900/90 border border-indigo-500/40 px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="text"
                  value={roomTopicInput}
                  onChange={(e) => setRoomTopicInput(e.target.value)}
                  placeholder="Majlis mavzusi..."
                  className="flex-1 rounded-xl bg-slate-900/90 border border-indigo-500/40 px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleSaveRoomInfo}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Saqlash
                </button>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                  {room?.title || 'Bosh Admin va Onlayn Foydalanuvchilar Video Majlisi'}
                  {isAdminOrHost && (
                    <button
                      onClick={() => {
                        setRoomTitleInput(room?.title || roomTitleInput);
                        setRoomTopicInput(room?.topic || roomTopicInput);
                        setIsEditingRoomInfo(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-xs font-bold text-indigo-200 cursor-pointer"
                      title="Majlis nomini tahrirlash"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Tahrirlash
                    </button>
                  )}
                </h1>
                <p className="text-sm text-slate-300 mt-1">
                  {room?.topic ||
                    'Kamera, mikrofon va ekran ulashish orqali onlayn foydalanuvchilar bilan jonli muloqot qiling.'}
                </p>
              </div>
            )}
          </div>

          {/* Join / Leave CTA */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!joined ? (
              <>
                <button
                  onClick={() => handleJoinMajlis(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  Kamera bilan qo'shilish
                </button>
                <button
                  onClick={() => handleJoinMajlis(false)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-3 text-sm font-bold text-white transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Kuzatuvchi bo'lib kirish
                </button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={toggleCamera}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
                    cameraOn
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-rose-600/80 text-white hover:bg-rose-600'
                  }`}
                >
                  {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  {cameraOn ? 'Kamera Yoqilgan' : "Kamera O'chiq"}
                </button>

                <button
                  onClick={toggleMic}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all cursor-pointer ${
                    micOn
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/10'
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  {micOn ? 'Mikrofon Yoqilgan' : "Mikrofon O'chiq"}
                </button>

                <button
                  onClick={toggleScreenShare}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    screenSharing
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  <MonitorUp className="w-4 h-4" />
                  {screenSharing ? 'Ekran Ulashilmoqda' : 'Ekran Ulashish'}
                </button>

                <button
                  onClick={() => setHandRaised(!handRaised)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    handRaised
                      ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                      : 'bg-white/10 text-slate-200 hover:bg-white/15 border border-white/10'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  {handRaised ? "Qo'l ko'tarilgan ✋" : "Qo'l ko'tarish"}
                </button>

                <button
                  onClick={handleLeaveMajlis}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-lg cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            )}
          </div>
        </div>

        {cameraError && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              {cameraError}
            </span>
            <button
              onClick={() => setCameraError(null)}
              className="text-amber-300 hover:text-white font-bold cursor-pointer"
            >
              Yopish
            </button>
          </div>
        )}
      </div>

      {/* Main Video Grid + Sidebars */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Video Stage (8 cols on XL) */}
        <div className="xl:col-span-8 space-y-4">
          {/* Pinned / Spotlight Video if any */}
          {pinnedParticipant && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-indigo-500/60 bg-slate-950 aspect-video shadow-2xl">
              {pinnedParticipant.userId === user.id && (cameraOn || screenSharing) ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : pinnedParticipant.cameraOn && (pinnedParticipant.frameDataUrl || pinnedParticipant.frameData) ? (
                <img
                  src={pinnedParticipant.frameDataUrl || pinnedParticipant.frameData}
                  alt={pinnedParticipant.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600/30 border-2 border-indigo-400/50 text-4xl font-black text-white shadow-xl">
                    {pinnedParticipant.avatarEmoji || pinnedParticipant.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="mt-3 text-lg font-black text-white">{pinnedParticipant.name}</p>
                  <p className="text-xs text-slate-400">@{pinnedParticipant.username}</p>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/65 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-white border border-white/15">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Asosiy Ekranda: {pinnedParticipant.name}
              </div>
              <button
                onClick={() => setPinnedUserId(null)}
                className="absolute top-4 right-4 rounded-xl bg-black/60 hover:bg-black/80 px-3 py-1.5 text-xs font-bold text-white border border-white/15 cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Video Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Local User Video Tile (Always shown first if joined or preview) */}
            <div
              className={`relative overflow-hidden rounded-3xl border bg-slate-950 aspect-video shadow-xl transition-all ${
                speaking
                  ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                  : 'border-white/15 hover:border-indigo-500/50'
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  cameraOn || screenSharing ? 'block' : 'hidden'
                }`}
              />

              {!cameraOn && !screenSharing && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 p-4 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-3xl font-black text-white shadow-lg">
                    {user.avatarEmoji || user.name.charAt(0).toUpperCase()}
                    {speaking && (
                      <span className="absolute -inset-1.5 rounded-full border-2 border-emerald-400 animate-ping" />
                    )}
                  </div>
                  <p className="mt-3 text-base font-black text-white">
                    {user.name} (Siz)
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {joined
                      ? "Kamerangiz o'chiq — yoqish uchun pastdagi Kamera tugmasini bosing"
                      : "Kamera bilan qo'shilish tugmasini bosing"}
                  </p>
                  {!joined && (
                    <button
                      onClick={() => handleJoinMajlis(true)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-lg cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Kamerani yoqib kirish
                    </button>
                  )}
                </div>
              )}

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="rounded-lg bg-black/65 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-white border border-white/10">
                  Siz ({user.name})
                </span>
                {user.role === 'admin' && (
                  <span className="rounded-lg bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-slate-950">
                    ADMIN
                  </span>
                )}
                {handRaised && (
                  <span className="rounded-lg bg-amber-500/90 px-2 py-0.5 text-xs">✋</span>
                )}
              </div>

              {activeReaction && (
                <div className="absolute top-3 right-3 text-3xl animate-bounce">
                  {activeReaction}
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${
                      micOn ? 'bg-emerald-500/80 text-white' : 'bg-rose-600/80 text-white'
                    }`}
                  >
                    {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${
                      cameraOn ? 'bg-emerald-500/80 text-white' : 'bg-rose-600/80 text-white'
                    }`}
                  >
                    {cameraOn ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <VideoOff className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setPinnedUserId(pinnedUserId === user.id ? null : user.id)
                  }
                  className="rounded-lg bg-black/60 hover:bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white border border-white/10 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Remote Participants Tiles */}
            {participants
              .filter((p) => p.userId !== user.id)
              .map((participant, pIdx) => {
                const partFrame = participant.frameDataUrl || participant.frameData;
                const isPartSpeaking = Boolean(participant.speaking || participant.isSpeaking);
                return (
                  <div
                    key={`majlis_part_${participant.userId}_${pIdx}`}
                    className={`relative overflow-hidden rounded-3xl border bg-slate-950 aspect-video shadow-xl transition-all ${
                      isPartSpeaking
                        ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                        : 'border-white/15 hover:border-indigo-500/50'
                    }`}
                  >
                    {participant.cameraOn && partFrame ? (
                      <img
                        src={partFrame}
                        alt={participant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : participant.cameraOn ? (
                      <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-4 text-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.25)_0%,transparent_70%)] animate-pulse" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600/40 border-2 border-indigo-400/60 text-3xl font-black text-white shadow-2xl">
                          {participant.avatarEmoji || participant.name.charAt(0).toUpperCase()}
                          {isPartSpeaking && (
                            <span className="absolute -inset-2 rounded-2xl border-2 border-emerald-400 animate-ping" />
                          )}
                        </div>
                        <p className="mt-3 text-base font-black text-white relative z-10 flex items-center gap-1.5">
                          <span>{participant.name}</span>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </p>
                        <p className="text-xs text-indigo-300 relative z-10 font-mono">
                          HD Jonli Kamera • 1080p
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 p-4 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/30 border border-indigo-400/40 text-3xl font-black text-white">
                          {participant.avatarEmoji || participant.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="mt-3 text-base font-black text-white">
                          {participant.name}
                        </p>
                        <p className="text-xs text-slate-400">@{participant.username}</p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-300">
                          Kamera o'chiq
                        </span>
                      </div>
                    )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="rounded-lg bg-black/65 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-white border border-white/10">
                      {participant.name}
                    </span>
                    {participant.role === 'admin' && (
                      <span className="rounded-lg bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-slate-950">
                        ADMIN
                      </span>
                    )}
                    {participant.handRaised && (
                      <span className="rounded-lg bg-amber-500/90 px-2 py-0.5 text-xs">
                        ✋ Qo'l ko'tardi
                      </span>
                    )}
                  </div>

                  {participant.reaction && (
                    <div className="absolute top-3 right-3 text-3xl animate-bounce">
                      {participant.reaction}
                    </div>
                  )}

                  {/* Bottom Controls for Participant */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${
                          participant.micOn
                            ? 'bg-emerald-500/80 text-white'
                            : 'bg-rose-600/80 text-white'
                        }`}
                      >
                        {participant.micOn ? (
                          <Mic className="w-3.5 h-3.5" />
                        ) : (
                          <MicOff className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${
                          participant.cameraOn
                            ? 'bg-emerald-500/80 text-white'
                            : 'bg-rose-600/80 text-white'
                        }`}
                      >
                        {participant.cameraOn ? (
                          <Video className="w-3.5 h-3.5" />
                        ) : (
                          <VideoOff className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAdminOrHost && participant.micOn && (
                        <button
                          onClick={() => handleHostAction('mute_user', participant.userId)}
                          className="rounded-lg bg-rose-600/80 hover:bg-rose-600 px-2 py-1 text-[10px] font-bold text-white cursor-pointer"
                          title="Mikrofonini o'chirish"
                        >
                          Ovozsiz qilish
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setPinnedUserId(
                            pinnedUserId === participant.userId ? null : participant.userId
                          )
                        }
                        className="rounded-lg bg-black/60 hover:bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white border border-white/10 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Reaction & Host Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 mr-1">Jonli Emotsiyalar:</span>
              {QUICK_REACTIONS.map((emoji, rxIdx) => (
                <button
                  key={`majlis_emo_${emoji}_${rxIdx}`}
                  onClick={() => handleTriggerReaction(emoji)}
                  className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-rose-600/30 cursor-pointer transition-all active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>🔴 Yozib Olish & Saqlash</span>
              </button>

              {isAdminOrHost && (
                <button
                  onClick={() => handleHostAction('mute_all')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-200 cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Barchani ovozsiz qilish
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Online Users & Live Majlis Chat (4 cols on XL) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Online Users & Participants Box */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Onlayn Foydalanuvchilar ({allOnline.length})
              </h3>
              <button
                onClick={fetchMajlisState}
                className="rounded-lg bg-white/5 hover:bg-white/10 p-1.5 text-slate-300 cursor-pointer"
                title="Yangilash"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {allOnline.map((u, oIdx) => {
                const inRoom = participants.some((p) => p.userId === u.userId);
                return (
                  <div
                    key={`majlis_online_${u.userId || 'anon'}_${oIdx}`}
                    className="flex items-center justify-between gap-2 rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-sm font-black text-white">
                        {u.avatarEmoji || u.name.charAt(0).toUpperCase()}
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white flex items-center gap-1.5">
                          {u.name}
                          {u.role === 'admin' && (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300">
                              ADMIN
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {inRoom
                            ? '🎥 Video Majlisda'
                            : u.currentActivity || `Bo'lim: ${u.currentTab || 'Asosiy'}`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                        inRoom
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {inRoom ? 'Majlisda' : 'Onlayn'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Majlis Live Chat */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-xl h-[420px]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Majlis Jonli Chati
              </h3>
              <span className="text-[11px] text-slate-400">
                {(room?.messages || []).length} ta xabar
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
              {(room?.messages || []).length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                  Majlis davomida savol va fikrlaringizni shu yerda yozing.
                </div>
              ) : (
                (room?.messages || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-3 text-xs ${
                      msg.userId === user.id
                        ? 'bg-indigo-600/25 border border-indigo-500/30 ml-4'
                        : 'bg-white/5 border border-white/10 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-black text-white flex items-center gap-1">
                        {msg.name}
                        {msg.role === 'admin' && (
                          <span className="rounded bg-amber-500/30 px-1.5 py-0.2 text-[9px] text-amber-300">
                            ADMIN
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMajlisChat} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Majlis chatiga xabar yozing..."
                className="flex-1 rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 p-2.5 text-white shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recording & Session Archive Modal */}
      {isRecordingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full rounded-3xl bg-slate-900 border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>🎥 Video Majlisni Yozib Olish & Saqlash</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordingModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                {saveSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveRecording} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Majlis Nomi</label>
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder={room?.title || 'CHSB & Olimpiada Video Majlisi'}
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Majlis Tafsilotlari & Qaydlar
                </label>
                <textarea
                  rows={3}
                  value={recordingNotes}
                  onChange={(e) => setRecordingNotes(e.target.value)}
                  placeholder="Muhokama qilingan masalalar, topshiriqlar va video xulosasi..."
                  className="w-full rounded-xl bg-slate-950 border border-white/15 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Majlisda hozirda: <strong>{participants.length}</strong> ishtirokchi
                </span>
                <button
                  type="submit"
                  disabled={isSavingRecording}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingRecording ? 'Saqlanmoqda...' : 'Yozuvni Saqlash'}</span>
                </button>
              </div>
            </form>

            {/* Previously Saved Recordings */}
            {recordingsList.length > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Oldingi Saqlangan Majlislar ({recordingsList.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {recordingsList.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white truncate max-w-xs">{rec.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {rec.durationMinutes} daqiqa • {rec.participantsCount} kishi • {rec.hostName}
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        Saqlangan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
