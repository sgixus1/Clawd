import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QuotationApp } from './QuotationApp';
import { PayrollApp } from './PayrollApp';
import { HRApp } from './HRApp';
// Fix: Updated import to use the correctly typed and feature-complete ProjectApp component from components/project
import { ProjectApp } from './components/project/ProjectApp';
import { WhatsAppApp } from './WhatsAppApp';
import { SupervisorApp } from './components/supervisor/SupervisorApp';
import { CustomerPortal } from './components/project/CustomerPortal';
import { SyncManager } from './components/SyncManager';
import { WorkforceDirectory } from './components/WorkforceDirectory';
import InvoiceManager from './components/accounting/InvoiceManager';
import { ProfileManager } from './components/accounting/ProfileManager'; 
import { NotificationApp } from './NotificationApp';
import { DocumentArchive } from './components/DocumentArchive';
import { 
  Calculator, Users, User as UserIcon, Landmark, ShieldCheck, 
  Database, Lock, ShieldAlert, Loader2, Cloud, RefreshCw, CheckCircle2,
  ArrowLeft, Settings, X, Building2, HardHat, Briefcase, Camera, 
  Bell, Check, ChevronRight, Smartphone, FileText, Wind, PlusCircle, ImageIcon, Globe,
  UserPlus, Edit2, Trash2, PenTool, Shield, Info, ShieldAlert as AlertIcon,
  Upload, TrendingUp, Archive, Stamp, Key, Sparkles, WifiOff, Terminal
} from 'lucide-react';
import { getSettings, getProjects, saveProject, deleteProject, getReminders, saveReminders, getInvoices, saveInvoices, formatCurrency, deepSanitizeProject, getQuotations, scrubDuplicates, testBackendConnection } from './utils';
import { CompanySettings, Project, StaffAccount, Reminder, Invoice, SavedQuotation, UserRole, AppType, InvoiceStatus } from './types';
import { DEFAULT_COMPANY_SETTINGS } from './constants';

