import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  User,
  UserPurchasedCertificate,
} from '../types';
import { playKitestSound } from './KitestEmblem';
import {
  ShoppingBag,
  Zap,
  Coins,
  Star,
  CheckCircle2,
  ArrowRight,
  Gift,
  Check,
  Sparkles,
} from 'lucide-react';

export interface ShopItem {
  id: string;
  title: string;
  category: 'certificate' | 'star_rank' | 'avatar_frame' | 'weapon' | 'wheel_ticket';
  categoryLabel: string;
  categoryColor: string;
  icon: string;
  description: string;
  perks: string[];
  costPoints: number;
  costCoins?: number;
  imageUrl?: string;
  badge?: string;
  isPopular?: boolean;
  multiplierGrant?: number;
  starsGrant?: number;
  spinsGrant?: number;
}

export const PLATFORM_SHOP_ITEMS: ShopItem[] = [
  // 1. SERTIFIKATLAR
  {
    id: 'shop_cert_gold',
    title: '🏆 KITEST Oltin Mutlaq Chempion Sertifikati',
    category: 'certificate',
    categoryLabel: 'Rasmiy Sertifikat',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '🏅',
    description: 'Respublika bo‘yicha rasmiy QR-kodli, seriya raqamiga ega Oltin darajadagi oliy sertifikat.',
    perks: ['QR-kodli tekshiruv', 'Maxsus seriya raqami', 'Profilga Oltin nishon', '100% Rasmiy yuklab olish'],
    costPoints: 120,
    costCoins: 80,
    imageUrl: '/src/assets/images/kitest_feature_certificate_1791123766331.jpg',
    badge: 'TOP TANLOV',
    isPopular: true,
  },
  {
    id: 'shop_cert_master',
    title: '💻 Full-Stack & Algoritmlar Ustasi Sertifikati',
    category: 'certificate',
    categoryLabel: 'Rasmiy Sertifikat',
    categoryColor: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '🎓',
    description: 'Dasturlash, ma‘lumotlar tuzilmasi va olimpiada masalalarini yechganlik uchun professional sertifikat.',
    perks: ['Professional maqom', 'Rezyumega qo‘shish imkoni', 'Sertifikatlar arxiviga tushish'],
    costPoints: 90,
    costCoins: 60,
    imageUrl: '/src/assets/images/kitest_feature_course_1791123745671.jpg',
    badge: 'IT Sertifikat',
  },

  // 2. YULDUZ UNVONLARI & STATUSLAR
  {
    id: 'shop_rank_celestial',
    title: '⭐⭐⭐⭐⭐ Celestial Master (Koinot Ustasi)',
    category: 'star_rank',
    categoryLabel: 'Yulduz Unvoni',
    categoryColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '👑',
    description: 'Eng oliy darajadagi 5 yulduzli unvon. Barcha testlar va o‘yinlarda ballarni 3x ko‘paytirib beradi.',
    perks: ['Ball ko‘paytirgich: 3.0x', 'Ism yonida Binafsha Toj', 'Barcha chatlarda VIP yorliq', 'Kiteshot 3D da maxsus aura'],
    costPoints: 150,
    costCoins: 120,
    badge: 'MAX SUS STATUS',
    multiplierGrant: 3,
    starsGrant: 5,
    isPopular: true,
  },
  {
    id: 'shop_rank_grandmaster',
    title: '⭐⭐⭐⭐ Grossmeyster Zukko',
    category: 'star_rank',
    categoryLabel: 'Yulduz Unvoni',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '⭐',
    description: '4 yulduzli grossmeyster unvoni. Ballarni 2.5x ga oshiradi va yulduzlar jadvalida yuqori o‘ringa ko‘taradi.',
    perks: ['Ball ko‘paytirgich: 2.5x', 'Oltin yulduz ko‘rinishi', 'Reytingda oldingi o‘rin'],
    costPoints: 100,
    costCoins: 75,
    badge: '2.5x Bonus',
    multiplierGrant: 2.5,
    starsGrant: 4,
  },
  {
    id: 'shop_rank_cyber_pro',
    title: '⭐⭐⭐ Kiber Chempion UZ',
    category: 'star_rank',
    categoryLabel: 'Yulduz Unvoni',
    categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: '⚡',
    description: '3 yulduzli kiber mutaxassis unvoni. Duel va o‘yinlarda doimiy bonus beradi.',
    perks: ['Ball ko‘paytirgich: 2.0x', 'Yashil nurli nishon', 'Tezkor yutuqlar'],
    costPoints: 60,
    costCoins: 40,
    multiplierGrant: 2,
    starsGrant: 3,
  },

  // 3. PROFIL RAMKALARI & EMBLEMLAR
  {
    id: 'shop_frame_neon_fire',
    title: '🔥 Kiber Olov & Neon Ramka',
    category: 'avatar_frame',
    categoryLabel: 'Profil Ramkasi',
    categoryColor: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: '🔥',
    description: 'Profil avatari atrofida yonib turuvchi olovli animatsiya va qizil neon qoplama.',
    perks: ['Jonli pulsatsiyalanuvchi ramka', 'Chatda va reytingda ko‘rinadi', 'Boshqalardan ajralib turadi'],
    costPoints: 45,
    costCoins: 30,
    badge: 'Jonli Animatsiya',
  },
  {
    id: 'shop_frame_golden_crown',
    title: '👑 Qirollik Oltin Toji Ramkasi',
    category: 'avatar_frame',
    categoryLabel: 'Profil Ramkasi',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: '💎',
    description: 'Oltin toj va zumrad qimmatbaho toshlar bilan bezatilgan premium ramka.',
    perks: ['Oltin toj bezagi', 'VIP profil nuri', 'Doimiy saqlanadi'],
    costPoints: 55,
    costCoins: 35,
    badge: 'VIP Ramka',
  },

  // 4. KITESHOT 3D QUROLLAR VA SKINLAR
  {
    id: 'shop_wpn_hyper_railgun',
    title: '🔫 Hyper Railgun Prime (Neon Moviy)',
    category: 'weapon',
    categoryLabel: 'Kiteshot Quroli',
    categoryColor: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: '⚡',
    description: 'Kiteshot 3D uchun maxsus qurol: o‘q tezligi 2x yuqori, moviy lazer va tezroq o‘qlash.',
    perks: ['+25% Aniqlik', 'Moviy lazer izi', 'Kiteshot 3D da darhol ochiladi'],
    costPoints: 70,
    costCoins: 50,
    badge: 'Maxsus Qurol',
    isPopular: true,
  },
  {
    id: 'shop_wpn_plasma_launcher',
    title: '💥 Plazma Portlatgich (Pushti Neon)',
    category: 'weapon',
    categoryLabel: 'Kiteshot Quroli',
    categoryColor: 'bg-pink-100 text-pink-800 border-pink-300',
    icon: '🚀',
    description: 'Maydondagi bir nechta botlarni bir vaqtda zararlaydigan plazma snaryadlari.',
    perks: ['Radiusi katta portlash', 'Oof tovushi effekti', 'Binafsha nurli to‘lqin'],
    costPoints: 85,
    costCoins: 60,
    badge: 'Kuchli Portlash',
  },

  // 5. OMAD BARABANI BILETLARI
  {
    id: 'shop_wheel_pack_5',
    title: '🎰 5x Omad Barabani Biletlari Paketi',
    category: 'wheel_ticket',
    categoryLabel: 'Baraban Bileti',
    categoryColor: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🎟️',
    description: 'Omad barabanini 5 marta bepul aylantirish imkoniyati. Jackpot 60 ball va tangalar yutish shansi!',
    perks: ['5 ta kafolatlangan aylantirish', 'Jackpot yutish imkoni', 'Ball va tangalar yig‘ish'],
    costPoints: 40,
    costCoins: 25,
    spinsGrant: 5,
    badge: 'Ommabop Paket',
    isPopular: true,
  },
  {
    id: 'shop_wheel_pack_10',
    title: '🎟️ 10x Mega Baraban Biletlari',
    category: 'wheel_ticket',
    categoryLabel: 'Baraban Bileti',
    categoryColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: '🎁',
    description: '10 marta aylantirish imkoniyati. Barcha qimmatbaho sovrinlarni yutib olish uchun eng foydali to‘plam.',
    perks: ['10 ta aylantirish', 'Katta bonuslar kafolati', 'Kengaytirilgan omad'],
    costPoints: 75,
    costCoins: 45,
    spinsGrant: 10,
    badge: 'Mega Tejamkor',
  },
];

