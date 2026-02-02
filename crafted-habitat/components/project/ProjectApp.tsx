import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { ProjectList } from './ProjectList';
import { ProjectDetail } from './ProjectDetail';
import { ArchiveHub } from './Archives';
import { MilestoneMaster } from './MilestoneMaster';
import { MOCK_PROJECTS } from '../../constants';
import { Project, CompanySettings, ProjectStatus, MilestoneTemplate } from '../../types';
import { saveSettings, getMilestoneMaster, saveMilestoneMaster } from '../../utils';
// Added missing 'Users' import from lucide-react
import { 
  Calendar, Package, HardHat, TrendingUp, Activity, 
  ImageIcon, FileText, Wrench, Star, Globe, UserCircle, X, Layers, ShieldCheck, UserCheck, Users
} from 'lucide-react';

interface ProjectAppProps {
  onBack: () => void;
  onNavigate: (app: string) => void;
  syncKey?: number;
  projects: Project[];
  onUpdateProject: (p: Project) => void;
  onAddNewProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
  companySettings: CompanySettings;
}

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);

export const ProjectApp: React.FC<ProjectAppProps> = ({ 
    onBack, 
    onNavigate, 
    projects, 
    onUpdateProject,
    onAddNewProject,
    onDeleteProject,
    companySettings,
    syncKey = 0
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'completed' | 'registry'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeProjectTab, setActiveProjectTab] = useState<string>('timeline');
  const [isViewingArchive, setIsViewingArchive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectDraft, setNewProjectDraft] = useState({ name: '', client: '', location: '', projectType: 'A&A Works' });
  
  const [milestoneTemplates, setMilestoneTemplates] = useState<MilestoneTemplate[]>([]);

  useEffect(() => {
    const loadRegistry = async () => {
        setMilestoneTemplates(await getMilestoneMaster());
    };
    loadRegistry();
  }, [syncKey]);

  const handleSelectProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    
    setSelectedProjectId(id);
    setActiveProjectTab('timeline');
    setIsViewingArchive(proj.status === ProjectStatus.COMPLETED);
    setActiveTab('projects');
  };

  const handleCompleteProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (!proj) return;
    if (confirm(`Move "${proj.name}" to completed archives?`)) {
      const updated = { ...proj, status: ProjectStatus.COMPLETED, lastUpdated: Date.now(), progress: 100 };
      onUpdateProject(updated);
      setSelectedProjectId(null);
      setActiveTab('completed');
    }
  };

  const handleDeleteProjectAction = (id: string) => {
    if (confirm(`CRITICAL ACTION: Permanently delete this project? \n\nThis will purge all site logs, photos, and milestones. This action cannot be undone.`)) {
      onDeleteProject(id);
      setSelectedProjectId(null);
    }
  };

  const handleCreateProject = () => {
    const cleanName = newProjectDraft.name.trim().toUpperCase();
    if (!cleanName || !newProjectDraft.client) return;

    const isDuplicate = projects.some(p => p.name.trim().toUpperCase() === cleanName);
    if (isDuplicate) {
        alert(`SYSTEM ALERT: A project with the name "${cleanName}" already exists.`);
        return;
    }

    const newProject: Project = {
      ...MOCK_PROJECTS[0],
      id: generateId(),
      name: cleanName,
      client: newProjectDraft.client.toUpperCase(),
      location: newProjectDraft.location.toUpperCase(),
      projectType: newProjectDraft.projectType || 'General Construction',
      status: ProjectStatus.IN_PROGRESS,
      progress: 0,
      lastUpdated: Date.now(),
      materials: [],
      laborLogs: [],
      subcontractors: [],
      milestones: [],
      dailyUpdates: [],
      variationOrders: [],
      workers: [],
      clientPayments: [],
      portalEnabled: false,
      portalPassword: Math.random().toString(36).slice(-6).toUpperCase()
    };
    
    onAddNewProject(newProject);
    setSelectedProjectId(newProject.id);
    setActiveProjectTab('timeline');
    setIsViewingArchive(false);
    setActiveTab('projects');
    setShowCreateModal(false);
    setNewProjectDraft({ name: '', client: '', location: '', projectType: 'A&A Works' });
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  /**
   * SITE SUB-MENU (v5.5 Alignment)
   * Includes all 12 operational modules
   */
  const projectSubMenu = useMemo(() => {
    if (!selectedProject) return [];
    return [
      { id: 'timeline', label: 'Timeline', icon: Calendar },
      { id: 'materials', label: 'Materials', icon: Package },
      { id: 'labor', label: 'Labor', icon: HardHat },
      { id: 'subcontractors', label: 'Sub-Cons', icon: Users },
      { id: 'vo', label: 'Variations', icon: TrendingUp },
      { id: 'updates', label: 'Updates', icon: Activity },
      { id: 'photos', label: 'Photos', icon: ImageIcon },
      { id: 'clientPhotos', label: 'Client View', icon: UserCircle },
      { id: 'documents', label: 'Docs', icon: FileText },
      { id: 'defects', label: 'Defects', icon: Wrench },
      { id: 'completion', label: 'Status', icon: Star },
      { id: 'access', label: 'Portal', icon: Globe },
    ];
  }, [selectedProject]);

  const renderContent = () => {
    if (selectedProjectId && selectedProject) {
      return (
        <ProjectDetail 
          isReadOnly={isViewingArchive}
          project={selectedProject} 
          onBack={() => setSelectedProjectId(null)} 
          onUpdate={onUpdateProject}
          onDelete={handleDeleteProjectAction}
          onComplete={handleCompleteProject}
          onGenerateQuote={() => onNavigate('quotation')}
          companySettings={companySettings}
          activeTab={activeProjectTab as any}
        />
      );
    }

    if (activeTab === 'dashboard') {
      return <Dashboard projects={projects} onSelectProject={handleSelectProject} />;
    }

    if (activeTab === 'registry') {
        return <MilestoneMaster templates={milestoneTemplates} onUpdate={async (data) => { setMilestoneTemplates(data); await saveMilestoneMaster(data); }} />;
    }

    if (activeTab === 'completed') {
      return (
        <ArchiveHub 
          key={activeTab} 
          projects={projects} 
          transactions={[]}
          onSelectProject={handleSelectProject} 
          onDeleteProject={handleDeleteProjectAction}
          initialSegment="PROJECTS" 
        />
      );
    }

    return (
      <ProjectList 
        projects={projects} 
        onSelectProject={handleSelectProject} 
        onDeleteProject={handleDeleteProjectAction} 
        onCompleteProject={handleCompleteProject}
      />
    );
  };

  return (
    <Layout 
        activeTab={activeTab} 
        onNavigate={(tab) => { setActiveTab(tab); setSelectedProjectId(null); }} 
        onBack={onBack} 
        companySettings={companySettings} 
        onUpdateCompanySettings={async (s) => { saveSettings(s); }} 
        onCreateProject={() => setShowCreateModal(true)}
        subMenu={projectSubMenu}
        activeSubTab={activeProjectTab}
        onSubNavigate={setActiveProjectTab}
        subMenuTitle={selectedProject ? `Site: ${selectedProject.name.substring(0, 15)}...` : undefined}
    >
      {renderContent()}

      {showCreateModal && (
          <div className="fixed inset-0 bg-nature-forest/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-left">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-nature-stone/30 text-left">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-nature-sand">
                      <div><span className="text-[10px] font-black text-nature-sage uppercase tracking-widest block">New Deployment</span><h3 className="text-2xl font-black text-nature-forest uppercase">Initialize Worksite</h3></div>
                      <button onClick={() => setShowCreateModal(false)} className="p-2 bg-nature-sand text-nature-forest rounded-full border border-nature-stone/10 shadow-sm hover:bg-white transition-all"><X size={24}/></button>
                  </div>
                  <div className="p-10 space-y-8 text-left">
                      <div className="space-y-4">
                          <div className="space-y-1"><label className="text-[10px] font-black text-nature-stone uppercase tracking-widest ml-1">Project Title</label><input required className="w-full p-4 bg-nature-sand border border-nature-stone/20 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-nature-sage/5 transition-all text-left" placeholder="e.g. 77 SEMBAWANG HILLS" value={newProjectDraft.name} onChange={e => setNewProjectDraft({...newProjectDraft, name: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1"><label className="text-[10px] font-black text-nature-stone uppercase tracking-widest ml-1">Client / Owner</label><input required className="w-full p-4 bg-nature-sand border border-nature-stone/20 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-nature-sage/5 transition-all text-left" placeholder="Client Name" value={newProjectDraft.client} onChange={e => setNewProjectDraft({...newProjectDraft, client: e.target.value})} /></div>
                              <div className="space-y-1"><label className="text-[10px] font-black text-nature-stone uppercase tracking-widest ml-1">Works Type</label><select className="w-full p-4 bg-nature-sand border border-nature-stone/20 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-nature-sage/5 transition-all text-left" value={newProjectDraft.projectType} onChange={e => setNewProjectDraft({...newProjectDraft, projectType: e.target.value})}><option>A&A Works</option><option>New Erection</option><option>Interior Renovation</option><option>Maintenance</option></select></div>
                          </div>
                          <div className="space-y-1"><label className="text-[10px] font-black text-nature-stone uppercase tracking-widest ml-1">Site Address</label><textarea required className="w-full p-4 bg-nature-sand border border-nature-stone/20 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-nature-sage/5 transition-all h-24 resize-none text-left" placeholder="Site Location" value={newProjectDraft.location} onChange={e => setNewProjectDraft({...newProjectDraft, location: e.target.value})} /></div>
                      </div>
                      <button onClick={handleCreateProject} disabled={!newProjectDraft.name || !newProjectDraft.client} className="w-full py-5 bg-nature-forest text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 text-center">Launch Construction Site</button>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};