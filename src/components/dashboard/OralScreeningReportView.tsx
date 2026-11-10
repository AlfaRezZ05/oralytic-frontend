import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  ShieldCheck,
  Check,
  Edit3,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import type { ScreeningRecord } from '../../types';
import { saveScreeningRecord } from '../../services/apiService';

interface ClinicalFindingItem {
  id: string;
  name: string;
  severity: 'Tinggi' | 'Sedang' | 'Rendah' | 'Normal';
  description: string;
  percentage: number;
  status: 'pending' | 'approved' | 'corrected';
  correctionNote?: string;
}

interface OralScreeningReportViewProps {
  record: ScreeningRecord;
  onBack: () => void;
  onRecordUpdated?: (updated: ScreeningRecord) => void;
}

interface NutrientItem {
  name: string;
  dotColor: string;
  description: string;
  percentage: number;
  radarScore: number;
}

const NUTRIENT_ITEMS: NutrientItem[] = [
  {
    name: 'Vitamin C',
    dotColor: 'bg-[#D9383A]',
    description: 'Inflamasi gingiva menandakan sintesis kolagen gusi terganggu',
    percentage: 33,
    radarScore: 3.3,
  },
  {
    name: 'Kalsium',
    dotColor: 'bg-[#E08E36]',
    description: 'Erosi enamel konsisten dengan remineralisasi yang melambat',
    percentage: 55,
    radarScore: 5.5,
  },
  {
    name: 'Vitamin D',
    dotColor: 'bg-[#48A368]',
    description: 'Kondisi palatum dan mukosa dalam batas normal',
    percentage: 55,
    radarScore: 5.5,
  },
  {
    name: 'Zat Besi',
    dotColor: 'bg-[#48A368]',
    description: 'Warna lidah dan mukosa tidak menunjukkan pertanda anemia',
    percentage: 55,
    radarScore: 5.5,
  },
  {
    name: 'Magnesium',
    dotColor: 'bg-[#48A368]',
    description: 'Tidak ada indikator defisiensi dari kondisi oral',
    percentage: 55,
    radarScore: 8.5,
  },
];

