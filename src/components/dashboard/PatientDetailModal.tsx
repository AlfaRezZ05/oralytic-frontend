import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  Send,
  Ruler,
  Weight,
  HeartPulse,
  Stethoscope,
  ClipboardList,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
  ScanLine,
} from 'lucide-react';
import type { ScreeningRecord } from '../../types';
import { sendRecordToEMR } from '../../services/apiService';
import { EASE_OUT, StatusTag, formatDate, initials, toneOf, TONE_STYLES } from './ui';

interface PatientDetailModalProps {
  record: ScreeningRecord;
  onClose: () => void;
}

type TabKey = 'growth' | 'oral' | 'plan';

const TABS: { key: TabKey; label: string; icon: typeof HeartPulse }[] = [
  { key: 'growth', label: 'Pertumbuhan & gizi', icon: HeartPulse },
  { key: 'oral', label: 'Rongga mulut', icon: Stethoscope },
  { key: 'plan', label: 'Kesimpulan & tindak lanjut', icon: ClipboardList },
];

const fmtZ = (z: number | null | undefined) => (z === null || z === undefined ? '—' : `${z > 0 ? '+' : ''}${z.toFixed(2)}`);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-3 text-[13px] font-semibold text-[#6B7684]">{children}</h3>
);

export const PatientDetailModal = ({ record, onClose }: PatientDetailModalProps) => {
  const [tab, setTab] = useState<TabKey>('growth');
  const [emrState, setEmrState] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');
  const { patientData, healthReport, oralAnalyses, stuntingData } = record;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSendToEMR = async () => {
    setEmrState('sending');
    const res = await sendRecordToEMR(record);
    setEmrState(res.success ? 'done' : 'failed');
  };

  const issues = oralAnalyses.flatMap((a) => a.analysisResult?.issues ?? []);

  const indices = [
    { label: 'TB/U', hint: 'Tinggi menurut umur', z: healthReport.heightForAgeZScore, status: healthReport.stuntingStatus },
    { label: 'BB/U', hint: 'Berat menurut umur', z: healthReport.weightForAgeZScore, status: healthReport.weightStatus },
    { label: 'BB/TB', hint: 'Berat menurut tinggi', z: healthReport.wastingZScore, status: healthReport.wastingStatus },
  ];

  const habits = [
    { label: 'Menyikat gigi', value: stuntingData?.brushingFrequency || '—' },
    { label: 'Nyeri saat mengunyah', value: stuntingData?.dentalPain === 'yes' ? 'Ada keluhan' : 'Tidak ada' },
    { label: 'ASI eksklusif 6 bulan', value: stuntingData?.exclusiveBreastfeeding === 'yes' ? 'Ya' : 'Tidak' },
    { label: 'Tidur sambil minum botol', value: stuntingData?.sleepWithBottle === 'yes' ? 'Sering' : 'Tidak' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <motion.div
        className="absolute inset-0 bg-[#0F172A]/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="relative flex h-full w-full max-w-[720px] flex-col bg-white text-[#0F172A] shadow-[-24px_0_60px_rgba(0,0,0,0.15)]"
      >
        {/* Header */}
        <div className="flex items-start gap-4 border-b border-slate-200 px-7 pb-5 pt-6">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#2F4156] text-[15px] font-bold text-white">
            {initials(patientData.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="detail-title" className="truncate text-[22px] font-bold tracking-tight text-[#0F172A]">
              {patientData.name}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#64748B]">
              <span className="font-mono tabular-nums">{patientData.nik}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{patientData.gender === 'Male' ? 'Laki-laki' : 'Perempuan'}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>Diperiksa {formatDate(record.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 px-5" role="tablist">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`relative flex items-center gap-2 px-3 py-3.5 text-[14px] font-semibold transition-colors ${
                tab === key ? 'text-[#0F172A]' : 'text-slate-400 hover:text-[#0F172A]'
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {label}
              {tab === key && (
                <motion.span layoutId="detail-tab" className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-[#2F4156]" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="space-y-7"
            >
              {tab === 'growth' && (
                <>
                  <section>
                    <SectionTitle>Antropometri</SectionTitle>
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
                      {[
                        { label: 'Tinggi badan', value: patientData.height, unit: 'cm', icon: Ruler },
                        { label: 'Berat badan', value: patientData.weight, unit: 'kg', icon: Weight },
                        { label: 'Lingkar lengan', value: patientData.armCircumference, unit: 'cm', icon: Ruler },
                        { label: 'Lingkar kepala', value: patientData.headCircumference, unit: 'cm', icon: Ruler },
                      ].map(({ label, value, unit, icon: Icon }) => (
                        <div key={label} className="bg-slate-50 px-4 py-3.5">
                          <p className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                            {label}
                          </p>
                          <p className="mt-1 text-[20px] font-bold tabular-nums text-[#0F172A]">
                            {value || '—'}
                            <span className="ml-1 text-[13px] font-medium text-slate-400">{unit}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <SectionTitle>Indeks antropometri WHO</SectionTitle>
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60">
                      {indices.map((idx, i) => {
                        const z = idx.z ?? 0;
                        const pct = ((Math.max(-4, Math.min(3, z)) + 4) / 7) * 100;
                        const tone = TONE_STYLES[toneOf(idx.status)];
                        return (
                          <div key={idx.label} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 px-4 py-4">
                            <div>
                              <p className="text-[15px] font-bold">{idx.label}</p>
                              <p className="text-[12px] text-[#8A96A3]">{idx.hint}</p>
                            </div>
                            <div>
                              <div className="relative h-2 rounded-full bg-gradient-to-r from-[#B5524A]/25 via-[#C08A2E]/25 to-[#3F8F6B]/25">
                                {idx.z !== null && idx.z !== undefined && (
                                  <motion.span
                                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${tone.dot} shadow`}
                                    initial={{ left: '57%' }}
                                    animate={{ left: `${pct}%` }}
                                    transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: EASE_OUT }}
                                  />
                                )}
                              </div>
                              <div className="mt-1.5 flex justify-between text-[10px] text-[#8A96A3] tabular-nums">
                                <span>−4</span>
                                <span>−2</span>
                                <span>0</span>
                                <span>+3</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[16px] font-bold tabular-nums">{fmtZ(idx.z)}</p>
                              <p className={`text-[12px] font-medium ${tone.text}`}>{idx.status || '—'}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between px-4 py-3.5">
                        <div>
                          <p className="text-[15px] font-bold">LiLA</p>
                          <p className="text-[12px] text-[#8A96A3]">Lingkar lengan atas</p>
                        </div>
                        <StatusTag status={healthReport.lilaStatus || 'Normal'} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle>Catatan klinis</SectionTitle>
                    <p className="text-[15px] leading-relaxed text-[#334155]">{healthReport.nutritionReason || '—'}</p>
                  </section>
                </>
              )}

              {tab === 'oral' && (
                <>
                  <section className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <div>
                      <p className="text-[13px] text-[#64748B]">Status rongga mulut</p>
                      <p className="mt-2 text-[15px] leading-relaxed text-[#334155]">{healthReport.oralReason || '—'}</p>
                    </div>
                    <StatusTag status={healthReport.oralResult} size="md" />
                  </section>

                  <section>
                    <SectionTitle>Temuan pemeriksaan ({issues.length})</SectionTitle>
                    {issues.length > 0 ? (
                      <ol className="space-y-2.5">
                        {issues.map((issue, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.35, ease: EASE_OUT }}
                            className="flex gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                          >
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#B5524A]/10 text-[#933F38]">
                              <ScanLine className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[15px] font-semibold leading-snug text-[#0F172A]">{issue.diseaseName}</p>
                              <p className="mt-1 text-[14px] leading-relaxed text-[#64748B]">{issue.description}</p>
                            </div>
                          </motion.li>
                        ))}
                      </ol>
                    ) : (
                      <p className="flex items-center gap-2 text-[15px] text-[#2F6F52]">
                        <CircleCheck className="h-4 w-4" /> Tidak ada lesi karies atau peradangan gusi yang terdeteksi.
                      </p>
                    )}
                  </section>

                  <section>
                    <SectionTitle>Kebiasaan dari kuesioner</SectionTitle>
                    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                      {habits.map((h) => (
                        <div key={h.label} className="flex items-center justify-between border-b border-slate-100 py-3">
                          <dt className="text-[14px] text-[#64748B]">{h.label}</dt>
                          <dd className="text-[14px] font-semibold text-[#0F172A]">{h.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </>
              )}

              {tab === 'plan' && (
                <>
                  <section>
                    <SectionTitle>Kesimpulan</SectionTitle>
                    <p className="border-l-2 border-[#2F4156] pl-4 text-[16px] leading-relaxed text-[#1E293B]">
                      {healthReport.conclusion || '—'}
                    </p>
                  </section>

                  <section>
                    <SectionTitle>Rencana tindak lanjut</SectionTitle>
                    <ol className="space-y-3">
                      {(healthReport.recommendations ?? []).map((rec, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.35, ease: EASE_OUT }}
                          className="flex gap-3.5"
                        >
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[13px] font-bold tabular-nums text-[#2F4156]">
                            {i + 1}
                          </span>
                          <p className="pt-0.5 text-[15px] leading-relaxed text-[#334155]">{rec}</p>
                        </motion.li>
                      ))}
                    </ol>
                  </section>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/80 px-7 py-4">
          <AnimatePresence mode="wait">
            {emrState === 'done' || emrState === 'failed' ? (
              <motion.p
                key="emr-msg"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mr-auto flex items-center gap-2 text-[13px] font-medium ${
                  emrState === 'done' ? 'text-[#2F6F52]' : 'text-[#8C6420]'
                }`}
              >
                {emrState === 'done' ? <CircleCheck className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                {emrState === 'done' ? 'Terkirim ke EMR' : 'Server EMR belum terhubung'}
              </motion.p>
            ) : (
              <span key="spacer" className="mr-auto" />
            )}
          </AnimatePresence>

          <button
            onClick={() => window.print()}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Cetak
          </button>
          <button
            onClick={handleSendToEMR}
            disabled={emrState === 'sending'}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#2F4156] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#1E2B38] disabled:opacity-60"
          >
            {emrState === 'sending' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Kirim ke EMR
          </button>
        </div>
      </motion.aside>
    </div>
  );
};
