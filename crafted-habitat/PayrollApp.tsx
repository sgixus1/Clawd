import React, { useState, useEffect } from 'react';
import { 
  Worker, AttendanceRecord, LeaveRecord, 
  Expense, OutstandingPayment, CompanySettings, PayrollRun, 
  Transaction, Invoice, ChecklistItem, Project, VariationOrder, InvoiceStatus
} from './types';
import { 
  getWorkers, getAttendance, getLeaves, getExpenses, getPayments, getSettings, 
  getPayrollRuns, savePayrollRun, deletePayrollRun,
  getTransactions, saveTransactions, getInvoices, saveInvoices,
  getAccountingChecklist, saveAccountingChecklist, getProjects, getVos, saveVos
} from './utils';
import { DEFAULT_COMPANY_SETTINGS } from './constants';
import { Button } from './components/Button';
import { Lock, ArrowLeft, Unlock, ShieldAlert, X } from 'lucide-react';

// Unified Sub-views
import { PayrollLayout } from './components/payroll/PayrollLayout';
import { PayrollDashboard } from './components/payroll/PayrollDashboard';
import { EmployeesView } from './components/payroll/EmployeesView';
import { AttendanceView } from './components/payroll/AttendanceView';
import { LeavesView } from './components/payroll/LeavesView';
import { ExpensesView } from './components/payroll/ExpensesView';
import { OutstandingView } from './components/payroll/OutstandingView';
import { CppGeneratorView } from './components/payroll/CppGenerator';
import { PaymentVoucherView } from './components/payroll/PaymentVoucherView';
import { PayrollProcessor } from './components/payroll/PayrollProcessor';
import { PayrollHistory } from './components/payroll/PayrollHistory';

// Accounting CRM Views
import TransactionList from './components/accounting/TransactionList';
import InvoiceManager from './components/accounting/InvoiceManager';
import ProjectCRM from './components/accounting/ProjectCRM';
import AccountingSettings from './components/accounting/AccountingSettings';
import { ComplianceView } from './components/accounting/ComplianceView';

/**
 * PayrollAppProps Interface
 */
interface PayrollAppProps {
  onBack: () => void;
  syncKey?: number;
  projects: Project[];
  onUpdateProjects: (newList: Project[]) => void;
  onDeleteProject: (id: string) => void;
}

