import React, { useState } from 'react';
import { Project, VariationOrder } from '../../types';
import { Building2, Plus, User, Trash2, Briefcase, TrendingUp, X, Loader2 } from 'lucide-react';
import { deleteProject } from '../../utils';

interface ProjectCRMProps {
  projects: Project[];
  vos: VariationOrder[];
  addProject: (p: Project) => void;
  deleteProject: (id: string) => void;
  addVO: (v: VariationOrder) => void;
}

const ProjectCRM: React.FC<ProjectCRMProps> = ({ projects, vos, addProject, deleteProject: onDeleteProp, addVO }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showVOModal, setShowVOModal] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [newProject, setNewProject] = useState({
    name: '',
    client: '',
    startDate: new Date().toISOString().split('T')[0],
    contractValue: ''
  });

  const [voForm, setVoForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client) return;
    // Fix: Added missing projectType field to match Project interface requirements
    addProject({
      id: 'PROJ_' + Date.now(),
      name: newProject.name,
      client: newProject.client,
      location: '',
      projectType: 'General Construction',
      status: 'ACTIVE',
      progress: 0,
      startDate: newProject.startDate,
      budget: parseFloat(newProject.contractValue) || 0,
      contractValue: parseFloat(newProject.contractValue) || 0,
      spent: 0,
      lastUpdated: Date.now(),
      materials: [], 
      laborLogs: [], 
      subcontractors: [], 
      milestones: [], 
      clientPayments: [], 
      workers: [], 
      dailyUpdates: []
    } as Project);
    setNewProject({ name: '', client: '', startDate: new Date().toISOString().split('T')[0], contractValue: '' });
    setShowForm(false);
  };

  const handleVOModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !voForm.amount) return;

    const projVOs = vos.filter(v => v.projectId === selectedProject.id);
    addVO({
      id: 'VO_' + Date.now(),
      projectId: selectedProject.id,
      voNo: `VO-${projVOs.length + 1}`,
      date: voForm.date,
      amount: parseFloat(voForm.amount),
      description: voForm.description
    });
    
    setShowVOModal(false);
    setVoForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleRemove = async (id: string) => {
    if (isDeletingId) return;
    if (!confirm("CRITICAL: Permanently delete this project from the master SQL database? This will clear all historical logs.")) return;
    
    setIsDeletingId(id);
    try {
        await onDeleteProp(id);
    } finally {
        setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-black text-slate-900 text-xl tracking-tight flex items-center">
            Project Registry
        </h3>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-xl shadow-indigo-200"
        >
          <Plus size={18} />
          <span>New Site</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-300">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Site / Project Name</label>
              <input 
                type="text" 
                value={newProject.name}
                onChange={e => setNewProject({...newProject, name: e.target.value.toUpperCase()})}
                className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-semibold bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. SEMBAWANG HILLS"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Developer / Client</label>
              <input 
                type="text" 
                value={newProject.client}
                onChange={e => setNewProject({...newProject, client: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-semibold bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Client Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Base Contract Value</label>
              <input 
                type="number" 
                value={newProject.contractValue}
                onChange={e => setNewProject({...newProject, contractValue: e.target.value})}
                className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-black bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-4 flex justify-end space-x-3 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-slate-100 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600">Cancel</button>
              <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-200">Create Project</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {projects.map(p => {
          const projectVOs = vos.filter(v => v.projectId === p.id);
          const totalVOs = projectVOs.reduce((acc, curr) => acc + curr.amount, 0);
          const currentContractValue = (p.contractValue || p.budget) + totalVOs;

          return (
            <div key={p.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 ring-8 ring-indigo-50/50 group-hover:scale-110 transition-transform">
                  <Briefcase size={28} />
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full uppercase tracking-widest ring-1 ring-emerald-100">
                    {p.status}
                  </span>
                  <button 
                    disabled={isDeletingId === p.id}
                    onClick={() => handleRemove(p.id)}
                    className="p-2 text-slate-200 hover:text-rose-500 transition-colors disabled:opacity-50"
                  >
                    {isDeletingId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>

              <h4 className="font-black text-slate-900 text-2xl mb-1 tracking-tighter text-left uppercase truncate">{p.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                <User size={12} className="mr-1" /> {p.client}
              </p>

              <div className="mt-10">
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Adjusted Contract Sum</p>
                  <p className="text-2xl font-black text-slate-900">${currentContractValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  {totalVOs !== 0 && (
                    <span className={`text-[10px] font-bold ${totalVOs > 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
                      {totalVOs > 0 ? '+' : ''}${totalVOs.toLocaleString()} via Variation Orders
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 flex space-x-3 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => { setSelectedProject(p); setShowVOModal(true); }}
                  className="w-full flex items-center justify-center space-x-2 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm group/btn"
                >
                  <TrendingUp size={18} className="text-slate-300 group-hover/btn:text-indigo-500" />
                  <span>Log Variation Order</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showVOModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
              <div className="text-left">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Variation Order Entry</span>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{selectedProject.name}</h3>
              </div>
              <button onClick={() => setShowVOModal(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleVOModalSubmit} className="p-8 space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Effective Date</label>
                  <input 
                    type="date" 
                    value={voForm.date}
                    onChange={e => setVoForm({...voForm, date: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-semibold bg-slate-50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">VO Amount (SGD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 font-bold text-slate-400">$</span>
                    <input 
                      type="number" 
                      value={voForm.amount}
                      onChange={e => setVoForm({...voForm, amount: e.target.value})}
                      className="w-full p-4 pl-8 rounded-2xl border border-slate-100 text-sm font-black bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Scope Modification</label>
                <textarea 
                  value={voForm.description}
                  onChange={e => setVoForm({...voForm, description: e.target.value})}
                  className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-medium bg-slate-50 outline-none h-24 resize-none"
                  placeholder="Details of approved additional works..."
                />
              </div>
              <button className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest">
                Finalize Variation Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCRM;