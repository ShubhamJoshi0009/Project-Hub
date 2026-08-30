import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  X, CheckCircle2, Circle, Clock, Calendar as CalendarIcon, 
  Trash2, User, Send, Plus, Tag, CheckSquare, MessageSquare, 
  AlertCircle, Sparkles, Play, Pause, RotateCcw, Timer, History,
  Repeat, GitBranch, Cpu
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { 
  updateTask, deleteTask, getSubtasks, addSubtask, 
  updateSubtask, deleteSubtask, getComments, addComment,
  getTaskTimeLogs, addTaskTimeLog, aiBreakdownTask
} from '../api';
import { AuthContext } from '../AuthContextInstance';
import { useToast } from './Toast';

const TaskModal = ({ isOpen, onClose, task, projectId, projectMembers = [], onTaskUpdated }) => {
  const { user: currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Todo');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [tags, setTags] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [actualHours, setActualHours] = useState(0);
  const [recurrence, setRecurrence] = useState('none');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Subtasks, Comments & Time Logs
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [timeLogs, setTimeLogs] = useState([]);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');

  // Live Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [loadingTimeLogs, setLoadingTimeLogs] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'comments', 'time'

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'Todo');
      setPriority(task.priority || 'Medium');
      setDueDate(task.due_date || '');
      setAssignedTo(task.assigned_to || '');
      setTags(task.tags || '');
      setEstimatedHours(task.estimated_hours || '');
      setActualHours(task.actual_hours || 0);

      loadSubtasks();
      loadComments();
      loadTimeLogs();
    } else {
      // Reset timer on close
      setIsTimerRunning(false);
      clearInterval(timerRef.current);
      setTimerSeconds(0);
    }
  }, [task, isOpen]);

  // Stopwatch effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const loadSubtasks = async () => {
    if (!task) return;
    setLoadingSubtasks(true);
    try {
      const res = await getSubtasks(projectId, task.id);
      setSubtasks(res.data || []);
    } catch (err) {
      console.error('Failed to load subtasks:', err);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  const loadComments = async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const res = await getComments(projectId, task.id);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadTimeLogs = async () => {
    if (!task) return;
    setLoadingTimeLogs(true);
    try {
      const res = await getTaskTimeLogs(projectId, task.id);
      setTimeLogs(res.data || []);
    } catch (err) {
      console.error('Failed to load time logs:', err);
    } finally {
      setLoadingTimeLogs(false);
    }
  };

  const handleSaveDetails = async (updatesOverride = {}) => {
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        due_date: dueDate || null,
        assigned_to: assignedTo || null,
        tags,
        estimated_hours: estimatedHours ? Number(estimatedHours) : null,
        recurrence,
        ...updatesOverride,
      };
      await updateTask(projectId, task.id, payload);
      toast.success('Task updated');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleAIGenerateSubtasks = async () => {
    if (!title.trim()) return;
    setAiGenerating(true);
    try {
      const res = await aiBreakdownTask(projectId, { title, description });
      const suggestions = res.data.suggested_subtasks || [];
      for (const item of suggestions) {
        await addSubtask(projectId, task.id, item);
      }
      toast.success(`AI generated ${suggestions.length} checklist milestones!`);
      loadSubtasks();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await handleSaveDetails({ status: newStatus });
  };

  const handlePriorityChange = async (newPriority) => {
    setPriority(newPriority);
    await handleSaveDetails({ priority: newPriority });
  };

  const handleAssigneeChange = async (newAssignee) => {
    setAssignedTo(newAssignee);
    await handleSaveDetails({ assigned_to: newAssignee || null });
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    try {
      await deleteTask(projectId, task.id);
      toast.success('Task deleted');
      onClose();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Subtasks logic
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const res = await addSubtask(projectId, task.id, newSubtaskTitle.trim());
      setSubtasks((prev) => [...prev, res.data]);
      setNewSubtaskTitle('');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtask) => {
    try {
      const updated = { is_completed: !subtask.is_completed };
      const res = await updateSubtask(projectId, task.id, subtask.id, updated);
      setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? res.data : s)));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await deleteSubtask(projectId, task.id, subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to delete subtask');
    }
  };

  // Comments logic
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await addComment(projectId, task.id, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      toast.success('Comment posted');
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  // Time logging logic
  const handleSaveTimer = async () => {
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    try {
      const res = await addTaskTimeLog(projectId, task.id, {
        duration_minutes: minutes,
        description: `Tracked via Live Timer (${Math.floor(timerSeconds / 60)}m ${timerSeconds % 60}s)`
      });
      setTimeLogs((prev) => [res.data, ...prev]);
      setActualHours((prev) => Number((Number(prev) + minutes / 60).toFixed(2)));
      setIsTimerRunning(false);
      setTimerSeconds(0);
      toast.success(`Logged ${minutes} min to task`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to log timer');
    }
  };

  const handleManualTimeLog = async (e) => {
    e.preventDefault();
    const mins = Number(manualMinutes);
    if (!mins || mins <= 0) return;

    try {
      const res = await addTaskTimeLog(projectId, task.id, {
        duration_minutes: mins,
        description: manualNote || 'Manual time entry'
      });
      setTimeLogs((prev) => [res.data, ...prev]);
      setActualHours((prev) => Number((Number(prev) + mins / 60).toFixed(2)));
      setManualMinutes('');
      setManualNote('');
      toast.success(`Logged ${mins} minutes`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      toast.error('Failed to save time log');
    }
  };

  if (!isOpen || !task) return null;

  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const subtaskProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  const assignedMember = projectMembers.find((m) => m.id === assignedTo);

  const formatTimerDisplay = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />

      <div 
        className="fixed top-0 right-0 h-full w-full max-w-2xl z-[80] shadow-2xl transition-all duration-300 transform translate-x-0 flex flex-col border-l"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              Task Details
            </span>
            <div className="flex items-center gap-1.5">
              {['Todo', 'In Progress', 'In Review', 'Done'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    status === st
                      ? st === 'Done'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : st === 'In Progress'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : st === 'In Review'
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Delete Task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b px-6 bg-slate-900/30" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Checklist ({subtasks.length})
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'time'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="h-3.5 w-3.5" /> Time Tracking ({actualHours}h)
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Discussions ({comments.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'details' && (
            <>
              {/* Title */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSaveDetails()}
                  placeholder="Task title..."
                  className="w-full text-xl font-bold rounded-xl px-4 py-2.5 border focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Assignee */}
                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="h-3 w-3 text-emerald-400" /> Assignee
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                    <CalendarIcon className="h-3 w-3 text-emerald-400" /> Due Date
                  </label>
                  <DatePicker
                    selected={dueDate ? new Date(dueDate) : null}
                    onChange={(date) => {
                      const dateStr = date ? date.toISOString().split('T')[0] : '';
                      setDueDate(dateStr);
                      handleSaveDetails({ due_date: dateStr || null });
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Set due date"
                    className="w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleSaveDetails()}
                  placeholder="Task instructions, criteria, or context..."
                  className="w-full text-xs rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 outline-none transition-all leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Subtasks Section */}
              <div className="p-6 rounded-2xl border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Milestone Checklist ({completedSubtasks}/{subtasks.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={handleAIGenerateSubtasks}
                      className={`px-3 py-1 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 ${
                        aiGenerating ? 'opacity-50 animate-pulse' : 'active:scale-95'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{aiGenerating ? 'Generating...' : 'AI Subtasks'}</span>
                    </button>

                    {subtasks.length > 0 && (
                      <span className="text-xs font-black text-emerald-400">{subtaskProgress}%</span>
                    )}
                  </div>
                </div>

                {subtasks.length > 0 && (
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(subtask)}
                        className="flex items-center gap-3 text-left flex-1"
                      >
                        {subtask.is_completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-emerald-400" />
                        )}
                        <span className={`text-xs font-semibold ${subtask.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {subtask.title}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add checklist milestone..."
                    className="flex-1 text-xs rounded-xl px-3 py-2 border outline-none focus:ring-1 focus:ring-emerald-500"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 2: TIME TRACKING */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              {/* Live Stopwatch Card */}
              <div className="p-6 rounded-3xl border bg-slate-900/60 border-slate-800 space-y-4 text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Task Stopwatch</span>
                <div className="text-4xl font-mono font-black text-emerald-400 tracking-wider">
                  {formatTimerDisplay(timerSeconds)}
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {!isTimerRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(true)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" /> Start Timer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(false)}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2"
                    >
                      <Pause className="h-4 w-4" /> Pause
                    </button>
                  )}

                  {timerSeconds > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveTimer}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all"
                    >
                      Log Time
                    </button>
                  )}
                </div>
              </div>

              {/* Manual Time Logger Form */}
              <form onSubmit={handleManualTimeLog} className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-200">Log Hours Manually</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Minutes (e.g. 45)"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="text-xs rounded-xl px-3 py-2 border outline-none"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                  <input
                    type="text"
                    placeholder="Work note (optional)..."
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="sm:col-span-2 text-xs rounded-xl px-3 py-2 border outline-none"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                  >
                    Save Log
                  </button>
                </div>
              </form>

              {/* Time Logs History */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-emerald-400" /> Logged Sessions ({timeLogs.length})
                </h4>

                <div className="space-y-2">
                  {timeLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No time logs recorded yet.</p>
                  ) : (
                    timeLogs.map((log) => (
                      <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-200">
                            {log.duration_minutes} minutes ({ (log.duration_minutes / 60).toFixed(2) }h)
                          </span>
                          <p className="text-[11px] text-slate-400">{log.description || 'Logged work'}</p>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISCUSSIONS / COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3.5 p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                      <div className="h-9 w-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-200">{c.user?.name || 'User'}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="relative pt-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment or feedback..."
                  rows="3"
                  className="w-full text-xs rounded-2xl p-4 border focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute bottom-4 right-4 p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-900/80 flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
          <span className="text-[10px] font-bold text-slate-400">
            Auto-saves changes as you edit
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
