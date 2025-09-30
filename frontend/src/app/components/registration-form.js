"use client";

import { useState } from "react";
import axios from "axios";

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

  const departments = [
    "Computer Science",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Business Administration",
    "Medicine",
    "Law",
    "Arts and Humanities",
    "Science",
    "Social Sciences"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const newId = `STU${year}${random}`;
    setFormData(prev => ({
      ...prev,
      student_id: newId
    }));
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
        "http://localhost:8000/api/students/",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setRegisteredStudent(response.data);
      setMessage("✅ Student registered successfully!");
      
      // Reset form
      setFormData({
        student_id: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        year: new Date().getFullYear(),
        image: null
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
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                ✅ Registration Successful!
              </h1>
              <p className="text-lg text-gray-600">
                Student has been registered successfully. Here's their ID card:
              </p>
            </div>

            {/* Printable ID Card */}
            <div className="bg-white border-4 border-blue-800 rounded-2xl p-8 max-w-md mx-auto shadow-2xl print:shadow-none print:border-2">
              {/* University Header */}
              <div className="text-center mb-6 border-b-2 border-blue-800 pb-4">
                <h2 className="text-2xl font-bold text-blue-800">UNIVERSITY CAFÉ SYSTEM</h2>
                <p className="text-sm text-gray-600">Official Student ID Card</p>
              </div>

              {/* Student Photo and QR Code */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-32 h-32 bg-gray-200 rounded-lg border-2 border-blue-600 overflow-hidden">
                  {registeredStudent.image && (
                    <img 
                      src={`http://localhost:8000${registeredStudent.image}`}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="w-32 h-32 bg-white border-2 border-blue-600 rounded-lg p-1">
                  {registeredStudent.qr_code_url && (
                    <img 
                      src={`http://localhost:8000${registeredStudent.qr_code_url}`}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-semibold text-gray-700">Name:</div>
                  <div className="col-span-2 text-gray-900 font-medium">{registeredStudent.name}</div>
                  
                  <div className="font-semibold text-gray-700">Student ID:</div>
                  <div className="col-span-2 text-blue-800 font-bold">{registeredStudent.student_id}</div>
                  
                  <div className="font-semibold text-gray-700">Department:</div>
                  <div className="col-span-2 text-gray-900">{registeredStudent.department}</div>
                  
                  <div className="font-semibold text-gray-700">Year:</div>
                  <div className="col-span-2 text-gray-900">Year {registeredStudent.year}</div>
                  
                  <div className="font-semibold text-gray-700">Email:</div>
                  <div className="col-span-2 text-gray-900 text-sm">{registeredStudent.email}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center border-t-2 border-blue-800 pt-4">
                <p className="text-xs text-gray-500 mb-2">
                  This card is required for café access
                </p>
                <p className="text-xs text-gray-500">
                  Valid until: {new Date().getFullYear() + 4}-12-31
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-8 print:hidden">
              <button
                onClick={printIDCard}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                🖨️ Print ID Card
              </button>
              <button
                onClick={() => setRegisteredStudent(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition"
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
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-800">
            🎓 Student Registration
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Register students for café access system
          </p>

          {message && (
            <div className={`p-4 rounded-lg mb-6 text-center font-semibold ${
              message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student ID Field */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student ID *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter student ID or generate automatically"
                />
                <button
                  type="button"
                  onClick={generateStudentId}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition whitespace-nowrap"
                >
                  Generate ID
                </button>
              </div>
            </div>

            {/* Name */}
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({length: 6}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Photo Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Student Photo
              </label>
              <div className="flex gap-6 items-start">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a clear photo for the ID card (optional)
                  </p>
                </div>
                {previewImage && (
                  <div className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-blue-600 overflow-hidden">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-lg transition text-lg"
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