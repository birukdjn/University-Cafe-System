"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [isAllowed, setIsAllowed] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:8000/api/students/")
      .then(res => setStudents(res.data))
      .catch(err => console.error(err));
  }, []);

  const getMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 7 && hour < 9) return "breakfast";
    if (hour >= 11 && hour < 13) return "lunch";
    if (hour >= 17 && hour < 20) return "dinner";
    return "closed";
  };

  // Initialize barcode scanner
  const startScanner = () => {
    setIsScanning(true);
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Successfully scanned
        handleScannedId(decodedText);
        scanner.clear();
        setIsScanning(false);
      },
      (error) => {
        // Scan error - you can ignore or handle as needed
        console.log("Scan error:", error);
      }
    );
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }
  };

  const handleScannedId = async (scannedId) => {
    setStudentId(scannedId);
    const student = students.find(s => s.student_id === scannedId);

    if (!student) {
      setMessage("❌ Student not found");
      setStudentInfo(null);
      setIsAllowed(false);
      return;
    }

    const mealType = getMealType();

    if (mealType === "closed") {
      setMessage("❌ Café is closed now.");
      setStudentInfo(student);
      setIsAllowed(false);
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/meals/", {
        student: student.id,
        meal_type: mealType,
      });
      setMessage(`✅ ${student.name} allowed for ${mealType}`);
      setStudentInfo(student);
      setIsAllowed(true);
    } catch (err) {
      setMessage("❌ Error logging meal (maybe duplicate entry)");
      setStudentInfo(student);
      setIsAllowed(false);
    }
  };

  const handleManualSubmit = async () => {
    await handleScannedId(studentId);
    setStudentId("");
  };

  const clearDisplay = () => {
    setStudentInfo(null);
    setMessage("");
    setIsAllowed(null);
    setStudentId("");
    stopScanner();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">
        🎓 University Café Access System
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Scanning/ID Entry Section */}
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-700">
            Student ID Scanner
          </h2>

          <div className="space-y-4">
            {/* Scanner Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div id="reader" className="w-full"></div>
              {!isScanning && (
                <button
                  onClick={startScanner}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition mt-4"
                >
                  Start Scanner
                </button>
              )}
              {isScanning && (
                <button
                  onClick={stopScanner}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition mt-4"
                >
                  Stop Scanner
                </button>
              )}
            </div>

            {/* Manual Entry Section */}
            <div className="border-t pt-4">
              <p className="text-center text-gray-600 mb-2">Or enter manually:</p>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID manually"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                }}
              />

              <button
                onClick={handleManualSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-lg transition text-lg mt-2"
              >
                Submit ID
              </button>
            </div>

            <button
              onClick={clearDisplay}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition"
            >
              Clear Display
            </button>
          </div>
        </div>

        {/* Student Information Display Section */}
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h2 className="text-xl font-bold text-center mb-6 text-gray-700">
            Student Access Status
          </h2>

          <div className={`p-6 rounded-lg border-2 ${
            isAllowed === true ? 'border-green-500 bg-green-50' :
            isAllowed === false ? 'border-red-500 bg-red-50' :
            'border-gray-300 bg-gray-50'
          }`}>
            {studentInfo ? (
              <div className="text-center">
                <div className={`text-6xl mb-4 ${
                  isAllowed ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isAllowed ? '✅' : '❌'}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="font-semibold text-gray-600">Name:</div>
                    <div className="text-gray-800">{studentInfo.name}</div>
                    
                    <div className="font-semibold text-gray-600">Student ID:</div>
                    <div className="text-gray-800">{studentInfo.student_id}</div>
                    
                    <div className="font-semibold text-gray-600">Department:</div>
                    <div className="text-gray-800">{studentInfo.department || 'N/A'}</div>
                    
                    <div className="font-semibold text-gray-600">Meal Type:</div>
                    <div className="text-gray-800 capitalize">{getMealType()}</div>
                  </div>
                </div>

                <div className={`text-xl font-bold ${
                  isAllowed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isAllowed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                </div>

                {message && (
                  <p className="mt-4 text-lg font-medium">
                    {message}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-4">👆</div>
                <p className="text-lg">Scan or enter Student ID to begin</p>
                <p className="text-sm mt-2">Student information and access status will appear here</p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-sm text-gray-600">Current Time</div>
            <div className="text-lg font-semibold text-blue-700">
              {new Date().toLocaleTimeString()} | {getMealType().toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}