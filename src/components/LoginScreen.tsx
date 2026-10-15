import { useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";

import logoImage from "../assets/logo.png";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps): ReactElement => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Register state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [strNumber, setStrNumber] = useState("");
  const [healthFacility, setHealthFacility] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful registration and automatically proceed to dashboard
    onLogin();
  };

  return (
    <motion.main
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 flex w-full bg-white items-center justify-center lg:justify-end px-6 sm:px-12 lg:px-24 xl:px-36 py-10 overflow-hidden overflow-y-auto"
    >
      {/* Kiri: Dekorasi Logo Besar */}
      <motion.div 
        initial={{ opacity: 0, x: -60, scale: 0.95 }}
        animate={{ opacity: 0.06, x: 0, scale: 1 }}
        transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-20 sm:-left-28 md:-left-36 lg:-left-44 bottom-[-8%] sm:bottom-[-4%] md:bottom-[-2%] lg:bottom-[-4%] w-[520px] sm:w-[640px] md:w-[740px] lg:w-[860px] pointer-events-none select-none z-0"
      >
        <div className="w-full overflow-hidden" style={{ aspectRatio: "806 / 720" }}>
          <img 
            src={logoImage} 
            alt="Oralytic Emblem" 
            className="w-full h-auto object-cover object-top"
          />
        </div>
      </motion.div>

      {/* Kanan: Wrapper Form & Judul */}
      <motion.div 
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px] flex flex-col my-auto py-4"
      >
        
        {/* Teks Judul */}
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="font-bold text-[28px] lg:text-[32px] text-[#0F172A] tracking-tight leading-tight">
            {activeTab === "login" ? "Selamat datang" : "Daftar akun tenaga medis"}
          </h1>
          <p className="text-[14px] lg:text-[15px] text-[#64748B] leading-relaxed">
            {activeTab === "login"
              ? "Masuk untuk melanjutkan skrining pasien dan memvalidasi laporan yang menunggu"
              : "Lengkapi data kredensial medis Anda untuk memulai skrining risiko stunting di fasilitas kesehatan"}
          </p>
        </div>

        {/* Card Form */}
        <div className="w-full bg-white border border-slate-200/90 rounded-[28px] shadow-[0_20px_50px_rgba(15,23,42,0.08)] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
          
          {/* Tab Switcher (Masuk / Daftar) */}
          <div className="flex w-full bg-slate-100 rounded-xl p-1 h-[46px] items-center mb-5">
            <button 
              type="button"
              onClick={() => setActiveTab("login")}
              className={`flex-1 h-full rounded-lg text-[14px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-white text-[#0F172A] font-bold shadow-sm"
                  : "text-slate-500 hover:text-[#0F172A]"
              }`}
            >
              Masuk
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab("register")}
              className={`flex-1 h-full rounded-lg text-[14px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                activeTab === "register"
                  ? "bg-white text-[#0F172A] font-bold shadow-sm"
                  : "text-slate-500 hover:text-[#0F172A]"
              }`}
            >
              Daftar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                  {/* Input Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                      Email
                    </label>
                    <input 
                      type="email" 
                      defaultValue="dokter@klinik.com"
                      required
                      placeholder="nama@faskes.id"
                      className="w-full h-[48px] bg-slate-50/70 rounded-xl px-4 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Input Kata Sandi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                      Kata Sandi
                    </label>
                    <input 
                      type="password" 
                      defaultValue="123456"
                      required
                      placeholder="••••••••"
                      className="w-full h-[48px] bg-slate-50/70 rounded-xl px-4 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Tombol Masuk & Keterangan */}
                  <div className="flex flex-col gap-3 mt-2">
                    <button 
                      type="submit"
                      className="w-full h-[48px] bg-[#2F4156] hover:bg-[#1E2B38] transition-colors rounded-xl flex items-center justify-center text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(47,65,86,0.22)] active:scale-[0.98] cursor-pointer"
                    >
                      Masuk ke akun
                    </button>

                    <p className="text-[12px] text-slate-500 text-center px-2 leading-relaxed">
                      Akun sudah terisi otomatis. Tekan <span className="font-bold text-[#0F172A]">Masuk ke akun</span> untuk melanjutkan
                    </p>
                  </div>
                </form>

                {/* Lupa Kata Sandi */}
                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    className="text-[12px] font-semibold text-[#2F4156] hover:underline transition-colors cursor-pointer"
                  >
                    Lupa kata sandi?
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3.5"
              >
                <form className="flex flex-col gap-3.5" onSubmit={handleRegisterSubmit}>
                  
                  {/* 1. Nama depan & belakang */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                        Nama Depan <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Contoh: Sarah"
                        className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                        Nama Belakang
                      </label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Contoh: Rahmawati"
                        className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* 2. Nomor STR */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[12px] font-bold text-[#334155] tracking-wider uppercase">
                        Nomor STR (Surat Tanda Registrasi) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">16 digit</span>
                    </div>
                    <input 
                      type="text" 
                      required
                      value={strNumber}
                      onChange={(e) => setStrNumber(e.target.value.replace(/[^0-9]/g, ""))}
                      maxLength={16}
                      placeholder="Contoh: 3578012345678901"
                      className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400 font-mono"
                    />
                  </div>

                  {/* 3. Fasilitas Kesehatan */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                      Fasilitas Kesehatan <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={healthFacility}
                      onChange={(e) => setHealthFacility(e.target.value)}
                      placeholder="Contoh: Puskesmas Gayungan / RSUD Dr. Soetomo"
                      className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* 4. Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="dokter@puskesmas.go.id"
                      className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* 5. Kata Sandi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-bold text-[#334155] ml-1 tracking-wider uppercase">
                      Kata Sandi <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="password" 
                      required
                      minLength={6}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full h-[46px] bg-slate-50/70 rounded-xl px-3.5 text-[14px] text-[#0F172A] outline-none border border-slate-200 focus:bg-white focus:border-[#2F4156] focus:ring-4 focus:ring-[#2F4156]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Tombol Buat Akun */}
                  <div className="flex flex-col gap-2 mt-3">
                    <button 
                      type="submit"
                      className="w-full h-[48px] bg-[#2F4156] hover:bg-[#1E2B38] transition-colors rounded-xl flex items-center justify-center text-white font-bold text-[15px] shadow-[0_4px_14px_rgba(47,65,86,0.22)] active:scale-[0.98] cursor-pointer"
                    >
                      Daftar akun tenaga medis
                    </button>
                    <p className="text-[11.5px] text-slate-500 text-center leading-relaxed">
                      Dengan mendaftar, Anda menyatakan bahwa data SIP/STR yang diinputkan adalah valid sesuai standar Kemenkes.
                    </p>
                  </div>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </motion.main>
  );
};
