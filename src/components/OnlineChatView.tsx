import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  TestItem,
  ChatMessage,
  ChatGroup,
  OnlinePresenceUser,
  computeRankClass,
  RANK_CLASS_META,
  ADMIN_EMAIL,
} from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Hash,
  Search,
  Reply,
  Trash2,
  X,
  BookOpen,
  ShieldCheck,
  MapPin,
  Bot,
  Circle,
  ArrowRight,
  LogIn,
  Crown,
  Megaphone,
  Plus,
  Image as ImageIcon,
  Mic,
  Square,
  Pin,
  Volume2,
  Video,
  Phone,
  PhoneOff,
  PhoneCall,
  MicOff,
} from 'lucide-react';

interface OnlineChatViewProps {
  currentUser: User | null;
  isAdminUnlocked?: boolean;
  adminPasscode?: string;
  users: User[];
  tests: TestItem[];
  initialMessages: ChatMessage[];
  initialChatGroups?: ChatGroup[];
  initialOnlineUsers: OnlinePresenceUser[];
  soundEnabled?: boolean;
  onSelectTest: (test: TestItem) => void;
  onRequireLogin: () => void;
  onOpenMajlis?: () => void;
}

interface ChatChannel {
  id: string;
  name: string;
  subtitle: string;
  isAiRoom?: boolean;
}

const PUBLIC_CHANNELS: ChatChannel[] = [
  {
    id: 'global',
    name: 'Umumiy Muloqot',
    subtitle: 'Barcha ishtirokchilar onlayn suhbati',
  },
  {
    id: 'chsb',
    name: 'CHSB va Olimpiada',
    subtitle: 'Imtihonlar va testlar muhokamasi',
  },
  {
    id: 'math',
    name: 'Matematika va Fizika',
    subtitle: 'Masalalar va formulalar yordami',
  },
  {
    id: 'it',
    name: 'Informatika va Dasturlash',
    subtitle: 'Algoritmlar va kod muhokamasi',
  },
  {
    id: 'ai_tutor',
    name: 'KITEST AI Ustoz',
    subtitle: "Sun'iy intellekt bilan jonli savol-javob",
    isAiRoom: true,
  },
];

const AI_MOODS: {
  id: 'ustoz' | 'motivator' | 'strict' | 'friend';
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { id: 'ustoz', label: 'Mehribon Ustoz', emoji: '👨‍🏫', desc: 'Tushunarli va bosiq' },
  { id: 'motivator', label: 'Motivator', emoji: '🔥', desc: 'Ruhlantiruvchi energiya' },
  { id: 'strict', label: 'Qattiqqo\'l Professor', emoji: '🧐', desc: 'Aniq va talabchan' },
  { id: 'friend', label: 'Yaqin Do\'st', emoji: '😎', desc: 'Samimiy va sodda' },
];

const REACTION_EMOJIS = ['👍', '🔥', '❤️', '💡', '👏'];

function getDmRoomId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `dm_${sorted[0]}_${sorted[1]}`;
}

