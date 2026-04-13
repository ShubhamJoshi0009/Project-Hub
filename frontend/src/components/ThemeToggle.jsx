import React from 'react';
import { useTheme } from '../ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-2 p-1 rounded-full transition-all duration-500 border shadow-lg hover:shadow-xl group"
      aria-label="Toggle theme"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        width: '64px',
        height: '32px'
      }}
    >
      <div 
        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-500 flex items-center justify-center shadow-md ${
          isDarkMode ? 'translate-x-8 bg-slate-800 text-yellow-400' : 'translate-x-0 bg-white text-emerald-600'
        }`}
      >
        {isDarkMode ? <Moon className="h-4 w-4 fill-current" /> : <Sun className="h-4 w-4 fill-current" />}
      </div>
      
      <div className="flex justify-between w-full px-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
        <Sun className="h-4 w-4 text-emerald-600" />
        <Moon className="h-4 w-4 text-slate-800 dark:text-slate-100" />
      </div>
    </button>
  );
};

export default ThemeToggle;

