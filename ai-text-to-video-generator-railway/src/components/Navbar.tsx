import React from 'react';
import { Video, Film, Sparkles, User, LogOut, Moon, Sun, History, PlusCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser: UserType | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onNewProject: () => void;
  videoCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenHistory,
  onNewProject,
  videoCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewProject}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                VideoStudio AI
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                Veo / Gemini
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Text-to-Video Generator
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* New Project */}
          <button
            onClick={onNewProject}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Start fresh project"
          >
            <PlusCircle className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">New Video</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <History className="w-4 h-4 text-purple-500" />
            <span>Library</span>
            {videoCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                {videoCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden md:inline">
                {currentUser.username}
              </span>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
