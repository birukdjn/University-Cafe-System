"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = "https://cafe-api-f9re.onrender.com";

export default function CafeAccessSystem() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [scanMode, setScanMode] = useState("auto");
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchStudents();
    fetchRecentMeals();
    
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const handleKeyPress = (e) => {
      if (scanMode === "auto" && e.key === 'Enter' && studentId.length > 0) {
        handleManualSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [studentId, scanMode]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/students/`);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchRecentMeals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meals/`);
      setRecentMeals(response.data.slice(0, 5));
    } catch (error) {
      console.error("Error fetching meals:", error);
    }
  };

  const getMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 7 && hour < 9) return "breakfast";
    if (hour >= 11 && hour < 13) return "lunch";
    if (hour >= 17 && hour < 20) return "dinner";
    return "closed";
  };

  const getMealTimeStatus = () => {
    const mealType = getMealType();
    const now = new Date();
    const hour = now.getHours();
    
    if (mealType === "closed") {
      const nextMeal = hour < 7 ? "Breakfast (7:00-9:00)" : 
                      hour < 11 ? "Lunch (11:00-13:00)" : 
                      "Dinner (17:00-20:00)";
      return { status: "closed", nextMeal };
    }
    
    return { status: "open", currentMeal: mealType };
  };

  const handleScannedId = async (scannedId) => {
    if (isLoading) return;
    
    setIsLoading(true);
    const cleanId = scannedId.trim().replace(/\s+/g, '');
    
    const student = students.find(s => s.student_id === cleanId);

    if (!student) {
      setMessage("❌ Student not found");
      setStudentInfo(null);
      setIsAllowed(false);
      setIsLoading(false);
      return;
    }

    const mealType = getMealType();

    if (mealType === "closed") {
      setMessage("❌ Café is closed now");
      setStudentInfo(student);
      setIsAllowed(false);
      setIsLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/meals/`, {
        student: student.id,
        meal_type: mealType,
      });
      setMessage(`✅ ${student.name} - ${mealType}`);
      setStudentInfo(student);
      setIsAllowed(true);
      fetchRecentMeals();
    } catch (err) {
      if (err.response?.status === 400) {
        setMessage("❌ Already used meal for this period");
      } else {
        setMessage("❌ Error processing meal");
      }
      setStudentInfo(student);
      setIsAllowed(false);
    } finally {
      setIsLoading(false);
    }

    if (scanMode === "auto") {
      setTimeout(() => {
        setStudentId("");
        inputRef.current?.focus();
      }, 3000);
    }
  };

  const handleManualSubmit = async () => {
    if (!studentId.trim()) {
      setMessage("❌ Please enter Student ID");
      return;
    }
    await handleScannedId(studentId);
    if (scanMode === "manual") {
      setStudentId("");
    }
  };

  const clearDisplay = () => {
    setStudentInfo(null);
    setMessage("");
    setIsAllowed(null);
    setStudentId("");
    inputRef.current?.focus();
  };

  const toggleScanMode = () => {
    setScanMode(scanMode === "manual" ? "auto" : "manual");
    setStudentId("");
    inputRef.current?.focus();
  };

  const mealStatus = getMealTimeStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 touch-manipulation">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            🎓 Café Access System
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              mealStatus.status === "open" 
                ? "bg-green-100 text-green-800 border-green-300" 
                : "bg-red-100 text-red-800 border-red-300"
            }`}>
              {mealStatus.status === "open" 
                ? `🟢 ${mealStatus.currentMeal.toUpperCase()} TIME` 
                : `🔴 CLOSED - Next: ${mealStatus.nextMeal}`
              }
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-sm font-mono">
              📍 cafe-api-f9re.onrender.com
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Scanner */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Scanner Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Student ID Scanner
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setScanMode("manual")}
                    className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 border touch-manipulation ${
                      scanMode === "manual" 
                        ? "bg-blue-600 text-white border-blue-700 shadow-md" 
                        : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => setScanMode("auto")}
                    className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm rounded-lg transition-all duration-200 border touch-manipulation ${
                      scanMode === "auto" 
                        ? "bg-green-600 text-white border-green-700 shadow-md" 
                        : "bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300"
                    }`}
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Scanner Input */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                  <input
                    ref={inputRef}
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder={
                      scanMode === "auto" 
                        ? "Scan Student ID (auto-submits)" 
                        : "Enter or scan Student ID then press Submit"
                    }
                    className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg text-center font-mono bg-white touch-manipulation"
                    disabled={isLoading}
                  />
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleManualSubmit}
                      disabled={isLoading || !studentId.trim()}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-indigo-700 touch-manipulation text-sm sm:text-base"
                    >
                      {isLoading ? "⏳ Processing..." : "Submit ID"}
                    </button>
                    <button
                      onClick={clearDisplay}
                      className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-gray-600 touch-manipulation text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={clearDisplay}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 border border-gray-600 touch-manipulation"
                  >
                    🗑️ Clear All
                  </button>
                  <button
                    onClick={toggleScanMode}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 border border-purple-600 touch-manipulation"
                  >
                    {scanMode === "auto" ? "🔁 Manual" : "🔁 Auto"}
                  </button>
                  <button
                    onClick={fetchStudents}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 border border-blue-600 touch-manipulation"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => {
                      setStudentId("TEST123");
                      if (scanMode === "auto") handleManualSubmit();
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 border border-green-600 touch-manipulation"
                  >
                    🧪 Test
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Meals */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📋 Recent Meal Logs
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                {recentMeals.map((meal, index) => (
                  <div key={meal.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">{meal.student_name}</div>
                      <div className="text-xs text-gray-600">{meal.student_id} • {meal.meal_type}</div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {new Date(meal.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {recentMeals.length === 0 && (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    No recent meals logged
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Status Display */}
          <div className="space-y-4 sm:space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">
                Access Status
              </h2>

              <div className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ${
                isAllowed === true ? 'border-green-500 bg-green-50 shadow-green-100' :
                isAllowed === false ? 'border-red-500 bg-red-50 shadow-red-100' :
                'border-gray-300 bg-gray-50'
              }`}>
                {studentInfo ? (
                  <div className="text-center">
                    <div className={`text-4xl sm:text-6xl mb-3 sm:mb-4 ${
                      isAllowed ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isAllowed ? '✅' : '❌'}
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 gap-2 text-sm sm:text-base">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Name:</span>
                          <span className="text-gray-800 font-medium">{studentInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Student ID:</span>
                          <span className="text-gray-800 font-mono">{studentInfo.student_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Department:</span>
                          <span className="text-gray-800">{studentInfo.department || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Year:</span>
                          <span className="text-gray-800">Year {studentInfo.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">Meal Type:</span>
                          <span className="text-gray-800 capitalize">{getMealType()}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`text-lg sm:text-xl font-bold mb-3 ${
                      isAllowed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isAllowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </div>

                    {message && (
                      <p className="text-sm sm:text-base font-medium text-gray-700 bg-white/50 rounded-lg p-2 border">
                        {message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-6 sm:py-8">
                    <div className="text-3xl sm:text-4xl mb-3">
                      {scanMode === "auto" ? "🔍" : "👆"}
                    </div>
                    <p className="text-sm sm:text-base font-medium mb-2">
                      {scanMode === "auto" 
                        ? "Ready for scanning..." 
                        : "Enter or scan Student ID"
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">
                      Student information will appear here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Scanner Mode:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    scanMode === "auto" ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"
                  }`}>
                    {scanMode === "auto" ? "Auto" : "Manual"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Time:</span>
                  <span className="text-sm font-mono text-gray-800">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meal Period:</span>
                  <span className="text-sm font-semibold capitalize text-gray-800">
                    {getMealType()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Students:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {students.length} registered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}