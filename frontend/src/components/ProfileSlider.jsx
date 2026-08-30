import React, { useContext, useEffect, useState } from 'react';
import { X, Mail, Briefcase, CheckCircle, Calendar, LogOut, User } from 'lucide-react';
import { AuthContext } from '../AuthContextInstance';
import { getProjects } from '../api';

const ProfileSlider = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, completed: 0, projectsCount: 0 });

  useEffect(() => {
    if (isOpen && user) {
      const fetchStats = async () => {
        try {
          const response = await getProjects();
          const projects = response.data;
          let totalTasks = 0;
          let completedTasks = 0;
          projects.forEach(p => {
            totalTasks += p.tasks?.length || 0;
            completedTasks += p.tasks?.filter(t => t.status === 'Done').length || 0;
          });
          setStats({ total: totalTasks, completed: completedTasks, projectsCount: projects.length });
        } catch (error) {
          console.error('Error fetching stats:', error);
          setStats({ total: 0, completed: 0, projectsCount: 0 });
        }
      };
      fetchStats();
    }
  }, [isOpen, user]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slider */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-[70] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
           style={{ backgroundColor: 'var(--bg-card)' }}>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>My Profile</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-emerald-500/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* User Info */}
            <div className="p-8 text-center">
              <div className="inline-block relative mb-6">
                <div className="h-24 w-24 rounded-3xl bg-emerald-600 border-2 border-emerald-500/40 flex items-center justify-center text-white text-4xl font-black shadow-xl overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border" style={{ borderColor: 'var(--border-color)' }}>
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <h3 className="text-2xl font-black" style={{ color: 'var(--text-main)' }}>{user.name}</h3>
              <p className="font-medium text-xs text-emerald-400 mt-0.5">{user.job_title || 'Team Member'}</p>
              <p className="font-medium text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            </div>

            {/* Stats */}
            <div className="px-8 grid grid-cols-3 gap-4 mb-10">
              <div className="p-4 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Projects</p>
                <p className="text-xl font-black text-emerald-600">{stats.projectsCount}</p>
              </div>
              <div className="p-4 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Tasks</p>
                <p className="text-xl font-black text-emerald-600">{stats.total}</p>
              </div>
              <div className="p-4 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Done</p>
                <p className="text-xl font-black text-emerald-600">{stats.completed}</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="px-8 space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                <Mail className="h-5 w-5 text-emerald-600" />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Email Address</p>
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text-main)' }}>{user.email}</p>
                </div>
              </div>
              
              <a 
                href="/profile"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-2xl font-bold text-xs border border-emerald-500/20 transition-all"
              >
                Edit Full Profile Settings
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button 
              onClick={logout}
              className="w-full py-4 bg-rose-500/10 text-rose-500 rounded-2xl font-black text-sm hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" /> Logout Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSlider;

