
import React, { useState, useMemo } from 'react';
import { Worker, LeaveRecord, LeaveType, RateType } from '../../types';
import { saveLeaves, getLeaveEntitlements } from '../../utils';
import { Button } from '../Button';
import { Info, AlertCircle, TrendingUp, History, Edit2, Trash2, X, CalendarCheck, ShieldCheck, HeartPulse, UserMinus, CheckCircle2, XCircle } from 'lucide-react';

interface LeavesViewProps {
  employees: Worker[];
  leaves: LeaveRecord[];
  onUpdate: () => void;
}

export const LeavesView: React.FC<LeavesViewProps> = ({ employees, leaves, onUpdate }) => {
    const [newLeave, setNewLeave] = useState<Partial<LeaveRecord>>({ 
        employeeId: employees[0]?.id || '',
        type: LeaveType.ANNUAL,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isPayable: false
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();

    const selectedWorker = useMemo(() => 
        employees.find(e => e.id === newLeave.employeeId),
    [employees, newLeave.employeeId]);

    const stats = useMemo(() => {
        if (!newLeave.employeeId) return null;
        const entitlements = selectedWorker ? getLeaveEntitlements(selectedWorker) : { annual: 0, mc: 0, hosp: 0 };
        const otherLeaves = editingId ? leaves.filter(l => l.id !== editingId) : leaves;
        
        const yearLeaves = otherLeaves.filter(l => {
            const startYear = new Date(l.startDate).getFullYear();
            return l.employeeId === newLeave.employeeId && startYear === currentYear;
        });

        return { 
            entitlements, 
            usage: {
                annualUsed: yearLeaves.filter(l => l.type === LeaveType.ANNUAL || l.type === LeaveType.HALF_DAY_ANNUAL).reduce((acc, l) => acc + l.totalDays, 0),
                mcUsed: yearLeaves.filter(l => l.type === LeaveType.MC).reduce((acc, l) => acc + l.totalDays, 0),
                hospUsed: yearLeaves.filter(l => l.type === LeaveType.HOSPITALIZATION).reduce((acc, l) => acc + l.totalDays, 0),
                unpaid: yearLeaves.filter(l => l.type === LeaveType.UNPAID_LEAVE || l.type === LeaveType.UNPAID_MC || l.type === LeaveType.OFF_DAY || l.type === LeaveType.HALF_DAY_OFF_DAY).reduce((acc, l) => acc + l.totalDays, 0)
            }
        };
    }, [newLeave.employeeId, selectedWorker, leaves, editingId]);

    const calculateRequestDays = (start: string, end: string, type: LeaveType) => {
        if (type === LeaveType.HALF_DAY_ANNUAL || type === LeaveType.HALF_DAY_OFF_DAY) {
            return 0.5;
        }
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
        const diff = e.getTime() - s.getTime();
        return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
    };

    const requestedDays = useMemo(() => 
        calculateRequestDays(newLeave.startDate || '', newLeave.endDate || '', newLeave.type || LeaveType.ANNUAL),
    [newLeave.startDate, newLeave.endDate, newLeave.type]);

    const handleAdd = () => {
        if (!newLeave.employeeId || !newLeave.startDate || !newLeave.endDate || !stats) return;
        
        let finalType = newLeave.type as LeaveType;
        
        // Auto-correct to unpaid if limit exceeded
        if (finalType === LeaveType.ANNUAL || finalType === LeaveType.HALF_DAY_ANNUAL) {
            const checkDays = finalType === LeaveType.HALF_DAY_ANNUAL ? 0.5 : requestedDays;
            if (stats.usage.annualUsed + checkDays > stats.entitlements.annual) {
                if (confirm(`Employee has already used ${stats.usage.annualUsed}/${stats.entitlements.annual} days. Exceeding limit will convert this to UNPAID. Proceed?`)) {
                    finalType = finalType === LeaveType.HALF_DAY_ANNUAL ? LeaveType.HALF_DAY_OFF_DAY : LeaveType.UNPAID_LEAVE;
                } else return;
            }
        } else if (finalType === LeaveType.MC) {
            if (stats.usage.mcUsed + requestedDays > stats.entitlements.mc) {
                if (confirm(`Employee has used ${stats.usage.mcUsed}/${stats.entitlements.mc} MC days. Exceeding limit will convert this to UNPAID MC. Proceed?`)) {
                    finalType = LeaveType.UNPAID_MC;
                } else return;
            }
        }

        const l: LeaveRecord = {
            id: editingId || Date.now().toString(),
            employeeId: newLeave.employeeId,
            startDate: newLeave.startDate!,
            endDate: newLeave.endDate!,
            type: finalType,
            reason: newLeave.reason || '',
            totalDays: requestedDays,
            isPayable: newLeave.isPayable
        };
        
        let updatedLeaves: LeaveRecord[];
        if (editingId) {
            updatedLeaves = leaves.map(item => item.id === editingId ? l : item);
        } else {
            updatedLeaves = [...leaves, l];
        }

        saveLeaves(updatedLeaves);
        resetForm();
        onUpdate();
    };

    const handleEdit = (record: LeaveRecord) => {
        setEditingId(record.id);
        setNewLeave({
            employeeId: record.employeeId,
            type: record.type,
            startDate: record.startDate,
            endDate: record.endDate,
            reason: record.reason,
            isPayable: !!record.isPayable
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (confirm("Permanently delete this leave/exception record?")) {
            saveLeaves(leaves.filter(l => l.id !== id));
            onUpdate();
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setNewLeave({ 
            employeeId: employees[0]?.id || '',
            reason: '', 
            type: LeaveType.ANNUAL,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            isPayable: false
        });
    };

    const isHalfDay = newLeave.type === LeaveType.HALF_DAY_ANNUAL || newLeave.type === LeaveType.HALF_DAY_OFF_DAY;
    const showPayableOption = selectedWorker?.rateType !== RateType.MONTHLY;

    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border transition-all ${editingId ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className={editingId ? "text-indigo-600" : "text-slate-400"}/> 
                            {editingId ? 'Edit Absence Log' : 'Record Absence/Off Day'}
                        </h3>
                        {editingId && (
                            <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-5">
                         <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Employee</label>
                            <select 
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                                value={newLeave.employeeId || ''} 
                                onChange={(e) => setNewLeave({...newLeave, employeeId: e.target.value})}
                            >
                                {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                         </div>

                         <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Absence Category</label>
                            <select 
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                                value={newLeave.type} 
                                onChange={(e) => {
                                    const val = e.target.value as LeaveType;
                                    setNewLeave({...newLeave, type: val});
                                }}
                            >
                                <optgroup label="Paid Entities (Monthly Only)">
                                    <option value={LeaveType.ANNUAL}>Annual Leave (Full Day)</option>
                                    <option value={LeaveType.HALF_DAY_ANNUAL}>Half Day Leave (0.5)</option>
                                    <option value={LeaveType.MC}>Sick Leave / MC (Full)</option>
                                    <option value={LeaveType.HOSPITALIZATION}>Hospitalization (Full)</option>
                                </optgroup>
                                <optgroup label="Unpaid Entities">
                                    <option value={LeaveType.UNPAID_LEAVE}>Unpaid Leave (Full)</option>
                                    <option value={LeaveType.OFF_DAY}>Off Day (Full Day)</option>
                                    <option value={LeaveType.HALF_DAY_OFF_DAY}>Half Day Off (0.5)</option>
                                    <option value={LeaveType.UNPAID_MC}>Unpaid MC (Full)</option>
                                </optgroup>
                            </select>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm" value={newLeave.startDate || ''} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value, endDate: isHalfDay ? e.target.value : newLeave.endDate})} />
                             </div>
                             <div className="space-y-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                                <input disabled={isHalfDay} type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm disabled:opacity-40" value={newLeave.endDate || ''} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} />
                             </div>
                         </div>

                         <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100 shadow-inner">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Duration</span>
                            <span className="text-xl font-black text-indigo-600">{requestedDays} Day{requestedDays !== 1 ? 's' : ''}</span>
                         </div>

                         {showPayableOption && (
                            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 rounded text-indigo-600 border-indigo-200 focus:ring-indigo-500 transition-all cursor-pointer"
                                            checked={!!newLeave.isPayable}
                                            onChange={e => setNewLeave({...newLeave, isPayable: e.target.checked})}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-xs font-black text-indigo-900 uppercase leading-none">Claim Paid Absence</span>
                                        <span className="block text-[9px] font-bold text-indigo-400 uppercase tracking-tighter mt-1">Company will pay day rate for this absence (e.g. Valid MC provided)</span>
                                    </div>
                                </label>
                            </div>
                         )}

                         <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Memo / Notes</label>
                            <input className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium" placeholder="Brief reason..." value={newLeave.reason || ''} onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})} />
                         </div>

                         <div className="flex gap-2 pt-2">
                             {editingId && <Button onClick={resetForm} variant="secondary" className="flex-1">Cancel</Button>}
                             <Button onClick={handleAdd} className="flex-[2] py-4 rounded-xl shadow-lg shadow-indigo-600/10 uppercase tracking-widest text-[11px] font-black">
                                 {editingId ? "Update Archive" : "Commit Record"}
                             </Button>
                         </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {stats ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck size={100}/></div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-indigo-600"/> Paid Entitlements ({currentYear})
                                </h4>
                                
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black text-slate-700 uppercase">Annual Leave</span>
                                            <span className="text-xs font-black text-indigo-600">{stats.usage.annualUsed} / {stats.entitlements.annual} D</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-700 ${stats.usage.annualUsed >= stats.entitlements.annual ? 'bg-rose-50' : 'bg-emerald-500'}`} 
                                                style={{ width: `${Math.min(100, (stats.usage.annualUsed / stats.entitlements.annual) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[11px] font-black text-slate-700 uppercase">Medical (MC)</span>
                                            <span className="text-xs font-black text-indigo-600">{stats.usage.mcUsed} / {stats.entitlements.mc} D</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-700 ${stats.usage.mcUsed >= stats.entitlements.mc ? 'bg-rose-50' : 'bg-blue-500'}`} 
                                                style={{ width: `${Math.min(100, (stats.usage.mcUsed / stats.entitlements.mc) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-6">
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <UserMinus size={14} className="text-rose-400"/> Unpaid Adjustments
                                </h4>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Deductible Days</p>
                                    <p className="text-4xl font-black text-white mt-1">{stats.usage.unpaid} <span className="text-lg text-rose-400 uppercase font-bold tracking-tighter">Days</span></p>
                                    <p className="text-[9px] text-slate-500 mt-4 leading-relaxed font-medium uppercase italic">
                                        {selectedWorker?.rateType === RateType.MONTHLY 
                                            ? "These days will be deducted from the Monthly Basic Wage proportionally."
                                            : "Daily/Hourly staff: Paid leave records are added to basic pay, others are skipped."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 bg-white border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 gap-4">
                            <CalendarCheck size={40} className="opacity-20"/>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select personnel to audit balance</p>
                        </div>
                    )}

                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <History size={16} className="text-indigo-600"/> Absence History Log
                            </h3>
                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">{leaves.length} Entries</span>
                        </div>
                        <div className="overflow-y-auto max-h-[400px] no-scrollbar">
                            <table className="min-w-full divide-y divide-slate-50">
                                <thead className="bg-slate-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Personnel / Memo</th>
                                        <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                                        <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Payment</th>
                                        <th className="px-6 py-5 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Days</th>
                                        <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-50">
                                    {leaves.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((l) => {
                                        const emp = employees.find((e) => e.id === l.employeeId);
                                        const isUnpaid = l.type === LeaveType.UNPAID_LEAVE || l.type === LeaveType.UNPAID_MC || l.type === LeaveType.OFF_DAY || l.type === LeaveType.HALF_DAY_OFF_DAY;
                                        const isMonthly = emp?.rateType === RateType.MONTHLY;
                                        const isActuallyPaid = isMonthly ? !isUnpaid : !!l.isPayable;

                                        return (
                                            <tr key={l.id} className={`hover:bg-slate-50 transition-colors group/row ${editingId === l.id ? 'bg-indigo-50/50' : ''}`}>
                                                <td className="px-8 py-6 text-left">
                                                    <div className="font-black text-slate-900 uppercase text-xs">{emp?.name || 'Unknown'}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 line-clamp-1">{l.reason || 'NO MEMO RECORDED'}</div>
                                                    <div className="text-[8px] text-slate-300 font-mono mt-0.5">{l.startDate} » {l.endDate}</div>
                                                </td>
                                                <td className="px-6 py-6 text-left">
                                                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                                                        isUnpaid ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                                        (l.type === LeaveType.MC || l.type === LeaveType.UNPAID_MC) ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    }`}>
                                                        {l.type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    {isActuallyPaid ? (
                                                        <div className="flex flex-col items-center">
                                                            <CheckCircle2 size={16} className="text-emerald-500 mb-1"/>
                                                            <span className="text-[7px] font-black text-emerald-600 uppercase">Paid Day</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <XCircle size={16} className="text-slate-200 mb-1"/>
                                                            <span className="text-[7px] font-black text-slate-300 uppercase">Unpaid</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-6 text-center font-black text-slate-900 tabular-nums">{l.totalDays}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(l)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm transition-all" title="Edit Entry">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button onClick={() => handleDelete(l.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-100 rounded-xl shadow-sm transition-all" title="Delete Entry">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {leaves.length === 0 && <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Registry Empty</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-start gap-4 text-left">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600"><HeartPulse size={24}/></div>
                        <div className="space-y-2">
                            <h5 className="text-[11px] font-black text-blue-900 uppercase tracking-widest">MOM Compliance Note</h5>
                            <p className="text-[10px] text-blue-700/80 leading-relaxed font-medium uppercase">
                                Employees are entitled to paid sick leave (MC) and annual leave after 3 months of service. 
                                For <strong>Daily/Hourly</strong> staff, paid MC/Leave must be manually claimed via the checkbox to be added to the payroll basic pay.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
