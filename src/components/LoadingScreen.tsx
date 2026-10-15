import { useState, useEffect, type ReactElement } from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps): ReactElement => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulasi loading dari 0 hingga 100%
    const duration = 2500; // 2.5 detik
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 400); // Beri jeda sedikit setelah 100% sebelum pindah
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.main
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="absolute inset-0 flex flex-col items-center bg-white px-6 py-10 overflow-hidden"
      aria-label="Memuat data lokal"
    >
      <div className="flex flex-col items-center w-full max-w-md mt-12 gap-12">
        
        {/* Logo with Framer Motion LayoutID for smooth shared transition */}
        <motion.img
          layoutId="oralytic-logo"
          animate={{ opacity: [1, 0.55, 1] }}
          transition={{
            layout: { duration: 1.3, ease: [0.16, 1, 0.3, 1] },
            opacity: { duration: 1.3, times: [0, 0.35, 1], ease: "easeInOut" }
          }}
          className="w-[140px] h-[175px] object-contain"
          alt="Oralytic Logo"
          src={logo}
        />

        {/* Text Section (Fade up and in) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center gap-5"
        >
          <h1 className="font-bold text-2xl sm:text-[26px] text-center leading-snug tracking-tight">
            <span className="text-[#0F172A]">Kesehatan mulut adalah </span>
            <span className="text-[#2F4156] font-extrabold underline decoration-[#2F4156]/30 decoration-2 underline-offset-4">penanda gizi </span>
            <span className="text-[#0F172A]">yang paling sering terlewat.</span>
          </h1>

          <p className="font-normal text-[#64748B] text-[15px] sm:text-[16px] text-center leading-relaxed max-w-[420px]">
            Prevalensi karies pada anak usia di bawah 9 tahun mencapai 92,6%,
            sementara program pencegahan stunting masih berfokus pada nutrisi saja.
          </p>
        </motion.div>

        {/* Progress Bar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-3.5 mt-4 w-full max-w-[240px]"
        >
          {/* Animated Progress Bar (0 to 100%) */}
          <div
            className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/60"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#2F4156] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <div className="flex items-center justify-between w-full px-1">
            <p className="font-semibold text-slate-400 text-[11px] tracking-wider uppercase">
              Memuat Data
            </p>
            <p className="font-bold text-[#0F172A] text-[13px] tabular-nums">
              {progress}%
            </p>
          </div>
        </motion.div>

      </div>
    </motion.main>
  );
};
