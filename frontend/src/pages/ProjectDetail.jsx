import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Trash2, CheckCircle2, Circle, Clock, 
  Users, UserPlus, Shield, Activity, Calendar as CalendarIcon,
  AlertCircle, Paperclip, FileText, Download, X, LayoutGrid, 
  ListTodo, Search, Filter, Share2, Sparkles, CheckSquare, Edit3,
  BookOpen, Globe, FileSpreadsheet, Zap, MessageSquare, 
  BarChart3, Cpu, GitPullRequest, TrendingUp, Volume2
} from 'lucide-react';
import { 
  getProject, 
  addTask, 
  updateTask, 
  deleteTask, 
  updateProject, 
  getAttachments, 
  addAttachment, 
  deleteAttachment,
  uploadFile,
  getActivities,
  exportProject,
  exportProjectCSV
} from '../api';
import { supabase } from '../supabaseClient';
import { AuthContext } from '../AuthContextInstance';
import KanbanBoard from '../components/KanbanBoard';
import CalendarView from '../components/CalendarView';
import GanttChart from '../components/GanttChart';
import WorkloadHeatmap from '../components/WorkloadHeatmap';
import AutomationsTab from '../components/AutomationsTab';
import LiveChatAndHuddle from '../components/LiveChatAndHuddle';
import AIAssistantModal from '../components/AIAssistantModal';
import IntegrationsTab from '../components/IntegrationsTab';
import AnalyticsTab from '../components/AnalyticsTab';
import ProjectDocsTab from '../components/ProjectDocsTab';
import TaskModal from '../components/TaskModal';
import TeamModal from '../components/TeamModal';
import ShareProjectModal from '../components/ShareProjectModal';
import ActivityTimeline from '../components/ActivityTimeline';
import { useToast } from '../components/Toast';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [activeTab, setActiveTab] = useState('tasks'); 
  // 'tasks', 'docs', 'chat', 'workload', 'automations', 'analytics', 'integrations', 'activities', 'files', 'team'
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'list' | 'calendar' | 'gantt'
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New task quick state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  const fetchProjectData = useCallback(async () => {
    try {
      const [projRes, attachRes, actRes] = await Promise.all([
        getProject(id),
        getAttachments(id).catch(() => ({ data: [] })),
        getActivities(id).catch(() => ({ data: [] })),
      ]);
      setProject(projRes.data);
      setAttachments(attachRes.data || []);
      setActivities(actRes.data || []);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Real-time updates via Supabase
  useEffect(() => {
    const channel = supabase
      .channel(`project-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` }, () => {
        fetchProjectData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `project_id=eq.${id}` }, () => {
        fetchProjectData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_docs', filter: `project_id=eq.${id}` }, () => {
        fetchProjectData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchProjectData]);

  // Task Handlers
  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await addTask(id, { 
        title: newTaskTitle.trim(), 
        priority: newTaskPriority,
        due_date: newTaskDueDate || null,
        assigned_to: newTaskAssignee || null,
        status: 'Todo'
      });
      setNewTaskTitle('');
      setNewTaskPriority('Medium');
      setNewTaskDueDate('');
      setNewTaskAssignee('');
      toast.success('Task created');
      fetchProjectData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleQuickAddTask = async (taskData) => {
    try {
      await addTask(id, taskData);
      toast.success('Task created');
      fetchProjectData();
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      await updateTask(id, task.id, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus}`);
      fetchProjectData();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id, taskId);
      toast.success('Task deleted');
      fetchProjectData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // Project Info Updates
  const handleUpdateField = async (field, value) => {
    try {
      await updateProject(id, { [field]: value });
      toast.success(`Project ${field} updated`);
      fetchProjectData();
    } catch (error) {
      toast.error(`Failed to update ${field}`);
    }
  };

  // Attachments
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const description = window.prompt('File description (optional):');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadFile(formData);
      const { file_name, file_url, file_type, file_size } = response.data;

      await addAttachment(id, {
        file_name,
        file_url,
        file_type,
        file_size,
        description: description || ''
      });

      toast.success('File uploaded');
      fetchProjectData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await deleteAttachment(id, attachmentId);
      toast.success('Attachment deleted');
      fetchProjectData();
    } catch (error) {
      toast.error('Failed to delete attachment');
    }
  };

  // Export Project JSON
  const handleExportJSON = async () => {
    try {
      const res = await exportProject(id);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${project.title.replace(/\s+/g, '_')}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Project JSON exported');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-32 text-slate-400">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-200">Project Not Found</h2>
        <p className="text-sm mt-1">You may not have permission to view this project.</p>
        <Link to="/projects" className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs">
          Return to Projects
        </Link>
      </div>
    );
  }

  const isOwner = project.owner_id === currentUser?.id || project.owner?.id === currentUser?.id;
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'All' || (assigneeFilter === 'Unassigned' ? !t.assigned_to : t.assigned_to === assigneeFilter);
    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  const getPriorityColor = (p) => {
    switch (p) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/40';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/40';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-800';
    }
  };

  return (
    <div className="p-6 md:p-8 flex-1 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Back Navigation & Action Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Link 
            to="/projects" 
            className="inline-flex items-center text-xs font-black text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> All Projects
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Assistant</span>
            </button>

            {/* Public Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                project.is_public
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-md'
                  : 'text-slate-300 border-slate-800 bg-slate-900/60 hover:bg-slate-800'
              }`}
              title="Share project with public link"
            >
              <Globe className="h-4 w-4 text-emerald-400" />
              <span>{project.is_public ? 'Public Link Active' : 'Share Link'}</span>
            </button>

            {/* Team Collaborators */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-slate-800"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            >
              <Users className="h-4 w-4 text-emerald-400" />
              Team ({project.members?.length || 1})
            </button>

            {/* Export CSV */}
            <a
              href={exportProjectCSV(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-slate-800 text-slate-300"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              title="Export tasks to CSV spreadsheet"
            >
              <FileSpreadsheet className="h-4 w-4 text-teal-400" />
              CSV
            </a>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all hover:bg-slate-800 text-slate-300"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
              title="Export project data as JSON"
            >
              <Share2 className="h-4 w-4 text-sky-400" />
              JSON
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div 
          className="rounded-3xl shadow-xl border overflow-hidden p-8 md:p-10 relative"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: project.color || '#10b981' }}
          />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
            {/* Left Info */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {project.category || 'General'}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${getPriorityColor(project.priority)}`}>
                  {project.priority || 'Medium'}
                </span>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">
                  <div className={`h-2 w-2 rounded-full ${
                    project.status === 'Active' ? 'bg-emerald-500' :
                    project.status === 'On Hold' ? 'bg-amber-500' :
                    project.status === 'Completed' ? 'bg-emerald-400' : 'bg-slate-500'
                  }`} />
                  <span>{project.status}</span>
                </div>
                {project.is_public && (
                  <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Public View Enabled
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
                {project.title}
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {project.description || 'No description provided for this project.'}
              </p>

              {/* Meta details */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-emerald-400" />
                  <span>Created {new Date(project.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {project.due_date && (
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Due {new Date(project.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {/* Team avatar pile */}
                <div 
                  onClick={() => setIsTeamModalOpen(true)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((m, i) => (
                      <div 
                        key={i} 
                        className="h-7 w-7 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        title={m.name}
                      >
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {project.members?.length || 1} collaborator{project.members?.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Progress & Controls */}
            <div className="w-full lg:w-72 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</span>
                  <p className="text-xs font-bold text-slate-300">{completedTasks} of {totalTasks} tasks done</p>
                </div>
                <span className="text-3xl font-black text-emerald-400">{progressPercent}%</span>
              </div>

              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Status Selector for Owner */}
              {isOwner && (
                <div className="pt-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Project Status
                  </label>
                  <select
                    value={project.status}
                    onChange={(e) => handleUpdateField('status', e.target.value)}
                    className="w-full text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-4" style={{ borderColor: 'var(--border-color)' }}>
          {/* Main Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'tasks', label: 'Tasks & Views', icon: LayoutGrid, count: totalTasks },
              { id: 'docs', label: 'Specs & Wiki', icon: BookOpen, count: '' },
              { id: 'chat', label: 'Chat & Huddles', icon: MessageSquare, count: '' },
              { id: 'workload', label: 'Workload & Heatmap', icon: Users, count: '' },
              { id: 'automations', label: 'Automations', icon: Zap, count: '' },
              { id: 'analytics', label: 'Sprint Analytics', icon: TrendingUp, count: '' },
              { id: 'integrations', label: 'Integrations', icon: GitPullRequest, count: '' },
              { id: 'files', label: 'Files', icon: FileText, count: attachments.length },
              { id: 'team', label: 'Team & RBAC', icon: Shield, count: project.members?.length || 1 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== '' && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* View Switcher if Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'board' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Board
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListTodo className="h-3.5 w-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Calendar
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'gantt' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5" /> Gantt
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: TASKS (BOARD / LIST / CALENDAR / GANTT) */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Quick Add Task Bar */}
            <form 
              onSubmit={handleCreateTask}
              className="p-4 md:p-6 rounded-3xl border shadow-xl flex flex-wrap items-center gap-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex-1 min-w-[240px]">
                <input
                  type="text"
                  placeholder="Task title / Next deliverable..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl px-4 py-2.5 border outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <select
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer max-w-[140px]"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <option value="">Assignee</option>
                {project.members?.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <div className="relative">
                <DatePicker
                  selected={newTaskDueDate ? new Date(newTaskDueDate) : null}
                  onChange={(date) => setNewTaskDueDate(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Due Date"
                  className="text-xs font-bold rounded-xl px-3 py-2.5 border outline-none w-[120px]"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Task
              </button>
            </form>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="flex items-center gap-3 flex-1 min-w-[220px]">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter tasks by title or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-800 bg-slate-900 text-slate-300 outline-none cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="text-xs font-bold rounded-xl px-3 py-1.5 border border-slate-800 bg-slate-900 text-slate-300 outline-none cursor-pointer"
                >
                  <option value="All">All Assignees</option>
                  <option value="Unassigned">Unassigned</option>
                  {project.members?.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active View Render */}
            {viewMode === 'board' && (
              <KanbanBoard
                tasks={filteredTasks}
                projectId={id}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsTaskModalOpen(true);
                }}
                onTaskUpdated={fetchProjectData}
                onQuickAddTask={handleQuickAddTask}
              />
            )}

            {viewMode === 'list' && (
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <div className="p-12 rounded-3xl border border-dashed text-center text-slate-500 text-sm">
                    No matching tasks found.
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="p-4 rounded-2xl border flex items-center justify-between transition-all hover:border-emerald-500/40 cursor-pointer group shadow-sm"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskStatus(task);
                          }}
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                        >
                          {task.status === 'Done' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>

                        <div>
                          <p className={`text-sm font-bold ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                              {task.status}
                            </span>
                            {task.due_date && (
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" /> Due {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {task.assigned_user && (
                          <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            {task.assigned_user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {viewMode === 'calendar' && (
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsTaskModalOpen(true);
                }}
                onQuickAddTask={handleQuickAddTask}
              />
            )}

            {viewMode === 'gantt' && (
              <GanttChart
                tasks={filteredTasks}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setIsTaskModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {/* TAB 2: SPECS & WIKI */}
        {activeTab === 'docs' && (
          <ProjectDocsTab projectId={id} isOwner={isOwner} />
        )}

        {/* TAB 3: LIVE TEAM CHAT & AUDIO HUDDLES */}
        {activeTab === 'chat' && (
          <LiveChatAndHuddle projectId={id} />
        )}

        {/* TAB 4: WORKLOAD CAPACITY & HEATMAP */}
        {activeTab === 'workload' && (
          <WorkloadHeatmap projectId={id} />
        )}

        {/* TAB 5: AUTOMATED WORKFLOWS */}
        {activeTab === 'automations' && (
          <AutomationsTab projectId={id} />
        )}

        {/* TAB 6: SPRINT BURNDOWN & VELOCITY */}
        {activeTab === 'analytics' && (
          <AnalyticsTab project={project} />
        )}

        {/* TAB 7: DEVELOPER INTEGRATIONS & WEBHOOKS */}
        {activeTab === 'integrations' && (
          <IntegrationsTab projectId={id} />
        )}

        {/* TAB 8: ATTACHMENTS */}
        {activeTab === 'files' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="text-base font-black text-slate-200">Project Files & Cloud Attachments</h3>
                <p className="text-xs text-slate-400">Upload assets, design files, and documents (Supabase Storage)</p>
              </div>

              <label className={`cursor-pointer px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 ${
                isUploading ? 'opacity-50 pointer-events-none animate-pulse' : 'active:scale-95'
              }`}>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                <Plus className="h-4 w-4" />
                <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.length === 0 ? (
                <div className="col-span-full p-12 rounded-3xl border border-dashed text-center text-slate-500 text-sm">
                  No files shared yet.
                </div>
              ) : (
                attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-5 rounded-2xl border flex flex-col justify-between group transition-all hover:border-emerald-500/40"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate" title={file.file_name}>
                            {file.file_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {(file.file_size / 1024).toFixed(1)} KB • {file.user?.name || 'User'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Download / Open"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {(file.user_id === currentUser?.id || isOwner) && (
                          <button
                            onClick={() => handleDeleteAttachment(file.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {file.description && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                        "{file.description}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 9: TEAM & RBAC */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-6 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="text-base font-black text-slate-200">Collaborators & Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-slate-400">Team members participating in this workspace</p>
              </div>

              {isOwner && (
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" /> Invite Member
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members?.map((member) => (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl border flex items-center justify-between"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-base shrink-0">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                        {member.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {(member.id === project.owner_id || member.role === 'owner') && (
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20" title="Project Owner">
                      <Shield className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectId={id}
        projectMembers={project.members || []}
        onTaskUpdated={fetchProjectData}
      />

      {/* Team Management Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        project={project}
        onMemberUpdated={fetchProjectData}
      />

      {/* Share Project Modal */}
      <ShareProjectModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        onProjectUpdated={fetchProjectData}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        projectId={id}
        onProjectUpdated={fetchProjectData}
      />
    </div>
  );
};

export default ProjectDetail;
