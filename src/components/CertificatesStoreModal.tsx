import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  User,
  StoreCertificate,
  StoreShopItem,
  StarColor,
  STAR_COLOR_META,
  UserPurchasedCertificate,
  Submission,
  CertificateData,
  ADMIN_EMAIL,
} from '../types';
import {
  KIDTEST_LOGO_DATA_URL,
  playKitestSound,
} from './KitestEmblem';
import { ADMIN_PASSCODE_VALUE } from './AdminAuthModal';
import {
  X,
  Award,
  Zap,
  Download,
  CheckCircle2,
  Sparkles,
  Upload,
  PlusCircle,
  Trash2,
  Play,
  ShoppingBag,
  Video,
  AlertCircle,
  Crown,
  Star,
  Coins,
  Flame,
  Gift,
} from 'lucide-react';

interface CertificatesStoreModalProps {
  isOpen: boolean;
  initialTab?: 'stars_rank' | 'wheel_coins' | 'store' | 'my_certs' | 'admin_upload';
  currentUser: User | null;
  isAdminUnlocked: boolean;
  adminPasscode: string;
  storeCertificates: StoreCertificate[];
  storeShopItems?: StoreShopItem[];
  submissions: Submission[];
  soundEnabled?: boolean;
  autoCeremonyCert?: StoreCertificate | null;
  onClose: () => void;
  onRequireLogin: () => void;
  onUpdateUser: (user: User) => void;
  onRefreshState: () => Promise<void>;
  onOpenCertificateModal: (cert: CertificateData) => void;
  onOpenLuckyWheel?: () => void;
}

