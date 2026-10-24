import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Share2,
  Layers,
  Sparkles,
  Award,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export interface ShowcaseImageItem {
  id: string;
  url: string;
  title: string;
  category: 'certificate' | 'course' | 'contest' | 'avatar' | 'event' | 'platform';
  author?: string;
  description?: string;
  badge?: string;
  resolution?: string;
}

export const PLATFORM_SHOWCASE_IMAGES: ShowcaseImageItem[] = [
  {
    id: 'img_cert_gold',
    url: '/src/assets/images/kitest_feature_certificate_1791123766331.jpg',
    title: 'KITEST Oltin Rasmiy Sertifikati (100% Natija)',
    category: 'certificate',
    author: 'O‘zbekiston Ta‘lim Markazi',
    description: 'Respublika bo‘yicha tan olingan, maxsus QR-kod va seriya raqamiga ega rasmiy sertifikat.',
    badge: 'Oltin Sertifikat',
    resolution: '4K Ultra HD • 3840x2160',
  },
  {
    id: 'img_course_full',
    url: '/src/assets/images/kitest_feature_course_1791123745671.jpg',
    title: 'Full-Stack Web Dasturlash va Sun‘iy Intellekt Kursi',
    category: 'course',
    author: 'Sardor Abduqodirov (Senior Engineer)',
    description: 'Zamonaviy React, Node.js, Python va AI algoritmlari bo‘yicha to‘liq amaliy kurs banneri.',
    badge: 'Premium Kurs',
    resolution: 'QHD • 2560x1440',
  },
  {
    id: 'img_mentor_expert',
    url: '/src/assets/images/kitest_feature_teacher_1791123783954.jpg',
    title: 'Xalqaro Olimpiada G‘olibi va Bosh Murabbiy',
    category: 'contest',
    author: 'Nigora Karimova (Xalqaro Hakam)',
    description: 'CHSB, BSB va matematika fan olimpiadalari bo‘yicha professional mentorlik tahlili.',
    badge: 'Bosh Murabbiy',
    resolution: 'Full HD • 1920x1080',
  },
  {
    id: 'img_kiteshot_arena',
    url: '/src/assets/images/studio_showcase_arena_1790855511159.jpg',
    title: 'Kiteshot 3D Cyber Duel Arena',
    category: 'platform',
    author: 'KITEST Gaming Studio',
    description: 'Roblox Hypershot uslubidagi neon arena, jump padlar, railgun va plazma snaryadlari.',
    badge: 'Kiteshot 3D',
    resolution: '4K Cinema • 3840x2160',
  },
  {
    id: 'img_majlis_room',
    url: '/src/assets/images/studio_showcase_science_1790855524330.jpg',
    title: 'Jonli Video Majlis & Interaktiv Konferentsiya',
    category: 'event',
    author: 'Bosh Admin va Ustozlar Kengashi',
    description: 'Zoom va Google Meet uslubidagi ultra-zamonaviy interfeys, kamera va audio muloqot.',
    badge: 'Video Majlis',
    resolution: 'Full HD • 1920x1080',
  },
  {
    id: 'img_contest_trophy',
    url: '/src/assets/images/studio_showcase_champions_1790855536619.jpg',
    title: 'Respublika Dasturlash va Matematika Kubogi',
    category: 'contest',
    author: 'KITEST Olimpiada Qo‘mitasi',
    description: 'O‘zbekiston yoshlari o‘rtasidagi yirik chempionat kubogi va pul mukofotlari.',
    badge: 'Kubok Bosh Sovrini',
    resolution: 'Ultra HD • 2800x1800',
  },
  {
    id: 'img_student_success',
    url: '/src/assets/images/kitest_hero_students_1791123717659.jpg',
    title: 'Olimpiada va Grant Sohibi Bo‘lgan Yoshlar',
    category: 'event',
    author: 'KITEST Bitiruvchilari',
    description: '100% natija ko‘rsatib, universitetlarga muddatidan oldin grant yutib olgan talabalar.',
    badge: 'G‘oliblar Jamiyati',
    resolution: 'Full HD • 1920x1080',
  },
  {
    id: 'img_security_faceid',
    url: '/src/assets/images/kitest_cta_students_1791123732576.jpg',
    title: 'Apple Face ID Biometrik Xavfsizlik Arxitekturasi',
    category: 'platform',
    author: 'KITEST Security Team',
    description: '128 o‘lchamli neyron vektorlar va 3D skanerlash orqali yuqori darajadagi xavfsizlik.',
    badge: 'Apple Face ID',
    resolution: 'Ultra HD • 2560x1440',
  },
];

interface GiantImageShowcaseModalProps {
  isOpen: boolean;
  initialImage?: ShowcaseImageItem | null;
  initialImageUrl?: string;
  allImages?: ShowcaseImageItem[];
  onClose: () => void;
}

