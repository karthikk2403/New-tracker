import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Project, Task } from '../types';
import { Plus, FolderKanban, MoreVertical, Calendar, Users, CheckCircle2, ArrowUpRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useNotification } from '../components/Notification';

export function Projects() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where(`members.${user.uid}`, 'in', ['ADMIN', 'MEMBER', 'OWNER'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(projectsData);
      setLoading(false);
    });

    // Also fetch tasks to calculate progress
    const tasksQuery = query(collection(db, 'tasks'), where('viewerIds', 'array-contains', user.uid));
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[]);
    });

    return () => {
      unsubscribe();
      unsubTasks();
    };
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProject.name) return;

    try {
      await addDoc(collection(db, 'projects'), {
        name: newProject.name,
        description: newProject.description,
        ownerId: user.uid,
        members: {
          [user.uid]: 'ADMIN'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowCreateModal(false);
      setNewProject({ name: '', description: '' });
      notify("Project created successfully", "success");
    } catch (error) {
      console.error("Error creating project:", error);
      notify("Failed to create project", "error");
    }
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / projectTasks.length) * 100);
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

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2">Projects</h2>
          <p className="text-gray-400 font-medium max-w-lg">
            Manage your high-impact initiatives. Track progress, coordinate teams, and ship results.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.length > 0 ? (
          projects.map((project, index) => {
            const progress = getProjectProgress(project.id);
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  rotateX: 1,
                  rotateY: -1,
                  boxShadow: '0 30px 60px -12px rgba(50, 50, 93, 0.25), 0 18px 36px -18px rgba(0, 0, 0, 0.3)'
                }}
                className="group relative"
                style={{ perspective: 1000 }}
              >
                <Link
                  to={`/projects/${project.id}`}
                  className="block bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm transition-all h-full flex flex-col group-hover:border-gray-200"
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-6">
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full group-hover:bg-black group-hover:text-white transition-all">
                       <span className="text-[10px] font-black uppercase tracking-widest mr-2">{progress}%</span>
                       <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-current"
                          />
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="font-black text-2xl tracking-tight leading-tight group-hover:translate-x-1 transition-transform">{project.name}</h3>
                       <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-8 line-clamp-3 leading-relaxed">
                      {project.description || 'Seamless collaboration and task orchestration for high-performance teams.'}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex -space-x-3">
                          {Object.keys(project.members).slice(0, 4).map((uid) => (
                            <img
                              key={uid}
                              src={`https://ui-avatars.com/api/?name=${uid}&background=random`}
                              className="w-10 h-10 rounded-full border-4 border-white shadow-sm ring-1 ring-gray-100"
                              alt="Member"
                            />
                          ))}
                          {Object.keys(project.members).length > 4 && (
                            <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-gray-100">
                              +{Object.keys(project.members).length - 4}
                            </div>
                          )}
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                          <div className="flex items-center space-x-2">
                             <div className={cn("w-2 h-2 rounded-full", progress === 100 ? "bg-green-500" : "bg-blue-500")} />
                             <span className="text-xs font-bold">{progress === 100 ? 'Completed' : 'Active'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        <span>{project.createdAt ? format(project.createdAt.toDate(), 'MMM yyyy') : '...'}</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                        <span>{projectTasks.length} Tasks</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-20 text-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem]"
          >
            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-8">
              <FolderKanban className="w-10 h-10 text-gray-900" />
            </div>
            <h3 className="text-2xl font-black mb-2 tracking-tight">No projects yet</h3>
            <p className="text-gray-400 mb-10 max-w-xs mx-auto font-medium">Create your first initiative and invite your team to start collaborating.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:shadow-xl transition-all"
            >
              Start Project
            </button>
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-12 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                 <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                 </button>
              </div>

              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-8">
                 <Plus className="w-8 h-8 text-black" />
              </div>
              
              <h3 className="text-3xl font-black mb-2 tracking-tight">New Project</h3>
              <p className="text-gray-400 font-medium mb-10">Define the scope and start collaborating.</p>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Project Name</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. Phoenix Launch"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-lg font-bold"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description (Optional)</label>
                  <textarea
                    rows={4}
                    placeholder="Briefly describe the vision..."
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all font-medium"
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="py-4 rounded-2xl border-2 border-gray-100 font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-4 rounded-2xl bg-black text-white font-black uppercase tracking-widest hover:shadow-xl hover:-translate-y-1 transition-all text-xs active:scale-95"
                  >
                    Create Project
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
