import React, { useState, useMemo } from 'react';
import { MilestoneTemplate, Project } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';
import { Plus, Search, Trash2, Edit2, Check, X, RefreshCw, Layers, Briefcase, DownloadCloud, Loader2 } from 'lucide-react';
import { saveMilestoneMaster, getProjects } from '../../utils';
import { MASTER_MILESTONE_CATALOG } from '../../constants';

interface MilestoneMasterProps {
  templates: MilestoneTemplate[];
  onUpdate: (data: MilestoneTemplate[]) => void;
}

export const MilestoneMaster: React.FC<MilestoneMasterProps> = ({ templates, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempItem, setTempItem] = useState<Partial<MilestoneTemplate>>({});

  const filteredItems = templates.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parentGroups = useMemo(() => 
    templates.filter(t => t.isGroup).sort((a, b) => a.title.localeCompare(b.title)),
  [templates]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MilestoneTemplate[]> = {};
    templates.forEach(t => {
        if (t.isGroup) {
            if (!groups[t.title]) groups[t.title] = [];
        } else {
            const parent = templates.find(p => p.id === t.parentId);
            const groupTitle = parent?.title || 'GENERAL WORKS';
            if (!groups[groupTitle]) groups[groupTitle] = [];
            groups[groupTitle].push(t);
        }
    });
    return groups;
  }, [templates]);

  const handleSave = () => {
    if (!tempItem.title) { alert("Title is required"); return; }
    
    const generateId = () => Math.random().toString(36).substr(2, 9);
    
    if (editingId) {
      onUpdate(templates.map(m => m.id === editingId ? { ...tempItem, id: editingId } as MilestoneTemplate : m));
      setEditingId(null);
    } else {
      onUpdate([{ ...tempItem, id: generateId() } as MilestoneTemplate, ...templates]);
      setIsAdding(false);
    }
    setTempItem({});
  };

  const handleRestoreDefaults = () => {
      if (confirm(`Populate registry with standard construction milestones? This will not delete your existing unique entries.`)) {
          const currentTitles = new Set(templates.map(it => it.title.trim().toUpperCase()));
          const newItems = MASTER_MILESTONE_CATALOG.filter(it => !currentTitles.has(it.title.trim().toUpperCase()));
          
          if (newItems.length > 0) {
            onUpdate([...templates, ...newItems]);
            alert(`Added ${newItems.length} standard tasks and sections.`);
          } else {
            alert("Your registry already contains these standard milestones.");
          }
      }
  };

  const handleHarvestFromProjects = async () => {
    setIsHarvesting(true);
    try {
        const allProjects = await getProjects();
        if (allProjects.length === 0) {
            alert("No projects found to harvest from.");
            return;
        }

        const projectNames = new Set(allProjects.map(p => p.name.trim().toUpperCase()));
        const currentLibraryTitles = new Set(templates.map(t => t.title.trim().toUpperCase()));
        const harvestedItems: MilestoneTemplate[] = [];

        allProjects.forEach(project => {
            (project.milestones || []).forEach(m => {
                const normalizedTitle = m.title.trim().toUpperCase();
                
                // Rules: 
                // 1. Ignore if matches any project title
                // 2. Ignore if already in library
                // 3. Ignore if already in our current harvest batch
                if (projectNames.has(normalizedTitle)) return;
                if (currentLibraryTitles.has(normalizedTitle)) return;
                if (harvestedItems.some(h => h.title.trim().toUpperCase() === normalizedTitle)) return;

                harvestedItems.push({
                    id: 'HVST_' + Math.random().toString(36).substr(2, 5),
                    title: normalizedTitle,
                    duration: m.duration || 1,
                    isGroup: m.isGroup,
                    parentId: m.parentId || 'unassigned'
                });
            });
        });

        if (harvestedItems.length > 0) {
            const updated = [...templates, ...harvestedItems];
            onUpdate(updated);
            alert(`Successfully harvested ${harvestedItems.length} unique job types from active projects into the CRM.`);
        } else {
            alert("No new unique job types found in current projects.");
        }
    } catch (e) {
        console.error("Harvesting failed:", e);
    } finally {
        setIsHarvesting(false);
    }
  };

  const renderInputs = () => (
    <>
      <div className="col-span-3">
        <Input value={tempItem.title || ''} onChange={e => setTempItem({...tempItem, title: e.target.value.toUpperCase()})} placeholder="Task/Group Name" className="h-full text-xs font-bold" />
      </div>
      <div className="col-span-2">
         <select className="w-full h-8 text-xs border rounded-md" value={tempItem.isGroup ? 'GROUP' : 'TASK'} onChange={e => setTempItem({...tempItem, isGroup: e.target.value === 'GROUP', parentId: e.target.value === 'GROUP' ? undefined : tempItem.parentId})}>
            <option value="TASK">Individual Task</option>
            <option value="GROUP">Work Section Header</option>
         </select>
      </div>
      <div className="col-span-3">
        {!tempItem.isGroup ? (
          <select 
            className="w-full h-8 text-[10px] border border-slate-200 rounded-md font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/10" 
            value={tempItem.parentId || ''} 
            onChange={e => setTempItem({...tempItem, parentId: e.target.value})}
          >
            <option value="">-- Assign Section --</option>
            {parentGroups.map(pg => (
              <option key={pg.id} value={pg.id}>{pg.title}</option>
            ))}
            <option value="unassigned">General Works</option>
          </select>
        ) : (
          <div className="h-8 flex items-center px-3 bg-slate-100 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-widest">Header Item</div>
        )}
      </div>
      <div className="col-span-2">
        <div className="flex items-center gap-2">
             <Input type="number" value={tempItem.duration || ''} onChange={e => setTempItem({...tempItem, duration: parseInt(e.target.value) || 1})} placeholder="Days" className="h-8 text-xs text-right" />
             <span className="text-[9px] text-slate-400 font-bold">DAYS</span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center gap-2">
        <button onClick={handleSave} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Check size={14} /></button>
        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"><X size={14} /></button>
      </div>
    </>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-140px)] flex flex-col animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Milestone Registry</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Job CRM & Work Classification Library</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <Button variant="outline" size="sm" onClick={handleHarvestFromProjects} disabled={isHarvesting} className="rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest" icon={isHarvesting ? <Loader2 size={14} className="animate-spin"/> : <DownloadCloud size={14} />}>
            {isHarvesting ? 'Harvesting...' : 'Harvest from Sites'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRestoreDefaults} className="rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest" icon={<RefreshCw size={14} />}>
            Load Standards
          </Button>
          <Button size="sm" onClick={() => { setIsAdding(true); setTempItem({isGroup: false, duration: 1}); }} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-900/10 font-black uppercase text-[10px] tracking-widest" icon={<Plus size={14} />}>
            New Entry
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] flex-1 flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="w-full pl-12 pr-6 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-bold transition-all shadow-sm text-left"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 px-4">
          <div className="col-span-3 p-4">Job Specification</div>
          <div className="col-span-2 p-4">Classification</div>
          <div className="col-span-3 p-4">Parent Section</div>
          <div className="col-span-2 p-4 text-right">Std. Duration</div>
          <div className="col-span-2 p-4 text-center">Actions</div>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar p-2">
          {isAdding && <div className="grid grid-cols-12 border-b border-indigo-100 bg-indigo-50/30 p-4 gap-4 items-center rounded-2xl mb-4 animate-in slide-in-from-top-2">{renderInputs()}</div>}

          {(Object.entries(groupedItems) as [string, MilestoneTemplate[]][]).map(([groupTitle, items]) => (
            <div key={groupTitle} className="mb-6">
              <div className="bg-slate-900 text-white px-6 py-3 font-black text-[11px] uppercase tracking-[0.2em] sticky top-0 z-10 rounded-xl flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                   <Layers size={14} className="text-indigo-400"/>
                   {groupTitle}
                </div>
                <span className="text-[8px] opacity-40 font-black">{items.length} JOBS</span>
              </div>
              <div className="divide-y divide-slate-50 mt-1">
                {items.map(item => (
                    <div key={item.id} className={`grid grid-cols-12 hover:bg-slate-50 transition-colors text-sm group ${editingId === item.id ? 'bg-indigo-50/30' : ''}`}>
                    {editingId === item.id ? (
                        <div className="col-span-12 grid grid-cols-12 gap-4 p-4 items-center">{renderInputs()}</div>
                    ) : (
                        <>
                        <div className="col-span-3 p-4 flex items-center gap-4 text-left">
                            <div className={`p-2 rounded-lg ${item.isGroup ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                                {item.isGroup ? <Layers size={16}/> : <Check size={16}/>}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 tracking-tight uppercase truncate">{item.title}</p>
                                {item.isGroup && <p className="text-[8px] font-black text-indigo-400 uppercase mt-1 tracking-widest">Section Heading</p>}
                            </div>
                        </div>
                        <div className="col-span-2 p-4 flex items-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.isGroup ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                                {item.isGroup ? 'GROUP' : 'TASK'}
                            </span>
                        </div>
                        <div className="col-span-3 p-4 flex items-center">
                          {!item.isGroup ? (
                            <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                              {templates.find(t => t.id === item.parentId)?.title || 'Unassigned'}
                            </span>
                          ) : (
                            <span className="text-[8px] font-black text-slate-300 uppercase italic">Main Section</span>
                          )}
                        </div>
                        <div className="col-span-2 p-4 text-right flex items-center justify-end">
                            <div className="text-right">
                                <p className="text-lg font-black text-slate-900 tabular-nums leading-none">{item.duration}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">Days</p>
                            </div>
                        </div>
                        <div className="col-span-2 p-4 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(item.id); setTempItem(item); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-indigo-100"><Edit2 size={16} /></button>
                            <button onClick={() => { if(confirm("Permanently delete this Job CRM record?")) onUpdate(templates.filter(t => t.id !== item.id)); }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-rose-100"><Trash2 size={16} /></button>
                        </div>
                        </>
                    )}
                    </div>
                ))}
              </div>
            </div>
          ))}

          {templates.length === 0 && !isAdding && (
            <div className="py-40 text-center space-y-8">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Briefcase size={48} className="text-slate-200" />
                </div>
                <div className="max-w-xs mx-auto">
                    <p className="font-black text-slate-800 uppercase tracking-tight text-xl">Job CRM Repository Empty</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">Populate your work library by harvesting data from current sites or loading industry standards.</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handleHarvestFromProjects} className="bg-white shadow-xl border-slate-200 text-slate-600 font-black uppercase text-xs">Harvest Projects</Button>
                    <Button variant="primary" className="bg-indigo-600 shadow-xl font-black uppercase text-xs" onClick={handleRestoreDefaults}>Load Standard Library</Button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
