import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertCircle, UserPlus, MessageSquare, Sparkles, X } from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'assignment':
      return { icon: Sparkles, color: 'text-emerald-400 bg-emerald-500/10' };
    case 'mention':
      return { icon: MessageSquare, color: 'text-sky-400 bg-sky-500/10' };
    case 'deadline':
      return { icon: AlertCircle, color: 'text-rose-400 bg-rose-500/10' };
    case 'join':
      return { icon: UserPlus, color: 'text-indigo-400 bg-indigo-500/10' };
    default:
      return { icon: Clock, color: 'text-slate-400 bg-slate-500/10' };
  }
};

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifs();

    // Subscribe to realtime notifications if available
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-emerald-500/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl shadow-2xl border backdrop-blur-xl z-[90] overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-slate-900/60" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold text-slate-300">All caught up!</p>
                <p className="text-[10px] text-slate-500 mt-1">No new alerts or mentions.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon: IconComponent, color } = getNotificationIcon(n.type);

                return (
                  <div
                    key={n.id}
                    className={`p-4 transition-all flex items-start justify-between gap-3 hover:bg-slate-800/40 cursor-pointer ${
                      !n.is_read ? 'bg-emerald-500/5' : ''
                    }`}
                    onClick={() => {
                      if (!n.is_read) handleMarkRead(n.id);
                      if (n.link) window.location.href = n.link;
                    }}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 ${color}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${!n.is_read ? 'font-black text-slate-100' : 'font-semibold text-slate-300'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-slate-500 font-medium mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(n.id, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
