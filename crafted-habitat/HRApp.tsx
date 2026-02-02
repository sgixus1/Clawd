import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  BookOpen, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  CheckCircle,
  XCircle,
  Menu,
  X,
  MessageSquare,
  ArrowLeft,
  User,
  Flag,
  CreditCard,
  Activity,
  Building2,
  ShieldCheck,
  Download,
  ExternalLink,
  Globe,
  Settings,
  Database,
  Upload,
  Save,
  Wallet,
  Phone,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Plus,
  Minus,
  MapPin,
  Home,
  HardHat,
  Filter,
  HeartPulse,
  LogOut,
  Landmark,
  Calendar,
  ArrowRight,
  Shield,
  Info,
  ChevronRight,
  Printer,
  Stamp,
  ArrowRightLeft,
  Loader2,
  FilterX,
  Eye,
  ShieldAlert,
  Clock,
  Lock,
  Unlock,
  ToggleLeft,
  ToggleRight,
  ShieldHalf,
  CheckCircle2,
  Package,
  PlusSquare,
  Coins,
  Building,
  TrendingUp
} from 'lucide-react';

import { Worker, AppView, DashboardStats, CrmData, WicPolicy, RateType, Department, CompanySettings } from './types';
import { getWorkers, saveWorker, saveAllWorkers, deleteWorker, calculateDaysLeft, isExpiringSoon, formatCurrency, formatDateSG, calculateCpfEstimates, getCrmData, saveCrmData, getPolicies, savePolicy, deletePolicy, getSettings, saveSettings } from './utils';
import { DEFAULT_COMPANY_SETTINGS } from './constants';

const INITIAL_WORKER_DATA: Partial<Worker> = { 
  name: '',
  nationality: 'BANGLADESH',
  salary: 0,
  momSalary: 0,
  levyRate: 0,
  sundayFlatRate: 0,
  wpFinNric: '',
  wpNumber: '',
  stateProvince: 'N/A',
  sex: 'MALE',
  dateOfBirth: '',
  passportNo: '',
  passType: 'WP',
  medicalExamDate: '',
  occupationTitle: '',
  applicationDate: '',
  passValidity: 'Yes',
  employmentPeriod: '',
  passIssueDate: '',
  cancellationDate: '',
  passExpiryDate: '',
  securityBondNo: '',
  bondSubmittedDate: '',
  workerType: 'FOREIGN',
  employmentType: 'FULL_TIME',
  rateType: RateType.MONTHLY,
  otPolicy: 'STANDARD',
  isExcludedFromPayroll: false,
  showInSupervisorApp: true,
  company: ''
};

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-6 py-4 transition-colors duration-200 ${
      active 
        ? 'bg-indigo-50 border-r-4 border-indigo-600 text-indigo-700 font-black' 
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-bold'
    }`}
  >
    <Icon size={20} className="flex-shrink-0" />
    <span className="text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, colorClass, subtext, highlight = false }: any) => (
  <div className={`bg-white rounded-xl p-6 shadow-sm border ${highlight ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-gray-100'} flex items-center justify-between transition-all hover:shadow-md`}>
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-[10px] font-black text-gray-400 mb-1 truncate uppercase tracking-[0.1em] text-left">{title}</p>
      <h3 className={`text-2xl font-black ${highlight ? 'text-indigo-700' : 'text-gray-900'} truncate tracking-tight text-left`}>{value}</h3>
      {subtext && <p className="text-[10px] font-bold text-gray-400 mt-1 truncate uppercase text-left">{subtext}</p>}
    </div>
    <div className={`p-3.5 rounded-2xl flex-shrink-0 shadow-lg ${colorClass}`}>
      <Icon size={22} className="text-white" />
    </div>
  </div>
);

