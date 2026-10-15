import { useState, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  ScanLine,
  Users,
  Search,
  Plus,
  Upload,
  Download,
  LogOut,
  ChevronRight,
  ArrowUpDown,
  ClipboardList,
  Baby,
  Stethoscope,
  ShieldCheck,
  CircleCheck,
  CircleAlert,
  X,
} from 'lucide-react';
import type { ScreeningRecord } from '../types';
import { getScreeningRecords, saveScreeningRecord } from '../services/apiService';
import { PatientGrowthChart } from './dashboard/PatientGrowthChart';
import { PatientDetailModal } from './dashboard/PatientDetailModal';
import { NewScreeningModal } from './dashboard/NewScreeningModal';
import { CountUp, EASE_OUT, StatusTag, formatDate, initials } from './dashboard/ui';
import logoImage from '../assets/logo.png';

interface ScreeningDashboardProps {
  onLogout: () => void;
}

const NUTRITION_STATUS_ORDER: Record<string, number> = { 'Needs Referral': 3, 'Needs Monitoring': 2, Normal: 1 };
const ORAL_STATUS_ORDER: Record<string, number> = { 'Needs Referral': 3, 'At Risk of Caries': 2, Healthy: 1 };

const SECTIONS = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'growth', label: 'Kurva pertumbuhan', icon: Activity },
  { id: 'findings', label: 'Temuan rongga mulut', icon: ScanLine },
  { id: 'patients', label: 'Data pasien', icon: Users },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Terbaru' },
  { value: 'date-asc', label: 'Terlama' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'name-desc', label: 'Nama Z–A' },
  { value: 'nutrition-status', label: 'Prioritas gizi' },
  { value: 'oral-status', label: 'Prioritas oral' },
];

type Toast = { id: number; text: string; tone: 'ok' | 'warn' };

