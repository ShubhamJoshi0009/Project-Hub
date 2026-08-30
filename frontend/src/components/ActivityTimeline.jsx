import React from 'react';
import { 
  Activity, CheckCircle2, UserPlus, FileUp, MessageSquare, 
  Trash2, Edit3, ShieldAlert, Sparkles, Clock
} from 'lucide-react';

const getActionIcon = (action) => {
  switch (action) {
    case 'created_project':
      return { icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'created_task':
      return { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    case 'updated_task_status':
      return { icon: Activity, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'deleted_task':
      return { icon: Trash2, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    case 'added_member':
      return { icon: UserPlus, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
    case 'uploaded_attachment':
      return { icon: FileUp, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' };
    case 'added_comment':
      return { icon: MessageSquare, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' };
    default:
      return { icon: Edit3, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  }
};

const formatActionText = (action, details = {}) => {
  switch (action) {
    case 'created_project':
      return `created this project "${details.title || ''}"`;
    case 'created_task':
      return `created task "${details.title || 'Untitled'}"`;
    case 'updated_task_status':
      return `moved task "${details.title || ''}" to ${details.status}`;
    case 'deleted_task':
      return `removed a task`;
    case 'added_member':
      return `invited ${details.member_name || details.member_email || 'a new member'} as ${details.role || 'member'}`;
    case 'left_project':
      return `left the project`;
    case 'removed_member':
      return `removed a team member`;
    case 'uploaded_attachment':
      return `uploaded file "${details.file_name || 'attachment'}"`;
    case 'deleted_attachment':
      return `deleted file "${details.file_name || 'attachment'}"`;
    case 'added_comment':
      return `commented: "${details.preview || ''}"`;
    case 'updated_project':
      return `updated project details`;
    default:
      return `performed an update`;
  }
};

const ActivityTimeline = ({ activities = [], loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="p-12 rounded-3xl border border-dashed text-center text-slate-400" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <Clock className="h-8 w-8 mx-auto mb-2 text-slate-600" />
        <p className="font-bold text-sm">No activity recorded yet</p>
        <p className="text-xs text-slate-500 mt-1">Project events and updates will be logged here in real time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((item, idx) => {
        const { icon: ActionIcon, color } = getActionIcon(item.action);
        const userName = item.user?.name || 'Team Member';
        const userInitial = userName.charAt(0).toUpperCase();

        return (
          <div
            key={item.id || idx}
            className="flex items-start gap-4 p-4 rounded-2xl border transition-all hover:bg-slate-900/30"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            {/* Action Icon Badge */}
            <div className={`p-2.5 rounded-xl border shrink-0 ${color}`}>
              <ActionIcon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-100">{userName}</span>
                <span className="text-xs text-slate-400">{formatActionText(item.action, item.details)}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityTimeline;
