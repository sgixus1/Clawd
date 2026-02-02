import React, { useState } from 'react';
import { ClientDetails } from '../types';
import { 
  Search, UserPlus, Trash2, Edit2, Phone, Mail, 
  MapPin, Building, ChevronRight, X, Save, 
  Globe, ShieldCheck, Landmark, Briefcase, ExternalLink,
  MessageSquare, User
} from 'lucide-react';
import { Input, TextArea } from './Input';

interface Client extends ClientDetails {
  id: string;
}

interface ClientManagerProps {
  clients: Client[];
  onUpdate: (clients: Client[]) => void;
}

export const ClientManager: React.FC<ClientManagerProps> = ({ clients, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = () => {
    if (!editingClient?.name) return alert("Client Name is required.");
    const newClient = {
      ...editingClient,
      id: editingClient.id || 'CLI_' + Date.now(),
      name: editingClient.name.toUpperCase(),
      company: editingClient.company?.toUpperCase(),
      address: editingClient.address?.toUpperCase()
    } as Client;
    const updated = editingClient.id 
      ? clients.map(c => c.id === editingClient.id ? newClient : c)
      : [newClient, ...clients];
    onUpdate(updated);
    setEditingClient(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Permanently purge this client dossier?")) {
      onUpdate(clients.filter(c => c.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 h-[calc(100vh-140px)] flex flex-col gap-8 animate-fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
        <div className="text-left">
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Client CRM</h2>
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3">Customer Intelligence & Relationship Registry</p>
        </div>
        <button 
          onClick={() => setEditingClient({ name: '', company: '', address: '', phone: '', email: '' })}
          className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <UserPlus size={20}/> New Dossier Entry
        </button>
      </div>

      <div className="relative max-w-xl shrink-0">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Search by contact person or entity..." 
            className="w-full pl-16 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/5 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all text-sm font-bold text-left"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map(c => (
                  <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden text-left">
                      <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 rounded-[24px] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-inner group-hover:scale-110 transition-transform">
                              {c.name.charAt(0)}
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => setEditingClient(c)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm"><Edit2 size={18}/></button>
                              <button onClick={() => handleDelete(c.id)} className="p-3 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-2xl shadow-sm"><Trash2 size={18}/></button>
                          </div>
                      </div>
                      
                      <div className="flex-1 space-y-4 text-left">
                          <div className="text-left">
                              <h4 className="font-black text-slate-900 text-2xl uppercase tracking-tight truncate leading-tight">{c.name}</h4>
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mt-2">
                                  <Building size={14}/> {c.company || 'Private Recipient'}
                              </p>
                          </div>

                          <div className="space-y-3 pt-6 border-t border-slate-50 text-left">
                              <div className="flex items-center gap-3 text-slate-500">
                                  <div className="p-2 bg-slate-50 rounded-lg"><Mail size={14}/></div>
                                  <span className="text-[10px] font-bold truncate uppercase tracking-tighter">{c.email || 'NO_EMAIL_LOGGED'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-500">
                                  <div className="p-2 bg-slate-50 rounded-lg"><Phone size={14}/></div>
                                  <span className="text-[10px] font-black tabular-nums tracking-widest">{c.phone || '—'}</span>
                              </div>
                              <div className="flex items-start gap-3 text-slate-500">
                                  <div className="p-2 bg-slate-50 rounded-lg mt-0.5"><MapPin size={14}/></div>
                                  <span className="text-[9px] font-bold uppercase leading-relaxed line-clamp-2">{c.address || '—'}</span>
                              </div>
                          </div>
                      </div>

                      <div className="mt-8 flex justify-between items-center">
                          <button onClick={() => setEditingClient(c)} className="flex items-center gap-2 text-[10px] font-black text-slate-300 group-hover:text-indigo-600 transition-all uppercase tracking-[0.2em]">View Dossier <ChevronRight size={14}/></button>
                          <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-200 flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg transition-all cursor-pointer">
                              <ExternalLink size={16}/>
                          </div>
                      </div>
                  </div>
              ))}
              {filtered.length === 0 && (
                  <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-6">
                      <div className="p-8 bg-slate-50 rounded-full text-slate-200 shadow-inner">
                          <User size={64}/>
                      </div>
                      <div className="max-w-xs">
                          <p className="font-black text-slate-800 text-xl uppercase tracking-tight">CRM Hub Empty</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">No dossiers found in your client registry. Start by creating a new entry to streamline your quotation drafting process.</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-left">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 border border-white/20">
            <header className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-left">
                <div className="flex items-center gap-6 text-left">
                    <div className="w-16 h-16 rounded-[20px] bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-200">
                        {editingClient.name?.charAt(0) || <UserPlus/>}
                    </div>
                    <div className="text-left">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Dossier Specification</span>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Registry Entry</h3>
                    </div>
                </div>
                <button onClick={() => setEditingClient(null)} className="p-3 bg-white text-slate-400 rounded-full border border-slate-100 shadow-sm hover:text-slate-800 transition-all"><X size={24}/></button>
            </header>
            <div className="p-12 space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><User size={12}/> Full Contact Name</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm uppercase outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" value={editingClient.name} onChange={e => setEditingClient({...editingClient, name: e.target.value})} placeholder="Primary Contact" />
                    </div>
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Building size={12}/> Entity / Company</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm uppercase outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" value={editingClient.company} onChange={e => setEditingClient({...editingClient, company: e.target.value})} placeholder="Business Name (Optional)" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 text-left">
                   <div className="space-y-1 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Phone size={12}/> Contact Line</label>
                       <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" value={editingClient.phone} onChange={e => setEditingClient({...editingClient, phone: e.target.value})} placeholder="+65" />
                   </div>
                   <div className="space-y-1 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Mail size={12}/> Email Stream</label>
                       <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} placeholder="user@domain.com" />
                   </div>
                </div>
                <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1"><MapPin size={12}/> Deployment / Billing Address</label>
                    <TextArea className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-medium text-sm uppercase outline-none h-32 resize-none focus:ring-8 focus:ring-indigo-500/5 transition-all" value={editingClient.address} onChange={e => setEditingClient({...editingClient, address: e.target.value})} placeholder="Site location details" />
                </div>
                <button onClick={handleSave} className="w-full py-6 bg-slate-900 text-white rounded-full font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 hover:bg-black active:scale-95 transition-all">
                    <Save size={20}/> Authorize Entry to CRM
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
