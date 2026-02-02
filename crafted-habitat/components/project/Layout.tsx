import React, { useState, useEffect } from 'react';
import { LayoutDashboard, HardHat, Menu, X, Settings, LogOut, Building, Plus, BookOpen, Layers } from 'lucide-react';
import { CompanySettings } from '../../types';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: any) => void;
  companySettings: CompanySettings;
  onUpdateCompanySettings: (settings: CompanySettings) => void;
  onBack?: () => void;
  onCreateProject: () => void;
  subMenu?: NavItem[];
  activeSubTab?: string;
  onSubNavigate?: (tab: any) => void;
  subMenuTitle?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, onNavigate, companySettings, 
  onUpdateCompanySettings, onBack, onCreateProject, 
  subMenu, activeSubTab, onSubNavigate, subMenuTitle 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<CompanySettings>(companySettings);

  useEffect(() => {
    setLocalSettings(companySettings);
  }, [companySettings]);

  const handleSaveSettings = () => {
    onUpdateCompanySettings(localSettings);
    setIsSettingsOpen(false);
  };

  const NavButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => { onNavigate(id); setIsSidebarOpen(false); }}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group mb-1 ${
        activeTab === id 
          ? 'bg-nature-sage text-white shadow-lg translate-x-1' 
          : 'text-nature-stone/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={18} className={`mr-3 ${activeTab === id ? 'text-white' : 'text-nature-stone/40'}`} />
      <span className="truncate font-black uppercase tracking-widest text-[10px]">{label}</span>
    </button>
  );

  const SubNavButton = ({ id, label, icon: Icon }: any) => {
    const isActive = activeSubTab === id;
    return (
      <button
        onClick={() => { onSubNavigate?.(id); setIsSidebarOpen(false); }}
        className={`flex items-center w-full px-4 py-2.5 rounded-xl transition-all duration-200 group mb-0.5 ${
          isActive 
            ? 'bg-nature-sage text-white font-black' 
            : 'text-nature-stone/60 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon size={14} className={`mr-3 ${isActive ? 'text-white' : 'text-nature-stone/30'}`} />
        <span className="truncate uppercase tracking-wider text-[9px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-nature-sand overflow-hidden relative font-sans text-nature-forest">
      {isSidebarOpen && <div className="fixed inset-0 bg-nature-forest/40 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-[110] w-72 bg-nature-forest text-white transform transition-transform duration-500 ease-in-out shadow-2xl flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-white/5 shrink-0 flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-lg overflow-hidden flex items-center justify-center w-12 h-12">
             {companySettings.logoUrl ? <img src={companySettings.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <Building className="w-8 h-8 text-nature-forest" />}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif font-semibold text-white tracking-tight text-sm leading-tight truncate uppercase">{companySettings.name}</h1>
            <p className="text-[8px] font-black text-nature-sage uppercase tracking-widest mt-1">Management Hub</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-8">
          <button onClick={onCreateProject} className="flex items-center justify-center w-full py-4 mb-8 text-[10px] font-black rounded-full bg-nature-sage text-white shadow-xl shadow-nature-forest/30 hover:bg-nature-moss transition-all uppercase tracking-[0.2em]">
            <Plus className="w-5 h-5 mr-2" /> Launch Site
          </button>
          
          <p className="px-4 text-[9px] font-black text-nature-stone/40 uppercase tracking-[0.3em] mb-4">Core Systems</p>
          <NavButton id="dashboard" label="Overview" icon={LayoutDashboard} />
          <NavButton id="projects" label="Active Sites" icon={HardHat} />
          <NavButton id="completed" label="Archives" icon={BookOpen} />
          <NavButton id="registry" label="Task Library" icon={Layers} />

          {subMenu && subMenu.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/5 animate-fade-in">
              <p className="px-4 text-[9px] font-black text-nature-sage uppercase tracking-[0.3em] mb-4 truncate italic">
                {subMenuTitle || 'Site Tools'}
              </p>
              <div className="space-y-0.5">
                {subMenu.map(item => (
                  <SubNavButton key={item.id} {...item} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 shrink-0 bg-black/20">
           <button onClick={onBack} className="flex items-center w-full px-4 py-3 text-xs font-black rounded-xl text-nature-stone/40 hover:text-rose-400 transition-all uppercase tracking-widest">
             <LogOut className="w-4 h-4 mr-3" /> Terminate Session
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden bg-nature-sand relative text-left">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-nature-stone/20 shadow-sm shrink-0 z-40">
          <div className="flex items-center gap-4 text-left">
             <button className="lg:hidden p-2 text-nature-forest/60 hover:bg-nature-sand rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>
             <h2 className="text-xl font-serif font-semibold text-nature-forest tracking-tight uppercase leading-none">
                {activeTab === 'dashboard' ? 'Executive Dashboard' : activeTab === 'projects' ? 'Project Registry' : activeTab === 'completed' ? 'Historical Data' : activeTab === 'registry' ? 'Standard Specifications' : 'System Hub'}
             </h2>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="p-3 text-nature-stone/60 hover:text-nature-sage hover:bg-nature-sand transition-all rounded-full"><Settings className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 relative z-10 no-scrollbar">
          <div className="max-w-7xl mx-auto pb-20">{children}</div>
        </div>
      </main>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-nature-forest/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-10 animate-in zoom-in-95 border border-nature-stone/20 text-left">
             <div className="flex justify-between items-center mb-8 border-b border-nature-sand pb-4">
               <h3 className="text-xl font-serif font-semibold text-nature-forest uppercase tracking-tight">System Configuration</h3>
               <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-nature-sand rounded-full transition-colors"><X/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-nature-stone/60 uppercase tracking-widest ml-1">Business Identity</label>
                    <input className="w-full p-4 bg-nature-sand/50 border border-nature-stone/30 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-nature-sage/10 transition-all text-left" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value.toUpperCase()})} placeholder="Company Name" />
                </div>
                <button onClick={handleSaveSettings} className="w-full py-5 bg-nature-forest text-white rounded-full font-black uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-black transition-all">Synchronize Master Data</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};