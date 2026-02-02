
import React, { useState, useEffect, useRef } from 'react';
import { 
    Cloud, RefreshCw, Database, CheckCircle2, Server, Terminal, 
    AlertTriangle, Key, Activity, Wifi, WifiOff, Wrench, 
    ShieldCheck, ListChecks, HelpCircle, Upload, Loader2, 
    Copy, ExternalLink, ShieldAlert, Zap, Code, Eye, EyeOff, Info, Search, X, 
    ArrowUpCircle, Globe, Monitor, Share2, Shield, Command, ExternalLink as LinkIcon,
    ArrowRight, Map, Settings, Compass, HelpCircle as Help, Globe2, Cpu, MousePointer2,
    Layout, Check, ShieldX, Network, ArrowDownCircle, History, RotateCcw
} from 'lucide-react';
import { reconcileAllData, testBackendConnection, importDatabase } from '../utils';
import { Button } from './Button';

export const SyncManager: React.FC = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncLog, setSyncLog] = useState<string[]>([]);
    const [connStatus, setConnStatus] = useState<{checked: boolean, ok: boolean, msg: string, code?: string}>({
        checked: false, 
        ok: false, 
        msg: ''
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const addLog = (msg: string) => {
        setSyncLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 15));
    };

    const handleTestConnection = async () => {
        setIsSyncing(true);
        addLog("Probing SQL Gateway (Port 5000)...");
        const result = await testBackendConnection();
        setConnStatus({ checked: true, ok: result.success, msg: result.message });
        addLog(result.message);
        setIsSyncing(false);
    };

    const handleReconcile = async () => {
        setIsSyncing(true);
        addLog("Initiating Rapid Reconcile...");
        try {
            await reconcileAllData();
            addLog("SUCCESS: Local state merged with SQL master.");
            // Brief delay before reload for visual feedback
            setTimeout(() => window.location.reload(), 1200);
        } catch (e) {
            addLog("ERROR: Reconciliation failed.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (confirm("CRITICAL WARNING: This will overwrite ALL current SQL database records with data from this backup file. This action is irreversible. Proceed with Reload?")) {
            setIsSyncing(true);
            addLog(`RESTORATION START: Processing ${file.name}...`);
            importDatabase(file, () => {
                addLog("DATABASE RELOAD COMPLETE: Full system refresh triggered.");
                alert("Database reloaded from backup. The application will now restart to apply changes.");
                window.location.reload();
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20 text-left">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CORE CONTROLS */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform"><Database size={140}/></div>
                        
                        <div className="relative z-10 text-left">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Data Integrity & Operations</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">Manage synchronization and backups between this interface and the SQL Engine.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <button 
                                onClick={handleReconcile}
                                disabled={isSyncing}
                                className="p-8 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-400 hover:shadow-2xl transition-all group/card text-left"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-sm w-fit mb-6 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all">
                                    <RefreshCw size={24} className={isSyncing ? 'animate-spin' : ''}/>
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-lg">Rapid Reconcile</h4>
                                <p className="text-xs text-slate-400 mt-2 font-bold uppercase leading-relaxed">Fix UI mismatches and refresh all site logs from server.</p>
                            </button>

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSyncing}
                                className="p-8 rounded-[2rem] border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-rose-400 hover:shadow-2xl transition-all group/card text-left"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-sm w-fit mb-6 group-hover/card:bg-rose-600 group-hover/card:text-white transition-all">
                                    <History size={24}/>
                                </div>
                                <h4 className="font-black text-slate-900 uppercase text-lg">Reload Backup</h4>
                                <p className="text-xs text-slate-400 mt-2 font-bold uppercase leading-relaxed">Import a .json backup file to reload the entire SQL database.</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileRestore} />
                            </button>
                        </div>

                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4 text-left relative z-10">
                             <AlertTriangle size={24} className="text-amber-500 shrink-0 mt-1"/>
                             <div>
                                 <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Protocol Warning</h5>
                                 <p className="text-[10px] text-amber-700 font-medium leading-relaxed mt-1 uppercase">Restoring from a backup will permanently overwrite current data. Ensure you have exported a copy of your recent work before proceeding.</p>
                             </div>
                        </div>
                    </div>

                    <div className="bg-rose-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border-4 border-rose-500/20">
                        <div className="absolute top-0 right-0 p-8 text-white opacity-5 group-hover:scale-110 transition-transform duration-700"><ShieldX size={180}/></div>
                        <div className="relative z-10 space-y-6 text-left">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-xl"><AlertTriangle size={28} className="text-rose-400" /></div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Navigation Alert</h3>
                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.3em] mt-1">Check Network Connectivity</p>
                                </div>
                            </div>
                            
                            <p className="text-sm font-medium text-rose-100/80 leading-relaxed uppercase">
                                If the system fails to sync, check that your local <strong>Express Proxy</strong> is running in your terminal.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-2 text-left">
                                    <span className="text-[10px] font-black text-rose-400 uppercase flex items-center gap-2"><X size={14}/> SQL Access</span>
                                    <p className="text-xs font-bold text-white uppercase">Port 3306</p>
                                    <p className="text-[9px] text-white/40 uppercase leading-none">Ensure MySQL service is active.</p>
                                </div>
                                <div className="bg-emerald-500/20 p-6 rounded-2xl border border-emerald-500/30 space-y-2 text-left">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-2"><Check size={14}/> Proxy Server</span>
                                    <p className="text-xs font-bold text-white uppercase">Port 5000</p>
                                    <p className="text-[9px] text-white/40 uppercase leading-none">Backend listener must be active.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: STATUS & LOGS */}
                <div className="space-y-6">
                    <div className={`p-8 rounded-[3rem] border-4 flex flex-col items-center justify-center gap-6 transition-all duration-700 text-center min-h-[300px] ${
                        !connStatus.checked ? 'bg-slate-100 border-slate-200' : 
                        connStatus.ok ? 'bg-emerald-50 border-emerald-500/30 text-emerald-900 shadow-2xl shadow-emerald-500/10' : 'bg-rose-50 border-rose-500/30 text-rose-900 shadow-2xl shadow-rose-500/10'
                    }`}>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl ${
                            connStatus.ok ? 'bg-emerald-500 text-white animate-pulse' : 'bg-rose-500 text-white'
                        }`}>
                            {connStatus.ok ? <Wifi size={40}/> : <WifiOff size={40}/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">
                                {connStatus.ok ? "SQL CONNECTED" : "SQL OFFLINE"}
                            </h2>
                            <button 
                                onClick={handleTestConnection}
                                disabled={isSyncing}
                                className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg"
                            >
                                {isSyncing ? "PROBING..." : "RE-TEST SQL LINK"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col h-full text-left">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                            <Activity size={20} className="text-indigo-600"/>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">System Log</h4>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[9px] space-y-3 pr-2 min-h-[250px]">
                            {syncLog.map((log, i) => (
                                <div key={i} className={`pl-3 border-l-2 py-1 transition-all text-left ${
                                    log.includes('SUCCESS') || log.includes('COMPLETE') ? 'text-emerald-600 border-emerald-500/50' : 
                                    log.includes('ERROR') || log.includes('FAILURE') ? 'text-rose-600 border-rose-500/50' : 'text-slate-400 border-slate-200'
                                }`}>
                                    {log}
                                </div>
                            ))}
                            {syncLog.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 italic py-10">
                                    <ListChecks size={40} className="mb-4"/>
                                    <p>Awaiting Diagnostics...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
