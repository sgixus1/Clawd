import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus } from '../../types';
import { ChevronRight, Search, MapPin, Trash2, CheckCircle2, Briefcase, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCompleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onDeleteProject, onCompleteProject }) => {
  const [term, setTerm] = useState('');

  const activeProjects = useMemo(() => {
    // UI CRASH PROTECTOR (v8.0) Logic
    return projects.filter(p => {
      // Keep existing status filter
      if (p?.status === ProjectStatus.COMPLETED) return false;
      
      // Mandatory Safety Checks (v8.0)
      const name = (p?.name || "").toLowerCase();
      const client = (p?.client || "").toLowerCase();
      const query = term.toLowerCase();
      
      return name.includes(query) || client.includes(query);
    }).sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
  }, [projects, term]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="relative max-w-md">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input 
          type="text" 
          placeholder="Filter active projects..." 
          className="w-full pl-14 pr-6 py-4 border border-slate-200 bg-white rounded-3xl text-sm font-bold shadow-xl shadow-slate-200/20 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" 
          value={term}
          onChange={e => setTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeProjects.length === 0 ? (
          <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
            <Briefcase size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active projects found.</p>
          </div>
        ) : (
          activeProjects.map((project) => {
            const voTotal = (project.variationOrders || []).reduce((sum, vo) => sum + (Number(vo.amount) || 0), 0);
            const totalValue = (project.contractValue || project.budget || 0) + voTotal;
            
            return (
              <div key={project.id} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-6 flex-1 cursor-pointer" onClick={() => onSelectProject(project.id)}>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-inner group-hover:scale-110 transition-transform">
                      {(project.name || "U").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{project.name || "Unnamed Project"}</h3>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">ACTIVE</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1"><MapPin size={12}/> {project.location || 'SITE-X'}</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> UPDATED {project.lastUpdated ? new Date(project.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                 </div>

                 <div className="w-full md:w-56 space-y-2 text-right">
                     <div className="flex justify-between items-end px-1">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Contract</span>
                         <span className="text-sm font-black text-indigo-600 tabular-nums">{formatCurrency(totalValue)}</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                         <div className="h-full bg-indigo-600 transition-all duration-1000" style={{width: `${project.progress}%`}}></div>
                     </div>
                     <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Site Progress: {project.progress}%</p>
                 </div>

                 <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => onCompleteProject(project.id)} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95">
                      <CheckCircle2 size={16}/> Complete
                    </button>
                    <button onClick={() => onDeleteProject(project.id)} className="p-3 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={20}/>
                    </button>
                    <button onClick={() => onSelectProject(project.id)} className="p-3 bg-slate-50 text-slate-300 rounded-xl group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                      <ChevronRight size={24}/>
                    </button>
                 </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
