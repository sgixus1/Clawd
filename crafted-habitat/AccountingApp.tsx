
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Transaction, Invoice, ChecklistItem, Project, CompanySettings, TransactionType, TransactionCategory 
} from './types';
import { 
  getTransactions, saveTransactions, getInvoices, saveInvoices, 
  getAccountingChecklist, saveAccountingChecklist, getSettings, formatCurrency, saveSettings
} from './utils';
import { DEFAULT_COMPANY_SETTINGS } from './constants';
import { Button } from './components/Button';
import { 
  ArrowLeft, Landmark, CreditCard, FileText, CheckSquare, Settings as SettingsIcon, 
  Plus, Search, TrendingUp, TrendingDown, Wallet, Clock, Trash2, Calendar, 
  Building2, AlertCircle, FilePlus, Download, Lock, X
} from 'lucide-react';

interface AccountingAppProps {
  onBack: () => void;
}

export const AccountingApp: React.FC<AccountingAppProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'invoices' | 'compliance' | 'settings'>('dashboard');
  
  // Security State
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadData = async () => {
        const savedProjects = localStorage.getItem('crafted_habitat_projects');
        if (savedProjects) setProjects(JSON.parse(savedProjects));
        
        setTransactions(await getTransactions());
        setInvoices(await getInvoices());
        setChecklist(await getAccountingChecklist());
        setSettings(await getSettings());
    };
    loadData();
  }, []);

  const handleTabChange = (id: any) => {
    if (id === 'settings' && !isSettingsUnlocked) {
        setShowPassPrompt(true);
    } else {
        setActiveTab(id);
    }
  };

  const handleUnlockSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = (settings.adminPassword || settings.adminPin || "1920").toUpperCase();
    if (passInput.toUpperCase() === adminPass) {
        setIsSettingsUnlocked(true);
        setShowPassPrompt(false);
        setActiveTab('settings');
        setPassInput('');
        setPassError('');
    } else {
        setPassError('Invalid Master Password');
        setPassInput('');
    }
  };

  // Handlers
  const addTransaction = (t: Transaction) => {
    const updated = [t, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  const addInvoice = (i: Invoice) => {
    const updated = [i, ...invoices];
    setInvoices(updated);
    saveInvoices(updated);
  };

  const toggleChecklist = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    saveAccountingChecklist(updated);
  };

  const handleSaveSettings = () => {
      saveSettings(settings);
      alert("Settings saved.");
  }

  // Stats
  const financials = useMemo(() => {
    const incoming = transactions.filter(t => t.type === 'INCOMING').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    const ar = invoices.filter(i => i.type === 'AR' && i.status !== 'PAID').reduce((acc, i) => acc + i.totalAmount, 0);
    const ap = invoices.filter(i => i.type === 'AP' && i.status !== 'PAID').reduce((acc, i) => acc + i.totalAmount, 0);
    
    return { incoming, expense, balance: incoming - expense, ar, ap };
  }, [transactions, invoices]);

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => handleTabChange(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
        activeTab === id 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
        : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={16}/>}>Back to Home</Button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-lg p-1 border border-indigo-100">
               <Landmark className="text-indigo-600 w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Accounting<span className="text-indigo-600">&</span>Finance</span>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-2xl">
           <TabButton id="dashboard" label="Dashboard" icon={Landmark} />
           <TabButton id="ledger" label="General Ledger" icon={CreditCard} />
           <TabButton id="invoices" label="Invoices" icon={FileText} />
           <TabButton id="compliance" label="Compliance" icon={CheckSquare} />
           <TabButton id="settings" label="Settings" icon={SettingsIcon} />
        </div>

        <div className="w-48 hidden md:flex justify-end">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              FY {new Date().getFullYear()} ACTIVE
           </span>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-lg transition-all text-left">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><TrendingUp size={24}/></div>
                   <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Income</span>
                   <span className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(financials.incoming)}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-lg transition-all text-left">
                   <div className="p-3 bg-red-50 text-red-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><TrendingDown size={24}/></div>
                   <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Expenses</span>
                   <span className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(financials.expense)}</span>
                </div>
                <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-600/20 flex flex-col text-white text-left">
                   <div className="p-3 bg-white/10 text-indigo-100 rounded-2xl w-fit mb-4"><Wallet size={24}/></div>
                   <span className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Current Balance</span>
                   <span className="text-3xl font-black mt-1">{formatCurrency(financials.balance)}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-lg transition-all text-left">
                   <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform"><Clock size={24}/></div>
                   <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">A/R Outstanding</span>
                   <span className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(financials.ar)}</span>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-left">
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Recent Invoices</h3>
                      <button onClick={() => setActiveTab('invoices')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                   </div>
                   <div className="p-0 overflow-y-auto max-h-[400px]">
                      <table className="w-full text-sm text-left">
                         <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white sticky top-0">
                            <tr>
                               <th className="px-6 py-4">Client / Vendor</th>
                               <th className="px-6 py-4">Ref</th>
                               <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {invoices.slice(0, 5).map(inv => (
                               <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-800">{inv.entityName}</td>
                                  <td className="px-6 py-4 text-xs font-mono text-slate-500">{inv.invoiceNo}</td>
                                  <td className="px-6 py-4 text-right font-black text-indigo-700">{formatCurrency(inv.totalAmount)}</td>
                               </tr>
                            ))}
                            {invoices.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-medium italic">No invoices recorded.</td></tr>}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                   <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-left">
                      <h3 className="font-black text-slate-800 uppercase tracking-tight">Compliance Checklist</h3>
                   </div>
                   <div className="p-6 space-y-4">
                      {checklist.map(item => (
                         <div 
                           key={item.id} 
                           onClick={() => toggleChecklist(item.id)}
                           className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                             item.completed ? 'bg-emerald-50 border-emerald-100 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                           }`}
                         >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                              item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
                            }`}>
                               {item.completed && <CheckSquare size={14}/>}
                            </div>
                            <div className="flex-1 text-left">
                               <p className={`font-bold text-sm ${item.completed ? 'text-emerald-900' : 'text-slate-800'}`}>{item.task}</p>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex justify-between items-end">
                <div className="text-left">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">General Ledger</h2>
                   <p className="text-sm text-slate-500 font-medium">Categorized cash flow monitoring</p>
                </div>
                <div className="flex gap-3">
                   <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"><Download size={16} className="mr-2"/> Export CSV</button>
                   <button className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5"><Plus size={18} className="mr-2"/> New Entry</button>
                </div>
             </div>

             <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex gap-4">
                   <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Search transactions..." />
                   </div>
                </div>
                <table className="w-full text-sm text-left">
                   <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Category</th>
                         <th className="px-6 py-4">Description</th>
                         <th className="px-6 py-4 text-right">Amount</th>
                         <th className="px-6 py-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                         <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{t.date}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                 t.type === 'INCOMING' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                               }`}>
                                  {t.category.replace('_', ' ')}
                               </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800">{t.description}</td>
                            <td className={`px-6 py-4 text-right font-black ${t.type === 'INCOMING' ? 'text-emerald-600' : 'text-slate-900'}`}>
                               {t.type === 'INCOMING' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button onClick={() => deleteTransaction(t.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                            </td>
                         </tr>
                      ))}
                      {transactions.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-medium italic">No ledger entries found.</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex justify-between items-end">
                <div className="text-left">
                   <h2 className="text-2xl font-black text-slate-800 tracking-tight">Invoice Management</h2>
                   <p className="text-sm text-slate-500 font-medium">Accounts Receivable (A/R) & Payable (A/P)</p>
                </div>
                <button className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"><FilePlus size={18} className="mr-2"/> Create Invoice</button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoices.map(inv => (
                   <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-4 text-left">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                           inv.type === 'AR' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                         }`}>
                            {inv.type === 'AR' ? 'IN' : 'OUT'}
                         </div>
                         <div>
                            <h3 className="font-black text-slate-900">{inv.entityName}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                               <FileText size={12}/> {inv.invoiceNo} • <Calendar size={12}/> Due {inv.dueDate}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-xl font-black text-indigo-700 block">{formatCurrency(inv.totalAmount)}</span>
                         <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                           inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                         }`}>{inv.status}</span>
                      </div>
                   </div>
                ))}
                {invoices.length === 0 && (
                   <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FileText size={32}/></div>
                      <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">No Pending Invoices</h4>
                      <p className="text-slate-400 text-xs mt-1">Start by creating an AR invoice for a client or an AP bill for a supplier.</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="animate-fade-in max-w-3xl mx-auto space-y-8">
             <div className="text-center space-y-2">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl w-fit mx-auto mb-4 border border-indigo-100"><CheckSquare size={48}/></div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Financial Compliance</h2>
                <p className="text-slate-500 font-medium">Singapore Regulatory Filings & Internal Audits</p>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6 text-left">
                {['TAX', 'ACRA', 'INTERNAL'].map(cat => (
                   <div key={cat} className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">{cat} FILINGS</h4>
                      {checklist.filter(i => i.category === cat).map(item => (
                         <div 
                           key={item.id} 
                           onClick={() => toggleChecklist(item.id)}
                           className={`p-5 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${
                             item.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                               item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
                            }`}>
                               {item.completed && <CheckSquare size={16}/>}
                            </div>
                            <span className={`font-bold flex-1 text-left ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.task}</span>
                            <span className="text-[10px] font-black text-slate-300">#00{item.id}</span>
                         </div>
                      ))}
                   </div>
                ))}
             </div>
             
             <div className="p-6 bg-slate-900 rounded-3xl text-indigo-100 flex items-start gap-4 text-left">
                <AlertCircle className="shrink-0 text-amber-400" size={20}/>
                <p className="text-xs font-medium leading-relaxed opacity-80">
                   <strong>Pro Tip:</strong> Ensure all GST F5 returns are submitted 1 month after the end of your accounting period to avoid IRAS late submission penalties.
                </p>
             </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
           <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8 text-left">
                 <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><SettingsIcon className="text-indigo-600"/> Accounting Settings</h3>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="text-left">
                          <p className="font-bold text-slate-800">GST Registration</p>
                          <p className="text-xs text-slate-400 font-medium">Automatic calculation of 9% GST on invoices</p>
                       </div>
                       <input 
                         type="checkbox" 
                         className="w-6 h-6 rounded text-indigo-600 cursor-pointer"
                         checked={!!settings.isGstRegistered}
                         onChange={(e) => setSettings({...settings, isGstRegistered: e.target.checked})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</label>
                          <input 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                            value={settings.bankName || ''} 
                            onChange={(e) => setSettings({...settings, bankName: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</label>
                          <input 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                            value={settings.bankAccount || ''} 
                            onChange={(e) => setSettings({...settings, bankAccount: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-1 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year End</label>
                       <input 
                        type="date" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" 
                        value={settings.dateFormat || ''}
                        onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                       />
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex gap-3">
                       <Button className="flex-1 py-4 rounded-2xl" variant="outline" onClick={async () => setSettings(await getSettings())}>Discard</Button>
                       <Button className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20" onClick={handleSaveSettings}>Apply Changes</Button>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>

      {showPassPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95">
                <div className="p-5 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl"><Lock size={32}/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Auth Required</h3>
                <p className="text-center text-xs text-slate-400 font-bold uppercase mb-8">Enter Master Password to access Settings</p>
                <form onSubmit={handleUnlockSettings} className="w-full space-y-6">
                    <input 
                        type="password" 
                        autoFocus 
                        placeholder="••••" 
                        className="w-full text-center text-5xl font-black tracking-[0.5em] py-5 border-2 border-slate-50 bg-slate-50 rounded-3xl outline-none" 
                        value={passInput} 
                        onChange={e => setPassInput(e.target.value)}
                    />
                    {passError && <p className="text-[10px] text-rose-500 font-black uppercase text-center animate-pulse">{passError}</p>}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setShowPassPrompt(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 transition-all">Unlock</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
