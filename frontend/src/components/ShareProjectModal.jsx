import React, { useState } from 'react';
import { Share2, Globe, Copy, Check, Lock, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { toggleProjectShare } from '../api';
import { useToast } from './Toast';

const ShareProjectModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const [isPublic, setIsPublic] = useState(!!project?.is_public);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  if (!isOpen || !project) return null;

  const publicUrl = `${window.location.origin}/share/${project.share_token || project.id}`;

  const handleToggle = async () => {
    const nextState = !isPublic;
    setLoading(true);
    try {
      const res = await toggleProjectShare(project.id, nextState, project.share_token);
      setIsPublic(res.data.is_public);
      toast.success(nextState ? 'Public link sharing enabled!' : 'Public link sharing disabled');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      toast.error('Failed to update share settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />

      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[80] shadow-2xl rounded-3xl border p-8"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-100">Share Project</h2>
              <p className="text-xs text-slate-400 font-medium">Publish a live, interactive read-only showcase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-6 space-y-6">
          {/* Public Toggle Card */}
          <div 
            className="p-5 rounded-2xl border flex items-center justify-between transition-all"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">Public Link Sharing</p>
                <p className="text-[11px] text-slate-400">
                  {isPublic ? 'Anyone with the link can view tasks and docs' : 'Only invited team members can access'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              disabled={loading}
              onClick={handleToggle}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isPublic ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div 
                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-6 shadow-md' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Share Link Input */}
          {isPublic && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Shareable Web Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 text-xs font-mono rounded-xl px-4 py-2.5 border outline-none select-all"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-md shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px]">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  Open Preview in new tab <ExternalLink className="h-3 w-3" />
                </a>

                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Read-only guest mode
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

export default ShareProjectModal;
