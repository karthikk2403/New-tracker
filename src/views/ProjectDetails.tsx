import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Project, Task, TaskStatus, TaskPriority, ProjectActivity } from '../types';
import { 
  Plus, 
  ChevronLeft, 
  MoreHorizontal, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle,
  Briefcase,
  Trash2,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { useNotification } from '../components/Notification';
import { TeamInviteModal } from '../components/TeamInviteModal';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';

const STATUS_COLUMNS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'Initial', value: 'todo', color: 'bg-gray-100 text-gray-700' },
  { label: 'Active', value: 'in-progress', color: 'bg-blue-50 text-blue-700' },
  { label: 'Resolved', value: 'completed', color: 'bg-green-50 text-green-700' },
];

const STATUS_COLORS_MAP = {
  todo: '#94a3b8',
  'in-progress': '#3b82f6',
  completed: '#22c55e',
  archived: '#f43f5e'
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useNotification();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeView, setActiveView] = useState<'board' | 'analytics' | 'activity'>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProject, setEditProject] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    priority: 'medium' as TaskPriority,
    assignedTo: ''
  });

  const isAdmin = useMemo(() => {
    if (!project || !user) return false;
    return project.ownerId === user.uid || project.members[user.uid] === 'ADMIN';
  }, [project, user]);

  useEffect(() => {
    if (!id || !user) return;

    // Fetch project
    const projectRef = doc(db, 'projects', id);
    const unsubProject = onSnapshot(projectRef, async (snap) => {
      if (snap.exists()) {
        const projectData = { id: snap.id, ...snap.data() } as Project;
        setProject(projectData);

        const memberIds = Object.keys(projectData.members);
        const newProfiles: Record<string, string> = { ...memberProfiles };
        let updated = false;

        for (const mid of memberIds) {
          if (!newProfiles[mid]) {
            const uDoc = await getDoc(doc(db, 'users', mid));
            if (uDoc.exists()) {
              newProfiles[mid] = uDoc.data().displayName;
              updated = true;
            } else {
              newProfiles[mid] = 'Unknown User';
              updated = true;
            }
          }
        }
        if (updated) setMemberProfiles(newProfiles);
      }
    });

    // Fetch tasks
    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', id));
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      setTasks(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `projects/${id}/tasks`));

    // Fetch activities
    const activitiesQuery = query(
      collection(db, 'activity'), 
      where('projectId', '==', id),
      limit(20)
    );
    const unsubActivities = onSnapshot(activitiesQuery, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectActivity[];
      setActivities(data.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    });

    return () => {
      unsubProject();
      unsubTasks();
      unsubActivities();
    };
  }, [id, user]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newTask.title || !project) return;

    try {
      const taskData = {
        projectId: id,
        title: newTask.title,
        description: newTask.description,
        status: 'todo' as TaskStatus,
        priority: newTask.priority,
        assignedTo: newTask.assignedTo || null,
        viewerIds: Object.keys(project.members),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subtasks: []
      };
      
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      
      await addDoc(collection(db, 'activity'), {
        projectId: id,
        taskId: docRef.id,
        userId: user.uid,
        type: 'creation',
        details: `created task "${newTask.title}"`,
        createdAt: serverTimestamp()
      });

      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '' });
      notify("Task created", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user || !id) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'activity'), {
        projectId: id,
        taskId: taskId,
        userId: user.uid,
        type: 'status_change',
        details: `moved task to ${newStatus}`,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!isAdmin) {
      notify("Priority override required. Unauthorized action.", "error");
      return;
    }
    if (!confirm("Destroy this task permanently?")) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      notify("Task purged", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  useEffect(() => {
    if (project) {
      setEditProject({ name: project.name, description: project.description });
    }
  }, [project]);

  const updateTeamLeader = async (leaderId: string) => {
    if (!isAdmin || !id) return;
    try {
      await updateDoc(doc(db, 'projects', id), {
        teamLeaderId: leaderId || null
      });
      notify("Operational Lead synchronized", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !id) return;
    try {
      await updateDoc(doc(db, 'projects', id), {
        name: editProject.name,
        description: editProject.description,
        updatedAt: serverTimestamp()
      });
      setShowEditModal(false);
      notify("Mission parameters updated", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const removeMember = async (mid: string) => {
    if (!isAdmin) return;
    if (mid === project?.ownerId) {
      notify("Cannot remove mission architect", "error");
      return;
    }
    if (!confirm("Remove this operative from mission?")) return;
    try {
      const { [mid]: _, ...remainingMembers } = project!.members;
      await updateDoc(doc(db, 'projects', id!), {
        members: remainingMembers,
        updatedAt: serverTimestamp()
      });
      notify("Operative detached", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const projectProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100);
  }, [tasks]);

  const getChartData = () => {
    const counts = tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.toUpperCase(), 
      value,
      fill: STATUS_COLORS_MAP[name as keyof typeof STATUS_COLORS_MAP] || '#000'
    }));
  };

  const getPriorityData = () => {
    const counts = tasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return ['low', 'medium', 'high', 'urgent'].map(name => ({ 
      name: name.toUpperCase(), 
      value: counts[name] || 0 
    }));
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
       <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-black border-t-transparent rounded-full"
       />
    </div>
  );
  if (!project) return <div className="p-20 text-center font-black">UNAUTHORIZED_ACCESS_OR_NOT_FOUND</div>;

  return (
    <div className="h-full flex flex-col space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] neo-shadow border border-gray-100">
        <div className="flex-1">
          <Link to="/projects" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black mb-4 transition-all">
            <ChevronLeft className="w-3 h-3 mr-1" />
            Workspace Root
          </Link>
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-3xl bg-black flex items-center justify-center text-white shadow-xl rotate-3">
               <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-4xl font-display font-black tracking-tighter leading-tight">
                  {project.name}
                </h2>
                {isAdmin && (
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black transition-all"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                 <div className="flex -space-x-2">
                    {Object.keys(project.members).slice(0, 5).map(uid => (
                      <div key={uid} className="relative group/member">
                        <img 
                          src={`https://ui-avatars.com/api/?name=${memberProfiles[uid] || 'User'}&background=random`} 
                          className="h-8 w-8 rounded-full ring-4 ring-white shadow-sm" 
                          title={`${memberProfiles[uid]} (${project.members[uid]})`}
                        />
                        {isAdmin && uid !== user!.uid && (
                          <button 
                            onClick={() => removeMember(uid)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/member:opacity-100 transition-all shadow-lg"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                 </div>
                 {isAdmin && (
                   <button 
                    onClick={() => setShowInviteModal(true)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all border border-gray-100"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                 )}
                 <div className="h-6 w-px bg-gray-100" />
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team Leader:</span>
                    {isAdmin ? (
                      <div className="relative group/leader">
                        <select 
                          value={project.teamLeaderId || ''} 
                          onChange={(e) => updateTeamLeader(e.target.value)}
                          className="appearance-none bg-gray-50 hover:bg-black hover:text-white transition-all rounded-xl px-4 py-1 pr-6 text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-black/5 border-none cursor-pointer"
                        >
                          <option value="">UNASSIGNED</option>
                          {Object.keys(project.members).map(mid => (
                            <option key={mid} value={mid}>{memberProfiles[mid] || mid}</option>
                          ))}
                        </select>
                        <MoreHorizontal className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover/leader:text-white group-hover/leader:opacity-100 transition-all" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-widest text-black">
                        {project.teamLeaderId ? memberProfiles[project.teamLeaderId] : 'PENDING DEPLOYMENT'}
                      </span>
                    )}
                 </div>
                 <div className="h-6 w-px bg-gray-100" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                   {Object.keys(project.members).length} OPERATIVES ACTIVE
                 </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
           <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {['board', 'analytics', 'activity'].map((v) => (
                <button 
                  key={v}
                  onClick={() => setActiveView(v as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeView === v ? "bg-white shadow-sm ring-1 ring-black/5" : "text-gray-400 hover:text-black"
                  )}
                >
                  {v}
                </button>
              ))}
           </div>
           <div className="flex items-center space-x-3">
              <div className="text-right">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Project Velocity</p>
                 <div className="flex items-center space-x-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${projectProgress}%` }}
                        className="h-full bg-black" 
                       />
                    </div>
                    <span className="text-xs font-black font-mono">{projectProgress}%</span>
                 </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTaskModal(true)}
                className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all"
              >
                Assemble Task
              </motion.button>
           </div>
        </div>
      </div>

      {activeView === 'board' && (
        <div className="flex-1 overflow-x-auto min-h-0 pt-4 scrollbar-hide">
          <div className="flex gap-8 h-full pb-10">
            {STATUS_COLUMNS.map((column, colIdx) => {
              const columnTasks = tasks.filter(t => t.status === column.value);
              return (
                <motion.div 
                  key={column.value} 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.1 }}
                  className="flex-shrink-0 w-85 flex flex-col h-full group/col"
                >
                  <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentcolor]",
                        column.value === 'completed' ? 'text-green-500 bg-green-500' : 
                        column.value === 'in-progress' ? 'text-blue-500 bg-blue-500' : 'text-gray-300 bg-gray-300'
                      )} />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 group-hover/col:text-black transition-colors">
                        {column.label}
                      </h3>
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-100 shadow-sm">
                        {columnTasks.length.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide pt-2">
                    <AnimatePresence mode="popLayout">
                      {columnTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ 
                            y: -8,
                            rotateX: 1,
                            rotateY: -1,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                          }}
                          style={{ perspective: 1000 }}
                          onClick={() => setSelectedTask(task)}
                          className="bg-white border border-gray-100/60 rounded-[2.5rem] p-7 shadow-sm transition-all group cursor-pointer relative overflow-hidden"
                        >
                          <div className={cn(
                            "absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2",
                            task.priority === 'urgent' ? 'bg-red-500' : 
                            task.priority === 'high' ? 'bg-orange-500' : 
                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-200'
                          )} />

                          <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-col gap-2">
                              <span className={cn(
                                "text-[8px] uppercase font-black px-2 py-0.5 rounded-full tracking-widest",
                                PRIORITY_COLORS[task.priority]
                              )}>
                                {task.priority}
                              </span>
                              <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-400">
                                 {task.assignedTo ? (
                                   <img 
                                    src={`https://ui-avatars.com/api/?name=${memberProfiles[task.assignedTo] || 'U'}&background=random`} 
                                    className="w-4 h-4 rounded-full" 
                                   />
                                 ) : <Circle className="w-3 h-3" />}
                                 <span className="truncate max-w-[100px]">{memberProfiles[task.assignedTo || ''] || 'UNASSIGNED'}</span>
                              </div>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                               <button 
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl"
                               >
                                <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                          
                          <h4 className="font-black text-lg tracking-tight text-gray-900 group-hover:translate-x-1 transition-transform mb-3 leading-tight">{task.title}</h4>
                          
                          {task.description && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 mb-6 font-medium leading-relaxed">{task.description}</p>
                          )}

                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mb-6 flex items-center space-x-3">
                               <div className="flex-1 h-1 bg-gray-50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-black transition-all" 
                                    style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }} 
                                  />
                               </div>
                               <span className="text-[9px] font-black font-mono text-gray-400">
                                 {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                               </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-6 border-t border-gray-50/80">
                            <div className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                               <Clock className="w-3.5 h-3.5 mr-2" />
                               {task.createdAt ? format(task.createdAt.toDate(), 'MMM d') : 'PENDING'}
                            </div>
                            
                            <div onClick={(e) => e.stopPropagation()} className="relative">
                              <select 
                                value={task.status}
                                onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                                className="appearance-none text-[10px] font-black bg-gray-50 group-hover:bg-black group-hover:text-white transition-all rounded-xl px-4 py-2 pr-8 border-none focus:ring-4 focus:ring-black/5 cursor-pointer uppercase tracking-widest"
                              >
                                <option value="todo">INITIAL</option>
                                <option value="in-progress">ACTIVE</option>
                                <option value="completed">RESOLVED</option>
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 group-hover:text-white transition-all">
                                 <MoreHorizontal className="w-3 h-3" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.02)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowTaskModal(true)}
                      className="w-full py-6 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:text-black hover:border-black transition-all gap-2"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize Task</span>
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="flex-1 overflow-y-auto pr-4 pt-4 space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-10 rounded-[3rem] neo-shadow border border-gray-100"
              >
                <h3 className="text-lg font-black tracking-tight mb-10 flex items-center">
                   <TrendingUp className="w-5 h-5 mr-3 text-blue-500" />
                   Lifecycle Distribution
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={getChartData()} 
                        innerRadius={80} 
                        outerRadius={110} 
                        paddingAngle={10} 
                        dataKey="value"
                        stroke="none"
                      >
                         {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-10 rounded-[3rem] neo-shadow border border-gray-100"
              >
                <h3 className="text-lg font-black tracking-tight mb-10 flex items-center">
                   <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                   Prioritization Matrix
                </h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPriorityData()}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase' }} />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                      <Bar dataKey="value" fill="#000" radius={[12, 12, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
           </div>
        </div>
      )}

      {activeView === 'activity' && (
        <div className="flex-1 overflow-y-auto pr-4 pt-4">
           <div className="bg-white rounded-[3rem] neo-shadow border border-gray-100 p-12 max-w-4xl mx-auto">
              <h3 className="text-2xl font-black mb-12 tracking-tight flex items-center">
                 <Clock className="w-6 h-6 mr-4 text-gray-400" />
                 Operational Timeline
              </h3>
              <div className="space-y-12 relative before:absolute before:left-10 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                 {activities.map((activity, idx) => (
                   <motion.div 
                    key={activity.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex space-x-10 relative pl-10"
                   >
                     <div className="absolute left-8 top-1 w-4 h-4 rounded-full bg-white border-4 border-black z-10 shadow-[0_0_15px_rgba(0,0,0,0.2)]" />
                     <div className="flex-1 bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50 hover:bg-white transition-all hover:neo-shadow group">
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-3">
                              <img src={`https://ui-avatars.com/api/?name=${memberProfiles[activity.userId] || 'U'}&background=random`} className="w-6 h-6 rounded-full" />
                              <span className="text-sm font-black text-gray-900">{memberProfiles[activity.userId] || 'System'}</span>
                           </div>
                           <p className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-black transition-colors">
                            {activity.createdAt ? format(activity.createdAt.toDate(), 'HH:mm:ss') : '...'}
                           </p>
                        </div>
                        <p className="text-gray-500 font-medium">{activity.details}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mt-4">
                           {activity.createdAt ? format(activity.createdAt.toDate(), 'MMMM d, yyyy') : '...'}
                        </p>
                     </div>
                   </motion.div>
                 ))}
                 {activities.length === 0 && (
                   <div className="text-center py-20 text-gray-400 font-black uppercase tracking-[0.3em]">No activity detected.</div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailsModal 
            task={selectedTask} 
            memberProfiles={memberProfiles} 
            onClose={() => setSelectedTask(null)} 
          />
        )}

        {showInviteModal && project && (
          <TeamInviteModal 
            project={project}
            onClose={() => setShowInviteModal(false)}
          />
        )}

        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-lg" 
              onClick={() => setShowEditModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowEditModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <h3 className="text-4xl font-display font-black mb-10 tracking-tighter">Edit Project</h3>
              <form onSubmit={handleUpdateProject} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Project Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-lg font-bold"
                    value={editProject.name}
                    onChange={e => setEditProject({...editProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all font-medium"
                    value={editProject.description}
                    onChange={e => setEditProject({...editProject, description: e.target.value})}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-6 rounded-[2rem] bg-black text-white font-black uppercase tracking-[0.3em] hover:shadow-xl transition-all"
                >
                  Update Parameters
                </button>
              </form>
            </motion.div>
          </div>
        )}
        
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-lg" 
              onClick={() => setShowTaskModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setShowTaskModal(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-10 shadow-sm border border-gray-100 rotate-3">
                 <Plus className="w-8 h-8 text-black" />
              </div>
              
              <h3 className="text-4xl font-display font-black mb-2 tracking-tighter">New Operational Task</h3>
              <p className="text-gray-400 font-medium mb-10">Define the objective and allocate resources.</p>

              <form onSubmit={handleCreateTask} className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Task Objective</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. System Breach Response"
                    className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-lg font-bold"
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Strategic Context</label>
                  <textarea
                    rows={3}
                    placeholder="Provide mission details..."
                    className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all font-medium leading-relaxed"
                    value={newTask.description}
                    onChange={e => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Asset Assignment</label>
                    <select
                      className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-sm font-bold appearance-none"
                      value={newTask.assignedTo}
                      onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                    >
                      <option value="">STANDBY</option>
                      {Object.keys(project.members).map(mid => (
                        <option key={mid} value={mid}>{memberProfiles[mid] || mid}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Threat Level</label>
                    <select
                      className="w-full px-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-sm font-bold appearance-none"
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as TaskPriority})}
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                      <option value="urgent">CRITICAL</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-6 rounded-[2rem] bg-black text-white font-black uppercase tracking-[0.3em] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all active:scale-95 text-xs"
                  >
                    Deploy Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
