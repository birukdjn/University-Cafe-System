"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "https://cafe-api-f9re.onrender.com";

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayMeals: 0,
    breakfastCount: 0,
    lunchCount: 0,
    dinnerCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [studentsRes, mealsRes] = await Promise.all([
        axios.get(`${API_URL}/api/students/`),
        axios.get(`${API_URL}/api/meals/`)
      ]);

      const students = studentsRes.data;
      const meals = mealsRes.data;
      
      const today = new Date().toDateString();
      const todayMeals = meals.filter(meal => 
        new Date(meal.timestamp).toDateString() === today
      );

      setStats({
        totalStudents: students.length,
        todayMeals: todayMeals.length,
        breakfastCount: todayMeals.filter(m => m.meal_type === 'breakfast').length,
        lunchCount: todayMeals.filter(m => m.meal_type === 'lunch').length,
        dinnerCount: todayMeals.filter(m => m.meal_type === 'dinner').length
      });

      setRecentActivity(meals.slice(0, 10));
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            📊 Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            Real-time café system statistics and activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalStudents}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Students</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.todayMeals}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">{"Today's Meals"}</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.breakfastCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Breakfast</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.lunchCount + stats.dinnerCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Lunch + Dinner</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm">🍽️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.student_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.meal_type} • {activity.student_id}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 text-right">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No activity data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Meal Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{"Today's Meal Distribution"}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Breakfast</span>
                  <span>{stats.breakfastCount} meals</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${(stats.breakfastCount / Math.max(stats.todayMeals, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Lunch</span>
                  <span>{stats.lunchCount} meals</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.lunchCount / Math.max(stats.todayMeals, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Dinner</span>
                  <span>{stats.dinnerCount} meals</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${(stats.dinnerCount / Math.max(stats.todayMeals, 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">System Info</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>API: cafe-api-f9re.onrender.com</div>
                <div>Last Updated: {new Date().toLocaleTimeString()}</div>
                <button 
                  onClick={fetchAnalytics}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}