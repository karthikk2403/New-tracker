import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  MousePointer2, 
  Layout, 
  ArrowRight,
  Github,
  Twitter,
  Globe,
  Lock,
  Layers,
  Cpu
} from 'lucide-react';

const FloatingCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -10, rotateX: 5, rotateY: 5 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={className}
    style={{ perspective: 1000 }}
  >
    {children}
  </motion.div>
);

const Feature = ({ icon: Icon, title, description, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="p-8 bg-white rounded-[2.5rem] border border-gray-100 neo-shadow hover:shadow-2xl transition-all group"
  >
    <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white mb-6 group-hover:rotate-6 transition-transform">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-black mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed text-sm">
      {description}
    </p>
  </motion.div>
);

export function Landing() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3 pointer-events-auto cursor-pointer"
        >
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white rotate-3 shadow-lg">
             <Cpu className="w-6 h-6" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.4em]">Nexus</span>
        </motion.div>

        <div className="flex items-center space-x-4 pointer-events-auto">
          <Link to="/login" className="text-[10px] font-black uppercase tracking-widest px-6 py-3 hover:text-gray-400 transition-colors active:scale-95 transition-all">
            Access System
          </Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/login" className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl block">
              Join Protocol
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-20 px-4">
        {/* Animated Background Elements */}
        <motion.div 
          style={{ y: y1, rotate }}
          className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-100/50 rounded-[4rem] blur-3xl -z-10"
        />
        <motion.div 
          style={{ y: y2 }}
          className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] bg-orange-100/30 rounded-full blur-3xl -z-10"
        />

        <div className="text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">System V 2.4.0 Online</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-9xl font-display font-black tracking-tighter leading-[0.85] mb-12"
          >
            THE FUTURE OF <br /> 
            <span className="text-gray-400">TEAM VELOCITY.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-gray-400 font-medium max-w-2xl mx-auto mb-16 leading-relaxed"
          >
            Nexus is a tactical mission control for high-performance teams. 
            Synchronize intelligence, deploy tasks, and monitor global progress in real-time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/login" className="group w-full sm:w-auto bg-black text-white px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center">
              Deploy Workspace
              <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={() => document.getElementById('protocol')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-black transition-colors py-4 px-6 rounded-full hover:bg-gray-50 active:scale-95 transition-all"
            >
              Review Protocol
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Descend</span>
          <div className="w-0.5 h-12 bg-black/20" />
        </motion.div>
      </section>

      {/* Feature Grid with 3D Perspective */}
      <section id="protocol" className="py-40 px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Feature 
            title="Intelligence Hub"
            description="Centralize all multi-user mission data into a single, cohesive intelligence dashboard with live activity streams."
            icon={Layout}
            delay={0.1}
          />
          <Feature 
            title="Protocol Security"
            description="Role-based access protocols and encrypted communication channels ensure your intelligence remains classified."
            icon={Shield}
            delay={0.2}
          />
          <Feature 
            title="Neural Deployment"
            description="Automated task allocation and workload balancing optimized for maximum team velocity and objective completion."
            icon={Zap}
            delay={0.3}
          />
        </div>
      </section>

      {/* Deployment Guide (How to Use) */}
      <section className="py-40 px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-6">DEPLOYMENT GUIDE</h2>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Initialize your workspace in 4 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
             {/* Connector Line */}
             <div className="hidden md:block absolute top-[60px] left-20 right-20 h-0.5 bg-gray-50 -z-10" />
             
             {[
               { step: "01", title: "IDENTITY AUTH", desc: "Secure your unique operative ID via Google authentication protocol." },
               { step: "02", title: "BASE SETUP", desc: "Initialize your project workspace and configure team permissions." },
               { step: "03", title: "OBJECTIVE DEPLOY", desc: "Break down missions into tactical tasks and protocol sub-directives." },
               { step: "04", title: "SYNC & EXECUTE", desc: "Monitor live activity feeds and achieve objective completion with the team." }
             ].map((item, idx) => (
               <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group"
               >
                 <div className="w-16 h-16 rounded-2xl bg-white neo-shadow border border-gray-100 flex items-center justify-center text-xl font-black mb-8 group-hover:bg-black group-hover:text-white transition-all cursor-default">
                    {item.step}
                 </div>
                 <h4 className="text-sm font-black uppercase tracking-widest mb-4">{item.title}</h4>
                 <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Interactive Feature Demo (3D Effect) */}
      <section className="py-40 bg-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-6xl font-display font-black tracking-tighter mb-8 leading-tight">
              TACTICAL <br /> OVERVIEW.
            </h2>
            <p className="text-xl text-gray-500 font-medium mb-12 leading-relaxed">
              Experience unparalleled clarity with our bento-grid dashboard. 
              Monitor team health, sprint velocity, and resource allocation from a single tactical standpoint.
            </p>
            <ul className="space-y-6">
              {[
                { icon: BarChart3, text: "Advanced Performance Analytics" },
                { icon: Users, text: "Collaborative Real-time Workspaces" },
                { icon: Lock, text: "End-to-End Enterprise Security" }
              ].map((item, idx) => (
                <motion.li 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center neo-shadow">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex-1 relative perspective-1000">
             <motion.div 
               style={{ rotateY: -15, rotateX: 10 }}
               className="relative z-10 p-4 bg-white rounded-[3rem] shadow-[50px_50px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100"
             >
                <div className="bg-gray-50 rounded-[2rem] p-8 aspect-square flex flex-col justify-between overflow-hidden relative">
                   <div className="space-y-4">
                      <div className="h-6 w-3/4 bg-gray-200 rounded-full" />
                      <div className="h-6 w-1/2 bg-gray-100 rounded-full" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="aspect-square bg-gray-200 rounded-2xl" />
                      <div className="aspect-square bg-black rounded-2xl shadow-xl flex items-center justify-center">
                        <Zap className="text-white w-10 h-10 animate-pulse" />
                      </div>
                   </div>
                   {/* Floating "Operatives" Avatars */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex -space-x-4">
                      {[1,2,3,4].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ y: [0, -20, 0] }}
                          transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
                          className="w-12 h-12 rounded-full border-4 border-white shadow-xl bg-gray-300"
                        />
                      ))}
                   </div>
                </div>
             </motion.div>
             {/* Decorative Background Card */}
             <div className="absolute top-10 left-10 w-full h-full bg-black/5 rounded-[3rem] -z-10 translate-x-10 translate-y-10" />
          </div>
        </div>
      </section>

      {/* Trust & Stats */}
      <section className="py-40 text-center">
         <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
               {[
                 { label: "Daily Deployments", value: "10K+" },
                 { label: "Active Operatives", value: "500K+" },
                 { label: "Data Secured", value: "100PB" },
                 { label: "System Uptime", value: "99.99%" }
               ].map((stat, idx) => (
                 <div key={idx}>
                    <h3 className="text-5xl font-black mb-2 tracking-tighter">{stat.value}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{stat.label}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 bg-black text-white px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-white rounded-3xl mx-auto mb-12 flex items-center justify-center text-black rotate-12"
          >
             <Cpu className="w-10 h-10" />
          </motion.div>
          <h2 className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-12">READY TO DEPLOY?</h2>
          <p className="text-xl text-gray-400 font-medium mb-16 max-w-2xl mx-auto">
            Join the global network of high-performance teams using Nexus to command their projects with precision.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
             <Link to="/login" className="bg-white text-black px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-white/10 shadow-2xl">
                Get Started
             </Link>
             <button 
                onClick={() => alert("Strategic support channel is coming soon. Use contact@nexus-systems.io")}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-white transition-colors px-6 py-4 rounded-full hover:bg-white/5 active:scale-95 transition-all"
             >
                Contact Protocol
             </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 bg-black text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                <Cpu className="w-5 h-5" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Nexus OS</span>
          </div>
          <div className="flex items-center space-x-8">
             {[Github, Twitter, Globe].map((Icon, idx) => (
               <a key={idx} href="#" className="text-gray-400 hover:text-white transition-colors">
                 <Icon className="w-5 h-5" />
               </a>
             ))}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
            © 2026 NEXUS SYSTEMS INC. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
