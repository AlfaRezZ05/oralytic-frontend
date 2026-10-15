import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "./components/SplashScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { OnboardingSteps } from "./components/OnboardingSteps";
import { LoginScreen } from "./components/LoginScreen";
import { ScreeningDashboard } from "./components/ScreeningDashboard";

type ScreenType = "splash" | "loading" | "steps" | "login" | "dashboard";

const STORAGE_KEY = "oralytic_active_screen";

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    // 1. Cek dari hash URL (misal: #/dashboard atau #/login)
    const hash = window.location.hash.replace("#/", "").replace("#", "");
    if (["splash", "loading", "steps", "login", "dashboard"].includes(hash)) {
      return hash as ScreenType;
    }

    // 2. Cek dari localStorage agar ketika direfresh tidak mulai dari awal
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["steps", "login", "dashboard"].includes(saved)) {
        return saved as ScreenType;
      }
    } catch {
      // ignore
    }

    return "splash";
  });

  const changeScreen = (newScreen: ScreenType) => {
    setCurrentScreen(newScreen);
    try {
      localStorage.setItem(STORAGE_KEY, newScreen);
      // Sinkronkan juga hash di URL
      window.location.hash = `/${newScreen}`;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (currentScreen === "splash") {
      const timer = setTimeout(() => {
        changeScreen("loading");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  return (
    <div
      className={`relative w-full min-h-screen bg-white font-sans antialiased text-[#1E293B] ${
        currentScreen === "dashboard" ? "overflow-y-auto" : "overflow-hidden"
      }`}
    >
      <AnimatePresence mode="wait">
        {currentScreen === "splash" && <SplashScreen key="splash" />}
        {currentScreen === "loading" && (
          <LoadingScreen key="loading" onComplete={() => changeScreen("steps")} />
        )}
        {currentScreen === "steps" && (
          <OnboardingSteps key="steps" onFinish={() => changeScreen("login")} />
        )}
        {currentScreen === "login" && (
          <LoginScreen key="login" onLogin={() => changeScreen("dashboard")} />
        )}
        {currentScreen === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full min-h-screen"
          >
            <ScreeningDashboard onLogout={() => changeScreen("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
