import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import type { ScreeningRecord } from '../../types';
import { EASE_OUT, formatDate } from './ui';

interface PatientGrowthChartProps {
  patientRecords: ScreeningRecord[];
}

const W = 680;
const H = 300;
const M = { top: 24, right: 24, bottom: 44, left: 48 };
const CW = W - M.left - M.right;
const CH = H - M.top - M.bottom;
const MIN_Z = -4;
const MAX_Z = 3;

const zoneColor = (z: number) => (z < -3 ? '#B5524A' : z < -2 ? '#C08A2E' : '#3F8F6B');

export const PatientGrowthChart = ({ patientRecords }: PatientGrowthChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const records = useMemo(
    () =>
      patientRecords
        .filter((r) => r.healthReport.heightForAgeZScore !== null && r.healthReport.heightForAgeZScore !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [patientRecords]
  );

  if (records.length < 2) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[#2B3B4E]/15 bg-white/50 p-5">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#567c8d]" strokeWidth={1.75} />
        <div>
          <p className="text-[15px] font-semibold text-[#2B3B4E]">Kurva membutuhkan minimal dua kunjungan</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#6B7684]">
            Pasien ini baru memiliki satu catatan TB/U. Lakukan pengukuran ulang pada kunjungan berikutnya agar tren pertumbuhan dapat dibandingkan.
          </p>
        </div>
      </div>
    );
  }

  const times = records.map((r) => new Date(r.date).getTime());
  const minT = Math.min(...times);
  const range = Math.max(...times) - minT || 1;
  const x = (t: number) => ((t - minT) / range) * CW;
  const y = (z: number) => CH - ((Math.max(MIN_Z, Math.min(MAX_Z, z)) - MIN_Z) / (MAX_Z - MIN_Z)) * CH;

  const points = records.map((r) => ({
    x: x(new Date(r.date).getTime()),
    y: y(r.healthReport.heightForAgeZScore!),
    z: r.healthReport.heightForAgeZScore!,
    date: r.date,
    height: r.patientData.height,
    weight: r.patientData.weight,
  }));

  // Smooth monotone-ish curve using cubic segments
  const linePath = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = arr[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, '');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${CH} L ${points[0].x},${CH} Z`;

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.z - first.z;
  const TrendIcon = delta > 0.1 ? TrendingUp : delta < -0.1 ? TrendingDown : Minus;
  const trendText = delta > 0.1 ? 'Membaik' : delta < -0.1 ? 'Menurun' : 'Stabil';
  const trendColor = delta > 0.1 ? 'text-[#2F6F52]' : delta < -0.1 ? 'text-[#933F38]' : 'text-[#556170]';

  const hp = hovered !== null ? points[hovered] : null;

  return (
    <div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="Grafik tren Z-score tinggi menurut umur">
          <defs>
            <linearGradient id="growthArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#567c8d" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#567c8d" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g transform={`translate(${M.left}, ${M.top})`}>
            {/* WHO bands */}
            <rect x={0} y={y(MAX_Z)} width={CW} height={y(-2) - y(MAX_Z)} fill="#3F8F6B" fillOpacity={0.05} />
            <rect x={0} y={y(-2)} width={CW} height={y(-3) - y(-2)} fill="#C08A2E" fillOpacity={0.08} />
            <rect x={0} y={y(-3)} width={CW} height={y(MIN_Z) - y(-3)} fill="#B5524A" fillOpacity={0.08} />

            {[-4, -3, -2, -1, 0, 1, 2, 3].map((z) => (
              <g key={z}>
                <line
                  x1={0}
                  x2={CW}
                  y1={y(z)}
                  y2={y(z)}
                  stroke={z === -2 ? '#C08A2E' : z === -3 ? '#B5524A' : '#2B3B4E'}
                  strokeOpacity={z === -2 || z === -3 ? 0.55 : z === 0 ? 0.25 : 0.08}
                  strokeDasharray={z === -2 || z === -3 ? '4 4' : undefined}
                />
                <text x={-12} y={y(z)} dy="0.32em" textAnchor="end" className="fill-[#8A96A3] text-[11px] tabular-nums">
                  {z > 0 ? `+${z}` : z}
                </text>
              </g>
            ))}

            <text x={CW} y={y(-2) - 6} textAnchor="end" className="fill-[#8C6420] text-[11px] font-semibold">
              Batas stunting −2 SD
            </text>
            <text x={CW} y={y(-3) - 6} textAnchor="end" className="fill-[#933F38] text-[11px] font-semibold">
              Stunting berat −3 SD
            </text>

            {points.map((p, i) => (
              <text key={`d-${i}`} x={p.x} y={CH + 24} textAnchor="middle" className="fill-[#6B7684] text-[11px]">
                {formatDate(p.date, { day: 'numeric', month: 'short', year: '2-digit' })}
              </text>
            ))}

            <motion.path
              d={areaPath}
              fill="url(#growthArea)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <motion.path
              d={linePath}
              fill="none"
              stroke="#2F4156"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: EASE_OUT }}
            />

            {hp && (
              <line x1={hp.x} x2={hp.x} y1={0} y2={CH} stroke="#2F4156" strokeOpacity={0.2} strokeDasharray="3 3" />
            )}

            {points.map((p, i) => (
              <g key={`p-${i}`}>
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  fill="#FFFFFF"
                  stroke={zoneColor(p.z)}
                  strokeWidth={2.5}
                  initial={{ r: 0 }}
                  animate={{ r: hovered === i ? 7 : 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: hovered === null ? 0.35 + i * 0.12 : 0 }}
                />
                {/* Larger invisible hit area */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              </g>
            ))}
          </g>
        </svg>

        <AnimatePresence>
          {hp && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-[#1E2B38] px-3 py-2 text-white shadow-lg"
              style={{
                left: `${((hp.x + M.left) / W) * 100}%`,
                top: `${((hp.y + M.top - 14) / H) * 100}%`,
              }}
            >
              <p className="text-[11px] text-white/60">{formatDate(hp.date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-[14px] font-bold tabular-nums">{hp.z.toFixed(2)} SD</p>
              <p className="text-[11px] text-white/70 tabular-nums">
                {hp.height} cm · {hp.weight} kg
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <dl className="mt-4 grid grid-cols-3 divide-x divide-[#2B3B4E]/10 rounded-2xl border border-[#2B3B4E]/10 bg-white/60">
        <div className="px-4 py-3">
          <dt className="text-[12px] text-[#6B7684]">Kunjungan pertama</dt>
          <dd className="mt-0.5 text-[16px] font-bold text-[#2B3B4E] tabular-nums">{first.z.toFixed(2)} SD</dd>
          <dd className="text-[12px] text-[#8A96A3]">{formatDate(first.date)}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[12px] text-[#6B7684]">Kunjungan terakhir</dt>
          <dd className="mt-0.5 text-[16px] font-bold text-[#2B3B4E] tabular-nums">{last.z.toFixed(2)} SD</dd>
          <dd className="text-[12px] text-[#8A96A3]">{formatDate(last.date)}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[12px] text-[#6B7684]">Perubahan</dt>
          <dd className={`mt-0.5 flex items-center gap-1.5 text-[16px] font-bold tabular-nums ${trendColor}`}>
            <TrendIcon className="h-4 w-4" strokeWidth={2.25} />
            {delta > 0 ? '+' : ''}
            {delta.toFixed(2)}
          </dd>
          <dd className="text-[12px] text-[#8A96A3]">{trendText}</dd>
        </div>
      </dl>
    </div>
  );
};
