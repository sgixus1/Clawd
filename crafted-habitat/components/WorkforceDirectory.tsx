import React, { useState, useMemo, useEffect } from 'react';
import { Worker, ActiveClockIn, Project } from '../types';
import { getWorkers, getActiveClockIns, getProjects } from '../utils';
import { Search, User, MapPin, HardHat, Info, ChevronRight, X, Phone, Globe, Briefcase, Clock, Activity, ShieldCheck, Building2, Calendar, ShieldAlert, FileDigit } from 'lucide-react';

interface WorkforceDirectoryProps {
    onBack: () => void;
    syncKey: number;
}

export const WorkforceDirectory: React.FC<WorkforceDirectoryProps> = ({ onBack, syncKey }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    // Fix: Using state to store asynchronously fetched and processed data
    const [directoryData, setDirectoryData] = useState<any[]>([]);

    // Fix: Corrected logic to fetch data asynchronously inside useEffect
    useEffect(() => {
        const load = async () => {
            const workers = (await getWorkers()).filter(w => w.showInSupervisorApp !== false);
            const activeIns = await getActiveClockIns() || [];
            const projects = await getProjects() || [];

            const processed = workers.map(w => {
                const clockIn = activeIns.find(c => c.workerId === w.id);
                const project = clockIn ? projects.find(p => p.id === clockIn.projectId) : null;
                return {
                    worker: w,
                    project,
                    clockIn,
                    isClockedIn: !!clockIn
                };
            }).sort((a, b) => {
                if (a.isClockedIn !== b.isClockedIn) return a.isClockedIn ? -1 : 1;
                return a.worker.name.localeCompare(b.worker.name);
            });
            setDirectoryData(processed);
        };
        load();
    }, [syncKey]);

    const filtered = directoryData.filter(d => 
        d.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.worker.wpFinNric && d.worker.wpFinNric.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.worker.wpNumber && d.worker.wpNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.project && d.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const DetailRow = ({ label, value, icon: Icon }: any) => (
        <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3 text-slate-400">
                <Icon size={14}/>
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
            </div>
            <span className="text-sm font-black text-slate-800 uppercase text-right">{value || '—'}</span>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-8 animate-fade-in text-left">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Workers Monitoring</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Global Live Personnel Tracker</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <div className="flex items-center gap-2 px-6 py-2 bg-white text-indigo-600 rounded-xl shadow-sm text-xs font-black uppercase">
                        <Activity size={14} className="animate-pulse"/>
                        {directoryData.filter(d => d.isClockedIn).length} On-Site
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 text-slate-400 text-xs font-black uppercase">
                        {directoryData.length} Total
                    </div>
                </div>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300" 
                    placeholder="Search by name, NRIC, WP No, or site..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map(d => (
                    <div 
                        key={d.worker.id} 
                        onClick={() => setSelectedWorker(d.worker)}
                        className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group hover:shadow-2xl relative overflow-hidden ${
                            d.isClockedIn ? 'border-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                                d.isClockedIn ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                            }`}>
                                {d.worker.name.charAt(0)}
                            </div>
                            <div className="text-right">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${d.isClockedIn ? 'text-indigo-600' : 'text-slate-300'}`}>
                                    {d.isClockedIn ? 'Live on Site' : 'At Rest'}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${d.isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-200'}`}></div>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">{d.isClockedIn ? 'ACTIVE' : 'IDLE'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 text-left">
                            <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight truncate leading-none group-hover:text-indigo-600 transition-colors">{d.worker.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.worker.wpFinNric}</p>
                                {d.worker.wpNumber && (
                                    <>
                                        <span className="text-slate-200 text-[10px]">•</span>
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">WP: {d.worker.wpNumber}</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
                            <div className={`p-2 rounded-lg ${d.isClockedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-200'}`}>
                                <MapPin size={16}/>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Assignment</p>
                                <p className={`text-xs font-black uppercase truncate ${d.isClockedIn ? 'text-slate-900' : 'text-slate-300'}`}>
                                    {d.project ? d.project.name : 'NO ACTIVE DEPLOYMENT'}
                                </p>
                            </div>
                            <ChevronRight size={16} className="ml-auto text-slate-200 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                        </div>
                    </div>
                ))}
            </div>

            {/* READ ONLY MODAL */}
            {selectedWorker && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto border border-white/20">
                        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
                            <div className="flex items-center gap-6 text-left">
                                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl">{selectedWorker.name.charAt(0)}</div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedWorker.name}</h3>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-2">{selectedWorker.occupationTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedWorker(null)} className="p-3 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm border border-slate-100 transition-all"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-8 text-left">
                            <div className="space-y-4">
                                <DetailRow label="Fin / Nric" value={selectedWorker.wpFinNric} icon={ShieldCheck} />
                                <DetailRow label="Work Permit No." value={selectedWorker.wpNumber} icon={FileDigit} />
                                <DetailRow label="Nationality" value={selectedWorker.nationality} icon={Globe} />
                                <DetailRow label="Entity Registry" value={selectedWorker.company} icon={Building2} />
                                <DetailRow label="Basis" value={selectedWorker.rateType} icon={Clock} />
                                <DetailRow label="Pass Expiry" value={selectedWorker.passExpiryDate} icon={Calendar} />
                            </div>

                            {(() => {
                                // Fix: Correctly correctly deriving worker status from pre-fetched directoryData
                                const status = directoryData.find(d => d.worker.id === selectedWorker.id);
                                const activeIn = status?.clockIn;
                                const project = status?.project;
                                return (
                                    <div className={`p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-4 shadow-xl border-4 ${
                                        activeIn ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'
                                    }`}>
                                        <div className={`p-4 rounded-3xl ${activeIn ? 'bg-white/20' : 'bg-white shadow-inner'}`}>
                                            {activeIn ? <Activity size={32}/> : <ShieldAlert size={32}/>}
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Current Deployment Status</h4>
                                            <p className="text-xl font-black uppercase mt-1">
                                                {project ? `Working @ ${project.name}` : 'At Rest / Idle'}
                                            </p>
                                            {activeIn && <p className="text-[9px] font-bold opacity-60 uppercase mt-2">Started At: {new Date(activeIn.clockInTime).toLocaleTimeString()}</p>}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="p-10 bg-slate-50/50 border-t border-slate-50">
                            <button onClick={() => setSelectedWorker(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 shadow-xl transition-all">Close Dossier</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};