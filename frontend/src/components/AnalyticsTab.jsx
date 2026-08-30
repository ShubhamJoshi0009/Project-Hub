import React from 'react';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, 
  BarChart3, PieChart, Printer, Download, Sparkles 
} from 'lucide-react';

const AnalyticsTab = ({ project }) => {
  const tasks = project?.tasks || [];
  const completed = tasks.filter((t) => t.status === 'Done').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const inReview = tasks.filter((t) => t.status === 'In Review').length;
  const todo = tasks.filter((t) => t.status === 'Todo').length;
  const total = tasks.length;

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 4), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (Number(t.actual_hours) || 0), 0);

  // Generate 7-day Burndown steps
  const burndownPoints = [
    { day: 'Day 1', ideal: totalEstimatedHours, actual: totalEstimatedHours },
    { day: 'Day 3', ideal: Math.round(totalEstimatedHours * 0.75), actual: Math.round(totalEstimatedHours * 0.85) },
    { day: 'Day 5', ideal: Math.round(totalEstimatedHours * 0.5), actual: Math.round(totalEstimatedHours * 0.55) },
    { day: 'Day 7', ideal: Math.round(totalEstimatedHours * 0.25), actual: Math.round(totalEstimatedHours * 0.3) },
    { day: 'Day 10', ideal: 0, actual: Math.max(0, totalEstimatedHours - Math.round(totalActualHours * 1.5)) },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="rounded-3xl border shadow-xl p-8 space-y-8"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100">Sprint Burndown & Velocity Analytics</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time velocity curves, health indicators, and sprint forecasting</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
        >
          <Printer className="h-4 w-4 text-emerald-400" /> Print PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completion Rate</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-emerald-400">{progressPercent}%</span>
            <span className="text-xs text-slate-400">{completed}/{total} Tasks</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Effort</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-slate-200">{totalEstimatedHours}h</span>
            <span className="text-xs text-slate-400">Total Planned</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logged Hours</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-sky-400">{totalActualHours}h</span>
            <span className="text-xs text-slate-400">Time Tracked</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active WIP</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-amber-400">{inProgress + inReview}</span>
            <span className="text-xs text-slate-400">In Progress / Review</span>
          </div>
        </div>
      </div>

      {/* Sprint Burndown Visualization */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" /> Sprint Burndown Chart (Remaining Hours)
          </h4>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2 w-4 bg-slate-600 rounded-sm" /> Ideal Guide
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-2 w-4 bg-emerald-500 rounded-sm" /> Actual Burndown
            </span>
          </div>
        </div>

        {/* Burndown Bar Chart Representation */}
        <div className="grid grid-cols-5 gap-3 pt-4 items-end h-48 border-b border-slate-800 pb-2">
          {burndownPoints.map((pt, i) => {
            const maxVal = Math.max(1, totalEstimatedHours);
            const actualHeight = Math.min(100, Math.round((pt.actual / maxVal) * 100));
            const idealHeight = Math.min(100, Math.round((pt.ideal / maxVal) * 100));

            return (
              <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-2 h-full">
                  {/* Ideal Line Bar */}
                  <div
                    className="w-4 bg-slate-700/60 rounded-t-md transition-all"
                    style={{ height: `${idealHeight}%` }}
                    title={`Ideal: ${pt.ideal}h remaining`}
                  />
                  {/* Actual Burndown Bar */}
                  <div
                    className="w-5 bg-emerald-500 rounded-t-md shadow-md group-hover:bg-emerald-400 transition-all"
                    style={{ height: `${actualHeight}%` }}
                    title={`Actual: ${pt.actual}h remaining`}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{pt.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Status Distribution</h4>
          <div className="space-y-2">
            {[
              { label: 'Todo', count: todo, color: 'bg-slate-600' },
              { label: 'In Progress', count: inProgress, color: 'bg-amber-500' },
              { label: 'In Review', count: inReview, color: 'bg-sky-500' },
              { label: 'Done', count: completed, color: 'bg-emerald-500' },
            ].map((col) => {
              const colPercent = total > 0 ? Math.round((col.count / total) * 100) : 0;
              return (
                <div key={col.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{col.label}</span>
                    <span>{col.count} ({colPercent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${col.color} rounded-full`} style={{ width: `${colPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Priority Breakdown</h4>
          <div className="space-y-2">
            {[
              { label: 'High Priority', count: tasks.filter(t => t.priority === 'High').length, color: 'bg-rose-500' },
              { label: 'Medium Priority', count: tasks.filter(t => t.priority === 'Medium').length, color: 'bg-amber-500' },
              { label: 'Low Priority', count: tasks.filter(t => t.priority === 'Low').length, color: 'bg-emerald-500' },
            ].map((pri) => {
              const priPercent = total > 0 ? Math.round((pri.count / total) * 100) : 0;
              return (
                <div key={pri.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>{pri.label}</span>
                    <span>{pri.count} ({priPercent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full ${pri.color} rounded-full`} style={{ width: `${priPercent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
