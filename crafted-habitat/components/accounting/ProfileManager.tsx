
import React, { useState, useEffect, useRef } from 'react';
import { CompanyProfile } from '../../types';
import { getCompanyProfiles, saveCompanyProfiles, compressImage } from '../../utils';
import { 
  Building2, Plus, Trash2, Save, X, Upload, ImageIcon, 
  MapPin, Phone, Mail, Globe, ShieldCheck, Stamp, PenTool,
  // Added ChevronRight and Landmark to fix missing name errors
  Loader2, CheckCircle2, Building, ChevronRight, Landmark
} from 'lucide-react';
import { Button } from '../Button';

export const ProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Partial<CompanyProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const sigInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const data = await getCompanyProfiles();
      setProfiles(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProfile?.name) return alert("Entity Name is required.");
    setIsSaving(true);
    try {
      const newProfile = {
        ...editingProfile,
        id: editingProfile.id || 'PROF_' + Date.now(),
        name: editingProfile.name.toUpperCase()
      } as CompanyProfile;

      const updated = editingProfile.id 
        ? profiles.map(p => p.id === editingProfile.id ? newProfile : p)
        : [newProfile, ...profiles];

      await saveCompanyProfiles(updated);
      setProfiles(updated);
      setEditingProfile(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this entity profile?")) return;
    const updated = profiles.filter(p => p.id !== id);
    await saveCompanyProfiles(updated);
    setProfiles(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logoUrl' | 'stampUrl' | 'signatureUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    try {
      // Use high-fidelity PNG for stamps and signatures to preserve transparency
      const base64 = await compressImage(file, 600, 0.9, type === 'logoUrl' ? 'image/jpeg' : 'image/png');
      setEditingProfile(prev => ({ ...prev, [type]: base64 }));
    } finally {
      setIsSaving(false);
    }
    if (e.target) e.target.value = '';
  };

  if (isLoading) return <div className="py-20 flex flex-col items-center gap-4 opacity-30"><Loader2 className="animate-spin" size={48}/><span className="text-[10px] font-black uppercase tracking-widest">Accessing Vault...</span></div>;

  return (
    <div className="space-y-10 animate-fade-in text-left">
      <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
          <div className="relative z-10 text-left">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Entity Branding</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Manage multiple issuing company profiles</p>
          </div>
          <button 
            onClick={() => setEditingProfile({ name: '', uen: '', address: '', phone: '', email: '' })}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={18}/> New Profile
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profiles.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative flex flex-col text-left">
                  <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 overflow-hidden shadow-inner">
                          {p.logoUrl ? <img src={p.logoUrl} className="w-full h-full object-contain p-2" /> : <Building2 className="text-indigo-400" size={28}/>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingProfile(p)} className="p-2 text-slate-300 hover:text-indigo-600"><PenTool size={18}/></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={18}/></button>
                      </div>
                  </div>
                  <div className="space-y-1 flex-1 text-left">
                      <h4 className="font-black text-slate-900 text-lg uppercase truncate">{p.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UEN: {p.uen}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                          {p.stampUrl && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase">Stamp Loaded</span>}
                          {p.signatureUrl && <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-2 py-0.5 rounded border border-blue-100 uppercase">Sig Loaded</span>}
                      </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-left">
                      <div className="text-left">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Assigned Email</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{p.email}</p>
                      </div>
                      <button onClick={() => setEditingProfile(p)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1">Modify <ChevronRight size={12}/></button>
                  </div>
              </div>
          ))}
          {profiles.length === 0 && (
              <div className="col-span-full py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-4">
                  <Building size={64} className="opacity-10"/>
                  <p className="text-[10px] font-black uppercase tracking-widest">No profiles configured</p>
              </div>
          )}
      </div>

      {editingProfile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/20">
                  <header className="p-8 border-b border-slate-50 bg-indigo-50/30 flex justify-between items-center text-left">
                      <div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Registry Editor</span>
                          <h3 className="text-2xl font-black text-slate-900 uppercase">Entity Configuration</h3>
                      </div>
                      <button onClick={() => setEditingProfile(null)} className="p-3 bg-white text-slate-400 rounded-full border border-slate-100 shadow-sm hover:bg-slate-50 transition-all"><X/></button>
                  </header>
                  <div className="p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 text-left overflow-y-auto max-h-[70vh] no-scrollbar">
                      <div className="space-y-6 text-left">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Name (as per ACRA)</label>
                              <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={editingProfile.name} onChange={e => setEditingProfile({...editingProfile, name: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-left">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UEN No.</label>
                                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-black uppercase outline-none text-left" value={editingProfile.uen} onChange={e => setEditingProfile({...editingProfile, uen: e.target.value.toUpperCase()})} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Reg No. (Optional)</label>
                                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs font-black uppercase outline-none text-left" value={editingProfile.gstRegNo || ''} onChange={e => setEditingProfile({...editingProfile, gstRegNo: e.target.value.toUpperCase()})} />
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registered Address</label>
                              <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs uppercase outline-none h-24 resize-none text-left" value={editingProfile.address} onChange={e => setEditingProfile({...editingProfile, address: e.target.value.toUpperCase()})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-left">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-left" value={editingProfile.phone} onChange={e => setEditingProfile({...editingProfile, phone: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-left" value={editingProfile.email} onChange={e => setEditingProfile({...editingProfile, email: e.target.value})} />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-8 text-left">
                          <div className="grid grid-cols-2 gap-4 text-left">
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Corporate Logo</label>
                                  <div onClick={() => logoInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white transition-all overflow-hidden relative group/img">
                                      {editingProfile.logoUrl ? <img src={editingProfile.logoUrl} className="w-full h-full object-contain p-4" /> : <ImageIcon className="text-slate-300" size={32}/>}
                                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logoUrl')} />
                                  </div>
                              </div>
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Company Stamp</label>
                                  <div onClick={() => stampInputRef.current?.click()} className="h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white transition-all overflow-hidden relative">
                                      {editingProfile.stampUrl ? <img src={editingProfile.stampUrl} className="w-full h-full object-contain p-4 opacity-60" /> : <Stamp className="text-slate-300" size={32}/>}
                                      <input type="file" ref={stampInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'stampUrl')} />
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-2 text-left">
                               <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Default Signatory (PNG preferred)</label>
                               <div onClick={() => sigInputRef.current?.click()} className="h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-white transition-all overflow-hidden relative">
                                   {editingProfile.signatureUrl ? <img src={editingProfile.signatureUrl} className="w-full h-full object-contain p-2" /> : <PenTool className="text-slate-300" size={24}/>}
                                   <input type="file" ref={sigInputRef} className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'signatureUrl')} />
                               </div>
                               <p className="text-[8px] text-slate-400 font-bold uppercase italic mt-2">Used for automatic verification of Tax Invoices and P.O.s</p>
                          </div>
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-left">
                                <h4 className="text-[10px] font-black text-indigo-900 uppercase flex items-center gap-2 mb-2"><Landmark size={12}/> Banking Details</h4>
                                <div className="grid grid-cols-1 gap-2 text-left">
                                    <input className="bg-transparent border-b border-indigo-200 text-[10px] font-bold p-1 outline-none uppercase" placeholder="BANK NAME" value={editingProfile.bankName || ''} onChange={e => setEditingProfile({...editingProfile, bankName: e.target.value})} />
                                    <input className="bg-transparent border-b border-indigo-200 text-[10px] font-bold p-1 outline-none uppercase" placeholder="ACCOUNT NAME" value={editingProfile.accountName || ''} onChange={e => setEditingProfile({...editingProfile, accountName: e.target.value})} />
                                    <input className="bg-transparent border-b border-indigo-200 text-[10px] font-bold p-1 outline-none uppercase" placeholder="ACCOUNT NUMBER" value={editingProfile.accountNumber || ''} onChange={e => setEditingProfile({...editingProfile, accountNumber: e.target.value})} />
                                    <input className="bg-transparent border-b border-indigo-200 text-[10px] font-bold p-1 outline-none uppercase" placeholder="PAYNOW UEN" value={editingProfile.paynowUen || ''} onChange={e => setEditingProfile({...editingProfile, paynowUen: e.target.value})} />
                                </div>
                          </div>
                      </div>
                  </div>
                  <footer className="p-8 border-t border-slate-50 bg-slate-50 flex justify-center">
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-24 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                      >
                          {isSaving ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                          Authorize Profile Update
                      </button>
                  </footer>
              </div>
          </div>
      )}
    </div>
  );
};
