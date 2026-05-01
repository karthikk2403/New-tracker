import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  Command
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signOut, auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: Users, label: 'Team', path: '/team' },
];

export function Layout() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (!user) return <Outlet />;

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans transition-colors duration-300",
      isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            className={cn(
              "w-72 flex flex-col z-30 border-r transition-colors duration-300",
              isDarkMode ? "bg-[#0f0f0f] border-[#1f1f1f]" : "bg-white border-gray-100"
            )}
          >
            <div className="p-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
                  <CheckSquare className="text-white w-6 h-6" />
                </div>
                <span className="font-black text-2xl tracking-tighter uppercase italic">TeamTask</span>
              </Link>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group",
                      isActive 
                        ? (isDarkMode ? "bg-white text-black shadow-xl" : "bg-black text-white shadow-xl")
                        : (isDarkMode ? "text-gray-500 hover:bg-[#1a1a1a] hover:text-white" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900")
                    )}
                  >
                    <div className="flex items-center space-x-4">
                      <item.icon className="w-5 h-5" />
                      <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                    </div>
                    {isActive && <motion.div layoutId="activeDot" className={cn("w-1.5 h-1.5 rounded-full", isDarkMode ? "bg-black" : "bg-white")} />}
                    {!isActive && <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-gray-100/10 space-y-4">
              <div 
                className={cn(
                  "flex items-center p-3 rounded-2xl transition-all cursor-pointer group",
                  isDarkMode ? "bg-[#1a1a1a] hover:bg-[#252525]" : "bg-gray-50 hover:bg-gray-100"
                )}
              >
                <img 
                  src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || user.displayName}&background=random`} 
                  alt={profile?.displayName} 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-xs font-black truncate uppercase tracking-tight">{profile?.displayName || user.displayName}</p>
                  <p className="text-[10px] text-gray-500 font-bold truncate uppercase tracking-widest">{profile?.role || 'Contributor'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl transition-all",
                    isDarkMode ? "bg-[#1a1a1a] text-yellow-400" : "bg-gray-50 text-gray-400"
                  )}
                 >
                   {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                 </button>
                 <button 
                  onClick={() => signOut(auth)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl transition-all",
                    isDarkMode ? "bg-[#1a1a1a] text-red-400" : "bg-gray-50 text-red-400"
                  )}
                 >
                   <LogOut className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={cn(
          "h-20 flex items-center justify-between px-10 z-20 backdrop-blur-xl transition-colors duration-300",
          isDarkMode ? "bg-[#0a0a0a]/80" : "bg-white/80"
        )}>
          <div className="flex items-center space-x-8 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "p-2.5 rounded-xl transition-colors",
                isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search projects, tasks, members..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full pl-12 pr-4 py-3 rounded-2xl border-none focus:ring-0 transition-all text-xs font-bold uppercase tracking-widest",
                  isDarkMode ? "bg-[#1a1a1a] text-white placeholder-gray-600" : "bg-gray-50 text-gray-900 placeholder-gray-400"
                )}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-40">
                 <Command className="w-3 h-3" />
                 <span className="text-[10px] font-black italic">K</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
             <button className={cn(
               "relative p-2.5 rounded-xl transition-all",
               isDarkMode ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-gray-600"
             )}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
             <div className="hidden lg:block w-px h-6 bg-gray-200" />
             <div className="hidden lg:flex items-center space-x-3 px-4 py-2 bg-black text-white rounded-xl shadow-lg cursor-pointer hover:scale-105 transition-transform">
                <Settings className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Settings</span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