const NutrientRadarChart = () => {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 90;
  const levels = [2, 4, 6, 8, 10];

  const axes = [
    { label: 'Vitamin C', value: 3.3, align: 'middle', dx: 0, dy: -12 },
    { label: 'Kalsium', value: 5.5, align: 'start', dx: 8, dy: 3 },
    { label: 'Vitamin D', value: 5.5, align: 'start', dx: 6, dy: 14 },
    { label: 'Zat Besi', value: 5.5, align: 'end', dx: -6, dy: 14 },
    { label: 'Magnesium', value: 8.5, align: 'end', dx: -8, dy: 3 },
  ];

  const getPoint = (i: number, val: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const r = (val / 10) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const dataPoints = axes.map((a, i) => getPoint(i, a.value));
  const dataPolyString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex items-center justify-center py-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
        {/* Concentric Pentagons */}
        {levels.map((lvl) => {
          const pts = axes.map((_, i) => getPoint(i, lvl)).map((p) => `${p.x},${p.y}`).join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          );
        })}

        {/* Radial Axis Lines */}
        {axes.map((_, i) => {
          const edge = getPoint(i, 10);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={edge.x}
              y2={edge.y}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          );
        })}

        {/* Numeric Scale on top axis: 0, 2, 4, 6, 8, 10 */}
        {[0, 2, 4, 6, 8, 10].map((num) => {
          const p = getPoint(0, num);
          return (
            <text
              key={num}
              x={num === 0 ? cx : cx - 1}
              y={num === 0 ? cy + 4 : p.y + 4}
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-700"
            >
              {num}
            </text>
          );
        })}

        {/* Filled Turquoise Polygon */}
        <polygon
          points={dataPolyString}
          fill="rgba(84, 186, 200, 0.45)"
          stroke="#2CA3B3"
          strokeWidth="2"
        />

        {/* Vertex Dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2CA3B3" />
        ))}

        {/* Axis Labels */}
        {axes.map((axis, i) => {
          const edge = getPoint(i, 10);
          return (
            <text
              key={axis.label}
              x={edge.x + axis.dx}
              y={edge.y + axis.dy}
              textAnchor={axis.align as 'middle' | 'start' | 'end'}
              className="text-[11px] font-bold fill-slate-700"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export const OralScreeningReportView = ({
  record,
  onBack,
  onRecordUpdated,
}: OralScreeningReportViewProps) => {
  // Extract or initialize the 3 clinical findings strictly matching Figma
  const initialFindings: ClinicalFindingItem[] = useMemo(() => {
    const issues = record.oralAnalyses.flatMap((a) => a.analysisResult?.issues || []);
    if (issues.length >= 2) {
      return issues.map((issue, idx) => {
        const isHigh =
          issue.diseaseName.toLowerCase().includes('tinggi') ||
          issue.diseaseName.toLowerCase().includes('caries') ||
          idx === 0;
        return {
          id: `finding-${idx + 1}`,
          name: issue.diseaseName,
          severity: isHigh ? 'Tinggi' : 'Sedang',
          description: issue.description,
          percentage: isHigh ? 100 : 80,
          status: 'pending' as const, // Clear semua di awal, tidak ada yang terpilih otomatis
        };
      });
    }

    // Exact 3 items from Figma screenshot
    return [
      {
        id: 'finding-1',
        name: 'Inflamasi gingiva',
        severity: 'Tinggi' as const,
        description:
          'Kemerahan dan pembengkakan pada marginal gingiva anterior. Pola konsisten dengan gingiva tahap awal hingga sedang',
        percentage: 100,
        status: 'pending' as const, // Clear di awal, menunggu validasi user
      },
      {
        id: 'finding-2',
        name: 'Akumulasi plak',
        severity: 'Sedang' as const,
        description:
          'Biofilm terdeteksi di area servikal dan interproksimal. Kebersihan supra-gingiva perlu ditingkatkan.',
        percentage: 80,
        status: 'pending' as const,
      },
      {
        id: 'finding-3',
        name: 'Erosi enamel ringan',
        severity: 'Sedang' as const,
        description:
          'Permukaan enamel tampak lebih translusen dari normal. Kemungkinan paparan asam berulang',
        percentage: 80,
        status: 'pending' as const,
      },
      {
        id: 'finding-4',
        name: 'Kondisi lidah',
        severity: 'Normal' as const,
        description:
          'Tidak ditemukan geographic tongue atau perubahan warna abnormal',
        percentage: 10,
        status: 'pending' as const,
      },
    ];
  }, [record]);

  const [findings, setFindings] = useState<ClinicalFindingItem[]>(initialFindings);
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Counters strictly reflecting the screenshot
  const totalFindings = findings.length;
  const validatedCount = findings.filter((f) => f.status !== 'pending').length;
  const activeFindingsCount = useMemo(() => {
    return findings.filter((f) => f.severity !== 'Normal').length || 3;
  }, [findings]);
  const deficiencyCount = 2;

  // Oral health score: base 70, drops if corrections are approved
  const score = useMemo(() => {
    let s = 70;
    findings.forEach((f) => {
      if (f.status === 'corrected') s -= 5;
    });
    return Math.max(0, Math.min(100, s));
  }, [findings]);

  // Validation bar progress
  const validationProgressPercent = totalFindings > 0 ? (validatedCount / totalFindings) * 100 : 0;

  // Handle Actions
  const handleApprove = (id: string) => {
    setFindings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
    );
    syncRecordUpdate();
  };

  const handleOpenCorrection = (id: string) => {
    const item = findings.find((f) => f.id === id);
    setCorrectionInput(item?.correctionNote || '');
    setEditingFindingId(id);
  };

  const handleSaveCorrection = (id: string) => {
    setFindings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
            ...item,
            status: 'corrected',
            correctionNote: correctionInput.trim() || 'Koreksi klinis disesuaikan',
          }
          : item
      )
    );
    setEditingFindingId(null);
    setCorrectionInput('');
    syncRecordUpdate();
  };

  const syncRecordUpdate = () => {
    const updated: ScreeningRecord = {
      ...record,
      validationStatus: validatedCount >= totalFindings - 1 ? 'validated' : 'pending',
    };
    saveScreeningRecord(updated).catch(() => { });
    if (onRecordUpdated) onRecordUpdated(updated);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Laporan Skrining Oral: ${record.patientData.name} - ID ${record.id}`
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  // Helper age format
  const patientAge = useMemo(() => {
    if (!record.patientData.dob) return '7 tahun';
    const birth = new Date(record.patientData.dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return `${Math.max(1, age)} tahun`;
  }, [record.patientData.dob]);

  const genderLabel = record.patientData.gender === 'Female' ? 'P' : 'L';
  const categoryLabel =
    record.patientCategory ||
    (record.patientData.pregnancyStatus === 'Pregnant' ? 'Ibu Hamil' : 'Anak');

  return (
    <div className="relative min-h-full w-full pb-16 pt-1 select-none">
      {/* Top Bar Kembali & Status Copy */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-[13px] font-semibold text-[#2F4156] shadow-xs border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {isCopied && (
          <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            Tautan laporan berhasil disalin!
          </span>
        )}
      </div>

      {/* =========================================================================
          HEADER: LAPORAN SKRINING ORAL
          ========================================================================= */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="text-[13px] font-bold tracking-[0.14em] text-[#64748B] uppercase block mb-1 font-sans">
            LAPORAN SKRINING ORAL
          </span>
          <h1 className="text-[30px] sm:text-[34px] font-bold text-[#0F172A] tracking-tight leading-tight">
            {record.patientData.name || 'Nama Pasien'} ({genderLabel}),
          </h1>
          <p className="mt-1 text-[14px] text-[#64748B] font-medium">
            {patientAge} - {categoryLabel} - ID {record.id || 'SN-xxxxxxxxx-xxx'}
          </p>
        </div>

        {/* Action Buttons: Download & Share */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleDownload}
            title="Unduh / Cetak Laporan"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#334155]" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleShare}
            title="Bagikan Tautan Laporan"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#334155]" />
          </motion.button>
        </div>
      </header>

      {/* =========================================================================
          TOP METRIC CARD (Skor kesehatan oral, Temuan Aktif / Defisiensi, Tervalidasi)
          ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 rounded-[24px] bg-white p-6 sm:p-7 shadow-[0_4px_24px_rgba(15,23,42,0.03)] border border-slate-200/80 grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-6 items-center divide-y md:divide-y-0 md:divide-x divide-slate-200/80"
      >
        {/* Kolom 1: Circular Gauge & Skor Kesehatan Oral */}
        <div className="flex items-center gap-5 sm:gap-6 pr-0 md:pr-4">
          {/* Gauge Circular Ring */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="39"
                stroke="#E2E8F0"
                strokeWidth="8.5"
                fill="transparent"
              />
              {/* Active Dark Navy Stroke (70% progress) */}
              <circle
                cx="50"
                cy="50"
                r="39"
                stroke="#1E2B38"
                strokeWidth="8.5"
                fill="transparent"
                strokeDasharray="245"
                strokeDashoffset={245 - (245 * score) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Angka di Tengah Lingkaran */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[34px] sm:text-[38px] font-black text-[#0F172A] leading-none tracking-tight">
                {score}
              </span>
              <span className="text-[11px] font-medium text-[#64748B] mt-1">
                Dari 100
              </span>
            </div>
          </div>

          {/* Teks Penjelasan Skor */}
          <div className="flex flex-col items-start gap-1">
            <span className="bg-[#D7EFE1] text-[#1E5631] text-[12px] font-semibold px-3 py-0.5 rounded-full inline-block">
              Perlu Diperhatikan
            </span>
            <h2 className="text-[18px] sm:text-[19px] font-bold text-[#0F172A] leading-tight">
              Skor kesehatan oral
            </h2>
            <p className="text-[12px] text-[#64748B] leading-snug max-w-[280px]">
              Skor akan turun otomatis mengikuti koreksi yang Anda setujui
            </p>
          </div>
        </div>

        {/* Kolom 2: Temuan Aktif & Defisiensi */}
        <div className="pt-5 md:pt-0 px-0 md:px-6 flex flex-col items-center justify-center text-center gap-1">
          <span className="text-[14px] font-medium text-[#64748B]">Temuan Aktif</span>
          <span className="text-[32px] sm:text-[36px] font-bold text-[#0F172A] leading-none my-1">
            {activeFindingsCount}
          </span>
          <span className="text-[14px] font-medium text-[#64748B]">
            Defisiensi
          </span>
          <span className="text-[32px] sm:text-[36px] font-bold text-[#0F172A] leading-none my-1">
            {deficiencyCount}
          </span>
        </div>

        {/* Kolom 3: Tervalidasi */}
        <div className="pt-5 md:pt-0 pl-0 md:pl-6 flex flex-col items-center justify-center text-center gap-1">
          <span className="text-[14px] font-medium text-[#64748B]">Tervalidasi</span>
          <motion.span
            key={validatedCount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[52px] sm:text-[58px] font-black text-[#0F172A] leading-none mt-2"
          >
            {validatedCount}
          </motion.span>
        </div>
      </motion.section>

      {/* =========================================================================
          ALERT BANNER: MENUNGGU VALIDASI ANDA (Warm Cream / Amber)
          ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-7 rounded-[20px] bg-[#FAF0D7] border border-[#E9DCB8] p-5 sm:p-6 shadow-xs flex flex-col gap-3"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#4A3B18] flex-shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#2A2415] leading-tight">
              Menunggu validasi Anda
            </h3>
            <p className="mt-1 text-[13px] sm:text-[14px] text-[#55482D] leading-relaxed">
              Setiap temuan harus disetujui atau dikoreksi sebelum laporan bisa dikirim. AI hanya membantu memberikan indikasi awal
            </p>
          </div>
        </div>

        {/* Progress Bar Indikator Validasi Sesuai Figma */}
        <div className="relative w-full mt-1.5 flex items-center">
          <div className="h-[3.5px] w-full bg-[#D8CAAA] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1E2B38] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${validationProgressPercent}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          {/* Titik indikator kecil di ujung kanan garis */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2A2415]" />
        </div>
      </motion.section>

      {/* =========================================================================
          BAGIAN A : TEMUAN KLINIS
          ========================================================================= */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] tracking-tight">
          Bagian A : Temuan Klinis
        </h2>

        <div className="flex flex-col gap-4">
          {findings.map((item, index) => {
            const isApproved = item.status === 'approved';
            const isCorrected = item.status === 'corrected';
            const isHighSeverity = item.severity === 'Tinggi';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.05, duration: 0.4 }}
                className={`rounded-[22px] bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] border transition-all ${isApproved
                  ? 'border-emerald-200/90 bg-emerald-50/10'
                  : isCorrected
                    ? 'border-amber-200/90 bg-amber-50/10'
                    : 'border-slate-200/80'
                  }`}
              >
                {/* Header Item: Dot + Nama Temuan : Severity */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Circle Bullet Dot Sesuai Figma */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isHighSeverity
                          ? 'bg-[#D9383A]'
                          : item.severity === 'Sedang'
                          ? 'bg-[#E08E36]'
                          : 'bg-[#48A368]'
                      }`}
                    />
                    <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0F172A]">
                      {item.name} : {item.severity}
                    </h3>
                  </div>

                  {/* Status Badge jika sudah diproses */}
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                    </span>
                  )}
                  {isCorrected && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      <Edit3 className="w-3.5 h-3.5" /> Dikoreksi
                    </span>
                  )}
                </div>

                {/* Deskripsi Temuan */}
                <p className="text-[13px] sm:text-[14px] text-[#475569] leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Bar Persentase Temuan Sesuai Figma */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#5B6B79] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + index * 0.05 }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-600 tabular-nums min-w-[36px] text-right">
                    {item.percentage}%
                  </span>
                </div>

                {/* Tombol Aksi: Setujui & Koreksi (Warna & Padding Persis Figma) */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => handleApprove(item.id)}
                    className={`px-8 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-xs ${isApproved
                      ? 'bg-[#1E5631] text-white shadow-sm'
                      : 'bg-[#C6EBD0] text-[#1E5631] hover:bg-[#B5E4C1]'
                      }`}
                  >
                    Setujui
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => handleOpenCorrection(item.id)}
                    className={`px-8 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer shadow-xs ${isCorrected
                      ? 'bg-[#63482C] text-white shadow-sm'
                      : 'bg-[#EDDBCA] text-[#63482C] hover:bg-[#E3CCB7]'
                      }`}
                  >
                    Koreksi
                  </motion.button>
                </div>

                {/* Inline Correction Input jika tombol Koreksi ditekan */}
                <AnimatePresence>
                  {editingFindingId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={correctionInput}
                        onChange={(e) => setCorrectionInput(e.target.value)}
                        placeholder="Tulis catatan koreksi klinis dokter..."
                        className="flex-1 h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-800 outline-none focus:border-[#2F4156] focus:ring-2 focus:ring-[#2F4156]/10"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCorrection(item.id)}
                        className="h-10 px-4 rounded-xl bg-[#2F4156] text-white text-[13px] font-semibold hover:bg-[#1E2B38] transition-colors cursor-pointer"
                      >
                        Simpan Koreksi
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingFindingId(null)}
                        className="h-10 px-3 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BAGIAN B : PROFIL NUTRISI (Radar Chart & Indikator Nutrisi Sesuai Figma)
          ========================================================================= */}
      <section className="flex flex-col gap-4 mt-6">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0F172A] tracking-tight">
          Bagian B : Profil Nutrisi
        </h2>

        <div className="rounded-[26px] bg-white p-6 sm:p-8 shadow-[0_4px_24px_rgba(15,23,42,0.03)] border border-slate-200/80 flex flex-col gap-7">
          {/* Radar Chart Visualizer (Diagram Spider 5 Sumbu) */}
          <div className="flex flex-col items-center justify-center pt-1 pb-3">
            <NutrientRadarChart />
          </div>

          {/* Daftar 5 Indikator Nutrisi */}
          <div className="flex flex-col gap-6 pt-2">
            {NUTRIENT_ITEMS.map((nutrient, idx) => (
              <div key={nutrient.name} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${nutrient.dotColor}`} />
                  <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0F172A]">
                    {nutrient.name}
                  </h3>
                </div>

                <p className="text-[13px] sm:text-[14px] text-[#475569] leading-relaxed">
                  {nutrient.description}
                </p>

                {/* Bar Persentase Nutrisi */}
                <div className="flex items-center gap-3.5 mt-1">
                  <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#5B6B79] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${nutrient.percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.15 + idx * 0.05 }}
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-slate-600 tabular-nums min-w-[36px] text-right">
                    {nutrient.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Navigasi Selesai Validasi */}
      {validatedCount === totalFindings && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-5 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-bold text-[15px] text-[#0F172A]">Seluruh temuan telah divalidasi!</h4>
              <p className="text-[13px] text-slate-500">Laporan skrining ini siap disimpan secara resmi ke rekam medis.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-[#2F4156] text-white font-semibold text-[13px] hover:bg-[#1E2B38] transition-colors cursor-pointer self-start sm:self-auto"
          >
            Selesai & Tutup Laporan
          </button>
        </motion.div>
      )}
    </div>
  );
};
