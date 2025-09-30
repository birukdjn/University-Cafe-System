"use client";

import { useState } from "react";
import RegistrationForm from "./registration-form";
import CafeAccessSystem from "./cafe-access-system";

export default function MainApp() {
  const [currentView, setCurrentView] = useState("access"); // "access" or "registration"

  return (
    <div>
      {/* Navigation */}
      <nav className="bg-blue-800 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">University Café System</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView("access")}
              className={`px-4 py-2 rounded-lg transition ${
                currentView === "access" 
                  ? "bg-white text-blue-800" 
                  : "bg-blue-700 hover:bg-blue-600"
              }`}
            >
              🏠 Café Access
            </button>
            <button
              onClick={() => setCurrentView("registration")}
              className={`px-4 py-2 rounded-lg transition ${
                currentView === "registration" 
                  ? "bg-white text-blue-800" 
                  : "bg-blue-700 hover:bg-blue-600"
              }`}
            >
              📝 Student Registration
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === "access" && <CafeAccessSystem />}
      {currentView === "registration" && <RegistrationForm />}
    </div>
  );
}