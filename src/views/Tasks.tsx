import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, Project } from '../types';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle,
  Filter,
  Search,
  ArrowUpDown,
  MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';

export function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;

    // Fetch My Projects first (to resolve names)
    const qProjects = query(
      collection(db, 'projects'),
      where(`members.${user.uid}`, 'in', ['OWNER', 'ADMIN', 'MEMBER'])
    );
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    // Fetch tasks where user is assigned or creator
    const qAssigned = query(collection(db, 'tasks'), where('assignedTo', '==', user.uid));
    const qCreated = query(collection(db, 'tasks'), where('createdBy', '==', user.uid));

    const unsubTasksAssigned = onSnapshot(qAssigned, (snap) => {
      const assignedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      setTasks(prev => {
        const others = prev.filter(t => t.createdBy === user.uid);
        const merged = [...others];
        assignedTasks.forEach(t => { if (!merged.find(m => m.id === t.id)) merged.push(t); });
        return merged;
      });
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    const unsubTasksCreated = onSnapshot(qCreated, (snap) => {
      const createdTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      setTasks(prev => {
        const others = prev.filter(t => t.assignedTo === user.uid);
        const merged = [...others];
        createdTasks.forEach(t => { if (!merged.find(m => m.id === t.id)) merged.push(t); });
        return merged;
      });
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));

    return () => {
      unsubProjects();
      unsubTasksAssigned();
      unsubTasksCreated();
    };
  }, [user]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-gray-500">View and filter tasks across all your projects.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold uppercase text-gray-400 tracking-wider">
              <th className="px-6 py-4">Task Name</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{task.title}</div>
                </td>
                <td className="px-6 py-4">
                  <Link to={`/projects/${task.projectId}`} className="text-gray-500 hover:text-black hover:underline transition-all">
                    {projects.find(p => p.id === task.projectId)?.name || '...'}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] font-bold uppercase rounded px-2 py-0.5",
                    task.status === 'completed' ? 'bg-green-100 text-green-700' :
                    task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {task.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      task.priority === 'urgent' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      task.priority === 'high' ? 'bg-orange-500' :
                      'bg-gray-300'
                    )} />
                    <span className="text-xs text-gray-500 capitalize">{task.priority}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-gray-400">
                    {task.createdAt ? format(task.createdAt.toDate(), 'MMM d') : '-'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link to={`/projects/${task.projectId}`} className="p-1 hover:bg-white border border-transparent hover:border-gray-200 rounded transition-all opacity-0 group-hover:opacity-100">
                     <TrendingUp className="w-4 h-4 text-gray-400 inline" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-400 italic">No tasks found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
