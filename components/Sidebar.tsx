import React from 'react';
import { MessageSquare, Compass, LayoutGrid, Clock, Settings, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  startNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, startNewChat }) => {
  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-skywork-sidebar border-r border-skywork-border transition-all duration-300 z-50 flex flex-col ${isOpen ? 'w-64' : 'w-16'}`}
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-skywork-border/50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={startNewChat}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">S</span>
            </div>
          {isOpen && <span className="font-semibold text-lg tracking-tight text-white">Skywork</span>}
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        <button 
          onClick={startNewChat}
          className={`mx-3 flex items-center gap-3 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group ${!isOpen && 'justify-center px-0 mx-2'}`}
        >
          <Plus size={20} />
          {isOpen && <span className="text-sm font-medium">New Chat</span>}
        </button>

        <div className="pt-4 space-y-1">
          <NavItem icon={<MessageSquare size={20} />} label="Chat" isOpen={isOpen} active />
          <NavItem icon={<Search size={20} />} label="Search" isOpen={isOpen} />
          <NavItem icon={<Compass size={20} />} label="Explore" isOpen={isOpen} />
          <NavItem icon={<LayoutGrid size={20} />} label="Library" isOpen={isOpen} />
        </div>

        {/* History Section (Mock) */}
        {isOpen && (
          <div className="mt-8 px-4">
            <h3 className="text-xs font-medium text-skywork-muted uppercase tracking-wider mb-3">Recent</h3>
            <div className="space-y-1">
              <HistoryItem label="React Component Design" />
              <HistoryItem label="Analysis of Q3 Reports" />
              <HistoryItem label="Travel Itinerary Japan" />
            </div>
          </div>
        )}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-skywork-border/50">
        <div className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center text-xs font-medium shrink-0">
            U
          </div>
          {isOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-skywork-muted truncate">Free Plan</p>
            </div>
          )}
          {isOpen && <Settings size={16} className="text-skywork-muted hover:text-white cursor-pointer" />}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-skywork-surface border border-skywork-border rounded-full flex items-center justify-center text-skywork-muted hover:text-white hover:border-blue-500 transition-colors z-50"
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
};

const NavItem = ({ icon, label, isOpen, active = false }: { icon: React.ReactNode, label: string, isOpen: boolean, active?: boolean }) => (
  <button className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${active ? 'bg-skywork-surface text-blue-400 border-r-2 border-blue-500' : 'text-skywork-muted hover:text-white hover:bg-skywork-surface/50'} ${!isOpen && 'justify-center px-0'}`}>
    {icon}
    {isOpen && <span className="text-sm">{label}</span>}
  </button>
);

const HistoryItem = ({ label }: { label: string }) => (
  <button className="w-full text-left px-2 py-1.5 text-sm text-skywork-muted hover:text-white hover:bg-skywork-surface rounded truncate transition-colors">
    {label}
  </button>
);

export default Sidebar;