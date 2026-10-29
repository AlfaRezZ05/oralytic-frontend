import type { ReactElement } from "react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

export const SplashScreen = (): ReactElement => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-white px-6 py-10"
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <motion.img
          layoutId="oralytic-logo"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="h-[220px] w-[180px] object-contain"
          src={logo}
          alt="Oralytic Logo"
        />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.4 } }}
          className="text-[20px] font-black tracking-[0.2em] text-[#0F172A] uppercase"
        >
          ORALYTIC
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.32, duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.4 } }}
          className="text-[14px] sm:text-[15px] font-normal leading-relaxed text-[#64748B] max-w-[320px]"
        >
          Skrining risiko stunting melalui analisis
          <br />
          kesehatan rongga mulut.
        </motion.p>
      </div>
    </motion.div>
  );
};
