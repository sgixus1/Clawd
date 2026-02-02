import React, { useState } from 'react';
import { 
  Briefcase, Users, Calendar, DollarSign, 
  CreditCard, AlertCircle, Settings, FileText, 
  LogOut, Menu, Landmark, Ticket, History,
  CheckSquare, TrendingUp, Wallet, LayoutGrid, UserMinus
} from 'lucide-react';
import { CompanySettings } from '../../types';

interface PayrollLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  onExit: () => void;
  settings: CompanySettings;
}

export const PayrollLayout: React.FC<PayrollLayoutProps> = ({ 
  children, activeView, onNavigate, onExit, settings
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarItem = ({ icon, label, id }: { icon: any, label: string, id: string }) => (
    <button 
        onClick={() => { onNavigate(id); setSidebarOpen(false); }}
        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all group ${
            activeView === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
        <span className={activeView === id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}>{icon}</span>
        <span>{label}</span>
    </button>
  );

  const SectionLabel = ({ children }: { children?: React.ReactNode }) => (
      <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 mt-6 first:mt-0">{children}</p>
  );

  const isVoucher = activeView === 'voucher';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans border-l border-slate-200">
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`fixed lg:relative w-72 h-full bg-white flex flex-col border-r border-slate-200 z-50 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-slate-100 flex items-center space-x-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Landmark size={20} /></div>
           <div><h2 className="font-black text-slate-800 tracking-tight text-sm uppercase">Accounting & Payroll</h2><p className="text-[10px] text-indigo-600 uppercase font-black">Admin Suite</p></div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
          <SectionLabel>Financial Overview</SectionLabel>
          <SidebarItem id="dashboard" icon={<TrendingUp size={18}/>} label="Executive Dashboard" />
          <SidebarItem id="project-crm" icon={<LayoutGrid size={18}/>} label="Project Registry" />
          <SidebarItem id="ledger" icon={<CreditCard size={18}/>} label="General Ledger" />
          <SidebarItem id="invoices" icon={<FileText size={18}/>} label="Invoice Manager" />
          <SidebarItem id="outstanding" icon={<AlertCircle size={18}/>} label="Accounts Payable" />
          
          <SectionLabel>Workforce & Payroll</SectionLabel>
          <SidebarItem id="payroll" icon={<DollarSign size={18}/>} label="Run Payroll" />
          <SidebarItem id="history" icon={<History size={18}/>} label="Cycle History" />
          <SidebarItem id="attendance" icon={<Calendar size={18}/>} label="Attendance" />
          <SidebarItem id="leaves" icon={<UserMinus size={18}/>} label="Absence Log (Leave/MC)" />
          
          <SectionLabel>System</SectionLabel>
          <SidebarItem id="compliance" icon={<CheckSquare size={18}/>} label="Tax & Filings" />
          <SidebarItem id="voucher" icon={<Ticket size={18}/>} label="Payment Vouchers" />
          <SidebarItem id="settings" icon={<Settings size={18}/>} label="Settings" />
        </nav>
        <div className="p-4 border-t border-slate-100"><button onClick={onExit} className="flex items-center space-x-3 text-slate-500 hover:text-red-600 w-full px-4 py-3 rounded-xl hover:bg-red-50 font-bold text-sm transition-all"><LogOut size={18}/><span>Exit System</span></button></div>
      </aside>
      <main className="flex-1 overflow-y-auto flex flex-col">
        {!isVoucher && (
          <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
                <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">{(activeView || '').replace(/-/g, ' ')}</h2>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-xs font-black text-slate-400 uppercase">{settings.name}</span>
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black">A</div>
            </div>
          </header>
        )}
        <div className={`${isVoucher ? 'p-0 w-full max-w-none' : 'p-10 max-w-7xl mx-auto w-full'}`}>
            {isVoucher && (
                <button 
                  className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-full shadow-lg border border-slate-200" 
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={24}/>
                </button>
            )}
            {children}
        </div>
      </main>
    </div>
  );
};