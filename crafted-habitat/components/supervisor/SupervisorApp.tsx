import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Worker, ActiveClockIn, AttendanceRecord, Project, 
  DailyUpdate, Material, MaterialStatus, Defect, 
  DefectStatus, DefectComment 
} from '../../types';
import { 
  getWorkers, getActiveClockIns, saveActiveClockIns, 
  getAttendance, saveAttendance, getProjects, 
  isOfficeStaff, saveProject, uploadFileToCloud, 
  getMediaViewUrl, formatDateSG 
} from '../../utils';
import { 
  LogOut, HardHat, Search, Briefcase, Camera, Package, 
  Eye, X, Eraser, Calendar, CheckCircle2, Siren, Layers,
  Clock, UserCheck, UserMinus, ChevronRight, Loader2,
  AlertTriangle, Zap, RefreshCw, Smartphone, Send, 
  Timer, Moon, Sun, Upload, Check, ImageIcon, User as UserIcon,
  MessageSquare, LayoutGrid, Trash, TimerReset, Truck, Info, 
  Bell, XCircle, Wrench, Coffee, PenTool, MapPin
} from 'lucide-react';

export interface SupervisorAppProps {
  onBack: () => void;
  syncKey?: number;
  supervisorName?: string;
}

export const SupervisorApp: React.FC<SupervisorAppProps> = ({ 
  onBack, 
  syncKey = 0, 
  supervisorName = 'Site Supervisor' 
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'feed' | 'defects' | 'materials'>('attendance');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeClockIns, setActiveClockIns] = useState<ActiveClockIn[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Signature State
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Feature States
  const [confirmingWorker, setConfirmingWorker] = useState<Worker | null>(null);
  const [clockOutData, setClockOutData] = useState({ 
    normalHours: 8, 
    otHours: 0, 
    date: new Date().toISOString().split('T')[0], 
    projectId: '',
    hasMeal: false,
    transport: '0'
  });

  const [supervisorComment, setSupervisorComment] = useState('');
  const [stagedPhotos, setStagedPhotos] = useState<string[]>([]);
  
  const [materialForm, setMaterialForm] = useState({
    name: '', qty: '', unit: 'NOS', date: new Date().toISOString().split('T')[0],
    photos: [] as string[]
  });

  useEffect(() => {
    refreshData();
  }, [syncKey]);

  const refreshData = async () => {
    setIsSyncing(true);
    try {
        const [w, p, ac] = await Promise.all([
            getWorkers(),
            getProjects(),
            getActiveClockIns()
        ]);
        setWorkers(w.filter(worker => !isOfficeStaff(worker)));
        setProjects(p);
        setActiveClockIns(ac || []);
    } finally {
        setIsSyncing(false);
    }
  };

  /**
   * CLOCK-OUT LOGIC (v5.2)
   * Shifts > 9 hours split: 8 Normal + (Elapsed - 9) OT.
   * Automated 1-hour lunch deduction.
   */
  const startClockOut = (worker: Worker) => {
    const clockIn = activeClockIns.find(c => c.workerId === worker.id);
    if (!clockIn) return;
    
    const startTime = new Date(clockIn.clockInTime).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / (1000 * 60 * 60); // Raw hours
    
    // Automated Logic: Deduct 1 hour lunch
    const netHours = Math.max(0, elapsed - 1);
    
    let normal = 0;
    let ot = 0;

    if (netHours > 8) {
        normal = 8;
        ot = netHours - 8;
    } else {
        normal = netHours;
        ot = 0;
    }

    setClockOutData({ 
        normalHours: Number(normal.toFixed(1)), 
        otHours: Number(ot.toFixed(1)), 
        date: new Date().toISOString().split('T')[0], 
        projectId: clockIn.projectId,
        hasMeal: ot >= 2, // Suggest meal if OT >= 2hrs
        transport: '0'
    });
    setConfirmingWorker(worker);
  };

  const handleClockIn = async (workerId: string) => {
    if (!selectedProjectId) return;
    setIsSyncing(true);
    try {
        const newClockIn: ActiveClockIn = {
            workerId,
            clockInTime: new Date().toISOString(),
            projectId: selectedProjectId
        };
        const updated = [...activeClockIns, newClockIn];
        await saveActiveClockIns(updated);
        setActiveClockIns(updated);
    } finally {
        setIsSyncing(false);
    }
  };

  const finalizeClockOut = async () => {
    if (!confirmingWorker) return;
    const sig = signatureCanvasRef.current?.toDataURL("image/png");
    
    const newRecord: AttendanceRecord = {
        id: 'ATT_' + Date.now(), 
        employeeId: confirmingWorker.id, 
        date: clockOutData.date,
        hoursWorked: clockOutData.normalHours, 
        overtimeHours: clockOutData.otHours,
        projectId: clockOutData.projectId, 
        signatureUrl: sig, 
        hasMealAllowance: clockOutData.hasMeal,
        transportClaim: parseFloat(clockOutData.transport) || 0,
        remarks: `SITE_SIG_VERIFIED`
    };

    setIsSubmitting(true);
    try {
        const currentLogs = await getAttendance();
        await saveAttendance([...currentLogs, newRecord]);
        const updatedActive = activeClockIns.filter(a => a.workerId !== confirmingWorker.id);
        await saveActiveClockIns(updatedActive);
        setActiveClockIns(updatedActive);
        setConfirmingWorker(null);
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- Signature Pad Core ---
  const startDrawing = (e: any) => { 
    setIsDrawing(true); 
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing || !signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1e1b4b';
        ctx.lineTo(x, y);
        ctx.stroke();
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'feed' | 'material') => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      setIsSyncing(true);
      try {
          const urls = [];
          for(const file of Array.from(files) as File[]) {
              // Fix: remove second argument from uploadFileToCloud call
              const url = await uploadFileToCloud(file);
              urls.push(url);
          }
          if (target === 'feed') setStagedPhotos(prev => [...prev, ...urls]);
          else setMaterialForm(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
      } finally {
          setIsSyncing(false);
      }
  };

  const postDailyUpdate = async () => {
    if (!selectedProjectId || !supervisorComment) return;
    setIsSubmitting(true);
    try {
        const allProjects = await getProjects();
        const pIdx = allProjects.findIndex(p => p.id === selectedProjectId);
        if (pIdx > -1) {
            const proj = { ...allProjects[pIdx] };
            const update: DailyUpdate = {
                id: 'SUP_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                user: supervisorName.toUpperCase(),
                description: supervisorComment.toUpperCase(),
                images: stagedPhotos
            };
            proj.dailyUpdates = [update, ...(proj.dailyUpdates || [])];
            await saveProject(proj);
            setSupervisorComment('');
            setStagedPhotos([]);
            alert("Site Feed Updated.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans text-slate-900 text-left overflow-x-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                  <HardHat size={24}/>
              </div>
              <div>
                  <h1 className="text-xl font-black uppercase tracking-tight leading-none">{supervisorName}</h1>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Live Site Interface</p>
              </div>
          </div>
          <button onClick={onBack} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
              <LogOut size={22}/>
          </button>
      </header>

      {/* Site Selector (Security Enforced) */}
      <div className="bg-white border-b border-slate-200 p-6 z-50">
          <div className="max-w-xl mx-auto space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MapPin size={10}/> Deployment Worksite
              </label>
              <select 
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-lg uppercase outline-none focus:border-indigo-600 transition-all appearance-none text-left"
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
              >
                  <option value="">-- No Site Selected --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {!selectedProjectId && (
                  <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-2 flex items-center gap-2 animate-pulse">
                      <AlertTriangle size={12}/> Logging Disabled: Please select a worksite
                  </p>
              )}
          </div>
      </div>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-[152px] z-40 overflow-x-auto no-scrollbar">
          <div className="flex px-4 max-w-2xl mx-auto">
              {(['attendance', 'feed', 'defects', 'materials'] as const).map(t => (
                  <button 
                    key={t} 
                    onClick={() => setActiveTab(t)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === t ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-300'}`}
                  >
                      {t}
                  </button>
              ))}
          </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-8 pb-32">
          {activeTab === 'attendance' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="relative">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                      <input 
                        className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 outline-none font-bold text-lg" 
                        placeholder="Search workers..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  
                  <div className="space-y-4">
                      {filteredWorkers.map(w => {
                          const clockIn = activeClockIns.find(c => c.workerId === w.id);
                          const isBusy = isSyncing;
                          return (
                              <div key={w.id} className={`bg-white p-6 rounded-[2.5rem] border transition-all flex items-center justify-between gap-4 ${clockIn ? 'border-indigo-100 ring-4 ring-indigo-50 shadow-2xl' : 'border-slate-100 shadow-sm'}`}>
                                  <div className="flex items-center gap-5 min-w-0">
                                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${clockIn ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>
                                          {w.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0 text-left text-left">
                                          <h4 className="font-black text-slate-900 uppercase truncate text-base leading-tight text-left">{w.name}</h4>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate text-left">{w.occupationTitle}</p>
                                          {clockIn && (
                                              <div className="flex items-center gap-1.5 mt-2">
                                                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Clocked {new Date(clockIn.clockInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  <button 
                                    disabled={isBusy || (!clockIn && !selectedProjectId)}
                                    onClick={() => clockIn ? startClockOut(w) : handleClockIn(w.id)}
                                    className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all min-w-[120px] shadow-lg ${clockIn ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-slate-900 text-white hover:bg-black'} disabled:opacity-30`}
                                  >
                                      {isBusy ? <Loader2 className="animate-spin mx-auto" size={16}/> : clockIn ? 'OUT' : 'IN'}
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {activeTab === 'feed' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl space-y-8">
                      <div className="flex items-center gap-5">
                          <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl"><Camera size={32}/></div>
                          <div className="text-left text-left text-left text-left"><h3 className="text-xl font-black uppercase tracking-tight text-left">Post Site Update</h3><p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 text-left">Visual Site Log</p></div>
                      </div>
                      <textarea 
                        disabled={!selectedProjectId}
                        className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-bold text-sm uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[180px] resize-none" 
                        placeholder="Log site activities..."
                        value={supervisorComment}
                        onChange={e => setSupervisorComment(e.target.value)}
                      />
                      <div className="space-y-4">
                          <div className="flex flex-wrap gap-4">
                              <button 
                                disabled={!selectedProjectId}
                                onClick={() => document.getElementById('camera-input')?.click()} 
                                className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
                              >
                                  {isSyncing ? <Loader2 className="animate-spin" size={24}/> : <Camera size={28}/>}
                                  <span className="text-[8px] font-black uppercase mt-1">UPLOAD</span>
                              </button>
                              <input type="file" id="camera-input" className="hidden" multiple accept="image/*" onChange={e => handleFileUpload(e, 'feed')} />
                              {stagedPhotos.map((p, i) => (
                                  <div key={i} className="relative w-24 h-24 rounded-3xl overflow-hidden border border-slate-100 shadow-sm group">
                                      <img src={getMediaViewUrl(p)} className="w-full h-full object-cover" />
                                      <button onClick={() => setStagedPhotos(prev => prev.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><X size={10}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <button 
                        disabled={!selectedProjectId || !supervisorComment || isSubmitting}
                        onClick={postDailyUpdate}
                        className="w-full py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                      >
                          {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>} Broadcast Log
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'defects' && (
              <div className="space-y-8 animate-fade-in text-left">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 text-left">
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Wrench size={24}/></div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-left">Active Defects</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {projects.find(p => p.id === selectedProjectId)?.defects?.map(d => (
                            <div key={d.id} className="py-6 flex justify-between items-center group">
                                <div className="text-left text-left">
                                    <div className="flex items-center gap-3">
                                        <h5 className="font-black text-slate-800 uppercase text-sm text-left">{d.description}</h5>
                                        {d.isUrgent && <Siren size={14} className="text-rose-600 animate-bounce" />}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1 text-left"><MapPin size={10}/> {d.location}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${d.status === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                    {d.status}
                                </span>
                            </div>
                        ))}
                        {(!selectedProjectId || !projects.find(p => p.id === selectedProjectId)?.defects?.length) && (
                            <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic text-left">No defects recorded for this site</div>
                        )}
                    </div>
                  </div>
              </div>
          )}

          {activeTab === 'materials' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 rounded-2xl bg-amber-500 text-white shadow-xl"><Package size={32}/></div>
                            <div className="text-left text-left text-left text-left"><h3 className="text-xl font-black uppercase tracking-tight text-left">Material Arrival</h3><p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 text-left">Site Logistics Log</p></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                            <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Item Description</label><input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-left" value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value.toUpperCase()})} /></div>
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Quantity</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left" value={materialForm.qty} onChange={e => setMaterialForm({...materialForm, qty: e.target.value})} /></div>
                                <div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">UOM</label><select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-left" value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})}><option>NOS</option><option>PCS</option><option>M2</option><option>PKT</option><option>LS</option></select></div>
                            </div>
                        </div>
                        <button className="w-full py-5 bg-amber-500 text-white rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-xl">Archive Logistics Log</button>
                  </div>
              </div>
          )}
      </main>

      {/* CLOCK-OUT MODAL */}
      {confirmingWorker && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-left">
              <div className="bg-white w-full max-md rounded-[3.5rem] shadow-2xl overflow-hidden border-4 border-white/20 animate-in zoom-in-95">
                   <div className="p-10 border-b border-slate-50 bg-indigo-50/50 flex justify-between items-center text-left">
                        <div className="text-left text-left">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block text-left">Cycle Verification</span>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mt-1 text-left">{confirmingWorker.name}</h3>
                        </div>
                        <button onClick={() => setConfirmingWorker(null)} className="p-3 bg-white text-slate-400 rounded-full border border-slate-100 shadow-sm transition-all"><X size={24}/></button>
                   </div>
                   <div className="p-10 space-y-10 text-left">
                        <div className="grid grid-cols-2 gap-6 text-left text-left">
                             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left text-left">
                                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2 text-left">Standard Payout</p>
                                 <div className="flex items-center gap-2 text-left text-left">
                                     <input type="number" className="bg-transparent text-3xl font-black text-slate-900 w-full outline-none text-left" value={clockOutData.normalHours} onChange={e => setClockOutData({...clockOutData, normalHours: parseFloat(e.target.value) || 0})} />
                                     <span className="text-sm font-black text-slate-300">HRS</span>
                                 </div>
                             </div>
                             <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 text-left text-left">
                                 <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 text-left">Overtime (OT)</p>
                                 <div className="flex items-center gap-2 text-left text-left">
                                     <input type="number" className="bg-transparent text-3xl font-black text-indigo-700 w-full outline-none text-left" value={clockOutData.otHours} onChange={e => setClockOutData({...clockOutData, otHours: parseFloat(e.target.value) || 0})} />
                                     <span className="text-sm font-black text-indigo-300">HRS</span>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-4 text-left text-left">
                            <div className="flex justify-between items-center px-1 text-left text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 text-left"><PenTool size={14}/> Personnel Signature</label>
                                <button onClick={clearSignature} className="text-[9px] font-black text-rose-500 uppercase hover:underline">Clear Canvas</button>
                            </div>
                            <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] relative overflow-hidden group touch-none text-left text-left">
                                <canvas 
                                    ref={signatureCanvasRef} 
                                    width={400} 
                                    height={200}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={() => setIsDrawing(false)}
                                    onMouseOut={() => setIsDrawing(false)}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={() => setIsDrawing(false)}
                                    className="w-full h-full cursor-crosshair"
                                />
                            </div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase text-center italic">Verify that 1 hour has been deducted for lunch as per SOP.</p>
                        </div>

                        <button 
                            disabled={isSubmitting}
                            onClick={finalizeClockOut}
                            className="w-full py-6 bg-indigo-600 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-center"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>} Verify Cycle End
                        </button>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};