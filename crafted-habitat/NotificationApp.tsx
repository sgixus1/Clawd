
import React, { useState, useEffect, useMemo } from 'react';
import { Reminder, StaffAccount, CompanySettings } from './types';
import { getReminders, saveReminders, getSettings } from './utils';
import { 
  Bell, Plus, Trash2, ArrowLeft, Send, Users, User, Check, X,
  Clock, Shield, Info, Filter, Search, Globe, UserCheck, ShieldCheck
} from 'lucide-react';
// Added import for default settings
import { DEFAULT_COMPANY_SETTINGS } from './constants';

interface NotificationAppProps {
  onBack: () => void;
  activeUser: StaffAccount | null;
  role: 'admin' | 'staff' | 'supervisor' | 'customer' | null;
  syncKey: number;
}

export const NotificationApp: React.FC<NotificationAppProps> = ({ onBack, activeUser, role, syncKey }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Fix: Initialized state with constant instead of Promise
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    message: '',
    scope: 'ALL' as 'SELF' | 'ALL' | 'SPECIFIC',
    targetUserIds: [] as string[],
    remindAt: new Date().toISOString().split('T')[0],
    remindTime: '09:00'
  });

  const currentUserId = role === 'admin' ? 'admin' : activeUser?.id || '';
  const currentUserName = role === 'admin' ? (settings.userName || 'Estate Master') : activeUser?.name || 'Authorized User';
  const isAdmin = role === 'admin';

  // Fix: Added async load for reminders and settings to avoid Promise assignment errors
  useEffect(() => {
    const loadData = async () => {
      setReminders(await getReminders());
      setSettings(await getSettings());
    };
    loadData();
  }, [syncKey]);

  const sortedReminders = useMemo(() => {
    return [...reminders].filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.message.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reminders, searchTerm]);

  const handleCreate = async () => {
    if (!form.title || !form.message) return;

    const newReminder: Reminder = {
      id: 'NTF_' + Date.now(),
      title: form.title.toUpperCase(),
      message: form.message,
      remindAt: new Date(`${form.remindAt}T${form.remindTime}`).toISOString(),
      scope: form.scope,
      targetUserIds: form.scope === 'SPECIFIC' ? form.targetUserIds : undefined,
      createdBy: currentUserId,
      createdByName: currentUserName,
      isDismissed: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newReminder, ...reminders];
    setReminders(updated);
    await saveReminders(updated);
    setShowCreateModal(false);
    setForm({
      title: '',
      message: '',
      scope: 'ALL',
      targetUserIds: [],
      remindAt: new Date().toISOString().split('T')[0],
      remindTime: '09:00'
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this notification from the system registry?')) return;
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    await saveReminders(updated);
  };

  const toggleUserInTargets = (userId: string) => {
    setForm(prev => {
        const targetUserIds = prev.targetUserIds.includes(userId)
            ? prev.targetUserIds.filter(id => id !== userId)
            : [...prev.targetUserIds, userId];
        return { ...prev, targetUserIds };
    });
  };

  const allPossibleTargets = useMemo(() => {
      return (settings.supervisors || []).filter(s => s.id !== currentUserId);
  }, [settings.supervisors, currentUserId]);

  return (
    <div className="min-h-screen bg-nature-sand flex flex-col text-left">
      <header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0 sticky top-0 z-40">
          <button onClick={onBack} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors">
              <ArrowLeft size={18}/> Back to Hub
          </button>
          <div className="h-6 w-px bg-nature-stone/30 mx-6"></div>
          <h1 className="text-xl font-serif font-semibold text-nature-forest tracking-tight">Notifications Hub</h1>
      </header>

      <main className="flex-1 p-8 lg:p-12 space-y-10 max-w-7xl mx-auto w-full animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 text-nature-sage">
                    <ShieldCheck size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Communication Registry</span>
                  </div>
                  <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Active Dispatches</h2>
                  <p className="text-sm text-nature-forest/40 font-medium max-w-lg">Manage your team's coordination via broadcast alerts and targeted reminders.</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-10 py-5 bg-nature-forest text-white rounded-full font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3"
              >
                  <Plus size={18}/> Dispatch Notification
              </button>
          </div>

          <div className="bg-white/50 rounded-[3rem] border border-nature-stone/20 p-4 shadow-sm backdrop-blur-sm">
              <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-nature-stone" size={20}/>
                  <input 
                    className="w-full pl-16 pr-6 py-5 bg-white border border-nature-stone/10 rounded-[2.5rem] font-medium text-nature-forest outline-none focus:ring-4 focus:ring-nature-sage/10 transition-all placeholder:text-nature-stone/50" 
                    placeholder="Search dispatches by title or content..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {sortedReminders.map(rem => {
                  const isCreator = rem.createdBy === currentUserId;
                  const canDelete = isAdmin || isCreator;
                  const date = new Date(rem.remindAt);
                  return (
                      <div key={rem.id} className="bg-nature-linen border border-nature-stone/30 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative flex flex-col h-full text-left">
                          <div className="flex justify-between items-start mb-6">
                              <div className={`p-3 rounded-2xl ${rem.scope === 'ALL' ? 'bg-nature-forest text-white' : 'bg-nature-sand text-nature-forest'}`}>
                                  {rem.scope === 'ALL' ? <Globe size={20}/> : rem.scope === 'SELF' ? <User size={20}/> : <Users size={20}/>}
                              </div>
                              <div className="text-right flex flex-col items-end">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-nature-sage block">{rem.scope} DISPATCH</span>
                                  <span className="text-[8px] font-bold text-nature-forest/30 uppercase mt-1">ID: {rem.id.split('_')[1]}</span>
                                  {canDelete && (
                                    <button 
                                      onClick={() => handleDelete(rem.id)}
                                      className="mt-4 p-2 text-rose-300 hover:text-rose-600 transition-colors"
                                      title="Delete Notification"
                                    >
                                      <Trash2 size={18}/>
                                    </button>
                                  )}
                              </div>
                          </div>
                          
                          <div className="space-y-3 flex-1 text-left">
                              <h3 className="text-xl font-serif font-bold text-nature-forest leading-tight uppercase group-hover:text-nature-sage transition-colors">{rem.title}</h3>
                              <p className="text-sm text-nature-forest/60 leading-relaxed line-clamp-4 font-medium italic">"{rem.message}"</p>
                          </div>

                          <div className="mt-8 pt-6 border-t border-nature-stone/20 space-y-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-nature-sand flex items-center justify-center text-[9px] font-black">{rem.createdByName?.charAt(0)}</div>
                                      <p className="text-[10px] font-black text-nature-forest/50 uppercase tracking-widest">{rem.createdByName}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-nature-sage">
                                      <Clock size={12}/>
                                      <span className="text-[10px] font-black tabular-nums">{date.toLocaleDateString()}</span>
                                  </div>
                              </div>
                              
                              {canDelete && (
                                <button 
                                    onClick={() => handleDelete(rem.id)}
                                    className="w-full py-3 bg-rose-50 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14}/> Delete Notification
                                </button>
                              )}
                          </div>
                      </div>
                  );
              })}
              
              {sortedReminders.length === 0 && (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-30 text-nature-forest">
                      <Bell size={64} className="mb-6 mx-auto"/>
                      <h4 className="text-xl font-serif font-bold uppercase tracking-tight">Registry Empty</h4>
                      <p className="text-sm font-medium mt-1">No dispatches found in the communication stream.</p>
                  </div>
              )}
          </div>
      </main>

      {showCreateModal && (
          <div className="fixed inset-0 bg-nature-forest/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto border border-nature-stone/30">
                  <header className="p-10 border-b border-nature-stone/10 bg-nature-linen flex justify-between items-center text-left">
                      <div>
                          <span className="text-[10px] font-black text-nature-sage uppercase tracking-[0.3em]">Module Entry</span>
                          <h3 className="text-3xl font-serif font-bold text-nature-forest uppercase tracking-tight">New Notice</h3>
                      </div>
                      <button onClick={() => setShowCreateModal(false)} className="p-3 bg-nature-sand text-nature-forest rounded-full hover:bg-nature-forest hover:text-white transition-all">
                          <X size={24}/>
                      </button>
                  </header>
                  
                  <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-16 text-left">
                      <div className="space-y-8">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-nature-sage uppercase tracking-widest ml-1">Communication Scope</label>
                              <div className="flex bg-nature-sand p-1.5 rounded-3xl">
                                  <button onClick={() => setForm({...form, scope: 'ALL'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.scope === 'ALL' ? 'bg-nature-forest text-white shadow-xl' : 'text-nature-forest/40'}`}>Global</button>
                                  <button onClick={() => setForm({...form, scope: 'SPECIFIC'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.scope === 'SPECIFIC' ? 'bg-nature-forest text-white shadow-xl' : 'text-nature-forest/40'}`}>Direct</button>
                                  <button onClick={() => setForm({...form, scope: 'SELF'})} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.scope === 'SELF' ? 'bg-nature-forest text-white shadow-xl' : 'text-nature-forest/40'}`}>Draft</button>
                              </div>
                          </div>

                          <div className="space-y-6">
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-nature-sage uppercase tracking-widest ml-1">Dispatch Title</label>
                                  <input 
                                    className="w-full p-5 bg-nature-sand border-none rounded-3xl text-sm font-bold uppercase outline-none focus:ring-4 focus:ring-nature-sage/10 transition-all text-nature-forest" 
                                    placeholder="SUBJECT OF NOTICE"
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value.toUpperCase()})}
                                  />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-black text-nature-sage uppercase tracking-widest ml-1">Content Specification</label>
                                  <textarea 
                                    className="w-full p-6 bg-nature-sand border-none rounded-[2rem] text-sm font-medium outline-none h-40 resize-none focus:ring-4 focus:ring-nature-sage/10 transition-all italic text-nature-forest" 
                                    placeholder="Articulate the notice clearly..."
                                    value={form.message}
                                    onChange={e => setForm({...form, message: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-10">
                          {form.scope === 'SPECIFIC' && (
                              <div className="space-y-4 animate-in slide-in-from-right-4">
                                  <h4 className="text-[11px] font-black text-nature-forest uppercase tracking-[0.2em] border-b border-nature-stone pb-2">Select Target Personnel</h4>
                                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-2">
                                      {allPossibleTargets.map(user => (
                                          <button 
                                            key={user.id} 
                                            onClick={() => toggleUserInTargets(user.id)}
                                            className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left ${form.targetUserIds.includes(user.id) ? 'bg-nature-forest border-nature-forest text-white shadow-lg' : 'bg-nature-linen border-nature-stone/20 text-nature-forest hover:bg-nature-sand'}`}
                                          >
                                              <div className="flex items-center gap-4">
                                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${form.targetUserIds.includes(user.id) ? 'bg-white/20' : 'bg-nature-sand'}`}>{user.name.charAt(0)}</div>
                                                  <span className="text-xs font-black uppercase">{user.name}</span>
                                              </div>
                                              {form.targetUserIds.includes(user.id) && <UserCheck size={16}/>}
                                          </button>
                                      ))}
                                      {allPossibleTargets.length === 0 && (
                                          <p className="text-xs text-nature-stone italic">No other personnel registered in system.</p>
                                      )}
                                  </div>
                              </div>
                          )}

                          <div className="space-y-6">
                              <h4 className="text-[11px] font-black text-nature-forest uppercase tracking-[0.2em] border-b border-nature-stone pb-2">Scheduling</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-nature-sage uppercase ml-1">Dispatch Date</label>
                                      <input type="date" className="w-full p-4 bg-nature-sand border-none rounded-2xl text-xs font-bold outline-none text-nature-forest" value={form.remindAt} onChange={e => setForm({...form, remindAt: e.target.value})} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-nature-sage uppercase ml-1">Execution Time</label>
                                      <input type="time" className="w-full p-4 bg-nature-sand border-none rounded-2xl text-xs font-bold outline-none text-nature-forest" value={form.remindTime} onChange={e => setForm({...form, remindTime: e.target.value})} />
                                  </div>
                              </div>
                          </div>

                          <div className="bg-nature-linen p-6 rounded-[2rem] border border-nature-stone/30 flex items-start gap-4">
                              <Info className="text-nature-sage mt-1" size={18}/>
                              <p className="text-[10px] font-medium text-nature-forest/50 leading-relaxed uppercase">The notification will be visible to targeted users when they access the dashboard after the scheduled execution time.</p>
                          </div>
                      </div>
                  </div>

                  <footer className="p-10 border-t border-nature-stone/10 bg-nature-linen flex justify-center">
                      <button 
                        onClick={handleCreate}
                        className="px-24 py-6 bg-nature-forest text-white rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3"
                      >
                          <Send size={18}/> Authorize Dispatch
                      </button>
                  </footer>
              </div>
          </div>
      )}
    </div>
  );
};
