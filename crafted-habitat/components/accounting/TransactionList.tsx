
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Project, TransactionCategory, RecurringFrequency, CompanySettings, Invoice, CompanyProfile } from '../../types';
import { 
  Plus, Trash2, X, Edit2, ChevronRight, ChevronDown, Folder, Search, Calendar, Briefcase, Bell, Eye, FileText, Share2, Download, Loader2
} from 'lucide-react';
import { formatCurrency, getInvoices, saveInvoices, getCompanyProfiles } from '../../utils';
import { ReminderModal } from '../ReminderModal';
import { DocLayout } from './InvoiceManager';

interface TransactionListProps {
  transactions: Transaction[];
  projects: Project[];
  settings: CompanySettings;
  isGstRegistered: boolean;
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction?: (t: Transaction) => void;
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  MATERIALS_PURCHASING: 'Materials Purchasing',
  LABOR_SUPPLY: 'Supply Labor',
  OTHER_EXPENSES: 'Other Office Expenses',
  VEHICLE_UPKEEP: 'Up Keep of Vehicle',
  SUB_CON_PAYMENTS: 'Sub-Con Payments',
  MONTHLY_SERVICE: 'Monthly Service',
  SURVEYORS_CLAIM: 'Surveyors Claim',
  SERVICE_RENTAL: 'Service Rental',
  RENTAL: 'Office Rental',
  ACCOUNTING_SERVICE: 'Accounting Service',
  CREDIT_NOTE: 'Credit Note',
  ONE_TIME_SERVICE: 'One Time Service',
  PROGRESS_CLAIM: 'Project Progress Claim (Income)',
  VO: 'Variation Order (Income)',
  RUBBISH_BIN: 'Rubbish Bin / Disposal',
  UTILITIES_BILLS: 'Utilities Bills',
  CLAIM: 'Staff/Reimbursement Claim (Expense)'
};

