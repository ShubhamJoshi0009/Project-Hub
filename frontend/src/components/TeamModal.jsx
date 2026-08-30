import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, UserPlus, Shield, X, Trash2, Search, Check, AlertCircle, LogOut 
} from 'lucide-react';
import { addProjectMember, updateMemberRole, removeProjectMember, searchUsers } from '../api';
import { AuthContext } from '../AuthContextInstance';
import { useToast } from './Toast';

const TeamModal = ({ isOpen, onClose, project, onMemberUpdated }) => {
  const { user: currentUser } = useContext(AuthContext);
  const toast = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('member');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (emailInput.trim().length >= 2) {
      const delay = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await searchUsers(emailInput.trim());
          setSearchResults(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setSearching(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [emailInput]);

  if (!isOpen || !project) return null;

  const isOwner = project.owner_id === currentUser?.id || project.owner?.id === currentUser?.id;

  const handleInvite = async (emailToInvite) => {
    const targetEmail = emailToInvite || emailInput;
    if (!targetEmail) return;

    setLoadingAction(true);
    try {
      await addProjectMember(project.id, targetEmail, roleInput);
      toast.success(`Member invited successfully`);
      setEmailInput('');
      setSearchResults([]);
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateMemberRole(project.id, userId, newRole);
      toast.success('Role updated');
      if (onMemberUpdated) onMemberUpdated();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    const isSelf = userId === currentUser?.id;
    const msg = isSelf ? 'Are you sure you want to leave this project?' : `Remove ${memberName} from this project?`;
    if (!window.confirm(msg)) return;

    try {
      await removeProjectMember(project.id, userId);
      toast.success(isSelf ? 'Left project' : 'Member removed');
      if (onMemberUpdated) onMemberUpdated();
      if (isSelf) {
        onClose();
        window.location.href = '/projects';
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />

      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[80] shadow-2xl rounded-3xl border p-8 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>Team & Collaborators</h2>
              <p className="text-xs text-slate-400 font-medium">Manage project access and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar">
          {/* Invite Section (Owner only) */}
          {isOwner && (
            <div className="p-5 rounded-2xl border space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400">
                Invite New Member
              </label>
              <div className="flex gap-2 relative">
                <div className="relative flex-1">
                  <input
                    type="email"
                    placeholder="Search name or type email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full text-xs rounded-xl px-4 py-2.5 border focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                  {searching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                    </div>
                  )}
                </div>

                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>

                <button
                  type="button"
                  disabled={loadingAction || !emailInput.trim()}
                  onClick={() => handleInvite(emailInput)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
                >
                  <UserPlus className="h-4 w-4" /> Invite
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="rounded-xl border p-2 space-y-1 bg-slate-900 border-slate-700 shadow-xl max-h-40 overflow-y-auto">
                  <span className="text-[10px] font-black uppercase text-slate-500 px-2 py-1 block">Matching Users</span>
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleInvite(u.email)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-emerald-500/10 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{u.name}</p>
                          <p className="text-[10px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                        Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
              Project Members ({project.members?.length || 1})
            </h3>

            <div className="space-y-2">
              {project.members?.map((member) => {
                const isProjectOwner = member.id === project.owner_id || member.role === 'owner';
                const isSelf = member.id === currentUser?.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-100">{member.name}</p>
                          {isSelf && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isProjectOwner ? (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                          <Shield className="h-3 w-3" /> Owner
                        </div>
                      ) : isOwner ? (
                        <select
                          value={member.role || 'member'}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-xs font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer"
                          style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                          {member.role || 'member'}
                        </span>
                      )}

                      {!isProjectOwner && (isOwner || isSelf) && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title={isSelf ? 'Leave Project' : 'Remove Member'}
                        >
                          {isSelf ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default TeamModal;
