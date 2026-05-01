import React from 'react';
import { Navigate } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-6">
          <CheckSquare className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Welcome to TeamTask
        </h1>
        <p className="text-gray-500 mb-10">
          Sign in to manage your projects, collaborate with your team, and track your progress.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 py-3 px-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
      
      <div className="mt-12 flex space-x-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
        <FolderKanbanIcon />
        <StatusIcon />
        <TeamIcon />
      </div>
    </div>
  );
}

function FolderKanbanIcon() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
        <div className="w-5 h-5 bg-blue-500 rounded-sm" />
      </div>
      <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
    </div>
  );
}

function StatusIcon() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-2">
        <div className="w-5 h-5 bg-green-500 rounded-full" />
      </div>
      <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
    </div>
  );
}

function TeamIcon() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full bg-orange-500 border border-orange-100" />
          <div className="w-4 h-4 rounded-full bg-orange-400 border border-orange-100" />
        </div>
      </div>
      <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
    </div>
  );
}
