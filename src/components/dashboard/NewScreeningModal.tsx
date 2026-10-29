import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LoaderCircle,
  CircleAlert,
  Check,
  UserRound,
  Ruler,
  Camera,
} from 'lucide-react';
import type { ScreeningRecord, PatientData, StuntingScreeningData, OralIssue, GrowthStatus } from '../../types';
import { calculateStuntingStatus, calculateWeightStatus, calculateWastingStatus } from '../../services/stuntingCalculator';
import { saveScreeningRecord } from '../../services/apiService';
import { EASE_OUT } from './ui';

interface NewScreeningModalProps {
  onClose: () => void;
  onRecordAdded: (record: ScreeningRecord) => void;
}

type OralPreset = 'healthy' | 'caries' | 'gingivitis' | 'severe';

const ANGLE_TABS = [
  { id: 'depan', label: 'Depan' },
  { id: 'oklusal_atas', label: 'Oklusal Atas' },
  { id: 'oklusal_bawah', label: 'Oklusal Bawah' },
  { id: 'bukal_kanan', label: 'Bukal Kanan' },
  { id: 'bukal_kiri', label: 'Bukal Kiri' },
] as const;

type AngleId = (typeof ANGLE_TABS)[number]['id'];

const ANGLE_GUIDES: Record<AngleId, string> = {
  depan: 'Posisikan gigi depan dan gusi di dalam panduan oval',
  oklusal_atas: 'Posisikan permukaan kunyah gigi rahang atas',
  oklusal_bawah: 'Posisikan permukaan kunyah gigi rahang bawah',
  bukal_kanan: 'Posisikan gigi dan gusi sisi pipi kanan',
  bukal_kiri: 'Posisikan gigi dan gusi sisi pipi kiri',
};

const inputCls =
  'h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-[#0F172A] outline-none transition-shadow placeholder:text-slate-400 focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10';

