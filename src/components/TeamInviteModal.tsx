import React, { useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { X, Search, UserPlus, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from './Notification';

interface TeamInviteModalProps {
  project: Project;
  onClose: () => void;
}

export function TeamInviteModal({ project, onClose }: TeamInviteModalProps) {
  const { user: currentUser } = useAuth();
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || searching || !currentUser) return;

    setSearching(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        notify("User not found", "error");
        setSearching(false);
        return;
      }

      const targetUser = snap.docs[0].data();
      const targetUid = snap.docs[0].id;

      if (project.members[targetUid]) {
        notify("User is already a member", "info");
        setSearching(false);
        return;
      }

      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        [`members.${targetUid}`]: role,
        updatedAt: serverTimestamp()
      });

      // Log activity
      await addDoc(collection(db, 'activity'), {
        projectId: project.id,
        userId: currentUser.uid,
        type: 'invite',
        details: `invited ${targetUser.displayName} as ${role}`,
        createdAt: serverTimestamp()
      });

      notify(`${targetUser.displayName} invited successfully`, "success");
      onClose();
    } catch (err) {
      console.error(err);
      notify("Failed to invite user", "error");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-lg" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg p-12 overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mb-10 shadow-sm border border-gray-100 rotate-3">
          <UserPlus className="text-black w-8 h-8" />
        </div>

        <h3 className="text-4xl font-display font-black mb-2 tracking-tighter">Strategic Invite</h3>
        <p className="text-gray-400 font-medium mb-10">Add a high-performance collaborator to "{project.name}"</p>

        <form onSubmit={handleInvite} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">Target Intelligence Link (Email)</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                autoFocus
                required
                type="email"
                placeholder="operative@nexus.net"
                className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-gray-50 border-none focus:bg-white focus:ring-4 focus:ring-black/5 transition-all text-lg font-bold"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6">Permission Protocol</label>
            <div className="grid grid-cols-2 gap-6">
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setRole('MEMBER')}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3",
                  role === 'MEMBER' ? "border-black bg-black text-white shadow-xl" : "border-gray-50 text-gray-400 bg-gray-50/50 hover:border-gray-200"
                )}
               >
                 <UserPlus className="w-6 h-6" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Core Operative</span>
               </motion.button>
               <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setRole('ADMIN')}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center gap-3",
                  role === 'ADMIN' ? "border-black bg-black text-white shadow-xl" : "border-gray-50 text-gray-400 bg-gray-50/50 hover:border-gray-200"
                )}
               >
                 <Shield className="w-6 h-6" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Protocol Admin</span>
               </motion.button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={searching}
              className="w-full py-6 rounded-[2rem] bg-black text-white font-black uppercase tracking-[0.3em] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 text-xs"
            >
              {searching ? "Verifying..." : "Transmit Invitation"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
