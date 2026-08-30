import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  CheckCircle2, Clock, Plus, AlertCircle 
} from 'lucide-react';

const CalendarView = ({ tasks = [], onTaskClick, onQuickAddTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Low': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-700 text-slate-300';
    }
  };

  // Build grid calendar cells
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      monthType: 'prev',
      dateStr: null
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const formattedDay = String(day).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    calendarCells.push({
      day,
      monthType: 'current',
      dateStr,
      isToday: isCurrentMonth && today.getDate() === day
    });
  }

  // Next month leading days (to fill 35 or 42 grid slots)
  const totalSlots = calendarCells.length > 35 ? 42 : 35;
  const remaining = totalSlots - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      day: i,
      monthType: 'next',
      dateStr: null
    });
  }

  return (
    <div 
      className="rounded-3xl border shadow-xl overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Calendar Header Navigator */}
      <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4 bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-100">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-400 font-semibold">Scheduled task deadlines</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl border text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            style={{ borderColor: 'var(--border-color)' }}
          >
            Today
          </button>
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b text-center text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/40" style={{ borderColor: 'var(--border-color)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-3">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 bg-slate-950/40">
        {calendarCells.map((cell, index) => {
          const dayTasks = cell.dateStr 
            ? tasks.filter((t) => t.due_date && t.due_date.startsWith(cell.dateStr))
            : [];

          return (
            <div
              key={index}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                cell.monthType !== 'current'
                  ? 'bg-slate-950/80 text-slate-600 opacity-40'
                  : 'hover:bg-slate-900/40'
              } ${cell.isToday ? 'bg-emerald-950/20' : ''}`}
            >
              {/* Day Number Header */}
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-black h-6 w-6 rounded-full flex items-center justify-center ${
                  cell.isToday ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40' : 'text-slate-400'
                }`}>
                  {cell.day}
                </span>

                {dayTasks.length > 0 && (
                  <span className="text-[10px] font-black text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks List for Date */}
              <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`w-full text-left p-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-1 transition-transform hover:scale-[1.02] ${getPriorityBadge(t.priority)}`}
                    title={`${t.title} (${t.status})`}
                  >
                    <span className={`truncate flex-1 ${t.status === 'Done' ? 'line-through opacity-60' : ''}`}>
                      {t.title}
                    </span>
                    {t.status === 'Done' ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                    ) : (
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        t.status === 'In Progress' ? 'bg-amber-400' : 'bg-slate-400'
                      }`} />
                    )}
                  </button>
                ))}
              </div>

              <div />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
