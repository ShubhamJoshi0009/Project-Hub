import React, { useState, useEffect, useContext } from 'react';
import { X, Send, User, Paperclip, FileText, Download } from 'lucide-react';
import { getComments, addComment } from '../api';
import { AuthContext } from '../AuthContextInstance';

const CommentSlider = ({ isOpen, onClose, task, projectId, projectMembers }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      fetchComments();
    }
  }, [isOpen, task]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await getComments(projectId, task.id);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await addComment(projectId, task.id, newComment);
      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const formatComment = (content) => {
    // Simple mention highlighting
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-emerald-600 font-bold bg-emerald-500/10 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  if (!task) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slider */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-lg z-[70] shadow-2xl transition-transform duration-500 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
           style={{ backgroundColor: 'var(--bg-card)' }}>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>Task Discussion</h2>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{task.title}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-emerald-500/10 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                <p className="italic">No comments yet. Start the conversation!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 group">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600/10 flex items-center justify-center font-black text-emerald-600 border border-emerald-600/20 shrink-0">
                    {comment.user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black" style={{ color: 'var(--text-main)' }}>{comment.user?.name}</span>
                      <span className="text-[10px] font-medium opacity-50" style={{ color: 'var(--text-muted)' }}>
                        {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed p-3 rounded-2xl border" 
                         style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}>
                      {formatComment(comment.content)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <form onSubmit={handlePostComment} className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment... use @ to mention"
                className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 min-h-[100px] transition-all resize-none"
                style={{ color: 'var(--text-main)' }}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
            
            {/* Mention Suggestions Preview (simplified) */}
            {newComment.includes('@') && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase mr-2" style={{ color: 'var(--text-muted)' }}>Suggestions:</span>
                {projectMembers?.map(m => (
                  <button 
                    key={m.id}
                    type="button"
                    onClick={() => setNewComment(newComment.replace(/@\w*$/, `@${m.name.replace(/\s/g, '')} `))}
                    className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20"
                  >
                    @{m.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentSlider;

