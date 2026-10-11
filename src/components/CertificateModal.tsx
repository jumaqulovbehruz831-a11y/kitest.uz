import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CertificateData, ADMIN_EMAIL } from '../types';
import {
  KitestEmblem,
  KIDTEST_LOGO_DATA_URL,
  playKitestSound,
} from './KitestEmblem';
import {
  X,
  Award,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  MapPin,
  Calendar,
  Trophy,
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  certificate: CertificateData | null;
  soundEnabled?: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  certificate,
  soundEnabled = true,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !certificate) return null;

  const recipientName =
    certificate.recipientName ||
    (certificate as any).userName ||
    'Ishtirokchi';
  const recipientUsername =
    certificate.recipientUsername ||
    (certificate as any).username ||
    'user';
  const serialNumber =
    certificate.serialNumber ||
    (certificate as any).certificateId ||
    `KT-${Date.now().toString(36).toUpperCase()}`;
  const gradeText = certificate.grade || "5 (A'lo)";

  const formattedDate = new Date(
    certificate.issuedAt || new Date().toISOString()
  ).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const loadImageElement = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  // High-DPI HTML5 Canvas PNG Certificate Generator (Supports both standard & Admin-uploaded Certificate images)
  const handleDownloadPng = async () => {
    setDownloading(true);
    playKitestSound('victory', soundEnabled);

    try {
      const canvas = document.createElement('canvas');
      const W = 1600;
      const H = 1120;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDownloading(false);
        return;
      }

      // 1. Deep Royal Navy Background
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#040917');
      bgGrad.addColorStop(0.5, '#0b1536');
      bgGrad.addColorStop(1, '#061024');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle decorative corner glow
      const radialGlow = ctx.createRadialGradient(
        W / 2,
        260,
        40,
        W / 2,
        260,
        680
      );
      radialGlow.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
      radialGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, W, H);

      // If Admin uploaded a custom certificate template/image, draw it either as a central art panel or background
      if (certificate.customImageUrl) {
        const customImg = await loadImageElement(certificate.customImageUrl);
        if (customImg) {
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.drawImage(customImg, 60, 60, W - 120, H - 120);
          ctx.restore();

          // Also draw a crisp framed preview of the uploaded certificate on the right side
          ctx.save();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.strokeRect(W - 420, 110, 300, 210);
          ctx.drawImage(customImg, W - 416, 114, 292, 202);
          ctx.restore();
        }
      }

      // Draw Official KidTest Emblem on Top Left
      const logoImg = await loadImageElement(KIDTEST_LOGO_DATA_URL);
      if (logoImg) {
        ctx.drawImage(logoImg, 110, 95, 130, 130);
      }

      // 2. Ornate Double Gold & Sky Borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(56, 56, W - 112, H - 112);

      // Corner ornaments
      const corners = [
        [40, 40],
        [W - 40, 40],
        [40, H - 40],
        [W - 40, H - 40],
      ];
      ctx.fillStyle = '#f59e0b';
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Top Header Brand
      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px Outfit, Inter, sans-serif';
      ctx.fillText(
        'Kitest education',
        W / 2,
        130
      );

      // 4. Main Title
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 60px Outfit, Inter, sans-serif';
      ctx.fillText('FAXRIY SERTIFIKAT', W / 2, 205);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px JetBrains Mono, monospace';
      ctx.fillText(
        `SERTIFIKAT RAQAMI: ${serialNumber}  |  RASMIY TASDIQLANGAN YUTUQ`,
        W / 2,
        260
      );

      // Divider line
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(320, 290);
      ctx.lineTo(W - 320, 290);
      ctx.stroke();

      // 5. Presented To Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '500 26px Inter, sans-serif';
      ctx.fillText(
        'Ushbu rasmiy sertifikat faxr bilan taqdim etiladi:',
        W / 2,
        355
      );

      // 6. Recipient Full Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px Outfit, Inter, sans-serif';
      ctx.fillText(recipientName.toUpperCase(), W / 2, 435);

      // Recipient Username & Region/District
      const locParts = [
        `@${recipientUsername}`,
        certificate.region,
        certificate.district,
        certificate.institution,
      ].filter(Boolean);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(locParts.join('  ·  '), W / 2, 485);

      // 7. Achievement Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2;
      ctx.fillRect(180, 530, W - 360, 230);
      ctx.strokeRect(180, 530, W - 360, 230);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 26px Inter, sans-serif';
      ctx.fillText(
        `Fan yo'nalishi: ${certificate.subject}`,
        W / 2,
        585
      );

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillText(`«${certificate.testTitle}»`, W / 2, 645);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 30px JetBrains Mono, monospace';
      const pointsDesc = certificate.costPoints
        ? `BALL EVAZIGA SOTIB OLINGAN (${certificate.costPoints} BALL)  ·  100% TASDIQLANGAN`
        : `NATIJA: ${certificate.percentage}% (100% ANIQLIK)  ·  BALL: ${certificate.earnedPoints}/${certificate.maxPoints}  ·  BAHO: ${gradeText}`;
      ctx.fillText(pointsDesc, W / 2, 715);

      // 8. Bottom Signatures & Seal
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText('Berilgan sana:', 180, 900);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Inter, sans-serif';
      ctx.fillText(formattedDate, 180, 940);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 18px JetBrains Mono, monospace';
      ctx.fillText('KITEST · KITEST.UZ TASDIQLANGAN SERTIFIKAT', 180, 975);

      // Center: Golden 100% Seal
      ctx.beginPath();
      ctx.arc(W / 2, 920, 72, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#fde68a';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#040917';
      ctx.font = '900 34px JetBrains Mono, monospace';
      ctx.fillText('100%', W / 2, 918);
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText('KITEST VERIFIED', W / 2, 945);

      // Right: Director Signature
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 22px Inter, sans-serif';
      ctx.fillText('Direktor:', W - 180, 900);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px Outfit, Inter, sans-serif';
      ctx.fillText('Jumaqulov Behruz', W - 180, 940);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px JetBrains Mono, monospace';
      ctx.fillText(ADMIN_EMAIL, W - 180, 975);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = recipientName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_');
      link.download = `KITEST_Sertifikat_${safeName}_${serialNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Certificate download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.28 }}
          className="max-w-4xl w-full rounded-2xl bg-slate-900 border-2 border-amber-500/60 shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Action Bar */}
          <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>KITEST Rasmiy Sertifikati</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300">
                    {serialNumber}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Yuqori aniqlikdagi (Full HD PNG) sertifikatni yuklab olishingiz yoki chop etishingiz mumkin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={handleDownloadPng}
                disabled={downloading}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Tayyorlanmoqda...' : 'PNG Yuklab Olish'}</span>
              </motion.button>

              <button
                type="button"
                onClick={() => window.print()}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Chop etish</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Visual Certificate Frame */}
          <div className="p-4 sm:p-8 bg-slate-950">
            <div className="relative p-6 sm:p-10 rounded-2xl bg-[#060f26] border-4 border-amber-500/80 shadow-inner overflow-hidden">
              <div className="absolute inset-2.5 rounded-xl border border-sky-400/40 pointer-events-none" />

              <Sparkles className="w-5 h-5 text-amber-400 absolute top-5 left-5 opacity-70" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute top-5 right-5 opacity-70" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute bottom-5 left-5 opacity-70" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute bottom-5 right-5 opacity-70" />

              <div className="relative z-10 text-center space-y-5">
                {/* Top Emblem & Header */}
                <div className="flex flex-col items-center gap-2">
                  <KitestEmblem size="lg" showVerifiedSeal={true} />
                  <div className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                    KITEST · RASMIY CHSB, OLIMPIADA VA BILIM SINOVI PLATFORMASI
                  </div>
                </div>

                {/* If Admin uploaded a custom certificate image, show it prominently */}
                {certificate.customImageUrl && (
                  <div className="max-w-lg mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/70 shadow-xl bg-slate-950">
                    <img
                      src={certificate.customImageUrl}
                      alt={certificate.testTitle}
                      className="w-full max-h-64 object-contain mx-auto"
                    />
                  </div>
                )}

                {/* Certificate Main Title */}
                <div className="space-y-1">
                  <motion.h1
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl sm:text-5xl font-black tracking-wider text-amber-400 uppercase"
                  >
                    FAXRIY SERTIFIKAT
                  </motion.h1>
                  <div className="text-xs font-mono text-slate-400">
                    Sertifikat ID:{' '}
                    <strong className="text-amber-300">{serialNumber}</strong> ·{' '}
                    <span className="text-emerald-400 font-bold">
                      {certificate.costPoints
                        ? `⚡ ${certificate.costPoints} Ball Bilan Olingan`
                        : "100% Maksimal Ko'rsatkich"}
                    </span>
                  </div>
                </div>

                {/* Recipient Section */}
                <div className="py-3 space-y-2">
                  <div className="text-xs sm:text-sm text-slate-300">
                    Ushbu rasmiy sertifikat yuqori bilim va faollik ko'rsatgani uchun
                  </div>
                  <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight border-b-2 border-amber-500/40 inline-block px-8 pb-2">
                    {recipientName}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-sky-300 font-medium pt-1">
                    <span className="font-mono">@{recipientUsername}</span>
                    {certificate.region && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {certificate.region}
                        {certificate.district ? `, ${certificate.district}` : ''}
                      </span>
                    )}
                    {certificate.institution && <span>· {certificate.institution}</span>}
                  </div>
                </div>

                {/* Test & Score Highlight Box */}
                <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-slate-900/90 border border-sky-500/40 space-y-2.5">
                  <div className="text-xs text-slate-300">
                    Yo'nalish: <span className="text-sky-400 font-bold">{certificate.subject}</span>
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-white">
                    «{certificate.testTitle}»
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Natija: 100% Tasdiqlangan</span>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>
                        Ball: {certificate.costPoints || certificate.earnedPoints} ball
                      </span>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-500/40 text-xs font-mono font-bold text-sky-300">
                      Daraja: {gradeText}
                    </span>
                  </div>
                </div>

                {/* Footer Signatures & Golden 100% Seal */}
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-xs border-t border-slate-800/80">
                  <div className="text-center sm:text-left space-y-1">
                    <div className="text-slate-400 flex items-center justify-center sm:justify-start gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Berilgan sana:</span>
                    </div>
                    <div className="font-bold text-white text-sm">{formattedDate}</div>
                    <div className="text-[11px] font-mono text-emerald-400">
                      Haqiqiyligi tizim tomonidan tasdiqlangan
                    </div>
                  </div>

                  {/* Center Golden Seal */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-amber-500 border-4 border-amber-200 shadow-xl flex flex-col items-center justify-center text-slate-950">
                      <Award className="w-6 h-6 stroke-[2.5]" />
                      <span className="font-mono font-black text-lg leading-none mt-0.5">
                        100%
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-tighter">
                        KITEST SEAL
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right space-y-1">
                    <div className="text-slate-400 flex items-center justify-center sm:justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>KITEST Bosh Admini:</span>
                    </div>
                    <div className="font-extrabold text-amber-400 text-base">
                      Behruz Jumaqulov
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{ADMIN_EMAIL}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
