import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiUsers, FiBook, FiBox, FiLayers, FiPlus, FiSettings, FiCalendar } from 'react-icons/fi';

const Dashboard = () => {
  const navigate = useNavigate();
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
          teachers: teachers.data.count || teachers.data.data?.length || 0,
          subjects: subjects.data.count || subjects.data.data?.length || 0,
          rooms: rooms.data.count || rooms.data.data?.length || 0,
          divisions: divisions.data.count || divisions.data.data?.length || 0
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
    { name: 'Total Teachers', value: stats.teachers, icon: <FiUsers />, color: 'bg-indigo-600', link: '/teachers' },
    { name: 'Total Subjects', value: stats.subjects, icon: <FiBook />, color: 'bg-emerald-500', link: '/subjects' },
    { name: 'Total Rooms', value: stats.rooms, icon: <FiBox />, color: 'bg-purple-600', link: '/infrastructure' },
    { name: 'Total Divisions', value: stats.divisions, icon: <FiLayers />, color: 'bg-amber-500', link: '/divisions' },
  ];

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Overview</h1>
        <p className="text-gray-500">Manage your institution's scheduling infrastructure</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div 
            key={card.name} 
            onClick={() => navigate(card.link)}
            className="bg-white rounded-3xl shadow-sm p-6 flex items-center border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
          >
            <div className={`${card.color} p-4 rounded-2xl text-white mr-4 shadow-lg`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">{card.name}</p>
              <p className="text-3xl font-black text-gray-800 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Orchestration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => navigate('/generate-timetable')}
            className="group p-6 border-2 border-dashed border-gray-200 rounded-3xl text-left hover:border-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <FiCalendar className="text-gray-400 group-hover:text-indigo-600 mb-3" size={24} />
            <p className="font-bold text-gray-700 group-hover:text-indigo-900">Generate Timetable</p>
            <p className="text-xs text-gray-400 mt-1">Run the AI scheduler for the new semester</p>
          </button>
          
          <button 
            onClick={() => navigate('/teachers')}
            className="group p-6 border-2 border-dashed border-gray-200 rounded-3xl text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all"
          >
            <FiPlus className="text-gray-400 group-hover:text-emerald-500 mb-3" size={24} />
            <p className="font-bold text-gray-700 group-hover:text-emerald-900">Add New Teacher</p>
            <p className="text-xs text-gray-400 mt-1">Register new faculty members to the system</p>
          </button>
          
          <button 
            onClick={() => navigate('/constraints')}
            className="group p-6 border-2 border-dashed border-gray-200 rounded-3xl text-left hover:border-purple-600 hover:bg-purple-50 transition-all"
          >
            <FiSettings className="text-gray-400 group-hover:text-purple-600 mb-3" size={24} />
            <p className="font-bold text-gray-700 group-hover:text-purple-900">Manage Constraints</p>
            <p className="text-xs text-gray-400 mt-1">Configure global scheduling rules and limits</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