export const ScreeningDashboard = ({ onLogout }: ScreeningDashboardProps) => {
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [selectedNik, setSelectedNik] = useState<string | null>(null);
  const [nikQuery, setNikQuery] = useState('');
  const [nikNotFound, setNikNotFound] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);
  const [isNewScreeningOpen, setIsNewScreeningOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3800);
  };

  useEffect(() => {
    (async () => {
      try {
        setRecords(await getScreeningRecords());
      } catch (err) {
        console.error('Failed to load screening records:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Track which section is in view for sidebar highlighting
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;

      // Check if scrolled near the bottom of container
      if (root.scrollHeight - root.scrollTop - root.clientHeight < 48) {
        setActiveSection('patients');
        return;
      }

      const sectionEls = SECTIONS.map((s) => ({
        id: s.id,
        el: document.getElementById(s.id),
      })).filter((item): item is { id: SectionId; el: HTMLElement } => item.el !== null);

      const containerRect = root.getBoundingClientRect();
      const triggerY = containerRect.top + 160;

      let current: SectionId = 'overview';
      for (const { id, el } of sectionEls) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    root.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      root.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    };
  }, [isLoading]);

  const scrollTo = (id: SectionId) => {
    setActiveSection(id);
    isProgrammaticScrollRef.current = true;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    const container = scrollRef.current;
    const target = document.getElementById(id);
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetOffset = targetRect.top - containerRect.top + container.scrollTop - 20;

      container.scrollTo({
        top: Math.max(0, targetOffset),
        behavior: 'smooth',
      });
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 850);
  };

  // Unique patients, most visits first — used for the growth-curve picker
  const patients = useMemo(() => {
    const map = new Map<string, { nik: string; name: string; visits: number; last: string }>();
    records.forEach((r) => {
      const cur = map.get(r.patientData.nik);
      if (cur) {
        cur.visits++;
        if (r.date > cur.last) cur.last = r.date;
      } else {
        map.set(r.patientData.nik, { nik: r.patientData.nik, name: r.patientData.name, visits: 1, last: r.date });
      }
    });
    return [...map.values()].sort((a, b) => b.visits - a.visits || b.last.localeCompare(a.last));
  }, [records]);

  useEffect(() => {
    if (!selectedNik && patients.length) setSelectedNik(patients[0].nik);
  }, [patients, selectedNik]);

  const historyRecords = useMemo(
    () => (selectedNik ? records.filter((r) => r.patientData.nik === selectedNik) : []),
    [records, selectedNik]
  );

  const handleNikSearch = () => {
    const q = nikQuery.trim();
    if (!q) return;
    const match = patients.find((p) => p.nik === q || p.nik.startsWith(q));
    if (match) {
      setSelectedNik(match.nik);
      setNikNotFound(false);
    } else {
      setNikNotFound(true);
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return records
      .filter((r) => r.patientData.name.toLowerCase().includes(q) || r.patientData.nik.includes(searchTerm))
      .sort((a, b) => {
        switch (sortOrder) {
          case 'date-asc':
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'name-asc':
            return a.patientData.name.localeCompare(b.patientData.name);
          case 'name-desc':
            return b.patientData.name.localeCompare(a.patientData.name);
          case 'nutrition-status':
            return (NUTRITION_STATUS_ORDER[b.healthReport.nutritionResult] || 0) - (NUTRITION_STATUS_ORDER[a.healthReport.nutritionResult] || 0);
          case 'oral-status':
            return (ORAL_STATUS_ORDER[b.healthReport.oralResult] || 0) - (ORAL_STATUS_ORDER[a.healthReport.oralResult] || 0);
          default:
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
  }, [records, searchTerm, sortOrder]);

  const stats = useMemo(() => {
    const diseaseFrequency: Record<string, number> = {};
    let atRiskOfStunting = 0;
    let oralIssues = 0;
    records.forEach((record) => {
      if (record.healthReport.nutritionResult !== 'Normal') atRiskOfStunting++;
      if (record.healthReport.oralResult !== 'Healthy') oralIssues++;
      const unique = new Set<string>();
      record.oralAnalyses.forEach((a) => a.analysisResult?.issues?.forEach((i) => unique.add(i.diseaseName)));
      unique.forEach((d) => (diseaseFrequency[d] = (diseaseFrequency[d] || 0) + 1));
    });
    return {
      totalScreenings: records.length,
      atRiskOfStunting,
      oralIssues,
      healthyOral: records.length - oralIssues,
      diseaseFrequency,
    };
  }, [records]);

  const sortedDiseases = Object.entries(stats.diseaseFrequency).sort(([, a], [, b]) => b - a);
  const maxDisease = sortedDiseases[0]?.[1] ?? 1;

  // ---------- CSV export ----------
  const handleExportCsv = () => {
    if (records.length === 0) {
      showToast('Belum ada data untuk diekspor.', 'warn');
      return;
    }
    const headers = [
      'ID Skrining', 'Tanggal', 'NIK Pasien', 'Nama Pasien', 'Tanggal Lahir', 'Jenis Kelamin',
      'Berat Badan (kg)', 'Tinggi Badan (cm)', 'Lingkar Kepala (cm)', 'LiLA (cm)', 'Status Gizi',
      'TB/U Z-Score (SD)', 'BB/U Z-Score (SD)', 'Wasting Z-Score (SD)', 'Status Oral',
      'Temuan Masalah Oral', 'Kesimpulan Medis',
    ];
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = records.map((r) => {
      const issues = [...new Set(r.oralAnalyses.flatMap((a) => a.analysisResult?.issues.map((i) => i.diseaseName) || []))].join('; ');
      return [
        r.id, r.date, r.patientData.nik, r.patientData.name, r.patientData.dob, r.patientData.gender,
        r.patientData.weight, r.patientData.height, r.patientData.headCircumference, r.patientData.armCircumference,
        r.healthReport.nutritionResult, r.healthReport.heightForAgeZScore, r.healthReport.weightForAgeZScore,
        r.healthReport.wastingZScore, r.healthReport.oralResult, issues, r.healthReport.conclusion,
      ].map(esc).join(',');
    });
    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `oralytic_skrining_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`${records.length} catatan diekspor ke CSV.`);
  };

  // ---------- CSV import ----------
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (text) await processCSV(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const processCSV = async (csvText: string) => {
    try {
      const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        showToast('File CSV tidak berisi baris data.', 'warn');
        return;
      }
      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i]
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map((p) => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        if (parts.length < 4) continue;

        const record: ScreeningRecord = {
          id: parts[0] || `ORL-IMP-${Date.now()}-${i}`,
          date: parts[1] || new Date().toISOString(),
          patientData: {
            nik: parts[2] || `3578${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            name: parts[3] || 'Pasien impor',
            dob: parts[4] || '2021-01-01',
            gender: parts[5] === 'Female' ? 'Female' : 'Male',
            weight: parts[6] || '12.0',
            height: parts[7] || '88.0',
            headCircumference: parts[8] || '47.0',
            armCircumference: parts[9] || '13.5',
          },
          stuntingData: {
            ageGroup: '>24', exclusiveBreastfeeding: 'yes', sugarInFormula: 'no', mpasiStartDate: '6',
            mpasiMenu: ['Nasi', 'Ikan'], mpasiTexture: 'Padat', snackFrequency: '2x', snackType: 'Buah',
            sweetDrinkFrequency: 'Jarang', sleepWithBottle: 'no', gumCleaningStartDate: '12', useSpecialToothpaste: 'yes',
            mainMealsPerDay: '3x', dailyDietIncludes: ['Nasi'], isPickyEater: 'no', pickyEaterFoods: '',
            snackFrequencyOutside: 'Kadang', favoriteSnack: 'Buah',
            weeklyConsumption: { soda: '', packagedSnacks: '', sweets: '', fastFood: '' },
            brushingFrequency: '2x sehari', brushingHabits: [], dentalPain: 'no',
          },
          oralAnalyses: [
            {
              imageBase64: '',
              analysisResult: {
                hygieneAssessment: 'Fair',
                issues: parts[15]
                  ? parts[15].split(';').map((d) => ({
                      diseaseName: d.trim(),
                      description: 'Diimpor dari riwayat rekam medis.',
                      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
                    }))
                  : [],
              },
            },
          ],
          healthReport: {
            nutritionResult:
              parts[10] === 'Needs Referral' || parts[10] === 'Needs Monitoring' || parts[10] === 'Risiko KEK' || parts[10] === 'Bukan Risiko KEK'
                ? parts[10]
                : 'Normal',
            stuntingStatus: parts[10] || 'Normal',
            heightForAgeZScore: parseFloat(parts[11]) || -1.2,
            weightStatus: 'Normal',
            weightForAgeZScore: parseFloat(parts[12]) || -1.0,
            wastingStatus: 'Normal',
            wastingZScore: parseFloat(parts[13]) || -0.8,
            lilaStatus: 'Normal',
            growthStatus: 'Tinggi Badan Sesuai Usia',
            bmi: 15.2,
            bmiStatus: 'Normal',
            nutritionReason: 'Catatan hasil impor file CSV.',
            oralResult: parts[14] === 'Needs Referral' || parts[14] === 'At Risk of Caries' ? parts[14] : 'Healthy',
            oralReason: 'Catatan hasil impor file CSV.',
            conclusion: parts[16] || 'Pemeriksaan rutin tercatat dari data riwayat.',
            recommendations: ['Lanjutkan pemantauan berkala posyandu.'],
          },
        };
        await saveScreeningRecord(record);
        imported++;
      }
      if (imported > 0) {
        setRecords(await getScreeningRecords());
        showToast(`${imported} catatan berhasil diimpor.`);
      } else {
        showToast('Tidak ada baris valid untuk diimpor.', 'warn');
      }
    } catch (e) {
      console.error('CSV import error:', e);
      showToast('File CSV gagal diproses.', 'warn');
    }
  };

  const handleRecordAdded = (r: ScreeningRecord) => {
    setRecords((prev) => [r, ...prev]);
    setSelectedNik(r.patientData.nik);
    showToast(`Skrining ${r.patientData.name} tersimpan.`);
  };

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const kpis = [
    { label: 'Total skrining', value: stats.totalScreenings, icon: ClipboardList, color: '#2F4156', note: `${patients.length} anak terdaftar` },
    { label: 'Risiko stunting', value: stats.atRiskOfStunting, icon: Baby, color: '#C08A2E', note: 'TB/U di bawah −2 SD atau perlu pantau' },
    { label: 'Masalah gigi & mulut', value: stats.oralIssues, icon: Stethoscope, color: '#B5524A', note: 'Karies atau gingivitis aktif' },
    { label: 'Rongga mulut sehat', value: stats.healthyOral, icon: ShieldCheck, color: '#3F8F6B', note: 'Tanpa temuan klinis' },
  ];

  const reveal = {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { root: scrollRef, once: true, amount: 0.15 },
    transition: { duration: 0.6, ease: EASE_OUT },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 flex bg-white text-[#1E293B]">
        {/* ---------- Sidebar ---------- */}
        <motion.aside
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="relative hidden w-[256px] flex-shrink-0 flex-col overflow-hidden border-r border-slate-200/80 bg-slate-50/50 px-4 py-6 lg:flex"
        >
          <div className="flex items-center gap-3 px-2">
            <img src={logoImage} alt="" className="h-9 w-9 object-contain" />
            <div className="leading-tight">
              <p className="text-[16px] font-bold tracking-tight text-[#0F172A]">Oralytic</p>
              <p className="text-[12px] text-[#64748B]">Puskesmas Gayungan</p>
            </div>
          </div>

          <nav className="mt-10 space-y-1" aria-label="Navigasi dasbor">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(id)}
                  aria-current={active ? 'true' : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 select-none transition-colors ${
                    active ? 'text-white font-semibold' : 'text-[#64748B] hover:bg-slate-100/80 hover:text-[#0F172A]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-[#2F4156] shadow-sm"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className={`relative h-[18px] w-[18px] transition-colors ${active ? 'text-white' : 'text-[#64748B] group-hover:text-[#0F172A]'}`} strokeWidth={1.9} />
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </nav>

          <img
            src={logoImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-24 w-[380px] max-w-none opacity-[0.03]"
          />

          <div className="relative mt-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2F4156] text-[13px] font-bold text-white">SA</div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[14px] font-semibold text-[#0F172A]">drg. Sarah, Sp.KGA</p>
                <p className="text-[12px] text-[#64748B]">Poli Gigi Anak</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[13px] font-medium text-[#64748B] outline-none focus:outline-none transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </motion.aside>

        {/* ---------- Main panel ---------- */}
        <div className="flex min-w-0 flex-1 p-0">
          <motion.div
            ref={scrollRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.05 }}
            className="relative min-w-0 flex-1 overflow-y-auto bg-white text-[#1E293B]"
          >
            {/* Top bar */}
            <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-3 px-5 py-4 sm:px-8">
                <img src={logoImage} alt="" className="h-8 w-8 object-contain lg:hidden" />
                <div className="mr-auto min-w-0">
                  <p className="text-[13px] capitalize text-[#64748B]">{today}</p>
                  <h1 className="text-[22px] font-bold tracking-tight text-[#0F172A]">Ringkasan skrining</h1>
                </div>

                <div className="relative order-last w-full sm:order-none sm:w-[260px]">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => activeSection !== 'patients' && searchTerm === '' && undefined}
                    onKeyDown={(e) => e.key === 'Enter' && scrollTo('patients')}
                    placeholder="Cari nama atau NIK"
                    aria-label="Cari pasien"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-9 text-[14px] text-[#0F172A] outline-none transition-shadow placeholder:text-slate-400 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      aria-label="Bersihkan pencarian"
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Impor CSV"
                    className="flex h-10 items-center gap-2 rounded-l-xl px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden xl:inline">Impor</span>
                  </button>
                  <span className="h-5 w-px bg-slate-200" />
                  <button
                    onClick={handleExportCsv}
                    title="Ekspor CSV"
                    className="flex h-10 items-center gap-2 rounded-r-xl px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden xl:inline">Ekspor</span>
                  </button>
                </div>

                <motion.button
                  onClick={() => setIsNewScreeningOpen(true)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#2F4156] px-4 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(47,65,86,0.22)] transition-colors hover:bg-[#1E2B38]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Skrining baru
                </motion.button>

                <button
                  onClick={onLogout}
                  aria-label="Keluar"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>

            <main className="mx-auto max-w-[1240px] space-y-6 px-5 pb-16 pt-6 sm:px-8">
              {/* ---------- KPIs ---------- */}
              <section id="overview" className="scroll-mt-24">
                <div className="grid overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
                  {kpis.map((k, i) => {
                    const share = stats.totalScreenings ? (k.value / stats.totalScreenings) * 100 : 0;
                    return (
                      <motion.div
                        key={k.label}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.55, ease: EASE_OUT }}
                        className={`group relative p-6 transition-colors hover:bg-slate-50/50 ${
                          i > 0 ? 'border-t border-slate-100 sm:border-t-0' : ''
                        } ${i % 2 === 1 ? 'sm:border-l sm:border-slate-100' : ''} ${
                          i >= 2 ? 'sm:border-t sm:border-slate-100 xl:border-t-0' : ''
                        } ${i > 0 ? 'xl:border-l xl:border-slate-100' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 text-[14px] font-medium text-[#64748B]">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                            style={{ background: `${k.color}14`, color: k.color }}
                          >
                            <k.icon className="h-4 w-4" strokeWidth={2} />
                          </span>
                          {k.label}
                        </div>
                        <p className="mt-4 text-[40px] font-bold leading-none tracking-tight text-[#0F172A]">
                          {isLoading ? <span className="inline-block h-10 w-16 animate-pulse rounded-lg bg-slate-100" /> : <CountUp value={k.value} />}
                        </p>
                        <p className="mt-2 text-[13px] text-[#64748B]">{k.note}</p>
                        {i > 0 && (
                          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: k.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${share}%` }}
                              transition={{ delay: 0.4 + i * 0.08, duration: 1, ease: EASE_OUT }}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              {/* ---------- Growth curve section ---------- */}
              <motion.section {...reveal} id="growth" className="scroll-mt-20 rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[18px] font-bold tracking-tight text-[#0F172A]">Kurva TB/U per anak</h2>
                    <p className="mt-1 text-[14px] text-[#64748B]">Z-score tinggi menurut umur terhadap standar WHO Child Growth Standards.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleNikSearch();
                    }}
                    className="relative w-full sm:w-[240px]"
                  >
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={nikQuery}
                      onChange={(e) => {
                        setNikQuery(e.target.value.replace(/\D/g, ''));
                        setNikNotFound(false);
                      }}
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="Cari NIK"
                      aria-label="Cari NIK pasien"
                      className={`h-10 w-full rounded-xl border bg-slate-50/60 pl-9 pr-3 font-mono text-[14px] tabular-nums outline-none transition-shadow placeholder:font-sans placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                        nikNotFound ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-[#2F4156] focus:ring-[#2F4156]/10'
                      }`}
                    />
                    <AnimatePresence>
                      {nikNotFound && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="absolute left-1 top-full mt-1 text-[12px] text-red-600"
                        >
                          NIK tidak ditemukan
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </form>
                </div>

                {/* Patient chips */}
                <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1">
                  {patients.slice(0, 10).map((p) => {
                    const active = p.nik === selectedNik;
                    return (
                      <button
                        key={p.nik}
                        type="button"
                        onClick={() => {
                          setSelectedNik(p.nik);
                          setNikNotFound(false);
                        }}
                        className={`relative flex flex-shrink-0 items-center gap-2.5 rounded-xl border py-1.5 pl-1.5 pr-3 text-left outline-none focus:outline-none transition-colors ${
                          active ? 'border-[#2F4156] text-white' : 'border-slate-200 bg-slate-50/60 text-[#334155] hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        {active && (
                          <motion.span layoutId="patient-chip" className="absolute inset-0 rounded-[11px] bg-[#2F4156] shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                        )}
                        <span
                          className={`relative flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold ${
                            active ? 'bg-white/15' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {initials(p.name)}
                        </span>
                        <span className="relative leading-tight">
                          <span className="block text-[13px] font-semibold">{p.name.split(' ').slice(0, 2).join(' ')}</span>
                          <span className={`block text-[11px] ${active ? 'text-white/70' : 'text-[#64748B]'}`}>{p.visits} kunjungan</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedNik ?? 'none'}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {historyRecords.length > 0 && <PatientGrowthChart patientRecords={historyRecords} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.section>

              {/* ---------- Findings section ---------- */}
              <motion.section {...reveal} id="findings" className="scroll-mt-20 rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-7 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h2 className="text-[18px] font-bold tracking-tight text-[#0F172A]">Temuan rongga mulut</h2>
                    <p className="mt-1 text-[14px] text-[#64748B]">Distribusi masalah gigi dan jaringan lunak mulut balita dari analisis visual.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2F4156]/8 px-3 py-1 text-[12px] font-semibold text-[#2F4156]">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {sortedDiseases.length} Diagnosis terdeteksi
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-12">
                  {/* Left: Bar breakdown */}
                  <div className="xl:col-span-7">
                    <p className="text-[13px] font-semibold text-[#64748B]">Frekuensi diagnosis per kasus</p>
                    {sortedDiseases.length > 0 ? (
                      <ul className="mt-4 space-y-3.5">
                        {sortedDiseases.map(([name, count], i) => (
                          <li key={name} className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50">
                            <div className="flex items-baseline justify-between gap-3">
                              <p className="text-[14px] font-semibold leading-snug text-[#0F172A]">{name}</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[16px] font-bold tabular-nums text-[#2F4156]">{count}</span>
                                <span className="text-[12px] text-[#64748B]">
                                  anak ({stats.totalScreenings ? Math.round((count / stats.totalScreenings) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/60">
                              <motion.div
                                className="h-full rounded-full bg-[#2F4156]"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(count / maxDisease) * 100}%` }}
                                viewport={{ root: scrollRef, once: true }}
                                transition={{ delay: 0.15 + i * 0.08, duration: 0.9, ease: EASE_OUT }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-6 text-[14px] text-[#64748B]">Belum ada temuan klinis tercatat.</p>
                    )}
                  </div>

                  {/* Right: Key summary cards */}
                  <div className="flex flex-col gap-4 xl:col-span-5">
                    <p className="text-[13px] font-semibold text-[#64748B]">Status kesehatan oral balita</p>

                    <div className="flex flex-1 flex-col justify-between rounded-2xl bg-[#2F4156] p-6 text-white shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-white/70">Prevalensi masalah oral</span>
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90">Prioritas</span>
                        </div>
                        <p className="mt-3 text-[38px] font-bold leading-none tracking-tight tabular-nums">
                          {stats.totalScreenings ? Math.round((stats.oralIssues / stats.totalScreenings) * 100) : 0}%
                        </p>
                        <p className="mt-3 text-[13px] leading-relaxed text-white/75">
                          {stats.oralIssues} dari {stats.totalScreenings} anak memiliki temuan karies aktif, plak/debris, atau radang gusi.
                        </p>
                      </div>

                      <div className="mt-6 border-t border-white/10 pt-4">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-white/70">Rongga mulut sehat (bebas temuan)</span>
                          <span className="font-semibold text-[#82C39B] tabular-nums">{stats.healthyOral} anak</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F4156]/10 text-[#2F4156]">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0F172A]">Rekomendasi Tindak Lanjut</p>
                          <p className="text-[12px] text-[#64748B]">Skrining otomatis menyarankan rujukan ke poli gigi puskesmas pada anak berisiko tinggi.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* ---------- Patients table ---------- */}
              <motion.section {...reveal} id="patients" className="scroll-mt-24 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 pb-4 pt-6">
                  <div>
                    <h2 className="text-[18px] font-bold tracking-tight text-[#0F172A]">Data pasien</h2>
                    <p className="mt-1 text-[14px] text-[#64748B]">
                      {searchTerm ? (
                        <>
                          {filteredAndSortedRecords.length} hasil untuk “{searchTerm}”
                        </>
                      ) : (
                        <>{records.length} catatan skrining</>
                      )}
                    </p>
                  </div>
                  <label className="relative flex items-center">
                    <ArrowUpDown className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      aria-label="Urutkan"
                      className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-[13px] font-medium text-[#0F172A] outline-none focus:border-[#2F4156]"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-2.5 h-4 w-4 rotate-90 text-slate-400" />
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left">
                    <thead>
                      <tr className="border-y border-slate-200 bg-slate-50/80 text-[12px] font-semibold text-[#64748B]">
                        <th className="px-6 py-3 font-semibold">Pasien</th>
                        <th className="px-3 py-3 font-semibold">Tanggal</th>
                        <th className="px-3 py-3 text-right font-semibold">TB / BB</th>
                        <th className="px-3 py-3 text-right font-semibold">TB/U</th>
                        <th className="px-3 py-3 font-semibold">Gizi</th>
                        <th className="px-3 py-3 font-semibold">Rongga mulut</th>
                        <th className="w-12 px-3 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {filteredAndSortedRecords.map((r, i) => {
                          const z = r.healthReport.heightForAgeZScore;
                          return (
                            <motion.tr
                              key={r.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.03, ease: EASE_OUT }}
                              onClick={() => setSelectedRecord(r)}
                              className="group cursor-pointer border-b border-slate-100 transition-colors last:border-b-0 hover:bg-slate-50/80"
                            >
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[12px] font-bold text-[#2F4156] transition-colors group-hover:bg-[#2F4156] group-hover:text-white">
                                    {initials(r.patientData.name)}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-[14px] font-semibold text-[#0F172A]">{r.patientData.name}</p>
                                    <p className="font-mono text-[12px] text-[#64748B] tabular-nums">{r.patientData.nik}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3.5 text-[14px] text-[#475569]">{formatDate(r.date)}</td>
                              <td className="px-3 py-3.5 text-right text-[14px] tabular-nums text-[#475569]">
                                {r.patientData.height} cm · {r.patientData.weight} kg
                              </td>
                              <td
                                className={`px-3 py-3.5 text-right text-[14px] font-semibold tabular-nums ${
                                  z !== null && z < -3 ? 'text-[#933F38]' : z !== null && z < -2 ? 'text-[#8C6420]' : 'text-[#0F172A]'
                                }`}
                              >
                                {z === null || z === undefined ? '—' : `${z > 0 ? '+' : ''}${z.toFixed(2)}`}
                              </td>
                              <td className="px-3 py-3.5">
                                <StatusTag status={r.healthReport.nutritionResult} />
                              </td>
                              <td className="px-3 py-3.5">
                                <StatusTag status={r.healthReport.oralResult} />
                              </td>
                              <td className="px-3 py-3.5">
                                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0F172A]" />
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {!isLoading && filteredAndSortedRecords.length === 0 && (
                  <div className="flex flex-col items-center px-6 py-14 text-center">
                    <Search className="h-6 w-6 text-[#A3ADB8]" />
                    <p className="mt-3 text-[15px] font-semibold">Tidak ada pasien yang cocok</p>
                    <p className="mt-1 text-[14px] text-[#8A96A3]">Periksa kembali ejaan nama atau NIK.</p>
                  </div>
                )}
              </motion.section>
            </main>
          </motion.div>
        </div>

        {/* ---------- Overlays ---------- */}
        <AnimatePresence>
          {selectedRecord && <PatientDetailModal key="detail" record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
        </AnimatePresence>
        <AnimatePresence>
          {isNewScreeningOpen && (
            <NewScreeningModal key="new" onClose={() => setIsNewScreeningOpen(false)} onRecordAdded={handleRecordAdded} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              role="status"
              className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-[#1E2B38] px-4 py-3 text-[14px] font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.3)]"
            >
              {toast.tone === 'ok' ? (
                <CircleCheck className="h-4 w-4 text-[#7FC4A2]" />
              ) : (
                <CircleAlert className="h-4 w-4 text-[#E3B866]" />
              )}
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
};

export default ScreeningDashboard;
