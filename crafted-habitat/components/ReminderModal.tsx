import React, { useState } from 'react';
import { Bell, X, Shield, Users, Clock, AlertCircle } from 'lucide-react';
import { Reminder } from '../types';
import { getReminders, saveReminders } from '../utils';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  relatedId?: string;
  onReminderSet: (reminder: Reminder) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, title, relatedId, onReminderSet }) => {
  const [remindAt, setRemindAt] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [remindTime, setRemindTime] = useState("09:00");
  const [scope, setScope] = useState<'SELF' | 'ALL'>('SELF');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  // Fix: Made handleSet async and correctly awaited getReminders and saveReminders
  const handleSet = async () => {
    if (!message) {
        alert("Please enter a reminder message.");
        return;
    }

    const reminder: Reminder = {
        id: 'REM_' + Date.now(),
        title: title.toUpperCase(),
        message: message.toUpperCase(),
        remindAt: new Date(`${remindAt}T${remindTime}`).toISOString(),
        scope,
        createdBy: 'Admin', // Default for now
        isDismissed: false,
        relatedId,
        createdAt: new Date().toISOString()
    };

    const current = await getReminders();
    await saveReminders([...current, reminder]);
    onReminderSet(reminder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/20">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                <Bell size={20}/>
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Set Reminder</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Important Action Alert</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 border border-slate-100 shadow-sm"><X size={20}/></button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reminder Date & Time</label>
             <div className="grid grid-cols-2 gap-3">
                <input type="date" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={remindAt} onChange={e => setRemindAt(e.target.value)} />
                <input type="time" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={remindTime} onChange={e => setRemindTime(e.target.value)} />
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Scope</label>
             <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setScope('SELF')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'SELF' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                    <Shield size={14}/> Just Me
                </button>
                <button onClick={() => setScope('ALL')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>
                    <Users size={14}/> All Users
                </button>
             </div>
          </div>

          <div className="space-y-1">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reminder Message</label>
             <textarea 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none h-24 resize-none focus:ring-4 focus:ring-indigo-500/5"
                placeholder="What needs attention? (e.g. Check if payment went through)"
                value={message}
                onChange={e => setMessage(e.target.value)}
             />
          </div>

          <button 
            onClick={handleSet}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Clock size={20}/> Active Reminder
          </button>
        </div>
      </div>
    </div>
  );
};