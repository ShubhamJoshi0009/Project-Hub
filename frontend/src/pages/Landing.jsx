import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Zap, 
  Shield, 
  Star,
  Quote
} from 'lucide-react';

const Landing = () => {
  const reviews = [
    {
      name: "Sarah Jenkins",
      role: "Product Manager at TechFlow",
      content: "ProjectHub has completely transformed how our remote team coordinates. The UI is incredibly intuitive and the dark mode is just beautiful.",
      avatar: "SJ",
      stars: 5
    },
    {
      name: "Marcus Chen",
      role: "Engineering Lead",
      content: "The best project management tool I've used in a decade. It stays out of your way and lets you focus on building. Simple, fast, and reliable.",
      avatar: "MC",
      stars: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Freelance Designer",
      content: "I love the clean aesthetics. The sliding profile and task comments make collaboration feel natural rather than a chore.",
      avatar: "ER",
      stars: 4
    }
  ];

  return (
    <div className="flex-1 overflow-x-hidden bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-[120px] animate-pulse" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8 animate-fade-in backdrop-blur-sm">
            <Zap className="h-4 w-4 fill-current text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest">Growth-Focused Project Management</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Empower your team <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">to build the future.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl font-bold mb-12 text-slate-300">
            The professional workspace where precision meets collaboration. Streamline your workflow, hit every target, and scale with ease.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 border-2 border-slate-800 rounded-2xl font-black text-sm transition-all hover:bg-emerald-500/5 text-white flex items-center justify-center gap-2"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Powerful Growth Tools</h2>
            <p className="font-medium text-lg text-slate-400">Everything you need to manage complex deliverables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Precision Tracking", desc: "Monitor every milestone with automated progress reporting and real-time updates." },
              { icon: Users, title: "Fluid Collaboration", desc: "Break down silos with shared workspaces, integrated comments, and file management." },
              { icon: CheckCircle, title: "Task Excellence", desc: "Prioritize what matters most with intuitive Kanban-style management and due dates." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-[32px] border border-slate-800 bg-slate-900 transition-all hover:shadow-2xl hover:-translate-y-2 group">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-400 text-white rounded-2xl w-fit mb-6 shadow-lg shadow-emerald-600/20 group-hover:rotate-6 transition-transform">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase">{f.title}</h3>
                <p className="text-sm leading-relaxed font-medium text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Trusted by modern teams</h2>
              <p className="font-medium text-slate-400">Join thousands of users building the future with ProjectHub.</p>
            </div>
            <div className="flex gap-1 bg-emerald-500/10 p-2 rounded-xl backdrop-blur-sm">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-emerald-500 text-emerald-500" />)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((r, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-800 bg-slate-900/50 flex flex-col relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <Quote className="absolute top-6 right-8 h-12 w-12 text-emerald-500 opacity-10" />
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: r.stars }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed mb-8 flex-1 relative z-10 text-slate-200">"{r.content}"</p>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-600/20">
                    {r.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-black">{r.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{r.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-900 shadow-2xl shadow-emerald-900/40">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] -mr-48 -mt-48 opacity-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-[120px] -ml-48 -mb-48 opacity-20" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter uppercase">Ready to scale?</h2>
            <p className="text-emerald-100 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              Transform the way your team works. Start organizing your projects with precision today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                to="/register" 
                className="w-full sm:w-auto px-12 py-5 bg-white text-emerald-900 rounded-[20px] font-black text-sm hover:scale-105 transition-all shadow-2xl active:scale-95"
              >
                Create Account Now
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto px-12 py-5 border-2 border-white/20 text-white rounded-[20px] font-black text-sm hover:bg-white/10 transition-all active:scale-95"
              >
                Launch Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
