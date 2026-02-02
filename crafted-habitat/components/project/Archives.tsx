import React, { useState, useMemo } from 'react';
import { Project, ProjectStatus, Transaction } from '../../types';
import { 
  Archive, CheckCircle2, Search, MapPin, DollarSign, Package, 
  User, Briefcase, History, ChevronRight, ChevronDown, 
  Image as ImageIcon, Calendar, Layers, Folder, LayoutGrid, Clock, Printer, Loader2, X, Plus, Filter, FileText, Tag,
  HardHat, ArrowRight, TrendingDown, ExternalLink, CreditCard, Trash2, ShieldAlert
} from 'lucide-react';
import { formatCurrency } from '../../utils';

interface ArchiveHubProps {
  projects: Project[];
  transactions: Transaction[];
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  initialSegment?: 'PROJECTS' | 'RESOURCES';
}

const ProjectGalleryCard: React.FC<{ p: Project; onSelectProject: (id: string) => void; onDeleteProject: (id: string) => void }> = ({ p, onSelectProject, onDeleteProject }) => {
  const images = (p.dailyUpdates || []).flatMap(u => u.images || []).slice(0, 1);
  const completionYear = p.lastUpdated ? new Date(p.lastUpdated).getFullYear() : 'N/A';
  
  return (
    <div 
      className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col relative h-full"
    >
        {/* Compact Image Header */}
        <div className="h-40 bg-slate-100 relative overflow-hidden" onClick={() => onSelectProject(p.id)}>
            {images.length > 0 ? (
                <img src={images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Site" />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                    <ImageIcon size={32} className="opacity-30"/>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
               {p.status === ProjectStatus.COMPLETED ? `FY ${completionYear}` : 'ACTIVE'}
            </div>

            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                    <ExternalLink size={14} />
                </div>
            </div>
        </div>

        {/* Dense Content Area */}
        <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-1" onClick={() => onSelectProject(p.id)}>
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{p.projectType || 'Standard Site'}</p>
                <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">{p.name}</h4>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div onClick={() => onSelectProject(p.id)}>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Contract Sum</p>
                    <p className="text-xs font-black text-slate-800 tabular-nums">{formatCurrency(p.contractValue || p.budget)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                        className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Purge from Archives"
                    >
                        <Trash2 size={16} />
                    </button>
                    <div className="text-right" onClick={() => onSelectProject(p.id)}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Client</p>
                        <p className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">{p.client}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export const ArchiveHub: React.FC<ArchiveHubProps> = ({ projects, transactions, onSelectProject, onDeleteProject, initialSegment = 'PROJECTS' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState<'PROJECTS' | 'RESOURCES'>(initialSegment);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());

  const toggleProject = (id: string) => {
    setExpandedProjectIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  // Grouped project expenses logic
  const projectLedgers = useMemo(() => {
    return projects.map(p => {
      const mats = p.materials || [];
      const lab = p.laborLogs || [];
      const sub = p.subcontractors || [];
      
      // Filter global ledger transactions for this specific project
      const ledgerTx = transactions.filter(t => t.projectId === p.id && t.type === 'EXPENSE');
      const ledgerTotal = ledgerTx.reduce((s, t) => s + t.totalAmount, 0);

      const matTotal = mats.reduce((s, m) => s + (m.quantityUsed * m.costPerUnit), 0);
      const labTotal = lab.reduce((s, l) => s + (l.hours * l.hourlyRate), 0);
      const subTotal = sub.reduce((s, sc) => s + (sc.contractAmount || 0), 0);
      const grandTotal = matTotal + labTotal + subTotal + ledgerTotal;

      return {
        ...p,
        mats,
        lab,
        sub,
        ledgerTx,
        matTotal,
        labTotal,
        subTotal,
        ledgerTotal,
        grandTotal,
        year: p.lastUpdated ? new Date(p.lastUpdated).getFullYear().toString() : 'PRE-2024'
      };
    }).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             p.client.toLowerCase().includes(searchTerm.toLowerCase());
        
        // In 'RESOURCES' (Financial Archives), we show ALL projects so the user can see fiscal status
        const shouldShow = activeSegment === 'RESOURCES' 
            ? true 
            : p.status === ProjectStatus.COMPLETED;
        
        return matchesSearch && shouldShow;
    }).sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === ProjectStatus.COMPLETED ? 1 : -1;
        }
        return b.lastUpdated - a.lastUpdated;
    });
  }, [projects, transactions, searchTerm, activeSegment]);

  // Hierarchical Grouping: Year -> Projects
  const groupedByYear = useMemo(() => {
    const groups: Record<string, typeof projectLedgers> = {};
    projectLedgers.forEach(p => {
        const key = p.status === ProjectStatus.COMPLETED ? p.year : 'ACTIVE PROJECTS';
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });
    return groups;
  }, [projectLedgers]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Archive size={140} /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">Integrated Dossier Repository</span>
              </div>
              <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{activeSegment === 'PROJECTS' ? 'Historical Sites' : 'Financial Archives'}</h2>
                  <p className="text-indigo-300 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80">Full audit trail of project lifecycle and fiscal settlements</p>
              </div>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                <button onClick={() => { setActiveSegment('PROJECTS'); setSearchTerm(''); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'PROJECTS' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Completed Gallery</button>
                <button onClick={() => { setActiveSegment('RESOURCES'); setSearchTerm(''); }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSegment === 'RESOURCES' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>Fiscal Ledger Audit</button>
           </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input 
            type="text" 
            placeholder={activeSegment === 'RESOURCES' ? "Search ledger archives..." : "Search completed sites..."}
            className="w-full pl-14 pr-6 py-4 border border-slate-200 bg-white rounded-[1.5rem] text-sm font-bold shadow-xl shadow-slate-200/10 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-16 animate-fade-in">
             {Object.keys(groupedByYear).sort((a,b) => {
                 if (a === 'ACTIVE PROJECTS') return -1;
                 if (b === 'ACTIVE PROJECTS') return 1;
                 return b.localeCompare(a);
             }).map(year => (
                 <div key={year} className="space-y-8">
                    <div className="flex items-center gap-6 px-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{year === 'ACTIVE PROJECTS' ? year : `Fiscal Year ${year}`}</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                           <Layers size={14} className="text-indigo-600"/>
                           <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{groupedByYear[year].length} Records</span>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 ${activeSegment === 'PROJECTS' ? 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                        {groupedByYear[year].map(p => {
                            if (activeSegment === 'PROJECTS') return <ProjectGalleryCard key={p.id} p={p as any} onSelectProject={onSelectProject} onDeleteProject={onDeleteProject} />;
                            
                            const isExpanded = expandedProjectIds.has(p.id);
                            return (
                                <div key={p.id} className={`bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden flex flex-col ${isExpanded ? 'lg:col-span-3 border-indigo-300 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100'}`}>
                                    {/* Mini Grid Header Card */}
                                    <div className="relative group">
                                        <button 
                                            onClick={() => toggleProject(p.id)}
                                            className={`w-full text-left transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <div className="p-6 sm:p-8 flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isExpanded ? 'bg-indigo-600 border-indigo-500 text-white rotate-90 shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                        {isExpanded ? <ChevronRight size={24}/> : <Briefcase size={28}/>}
                                                    </div>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isExpanded ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-100 border-transparent text-slate-300'}`}>
                                                        {isExpanded ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none truncate">{p.name}</h4>
                                                        {p.status !== ProjectStatus.COMPLETED && (
                                                            <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-tighter">Active Site</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-2">
                                                        <User size={12} className="text-indigo-400"/> {p.client}
                                                    </p>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fiscal Exposure</p>
                                                        <p className={`text-xl font-black tabular-nums leading-none ${isExpanded ? 'text-indigo-700' : 'text-slate-800'}`}>
                                                            {formatCurrency(p.grandTotal)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase">{p.mats.length + p.lab.length + p.sub.length + p.ledgerTx.length} LOGS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                        
                                        {!isExpanded && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                                                className="absolute top-6 right-16 p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Expanded Detail Panel */}
                                    {isExpanded && (
                                        <div className="p-10 pt-4 space-y-12 animate-fade-in bg-white border-t border-slate-100 overflow-hidden">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                {/* Materials Section */}
                                                {p.mats.length > 0 && (
                                                    <section className="space-y-4">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-2">
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <Package size={14} className="text-indigo-600"/> Site Materials Log
                                                            </h4>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal: {formatCurrency(p.matTotal)}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {p.mats.map(m => (
                                                                <div key={m.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-indigo-50/50 transition-colors">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-900 uppercase truncate">{m.name}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{m.supplierName} • {m.quantityUsed}{m.unit}</p>
                                                                    </div>
                                                                    <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(m.quantityUsed * m.costPerUnit)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                {/* Labour Section */}
                                                {p.lab.length > 0 && (
                                                    <section className="space-y-4">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-2">
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <HardHat size={14} className="text-emerald-600"/> Labour Log
                                                            </h4>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal: {formatCurrency(p.labTotal)}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {p.lab.map(l => (
                                                                <div key={l.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-emerald-50/50 transition-colors">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-900 uppercase truncate">{l.workerName}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{l.date} • {l.hours} HRS @ {formatCurrency(l.hourlyRate)}</p>
                                                                    </div>
                                                                    <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(l.hours * l.hourlyRate)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                {/* Ledger Expenses Section */}
                                                {p.ledgerTx.length > 0 && (
                                                    <section className="space-y-4 lg:col-span-1">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-2">
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <CreditCard size={14} className="text-rose-600"/> Ledger Direct Expenses
                                                            </h4>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal: {formatCurrency(p.ledgerTotal)}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {p.ledgerTx.map(t => (
                                                                <div key={t.id} className="p-5 bg-rose-50/30 border border-rose-100 rounded-2xl flex justify-between items-center hover:bg-rose-50 transition-colors">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-900 uppercase truncate">{t.description}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.date} • {t.category.replace(/_/g, ' ')}</p>
                                                                    </div>
                                                                    <p className="text-sm font-black text-rose-700 tabular-nums">{formatCurrency(t.totalAmount)}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                {/* Subcontractor Section */}
                                                {p.sub.length > 0 && (
                                                    <section className="space-y-4 lg:col-span-1">
                                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-2">
                                                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                <ArrowRight size={14} className="text-amber-600"/> Sub-Con Ledger
                                                            </h4>
                                                            <span className="text-[10px] font-black text-slate-400 uppercase">Subtotal: {formatCurrency(p.subTotal)}</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {p.sub.map(s => (
                                                                <div key={s.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-amber-50/50 transition-colors">
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black text-slate-900 uppercase truncate">{s.name}</p>
                                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Scope: {s.service || 'Awarded Works'}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(s.contractAmount)}</p>
                                                                        <p className="text-[9px] text-emerald-600 font-black uppercase mt-1">Settled: {formatCurrency(s.paidAmount)}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                                                
                                                {p.grandTotal === 0 && (
                                                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic text-sm">
                                                        No site logs or linked ledger records detected.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom Summary Bar */}
                                            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 p-8 rounded-[2rem] text-white gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 bg-white/10 rounded-2xl"><TrendingDown size={28} className="text-indigo-400"/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Administrative Action</p>
                                                        <p className="text-sm font-bold text-white mt-1.5 uppercase">
                                                            Archive lifecycle management
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 w-full sm:w-auto">
                                                    <button 
                                                        onClick={() => onSelectProject(p.id)}
                                                        className="flex-1 sm:flex-none px-10 py-3.5 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-2xl active:scale-95 whitespace-nowrap"
                                                    >
                                                        Review Site Feed
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                                                        className="flex-1 sm:flex-none px-6 py-3.5 bg-rose-600/10 text-rose-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-600/20 flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 size={16}/> Purge Record
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                 </div>
             ))}

             {projectLedgers.length === 0 && (
                <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner"><History size={64}/></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tighter text-2xl">Historical Archives Empty</h4>
                    <p className="text-slate-400 text-sm font-medium mt-1 max-w-sm">No project records found matching your search or filters.</p>
                </div>
             )}
      </div>
    </div>
  );
};