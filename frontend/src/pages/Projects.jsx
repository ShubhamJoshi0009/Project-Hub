import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, PlusCircle, Trash2, Calendar as CalendarIcon, 
  ClipboardList, ChevronRight, Target, Clock, Briefcase, 
  AlertCircle, Search, Filter, LayoutGrid, List, CheckCircle2,
  FolderPlus, Sparkles, Tag, DollarSign, Palette
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getProjects, createProject, deleteProject } from '../api';
import { useToast } from '../components/Toast';

const PRESET_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'due_date', 'priority'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'table'
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);

  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    category: 'Development',
    priority: 'Medium',
    due_date: '',
    color: '#10b981',
    tags: ''
  });

  const toast = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;

    try {
      await createProject(newProject);
      toast.success('Project created successfully');
      setNewProject({ 
        title: '', 
        description: '', 
        category: 'Development', 
        priority: 'Medium', 
        due_date: '',
        color: '#10b981',
        tags: ''
      });
      setIsCreatingModalOpen(false);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (e, id, title) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete project "${title}"?`)) return;

    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const categories = ['All', ...new Set(projects.map((p) => p.category || 'General'))];

  // Filtering & Sorting
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'All' || (p.category || 'General') === categoryFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'due_date') {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }
    if (sortBy === 'priority') {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
    }
    return 0;
  });

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: Briefcase, color: 'emerald' },
    { label: 'Active Projects', value: projects.filter((p) => p.status === 'Active').length, icon: Target, color: 'emerald' },
    { label: 'On Hold', value: projects.filter((p) => p.status === 'On Hold').length, icon: Clock, color: 'amber' },
    { label: 'Completed', value: projects.filter((p) => p.status === 'Completed').length, icon: CheckCircle2, color: 'sky' },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/40';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/40';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-800';
    }
  };

  const isProjectOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Completed') return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  return (
    <div className="p-6 md:p-8 flex-1 bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
              Projects Portfolio
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-400">
              Manage, monitor, and collaborate across all project initiatives.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingModalOpen(true)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" /> New Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              className="p-5 rounded-2xl shadow-sm border flex items-center gap-4 transition-all hover:border-emerald-500/30"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className={`p-3 bg-${stat.color}-500/10 text-${stat.color}-400 rounded-xl border border-${stat.color}-500/20 shrink-0`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">{stat.label}</p>
                <p className="text-2xl font-black text-slate-100">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Control Bar */}
        <div 
          className="p-4 rounded-2xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Top Search & Layout controls */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[240px] bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects by title, category, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-bold rounded-xl px-3 py-2 border border-slate-800 bg-slate-900 text-slate-300 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold rounded-xl px-3 py-2 border border-slate-800 bg-slate-900 text-slate-300 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
              </select>

              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Table View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 border-slate-800 bg-slate-900/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-3xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-16 rounded-3xl border-2 border-dashed text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="inline-block p-4 rounded-2xl mb-4 bg-slate-900 text-slate-400 border border-slate-800">
              <FolderPlus className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No projects found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              Create a new project or adjust your search filters to view existing projects.
            </p>
            <button
              onClick={() => setIsCreatingModalOpen(true)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
            >
              Create New Project
            </button>
          </div>
        ) : layoutMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const tasks = project.tasks || [];
              const completedTasks = tasks.filter((t) => t.status === 'Done').length;
              const totalTasks = tasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const overdue = isProjectOverdue(project.due_date, project.status);

              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="p-6 rounded-3xl border shadow-md transition-all hover:shadow-2xl hover:-translate-y-1 relative flex flex-col justify-between group"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  {/* Top Status Bar Accent */}
                  <div 
                    className="absolute top-0 left-6 right-6 h-1 rounded-b-md"
                    style={{ backgroundColor: project.color || '#10b981' }}
                  />

                  <div>
                    {/* Header meta */}
                    <div className="flex justify-between items-start mb-3 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                          {project.category || 'General'}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityColor(project.priority)}`}>
                          {project.priority || 'Medium'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(e, project.id, project.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-2 leading-snug">
                      {project.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-slate-400">
                        <span>Task Completion</span>
                        <span className="text-emerald-400 font-black">{progress}% ({completedTasks}/{totalTasks})</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                      {/* Due date */}
                      {project.due_date ? (
                        <div className={`flex items-center gap-1 text-[11px] font-bold ${
                          overdue ? 'text-rose-400 animate-pulse' : 'text-slate-400'
                        }`}>
                          {overdue && <AlertCircle className="h-3 w-3 text-rose-400" />}
                          <CalendarIcon className="h-3 w-3" />
                          <span>Due {new Date(project.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold">No due date</span>
                      )}

                      {/* Members pile */}
                      <div className="flex -space-x-1.5">
                        {project.members?.slice(0, 3).map((m, i) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full bg-emerald-600 border border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                            title={m.name}
                          >
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-3xl border overflow-hidden shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/60">
                  <th className="p-4">Project</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredProjects.map((p) => {
                  const tasks = p.tasks || [];
                  const completed = tasks.filter((t) => t.status === 'Done').length;
                  const prog = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="p-4">
                        <Link to={`/projects/${p.id}`} className="font-bold text-slate-100 hover:text-emerald-400 transition-colors">
                          {p.title}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-300">{p.status}</span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityColor(p.priority)}`}>
                          {p.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${prog}%` }} />
                          </div>
                          <span className="font-bold text-slate-300">{prog}%</span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-400">
                        {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => handleDelete(e, p.id, p.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreatingModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70] transition-opacity"
            onClick={() => setIsCreatingModalOpen(false)}
          />

          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[80] shadow-2xl rounded-3xl border p-8 max-h-[90vh] flex flex-col"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <FolderPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-100">Create New Project</h2>
                  <p className="text-xs text-slate-400 font-medium">Define your goals, category, and timeline</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar">
              {/* Starter Template Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> Starter Template Pack
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: '', title: 'Blank Project', icon: '📄', desc: 'Empty canvas' },
                    { id: 'software_sprint', title: 'Software Sprint', icon: '⚡', desc: '5 tasks + Specs' },
                    { id: 'product_launch', title: 'Product Launch', icon: '🚀', desc: 'GTM & Beta test' },
                    { id: 'bug_tracker', title: 'Bug Tracker', icon: '🐞', desc: 'Triage & QA guide' },
                    { id: 'design_system', title: 'Design System', icon: '🎨', desc: 'Tokens & Storybook' },
                    { id: 'marketing', title: 'Marketing', icon: '📢', desc: 'Campaign & Drip' },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setNewProject({
                          ...newProject,
                          template: tpl.id,
                          category: tpl.id === 'software_sprint' ? 'Development' : tpl.id === 'product_launch' ? 'Product' : tpl.id === 'bug_tracker' ? 'QA' : tpl.id === 'design_system' ? 'Design' : tpl.id === 'marketing' ? 'Marketing' : newProject.category,
                          title: !newProject.title && tpl.id ? `${tpl.title} Initiative` : newProject.title
                        });
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        newProject.template === tpl.id || (!newProject.template && tpl.id === '')
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/50'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{tpl.icon}</span>
                        <span className="text-xs font-bold text-slate-100">{tpl.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{tpl.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Mobile App"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full text-sm font-semibold rounded-xl px-4 py-2.5 border outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Design, Mobile, Dev"
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-2.5 border outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Due Date
                  </label>
                  <DatePicker
                    selected={newProject.due_date ? new Date(newProject.due_date) : null}
                    onChange={(date) => setNewProject({ ...newProject, due_date: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select target date"
                    className="w-full text-xs font-bold rounded-xl px-4 py-2.5 border outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Q3, Frontend, Supabase"
                    value={newProject.tags}
                    onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl px-4 py-2.5 border outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-emerald-400" /> Color Accent
                </label>
                <div className="flex items-center gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, color: c })}
                      className={`h-7 w-7 rounded-xl transition-transform ${newProject.color === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Description & Goals
                </label>
                <textarea
                  rows="3"
                  placeholder="Outline key deliverables, scope, and objectives..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full text-xs rounded-xl px-4 py-2.5 border outline-none resize-none"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default Projects;
