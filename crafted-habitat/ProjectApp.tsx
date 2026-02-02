import React, { useState, useMemo } from 'react';
import { Project, CompanySettings } from './types';
import { 
  LayoutDashboard, Briefcase, Calendar, Package, HardHat, 
  Globe, Receipt, Activity, ImageIcon, FileText, Wrench, 
  Star, Lock, ArrowLeft, Plus, Search, ChevronRight, Zap
} from 'lucide-react';
import { formatCurrency, formatDateSG } from './utils';
import { ProjectDetail } from './components/project/ProjectDetail';

interface ProjectAppProps {
  onBack: () => void;
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onAddNewProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  companySettings: CompanySettings;
}

export const ProjectApp: React.FC<ProjectAppProps> = ({ onBack, projects, onUpdateProject, onAddNewProject, onDeleteProject, companySettings }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('timeline');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId) || null
  , [projects, selectedProjectId]);

  const sidebarItems = [
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'labor', label: 'Labor Logs', icon: HardHat },
    { id: 'subcontractors', label: 'Sub-cons', icon: Globe },
    { id: 'vo', label: 'Variations', icon: Receipt },
    { id: 'updates', label: 'Site Feed', icon: Activity },
    { id: 'photos', label: 'Site Archive', icon: ImageIcon },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'defects', label: 'Defects', icon: Wrench },
    { id: 'completion', label: 'Handover', icon: Star },
    { id: 'access', label: 'Portal Access', icon: Lock },
  ];

  if (selectedProject) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden text-left">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/10">
            <button onClick={() => setSelectedProjectId(null)} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold text-xs uppercase mb-6">
              <ArrowLeft size={16}/> Back to List
            </button>
            <h2 className="text-white font-black uppercase text-sm truncate">{selectedProject.name}</h2>
          </div>
          <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto no-scrollbar">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${
                  activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-10 no-scrollbar">
          <ProjectDetail 
            project={selectedProject} 
            onBack={() => setSelectedProjectId(null)} 
            onUpdate={onUpdateProject}
            companySettings={companySettings}
            activeTab={activeTab}
            onComplete={() => {}}
            onDelete={onDeleteProject}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-12 text-left">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <div className="text-left">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase mb-4 hover:text-indigo-600 transition-all"><ArrowLeft size={16}/> Return to Hub</button>
            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Active Projects</h1>
          </div>
          <button onClick={() => {
              const id = 'PRJ_' + Date.now();
              onAddNewProject({ id, name: 'NEW PROJECT', client: 'CLIENT NAME', location: 'SITE ADDRESS', status: 'PLANNING' as any, progress: 0, contractValue: 0, budget: 0, spent: 0, materials: [], milestones: [], laborLogs: [], subcontractors: [], dailyUpdates: [], projectType: 'Renovation' });
              setSelectedProjectId(id);
          }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-700 transition-all">+ New Site</button>
        </header>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
          <input 
            className="w-full pl-16 pr-8 py-6 bg-white border-none rounded-[2.5rem] shadow-xl text-xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
            placeholder="Search projects by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.filter(p => (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <div key={p.id} onClick={() => setSelectedProjectId(p.id)} className="group bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner"><Briefcase size={32}/></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</p>
                    <p className="text-xs font-black text-indigo-600 uppercase mt-1">{p.status}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-tight line-clamp-1">{p.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.client}</p>
                </div>
                <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center">
                   <div className="flex items-center gap-2 text-slate-300 group-hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest">Open Dashboard <ChevronRight size={14}/></div>
                   <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform font-black text-xs">{p.progress}%</div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};