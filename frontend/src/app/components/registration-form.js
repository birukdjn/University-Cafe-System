"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://cafe-api-f9re.onrender.com";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    year: new Date().getFullYear(),
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registeredStudent, setRegisteredStudent] = useState(null);
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const departments = [
    "Computer Science", "Electrical Engineering", "Mechanical Engineering",
    "Civil Engineering", "Business Administration", "Medicine", "Law",
    "Arts and Humanities", "Science", "Social Sciences"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const newId = `STU${year}${random}`;
    setFormData(prev => ({ ...prev, student_id: newId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      const response = await axios.post(
        `${API_URL}/api/students/`,
        submitData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setRegisteredStudent(response.data);
      setMessage("✅ Student registered successfully!");
      
      setFormData({
        student_id: "", name: "", email: "", phone: "",
        department: "", year: new Date().getFullYear(), image: null
      });
      setPreviewImage(null);
      
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("❌ Error registering student. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const printIDCard = () => {
    window.print();
  };

  if (registeredStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-4 px-3 sm:px-4 touch-manipulation">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-8 mb-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                ✅ Registration Successful!
              </h1>
              <p className="text-sm sm:text-lg text-gray-600">
                Student registered successfully. ID card generated:
              </p>
            </div>

            {/* Printable ID Card */}
            <div className="bg-white border-4 border-blue-800 rounded-2xl p-4 sm:p-8 max-w-md mx-auto shadow-2xl print-section">
              <div className="text-center mb-4 sm:mb-6 border-b-2 border-blue-800 pb-3 sm:pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-blue-800">UNIVERSITY CAFÉ SYSTEM</h2>
                <p className="text-xs sm:text-sm text-gray-600">Official Student ID Card</p>
              </div>

              <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-lg border-2 border-blue-600 overflow-hidden">
                  {registeredStudent.image && (
                    <img 
                      src={`${API_URL}${registeredStudent.image}`}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white border-2 border-blue-600 rounded-lg p-1">
                  {registeredStudent.qr_code_url && (
                    <img 
                      src={`${API_URL}${registeredStudent.qr_code_url}`}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="grid grid-cols-1 gap-1 sm:gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span className="text-gray-900 font-medium text-right">{registeredStudent.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Student ID:</span>
                    <span className="text-blue-800 font-bold text-right">{registeredStudent.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Department:</span>
                    <span className="text-gray-900 text-right">{registeredStudent.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Year:</span>
                    <span className="text-gray-900 text-right">Year {registeredStudent.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span className="text-gray-900 text-right text-xs sm:text-sm">{registeredStudent.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-center border-t-2 border-blue-800 pt-3 sm:pt-4">
                <p className="text-xs text-gray-500 mb-1">
                  This card is required for café access
                </p>
                <p className="text-xs text-gray-500">
                  Valid until: {new Date().getFullYear() + 4}-12-31
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 sm:mt-8 print:hidden">
              <button
                onClick={printIDCard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-blue-700 touch-manipulation text-sm sm:text-base"
              >
                🖨️ Print ID Card
              </button>
              <button
                onClick={() => setRegisteredStudent(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-gray-700 touch-manipulation text-sm sm:text-base"
              >
                📝 Register Another Student
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-3 sm:px-4 touch-manipulation">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
              🎓 Student Registration
            </h1>
            <p className="text-sm sm:text-lg text-gray-600">
              Register students for café access system
            </p>
            <div className="mt-2 text-xs sm:text-sm text-green-600 font-mono">
              API: cafe-api-f9re.onrender.com
            </div>
          </div>

          {message && (
            <div className={`p-3 sm:p-4 rounded-lg mb-6 text-center font-semibold text-sm sm:text-base border ${
              message.includes("✅") ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student ID *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
                  placeholder="Enter student ID or generate automatically"
                />
                <button
                  type="button"
                  onClick={generateStudentId}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 border border-green-700 touch-manipulation text-sm sm:text-base whitespace-nowrap"
                >
                  Generate ID
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base touch-manipulation"
              >
                {Array.from({length: 6}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student Photo
              </label>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 touch-manipulation"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Upload a clear photo for the ID card (optional)
                  </p>
                </div>
                {previewImage && (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg border-2 border-blue-600 overflow-hidden">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 sm:py-4 rounded-lg transition-all duration-200 border border-blue-700 touch-manipulation text-sm sm:text-base"
              >
                {isLoading ? "⏳ Registering..." : "🎓 Register Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}