export const OnlineChatView: React.FC<OnlineChatViewProps> = ({
  currentUser,
  isAdminUnlocked = false,
  adminPasscode = '',
  users,
  tests,
  initialMessages,
  initialChatGroups = [],
  initialOnlineUsers,
  soundEnabled = true,
  onSelectTest,
  onRequireLogin,
  onOpenMajlis,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>(initialChatGroups);
  const [onlineUsers, setOnlineUsers] =
    useState<OnlinePresenceUser[]>(initialOnlineUsers);

  // Active room: public channel ID, custom group ID, or DM room 'dm_...'
  const [activeRoomId, setActiveRoomId] = useState<string>('global');
  const [selectedDmUser, setSelectedDmUser] = useState<User | null>(null);

  const [sidebarSearch, setSidebarSearch] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  // Custom group creation modal
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('🚀');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Composer state
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedTestToShare, setSelectedTestToShare] = useState<TestItem | null>(
    null
  );
  const [showTestPicker, setShowTestPicker] = useState(false);
  const [askAiMode, setAskAiMode] = useState(false);
  const [aiMood, setAiMood] = useState<'ustoz' | 'motivator' | 'strict' | 'friend'>('ustoz');
  const [isAnnouncementMode, setIsAnnouncementMode] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatErrorMsg, setChatErrorMsg] = useState<string | null>(null);

  // Image & Voice attachments
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attachedAudioUrl, setAttachedAudioUrl] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [typingInfo, setTypingInfo] = useState<{
    roomId: string;
    userName: string;
  } | null>(null);

  const isCurrentUserAdmin = Boolean(
    isAdminUnlocked ||
      (currentUser &&
        (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
          currentUser.role === 'admin'))
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Telegram Call State
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    type: 'voice' | 'video';
    calleeName: string;
    calleeAvatar?: string;
    calleeRole?: string;
    status: 'calling' | 'connected';
    durationSeconds: number;
    micMuted: boolean;
    videoMuted: boolean;
    speakerOn: boolean;
  } | null>(null);

  // Call timer and connection simulation
  useEffect(() => {
    if (!activeCall || !activeCall.isOpen) return;

    if (activeCall.status === 'calling') {
      playKitestSound('tick', soundEnabled);
      const ringTimer = setTimeout(() => {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
        playKitestSound('fanfare', soundEnabled);
      }, 2500);
      return () => clearTimeout(ringTimer);
    }

    if (activeCall.status === 'connected') {
      const callInterval = setInterval(() => {
        setActiveCall((prev) =>
          prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null
        );
      }, 1000);
      return () => clearInterval(callInterval);
    }
  }, [activeCall?.isOpen, activeCall?.status, soundEnabled]);

  const handleStartCall = (type: 'voice' | 'video') => {
    const currentGroup = chatGroups.find((g) => g.id === activeRoomId);
    const callee = selectedDmUser
      ? selectedDmUser.name
      : activeRoomId === 'ai_tutor'
      ? 'KITEST AI Ustoz'
      : currentGroup?.name || 'KITEST Onlayn Xona';
    const avatar = selectedDmUser?.avatarUrl;
    const role = selectedDmUser?.role;

    playKitestSound('click', soundEnabled);
    setActiveCall({
      isOpen: true,
      type,
      calleeName: callee,
      calleeAvatar: avatar,
      calleeRole: role,
      status: 'calling',
      durationSeconds: 0,
      micMuted: false,
      videoMuted: type === 'voice',
      speakerOn: true,
    });
  };

  const handleEndCall = () => {
    playKitestSound('warning', soundEnabled);
    setActiveCall(null);
  };

  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length]);

  useEffect(() => {
    if (initialChatGroups.length > 0) {
      setChatGroups(initialChatGroups);
    }
  }, [initialChatGroups]);

  // Connect to real-time WebSocket server (/ws/chat)
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connectWs = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
        wsRef.current = ws;

        ws.onopen = () => {
          if (currentUser) {
            ws.send(
              JSON.stringify({
                type: 'presence:identify',
                user: {
                  id: currentUser.id,
                  name: currentUser.name,
                  username: currentUser.username,
                  role: currentUser.role,
                  region: currentUser.region,
                },
              })
            );
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'chat:init') {
              if (Array.isArray(payload.messages)) {
                setMessages(payload.messages);
              }
              if (Array.isArray(payload.onlineUsers)) {
                setOnlineUsers(payload.onlineUsers);
              }
            } else if (payload.type === 'presence:update') {
              if (Array.isArray(payload.onlineUsers)) {
                setOnlineUsers(payload.onlineUsers);
              }
            } else if (payload.type === 'chat:group_created' && payload.group) {
              setChatGroups((prev) =>
                prev.some((g) => g.id === payload.group.id)
                  ? prev
                  : [...prev, payload.group]
              );
            } else if (payload.type === 'chat:group_deleted' && payload.groupId) {
              setChatGroups((prev) =>
                prev.filter((g) => g.id !== payload.groupId)
              );
            } else if (payload.type === 'chat:message_created' && payload.message) {
              const incoming: ChatMessage = payload.message;
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, incoming];
              });
              if (currentUser && incoming.senderId !== currentUser.id) {
                playKitestSound('click', soundEnabled);
              }
            } else if (payload.type === 'chat:message_updated' && payload.message) {
              const updated: ChatMessage = payload.message;
              setMessages((prev) =>
                prev.map((m) => (m.id === updated.id ? updated : m))
              );
            } else if (payload.type === 'chat:message_deleted' && payload.messageId) {
              setMessages((prev) =>
                prev.filter((m) => m.id !== payload.messageId)
              );
            } else if (payload.type === 'chat:typing') {
              if (
                currentUser &&
                payload.userId !== currentUser.id &&
                payload.userName
              ) {
                setTypingInfo({
                  roomId: payload.roomId,
                  userName: payload.userName,
                });
                setTimeout(() => {
                  setTypingInfo(null);
                }, 2500);
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWs, 2500);
          }
        };
      } catch {}
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser, soundEnabled]);

  const roomMessages = useMemo(() => {
    const q = messageSearchQuery.trim().toLowerCase();
    return messages
      .filter((m) => m.roomId === activeRoomId)
      .filter(
        (m) =>
          !q ||
          (m.text && m.text.toLowerCase().includes(q)) ||
          (m.senderName && m.senderName.toLowerCase().includes(q))
      );
  }, [messages, activeRoomId, messageSearchQuery]);

  const pinnedRoomMessages = useMemo(() => {
    return roomMessages.filter((m) => m.isPinned);
  }, [roomMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, activeRoomId]);

  const onlineUserIds = useMemo(() => {
    return new Set(onlineUsers.map((u) => u.userId));
  }, [onlineUsers]);

  const filteredPeople = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    return users
      .filter((u) => (!currentUser ? true : u.id !== currentUser.id))
      .filter(
        (u) =>
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.region && u.region.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aOnline = onlineUserIds.has(a.id) ? 1 : 0;
        const bOnline = onlineUserIds.has(b.id) ? 1 : 0;
        if (bOnline !== aOnline) return bOnline - aOnline;
        return b.totalScore - a.totalScore;
      });
  }, [users, currentUser, sidebarSearch, onlineUserIds]);

  const handleSelectChannel = (channel: ChatChannel) => {
    playKitestSound('click', soundEnabled);
    setSelectedDmUser(null);
    setActiveRoomId(channel.id);
    setReplyingTo(null);
    setAskAiMode(Boolean(channel.isAiRoom));
  };

  const handleSelectCustomGroup = (group: ChatGroup) => {
    playKitestSound('click', soundEnabled);
    setSelectedDmUser(null);
    setActiveRoomId(group.id);
    setReplyingTo(null);
    setAskAiMode(false);
  };

  const handleSelectDmUser = (targetUser: User) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    playKitestSound('click', soundEnabled);
    setSelectedDmUser(targetUser);
    setActiveRoomId(getDmRoomId(currentUser.id, targetUser.id));
    setReplyingTo(null);
    setAskAiMode(false);
  };

  const handleCreateCustomGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    if (!currentUser && !isAdminUnlocked) {
      onRequireLogin();
      return;
    }
    setIsCreatingGroup(true);
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim(),
          avatarEmoji: newGroupEmoji || '🚀',
          creatorId: currentUser?.id || 'admin',
          creatorName: currentUser?.name || 'Bosh Admin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.group) {
        setChatGroups((prev) =>
          prev.some((g) => g.id === data.group.id) ? prev : [...prev, data.group]
        );
        setActiveRoomId(data.group.id);
        setSelectedDmUser(null);
        setNewGroupName('');
        setNewGroupDesc('');
        setIsCreateGroupOpen(false);
        playKitestSound('success', soundEnabled);
      }
    } catch {}
    setIsCreatingGroup(false);
  };

  const handleChatImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setAttachedAudioUrl(reader.result);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setChatErrorMsg("Mikrofonga ruxsat berilmadi yoki qurilma topilmadi.");
      setTimeout(() => setChatErrorMsg(null), 3500);
    }
  };

  const stopVoiceRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    const now = Date.now();
    if (
      currentUser &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      now - lastTypingSentRef.current > 1500
    ) {
      lastTypingSentRef.current = now;
      wsRef.current.send(
        JSON.stringify({
          type: 'chat:typing',
          roomId: activeRoomId,
          userId: currentUser.id,
          userName: currentUser.name,
        })
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !isAdminUnlocked) {
      onRequireLogin();
      return;
    }

    const cleanText = inputText.trim();
    if (
      !cleanText &&
      !selectedTestToShare &&
      !attachedImageUrl &&
      !attachedAudioUrl
    ) {
      return;
    }

    setIsSending(true);
    setChatErrorMsg(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (isAdminUnlocked && adminPasscode) {
        headers['x-admin-passcode'] = adminPasscode;
      }

      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          roomId: activeRoomId,
          senderId: currentUser?.id,
          adminPasscode: isAdminUnlocked ? adminPasscode : undefined,
          recipientId: selectedDmUser?.id,
          text: cleanText,
          imageUrl: attachedImageUrl || undefined,
          audioDataUrl: attachedAudioUrl || undefined,
          isAnnouncement: isCurrentUserAdmin && isAnnouncementMode,
          aiMood,
          replyTo: replyingTo
            ? {
                id: replyingTo.id,
                senderName: replyingTo.senderName,
                text: replyingTo.text,
              }
            : undefined,
          sharedTestId: selectedTestToShare?.id,
          sharedTestTitle: selectedTestToShare?.title,
          askAi: askAiMode || activeRoomId === 'ai_tutor',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setChatErrorMsg(data.error || 'Xabar yuborishda xatolik.');
      } else if (data.message) {
        const created: ChatMessage = data.message;
        setMessages((prev) =>
          prev.some((m) => m.id === created.id) ? prev : [...prev, created]
        );
        setInputText('');
        setAttachedImageUrl(null);
        setAttachedAudioUrl(null);
        setReplyingTo(null);
        setSelectedTestToShare(null);
        setShowTestPicker(false);
        if (activeRoomId !== 'ai_tutor') {
          setAskAiMode(false);
        }
        setIsAnnouncementMode(false);
        playKitestSound('click', soundEnabled);
      }
    } catch {}
    setIsSending(false);
  };

  const handleTogglePinMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || '',
          'x-admin-passcode': adminPasscode || '',
        },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message.id ? data.message : m))
        );
      }
    } catch {}
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          emoji,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === data.message.id ? data.message : m))
        );
      }
    } catch {}
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser && !isAdminUnlocked) return;
    try {
      const headers: Record<string, string> = {};
      if (currentUser) {
        headers['x-user-id'] = currentUser.id;
        headers['x-user-email'] = currentUser.email;
      }
      if (isAdminUnlocked && adminPasscode) {
        headers['x-admin-passcode'] = adminPasscode;
      }
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch {}
  };

  const activeChannel = PUBLIC_CHANNELS.find((c) => c.id === activeRoomId);
  const activeCustomGroup = chatGroups.find((g) => g.id === activeRoomId);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-2xl bg-slate-900/95 border border-slate-800 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[720px] max-h-[850px]">
        {/* LEFT SIDEBAR: Public Channels + Custom Groups + People (Direct Messages) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/70 flex flex-col max-h-[850px]">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  KITEST Onlayn Chat & Guruhlar
                </h2>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{Math.max(1, onlineUsers.length)} kishi onlayn</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenMajlis && (
                <button
                  type="button"
                  onClick={onOpenMajlis}
                  className="py-1.5 px-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                  title="Kamera orqali Jonli Video Majlisga o'tish"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Majlis</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="py-1.5 px-2.5 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 border border-sky-500/40 text-sky-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Yangi guruh ochish"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guruh</span>
              </button>
            </div>
          </div>

          {/* Public Channels & Custom Groups */}
          <div className="p-3 border-b border-slate-800/80 space-y-1 max-h-64 overflow-y-auto">
            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ommaviy Kanallar & AI Ustoz
            </div>
            {PUBLIC_CHANNELS.map((ch) => {
              const isSelected = activeRoomId === ch.id && !selectedDmUser;
              const unreadOrTotal = messages.filter(
                (m) => m.roomId === ch.id
              ).length;

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChannel(ch)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? ch.isAiRoom
                        ? 'bg-gradient-to-r from-sky-600/30 to-indigo-600/30 border border-sky-500/50 text-white'
                        : 'bg-emerald-600/20 border border-emerald-500/40 text-white'
                      : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {ch.isAiRoom ? (
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                        <Hash className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-bold truncate flex items-center gap-1.5">
                        <span>{ch.name}</span>
                        {ch.isAiRoom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {ch.subtitle}
                      </div>
                    </div>
                  </div>

                  {unreadOrTotal > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 shrink-0">
                      {unreadOrTotal}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Custom User-Created Chat Groups */}
            {chatGroups.length > 0 && (
              <div className="pt-2 space-y-1">
                <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center justify-between">
                  <span>Ochilgan Guruhlar ({chatGroups.length})</span>
                </div>
                {chatGroups.map((grp) => {
                  const isSelected = activeRoomId === grp.id && !selectedDmUser;
                  const grpMsgCount = messages.filter(
                    (m) => m.roomId === grp.id
                  ).length;

                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => handleSelectCustomGroup(grp)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-600/25 border border-sky-500/50 text-white'
                          : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sm shrink-0">
                          {grp.avatarEmoji || '💬'}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">
                            {grp.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {grp.description || `Muallif: ${grp.creatorName}`}
                          </div>
                        </div>
                      </div>
                      {grpMsgCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                          {grpMsgCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Messages (Shaxsiy Xabarlar) */}
          <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Ishtirokchilar bilan lichka ({filteredPeople.length})</span>
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Ism, @username yoki viloyat..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredPeople.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Boshqa foydalanuvchilar topilmadi.
                </div>
              ) : (
                filteredPeople.map((person) => {
                  const isOnline = onlineUserIds.has(person.id);
                  const isSelected = selectedDmUser?.id === person.id;
                  const dmRoom = currentUser
                    ? getDmRoomId(currentUser.id, person.id)
                    : '';
                  const dmCount = dmRoom
                    ? messages.filter((m) => m.roomId === dmRoom).length
                    : 0;
                  const pRank =
                    person.rankClass || computeRankClass(person.totalScore);
                  const pRankMeta = RANK_CLASS_META[pRank];

                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => handleSelectDmUser(person)}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-sky-600/20 border border-sky-500/50 text-white'
                          : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          {person.avatarUrl ? (
                            <img
                              src={person.avatarUrl}
                              alt={person.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center text-white font-bold text-xs">
                              {person.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                              isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                            }`}
                          />
                        </div>

                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                            <span>{person.name}</span>
                            <span
                              className={`text-[9px] font-mono px-1 rounded border ${pRankMeta.bgClass} ${pRankMeta.colorClass}`}
                            >
                              {pRank}
                            </span>
                            {person.email.toLowerCase() === ADMIN_EMAIL && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                            <span className="font-mono">@{person.username}</span>
                            {person.region && (
                              <>
                                <span>·</span>
                                <span className="truncate">{person.region}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          {person.totalScore} ball
                        </span>
                        {dmCount > 0 && (
                          <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                            {dmCount} xabar
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 8 COLUMNS: Active Chat Conversation Window */}
        <div className="lg:col-span-8 flex flex-col h-[720px] lg:h-[850px] bg-[#0b1320]">
          {/* Conversation Top Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedDmUser ? (
                <>
                  <div className="relative">
                    {selectedDmUser.avatarUrl ? (
                      <img
                        src={selectedDmUser.avatarUrl}
                        alt={selectedDmUser.name}
                        className="w-10 h-10 rounded-xl object-cover border border-sky-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-sky-600 flex items-center justify-center text-white font-bold text-sm">
                        {selectedDmUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                        onlineUserIds.has(selectedDmUser.id)
                          ? 'bg-emerald-400'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedDmUser.name}</span>
                      <span className="text-xs font-mono text-slate-400">
                        @{selectedDmUser.username}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>
                        {onlineUserIds.has(selectedDmUser.id)
                          ? '🟢 Hozir onlayn'
                          : 'Shaxsiy yozishma (Lichka)'}
                      </span>
                      {selectedDmUser.region && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          {selectedDmUser.region}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : activeCustomGroup ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-lg">
                    {activeCustomGroup.avatarEmoji || '💬'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeCustomGroup.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Guruh
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeCustomGroup.description ||
                        `Guruh yaratuvchisi: ${activeCustomGroup.creatorName}`}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeChannel?.isAiRoom
                        ? 'bg-sky-500/20 border border-sky-400/40 text-sky-300'
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    {activeChannel?.isAiRoom ? (
                      <Bot className="w-5 h-5" />
                    ) : (
                      <Hash className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeChannel?.name || 'Umumiy Muloqot'}</span>
                      {activeChannel?.isAiRoom && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Gemini AI Ustoz
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {activeChannel?.subtitle}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* AI Ustoz Mood Selector or Switch to AI Button */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(activeChannel?.isAiRoom || askAiMode) && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {AI_MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAiMood(m.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        aiMood === m.id
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={m.desc}
                    >
                      <span>{m.emoji}</span>
                      <span className="hidden sm:inline">{m.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Chatdan qidirish..."
                  className="w-36 sm:w-44 pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Telegram Calling Buttons */}
              <button
                type="button"
                onClick={() => handleStartCall('voice')}
                className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Telegram Ovozli Qo‘ng‘iroq"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Qo‘ng‘iroq</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartCall('video')}
                className="p-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 border border-sky-500/40 text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Telegram Video Qo‘ng‘iroq"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Video Call</span>
              </button>

              {onOpenMajlis && (
                <button
                  type="button"
                  onClick={onOpenMajlis}
                  className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-black text-white shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>🎥 Majlis</span>
                </button>
              )}

              {!selectedDmUser && activeRoomId !== 'ai_tutor' && (
                <button
                  type="button"
                  onClick={() => handleSelectChannel(PUBLIC_CHANNELS[4])}
                  className="py-1.5 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-semibold text-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI Ustoz</span>
                </button>
              )}
            </div>
          </div>

          {/* Pinned Messages Banner */}
          {pinnedRoomMessages.length > 0 && (
            <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 shrink-0">
                  Qadalgan xabar:
                </span>
                <span className="text-slate-200 truncate">
                  {pinnedRoomMessages[pinnedRoomMessages.length - 1].senderName}:{' '}
                  {pinnedRoomMessages[pinnedRoomMessages.length - 1].text ||
                    'Rasm / Ovozli xabar'}
                </span>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {roomMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
                  {activeChannel?.isAiRoom ? (
                    <Sparkles className="w-7 h-7" />
                  ) : (
                    <MessageSquare className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white">
                  {selectedDmUser
                    ? `${selectedDmUser.name} bilan suhbatni boshlang!`
                    : activeCustomGroup
                    ? `"${activeCustomGroup.name}" guruhida muloqotni boshlang!`
                    : activeChannel?.isAiRoom
                    ? 'KITEST AI Ustoz sizga yordam berishga tayyor!'
                    : "Hozircha bu xonada xabarlar yo'q"}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Matn, rasm, ovozli xabar yuboring yoki testlarni ulashing.
                </p>
              </div>
            ) : (
              roomMessages.map((msg) => {
                const isOwn =
                  (currentUser?.id && currentUser.id === msg.senderId) ||
                  (!currentUser && isAdminUnlocked && msg.senderRole === 'admin');
                const isAiMsg = Boolean(msg.isAi || msg.senderId === 'kitest_ai');
                const isSenderAdmin =
                  msg.senderRole === 'admin' ||
                  msg.senderUsername === 'behruz_admin';
                const isAnnouncement = Boolean(msg.isAnnouncement);
                const canDelete =
                  isOwn ||
                  isCurrentUserAdmin ||
                  (currentUser &&
                    currentUser.email.toLowerCase() === ADMIN_EMAIL);

                const matchedSender = users.find((u) => u.id === msg.senderId);
                const senderScore =
                  msg.senderScore !== undefined
                    ? msg.senderScore
                    : matchedSender?.totalScore;
                const senderCustomBadge =
                  msg.senderCustomBadge || matchedSender?.customBadge;
                const senderRank =
                  matchedSender?.rankClass ||
                  computeRankClass(senderScore || 0);
                const senderRankMeta = RANK_CLASS_META[senderRank];

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${
                      isAnnouncement
                        ? 'items-stretch'
                        : isOwn
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >
                    <div
                      className={`${
                        isAnnouncement
                          ? 'w-full'
                          : 'max-w-[85%] sm:max-w-[75%]'
                      } rounded-2xl p-3.5 border transition-all ${
                        isAnnouncement
                          ? 'bg-gradient-to-r from-amber-950/85 via-slate-900 to-emerald-950/75 border-2 border-amber-400/80 text-white shadow-xl shadow-amber-500/15'
                          : isAiMsg
                          ? 'bg-gradient-to-br from-indigo-950/80 via-slate-900 to-sky-950/80 border-sky-500/50 text-slate-100'
                          : isSenderAdmin
                          ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-900 border-2 border-amber-500/70 text-white shadow-lg shadow-amber-500/10'
                          : isOwn
                          ? 'bg-emerald-950/60 border-emerald-600/50 text-slate-100'
                          : 'bg-slate-900/95 border-slate-800 text-slate-100'
                      }`}
                    >
                      {isAnnouncement && (
                        <div className="mb-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                          <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                          <span>👑 RASMIY ADMIN E'LONI • BARCHA DIQQATIGA</span>
                        </div>
                      )}

                      {msg.isPinned && (
                        <div className="mb-1.5 inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                          <Pin className="w-3 h-3" />
                          <span>Qadalgan xabar</span>
                        </div>
                      )}

                      {/* Sender Header */}
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isAiMsg ? (
                            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                          ) : isSenderAdmin ? (
                            <Crown className="w-4 h-4 text-amber-400" />
                          ) : null}

                          <span
                            className={`text-xs font-extrabold ${
                              isAiMsg
                                ? 'text-sky-300'
                                : isSenderAdmin
                                ? 'text-amber-300 text-sm'
                                : isOwn
                                ? 'text-emerald-300'
                                : 'text-white'
                            }`}
                          >
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            @{msg.senderUsername}
                          </span>

                          {!isAiMsg && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-extrabold ${senderRankMeta.bgClass} ${senderRankMeta.colorClass}`}
                            >
                              {senderRank}-daraja
                            </span>
                          )}

                          {isAiMsg ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                              SUN'IY INTELLEKT
                            </span>
                          ) : isSenderAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black uppercase shadow-sm">
                              👑 BOSH ADMIN
                            </span>
                          ) : msg.senderRole === 'creator' ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                              ✨ YARATUVCHI
                            </span>
                          ) : null}

                          {senderCustomBadge && !isAiMsg && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                              {senderCustomBadge}
                            </span>
                          )}

                          {!isAiMsg && senderScore !== undefined && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                              ⚡ {senderScore} ball
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Reply Quote */}
                      {msg.replyTo && (
                        <div className="mb-2 pl-2.5 py-1 border-l-2 border-sky-400 bg-slate-950/60 rounded-r-lg text-[11px]">
                          <div className="font-semibold text-sky-400">
                            {msg.replyTo.senderName}
                          </div>
                          <div className="text-slate-400 line-clamp-1">
                            {msg.replyTo.text}
                          </div>
                        </div>
                      )}

                      {/* Attached Image in Chat */}
                      {msg.imageUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-700/80 max-w-sm">
                          <img
                            src={msg.imageUrl}
                            alt="Chat attachment"
                            className="w-full max-h-72 object-contain bg-slate-950"
                          />
                        </div>
                      )}

                      {/* Attached Voice Audio in Chat */}
                      {msg.audioDataUrl && (
                        <div className="mb-2 p-2 rounded-xl bg-slate-950/90 border border-sky-500/30 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <audio
                            controls
                            src={msg.audioDataUrl}
                            className="h-8 w-full max-w-[260px]"
                          />
                        </div>
                      )}

                      {/* Message Text */}
                      {msg.text && (
                        <div
                          className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words ${
                            isSenderAdmin
                              ? 'text-amber-50 font-semibold'
                              : 'text-slate-100'
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}

                      {/* Shared Test Card */}
                      {msg.sharedTestId && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/40 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="truncate">
                              <div className="text-[10px] font-mono text-emerald-400">
                                Test #{msg.sharedTestId}
                              </div>
                              <div className="text-xs font-bold text-white truncate">
                                {msg.sharedTestTitle || 'Test savollari'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const found = tests.find(
                                (t) => t.id === msg.sharedTestId
                              );
                              if (found) onSelectTest(found);
                            }}
                            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white shrink-0 flex items-center gap-1"
                          >
                            <span>Yechish</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Reactions & Actions Footer */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {REACTION_EMOJIS.map((emoji) => {
                            const reactors = msg.reactions?.[emoji] || [];
                            const hasReacted =
                              currentUser && reactors.includes(currentUser.id);
                            return (
                              <button
                                key={`rx_${msg.id}_${emoji}`}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className={`px-1.5 py-0.5 rounded-md text-[11px] transition-colors flex items-center gap-1 ${
                                  hasReacted
                                    ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200'
                                    : reactors.length > 0
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'text-slate-500 hover:bg-slate-800/70 hover:text-slate-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                {reactors.length > 0 && (
                                  <span className="font-mono text-[10px]">
                                    {reactors.length}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(msg)}
                            className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Javob</span>
                          </button>

                          {(isCurrentUserAdmin || isOwn) && (
                            <button
                              type="button"
                              onClick={() => handleTogglePinMessage(msg.id)}
                              className={`text-[11px] flex items-center gap-0.5 ${
                                msg.isPinned
                                  ? 'text-amber-400'
                                  : 'text-slate-500 hover:text-amber-300'
                              }`}
                              title="Xabarni qadash (Pin)"
                            >
                              <Pin className="w-3 h-3" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[11px] text-slate-500 hover:text-rose-400"
                              title="Xabarni o'chirish"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {typingInfo && typingInfo.roomId === activeRoomId && (
            <div className="px-6 py-1 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-emerald-400 animate-ping" />
              <span>{typingInfo.userName} yozmoqda...</span>
            </div>
          )}

          {/* Previews above Composer */}
          <AnimatePresence>
            {(replyingTo ||
              selectedTestToShare ||
              showTestPicker ||
              attachedImageUrl ||
              attachedAudioUrl ||
              chatErrorMsg) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 space-y-2"
              >
                {chatErrorMsg && (
                  <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-center justify-between">
                    <span>{chatErrorMsg}</span>
                    <button onClick={() => setChatErrorMsg(null)}>✕</button>
                  </div>
                )}

                {attachedImageUrl && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-sky-500/40">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={attachedImageUrl}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                      />
                      <span className="text-xs text-sky-300 font-semibold">
                        Rasm biriktirildi
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedImageUrl(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {attachedAudioUrl && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-emerald-500/40">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <audio
                        controls
                        src={attachedAudioUrl}
                        className="h-8 max-w-[220px]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedAudioUrl(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {replyingTo && (
                  <div className="flex items-center justify-between gap-2 text-xs bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                    <div className="truncate">
                      <span className="text-sky-400 font-semibold mr-1.5">
                        @{replyingTo.senderName} ga javob:
                      </span>
                      <span className="text-slate-400">{replyingTo.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {selectedTestToShare && (
                  <div className="flex items-center justify-between gap-2 text-xs bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-500/40">
                    <span className="text-emerald-300 font-semibold">
                      Ulashilayotgan test: #{selectedTestToShare.id} —{' '}
                      {selectedTestToShare.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTestToShare(null)}
                      className="text-emerald-300 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showTestPicker && (
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 pb-1 font-semibold">
                      Chatga ulashish uchun testni tanlang:
                    </div>
                    {tests.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTestToShare(t);
                          setShowTestPicker(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-900 text-xs text-slate-200 flex items-center justify-between"
                      >
                        <span>
                          <strong className="text-emerald-400 font-mono mr-1.5">
                            #{t.id}
                          </strong>
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.questions.length} savol
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Message Input Bar */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95">
            {!currentUser && !isAdminUnlocked ? (
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-300">
                  Onlayn chatda yozish va muloqot qilish uchun tizimga kiring.
                </span>
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Kirish</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-2">
                {isCurrentUserAdmin && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>BOSH ADMIN maqomi</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnnouncementMode(!isAnnouncementMode)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                        isAnnouncementMode
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-900 border border-amber-500/40 text-amber-300 hover:bg-slate-800'
                      }`}
                    >
                      <Megaphone className="w-3 h-3" />
                      <span>
                        {isAnnouncementMode
                          ? "📢 Rasmiy E'lon Yoqilgan"
                          : "📢 E'lon Sifatida Yozish"}
                      </span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Hidden Image Input */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChatImagePick}
                    className="hidden"
                  />

                  {/* Attach Image Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    title="Rasm yuborish"
                    className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                      attachedImageUrl
                        ? 'bg-sky-600/25 border-sky-500/50 text-sky-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>

                  {/* Record Voice Message Button */}
                  {isRecordingVoice ? (
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse shrink-0"
                      title="Yozishni to'xtatish"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>0:{String(recordingSeconds).padStart(2, '0')}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      title="Ovozli xabar yozish"
                      className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                        attachedAudioUrl
                          ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}

                  {/* Share a Test Button */}
                  <button
                    type="button"
                    onClick={() => setShowTestPicker(!showTestPicker)}
                    title="Test ulashish"
                    className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                      showTestPicker || selectedTestToShare
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>

                  {/* Summon AI Toggle Button */}
                  {activeRoomId !== 'ai_tutor' && (
                    <button
                      type="button"
                      onClick={() => setAskAiMode(!askAiMode)}
                      title="Sun'iy intellektdan javob olish"
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 shrink-0 ${
                        askAiMode
                          ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-sky-400 hover:border-sky-500/40'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">@AI</span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={
                      activeRoomId === 'ai_tutor' || askAiMode
                        ? "Sun'iy intellekt (AI Ustoz) ga savolingizni yozing..."
                        : selectedDmUser
                        ? `${selectedDmUser.name} ga xabar yozing...`
                        : 'Xabaringizni yozing...'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={
                      isSending ||
                      (!inputText.trim() &&
                        !selectedTestToShare &&
                        !attachedImageUrl &&
                        !attachedAudioUrl)
                    }
                    className={`py-2.5 px-4 rounded-xl disabled:opacity-40 text-xs sm:text-sm font-extrabold transition-colors flex items-center gap-1.5 shrink-0 shadow-lg ${
                      isCurrentUserAdmin
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Yuborish</span>
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Create Custom Group Modal */}
      <AnimatePresence>
        {isCreateGroupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreateCustomGroup}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-sky-500/40 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">
                  💬 Yangi Muloqot Guruhi Ochish
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Guruh belgisi (Emoji) va Nomi *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupEmoji}
                    onChange={(e) => setNewGroupEmoji(e.target.value)}
                    className="w-14 text-center py-2 rounded-xl bg-slate-950 border border-slate-800 text-base"
                  />
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Masalan: Olimpiadachilar Klubi"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Guruh haqida qisqacha izoh
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Guruh maqsadi va mavzusi..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isCreatingGroup}
                  className="py-2 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-extrabold text-white"
                >
                  {isCreatingGroup ? 'Ochilmoqda...' : 'Guruhni Yaratish'}
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {/* Telegram Calling Modal (Voice & Video) */}
        {activeCall && activeCall.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 text-center text-white shadow-2xl relative overflow-hidden"
            >
              {/* Background Ambient Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-600/10 via-transparent to-black pointer-events-none" />

              {/* Pulsing Avatar */}
              <div className="relative w-28 h-28 mx-auto mb-5 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="absolute -inset-2 rounded-full border border-sky-400/30 animate-pulse" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 border-2 border-white/40 flex items-center justify-center text-3xl font-black text-white shadow-xl overflow-hidden">
                  {activeCall.calleeAvatar ? (
                    <img src={activeCall.calleeAvatar} alt={activeCall.calleeName} className="w-full h-full object-cover" />
                  ) : (
                    activeCall.calleeName.charAt(0)
                  )}
                </div>
              </div>

              {/* Callee Info */}
              <h3 className="text-xl font-black text-white leading-tight">
                {activeCall.calleeName}
              </h3>
              <div className="text-xs text-sky-300 font-mono mt-1">
                {activeCall.status === 'calling' ? (
                  <span className="flex items-center justify-center gap-1.5 animate-pulse">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Qo‘ng‘iroq qilinmoqda...</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    Muloqot davom etmoqda: {String(Math.floor(activeCall.durationSeconds / 60)).padStart(2, '0')}:
                    {String(activeCall.durationSeconds % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              {/* Audio Visualizer Bars if Connected */}
              {activeCall.status === 'connected' && (
                <div className="flex items-center justify-center gap-1 my-6 h-6">
                  {[12, 22, 16, 26, 18, 14, 24, 16].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [8, h, 8] }}
                      transition={{ repeat: Infinity, duration: 0.6 + i * 0.1, ease: 'easeInOut' }}
                      className="w-1 bg-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="grid grid-cols-3 gap-3 my-6">
                <button
                  type="button"
                  onClick={() =>
                    setActiveCall((prev) => (prev ? { ...prev, micMuted: !prev.micMuted } : null))
                  }
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 text-xs font-bold ${
                    activeCall.micMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {activeCall.micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  <span className="text-[10px]">{activeCall.micMuted ? 'Yoqish' : 'O‘chirish'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveCall((prev) => (prev ? { ...prev, speakerOn: !prev.speakerOn } : null))
                  }
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1 text-xs font-bold ${
                    activeCall.speakerOn
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="text-[10px]">Dinamik</span>
                </button>

                {onOpenMajlis && (
                  <button
                    type="button"
                    onClick={() => {
                      handleEndCall();
                      onOpenMajlis();
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-600/30 to-pink-600/30 border border-rose-500/40 text-rose-200 hover:text-white flex flex-col items-center gap-1 text-xs font-bold"
                  >
                    <Video className="w-5 h-5 text-rose-400" />
                    <span className="text-[10px]">Majlisga</span>
                  </button>
                )}
              </div>

              {/* Red End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Qo‘ng‘iroqni Yakunlash</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
