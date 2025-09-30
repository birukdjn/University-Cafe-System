"use client";

import { useState, useEffect } from "react";
import RegistrationForm from "./registration-form";
import CafeAccessSystem from "./cafe-access-system";
import AnalyticsDashboard from "./analytics-dashboard";

export default function MainApp() {
  const [currentView, setCurrentView] = useState("access");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { id: "access", label: "🏠 Access", fullLabel: "🏠 Café Access", icon: "🏠" },
    { id: "registration", label: "📝 Register", fullLabel: "📝 Student Registration", icon: "📝" },
    { id: "analytics", label: "📊 Stats", fullLabel: "📊 Analytics", icon: "📊" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 touch-manipulation">
      {/* Navigation */}
      <nav className="bg-blue-800 text-white p-3 sm:p-4 sticky top-0 z-50 shadow-lg backdrop-blur-sm bg-blue-800/95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <h1 className="text-lg sm:text-xl font-bold text-center sm:text-left text-white">
            🎓 University Café System
          </h1>
          <div className="flex gap-1 sm:gap-2 w-full sm:w-auto justify-center">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 flex-1 sm:flex-none touch-manipulation ${
                  currentView === item.id 
                    ? "bg-white text-blue-800 font-semibold shadow-md" 
                    : "bg-blue-700 hover:bg-blue-600 active:bg-blue-500 text-white"
                }`}
              >
                {isMobile ? item.label : item.fullLabel}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-6">
        {currentView === "access" && <CafeAccessSystem />}
        {currentView === "registration" && <RegistrationForm />}
        {currentView === "analytics" && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-3 px-4 text-center">
        <p className="text-xs sm:text-sm text-gray-300">
          University Café System © {new Date().getFullYear()} | 
          <span className="text-green-400 ml-2 font-mono">API: cafe-api-f9re.onrender.com</span>
        </p>
      </footer>
    </div>
  );
}