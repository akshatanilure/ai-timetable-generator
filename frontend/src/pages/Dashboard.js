import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiUsers, FiBook, FiBox, FiLayers } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState({
    teachers: 0,
    subjects: 0,
    rooms: 0,
    divisions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [teachers, subjects, rooms, divisions] = await Promise.all([
          api.get('/teachers'),
          api.get('/subjects'),
          api.get('/rooms'),
          api.get('/divisions')
        ]);

        setStats({
          teachers: teachers.data.count,
          subjects: subjects.data.count,
          rooms: rooms.data.count,
          divisions: divisions.data.count
        });
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { name: 'Total Teachers', value: stats.teachers, icon: <FiUsers />, color: 'bg-blue-500' },
    { name: 'Total Subjects', value: stats.subjects, icon: <FiBook />, color: 'bg-green-500' },
    { name: 'Total Rooms', value: stats.rooms, icon: <FiBox />, color: 'bg-purple-500' },
    { name: 'Total Divisions', value: stats.divisions, icon: <FiLayers />, color: 'bg-orange-500' },
  ];

  if (loading) return <div>Loading statistics...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white rounded-xl shadow-sm p-6 flex items-center">
            <div className={`${card.color} p-4 rounded-lg text-white mr-4`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.name}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-white rounded-xl shadow-sm p-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-all">
            + Generate New Timetable
          </button>
          <button className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-all">
            + Add New Teacher
          </button>
          <button className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-all">
            + Manage Constraints
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
