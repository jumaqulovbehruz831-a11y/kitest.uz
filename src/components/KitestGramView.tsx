import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Search,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Pin,
  X,
  Reply,
  Trash2,
  Copy,
  Users,
  Megaphone,
  Bookmark,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  ChevronDown,
  Volume2,
  Crown,
  Play,
  Pause,
} from 'lucide-react';
import { User, ChatMessage, computeRankClass, RANK_CLASS_META, ADMIN_EMAIL } from '../types';
import { playKitestSound } from './KitestEmblem';

interface KitestGramViewProps {
  currentUser: User | null;
  users: User[];
  soundEnabled?: boolean;
  onRequireLogin: () => void;
  onOpenMajlis?: () => void;
}

interface TelegramChat {
  id: string;
  type: 'channel' | 'group' | 'dm' | 'saved';
  name: string;
  subtitle: string;
  avatarEmoji?: string;
  avatarColor?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  onlineCount?: number;
  recipientUser?: User;
}

const DEFAULT_CHATS: TelegramChat[] = [
  {
    id: 'gram_news',
    type: 'channel',
    name: 'KITEST Rasmiy Yangiliklar',
    subtitle: '12 400 obunachi • Rasmiy kanal',
    avatarEmoji: '📢',
    avatarColor: 'bg-gradient-to-tr from-sky-500 to-blue-600',
    isVerified: true,
    isPinned: true,
  },
  {
    id: 'gram_olimpiada',
    type: 'group',
    name: 'Olimpiada & Testlar Klubi',
    subtitle: '3 850 a\'zo, 42 onlayn',
    avatarEmoji: '🏆',
    avatarColor: 'bg-gradient-to-tr from-amber-500 to-orange-600',
    isPinned: true,
    onlineCount: 42,
  },
  {
    id: 'gram_kiteshot',
    type: 'group',
    name: 'Kiteshot 3D Geymerlar Jamiyati',
    subtitle: '1 920 a\'zo, 28 onlayn',
    avatarEmoji: '🎮',
    avatarColor: 'bg-gradient-to-tr from-rose-500 to-purple-600',
    onlineCount: 28,
  },
  {
    id: 'gram_it',
    type: 'group',
    name: 'IT & Dasturchilar Hamjamiyati',
    subtitle: '2 140 a\'zo, 35 onlayn',
    avatarEmoji: '💻',
    avatarColor: 'bg-gradient-to-tr from-emerald-500 to-teal-600',
    onlineCount: 35,
  },
  {
    id: 'gram_admin_dm',
    type: 'dm',
    name: 'Behruz Jumaqulov (Bosh Admin)',
    subtitle: 'onlayn',
    avatarEmoji: '👑',
    avatarColor: 'bg-gradient-to-tr from-yellow-500 to-amber-600',
    isVerified: true,
  },
  {
    id: 'gram_saved',
    type: 'saved',
    name: 'Saqlangan Xabarlar',
    subtitle: 'Bulutli shaxsiy xotira',
    avatarEmoji: '🔖',
    avatarColor: 'bg-gradient-to-tr from-blue-600 to-indigo-700',
  },
];

const TELEGRAM_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '🤩', '🚀', '💯', '😂', '🤔', '⚡', '💡'];

