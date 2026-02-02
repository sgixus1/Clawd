
/* 
  CRAFTED HABITAT - PROJECT COMMAND CENTER (v6.5)
  STATUS: PROFESSIONAL VO CLAIMS ENABLED
  FEATURES: VO Claim Generation, Signature/Stamp Integration, Itemized Ledger, Media Archiving
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Project, Milestone, Invoice, Worker, AttendanceRecord, VariationOrder, 
  Material, DailyUpdate, Defect, ProjectDocument, ClientPhoto, Subcontractor, LaborLog, RegistryRow, CompanyProfile
} from '../../types';
import { 
  Plus, Trash2, Edit2, Zap, Layers, Calendar, MapPin, Users, Receipt, Search, 
  FileText, Camera, Eye, X, Check, Share2, Siren, Globe, Package, HardHat, 
  ShieldCheck, ListOrdered, FileType, ArrowLeft, Send, Lock, Star, TrendingUp, RefreshCw, ImageIcon,
  CheckCircle2, AlertTriangle, UserCircle, Wrench, Download, ExternalLink, Activity, Info,
  ChevronRight, Briefcase, Clock, ChevronDown, Upload, Loader2, Minus, Settings2, DollarSign,
  Stamp, PenTool, Printer
} from 'lucide-react';
import { 
  formatCurrency, getInvoices, getWorkers, getAttendance, getHourlyRate, 
  calculateOvertimeMultiplier, saveInvoices, getMediaViewUrl, uploadFileToCloud, getCompanyProfiles
} from '../../utils';
import { GST_RATE } from '../../constants';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
  companySettings: any;
  activeTab: string;
  onComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  isReadOnly?: boolean;
  onGenerateQuote?: () => void;
}

const generateRowId = () => Math.random().toString(36).substr(2, 9);

// --- VO CLAIM DOCUMENT LAYOUT ---
const VOClaimLayout = ({ vo, project, profile, settings, id = "vo-claim-area" }: { vo: VariationOrder, project: Project, profile?: CompanyProfile, settings: any, id?: string }) => {
    const signatory = settings.supervisors?.find((s: any) => s.id === vo.signatoryId);
    const signatureUrl = signatory?.signatureUrl;
    const stampUrl = profile?.stampUrl;

    const subtotal = (vo.rows || []).reduce((sum, row) => sum + (Number(row.total) || 0), 0);
    const gst = profile?.gstRegNo ? subtotal * GST_RATE : 0;
    const total = subtotal + gst;

    return (
        <div id={id} className="w-[210mm] min-h-[297mm] p-[15mm] bg-white text-slate-900 font-sans leading-tight flex flex-col box-border overflow-hidden mx-auto border border-slate-100 shadow-2xl">
            <header className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-10">
                <div className="text-left space-y-4">
                    {profile?.logoUrl && <img src={getMediaViewUrl(profile.logoUrl)} className="h-16 w-auto object-contain mb-2" crossOrigin="anonymous" />}
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-900">{profile?.name || settings.name}</h1>
                    <div className="text-[9px] font-bold text-slate-500 uppercase space-y-1">
                        <p>{profile?.address || settings.address}</p>
                        <p>UEN: {profile?.uen || settings.uen} | TEL: {profile?.phone || settings.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none mb-4">VO CLAIM</h2>
                    <div className="space-y-1 font-black uppercase text-[10px]">
                        <p><span className="text-slate-300">CLAIM NO:</span> {vo.voNo}</p>
                        <p><span className="text-slate-300">DATE:</span> {vo.date}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-12 mb-12 text-left">
                <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-50 w-fit pb-1">PROJECT DETAILS:</h4>
                    <p className="font-black text-lg uppercase tracking-tight leading-none text-slate-900">{project.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{project.location}</p>
                    <p className="text-[10px] font-black text-slate-900 uppercase pt-2">CLIENT: {project.client}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-2 text-left">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Scope Summary:</h4>
                    <p className="text-[11px] font-bold text-slate-700 uppercase leading-relaxed">{vo.description || "ADDITIONAL WORKS AS PER SITE REQUEST"}</p>
                </div>
            </div>

            <div className="flex-1">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                            <th className="py-3 px-4 text-left w-12">SN</th>
                            <th className="py-3 px-4 text-left">DESCRIPTION OF ADDITIONAL WORKS</th>
                            <th className="py-3 px-4 text-center w-20">QTY</th>
                            <th className="py-3 px-4 text-right w-32">UNIT (S$)</th>
                            <th className="py-3 px-4 text-right w-32">TOTAL (S$)</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold uppercase text-slate-800">
                        {(vo.rows || []).map((row, idx) => (
                            <tr key={row.id} className="border-b border-slate-100 h-12">
                                <td className="px-4 text-slate-300 font-mono">{idx + 1}</td>
                                <td className="px-4 text-left">{row.description}</td>
                                <td className="px-4 text-center">{row.quantity} {row.unit || 'LS'}</td>
                                <td className="px-4 text-right text-slate-400">${Number(row.rate).toFixed(2)}</td>
                                <td className="px-4 text-right font-black">${Number(row.total).toFixed(2)}</td>
                            </tr>
                        ))}
                        {[...Array(Math.max(0, 8 - (vo.rows?.length || 0)))].map((_, i) => (
                            <tr key={i} className="border-b border-slate-50 h-12 opacity-20"><td colSpan={5}></td></tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-start gap-12 mt-10">
                <div className="flex-1 space-y-4 text-left">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest underline mb-2">Certification Note</div>
                    <p className="text-[9px] font-medium text-slate-500 uppercase leading-relaxed italic">
                        The above works were carried out as variations to the original contract. All quantities are subject to final site measurement upon completion. Please refer to site logs for progress verification.
                    </p>
                </div>
                <div className="w-80 space-y-2 border-t-4 border-slate-900 pt-3 text-right">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-2">
                        <span>VO Subtotal</span>
                        <span className="text-slate-900">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    {gst > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-2">
                            <span>GST (9%)</span>
                            <span className="text-slate-900">${gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-xl mt-4">
                        <span className="font-black uppercase tracking-widest text-[10px]">CLAIM AMOUNT</span>
                        <span className="font-black text-2xl tabular-nums tracking-tighter">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mt-16 items-end">
                <div className="flex flex-col text-left">
                    <div className="h-24 flex flex-col justify-end">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">ACKNOWLEDGED BY CLIENT</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-2">
                        <p className="text-[9px] font-black uppercase tracking-widest">AUTHORIZED SIGNATURE / DATE</p>
                    </div>
                </div>
                <div className="flex flex-col relative text-left">
                    <div className="h-24 flex flex-col justify-end relative">
                         {stampUrl && (
                             <img src={getMediaViewUrl(stampUrl)} className="absolute left-10 bottom-4 w-24 h-24 object-contain rotate-12 opacity-60 z-0" crossOrigin="anonymous" />
                         )}
                         {signatureUrl && (
                             <img src={getMediaViewUrl(signatureUrl)} className="absolute left-0 bottom-6 w-56 h-20 object-contain z-10" crossOrigin="anonymous" />
                         )}
                         <p className="italic text-slate-500 font-bold text-[9px] mb-1">For and on behalf of,</p>
                         <p className="font-black text-slate-900 text-[11px] uppercase tracking-tight relative z-20">{profile?.name || settings.name}</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-2 relative z-20">
                        <p className="text-[9px] font-black uppercase tracking-widest">{signatory?.name || 'AUTHORIZED SIGNATORY'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{signatory?.title || 'PROJECT MANAGER'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  project: rawProject, onBack, onUpdate, companySettings, activeTab, onComplete, onDelete, isReadOnly, onGenerateQuote 
}) => {
  // --- 1. DATA NORMALIZATION ---
  const project = useMemo(() => {
    if (!rawProject) return null;
    const blob = (rawProject as any).projectData || {};
    const data = typeof blob === 'string' ? JSON.parse(blob) : blob;
    
    return {
        ...rawProject,
        milestones: rawProject.milestones || data.milestones || [],
        materials: rawProject.materials || data.materials || [],
        laborLogs: rawProject.laborLogs || data.laborLogs || [],
        subcontractors: rawProject.subcontractors || data.subcontractors || [],
        variationOrders: rawProject.variationOrders || data.variationOrders || [],
        defects: rawProject.defects || data.defects || [],
        documents: rawProject.documents || data.documents || [],
        dailyUpdates: rawProject.dailyUpdates || data.dailyUpdates || [],
        clientPhotos: rawProject.clientPhotos || data.clientPhotos || []
    } as Project;
  }, [rawProject]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showEditHeaderModal, setShowEditHeaderModal] = useState(false);
  const [headerForm, setHeaderForm] = useState({
    name: '',
    client: '',
    location: '',
    contractValue: 0,
    startDate: '',
    endDate: ''
  });
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({ title: '', isGroup: false, progress: 0, startDate: new Date().toISOString().split('T')[0], duration: 1, parentId: '' });
  const [isUploading, setIsUploading] = useState(false);
  const registryFileInputRef = useRef<HTMLInputElement>(null);
  
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [selectedVOForClaim, setSelectedVOForClaim] = useState<VariationOrder | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (project?.id) {
        getInvoices().then(setAllInvoices);
        getCompanyProfiles().then(setProfiles);
    }
  }, [project?.id]);

  // --- 2. CALCULATIONS & SORTING ---
  const financials = useMemo(() => {
    if (!project) return { revised: 0, spent: 0 };
    const original = Number(project.contractValue || 0);
    const voTotal = (project.variationOrders || []).reduce((s, v) => s + (Number(v.amount) || 0), 0);
    const paidAP = allInvoices.filter(i => i.projectId === project.id && i.status === 'PAID').reduce((s, i) => s + Number(i.totalAmount), 0);
    return { revised: original + voTotal, spent: paidAP };
  }, [project, allInvoices]);

  const siteProgress = useMemo(() => {
    const tasks = (project?.milestones || []).filter(m => !m.isGroup);
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((sum, t) => sum + (Number(t.progress) || 0), 0) / tasks.length);
  }, [project?.milestones]);

  const sortedMilestones = useMemo(() => {
    const ms = project?.milestones || [];
    const headers = ms.filter(m => m.isGroup);
    const processed: (Milestone & { isChild?: boolean })[] = [];

    const calculateHeaderProgress = (headerId: string) => {
        const children = ms.filter(c => c.parentId === headerId && !c.isGroup);
        if (children.length === 0) return 0;
        return Math.round(children.reduce((s, c) => s + (c.progress || 0), 0) / children.length);
    };

    headers.forEach(h => {
        processed.push({ ...h, progress: calculateHeaderProgress(h.id) });
        const children = ms.filter(c => c.parentId === h.id && !c.isGroup);
        children.forEach(c => processed.push({ ...c, isChild: true }));
    });

    const leftovers = ms.filter(m => !m.isGroup && (!m.parentId || !headers.some(h => h.id === m.parentId)));
    leftovers.forEach(l => processed.push(l));

    return processed;
  }, [project?.milestones]);

  const handleSaveMilestone = () => {
    if (!project) return;
    const start = milestoneForm.startDate || new Date().toISOString().split('T')[0];
    const due = new Date(start);
    due.setDate(due.getDate() + (Number(milestoneForm.duration) || 1));
    
    const newM = { 
        ...milestoneForm, 
        id: editingId?.startsWith('new') ? generateRowId() : editingId || generateRowId(), 
        title: milestoneForm.title?.toUpperCase(), 
        startDate: start,
        dueDate: due.toISOString().split('T')[0],
        parentId: milestoneForm.isGroup ? undefined : milestoneForm.parentId
    } as Milestone;
    
    const updated = editingId && !editingId.startsWith('new') 
        ? project.milestones.map((ms:any) => ms.id === editingId ? newM : ms) 
        : [...(project.milestones || []), newM];
        
    onUpdate({ ...project, milestones: updated });
    setShowScheduleModal(false); 
    setEditingId(null);
  };

  const handleSaveHeader = () => {
    if (!project) return;
    onUpdate({
        ...project,
        name: headerForm.name.toUpperCase(),
        client: headerForm.client.toUpperCase(),
        location: headerForm.location.toUpperCase(),
        contractValue: Number(headerForm.contractValue),
        startDate: headerForm.startDate,
        endDate: headerForm.endDate
    });
    setShowEditHeaderModal(false);
  };

  const openEditHeader = () => {
    if (!project) return;
    setHeaderForm({
        name: project.name || '',
        client: project.client || '',
        location: project.location || '',
        contractValue: project.contractValue || 0,
        startDate: project.startDate || '',
        endDate: project.endDate || ''
    });
    setShowEditHeaderModal(true);
  };

  const handleRegistryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
        const newImages = [...(formData.images || [])];
        for (const file of Array.from(files)) {
            const url = await uploadFileToCloud(file);
            newImages.push(url);
        }
        setFormData({ ...formData, images: newImages });
    } catch (err) {
        console.error("Registry upload failed", err);
    } finally {
        setIsUploading(false);
        if (e.target) e.target.value = '';
    }
  };

  const calculateRegistryTotal = (rows: RegistryRow[] = []) => {
      return rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  };

  const addRegistryRow = () => {
      const newRow: RegistryRow = { id: generateRowId(), description: '', quantity: 1, rate: 0, total: 0, unit: 'LS' };
      setFormData({ ...formData, rows: [...(formData.rows || []), newRow] });
  };

  const updateRegistryRow = (rowId: string, field: keyof RegistryRow, value: any) => {
      const updatedRows = (formData.rows || []).map((row: RegistryRow) => {
          if (row.id === rowId) {
              const updated = { ...row, [field]: value };
              if (field === 'quantity' || field === 'rate') {
                  updated.total = Number(updated.quantity || 0) * Number(updated.rate || 0);
              }
              return updated;
          }
          return row;
      });
      setFormData({ ...formData, rows: updatedRows, amount: calculateRegistryTotal(updatedRows) });
  };

  const handleDownloadVOClaim = async () => {
      if (!selectedVOForClaim) return;
      setIsGeneratingPdf(true);
      const element = document.getElementById('vo-claim-preview-area');
      if (!element) return;
      const opt = { 
        margin: 0, 
        filename: `VO_Claim_${selectedVOForClaim.voNo}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } 
      };
      try {
          // @ts-ignore
          await html2pdf().set(opt).from(element).save();
      } finally {
          setIsGeneratingPdf(false);
      }
  };

  const renderRegistry = (title: string, dataKey: keyof Project, Icon: any) => {
    if (!project) return null;
    const list = (project[dataKey] || []) as any[];
    const filtered = list.filter(it => (it.name || it.voNo || it.workerName || it.payee || '').toLowerCase().includes(sidebarSearch.toLowerCase()));

    return (
      <div className="flex flex-col lg:flex-row gap-8 h-[750px] animate-fade-in text-left">
        <aside className="w-full lg:w-[350px] bg-white border rounded-[2.5rem] flex flex-col overflow-hidden shadow-sm text-left">
          <div className="p-6 border-b space-y-4 bg-slate-50/50">
            <div className="flex justify-between items-center text-left">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-indigo-600" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">{title}</h3>
              </div>
              <button onClick={() => { setEditingId(`new_${Date.now()}`); setFormData({ id: generateRowId(), date: new Date().toISOString().split('T')[0], invoiceNo: '', images: [], rows: [{ id: '1', description: '', quantity: 1, rate: 0, total: 0, unit: 'LS' }], amount: 0 }); }} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"><Plus size={16}/></button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/>
              <input className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/5" placeholder="Filter records..." value={sidebarSearch} onChange={e => setSidebarSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar text-left">
            {filtered.map(it => (
              <div key={it.id} onClick={() => { setEditingId(it.id); setFormData({ ...it, images: it.images || [], rows: it.rows || [{ id: '1', description: it.name || it.workerName || '', quantity: 1, rate: it.amount || 0, total: it.amount || 0, unit: 'LS' }] }); }} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center group ${editingId === it.id ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-indigo-100 hover:bg-slate-50'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black uppercase truncate text-slate-900">{it.name || it.voNo || it.workerName || it.payee || it.description || 'UNNAMED RECORD'}</p>
                      {it.images?.length > 0 && <ImageIcon size={10} className="text-indigo-400 shrink-0"/>}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{it.date} {it.invoiceNo ? `• ${it.invoiceNo}` : ''}</p>
                    <p className="text-[10px] font-black text-indigo-600 tabular-nums">{formatCurrency(it.amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                    {dataKey === 'variationOrders' && (
                        <button onClick={(e) => { e.stopPropagation(); setSelectedVOForClaim(it); }} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><Printer size={14}/></button>
                    )}
                    <ChevronRight size={14} className={`transition-all ${editingId === it.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200 group-hover:text-slate-400'}`} />
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center opacity-30 italic text-[10px] font-black uppercase">No records archived</div>
            )}
          </div>
        </aside>
        <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-10 overflow-y-auto no-scrollbar shadow-sm text-left">
          {editingId ? (
            <div className="space-y-10 animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Entry Specification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Item Ledger Reconciliation</p>
                </div>
                <button onClick={() => setEditingId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="md:col-span-1 space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reference Title</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={formData.name || formData.voNo || formData.workerName || formData.payee || ''} onChange={e => {
                      const val = e.target.value.toUpperCase();
                      const key = dataKey === 'variationOrders' ? 'voNo' : dataKey === 'laborLogs' ? 'workerName' : 'name';
                      setFormData({...formData, [key]: val});
                  }} placeholder="Entity / Supplier Name" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Invoice / VO Reference</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={formData.invoiceNo || ''} onChange={e => setFormData({...formData, invoiceNo: e.target.value.toUpperCase()})} placeholder="REF-8890" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Archive Date</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>

              {/* VO SPECIFIC: SIGNATORY & PROFILE */}
              {dataKey === 'variationOrders' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl animate-in fade-in slide-in-from-top-2">
                       <div className="space-y-2 text-left text-left">
                           <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Stamp size={10}/> Claim Issuing Profile</label>
                           <select className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-left" value={formData.issuingCompanyId || ''} onChange={e => setFormData({...formData, issuingCompanyId: e.target.value})}>
                               <option value="">-- Choose Profile --</option>
                               {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                           </select>
                       </div>
                       <div className="space-y-2 text-left text-left">
                           <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1.5"><PenTool size={10}/> Authorized Signatory</label>
                           <select className="w-full p-3 bg-white border border-indigo-100 rounded-xl font-black text-[10px] uppercase appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-left" value={formData.signatoryId || ''} onChange={e => setFormData({...formData, signatoryId: e.target.value})}>
                               <option value="">-- Choose Staff --</option>
                               {(companySettings.supervisors || []).filter((s:any) => s.role === 'STAFF').map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                           </select>
                       </div>
                  </div>
              )}

              {/* ITEM BREAKDOWN SECTION */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2"><ListOrdered size={14}/> Line Item Breakdown</label>
                      <button onClick={addRegistryRow} className="text-[9px] font-black bg-indigo-50 text-indigo-600 uppercase px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">+ Add Item</button>
                  </div>
                  <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <tr>
                                  <th className="px-6 py-4">Item Specification</th>
                                  <th className="px-4 py-4 w-20 text-center">Qty</th>
                                  <th className="px-4 py-4 w-32 text-right">Unit Rate</th>
                                  <th className="px-4 py-4 w-32 text-right">Total</th>
                                  <th className="px-4 py-4 w-12"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/50">
                              {(formData.rows || []).map((row: RegistryRow) => (
                                  <tr key={row.id} className="group hover:bg-white transition-all">
                                      <td className="px-6 py-3">
                                          <input className="w-full bg-transparent font-bold uppercase outline-none" value={row.description} onChange={e => updateRegistryRow(row.id, 'description', e.target.value.toUpperCase())} placeholder="Item description..." />
                                      </td>
                                      <td className="px-4 py-3">
                                          <input type="number" className="w-full bg-transparent text-center font-black outline-none" value={row.quantity || ''} onChange={e => updateRegistryRow(row.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                      </td>
                                      <td className="px-4 py-3">
                                          <input type="number" className="w-full bg-transparent text-right font-black text-indigo-600 outline-none" value={row.rate || ''} onChange={e => updateRegistryRow(row.id, 'rate', parseFloat(e.target.value) || 0)} />
                                      </td>
                                      <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                                          {formatCurrency(row.total)}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          <button onClick={() => setFormData({...formData, rows: formData.rows.filter((r:any) => r.id !== row.id), amount: calculateRegistryTotal(formData.rows.filter((r:any) => r.id !== row.id))})} className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100"><Minus size={14}/></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Record Valuation</span>
                          <span className="text-xl font-black tabular-nums">{formatCurrency(formData.amount)}</span>
                      </div>
                  </div>
              </div>

              {/* MEDIA ARCHIVE SECTION */}
              <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Camera size={14}/> Site Media Archive</label>
                      <button onClick={() => registryFileInputRef.current?.click()} disabled={isUploading} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1.5 hover:underline disabled:opacity-50">
                          {isUploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>}
                          {isUploading ? 'Uploading...' : 'Attach Photos'}
                      </button>
                      <input type="file" multiple accept="image/*" className="hidden" ref={registryFileInputRef} onChange={handleRegistryPhotoUpload} />
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-[2rem]">
                      {(formData.images || []).map((img: string, idx: number) => (
                          <div key={idx} className="aspect-square rounded-2xl border-2 border-white shadow-sm overflow-hidden relative group cursor-zoom-in" onClick={() => setSelectedImage(img)}>
                              <img src={getMediaViewUrl(img)} className="w-full h-full object-cover" crossOrigin="anonymous" />
                              <button onClick={(e) => { e.stopPropagation(); setFormData({...formData, images: formData.images.filter((_:any, i:number) => i !== idx)}); }} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><X size={8}/></button>
                          </div>
                      ))}
                      <button onClick={() => registryFileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all">
                          <Plus size={20}/>
                          <span className="text-[7px] font-black uppercase mt-1">Add Photo</span>
                      </button>
                  </div>
              </div>

              <div className="flex gap-4">
                  <button onClick={() => setEditingId(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={() => {
                    const updatedList = editingId.startsWith('new') ? [...list, formData] : list.map(it => it.id === editingId ? formData : it);
                    onUpdate({ ...project, [dataKey]: updatedList }); setEditingId(null);
                  }} className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Commit to Master Archive</button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <Icon size={80} className="mb-6 text-slate-400"/>
                <h4 className="text-xl font-black uppercase tracking-widest text-slate-500">Registry Workspace</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-2 max-w-xs">Select a reference from the sidebar or initialize a new record to begin specification.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!project) return <div className="p-40 flex flex-col items-center justify-center gap-4 opacity-20 animate-pulse text-left"><RefreshCw className="animate-spin" size={48}/><span className="font-black uppercase tracking-[0.4em]">Establishing Site Link...</span></div>;

  return (
    <div className="space-y-8 pb-12 text-left animate-fade-in relative">
      {/* HEADER */}
      <header className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-sm gap-6 text-left">
        <div className="text-left flex items-center gap-6">
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none">{project.name}</h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">{project.location}</p>
            </div>
            <div className="flex items-center gap-3 mt-3">
                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">OWNER: {project.client}</span>
                {project.startDate && <span className="text-[8px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-widest">START: {project.startDate}</span>}
            </div>
          </div>
          {!isReadOnly && (
              <button onClick={openEditHeader} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-transparent hover:border-indigo-100">
                  <Settings2 size={20}/>
              </button>
          )}
        </div>
        <div className="bg-slate-900 px-8 py-6 rounded-[2.5rem] text-white flex items-center gap-10 min-w-full md:min-w-[450px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Briefcase size={80}/></div>
          <div className="text-right border-r pr-10 border-white/10 relative z-10">
            <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Revised Sum</p>
            <p className="text-2xl font-black tabular-nums">{formatCurrency(financials.revised)}</p>
          </div>
          <div className="text-right relative z-10 flex-1">
            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1 tracking-widest">Site Progress</p>
            <p className="text-4xl font-black tabular-nums leading-none">{siteProgress}%</p>
          </div>
          <Zap className="text-emerald-400 relative z-10" size={32}/>
        </div>
      </header>

      {/* TABS CONTENT */}
      <div className="min-h-[700px] text-left">
        {activeTab === 'timeline' && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center px-4">
                <div className="flex items-center gap-4 text-left">
                    <Calendar size={28} className="text-indigo-600"/>
                    <div className="text-left">
                        <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tight leading-none">Schedule Master</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Construction Phases & Nested Hierarchy</p>
                    </div>
                </div>
                <button onClick={() => { setEditingId(`new_${Date.now()}`); setMilestoneForm({ title: '', progress: 0, startDate: new Date().toISOString().split('T')[0], duration: 7, isGroup: false, parentId: '' }); setShowScheduleModal(true); }} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all">+ New Entry</button>
            </div>
            
            <div className="grid grid-cols-1 gap-3 text-left">
                {sortedMilestones.map(m => (
                    <div 
                        key={m.id} 
                        onClick={() => { setEditingId(m.id); setMilestoneForm(m); setShowScheduleModal(true); }} 
                        className={`p-6 rounded-[2.5rem] border flex items-center justify-between cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden ${m.isGroup ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 shadow-sm'} ${m.isChild ? 'ml-12 border-l-4 border-l-indigo-200' : ''}`}
                    >
                        {m.isGroup && <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>}
                        <div className="flex items-center gap-5 text-left">
                            <div className={`p-3 rounded-2xl ${m.isGroup ? 'bg-white/10 text-white shadow-inner' : 'bg-slate-50 text-indigo-600'}`}>
                                {m.isGroup ? <Layers size={20}/> : <Check size={18}/>}
                            </div>
                            <div className="text-left">
                                <h4 className={`font-black uppercase tracking-tight leading-none ${m.isGroup ? 'text-lg' : 'text-sm'}`}>{m.title}</h4>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">
                                        <Calendar size={8} className="inline mr-1"/> {m.startDate} » {m.dueDate}
                                    </p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">
                                        <Clock size={8} className="inline mr-1"/> {m.duration} Days
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="w-64 flex flex-col items-end gap-2">
                            <div className="flex justify-between items-center w-full px-1">
                                <span className="text-[8px] font-black uppercase opacity-40">Progress</span>
                                <span className="font-black text-sm tabular-nums tracking-tighter">{m.progress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-500/10 bg-slate-50 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${m.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{width: `${m.progress}%`}}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'materials' && renderRegistry('Site Logistics', 'materials', Package)}
        {activeTab === 'vo' && renderRegistry('Variations & Adjustments', 'variationOrders', Receipt)}
        {activeTab === 'labor' && renderRegistry('Manpower Registry', 'laborLogs', HardHat)}
        {activeTab === 'subcontractors' && renderRegistry('Sub-Con Ledger', 'subcontractors', Globe)}
        {activeTab === 'defects' && renderRegistry('Defect Management', 'defects', Siren)}

        {activeTab === 'updates' && (
            <div className="max-w-3xl mx-auto space-y-8 text-left animate-fade-in">
                <div className="flex items-center gap-4 px-4 text-left">
                    <Activity size={24} className="text-indigo-600"/>
                    <h3 className="text-2xl font-black uppercase text-slate-800">Operational Site Feed</h3>
                </div>
                {(project.dailyUpdates || []).map((u:any) => (
                    <div key={u.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-6 hover:shadow-xl transition-all text-left">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">{u.user?.charAt(0)}</div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{u.date} • {u.user}</p>
                            </div>
                            {u.isUrgent && <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[8px] font-black uppercase border border-rose-100 animate-pulse">URGENT</span>}
                        </div>
                        <p className="text-sm font-bold text-slate-700 rounded p-1 mb-2 bg-slate-50 hover:bg-slate-100 transition-colors uppercase leading-relaxed">{u.description}</p>
                        {u.images && u.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                {u.images.map((img: string, i: number) => (
                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in hover:scale-105 transition-transform" onClick={() => setSelectedImage(img)}>
                                        <img src={getMediaViewUrl(img)} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'photos' && (
            <div className="space-y-10 animate-fade-in text-left">
                <div className="flex items-center gap-4 px-4 text-left">
                    <ImageIcon size={24} className="text-indigo-600"/>
                    <h3 className="text-2xl font-black uppercase text-slate-800">Visual Site Archive</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {(project.dailyUpdates || []).flatMap(u => (u.images || []).map(img => ({ img, date: u.date }))).map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-3 group cursor-zoom-in text-center" onClick={() => setSelectedImage(item.img)}>
                            <div className="aspect-square rounded-full border-8 border-white shadow-xl overflow-hidden hover:scale-105 transition-all duration-500 hover:rotate-2">
                                <img src={getMediaViewUrl(item.img)} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'clientPhotos' && (
            <div className="space-y-10 animate-fade-in text-left">
                <div className="flex justify-between items-center px-4 text-left">
                    <div className="flex items-center gap-4 text-left">
                        <UserCircle size={24} className="text-indigo-600"/>
                        <h3 className="text-2xl font-black uppercase text-slate-800">Client Transparency Vault</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {(project.clientPhotos || []).map((photo) => (
                        <div key={photo.id} className="flex flex-col gap-4 group cursor-zoom-in text-center" onClick={() => setSelectedImage(photo.url)}>
                            <div className="aspect-square rounded-full border-8 border-white shadow-2xl overflow-hidden hover:scale-110 transition-all duration-700 relative">
                                <img src={getMediaViewUrl(photo.url)} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors"></div>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-900 uppercase truncate leading-none">{photo.description}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">{photo.date}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'completion' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-fade-in text-left">
                <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group text-left">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Star size={140} /></div>
                    <div className="relative z-10 text-left">
                        <span className="bg-emerald-500 text-white text-[8px] font-black px-4 py-1.5 rounded-full uppercase shadow-lg mb-6 inline-block tracking-widest">FINAL HANDOVER PROTOCOL</span>
                        <h3 className="text-4xl font-black uppercase tracking-tight leading-none mb-4">Project Handover</h3>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-xl">Formalize the transition from active construction to verified delivery. Ensure all defects are settled and final progress claims are issued.</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'access' && (
          <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl space-y-10 animate-fade-in text-left">
             <div className="flex items-center gap-5 border-b border-slate-50 pb-8 text-left">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner"><Globe size={32}/></div>
                <div className="text-left">
                    <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">Client Portal</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Home-owner Transparency System</p>
                </div>
             </div>
             <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-indigo-50/50 transition-colors text-left">
               <div className="text-left"><span className="font-black uppercase text-sm block text-slate-800">Access Visibility</span><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Allow owner to view site feed & timeline</p></div>
               <button onClick={() => onUpdate({...project, portalEnabled: !project.portalEnabled})} className={`w-14 h-8 rounded-full p-1 transition-all shadow-inner ${project.portalEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${project.portalEnabled ? 'translate-x-6' : ''}`}></div></button>
             </div>
             {project.portalEnabled && (
                <div className="space-y-6 animate-in slide-in-from-top-4 text-left">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-3 flex items-center gap-2"><Lock size={12}/> Secure Access Key</label>
                    <input className="w-full p-8 bg-slate-900 text-indigo-400 border-none rounded-[2rem] font-black text-4xl tracking-[0.4em] uppercase text-center shadow-2xl" value={project.portalPassword || ''} onChange={e => onUpdate({...project, portalPassword: e.target.value.toUpperCase()})} placeholder="SET KEY" />
                  </div>
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4 text-left">
                    <Info size={18} className="text-indigo-600 shrink-0 mt-0.5"/>
                    <p className="text-[9px] font-bold text-indigo-700 uppercase leading-relaxed tracking-tighter text-left">Share this key with the client. They must login using the "Project Owner" option on the main authorization screen to view their personalized dashboard.</p>
                  </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* VO CLAIM PREVIEW MODAL */}
      {selectedVOForClaim && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[500] flex flex-col animate-fade-in text-left">
              <header className="p-8 border-b border-white/5 flex justify-between items-center text-white shrink-0">
                  <div className="flex items-center gap-6">
                      <button onClick={() => setSelectedVOForClaim(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left"><X size={24}/></button>
                      <div className="text-left text-left">
                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-left">Variation Claim View</h3>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-2 text-left">VO # {selectedVOForClaim.voNo} • {selectedVOForClaim.date}</p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={handleDownloadVOClaim} disabled={isGeneratingPdf} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                        {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18}/>} 
                        {isGeneratingPdf ? 'Compiling Archive...' : 'Export Claim PDF'}
                     </button>
                  </div>
              </header>
              <div className="flex-1 overflow-y-auto no-scrollbar p-10 flex justify-center bg-slate-900/50">
                <div className="origin-top scale-[0.9] lg:scale-[1]">
                    <VOClaimLayout 
                        vo={selectedVOForClaim} 
                        project={project}
                        profile={profiles.find(p => p.id === selectedVOForClaim.issuingCompanyId) || profiles[0]} 
                        settings={companySettings}
                        id="vo-claim-preview-area"
                    />
                </div>
              </div>
          </div>
      )}

      {/* EDIT HEADER MODAL */}
      {showEditHeaderModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 text-left">
              <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
                  <header className="p-8 border-b border-slate-50 bg-indigo-50/30 flex justify-between items-center text-left">
                      <div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Configuration Panel</span>
                          <h3 className="text-2xl font-black text-slate-900 uppercase">Edit Project Header</h3>
                      </div>
                      <button onClick={() => setShowEditHeaderModal(false)} className="p-3 bg-white text-slate-400 rounded-full border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"><X/></button>
                  </header>
                  <div className="p-10 space-y-6 text-left overflow-y-auto max-h-[70vh] no-scrollbar">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={headerForm.name} onChange={e => setHeaderForm({...headerForm, name: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client / Owner</label>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={headerForm.client} onChange={e => setHeaderForm({...headerForm, client: e.target.value})} />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Site Address / Location</label>
                          <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs uppercase outline-none h-24 resize-none text-left" value={headerForm.location} onChange={e => setHeaderForm({...headerForm, location: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contract Sum ($)</label>
                              <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                  <input type="number" className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none text-indigo-600" value={headerForm.contractValue || ''} onChange={e => setHeaderForm({...headerForm, contractValue: parseFloat(e.target.value) || 0})} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                              <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" value={headerForm.startDate} onChange={e => setHeaderForm({...headerForm, startDate: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Est. End Date</label>
                              <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" value={headerForm.endDate} onChange={e => setHeaderForm({...headerForm, endDate: e.target.value})} />
                          </div>
                      </div>
                  </div>
                  <footer className="p-8 border-t border-slate-50 bg-slate-50 flex justify-center">
                      <button onClick={handleSaveHeader} className="px-24 py-5 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                          <ShieldCheck size={20}/>
                          Authorize Header Update
                      </button>
                  </footer>
              </div>
          </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-nature-forest/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-lg rounded-[3.5rem] p-12 space-y-8 shadow-2xl animate-in zoom-in-95 border border-nature-stone/30 text-left">
            <div className="flex justify-between items-center text-left">
                <h3 className="text-3xl font-black uppercase text-slate-900 leading-tight text-left">Phase Control</h3>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
            </div>
            <div className="space-y-6 text-left">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Title / Milestone Name</label>
                    <input className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={milestoneForm.title} onChange={e => setMilestoneForm({...milestoneForm, title: e.target.value.toUpperCase()})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Start Date</label>
                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" value={milestoneForm.startDate} onChange={e => setMilestoneForm({...milestoneForm, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Duration (Days)</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs outline-none" value={milestoneForm.duration} onChange={e => setMilestoneForm({...milestoneForm, duration: parseInt(e.target.value) || 1})} />
                    </div>
                </div>

                {!milestoneForm.isGroup && (
                    <div className="space-y-4 text-left">
                        <div className="space-y-1 text-left">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Parent Section</label>
                            <select 
                                className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-black text-[10px] uppercase appearance-none text-left" 
                                value={milestoneForm.parentId || ''} 
                                onChange={e => setMilestoneForm({...milestoneForm, parentId: e.target.value})}
                            >
                                <option value="">-- No Parent (Top Level) --</option>
                                {project.milestones.filter(m => m.isGroup && m.id !== milestoneForm.id).map(h => (
                                    <option key={h.id} value={h.id}>{h.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-6 pt-4 border-t border-slate-50 text-left">
                            <div className="flex justify-between items-center text-left"><label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Completion Depth</label><span className="text-4xl font-black text-indigo-600 tabular-nums tracking-tighter">{milestoneForm.progress}%</span></div>
                            <input type="range" className="w-full h-3 accent-indigo-600 appearance-none bg-slate-100 rounded-full cursor-pointer shadow-inner" min="0" max="100" value={milestoneForm.progress} onChange={e => setMilestoneForm({...milestoneForm, progress: parseInt(e.target.value)})} />
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-left">
                    <div className="text-left"><span className="text-[10px] font-black uppercase text-slate-800 block">Classify as Header?</span><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Allows other tasks to be grouped under this phase</p></div>
                    <button onClick={() => setMilestoneForm({...milestoneForm, isGroup: !milestoneForm.isGroup, parentId: !milestoneForm.isGroup ? undefined : milestoneForm.parentId})} className={`w-12 h-6 rounded-full p-1 transition-all ${milestoneForm.isGroup ? 'bg-indigo-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${milestoneForm.isGroup ? 'translate-x-6' : ''}`}></div></button>
                </div>
            </div>
            <div className="flex gap-4 text-left">
                {editingId && !editingId.startsWith('new') && (
                    <button onClick={() => { if(confirm('Delete this entry?')) { onUpdate({...project, milestones: project.milestones.filter((ms:any) => ms.id !== editingId)}); setShowScheduleModal(false); } }} className="p-6 bg-rose-50 text-rose-500 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all"><Trash2/></button>
                )}
                <button onClick={handleSaveMilestone} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-center">Authorize Site Update</button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE VIEWER */}
      {selectedImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[500] flex flex-col items-center justify-center p-4 animate-fade-in text-left">
          <div className="w-full max-w-5xl flex justify-between items-center mb-6 text-white shrink-0 text-left">
             <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><ImageIcon size={20}/></div>
                <h4 className="text-xl font-black uppercase tracking-tight text-left">High-Resolution Inspect</h4>
             </div>
             <button onClick={() => setSelectedImage(null)} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={28}/></button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden cursor-zoom-out w-full" onClick={() => setSelectedImage(null)}>
            <img 
                src={getMediaViewUrl(selectedImage)} 
                className="max-w-full max-h-[85vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.5)] rounded-2xl animate-in zoom-in-95 border-8 border-white" 
                crossOrigin="anonymous" 
                alt="Enlarged Site View"
            />
          </div>
        </div>
      )}
    </div>
  );
};
