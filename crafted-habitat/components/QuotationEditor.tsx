import React, { useState, useMemo, useEffect } from 'react';
import { Item, QuoteItem, SavedQuotation, CompanyDetails, ClientDetails, CompanyProfile } from '../types';
import { Button } from './Button';
import { 
  Plus, Trash2, Save, X, Download, FileText, Search, PlusCircle, 
  LayoutGrid, ChevronRight, Building2, UserCheck, Stamp, Info, 
  Loader2, MinusCircle, User, AlignLeft, Users, Calculator,
  ArrowRightLeft, Layers, MoreHorizontal
} from 'lucide-react';
import { getCompanyProfiles, getMediaViewUrl } from '../utils';
import { SAMPLE_TERMS, SAMPLE_EXCLUSIONS, GST_RATE } from '../constants';

export const QuotationEditor: React.FC<{
  items: Item[];
  company: CompanyDetails;
  client: ClientDetails;
  clients: any[];
  loadedQuotation?: SavedQuotation | null;
  onSaveQuotation: (data: Partial<SavedQuotation>) => void;
  onUpdateClient: (client: ClientDetails) => void;
}> = ({ items, company, client, clients, loadedQuotation, onSaveQuotation, onUpdateClient }) => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [projectTitle, setProjectTitle] = useState('PROPOSED ADDITIONS AND ALTERATIONS WORKS');
  const [quoteRef, setQuoteRef] = useState(`Q-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedSignatoryId, setSelectedSignatoryId] = useState<string>('');
  
  const [terms, setTerms] = useState<string[]>(SAMPLE_TERMS);
  const [exclusions, setExclusions] = useState<string[]>(SAMPLE_EXCLUSIONS);
  
  // Fix: Explicitly using string[] to avoid unknown type errors
  const [internalNotesList, setInternalNotesList] = useState<string[]>([
    'PRICING INCLUDES ALL NECESSARY LABOR, TOOLS, AND CONSTRUCTION',
    'MANAGEMENT AS SPECIFIED IN THE CATEGORICAL BREAKDOWN ABOVE.',
    'ALL QUANTITIES ARE ESTIMATES AND SUBJECT TO FINAL SITE',
    'MANAGEMENT AS SPECIFIED IN THE CATEGORICAL BREAKDOWN ABOVE.',
    'ALL QUANTITIES ARE ESTIMATES AND SUBJECT TO FINAL SITE',
    'MEASUREMENT UPON PROJECT COMPLETION.',
    '',
    ''
  ]);

  useEffect(() => {
    getCompanyProfiles().then((data) => setProfiles(data || []));
  }, []);

  useEffect(() => {
    if (loadedQuotation) {
      setQuoteItems(loadedQuotation.items || []);
      setProjectTitle(loadedQuotation.projectTitle || '');
      setQuoteRef(loadedQuotation.ref || '');
      setTerms(loadedQuotation.terms || SAMPLE_TERMS);
      setExclusions(loadedQuotation.exclusions || SAMPLE_EXCLUSIONS);
      if (Array.isArray(loadedQuotation.internalNotes)) {
          // Fix: Proper casting of internalNotes to string[]
          const notesArray = loadedQuotation.internalNotes as string[];
          const final = [...notesArray, ...Array(6).fill('')].slice(0, 6);
          setInternalNotesList(final);
      }
      setSelectedSignatoryId(loadedQuotation.signatoryId || '');
    }
  }, [loadedQuotation]);

  const activeIssuer = useMemo(() => 
    profiles.find(p => p.id === selectedProfileId) || (company as any),
  [profiles, selectedProfileId, company]);

  const activeSignatory = useMemo(() => {
      const staff = company.supervisors || [];
      return staff.find(s => s.id === selectedSignatoryId) || null;
  }, [company.supervisors, selectedSignatoryId]);

  const filteredMasterItems = items.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, QuoteItem[]> = {};
    quoteItems.forEach(it => {
        const cat = it.category || 'GENERAL WORKS';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(it);
    });
    return groups;
  }, [quoteItems]);

  const subtotal = quoteItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const gst = subtotal * GST_RATE;
  const total = subtotal + gst;

  const handleAddItem = (item: Item) => {
    const newItem: QuoteItem = {
      ...item,
      quantity: 1,
      total: item.unitPrice
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const updateItemQty = (id: string, qty: number) => {
    setQuoteItems(prev => prev.map(it => 
        it.id === id ? { ...it, quantity: qty, total: Number((qty * it.unitPrice).toFixed(2)) } : it
    ));
  };

  const updateItemPrice = (id: string, price: number) => {
    setQuoteItems(prev => prev.map(it => 
        it.id === id ? { ...it, unitPrice: price, total: Number((it.quantity * price).toFixed(2)) } : it
    ));
  };

  const moveItemCategory = (id: string, newCat: string) => {
      setQuoteItems(prev => prev.map(it => it.id === id ? { ...it, category: newCat } : it));
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('quotation-print-area');
    if (!element) return;
    setIsGenerating(true);
    const opt = { 
      margin: [10, 0, 10, 0], 
      filename: `Quote_${quoteRef}.pdf`, 
      image: { type: 'jpeg', quality: 0.98 }, 
      html2canvas: { scale: 2, useCORS: true, letterRendering: true }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    try {
        // @ts-ignore
        await html2pdf().set(opt).from(element).save();
    } finally {
        setIsGenerating(false);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="flex h-screen overflow-hidden text-left bg-slate-50">
      {/* Sidebar Selector */}
      <aside className="w-[380px] bg-white border-r border-slate-200 flex flex-col p-6 no-print shrink-0 shadow-lg z-10">
        <div className="mb-6">
            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase tracking-widest text-xs mb-4">
                <Layers size={18} className="text-indigo-600" /> Catalog Repository
            </h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by Trade or Code..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
          {filteredMasterItems.map(item => (
            <div 
              key={item.id} 
              className="p-4 border border-slate-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer group transition-all relative overflow-hidden"
              onClick={() => handleAddItem(item)}
            >
              <div className="flex justify-between items-start mb-2">
                 <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{item.category}</span>
                 <span className="text-[10px] font-mono text-slate-300">#{item.code}</span>
              </div>
              <p className="text-[11px] font-black text-slate-700 leading-tight uppercase line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 group-hover:border-indigo-100">
                 <p className="text-[10px] font-black text-slate-900">${item.unitPrice.toLocaleString()}/{item.unit}</p>
                 <PlusCircle size={18} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Drafting Desk */}
      <main className="flex-1 overflow-y-auto p-10 no-scrollbar bg-slate-50">
        <div className="max-w-[210mm] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl gap-6 sticky top-0 z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Entity Branding</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/5" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                        <option value="">Default Profile</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Authorized Signatory</label>
                    <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/5" value={selectedSignatoryId} onChange={e => setSelectedSignatoryId(e.target.value)}>
                        <option value="">Choose Personnel...</option>
                        {company.supervisors?.filter(s => s.role === 'STAFF').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Client CRM</label>
                    <select className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase outline-none shadow-lg shadow-indigo-200" onChange={e => {
                        const c = clients.find(cl => cl.id === e.target.value);
                        if (c) onUpdateClient(c);
                    }}>
                        <option value="">Load Recipient...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating} className="rounded-2xl border-slate-200 font-black uppercase text-[10px] tracking-widest h-12 px-6">
                {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} Export PDF
              </Button>
              <Button onClick={() => onSaveQuotation({ items: quoteItems, projectTitle, ref: quoteRef, terms, exclusions, internalNotes: internalNotesList, signatoryId: selectedSignatoryId })} className="rounded-2xl bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest h-12 px-8 shadow-2xl">
                Archive Draft
              </Button>
            </div>
          </div>

          {/* Simulation Area */}
          <div id="quotation-print-area" className="bg-white shadow-2xl px-[20mm] py-[15mm] text-slate-900 text-[10px] leading-tight relative w-[210mm] mx-auto box-border block h-auto min-h-[297mm]">
            <header className="flex justify-between items-start border-b-4 border-slate-900 pb-4 mb-8">
              <div className="space-y-2 text-left">
                {activeIssuer.logoUrl && <img src={getMediaViewUrl(activeIssuer.logoUrl)} className="h-12 w-auto object-contain mb-3" alt="Logo" />}
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{activeIssuer.name}</h1>
                <div className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed max-w-sm">
                    <p>{activeIssuer.address}</p>
                    <p className="mt-1 text-slate-900">UEN: {activeIssuer.uen || (activeIssuer as any).registrationNumber} | TEL: {activeIssuer.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-slate-100 tracking-tighter uppercase leading-none mb-4">QUOTATION</h2>
                <div className="space-y-1 font-black uppercase">
                  <p><span className="text-slate-300">DATE:</span> {new Date().toLocaleDateString('en-SG')}</p>
                  <p><span className="text-slate-300">REF:</span> {quoteRef}</p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-12 mb-10 text-left">
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] border-b-2 border-indigo-50 w-fit pb-1">BILL TO:</h4>
                <p className="font-black text-lg uppercase tracking-tight leading-none">{client.company || client.name}</p>
                <p className="text-[9px] text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{client.address}</p>
                <p className="text-[10px] font-black text-slate-900 uppercase pt-2">Attn: {client.name}</p>
              </div>
              <div className="space-y-3">
                <h4 className="text-[9px] font-black text-slate-900 uppercase underline tracking-widest pb-1">PROJECT SCOPE:</h4>
                <div className="space-y-1">
                   {projectTitle.split('\n').map((line, idx) => (
                      <input 
                        key={idx}
                        className="w-full bg-slate-50 border-none px-2 py-1 focus:ring-0 font-black text-slate-900 text-[10px] uppercase outline-none leading-tight block rounded no-print"
                        value={line}
                        onChange={e => {
                            const lines = projectTitle.split('\n');
                            lines[idx] = e.target.value.toUpperCase();
                            setProjectTitle(lines.join('\n'));
                        }}
                      />
                   ))}
                   <div className="hidden print:block font-black text-[10px] uppercase leading-relaxed whitespace-pre-wrap">{projectTitle}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              {Object.entries(groupedItems).map(([cat, its], idx) => (
                  <div key={cat} className="space-y-2 text-left page-break-inside-avoid">
                    <div className="bg-slate-900 text-white px-5 py-2 rounded-xl flex justify-between items-center shadow-lg">
                        <h5 className="font-black uppercase tracking-[0.2em] text-[9px]">{String.fromCharCode(65 + idx)}. {cat}</h5>
                    </div>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="py-2 px-3 text-left w-10">NO</th>
                                <th className="py-2 px-3 text-left">DESCRIPTION OF WORKS</th>
                                <th className="py-2 px-3 text-center w-16">UNIT</th>
                                <th className="py-2 px-3 text-center w-20">QTY</th>
                                <th className="py-2 px-3 text-right w-28">RATE ($)</th>
                                <th className="py-2 px-3 text-right w-32">TOTAL ($)</th>
                            </tr>
                        </thead>
                        <tbody className="font-bold text-slate-700">
                            {its.map((it, i) => (
                                <tr key={it.id} className="group hover:bg-indigo-50/50 transition-colors border-b border-slate-50">
                                    <td className="py-3 px-3 text-slate-300 font-mono text-[9px]">{i + 1}</td>
                                    <td className="py-3 px-3 text-slate-900 uppercase leading-snug text-[9px] group relative">
                                        {it.description}
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all no-print">
                                            <button onClick={() => {
                                                const nextCat = categories[(categories.indexOf(it.category) + 1) % categories.length];
                                                moveItemCategory(it.id, nextCat);
                                            }} className="p-1 bg-white border border-slate-200 rounded shadow-sm text-indigo-600 hover:bg-indigo-600 hover:text-white"><ArrowRightLeft size={10}/></button>
                                            <button onClick={() => setQuoteItems(prev => prev.filter(x => x.id !== it.id))} className="p-1 bg-white border border-slate-200 rounded shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 size={10}/></button>
                                        </div>
                                    </td>
                                    <td className="py-3 px-3 text-center text-[8px] text-slate-400 uppercase">{it.unit}</td>
                                    <td className="py-3 px-3 text-center">
                                        <input type="number" className="w-14 text-center border-none bg-slate-50 rounded p-1 font-black text-[10px] no-print" value={it.quantity} onChange={(e) => updateItemQty(it.id, parseFloat(e.target.value) || 0)} />
                                        <span className="hidden print:inline font-black text-[10px]">{it.quantity}</span>
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                        <input type="number" className="w-20 text-right border-none bg-slate-50 rounded p-1 font-black text-[10px] no-print text-indigo-600" value={it.unitPrice} onChange={(e) => updateItemPrice(it.id, parseFloat(e.target.value) || 0)} />
                                        <span className="hidden print:inline tabular-nums text-[10px]">${it.unitPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-black text-slate-900 tabular-nums text-[10px]">${it.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              ))}
            </div>

            <div className="flex flex-row justify-between items-start gap-12 my-10 page-break-inside-avoid">
               <div className="flex-1 text-left relative min-w-0">
                  <div className="text-[10px] font-black uppercase text-slate-900 underline tracking-widest mb-3 flex items-center gap-2">
                    <Info size={12} className="text-indigo-600 no-print" /> Summary of Qualifications
                  </div>
                  <div className="space-y-1">
                      {/* Fix: Using explicit mapping and state updates for internalNotesList to resolve typing issues */}
                      {internalNotesList.map((note, idx) => (
                          <div key={idx} className="flex gap-2 items-start py-0.5">
                              <span className="w-4 shrink-0 text-[10px] font-black text-slate-300">{idx === 0 ? '1.' : ''}</span>
                              <input 
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[9px] text-slate-700 font-bold uppercase outline-none no-print"
                                value={note}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const val = e.target.value;
                                    setInternalNotesList((prev) => {
                                        const next = [...prev];
                                        next[idx] = val;
                                        return next;
                                    });
                                }}
                              />
                              <div className="hidden print:block text-[9px] text-slate-700 font-bold uppercase leading-relaxed">{note}</div>
                          </div>
                      ))}
                  </div>
               </div>
               <div className="w-80 space-y-1.5 border-t-4 border-slate-900 pt-3 text-right shrink-0">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-2">
                  <span>Gross Subtotal</span>
                  <span className="tabular-nums text-slate-900">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {activeIssuer.isGstRegistered && (
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 px-2">
                        <span>GST (9%) - {activeIssuer.uen}</span>
                        <span className="tabular-nums text-slate-900">${gst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                )}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-2xl mt-4 border-l-8 border-indigo-500">
                  <span className="font-black uppercase tracking-widest text-[10px]">NET TENDER SUM</span>
                  <span className="font-black text-2xl tabular-nums tracking-tighter">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mt-20 items-start page-break-inside-avoid pt-10 border-t border-slate-100">
                <div className="flex flex-col text-left">
                    <div className="h-20 flex flex-col justify-start">
                        <p className="font-black text-slate-900 italic uppercase text-[11px] tracking-tight">AGREED & ACCEPTED BY ,</p>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-3 min-w-[240px]">
                        <p className="text-[10px] font-black uppercase tracking-widest">CLIENT'S SIGNATURE / DATE</p>
                    </div>
                </div>
                <div className="flex flex-col relative text-left">
                    <div className="h-20 flex flex-col justify-start relative">
                        <p className="italic text-slate-600 font-bold text-[11px]">Yours faithfully,</p>
                        <p className="font-black text-slate-900 text-[13px] mt-1 uppercase tracking-tight">{activeIssuer.name}</p>
                        <div className="absolute left-10 bottom-[-30px] z-0 opacity-40">
                            {activeIssuer.stampUrl && <img src={getMediaViewUrl(activeIssuer.stampUrl)} crossOrigin="anonymous" className="w-24 h-24 object-contain rotate-12" alt="Stamp" />}
                        </div>
                        <div className="absolute left-[-20px] top-[-40px] z-10">
                            {activeSignatory?.signatureUrl && <img src={getMediaViewUrl(activeSignatory.signatureUrl)} crossOrigin="anonymous" className="w-[200px] h-24 object-contain" alt="Signature" />}
                        </div>
                    </div>
                    <div className="border-t-2 border-slate-900 pt-3 relative z-20 min-w-[240px]">
                        <p className="text-[10px] font-black uppercase tracking-widest">AUTHORIZED SIGNATURE</p>
                        <div className="mt-2 text-[9px] font-bold text-slate-500 uppercase space-y-0.5">
                            <p>NAME: {activeSignatory?.name || '____________________'}</p>
                            <p>TITLE: {activeSignatory?.title || 'System Administrator'}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};