export const KitestGramView: React.FC<KitestGramViewProps> = ({
  currentUser,
  users,
  soundEnabled = true,
  onRequireLogin,
  onOpenMajlis,
}) => {
  const [activeChatId, setActiveChatId] = useState<string>('gram_olimpiada');
  const [activeFolder, setActiveFolder] = useState<'all' | 'groups' | 'dms' | 'channels' | 'saved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  // Live messages polled from server
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Build full chats list including real users for DMs
  const allChats = useMemo<TelegramChat[]>(() => {
    const list = [...DEFAULT_CHATS];

    // Add other registered users as direct chat contacts
    if (Array.isArray(users)) {
      users
        .filter((u) => u.id !== currentUser?.id && u.username !== 'behruz_admin')
        .slice(0, 15)
        .forEach((u) => {
          list.push({
            id: `dm_${u.id}`,
            type: 'dm',
            name: u.name,
            subtitle: u.ratingTitle || 'Ishtirokchi',
            avatarEmoji: u.avatarEmoji,
            avatarColor: u.avatarColor || 'bg-indigo-600',
            avatarUrl: u.avatarUrl,
            recipientUser: u,
          });
        });
    }

    return list;
  }, [users, currentUser]);

  // Filter chats by folder & search
  const filteredChats = useMemo(() => {
    return allChats.filter((c) => {
      if (activeFolder === 'groups' && c.type !== 'group') return false;
      if (activeFolder === 'channels' && c.type !== 'channel') return false;
      if (activeFolder === 'dms' && c.type !== 'dm') return false;
      if (activeFolder === 'saved' && c.type !== 'saved') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allChats, activeFolder, searchQuery]);

  const activeChat = useMemo(() => {
    return allChats.find((c) => c.id === activeChatId) || DEFAULT_CHATS[0];
  }, [allChats, activeChatId]);

  // Fetch messages every 1.5s for real-time live synchronization
  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/chat/messages');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, []);

  // Filter messages for current chat
  const chatMessages = useMemo(() => {
    const defaultInitials: Record<string, ChatMessage[]> = {
      gram_news: [
        {
          id: 'news_init_1',
          roomId: 'gram_news',
          senderId: 'admin_sys',
          senderName: 'KITEST Boshqaruv Markazi',
          senderUsername: 'kitest_official',
          senderRole: 'admin',
          text: '📢 Assalomu alaykum! KITEST ta\'lim platformasida yangi Kiteshot 3D, Video Majlis va KitestGram imkoniyatlari rasman ishga tushirildi! Hammaga omad!',
          reactions: { '🔥': ['user_1', 'user_2'], '👏': ['user_3'] },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
      gram_olimpiada: [
        {
          id: 'oli_init_1',
          roomId: 'gram_olimpiada',
          senderId: 'admin_behruz',
          senderName: 'Behruz Jumaqulov (Bosh Admin)',
          senderUsername: 'behruz_admin',
          senderRole: 'admin',
          text: 'Salom barchaga! CHSB va Respublika Olimpiadasi masalalari bo\'yicha muhokama ochiq. Har bir yechim uchun +10 ball beriladi!',
          reactions: { '👍': ['u1', 'u2', 'u3'], '❤️': ['u4'] },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
      gram_kiteshot: [
        {
          id: 'ks_init_1',
          roomId: 'gram_kiteshot',
          senderId: 'gamer_1',
          senderName: 'CyberShooter',
          senderUsername: 'cybershot',
          senderRole: 'user',
          text: 'Kiteshot 3D duelga kim chiqadi? 1-o\'ringa +3 ball beriladi! Xonaga ulaning!',
          reactions: { '🚀': ['u1', 'u2'] },
          createdAt: new Date(Date.now() - 900000).toISOString(),
        },
      ],
      gram_it: [
        {
          id: 'it_init_1',
          roomId: 'gram_it',
          senderId: 'coder_lead',
          senderName: 'Python Master',
          senderUsername: 'py_master',
          senderRole: 'creator',
          text: 'Bugungi masala: QuickSort va MergeSort murakkabliklarini solishtirish. Siz qaysi birini afzal ko\'rasiz?',
          reactions: { '💡': ['u1'] },
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
      ],
    };

    const serverMsgs = messages.filter((m) => m.roomId === activeChatId);
    if (serverMsgs.length > 0) return serverMsgs;
    return defaultInitials[activeChatId] || [];
  }, [messages, activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Voice recording simulation
  const handleToggleVoiceRecord = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      playKitestSound('click', soundEnabled);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Finish recording and send
      clearInterval(timerRef.current);
      setIsRecordingVoice(false);
      handleSendMessage('', true, recordingSeconds);
      setRecordingSeconds(0);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Rasm hajmi 8 MB dan oshmasligi kerak!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (customText?: string, isVoice: boolean = false, voiceSec: number = 0) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const textToSend = String(customText !== undefined ? customText : inputText).trim();
    if (!textToSend && !attachedImage && !isVoice) return;

    const newMsg: ChatMessage = {
      id: `gram_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: activeChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderUsername: currentUser.username,
      senderRole: currentUser.role,
      senderAvatarUrl: currentUser.avatarUrl,
      senderAvatarEmoji: currentUser.avatarEmoji,
      isPremium: currentUser.isPremium,
      text: isVoice ? `🎙️ Ovozli xabar (${voiceSec}s)` : textToSend,
      imageUrl: attachedImage || undefined,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            text: replyingTo.text.slice(0, 80),
          }
        : undefined,
      reactions: {},
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setAttachedImage(null);
    setReplyingTo(null);
    setIsEmojiPickerOpen(false);
    playKitestSound('success', soundEnabled);

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeChatId,
          senderId: currentUser.id,
          text: newMsg.text,
          imageUrl: newMsg.imageUrl,
          replyTo: newMsg.replyTo,
        }),
      });
      fetchMessages();
    } catch (err) {
      console.error('Telegram send message error:', err);
    }
  };

  const handleReactToMessage = async (msgId: string, emoji: string) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    playKitestSound('click', soundEnabled);

    // Optimistic reaction
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const currentReactions = { ...m.reactions };
        const userList = currentReactions[emoji] || [];
        if (userList.includes(currentUser.id)) {
          currentReactions[emoji] = userList.filter((uid) => uid !== currentUser.id);
          if (currentReactions[emoji].length === 0) delete currentReactions[emoji];
        } else {
          currentReactions[emoji] = [...userList, currentUser.id];
        }
        return { ...m, reactions: currentReactions };
      })
    );

    try {
      await fetch('/api/chat/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, emoji, userId: currentUser.id }),
      });
    } catch {}
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4.8rem)] max-w-7xl mx-auto rounded-3xl border border-sky-500/30 bg-[#0E1621] shadow-2xl overflow-hidden text-slate-100 font-sans">
      {/* ================= LEFT SIDEBAR (CHATS LIST) ================= */}
      <aside className="w-80 sm:w-96 flex flex-col border-r border-[#17212B] bg-[#17212B] flex-shrink-0">
        {/* Telegram Top Header & Search */}
        <div className="p-3.5 border-b border-[#242F3D]/80 bg-[#17212B] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#2AABEE] to-[#229ED9] flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
                <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
              </div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>KitestGram</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </h1>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-sky-400">
                  @{currentUser.username || 'user'}
                </span>
                <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-xs font-black text-white">
                  {currentUser.avatarEmoji || currentUser.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv..."
              className="w-full rounded-2xl bg-[#242F3D] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
          </div>

          {/* Folder Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'groups', label: 'Guruhlar' },
              { id: 'channels', label: 'Kanallar' },
              { id: 'dms', label: 'Shaxsiy' },
              { id: 'saved', label: 'Saqlangan' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFolder(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFolder === tab.id
                    ? 'bg-[#2AABEE] text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#242F3D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#242F3D]/40">
          {filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  playKitestSound('click', soundEnabled);
                }}
                className={`flex items-center gap-3 p-3 transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#242F3D] border-l-4 border-[#2AABEE]'
                    : 'hover:bg-[#202B36]'
                }`}
              >
                {/* Chat Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ${
                      chat.avatarColor || 'bg-sky-600'
                    }`}
                  >
                    {chat.avatarUrl ? (
                      <img
                        src={chat.avatarUrl}
                        alt={chat.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      chat.avatarEmoji || chat.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {chat.type === 'dm' && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#17212B]" />
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white truncate flex items-center gap-1">
                      <span>{chat.name}</span>
                      {chat.isVerified && (
                        <span className="text-[#2AABEE] text-xs" title="Tasdiqlangan">
                          ✓
                        </span>
                      )}
                    </h3>
                    {chat.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {chat.subtitle}
                  </p>
                </div>

                {/* Badge if any */}
                {chat.unreadCount && (
                  <span className="px-2 py-0.5 rounded-full bg-[#2AABEE] text-[10px] font-black text-white">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ================= RIGHT MAIN CHAT AREA ================= */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#0E1621] relative">
        {/* Telegram Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#17212B] bg-[#17212B]/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white shadow-md ${
                activeChat.avatarColor || 'bg-sky-600'
              }`}
            >
              {activeChat.avatarUrl ? (
                <img
                  src={activeChat.avatarUrl}
                  alt={activeChat.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                activeChat.avatarEmoji || activeChat.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{activeChat.name}</span>
                {activeChat.isVerified && (
                  <span className="text-[#2AABEE] text-xs font-black">✓</span>
                )}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {activeChat.subtitle}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {onOpenMajlis && (
              <button
                type="button"
                onClick={onOpenMajlis}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                title="Jonli Video Majlisga Ulanish"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Majlis</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => alert("KitestGram Audio qo'ng'iroq yoqildi. Mikrofon tayyor!")}
              className="p-2 rounded-xl bg-[#242F3D] hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 transition-colors cursor-pointer"
              title="Qo'ng'iroq qilish"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telegram Chat Wallpaper & Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
          {/* Day Divider */}
          <div className="text-center my-2">
            <span className="inline-block px-3 py-1 rounded-full bg-[#17212B]/90 text-[11px] font-bold text-slate-400 shadow-md">
              Bugun
            </span>
          </div>

          {chatMessages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const rankMeta = msg.senderScore
              ? RANK_CLASS_META[computeRankClass(msg.senderScore)]
              : null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2 group ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Sender Avatar if incoming */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-md">
                    {msg.senderAvatarEmoji || msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-lg ${
                    isMe
                      ? 'bg-[#2B5278] text-white rounded-br-none'
                      : 'bg-[#182533] text-slate-100 rounded-bl-none'
                  }`}
                >
                  {/* Sender Name if incoming */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 pb-1 mb-1 border-b border-white/10">
                      <span className="text-xs font-bold text-sky-400">
                        {msg.senderName}
                      </span>
                      {msg.senderRole === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-[9px] font-black text-slate-950">
                          ADMIN
                        </span>
                      )}
                      {rankMeta && (
                        <span className="text-[10px] text-amber-300 font-bold">
                          [{rankMeta.title}]
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quoted reply if present */}
                  {msg.replyTo && (
                    <div className="mb-2 p-2 rounded-xl bg-black/20 border-l-2 border-sky-400 text-xs text-slate-300">
                      <p className="font-bold text-sky-400 text-[11px]">
                        {msg.replyTo.senderName}
                      </p>
                      <p className="truncate text-slate-300">{msg.replyTo.text}</p>
                    </div>
                  )}

                  {/* Attached Image */}
                  {msg.imageUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden max-h-72 border border-white/10">
                      <img
                        src={msg.imageUrl}
                        alt="Biriktirilgan rasm"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {msg.text}
                  </div>

                  {/* Timestamp & Seen checkmark */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                  </div>

                  {/* Emoji Reactions Pill */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-white/10">
                      {Object.entries(msg.reactions).map(([emo, uids]) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => handleReactToMessage(msg.id, emo)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-transform hover:scale-105 cursor-pointer ${
                            currentUser && uids.includes(currentUser.id)
                              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                              : 'bg-black/20 border-white/10 text-slate-300'
                          }`}
                        >
                          <span>{emo}</span>
                          <span>{uids.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Reaction Toolbar on Hover */}
                  <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#242F3D] rounded-full px-2 py-0.5 border border-white/10 flex items-center gap-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="Javob qaytarish"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReactToMessage(msg.id, '👍')}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer text-xs"
                      title="Yoqdi"
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReactToMessage(msg.id, '❤️')}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer text-xs"
                      title="Yurak"
                    >
                      ❤️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReactToMessage(msg.id, '🔥')}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer text-xs"
                      title="Olov"
                    >
                      🔥
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="p-1 text-slate-300 hover:text-white cursor-pointer"
                      title="Nusxalash"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Replying Preview Banner */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between px-4 py-2 border-t border-[#17212B] bg-[#17212B]"
            >
              <div className="flex items-center gap-2 text-xs truncate">
                <Reply className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold text-sky-400">
                  {replyingTo.senderName}:
                </span>
                <span className="text-slate-300 truncate">
                  {replyingTo.text}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="p-3 bg-[#17212B] border-t border-[#242F3D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={attachedImage}
                alt="Biriktirilgan rasm"
                className="w-12 h-12 rounded-xl object-cover border border-white/20"
              />
              <span className="text-xs text-sky-300 font-bold">Rasm biriktirildi</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1.5 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Telegram Bottom Composer */}
        <div className="p-3 border-t border-[#17212B] bg-[#17212B]/95 backdrop-blur-md relative">
          {/* Emoji Picker Popover */}
          <AnimatePresence>
            {isEmojiPickerOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-16 left-4 z-50 p-3 rounded-2xl border border-[#242F3D] bg-[#17212B] shadow-2xl flex flex-wrap gap-2 w-72"
              >
                {TELEGRAM_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setIsEmojiPickerOpen(false);
                      textInputRef.current?.focus();
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-[#242F3D] text-lg flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-[#242F3D] text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
              title="Rasm yuklash"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
              className="p-2.5 rounded-xl hover:bg-[#242F3D] text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
              title="Emotsiya va stikerlar"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Message Input */}
            <input
              ref={textInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Xabar yozing (Telegram kabi onlayn)..."
              className="flex-1 rounded-2xl bg-[#242F3D] py-2.5 px-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />

            {/* Voice Record / Send Button */}
            {inputText.trim() || attachedImage ? (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#2AABEE] hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform active:scale-95 cursor-pointer"
                title="Yuborish"
              >
                <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isRecordingVoice
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
                    : 'bg-[#242F3D] text-slate-400 hover:text-sky-400 hover:bg-[#2b3848]'
                }`}
                title={isRecordingVoice ? "To'xtatish va yuborish" : "Ovozli xabar yozish"}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </form>

          {/* Voice recording live indicator */}
          {isRecordingVoice && (
            <div className="mt-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold">Ovoz yozilmoqda... {recordingSeconds}s</span>
              </div>
              <span className="text-[10px] text-rose-400">Yana bir marta bosing</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
