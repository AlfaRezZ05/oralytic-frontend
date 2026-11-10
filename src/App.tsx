import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "./components/SplashScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { OnboardingSteps } from "./components/OnboardingSteps";
import { LoginScreen } from "./components/LoginScreen";
import { ScreeningDashboard } from "./components/ScreeningDashboard";
import { getAuthSession, logoutFromBackend } from "./services/apiService";

type ScreenType = "splash" | "loading" | "steps" | "login" | "dashboard";

const STORAGE_KEY = "oralytic_active_screen";
const SESSION_SPLASH_KEY = "oralytic_splash_shown_session";

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    try {
      // 1. Prioritaskan jika pengguna sudah memiliki sesi login aktif (Nakes terautentikasi)
      const session = getAuthSession();
      if (session?.token) {
        return "dashboard";
      }

      // 2. Cek apakah di sesi browser/tab ini splash screen sudah pernah ditampilkan
      const hasSeenSplashThisSession = sessionStorage.getItem(SESSION_SPLASH_KEY);
      
      // Jika tab/web baru dibuka (belum login & belum lihat splash), tampilkan splash screen
      if (!hasSeenSplashThisSession) {
        return "splash";
      }

      // 3. Jika dalam sesi yang sama (misal user refresh di layar login/steps):
      const hash = window.location.hash.replace("#/", "").replace("#", "");
      if (["loading", "steps", "login", "dashboard"].includes(hash)) {
        return hash as ScreenType;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ["loading", "steps", "login", "dashboard"].includes(saved)) {
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
      // Tandai bahwa splash screen sudah dilewati dalam sesi ini
      if (newScreen !== "splash") {
        sessionStorage.setItem(SESSION_SPLASH_KEY, "true");
      }
      // Sinkronkan juga hash di URL
      window.location.hash = `/${newScreen}`;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (currentScreen === "splash") {
      const session = getAuthSession();
      const timer = setTimeout(() => {
        try {
          sessionStorage.setItem(SESSION_SPLASH_KEY, "true");
        } catch {
          // ignore
        }
        // Jika sudah ada sesi login, langsung lompat ke dashboard
        if (session?.token) {
          changeScreen("dashboard");
        } else {
          changeScreen("loading");
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleLogout = async () => {
    await logoutFromBackend();
    changeScreen("login");
  };

  return (
    <div className="relative w-full h-screen bg-white font-sans antialiased text-[#1E293B] flex flex-col overflow-hidden">
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
            className="w-full h-screen flex flex-col flex-1 overflow-hidden"
          >
            <ScreeningDashboard onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
