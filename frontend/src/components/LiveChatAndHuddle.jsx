import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  MessageSquare, Send, Mic, MicOff, PhoneCall, PhoneOff, 
  Users, Volume2, Sparkles, Smile, Paperclip 
} from 'lucide-react';
import { getProjectChat, sendProjectChatMessage, getProjectHuddle, joinProjectHuddle, leaveProjectHuddle } from '../api';
import { supabase } from '../supabaseClient';
import { AuthContext } from '../AuthContextInstance';
import { useToast } from './Toast';

const LiveChatAndHuddle = ({ projectId }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Audio Huddle State
  const [huddle, setHuddle] = useState({ is_active: false, active_participants: [] });
  const [isInHuddle, setIsInHuddle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef(null);
  const toast = useToast();

  const fetchChatAndHuddle = async () => {
    try {
      const [chatRes, huddleRes] = await Promise.all([
        getProjectChat(projectId),
        getProjectHuddle(projectId)
      ]);
      setMessages(chatRes.data || []);
      setHuddle(huddleRes.data || { is_active: false, active_participants: [] });
      setIsInHuddle((huddleRes.data?.active_participants || []).some(p => p.id === currentUser?.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatAndHuddle();

    // Subscribe to chat & huddle realtime changes
    const chatChannel = supabase
      .channel(`chat-huddle-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_chat_messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        fetchChatAndHuddle();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'huddle_sessions', filter: `project_id=eq.${projectId}` }, (payload) => {
        if (payload.new) {
          setHuddle(payload.new);
          setIsInHuddle((payload.new.active_participants || []).some(p => p.id === currentUser?.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msg = inputText.trim();
    setInputText('');
    try {
      const res = await sendProjectChatMessage(projectId, msg);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleToggleHuddle = async () => {
    try {
      if (isInHuddle) {
        await leaveProjectHuddle(projectId);
        setIsInHuddle(false);
        toast.success('Left audio huddle');
      } else {
        await joinProjectHuddle(projectId);
        setIsInHuddle(true);
        toast.success('Joined audio huddle room');
      }
      fetchChatAndHuddle();
    } catch (err) {
      toast.error('Failed to update huddle status');
    }
  };

  return (
    <div 
      className="rounded-3xl border shadow-xl flex flex-col overflow-hidden h-[650px]"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      {/* Top Audio Huddle Banner */}
      <div className="p-4 border-b bg-slate-900/80 flex flex-wrap justify-between items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${
            huddle.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Team Audio Huddle
              </h4>
              {huddle.is_active && (
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  LIVE ({huddle.active_participants?.length || 0})
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {huddle.is_active ? 'Active instant voice channel' : 'Instant voice channel is currently idle'}
            </p>
          </div>
        </div>

        {/* Participants Pill & Action */}
        <div className="flex items-center gap-3">
          {huddle.active_participants?.length > 0 && (
            <div className="flex -space-x-2">
              {huddle.active_participants.map((p, i) => (
                <div 
                  key={i} 
                  className="h-7 w-7 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-white ring-2 ring-emerald-500/50"
                  title={`${p.name} (In Huddle)`}
                >
                  {p.name?.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}

          {isInHuddle && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                isMuted ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}

          <button
            onClick={handleToggleHuddle}
            className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 ${
              isInHuddle
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isInHuddle ? <PhoneOff className="h-3.5 w-3.5" /> : <PhoneCall className="h-3.5 w-3.5" />}
            {isInHuddle ? 'Leave Huddle' : 'Join Huddle'}
          </button>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
            <MessageSquare className="h-10 w-10 text-slate-700 mb-2" />
            <p className="font-bold text-slate-400">No project chat messages yet</p>
            <p className="mt-0.5">Send a message to brainstorm with the project team.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === currentUser?.id;
            return (
              <div key={m.id} className={`flex gap-3 items-start ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="h-8 w-8 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                  {m.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                <div className={`space-y-1 max-w-md ${isMe ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300">{m.user?.name || 'User'}</span>
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                  }`}>
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-slate-900/60 flex items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
        <input
          type="text"
          placeholder="Send a message to project team..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 text-xs rounded-xl px-4 py-3 border outline-none focus:ring-2 focus:ring-emerald-500"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-lg transition-all active:scale-95 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default LiveChatAndHuddle;
