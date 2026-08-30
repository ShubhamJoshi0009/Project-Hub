import React, { useState } from 'react';
import { 
  Plus, CheckCircle2, Clock, Calendar as CalendarIcon, 
  MessageSquare, CheckSquare, MoreVertical, Trash2, ArrowRight, User, AlertCircle
} from 'lucide-react';
import { updateTask } from '../api';
import { useToast } from './Toast';

const COLUMNS = [
  { id: 'Todo', title: 'To Do', color: 'slate', border: 'border-slate-700/60', badge: 'bg-slate-800 text-slate-300' },
  { id: 'In Progress', title: 'In Progress', color: 'amber', border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  { id: 'In Review', title: 'In Review', color: 'sky', border: 'border-sky-500/30', badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/20' },
  { id: 'Done', title: 'Done', color: 'emerald', border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
];

const KanbanBoard = ({ tasks = [], projectId, onTaskClick, onTaskUpdated, onQuickAddTask }) => {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [quickTitleByCol, setQuickTitleByCol] = useState({});
  const toast = useToast();

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    try {
      await updateTask(projectId, taskId, { status: targetStatus });
      toast.success(`Task moved to ${targetStatus}`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to move task');
    }
  };

  const handleQuickAdd = async (e, status) => {
    e.preventDefault();
    const title = (quickTitleByCol[status] || '').trim();
    if (!title) return;

    try {
      await onQuickAddTask({ title, status, priority: 'Medium' });
      setQuickTitleByCol((prev) => ({ ...prev, [status]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/40';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/40';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-800';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || 'Todo') === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex flex-col rounded-3xl p-4 border transition-all duration-200 min-h-[450px] ${col.border} ${
              isTarget ? 'bg-slate-900/80 ring-2 ring-emerald-500/50 scale-[1.01]' : 'bg-slate-950/40'
            }`}
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center px-2 py-2 mb-3">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  col.id === 'Done' ? 'bg-emerald-500' :
                  col.id === 'In Progress' ? 'bg-amber-500' :
                  col.id === 'In Review' ? 'bg-sky-500' : 'bg-slate-500'
                }`} />
                <h3 className="text-sm font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {col.title}
                </h3>
              </div>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${col.badge}`}>
                {colTasks.length}
              </span>
            </div>

            {/* Task Cards Container */}
            <div className="flex-1 space-y-3">
              {colTasks.map((task) => {
                const subtasksCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.is_completed)?.length || 0;
                const overdue = isOverdue(task.due_date, task.status);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick(task)}
                    className="p-4 rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 group relative select-none"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
                  >
                    {/* Header: Priority & Status Pill */}
                    <div className="flex justify-between items-center gap-2 mb-2.5">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority || 'Medium'}
                      </span>

                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-[11px] font-bold ${
                          overdue ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                        }`}>
                          {overdue && <AlertCircle className="h-3 w-3 text-rose-400" />}
                          <CalendarIcon className="h-3 w-3" />
                          <span>{new Date(task.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className={`text-sm font-bold leading-snug mb-2 group-hover:text-emerald-400 transition-colors ${
                      task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-100'
                    }`}>
                      {task.title}
                    </h4>

                    {/* Description preview if exists */}
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Footer: Assignee & Checklist/Comment indicators */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/80 mt-2">
                      {/* Left: Assignee */}
                      <div className="flex items-center gap-1.5">
                        {task.assigned_user ? (
                          <div className="flex items-center gap-1.5" title={`Assigned to ${task.assigned_user.name}`}>
                            <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                              {task.assigned_user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 truncate max-w-[80px]">
                              {task.assigned_user.name?.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold">
                            <User className="h-3 w-3 opacity-60" /> Unassigned
                          </div>
                        )}
                      </div>

                      {/* Right: Subtasks / Checklist count */}
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                        {subtasksCount > 0 && (
                          <span className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${
                            completedSubtasks === subtasksCount ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400'
                          }`}>
                            <CheckSquare className="h-3 w-3" />
                            {completedSubtasks}/{subtasksCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
                  Drop tasks here
                </div>
              )}
            </div>

            {/* Quick Add at bottom */}
            <form onSubmit={(e) => handleQuickAdd(e, col.id)} className="mt-3 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`+ Add task to ${col.title}...`}
                  value={quickTitleByCol[col.id] || ''}
                  onChange={(e) => setQuickTitleByCol({ ...quickTitleByCol, [col.id]: e.target.value })}
                  className="flex-1 text-xs rounded-xl px-3 py-2 border outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
                {quickTitleByCol[col.id]?.trim() && (
                  <button
                    type="submit"
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