const INITIAL_FORM_STATE = {
  date: new Date().toISOString().split('T')[0],
  mainType: 'PROJECT' as 'PROJECT' | 'OFFICE',
  direction: 'EXPENSE' as 'INCOMING' | 'EXPENSE',
  category: TransactionCategory.MATERIALS_PURCHASING,
  amount: '',
  description: '',
  projectId: '',
  isGstInclusive: false,
  isRecurring: false,
  frequency: 'NONE' as RecurringFrequency,
};

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, projects, settings, addTransaction, deleteTransaction, updateTransaction 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
  const [viewingDocTx, setViewingDocTx] = useState<Transaction | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<Invoice | null>(null);
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  useEffect(() => {
    getCompanyProfiles().then(setProfiles);
  }, []);

  const sums = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const val = Number(t.totalAmount) || 0;
      if (t.type === 'INCOMING') {
        acc.incoming += val;
        acc.balance += val;
      } else {
        acc.expense += val;
        acc.balance -= val;
      }
      return acc;
    }, { incoming: 0, expense: 0, balance: 0 });
  }, [transactions]);

  const toggleYear = (year: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  const dateTree = useMemo(() => {
    const tree: any = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear().toString();
      const month = d.toLocaleString('default', { month: 'long' });
      if (!tree[year]) tree[year] = {};
      if (!tree[year][month]) tree[year][month] = {};
      if (!tree[year][month][t.date]) tree[year][month][t.date] = [];
      tree[year][month][t.date].push(t);
    });
    return tree;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) && 
      (!selectedDate || t.date === selectedDate)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedDate, searchTerm]);

  const startNewEntry = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
    setShowForm(true);
  };

  const handleViewDocument = async (tx: Transaction) => {
      setViewingDocTx(tx);
      const invoices = await getInvoices();
      /* Fix: referenceId property now exists on type 'Invoice' via types.ts update */
      const linked = invoices.find(i => i.id === `INV_TX_${tx.id}` || i.referenceId === tx.id);
      setLinkedInvoice(linked || null);
  };

  const handleGenerateInvoice = async () => {
    if (!viewingDocTx) return;
    setIsGeneratingDoc(true);
    try {
        const project = projects.find(p => p.id === viewingDocTx.projectId);
        const newInv: Invoice = {
            id: `INV_TX_${viewingDocTx.id}`,
            type: viewingDocTx.type === 'INCOMING' ? 'AR' : 'AP',
            invoiceNo: `INV-${viewingDocTx.id.substring(0, 5).toUpperCase()}`,
            date: viewingDocTx.date,
            dueDate: viewingDocTx.date,
            entityName: (project?.client || 'CLIENT ENTITY').toUpperCase(),
            items: [{
                id: '1',
                type: 'STANDARD',
                description: viewingDocTx.description.toUpperCase(),
                quantity: 1,
                unitPrice: viewingDocTx.amount,
                amount: viewingDocTx.amount
            }],
            subtotal: viewingDocTx.amount,
            gstAmount: viewingDocTx.gstAmount || 0,
            totalAmount: viewingDocTx.totalAmount,
            status: 'PAID',
            projectId: viewingDocTx.projectId,
            /* Fix: referenceId property now recognized on type 'Invoice' */
            referenceId: viewingDocTx.id
        };
        const current = await getInvoices();
        await saveInvoices([newInv, ...current]);
        setLinkedInvoice(newInv);
    } finally {
        setIsGeneratingDoc(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const baseAmount = parseFloat(formData.amount);
    if (isNaN(baseAmount)) return;

    const txData: Transaction = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      date: formData.date,
      type: formData.direction,
      category: formData.category,
      amount: baseAmount,
      gstAmount: 0,
      totalAmount: baseAmount,
      description: formData.description.toUpperCase(),
      projectId: formData.mainType === 'PROJECT' ? formData.projectId : undefined,
      isGstInclusive: formData.isGstInclusive,
      isRecurring: formData.isRecurring,
      frequency: formData.frequency,
      createdAt: new Date().toISOString()
    };

    if (editingId && updateTransaction) updateTransaction(txData);
    else addTransaction(txData);
    setShowForm(false);
    setFormData(INITIAL_FORM_STATE);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in overflow-hidden">
      <aside className="w-80 shrink-0 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Calendar size={18}/></div>
          <h3 className="text-sm font-black text-slate-800 uppercase">Archive Hub</h3>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
            <button onClick={() => setSelectedDate(null)} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase transition-all mb-4 border-2 ${!selectedDate ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-inner' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>View Full Record</button>
            {Object.keys(dateTree).sort((a,b)=>b.localeCompare(a)).map(year => (
                <div key={year} className="mb-1">
                    <button onClick={() => toggleYear(year)} className="w-full flex items-center gap-2 p-2 text-slate-700 font-black uppercase text-[10px] hover:bg-slate-50 rounded-lg">
                        {expandedNodes.has(year) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} <Folder size={14} className="text-amber-400"/> {year}
                    </button>
                    {expandedNodes.has(year) && (
                        <div className="ml-4 border-l border-slate-100 pl-2">
                            {Object.keys(dateTree[year]).map(month => (
                                <div key={month}>
                                    <p className="px-2 py-1 text-[8px] font-black text-slate-300 uppercase mt-1">{month}</p>
                                    {Object.keys(dateTree[year][month]).map(day => (
                                        <button key={day} onClick={() => setSelectedDate(day)} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black mt-0.5 ${selectedDate === day ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>{day}</button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="p-6 bg-slate-900 text-white">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Net Ledger Balance</p>
            <p className={`text-xl font-black ${sums.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(sums.balance)}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm shrink-0">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">General Ledger Feed</h2>
            <div className="flex items-center gap-4">
                <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/><input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="Keywords..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                <button onClick={startNewEntry} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">New Entry</button>
            </div>
        </header>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col text-left">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                    <tr><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Detail</th><th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th><th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th><th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Tools</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6"><p className="text-sm font-black text-slate-900 uppercase leading-tight">{tx.description}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{tx.date}</p></td>
                            <td className="px-6 py-6"><span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${tx.type === 'INCOMING' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{CATEGORY_LABELS[tx.category] || tx.category}</span></td>
                            <td className={`px-6 py-6 text-right font-black tabular-nums ${tx.type === 'INCOMING' ? 'text-emerald-600' : 'text-slate-900'}`}>{tx.type === 'INCOMING' ? '+' : '-'}{formatCurrency(tx.totalAmount)}</td>
                            <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleViewDocument(tx)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-indigo-600 transition-all shadow-sm border border-transparent hover:border-indigo-100"><Eye size={16}/></button>
                                    <button onClick={() => {setEditingId(tx.id); setFormData({date:tx.date, mainType:tx.projectId?'PROJECT':'OFFICE', direction:tx.type as any, category:tx.category, amount:tx.totalAmount.toString(), description:tx.description, projectId:tx.projectId||'', isGstInclusive:tx.isGstInclusive, isRecurring:tx.isRecurring, frequency:tx.frequency}); setShowForm(true);}} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"><Edit2 size={16}/></button>
                                    <button onClick={() => deleteTransaction(tx.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
            </div>
        </div>
      </div>

      <ReminderModal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title={formData.description || "Ledger Entry"} onReminderSet={() => {}} />

      {viewingDocTx && (
          <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex flex-col animate-fade-in text-left">
               <header className="p-8 border-b border-white/5 flex justify-between items-center text-white shrink-0">
                   <div className="flex items-center gap-6">
                       <button onClick={() => setViewingDocTx(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left"><X size={24}/></button>
                       <div className="text-left">
                          <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-left">{viewingDocTx.description}</h3>
                          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-2 text-left">LEDGER REFERENCE • {viewingDocTx.date}</p>
                       </div>
                   </div>
                   <div className="flex gap-3">
                      {!linkedInvoice ? (
                          <button onClick={handleGenerateInvoice} disabled={isGeneratingDoc} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                            {isGeneratingDoc ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18}/>} 
                            Generate Tax Invoice
                          </button>
                      ) : (
                        <button onClick={async () => {
                             const element = document.getElementById('tx-doc-area');
                             if (!element) return;
                             const opt = { margin: 0, filename: `Invoice_${linkedInvoice.invoiceNo}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
                             // @ts-ignore
                             if (window.html2pdf) await window.html2pdf().set(opt).from(element).save();
                        }} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-100 transition-all active:scale-95"><Download size={18}/> Export PDF</button>
                      )}
                   </div>
               </header>
               <div className="flex-1 overflow-y-auto no-scrollbar p-10 flex justify-center bg-slate-900/50">
                  {linkedInvoice ? (
                    <div className="origin-top scale-[0.9] lg:scale-[1]">
                        <DocLayout 
                            doc={linkedInvoice} 
                            profile={profiles[0]} 
                            settings={settings}
                            title="TAX INVOICE" 
                            id="tx-doc-area"
                        />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-20 bg-white/5 rounded-[3rem] border border-white/5 max-w-2xl mx-auto h-fit my-auto">
                        <div className="w-20 h-20 bg-indigo-600/20 text-indigo-400 rounded-3xl flex items-center justify-center mb-8"><FileText size={40}/></div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight text-center">Digital Paperwork Pending</h4>
                        <p className="text-slate-400 text-center mt-4 leading-relaxed uppercase font-bold text-sm">This entry does not have a formal document linked to it. Click Generate to build a Tax Invoice using this transaction's metadata.</p>
                    </div>
                  )}
               </div>
          </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{editingId ? 'Modify Record' : 'New Transaction'}</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowReminderModal(true)} className="p-2 text-indigo-600 bg-white rounded-full shadow-sm border border-slate-100 hover:bg-indigo-50 transition-colors"><Bell size={20}/></button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-2 text-slate-400 bg-white rounded-full shadow-sm border border-slate-100 hover:text-slate-800 transition-colors"><X size={20}/></button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button type="button" onClick={() => setFormData({...formData, direction: 'INCOMING'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.direction === 'INCOMING' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>INCOMING</button>
                  <button type="button" onClick={() => setFormData({...formData, direction: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.direction === 'EXPENSE' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400'}`}>EXPENSE</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold outline-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount ($)</label><input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 rounded-2xl bg-white border-2 border-indigo-100 text-sm font-black text-indigo-700 outline-none" /></div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none">
                    {Object.values(TransactionCategory).map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>)}
                  </select>
                </div>
                {formData.mainType === 'PROJECT' && (
                  <div className="space-y-1 animate-fade-in"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign to Site</label><select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                )}
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Particulars</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-medium h-24 uppercase outline-none resize-none focus:ring-4 focus:ring-indigo-500/5" /></div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Commit to Ledger</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
