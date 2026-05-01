import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, Project } from '../types';
import { 
  CheckCircle, 
  Clock, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch user's projects
    const projectsQuery = query(
      collection(db, 'projects'),
      where(`members.${user.uid}`, 'in', ['OWNER', 'ADMIN', 'MEMBER'])
    );
    
    const unsubProjects = onSnapshot(projectsQuery, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    // Fetch tasks where user is assigned or creator or in viewerIds
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('viewerIds', 'array-contains', user.uid)
    );
    
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    return () => {
      unsubProjects();
      unsubTasks();
    };
  }, [user]);

  const getStatsData = () => {
    const statusCounts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'To Do', value: statusCounts.todo || 0, color: '#94a3b8' },
      { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#3b82f6' },
      { name: 'Completed', value: statusCounts.completed || 0, color: '#22c55e' },
    ].filter(d => d.value > 0);
  };

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = activeTasks.filter(t => t.dueDate && t.dueDate.toDate() < new Date());

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-black border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-display font-black tracking-tighter"
           >
            Mission Control
           </motion.h1>
           <p className="text-gray-400 font-medium font-sans">Strategic overview of your operational workspace.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="text-right px-4 border-r border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-sm font-bold font-mono">SYSTEM_OK</span>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{format(new Date(), 'EEEE')}</p>
              <p className="text-xl font-display font-bold leading-none">{format(new Date(), 'MMM d')}</p>
           </div>
        </div>
      </header>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 auto-rows-[180px] gap-6">
        
        {/* Large Hero Metric */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-4 lg:col-span-4 row-span-2 bg-black rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group border border-white/10"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
             <div>
                <div className="flex items-center space-x-3 mb-8">
                   <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Global Progress</span>
                   </div>
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: tasks.length ? `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` : '0%' }}
                    className="h-1 bg-white rounded-full transition-all duration-1000" 
                   />
                </div>
                <h2 className="text-8xl font-display font-black tracking-tighter leading-none mb-4">
                  {activeTasks.length}<span className="text-white/20">/</span>{tasks.length}
                </h2>
                <p className="text-xl font-bold text-gray-400 max-w-sm font-sans">
                  Critical tasks remaining across your current operating environment.
                </p>
             </div>
             
             <div className="flex items-center space-x-6">
                <Link to="/tasks" className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all flex items-center space-x-2">
                   <span>Launch Task View</span>
                   <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex -space-x-3">
                   {projects.slice(0, 3).map((p, i) => (
                     <div key={p.id} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md" title={p.name}>
                        <Briefcase className="w-5 h-5 text-white/40" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
          
          {/* Decorative background grid/graph */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="absolute right-[-10%] bottom-[-10%] w-full h-full opacity-30 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 { x: 0, y: 10 }, { x: 1, y: 30 }, { x: 2, y: 20 }, { x: 3, y: 60 }, { x: 4, y: 45 }, { x: 5, y: 80 }
               ]}>
                 <Area type="monotone" dataKey="y" stroke="#fff" strokeWidth={4} fill="none" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-[3rem] p-10 neo-shadow border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
           <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 absolute top-10">Task Orbit</h3>
           <div className="w-full h-48 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={getStatsData()}
                   innerRadius={60}
                   outerRadius={85}
                   paddingAngle={8}
                   dataKey="value"
                   stroke="none"
                 >
                   {getStatsData().map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black font-display">{tasks.length}</span>
             </div>
           </div>
           <div className="grid grid-cols-3 gap-6 mt-8 w-full">
              {getStatsData().map(d => (
                <div key={d.name} className="flex flex-col items-center">
                   <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ backgroundColor: d.color }} />
                   <div className="text-lg font-black leading-none mb-1 font-mono">{d.value}</div>
                   <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400 whitespace-nowrap">{d.name}</div>
                </div>
              ))}
           </div>
        </motion.div>

        {/* Small Data Cards */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 lg:col-span-2 row-span-1 bg-white rounded-[2.5rem] p-8 neo-shadow border border-gray-100 flex flex-col justify-between"
        >
           <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                 <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500/50">Urgent</span>
           </div>
           <div>
              <p className="text-4xl font-black font-display leading-tight">{overdueTasks.length}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Overdue Deliverables</p>
           </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="md:col-span-2 lg:col-span-2 row-span-1 bg-[#EBFFD3] rounded-[2.5rem] p-8 neo-shadow border border-[#DAF5AF] flex flex-col justify-between"
        >
           <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white">
                 <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Success</span>
           </div>
           <div>
              <p className="text-4xl font-black font-display leading-tight">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Total Completed</p>
           </div>
          </motion.div>

          {/* Activity Stream Section */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-4 lg:col-span-4 row-span-2 bg-white rounded-[3rem] p-10 neo-shadow border border-gray-100 flex flex-col"
          >
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                   <LayoutDashboard className="w-5 h-5 text-gray-400" />
                   <h3 className="text-lg font-black tracking-tight">Deployment Activity</h3>
                </div>
                <div className="flex items-center space-x-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Stream</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                {tasks.slice(0, 8).sort((a,b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0)).map((task, i) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center group cursor-pointer"
                  >
                     <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mr-4 group-hover:bg-black group-hover:text-white transition-all">
                        <TrendingUp className="w-4 h-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-sm font-bold truncate pr-4">{task.title}</h4>
                           <span className="text-[8px] font-mono font-bold text-gray-400">
                             {task.updatedAt ? format(task.updatedAt.toDate(), 'HH:mm:ss') : 'LIVE'}
                           </span>
                        </div>
                        <div className="flex items-center space-x-3">
                           <div className="flex items-center space-x-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500')} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{task.status}</span>
                           </div>
                           <span className="text-[10px] text-gray-300">•</span>
                           <span className="text-[10px] font-bold text-gray-400">Assignee: {task.assignedTo?.slice(0, 6) || 'None'}</span>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </motion.div>

          {/* Quick Actions / Integration Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden"
          >
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <h3 className="text-2xl font-black font-display tracking-tight mb-4 leading-tight">Advanced Analytics & Team Intelligence</h3>
                   <p className="text-white/60 text-sm font-medium leading-relaxed mb-6">Unlock deeper insights into your team's velocity and project health with our enterprise modules.</p>
                </div>
                <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-all">
                   Upgrade Workspace
                </button>
             </div>
             {/* Abstract geometric shapes */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl -ml-20 -mb-20" />
          </motion.div>

      </div>
    </div>
  );
}
