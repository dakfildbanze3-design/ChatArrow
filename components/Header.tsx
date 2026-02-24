
import React from 'react';
import { Menu, Share2, ChevronDown, LogIn } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  onMenuClick: () => void;
  activeCategory?: string;
  user: User | null;
  onLoginClick: () => void;
  currentScreen?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, activeCategory, user, onLoginClick, currentScreen }) => {
  return (
    <header className="flex items-center justify-between px-4 py-4 bg-white dark:bg-black shadow-sm dark:shadow-md sticky top-0 z-50 border-b border-zinc-100 dark:border-white/5 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-zinc-900 dark:text-white" />
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer group">
          <a href="/" className="text-xl font-semibold italic text-zinc-900 dark:text-white tracking-tight font-['Inter'] hover:opacity-80 transition-opacity">
            chatArrow
          </a>
          <div className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-white/90 font-normal whitespace-nowrap">
            {currentScreen ? (
              <>
                <span className="text-zinc-300 dark:text-white/20">/</span>
                <span className="font-medium">{currentScreen}</span>
              </>
            ) : (
              <>
                {activeCategory || (
                  <>
                    5.2 <span className="text-blue-500 font-medium tracking-wide">beta</span>
                  </>
                )}
              </>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-white/90 transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-full transition-all group">
            <Share2 className="w-4 h-4 text-zinc-600 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white" />
            <span className="text-xs font-medium text-zinc-600 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white">Compartilhar</span>
          </button>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full hover:opacity-90 transition-all shadow-lg"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Entrar</span>
          </button>
        )}
      </div>
    </header>
  );
};
