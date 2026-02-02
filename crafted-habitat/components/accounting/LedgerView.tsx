
import React, { useState } from 'react';
import { Transaction, TransactionType, TransactionCategory } from '../../types';
import { Button } from '../Button';
import { Search, Plus, Trash2, Download, Filter, Landmark } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface LedgerViewProps {
  transactions: Transaction[];
  onUpdate: (data: Transaction[]) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({ transactions, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'EXPENSE',
    category: TransactionCategory.OTHER_EXPENSES,
    date: new Date().toISOString().split('T')[0],
    amount: 0
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this ledger entry?")) {
        onUpdate(transactions.filter(t => t.id !== id));
    }
  };

  const handleAdd = () => {
      if (!newTx.amount || !newTx.description) return;
      const entry: Transaction = {
          id: Date.now().toString(),
          date: newTx.date!,
          type: newTx.type as TransactionType,
          category: newTx.category as TransactionCategory,
          amount: Number(newTx.amount),
          description: newTx.description!,
          gstAmount: 0,
          totalAmount: Number(newTx.amount),
          isGstInclusive: false,
          isRecurring: false,
          frequency: 'NONE',
          createdAt: new Date().toISOString()
      };
      onUpdate([entry, ...transactions]);
      setShowAddModal(false);
      setNewTx({
        type: 'EXPENSE',
        category: TransactionCategory.OTHER_EXPENSES,
        date: new Date().toISOString().split('T')[0],
        amount: 0
      });
  };

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Ledger</h2>
           <p className="text-sm text-slate-500 font-medium">Full audit trail of all company cash movements.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all"><Download size={16} className="mr-2"/> CSV</button>
           <button onClick={() => setShowAddModal(true)} className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"><Plus size={18} className="mr-2"/> Add Entry</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
               <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 border-b border-slate-100">
                  <tr>
                     <th className="px-8 py-4">Date</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Category</th>
                     <th className="px-6 py-4">Description</th>
                     <th className="px-6 py-4 text-right">Value</th>
                     <th className="px-6 py-4"></th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filtered.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-4 text-slate-500 font-mono text-xs">{t.date}</td>
                        <td className="px-6 py-4">
                            <div className={`w-2 h-2 rounded-full ${t.type === 'INCOMING' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                             t.type === 'INCOMING' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                           }`}>
                              {t.category.replace(/_/g, ' ')}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{t.description}</td>
                        <td className={`px-6 py-4 text-right font-black tabular-nums ${t.type === 'INCOMING' ? 'text-emerald-600' : 'text-slate-900'}`}>
                           {t.type === 'INCOMING' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        </td>
                     </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-medium italic">No ledger entries matching your search.</td></tr>}
               </tbody>
            </table>
        </div>
      </div>

      {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-fade-in border border-slate-100">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manual Ledger Entry</h3>
                      <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><Plus size={24} className="rotate-45"/></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex bg-slate-100 p-1 rounded-2xl">
                          <button onClick={() => setNewTx({...newTx, type: 'INCOMING'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newTx.type === 'INCOMING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>INCOMING</button>
                          <button onClick={() => setNewTx({...newTx, type: 'EXPENSE'})} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${newTx.type === 'EXPENSE' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>OUTGOING</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</label>
                              <input type="date" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount ($)</label>
                              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-black text-indigo-600" value={newTx.amount || ''} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} placeholder="0.00" />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                          <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value as any})}>
                              {Object.values(TransactionCategory).map(cat => <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                          <textarea className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold h-24 resize-none" placeholder="Purpose of transaction..." value={newTx.description || ''} onChange={e => setNewTx({...newTx, description: e.target.value})} />
                      </div>
                      <div className="pt-4 flex gap-3">
                          <Button className="flex-1 py-4 rounded-2xl" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                          <Button className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 font-black" onClick={handleAdd}>Post to Ledger</Button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
