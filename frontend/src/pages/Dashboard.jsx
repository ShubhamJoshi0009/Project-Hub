import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity,
  Users,
  Calendar
} from 'lucide-react';
import { getProjects } from '../api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.tasks?.filter(t => t.status === 'Done').length || 0), 0);
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

  const categories = [...new Set(projects.map(p => p.category || 'General'))];
  const categoryStats = categories.map(cat => ({
    name: cat,
    count: projects.filter(p => (p.category || 'General') === cat).length
  })).sort((a, b) => b.count - a.count);

  const recentProjects = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="p-8 flex-1 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase" style={{ color: 'var(--text-main)' }}>System Overview</h1>
            <p className="mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>Real-time growth metrics and project health.</p>
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:shadow-emerald-500/10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1 border border-emerald-500/20 uppercase tracking-widest">
                <Activity className="h-3 w-3" /> Growth
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Total Projects</p>
            <p className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>{projects.length}</p>
          </div>

          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:shadow-teal-500/10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-teal-500 text-white rounded-2xl shadow-lg shadow-teal-500/20">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Completion Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>{taskProgress}%</p>
              <p className="text-xs font-bold text-teal-600 mb-1">+{completedTasks} tasks</p>
            </div>
            <div className="mt-4 h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-teal-500/10">
                <div className="h-full bg-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>

          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:shadow-amber-500/10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Velocity</p>
            <p className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>{activeProjects}</p>
            <p className="text-xs font-bold text-amber-600 mt-1 uppercase tracking-tighter">Active Workflows</p>
          </div>

          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:shadow-rose-500/10" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Attention Req.</p>
            <p className="text-4xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>{onHoldProjects}</p>
            <p className="text-xs font-bold text-rose-600 mt-1 uppercase tracking-tighter">Blocked Items</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Distribution */}
          <div className="lg:col-span-1 p-8 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <LayoutDashboard className="h-5 w-5 text-emerald-500" /> Categories
            </h3>
            <div className="space-y-6">
              {categoryStats.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No categories yet</p>
              ) : categoryStats.map((stat, i) => (
                <div key={stat.name} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span style={{ color: 'var(--text-main)' }}>{stat.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{stat.count}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${['bg-emerald-500', 'bg-emerald-600', 'bg-emerald-400', 'bg-emerald-700', 'bg-emerald-300'][i % 5]}`} 
                      style={{ width: `${(stat.count / projects.length) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="lg:col-span-2 p-8 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Activity className="h-5 w-5 text-emerald-500" /> Recent Projects
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Project</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Category</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: 'var(--text-muted)' }}>Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {recentProjects.map((project) => {
                    const projectCompletedTasks = project.tasks?.filter(t => t.status === 'Done').length || 0;
                    const projectTotalTasks = project.tasks?.length || 0;
                    const projectProgress = projectTotalTasks > 0 ? Math.round((projectCompletedTasks / projectTotalTasks) * 100) : 0;
                    
                    return (
                      <tr key={project.id} className="group hover:bg-emerald-900/10 transition-colors">
                        <td className="py-4">
                          <p className="text-sm font-bold group-hover:text-emerald-600 transition-colors" style={{ color: 'var(--text-main)' }}>{project.title}</p>
                          <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                            <Calendar className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded uppercase tracking-wider">
                            {project.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              project.status === 'Active' ? 'bg-emerald-500' :
                              project.status === 'On Hold' ? 'bg-amber-500' :
                              'bg-emerald-600'
                            }`} />
                            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{project.status}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-xs font-black" style={{ color: 'var(--text-main)' }}>{projectProgress}%</span>
                            <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${projectProgress}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
