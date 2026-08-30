import React, { useState } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, 
  AlertCircle, CheckCircle2, Circle, ArrowRight, Sparkles 
} from 'lucide-react';

const GanttChart = ({ tasks = [], onTaskClick }) => {
  const [viewWindow, setViewWindow] = useState('14days'); // '14days', '30days'

  // Determine date bounds
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const numDays = viewWindow === '14days' ? 14 : 30;
  const daysArray = [];
  for (let i = -2; i < numDays - 2; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    daysArray.push(d);
  }

  const startDate = daysArray[0];
  const endDate = daysArray[daysArray.length - 1];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-500 text-rose-100 border-rose-600';
      case 'Medium': return 'bg-amber-500 text-amber-100 border-amber-600';
      case 'Low': return 'bg-emerald-500 text-emerald-100 border-emerald-600';
      default: return 'bg-slate-600 text-slate-100 border-slate-700';
    }
  };

  const calculateBarPosition = (task) => {
    const taskStart = task.start_date ? new Date(task.start_date) : (task.due_date ? new Date(task.due_date) : today);
    const taskEnd = task.due_date ? new Date(task.due_date) : new Date(taskStart.getTime() + 24 * 60 * 60 * 1000);

    const totalSpanMs = endDate.getTime() - startDate.getTime();
    let leftPercent = ((taskStart.getTime() - startDate.getTime()) / totalSpanMs) * 100;
    let widthPercent = ((taskEnd.getTime() - taskStart.getTime() + (24 * 60 * 60 * 1000)) / totalSpanMs) * 100;

    leftPercent = Math.max(0, Math.min(95, leftPercent));
    widthPercent = Math.max(5, Math.min(100 - leftPercent, widthPercent));

    return { left: `${leftPercent}%`, width: `${widthPercent}%` };
  };

  return (
    <div 
      className="rounded-3xl border shadow-xl overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4 bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-100">
              Interactive Gantt & Critical Path
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Visual timeline dependencies and milestone duration</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewWindow('14days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewWindow === '14days' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            2 Weeks
          </button>
          <button
            onClick={() => setViewWindow('30days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewWindow === '30days' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid border-b text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/40" 
               style={{ gridTemplateColumns: `240px repeat(${daysArray.length}, 1fr)`, borderColor: 'var(--border-color)' }}>
            <div className="p-3 text-left pl-6">Task & Milestone</div>
            {daysArray.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className={`p-2 border-l border-slate-800/60 ${isToday ? 'bg-emerald-950/40 text-emerald-400' : ''}`}>
                  <div>{d.toLocaleDateString([], { weekday: 'narrow' })}</div>
                  <div className="font-bold">{d.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-slate-800/40">
            {tasks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs italic">
                No tasks to display on timeline.
              </div>
            ) : (
              tasks.map((task) => {
                const barPos = calculateBarPosition(task);
                const subtasksCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.is_completed)?.length || 0;
                const progress = subtasksCount > 0 ? Math.round((completedSubtasks / subtasksCount) * 100) : (task.status === 'Done' ? 100 : 0);

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="grid items-center hover:bg-slate-900/30 cursor-pointer transition-colors group"
                    style={{ gridTemplateColumns: `240px repeat(${daysArray.length}, 1fr)` }}
                  >
                    {/* Left Column: Task Name & Assignee */}
                    <div className="p-3.5 pl-6 flex items-center justify-between gap-2 border-r border-slate-800/60">
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate group-hover:text-emerald-400 transition-colors ${
                          task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}>
                          {task.title}
                        </p>
                        <span className="text-[10px] text-slate-500 font-semibold block truncate">
                          {task.assigned_user?.name || 'Unassigned'} • {task.priority}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Bar Space */}
                    <div className="col-span-full relative h-12 flex items-center px-2">
                      <div
                        className={`absolute h-7 rounded-xl shadow-md border flex items-center px-2.5 justify-between gap-1 text-[10px] font-black transition-all hover:scale-[1.01] overflow-hidden ${getPriorityColor(
                          task.priority
                        )}`}
                        style={{ left: barPos.left, width: barPos.width }}
                        title={`${task.title} (${progress}% completed)`}
                      >
                        {/* Progress Fill Underlay */}
                        <div 
                          className="absolute top-0 left-0 bottom-0 bg-black/20"
                          style={{ width: `${progress}%` }}
                        />
                        <span className="truncate relative z-10">{task.title}</span>
                        <span className="relative z-10 shrink-0 opacity-80">{progress}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
