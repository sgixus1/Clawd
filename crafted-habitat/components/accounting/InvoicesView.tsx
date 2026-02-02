
import React, { useState } from 'react';
import { Invoice, InvoiceType, InvoiceStatus } from '../../types';
import { Button } from '../Button';
import { Search, FilePlus, Filter, Trash2, Calendar, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils';

interface InvoicesViewProps {
  invoices: Invoice[];
  onUpdate: (data: Invoice[]) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ invoices, onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = (id: string) => {
        if (confirm("Permanently delete this invoice record?")) {
            onUpdate(invoices.filter(i => i.id !== id));
        }
    };

    const handleStatusToggle = (inv: Invoice) => {
        const newStatus = inv.status === 'PAID' ? 'SENT' : 'PAID';
        const action = newStatus === 'PAID' ? 'SETTLE as PAID' : 'revert to PENDING';
        
        if (confirm(`Are you sure you want to ${action} Invoice ${inv.invoiceNo} for ${inv.entityName}?`)) {
            onUpdate(invoices.map(i => {
                if (i.id === inv.id) {
                    return { ...i, status: newStatus };
                }
                return i;
            }));
        }
    };

    const filtered = invoices.filter(i => 
        i.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoice Registry</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage client billing and supplier payables.</p>
                </div>
                <button className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"><FilePlus size={18} className="mr-2"/> Create Invoice</button>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm" 
                    placeholder="Search invoice # or client..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map(inv => (
                   <div key={inv.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${inv.type === 'AR' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <div className="flex items-center gap-6 pl-2">
                         <div className={`w-16 h-16 rounded-[20px] flex flex-col items-center justify-center font-black ${
                           inv.type === 'AR' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                         }`}>
                            <span className="text-[10px] opacity-70">TYPE</span>
                            <span className="text-xl">{inv.type}</span>
                         </div>
                         <div>
                            <h3 className="font-black text-slate-900 text-lg leading-tight">{inv.entityName}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                                    <FileText size={12}/> {inv.invoiceNo}
                                </span>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                                    <Calendar size={12}/> DUE {inv.dueDate}
                                </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <span className="text-2xl font-black text-indigo-700 block tabular-nums">{formatCurrency(inv.totalAmount)}</span>
                            <button 
                                onClick={() => handleStatusToggle(inv)}
                                className={`mt-1 text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all ${
                                    inv.status === 'PAID' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'
                                }`}
                            >
                                {inv.status === 'PAID' ? 'Settled' : 'Pending'}
                            </button>
                         </div>
                         <button onClick={() => handleDelete(inv.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={20}/>
                         </button>
                      </div>
                   </div>
                ))}
                {filtered.length === 0 && (
                   <div className="col-span-full p-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FileText size={32}/></div>
                      <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">No Invoice Records</h4>
                      <p className="text-slate-400 text-xs font-medium mt-1">Generate accounts receivable or record supplier bills to track cash flow.</p>
                   </div>
                )}
            </div>
        </div>
    );
};
