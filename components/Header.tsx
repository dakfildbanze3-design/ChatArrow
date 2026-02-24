
import React from 'react';
import { Menu, Share2, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  activeCategory?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, activeCategory }) => {
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
          <h1 className="text-xl font-semibold italic text-zinc-900 dark:text-white tracking-tight font-['Inter']">
            chatArrow
          </h1>
          <span className="text-sm text-zinc-600 dark:text-white/90 font-normal whitespace-nowrap flex items-center gap-1.5">
            {activeCategory || (
              <>
                5.2 <span className="text-blue-500 font-medium tracking-wide">beta</span>
              </>
            )}
          </span>
          <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-white/90 transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-full transition-all group">
          <Share2 className="w-4 h-4 text-zinc-600 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white" />
          <span className="text-xs font-medium text-zinc-600 dark:text-white/80 group-hover:text-zinc-900 dark:group-hover:text-white">Compartilhar</span>
        </button>
      </div>
    </header>
  );
};
