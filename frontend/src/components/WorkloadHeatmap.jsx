import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, ShieldAlert, Clock, Sparkles } from 'lucide-react';
import { getProjectWorkload } from '../api';

const WorkloadHeatmap = ({ projectId }) => {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        const res = await getProjectWorkload(projectId);
        setWorkload(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkload();
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wider">Analyzing resource allocation...</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-3xl border shadow-xl p-8 space-y-6"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100">Workload Capacity & Utilization Heatmap</h3>
            <p className="text-xs text-slate-400 font-medium">Prevent engineering burnout and balance sprint allocation</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <div className="h-3 w-3 rounded-full bg-emerald-500" /> Optimal (40-100%)
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <div className="h-3 w-3 rounded-full bg-rose-500" /> Overloaded (&gt;100%)
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="h-3 w-3 rounded-full bg-slate-600" /> Available (&lt;40%)
          </div>
        </div>
      </div>

      {workload.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs italic">
          No active collaborators assigned to tasks yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workload.map((member) => {
            const isOverloaded = member.utilization_percent > 100;
            const isOptimal = member.utilization_percent >= 40 && member.utilization_percent <= 100;

            return (
              <div
                key={member.id}
                className="p-6 rounded-2xl border bg-slate-900/60 border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-600 border border-emerald-500/30 flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        member.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{member.name}</h4>
                      <p className="text-xs text-slate-400">{member.job_title}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                    isOverloaded 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                      : isOptimal
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isOverloaded && <AlertTriangle className="h-3 w-3" />}
                    {member.capacity_status}
                  </span>
                </div>

                {/* Utilization Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-400">Weekly Allocation (40h Cap)</span>
                    <span className={`font-black ${isOverloaded ? 'text-rose-400' : 'text-slate-200'}`}>
                      {member.total_estimated_hours}h / 40h ({member.utilization_percent}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isOverloaded
                          ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                          : isOptimal
                          ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                          : 'bg-sky-500'
                      }`}
                      style={{ width: `${Math.min(100, member.utilization_percent)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Tasks</span>
                    <p className="text-sm font-black text-slate-200 mt-0.5">{member.active_task_count}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logged Hours</span>
                    <p className="text-sm font-black text-emerald-400 mt-0.5">{member.total_logged_hours}h</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkloadHeatmap;
