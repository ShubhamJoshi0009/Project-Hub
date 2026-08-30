import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Trash2, CheckCircle2, Play, ToggleLeft, ToggleRight, 
  ArrowRight, ShieldCheck, Bell, RefreshCw, X 
} from 'lucide-react';
import { getProjectAutomations, createProjectAutomation, updateProjectAutomation, deleteProjectAutomation } from '../api';
import { useToast } from './Toast';

const PRESET_TRIGGERS = [
  { id: 'status_changed_to_done', label: 'When task status changes to "Done"' },
  { id: 'all_subtasks_done', label: 'When all checklist subtasks are completed' },
  { id: 'pr_merged', label: 'When GitHub Pull Request is merged' },
  { id: 'high_priority_created', label: 'When a High Priority task is created' },
];

const PRESET_ACTIONS = [
  { id: 'move_status', label: 'Move task to status...', requiresTarget: true },
  { id: 'notify_team', label: 'Send broadcast in-app alert to team' },
  { id: 'assign_owner', label: 'Auto-assign to project lead' },
];

const AutomationsTab = ({ projectId }) => {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('all_subtasks_done');
  const [actionType, setActionType] = useState('move_status');
  const [targetStatus, setTargetStatus] = useState('In Review');
  const [customMessage, setCustomMessage] = useState('Task checklist completed!');

  const toast = useToast();

  const fetchAutomations = async () => {
    try {
      const res = await getProjectAutomations(projectId);
      setAutomations(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, [projectId]);

  const handleToggleActive = async (auto) => {
    try {
      const nextState = !auto.is_active;
      await updateProjectAutomation(projectId, auto.id, { is_active: nextState });
      setAutomations((prev) => prev.map((a) => (a.id === auto.id ? { ...a, is_active: nextState } : a)));
      toast.success(`Automation ${nextState ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle automation');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name,
        trigger_event: triggerEvent,
        action_type: actionType,
        action_payload: {
          target_status: targetStatus,
          message: customMessage
        }
      };
      const res = await createProjectAutomation(projectId, payload);
      setAutomations((prev) => [res.data, ...prev]);
      setIsCreating(false);
      setName('');
      toast.success('Automation rule created');
    } catch (err) {
      toast.error('Failed to create automation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    try {
      await deleteProjectAutomation(projectId, id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success('Automation deleted');
    } catch (err) {
      toast.error('Failed to delete automation');
    }
  };

  return (
    <div 
      className="rounded-3xl border shadow-xl p-8 space-y-6"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-100">Automated Workflows & Rules Engine</h3>
            <p className="text-xs text-slate-400 font-medium">Trigger instant actions on task transitions, GitHub PRs, and checklist events</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Automation Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {automations.length === 0 ? (
          <div className="p-16 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
            <Zap className="h-8 w-8 mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-slate-300">No active automations</p>
            <p className="mt-1">Create your first rule to automate repetitive tasks and GitHub workflows.</p>
          </div>
        ) : (
          automations.map((rule) => (
            <div
              key={rule.id}
              className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-700"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">{rule.name}</h4>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Executed {rule.execution_count || 0} times
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Trigger: {rule.trigger_event}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                  <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                    Action: {rule.action_type} {rule.action_payload?.target_status ? `➔ ${rule.action_payload.target_status}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleActive(rule)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rule.is_active ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {rule.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  {rule.is_active ? 'Active' : 'Disabled'}
                </button>

                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <>
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70]"
            onClick={() => setIsCreating(false)}
          />
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[80] shadow-2xl rounded-3xl border p-8 space-y-6"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-slate-100">Create Automation Rule</h3>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auto Move to Review on Subtasks Complete"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl px-4 py-2.5 border outline-none"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  WHEN (Trigger Event)
                </label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  {PRESET_TRIGGERS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  THEN (Action)
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                >
                  {PRESET_ACTIONS.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              {actionType === 'move_status' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Target Column Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20"
                >
                  Save Automation
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AutomationsTab;