const FALLBACK_LOGO = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iIzFCMzAyMiIvPgo8L3N2Zz4K`;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [backendError, setBackendError] = useState('');
  const [syncKey, setSyncKey] = useState(0); 
  const [role, setRole] = useState<UserRole>(null);
  const [activeUser, setActiveUser] = useState<StaffAccount | null>(null);
  const [portalProjectId, setPortalProjectId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPortalLogin, setIsPortalLogin] = useState(false);
  const [portalPassword, setPortalPassword] = useState('');
  const [error, setError] = useState('');
  const [currentApp, setCurrentApp] = useState<AppType>('home');
  const [settings, setSettingsState] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  
  const [dueReminder, setDueReminder] = useState<Reminder | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [savedQuotes, setSavedQuotations] = useState<SavedQuotation[]>([]);
  
  const [isMasterLoading, setIsMasterLoading] = useState(true);
  const [isDeepCleaning, setIsDeepCleaning] = useState(false);

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
        const status = await testBackendConnection();
        setIsBackendOnline(status.success);
        setBackendError(status.message);
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshMasterData = async () => {
      setIsMasterLoading(true);
      try {
          const results = await Promise.all([
              getSettings(),
              getProjects(),
              getInvoices(),
              getQuotations()
          ]);
          
          const [dbSettings, dbProjects, dbInvoices, dbQuotes] = results;
          
          if (dbSettings) setSettingsState(dbSettings);
          
          if (Array.isArray(dbProjects)) {
              // DATA FLATTENING PROTECTION (v8.0)
              const processed = dbProjects.map(p => ({
                  ...p,
                  name: p.name || "New Project",
                  client: p.client || "No Client"
              }));
              setProjects(scrubDuplicates(processed));
          }
          
          if (Array.isArray(dbInvoices)) setInvoices(scrubDuplicates(dbInvoices));
          if (Array.isArray(dbQuotes)) setSavedQuotations(scrubDuplicates(dbQuotes));
      } catch (err) {
          console.error("SQL Data fetch failed:", err);
      } finally {
          setIsMasterLoading(false);
      }
  };

  useEffect(() => {
    if (isAuthenticated && isBackendOnline) {
        refreshMasterData();
    }
  }, [syncKey, isAuthenticated, isBackendOnline]);

  const handleUpdateProject = async (updatedProject: Project) => {
      if (isMasterLoading) return;
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      setIsDeepCleaning(true);
      try {
          const cleanProject = await deepSanitizeProject(updatedProject);
          await saveProject(cleanProject);
          setProjects(prev => prev.map(p => p.id === cleanProject.id ? cleanProject : p));
      } catch (err: any) {
          console.error("Failed to save project atomic change:", err);
          setSyncKey(k => k + 1);
      } finally {
          setIsDeepCleaning(false);
      }
  };

  const handleAddNewProject = async (newProj: Project) => {
    setProjects(prev => [newProj, ...prev]);
    await saveProject(newProj);
  };

  const handleDeleteProject = async (id: string) => {
    try {
        await deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
        console.error("Critical failure during project deletion:", err);
        alert("Failed to delete project from database.");
    }
  };

  const handleAddInvoice = async (newInvoice: Invoice) => {
    const currentList = await getInvoices();
    const updated = scrubDuplicates([newInvoice, ...currentList]);
    await saveInvoices(updated);
    setSyncKey(k => k + 1);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Permanently purge this document?")) return;
    const currentList = await getInvoices();
    const updated = currentList.filter(inv => inv.id !== id);
    await saveInvoices(updated);
    setSyncKey(k => k + 1);
  };

  const handleInvoiceStatusChange = async (id: string, status: InvoiceStatus) => {
    // 1. Update Invoices
    const currentInvoices = await getInvoices();
    const targetInvoice = currentInvoices.find(i => i.id === id);
    if (!targetInvoice) return;

    const updatedInvoices = currentInvoices.map(i => i.id === id ? { ...i, status } : i);
    await saveInvoices(updatedInvoices);

    // 2. Reconciliation Handshake
    if (status === 'PAID' && targetInvoice.projectId) {
        const allProjects = await getProjects();
        const project = allProjects.find(p => p.id === targetInvoice.projectId);
        
        if (project) {
            const updatedProject = { ...project };
            if (targetInvoice.type === 'AR') {
                // Client Bill -> Add to payments history
                updatedProject.clientPayments = [...(project.clientPayments || []), {
                    id: `PAY_${Date.now()}`,
                    amount: targetInvoice.totalAmount,
                    date: new Date().toISOString().split('T')[0],
                    reference: targetInvoice.invoiceNo
                }];
            } else if (targetInvoice.type === 'AP') {
                // Supplier Bill -> Increase project spent
                updatedProject.spent = (Number(project.spent) || 0) + targetInvoice.totalAmount;
            }
            await saveProject(updatedProject);
        }
    }
    setSyncKey(k => k + 1); // Triggers re-fetch of all master data
  };

  const handleSendInvoiceReminder = async (id: string) => {
    const currentList = await getInvoices();
    const updated = currentList.map(i => i.id === id ? { ...i, lastReminderSent: new Date().toLocaleDateString() } : i);
    await saveInvoices(updated);
    setSyncKey(k => k + 1);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const checkReminders = async () => {
        try {
            const reminders = await getReminders();
            const now = new Date();
            const currentUserId = role === 'admin' ? 'admin' : activeUser?.id;
            const nextDue = (reminders || []).find(r => {
                if (r.isDismissed) return false;
                if (r.dismissedBy?.includes(currentUserId || '')) return false;
                const isDue = new Date(r.remindAt) <= now;
                if (!isDue) return false;
                if (r.scope === 'ALL') return true;
                if (r.scope === 'SELF' && r.createdBy === currentUserId) return true;
                if (r.scope === 'SPECIFIC' && r.targetUserIds?.includes(currentUserId || '')) return true;
                return false;
            });
            if (nextDue) setDueReminder(nextDue);
        } catch (e) {}
    };
    const interval = setInterval(checkReminders, 30000); 
    checkReminders();
    return () => clearInterval(interval);
  }, [isAuthenticated, syncKey, role, activeUser]);

  const handleDismissReminder = async () => {
      if (!dueReminder) return;
      try {
          const allReminders = await getReminders();
          const currentUserId = role === 'admin' ? 'admin' : activeUser?.id;
          const updated = (allReminders || []).map(r => {
              if (r.id === dueReminder.id) {
                  if (r.scope === 'SELF') return { ...r, isDismissed: true };
                  const dismissedBy = [...(r.dismissedBy || []), currentUserId || ''];
                  return { ...r, dismissedBy };
              }
              return r;
          });
          await saveReminders(updated);
          setDueReminder(null);
          setSyncKey(k => k + 1);
      } catch (e) {}
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const currentSettings = await getSettings();
        let userRole: UserRole = null;
        let foundUser: StaffAccount | null = null;
        const normalizedInput = pinInput.toUpperCase();
        const adminPass = (currentSettings.adminPassword || currentSettings.adminPin || "1920").toUpperCase();
        if (normalizedInput === adminPass) { userRole = 'admin'; } else {
          const match = (currentSettings.supervisors || []).find(s => 
            (s.password && s.password.toUpperCase() === normalizedInput) || (s.pin && s.pin === pinInput)
          );
          if (match) { foundUser = match as any; userRole = match.role === 'SUPERVISOR' ? 'supervisor' : 'staff'; }
        }
        if (userRole) { setError(''); setRole(userRole); setActiveUser(foundUser); setPortalProjectId(null); setIsAuthenticated(true); setSyncKey(k => k + 1); setCurrentApp(userRole === 'supervisor' ? 'supervisor' : 'home'); setPinInput(''); } else { setError('Invalid Access Credentials'); setPinInput(''); }
    } catch (e) { setError('Server Connection Lost'); }
  };

  const handlePortalUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsMasterLoading(true);
    try {
        const freshProjects = await getProjects();
        const match = freshProjects.find(p => p.portalPassword === portalPassword && p.portalEnabled);
        if (match) { 
            setProjects(freshProjects);
            setRole('customer'); 
            setPortalProjectId(match.id); 
            setIsAuthenticated(true); 
            setCurrentApp('portal'); 
        } else { 
            setError('Invalid Access Key or Portal Disabled'); 
        }
    } catch (e) {
        setError('Connection failure during authentication.');
    } finally {
        setIsMasterLoading(false);
    }
  };

  const handleLogout = async () => { setIsAuthenticated(false); setRole(null); setActiveUser(null); setPortalProjectId(null); setCurrentApp('home'); setIsPortalLogin(false); setIsMasterLoading(true); };
  const hasPermission = (module: string) => { if (role === 'admin') return true; if (role === 'staff' && activeUser?.permissions) { return activeUser.permissions.includes(module); } return false; };

  const quotePipelineStats = useMemo(() => {
    const totalValue = (savedQuotes || []).reduce((sum, q) => {
      const qTotal = (q.items || []).reduce((itSum, it) => itSum + (it.total || 0), 0);
      return sum + qTotal;
    }, 0);
    return { count: (savedQuotes || []).length, value: totalValue };
  }, [savedQuotes]);

  const WorkspaceCard = ({ title, description, icon: Icon, onClick, variant = 'standard', permission }: any) => {
    if (permission && !hasPermission(permission)) return null;
    return (
      <button onClick={onClick} className={`group relative flex flex-col items-start p-8 rounded-[2.5rem] transition-all duration-500 text-left w-full h-full shadow-[0_4px_20px_rgba(27,48,34,0.03)] hover:shadow-[0_20px_40px_rgba(27,48,34,0.08)] hover:-translate-y-1 animate-fade-in ${variant === 'highlight' ? 'bg-nature-forest text-white' : 'bg-nature-linen border border-nature-stone/50 text-nature-forest'}`}>
        <div className={`mb-8 p-4 rounded-2xl transition-colors duration-500 ${variant === 'highlight' ? 'bg-white/10 text-white group-hover:bg-white group-hover:text-nature-forest' : 'bg-nature-sand text-nature-forest group-hover:bg-nature-forest group-hover:text-white'}`}><Icon size={24} strokeWidth={1.5} /></div>
        <div className="space-y-3 text-left"><h3 className={`text-xl font-serif font-semibold tracking-tight ${variant === 'highlight' ? 'text-white' : 'text-nature-forest'}`}>{title}</h3><p className={`text-sm leading-relaxed font-medium line-clamp-2 ${variant === 'highlight' ? 'text-white/60' : 'text-nature-forest/60'}`}>{description}</p></div>
        <div className={`mt-12 w-full flex items-center justify-between pt-6 border-t ${variant === 'highlight' ? 'border-white/10' : 'border-nature-stone/30'}`}><span className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity ${variant === 'highlight' ? 'text-white/60' : 'text-nature-forest/60'}`}>Access Module</span><div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${variant === 'highlight' ? 'bg-white/10 text-white group-hover:bg-white group-hover:text-nature-forest' : 'bg-nature-sand text-nature-forest group-hover:bg-nature-forest group-hover:text-white'}`}><ChevronRight size={14} /></div></div>
      </button>
    );
  };

  // --- LOCAL SQL OFFLINE SHIELD ---
  if (!isBackendOnline) {
    return (
      <div className="h-screen bg-nature-sand flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-2xl w-full border border-nature-stone/20 animate-fade-in text-left">
              <div className="flex items-center gap-6 mb-8 text-left">
                  <div className="p-5 bg-rose-600 text-white rounded-3xl shadow-xl animate-pulse">
                      <WifiOff size={40}/>
                  </div>
                  <div className="text-left">
                      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">SQL Hub Offline</h2>
                      <p className="text-rose-600 font-bold uppercase text-[10px] tracking-widest mt-1">Browser-to-Local Connection Refused</p>
                  </div>
              </div>
              
              <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left">
                  <div className="flex gap-4 items-start text-left">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"><Terminal size={20}/></div>
                      <div className="text-left">
                          <h4 className="font-black text-slate-800 text-sm uppercase">Technical Reason</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">Browsers cannot talk directly to your local MySQL. You must run the <strong>Express Proxy</strong> on your PC to bridge the gap.</p>
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200 space-y-4 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Steps:</p>
                      <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</div>
                              Download the app files to your local PC.
                          </li>
                          <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</div>
                              Ensure <strong>MySQL</strong> is running on port 3306.
                          </li>
                          <li className="flex items-center gap-3 text-xs font-bold text-slate-700">
                              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</div>
                              Open terminal and run <code>npm install && npm start</code>.
                          </li>
                      </ul>
                  </div>
              </div>
              
              <div className="mt-10 flex gap-4 text-left">
                  <button onClick={() => window.location.reload()} className="flex-1 py-5 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <RefreshCw size={16}/> Retry Connection
                  </button>
              </div>
              
              <p className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-widest italic">
                  Internal Diagnostic: {backendError}
              </p>
          </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nature-sand flex flex-col items-center justify-center px-6 relative overflow-hidden text-left">
        <div className="w-full max-w-[440px] flex flex-col items-center z-10 text-center">
          <div className="mb-12 text-center">
             <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-nature-stone/20 overflow-hidden"><img src={settings.logoUrl || FALLBACK_LOGO} alt="Logo" className="w-12 h-12 object-contain" /></div>
             <h1 className="text-4xl font-serif font-light text-nature-forest tracking-tight mb-2 uppercase text-center">{settings.name}</h1>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-center text-nature-sage">Operations Control Hub</p>
          </div>
          <div className="w-full bg-white/80 backdrop-blur-xl border border-white rounded-[3rem] shadow-[0_30px_60px_rgba(27,48,34,0.05)] p-10 flex flex-col items-center">
              {!isPortalLogin ? (<><div className="p-5 rounded-full text-white shadow-2xl mb-6 bg-nature-forest"><Lock size={24} strokeWidth={1.5} /></div><h2 className="text-2xl font-serif font-semibold text-nature-forest tracking-tight uppercase mb-8 text-center">Secure Access</h2><form onSubmit={handleUnlock} className="w-full space-y-8"><input type="password" className="w-full bg-transparent border-b-2 border-nature-stone focus:border-nature-sage text-center text-3xl font-light tracking-[0.5em] py-4 outline-none transition-all" placeholder="••••" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />{error && <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">{error}</p>}<button type="submit" className="w-full py-5 bg-nature-forest text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black active:scale-95">Authorize Session</button></form><button onClick={() => { setIsPortalLogin(true); setError(''); }} className="mt-8 text-[10px] font-black uppercase text-nature-sage tracking-widest hover:text-nature-forest transition-colors">Project Owner Login</button></>) : (<><div className="p-5 rounded-full text-white shadow-2xl mb-6 bg-emerald-600"><Globe size={24} strokeWidth={1.5} /></div><h2 className="text-2xl font-serif font-semibold text-nature-forest tracking-tight uppercase mb-8 text-center">Client Portal</h2><form onSubmit={handlePortalUnlock} className="w-full space-y-6"><div className="space-y-1 text-left"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Access Key</label><input type="password" className="w-full bg-nature-sand/50 border border-nature-stone/20 rounded-2xl px-6 py-4 text-sm font-black tracking-[0.2em] outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all" value={portalPassword} onChange={e => setPortalPassword(e.target.value)} placeholder="••••••" autoFocus /></div>{error && <p className="text-rose-600 text-[10px] font-black uppercase tracking-widest text-center animate-pulse">{error}</p>}<button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl hover:bg-emerald-700 active:scale-95">Launch Portal</button></form><button onClick={() => { setIsPortalLogin(false); setError(''); }} className="mt-8 text-[10px] font-black uppercase text-nature-sage tracking-widest hover:text-nature-forest transition-colors">Return to Staff Login</button></>)}
          </div>
        </div>
      </div>
    );
  }

  const userName = role === 'admin' ? (settings.userName || 'Project Director') : (activeUser?.name || 'Authorized User');
  if (role === 'customer' && portalProjectId) {
    const proj = projects.find(p => p.id === portalProjectId) || null;
    return ( <CustomerPortal project={proj} settings={settings} onLogout={handleLogout} onUpdateProject={async (updated) => { handleUpdateProject(updated); }} /> );
  }
  if (role === 'supervisor' && currentApp === 'supervisor') return <SupervisorApp onBack={handleLogout} syncKey={syncKey} supervisorName={activeUser?.name || 'Site Supervisor'} />;
  
  if (currentApp === 'project') return ( <ProjectApp onBack={() => setCurrentApp('home')} onNavigate={(app) => setCurrentApp(app as any)} syncKey={syncKey} projects={projects} onUpdateProject={handleUpdateProject} onAddNewProject={handleAddNewProject} onDeleteProject={handleDeleteProject} companySettings={settings} /> );
  if (currentApp === 'quotation') return <QuotationApp onBack={() => setCurrentApp('home')} />;
  if (currentApp === 'payroll') return <PayrollApp onBack={() => setCurrentApp('home')} syncKey={syncKey} projects={projects} onUpdateProjects={(newList) => setProjects(newList)} onDeleteProject={handleDeleteProject} />;
  if (currentApp === 'hr') return <HRApp onBack={() => setCurrentApp('home')} syncKey={syncKey} />;
  if (currentApp === 'notifications') return <NotificationApp onBack={() => setCurrentApp('home')} activeUser={activeUser} role={role} syncKey={syncKey} />;
  if (currentApp === 'archive') return ( <div className="bg-nature-sand min-h-screen flex flex-col text-left"><header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0"><button onClick={() => setCurrentApp('home')} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors"><ArrowLeft size={18}/> Back to Hub</button><h1 className="ml-8 text-xl font-serif font-semibold text-nature-forest tracking-tight">Unified Vault Archives</h1></header><div className="flex-1 overflow-hidden"><DocumentArchive /></div></div> );
  if (currentApp === 'directory') return ( <div className="bg-nature-sand min-h-screen flex flex-col text-left"><header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0"><button onClick={() => setCurrentApp('home')} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors"><ArrowLeft size={18}/> Back to Hub</button><h1 className="ml-8 text-xl font-serif font-semibold text-nature-forest tracking-tight">Workforce Monitoring</h1></header><div className="flex-1 p-8 overflow-y-auto no-scrollbar"><WorkforceDirectory onBack={() => setCurrentApp('home')} syncKey={syncKey} /></div></div> );
  
  if (currentApp === 'entities') return ( 
    <div className="bg-nature-sand min-h-screen flex flex-col text-left">
        <header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0">
            <button onClick={() => setCurrentApp('home')} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors"><ArrowLeft size={18}/> Back to Hub</button>
            <h1 className="ml-8 text-xl font-serif font-semibold text-nature-forest tracking-tight">Corporate Branding</h1>
        </header>
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <ProfileManager />
        </div>
    </div>
  );

  if (currentApp === 'invoices') return (
    <div className="bg-nature-sand min-h-screen flex flex-col text-left">
        <header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0">
            <button onClick={() => setCurrentApp('home')} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors"><ArrowLeft size={18}/> Back to Hub</button>
            <h1 className="ml-8 text-xl font-serif font-semibold text-nature-forest tracking-tight">Financial Registry</h1>
        </header>
        <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
            <InvoiceManager 
              invoices={invoices} 
              projects={projects} 
              settings={settings} 
              addInvoice={handleAddInvoice} 
              deleteInvoice={handleDeleteInvoice} 
              updateStatus={handleInvoiceStatusChange} 
              sendReminder={handleSendInvoiceReminder} 
            />
        </div>
    </div>
  );
  if (currentApp === 'sync') return ( <div className="bg-nature-sand min-h-screen flex flex-col text-left"><header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0"><button onClick={() => setCurrentApp('home')} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors"><ArrowLeft size={18}/> Back to Hub</button><h1 className="ml-8 text-xl font-serif font-semibold text-nature-forest tracking-tight">System Infrastructure</h1></header><div className="flex-1 p-8 overflow-y-auto no-scrollbar"><SyncManager /></div></div> );
  if (currentApp === 'whatsapp') return <WhatsAppApp onBack={() => setCurrentApp('home')} />;

  return (
    <div className="min-h-screen bg-nature-sand text-nature-forest font-sans selection:bg-nature-sage selection:text-white text-left">
      {dueReminder && ( <div className="fixed inset-0 bg-nature-forest/40 backdrop-blur-md z-[300] flex items-center justify-center p-6 text-left"><div className="bg-white w-full max-sm rounded-[3rem] shadow-2xl overflow-hidden border border-nature-stone/10 animate-in zoom-in-95 text-left"><div className="p-8 border-b border-nature-stone/10 flex justify-between items-center bg-nature-sand/50 text-left"><div className="flex items-center gap-3 text-left"><div className="p-3 bg-nature-forest text-white rounded-2xl shadow-xl animate-bounce"><Bell size={24}/></div><h3 className="text-xl font-serif font-black text-nature-forest uppercase text-left">Notice</h3></div></div><div className="p-8 space-y-6 text-left"><p className="text-lg font-serif font-bold text-nature-forest leading-tight text-left">{dueReminder.title}</p><div className="bg-nature-linen p-6 rounded-[2rem] border border-nature-stone/20 text-left"><p className="text-sm italic text-nature-forest/70 font-medium leading-relaxed text-left">"{dueReminder.message}"</p><p className="text-[9px] font-black uppercase text-nature-sage tracking-widest mt-4 text-left">From: {dueReminder.createdByName || 'System'}</p></div><button onClick={handleDismissReminder} className="w-full py-5 bg-nature-forest text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"><Check size={16}/> Acknowledge</button></div></div></div> )}
      {isDeepCleaning && ( <div className="fixed bottom-10 left-10 z-[500] bg-nature-forest text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-left-4"><div className="p-3 bg-white/10 rounded-xl"><Sparkles size={24} className="animate-spin-slow" /></div><div className="text-left"><p className="text-[10px] font-black uppercase tracking-[0.2em]">Deep Optimization</p><p className="text-[9px] font-bold text-nature-sage uppercase">Shrinking legacy project bloat...</p></div></div> )}
      <nav className="glass-effect border-b border-nature-stone/30 sticky top-0 z-50 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 text-left"><div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-nature-stone/20 overflow-hidden shadow-sm"><img src={settings.logoUrl || FALLBACK_LOGO} alt="Logo" className="w-12 h-12 object-contain" /></div><div className="flex flex-col text-left"><span className="font-serif text-xl font-semibold tracking-tight uppercase text-left leading-none">{settings.name}</span></div></div>
        <div className="flex items-center gap-6"><div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-nature-linen rounded-full border border-nature-stone/20 shadow-sm"><div className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-nature-sage animate-pulse' : 'bg-rose-500'}`}></div><span className="text-[9px] font-black text-nature-forest/40 uppercase tracking-widest">{isBackendOnline ? 'SQL ENGINE ONLINE' : 'SQL OFFLINE'}</span></div><button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-nature-forest/60 hover:text-nature-forest border-l border-nature-stone/30 pl-6 transition-colors">Sign Out</button></div>
      </nav>
      {isMasterLoading ? ( <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4 opacity-50"><Loader2 className="animate-spin text-nature-forest" size={48}/><span className="text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Master Registry...</span></div> ) : (
          <main className="max-w-7xl mx-auto px-8 py-16 animate-fade-in text-left">
              <div className="mb-20 space-y-4 text-left"><h1 className="text-6xl font-serif font-light text-nature-forest tracking-tight leading-tight text-left">Welcome back, <span className="font-semibold italic">{userName}</span></h1><div className="flex items-center gap-4 pt-4 text-left"><div className="text-nature-sand px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg bg-nature-forest">{role === 'admin' ? 'Master Registry' : 'Standard Session'}</div><p className="text-nature-sage/60 font-medium text-sm">{activeUser?.title || (role === 'admin' ? (settings.userTitle || 'SYSTEM DIRECTOR') : 'Authorized Associate')}</p></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-nature-stone/20 shadow-sm flex items-center justify-between group overflow-hidden"><div className="space-y-1 relative z-10 text-left"><p className="text-[10px] font-black text-nature-sage uppercase tracking-[0.2em] text-left">Active Sales Pipeline</p><h4 className="text-4xl font-serif font-bold text-nature-forest text-left">{formatCurrency(quotePipelineStats.value)}</h4><p className="text-xs font-medium text-nature-forest/40 uppercase text-left">{quotePipelineStats.count} Draft Quotations in Market</p></div><div className="p-6 text-nature-forest rounded-3xl transition-all duration-500 relative z-10 bg-nature-sand group-hover:bg-nature-forest group-hover:text-white"><TrendingUp size={32} /></div><div className="absolute top-0 right-0 w-32 h-32 bg-nature-sand/20 rounded-full blur-3xl group-hover:bg-nature-sage/10 transition-colors"></div></div>
                  <div className="bg-nature-linen p-8 rounded-[2.5rem] border border-nature-stone/20 shadow-sm flex items-center justify-between group overflow-hidden"><div className="space-y-1 relative z-10 text-left"><p className="text-[10px] font-black text-nature-sage uppercase tracking-[0.2em] text-left">Deployment Load</p><h4 className="text-4xl font-serif font-bold text-nature-forest text-left">{projects.filter(p => p.status === 'IN_PROGRESS').length} Sites</h4><p className="text-xs font-medium text-nature-forest/40 uppercase text-left">Active Operational Fronts</p></div><div className="p-6 text-nature-forest rounded-3xl transition-all duration-500 relative z-10 bg-nature-sand group-hover:bg-nature-forest group-hover:text-white"><HardHat size={32} /></div><div className="absolute top-0 right-0 w-32 h-32 bg-nature-sand/20 rounded-full blur-3xl group-hover:bg-nature-sage/10 transition-colors"></div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                  <WorkspaceCard title="Project Tracker" description="Orchestrate site logs, daily updates, and timeline milestones." icon={Briefcase} variant="highlight" onClick={() => setCurrentApp('project')} permission="PROJECTS" />
                  {role !== 'supervisor' && (<><WorkspaceCard title="Entity & Branding" description="Manage multiple company profiles, upload stamps and signatures." icon={Stamp} onClick={() => setCurrentApp('entities')} permission="INVOICES" /><WorkspaceCard title="Workforce Logistics" description="Real-time personnel deployment map and site monitoring." icon={Users} onClick={() => setCurrentApp('directory')} permission="LOGISTICS" /><WorkspaceCard title="Invoice Management" description="Financial oversight for client billing and supplier payables." icon={FileText} onClick={() => setCurrentApp('invoices')} permission="INVOICES" /><WorkspaceCard title="Unified Vault" description="Consolidated archive for all historical company documentation." icon={Archive} onClick={() => setCurrentApp('archive')} permission="VAULT" /><WorkspaceCard title="Payroll & Ledger" description="Curate wages, track general ledger, and monitor fiscal burn." icon={Calculator} onClick={() => setCurrentApp('payroll')} permission="PAYROLL" /><WorkspaceCard title="Quotation Lab" description="Bespoke construction costings using the master item library." icon={PlusCircle} onClick={() => setCurrentApp('quotation')} permission="QUOTES" /><WorkspaceCard title="Workforce HR" description="Manage staff details, compliance passes, and insurance." icon={ShieldCheck} onClick={() => setCurrentApp('hr')} permission="HR" /><WorkspaceCard title="Notifications Hub" description="Broadcast updates and set targeted reminders for the team." icon={Bell} onClick={() => setCurrentApp('notifications')} permission="NOTIFICATIONS" /></>)}
                  {role === 'admin' && <WorkspaceCard title="Infrastructure" description="System diagnostic tools and cloud reconciliation manager." icon={Database} onClick={() => setCurrentApp('sync')} />}
              </div>
          </main>
      )}
    </div>
  );
};

export default App;
