
import React, { useRef, useState } from 'react';
import { AppSettings, CompanySettings } from '../../types';
import { 
  Settings as SettingsIcon, Building, Download, Camera, CreditCard, 
  Database, Upload, AlertTriangle, Lock, Users, UserPlus, 
  Trash2, ShieldCheck, ShieldAlert, UserCheck, Shield, Edit2, Info, X, PenTool, Image as ImageIcon,
  HardHat, Building2, User as UserIcon, Loader2
} from 'lucide-react';
import { exportDatabase, saveSettings, importDatabase, getSettings, compressImage } from '../../utils';
import { Button } from '../Button';

interface SettingsProps {
  settings: AppSettings;
  onUpdate: () => void;
}

const AccountingSettings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [localSettings, setLocalSettings] = useState<CompanySettings>(settings);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    title: '',
    role: 'STAFF',
    pin: '',
    password: '',
    signatureUrl: '',
    permissions: [] as string[]
  });

  const handleSave = async () => {
    setIsSyncing(true);
    try {
        await saveSettings(localSettings);
        onUpdate();
        alert("System settings and team registry applied.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalSettings({...localSettings, logoUrl: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleUserSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Fix: Use image/png to preserve signature transparency
        const base64 = await compressImage(file, 400, 0.9, 'image/png');
        setUserForm(prev => ({ ...prev, signatureUrl: base64 }));
      } catch (err) {
        console.error("Signature upload failed", err);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.role || !userForm.password) {
        alert("Name, Role, and Password are required for system access.");
        return;
    }
    
    setIsSyncing(true);
    try {
        // Fetch latest to avoid stale data overwrite
        const dbSettings = await getSettings();
        
        const newUser = {
            ...userForm,
            id: userForm.id || 'USR_' + Date.now(),
            name: userForm.name.toUpperCase(),
            password: userForm.password.toUpperCase()
        };
        
        const existing = dbSettings.supervisors || [];
        const updated = userForm.id 
            ? existing.map(u => u.id === userForm.id ? newUser : u)
            : [...existing, newUser];
            
        const mergedSettings = { ...dbSettings, supervisors: updated };
        
        await saveSettings(mergedSettings);
        setLocalSettings(mergedSettings);
        setShowAddUser(false);
        setUserForm({ id: '', name: '', title: '', role: 'STAFF', pin: '', password: '', signatureUrl: '', permissions: [] });
        onUpdate();
    } finally {
        setIsSyncing(false);
    }
  };

  const deleteUser = async (id: string) => {
      if (!confirm("Permanently remove this user's access?")) return;
      
      setIsSyncing(true);
      try {
          const dbSettings = await getSettings();
          const updated = (dbSettings.supervisors || []).filter(u => u.id !== id);
          const newSettings = { ...dbSettings, supervisors: updated };
          
          await saveSettings(newSettings);
          setLocalSettings(newSettings);
          onUpdate();
      } finally {
          setIsSyncing(false);
      }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("CRITICAL: This will overwrite ALL current financial records, projects, and payroll data. Proceed?")) {
      importDatabase(file, () => {
        alert("Database restored successfully. Application will refresh.");
        window.location.reload();
      });
    }
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  const staffUsers = (localSettings.supervisors || []).filter(u => u.role === 'STAFF');
  const supervisorUsers = (localSettings.supervisors || []).filter(u => u.role === 'SUPERVISOR');

  return (
    <div className="max-w-7xl space-y-10 pb-24 animate-fade-in mx-auto px-4 text-left">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
          <div className="relative z-10 text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">System Configuration</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Infrastructure & Access Control</p>
          </div>
          <button 
            disabled={isSyncing}
            onClick={handleSave} 
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
              {isSyncing && <Loader2 className="animate-spin" size={16}/>}
              {isSyncing ? 'Synchronizing...' : 'Save All Changes'}
          </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        
        {/* LEFT COLUMN: COMPANY & SECURITY */}
        <div className="xl:col-span-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-50 pb-4"><Building size={20} className="text-indigo-600" /><h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Identity</h4></div>
                <div className="space-y-4">
                    <div className="flex justify-center"><div onClick={() => logoInputRef.current?.click()} className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center cursor-pointer bg-slate-50 group transition-all">{localSettings.logoUrl ? <img src={localSettings.logoUrl} className="w-full h-full object-contain p-3" alt="Logo" /> : <Camera size={24} className="text-slate-300" />}<input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} /></div></div>
                    <div className="space-y-1 text-left"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Name</label><input type="text" value={localSettings.name} onChange={e => setLocalSettings({...localSettings, name: e.target.value.toUpperCase()})} className="w-full p-4 rounded-2xl border border-slate-100 text-sm font-black bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" /></div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-50 pb-4"><Lock size={20} className="text-rose-600" /><h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Master Security</h4></div>
                <div className="space-y-4 text-left">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Admin Password</label>
                        <input type="text" className="w-full p-4 rounded-2xl border border-slate-100 text-xl font-black tracking-widest text-center bg-slate-50 outline-none focus:ring-4 focus:ring-rose-500/5 uppercase" value={localSettings.adminPassword || localSettings.adminPin || ''} onChange={e => setLocalSettings({...localSettings, adminPassword: e.target.value.toUpperCase(), adminPin: e.target.value.substring(0,4)})} placeholder="ACCESS KEY" />
                        <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">Required for Financials & Settings</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HR Manager PIN</label>
                        <input type="password" maxLength={4} className="w-full p-4 rounded-2xl border border-slate-100 text-2xl font-black tracking-widest text-center bg-slate-50 outline-none focus:ring-4 focus:ring-rose-500/5" value={localSettings.hrPin} onChange={e => setLocalSettings({...localSettings, hrPin: e.target.value})} />
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
                <div className="flex items-center gap-3"><Database size={20} className="text-indigo-400"/><h4 className="font-black uppercase text-sm">Cold Storage</h4></div>
                <div className="space-y-3">
                    <button onClick={exportDatabase} className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <Download size={16}/> Local Database Export
                    </button>
                    <button onClick={() => restoreInputRef.current?.click()} className="w-full py-4 bg-rose-50/10 border border-rose-500/20 text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Upload size={16}/> Restore From File
                    </button>
                    <input type="file" accept=".json" className="hidden" ref={restoreInputRef} onChange={handleRestore} />
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: TEAM MANAGEMENT */}
        <div className="xl:col-span-3 space-y-8">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="text-left">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Users size={24} className="text-indigo-600"/> Team & App Access
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure staff passwords and application visibility</p>
                    </div>
                    <button 
                        disabled={isSyncing}
                        onClick={() => {
                            setUserForm({ id: '', name: '', title: '', role: 'STAFF', pin: '', password: '', signatureUrl: '', permissions: [] });
                            setShowAddUser(true);
                        }}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <UserPlus size={16}/>}
                        Add New Account
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                    {isSyncing && (
                        <div className="py-20 flex flex-col items-center gap-4 text-indigo-600 opacity-50">
                            <Loader2 className="animate-spin" size={48}/>
                            <span className="text-sm font-black uppercase tracking-widest">Updating team registry...</span>
                        </div>
                    )}
                    {!isSyncing && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* STAFF LIST */}
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                    <Building2 size={16}/> Office Staff (Limited Access)
                                </h4>
                                <div className="space-y-3">
                                    {staffUsers.map(user => (
                                        <div key={user.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group flex items-center justify-between text-left">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-black text-slate-900 uppercase leading-none text-sm">{user.name}</h5>
                                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{user.title || 'STAFF'}</p>
                                                    <p className="text-[7px] font-black text-indigo-400 uppercase mt-1">ACCESS: {user.permissions?.join(', ') || 'NONE'}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setUserForm(user as any); setShowAddUser(true); }} className="p-2 text-slate-300 hover:text-indigo-600 rounded-xl transition-all"><Edit2 size={18}/></button>
                                                <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {staffUsers.length === 0 && (
                                        <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                            <UserIcon size={32}/>
                                            <p className="text-[10px] font-black uppercase">No office staff registered</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SUPERVISOR LIST */}
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-3 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                                    <HardHat size={16}/> Site Supervisors (Site App Only)
                                </h4>
                                <div className="space-y-3">
                                    {supervisorUsers.map(user => (
                                        <div key={user.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group flex items-center justify-between text-left">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shadow-inner">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <h5 className="font-black text-slate-900 uppercase leading-none text-sm">{user.name}</h5>
                                                    <p className="text-[8px] text-amber-600/60 font-black uppercase tracking-widest mt-1.5">SITE OPERATIONS</p>
                                                    <p className="text-[7px] font-black text-amber-500 uppercase mt-1">ACCESS: FIELD LOGS & ATTENDANCE ONLY</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setUserForm(user as any); setShowAddUser(true); }} className="p-2 text-slate-300 hover:text-amber-600 rounded-xl transition-all"><Edit2 size={18}/></button>
                                                <button onClick={() => deleteUser(user.id)} className="p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {supervisorUsers.length === 0 && (
                                        <div className="py-20 text-center opacity-30 italic flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                            <HardHat size={32}/>
                                            <p className="text-[10px] font-black uppercase">No supervisors registered</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-8 bg-indigo-50/30 border-t border-slate-50 flex items-start gap-4 shrink-0">
                    <Info size={20} className="text-indigo-600 shrink-0"/>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Access Control Matrix</p>
                        <p className="text-[10px] text-indigo-700 font-medium leading-relaxed uppercase mt-1">
                            **Office Staff** can only access selected modules. **Supervisors** are strictly limited to the Field Site App. Use the individual Access Keys to log in from the main screen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* USER MANAGEMENT MODAL */}
      {showAddUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6 text-left">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/20">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
                    <div className="text-left">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Account Registry</span>
                        <h3 className="text-2xl font-black text-slate-900 uppercase">{userForm.id ? 'Edit Account' : 'New User Access'}</h3>
                    </div>
                    <button onClick={() => !isSyncing && setShowAddUser(false)} className="p-2 bg-white rounded-full text-slate-400 border border-slate-100 shadow-sm hover:text-slate-800 transition-all disabled:opacity-50"><X size={24}/></button>
                </div>
                <div className="p-10 space-y-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input disabled={isSyncing} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all disabled:opacity-50" placeholder="e.g. ROBERT TAN" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                                <select disabled={isSyncing} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none appearance-none disabled:opacity-50" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                    <option value="STAFF">OFFICE STAFF</option>
                                    <option value="SUPERVISOR">SITE SUPERVISOR</option>
                                </select>
                            </div>
                        </div>

                        {userForm.role === 'STAFF' && (
                            <>
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Designation (Title)</label>
                                    <input disabled={isSyncing} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none disabled:opacity-50" placeholder="e.g. PROJECT MANAGER" value={userForm.title} onChange={e => setUserForm({...userForm, title: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Assigned Permissions</label>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        {['PROJECTS', 'LOGISTICS', 'INVOICES', 'VAULT', 'PAYROLL', 'QUOTES', 'HR', 'NOTIFICATIONS'].map(p => (
                                            <label key={p} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all">
                                                <input 
                                                    disabled={isSyncing}
                                                    type="checkbox" 
                                                    checked={userForm.permissions?.includes(p)} 
                                                    onChange={e => {
                                                        const current = userForm.permissions || [];
                                                        const next = e.target.checked ? [...current, p] : current.filter(x => x !== p);
                                                        setUserForm({...userForm, permissions: next});
                                                    }}
                                                    className="w-5 h-5 rounded text-indigo-600 disabled:opacity-50" 
                                                />
                                                <span className="text-[10px] font-black uppercase text-slate-600">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock size={14}/> App Access Key (Password)</label>
                            <input disabled={isSyncing} type="text" className="w-full p-4 bg-slate-900 border-none rounded-2xl text-lg font-black text-white tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/20 uppercase disabled:opacity-50" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value.toUpperCase()})} placeholder="SET ACCESS KEY" />
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1.5 ml-1">The user will type this exact key on the login screen to enter their workspace.</p>
                        </div>

                        {userForm.role === 'STAFF' && (
                            <div className="space-y-4 p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><PenTool size={14}/> Authorized Signature</label>
                                    {userForm.signatureUrl && <button disabled={isSyncing} onClick={() => setUserForm({...userForm, signatureUrl: ''})} className="text-[8px] font-black text-rose-500 uppercase disabled:opacity-50">Clear</button>}
                                </div>
                                <div onClick={() => !isSyncing && signatureInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center cursor-pointer group hover:bg-slate-100 transition-all relative overflow-hidden">
                                    {userForm.signatureUrl ? (
                                        <img src={userForm.signatureUrl} className="w-full h-full object-contain p-4" alt="Sig Preview" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300">
                                            <Upload size={32}/>
                                            <span className="text-[8px] font-black uppercase">Upload Signature PNG</span>
                                        </div>
                                    )}
                                    <input disabled={isSyncing} type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={handleUserSignatureUpload} />
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold leading-relaxed uppercase italic">Signature used for verifying Tax Invoices and P.O. documents.</p>
                            </div>
                        )}
                    </div>
                    <button 
                        disabled={isSyncing}
                        onClick={handleAddUser} 
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-sm tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {isSyncing && <Loader2 className="animate-spin" size={20}/>}
                        {isSyncing ? 'AUTHORIZING...' : 'Authorize Profile Entry'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AccountingSettings;
