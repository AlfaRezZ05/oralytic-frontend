import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type Tone = 'ok' | 'warn' | 'risk' | 'neutral';

export const TONE_STYLES: Record<Tone, { dot: string; text: string; soft: string; bar: string }> = {
  ok: { dot: 'bg-[#3F8F6B]', text: 'text-[#2F6F52]', soft: 'bg-[#3F8F6B]/10', bar: '#3F8F6B' },
  warn: { dot: 'bg-[#C08A2E]', text: 'text-[#8C6420]', soft: 'bg-[#C08A2E]/12', bar: '#C08A2E' },
  risk: { dot: 'bg-[#B5524A]', text: 'text-[#933F38]', soft: 'bg-[#B5524A]/10', bar: '#B5524A' },
  neutral: { dot: 'bg-[#8A96A3]', text: 'text-[#556170]', soft: 'bg-black/5', bar: '#8A96A3' },
};

/** Maps any nutrition / oral / WHO status string onto a visual tone. */
export const toneOf = (status: string | undefined | null): Tone => {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s.includes('bukan')) return 'ok';
  if (
    s.includes('referral') || s.includes('rujukan') || s.includes('stunt') || s.includes('pendek') ||
    s.includes('buruk') || s.includes('kurang') || s.includes('kek') && !s.includes('bukan')
  ) return 'risk';
  if (s.includes('monitoring') || s.includes('risk') || s.includes('risiko') || s.includes('pemantauan')) return 'warn';
  return 'ok';
};

const LABELS: Record<string, string> = {
  Normal: 'Normal',
  Healthy: 'Sehat',
  'Needs Monitoring': 'Perlu pemantauan',
  'Needs Referral': 'Perlu rujukan',
  'At Risk of Caries': 'Berisiko karies',
};

export const statusLabel = (status: string) => LABELS[status] ?? status;

export const StatusTag = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) => {
  const tone = TONE_STYLES[toneOf(status)];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${tone.soft} ${tone.text} font-semibold whitespace-nowrap ${
        size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {statusLabel(status)}
    </span>
  );
};

/** Number that counts up once it scrolls into view. */
export const CountUp = ({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 1.1,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {display.toFixed(decimals)}
    </span>
  );
};

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('id-ID', opts);

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
