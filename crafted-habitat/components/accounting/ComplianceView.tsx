
import React from 'react';
import { ChecklistItem } from '../../types';
import { CheckSquare, AlertCircle, ShieldCheck } from 'lucide-react';

interface ComplianceViewProps {
  checklist: ChecklistItem[];
  onToggle: (id: string) => void;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({ checklist, onToggle }) => {
  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
         <div className="p-6 bg-indigo-600 text-white rounded-[32px] w-fit mx-auto shadow-2xl shadow-indigo-600/30 rotate-3">
             <ShieldCheck size={48} strokeWidth={2.5}/>
         </div>
         <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Financial Compliance</h2>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] mt-2">IRAS & ACRA Regulatory Monitoring</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
             {['TAX', 'ACRA', 'INTERNAL'].map(cat => (
                <div key={cat} className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-3">{cat} FILINGS</h4>
                   <div className="space-y-3">
                      {checklist.filter(i => i.category === cat).map(item => (
                         <div 
                           key={item.id} 
                           onClick={() => onToggle(item.id)}
                           className={`p-5 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${
                             item.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                               item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'
                            }`}>
                               {item.completed && <CheckSquare size={16}/>}
                            </div>
                            <div className="flex-1">
                               <span className={`block font-bold text-sm leading-tight ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                   {item.task}
                               </span>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>

          <div className="space-y-6">
              <div className="p-8 bg-slate-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle size={100}/></div>
                  <div className="relative z-10">
                      <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">Critical Advisory</h3>
                      <p className="text-lg font-bold leading-snug mb-6">
                         GST F5 returns must be submitted within one month of the end of your accounting period.
                      </p>
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Next Deadline: 30 DAYS</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Regulatory Links</h3>
                  <div className="space-y-3">
                     {[
                        { name: 'IRAS myTax Portal', url: 'https://mytax.iras.gov.sg' },
                        { name: 'ACRA BizFile+', url: 'https://www.bizfile.gov.sg' },
                        { name: 'CPF EZPay', url: 'https://www.cpf.gov.sg' }
                     ].map(link => (
                        <a 
                            key={link.name} 
                            href={link.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-colors group"
                        >
                           <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">{link.name}</span>
                           <CheckSquare size={14} className="text-slate-300 group-hover:text-indigo-600" />
                        </a>
                     ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
