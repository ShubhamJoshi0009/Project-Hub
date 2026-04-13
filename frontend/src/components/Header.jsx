import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  UserCircle, 
  LogOut, 
  Target,
  Menu,
  X
} from 'lucide-react';
import { AuthContext } from '../AuthContextInstance';

const Header = ({ onProfileClick }) => {
  const { user, logout } = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: Briefcase, label: 'Projects' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    onProfileClick();
  };

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 bg-slate-950" 
            style={{ borderColor: 'var(--border-color)' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Target className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter" style={{ color: 'var(--text-main)' }}>ProjectHub</span>
          </NavLink>

          {/* Desktop Navigation */}
          {user ? (
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-emerald-500/10'}
                  `}
                  style={({ isActive }) => ({
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                  })}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:bg-emerald-500/10"
                style={{ color: 'var(--text-muted)' }}
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-8">
              <NavLink to="/login" className="text-sm font-black hover:text-emerald-600 transition-colors" style={{ color: 'var(--text-main)' }}>
                Sign In
              </NavLink>
              <NavLink to="/register" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
                Get Started
              </NavLink>
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            
            {user && (
              <>
                <div className="hidden md:block h-8 w-px bg-slate-800 mx-2" />
                <button 
                  onClick={onProfileClick}
                  className="hidden md:flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-emerald-500/10 transition-all group"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block overflow-hidden max-w-[150px]">
                    <p className="text-xs font-black leading-none truncate" style={{ color: 'var(--text-main)' }}>{user.name}</p>
                    <p className="text-[10px] font-bold truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                  </div>
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-xl"
                style={{ color: 'var(--text-main)', backgroundColor: 'var(--border-color)' }}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4 space-y-2 animate-in slide-in-from-top-4"
             style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {user ? (
            <>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold
                    ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : ''}
                  `}
                  style={({ isActive }) => ({
                    color: isActive ? '#ffffff' : 'var(--text-muted)'
                  })}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              ))}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:bg-emerald-500/10"
                style={{ color: 'var(--text-main)' }}
              >
                <UserCircle className="h-5 w-5 text-emerald-600" /> My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <NavLink 
                to="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-center border"
                style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
              >
                Sign In
              </NavLink>
              <NavLink 
                to="/register" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-center bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                Get Started
              </NavLink>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;

