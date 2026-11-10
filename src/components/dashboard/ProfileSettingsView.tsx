import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  X,
  FileDown,
  Sparkles,
  LogOut,
} from 'lucide-react';
import type { ScreeningRecord } from '../../types';
import { initials } from './ui';

interface ProfileSettingsViewProps {
  userName: string;
  userEmail: string;
  facilityName: string;
  roleLabel?: string;
  records: ScreeningRecord[];
  onLogout: () => void;
  onUpdateProfile?: (updated: { name: string; email: string; strNumber: string }) => void;
}

export const ProfileSettingsView = ({
  userName,
  userEmail,
  facilityName,
  roleLabel = 'Dokter Gigi',
  records,
  onLogout,
  onUpdateProfile,
}: ProfileSettingsViewProps) => {
  // Local Settings States
  const [strNumber, setStrNumber] = useState('33112200123456789');
  const [doctorName, setDoctorName] = useState(userName || 'Nama Dokter');
  const [doctorEmail, setDoctorEmail] = useState(userEmail || 'emaildokter@gmail.id');

  // Toggle mode: view vs edit
  const [isEditing, setIsEditing] = useState(false);

  // Toggle states in PENGATURAN
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [savePhotosDevice, setSavePhotosDevice] = useState(false);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(true);

  // Modals state
  const [isAboutAiOpen, setIsAboutAiOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Form field states for Ubah Profil
  const getInitialNames = () => {
    const parts = doctorName.split(' ');
    const first = parts[0] || 'Nama';
    const last = parts.slice(1).join(' ') || 'Dokter';
    return { first, last };
  };

  const [firstNameInput, setFirstNameInput] = useState(() => getInitialNames().first);
  const [lastNameInput, setLastNameInput] = useState(() => getInitialNames().last);
  const [editStrInput, setEditStrInput] = useState(strNumber);
  const [editFacilityInput, setEditFacilityInput] = useState(facilityName || 'PUSKESMAS KOTA SURABAYA');
  const [editEmailInput, setEditEmailInput] = useState(doctorEmail);
  const [editPasswordInput, setEditPasswordInput] = useState('••••••••');

  const handleOpenEdit = () => {
    const { first, last } = getInitialNames();
    setFirstNameInput(first);
    setLastNameInput(last);
    setEditStrInput(strNumber);
    setEditFacilityInput(facilityName || 'PUSKESMAS KOTA SURABAYA');
    setEditEmailInput(doctorEmail);
    setIsEditing(true);
  };

  const handleSaveProfile = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const fullName = `${firstNameInput} ${lastNameInput}`.trim() || doctorName;
    setDoctorName(fullName);
    setDoctorEmail(editEmailInput);
    setStrNumber(editStrInput);
    if (onUpdateProfile) {
      onUpdateProfile({
        name: fullName,
        email: editEmailInput,
        strNumber: editStrInput,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Unduh Rekap Skrining CSV
  const handleDownloadCSV = () => {
    const headers = [
      'ID Rekam',
      'Tanggal',
      'Nama Pasien',
      'NIK',
      'Kategori',
      'Status Validasi',
      'Hasil Gizi',
      'Hasil Oral',
    ];

    const rows = records.map((r) => [
      r.id,
      r.date,
      `"${r.patientData.name}"`,
      `"${r.patientData.nik}"`,
      r.patientCategory || 'Anak',
      r.validationStatus || 'pending',
      `"${r.healthReport.nutritionResult}"`,
      `"${r.healthReport.oralResult}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `rekap_skrining_oralytic_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-full w-full pb-20 pt-2 select-none">
      {/* Title (hanya ditampilkan di view mode) */}
      {!isEditing && (
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#0F172A] tracking-tight mb-5">
          Profil
        </h1>
      )}

      <div className="flex flex-col gap-4 max-w-[860px]">
        {/* =========================================================================
            CARD 1: IDENTITAS DOKTER (Sesuai Screenshot Figma)
            ========================================================================= */}
        <section className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
          <div className="flex items-center gap-4">
            {/* Square Rounded Avatar Box with Teal background */}
            <div className="w-16 h-16 rounded-[18px] bg-[#486581] text-white font-bold flex items-center justify-center text-xl shadow-xs flex-shrink-0">
              {initials(doctorName) || 'ND'}
            </div>

            <div className="flex flex-col">
              <h2 className="text-[22px] sm:text-[24px] font-bold text-[#0F172A] leading-tight">
                {doctorName}
              </h2>
              <span className="text-[14px] text-slate-500 mt-0.5">
                {doctorEmail}
              </span>
              <div className="mt-1">
                <span className="bg-[#D7EFE1] text-[#1E5631] text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                  STR terverifikasi
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Ubah Profil Outline (Hanya tampil saat tidak sedang mengedit) */}
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleOpenEdit}
              className="w-full h-11 border border-slate-300 hover:border-slate-400 rounded-xl flex items-center justify-center gap-2 text-[14px] font-semibold text-[#0F172A] hover:bg-slate-50 mt-5 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Ubah profil</span>
            </motion.button>
          )}
        </section>

        {/* =========================================================================
            TAMPILAN MODE EDIT: FORM UBAH PROFIL (Sesuai Screenshot "ketika ubah profil diklik")
            ========================================================================= */}
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4"
          >
            {/* Card Form Ubah Profil */}
            <section className="bg-white rounded-[26px] p-7 sm:p-8 shadow-xs border border-slate-200/80 flex flex-col">
              <h2 className="text-[22px] sm:text-[24px] font-bold text-[#0F172A] leading-tight">
                Ubah Profil
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 mb-6">
                Nama dan nomor STR ikut tercetak di setiap laporan yang Anda kirim
              </p>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                {/* Row 1: Nama Depan & Nama Belakang */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                      NAMA DEPAN
                    </label>
                    <input
                      type="text"
                      value={firstNameInput}
                      onChange={(e) => setFirstNameInput(e.target.value)}
                      required
                      placeholder="Nama Depan"
                      className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                      NAMA BELAKANG
                    </label>
                    <input
                      type="text"
                      value={lastNameInput}
                      onChange={(e) => setLastNameInput(e.target.value)}
                      placeholder="Nama Belakang"
                      className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Row 2: Nomor STR */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                    NOMOR STR
                  </label>
                  <input
                    type="text"
                    value={editStrInput}
                    onChange={(e) => setEditStrInput(e.target.value.replace(/\D/g, ''))}
                    maxLength={16}
                    required
                    placeholder="16 digit angka STR"
                    className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-mono font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                  />
                </div>

                {/* Row 3: Fasilitas Kesehatan */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                    FASILITAS KESEHATAN
                  </label>
                  <input
                    type="text"
                    value={editFacilityInput}
                    onChange={(e) => setEditFacilityInput(e.target.value)}
                    placeholder="Nama RS / Puskesmas"
                    className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                  />
                </div>

                {/* Row 4: Email */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={editEmailInput}
                    onChange={(e) => setEditEmailInput(e.target.value)}
                    required
                    placeholder="email@faskes.id"
                    className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                  />
                </div>

                {/* Row 5: Kata Sandi */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase block mb-1.5">
                    KATA SANDI
                  </label>
                  <input
                    type="password"
                    value={editPasswordInput}
                    onChange={(e) => setEditPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-[#F8F2EB] rounded-[14px] px-4 text-[14px] font-medium text-[#0F172A] outline-none focus:ring-2 focus:ring-[#4A7085]/20 focus:bg-white transition-all"
                  />
                </div>
              </form>
            </section>

            {/* Tombol Aksi di Bawah Card (Sesuai Screenshot Figma) */}
            <div className="flex flex-col gap-3 mt-1">
              <motion.button
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.992 }}
                type="button"
                onClick={() => handleSaveProfile()}
                className="w-full h-12 rounded-[14px] bg-[#4A7085] hover:bg-[#3D5F72] text-white font-bold text-[14px] shadow-xs transition-colors flex items-center justify-center cursor-pointer"
              >
                Simpan Perubahan
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.992 }}
                type="button"
                onClick={handleCancelEdit}
                className="w-full h-12 rounded-[14px] bg-[#FAF3EA] hover:bg-[#F3E7D8] border border-[#E5DDD0] text-[#0F172A] font-bold text-[14px] transition-colors flex items-center justify-center cursor-pointer"
              >
                Batalkan Perubahan
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
              TAMPILAN MODE NORMAL / VIEW (Card 2, 3, 4)
              ========================================================================= */
          <>
            {/* CARD 2: PENEMPATAN */}
            <section className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                PENEMPATAN
              </span>
              <div className="h-px bg-slate-200/80 mt-2 mb-4" />

              {/* Row 1: Nomor STR */}
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#0F172A] font-mono tracking-wide">
                  {strNumber}
                </span>
                <span className="text-[13px] text-slate-400 mt-0.5">Nomor STR</span>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Row 2: Peran */}
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#0F172A]">
                  {roleLabel} {facilityName ? `• ${facilityName}` : ''}
                </span>
                <span className="text-[13px] text-slate-400 mt-0.5">
                  Peran : dapat memvalidasi laporan
                </span>
              </div>
            </section>

            {/* CARD 3: PENGATURAN */}
            <section className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                PENGATURAN
              </span>
              <div className="h-px bg-slate-200/80 mt-2 mb-4" />

              {/* Item 1: Pengingat validasi */}
              <div
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className="flex items-center justify-between cursor-pointer group py-1"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                    Pengingat validasi
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    Notifikasi saat ada laporan menunggu
                  </span>
                </div>

                {/* Toggle Switch */}
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    reminderEnabled ? 'bg-[#2F4156]' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`bg-white w-4 h-4 rounded-full shadow-md ${
                      reminderEnabled ? 'ml-auto' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Item 2: Simpan hasil foto ke dalam perangkat */}
              <div
                onClick={() => setSavePhotosDevice(!savePhotosDevice)}
                className="flex items-center justify-between cursor-pointer group py-1"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                    Simpan hasil foto ke dalam perangkat
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    {savePhotosDevice
                      ? 'Aktif - foto disimpan lokal di memori perangkat'
                      : 'Nonaktif - foto hanya dikirim ke server lalu dihapus'}
                  </span>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    savePhotosDevice ? 'bg-[#2F4156]' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`bg-white w-4 h-4 rounded-full shadow-md ${
                      savePhotosDevice ? 'ml-auto' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Item 3: Mode hemat data */}
              <div
                onClick={() => setDataSaverEnabled(!dataSaverEnabled)}
                className="flex items-center justify-between cursor-pointer group py-1"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                    Mode hemat data
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    Kompres foto sebelum diunggah
                  </span>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    dataSaverEnabled ? 'bg-[#2F4156]' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`bg-white w-4 h-4 rounded-full shadow-md ${
                      dataSaverEnabled ? 'ml-auto' : ''
                    }`}
                  />
                </div>
              </div>
            </section>

            {/* CARD 4: AKSI EKSPOR, INFO AI & KELUAR AKUN */}
            <section className="bg-white rounded-[24px] p-6 shadow-xs border border-slate-200/80 flex flex-col">
              {/* Row 1: Unduh rekap skrining */}
              <div
                onClick={handleDownloadCSV}
                className="flex items-center justify-between cursor-pointer group py-1"
                title="Klik untuk mengunduh seluruh data dalam CSV"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors flex items-center gap-2">
                    Unduh rekap skrining
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    Format CSV untuk pelaporan ({records.length} total skrining)
                  </span>
                </div>
                <FileDown className="w-5 h-5 text-slate-400 group-hover:text-[#2F4156] transition-colors" />
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Row 2: Tentang model AI */}
              <div
                onClick={() => setIsAboutAiOpen(true)}
                className="flex items-center justify-between cursor-pointer group py-1"
                title="Lihat spesifikasi model AI Oralytic"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#0F172A] group-hover:text-[#2F4156] transition-colors">
                    Tentang model AI
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    Versi, keterbatasan, dan cakupan data latih
                  </span>
                </div>
                <Sparkles className="w-5 h-5 text-slate-400 group-hover:text-[#2F4156] transition-colors" />
              </div>

              <div className="h-px bg-slate-100 my-4" />

              {/* Row 3: Keluar dari akun */}
              <div
                onClick={() => setIsLogoutConfirmOpen(true)}
                className="flex items-center justify-between cursor-pointer group py-1"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] sm:text-[15px] text-[#D9383A] group-hover:text-red-700 transition-colors">
                    Keluar dari akun
                  </span>
                  <span className="text-[13px] text-slate-400 mt-0.5">
                    Draft yang belum dikirim akan tetap tersimpan
                  </span>
                </div>
                <LogOut className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </section>
          </>
        )}
      </div>

      {/* =========================================================================
          MODAL TENTANG MODEL AI
          ========================================================================= */}
      <AnimatePresence>
        {isAboutAiOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[2px]"
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-[520px] bg-white rounded-[24px] p-6 sm:p-7 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#2F4156]" />
                  <h3 className="font-bold text-[18px] text-[#0F172A]">
                    Oralytic AI Vision Core v2.4
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAboutAiOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-3.5 text-[13px] text-slate-600 leading-relaxed">
                <p>
                  Model Oralytic menggunakan arsitektur deep learning multi-tahap (Vision Transformer + Mask R-CNN) yang dioptimalkan untuk deteksi karies, erosi email, akumulasi plak, dan gingivitis pada populasi anak & maternal di Indonesia.
                </p>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col gap-2">
                  <div className="flex justify-between font-medium">
                    <span>Dataset Latih:</span>
                    <span className="font-bold text-slate-800">15.400+ citra klinis teranotasi</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Sensitivitas Karies:</span>
                    <span className="font-bold text-emerald-700">94.8% (Sp.KGA concordant)</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Kesesuaian WHO Z-Score:</span>
                    <span className="font-bold text-emerald-700">100% Standar Antropometri</span>
                  </div>
                </div>

                <p className="text-[12px] text-slate-500 italic">
                  *AI berperan sebagai asisten skrining awal (*decision support*), validasi akhir tetap berada di bawah wewenang dokter/tenaga kesehatan ber-STR.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAboutAiOpen(false)}
                  className="h-10 px-5 rounded-xl bg-[#2F4156] text-white text-[13px] font-semibold hover:bg-[#1E2B38]"
                >
                  Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL KONFIRMASI KELUAR
          ========================================================================= */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-[2px]"
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[420px] bg-white rounded-[24px] p-6 shadow-2xl border border-slate-200 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[18px] text-[#0F172A] mb-1">
                Keluar dari Akun?
              </h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-6">
                Draft pemeriksaan yang belum dikirim ke EMR akan tetap tersimpan aman di perangkat ini.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[13px] hover:bg-slate-50 flex-1"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="h-11 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] shadow-sm flex-1"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
