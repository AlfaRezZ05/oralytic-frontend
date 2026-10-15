import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LoaderCircle, CircleAlert, Check, UserRound, Ruler, ClipboardList, ScanLine } from 'lucide-react';
import type { ScreeningRecord, PatientData, StuntingScreeningData, OralIssue, GrowthStatus } from '../../types';
import { calculateStuntingStatus, calculateWeightStatus, calculateWastingStatus } from '../../services/stuntingCalculator';
import { saveScreeningRecord } from '../../services/apiService';
import { EASE_OUT } from './ui';

interface NewScreeningModalProps {
  onClose: () => void;
  onRecordAdded: (record: ScreeningRecord) => void;
}

type OralPreset = 'healthy' | 'caries' | 'gingivitis' | 'severe';

const ORAL_PRESETS: { key: OralPreset; title: string; desc: string; tone: string }[] = [
  { key: 'healthy', title: 'Sehat', desc: 'Gigi utuh, gingiva merah muda', tone: '#3F8F6B' },
  { key: 'caries', title: 'Karies dentin', desc: 'Kavitas aktif pada molar sulung', tone: '#B5524A' },
  { key: 'gingivitis', title: 'Gingivitis', desc: 'Gusi meradang, plak tinggi', tone: '#C08A2E' },
  { key: 'severe', title: 'Karies + gingivitis', desc: 'Lesi multipel, nyeri kunyah', tone: '#933F38' },
];

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
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('2021-06-15');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [weight, setWeight] = useState('12.5');
  const [height, setHeight] = useState('89.0');
  const [headCircumference, setHeadCircumference] = useState('47.5');
  const [armCircumference, setArmCircumference] = useState('13.5');

  const [exclusiveBreastfeeding, setExclusiveBreastfeeding] = useState<'yes' | 'no'>('yes');
  const [brushingFrequency, setBrushingFrequency] = useState('1x sehari');
  const [dentalPain, setDentalPain] = useState<'yes' | 'no'>('no');
  const [sweetSnacks, setSweetSnacks] = useState<'yes' | 'no'>('yes');

  const [oralConditionPreset, setOralConditionPreset] = useState<OralPreset>('caries');
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

  const handleSubmit = async (e: FormEvent) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="new-screening-title">
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
        className="relative flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] bg-white text-[#0F172A] shadow-[0_30px_80px_rgba(0,0,0,0.2)] border border-slate-200/80"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-7 py-5 bg-white">
          <div>
            <h2 id="new-screening-title" className="text-[22px] font-bold tracking-tight text-[#0F172A]">
              Skrining baru
            </h2>
            <p className="mt-0.5 text-[14px] text-[#64748B]">Z-score WHO dihitung otomatis setelah data disimpan.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-8 overflow-y-auto px-7 py-7">
            <Step n={1} icon={UserRound} title="Identitas anak">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NIK" required>
                  <input
                    className={`${inputCls} font-mono tabular-nums`}
                    inputMode="numeric"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="16 digit"
                  />
                </Field>
                <Field label="Nama lengkap" required>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama anak" />
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

            <div className="h-px bg-slate-100" />

            <Step n={3} icon={ClipboardList} title="Kebiasaan">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Frekuensi sikat gigi">
                  <select className={inputCls} value={brushingFrequency} onChange={(e) => setBrushingFrequency(e.target.value)}>
                    <option value="2x sehari (pagi & malam)">2x sehari (pagi &amp; malam)</option>
                    <option value="1x sehari">1x sehari</option>
                    <option value="Jarang / tidak tentu">Jarang / tidak tentu</option>
                  </select>
                </Field>
                <Field label="Nyeri saat mengunyah">
                  <Segmented
                    name="pain"
                    value={dentalPain}
                    onChange={setDentalPain}
                    options={[
                      { value: 'no', label: 'Tidak' },
                      { value: 'yes', label: 'Ada' },
                    ]}
                  />
                </Field>
                <Field label="ASI eksklusif 6 bulan">
                  <Segmented
                    name="asi"
                    value={exclusiveBreastfeeding}
                    onChange={setExclusiveBreastfeeding}
                    options={[
                      { value: 'yes', label: 'Ya' },
                      { value: 'no', label: 'Tidak' },
                    ]}
                  />
                </Field>
                <Field label="Camilan / minuman manis">
                  <Segmented
                    name="sweet"
                    value={sweetSnacks}
                    onChange={setSweetSnacks}
                    options={[
                      { value: 'no', label: 'Jarang' },
                      { value: 'yes', label: 'Hampir tiap hari' },
                    ]}
                  />
                </Field>
              </div>
            </Step>

            <div className="h-px bg-slate-100" />

            <Step n={4} icon={ScanLine} title="Temuan rongga mulut">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {ORAL_PRESETS.map((p) => {
                  const active = oralConditionPreset === p.key;
                  return (
                    <motion.button
                      key={p.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setOralConditionPreset(p.key)}
                      whileTap={{ scale: 0.98 }}
                      className={`relative flex items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors ${
                        active ? 'border-[#2F4156] bg-slate-50/60 ring-2 ring-[#2F4156]/15' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          active ? 'border-[#2F4156] bg-[#2F4156]' : 'border-slate-300'
                        }`}
                      >
                        <AnimatePresence>
                          {active && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[15px] font-semibold text-[#0F172A]">
                          <span className="h-2 w-2 rounded-full" style={{ background: p.tone }} />
                          {p.title}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-[#64748B]">{p.desc}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </Step>
          </div>

          <div className="flex items-center gap-3 border-t border-slate-200 bg-slate-50/80 px-7 py-4">
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: [0, -4, 4, -2, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
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
              className="ml-auto h-11 rounded-xl px-5 text-[14px] font-semibold text-slate-600 transition-colors hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-xl bg-[#2F4156] px-6 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1E2B38] disabled:opacity-60"
            >
              {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              Simpan skrining
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
