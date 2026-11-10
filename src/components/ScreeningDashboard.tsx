import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Clock,
  User,
  Plus,
  Calendar,
  LogOut,
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Hospital,
} from 'lucide-react';
import type { ScreeningRecord } from '../types';
import { getScreeningRecords, getAuthSession } from '../services/apiService';
import { OralScreeningReportView } from './dashboard/OralScreeningReportView';
import { NewScreeningModal } from './dashboard/NewScreeningModal';
import { initials } from './dashboard/ui';
import logoImage from '../assets/logo.png';

interface ScreeningDashboardProps {
  onLogout: () => void;
}

type TabKey = 'beranda' | 'riwayat' | 'profile';

export const ScreeningDashboard = ({ onLogout }: ScreeningDashboardProps) => {
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('beranda');
  const [selectedRecord, setSelectedRecord] = useState<ScreeningRecord | null>(null);
  const [isNewScreeningOpen, setIsNewScreeningOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sesi login nakes
  const session = getAuthSession();
  const userName = session?.user?.name || 'dr. Sarah Sp.A';
  const facilityName = session?.activeInstitution?.name || 'PUSKESMAS KOTA SURABAYA';

  useEffect(() => {
    (async () => {
      try {
        const data = await getScreeningRecords();
        setRecords(data);
      } catch (err) {
        console.error('Failed to load screening records:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleRecordAdded = (newRecord: ScreeningRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setIsNewScreeningOpen(false);
    setSelectedRecord(newRecord);
  };

  const handleRecordUpdated = (updatedRecord: ScreeningRecord) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    setSelectedRecord(updatedRecord);
  };

  // Hitung data untuk 3 kartu statistik (sesuai Figma: 3 hari ini, 2 tervalidasi, 1 menunggu)
  const pendingRecords = useMemo(() => {
    return records.filter((r) => r.validationStatus === 'pending');
  }, [records]);

  const validatedRecords = useMemo(() => {
    return records.filter((r) => r.validationStatus !== 'pending');
  }, [records]);

  const statToday = records.length;
  const statValidated = validatedRecords.length;
  const statPending = pendingRecords.length;

  // Format tanggal ala Figma: "Sabtu, 31 Januari 2027"
  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return 'Sabtu, 31 Januari 2027';
    }
  }, []);

  // Filter untuk tab riwayat
  const filteredHistoryRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(
      (r) =>
        r.patientData.name.toLowerCase().includes(q) ||
        r.patientData.nik.includes(q)
    );
  }, [records, searchTerm]);

  // Helper usia
  const calculateAge = (dob: string): string => {
    if (!dob) return '—';
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return `${Math.max(1, age)} th`;
  };

  // Helper format jam
  const formatTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '09:00';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F4F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#2F4156] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-semibold text-[#2F4156]">Memuat data skrining...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-[#F7F4F0] text-[#0F172A] font-sans flex flex-col md:flex-row items-stretch overflow-hidden selection:bg-[#2F4156] selection:text-white">
      {/* =========================================================================
          WATERMARK DEKORATIF DI SUDUT KANAN BAWAH (Sesuai Desain Figma)
          ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 0.06, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-[-80px] bottom-[-80px] w-[460px] sm:w-[580px] pointer-events-none select-none z-0"
      >
        <img src={logoImage} alt="Watermark Emblem" className="w-full h-auto object-contain" />
      </motion.div>

      {/* =========================================================================
          SIDEBAR KIRI (Elemen Statis Terpisah - Mengisi Penuh Tinggi Layar)
          ========================================================================= */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 88 : 280 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="relative z-20 bg-[#2F4156] text-white flex flex-col justify-between p-4 md:p-5 h-screen max-h-screen md:rounded-r-[36px] shadow-2xl flex-shrink-0 select-none overflow-y-auto overflow-x-hidden"
      >
        <div className="flex flex-col gap-7">
          {/* Header Brand & Tombol Minimize */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-2 backdrop-blur-sm border border-white/15 flex-shrink-0">
                  <img src={logoImage} alt="ORALYTIC" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-black text-[19px] tracking-wider text-white leading-tight font-sans truncate">
                    ORALYTIC
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest text-slate-300 uppercase truncate">
                    AI Oral Screening
                  </span>
                </div>
              </div>

              {/* Tombol Minimize */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                title="Minimize Sidebar"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Perluas Sidebar"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center p-2 backdrop-blur-sm border border-white/15 cursor-pointer transition-transform hover:scale-105"
              >
                <img src={logoImage} alt="ORALYTIC" className="w-full h-full object-contain" />
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Perluas Sidebar"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Menu Navigasi Utama */}
          <nav className="flex flex-col gap-1.5 relative">
            {(
              [
                { key: 'beranda', label: 'Beranda', icon: Home },
                { key: 'riwayat', label: 'Riwayat', icon: Clock },
                { key: 'profile', label: 'Profile', icon: User },
              ] as const
            ).map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveTab(key);
                    setSelectedRecord(null);
                  }}
                  title={label}
                  className={`relative flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3.5 px-4 py-3'
                  } rounded-xl text-[14px] font-medium transition-colors cursor-pointer select-none ${
                    isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-xl bg-white/15 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      className="relative z-10 whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bagian Bawah Sidebar: Tombol Mulai Skrining & Logout */}
        <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-auto">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsNewScreeningOpen(true)}
            title="Mulai Skrining Baru"
            className={`h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[13px] flex items-center justify-center ${
              isSidebarCollapsed ? 'w-11 px-0 mx-auto' : 'w-full gap-2 px-3'
            } transition-colors cursor-pointer shadow-xs`}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Mulai Skrining Baru</span>}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            title="Keluar Sesi"
            className={`flex items-center justify-center ${
              isSidebarCollapsed ? 'w-10 h-10 mx-auto' : 'w-full gap-2 py-2.5'
            } text-[12px] font-medium text-slate-400 hover:text-white transition-colors cursor-pointer`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Keluar Sesi</span>}
          </motion.button>
        </div>
      </motion.aside>

      {/* =========================================================================
          KONTEN UTAMA (Elemen Terpisah - Satu-Satunya Bagian yang Di-Scroll)
          ========================================================================= */}
      <main className="relative z-10 flex-1 min-w-0 h-screen overflow-y-auto flex flex-col px-6 sm:px-10 lg:px-12 py-8 max-w-[1360px] mx-auto w-full">
        {selectedRecord ? (
          <OralScreeningReportView
            record={selectedRecord}
            onBack={() => setSelectedRecord(null)}
            onRecordUpdated={handleRecordUpdated}
          />
        ) : (
          <>
            {/* Top Header Row */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-bold tracking-wider text-[#64748B] uppercase">
                  {facilityName}
                </span>
                <h1 className="text-[26px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight">
                  Selamat Datang, {userName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-slate-200/80 rounded-lg text-[13px] text-[#475569] font-medium shadow-xs">
                    <Calendar className="w-3.5 h-3.5 text-[#2F4156]" />
                    <span>{todayFormatted}</span>
                  </div>
                </div>
              </div>

              {/* User Avatar Circle */}
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-[#3C6E71] text-white font-bold flex items-center justify-center text-base shadow-sm border-2 border-white cursor-pointer hover:ring-2 hover:ring-[#2F4156]/20 transition-all"
                  title={userName}
                >
                  {initials(userName) || 'NA'}
                </motion.div>
              </div>
            </header>

            {/* =========================================================================
                DYNAMIC TAB TRANSITIONS DENGAN ANIMATEPRESENCE (Ultra Smooth)
                ========================================================================= */}
            <AnimatePresence mode="wait">
          {/* =========================================================================
              TAB 1: BERANDA (Dashboard Utama Sesuai Figma)
              ========================================================================= */}
          {activeTab === 'beranda' && (
            <motion.div
              key="beranda"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-8"
            >
              {/* 3 KARTU STATISTIK (Skrining hari ini, Sudah tervalidasi, Menunggu validasi) */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { count: statToday, label: 'Skrining hari ini' },
                  { count: statValidated, label: 'Sudah tervalidasi' },
                  { count: statPending, label: 'Menunggu validasi' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.985 }}
                    className="bg-white rounded-[22px] p-6 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] border border-slate-200/60 flex items-center gap-5 transition-shadow cursor-default"
                  >
                    <span className="text-[44px] lg:text-[48px] font-black text-[#0F172A] leading-none tracking-tight">
                      {stat.count}
                    </span>
                    <span className="text-[14px] lg:text-[15px] font-medium text-[#475569] leading-snug">
                      {stat.label}
                    </span>
                  </motion.div>
                ))}
              </section>

              {/* BAGIAN 1: Menunggu validasi Anda */}
              <section className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0F172A] tracking-tight">
                    Menunggu validasi Anda
                  </h2>
                  <motion.button
                    type="button"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveTab('riwayat')}
                    className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    Lihat semua
                  </motion.button>
                </div>

                <div className="flex flex-col gap-3">
                  {pendingRecords.length === 0 ? (
                    <div className="bg-white/70 border border-slate-200/60 rounded-[20px] p-6 text-center text-slate-500 text-[14px]">
                      Tidak ada skrining yang menunggu validasi saat ini.
                    </div>
                  ) : (
                    pendingRecords.map((rec) => {
                      const issuesCount = rec.oralAnalyses.flatMap(
                        (a) => a.analysisResult?.issues || []
                      ).length;
                      const category = rec.patientCategory || (rec.patientData.pregnancyStatus === 'Pregnant' ? 'Ibu Hamil' : 'Anak');

                      return (
                        <motion.div
                          key={rec.id}
                          whileHover={{ y: -2, x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                          onClick={() => setSelectedRecord(rec)}
                          className="bg-white rounded-[20px] p-4 sm:p-5 flex items-center justify-between shadow-[0_4px_16px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] border border-slate-200/60 hover:border-slate-300 transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#486581] text-white font-bold flex items-center justify-center text-[15px] shadow-xs flex-shrink-0">
                              {initials(rec.patientData.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[15px] sm:text-[16px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                                {rec.patientData.name} {calculateAge(rec.patientData.dob)}
                              </span>
                              <span className="text-[13px] text-[#64748B]">
                                {category} - Skrining {formatTime(rec.date)}
                              </span>
                            </div>
                          </div>

                          {/* Badge Kapsul Burgundy: "3 temuan" */}
                          <div className="flex items-center gap-3">
                            <span className="bg-[#4A2020] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-xs">
                              {issuesCount > 0 ? `${issuesCount} temuan` : 'Perlu validasi'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* BAGIAN 2: Sudah tervalidasi oleh Anda */}
              <section className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0F172A] tracking-tight">
                    Sudah tervalidasi oleh Anda
                  </h2>
                  <motion.button
                    type="button"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveTab('riwayat')}
                    className="text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                  >
                    Riwayat
                  </motion.button>
                </div>

                <div className="flex flex-col gap-3">
                  {validatedRecords.length === 0 ? (
                    <div className="bg-white/70 border border-slate-200/60 rounded-[20px] p-6 text-center text-slate-500 text-[14px]">
                      Belum ada skrining yang tervalidasi.
                    </div>
                  ) : (
                    validatedRecords.slice(0, 4).map((rec) => {
                      const category = rec.patientCategory || (rec.patientData.pregnancyStatus === 'Pregnant' ? 'Ibu Hamil' : 'Anak');

                      return (
                        <motion.div
                          key={rec.id}
                          whileHover={{ y: -2, x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                          onClick={() => setSelectedRecord(rec)}
                          className="bg-white rounded-[20px] p-4 sm:p-5 flex items-center justify-between shadow-[0_4px_16px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] border border-slate-200/60 hover:border-slate-300 transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#486581] text-white font-bold flex items-center justify-center text-[15px] shadow-xs flex-shrink-0">
                              {initials(rec.patientData.name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[15px] sm:text-[16px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                                {rec.patientData.name} {calculateAge(rec.patientData.dob)}
                              </span>
                              <span className="text-[13px] text-[#64748B]">
                                {category} - Skrining {formatTime(rec.date)}
                              </span>
                            </div>
                          </div>

                          {/* Badge Kapsul Slate Teal: "Tervalidasi" */}
                          <div className="flex items-center gap-3">
                            <span className="bg-[#3C6E71] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-xs">
                              Tervalidasi
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform hidden sm:block" />
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 2: RIWAYAT SEMUA SKRINING & PENCARIAN
              ========================================================================= */}
          {activeTab === 'riwayat' && (
            <motion.div
              key="riwayat"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-bold text-[#0F172A]">Riwayat Pemeriksaan Pasien</h2>
                  <p className="text-[14px] text-slate-500">
                    Daftar seluruh rekam skrining risiko stunting dan kesehatan rongga mulut
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-[320px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari nama atau NIK..."
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 outline-none focus:border-[#2F4156] focus:ring-2 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filteredHistoryRecords.map((rec) => {
                  const isValidated = rec.validationStatus !== 'pending';
                  const issuesCount = rec.oralAnalyses.flatMap(
                    (a) => a.analysisResult?.issues || []
                  ).length;

                  return (
                    <motion.div
                      key={rec.id}
                      whileHover={{ y: -2, x: 2 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      onClick={() => setSelectedRecord(rec)}
                      className="bg-white rounded-[20px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] border border-slate-200/60 hover:border-slate-300 transition-shadow cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#486581] text-white font-bold flex items-center justify-center text-[15px] shadow-xs flex-shrink-0">
                          {initials(rec.patientData.name)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[16px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                              {rec.patientData.name}
                            </span>
                            <span className="text-[12px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                              {calculateAge(rec.patientData.dob)}
                            </span>
                          </div>
                          <span className="text-[13px] text-slate-500 font-mono mt-0.5">
                            NIK: {rec.patientData.nik} • {rec.patientCategory || 'Anak'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-right hidden sm:block">
                          <span className="text-[12px] text-slate-400 block">
                            Status Gizi: {rec.healthReport.nutritionResult}
                          </span>
                        </div>
                        {isValidated ? (
                          <span className="bg-[#3C6E71] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full shadow-xs">
                            Tervalidasi
                          </span>
                        ) : (
                          <span className="bg-[#4A2020] text-white text-[12px] font-semibold px-4 py-1.5 rounded-full shadow-xs">
                            {issuesCount} temuan
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              TAB 3: PROFIL DOKTER / NAKES & FASKES
              ========================================================================= */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6 max-w-[680px]"
            >
              <div>
                <h2 className="text-[22px] font-bold text-[#0F172A]">Profil Tenaga Kesehatan</h2>
                <p className="text-[14px] text-slate-500">
                  Informasi akun medis terdaftar di platform skrining ORALYTIC
                </p>
              </div>

              <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.04)] border border-slate-200/60 flex flex-col gap-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-[#3C6E71] text-white font-bold flex items-center justify-center text-xl shadow-md border-2 border-white">
                    {initials(userName) || 'NA'}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[18px] text-[#0F172A]">{userName}</h3>
                    <span className="text-[13px] text-slate-500 font-medium">
                      {session?.user?.role_label || 'Tenaga Kesehatan (Nakes)'}
                    </span>
                    <span className="text-[12px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Akun Terverifikasi
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Fasilitas Kesehatan
                    </span>
                    <span className="text-[14px] font-semibold text-slate-800 flex items-center gap-1.5">
                      <Hospital className="w-4 h-4 text-slate-500" />
                      {facilityName}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Email Resmi
                    </span>
                    <span className="text-[14px] font-semibold text-slate-800">
                      {session?.user?.email || 'nakes.rsa@sonri.test'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onLogout}
                    className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-[13px] transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Akun</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
      )}
      </main>

      {/* =========================================================================
          MODAL SKRINING BARU (Mulai Skrining Baru - Sesuai Figma Langkah 1 dari 3)
          ========================================================================= */}
      <AnimatePresence>
        {isNewScreeningOpen && (
          <NewScreeningModal
            onClose={() => setIsNewScreeningOpen(false)}
            onRecordAdded={handleRecordAdded}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
