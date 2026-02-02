
import React, { useState } from 'react';
import { CompanySettings } from '../../types';
import { saveSettings, exportDatabase } from '../../utils';
import { Button } from '../Button';
import { Download, Building, Globe, Shield, Phone, FileText, MapPin } from 'lucide-react';

interface PayrollSettingsProps {
  settings: CompanySettings;
  onUpdate: () => void;
}

export const PayrollSettings: React.FC<PayrollSettingsProps> = ({ settings, onUpdate }) => {
    const [localSettings, setLocalSettings] = useState<CompanySettings>(settings);

    const handleSave = () => {
        saveSettings(localSettings);
        onUpdate();
        alert('Settings saved successfully!');
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings({...localSettings, logoUrl: reader.result as string});
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-2">
                    <Building className="text-indigo-600" size={20} />
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Company Profile</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Company Name</label>
                        <input 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={localSettings.name} 
                            onChange={(e) => setLocalSettings({...localSettings, name: e.target.value})} 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">UEN / Registration Number</label>
                        <input 
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            placeholder="e.g. 202339022H"
                            value={localSettings.uen || ''} 
                            onChange={(e) => setLocalSettings({...localSettings, uen: e.target.value.toUpperCase()})} 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Logo</label>
                        <div className="flex items-center space-x-6 p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                            {localSettings.logoUrl ? (
                                <img src={localSettings.logoUrl} alt="Logo Preview" className="h-20 w-20 object-contain bg-white rounded-xl border border-slate-200 p-2 shadow-sm" />
                            ) : (
                                <div className="h-20 w-20 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-[10px] font-black">NO LOGO</div>
                            )}
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 font-bold mb-2 uppercase">Upload high-res PNG/JPG</p>
                                <input className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" type="file" accept="image/*" onChange={handleLogoUpload} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={10}/> Registered Address
                        </label>
                        <textarea 
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" 
                            value={localSettings.address} 
                            onChange={(e) => setLocalSettings({...localSettings, address: e.target.value})} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Phone size={10}/> Contact Phone
                            </label>
                            <input 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                                value={localSettings.phone} 
                                onChange={(e) => setLocalSettings({...localSettings, phone: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Globe size={10}/> Website URL
                            </label>
                            <input 
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                                placeholder="https://..."
                                value={localSettings.website || ''} 
                                onChange={(e) => setLocalSettings({...localSettings, website: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Currency</label>
                            <input className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={localSettings.currency} onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Shield size={10}/> Admin PIN
                            </label>
                            <input type="password" maxLength={4} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={localSettings.adminPin} onChange={(e) => setLocalSettings({...localSettings, adminPin: e.target.value})} />
                        </div>
                    </div>
                </div>
                
                <div className="pt-6">
                    <Button onClick={handleSave} className="w-full py-4 rounded-xl shadow-lg shadow-indigo-600/10 bg-indigo-600 hover:bg-indigo-700">Save System Settings</Button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-4 mb-6">
                        <FileText className="text-slate-400" size={20} />
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Data Backup</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">Export your entire financial database to a local JSON file for cold-storage backups or manual record keeping. Restoring from file is disabled to prevent accidental data corruption.</p>
                    
                    <div className="flex flex-col space-y-4">
                        <Button onClick={exportDatabase} variant="outline" className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl border-slate-200 hover:bg-slate-50 font-bold">
                            <Download size={18}/>
                            <span>Download Full Backup (.json)</span>
                        </Button>
                    </div>
                </div>
                
                <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Globe size={120} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="font-black uppercase tracking-[0.2em] text-xs opacity-70 mb-3">Privacy & Safety</h4>
                        <p className="text-lg font-bold leading-snug mb-4">
                            Your records are stored securely in your local browser environment.
                        </p>
                        <p className="text-sm opacity-80 font-medium">
                            Regularly download your backup to ensure you have an offline copy of all company financials, payroll history, and project records.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
