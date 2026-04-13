import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Trash2, CheckCircle, Circle, Clock, 
  Users, UserPlus, Shield, Activity, Calendar as CalendarIcon, MoreVertical,
  AlertCircle, Paperclip, FileText, Download, X
} from 'lucide-react';
import { 
  getProject, 
  addTask, 
  updateTask, 
  deleteTask, 
  updateProject, 
  addProjectMember, 
  getAttachments, 
  addAttachment, 
  deleteAttachment,
  uploadFile 
} from '../api';
import { AuthContext } from '../AuthContextInstance';
import CommentSlider from '../components/CommentSlider';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const [projRes, attachRes] = await Promise.all([
        getProject(id),
        getAttachments(id)
      ]);
      setProject(projRes.data);
      setAttachments(attachRes.data);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      await addTask(id, { 
        title: newTaskTitle, 
        priority: newTaskPriority,
        due_date: newTaskDueDate 
      });
      setNewTaskTitle('');
      setNewTaskPriority('Medium');
      setNewTaskDueDate('');
      fetchProject();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      await updateTask(id, task.id, { status: nextStatus });
      fetchProject();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(id, taskId);
      fetchProject();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleUpdateProjectStatus = async (newStatus) => {
    try {
      await updateProject(id, { status: newStatus });
      fetchProject();
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleUpdateProjectPriority = async (newPriority) => {
    try {
      await updateProject(id, { priority: newPriority });
      fetchProject();
    } catch (error) {
      console.error('Error updating project priority:', error);
    }
  };

  const handleUpdateProjectCategory = async (newCategory) => {
    try {
      await updateProject(id, { category: newCategory });
      fetchProject();
    } catch (error) {
      console.error('Error updating project category:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    try {
      await addProjectMember(id, memberEmail);
      setMemberEmail('');
      fetchProject();
    } catch (error) {
      setMemberError(error.response?.data?.message || 'Error adding member');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const description = window.prompt('Enter a description for this file (optional):');

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

      fetchProject();
    } catch (error) {
      console.error('Error uploading file:', error);
      const message = error.response?.data?.message || error.message || 'Upload failed. The server might be having trouble communicating with Supabase.';
      alert(`Upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await deleteAttachment(id, attachmentId);
      fetchProject();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete attachment.');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsCommentOpen(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-rose-400 bg-rose-900/20 border-rose-900/30';
      case 'Medium': return 'text-amber-400 bg-amber-900/20 border-amber-900/30';
      case 'Low': return 'text-emerald-400 bg-emerald-900/20 border-emerald-900/30';
      default: return 'text-slate-500 bg-slate-900/20 border-slate-900/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500';
      case 'On Hold': return 'bg-amber-500';
      case 'Completed': return 'bg-emerald-600';
      default: return 'bg-slate-500';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center flex-1">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );
  
  if (!project) return (
    <div className="flex flex-col items-center justify-center flex-1" style={{ color: 'var(--text-muted)' }}>
      <p className="text-xl font-bold">Project not found</p>
      <Link to="/" className="text-emerald-600 mt-4 underline">Return to Dashboard</Link>
    </div>
  );

  const isOwner = project.owner_id === currentUser?.id || project.owner?.id === currentUser?.id;
  const completedTasks = project.tasks?.filter(t => t.status === 'Done').length || 0;
  const totalTasks = project.tasks?.length || 0;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-8 flex-1 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <CommentSlider 
          isOpen={isCommentOpen} 
          onClose={() => setIsCommentOpen(false)} 
          task={selectedTask} 
          projectId={id}
          projectMembers={project.members}
        />

        <Link to="/projects" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 mb-8 transition-colors uppercase tracking-widest">
          <ChevronLeft className="h-4 w-4 mr-1" /> Projects
        </Link>

        {/* Header Section */}
        <div className="rounded-3xl shadow-sm border overflow-hidden mb-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor(project.status)} ring-4 ring-emerald-900/20`} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>{project.status}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>{project.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--text-muted)' }}>
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-sm">Created {new Date(project.created_at).toLocaleDateString()}</span>
                </div>
                {project.due_date && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Due {new Date(project.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex -space-x-2">
                  {project.members?.map((m, i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold" title={m.name} style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--bg-card)', color: 'var(--primary)' }}>
                      {m.name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>Project Progress</span>
                <span className="text-2xl font-black text-emerald-600">{progressPercent}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isOwner && (
                <div className="pt-4 grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Status</label>
                      <select 
                        className="w-full border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={project.status}
                        onChange={(e) => handleUpdateProjectStatus(e.target.value)}
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
                      <select 
                        className="w-full border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                        value={project.priority}
                        onChange={(e) => handleUpdateProjectPriority(e.target.value)}
                        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Category</label>
                    <input
                      type="text"
                      className="w-full border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                      value={project.category || 'General'}
                      onChange={(e) => handleUpdateProjectCategory(e.target.value)}
                      onBlur={(e) => handleUpdateProjectCategory(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Activity className="h-5 w-5 text-emerald-500" /> Task Management
              </h2>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="p-6 rounded-2xl shadow-xl flex flex-wrap gap-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <input
                type="text"
                placeholder="Next major milestone..."
                required
                className="flex-grow min-w-[200px] border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-all"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                <div className="relative">
                  <DatePicker
                    selected={newTaskDueDate ? new Date(newTaskDueDate) : null}
                    onChange={(date) => setNewTaskDueDate(date ? date.toISOString().split('T')[0] : '')}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Due Date"
                    className="border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all w-[120px]"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    autoComplete="off"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Task
              </button>
            </form>

            <div className="space-y-4">
              {project.tasks?.length === 0 ? (
                <div className="p-12 rounded-2xl border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  No tasks defined for this project.
                </div>
              ) : (
                project.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => handleTaskClick(task)}
                    className={`group flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                      task.status === 'Done' ? 'bg-slate-900/10' : 'shadow-sm hover:shadow-md hover:border-emerald-200'
                    }`}
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                        className="transition-transform active:scale-90"
                      >
                        {task.status === 'Done' ? (
                          <div className="h-7 w-7 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-7 w-7 rounded-full border-2 border-emerald-200 group-hover:border-emerald-300 transition-colors" />
                        )}
                      </button>
                      <div>
                        <p className={`text-sm font-bold ${task.status === 'Done' ? 'line-through text-slate-500' : ''}`} style={{ color: 'var(--text-main)' }}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> Due {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Collaboration Sidebar */}
          <div className="space-y-8">
            {/* Team Members Card */}
            <div className="shadow-sm border rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Users className="h-5 w-5 text-emerald-500" /> Team Members
              </h3>
              
              {isOwner && (
                <form onSubmit={handleAddMember} className="mb-8">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Invite Collaborator</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="email@example.com"
                      className="flex-grow border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 placeholder-emerald-400 transition-all"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
                    />
                    <button
                      type="submit"
                      className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </div>
                  {memberError && <p className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-wide">{memberError}</p>}
                </form>
              )}

              <div className="space-y-5">
                {project.members?.map((member) => (
                  <div key={member.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--primary)' }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{member.name}</p>
                        <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                      </div>
                    </div>
                    {(member.id === project.owner_id || member.id === project.owner?.id) && (
                      <div className="p-1 bg-amber-900/20 rounded-lg text-amber-400" title="Project Owner">
                        <Shield className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="shadow-sm border rounded-3xl p-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Paperclip className="h-5 w-5 text-emerald-500" /> Files
                </h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <label className={`flex items-center justify-center gap-2 w-full cursor-pointer py-2 rounded-xl border-2 border-dashed border-emerald-900/30 transition-all hover:bg-emerald-900/10 ${isUploading ? 'animate-pulse' : ''}`}>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  <Plus className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">Select & Upload File</span>
                </label>
              </div>

              <div className="space-y-4">
                {attachments.length === 0 ? (
                  <p className="text-xs italic text-center py-4" style={{ color: 'var(--text-muted)' }}>No files shared yet.</p>
                ) : (
                  attachments.map((file) => (
                    <div key={file.id} className="p-3 rounded-xl border group hover:border-emerald-500/30 transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                            <FileText className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-main)' }}>{file.file_name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{(file.file_size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <a 
                            href={file.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          {(file.user_id === currentUser?.id || isOwner) && (
                            <button
                              onClick={() => handleDeleteAttachment(file.id)}
                              className="p-2 text-slate-500 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      {file.description && (
                        <p className="text-[10px] pl-9 italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {file.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
