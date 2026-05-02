import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Cpu, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithPopup, googleProvider, auth } from '../lib/firebase';
import { motion } from 'motion/react';

export function Login() {
  const { user, loading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gray-50 rounded-full blur-3xl opacity-50" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-3xl opacity-50" />
      </div>

      <Link 
        to="/landing" 
        className="fixed top-8 left-8 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Surface</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-[480px] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 p-12 md:p-16 text-center relative overflow-hidden"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-3xl mb-10 shadow-2xl rotate-6">
          <Cpu className="text-white w-10 h-10" />
        </div>
        
        <h1 className="text-4xl font-display font-black tracking-tighter text-gray-900 mb-4 leading-tight">
          OPERATIVE <br /> AUTHENTICATION.
        </h1>
        <p className="text-gray-400 font-medium mb-12 text-sm leading-relaxed">
          Initialize your tactical connection. Access the global mission control network and synchronize with your team.
        </p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-8 p-6 bg-red-50 text-red-600 rounded-3xl text-[10px] font-black uppercase tracking-widest border border-red-100"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-4 bg-black text-white py-6 px-4 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.25)] transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 invert" />
            <span>Deploy via Google</span>
          </motion.button>
        </div>

        <div className="mt-12 pt-12 border-t border-gray-50 flex flex-col items-center gap-4">
           <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Authentication Protocol v2.4</span>
           </div>
           <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-[280px]">
             By initializing, you acknowledge the terms of tactical engagement and mission privacy protocols.
           </p>
        </div>
      </motion.div>
    </div>
  );
}
