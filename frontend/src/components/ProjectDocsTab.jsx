import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit3, Save, X, Search, 
  Tag, Clock, User, Eye, Code, BookOpen 
} from 'lucide-react';
import { getProjectDocs, createProjectDoc, updateProjectDoc, deleteProjectDoc } from '../api';
import { useToast } from './Toast';

const DOC_CATEGORIES = ['General', 'Architecture', 'Specifications', 'Meeting Notes', 'Roadmap', 'QA / Guidelines'];

const ProjectDocsTab = ({ projectId, isOwner }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const toast = useToast();

  const fetchDocs = async () => {
    try {
      const res = await getProjectDocs(projectId);
      setDocs(res.data || []);
      if (res.data && res.data.length > 0 && !selectedDoc) {
        setSelectedDoc(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [projectId]);

  const handleStartCreate = () => {
    setSelectedDoc(null);
    setTitle('');
    setCategory('General');
    setContent('');
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleStartEdit = (doc) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setCategory(doc.category || 'General');
    setContent(doc.content || '');
    setIsEditing(true);
    setPreviewMode(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      if (selectedDoc?.id) {
        const res = await updateProjectDoc(projectId, selectedDoc.id, { title, category, content });
        setDocs((prev) => prev.map((d) => (d.id === selectedDoc.id ? res.data : d)));
        setSelectedDoc(res.data);
        toast.success('Document updated');
      } else {
        const res = await createProjectDoc(projectId, { title, category, content });
        setDocs((prev) => [res.data, ...prev]);
        setSelectedDoc(res.data);
        toast.success('Document created');
      }
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save document');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteProjectDoc(projectId, docId);
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setSelectedDoc(null);
      setIsEditing(false);
      toast.success('Document deleted');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Docs Directory */}
      <div 
        className="rounded-3xl border shadow-xl p-6 space-y-4 lg:col-span-1"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">
              Project Wiki & Specs
            </h3>
          </div>

          <button
            onClick={handleStartCreate}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
            title="New Document"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {['All', ...DOC_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Docs List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          {filteredDocs.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs italic">
              No docs found. Create your first doc!
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setIsEditing(false);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                  selectedDoc?.id === doc.id && !isEditing
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                    : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      {doc.category || 'General'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate">{doc.title}</h4>
                  <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                    {new Date(doc.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(doc);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Doc Reader / Editor */}
      <div 
        className="rounded-3xl border shadow-xl p-8 lg:col-span-2 min-h-[550px] flex flex-col justify-between"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {isEditing ? (
          /* Editor Form */
          <form onSubmit={handleSave} className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                {selectedDoc ? 'Edit Document' : 'Create New Document'}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    previewMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {previewMode ? <Code className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {previewMode ? 'Markdown' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Architecture & API Endpoints"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm font-bold rounded-xl px-4 py-2.5 border outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Field / Preview */}
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Markdown Content
              </label>
              {previewMode ? (
                <div className="flex-1 p-5 rounded-2xl border overflow-y-auto prose prose-invert max-w-none text-xs leading-relaxed" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                  <pre className="whitespace-pre-wrap font-sans text-slate-200">{content}</pre>
                </div>
              ) : (
                <textarea
                  rows="14"
                  required
                  placeholder="Write documentation in Markdown format (# Headers, - Lists, `code`)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full text-xs font-mono rounded-2xl p-4 border outline-none resize-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Save Doc
              </button>
            </div>
          </form>
        ) : selectedDoc ? (
          /* Reader Mode */
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                    {selectedDoc.category || 'General'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    Updated {new Date(selectedDoc.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-100">{selectedDoc.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(selectedDoc)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedDoc.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  title="Delete Doc"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Doc Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-slate-300 leading-relaxed">
                  {selectedDoc.content || 'No content in this document.'}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-center py-20">
            <FileText className="h-12 w-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">No Document Selected</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mb-6">
              Select a specification or meeting note from the left, or create a new wiki document.
            </p>
            <button
              onClick={handleStartCreate}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20"
            >
              + Create Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDocsTab;
