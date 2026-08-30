import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, MessageSquare, Copy, Check, Plus, 
  ExternalLink, Trash2, ShieldCheck, Zap, Globe 
} from 'lucide-react';
import { getProjectIntegrations, createProjectIntegration } from '../api';
import { useToast } from './Toast';

const INTEGRATIONS_LIST = [
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    desc: 'Auto-advance tasks to "Done" when Pull Requests are merged.',
    docUrl: 'https://docs.github.com/webhooks'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: '🦊',
    desc: 'Sync merge requests and issue pipeline status.',
    docUrl: 'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html'
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    desc: 'Broadcast sprint completions and critical deadlines to channels.',
    docUrl: 'https://api.slack.com/messaging/webhooks'
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: '🔷',
    desc: 'Bi-directional issue sync and epic roadmap tracking.',
    docUrl: 'https://developer.atlassian.com/cloud/jira/platform/webhooks/'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: '⚡',
    desc: 'Connect with 5,000+ productivity apps via custom webhooks.',
    docUrl: 'https://zapier.com'
  }
];

const IntegrationsTab = ({ projectId }) => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const toast = useToast();

  const webhookEndpoint = `${window.location.origin.replace(':5173', ':5000')}/api/projects/${projectId}/webhooks/github`;

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const res = await getProjectIntegrations(projectId);
        setIntegrations(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntegrations();
  }, [projectId]);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleConnect = async (service) => {
    try {
      const res = await createProjectIntegration(projectId, {
        service: service.id,
        webhook_url: webhookEndpoint,
        events: ['pull_request', 'issues', 'push']
      });
      setIntegrations((prev) => [...prev, res.data]);
      toast.success(`${service.name} integration activated!`);
    } catch (err) {
      toast.error(`Failed to activate ${service.name}`);
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
            <h3 className="text-lg font-black text-slate-100">Integrations & Developer Webhooks</h3>
            <p className="text-xs text-slate-400 font-medium">Connect external repositories, chat channels, and automation tools</p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> HMAC Webhook Security
        </span>
      </div>

      {/* GitHub Webhook Payload URL Box */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
          Incoming GitHub Webhook URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={webhookEndpoint}
            className="flex-1 text-xs font-mono rounded-xl px-4 py-2.5 border outline-none select-all"
            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          />
          <button
            type="button"
            onClick={() => handleCopyUrl(webhookEndpoint, 'github-url')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 shadow-md"
          >
            {copiedId === 'github-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copiedId === 'github-url' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {INTEGRATIONS_LIST.map((tool) => {
          const isConnected = integrations.some((i) => i.service === tool.id);

          return (
            <div
              key={tool.id}
              className="p-6 rounded-2xl border bg-slate-900/40 border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{tool.icon}</span>
                    <h4 className="text-sm font-bold text-slate-100">{tool.name}</h4>
                  </div>
                  {isConnected && (
                    <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Connected
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <a
                  href={tool.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  Docs <ExternalLink className="h-3 w-3" />
                </a>

                {isConnected ? (
                  <button
                    disabled
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/20"
                  >
                    Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(tool)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegrationsTab;
