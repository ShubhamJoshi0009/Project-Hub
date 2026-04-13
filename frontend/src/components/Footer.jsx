import React from 'react';
import { Target, MessageSquare, Globe, LifeBuoy } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t py-12 transition-all duration-300" 
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
                <Target className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>ProjectHub</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Empowering teams to achieve more through intuitive project management and real-time collaboration.
            </p>
            <div className="flex gap-4 pt-2 font-bold text-xs" style={{ color: 'var(--text-muted)' }}>
              <a href="https://github.com/ShubhamJoshi0009" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors uppercase tracking-widest">GitHub</a>
              <a href="https://x.com/Shubham_Joshi_" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors uppercase tracking-widest">Twitter</a>
              <a href="https://linkedin.com/in/shubham-joshi-09171a316" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition-colors uppercase tracking-widest">LinkedIn</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text-main)' }}>Platform</h4>
            <ul className="space-y-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              <li><a href="/" className="hover:text-emerald-500 transition-colors flex items-center gap-2">Dashboard</a></li>
              <li><a href="/projects" className="hover:text-emerald-500 transition-colors flex items-center gap-2">Projects</a></li>
              <li><a href="/profile" className="hover:text-emerald-500 transition-colors flex items-center gap-2">Profile</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text-main)' }}>Resources</h4>
            <ul className="space-y-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              <li className="flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-pointer">
                <Globe className="h-4 w-4" /> 
                <span>Documentation</span>
              </li>
              <li className="flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-pointer">
                <MessageSquare className="h-4 w-4" /> 
                <span>Help Center</span>
              </li>
              <li className="flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-pointer">
                <LifeBuoy className="h-4 w-4" /> 
                <span>Privacy Policy</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            © 2026 ProjectHub Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
            <a href="#" className="hover:text-emerald-500">Terms of Service</a>
            <a href="#" className="hover:text-emerald-500">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

