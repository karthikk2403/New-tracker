import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, TaskComment, ProjectActivity, SubTask } from '../types';
import { 
  X, 
  Send, 
  User, 
  Clock, 
  MessageSquare, 
  History,
  CheckSquare,
  Plus,
  Trash2,
  Paperclip,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  memberProfiles: Record<string, string>;
}

export function TaskDetailsModal({ task, onClose, memberProfiles }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'subtasks' | 'history'>('comments');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (!task.id) return;

    const commentsQuery = query(
      collection(db, 'comments'),
      where('taskId', '==', task.id),
      orderBy('createdAt', 'asc')
    );

    const unsubComments = onSnapshot(commentsQuery, (snap) => {
      setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskComment[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'comments'));

    const activitiesQuery = query(
      collection(db, 'activity'),
      where('taskId', '==', task.id),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubActivities = onSnapshot(activitiesQuery, (snap) => {
      setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProjectActivity[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'activity'));

    return () => {
      unsubComments();
      unsubActivities();
    };
  }, [task.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.uid,
        text: newComment,
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, 'activity'), {
        projectId: task.projectId,
        taskId: task.id,
        userId: user.uid,
        type: 'comment',
        details: 'posted a comment',
        createdAt: serverTimestamp()
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim() || !user) return;

    const sub: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtask,
      completed: false
    };

    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        subtasks: [...(task.subtasks || []), sub],
        updatedAt: serverTimestamp()
      });
      setNewSubtask('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const toggleSubtask = async (subId: string) => {
    if (!task.subtasks) return;
    const updated = task.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        subtasks: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteSubtask = async (subId: string) => {
    if (!task.subtasks) return;
    const updated = task.subtasks.filter(s => s.id !== subId);
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        subtasks: updated,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="p-10 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center shadow-lg rotate-3 overflow-hidden group-hover:rotate-6 transition-transform">
                <Tag className="text-white w-7 h-7" />
             </div>
             <div>
                <h3 className="text-3xl font-display font-black tracking-tighter leading-none mb-2">{task.title}</h3>
                <div className="flex items-center space-x-3">
                   <div className="flex items-center space-x-2">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${memberProfiles[task.createdBy] || 'U'}&background=random`}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created by {memberProfiles[task.createdBy] || 'Unknown'}</span>
                   </div>
                   <span className="text-gray-300">•</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Project ID: {task.projectId.slice(0, 8)}</span>
                </div>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-4 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-12 border-r border-gray-100 scrollbar-hide">
            <div className="space-y-12">
              <section>
                <div className="flex items-center justify-between mb-4">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Strategic Context</h4>
                   <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                         <div className={cn("w-2 h-2 rounded-full", task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500')} />
                         <span className="text-[10px] font-black font-mono uppercase tracking-widest">{task.status}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                         <div className={cn("w-2 h-2 rounded-full", 
                          task.priority === 'urgent' ? 'bg-red-500' : 
                          task.priority === 'high' ? 'bg-orange-500' : 'bg-gray-500'
                        )} />
                        <span className="text-[10px] font-black font-mono uppercase tracking-widest">{task.priority}</span>
                      </div>
                   </div>
                </div>
                <div className="p-8 bg-gray-50 rounded-[2rem] text-gray-700 font-medium leading-relaxed shadow-inner border border-gray-100">
                  {task.description || 'No strategic context provided.'}
                </div>
              </section>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Asset Assignment</h4>
                 </div>
                 <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-md">
                       <User className="w-6 h-6" />
                    </div>
                    <div>
                       <span className="text-lg font-black">{task.assignedTo ? memberProfiles[task.assignedTo] : 'UNASSIGNED'}</span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Lead Operative</p>
                    </div>
                 </div>
              </section>

              <section>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Attachments</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => alert("Secure file uplink is currently being authenticated. Protocol restricted.")}
                      className="flex items-center space-x-4 p-6 border-2 border-dashed border-gray-100 rounded-[2rem] hover:border-black hover:bg-gray-50 transition-all text-gray-400 group h-24"
                    >
                       <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                          <Paperclip className="w-5 h-5" />
                       </div>
                       <span className="text-xs font-black uppercase tracking-widest group-hover:text-black">Upload Intelligence File</span>
                    </motion.button>
                 </div>
              </section>
            </div>
          </div>

          <div className="w-[420px] flex flex-col bg-gray-50/30">
            <div className="flex border-b border-gray-100 p-2 bg-white">
              {[
                { id: 'comments', icon: MessageSquare, label: 'Intel' },
                { id: 'subtasks', icon: CheckSquare, label: 'Protocol' },
                { id: 'history', icon: History, label: 'Logs' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 rounded-2xl transition-all",
                    activeTab === tab.id ? "bg-black text-white shadow-xl" : "text-gray-400 hover:text-black hover:bg-gray-50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {activeTab === 'comments' && (
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white p-6 rounded-[2rem] neo-shadow border border-gray-100 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black">
                             {memberProfiles[comment.userId]?.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{memberProfiles[comment.userId]}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-300">
                          {comment.createdAt ? format(comment.createdAt.toDate(), 'HH:mm') : '...'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-600 leading-relaxed">{comment.text}</p>
                    </motion.div>
                  ))}
                  {comments.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                      <MessageSquare className="w-12 h-12 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">No communications found</p>
                    </div>
                  )}
                </AnimatePresence>
              )}

              {activeTab === 'subtasks' && (
                <div className="space-y-4">
                   <form onSubmit={handleAddSubtask} className="relative mb-8">
                     <input 
                      type="text"
                      placeholder="New Protocol Directive..."
                      className="w-full px-8 py-5 rounded-[2rem] bg-white neo-shadow border border-gray-100 text-[10px] font-black tracking-widest uppercase focus:ring-4 focus:ring-black/5"
                      value={newSubtask}
                      onChange={e => setNewSubtask(e.target.value)}
                     />
                     <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-2xl hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" />
                     </button>
                   </form>
                   <AnimatePresence>
                     {(task.subtasks || []).map((sub) => (
                       <motion.div 
                        key={sub.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group shadow-sm"
                       >
                         <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => toggleSubtask(sub.id)}
                              className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                sub.completed ? "bg-black border-black text-white" : "border-gray-200 hover:border-black"
                              )}
                            >
                               {sub.completed && <CheckSquare className="w-4 h-4" />}
                            </button>
                            <span className={cn("text-sm font-bold transition-all", sub.completed ? "text-gray-300 line-through" : "text-gray-900")}>
                               {sub.title}
                            </span>
                         </div>
                         <button 
                          onClick={() => deleteSubtask(sub.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </motion.div>
                     ))}
                     {(task.subtasks?.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pt-10">
                          <CheckSquare className="w-12 h-12 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No protocols defined</p>
                        </div>
                     )}
                   </AnimatePresence>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {activities.map((activity, idx) => (
                    <motion.div 
                      key={activity.id} 
                      className="flex space-x-4 relative"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="w-1 h-1 rounded-full bg-black mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          <span className="font-black uppercase text-[10px] tracking-widest">{memberProfiles[activity.userId] || 'SYSTEM'}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 lowercase">{activity.details}</p>
                        <p className="text-[8px] font-mono font-bold text-gray-300 mt-1 uppercase">
                          {activity.createdAt ? format(activity.createdAt.toDate(), 'HH:mm:ss') : '...'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {activeTab === 'comments' && (
              <form onSubmit={handlePostComment} className="p-8 bg-white border-t border-gray-100">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Broadcast intelligence message..."
                    className="w-full pl-8 pr-16 py-5 bg-gray-50 border-none rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-sm font-medium outline-none"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black text-white rounded-2xl hover:scale-105 disabled:opacity-30 transition-all shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
