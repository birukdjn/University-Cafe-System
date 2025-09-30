"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/api/students/")
      .then(res => setStudents(res.data))
      .catch(err => console.error(err));
  }, []);

  const getMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Ethiopian local time (rough logic)
    if (hour >= 7 && hour < 9) return "breakfast";
    if (hour >= 11 && hour < 13) return "lunch";
    if (hour >= 17 && hour < 20) return "dinner";
    return "closed";
  };

  const handleScan = async () => {
    const student = students.find(s => s.student_id === studentId);

    if (!student) {
      setMessage("❌ Student not found");
      return;
    }

    const mealType = getMealType();

    if (mealType === "closed") {
      setMessage("❌ Café is closed now.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/meals/", {
        student: student.id,
        meal_type: mealType,
      });
      setMessage(`✅ ${student.name} allowed for ${mealType}`);
    } catch (err) {
      setMessage("❌ Error logging meal (maybe duplicate entry)");
    }

    setStudentId("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          🎓 University Café Access
        </h1>

        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Scan or Enter Student ID"
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          onClick={handleScan}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Submit
        </button>

        {message && (
          <p className="mt-4 text-center text-lg font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
