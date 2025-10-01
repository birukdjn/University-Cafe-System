"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cafe-api-f9re.onrender.com";

export default function CafeAccessSystem() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [scanMode, setScanMode] = useState("auto");
  const [scanType, setScanType] = useState("camera"); // "camera", "usb", "manual", "nfc", "biometric"
  const [recentMeals, setRecentMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);
  const scannerRef = useRef(null);
  const [lastDecoded, setLastDecoded] = useState(null);

  // Run on mount and when scanMode/scanType change (avoid rerunning on every keystroke)
  useEffect(() => {
    fetchStudents();
    fetchRecentMeals();

    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Enhanced key handling for various scanner types
    const handleKeyPress = (e) => {
      // Read live input value to avoid stale closure over studentId
      const currentId = inputRef.current?.value ?? studentId;

      // Auto-submit for USB barcode/RFID/magnetic stripe readers
      if (scanMode === "auto" && e.key === 'Enter' && currentId && currentId.length > 0) {
        handleManualSubmit();
      }

      // PIN code entry support (numeric keypads)
      if (e.key >= '0' && e.key <= '9' && scanType === "pin") {
        setStudentId(prev => prev + e.key);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // Intentionally do NOT include studentId so this doesn't rebind on every input change
  }, [scanMode, scanType]);

  // Camera scanner for QR/Barcode
  const startCameraScanner = async () => {
    try {
      if (scannerRef.current && typeof scannerRef.current.clear === 'function') {
        scannerRef.current.clear();
      }

      // Ensure students are loaded before scanning so lookups work immediately
      if (!students || students.length === 0) {
        try {
          await fetchStudents();
        } catch (e) {
          console.warn('Failed to preload students before scanning:', e);
        }
      }

      setIsScanning(true);
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
          // allow library defaults which support QR and barcode scanning
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // log and expose the exact raw decoded text for debugging
          console.debug('QR decoded text:', decodedText);
          setLastDecoded(decodedText);
          handleScannedId(decodedText);
          stopCameraScanner();
        },
        (error) => {
          // non-fatal scanning errors (e.g., no QR in frame)
          // keep scanning; log only in development
          // console.debug("Scan error:", error);
        }
      );
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
      setIsScanning(false);
    }
  };

  const stopCameraScanner = () => {
    try {
      if (scannerRef.current && typeof scannerRef.current.clear === 'function') {
        scannerRef.current.clear();
      }
    } catch (err) {
      // ignore clear errors
      console.warn('Error stopping scanner:', err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  // Ensure scanner is stopped on unmount
  useEffect(() => {
    return () => {
      try {
        if (scannerRef.current && typeof scannerRef.current.clear === 'function') {
          scannerRef.current.clear();
        }
      } catch (err) {
        // ignore
      }
      scannerRef.current = null;
    };
  }, []);

  // Simulate NFC/RFID tap (for demonstration)
  const simulateNFCTap = () => {
    const nfcStudents = students.filter(s => s.student_id.startsWith('NFC'));
    if (nfcStudents.length > 0) {
      const randomStudent = nfcStudents[Math.floor(Math.random() * nfcStudents.length)];
      handleScannedId(randomStudent.student_id);
    } else {
      handleScannedId("NFC2024001"); // Demo NFC ID
    }
  };

  // Simulate biometric scan (for demonstration)
  const simulateBiometricScan = () => {
    const bioStudents = students.filter(s => s.student_id.startsWith('BIO'));
    if (bioStudents.length > 0) {
      const randomStudent = bioStudents[Math.floor(Math.random() * bioStudents.length)];
      handleScannedId(randomStudent.student_id);
    } else {
      handleScannedId("BIO2024001"); // Demo biometric ID
    }
  };

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

  const handleScannedId = async (scannedId) => {
    if (isLoading) return;

    setIsLoading(true);

  // Defensive: if scannedId is an object (some libraries may pass an object), stringify
  let raw = typeof scannedId === 'string' ? scannedId : JSON.stringify(scannedId || '');
  setLastDecoded(raw);

    // Trim & normalize whitespace
    raw = raw.trim();

    // If it's a URL (e.g., https://.../id=STU2024...), try to extract last path segment or id param
    try {
      if (/^https?:\/\//i.test(raw)) {
        try {
          const u = new URL(raw);
          // try `id` query param first
          const idParam = u.searchParams.get('id') || u.searchParams.get('student');
          if (idParam) raw = idParam;
          else raw = u.pathname.split('/').filter(Boolean).pop() || raw;
        } catch (e) {
          // fall back to raw
        }
      }
    } catch (e) {
      // ignore
    }

    // URI-decode if needed
    try { raw = decodeURIComponent(raw); } catch (e) { /* ignore */ }

    // If JSON was embedded, try parse
    try {
      const maybeJson = JSON.parse(raw);
      if (typeof maybeJson === 'object' && maybeJson !== null) {
        // try fields that may contain id
        raw = maybeJson.id || maybeJson.student_id || maybeJson.code || Object.values(maybeJson)[0] || raw;
      }
    } catch (e) {
      // not JSON
    }

    // Final cleaning: remove whitespace and common separators
    let cleanId = raw.replace(/\s+/g, '').replace(/[\-\._]/g, '');

    // Try all format variations
    let student = null;
    for (const format of idFormats) {
      student = students.find(s => s.student_id === format || (s.student_id || '').toUpperCase() === (format || '').toUpperCase());
      if (student) break;

      // Try with STU prefix and uppercase variants
      const pref = format.startsWith('STU') ? format : `STU${format}`;
      student = students.find(s => (s.student_id || '').toUpperCase() === pref.toUpperCase());
      if (student) break;
    }

    // Final fallback: partial match
    if (!student) {
      student = students.find(s => s.student_id.includes(cleanId));
    }

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
      const resp = await axios.post(`${API_URL}/api/meals/`, {
        student: student.id,
        meal_type: mealType,
      });
      setMessage(`✅ ${student.name} - ${mealType}`);
      setStudentInfo(student);
      setIsAllowed(true);
      fetchRecentMeals();
    } catch (err) {
      // show meaningful server error if available
      const serverMsg = err.response?.data?.detail || err.response?.data || err.message;
      if (err.response?.status === 400) {
        setMessage(serverMsg || "❌ Already used meal for this period");
      } else {
        setMessage(serverMsg || "❌ Error processing meal");
      }
      setStudentInfo(student);
      setIsAllowed(false);
    } finally {
      setIsLoading(false);
    }

    // Auto-clear for next scan
    if (scanMode === "auto") {
      setTimeout(() => {
        setStudentId("");
        if (["usb", "manual", "pin"].includes(scanType)) {
          inputRef.current?.focus();
        }
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
    stopCameraScanner();
    inputRef.current?.focus();
  };

  const handleScanTypeChange = (type) => {
    setScanType(type);
    setStudentId("");
    
    if (type === "camera") {
      setTimeout(() => {
        startCameraScanner();
      }, 100);
    } else {
      stopCameraScanner();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const mealStatus = getMealType();
  const isMealTimeOpen = mealStatus !== "closed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4 touch-manipulation">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            🎓 Multi-Method Café Access
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${
              isMealTimeOpen 
                ? "bg-green-100 text-green-800 border-green-300" 
                : "bg-red-100 text-red-800 border-red-300"
            }`}>
              {isMealTimeOpen 
                ? `🟢 ${mealStatus.toUpperCase()} TIME` 
                : `🔴 CLOSED - Next: ${mealStatus === "closed" ? "Breakfast (7:00)" : ""}`
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
                  Universal Access System
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

              {/* Access Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Access Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleScanTypeChange("camera")}
                    className={`p-2 rounded-lg border transition-all duration-200 touch-manipulation text-xs ${
                      scanType === "camera" 
                        ? "bg-purple-600 text-white border-purple-700 shadow-md" 
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    📷 QR/Barcode
                  </button>
                  <button
                    onClick={() => handleScanTypeChange("usb")}
                    className={`p-2 rounded-lg border transition-all duration-200 touch-manipulation text-xs ${
                      scanType === "usb" 
                        ? "bg-blue-600 text-white border-blue-700 shadow-md" 
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    🔌 USB Scanner
                  </button>
                  <button
                    onClick={() => handleScanTypeChange("nfc")}
                    className={`p-2 rounded-lg border transition-all duration-200 touch-manipulation text-xs ${
                      scanType === "nfc" 
                        ? "bg-orange-600 text-white border-orange-700 shadow-md" 
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    📱 NFC/RFID
                  </button>
                  <button
                    onClick={() => handleScanTypeChange("pin")}
                    className={`p-2 rounded-lg border transition-all duration-200 touch-manipulation text-xs ${
                      scanType === "pin" 
                        ? "bg-red-600 text-white border-red-700 shadow-md" 
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    🔢 PIN Code
                  </button>
                </div>
              </div>

              {/* Scanner Input Areas */}
              <div className="space-y-4">
                {/* Camera Scanner */}
                {scanType === "camera" && (
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-purple-300">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-purple-700 mb-2">📷 QR Code & Barcode Scanner</h3>
                      <p className="text-xs text-gray-600">
                        Scan printed cards, digital codes on phones, or loyalty cards
                      </p>
                    </div>
                    <div id="qr-reader" className="w-full"></div>
                    {!isScanning && (
                      <button
                        onClick={startCameraScanner}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-purple-700 touch-manipulation mt-3"
                      >
                        Start Camera Scanner
                      </button>
                    )}
                    {isScanning && (
                      <button
                        onClick={stopCameraScanner}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-red-700 touch-manipulation mt-3"
                      >
                        Stop Camera Scanner
                      </button>
                    )}
                    {/* Debug: show latest decoded payload */}
                    {lastDecoded && (
                      <div className="mt-3 text-xs text-gray-600 font-mono break-words">
                        <strong>Decoded:</strong> {String(lastDecoded)}
                      </div>
                    )}
                  </div>
                )}

                {/* USB Scanner */}
                {scanType === "usb" && (
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-blue-300">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-blue-700 mb-2">🔌 USB Scanner Interface</h3>
                      <p className="text-xs text-gray-600">
                        Compatible with: Barcode scanners, Magnetic stripe readers, RFID USB readers
                      </p>
                    </div>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="Ready for USB scanner input..."
                      className="w-full p-3 sm:p-4 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg text-center font-mono bg-white touch-manipulation"
                      disabled={isLoading}
                    />
                    
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleManualSubmit}
                        disabled={isLoading || !studentId.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-blue-700 touch-manipulation text-sm sm:text-base"
                      >
                        {isLoading ? "⏳ Processing..." : "Submit"}
                      </button>
                      <button
                        onClick={clearDisplay}
                        className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-gray-600 touch-manipulation text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* NFC/RFID Simulator */}
                {scanType === "nfc" && (
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-orange-300">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-orange-700 mb-2">📱 NFC/RFID Tap System</h3>
                      <p className="text-xs text-gray-600">
                        Tap NFC cards, RFID tags, or smart cards (simulated)
                      </p>
                    </div>
                    
                    <div className="text-center py-6">
                      <div className="text-4xl mb-4">📱</div>
                      <p className="text-sm text-gray-600 mb-4">Ready for NFC/RFID tap</p>
                      <button
                        onClick={simulateNFCTap}
                        disabled={isLoading}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-orange-700 touch-manipulation"
                      >
                        {isLoading ? "⏳ Processing..." : "Simulate NFC Tap"}
                      </button>
                    </div>
                  </div>
                )}

                {/* PIN Code Entry */}
                {scanType === "pin" && (
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-red-300">
                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-red-700 mb-2">🔢 PIN Code Entry</h3>
                      <p className="text-xs text-gray-600">
                        Enter numeric PIN code (staff/emergency access)
                      </p>
                    </div>
                    
                    <input
                      ref={inputRef}
                      type="password"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter PIN code..."
                      className="w-full p-3 sm:p-4 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base sm:text-lg text-center font-mono bg-white touch-manipulation"
                      disabled={isLoading}
                      maxLength={6}
                    />
                    
                    {/* Numeric Keypad Simulation */}
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[1,2,3,4,5,6,7,8,9].map(num => (
                        <button
                          key={num}
                          onClick={() => setStudentId(prev => prev + num)}
                          className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation font-mono"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => setStudentId("")}
                        className="p-3 bg-gray-500 text-white border border-gray-600 rounded-lg hover:bg-gray-600 touch-manipulation"
                      >
                        C
                      </button>
                      <button
                        onClick={() => setStudentId(prev => prev + '0')}
                        className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation font-mono"
                      >
                        0
                      </button>
                      <button
                        onClick={() => setStudentId(prev => prev.slice(0, -1))}
                        className="p-3 bg-red-500 text-white border border-red-600 rounded-lg hover:bg-red-600 touch-manipulation"
                      >
                        ⌫
                      </button>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleManualSubmit}
                        disabled={isLoading || studentId.length < 4}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-red-700 touch-manipulation text-sm sm:text-base"
                      >
                        {isLoading ? "⏳ Processing..." : "Submit PIN"}
                      </button>
                      <button
                        onClick={clearDisplay}
                        className="px-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 border border-gray-600 touch-manipulation text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Method Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-800 text-sm mb-2">💡 Supported Methods:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-blue-700">
                    <div>• 📷 QR Codes (digital/printed)</div>
                    <div>• 📊 Barcodes (loyalty cards)</div>
                    <div>• 🔌 USB Scanners (barcode/RFID)</div>
                    <div>• 📱 NFC/RFID Cards & Tags</div>
                    <div>• 🔢 PIN Codes (staff access)</div>
                    <div>• 💳 Magnetic Stripe (via USB)</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={clearDisplay}
                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg text-xs transition-all duration-200 border border-gray-600 touch-manipulation"
                  >
                    🗑️ Clear All
                  </button>
                  <button
                    onClick={() => setScanMode(prev => prev === "auto" ? "manual" : "auto")}
                    className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs transition-all duration-200 border border-purple-600 touch-manipulation"
                  >
                    {scanMode === "auto" ? "🔁 Manual Mode" : "🔁 Auto Mode"}
                  </button>
                  <button
                    onClick={fetchStudents}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs transition-all duration-200 border border-blue-600 touch-manipulation"
                  >
                    🔄 Refresh Data
                  </button>
                  <button
                    onClick={() => {
                      const testIds = {
                        camera: "STU20241001",
                        usb: "STU20241002", 
                        nfc: "NFC2024001",
                        pin: "1234"
                      };
                      setStudentId(testIds[scanType] || "STU20241001");
                      if (scanMode === "auto") setTimeout(handleManualSubmit, 100);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-xs transition-all duration-200 border border-green-600 touch-manipulation"
                  >
                    🧪 Test {scanType.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Meals */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📋 Recent Access Logs
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
                    No recent access logs
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
                          <span className="font-semibold text-gray-600">Access Method:</span>
                          <span className="text-gray-800 capitalize">{scanType}</span>
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
                      {scanType === "camera" ? "📷" : 
                       scanType === "usb" ? "🔌" : 
                       scanType === "nfc" ? "📱" : "🔢"}
                    </div>
                    <p className="text-sm sm:text-base font-medium mb-2">
                      {scanType === "camera" ? "Ready for QR/Barcode scan" :
                       scanType === "usb" ? "Ready for USB scanner" :
                       scanType === "nfc" ? "Ready for NFC/RFID tap" :
                       "Enter PIN code"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {scanMode === "auto" ? "Auto-process enabled" : "Manual submit required"}
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
                  <span className="text-sm text-gray-600">Access Method:</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    scanType === "camera" ? "bg-purple-100 text-purple-800 border-purple-300" :
                    scanType === "usb" ? "bg-blue-100 text-blue-800 border-blue-300" :
                    scanType === "nfc" ? "bg-orange-100 text-orange-800 border-orange-300" :
                    "bg-red-100 text-red-800 border-red-300"
                  }`}>
                    {scanType.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing Mode:</span>
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