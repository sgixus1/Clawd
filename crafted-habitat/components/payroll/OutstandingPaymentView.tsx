import React, { useState, useMemo } from 'react';
import { OutstandingPayment, CompanySettings, Transaction, TransactionCategory } from '../../types';
import { savePayments, getTransactions, saveTransactions } from '../../utils';
import { formatCurrency } from '../../utils';
import { 
  DollarSign, Trash2, FileText, Calendar, CheckCircle2, Clock, X, 
  Search, Folder, ChevronRight, ChevronDown, ListOrdered, Plus, 
  ShieldCheck, Loader2, Archive 
} from 'lucide-react';

interface OutstandingViewProps {
  payments: OutstandingPayment[];
  onUpdate: () => void;
  settings: CompanySettings;
}

export const OutstandingView: React.FC<OutstandingViewProps> = ({ payments, onUpdate, settings }) => {
  const [activeListType, setActiveListType] = useState<'OUTSTANDING' | 'PAID'>('OUTSTANDING');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newPay, setNewPay] = useState<Partial<OutstandingPayment>>({
    category: 'Material',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [paymentModal, setPaymentModal] = useState<OutstandingPayment | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');

  const dateTree = useMemo(() => {
    const tree: any = {};
    const filtered = payments.filter(p => activeListType === 'PAID' ? p.isPaid : !p.isPaid);
    
    filtered.forEach(p => {
      const recordDateStr = p.date || p.dueDate;
      if (!recordDateStr) return;
      const date = new Date(recordDateStr);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear().toString();
      const month = date.toLocaleString('default', { month: 'long' });
      const day = recordDateStr;
      if (!tree[year]) tree[year] = {};
      if (!tree[year][month]) tree[year][month] = {};
      if (!tree[year][month][day]) tree[year][month][day] = [];
      tree[year][month][day].push(p);
    });
    return tree;
  }, [payments, activeListType]);

  const toggleNode = (node: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!newPay.payee || !newPay.amount) {
        alert("Please enter at least a Payee and Amount.");
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    const p: OutstandingPayment = {
      id: 'MAN_' + Date.now(),
      date: newPay.date || today,
      dueDate: newPay.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payee: newPay.payee.toUpperCase(),
      amount: Number(newPay.amount),
      paidAmount: 0,
      description: (newPay.description || '').toUpperCase(),
      invoiceNumber: (newPay.invoiceNumber || '').toUpperCase(),
      category: newPay.category || 'Other',
      isPaid: false
    };
    await savePayments([...payments, p]);
    setNewPay({ 
        category: 'Material',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowAddForm(false);
    onUpdate();
  };

  const handleSettle = async () => {
    if (!paymentModal) return;
    setIsSettling(true);
    try {
        const amt = parseFloat(payAmount) || 0;
        const updated = payments.map(p => {
            if (p.id === paymentModal.id) {
                const totalPaid = (p.paidAmount || 0) + amt;
                return { ...p, paidAmount: totalPaid, isPaid: totalPaid >= (p.amount - 0.01) };
            }
            return p;
        });
        await savePayments(updated);
        
        const transactions = await getTransactions();
        const newTx: Transaction = {
            id: 'TX_' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'EXPENSE',
            category: TransactionCategory.OTHER_EXPENSES,
            amount: amt,
            gstAmount: 0,
            totalAmount: amt,
            description: `PAYMENT TO ${paymentModal.payee}`,
            isGstInclusive: false,
            isRecurring: false,
            frequency: 'NONE',
            createdAt: new Date().toISOString()
        };
        await saveTransactions([newTx, ...transactions]);

        setPaymentModal(null);
        onUpdate();
    } finally {
        setIsSettling(false);
    }
  };

  const visiblePayments = useMemo(() => {
    return payments.filter(p => (activeListType === 'PAID' ? p.isPaid : !p.isPaid) && 
      (!selectedDate || (p.date || p.dueDate) === selectedDate) &&
      (p.payee.toLowerCase().includes(searchTerm.toLowerCase()) || (p.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => new Date(a.dueDate || a.date).getTime() - new Date(b.dueDate || b.date).getTime());
  }, [payments, selectedDate, activeListType, searchTerm]);

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in overflow-hidden">
      <aside className="w-80 shrink-0 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><ListOrdered size={18}/> Registry History</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => { setActiveListType('OUTSTANDING'); setSelectedDate(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${activeListType === 'OUTSTANDING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>PENDING</button>
                <button onClick={() => { setActiveListType('PAID'); setSelectedDate(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${activeListType === 'PAID' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>SETTLED</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
            <button onClick={() => setSelectedDate(null)} className={`w-full text-left px-4 py-3 rounded-xl text-[11px] font-black uppercase transition-all mb-4 border-2 ${!selectedDate ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-inner' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}>
                <span>View Full Record</span>
            </button>
            {Object.keys(dateTree).sort((a,b) => b.localeCompare(a)).map(year => (
                <div key={year} className="mb-1">
                    <button onClick={() => toggleNode(year)} className="w-full flex items-center gap-2 p-2 text-slate-700 font-black uppercase text-[10px] hover:bg-slate-50 rounded-lg">
                        {expandedNodes.has(year) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} <Folder size={14} className="text-amber-400"/> {year}
                    </button>
                    {expandedNodes.has(year) && (
                        <div className="ml-4 border-l border-slate-100 pl-2">
                            {Object.keys(dateTree[year]).map(month => (
                                <div key={month}>
                                    <p className="px-2 py-1 text-[8px] font-black text-slate-300 uppercase mt-1 text-left">{month}</p>
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
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 text-left">Exposure Sum</p>
            <p className="text-2xl font-black tabular-nums text-left">{formatCurrency(visiblePayments.reduce((s,p)=>s+p.amount, 0))}</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Accounts Payable</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1 text-left">Reviewing {activeListType} entries</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                  <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                  <Plus size={18}/> New Bill
                </button>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {visiblePayments.map(p => {
                const balance = p.amount - p.paidAmount;
                return (
                    <div key={p.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-6 group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${p.isPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${p.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>{(p.category || 'N/A').substring(0,3).toUpperCase()}</div>
                            <div className="min-w-0 text-left">
                              <h4 className="font-black text-slate-900 text-lg uppercase truncate">{p.payee}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
                                <FileText size={12}/> {p.invoiceNumber || 'NO-REF'} • DUE: {p.dueDate}
                              </p>
                            </div>
                        </div>
                        <div className="text-right flex items-center gap-6">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</p><p className="text-xl font-black text-slate-900">{formatCurrency(p.amount)}</p></div>
                            <div className="flex gap-2">
                                {!p.isPaid && <button onClick={() => { setPaymentModal(p); setPayAmount(balance.toFixed(2)); }} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-emerald-700 transition-all">Settle</button>}
                                <button onClick={() => { if(confirm('Delete record?')) { savePayments(payments.filter(it=>it.id!==p.id)); onUpdate(); } }} className="p-2.5 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                            </div>
                        </div>
                    </div>
                );
            })}
            {visiblePayments.length === 0 && (
                <div className="py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 shadow-inner">
                        <Archive size={64}/>
                    </div>
                    <div className="mt-4">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl">No Records Found</h4>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">No bills found matching your selection.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30 text-left">
                    <div><span className="text-[10px] font-black text-indigo-600 uppercase">Accounts Payable</span><h3 className="text-2xl font-black text-slate-900">New Bill Entry</h3></div>
                    <button onClick={() => setShowAddForm(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm"><X size={24}/></button>
                </div>
                <div className="p-8 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Payee Entity</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newPay.payee || ''} onChange={e => setNewPay({...newPay, payee: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Invoice Ref</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newPay.invoiceNumber || ''} onChange={e => setNewPay({...newPay, invoiceNumber: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Amount ($)</label><input type="number" className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl text-xl font-black text-indigo-700 outline-none" value={newPay.amount || ''} onChange={e => setNewPay({...newPay, amount: Number(e.target.value)})} /></div>
                      <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 ml-1">Due Date</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newPay.dueDate} onChange={e => setNewPay({...newPay, dueDate: e.target.value})} /></div>
                    </div>
                    <button onClick={handleAdd} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase shadow-2xl transition-all hover:bg-black">Register Bill</button>
                </div>
            </div>
        </div>
      )}

      {paymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
                  <div className="p-8 border-b border-slate-50 bg-emerald-50/30 flex justify-between items-center text-left">
                      <h3 className="text-xl font-black text-slate-900 uppercase">Process Payout</h3>
                      <button onClick={() => setPaymentModal(null)} className="p-2 bg-white rounded-full text-slate-400 shadow-sm hover:text-slate-800 transition-colors"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6 text-left">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Disbursement Amount ($)</label>
                          <input type="number" autoFocus disabled={isSettling} className="w-full px-4 py-3 bg-white border-2 border-emerald-100 rounded-2xl text-lg font-black text-emerald-600 outline-none shadow-inner" value={payAmount} onChange={e => setPayAmount(e.target.value)}/>
                      </div>
                      <button disabled={isSettling} onClick={handleSettle} className="w-full py-4 bg-emerald-600 text-white rounded-3xl font-black uppercase text-sm shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                        {isSettling ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20}/>} 
                        {isSettling ? 'Processing...' : 'Settle Bill'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};