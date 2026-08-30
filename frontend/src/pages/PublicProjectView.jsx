import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Briefcase, Calendar, CheckSquare, Clock, Download, 
  FileText, Globe, LayoutGrid, ListTodo, Shield, 
  Sparkles, User, AlertCircle, X, ChevronRight, BookOpen
} from 'lucide-react';
import { getPublicProject } from '../api';

const COLUMNS = ['Todo', 'In Progress', 'In Review', 'Done'];

const PublicProjectView = () => {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('board'); // 'board', 'docs', 'files'
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await getPublicProject(token);
        setProject(res.data);
      } catch (err) {
        setError('This project is not publicly accessible or the share link has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest">Loading public project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <div className="p-4 bg-rose-500/10 text-rose-400 rounded-3xl border border-rose-500/20 mb-4">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-100">Project Not Available</h2>
        <p className="text-sm mt-2 max-w-md">{error}</p>
        <Link to="/login" className="mt-6 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs">
          Sign In to ProjectHub
        </Link>
      </div>
    );
  }

  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getPriorityColor = (p) => {
    switch (p) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/40';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/40';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Public Banner Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/30">
              P
            </div>
            <div>
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">ProjectHub</span>
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Globe className="h-3 w-3 text-sky-400" /> Public Project Showcase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" /> Join ProjectHub
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Project Header Banner */}
        <div className="p-8 md:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 relative overflow-hidden shadow-2xl">
          <div 
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: project.color || '#10b981' }}
          />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  {project.category || 'General'}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${getPriorityColor(project.priority)}`}>
                  {project.priority || 'Medium'} Priority
                </span>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                  {project.status}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {project.title}
              </h1>

              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                {project.description || 'No description provided.'}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span>Lead: {project.owner?.name || 'Project Owner'}</span>
                </div>

                {project.due_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Target Date: {new Date(project.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Box */}
            <div className="w-full lg:w-72 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task Velocity</span>
                <span className="text-3xl font-black text-emerald-400">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <p className="text-[11px] font-bold text-slate-400">{completedTasks} of {totalTasks} milestones completed</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'board'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="h-4 w-4" /> Board & Tasks ({tasks.length})
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Specs & Wiki ({project.project_docs?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'files'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" /> Files ({project.attachments?.length || 0})
          </button>
        </div>

        {/* TAB 1: KANBAN BOARD */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {COLUMNS.map((colStatus) => {
              const colTasks = tasks.filter((t) => (t.status || 'Todo') === colStatus);

              return (
                <div
                  key={colStatus}
                  className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4 min-h-[400px] flex flex-col space-y-3"
                >
                  <div className="flex justify-between items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        colStatus === 'Done' ? 'bg-emerald-500' :
                        colStatus === 'In Progress' ? 'bg-amber-500' :
                        colStatus === 'In Review' ? 'bg-sky-500' : 'bg-slate-500'
                      }`} />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">{colStatus}</h3>
                    </div>
                    <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTask(t)}
                        className="p-4 rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/40 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityColor(t.priority)}`}>
                            {t.priority || 'Medium'}
                          </span>
                          {t.due_date && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              {new Date(t.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        <h4 className={`text-xs font-bold leading-snug ${t.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[11px]">
                          {t.assigned_user ? (
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold">
                                {t.assigned_user.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] text-slate-400">{t.assigned_user.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unassigned</span>
                          )}

                          {t.subtasks?.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <CheckSquare className="h-3 w-3" />
                              {t.subtasks.filter((s) => s.is_completed).length}/{t.subtasks.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {colTasks.length === 0 && (
                      <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-600 text-xs italic">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: SPECS & WIKI */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            {project.project_docs?.length === 0 ? (
              <div className="p-16 rounded-3xl border border-dashed border-slate-800 text-center text-slate-500">
                No documentation published for this project yet.
              </div>
            ) : (
              project.project_docs.map((doc) => (
                <div key={doc.id} className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded">
                      {doc.category || 'General'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Updated {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">{doc.title}</h2>
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-xs md:text-sm leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                    {doc.content}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: FILES */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.attachments?.length === 0 ? (
              <div className="col-span-full p-16 rounded-3xl border border-dashed border-slate-800 text-center text-slate-500">
                No attachments shared yet.
              </div>
            ) : (
              project.attachments.map((file) => (
                <div key={file.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{file.file_name}</p>
                      <p className="text-[10px] text-slate-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Read-Only Task Modal */}
      {selectedTask && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[70]"
            onClick={() => setSelectedTask(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[80] shadow-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority || 'Medium'} Priority
                </span>
                <h3 className="text-xl font-bold text-slate-100">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedTask.description && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {selectedTask.description}
              </div>
            )}

            {selectedTask.subtasks?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Checklist Items</h4>
                <div className="space-y-1.5">
                  {selectedTask.subtasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                      <div className={`h-4 w-4 rounded-md flex items-center justify-center text-[10px] ${st.is_completed ? 'bg-emerald-500 text-white' : 'border border-slate-700'}`}>
                        {st.is_completed && '✓'}
                      </div>
                      <span className={st.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}>{st.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Built with <strong className="text-emerald-400">ProjectHub</strong> — Modern Project Management & Collaboration</p>
      </footer>
    </div>
  );
};

export default PublicProjectView;
