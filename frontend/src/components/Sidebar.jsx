import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  UserCircle, 
  LogOut, 
  PlusCircle,
  Menu,
  X,
  Target
} from 'lucide-react';
import { AuthContext } from '../AuthContextInstance';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: Briefcase, label: 'Projects' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg border"
        style={{ 
          backgroundColor: 'var(--sidebar-bg)', 
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)'
        }}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-50
        transition-all duration-300 ease-in-out border-r
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ 
        backgroundColor: 'var(--sidebar-bg)', 
        borderColor: 'var(--border-color)',
        color: 'var(--text-main)'
      }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20">
              <Target className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>ProjectHub</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => toggleSidebar(false)}
                className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <link.icon className="h-5 w-5" />
                <span className="font-bold">{link.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="px-4 py-3 rounded-xl flex items-center gap-3" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate" style={{ color: 'var(--text-main)' }}>{user.name}</p>
                <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 hover:bg-rose-500/10 hover:text-rose-600 rounded-xl transition-all gap-3"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-bold">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