const InsuranceView: React.FC<{ 
  policies: WicPolicy[], 
  isDataReady: boolean, 
  handleAction: (a:()=>void)=>void, 
  refresh: ()=>void 
}> = ({ policies, isDataReady, handleAction, refresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [policyDraft, setPolicyDraft] = useState<Partial<WicPolicy>>({ provider: '', policyNo: '', expiryDate: '' });

  const onSave = async () => {
    if (!policyDraft.provider || !policyDraft.policyNo) return;
    setIsSaving(true);
    try {
      await savePolicy({
        id: 'POL_' + Date.now(),
        provider: policyDraft.provider.toUpperCase(),
        policyNo: policyDraft.policyNo.toUpperCase(),
        expiryDate: policyDraft.expiryDate || new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      setPolicyDraft({ provider: '', policyNo: '', expiryDate: '' });
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const onRemove = async (id: string) => {
    if (!confirm("Purge insurance record?")) return;
    await deletePolicy(id);
    refresh();
  };

  if (!isDataReady) return <div className="py-20 flex flex-col items-center gap-4 opacity-20"><Loader2 className="animate-spin text-indigo-600" size={48}/><span className="text-[10px] font-black uppercase tracking-[0.4em]">Querying Registry...</span></div>;

  return (
    <div className="space-y-10 animate-fade-in text-left">
        <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-left">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner"><ShieldCheck size={32}/></div>
              <div className="text-left">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Compliance Registry</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">WIC & Medical Insurance Management</p>
              </div>
            </div>
            <button onClick={() => handleAction(() => setShowForm(true))} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
              <Plus size={18}/> New Policy
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map(pol => {
                const daysLeft = calculateDaysLeft(pol.expiryDate);
                const isExpiring = daysLeft <= 30;
                return (
                    <div key={pol.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all group hover:shadow-xl relative overflow-hidden ${isExpiring ? 'border-rose-200' : 'border-slate-100'}`}>
                        {isExpiring && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500 animate-pulse"></div>}
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-3 rounded-2xl ${isExpiring ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}><Shield size={24}/></div>
                            <div className="text-right">
                                <p className={`text-xl font-black tabular-nums leading-none ${isExpiring ? 'text-rose-600' : 'text-slate-900'}`}>{daysLeft}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Days Remaining</p>
                            </div>
                        </div>
                        <div className="text-left">
                          <h4 className="font-black text-slate-800 uppercase text-lg truncate leading-tight">{pol.provider}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">NO: {pol.policyNo}</p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400"><Calendar size={14}/><span className="text-[10px] font-black uppercase">{pol.expiryDate}</span></div>
                            <button onClick={() => handleAction(() => onRemove(pol.id))} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        </div>
                    </div>
                );
            })}
            {policies.length === 0 && <div className="col-span-full py-40 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-4"><ShieldCheck size={64} className="opacity-10"/><p className="text-[10px] font-black uppercase tracking-widest">No active policies in registry</p></div>}
        </div>

        {showForm && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 text-left">
                <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95">
                    <div className="p-8 border-b border-slate-50 bg-indigo-50/30 flex justify-between items-center text-left">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Policy Registry</h3>
                        <button onClick={() => setShowForm(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-6 text-left">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Insurance Provider</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="e.g. NTUC INCOME" value={policyDraft.provider} onChange={e => setPolicyDraft({...policyDraft, provider: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Policy Number</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none" placeholder="REF-8812" value={policyDraft.policyNo} onChange={e => setPolicyDraft({...policyDraft, policyNo: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Expiration Date</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none" value={policyDraft.expiryDate} onChange={e => setPolicyDraft({...policyDraft, expiryDate: e.target.value})} /></div>
                        <button onClick={onSave} disabled={isSaving} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={18}/>} Archive Document</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const HrSettingsView: React.FC<{ 
  crmData: CrmData, 
  isDataReady: boolean, 
  setCrmDataState: (d:CrmData)=>void 
}> = ({ crmData, isDataReady, setCrmDataState }) => {
  const [input, setInput] = useState('');
  const [activeTab, setHrTab] = useState<'COMPANIES' | 'TRADES' | 'NATIONALITIES'>('COMPANIES');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateCrm = async (type: keyof CrmData, value: string, action: 'add' | 'remove') => {
      setIsSaving(true);
      try {
          const current = await getCrmData();
          let list = [...(current[type] || [])];
          if (action === 'add') {
              if (!value || list.includes(value.toUpperCase())) { setIsSaving(false); return; }
              list.push(value.toUpperCase());
          } else {
              list = list.filter(it => it !== value);
          }
          const updated = { ...current, [type]: list };
          await saveCrmData(updated);
          setCrmDataState(updated);
          setInput('');
      } finally {
          setIsSaving(false);
      }
  };

  const dataMap = {
      'COMPANIES': { list: crmData?.companies || [], key: 'companies' as keyof CrmData },
      'TRADES': { list: crmData?.occupations || [], key: 'occupations' as keyof CrmData },
      'NATIONALITIES': { list: crmData?.nationalities || [], key: 'nationalities' as keyof CrmData }
  };

  const current = dataMap[activeTab];

  if (!isDataReady) return <div className="py-20 flex flex-col items-center gap-4 opacity-30"><Loader2 className="animate-spin text-indigo-600" size={48}/><span className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing SQL Registry...</span></div>;

  return (
      <div className="max-w-4xl mx-auto space-y-10 animate-fade-in text-left">
          <div className="flex justify-between items-center text-left">
              <div><h3 className="text-3xl font-black text-slate-900 uppercase">System CRM Setup</h3><p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configure dropdown registries and HR logic</p></div>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                      {(['COMPANIES', 'TRADES', 'NATIONALITIES'] as const).map(t => (
                          <button key={t} onClick={() => { setHrTab(t); setInput(''); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                      ))}
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                      <input className="flex-1 md:w-64 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" placeholder={`New ${activeTab.slice(0,-1)}...`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && current.key && handleUpdateCrm(current.key, input, 'add')} />
                      <button onClick={() => current.key && handleUpdateCrm(current.key, input, 'add')} disabled={isSaving || !input} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"><Plus size={20}/></button>
                  </div>
              </div>

              <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
                  {isSaving ? <div className="py-20 flex flex-col items-center gap-4 opacity-30"><Loader2 className="animate-spin text-indigo-600" size={48}/><span className="text-[10px] font-black uppercase tracking-[0.4em]">Updating Registry...</span></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {current.list.map(it => (
                            <div key={it} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-lg transition-all text-left">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{it}</span>
                                <button onClick={() => current.key && handleUpdateCrm(current.key, it, 'remove')} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                            </div>
                        ))}
                        {current.list.length === 0 && <div className="col-span-full py-20 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest">No entries in this registry</div>}
                    </div>
                  )}
              </div>

              <div className="p-8 bg-indigo-50/30 border-t border-slate-50 flex items-start gap-4">
                  <Info size={20} className="text-indigo-600 shrink-0"/><div className="text-left"><p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest text-left">Registry Synchronization</p><p className="text-[10px] text-indigo-700 font-medium leading-relaxed uppercase mt-1 text-left">Changes update the global dropdowns across the system instantly.</p></div>
              </div>
          </div>
      </div>
  );
};

// --- MAIN HR APP COMPONENT ---

export const HRApp: React.FC<{ onBack: () => void; syncKey?: number; }> = ({ onBack, syncKey = 0 }) => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [policies, setPolicies] = useState<WicPolicy[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettingsState] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [formData, setFormData] = useState<Partial<Worker>>(INITIAL_WORKER_DATA);
  const [crmData, setCrmDataState] = useState<CrmData>({ companies: [], nationalities: [], occupations: [], addresses: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => { refresh(); }, [syncKey, view]);
  
  const refresh = async () => {
    setIsDataReady(false);
    try {
        const fetchWorkers = getWorkers().catch(() => []);
        const fetchCrm = getCrmData().catch(() => ({ companies: [], nationalities: [], occupations: [], addresses: [] }));
        const fetchPolicies = getPolicies().catch(() => []);
        const fetchSettings = getSettings().catch(() => DEFAULT_COMPANY_SETTINGS);

        const [w, c, p, s] = await Promise.all([fetchWorkers, fetchCrm, fetchPolicies, fetchSettings]);
        setWorkers(w || []);
        setCrmDataState(c);
        setPolicies(p || []);
        setSettingsState(s || DEFAULT_COMPANY_SETTINGS);
        setIsDataReady(true);
    } catch (err) {
        console.error("HR refresh failed critically", err);
        setIsDataReady(true); 
    }
  };

  const stats: DashboardStats = useMemo(() => {
    const safeWorkers = workers ?? [];
    const foreignWorkers = safeWorkers.filter(w => w.workerType === 'FOREIGN');
    const localWorkers = safeWorkers.filter(w => w.workerType === 'LOCAL');
    const expiring = foreignWorkers.filter(w => isExpiringSoon(w.passExpiryDate)).length;
    const totalSalary = safeWorkers.reduce((acc, curr) => acc + (curr.salary || 0), 0);
    const totalLevy = foreignWorkers.reduce((acc, curr) => acc + (curr.levyRate || 0), 0);
    const totalEmployerCpf = localWorkers.reduce((acc, curr) => acc + (curr.cpfAmount || 0), 0);
    const totalEmployeeCpf = localWorkers.reduce((acc, curr) => acc + (curr.employeeCpf || 0), 0);
    const totalCpf = totalEmployerCpf + totalEmployeeCpf;
    return { totalWorkers: safeWorkers.length, foreignWorkersCount: foreignWorkers.length, localWorkersCount: localWorkers.length, expiringSoon: expiring, totalSalary, totalLevy, totalCpf, totalEmployerCpf, totalEmployeeCpf };
  }, [workers]);

  const handleActionWithVerification = (action: () => void) => { 
    if (isVerified) action(); 
    else { setPendingAction(() => action); setPinPromptOpen(true); } 
  };
  
  const verifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const standardHrPin = settings.hrPin || '1920';
    if (pinInput === standardHrPin) { 
      setIsVerified(true); setPinPromptOpen(false); setPinInput(''); setPinError(''); 
      if (pendingAction) { pendingAction(); setPendingAction(null); } 
    }
    else { setPinError('Invalid HR PIN'); setPinInput(''); }
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const id = formData.id || Math.random().toString(36).substr(2, 9);
        const newWorker = { ...formData, id, workerType: formData.workerType || 'FOREIGN' } as Worker;
        
        // Fix: To prevent existing worker data from disappearing, we must merge the new record 
        // with the existing list of workers before saving, as the server API overwrites the entire dataset.
        let updatedList;
        if (formData.id) {
            updatedList = workers.map(w => w.id === formData.id ? newWorker : w);
        } else {
            updatedList = [newWorker, ...workers];
        }
        
        await saveAllWorkers(updatedList);
        await refresh();
        setView(formData.workerType === 'LOCAL' ? AppView.LOCAL_WORKER_LIST : AppView.WORKER_LIST);
    } finally {
        setIsSaving(false);
    }
  };

  const handleEdit = (worker: Worker) => { handleActionWithVerification(() => { setFormData({ ...worker }); setView(AppView.EDIT_WORKER); }); };
  const handleDelete = (worker: Worker) => { handleActionWithVerification(async () => { if (confirm('Delete record?')) { await deleteWorker(worker.id); await refresh(); } }); };

  const renderFormInput = (label: string, field: keyof Worker, type: string = "text", disabled: boolean = false) => (
    <div className={`flex border border-slate-400 bg-white overflow-hidden ${disabled ? 'opacity-50 grayscale bg-slate-50' : ''}`}>
        <div className="w-40 bg-[#94b3e3] px-3 py-2 flex items-center shrink-0 border-r border-slate-400 text-left">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{label}</span>
        </div>
        <div className="flex-1">
            {type === "select" ? (
                <select disabled={disabled} className="w-full h-full px-3 py-2 bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer text-left" value={formData[field] as string || ''} onChange={e => setFormData(prev => ({...prev, [field]: e.target.value}))}>
                    {field === 'sex' && <><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option></>}
                    {field === 'passType' && <><option value="WP">WP</option><option value="SP">S PASS</option><option value="EP">EP</option><option value="LOCAL">LOCAL</option></>}
                    {field === 'rateType' && <><option value={RateType.MONTHLY}>MONTHLY FIXED</option><option value={RateType.DAILY}>DAILY RATE</option><option value={RateType.HOURLY}>HOURLY RATE</option></>}
                    {field === 'company' && <><option value="" disabled>Select Entity Registry...</option>{(crmData?.companies ?? []).map(c => <option key={c} value={c}>{c}</option>)}</>}
                    {field === 'nationality' && <>{(crmData?.nationalities ?? []).map(n => <option key={n} value={n}>{n}</option>)}</>}
                    {field === 'occupationTitle' && <><option value="" disabled>Select Trade from CRM Registry...</option>{(crmData?.occupations ?? []).map(o => <option key={o} value={o}>{o}</option>)}</>}
                    {field === 'passValidity' && <><option value="Yes">Yes</option><option value="No">No</option></>}
                </select>
            ) : type === "checkbox" ? (
                <div className="flex items-center h-full px-3 gap-6">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={formData[field] === true} onChange={e => setFormData(prev => ({...prev, [field]: e.target.checked}))} className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                        <span className="ml-2 text-[10px] font-black text-slate-500 uppercase">
                          {field === 'isExcludedFromPayroll' ? 'Exclude from Actual Payroll' : 'Appear in Site Supervisor App'}
                        </span>
                    </label>
                </div>
            ) : (
                <input disabled={disabled} type={type} className={`w-full h-full px-3 py-2 bg-transparent text-sm font-bold outline-none text-left ${field === 'salary' || field === 'momSalary' || field === 'levyRate' ? 'text-indigo-700' : ''}`} value={formData[field] as any || ''} onChange={e => { const val = type === 'number' ? parseFloat(e.target.value) : e.target.value; setFormData(prev => ({...prev, [field]: val})); }} />
            )}
        </div>
    </div>
  );

  if (!isDataReady) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="flex flex-col items-center gap-4 opacity-30">
          <Loader2 className="animate-spin text-indigo-600" size={48}/>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initializing Core...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900 text-left">
      {pinPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95">
            <div className="p-5 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl"><ShieldAlert size={32}/></div>
            <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Auth Required</h3>
            <p className="text-center text-xs text-slate-400 font-bold uppercase mb-8">Enter HR PIN (1920) to write</p>
            <form onSubmit={verifyPin} className="w-full space-y-6 text-left">
              <input type="password" inputMode="numeric" autoFocus placeholder="••••" className="w-full text-center text-5xl font-black tracking-[0.5em] py-5 border-2 border-slate-50 bg-slate-50 rounded-3xl outline-none" maxLength={4} value={pinInput} onChange={e => setPinInput(e.target.value)}/>
              {pinError && <p className="text-[10px] text-rose-500 font-black uppercase text-center">{pinError}</p>}
              <div className="flex gap-3 text-left">
                <button type="button" onClick={() => { setPinPromptOpen(false); setPinInput(''); setPinError(''); setPendingAction(null); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Verify</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <aside className={`fixed lg:relative w-72 h-full bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} text-left`}>
        <div className="h-24 flex items-center px-8 border-b border-gray-50 text-left">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mr-3 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-6 h-6"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M200,50 L310,110 V230 L200,290 L90,230 V110 Z" /><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" x1="200" y1="290" x2="200" y2="100" /><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M200,160 Q260,140 260,110" /><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="12" d="M200,200 Q140,180 140,150" /></svg>
            </div>
            <div className="text-left"><h1 className="text-xl font-black text-gray-900 tracking-tighter leading-none uppercase">HR CORE</h1><p className="text-[8px] font-black text-indigo-600 uppercase tracking-widest mt-1">Personnel Hub</p></div>
        </div>
        <nav className="flex-1 py-10 space-y-1 px-4 text-left">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === AppView.DASHBOARD} onClick={() => setView(AppView.DASHBOARD)} />
          <SidebarItem icon={Globe} label="Foreign Pass" active={view === AppView.WORKER_LIST} onClick={() => setView(AppView.WORKER_LIST)} />
          <SidebarItem icon={Users} label="Local Staff" active={view === AppView.LOCAL_WORKER_LIST} onClick={() => setView(AppView.LOCAL_WORKER_LIST)} />
          <SidebarItem icon={ShieldCheck} label="Insurance & WIC" active={view === AppView.INSURANCE} onClick={() => setView(AppView.INSURANCE)} />
          <SidebarItem icon={Settings} label="System CRM" active={view === AppView.SETTINGS} onClick={() => setView(AppView.SETTINGS)} />
        </nav>
        <div className="p-4 border-t border-gray-50 text-left"><button onClick={onBack} className="w-full flex items-center space-x-3 px-6 py-4 text-gray-400 hover:text-red-600 hover:bg-red-50 transition rounded-2xl font-bold text-sm"><LogOut size={20} /><span>Return to hub</span></button></div>
      </aside> 
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50/30 text-left">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 shrink-0 z-10 text-left">
          <div className="flex items-center gap-4 text-left"><button className="lg:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-left">{(view || '').replace(/_/g, ' ')}</h2></div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase ${isVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>{isVerified ? <Unlock size={12}/> : <Lock size={12}/>} {isVerified ? 'Unlocked' : 'Read Only'}</div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 scroll-smooth no-scrollbar text-left">
          <div className="max-w-7xl mx-auto text-left">
            {view === AppView.DASHBOARD && (
                <div className="space-y-10 animate-fade-in text-left pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                        <StatCard title="Foreign Levy Sum" value={formatCurrency(stats.totalLevy)} icon={Landmark} colorClass="bg-indigo-600" highlight />
                        <StatCard title="Total Monthly Payroll" value={formatCurrency(stats.totalSalary)} icon={DollarSign} colorClass="bg-slate-900" highlight />
                        <StatCard title="Expiring Passes" value={stats.expiringSoon} icon={AlertTriangle} colorClass="bg-rose-600" subtext="Within 60 Days" />
                        <StatCard title="Active Workforce" value={stats.totalWorkers} icon={Users} colorClass="bg-emerald-600" subtext={`${stats.foreignWorkersCount} Foreign / ${stats.localWorkersCount} Local`} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 text-left">
                                <div className="text-left">
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Personnel Breakdown</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed HR Metrics</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-6 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Total CPF Liability (Local)</p>
                                        <p className="text-2xl font-black text-slate-900 tabular-nums">{formatCurrency(stats.totalCpf)}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Employer: {formatCurrency(stats.totalEmployerCpf)} / Employee: {formatCurrency(stats.totalEmployeeCpf)}</p>
                                    </div>
                                    <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-left">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase mb-2">Foreign Pass Volume</p>
                                        <p className="text-2xl font-black text-indigo-700">{stats.foreignWorkersCount} Permits</p>
                                        <p className="text-[8px] font-bold text-indigo-400 uppercase mt-1">Active Site Workforce</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-900 rounded-[2rem] text-white text-left">
                                    <div className="flex justify-between items-center text-left">
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1 tracking-widest">Estimated Monthly Personnel Burn</p>
                                            <p className="text-4xl font-black tabular-nums">{formatCurrency(stats.totalSalary + stats.totalLevy + stats.totalEmployerCpf)}</p>
                                        </div>
                                        <TrendingUp className="text-emerald-400" size={32}/>
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-4 tracking-widest">Calculated on: Total Salaries + Levy Sum + Employer CPF Contributions</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col text-left">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-rose-50/30 text-left">
                                <div className="flex items-center gap-3 text-left">
                                    <ShieldAlert className="text-rose-500" size={20}/>
                                    <div className="text-left">
                                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Compliance Watch</h4>
                                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Passes Expiring Soon</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3 text-left">
                                {workers.filter(w => w.workerType === 'FOREIGN' && isExpiringSoon(w.passExpiryDate))
                                    .sort((a,b) => calculateDaysLeft(a.passExpiryDate) - calculateDaysLeft(b.passExpiryDate))
                                    .map(w => {
                                        const days = calculateDaysLeft(w.passExpiryDate);
                                        return (
                                            <div key={w.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all text-left">
                                                <div className="min-w-0 flex-1 mr-4 text-left">
                                                    <p className="font-black text-slate-800 text-xs uppercase truncate">{w.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{w.company || 'UNASSIGNED'}</p>
                                                </div>
                                                <div className={`px-3 py-1.5 rounded-xl text-center shrink-0 border ${days <= 30 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                                    <p className="text-xs font-black tabular-nums leading-none">{days}</p>
                                                    <p className="text-[7px] font-bold uppercase tracking-tighter mt-0.5">DAYS</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                                {stats.expiringSoon === 0 && (
                                    <div className="py-20 text-center text-slate-300">
                                        <CheckCircle2 size={40} className="mx-auto mb-4 opacity-20"/>
                                        <p className="text-[9px] font-black uppercase tracking-widest">All permits verified</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                                <button onClick={() => setView(AppView.WORKER_LIST)} className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all">Personnel Registry</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {view === AppView.WORKER_LIST && (
                <div className="animate-fade-in space-y-6 text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Work Permit Holders</h3>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <select 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer text-left"
                                    value={companyFilter}
                                    onChange={e => setCompanyFilter(e.target.value)}
                                >
                                    <option value="">All Entities</option>
                                    {crmData.companies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button onClick={() => handleActionWithVerification(() => { setFormData({...INITIAL_WORKER_DATA, workerType: 'FOREIGN'}); setView(AppView.ADD_WORKER); })} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-900/10 shrink-0">+ New Staff</button>
                        </div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-left">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-left">
                                <tr className="text-left">
                                    <th className="px-8 py-5">Personnel Detail</th>
                                    <th className="px-6 py-5">Entity</th>
                                    <th className="px-6 py-5">Pass Expiry</th>
                                    <th className="px-8 py-5 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-left">
                                {workers
                                    .filter(w => w.workerType === 'FOREIGN' && (companyFilter === '' || w.company === companyFilter))
                                    .map(w => (
                                        <tr key={w.id} className="hover:bg-slate-50 group transition-all text-left">
                                            <td className="px-8 py-6 text-left">
                                                <div className="font-black text-slate-800 text-base leading-none uppercase">{w.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">{w.wpFinNric} • {w.occupationTitle}</div>
                                            </td>
                                            <td className="px-6 py-6 text-left">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{w.company || 'Unassigned'}</span>
                                            </td>
                                            <td className="px-6 py-6 font-black text-slate-900 tabular-nums text-left">{w.passExpiryDate || '—'}</td>
                                            <td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex justify-end gap-2 text-right">
                                                    <button onClick={() => handleEdit(w)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDelete(w)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                {workers.filter(w => w.workerType === 'FOREIGN' && (companyFilter === '' || w.company === companyFilter)).length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">No personnel found matching this selection</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {view === AppView.LOCAL_WORKER_LIST && (
                <div className="animate-fade-in space-y-6 text-left">
                    <div className="flex justify-between items-center text-left text-left">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight text-left">Citizen/PR Personnel</h3>
                        <button onClick={() => handleActionWithVerification(() => { setFormData({...INITIAL_WORKER_DATA, workerType: 'LOCAL'}); setView(AppView.ADD_WORKER); })} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-indigo-900/10">+ New Local Staff</button>
                    </div>
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden text-left">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-left text-left">
                                <tr className="text-left">
                                    <th className="px-8 py-5">Employee Detail</th>
                                    <th className="px-6 py-5">Employment Entity</th>
                                    <th className="px-6 py-5 text-right">Base Salary</th>
                                    <th className="px-8 py-5 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-left">
                                {workers.filter(w=>w.workerType==='LOCAL').map(w=>(<tr key={w.id} className="hover:bg-slate-50 group transition-all text-left"><td className="px-8 py-6 text-left"><div className="font-black text-slate-800 text-base leading-none uppercase">{w.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">{w.wpFinNric} • {w.occupationTitle}</div></td><td className="px-6 py-6"><span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-tight">{w.company || 'Unassigned'}</span></td><td className="px-6 py-6 text-right font-black text-slate-900 tabular-nums">{formatCurrency(w.salary)}</td><td className="px-8 py-6 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex justify-end gap-2 text-right"><button onClick={() => handleEdit(w)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button><button onClick={() => handleDelete(w)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button></div></td></tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {(view === AppView.ADD_WORKER || view === AppView.EDIT_WORKER) && (
                <div className="animate-fade-in space-y-10 max-w-6xl mx-auto pb-40 text-left">
                    <header className="flex justify-between items-center border-b border-slate-200 pb-8 text-left"><div className="flex items-center gap-4 text-left"><button onClick={() => setView(formData.workerType==='LOCAL'?AppView.LOCAL_WORKER_LIST:AppView.WORKER_LIST)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all text-left"><ArrowLeft/></button><div><h2 className="text-3xl font-black text-slate-900 uppercase">{view === AppView.ADD_WORKER ? 'New Entry' : 'Edit Entry'}</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formData.workerType} Registry Specification</p></div></div><button onClick={handleSaveWorker} disabled={isSaving} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/10 hover:bg-indigo-700 transition-all flex items-center gap-2">{isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Synchronize Data</button></header>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-400 border border-slate-400 text-left">
                        {renderFormInput("Full Name", "name")}
                        {renderFormInput("Entity Registry", "company", "select")}
                        {renderFormInput("NRIC / FIN", "wpFinNric")}
                        {renderFormInput("Nationality", "nationality", "select")}
                        {renderFormInput("Trade Title", "occupationTitle", "select")}
                        {renderFormInput("Date of Birth", "dateOfBirth", "date")}
                        {renderFormInput("Rate Basis", "rateType", "select")}
                        <div className="col-span-1 lg:col-span-2 bg-indigo-50/30 p-4 border-b border-slate-400 flex items-center gap-4 text-left">
                           <Coins size={18} className="text-indigo-600"/>
                           <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">Fiscal Remuneration Specification</span>
                        </div>
                        {renderFormInput("Actual Wage ($)", "salary", "number")}
                        {renderFormInput("MOM Declared ($)", "momSalary", "number")}
                        {renderFormInput("Monthly Levy ($)", "levyRate", "number", formData.workerType === 'LOCAL')}
                        {renderFormInput("Pass Expiry", "passExpiryDate", "date", formData.workerType === 'LOCAL')}
                        {renderFormInput("WP Number", "wpNumber", "text", formData.workerType === 'LOCAL')}
                        {renderFormInput("Payroll Status", "isExcludedFromPayroll", "checkbox")}
                        {renderFormInput("System Flags", "showInSupervisorApp", "checkbox")}
                    </div>
                </div>
            )}
            {view === AppView.INSURANCE && <InsuranceView policies={policies} isDataReady={isDataReady} handleAction={handleActionWithVerification} refresh={refresh} />}
            {view === AppView.SETTINGS && <HrSettingsView crmData={crmData} isDataReady={isDataReady} setCrmDataState={setCrmDataState} />}
          </div>
        </div>
      </main>
    </div>
  );
};