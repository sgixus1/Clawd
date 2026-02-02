
import React, { useRef, useState, useEffect } from 'react';
import { CompanyDetails, ClientDetails } from '../types';
import { Input, TextArea } from './Input';
import { Button } from './Button';
import { Building2, User, Upload, Trash2, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react';

interface CompanyProfileProps {
  company: CompanyDetails;
  client: ClientDetails;
  onUpdateCompany: (details: CompanyDetails) => void;
  onUpdateClient: (details: ClientDetails) => void;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  company,
  client,
  onUpdateCompany,
  onUpdateClient,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state to manage form inputs without immediate sync loop interference
  const [localCompany, setLocalCompany] = useState<CompanyDetails>(company);
  const [isSaved, setIsSaved] = useState(false);

  // Sync local state if external prop changes (e.g., from a cloud pull)
  useEffect(() => {
    setLocalCompany(company);
  }, [company]);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setIsSaved(false);
    setLocalCompany({ ...localCompany, [e.target.name]: e.target.value });
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateClient({ ...client, [e.target.name]: e.target.value });
  };

  const handleSaveCompany = () => {
    onUpdateCompany(localCompany);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updated = { ...localCompany, logoUrl: reader.result as string };
        setLocalCompany(updated);
        onUpdateCompany(updated); // Logos are large, we sync them immediately
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    const updated = { ...localCompany, logoUrl: '' };
    setLocalCompany(updated);
    onUpdateCompany(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">My Company</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Sender Details</p>
            </div>
          </div>
          <button 
            onClick={handleSaveCompany}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
              isSaved 
                ? 'bg-emerald-50 text-white shadow-emerald-200' 
                : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
            }`}
          >
            {isSaved ? <><CheckCircle2 size={16}/> Saved</> : <><Save size={16}/> Save Profile</>}
          </button>
        </div>
        
        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                <Input 
                    label="Business Name" 
                    name="name" 
                    value={localCompany.name} 
                    onChange={handleCompanyChange} 
                    className="font-bold text-base py-3"
                    placeholder="e.g. Acme Construction Pte Ltd"
                />
            </div>
            
            {/* Fix: Property 'registrationNumber' does not exist on type 'CompanySettings' */}
            <Input 
                label="UEN / Registration No." 
                name="uen" 
                value={localCompany.uen || ''} 
                onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    // Fix: Object literal may only specify known properties, and 'registrationNumber' does not exist in type 'SetStateAction<CompanySettings>'
                    setLocalCompany({ ...localCompany, uen: val });
                    setIsSaved(false);
                }} 
                className="font-mono"
                placeholder="Unique Entity Number"
            />
            
            <Input 
                label="Contact Email" 
                name="email" 
                type="email" 
                value={localCompany.email} 
                onChange={handleCompanyChange} 
                placeholder="info@company.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Corporate Branding (Logo)</label>
            <div className="border-2 border-slate-100 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
              {localCompany.logoUrl ? (
                <div className="relative group/logo">
                  <img src={localCompany.logoUrl} alt="Logo Preview" className="h-32 max-w-full object-contain bg-white rounded-2xl p-4 shadow-xl border border-slate-100" />
                  <div className="absolute -top-2 -right-2">
                      <button onClick={removeLogo} className="bg-white text-rose-500 p-2 rounded-full shadow-lg border border-slate-100 hover:bg-rose-50 transition-colors">
                          <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-300 py-6">
                  <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center mb-3 shadow-sm">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">No brand logo detected</span>
                </div>
              )}
              
              <div className="flex gap-2">
                 <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200"
                  icon={<Upload size={14} />}
                >
                  {localCompany.logoUrl ? 'Change Logo' : 'Choose File'}
                </Button>
              </div>
            </div>
          </div>

          <TextArea 
            label="Registered Business Address" 
            name="address" 
            value={localCompany.address} 
            onChange={handleCompanyChange}
            rows={3} 
            className="leading-relaxed"
            placeholder="Complete headquarters address"
          />
          
          <Input 
            label="Office Hotline" 
            name="phone" 
            value={localCompany.phone} 
            onChange={handleCompanyChange} 
            placeholder="+65 ...."
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Recipient Profile</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Draft Client Information</p>
          </div>
        </div>

        <div className="space-y-6">
          <Input 
            label="Client Contact Person" 
            name="name" 
            value={client.name} 
            onChange={handleClientChange} 
            className="font-bold py-3"
            placeholder="Full name of primary contact"
          />
          <Input 
            label="Organization / Company" 
            name="company" 
            value={client.company} 
            onChange={handleClientChange} 
            placeholder="Client's business entity"
          />
          <TextArea 
            label="Project Site / Billing Address" 
            name="address" 
            value={client.address} 
            onChange={handleClientChange}
            rows={3} 
            placeholder="Where the works will be performed"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Contact Number" 
              name="phone" 
              value={client.phone} 
              onChange={handleClientChange} 
              placeholder="Primary phone"
            />
            <Input 
              label="Contact Email" 
              name="email" 
              type="email" 
              value={client.email} 
              onChange={handleClientChange} 
              placeholder="client@domain.com"
            />
          </div>
          
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-400 text-xs text-center">
            Information entered here will populate the "TO:" section of the quotation header.
          </div>
        </div>
      </div>
    </div>
  );
};