interface StoreShopViewProps {
  currentUser: User | null;
  onUpdateUser: (updated: User) => void;
  onRequireLogin: () => void;
  onOpenLuckyWheel: () => void;
  onNavigateTab: (tab: any) => void;
  soundEnabled?: boolean;
}

export const StoreShopView: React.FC<StoreShopViewProps> = ({
  currentUser,
  onUpdateUser,
  onRequireLogin,
  onOpenLuckyWheel,
  onNavigateTab,
  soundEnabled = true,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'certificate' | 'star_rank' | 'avatar_frame' | 'weapon' | 'wheel_ticket'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  // Check owned items from user state
  const ownedItemIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const ids = new Set<string>();
    currentUser.purchasedCertificates?.forEach((c) => {
      if (c.storeCertificateId) ids.add(c.storeCertificateId);
      if (c.id) ids.add(c.id);
    });
    if (currentUser.customBadge) ids.add(currentUser.customBadge);
    return ids;
  }, [currentUser]);

  // Filter items
  const filteredItems = useMemo(() => {
    return PLATFORM_SHOP_ITEMS.filter((item) => {
      const matchCat = activeCategory === 'all' || item.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle Buy
  const handlePurchase = async (item: ShopItem) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const currentScore = currentUser.totalScore || 0;
    if (currentScore < item.costPoints) {
      alert(
        `Ball yetarli emas! Sizda ${currentScore} ball bor, mahsulot narxi esa ${item.costPoints} ball.`
      );
      return;
    }

    if (
      !window.confirm(
        `Rostdan ham "${item.title}" mahsulotini ${item.costPoints} ball evaziga xarid qilmoqchimisiz?`
      )
    ) {
      return;
    }

    setPurchasingItemId(item.id);

    try {
      // Calculate updated user state
      const nextScore = Math.max(0, currentScore - item.costPoints);
      let updatedUser: User = {
        ...currentUser,
        totalScore: nextScore,
      };

      // Apply item specific perks
      if (item.multiplierGrant) {
        updatedUser.scoreMultiplier = Math.max(
          updatedUser.scoreMultiplier || 1,
          item.multiplierGrant
        );
      }

      if (item.starsGrant) {
        updatedUser.stars = Math.max(updatedUser.stars || 0, item.starsGrant);
      }

      if (item.spinsGrant) {
        updatedUser.wheelSpinsLeft = (updatedUser.wheelSpinsLeft || 0) + item.spinsGrant;
        updatedUser.wheelSpinAllowed = true;
      }

      if (item.category === 'avatar_frame') {
        updatedUser.customBadge = item.title;
      }

      if (item.category === 'certificate') {
        const newCert: UserPurchasedCertificate = {
          id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: currentUser.id,
          userName: currentUser.name,
          username: currentUser.username,
          storeCertificateId: item.id,
          title: item.title,
          subject: 'KITEST Do‘kon Rasmiy Tanlovi',
          description: item.description,
          costPoints: item.costPoints,
          imageUrl: item.imageUrl || '/src/assets/images/kitest_feature_certificate_1791123766331.jpg',
          serialNumber: `KT-SHOP-${Math.floor(100000 + Math.random() * 900000)}`,
          purchasedAt: new Date().toISOString(),
          acquiredVia: 'points_store',
        };
        updatedUser.purchasedCertificates = [
          newCert,
          ...(currentUser.purchasedCertificates || []),
        ];
      }

      // Sync with server
      try {
        await fetch('/api/shop/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            itemId: item.id,
            costPoints: item.costPoints,
            itemTitle: item.title,
            category: item.category,
          }),
        });
      } catch {}

      // Update local storage and app state
      localStorage.setItem('kitest_auth_user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);

      // Play fanfare and show confetti
      playKitestSound('fanfare', soundEnabled);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}

      setSuccessToast(`Tabriklaymiz! "${item.title}" muvaffaqiyatli xarid qilindi! -${item.costPoints} ball ayirildi.`);
      setTimeout(() => setSuccessToast(null), 4500);
    } finally {
      setPurchasingItemId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-slate-800">
      {/* ========================================================================= */}
      {/* 1. SHOP HERO BANNER                                                       */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 border border-emerald-800/80 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 pointer-events-none opacity-20">
          <ShoppingBag className="w-96 h-96 -mb-20 -mr-20 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>RASMIY DO‘KON & BOZOR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ballaringizni Sovg‘a va Unvonlarga Almashtiring!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
              Testlar, olimpiada masalalari va Kiteshot 3D janglarida yig‘ilgan ballaringiz evaziga rasmiy sertifikatlar, 5 yulduzli unvonlar, kiber qurollar va omad barabani biletlarini xarid qiling.
            </p>
          </div>

          {/* User Live Balance Card */}
          {currentUser && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-4 sm:p-5 shrink-0 w-full md:w-auto space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                Sizning Hisobingiz
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400 fill-sky-400 shrink-0" />
                  <div>
                    <div className="font-mono text-sm font-black text-sky-200">
                      {currentUser.totalScore ?? 0}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Mavjud Ball</div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <div>
                    <div className="font-mono text-sm font-black text-amber-200">
                      {currentUser.coins ?? 250}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Oltin Tanga</div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                  <Star className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0" />
                  <div>
                    <div className="font-mono text-sm font-black text-purple-200">
                      {currentUser.stars ?? 5}★
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">
                      {currentUser.scoreMultiplier || 1}x Ko‘paytirgich
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 rounded-xl p-2.5 border border-white/10 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="font-mono text-sm font-black text-rose-200">
                      {currentUser.wheelSpinsLeft ?? 0} ta
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">Baraban Bileti</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenLuckyWheel}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Omad Barabanini Aylantirish</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-3 shadow-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">{successToast}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. CATEGORY TABS & SEARCH BAR                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'certificate', label: '🎓 Sertifikatlar' },
            { id: 'star_rank', label: '⭐ Yulduz Unvonlari' },
            { id: 'avatar_frame', label: '🎨 Profil Ramkalari' },
            { id: 'weapon', label: '🔫 Kiteshot Qurollari' },
            { id: 'wheel_ticket', label: '🎰 Baraban Biletlari' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Do‘kondan qidirish..."
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PRODUCT CARDS GRID                                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isPurchased = ownedItemIds.has(item.id);
          const canAfford = Boolean(currentUser && (currentUser.totalScore || 0) >= item.costPoints);

          return (
            <div
              key={item.id}
              className={`rounded-3xl border transition-all p-5 flex flex-col justify-between space-y-4 bg-white relative overflow-hidden ${
                item.isPopular
                  ? 'border-emerald-300 ring-2 ring-emerald-400/20 shadow-md'
                  : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'
              }`}
            >
              {/* Optional Popular Ribbon */}
              {item.badge && (
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                  {item.badge}
                </div>
              )}

              <div className="space-y-3">
                {/* Category + Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-2xl flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-xs">
                    {item.icon}
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] border ${item.categoryColor}`}>
                      {item.categoryLabel}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                  {item.description}
                </p>

                {/* Perks Checklist */}
                <div className="space-y-1.5 pt-1">
                  {item.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {/* Price Display */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Narxi:</div>
                  <div className="flex items-center gap-1.5 font-black text-sm sm:text-base text-slate-900">
                    <Zap className="w-4 h-4 text-sky-500 fill-sky-500" />
                    <span>{item.costPoints}</span>
                    <span className="text-xs font-bold text-slate-500">Ball</span>
                  </div>
                </div>

                {/* Buy Button */}
                {isPurchased ? (
                  <div className="py-2 px-3.5 rounded-xl bg-slate-100 text-emerald-700 font-black text-xs flex items-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Xarid qilingan</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={purchasingItemId === item.id}
                    onClick={() => handlePurchase(item)}
                    className={`py-2 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                      canAfford
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {purchasingItemId === item.id ? "Xarid qilinmoqda..." : canAfford ? "Sotib olish" : "Ball yetarli emas"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. FOOTER INFO CARD: QANDAY BALL TO'PLASH MUMKIN?                         */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Do‘konda xarid qilish uchun ballaringiz kammi?</h4>
            <p className="text-xs text-slate-500">
              CHSB testlarini yeching, Fan Olimpiadalarida qatnashing yoki Kiteshot 3D da g‘olib bo‘lib har bir o‘yindan 3 ta ball to‘plang!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('problems')}
          className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow"
        >
          <span>Testlar Ishlashga O‘tish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
