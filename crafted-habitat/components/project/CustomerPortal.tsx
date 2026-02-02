import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Project, DailyUpdate, CompanySettings, VariationOrder, DocCategory, ClientPhoto, DailyUpdateReply } from '../../types';
import { 
  Briefcase, Calendar, MapPin, 
  Activity, CheckCircle2, HardHat, Camera, Send, X, Loader2,
  ImageIcon, Truck, Package, Info, TimerReset, Star, Zap,
  ChevronRight, ChevronDown, Clock, Home, Menu as MenuIcon, FileText, FileType,
  TrendingUp, MessageSquare, Eye, Download, Receipt, User as UserIcon, AlertTriangle, Wrench, CornerDownRight
} from 'lucide-react';
import { formatCurrency, formatDateSG, getMediaViewUrl, uploadFileToCloud } from '../../utils';

interface CustomerPortalProps {
  project: Project | null;
  settings: CompanySettings;
  onLogout: () => void;
  onUpdateProject: (project: Project) => void;
}

type PortalTab = 'dashboard' | 'schedule' | 'enquiries' | 'logistics' | 'vo' | 'gallery' | 'docs';

const DecoupledImage = ({ src, className, onClick }: { src: string, className?: string, onClick?: () => void }) => {
    const viewUrl = getMediaViewUrl(src);
    if (!viewUrl) return <div className={`${className} bg-slate-200 flex items-center justify-center`}><ImageIcon size={16} className="text-slate-400"/></div>;
    const isPdf = src.toLowerCase().endsWith('.pdf') || viewUrl.toLowerCase().includes('.pdf');
    
    if (isPdf) {
        return (
            <div className={`${className} bg-slate-100 flex flex-col items-center justify-center cursor-pointer border border-slate-200 group-hover:bg-slate-200 transition-colors`} onClick={onClick}>
                <FileType size={32} className="text-indigo-600 mb-2"/>
                <span className="text-[10px] font-black uppercase text-slate-400 text-center px-2">PDF Document</span>
            </div>
        );
    }

    return (
        <img 
            src={viewUrl} 
            className={className} 
            onClick={onClick} 
            loading="lazy" 
            crossOrigin="anonymous"
            onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iIzFCMzAyMiIvPgo8L3N2Zz4K'; 
            }} 
        />
    );
};

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ project, settings, onLogout, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  
  // Reply State
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyStagedPhotos, setReplyStagedPhotos] = useState<Record<string, string[]>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Enquiries Form State
  const [enquiryDraft, setEnquiryDraft] = useState({ description: '', images: [] as string[] });
  const enquiryPhotoInputRef = useRef<HTMLInputElement>(null);
  const replyPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 1024) setIsSidebarOpen(true); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scheduleGroups = useMemo(() => (project?.milestones || []).filter(m => m.isGroup), [project?.milestones]);
  
  // Only show updates submitted by the client in the Enquiries tab
  const clientEnquiries = useMemo(() => 
    [...(project?.dailyUpdates || [])]
      .filter(u => u.user === 'CLIENT PORTAL')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  , [project?.dailyUpdates]);

  const sortedVOs = useMemo(() => [...(project?.variationOrders || [])].sort((a,b) => (b.date || '').localeCompare(a.date || '')), [project?.variationOrders]);

  const groupedClientPhotos = useMemo(() => {
    const photos = project?.clientPhotos || [];
    const grouped: Record<string, ClientPhoto[]> = {};
    photos.forEach(p => { 
        const key = p.date || 'UNSPECIFIED';
        if (!grouped[key]) grouped[key] = []; 
        grouped[key].push(p); 
    });
    return grouped;
  }, [project?.clientPhotos]);

  if (!project) {
    return ( <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-white text-left"><Loader2 className="animate-spin mb-6 text-emerald-400" size={48}/><p className="font-black uppercase tracking-[0.4em] text-[10px]">Authorizing Secure Stream...</p></div> );
  }

  const handlePreviewFile = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.pdf') || lowerUrl.includes('/api/media/view/') || lowerUrl.includes('doc_')) {
        setActiveDocUrl(url);
    } else {
        setSelectedImage(url);
    }
  };

  const handleEnquiryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsSubmitting(true);
    try {
        for (const file of Array.from(files) as File[]) {
            // Fix: remove second argument as uploadFileToCloud only accepts 1
            const url = await uploadFileToCloud(file);
            setEnquiryDraft(prev => ({ ...prev, images: [...prev.images, url] }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReplyPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeReplyId) return;
    setIsSubmitting(true);
    try {
        for (const file of Array.from(files) as File[]) {
            // Fix: remove second argument as uploadFileToCloud only accepts 1
            const url = await uploadFileToCloud(file);
            setReplyStagedPhotos(prev => ({
                ...prev,
                [activeReplyId]: [...(prev[activeReplyId] || []), url]
            }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const submitEnquiry = async () => {
    if (!enquiryDraft.description) return;
    setIsSubmitting(true);
    try {
        const newUpdate: DailyUpdate = {
            id: 'REQ_' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            description: `[CLIENT REQUEST] ${enquiryDraft.description.toUpperCase()}`,
            user: 'CLIENT PORTAL',
            images: enquiryDraft.images,
            isUrgent: true,
            replies: []
        };
        onUpdateProject({ ...project, dailyUpdates: [newUpdate, ...(project.dailyUpdates || [])] });
        setEnquiryDraft({ description: '', images: [] });
        alert("Enquiry transmitted to the project office.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddReply = (updateId: string) => {
    const text = replyInputs[updateId] || '';
    const images = replyStagedPhotos[updateId] || [];
    if (!text && images.length === 0) return;
    
    const updatedProject = { ...project };
    updatedProject.dailyUpdates = (updatedProject.dailyUpdates || []).map(u => {
        if (u.id === updateId) {
            const newReply: DailyUpdateReply = {
                id: 'REP_CL_' + Date.now(),
                user: 'CLIENT PORTAL',
                text: text.toUpperCase(),
                date: new Date().toISOString(),
                images: images.length > 0 ? images : undefined
            };
            return { ...u, replies: [...(u.replies || []), newReply] };
        }
        return u;
    });
    
    onUpdateProject(updatedProject);
    setReplyInputs(prev => ({ ...prev, [updateId]: '' }));
    setReplyStagedPhotos(prev => ({ ...prev, [updateId]: [] }));
  };

  const NavItem = ({ id, label, icon: Icon, color = 'emerald' }: { id: PortalTab, label: string, icon: any, color?: string }) => {
    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-600 text-emerald-500',
        blue: 'bg-blue-600 text-blue-500',
        indigo: 'bg-indigo-600 text-indigo-500',
        amber: 'bg-amber-600 text-amber-500',
        purple: 'bg-purple-600 text-purple-500',
        rose: 'bg-rose-600 text-rose-500'
    };
    return (
        <button 
            onClick={() => { setActiveTab(id); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === id ? `${colorClasses[color].split(' ')[0]} text-white shadow-lg translate-x-2` : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}`}
        >
            <Icon size={18} className={activeTab === id ? 'text-white' : colorClasses[color].split(' ')[1]} />
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 animate-fade-in relative text-left">
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex justify-between items-center mb-4 text-white">
             <button onClick={() => {}} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all"><Download size={18}/> Download</button>
             <button onClick={() => setSelectedImage(null)} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden cursor-zoom-out" onClick={() => setSelectedImage(null)}>
            <DecoupledImage src={selectedImage} className="max-w-full max-h-[80vh] object-contain shadow-2xl animate-in zoom-in-95" />
          </div>
        </div>
      )}

      {activeDocUrl && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-6 overflow-hidden">
          <div className="w-full max-w-5xl flex justify-between items-center mb-4 text-white shrink-0">
            <h3 className="text-xl font-black uppercase">Document Viewer</h3>
            <button onClick={() => setActiveDocUrl(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={32}/></button>
          </div>
          <div className="flex-1 w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl relative">
            <iframe src={getMediaViewUrl(activeDocUrl)} className="w-full h-full border-none" title="Viewer" />
          </div>
        </div>
      )}

      <aside className={`bg-slate-900 text-white flex flex-col transition-all duration-500 ease-in-out border-r border-slate-800 shrink-0 z-50 fixed lg:relative h-full ${isSidebarOpen ? 'translate-x-0 w-80 opacity-100' : '-translate-x-full w-0 lg:w-0 opacity-0 pointer-events-none'}`}>
        <div className="p-8 border-b border-white/5 flex flex-col gap-6 text-left">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg"><HardHat size={20}/></div><div className="text-left"><h1 className="text-sm font-black uppercase tracking-tight leading-none">Client Portal</h1><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Project Oversight</p></div></div>
            <div className="space-y-1 text-left"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Project Title</p><p className="text-xs font-black text-white uppercase tracking-tight truncate">{project.name}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
            <NavItem id="dashboard" label="Overview" icon={Home} color="emerald" />
            <NavItem id="schedule" label="Schedule" icon={Calendar} color="blue" />
            <NavItem id="enquiries" label="Service Desk" icon={MessageSquare} color="indigo" />
            <NavItem id="logistics" label="Materials" icon={Truck} color="amber" />
            <NavItem id="vo" label="Variations" icon={TrendingUp} color="rose" />
            <NavItem id="docs" label="Documents" icon={FileText} color="blue" />
            <NavItem id="gallery" label="Photo vault" icon={Star} color="purple" />
        </div>
        <div className="p-6 mt-auto border-t border-white/5 bg-black/20"><button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-rose-900/20 hover:text-rose-400 text-slate-500 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">Sign Out</button></div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full relative text-left">
        <header className="bg-white h-20 border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 shadow-sm z-30">
           <div className="flex items-center gap-4 text-left">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-xl transition-all ${isSidebarOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}><MenuIcon size={20}/></button>
               <div className="text-left">
                 <h2 className="text-xl font-black tracking-tight uppercase leading-none">
                    {activeTab === 'enquiries' ? 'Service Desk & Reporting' : activeTab === 'gallery' ? 'Media Repository' : activeTab === 'vo' ? 'Variation Orders' : (activeTab || '').replace(/_/g, ' ')}
                 </h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Project Dashboard</p>
               </div>
           </div>
           <div className="flex items-center gap-3">
               <div className="hidden sm:flex flex-col items-end">
                   <p className="text-[9px] font-black text-slate-400 uppercase">Site Progress</p>
                   <p className="text-sm font-black text-slate-900">{project.progress}%</p>
               </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 no-scrollbar bg-slate-50/50">
            <div className="max-w-5xl mx-auto space-y-10">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fade-in text-left">
                        <div className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group text-left">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
                            <div className="relative z-10 text-left">
                                <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-3 py-1 rounded-full uppercase border border-emerald-100 mb-6 inline-block">LIVE PROJECT ANALYTICS</span>
                                <h3 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-none uppercase mb-2">Construction Progress</h3>
                                <p className="text-slate-500 font-medium text-base max-w-md">Your project at {project.location || 'Site Location'} is currently {project.progress}% complete.</p>
                                <div className="mt-12 flex items-center gap-8">
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                                        <div className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{width: `${project.progress}%`}}></div>
                                    </div>
                                    <span className="text-3xl lg:text-4xl font-black text-slate-900 tabular-nums">{project.progress}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm text-left">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Recent Requests</h4>
                                <div className="space-y-6">
                                    {clientEnquiries.slice(0, 3).map(u => (
                                        <div key={u.id} className="flex gap-4 items-start border-l-2 border-indigo-50 pl-4 py-1">
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-900 uppercase leading-snug truncate max-w-[200px]">{u.description.replace('[CLIENT REQUEST] ', '')}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{formatDateSG(u.date)}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {clientEnquiries.length === 0 && <p className="text-xs text-slate-400 italic">No enquiries sent yet.</p>}
                                </div>
                                <button onClick={() => setActiveTab('enquiries')} className="w-full mt-8 py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors">Service Desk</button>
                            </div>
                            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden text-left">
                                <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={100}/></div>
                                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4">Support & Feedback</h4>
                                <p className="text-xl font-black leading-tight mb-2 uppercase">Need site assistance?</p>
                                <p className="text-sm opacity-80 mb-8 max-w-xs leading-relaxed font-medium">Use the Service Desk to report defects or request modifications directly.</p>
                                <button onClick={() => setActiveTab('enquiries')} className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-colors">Start Enquiry</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-10 animate-fade-in text-left">
                        <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Calendar size={120}/></div>
                            <div className="relative z-10 text-left"><h3 className="text-3xl font-black uppercase tracking-tight">Project Timeline</h3><p className="text-blue-100 mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Official construction schedule and phase tracking.</p></div>
                        </div>
                        <div className="space-y-4">
                            {scheduleGroups.map(group => (
                                <div key={group.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                                    <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                                        <h4 className="font-black uppercase tracking-widest text-xs">{group.title}</h4>
                                        <span className="text-[10px] font-black text-indigo-400">{group.progress}% Complete</span>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {(project.milestones || []).filter(m => m.parentId === group.id).map(m => (
                                            <div key={m.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${m.progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {m.progress === 100 ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                                                    </div>
                                                    <div className="text-left text-left">
                                                        <p className="text-sm font-black text-slate-800 uppercase">{m.title}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Est. Duration: {m.duration} Days</p>
                                                    </div>
                                                </div>
                                                <div className="w-48 hidden sm:flex items-center gap-4">
                                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full transition-all duration-700 ${m.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${m.progress}%`}}></div>
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-400 tabular-nums">{m.progress}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'enquiries' && (
                    <div className="space-y-10 animate-fade-in text-left">
                        <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><MessageSquare size={120}/></div>
                            <div className="relative z-10 text-left"><h3 className="text-3xl font-black uppercase tracking-tight">Service Desk</h3><p className="text-indigo-100 mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Direct communication for defects, enquiries, and rectifications.</p></div>
                        </div>

                        <div className="bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 text-left">
                            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><Wrench size={24}/></div>
                                <div className="text-left">
                                    <h4 className="text-xl font-black uppercase tracking-tight">Submit Site Request</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Office response typically within 24-48 hours.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Describe the enquiry / defect</label>
                                    <textarea 
                                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-sm font-medium h-40 resize-none outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                                        placeholder="Please provide details (e.g. Master Bedroom Tiling Defect)..."
                                        value={enquiryDraft.description}
                                        onChange={e => setEnquiryDraft({...enquiryDraft, description: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Camera size={14}/> Photo Evidence (Optional)</label>
                                    <div className="flex flex-wrap gap-4">
                                        <button onClick={() => enquiryPhotoInputRef.current?.click()} className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <Camera size={28}/>}
                                            <span className="text-[8px] font-black uppercase mt-1">ADD PHOTO</span>
                                        </button>
                                        <input type="file" multiple accept="image/*" capture="environment" className="hidden" ref={enquiryPhotoInputRef} onChange={handleEnquiryPhotoUpload} />
                                        {enquiryDraft.images.map((img, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-3xl overflow-hidden border border-slate-100 shadow-sm group">
                                                <DecoupledImage src={img} className="w-full h-full object-cover" />
                                                <button onClick={() => setEnquiryDraft(prev => ({ ...prev, images: prev.images.filter((_,idx)=>idx!==i) }))} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={submitEnquiry} disabled={isSubmitting || !enquiryDraft.description} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} 
                                    Transmit to Project Office
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Request History</h4>
                            {clientEnquiries.map(u => (
                                <div key={u.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 text-left">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><UserIcon size={20}/></div>
                                            <div className="text-left text-left">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted by You</p>
                                                <p className="text-sm font-black text-slate-900 uppercase mt-1">{formatDateSG(u.date)}</p>
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 text-amber-600 text-[8px] font-black px-3 py-1 rounded-full uppercase border border-amber-100">In Review</div>
                                    </div>
                                    <p className="text-lg font-bold text-slate-800 uppercase leading-relaxed mb-8">{u.description.replace('[CLIENT REQUEST] ', '')}</p>
                                    {u.images && u.images.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                            {u.images.map((img, i) => (
                                                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-zoom-in" onClick={() => handlePreviewFile(img)}>
                                                    <DecoupledImage src={img} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* THREADED CONVERSATION */}
                                    <div className="space-y-4 pt-6 border-t border-slate-50">
                                        <div className="space-y-3">
                                            {u.replies?.map(r => (
                                                <div key={r.id} className="flex gap-3 pl-4">
                                                    <div className="mt-1"><CornerDownRight size={14} className="text-slate-300"/></div>
                                                    <div className={`flex-1 p-4 rounded-2xl text-left ${r.user === 'CLIENT PORTAL' ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'bg-slate-50 border border-slate-100 shadow-sm'}`}>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-black uppercase text-indigo-600">{r.user}</span>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">{formatDateSG(r.date)}</span>
                                                        </div>
                                                        <p className="text-[11px] font-bold text-slate-700 uppercase leading-tight">{r.text}</p>
                                                        {r.images && r.images.length > 0 && (
                                                            <div className="grid grid-cols-3 gap-2 mt-3">
                                                                {r.images.map((img, i) => (
                                                                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-zoom-in shadow-sm" onClick={() => handlePreviewFile(img)}>
                                                                        <DecoupledImage src={img} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Staged Reply Photos Preview */}
                                        {replyStagedPhotos[u.id]?.length > 0 && (
                                            <div className="flex gap-2 pl-8 pb-2 overflow-x-auto no-scrollbar">
                                                {replyStagedPhotos[u.id].map((img, i) => (
                                                    <div key={i} className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-indigo-200 shadow-sm">
                                                        <img src={getMediaViewUrl(img)} className="w-full h-full object-cover" />
                                                        <button onClick={() => setReplyStagedPhotos(prev => ({...prev, [u.id]: prev[u.id].filter((_,idx)=>idx!==i)}))} className="absolute top-0.5 right-0.5 p-0.5 bg-black/50 text-white rounded-full"><X size={8}/></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex gap-2 pl-8">
                                            <button 
                                                onClick={() => { setActiveReplyId(u.id); replyPhotoInputRef.current?.click(); }}
                                                className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                                            >
                                                <Camera size={14}/>
                                            </button>
                                            <input type="file" multiple accept="image/*" capture="environment" className="hidden" ref={replyPhotoInputRef} onChange={handleReplyPhotoUpload} />
                                            
                                            <input 
                                                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                                placeholder="Reply to this thread..."
                                                value={replyInputs[u.id] || ''}
                                                onChange={e => setReplyInputs(prev => ({ ...prev, [u.id]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && handleAddReply(u.id)}
                                            />
                                            <button 
                                                onClick={() => handleAddReply(u.id)}
                                                disabled={(!replyInputs[u.id] && (!replyStagedPhotos[u.id] || replyStagedPhotos[u.id].length === 0))}
                                                className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-30 hover:bg-indigo-700 transition-all"
                                            >
                                                <Send size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {clientEnquiries.length === 0 && <div className="py-20 text-center opacity-30 italic text-slate-400 font-black uppercase text-[10px] tracking-widest">No previous requests found</div>}
                        </div>
                    </div>
                )}

                {activeTab === 'logistics' && (
                    <div className="space-y-10 animate-fade-in text-left">
                        <div className="bg-amber-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Truck size={120}/></div>
                            <div className="relative z-10 text-left"><h3 className="text-3xl font-black uppercase tracking-tight">Material Deliveries</h3><p className="text-amber-100 mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Verified site arrivals and specification tracking.</p></div>
                        </div>
                        <div className="space-y-4">
                            {(project.materials || []).sort((a,b) => (b.date || '').localeCompare(a.date || '')).map(m => (
                                <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-xl transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner"><Package size={24}/></div>
                                        <div className="text-left text-left text-left">
                                            <h5 className="font-black text-slate-900 uppercase text-lg leading-none">{m.name}</h5>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{formatDateSG(m.date)} • {m.quantityUsed} {m.unit}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {m.images?.slice(0, 3).map((img, i) => (
                                            <div key={i} className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in hover:scale-110 transition-transform" onClick={() => handlePreviewFile(img)}>
                                                <DecoupledImage src={img} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in text-left">
                        {(['DRAWING', 'PERMIT', 'METHOD_STATEMENT', 'APPROVED_MATERIAL'] as DocCategory[]).map(cat => {
                            const docs = (project.documents || []).filter(d => d.type === cat);
                            return (
                                <div key={cat} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-6 flex flex-col text-left">
                                    <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileType size={24}/></div>
                                        <h4 className="font-black text-slate-800 uppercase text-sm tracking-widest">{cat.replace('_', ' ')}S</h4>
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        {docs.map(doc => (
                                            <button key={doc.id} onClick={() => handlePreviewFile(doc.fileUrl)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <FileText size={18} className="text-slate-300 group-hover:text-blue-600"/>
                                                    <span className="text-xs font-black uppercase text-slate-700 truncate">{doc.name}</span>
                                                </div>
                                                <Eye size={16} className="text-slate-200 group-hover:text-blue-600"/>
                                            </button>
                                        ))}
                                        {docs.length === 0 && <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center py-12">No files archived in this category.</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'vo' && (
                    <div className="space-y-10 animate-fade-in text-left">
                        <div className="bg-rose-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><TrendingUp size={120}/></div>
                            <div className="relative z-10 text-left"><h3 className="text-3xl font-black uppercase tracking-tight">Approved Variations</h3><p className="text-rose-100 mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Authorized modifications to the original contract scope.</p></div>
                        </div>
                        <div className="space-y-6">
                            {sortedVOs.map(vo => (
                                <div key={vo.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 text-left">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex-1 text-left text-left text-left text-left">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-slate-900 uppercase text-lg">{vo.voNo}</h4>
                                                {vo.isClaimed && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Formal Claim Issued</span>}
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 mt-1 uppercase">{vo.description}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{formatDateSG(vo.date)}</p>
                                        </div>
                                        <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 text-right"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Approved Value</p><p className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(vo.amount)}</p></div>
                                    </div>
                                    
                                    {vo.rows && vo.rows.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scope Breakdown</p>
                                            <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
                                                <table className="w-full text-left text-sm border-collapse">
                                                    <thead>
                                                        <tr className="bg-slate-100/50 text-[9px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                                            <th className="px-6 py-3">Description</th>
                                                            <th className="px-4 py-3 text-center">Qty</th>
                                                            <th className="px-4 py-3 text-right">Rate</th>
                                                            <th className="px-6 py-3 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 font-bold uppercase text-slate-700">
                                                        {vo.rows.map(row => (
                                                            <tr key={row.id} className="text-[10px] leading-tight">
                                                                <td className="px-6 py-4 max-w-xs">{row.description}</td>
                                                                <td className="px-4 py-4 text-center">{row.quantity} {row.unit}</td>
                                                                <td className="px-4 py-4 text-right text-slate-400">${row.rate.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                                <td className="px-6 py-4 text-right font-black text-slate-900">${row.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {(vo.attachments && vo.attachments.length > 0) && (
                                        <div className="pt-6 border-t border-slate-50 space-y-4">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linked Documentation</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {vo.attachments.map((file, i) => (
                                                    <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                                                        <DecoupledImage src={file} className="w-full h-full object-cover" onClick={() => handlePreviewFile(file)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {sortedVOs.length === 0 && <div className="py-20 text-center opacity-30 italic text-slate-400 font-black uppercase text-[10px] tracking-widest">No variation orders recorded</div>}
                        </div>
                    </div>
                )}
                
                {activeTab === 'gallery' && (
                    <div className="space-y-10 animate-fade-in text-left">
                        <div className="bg-[#a855f7] p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Star size={120}/></div>
                            <div className="relative z-10 text-left"><h3 className="text-3xl font-black uppercase tracking-tight">MEDIA REPOSITORY</h3><p className="text-purple-100 mt-2 font-medium opacity-80 uppercase tracking-widest text-xs">Full high-resolution visual archive of site progression.</p></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                            {Object.keys(groupedClientPhotos).sort((a,b) => b.localeCompare(a)).map(date => groupedClientPhotos[date].map(photo => (
                                <div key={photo.id} className="flex flex-col items-center gap-4 group cursor-pointer" onClick={() => handlePreviewFile(photo.url)}>
                                    <div className="aspect-square w-full rounded-full overflow-hidden border-8 border-white shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-500 relative">
                                        <DecoupledImage src={photo.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors"></div>
                                    </div>
                                    <div className="text-center text-center text-center text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatDateSG(photo.date)}</p><p className="text-[10px] font-bold text-slate-800 uppercase truncate max-w-[120px]">{photo.description}</p></div>
                                </div>
                            )))}
                        </div>
                        {project.clientPhotos?.length === 0 && <div className="py-40 text-center opacity-30 italic text-slate-400 font-black uppercase text-[10px] tracking-widest">The media repository is currently empty.</div>}
                    </div>
                )}
            </div>
        </div>
      </main>
    </div>
  );
};