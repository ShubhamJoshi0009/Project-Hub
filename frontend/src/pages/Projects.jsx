import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  PlusCircle,
  Trash2, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  ChevronRight,
  Target,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getProjects, createProject, deleteProject } from '../api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ 
    title: '', 
    description: '', 
    category: 'General',
    priority: 'Medium',
    due_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProject.title) return;
    try {
      await createProject(newProject);
      setNewProject({ 
        title: '', 
        description: '', 
        category: 'General', 
        priority: 'Medium', 
        due_date: '' 
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const categories = ['All', ...new Set(projects.map(p => p.category || 'General'))];
  
  const filteredProjects = categoryFilter === 'All' 
    ? projects 
    : projects.filter(p => (p.category || 'General') === categoryFilter);

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: Briefcase, color: 'emerald' },
    { label: 'Active', value: projects.filter(p => p.status === 'Active').length, icon: Target, color: 'emerald' },
    { label: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, icon: Clock, color: 'amber' },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/30';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/30';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/30';
      default: return 'text-slate-500 bg-slate-900/20 border-slate-900/30';
    }
  };

  return (
    <div className="p-8 flex-1 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-main)' }}>Project Management</h1>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Organize and manage your project portfolio.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="p-6 rounded-2xl shadow-sm border flex items-center gap-4 transition-all hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className={`p-3 bg-${stat.color}-900/20 text-${stat.color}-400 rounded-xl`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                categoryFilter === cat 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'text-slate-500 hover:border-emerald-200'
              }`}
              style={{ 
                backgroundColor: categoryFilter === cat ? 'var(--primary)' : 'var(--bg-card)',
                borderColor: categoryFilter === cat ? 'var(--primary)' : 'var(--border-color)',
                color: categoryFilter === cat ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Main List */}
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <ClipboardList className="h-5 w-5 text-emerald-500" /> {categoryFilter === 'All' ? 'All Projects' : `${categoryFilter} Projects`}
            </h2>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-4 font-medium" style={{ color: 'var(--text-muted)' }}>Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="inline-block p-4 rounded-full mb-4" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)' }}>
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>No projects found</h3>
                <p className="mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>Create a new project or try a different filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project) => (
                  <Link 
                    key={project.id} 
                    to={`/projects/${project.id}`}
                    className="group p-6 rounded-2xl border shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden relative flex flex-col"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${
                      project.status === 'Active' ? 'bg-emerald-500' :
                      project.status === 'On Hold' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`} />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-900/20 dark:text-emerald-400">
                            {project.category || 'General'}
                          </span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold group-hover:text-emerald-600 transition-colors" style={{ color: 'var(--text-main)' }}>
                          {project.title}
                        </h4>
                        <div className="flex flex-wrap items-center text-xs gap-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          {project.due_date && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm line-clamp-2 mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="flex -space-x-2">
                        {project.members?.slice(0, 3).map((m, i) => (
                          <div key={i} className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" title={m.name} style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                            {m.name.charAt(0)}
                          </div>
                        ))}
                        {project.members?.length > 3 && (
                          <div className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                            +{project.members.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Details <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Create Form */}
          <div className="p-8 rounded-3xl shadow-2xl border sticky top-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <PlusCircle className="h-5 w-5 text-emerald-500" /> New Project
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Project Title</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="e.g. Design System v2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Category</label>
                  <input
                    type="text"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    value={newProject.category}
                    onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                    placeholder="e.g. Development"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Priority</label>
                  <select
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    value={newProject.priority}
                    onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                <div className="relative">
                  <DatePicker
                    selected={newProject.due_date ? new Date(newProject.due_date) : null}
                    onChange={(date) => setNewProject({ ...newProject, due_date: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select due date"
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    autoComplete="off"
                  />
                  <CalendarIcon className="absolute right-4 top-3 h-4 w-4 text-emerald-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  rows="3"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Summarize your objectives..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
