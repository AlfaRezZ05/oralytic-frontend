import { useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import gambar
import phoneImg from "../assets/phone.png";
import step2Img from "../assets/phone.png";
import step3Img from "../assets/phone.png";

interface OnboardingStepsProps {
  onFinish: () => void;
}

const ONBOARDING_DATA = [
  {
    id: 1,
    image: phoneImg,
    title: "Cukup foto, tanpa alat mahal",
    desc: "Panduan oval di layar menuntun posisi kamera. Aplikasi memeriksa cahaya, fokus, dan jarak sebelum Anda menekan tombol, jadi foto yang buruk tidak sampai ikut dianalisis."
  },
  {
    id: 2,
    image: step2Img,
    title: "AI menunjukkan seberapa yakin",
    desc: "Setiap temuan datang dengan angka keyakinan. Kalau modelnya ragu, angkanya rendah dan diberi tanda perlu verifikasi. Anda tahu mana yang bisa dipercaya dan mana yang harus diperiksa langsung."
  },
  {
    id: 3,
    image: step3Img,
    title: "Keputusan tetap di tangan anda",
    desc: "Aplikasi ini alat skrining, bukan alat diagnosis. Laporan tidak bisa dikirim ke pasien sebelum setiap temuan Anda setujui atau koreksi, dan nama Anda yang tercatat sebagai penanggung jawab."
  }
];

export const OnboardingSteps = ({ onFinish }: OnboardingStepsProps): ReactElement => {
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = ONBOARDING_DATA[stepIndex];
  const progressPercent = ((stepIndex + 1) / ONBOARDING_DATA.length) * 100;

  const handleNext = () => {
    if (stepIndex < ONBOARDING_DATA.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onFinish();
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ x: "-35%", opacity: 0, filter: "blur(4px)" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex flex-col items-center bg-white px-6 py-10 overflow-hidden overflow-y-auto"
    >
      <div className="flex flex-col items-center w-full max-w-[460px] h-full min-h-[85vh] mt-4">

        {/* Kotak Ilustrasi dengan Transisi Animasi */}
        <div className="relative w-full h-[380px] sm:h-[420px] bg-slate-50 border border-slate-200/80 rounded-[40px] shadow-sm flex items-center justify-center p-6 overflow-hidden">
          <div className="absolute w-[220px] h-[220px] bg-[#2F4156]/5 rounded-full blur-[35px] bottom-4 left-10" />

          <AnimatePresence mode="wait">
            <motion.img
              key={currentStep.id}
              src={currentStep.image}
              alt={currentStep.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-[90%] max-w-[320px] object-contain drop-shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML += `<div class="z-10 text-slate-400 text-sm text-center">Export grup gambar untuk langkah ${currentStep.id}<br/>menjadi ${currentStep.image.split('/').pop()}<br/>dan letakkan di src/assets/</div>`;
              }}
            />
          </AnimatePresence>
        </div>

        {/* Teks Penjelasan dengan Animasi */}
        <div className="flex flex-col w-full text-left mt-8 gap-3 px-2 min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              <h2 className="font-bold text-[22px] sm:text-[25px] text-[#0F172A] tracking-tight leading-snug">
                {currentStep.title}
              </h2>
              <p className="text-[15px] sm:text-[16px] text-[#64748B] leading-relaxed font-normal">
                {currentStep.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex-grow" />

        {/* Bagian Bawah: Tombol & Step Bar */}
        <div className="flex flex-col w-full items-center gap-7 mt-6 mb-4">

          <button
            onClick={handleNext}
            className="w-full max-w-[280px] h-[50px] bg-[#2F4156] hover:bg-[#1E2B38] transition-colors rounded-xl flex items-center justify-center text-white font-bold text-base shadow-[0_4px_14px_rgba(47,65,86,0.22)] cursor-pointer active:scale-95"
          >
            Lanjut
          </button>

          {/* Step Progress Bar Dinamis */}
          <div className="flex flex-col items-center gap-2.5 w-full max-w-[220px]">
            <div className="w-full h-[8px] bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
              <motion.div
                className="h-full bg-[#2F4156] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            <span className="text-[12px] text-slate-400 font-medium tracking-wide uppercase">
              Langkah {currentStep.id} dari {ONBOARDING_DATA.length}
            </span>
          </div>

        </div>
      </div>
    </motion.main>
  );
};