const Field = ({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) => (
  <label className="block">
    <span className="mb-1.5 block text-[13px] font-semibold text-[#475569]">
      {label}
      {required && <span className="ml-0.5 text-[#B5524A]">*</span>}
    </span>
    {children}
  </label>
);

const Segmented = <T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  name: string;
}) => (
  <div className="relative flex rounded-xl bg-slate-100 p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        aria-pressed={value === o.value}
        className={`relative z-10 flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
          value === o.value ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        {value === o.value && (
          <motion.span
            layoutId={`seg-${name}`}
            className="absolute inset-0 -z-10 rounded-lg bg-white shadow-sm"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        {o.label}
      </button>
    ))}
  </div>
);

const Step = ({ n, icon: Icon, title, children }: { n: number; icon: typeof UserRound; title: string; children: ReactNode }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.08 + n * 0.06, duration: 0.4, ease: EASE_OUT }}
    className="grid gap-4 sm:grid-cols-[180px_1fr]"
  >
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#2F4156] text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[12px] font-medium text-[#64748B] tabular-nums">Bagian {n}</p>
        <p className="text-[15px] font-bold leading-tight text-[#0F172A]">{title}</p>
      </div>
    </div>
    <div>{children}</div>
  </motion.section>
);

export const NewScreeningModal = ({ onClose, onRecordAdded }: NewScreeningModalProps) => {
  // Alur 3 Langkah Sesuai Desain Figma:
  // 1 = Data Pasien, 2 = Foto rongga mulut, 3 = Menganalisis
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Langkah 1: Data Pasien
  const [patientCategory, setPatientCategory] = useState<'Anak' | 'Ibu Hamil'>('Anak');
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('2021-06-15');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [weight, setWeight] = useState('12.5');
  const [height, setHeight] = useState('89.0');
  const [headCircumference, setHeadCircumference] = useState('47.5');
  const [armCircumference, setArmCircumference] = useState('13.5');

  const exclusiveBreastfeeding = 'yes';
  const brushingFrequency = '1x sehari';
  const dentalPain = 'no';
  const sweetSnacks = 'yes';

  // Langkah 2: Foto Rongga Mulut
  const [selectedAngle, setSelectedAngle] = useState<AngleId>('depan');
  const [capturedAngles, setCapturedAngles] = useState<Record<string, string>>({});
  const [isFlashing, setIsFlashing] = useState(false);
  const oralConditionPreset: OralPreset = 'caries';

  // Langkah 3: Menganalisis
  const [analysisProgress, setAnalysisProgress] = useState(70);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const calculateAgeInMonths = (dobStr: string): number => {
    if (!dobStr) return 24;
    const birth = new Date(dobStr);
    const today = new Date();
    let months = (today.getFullYear() - birth.getFullYear()) * 12;
    months -= birth.getMonth();
    months += today.getMonth();
    if (today.getDate() < birth.getDate()) months--;
    return Math.max(0, months);
  };

  // Validasi Step 1 dan lanjut ke Step 2 (Kamera)
  const handleProceedToCamera = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{16}$/.test(nik.trim())) {
      setError('NIK harus terdiri dari 16 digit angka.');
      return;
    }
    if (!name.trim() || !height || !weight) {
      setError('Lengkapi nama, tinggi badan, dan berat badan pasien.');
      return;
    }
    setCurrentStep(2);
  };

  // Selesai Step 2 & lanjut ke Step 3 (Menganalisis)
  const handleStartAnalysis = () => {
    setCurrentStep(3);
    // Jalankan timer animasi progress
    let p = 70;
    const interval = setInterval(() => {
      p += 2;
      if (p >= 100) {
        clearInterval(interval);
        setAnalysisProgress(100);
      } else {
        setAnalysisProgress(p);
      }
    }, 400);
  };

  // Ambil foto sudut: otomatis lanjut sendiri ke posisi selanjutnya
  const handleCapturePhoto = () => {
    // Efek flash visual shutter kamera
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 220);

    setCapturedAngles((prev) => {
      const updated = {
        ...prev,
        [selectedAngle]: 'captured',
      };

      // Cari indeks posisi sudut saat ini
      const currentIndex = ANGLE_TABS.findIndex((tab) => tab.id === selectedAngle);

      if (currentIndex !== -1 && currentIndex < ANGLE_TABS.length - 1) {
        // Otomatis berpindah ke sudut berikutnya
        const nextAngle = ANGLE_TABS[currentIndex + 1].id;
        setSelectedAngle(nextAngle);
      } else {
        // Jika sudah di sudut terakhir, periksa apakah ada sudut sebelumnya yang terlewat
        const uncaptured = ANGLE_TABS.find((tab) => !updated[tab.id]);
        if (uncaptured) {
          setSelectedAngle(uncaptured.id);
        } else {
          // Seluruh 5 sudut foto sudah lengkap terambil!
          // Beri jeda 600ms agar user melihat centang terakhir lalu otomatis lanjut ke proses analisis
          setTimeout(() => {
            handleStartAnalysis();
          }, 600);
        }
      }

      return updated;
    });
  };

  // Simpan record resmi dan kembali ke dashboard
  const handleFinalizeRecord = async () => {
    setIsSubmitting(true);
    try {
      const ageMonths = calculateAgeInMonths(dob);
      const heightNum = parseFloat(height);
      const weightNum = parseFloat(weight);

      const stuntingResult = calculateStuntingStatus(ageMonths, heightNum, gender);
      const weightResult = calculateWeightStatus(ageMonths, weightNum, gender);
      const wastingResult = calculateWastingStatus(heightNum, weightNum, gender);

      let oralIssues: OralIssue[] = [];
      let oralResult: 'Healthy' | 'At Risk of Caries' | 'Needs Referral' = 'Healthy';
      let oralReason = 'Rongga mulut dan gusi terpantau sehat tanpa tanda karies aktif.';

      if (oralConditionPreset === 'caries') {
        oralResult = 'Needs Referral';
        oralReason = 'Terdeteksi lesi karies aktif pada permukaan oklusal gigi sulung.';
        oralIssues = [
          {
            diseaseName: 'Dental caries on pit and fissure surface penetrating into dentin',
            description: 'Karies kavitas aktif menembus dentin pada gigi molar sulung.',
            boundingBox: { x: 38, y: 44, width: 22, height: 26 },
          },
        ];
      } else if (oralConditionPreset === 'gingivitis') {
        oralResult = 'At Risk of Caries';
        oralReason = 'Terdeteksi akumulasi plak dan radang gusi ringan (gingivitis).';
        oralIssues = [
          {
            diseaseName: 'Acute gingivitis',
            description: 'Marginal gingiva kemerahan dengan perdarahan saat probing.',
            boundingBox: { x: 40, y: 60, width: 20, height: 20 },
          },
        ];
      } else if (oralConditionPreset === 'severe') {
        oralResult = 'Needs Referral';
        oralReason = 'Karies ganda disertai nyeri kunyah kronis dan peradangan gusi.';
        oralIssues = [
          {
            diseaseName: 'Dental caries on pit and fissure surface penetrating into dentin',
            description: 'Karies dentin aktif multipel.',
            boundingBox: { x: 32, y: 35, width: 28, height: 30 },
          },
          {
            diseaseName: 'Acute gingivitis',
            description: 'Radang gusi akut interdental.',
            boundingBox: { x: 45, y: 62, width: 24, height: 22 },
          },
        ];
      }

      const isStunted = (stuntingResult.zScore ?? 0) < -2;
      const nutritionResult: 'Needs Referral' | 'Needs Monitoring' | 'Normal' = isStunted
        ? 'Needs Referral'
        : (stuntingResult.zScore ?? 0) < -1
        ? 'Needs Monitoring'
        : 'Normal';
      const nutritionReason = isStunted
        ? `Tinggi menurut Umur (TB/U) Z-Score ${stuntingResult.zScore?.toFixed(2)} SD berada di bawah ambang batas -2 SD (Kategori Pendek / Stunting).`
        : `Tinggi menurut Umur Z-Score ${stuntingResult.zScore?.toFixed(2)} SD dalam rentang pertumbuhan normal.`;

      const conclusion =
        isStunted && oralResult !== 'Healthy'
          ? 'Ditemukan perawakan pendek (stunting) yang diperberat oleh gangguan pengunyahan akibat masalah gigi anak.'
          : isStunted
          ? 'Pasien terindikasi perawakan pendek (stunting). Diperlukan intervensi PMT dan evaluasi asupan protein hewani.'
          : oralResult !== 'Healthy'
          ? 'Pertumbuhan tinggi normal, namun terindikasi masalah gigi aktif yang perlu segera ditangani dokter gigi.'
          : 'Pertumbuhan anak dan kebersihan rongga mulut dalam kondisi baik.';

      const recommendations = [
        oralResult !== 'Healthy'
          ? 'Rujuk ke Poli Gigi / Dokter Gigi Spesialis Anak untuk perawatan lesi karies.'
          : 'Lakukan kontrol rutin kesehatan gigi setiap 6 bulan sekali.',
        isStunted
          ? 'Konsultasi Poli Gizi Puskesmas untuk pemberian Makanan Tambahan (PMT) kaya protein hewani.'
          : 'Pertahankan pola makan bergizi seimbang 3x sehari.',
        'Edukasi orang tua mengenai sikat gigi 2x sehari dengan pasta gigi berfluoride seukuran biji beras.',
      ];

      const patientDataObj: PatientData = {
        nik: nik.trim(),
        name: name.trim(),
        dob,
        gender,
        weight,
        height,
        headCircumference,
        armCircumference,
        pregnancyStatus: patientCategory === 'Ibu Hamil' ? 'Pregnant' : 'Not Pregnant',
      };

      const stuntingDataObj: StuntingScreeningData = {
        ageGroup: ageMonths > 24 ? '>24' : '0-24',
        exclusiveBreastfeeding,
        sugarInFormula: sweetSnacks,
        mpasiStartDate: '6',
        mpasiMenu: ['Nasi', 'Ikan', 'Telur'],
        mpasiTexture: 'Padat',
        snackFrequency: '2x',
        snackType: 'Biskuit / Buah',
        sweetDrinkFrequency: sweetSnacks === 'yes' ? 'Sering' : 'Jarang',
        sleepWithBottle: 'no',
        gumCleaningStartDate: '12',
        useSpecialToothpaste: 'yes',
        mainMealsPerDay: '3x',
        dailyDietIncludes: ['Nasi', 'Lauk', 'Sayur'],
        isPickyEater: 'no',
        pickyEaterFoods: '',
        snackFrequencyOutside: 'Kadang',
        favoriteSnack: 'Buah',
        weeklyConsumption: { soda: 'Tidak', packagedSnacks: 'Jarang', sweets: 'Kadang', fastFood: 'Tidak' },
        brushingFrequency,
        brushingHabits: ['Pagi dan malam'],
        dentalPain,
      };

      const oralAnalysesObj = [
        {
          imageBase64: '',
          analysisResult: {
            hygieneAssessment: (oralResult === 'Healthy' ? 'Good' : 'Fair') as 'Good' | 'Fair' | 'Poor',
            issues: oralIssues,
          },
        },
      ];

      const growthStatus: GrowthStatus = isStunted ? 'Perawakan Pendek' : 'Tinggi Badan Sesuai Usia';

      const newRecord: ScreeningRecord = {
        id: `ORL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString(),
        patientCategory,
        validationStatus: oralIssues.length > 0 ? 'pending' : 'validated',
        patientData: patientDataObj,
        stuntingData: stuntingDataObj,
        oralAnalyses: oralAnalysesObj,
        healthReport: {
          nutritionResult,
          stuntingStatus: stuntingResult.status,
          heightForAgeZScore: stuntingResult.zScore,
          weightStatus: weightResult.status,
          weightForAgeZScore: weightResult.zScore,
          wastingStatus: wastingResult.status,
          wastingZScore: wastingResult.zScore,
          lilaStatus: parseFloat(armCircumference) < 14 ? 'Gizi Kurang (< 14 cm)' : 'Normal (≥ 14 cm)',
          growthStatus,
          bmi: parseFloat((weightNum / Math.pow(heightNum / 100, 2)).toFixed(1)),
          bmiStatus: 'Normal',
          nutritionReason,
          oralResult,
          oralReason,
          conclusion,
          recommendations,
        },
      };

      await saveScreeningRecord(newRecord);
      onRecordAdded(newRecord);
      onClose();
    } catch (err) {
      console.error('Error saving screening record:', err);
      setError('Catatan gagal disimpan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true">
      <motion.div
        className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[28px] bg-[#F7F4F0] text-[#0F172A] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-slate-200/80"
      >
        {/* Dynamic Step Transitions with AnimatePresence */}
        <AnimatePresence mode="wait">
          {/* =========================================================================
              LANGKAH 1 DARI 3: DATA PASIEN
              ========================================================================= */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col h-full overflow-hidden"
            >
            <div className="flex items-center justify-between border-b border-slate-200/80 px-7 py-5 bg-white">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#64748B] uppercase">
                  LANGKAH 1 DARI 3
                </span>
                <h2 className="text-[24px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  Data Pasien
                </h2>
                <p className="mt-0.5 text-[13px] text-[#64748B]">
                  Isi hanya yang diperlukan untuk analisis. Sisanya dapat dilengkapi setelah laporan keluar.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProceedToCamera} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-7 overflow-y-auto px-7 py-7 bg-white">
                {/* JALUR PERAWATAN */}
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider">
                    Jalur Perawatan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPatientCategory('Anak')}
                      className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        patientCategory === 'Anak'
                          ? 'bg-[#DDE6ED] border-[#2F4156] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-[15px] text-[#0F172A]">Anak</span>
                      <span className="text-[12px] text-slate-600">Usia 0 - 9 tahun</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientCategory('Ibu Hamil')}
                      className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                        patientCategory === 'Ibu Hamil'
                          ? 'bg-[#DDE6ED] border-[#2F4156] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-[15px] text-[#0F172A]">Ibu Hamil</span>
                      <span className="text-[12px] text-slate-600">Trimester 1 - 3</span>
                    </button>
                  </div>
                </div>

                <Step n={1} icon={UserRound} title={patientCategory === 'Ibu Hamil' ? 'Identitas ibu' : 'Identitas anak'}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="NIK" required>
                      <input
                        className={`${inputCls} font-mono tabular-nums`}
                        inputMode="numeric"
                        maxLength={16}
                        value={nik}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                        placeholder="16 digit angka"
                      />
                    </Field>
                    <Field label="Nama lengkap" required>
                      <input
                        className={inputCls}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                      />
                    </Field>
                    <Field label="Tanggal lahir" required>
                      <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
                    </Field>
                    <Field label="Jenis kelamin" required>
                      <Segmented
                        name="gender"
                        value={gender}
                        onChange={setGender}
                        options={[
                          { value: 'Male', label: 'Laki-laki' },
                          { value: 'Female', label: 'Perempuan' },
                        ]}
                      />
                    </Field>
                  </div>
                </Step>

                <div className="h-px bg-slate-100" />

                <Step n={2} icon={Ruler} title="Antropometri">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                      { label: 'Tinggi (cm)', v: height, s: setHeight, req: true },
                      { label: 'Berat (kg)', v: weight, s: setWeight, req: true },
                      { label: 'LiLA (cm)', v: armCircumference, s: setArmCircumference },
                      { label: 'Ling. kepala (cm)', v: headCircumference, s: setHeadCircumference },
                    ].map((f) => (
                      <Field key={f.label} label={f.label} required={f.req}>
                        <input
                          type="number"
                          step="0.1"
                          className={`${inputCls} tabular-nums`}
                          value={f.v}
                          onChange={(e) => f.s(e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                </Step>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50 px-7 py-4">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
                      exit={{ opacity: 0 }}
                      className="mr-auto flex items-center gap-2 text-[13px] font-medium text-red-600"
                    >
                      <CircleAlert className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto h-11 rounded-xl px-5 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-11 items-center gap-2 rounded-xl bg-[#2F4156] px-6 text-[14px] font-semibold text-white shadow-sm hover:bg-[#1E2B38] transition-colors cursor-pointer"
                >
                  Simpan & Lanjut ke Kamera
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* =========================================================================
            LANGKAH 2 DARI 3: FOTO RONGGA MULUT (Sesuai Gambar 1 Figma)
            ========================================================================= */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col h-full p-6 sm:p-8 bg-[#ECE6E0]/60 overflow-y-auto"
          >
            {/* Header Langkah 2 */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[12px] font-bold tracking-widest text-[#64748B] uppercase block">
                  LANGKAH 2 DARI 3
                </span>
                <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  Foto rongga mulut
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Angle Tabs Kapsul dengan Smooth Animated Pill */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {ANGLE_TABS.map((tab) => {
                const isSelected = selectedAngle === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedAngle(tab.id)}
                    className={`relative px-4 py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer select-none ${
                      isSelected
                        ? 'text-white'
                        : 'bg-[#4A7285] text-white/90 hover:bg-[#3D6071]'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="active-angle-pill"
                        className="absolute inset-0 rounded-full bg-[#5B6B79] shadow-sm -z-0"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Grid 2 Kolom: Viewfinder Kiri & Stack Thumbnail Kanan */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              {/* Kolom Kiri: Viewfinder Kamera */}
              <div className="flex flex-col gap-4">
                <div className="relative w-full aspect-[4/3] max-h-[440px] bg-white rounded-[28px] border border-slate-200/80 shadow-sm flex flex-col items-center justify-center p-6 overflow-hidden">
                  {/* Efek Shutter Flash saat foto diambil */}
                  <AnimatePresence>
                    {isFlashing && (
                      <motion.div
                        initial={{ opacity: 0.85 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="absolute inset-0 bg-white z-20 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Oval Panduan Putus-putus dengan Panduan Dinamis Sesuai Posisi */}
                  <div className="relative w-[340px] max-w-[85%] h-[200px] border-2 border-dashed border-[#0F172A] rounded-[50%] flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                    <motion.p
                      key={selectedAngle}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-[14px] text-[#475569] font-medium leading-relaxed max-w-[240px]"
                    >
                      {ANGLE_GUIDES[selectedAngle] || 'Posisikan gigi dan gusi di dalam panduan oval'}
                    </motion.p>
                  </div>

                  {/* Indikator Cahaya & Fokus (Kiri Bawah Viewfinder) */}
                  <div className="absolute left-6 bottom-6 flex flex-col gap-2">
                    <div className="inline-flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-full shadow-xs border border-slate-200 text-[12px] font-semibold text-[#475569]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Cahaya cukup
                    </div>
                    <div className="inline-flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-full shadow-xs border border-slate-200 text-[12px] font-semibold text-[#475569]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Kamera fokus
                    </div>
                  </div>

                  {/* Tombol Shutter (Tengah Bawah Viewfinder) dengan Spring Feedback */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-5">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={handleCapturePhoto}
                      title="Ambil Foto (Otomatis Lanjut ke Posisi Berikutnya)"
                      className="w-16 h-16 rounded-full border-3 border-[#3C6E71] bg-white flex items-center justify-center shadow-lg cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full border-2 border-[#2F4156] bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <Camera className="w-5 h-5 text-[#2F4156]" />
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: 5 Thumbnail Slots & Tombol Analisis Foto */}
              <div className="flex md:flex-col items-center justify-between gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {ANGLE_TABS.map((tab, idx) => {
                  const isCaptured = Boolean(capturedAngles[tab.id]);
                  const isCurrent = selectedAngle === tab.id;

                  return (
                    <motion.div
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => setSelectedAngle(tab.id)}
                      title={`Posisi ${idx + 1}: ${tab.label}`}
                      className={`relative w-[78px] h-[78px] sm:w-[84px] sm:h-[84px] rounded-[22px] bg-white flex flex-col items-center justify-center shadow-xs cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-2 border-[#0284C7] ring-4 ring-[#0284C7]/20 shadow-md'
                          : isCaptured
                          ? 'border border-emerald-300 bg-emerald-50/20'
                          : 'border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isCaptured ? (
                        <div className="w-full h-full rounded-[20px] bg-slate-100/90 flex flex-col items-center justify-center text-emerald-600 font-bold text-xs">
                          <Check className="w-6 h-6" />
                          <span className="text-[10px] text-emerald-700 font-medium mt-0.5">{tab.label}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          {/* Ikon Radial Spinner / Dashed Circle persis di Figma */}
                          <svg className={`w-7 h-7 ${isCurrent ? 'text-[#0284C7]' : 'text-slate-400'} animate-spin-slow`} viewBox="0 0 24 24" fill="none">
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeDasharray="4 4"
                            />
                          </svg>
                          <span className={`text-[10px] font-semibold ${isCurrent ? 'text-[#0284C7]' : 'text-slate-500'}`}>
                            {tab.label}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Tombol Analisis Foto */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={handleStartAnalysis}
                  className="w-full mt-2 py-3 px-5 rounded-xl bg-[#4A7285] hover:bg-[#3D6071] text-white font-bold text-[14px] shadow-sm transition-colors cursor-pointer text-center whitespace-nowrap"
                >
                  Analisis Foto
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            LANGKAH 3 DARI 3: MENGANALISIS (Sesuai Gambar 2 Figma)
            ========================================================================= */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full p-8 sm:p-12 bg-[#ECE6E0]/60 min-h-[560px]"
          >
            {/* Header Langkah 3 */}
            <span className="text-[12px] font-bold tracking-widest text-[#64748B] uppercase mb-6">
              LANGKAH 3 DARI 3
            </span>

            {/* Lingkaran Progress Meter 70% Menganalisis */}
            <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#E2E8F0"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#2F4156"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * analysisProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[44px] font-black text-[#0F172A] leading-none">
                  {analysisProgress}
                </span>
                <span className="text-[10px] font-extrabold tracking-widest text-[#64748B] uppercase mt-1">
                  MENGANALISIS
                </span>
              </div>
            </div>

            {/* 5 Kartu Checklist Analisis dengan Staggered Entrance */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08,
                  },
                },
              }}
              initial="hidden"
              animate="show"
              className="w-full max-w-[560px] flex flex-col gap-2.5 mb-8"
            >
              {[
                'Pra-pemrosesan gambar & normalisasi warna',
                'Deteksi area gigi, gusi, lidah, & palatum',
                'Identifikasi karies, plak, & inflamasi gusi',
                'Korelasi dengan profil nutrisi pasien',
                'Penyusunan laporan & rencana aksi',
              ].map((task) => (
                <motion.div
                  key={task}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="bg-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xs border border-slate-200/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-[#5B6B79] text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-[14px] font-medium text-[#1E293B]">{task}</span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#64748B]">Selesai</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Tombol Aksi Bawah */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              disabled={isSubmitting}
              onClick={handleFinalizeRecord}
              className="py-3 px-8 rounded-xl bg-[#4A7285] hover:bg-[#3D6071] text-white font-bold text-[14px] shadow-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              <span>{analysisProgress >= 100 ? 'Selesai & Lihat Laporan' : 'Jalankan di latar belakang'}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
};
