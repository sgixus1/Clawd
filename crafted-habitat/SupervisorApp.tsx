
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Worker, ActiveClockIn, AttendanceRecord, Project, DailyUpdate, Milestone, Material, MaterialStatus, Defect, DefectStatus, DefectComment } from './types';
import { getWorkers, getActiveClockIns, saveActiveClockIns, getAttendance, saveAttendance, getProjects, isOfficeStaff, saveProject, compressImage, formatDateSG } from './utils';
import { 
  LogOut, Clock, UserCheck, UserMinus, Search, 
  HardHat, Calendar, ChevronRight, Briefcase, MapPin,
  Loader2, AlertTriangle, X, History, Trash2, Edit2, Zap, Eraser, RefreshCw, Cloud, CheckCircle2,
  BellRing, ShieldAlert, Timer, Moon, Sun, Camera, Upload, Check, ImageIcon, User as UserIcon,
  MessageSquare, LayoutGrid, Send, Trash, TimerReset, Package, Truck, Info, Siren, Bell, XCircle, Wrench, Coffee
} from 'lucide-react';

export interface SupervisorAppProps {
  onBack: () => void;
  syncKey?: number;
  supervisorName?: string;
}

export const SupervisorApp = ({ onBack, syncKey = 0, supervisorName = 'Site Supervisor' }: SupervisorAppProps) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'feed' | 'defects' | 'materials' | 'situation'>('attendance');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeClockIns, setActiveClockIns] = useState<ActiveClockIn[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [processingWorkerId, setProcessingWorkerId] = useState<string | null>(null);
  const [isOvernightMode, setIsOvernightMode] = useState(false);
  
  const [supervisorComment, setSupervisorComment] = useState('');
  const [stagedPhotos, setStagedPhotos] = useState<string[]>([]);
  const [performanceDate, setPerformanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [materialData, setMaterialData] = useState({
    name: '', qty: '', unit: 'NOS', date: new Date().toISOString().split('T')[0],
    comment: '', taskId: '', photos: [] as string[], status: 'Delivered' as MaterialStatus
  });

  const [updatingDefect, setUpdatingDefect] = useState<Defect | null>(null);
  const [defectUpdateData, setDefectUpdateData] = useState<{ status: DefectStatus, comment: string }>({ status: 'Pending', comment: '' });

  const [confirmingWorker, setConfirmingWorker] = useState<Worker | null>(null);
  const [clockOutData, setClockOutData] = useState({
    normalHours: 8, otHours: 0, elapsedHours: 0, lunchDeduction: 1,
    date: new Date().toISOString().split('T')[0], remarks: '',
    projectId: '', clockInTime: '', isOvernight: false,
    hasMeal: false, transport: '0'
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const materialCameraRef = useRef<HTMLInputElement>(null);

  const refreshLocalState = async () => {
    setIsSyncing(true);
    try {
        const [allWorkers, allProjects, activeIns, logs] = await Promise.all([
            getWorkers(),
            getProjects(),
            getActiveClockIns(),
            getAttendance()
        ]);

        const sitePersonnel = allWorkers.filter(w => {
            if (w.showInSupervisorApp === false) return false;
            if (isOfficeStaff(w)) return false;
            const title = (w.occupationTitle || '').toUpperCase();
            const officeKeywords = ['ADMIN', 'MANAGER', 'OFFICE', 'DIRECTOR', 'ACCOUNTANT', 'CLERK', 'HR', 'SECRETARY'];
            return !officeKeywords.some(keyword => title.includes(keyword));
        });

        setWorkers(sitePersonnel);
        setProjects(allProjects);
        setActiveClockIns(activeIns || []);
        setAttendanceLogs(logs || []);
    } finally {
        setIsSyncing(false);
    }
  };

  useEffect(() => {
    refreshLocalState();
  }, [syncKey]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    await refreshLocalState();
  };

  const handleClockIn = async (workerId: string) => {
    if (!selectedProjectId) {
        alert("SITE SELECTION REQUIRED: Choose a project from the top dropdown.");
        return;
    }
    setProcessingWorkerId(workerId);
    try {
        const currentActive = await getActiveClockIns() || [];
        const newClockIn: ActiveClockIn = {
          workerId,
          clockInTime: new Date().toISOString(),
          projectId: selectedProjectId,
          isOvernight: isOvernightMode
        };
        const updatedList = [...currentActive.filter(c => c.workerId !== workerId), newClockIn];
        setActiveClockIns(updatedList);
        await saveActiveClockIns(updatedList);
    } finally {
        setProcessingWorkerId(null);
    }
  };

  const finalizeClockOut = async () => {
    if (!confirmingWorker) return;
    setProcessingWorkerId(confirmingWorker.id);
    try {
        const currentAttendance = await getAttendance() || [];
        const currentActive = await getActiveClockIns() || [];

        const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            employeeId: confirmingWorker.id,
            date: clockOutData.date,
            hoursWorked: Number(clockOutData.normalHours),
            overtimeHours: Number(clockOutData.otHours),
            hasMealAllowance: clockOutData.hasMeal,
            transportClaim: Number(clockOutData.transport),
            projectId: clockOutData.projectId,
            remarks: `Logged by ${supervisorName}`
        };
        
        const updatedAttendance = [...currentAttendance, newRecord];
        const updatedActive = currentActive.filter(c => c.workerId !== confirmingWorker.id);
        
        setAttendanceLogs(updatedAttendance);
        setActiveClockIns(updatedActive);
        setConfirmingWorker(null);
        
        await saveAttendance(updatedAttendance);
        await saveActiveClockIns(updatedActive);
    } finally {
        setProcessingWorkerId(null);
    }
  };

  const startClockOut = (worker: Worker) => {
    const clockIn = activeClockIns.find(c => c.workerId === worker.id);
    if (!clockIn) return;
    setClockOutData({
      normalHours: 8, otHours: 0, elapsedHours: 0, lunchDeduction: 1,
      date: new Date().toISOString().split('T')[0], remarks: '',
      projectId: clockIn.projectId, clockInTime: clockIn.clockInTime,
      isOvernight: !!clockIn.isOvernight,
      hasMeal: false, transport: '0'
    });
    setConfirmingWorker(worker);
  };

  const handleGenericPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'feed' | 'material') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsSyncing(true);
    try {
        const compressedResults = await Promise.all(
          Array.from(files).map((file: any) => compressImage(file, 800, 0.6))
        );
        if (type === 'material') setMaterialData(prev => ({ ...prev, photos: [...prev.photos, ...compressedResults] }));
        else setStagedPhotos(prev => [...prev, ...compressedResults]);
    } finally {
        setIsSyncing(false);
    }
    if (e.target) e.target.value = '';
  };

  const handleSubmitSiteUpdate = async () => {
    if (!selectedProjectId) return;
    setIsSyncing(true);
    try {
        // Atomic Update: Fetch ONLY the specific project's latest state to avoid overwriting unrelated fields
        const allProjects = await getProjects();
        const projectIdx = allProjects.findIndex(p => p.id === selectedProjectId);
        if (projectIdx > -1) {
            const proj = { ...allProjects[projectIdx] };
            const newUpdate: DailyUpdate = {
                id: Math.random().toString(36).substr(2, 9),
                date: performanceDate, 
                description: supervisorComment.toUpperCase(),
                user: supervisorName,
                images: stagedPhotos
            };
            proj.dailyUpdates = [newUpdate, ...(proj.dailyUpdates || [])];
            // Use atomic saveProject to ensure other data (like portal password) is preserved
            await saveProject(proj);
            setSupervisorComment('');
            setStagedPhotos([]);
            alert("Site Log Published.");
            refreshLocalState();
        }
    } finally {
        setIsSyncing(false);
    }
  };

  const handleSubmitMaterialLog = async () => {
    if (!selectedProjectId || !materialData.name) return;
    setIsSyncing(true);
    try {
        const allProjects = await getProjects();
        const projectIdx = allProjects.findIndex(p => p.id === selectedProjectId);
        if (projectIdx > -1) {
            const proj = { ...allProjects[projectIdx] };
            // Fix: Add missing 'amount' property to satisfy the Material interface.
            const newMat: Material = {
                id: Math.random().toString(36).substr(2, 9),
                name: materialData.name.toUpperCase(),
                materialType: 'Site Arrival',
                supplierName: 'Supervisor Logged',
                invoiceNo: 'LOG-' + Date.now().toString().slice(-4),
                unit: materialData.unit,
                costPerUnit: 0,
                quantityUsed: parseFloat(materialData.qty) || 0,
                amount: 0,
                date: materialData.date,
                status: materialData.status,
                images: materialData.photos
            };
            proj.materials = [...(proj.materials || []), newMat];
            // Atomic Save
            await saveProject(proj);
            setMaterialData({ name: '', qty: '', unit: 'NOS', date: new Date().toISOString().split('T')[0], comment: '', taskId: '', photos: [], status: 'Delivered' });
            alert("Material Logged.");
            refreshLocalState();
        }
    } finally {
        setIsSyncing(false);
    }
  };

  const startDefectUpdate = (defect: Defect) => {
    setUpdatingDefect(defect);
    setDefectUpdateData({ status: defect.status, comment: '' });
  };

  const handleSaveDefectUpdate = async () => {
    if (!selectedProjectId || !updatingDefect) return;
    setIsSyncing(true);
    try {
        const allProjects = await getProjects();
        const projectIdx = allProjects.findIndex(p => p.id === selectedProjectId);
        if (projectIdx > -1) {
            const proj = { ...allProjects[projectIdx] };
            proj.defects = (proj.defects || []).map(d => {
                if (d.id === updatingDefect.id) {
                    const newComment: DefectComment = {
                        user: supervisorName,
                        text: defectUpdateData.comment.toUpperCase() || 'UPDATED BY SUPERVISOR',
                        date: new Date().toISOString().split('T')[0]
                    };
                    return { 
                        ...d, 
                        status: defectUpdateData.status,
                        comments: [...(d.comments || []), newComment]
                    };
                }
                return d;
            });
            // Atomic Save
            await saveProject(proj);
            refreshLocalState();
            setUpdatingDefect(null);
        }
    } finally {
        setIsSyncing(false);
    }
  };

  const activeProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const activeDefects = useMemo(() => (activeProject?.defects || []), [activeProject]);
  const filteredWorkers = useMemo(() => workers.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)), [workers, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden text-left">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm h-20 shrink-0 text-left">
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between text-left">
           <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg text-left"><HardHat size={22} /></div>
              <div className="text-left text-left">
                <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none text-left">{supervisorName}</h1>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 text-left">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button onClick={handleManualRefresh} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''}/></button>
              <button onClick={onBack} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase">Exit</button>
           </div>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0 text-left">
        <div className="max-w-4xl mx-auto flex text-left text-left">
          {(['attendance', 'feed', 'defects', 'materials'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400'}`}>
                {tab}{tab === 'defects' && activeDefects.length > 0 && <span className="ml-1 bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{activeDefects.filter(d => d.status === 'Pending').length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8 overflow-y-auto no-scrollbar text-left text-left text-left">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col md:flex-row items-center gap-6 text-left">
            <div className="flex items-center gap-4 flex-1 w-full text-left">
                <div className={`p-4 rounded-2xl ${selectedProjectId ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'} text-left`}><Briefcase size={24}/></div>
                <div className="flex-1 min-w-0 text-left text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-left text-left">Worksite Selection</p>
                    <select className="w-full bg-transparent text-lg font-black text-slate-800 outline-none cursor-pointer truncate text-left text-left" value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}>
                        <option value="" disabled>Choose job site...</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-4 border-l pl-6 border-slate-100 shrink-0 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Overnight</p>
                <button onClick={() => setIsOvernightMode(!isOvernightMode)} className={`relative w-14 h-8 rounded-full p-1 transition-colors ${isOvernightMode ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`w-6 h-6 rounded-full bg-white transform transition-transform ${isOvernightMode ? 'translate-x-6' : 'translate-x-0'}`}></div></button>
            </div>
        </div>

        {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in text-left text-left">
                <div className="relative text-left"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/><input type="text" placeholder="Search site personnel..." className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all text-left" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
                <div className="grid grid-cols-1 gap-4 text-left">
                    {filteredWorkers.map(w => {
                        const clockIn = activeClockIns.find(c => c.workerId === w.id);
                        const isProcessing = processingWorkerId === w.id;
                        return (
                            <div key={w.id} className={`bg-white p-6 rounded-[2.5rem] border transition-all flex items-center justify-between gap-4 ${clockIn ? 'border-emerald-200 shadow-xl' : 'border-slate-100 shadow-md'} text-left`}>
                                <div className="flex items-center gap-5 flex-1 min-w-0 text-left text-left">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${clockIn ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{w.name.charAt(0)}</div>
                                    <div className="text-left min-w-0 flex-1 text-left">
                                        <h4 className="font-black text-slate-900 leading-tight uppercase text-base truncate text-left">{w.name}</h4>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate text-left">{w.occupationTitle}</p>
                                    </div>
                                </div>
                                <button 
                                    disabled={isProcessing || (!selectedProjectId && !clockIn)}
                                    onClick={() => clockIn ? startClockOut(w) : handleClockIn(w.id)} 
                                    className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all min-w-[120px] flex items-center justify-center gap-2 ${
                                        isProcessing ? 'bg-slate-100 text-slate-400 cursor-wait' :
                                        clockIn ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                                        selectedProjectId ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    {isProcessing ? <Loader2 size={14} className="animate-spin"/> : null}
                                    {clockIn ? 'Out' : 'In'}
                                </button>
                            </div>
                        );
                    })}
                    {filteredWorkers.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs text-left">No matching personnel found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'feed' && (
            <div className="space-y-8 animate-fade-in text-left text-left">
                <div className="p-8 rounded-[3rem] bg-white border border-indigo-100 shadow-2xl space-y-8 text-left text-left">
                    <div className="flex items-center gap-5 text-left"><div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl text-left"><Camera size={32} /></div><div><h3 className="text-xl font-black uppercase tracking-tight text-left">Post Daily Log</h3><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 text-left">Visual site reporting</p></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="space-y-4 text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left">Comments</label><textarea placeholder="Describe site activities..." className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm font-medium h-48 resize-none outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all uppercase text-left" value={supervisorComment} onChange={e => setSupervisorComment(e.target.value)} /></div>
                        <div className="space-y-6 text-left text-left">
                            <div className="space-y-2 text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left">Report Date</label><input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black text-left" value={performanceDate} onChange={e => setPerformanceDate(e.target.value)} /></div>
                            <div className="flex gap-3 text-left">
                                <input type="file" multiple accept="image/*" className="hidden" ref={cameraInputRef} onChange={e => handleGenericPhotoUpload(e, 'feed')} />
                                <button onClick={() => cameraInputRef.current?.click()} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 text-left">
                                    {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <Camera size={18}/>}
                                    <span>Add Photos</span>
                                </button>
                            </div>
                            {stagedPhotos.length > 0 && <div className="flex gap-2 flex-wrap text-left">{stagedPhotos.map((p, i) => <img key={i} src={p} className="w-12 h-12 rounded-lg object-cover" />)}</div>}
                        </div>
                    </div>
                    <button onClick={handleSubmitSiteUpdate} disabled={isSyncing || !supervisorComment} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 text-center">
                        {isSyncing ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} Submit Site Feed
                    </button>
                </div>
            </div>
        )}
      </div>

      {confirmingWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fade-in text-left text-left">
          <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
             <div className="p-8 border-b border-slate-50 bg-indigo-50/30 flex justify-between items-center text-left">
                <div><span className="text-[10px] font-black text-indigo-600 uppercase block">Clock Out Verify</span><h3 className="text-xl font-black text-slate-900 uppercase">{confirmingWorker.name}</h3></div>
                <button onClick={() => setConfirmingWorker(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
             </div>
             <div className="p-8 space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Std Hrs</p>
                      <input type="number" className="bg-transparent text-xl font-black w-full outline-none" value={clockOutData.normalHours} onChange={e => setClockOutData({...clockOutData, normalHours: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">OT Hrs</p>
                      <input type="number" className="bg-transparent text-xl font-black w-full outline-none" value={clockOutData.otHours} onChange={e => setClockOutData({...clockOutData, otHours: parseFloat(e.target.value) || 0})} />
                   </div>
                </div>
                <button onClick={finalizeClockOut} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-sm shadow-xl active:scale-95 transition-all">Archive Work Log</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
