import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UnifiedDocument, LegacyDocument, Invoice, SavedQuotation, PaymentVoucher, CompanyProfile, CompanySettings } from '../types';
import { 
    getInvoices, getQuotations, getVouchers, getLegacyDocuments, saveLegacyDocuments,
    formatCurrency, formatDateSG, uploadFileToCloud, getMediaViewUrl, getSettings, getCompanyProfiles
} from '../utils';
import { 
    Folder, ChevronRight, ChevronDown, FileText, Search, 
    X, Download, Calendar, Archive, Layers, 
    Trash2, Loader2, Package, Receipt, 
    Banknote, FilePlus, Building2, Tag, Landmark, Smartphone, Image as ImageIcon,
    CheckCircle2, Clock, FileType, Filter, ShieldCheck, History, Info, ExternalLink,
    Briefcase, User, Wallet, AlignLeft, Hash
} from 'lucide-react';
import { DocLayout } from './accounting/InvoiceManager';
import { DEFAULT_COMPANY_SETTINGS } from '../constants';

export const DocumentArchive: React.FC = () => {
    const [viewMode, setViewMode] = useState<'EXPLORER' | 'IMPORT'>('EXPLORER');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SYSTEM' | 'LEGACY'>('ALL');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedDoc, setSelectedDoc] = useState<UnifiedDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Data State
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [quotations, setQuotations] = useState<SavedQuotation[]>([]);
    const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
    const [legacy, setLegacy] = useState<LegacyDocument[]>([]);
    const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
    const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
    
    // Import Form State
    const [importForm, setImportForm] = useState<Partial<LegacyDocument>>({
        type: 'INVOICE',
        classification: '',
        date: new Date().toISOString().split('T')[0],
        entityName: '',
        referenceNo: '',
        fileUrl: '',
        amount: 0,
        notes: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadAll = async () => {
        setIsLoading(true);
        try {
            const [inv, quo, vou, leg, sets, profs] = await Promise.all([
                getInvoices(), getQuotations(), getVouchers(), getLegacyDocuments(),
                getSettings(), getCompanyProfiles()
            ]);
            setInvoices(inv || []);
            setQuotations(quo || []);
            setVouchers(vou || []);
            setLegacy(leg || []);
            setSettings(sets || DEFAULT_COMPANY_SETTINGS);
            setProfiles(profs || []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, []);

    const unifiedDocuments = useMemo((): UnifiedDocument[] => {
        const docs: UnifiedDocument[] = [];
        
        invoices.forEach(i => docs.push({
            id: i.id, sourceId: i.id, type: i.type === 'AR' ? 'INVOICE' : i.type === 'AP' ? 'INVOICE' : i.type, 
            classification: i.notes?.substring(0, 30) || '',
            date: i.date, entity: i.entityName, 
            ref: i.invoiceNo, amount: i.totalAmount, isLegacy: false, rawData: i,
            fileUrl: undefined 
        }));
        
        quotations.forEach(q => docs.push({
            id: q.id, sourceId: q.id, type: 'QUOTATION', 
            classification: q.projectTitle,
            date: q.date.split('T')[0], 
            entity: q.client.name, ref: q.ref, amount: q.items.reduce((s, it) => s + (it.total || 0), 0), 
            isLegacy: false, rawData: q
        }));
        
        vouchers.forEach(v => docs.push({
            id: v.id, sourceId: v.id, type: 'VOUCHER', 
            classification: 'PAYMENT DISBURSEMENT',
            date: v.date, entity: v.payeeName, 
            ref: v.voucherNo, amount: v.totalAmount, isLegacy: false, rawData: v
        }));
        
        legacy.forEach(l => docs.push({
            id: l.id, sourceId: l.id, type: l.type, 
            classification: l.classification || 'HISTORICAL SCAN',
            date: l.date, 
            entity: l.entityName, ref: l.referenceNo, amount: l.amount || 0, 
            isLegacy: true, fileUrl: l.fileUrl, rawData: l
        }));

        return docs;
    }, [invoices, quotations, vouchers, legacy]);

    const archiveTree = useMemo(() => {
        const tree: any = {};
        
        const filtered = unifiedDocuments.filter(d => {
            const matchesSearch = 
                d.entity.toLowerCase().includes(searchTerm.toLowerCase()) || 
                d.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.classification || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesSource = 
                sourceFilter === 'ALL' || 
                (sourceFilter === 'SYSTEM' && !d.isLegacy) || 
                (sourceFilter === 'LEGACY' && d.isLegacy);

            const matchesType = !typeFilter || d.type === typeFilter;

            return matchesSearch && matchesSource && matchesType;
        });

        filtered.forEach(doc => {
            const dateObj = new Date(doc.date);
            if (isNaN(dateObj.getTime())) return;

            const typeKey = doc.type.toUpperCase();
            const year = dateObj.getFullYear().toString();
            const monthIndex = dateObj.getMonth();
            const monthName = dateObj.toLocaleString('default', { month: 'long' });
            const day = dateObj.getDate().toString().padStart(2, '0');
            
            if (!tree[typeKey]) tree[typeKey] = {};
            if (!tree[typeKey][year]) tree[typeKey][year] = {};
            if (!tree[typeKey][year][monthIndex]) {
                tree[typeKey][year][monthIndex] = {
                    name: monthName,
                    days: {}
                };
            }
            if (!tree[typeKey][year][monthIndex].days[day]) {
                tree[typeKey][year][monthIndex].days[day] = [];
            }
            tree[typeKey][year][monthIndex].days[day].push(doc);
        });
        return tree;
    }, [unifiedDocuments, searchTerm, sourceFilter, typeFilter]);

    const toggleNode = (node: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(node)) next.delete(node);
            else next.add(node);
            return next;
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        try {
            // Fix: remove second argument as uploadFileToCloud only accepts 1 argument
            const base64 = await uploadFileToCloud(file);
            setImportForm(prev => ({ 
                ...prev, 
                fileUrl: base64, 
                referenceNo: prev.referenceNo || file.name.split('.')[0].toUpperCase() 
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const submitLegacyImport = async () => {
        if (!importForm.entityName || !importForm.fileUrl || !importForm.date) {
            alert("Please complete the Name, Date, and File upload.");
            return;
        }
        const newDoc: LegacyDocument = {
            id: 'LEG_' + Date.now(),
            type: importForm.type as any,
            classification: importForm.classification?.toUpperCase() || 'MANUAL RECORD',
            date: importForm.date!,
            entityName: importForm.entityName!.toUpperCase(),
            referenceNo: importForm.referenceNo!.toUpperCase() || 'HISTORICAL',
            fileUrl: importForm.fileUrl!,
            amount: Number(importForm.amount) || 0,
            notes: importForm.notes,
            uploadedAt: new Date().toISOString()
        };
        const updated = [newDoc, ...legacy];
        setLegacy(updated);
        await saveLegacyDocuments(updated);
        setImportForm({ type: 'INVOICE', classification: '', date: new Date().toISOString().split('T')[0], entityName: '', referenceNo: '', fileUrl: '', amount: 0, notes: '' });
        setViewMode('EXPLORER');
    };

    const handleDeleteLegacy = async (id: string) => {
        if (!confirm("Permanently purge this record from the archive?")) return;
        const updated = legacy.filter(l => l.id !== id);
        setLegacy(updated);
        await saveLegacyDocuments(updated);
        setSelectedDoc(null);
    };

    const getDocTypeIcon = (type: string) => {
        switch(type) {
            case 'INVOICE': return <Receipt size={16} className="text-emerald-400"/>;
            case 'PO': return <Package size={16} className="text-indigo-400"/>;
            case 'QUOTATION': return <FileText size={16} className="text-blue-400"/>;
            case 'VOUCHER': return <Banknote size={16} className="text-amber-400"/>;
            default: return <Archive size={16} className="text-slate-400"/>;
        }
    };

    const docTypeOptions = useMemo(() => Array.from(new Set(unifiedDocuments.map(d => d.type.toUpperCase()))), [unifiedDocuments]);

    const MetadataRow = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
        <div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0 text-left">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 shrink-0">
                <Icon size={14}/>
            </div>
            <div className="min-w-0 flex-1 text-left">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-left"> {label} </p>
                <p className="text-[11px] font-bold text-white uppercase truncate text-left">{value || '—'}</p>
            </div>
        </div>
    );

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden font-sans text-slate-900 text-left">
            <aside className="w-80 shrink-0 flex flex-col bg-slate-900 text-white z-40 relative border-r border-white/5 shadow-2xl text-left">
                <div className="p-6 border-b border-white/5 space-y-6 text-left">
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><Archive size={20}/></div>
                        <div className="text-left text-left">
                            <h2 className="text-sm font-black uppercase tracking-tight text-left">Archive Explorer</h2>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1 text-left">Intelligent Discovery</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4 text-left">
                        <div className="relative text-left">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                            <input 
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase outline-none focus:bg-white/10 transition-all placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/10 text-left" 
                                placeholder="Full-Text Search..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 text-left">
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 text-left">Document Provenance</p>
                             <div className="flex bg-white/5 p-1 rounded-xl text-left">
                                {(['ALL', 'SYSTEM', 'LEGACY'] as const).map(src => (
                                    <button 
                                        key={src} 
                                        onClick={() => setSourceFilter(src)}
                                        className={`flex-1 py-2 rounded-lg text-[8px] font-black transition-all ${sourceFilter === src ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                                    >
                                        {src}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="space-y-2 text-left text-left">
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 text-left">Quick Type Toggle</p>
                             <div className="flex flex-wrap gap-1 text-left">
                                <button onClick={() => setTypeFilter(null)} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${!typeFilter ? 'bg-white text-slate-900 border-white' : 'border-white/10 text-slate-500'}`}>All Types</button>
                                {docTypeOptions.map(type => (
                                    <button 
                                        key={type} 
                                        onClick={() => setTypeFilter(type)} 
                                        className={`px-2 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${typeFilter === type ? 'bg-indigo-500 text-white border-indigo-400' : 'border-white/10 text-slate-500'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1 text-left">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center gap-4 opacity-20 text-center text-left">
                            <Loader2 className="animate-spin" size={32}/>
                            <span className="text-[10px] font-black uppercase text-left">Scanning Volumes...</span>
                        </div>
                    ) : (
                        Object.keys(archiveTree).sort().map(type => (
                            <div key={type} className="mb-1 text-left">
                                <button 
                                    onClick={() => toggleNode(type)} 
                                    className={`w-full flex items-center gap-2 p-2.5 hover:bg-white/5 rounded-xl text-[11px] font-black uppercase transition-all text-left ${expandedNodes.has(type) ? 'text-white' : 'text-slate-400'}`}
                                >
                                    {expandedNodes.has(type) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                    {getDocTypeIcon(type)}
                                    {type}S
                                </button>

                                {expandedNodes.has(type) && (
                                    <div className="ml-4 border-l border-white/5 pl-2 space-y-1 text-left">
                                        {Object.keys(archiveTree[type]).sort((a,b) => Number(b) - Number(a)).map(year => (
                                            <div key={year} className="space-y-1 text-left">
                                                <button 
                                                    onClick={() => toggleNode(`${type}-${year}`)} 
                                                    className="w-full flex items-center gap-2 p-2 text-slate-500 hover:text-white rounded-lg text-[10px] font-black uppercase text-left"
                                                >
                                                    {expandedNodes.has(`${type}-${year}`) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                                    <Folder size={12} className="text-amber-500/50"/> {year}
                                                </button>

                                                {expandedNodes.has(`${type}-${year}`) && (
                                                    <div className="ml-4 border-l border-white/5 pl-2 space-y-1 text-left">
                                                        {Object.keys(archiveTree[type][year]).sort((a,b) => Number(b) - Number(a)).map(monthIdx => {
                                                            const monthData = archiveTree[type][year][monthIdx];
                                                            const monthKey = `${type}-${year}-${monthIdx}`;
                                                            return (
                                                                <div key={monthIdx} className="space-y-1 text-left">
                                                                    <button 
                                                                        onClick={() => toggleNode(monthKey)} 
                                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-[9px] font-black uppercase transition-all text-left ${expandedNodes.has(monthKey) ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}
                                                                    >
                                                                        {expandedNodes.has(monthKey) ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                                                        {monthData.name}
                                                                    </button>

                                                                    {expandedNodes.has(monthKey) && (
                                                                        <div className="space-y-0.5 ml-2 border-l border-white/5 pl-2 text-left">
                                                                            {Object.keys(monthData.days).sort((a,b) => b.localeCompare(a)).map(day => (
                                                                                <div key={day} className="py-1 text-left">
                                                                                    <p className="px-2 py-1 text-[7px] font-black text-slate-700 uppercase tracking-widest text-left">DAY {day}</p>
                                                                                    <div className="space-y-0.5 text-left">
                                                                                        {monthData.days[day].map((doc: UnifiedDocument) => (
                                                                                            <button 
                                                                                                key={doc.id}
                                                                                                onClick={() => setSelectedDoc(doc)}
                                                                                                className={`w-full text-left p-2.5 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all border text-left ${selectedDoc?.id === doc.id ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-transparent'}`}
                                                                                            >
                                                                                                <div className="min-w-0 flex-1 text-left">
                                                                                                    <p className={`text-[10px] font-black truncate leading-none uppercase text-left ${selectedDoc?.id === doc.id ? 'text-white' : 'text-slate-300'}`}>
                                                                                                        {doc.classification || doc.entity}
                                                                                                    </p>
                                                                                                    <div className="flex items-center gap-2 mt-1.5 text-left">
                                                                                                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md leading-none ${doc.isLegacy ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                                                                                            {doc.ref}
                                                                                                        </span>
                                                                                                        <span className="text-[7px] font-bold text-slate-600 truncate text-left">{doc.entity}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <ChevronRight size={10} className={`transition-all ${selectedDoc?.id === doc.id ? 'text-indigo-500 translate-x-0' : 'text-slate-800 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`}/>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 mt-auto border-t border-white/5 bg-slate-950/50 text-left">
                    <button 
                        onClick={() => setViewMode('IMPORT')} 
                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-center"
                    >
                        <FilePlus size={16}/> New Archive Entry
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 text-left">
                {viewMode === 'IMPORT' ? (
                    <div className="flex-1 overflow-y-auto p-10 lg:p-20 bg-slate-100 flex items-center justify-center no-scrollbar text-left">
                        <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-500 text-left">
                             <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-left text-left">
                                 <div>
                                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-left">Archive Management</span>
                                     <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-1 text-left">Dossier Ingestion</h2>
                                 </div>
                                 <button onClick={() => setViewMode('EXPLORER')} className="p-3 bg-white text-slate-400 rounded-full border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"><X/></button>
                             </div>
                             <div className="p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-16 text-left">
                                 <div className="space-y-8 text-left text-left">
                                     <div className="space-y-2 text-left">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">High-Res Attachment</label>
                                         <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`h-48 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${importForm.fileUrl ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-300'}`}
                                         >
                                             {isLoading ? (
                                                <div className="flex flex-col items-center gap-2 text-left"><Loader2 className="animate-spin text-indigo-600"/><span className="text-[8px] font-black text-left">NANOSCALING...</span></div>
                                             ) : importForm.fileUrl ? (
                                                <div className="flex flex-col items-center gap-2 text-emerald-600 text-left"><CheckCircle2 size={32}/><span className="text-[8px] font-black uppercase tracking-widest text-left">INGESTION READY</span></div>
                                             ) : (
                                                <div className="flex flex-col items-center gap-2 text-slate-300 text-left"><ImageIcon size={40}/><span className="text-[8px] font-black uppercase tracking-widest text-left">DROP FILE OR CLICK</span></div>
                                             )}
                                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload}/>
                                         </div>
                                     </div>
                                     <div className="space-y-2 text-left">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Record Date</label>
                                         <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={importForm.date} onChange={e => setImportForm({...importForm, date: e.target.value})}/>
                                     </div>
                                 </div>
                                 <div className="space-y-6 text-left text-left">
                                     <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Type</label>
                                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none appearance-none cursor-pointer text-left" value={importForm.type} onChange={e => setImportForm({...importForm, type: e.target.value as any})}>
                                                {['INVOICE', 'PO', 'RECEIPT', 'VOUCHER', 'QUOTATION', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 text-left">Sub-Classification</label>
                                            <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" placeholder="e.g. LTA PERMIT" value={importForm.classification} onChange={e => setImportForm({...importForm, classification: e.target.value})}/>
                                        </div>
                                     </div>
                                     <div className="space-y-2 text-left">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Primary Entity</label>
                                         <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" placeholder="VENDOR OR CLIENT NAME" value={importForm.entityName} onChange={e => setImportForm({...importForm, entityName: e.target.value})}/>
                                     </div>
                                     <div className="grid grid-cols-2 gap-4 text-left text-left">
                                         <div className="space-y-1 text-left text-left"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 text-left">Internal Ref</label><input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] font-black uppercase outline-none text-left" placeholder="REF-889" value={importForm.referenceNo} onChange={e => setImportForm({...importForm, referenceNo: e.target.value})}/></div>
                                         <div className="space-y-1 text-left text-left"><label className="text-[9px] font-black text-slate-400 uppercase ml-1 text-left">Value ($)</label><input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] outline-none text-left" placeholder="0.00" value={importForm.amount || ''} onChange={e => setImportForm({...importForm, amount: parseFloat(e.target.value)})}/></div>
                                     </div>
                                     <div className="space-y-2 text-left text-left">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Technical Notes</label>
                                         <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs outline-none h-20 resize-none text-left" placeholder="Historical context..." value={importForm.notes} onChange={e => setImportForm({...importForm, notes: e.target.value})}/>
                                     </div>
                                 </div>
                             </div>
                             <div className="p-10 border-t border-slate-50 bg-slate-50/50 text-left">
                                 <button onClick={submitLegacyImport} disabled={!importForm.fileUrl || isLoading} className="w-full py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 text-center">Commit To Perpetual Vault</button>
                             </div>
                        </div>
                    </div>
                ) : selectedDoc ? (
                    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in text-left">
                        <header className="p-6 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10 text-left">
                            <div className="flex items-center gap-6 text-left">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${selectedDoc.isLegacy ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {selectedDoc.type.substring(0,1)}
                                </div>
                                <div className="text-left text-left">
                                    <div className="flex items-center gap-2 text-left text-left">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none text-left">{selectedDoc.classification || selectedDoc.entity}</h3>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[7px] font-black uppercase border text-left ${selectedDoc.isLegacy ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                                            {selectedDoc.isLegacy ? 'LEGACY ARCHIVE' : 'LIVE ERP DOC'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 text-left">{selectedDoc.type} • {selectedDoc.ref} • {formatDateSG(selectedDoc.date)}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 text-left">
                                {selectedDoc.isLegacy && (
                                    <button onClick={() => handleDeleteLegacy(selectedDoc.sourceId)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-left"><Trash2 size={18}/></button>
                                )}
                                <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-black transition-all active:scale-95 text-center"><Download size={14}/> Save</button>
                            </div>
                        </header>

                        <div className="flex-1 overflow-hidden grid grid-cols-12 text-left">
                            {/* DETAILS PANEL (SIDEBAR) */}
                            <aside className="col-span-3 bg-slate-900 text-white overflow-y-auto no-scrollbar p-8 border-r border-white/5 space-y-8 text-left">
                                <div className="text-left">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 border-b border-white/10 pb-4 text-left">Dossier Specifications</h4>
                                    <div className="space-y-1 text-left">
                                        <MetadataRow label="Unique Entity" value={selectedDoc.entity} icon={Building2} />
                                        <MetadataRow label="Registry Reference" value={selectedDoc.ref} icon={Hash} />
                                        <MetadataRow label="Filing Date" value={formatDateSG(selectedDoc.date)} icon={Calendar} />
                                        <MetadataRow label="Valuation" value={formatCurrency(selectedDoc.amount)} icon={Wallet} />
                                        <MetadataRow label="Provenance" value={selectedDoc.isLegacy ? 'External Import' : 'Internal System'} icon={Archive} />
                                    </div>
                                </div>

                                {selectedDoc.classification && (
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-left">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none text-left">Technical Notes</p>
                                        <p className="text-[10px] font-medium text-slate-300 leading-relaxed uppercase text-left">{selectedDoc.classification}</p>
                                    </div>
                                )}

                                <div className="p-6 bg-indigo-600 rounded-3xl space-y-4 shadow-2xl text-left text-left text-left">
                                    <div className="flex items-center gap-3 text-left">
                                        <ShieldCheck className="text-indigo-200" size={20}/>
                                        <span className="text-[9px] font-black uppercase text-left">Verified Record</span>
                                    </div>
                                    <p className="text-[10px] text-white/80 font-medium leading-relaxed uppercase text-left">This document is permanently indexed in the Unified Vault and cannot be altered.</p>
                                </div>
                            </aside>

                            {/* MAIN PREVIEW PANEL */}
                            <div className="col-span-9 bg-slate-100 p-8 overflow-y-auto no-scrollbar relative text-left text-left">
                                {selectedDoc.fileUrl ? (
                                    <div className="w-full h-full bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative group text-left">
                                        {selectedDoc.fileUrl.startsWith('data:application/pdf') || selectedDoc.fileUrl.includes('/api/media/') ? (
                                            <iframe src={getMediaViewUrl(selectedDoc.fileUrl)} className="w-full h-full border-none" />
                                        ) : (
                                            <div className="w-full h-full overflow-auto no-scrollbar p-10 flex justify-center bg-slate-200/50 text-left text-left text-left">
                                                <img src={getMediaViewUrl(selectedDoc.fileUrl)} className="max-w-none shadow-2xl border-8 border-white rounded shadow-black/20" alt="Scanned Document" />
                                            </div>
                                        )}
                                    </div>
                                ) : selectedDoc.rawData ? (
                                    <div className="w-full flex justify-center text-left">
                                        <div className="scale-[0.85] origin-top shadow-2xl text-left">
                                            <DocLayout 
                                                doc={selectedDoc.rawData} 
                                                profile={profiles.find(p => p.id === selectedDoc.rawData.issuingCompanyId) || profiles[0]} 
                                                settings={settings}
                                                title={selectedDoc.type || 'DOCUMENT'} 
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-left text-left text-left">
                                        <div className="text-center space-y-6 text-left">
                                            <div className="p-10 bg-slate-50 text-slate-200 rounded-[3rem] w-fit mx-auto shadow-inner text-left"><FileText size={80}/></div>
                                            <div className="max-w-sm text-left">
                                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none text-left">Virtual Representation</h4>
                                                <p className="text-slate-400 font-medium text-sm mt-4 text-left leading-relaxed">This record was generated via metadata integration. No physical scan exists for this period, but a full audit breakdown is available above.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-50 relative text-left text-left">
                        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none overflow-hidden text-left">
                            <History size={500} className="absolute -bottom-20 -right-20 rotate-12 text-left" />
                        </div>
                        <div className="text-center space-y-8 relative z-10 group text-left">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center mx-auto text-slate-300 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 text-center"><Archive size={48}/></div>
                            <div className="max-w-md space-y-3 text-left text-left text-center">
                                <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter text-left">Consolidated Vault</h3>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed uppercase text-left">Search or discover archived site data from the left navigation panel.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};