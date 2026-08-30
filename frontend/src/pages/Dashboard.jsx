import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Activity,
  Users,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  ArrowRight,
  TrendingUp,
  Shield,
  Sparkles,
  Layers,
  ChevronRight,
  CheckSquare
} from 'lucide-react';
import { getProjects, updateTask } from '../api';
import { AuthContext } from '../AuthContextInstance';
import { useToast } from '../components/Toast';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (projectId, task) => {
    const nextStatus = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      await updateTask(projectId, task.id, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus}`);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading metrics...</p>
      </div>
    );
  }

  // Analytics
  const totalTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const completedTasks = projects.reduce((acc, p) => acc + (p.tasks?.filter((t) => t.status === 'Done').length || 0), 0);
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const onHoldProjects = projects.filter((p) => p.status === 'On Hold').length;

  // Flatten all tasks with project metadata
  const allTasksWithProj = projects.flatMap((p) => 
    (p.tasks || []).map((t) => ({ ...t, projectId: p.id, projectTitle: p.title, projectColor: p.color }))
  );

  // My Assigned Tasks
  const myTasks = allTasksWithProj.filter((t) => t.assigned_to === user?.id || !t.assigned_to);

  // Urgent upcoming deadlines (due within 5 days or overdue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingDeadlines = allTasksWithProj.filter((t) => {
    if (!t.due_date || t.status === 'Done') return false;
    const d = new Date(t.due_date);
    const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Due in next 7 days or overdue
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5);

  const categories = [...new Set(projects.map((p) => p.category || 'General'))];
  const categoryStats = categories.map((cat) => ({
    name: cat,
    count: projects.filter((p) => (p.category || 'General') === cat).length
  })).sort((a, b) => b.count - a.count);

  const recentProjects = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="p-6 md:p-8 flex-1 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-widest mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Workspace Overview
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
              Welcome back, {user?.name || 'Developer'}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Here is your project health, velocity, and priority tasks for today.
            </p>
          </div>

          <Link
            to="/projects"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <Briefcase className="h-4 w-4" /> View All Projects
          </Link>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Projects */}
          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:border-emerald-500/40" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
                <Briefcase className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                <Activity className="h-3 w-3" /> Active
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Total Projects</p>
            <p className="text-4xl font-black tracking-tight text-slate-100">{projects.length}</p>
            <p className="text-xs font-bold text-emerald-400 mt-2">{activeProjects} in progress</p>
          </div>

          {/* Card 2: Completion Rate */}
          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:border-emerald-500/40" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20 uppercase tracking-widest">
                Efficiency
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Completion Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black tracking-tight text-slate-100">{taskProgress}%</p>
              <p className="text-xs font-bold text-teal-400 mb-1">({completedTasks}/{totalTasks} tasks)</p>
            </div>
            <div className="mt-3 h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${taskProgress}%` }} />
            </div>
          </div>

          {/* Card 3: Active Velocity */}
          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:border-amber-500/40" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
                <Clock className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">
                Velocity
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Active Workflows</p>
            <p className="text-4xl font-black tracking-tight text-slate-100">{activeProjects}</p>
            <p className="text-xs font-bold text-amber-400 mt-2">{onHoldProjects} currently paused</p>
          </div>

          {/* Card 4: Action Required / Overdue */}
          <div className="p-6 rounded-3xl shadow-xl border transition-all hover:-translate-y-1 hover:border-rose-500/40" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl">
                <AlertCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 uppercase tracking-widest">
                Attention
              </span>
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Upcoming / Due</p>
            <p className="text-4xl font-black tracking-tight text-slate-100">{upcomingDeadlines.length}</p>
            <p className="text-xs font-bold text-rose-400 mt-2">deadlines in next 7 days</p>
          </div>
        </div>

        {/* Middle Section: Urgent Deadlines + My Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Urgent / Upcoming Deadlines */}
          <div className="p-8 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-rose-400" /> Approaching Deadlines
              </h3>
              <span className="text-xs font-bold text-slate-400">{upcomingDeadlines.length} tasks</span>
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No urgent deadlines approaching!</p>
              ) : (
                upcomingDeadlines.map((task) => {
                  const isPast = new Date(task.due_date) < today;
                  return (
                    <div 
                      key={task.id}
                      className="p-4 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center justify-between transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleTask(task.projectId, task)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          <Circle className="h-4 w-4" />
                        </button>
                        <div>
                          <p className="text-xs font-bold text-slate-100">{task.title}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{task.projectTitle}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                        isPast ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {isPast ? 'Overdue' : `Due ${new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Tasks Widget */}
          <div className="p-8 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" /> Focus Tasks
              </h3>
              <span className="text-xs font-bold text-slate-400">{myTasks.filter(t => t.status !== 'Done').length} open</span>
            </div>

            <div className="space-y-3">
              {myTasks.slice(0, 5).length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">No assigned tasks. Enjoy your day!</p>
              ) : (
                myTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center justify-between transition-all hover:border-emerald-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task.projectId, task)}
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {task.status === 'Done' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <p className={`text-xs font-bold ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">{task.projectTitle}</p>
                      </div>
                    </div>

                    <Link
                      to={`/projects/${task.projectId}`}
                      className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Categories + Recent Projects Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories distribution */}
          <div className="lg:col-span-1 p-8 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-400" /> Category Breakdown
            </h3>
            <div className="space-y-5">
              {categoryStats.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No categories defined yet</p>
              ) : (
                categoryStats.map((stat, i) => (
                  <div key={stat.name} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-200">{stat.name}</span>
                      <span className="text-slate-400">{stat.count} projects</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${['bg-emerald-500', 'bg-teal-400', 'bg-cyan-500', 'bg-indigo-500', 'bg-purple-500'][i % 5]}`}
                        style={{ width: `${(stat.count / Math.max(projects.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Projects Table */}
          <div className="lg:col-span-2 p-8 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-400" /> Recent Projects
              </h3>
              <Link to="/projects" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {recentProjects.map((p) => {
                    const tasks = p.tasks || [];
                    const done = tasks.filter((t) => t.status === 'Done').length;
                    const prog = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-emerald-500/5 transition-colors group">
                        <td className="py-4">
                          <Link to={`/projects/${p.id}`} className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            {p.title}
                          </Link>
                        </td>
                        <td className="py-4">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {p.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-bold text-slate-300">{p.status}</span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-black text-slate-200">{prog}%</span>
                            <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog}%` }} />
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