export const CertificatesStoreModal: React.FC<CertificatesStoreModalProps> = ({
  isOpen,
  initialTab = 'stars_rank',
  currentUser,
  isAdminUnlocked,
  adminPasscode,
  storeCertificates,
  storeShopItems = [],
  submissions,
  soundEnabled = true,
  autoCeremonyCert = null,
  onClose,
  onRequireLogin,
  onUpdateUser,
  onRefreshState,
  onOpenCertificateModal,
  onOpenLuckyWheel,
}) => {
  const [activeTab, setActiveTab] = useState<
    'stars_rank' | 'wheel_coins' | 'store' | 'my_certs' | 'admin_upload'
  >(initialTab);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPurchasingId, setIsPurchasingId] = useState<string | null>(null);

  // Admin Upload Mode: 'shop_item' (Yulduz / Rank / Baraban / Coins) or 'certificate'
  const [adminUploadType, setAdminUploadType] = useState<'shop_item' | 'certificate'>('shop_item');

  // Admin Shop Item Form ("yulduzcha joylaydi, coins belgilaydi va Rankini yozadi: Pro, Noob, Expert...")
  const [itemCategory, setItemCategory] = useState<'star_rank' | 'wheel_spin' | 'coins_pack'>('star_rank');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCostCoins, setItemCostCoins] = useState<number>(50);
  const [itemCostPoints, setItemCostPoints] = useState<number>(0);
  const [itemStarColor, setItemStarColor] = useState<StarColor>('yellow');
  const [itemRankTitle, setItemRankTitle] = useState('Pro');
  const [itemMultiplier, setItemMultiplier] = useState<number>(3);
  const [itemSpinsGranted, setItemSpinsGranted] = useState<number>(3);
  const [itemCoinsGranted, setItemCoinsGranted] = useState<number>(50);
  const [isCreatingShopItem, setIsCreatingShopItem] = useState(false);

  // Admin Upload Certificate Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Matematika va Informatika');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState<number>(50);
  const [newBadge, setNewBadge] = useState('MAXSUS SERTIFIKAT');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // Cinematic Video & Presenter Character Ceremony State
  const [ceremonyActive, setCeremonyActive] = useState(false);
  const [ceremonyStage, setCeremonyStage] = useState<
    'walking_in' | 'presenting_cert' | 'dropped_in_vault'
  >('walking_in');
  const [ceremonyStoreCert, setCeremonyStoreCert] =
    useState<StoreCertificate | null>(null);
  const [ceremonyPurchasedCert, setCeremonyPurchasedCert] =
    useState<UserPurchasedCertificate | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStatusMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (autoCeremonyCert && isOpen) {
      setCeremonyStoreCert(autoCeremonyCert);
      setCeremonyPurchasedCert(null);
      setCeremonyStage('walking_in');
      setCeremonyActive(true);
      playKitestSound('fanfare', soundEnabled);
    }
  }, [autoCeremonyCert, isOpen, soundEnabled]);

  useEffect(() => {
    if (!ceremonyActive) return;

    const t1 = setTimeout(() => {
      setCeremonyStage('presenting_cert');
      playKitestSound('victory', soundEnabled);
      try {
        confetti({
          particleCount: 110,
          spread: 85,
          origin: { y: 0.55 },
        });
      } catch {}
    }, 1700);

    const t2 = setTimeout(() => {
      if (ceremonyPurchasedCert) {
        setCeremonyStage('dropped_in_vault');
        playKitestSound('success', soundEnabled);
      }
    }, 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ceremonyActive, ceremonyPurchasedCert, soundEnabled]);

  const isAdmin =
    isAdminUnlocked ||
    Boolean(
      currentUser &&
        (currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
          currentUser.role === 'admin')
    );

  const myPerfectSubmissions = useMemo(() => {
    if (!currentUser) return [];
    const map = new Map<string, Submission>();
    submissions.forEach((s) => {
      const isPerfect =
        s.percentage === 100 ||
        (s.totalQuestions > 0 && s.correctCount === s.totalQuestions);
      if (s.userId === currentUser.id && isPerfect && !map.has(s.testId)) {
        map.set(s.testId, s);
      }
    });
    return Array.from(map.values());
  }, [submissions, currentUser]);

  const myPurchasedCerts = useMemo<UserPurchasedCertificate[]>(() => {
    if (!currentUser || !Array.isArray(currentUser.purchasedCertificates)) {
      return [];
    }
    return currentUser.purchasedCertificates;
  }, [currentUser]);

  const starRankItems = useMemo(
    () => storeShopItems.filter((i) => i.category === 'star_rank'),
    [storeShopItems]
  );

  const wheelAndCoinItems = useMemo(
    () =>
      storeShopItems.filter(
        (i) => i.category === 'wheel_spin' || i.category === 'coins_pack'
      ),
    [storeShopItems]
  );

  if (!isOpen) return null;

  const userStarColor: StarColor = currentUser?.starColor || 'blue';
  const userStarMeta = STAR_COLOR_META[userStarColor] || STAR_COLOR_META.blue;
  const userMultiplier =
    currentUser?.scoreMultiplier || userStarMeta.multiplier || 1;
  const userRankClass =
    currentUser?.starRankTitle || userStarMeta.rankTitle || 'Noob';

  const handlePurchaseShopItem = async (item: StoreShopItem) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsPurchasingId(item.id);

    try {
      const res = await fetch('/api/store-items/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          itemId: item.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playKitestSound('victory', soundEnabled);
        try {
          confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
        } catch {}
        if (data.user) {
          onUpdateUser(data.user);
        }
        await onRefreshState();
        setStatusMsg(data.message || `«${item.title}» muvaffaqiyatli sotib olindi!`);
      } else {
        playKitestSound('warning', soundEnabled);
        setErrorMsg(data.error || 'Sotib olishda xatolik yuz berdi');
      }
    } catch {
      setErrorMsg('Server bilan aloqa xatoligi');
    } finally {
      setIsPurchasingId(null);
    }
  };

  const handleAdminCreateShopItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) {
      setErrorMsg("Mahsulot nomini kiriting!");
      return;
    }
    setIsCreatingShopItem(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/store-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || ADMIN_PASSCODE_VALUE,
        },
        body: JSON.stringify({
          title: itemTitle.trim(),
          description: itemDesc.trim(),
          category: itemCategory,
          costCoins: Number(itemCostCoins) || 0,
          costPoints: Number(itemCostPoints) || 0,
          starColor: itemCategory === 'star_rank' ? itemStarColor : undefined,
          rankTitle: itemCategory === 'star_rank' ? itemRankTitle.trim() : undefined,
          multiplier: itemCategory === 'star_rank' ? Number(itemMultiplier) || 2 : undefined,
          spinsGranted: itemCategory === 'wheel_spin' ? Number(itemSpinsGranted) || 1 : undefined,
          coinsGranted: itemCategory === 'coins_pack' ? Number(itemCoinsGranted) || 25 : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playKitestSound('victory', soundEnabled);
        setStatusMsg(`«${itemTitle}» do'konga muvaffaqiyatli qo'shildi!`);
        setItemTitle('');
        setItemDesc('');
        await onRefreshState();
        setActiveTab(itemCategory === 'star_rank' ? 'stars_rank' : 'wheel_coins');
      } else {
        setErrorMsg(data.error || "Mahsulot qo'shishda xatolik");
      }
    } catch {
      setErrorMsg('Server xatoligi');
    } finally {
      setIsCreatingShopItem(false);
    }
  };

  const handleAdminDeleteShopItem = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/store-items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || ADMIN_PASSCODE_VALUE,
        },
      });
      if (res.ok) {
        playKitestSound('click', soundEnabled);
        await onRefreshState();
      }
    } catch {}
  };

  const handleCertImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Faqat rasm faylini (PNG, JPG, WEBP) yuklang!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setNewImageUrl(canvas.toDataURL('image/jpeg', 0.88));
          setErrorMsg(null);
        }
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdminCreateStoreCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg('Sertifikat nomini kiriting!');
      return;
    }
    setIsUploadingCert(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/store-certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || ADMIN_PASSCODE_VALUE,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          subject: newSubject.trim(),
          description: newDesc.trim(),
          requiredPoints: Number(newPoints) || 0,
          imageUrl: newImageUrl.trim(),
          videoUrl: newVideoUrl.trim() || undefined,
          badgeText:
            newBadge.trim() || `RASMIY SERTIFIKAT · ${Number(newPoints) || 0} BALL`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        playKitestSound('victory', soundEnabled);
        setStatusMsg(
          `«${newTitle}» sertifikati (${newPoints} ball) muvaffaqiyatli do'konga joylandi!`
        );
        setNewTitle('');
        setNewDesc('');
        setNewImageUrl('');
        setNewVideoUrl('');
        await onRefreshState();
        setActiveTab('store');
      } else {
        setErrorMsg(data.error || 'Sertifikat joylashda xatolik');
      }
    } catch {
      setErrorMsg('Server bilan aloqa xatoligi');
    } finally {
      setIsUploadingCert(false);
    }
  };

  const handleAdminDeleteStoreCert = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/store-certificates/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentUser?.email || ADMIN_EMAIL,
          'x-admin-passcode': adminPasscode || ADMIN_PASSCODE_VALUE,
        },
      });
      if (res.ok) {
        playKitestSound('click', soundEnabled);
        await onRefreshState();
      }
    } catch {}
  };

  const handlePurchaseCertificate = async (
    storeCert: StoreCertificate,
    use100PercentFreeClaim: boolean = false
  ) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setIsPurchasingId(storeCert.id);

    try {
      const res = await fetch('/api/certificates/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          storeCertificateId: storeCert.id,
          use100PercentFreeClaim,
        }),
      });
      const data = await res.json();

      if (res.ok && data.purchasedCertificate) {
        if (data.user) {
          onUpdateUser(data.user);
        }
        await onRefreshState();

        setCeremonyStoreCert(storeCert);
        setCeremonyPurchasedCert(data.purchasedCertificate);
        setCeremonyStage('walking_in');
        setCeremonyActive(true);
        playKitestSound('fanfare', soundEnabled);
      } else {
        playKitestSound('warning', soundEnabled);
        setErrorMsg(
          data.error ||
            'Sertifikatni sotib olish uchun balingiz yetarli emas!'
        );
      }
    } catch {
      setErrorMsg('Server xatoligi yuz berdi');
    } finally {
      setIsPurchasingId(null);
    }
  };

  const convertPurchasedToCertData = (
    p: UserPurchasedCertificate
  ): CertificateData => ({
    serialNumber: p.serialNumber,
    recipientName: p.userName,
    recipientUsername: p.username,
    region: p.region || currentUser?.region,
    district: p.district || currentUser?.district,
    institution: p.institution || currentUser?.institution,
    testId: p.storeCertificateId.slice(-4).toUpperCase(),
    testTitle: p.title,
    subject: p.subject,
    percentage: 100,
    earnedPoints: p.costPoints,
    maxPoints: p.costPoints || 100,
    grade: "5 (A'lo · Maksimal)",
    issuedAt: p.purchasedAt,
    customImageUrl: p.imageUrl || undefined,
    costPoints: p.costPoints,
    acquiredVia: p.acquiredVia,
  });

  const convertSubmissionToCertData = (sub: Submission): CertificateData => ({
    serialNumber: `KITEST-100-${sub.testId}-${sub.id.slice(-4).toUpperCase()}`,
    recipientName: sub.userName,
    recipientUsername: sub.username,
    region: currentUser?.region,
    district: currentUser?.district,
    institution: currentUser?.institution,
    testId: sub.testId,
    testTitle: sub.testTitle,
    subject: sub.subject,
    percentage: 100,
    earnedPoints: sub.earnedPoints,
    maxPoints: sub.maxPoints,
    grade: sub.grade || "5 (A'lo)",
    issuedAt: sub.submittedAt,
    acquiredVia: 'perfect_100',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="max-w-5xl w-full rounded-3xl bg-slate-900 border-2 border-amber-500/60 shadow-2xl overflow-hidden my-auto relative"
        >
          {/* CINEMATIC VIDEO & CHARACTER PRESENTATION OVERLAY */}
          <AnimatePresence>
            {ceremonyActive && ceremonyStoreCert && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-[#030712]/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
              >
                <motion.div
                  initial={{ scale: 0.88, y: 24 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="max-w-4xl w-full rounded-3xl bg-gradient-to-b from-[#081229] via-[#050b1a] to-[#09152e] border-2 border-amber-400/80 shadow-[0_0_80px_rgba(245,158,11,0.3)] overflow-hidden relative"
                >
                  <div className="px-6 py-3.5 bg-slate-950/90 border-b border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-sky-400" />
                        <span>
                          KITEST MAXSUS SERTIFIKAT TAQDIMOT VIDEOSI · JONLI EFIR
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => setCeremonyActive(false)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative min-h-[450px] p-6 sm:p-8 flex flex-col items-center justify-between overflow-hidden">
                    <div className="relative z-10 text-center space-y-1">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {ceremonyStage === 'walking_in'
                            ? '🎬 Ustoz sahnaga chiqib sertifikatni olib kelmoqda...'
                            : ceremonyStage === 'presenting_cert'
                            ? "🏅 Ustoz sertifikatingizni tantanali ravishda ko'rsatmoqda!"
                            : "✅ Sertifikat «Mening Sertifikatlarim» bo'limiga tushdi!"}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        {currentUser?.name || 'Hurmatli Ishtirokchi'}, tabriklaymiz!
                      </h2>
                    </div>

                    <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-center gap-6 my-4">
                      <motion.div
                        initial={{ x: -160, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col items-center shrink-0"
                      >
                        <div className="w-36 h-36 rounded-full bg-gradient-to-br from-amber-500/20 to-sky-500/20 border-2 border-amber-400 flex items-center justify-center text-6xl shadow-2xl">
                          👨‍🏫
                        </div>
                        <span className="mt-2 px-3 py-1 rounded-full bg-slate-900 border border-sky-400/40 text-[11px] font-bold text-sky-300">
                          KITEST Taqdimotchisi
                        </span>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 max-w-lg w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#071330] via-[#0c1f4a] to-[#050d21] border-4 border-amber-400 shadow-2xl"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-amber-400/30 pb-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={KIDTEST_LOGO_DATA_URL}
                              alt="KITEST"
                              className="w-11 h-11 rounded-full border border-amber-300"
                            />
                            <div>
                              <div className="text-[10px] font-mono font-extrabold text-sky-300 uppercase">
                                KITEST · BILIM SINOVI SERTIFIKATI
                              </div>
                              <div className="text-sm font-black text-amber-400">
                                FAXRIY SERTIFIKAT
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-xs">
                            ⚡ {ceremonyStoreCert.requiredPoints} BALL
                          </span>
                        </div>

                        <div className="text-center space-y-1.5 py-2">
                          <div className="text-[11px] text-slate-300">
                            Ushbu sertifikat tantanali ravishda topshirildi:
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-white border-b border-amber-400/40 pb-1 inline-block px-6">
                            {currentUser?.name || 'Ishtirokchi'}
                          </div>
                          <div className="text-sm font-extrabold text-amber-300 pt-1">
                            «{ceremonyStoreCert.title}»
                          </div>
                          <div className="text-xs text-sky-300">
                            {ceremonyStoreCert.subject}
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <div className="relative z-10 w-full pt-4 border-t border-slate-800/90 flex flex-wrap items-center justify-center gap-3">
                      {ceremonyPurchasedCert ? (
                        <button
                          onClick={() => {
                            const certPayload = convertPurchasedToCertData(
                              ceremonyPurchasedCert
                            );
                            setCeremonyActive(false);
                            onOpenCertificateModal(certPayload);
                          }}
                          className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl"
                        >
                          <Download className="w-4 h-4" />
                          <span>📥 Sertifikatni Ko'rish va PNG Yuklab Olish</span>
                        </button>
                      ) : (
                        <button
                          disabled={isPurchasingId === ceremonyStoreCert.id}
                          onClick={() =>
                            handlePurchaseCertificate(ceremonyStoreCert, false)
                          }
                          className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>
                            ⚡ {ceremonyStoreCert.requiredPoints} Ball Bilan Sotib Olish
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => setCeremonyActive(false)}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      >
                        Yopish
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOP STORE HEADER */}
          <div className="p-5 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={KIDTEST_LOGO_DATA_URL}
                alt="KidTest"
                className="w-12 h-12 rounded-full border-2 border-amber-400 shadow-lg"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    🛍️ KITEST Rasmiy Do'koni (Yulduzlar, Baraban, Coins & Sertifikatlar)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-extrabold">
                    2x · 3x · 4x · 5x BALL KO'PAYTIRGICH
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Coins va Ballaringiz orqali Rang-barang Profil Yulduzlari (Noob, Pro, Expert, Master), Baraban, Coins va Rasmiy Sertifikatlarni xarid qiling!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {currentUser && (
                <>
                  {/* Current User Star & Multiplier Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-black ${userStarMeta.badgeClass}`}
                  >
                    <span>{userStarMeta.starEmoji}</span>
                    <div>
                      <div className="text-[9px] uppercase opacity-80">
                        Sizning Yulduzingiz
                      </div>
                      <div className="text-xs font-black">
                        {userRankClass} · {userMultiplier}x Ball
                      </div>
                    </div>
                  </div>

                  {/* Coins Balance */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center gap-2 font-mono">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Coins</div>
                      <div className="text-xs font-black text-amber-300">
                        🪙 {currentUser.coins ?? 0}
                      </div>
                    </div>
                  </div>

                  {/* Points Balance */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-500/40 flex items-center gap-2 font-mono">
                    <Zap className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Ball</div>
                      <div className="text-xs font-black text-sky-300">
                        💎 {currentUser.totalScore}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* NAVIGATION TABS */}
          <div className="px-6 pt-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('stars_rank')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'stars_rank'
                  ? 'border-amber-400 text-amber-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 text-amber-400" />
              <span>⭐ Yulduzlar va Rank (2x–5x Ball)</span>
            </button>

            <button
              onClick={() => setActiveTab('wheel_coins')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'wheel_coins'
                  ? 'border-fuchsia-400 text-fuchsia-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4 text-fuchsia-400" />
              <span>🎡 Baraban & 🪙 Coins Do'koni</span>
            </button>

            <button
              onClick={() => setActiveTab('store')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'store'
                  ? 'border-sky-400 text-sky-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>🎓 Sertifikatlar ({storeCertificates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my_certs')}
              className={`py-2.5 px-4 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'my_certs'
                  ? 'border-emerald-400 text-emerald-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                🏅 Mening Sertifikatlarim (
                {myPurchasedCerts.length + myPerfectSubmissions.length})
              </span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin_upload')}
                className={`py-2.5 px-4 rounded-t-xl text-xs font-extrabold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'admin_upload'
                    ? 'border-amber-400 text-amber-300 bg-slate-900'
                    : 'border-transparent text-amber-300 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>👑 Admin: Do'konga Narsa Joylash</span>
              </button>
            )}
          </div>

          {/* Status & Error Alerts */}
          {(statusMsg || errorMsg) && (
            <div className="px-6 pt-4">
              {statusMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 1: COLORED STARS & RANK MULTIPLIERS (5, 6, 8-SAHIFALAR)           */}
          {/* ===================================================================== */}
          {activeTab === 'stars_rank' && (
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {/* Explainer Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-950 to-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>
                      ⭐ Rang-Barang Profil Yulduzlari va Ball Ko'paytirgich (2x, 3x, 4x, 5x)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Do'kondan yulduz sotib olsangiz, u har doim profil tepasida turadi, sizga{' '}
                    <strong className="text-amber-300">Rank (Noob, Amateur, Pro, Expert, Master)</strong>{' '}
                    beradi hamda test va kurslardan oladigan ballaringizni avtomatik{' '}
                    <strong className="text-emerald-300">2x, 3x, 4x, 5x barobar ko'paytiradi!</strong>
                  </p>
                </div>

                {currentUser && (
                  <div className="px-4 py-2.5 rounded-xl bg-slate-900 border border-amber-400/50 text-right shrink-0">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">
                      Joriy Ko'paytirgichingiz
                    </div>
                    <div className="text-base font-black text-amber-300">
                      {userStarMeta.starEmoji} {userRankClass} · {userMultiplier}x Ball
                    </div>
                  </div>
                )}
              </div>

              {/* Star Rank Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starRankItems.map((item) => {
                  const sColor: StarColor = item.starColor || 'blue';
                  const meta = STAR_COLOR_META[sColor] || STAR_COLOR_META.blue;
                  const mult = item.multiplier || meta.multiplier || 1;
                  const rTitle = item.rankTitle || meta.rankTitle;
                  const isCurrentActive =
                    currentUser?.starColor === sColor &&
                    currentUser?.starRankTitle === rTitle;
                  const canAffordCoins =
                    (currentUser?.coins ?? 0) >= (item.costCoins || 0);
                  const canAffordPts =
                    (currentUser?.totalScore ?? 0) >= (item.costPoints || 0);
                  const canBuy = canAffordCoins && canAffordPts;

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-all ${
                        isCurrentActive
                          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border-emerald-400 shadow-lg shadow-emerald-500/15'
                          : 'bg-slate-950 border-slate-800 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-black border ${meta.badgeClass}`}
                          >
                            {meta.starEmoji} {rTitle} ({mult}x BALL)
                          </span>

                          <div className="flex items-center gap-1.5">
                            {item.costCoins > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-mono font-black text-xs">
                                🪙 {item.costCoins} Coins
                              </span>
                            )}
                            {(item.costPoints || 0) > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-mono font-black text-xs">
                                💎 {item.costPoints} Ball
                              </span>
                            )}
                            {item.costCoins === 0 && (item.costPoints || 0) === 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs">
                                BEPUL
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleAdminDeleteShopItem(item.id)}
                                className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300"
                                title="O'chirish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 shadow-inner"
                            style={{
                              borderColor: meta.hex,
                              backgroundColor: `${meta.hex}22`,
                            }}
                          >
                            {meta.starEmoji}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                            Rank Class: <strong className="text-white">{rTitle}</strong>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-bold">
                            Ball Bonusi: <strong>{mult}x Ko'payadi</strong>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={isPurchasingId === item.id || isCurrentActive}
                        onClick={() => handlePurchaseShopItem(item)}
                        className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isCurrentActive
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                            : canBuy
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        <span>
                          {isCurrentActive
                            ? `✅ Faol Yulduzingiz (${mult}x)`
                            : isPurchasingId === item.id
                            ? 'Olinmoqda...'
                            : `⭐ Sotib Olish va ${rTitle} (${mult}x) Bo'lish`}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 2: BARABAN SPINS & COINS PACKS (5-6 SAHIFALAR)                    */}
          {/* ===================================================================== */}
          {activeTab === 'wheel_coins' && (
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {/* Direct Lucky Wheel Launcher Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-fuchsia-950/40 to-slate-950 border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-base font-black text-white flex items-center gap-2">
                    <span>🎡 Real Omad Barabani (Lucky Wheel)</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-mono">
                      Aylantirishlar: {currentUser?.wheelSpinsLeft ?? 2} ta
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Barabanni aylantirib bepul Ball, Coins va Yulduzlar yutib oling yoki pastdan qo'shimcha Baraban va Coins paketlarini sotib oling!
                  </p>
                </div>

                {onOpenLuckyWheel && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenLuckyWheel();
                    }}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shrink-0 shadow-lg"
                  >
                    <Gift className="w-4 h-4" />
                    <span>🎡 Barabanni Hozir Aylantirish</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wheelAndCoinItems.map((item) => {
                  const isWheel = item.category === 'wheel_spin';
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-slate-950 border-2 border-slate-800 hover:border-fuchsia-500/50 flex flex-col justify-between gap-4 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold uppercase ${
                              isWheel
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                            }`}
                          >
                            {isWheel ? '🎡 BARABAN PAKETI' : '🪙 COINS PAKETI'}
                          </span>

                          <div className="flex items-center gap-2">
                            {item.costCoins > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-xs">
                                🪙 {item.costCoins} Coins
                              </span>
                            )}
                            {(item.costPoints || 0) > 0 && (
                              <span className="px-3 py-1 rounded-xl bg-sky-500 text-slate-950 font-mono font-black text-xs">
                                💎 {item.costPoints} Ball
                              </span>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => handleAdminDeleteShopItem(item.id)}
                                className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                            {isWheel ? '🎡' : '🪙'}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">
                              {item.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={isPurchasingId === item.id}
                        onClick={() => handlePurchaseShopItem(item)}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 hover:from-amber-400 hover:to-fuchsia-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>
                          {isPurchasingId === item.id
                            ? 'Xarid qilinmoqda...'
                            : `Sotib Olish (${
                                item.costCoins > 0
                                  ? `${item.costCoins} Coins`
                                  : `${item.costPoints} Ball`
                              })`}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 3: SERTIFIKATLAR DO'KONI                                          */}
          {/* ===================================================================== */}
          {activeTab === 'store' && (
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {storeCertificates.map((cert) => {
                  const ownedObj = myPurchasedCerts.find(
                    (p) => p.storeCertificateId === cert.id
                  );
                  const userScore = currentUser?.totalScore || 0;
                  const canAfford = userScore >= cert.requiredPoints;
                  const progressPct =
                    cert.requiredPoints > 0
                      ? Math.min(
                          100,
                          Math.round((userScore / cert.requiredPoints) * 100)
                        )
                      : 100;

                  return (
                    <div
                      key={cert.id}
                      className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-all ${
                        ownedObj
                          ? 'bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-900 border-emerald-500/60'
                          : canAfford
                          ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-900 border-amber-500/70 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-extrabold uppercase">
                            {cert.badgeText || 'RASMIY SERTIFIKAT'}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-mono font-black text-xs flex items-center gap-1 shadow">
                              <Zap className="w-3.5 h-3.5" />
                              <span>{cert.requiredPoints} ball</span>
                            </span>

                            {isAdmin && (
                              <button
                                onClick={() => handleAdminDeleteStoreCert(cert.id)}
                                title="Sertifikatni o'chirish"
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-amber-500/40 bg-[#060f26] p-4 flex items-center gap-3.5">
                          {cert.imageUrl ? (
                            <img
                              src={cert.imageUrl}
                              alt={cert.title}
                              className="w-24 h-20 rounded-lg object-cover border border-amber-400 shrink-0"
                            />
                          ) : (
                            <img
                              src={KIDTEST_LOGO_DATA_URL}
                              alt="KidTest"
                              className="w-16 h-16 rounded-full border-2 border-amber-400 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono text-sky-400 uppercase font-bold">
                              {cert.subject}
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                              {cert.title}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {cert.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400">
                              Ball holati:{' '}
                              <strong className="text-white">
                                {userScore} / {cert.requiredPoints} ball
                              </strong>
                            </span>
                            <span
                              className={
                                canAfford
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-amber-300'
                              }
                            >
                              {ownedObj
                                ? '✅ Sotib olingan'
                                : canAfford
                                ? '🎬 Ball yetarli! Sotib olish mumkin!'
                                : `Yana ${Math.max(0, cert.requiredPoints - userScore)} ball kerak`}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                            <div
                              style={{ width: `${progressPct}%` }}
                              className={`h-full transition-all duration-500 ${
                                ownedObj || canAfford
                                  ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                                  : 'bg-sky-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        {ownedObj ? (
                          <>
                            <button
                              onClick={() => {
                                setCeremonyStoreCert(cert);
                                setCeremonyPurchasedCert(ownedObj);
                                setCeremonyStage('walking_in');
                                setCeremonyActive(true);
                                playKitestSound('fanfare', soundEnabled);
                              }}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>🎬 Taqdimot Videoni Ko'rish</span>
                            </button>
                            <button
                              onClick={() =>
                                onOpenCertificateModal(
                                  convertPurchasedToCertData(ownedObj)
                                )
                              }
                              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>📥 Yuklab Olish</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled={isPurchasingId === cert.id}
                              onClick={() =>
                                handlePurchaseCertificate(cert, false)
                              }
                              className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                                canAfford
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>
                                {isPurchasingId === cert.id
                                  ? 'Tayyorlanmoqda...'
                                  : `⚡ ${cert.requiredPoints} Ball Bilan Sotib Olish`}
                              </span>
                            </button>

                            {!canAfford && myPerfectSubmissions.length > 0 && (
                              <button
                                onClick={() =>
                                  handlePurchaseCertificate(cert, true)
                                }
                                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>100% Imtiyoz Bilan Olish</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 4: MENING SERTIFIKATLARIM                                         */}
          {/* ===================================================================== */}
          {activeTab === 'my_certs' && (
            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              {myPurchasedCerts.length === 0 &&
              myPerfectSubmissions.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <Award className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="text-base font-extrabold text-white">
                    Sizda hozircha olingan sertifikatlar yo'q
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Testlarni yechib ball to'plang va «Sertifikatlar Do'koni»dan ball evaziga sertifikat sotib oling!
                  </p>
                  <button
                    onClick={() => setActiveTab('store')}
                    className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Sertifikatlar Do'koniga O'tish</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPurchasedCerts.map((item, idx) => (
                    <div
                      key={`store_purchased_${item.id || item.serialNumber}_${idx}`}
                      className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-500/60 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={item.imageUrl || KIDTEST_LOGO_DATA_URL}
                          alt={item.title}
                          className="w-14 h-14 rounded-full border border-amber-400 shrink-0 object-cover"
                        />
                        <div>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                            {item.serialNumber} · ⚡ {item.costPoints} BALL
                          </span>
                          <h4 className="text-sm font-extrabold text-white mt-1">
                            {item.title}
                          </h4>
                          <div className="text-xs text-sky-400">
                            {item.subject}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onOpenCertificateModal(convertPurchasedToCertData(item))
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Sertifikatni Ko'rish va Yuklab Olish</span>
                      </button>
                    </div>
                  ))}

                  {myPerfectSubmissions.map((sub, idx) => (
                    <div
                      key={`store_perfect_${sub.id || sub.testId}_${idx}`}
                      className="p-5 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={KIDTEST_LOGO_DATA_URL}
                          alt="KidTest"
                          className="w-14 h-14 rounded-full border border-emerald-400 shrink-0"
                        />
                        <div>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                            🎓 100% TEST NATIJASI · #{sub.testId}
                          </span>
                          <h4 className="text-sm font-extrabold text-white mt-1">
                            {sub.testTitle}
                          </h4>
                          <div className="text-xs text-sky-400">
                            {sub.subject} · +{sub.earnedPoints} ball
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onOpenCertificateModal(
                            convertSubmissionToCertData(sub)
                          )
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-4 h-4" />
                        <span>100% Sertifikatni Yuklab Olish</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB 5: ADMIN UPLOAD (YULDUZCHA + RANK + COINS + SERTIFIKAT JOYLASH)   */}
          {/* ===================================================================== */}
          {activeTab === 'admin_upload' && isAdmin && (
            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminUploadType('shop_item')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center gap-2 border ${
                    adminUploadType === 'shop_item'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>⭐ Yulduzcha + Rank (Noob/Pro/Expert) yoki Baraban/Coins Qo'shish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAdminUploadType('certificate')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black flex items-center gap-2 border ${
                    adminUploadType === 'certificate'
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>🎓 Rasmiy Sertifikat Qo'shish</span>
                </button>
              </div>

              {adminUploadType === 'shop_item' ? (
                <form
                  onSubmit={handleAdminCreateShopItem}
                  className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-4"
                >
                  <div>
                    <h3 className="text-sm font-black text-amber-300">
                      👑 Admin: Do'konga Yulduzcha, Rank (Pro/Noob/Expert), Baraban yoki Coins Qo'shish
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      6 va 8-sahifa talabi: Yulduzcha rangini tanlang, Coins narxini belgilang, Rank nomini (Noob, Pro, Expert, Master) va necha barobar (2x, 3x, 4x, 5x) ball ko'paytirishini kiriting.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Bo'lim turi
                      </label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
                      >
                        <option value="star_rank">⭐ Yulduzcha va Rank Class</option>
                        <option value="wheel_spin">🎡 Baraban Aylantirish</option>
                        <option value="coins_pack">🪙 Coins Paketi</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Nomi *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="Masalan: Sariq Yulduz · Pro Rank (3x Ball)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white"
                      />
                    </div>
                  </div>

                  {itemCategory === 'star_rank' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          ⭐ Yulduz Rangi
                        </label>
                        <select
                          value={itemStarColor}
                          onChange={(e) =>
                            setItemStarColor(e.target.value as StarColor)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                        >
                          <option value="blue">💙 Ko'k Yulduz (Blue)</option>
                          <option value="green">💚 Yashil Yulduz (Green)</option>
                          <option value="yellow">💛 Sariq Yulduz (Yellow)</option>
                          <option value="red">❤️ Qizil Yulduz (Red)</option>
                          <option value="purple">💜 Binafsha Yulduz (Purple)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-sky-300 mb-1">
                          🏆 Rank Class Nomi (Pro, Noob, Expert...)
                        </label>
                        <input
                          type="text"
                          required
                          value={itemRankTitle}
                          onChange={(e) => setItemRankTitle(e.target.value)}
                          placeholder="Pro / Expert / Noob / Legend"
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-emerald-300 mb-1">
                          🚀 Ball Ko'paytirgich (2x, 3x, 4x, 5x)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={itemMultiplier}
                          onChange={(e) =>
                            setItemMultiplier(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-emerald-500/50 text-xs font-mono font-black text-emerald-300"
                        />
                      </div>
                    </div>
                  )}

                  {itemCategory === 'wheel_spin' && (
                    <div>
                      <label className="block text-xs font-bold text-fuchsia-300 mb-1">
                        🎡 Beriladigan Baraban Aylantirish Soni
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={itemSpinsGranted}
                        onChange={(e) =>
                          setItemSpinsGranted(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  )}

                  {itemCategory === 'coins_pack' && (
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        🪙 Beriladigan Coins Miqdori
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={itemCoinsGranted}
                        onChange={(e) =>
                          setItemCoinsGranted(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        🪙 Narxi: Coinsda (0 = Coins talab qilinmaydi)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={itemCostCoins}
                        onChange={(e) =>
                          setItemCostCoins(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/50 text-xs font-mono font-bold text-amber-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-sky-300 mb-1">
                        💎 Narxi: Ballda (0 = Ball talab qilinmaydi)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={itemCostPoints}
                        onChange={(e) =>
                          setItemCostPoints(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-sky-500/50 text-xs font-mono font-bold text-sky-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Qisqacha tavsif
                    </label>
                    <input
                      type="text"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      placeholder="Ushbu yulduz va rank foydalanuvchiga 3x ball beradi..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isCreatingShopItem}
                      className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>
                        {isCreatingShopItem
                          ? 'Joylanmoqda...'
                          : "⭐ Do'konga Joylash"}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleAdminCreateStoreCertificate}
                  className="p-5 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Sertifikat Nomi *
                      </label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Masalan: KITEST Oltin Olimpiada Sertifikati"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1">
                        ⚡ Kerakli Ball *
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={newPoints}
                        onChange={(e) => setNewPoints(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/60 text-sm font-mono font-black text-amber-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Fan yoki Yo'nalish *
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Sertifikat Daraja Yorlig'i
                      </label>
                      <input
                        type="text"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <input
                      ref={certFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCertImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => certFileInputRef.current?.click()}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Sertifikat Rasmini Tanlash</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isUploadingCert}
                      className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>🎓 Sertifikatni Joylash</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
