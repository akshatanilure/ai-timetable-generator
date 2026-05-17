import React from 'react';
import { FiAlertCircle, FiClock, FiMapPin, FiCalendar } from 'react-icons/fi';

const Constraints = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Global Constraints</h1>
        <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
          Save Constraints
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Constraints */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center text-indigo-600 font-bold text-lg">
            <FiCalendar className="mr-3" /> Academic Rules
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-700">Max Lectures per Day</p>
                <p className="text-xs text-gray-400">Limit for both teachers and students</p>
              </div>
              <input type="number" defaultValue={6} className="w-16 px-3 py-2 border rounded-lg text-center font-bold" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-700">Consecutive Lectures</p>
                <p className="text-xs text-gray-400">Max hours without a break</p>
              </div>
              <input type="number" defaultValue={3} className="w-16 px-3 py-2 border rounded-lg text-center font-bold" />
            </div>
          </div>
        </div>

        {/* Resource Constraints */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center text-teal-600 font-bold text-lg">
            <FiMapPin className="mr-3" /> Resource Allocation
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-700">Lab Batch Size</p>
                <p className="text-xs text-gray-400">Students per lab session</p>
              </div>
              <input type="number" defaultValue={20} className="w-16 px-3 py-2 border rounded-lg text-center font-bold" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-700">Travel Time (min)</p>
                <p className="text-xs text-gray-400">Buffer between block changes</p>
              </div>
              <input type="number" defaultValue={10} className="w-16 px-3 py-2 border rounded-lg text-center font-bold" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-3xl flex items-start">
        <FiAlertCircle className="text-yellow-600 mt-1 mr-4 flex-shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-yellow-900 text-lg">AI Optimizer Note</h4>
          <p className="text-yellow-800 mt-1">
            Updating these constraints will affect the generation algorithm. You may need to re-generate existing timetables 
            to apply these rules to current schedules.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Constraints;