export const GiantImageShowcaseModal: React.FC<GiantImageShowcaseModalProps> = ({
  isOpen,
  initialImage,
  initialImageUrl,
  allImages = PLATFORM_SHOWCASE_IMAGES,
  onClose,
}) => {
  const [imagesList] = useState<ShowcaseImageItem[]>(allImages);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialImage) {
      const idx = allImages.findIndex((img) => img.id === initialImage.id);
      return idx >= 0 ? idx : 0;
    }
    if (initialImageUrl) {
      const idx = allImages.findIndex((img) => img.url === initialImageUrl);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'lightbox' | 'grid'>('lightbox');

  const filteredImages = imagesList.filter((img) =>
    selectedCategory === 'all' ? true : img.category === selectedCategory
  );

  const activeImage: ShowcaseImageItem =
    filteredImages[currentIndex] ||
    (initialImageUrl
      ? {
          id: 'custom_img',
          url: initialImageUrl,
          title: 'Katta Rasm (To‘liq Ko‘rinish)',
          category: 'platform',
          resolution: 'Ultra HD Katta Format',
        }
      : imagesList[0]);

  const handleNext = () => {
    setZoomLevel(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const handlePrev = () => {
    setZoomLevel(1);
    setRotation(0);
    setCurrentIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3.5, Number((z + 0.35).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, Number((z - 0.35).toFixed(2))));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleCopyLink = () => {
    if (activeImage?.url) {
      navigator.clipboard?.writeText(activeImage.url).catch(() => {});
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between text-white select-none">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-black/40 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                  {activeImage.title}
                </h2>
                {activeImage.badge && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-black text-sky-300">
                    {activeImage.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>{activeImage.resolution || 'Ultra HD Katta Rasm'}</span>
                {activeImage.author && (
                  <>
                    <span>•</span>
                    <span className="text-slate-300">{activeImage.author}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden md:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('lightbox')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'lightbox' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Katta Rasm (100%)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Barcha Rasmlar ({filteredImages.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              title="Kattalashtirish (+)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              title="Kichiklashtirish (-)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRotate}
              title="Burish (90°)"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Havoladan nusxa olish"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <a
              href={activeImage.url}
              download={activeImage.title || 'kitest-photo.jpg'}
              target="_blank"
              rel="noreferrer"
              title="Yuklab olish (To‘liq o‘lcham)"
              className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={onClose}
              title="Yopish (Esc)"
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-white/5 bg-slate-950/70 overflow-x-auto text-xs z-10">
          <span className="text-slate-400 font-bold shrink-0">Toifalar:</span>
          {[
            { id: 'all', label: 'Barchasi (Ultra HD)' },
            { id: 'certificate', label: '🎓 Rasmiy Sertifikatlar' },
            { id: 'course', label: '💻 Kurslar & Dasturlash' },
            { id: 'contest', label: '🏆 Olimpiadalar & Hakamlar' },
            { id: 'platform', label: '🚀 Platforma & 3D Kiteshot' },
            { id: 'event', label: '📸 Talabalar & Yutuqlar' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
                setZoomLevel(1);
                setRotation(0);
              }}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Display Stage */}
        {viewMode === 'lightbox' ? (
          <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
            {/* Nav Arrows */}
            {filteredImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 sm:left-6 z-30 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 sm:right-6 z-30 p-3 sm:p-4 rounded-2xl bg-black/60 hover:bg-black/80 border border-white/15 text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </>
            )}

            {/* Giant Image Container with Zoom & Rotation */}
            <div className="relative max-w-full max-h-full flex items-center justify-center overflow-auto p-2">
              <motion.img
                key={`${activeImage.id}_${currentIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: zoomLevel,
                  rotate: rotation,
                }}
                transition={{ duration: 0.25 }}
                src={activeImage.url}
                alt={activeImage.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kitest_feature_certificate_1791123766331.jpg';
                }}
                className="max-w-[92vw] max-h-[74vh] object-contain rounded-2xl shadow-2xl border border-white/15 bg-slate-950/80 transition-transform"
                style={{
                  transformOrigin: 'center center',
                }}
              />
            </div>

            {/* Zoom Indicator Badge */}
            {zoomLevel !== 1 && (
              <div className="absolute bottom-6 right-6 z-30 px-3 py-1 rounded-full bg-sky-500/80 backdrop-blur-md text-xs font-black text-white shadow-lg">
                Masshtab: {Math.round(zoomLevel * 100)}%
              </div>
            )}
          </div>
        ) : (
          /* Mega Grid View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredImages.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setViewMode('lightbox');
                    setZoomLevel(1);
                  }}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-sky-400/80 transition-all cursor-pointer shadow-lg hover:shadow-sky-500/20 flex flex-col"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-950 relative">
                    <img
                      src={img.url}
                      alt={img.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/src/assets/images/kitest_feature_course_1791123745671.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    {img.badge && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-sky-500/90 text-[10px] font-black text-white shadow">
                        {img.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors">
                      {img.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {img.description || img.author}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-white/5">
                      <span>{img.resolution || 'HD Rasm'}</span>
                      <span className="text-sky-400 font-bold group-hover:underline">
                        Katta ko‘rish ↗
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Description & Thumbnail Strip */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/10 bg-slate-950/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-20">
          <div className="max-w-xl">
            <p className="text-xs text-slate-300 line-clamp-2">
              {activeImage.description ||
                'KITEST ta‘lim va bellashuv platformasidagi eng sifatli, yuqori aniqlikdagi rasmiy fotosuratlar va sertifikatlar.'}
            </p>
          </div>

          {/* Quick thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredImages.slice(0, 8).map((img, idx) => (
              <button
                key={`thumb_${img.id}`}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setViewMode('lightbox');
                  setZoomLevel(1);
                  setRotation(0);
                }}
                className={`relative w-12 h-8 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                  currentIndex === idx ? 'border-sky-400 ring-2 ring-sky-400/50 scale-105' : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
