import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../AuthContextInstance';
import { getProjects } from '../api';
import { User, Mail, Calendar, Briefcase, CheckCircle, ArrowRight } from 'lucide-react';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, completed: 0, projectsCount: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getProjects();
        const projects = response.data;
        let totalTasks = 0;
        let completedTasks = 0;
        projects.forEach(p => {
          totalTasks += p.tasks.length;
          completedTasks += p.tasks.filter(t => t.status === 'Done').length;
        });
        setStats({ total: totalTasks, completed: completedTasks, projectsCount: projects.length });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  if (!user) return null;

  return (
    <div className="p-8 flex-1 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>User Profile</h1>
          <p className="font-medium" style={{ color: 'var(--text-muted)' }}>Manage your personal information and view stats.</p>
        </div>

        <div className="rounded-3xl shadow-sm border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {/* Header Banner */}
          <div className="h-48 bg-emerald-950 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500 rounded-full blur-3xl -ml-24 -mb-24" />
            </div>
          </div>

          <div className="px-8 pb-10">
            {/* Avatar */}
            <div className="relative -mt-16 mb-8 flex items-end gap-6">
              <div className="h-32 w-32 rounded-3xl p-2 shadow-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
                <div className="h-full w-full rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-inner shadow-emerald-500/50">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="pb-4">
                <h2 className="text-3xl font-black" style={{ color: 'var(--text-main)' }}>{user.name}</h2>
                <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="p-6 rounded-2xl border transition-all hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center text-emerald-400 mb-2">
                  <Briefcase className="h-5 w-5 mr-2" />
                  <span className="font-black uppercase tracking-[0.15em] text-[10px]">Projects</span>
                </div>
                <p className="text-3xl font-black" style={{ color: 'var(--text-main)' }}>{stats.projectsCount}</p>
              </div>
              <div className="p-6 rounded-2xl border transition-all hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center text-green-400 mb-2">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="font-black uppercase tracking-[0.15em] text-[10px]">Tasks</span>
                </div>
                <p className="text-3xl font-black" style={{ color: 'var(--text-main)' }}>{stats.total}</p>
              </div>
              <div className="p-6 rounded-2xl border transition-all hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center text-emerald-400 mb-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-black uppercase tracking-[0.15em] text-[10px]">Completed</span>
                </div>
                <p className="text-3xl font-black" style={{ color: 'var(--text-main)' }}>{stats.completed}</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-6">
               <h3 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                 Account Information
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Display Name</label>
                    <div className="w-full rounded-xl px-4 py-3 text-sm font-bold border transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                      {user.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                    <div className="w-full rounded-xl px-4 py-3 text-sm font-bold border transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                      {user.email}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
