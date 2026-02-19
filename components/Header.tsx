
import React from 'react';
import { Menu, Settings, ChevronDown } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  activeCategory?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, activeCategory }) => {
  // Path provided by user for the app/profile icon
  const ICON_PATH = 'assets/images/10_de_fev._de_2026,_15_01_43.png';

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-black shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer group">
          <h1 className="text-xl font-semibold italic text-white tracking-tight font-['Inter']">
            chatArrow
          </h1>
          <span className="text-sm text-white/90 font-normal whitespace-nowrap flex items-center gap-1.5">
            {activeCategory || (
              <>
                5.2 <span className="text-blue-500 font-medium tracking-wide">beta</span>
              </>
            )}
          </span>
          <ChevronDown className="w-5 h-5 text-white/90 transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-zinc-900 cursor-pointer hover:border-white/40 transition-colors">
          <img 
            src={ICON_PATH} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if local asset is not found
              e.currentTarget.src = 'https://ui-avatars.com/api/?name=Dakfild&background=333&color=fff';
            }}
          />
        </div>
        <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>
    </header>
  );
};