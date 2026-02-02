
import React, { useState, useEffect, useMemo } from 'react';
import { Worker, AttendanceRecord } from '../../types';
import { saveAttendance, getAttendance, isOfficeStaff } from '../../utils';
import { Button } from '../Button';
import { AlertCircle, Zap, ChevronRight, ArrowLeft, Calendar, User, Edit2, Trash2, X, List, Users, Coffee, Truck } from 'lucide-react';

interface AttendanceViewProps {
  employees: Worker[];
  attendance: AttendanceRecord[];
  onUpdate: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ employees, attendance, onUpdate }) => {
  // Filter employees to only show site workers (non-office)
  const siteEmployees = useMemo(() => employees.filter(e => !isOfficeStaff(e)), [employees]);
  
  const [selectedEmp, setSelectedEmp] = useState(siteEmployees[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(8);
  const [otHours, setOtHours] = useState(0);
  const [hasMeal, setHasMeal] = useState(false);
  const [transport, setTransport] = useState<string>('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayMode, setDisplayMode] = useState<'directory' | 'global'>('directory');
  
  const [viewingEmpId, setViewingEmpId] = useState<string | null>(null);

  const isSunday = new Date(date).getDay() === 0;

  useEffect(() => {
    if (!editingId) {
        if (isSunday) {
            setOtHours(hours > 0 ? hours : 8);
            setHours(0);
        } else {
            if (hours === 0) setHours(8);
            setOtHours(0);
        }
    }
  }, [isSunday, editingId]);

  useEffect(() => {
      if (!selectedEmp && siteEmployees.length > 0) setSelectedEmp(siteEmployees[0].id);
  }, [siteEmployees]);

  const handleSave = async () => {
    if (!selectedEmp || isProcessing) return;
    setIsProcessing(true);
    
    let updatedAttendance: AttendanceRecord[];
    
    if (editingId) {
        updatedAttendance = attendance.map(a => a.id === editingId ? {
            ...a,
            employeeId: selectedEmp,
            date,
            hoursWorked: Number(hours),
            overtimeHours: Number(otHours),
            hasMealAllowance: hasMeal,
            transportClaim: Number(transport)
        } : a);
    } else {
        const newRecord: AttendanceRecord = {
            id: Date.now().toString(),
            employeeId: selectedEmp,
            date,
            hoursWorked: isSunday ? 0 : Number(hours),
            overtimeHours: Number(otHours),
            hasMealAllowance: hasMeal,
            transportClaim: Number(transport)
        };
        const filtered = attendance.filter((a: AttendanceRecord) => !(a.employeeId === selectedEmp && a.date === date));
        updatedAttendance = [...filtered, newRecord];
    }
    
    await saveAttendance(updatedAttendance);
    resetForm();
    onUpdate();
    setIsProcessing(false);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setSelectedEmp(record.employeeId);
    setDate(record.date);
    setHours(record.hoursWorked);
    setOtHours(record.overtimeHours);
    setHasMeal(!!record.hasMealAllowance);
    setTransport((record.transportClaim || 0).toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
      if (isProcessing) return;
      if (confirm("Permanently delete this work log? This will update the payroll calculations for this month immediately.")) {
          setIsProcessing(true);
          const updated = attendance.filter(a => a.id !== id);
          await saveAttendance(updated);
          onUpdate();
          setIsProcessing(false);
      }
  };

  const handleClearAllForEmployee = async () => {
    if (!viewingEmpId || isProcessing) return;
    if (confirm(`WARNING: Delete ALL attendance history for this employee? This action cannot be reversed.`)) {
        setIsProcessing(true);
        const remaining = attendance.filter(a => a.employeeId !== viewingEmpId);
        await saveAttendance(remaining);
        onUpdate();
        setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setHasMeal(false);
    setTransport('0');
    if (!isSunday) {
        setHours(8);
        setOtHours(0);
    }
  };

  const sortedGlobalLogs = useMemo(() => {
    return [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance]);

  const attendanceCounts = attendance.reduce((acc, curr) => {
    acc[curr.employeeId] = (acc[curr.employeeId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const viewingEmp = employees.find(e => e.id === viewingEmpId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-10">
      <div className="lg:col-span-1 space-y-6">
          <div className={`bg-white p-8 rounded-3xl shadow-sm border transition-all ${editingId ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${editingId ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Calendar size={18} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Edit Entry' : 'Manual Log'}</h3>
                </div>
                {editingId && (
                    <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-full">
                        <X size={18} />
                    </button>
                )}
            </div>
            
            <div className="space-y-6">
                <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Site Staff</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
                        {siteEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                
                <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Work Date</label>
                    <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isSunday ? 'text-slate-300' : 'text-slate-400'}`}>Normal Hrs</label>
                        <input type="number" disabled={isSunday && !editingId} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black disabled:opacity-50" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
                    </div>
                    <div className="space-y-1">
                        <label className={`block text-[10px] font-black uppercase tracking-[0.2em] ${isSunday ? 'text-indigo-600' : 'text-slate-400'}`}>OT Hrs</label>
                        <input type="number" className={`w-full px-4 py-3 border rounded-2xl text-sm font-black focus:ring-4 outline-none transition-all ${isSunday ? 'bg-indigo-50 border-indigo-200 text-indigo-700 focus:ring-indigo-500/10' : 'bg-slate-50 border-slate-200 focus:ring-emerald-500/5'}`} value={otHours} onChange={(e) => setOtHours(Number(e.target.value))} />
                    </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-slate-50">
                    <label className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors">
                        <input type="checkbox" checked={hasMeal} onChange={e => setHasMeal(e.target.checked)} className="w-5 h-5 rounded text-amber-600 border-amber-200" />
                        <div className="flex-1 flex items-center gap-2">
                            <Coffee size={16} className="text-amber-600"/>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-amber-900 uppercase">Late OT Meal ($5)</span>
                                <span className="text-[8px] font-bold text-amber-600 uppercase">Work done after 9:00 PM</span>
                            </div>
                        </div>
                    </label>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-1"><Truck size={10}/> Transport Claim ($)</label>
                        <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" value={transport} onChange={e => setTransport(e.target.value)} />
                    </div>
                </div>
                
                <Button onClick={handleSave} disabled={isProcessing} className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-600/10 font-black uppercase tracking-widest text-xs" variant={editingId ? "primary" : "secondary"}>
                    {isProcessing ? "Processing..." : (editingId ? "Update Log Entry" : "Commit to Database")}
                </Button>
            </div>
          </div>

          {isSunday && (
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-600/20 flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-xl"><Zap size={20}/></div>
                <div>
                    <h4 className="font-black uppercase tracking-widest text-[10px] mb-1">Sunday Mode</h4>
                    <p className="text-xs font-medium leading-relaxed opacity-90">Sunday hours are automatically classified as 2.0x Overtime. Normal hours are blocked for compliance.</p>
                </div>
            </div>
          )}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-220px)] flex flex-col">
            
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                        onClick={() => setDisplayMode('directory')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${displayMode === 'directory' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={16}/> Directory
                    </button>
                    <button 
                        onClick={() => setDisplayMode('global')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${displayMode === 'global' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List size={16}/> Global History
                    </button>
                </div>
                {displayMode === 'directory' && viewingEmpId && (
                     <button onClick={() => setViewingEmpId(null)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:text-indigo-600 transition-colors"><ArrowLeft size={14}/> Back to List</button>
                )}
            </div>

            {displayMode === 'directory' ? (
                !viewingEmpId ? (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="divide-y divide-slate-50">
                            {siteEmployees.map(emp => (
                                <button 
                                    key={emp.id}
                                    onClick={() => setViewingEmpId(emp.id)}
                                    className="w-full flex items-center justify-between p-8 hover:bg-slate-50 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform shadow-inner">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 text-lg tracking-tight">{emp.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{emp.occupationTitle || 'Personnel'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">{attendanceCounts[emp.id] || 0} Logs</div>
                                            <div className="text-[9px] text-slate-300 uppercase font-bold">Total entries</div>
                                        </div>
                                        <ChevronRight size={24} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-black text-slate-800 text-2xl tracking-tighter">{viewingEmp?.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Individual Work History</p>
                            </div>
                            <button 
                                onClick={handleClearAllForEmployee}
                                className="px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                            >
                                Clear All
                            </button>
                        </div>
                        <AttendanceTable 
                            data={attendance.filter(a => a.employeeId === viewingEmpId)} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                            editingId={editingId}
                        />
                    </div>
                )
            ) : (
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                        <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Recent Company-wide Activity</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Chronological Feed of all Site Logs</p>
                    </div>
                    <AttendanceTable 
                        data={sortedGlobalLogs} 
                        employees={employees}
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        editingId={editingId}
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

interface TableProps {
    data: AttendanceRecord[];
    employees?: Worker[];
    onEdit: (r: AttendanceRecord) => void;
    onDelete: (id: string) => void;
    editingId: string | null;
}

const AttendanceTable: React.FC<TableProps> = ({ data, employees, onEdit, onDelete, editingId }) => (
    <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10">
            <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Detail</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hours</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Overtime</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Perks</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {data.map((a: AttendanceRecord) => {
                const isSun = new Date(a.date).getDay() === 0;
                const worker = employees?.find(e => e.id === a.employeeId);
                
                return (
                    <tr key={a.id} className={`hover:bg-slate-50/50 transition-colors group ${editingId === a.id ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isSun ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                <div>
                                    <div className="font-black text-slate-900 leading-tight">
                                        {worker ? worker.name : a.date}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                        {worker ? a.date : new Date(a.date).toLocaleDateString(undefined, { weekday: 'long' })}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <div className="font-black text-slate-700">{a.hoursWorked}h</div>
                            <div className="text-[8px] text-slate-300 font-black uppercase">Standard</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                            <div className={`font-black ${a.overtimeHours > 0 ? (isSun ? 'text-indigo-600' : 'text-emerald-600') : 'text-slate-200'}`}>
                                {a.overtimeHours > 0 ? `${a.overtimeHours}h` : '—'}
                            </div>
                            {a.overtimeHours > 0 && <div className="text-[8px] text-slate-300 font-black uppercase">{isSun ? '2.0x' : '1.5x'}</div>}
                        </td>
                        <td className="px-4 py-6 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                {/* Moved title from Lucide icon to wrapper span to fix TS error */}
                                {a.hasMealAllowance && <span title="Late Meal Entitled"><Coffee size={14} className="text-amber-500" /></span>}
                                {/* Moved title from Lucide icon to wrapper span to fix TS error */}
                                {(a.transportClaim || 0) > 0 && <span title={`Transport: $${a.transportClaim}`}><Truck size={14} className="text-blue-500" /></span>}
                                {!a.hasMealAllowance && !(a.transportClaim || 0) && <span className="text-slate-200">—</span>}
                            </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEdit(a)} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-indigo-100">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => onDelete(a.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-red-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                );
            })}
            {data.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">No logs found in this scope.</td></tr>
            )}
        </tbody>
    </table>
);
