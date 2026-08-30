import React, { useState } from 'react';
import { 
  Sparkles, Bot, AlertTriangle, ShieldCheck, CheckCircle2, 
  Send, ArrowRight, X, Cpu, Lightbulb, Compass, Zap 
} from 'lucide-react';
import { aiRiskAssessment, aiParseCommand } from '../api';
import { useToast } from './Toast';

const AIAssistantModal = ({ isOpen, onClose, projectId, onProjectUpdated }) => {
  const [activeTab, setActiveTab] = useState('command'); // 'command' | 'risk'
  const [prompt, setPrompt] = useState('');
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResult, setCommandResult] = useState(null);

  // Risk state
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const toast = useToast();

  if (!isOpen) return null;

  const handleRunCommand = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setCommandLoading(true);
    setCommandResult(null);
    try {
      const res = await aiParseCommand(projectId, prompt.trim());
      setCommandResult(res.data);
      toast.success('AI Command executed');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      toast.error('AI command execution failed');
    } finally {
      setCommandLoading(false);
    }
  };

  const handleRunRiskAnalysis = async () => {
    setRiskLoading(true);
    try {
      const res = await aiRiskAssessment(projectId);
      setRiskAssessment(res.data);
      toast.success('AI Risk Assessment complete');
    } catch (err) {
      toast.error('Failed to run risk assessment');
    } finally {
      setRiskLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[70] transition-opacity"
        onClick={onClose}
      />

      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-[80] shadow-2xl rounded-3xl border p-8 space-y-6 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-100 flex items-center gap-2">
                Antigravity AI Assistant <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v2.0</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">Smart scheduling, risk assessment, and natural language command parsing</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'command'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="h-4 w-4" /> Natural Language Commands
          </button>
          <button
            onClick={() => {
              setActiveTab('risk');
              if (!riskAssessment) handleRunRiskAnalysis();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'risk'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Project Health & Risk
          </button>
        </div>

        {/* Tab 1: Natural Language Commands */}
        {activeTab === 'command' && (
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" /> Example Prompts You Can Try:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li><code className="text-slate-200">"Create high priority task for API benchmark"</code></li>
                <li><code className="text-slate-200">"Add urgent QA regression testing for mobile release"</code></li>
                <li><code className="text-slate-200">"Add task for design system typography audit"</code></li>
              </ul>
            </div>

            <form onSubmit={handleRunCommand} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tell AI what to do..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full text-xs rounded-2xl pl-4 pr-12 py-3.5 border outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                />
                <button
                  type="submit"
                  disabled={commandLoading || !prompt.trim()}
                  className="absolute right-2.5 top-2.5 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>

            {commandLoading && (
              <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider">AI Parsing & Executing...</p>
              </div>
            )}

            {commandResult && (
              <div className="p-5 rounded-2xl border bg-slate-900/80 border-emerald-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" /> AI Action Completed
                </div>
                <p className="text-xs text-slate-200">{commandResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Project Health & Risk Assessment */}
        {activeTab === 'risk' && (
          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar py-2">
            {riskLoading ? (
              <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="mt-3 text-xs font-bold uppercase tracking-wider">Evaluating bottleneck metrics...</p>
              </div>
            ) : riskAssessment ? (
              <div className="space-y-6">
                {/* Health Meter Box */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Health Score</span>
                    <h3 className="text-3xl font-black text-white mt-1">
                      {riskAssessment.health_score} <span className="text-sm font-normal text-slate-400">/ 100</span>
                    </h3>
                    <span className={`text-xs font-bold mt-1 inline-block ${
                      riskAssessment.health_score >= 80 ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {riskAssessment.status}
                    </span>
                  </div>

                  <button
                    onClick={handleRunRiskAnalysis}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Cpu className="h-3.5 w-3.5 text-emerald-400" /> Re-Analyze
                  </button>
                </div>

                {/* Identified Risks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Identified Vulnerabilities</h4>
                  {riskAssessment.risks?.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> No high risk bottlenecks detected. Sprint is operating optimally!
                    </div>
                  ) : (
                    riskAssessment.risks?.map((r, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-bold text-slate-100">{r.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-6">{r.detail}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Smart AI Recommendations</h4>
                  {riskAssessment.recommendations?.map((rec, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                      <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
};

export default AIAssistantModal;