export const PayrollApp: React.FC<PayrollAppProps> = ({ onBack, syncKey = 0, projects, onUpdateProjects, onDeleteProject }) => {
  const [view, setView] = useState('dashboard');
  const [voucherPrefill, setVoucherPrefill] = useState<{ runId: string, payslipId: string } | null>(null);
  
  // Security State
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [showPassPrompt, setShowPassPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');

  // Data State
  const [settings, setSettingsState] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [employees, setEmployees] = useState<Worker[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<OutstandingPayment[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [vos, setVosState] = useState<VariationOrder[]>([]);

  useEffect(() => { refreshData(); }, [syncKey]);

  const refreshData = async () => {
    try {
        const [w, a, l, e, p, s, r, t, i, c, v] = await Promise.all([
            getWorkers(),
            getAttendance(),
            getLeaves(),
            getExpenses(),
            getPayments(),
            getSettings(),
            getPayrollRuns(),
            getTransactions(),
            getInvoices(),
            getAccountingChecklist(),
            getVos()
        ]);
        setEmployees(w);
        setAttendance(a);
        setLeaves(l);
        setExpenses(e);
        setPayments(p);
        setSettingsState(s);
        setPayrollRuns(r);
        setTransactions(t);
        setInvoices(i);
        setChecklist(c);
        setVosState(v);
    } catch (err) {
        console.error("Data refresh failed:", err);
    }
  };

  const handleNavigate = (v: string) => {
    if (v === 'settings' && !isSettingsUnlocked) {
        setShowPassPrompt(true);
    } else {
        setView(v);
        setVoucherPrefill(null);
    }
  };

  const handleUnlockSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPass = (settings.adminPassword || settings.adminPin || "1920").toUpperCase();
    if (passInput.toUpperCase() === adminPass) {
        setIsSettingsUnlocked(true);
        setShowPassPrompt(false);
        setView('settings');
        setPassInput('');
        setPassError('');
    } else {
        setPassError('Invalid Master Password');
        setPassInput('');
    }
  };

  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    const updated = invoices.map(i => i.id === id ? { ...i, status } : i);
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    const updated = invoices.map(i => i.id === updatedInvoice.id ? updatedInvoice : i);
    setInvoices(updated);
    saveInvoices(updated);
  };

  const handleAddProject = (p: Project) => {
      onUpdateProjects([p, ...projects]);
  };

  const handleDeleteProject = (id: string) => {
      onDeleteProject(id);
  };

  const handleAddVO = (v: VariationOrder) => {
      const updated = [v, ...vos];
      setVosState(updated);
      saveVos(updated);
  };

  const handleVoucherNavigate = (runId: string, payslipId: string) => {
    setVoucherPrefill({ runId, payslipId });
    setView('voucher');
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
      const updated = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
      setTransactions(updated);
      saveTransactions(updated);
  };

  return (
    <>
    <PayrollLayout activeView={view} onNavigate={handleNavigate} onExit={onBack} settings={settings}>
      {view === 'dashboard' && <PayrollDashboard employees={employees} payments={payments} expenses={expenses} attendance={attendance} settings={settings} transactions={transactions} payrollRuns={payrollRuns} invoices={invoices} />}
      {view === 'project-crm' && <ProjectCRM projects={projects} vos={vos} addProject={handleAddProject} deleteProject={handleDeleteProject} addVO={handleAddVO} />}
      {view === 'ledger' && (
          <TransactionList 
            transactions={transactions} 
            projects={projects} 
            settings={settings}
            isGstRegistered={!!settings.isGstRegistered} 
            addTransaction={(t) => { const u = [t, ...transactions]; setTransactions(u); saveTransactions(u); }} 
            deleteTransaction={(id) => { const u = transactions.filter(t => t.id !== id); setTransactions(u); saveTransactions(u); }} 
            updateTransaction={handleUpdateTransaction}
          />
      )}
      {view === 'invoices' && (
          <InvoiceManager 
            invoices={invoices} 
            projects={projects} 
            settings={settings} 
            addInvoice={(i) => { const u = [i, ...invoices]; setInvoices(u); saveInvoices(u); }} 
            updateInvoice={handleUpdateInvoice}
            deleteInvoice={(id) => { const u = invoices.filter(i => i.id !== id); setInvoices(u); saveInvoices(u); }} 
            updateStatus={handleUpdateStatus} 
            sendReminder={(id) => { const u = invoices.map(i => i.id === id ? { ...i, lastReminderSent: new Date().toLocaleDateString() } : i); setInvoices(u); saveInvoices(u); }} 
          />
      )}
      {view === 'compliance' && <ComplianceView checklist={checklist} onToggle={(id) => { const u = checklist.map(i => i.id === id ? { ...i, completed: !i.completed } : i); setChecklist(u); saveAccountingChecklist(u); }} />}
      {view === 'employees' && <EmployeesView employees={employees} onUpdate={refreshData} settings={settings} />}
      {view === 'attendance' && <AttendanceView employees={employees} attendance={attendance} onUpdate={refreshData} />}
      {view === 'leaves' && <LeavesView employees={employees} leaves={leaves} onUpdate={refreshData} />}
      {view === 'payroll' && <PayrollProcessor workers={employees} onSave={(run) => { savePayrollRun(run); refreshData(); setView('history'); }} />}
      {view === 'history' && <PayrollHistory runs={payrollRuns} onDelete={(id) => { if(confirm("Delete cycle?")) { deletePayrollRun(id); refreshData(); } }} onUpdate={refreshData} onVoucher={handleVoucherNavigate} settings={settings} />}
      {view === 'expenses' && <ExpensesView expenses={expenses} onUpdate={refreshData} settings={settings} />}
      {view === 'outstanding' && <OutstandingView payments={payments} onUpdate={refreshData} settings={settings} />}
      {view === 'voucher' && <PaymentVoucherView workers={employees} projects={projects} settings={settings} prefill={voucherPrefill} />}
      {view === 'settings' && <AccountingSettings settings={settings} onUpdate={refreshData} />}
      {view === 'cpp' && <CppGeneratorView />}
    </PayrollLayout>

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
    </>
  );
};