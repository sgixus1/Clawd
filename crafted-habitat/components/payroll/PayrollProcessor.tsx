
import React, { useState, useEffect, useMemo } from 'react';
import { Payslip, Worker, PayrollRun, AttendanceRecord, RateType, PayrollPaymentStatus, LeaveType, LeaveRecord, CrmData } from '../../types';
import { Button } from '../Button';
import { CheckCircle, Calculator, RefreshCw, Info, AlertTriangle, Calendar as CalendarIcon, RotateCcw, Building2, Lock, X, Filter, Loader2 } from 'lucide-react';
import { formatCurrency, getHourlyRate, getAttendance, getLeaves, calculateOvertimeMultiplier, calculateCpfEstimates, isPublicHoliday, getCrmData } from '../../utils';

interface PayrollProcessorProps {
  workers: Worker[];
  onSave: (run: PayrollRun) => void;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const PayrollProcessor: React.FC<PayrollProcessorProps> = ({ workers, onSave }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [basis, setBasis] = useState<'actual' | 'mom'>('actual');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [crmData, setCrmData] = useState<CrmData | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    getCrmData().then(setCrmData);
  }, []);

  const handleStartDateChange = (val: string) => {
      setStartDate(val);
      const d = new Date(val);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      setEndDate(lastDay);
  };

  const calculatePayslips = async () => {
    const attendanceLogs = await getAttendance();
    const allLeaves = await getLeaves();
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const isMOMMode = basis === 'mom';

    // Filter workers by selected entity if applicable
    const activeWorkers = workers.filter(w => {
        if (selectedEntity !== 'ALL' && w.company !== selectedEntity) return false;
        if (isMOMMode) return true;
        return !w.isExcludedFromPayroll;
    });
    
    const drafts = activeWorkers.map(w => {
      const rawSalaryValue = Number(isMOMMode ? (w.momSalary ?? w.salary) : w.salary) || 0;
      
      const isMonthly = w.rateType === RateType.MONTHLY;
      const isDaily = w.rateType === RateType.DAILY;
      const isHourly = w.rateType === RateType.HOURLY;
      
      let effectiveHourlyRate = Number(getHourlyRate(w)) || 0;
      if (isMOMMode) {
          effectiveHourlyRate = rawSalaryValue / 26 / 8;
      }

      const otPolicy = isMonthly ? (w.otPolicy || 'STANDARD') : 'STANDARD';
      const sundayFlatRate = isMonthly ? (Number(w.sundayFlatRate) || 0) : 0;
      
      let calculatedOt15Hours = 0;
      let calculatedOt20Hours = 0;
      let sundayWorkDays = 0;
      let normalWorkDaysCount = 0;
      let totalStandardHours = 0;
      
      let totalMealAllowance = 0;
      let totalTransportClaim = 0;

      const workerLogs = attendanceLogs.filter(a => {
          const logDate = new Date(a.date);
          return logDate >= start && logDate <= end && a.employeeId === w.id;
      });

      workerLogs.forEach(log => {
          const multiplier = calculateOvertimeMultiplier(log.date);
          const rawOt = Number(log.overtimeHours) || 0;
          const rawNormal = Number(log.hoursWorked) || 0;
          
          if (log.hasMealAllowance) totalMealAllowance += 5;
          totalTransportClaim += (Number(log.transportClaim) || 0);

          if (multiplier === 1.5) {
              if (otPolicy === 'FIXED_INCL_7PM' || otPolicy === 'FIXED_7PM_SUN_FLAT') {
                  calculatedOt15Hours += Math.max(0, rawOt - 2);
              } else if (otPolicy === 'NONE') {
                  calculatedOt15Hours += 0;
              } else {
                  calculatedOt15Hours += rawOt;
              }
              totalStandardHours += rawNormal;
              if (rawNormal > 0 || rawOt > 0) normalWorkDaysCount++;
          } else {
              if (otPolicy === 'NONE') {
                  calculatedOt20Hours += 0;
              } else {
                  if (sundayFlatRate > 0 && (otPolicy === 'FIXED_7PM_SUN_FLAT' || otPolicy === 'STANDARD')) {
                      if (rawNormal > 0 || rawOt > 0) sundayWorkDays++;
                  } else {
                      calculatedOt20Hours += rawOt;
                  }
              }
          }
      });

      const workerLeavesInPeriod = allLeaves.filter(l => {
          const leaveDate = new Date(l.startDate);
          return leaveDate >= start && leaveDate <= end && l.employeeId === w.id;
      });

      const unpaidRecords = workerLeavesInPeriod
          .filter(l => [LeaveType.UNPAID_LEAVE, LeaveType.UNPAID_MC, LeaveType.OFF_DAY, LeaveType.HALF_DAY_OFF_DAY].includes(l.type))
          .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

      const paidAbsenceDays = workerLeavesInPeriod
          .filter(l => !!l.isPayable)
          .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

      let calculatedBasic = 0;
      if (isMOMMode || isMonthly) {
          calculatedBasic = rawSalaryValue;
      } else {
          if (isDaily) {
              calculatedBasic = totalStandardHours * (rawSalaryValue / 8);
          } else if (isHourly) {
              calculatedBasic = totalStandardHours * rawSalaryValue;
          }
          if (paidAbsenceDays > 0) {
              const dayRate = isDaily ? rawSalaryValue : (rawSalaryValue * 8);
              calculatedBasic += (paidAbsenceDays * dayRate);
          }
      }

      let unpaidDeduction = 0;
      if (isMonthly) {
          const dailyRateForDeduction = rawSalaryValue / 26;
          unpaidDeduction = Number(unpaidRecords) * Number(dailyRateForDeduction);
      }

      const ot15Pay = Number(calculatedOt15Hours) * Number(effectiveHourlyRate) * 1.5;
      let ot20Pay = 0;
      if (sundayFlatRate > 0) {
          ot20Pay = Number(sundayWorkDays) * Number(sundayFlatRate);
      } else {
          ot20Pay = Number(calculatedOt20Hours) * Number(effectiveHourlyRate) * 2.0;
      }

      let employeeCpf = 0;
      let employerCpf = 0;
      if (w.workerType === 'LOCAL') {
          const totalWagesForCpf = Number(calculatedBasic) + Number(ot15Pay) + Number(ot20Pay) - Number(unpaidDeduction) + totalMealAllowance + totalTransportClaim;
          // Fix: calculateCpfEstimates only accepts one argument
          const estimates = calculateCpfEstimates(Math.max(0, totalWagesForCpf));
          employeeCpf = estimates.employee;
          employerCpf = estimates.employer;
      } else {
          employeeCpf = Number(w.employeeCpf) || 0;
          employerCpf = Number(w.cpfAmount) || 0;
      }

      const netSalary = Number((
          Number(calculatedBasic) + 
          Number(ot15Pay) + 
          Number(ot20Pay) +
          totalMealAllowance + 
          totalTransportClaim - 
          Number(unpaidDeduction) - 
          Number(employeeCpf)
      ).toFixed(2));

      return {
        id: generateId(),
        workerId: w.id,
        workerName: w.name,
        workerType: w.workerType,
        designation: w.occupationTitle,
        basicSalary: Number(calculatedBasic.toFixed(2)),
        hourlyRate: Number(effectiveHourlyRate.toFixed(2)),
        daysWorkedCount: normalWorkDaysCount,
        ot15Hours: Number(calculatedOt15Hours.toFixed(2)),
        ot20Hours: Number(calculatedOt20Hours.toFixed(2)),
        ot15Pay: Number(ot15Pay.toFixed(2)),
        ot20Pay: Number(ot20Pay.toFixed(2)),
        otPolicy: otPolicy,
        sundayFlatRate: Number(sundayFlatRate),
        mealAllowance: totalMealAllowance,
        transportAllowance: totalTransportClaim,
        allowance: 0,
        allowanceRemarks: '',
        deduction: Number(unpaidDeduction.toFixed(2)), 
        deductionRemarks: unpaidRecords > 0 ? (isMonthly ? `Unpaid/Off (${unpaidRecords} days)` : `Log: ${unpaidRecords} days off (No pay)`) : '',
        employerCpf: Number(employerCpf.toFixed(2)),
        employeeCpf: Number(employeeCpf.toFixed(2)),
        netSalary: Math.max(0, netSalary),
        modeOfPayment: 'BANK TRANSFER' as const,
        remarks: isMOMMode ? 'Calculated on MOM Declared Monthly' : (isMonthly ? 'Fixed Monthly Payout' : (paidAbsenceDays > 0 ? `Inc. ${paidAbsenceDays}d Paid Absence` : '')),
        company: w.company
      } as any;
    });
    setPayslips(drafts);
  };

  useEffect(() => {
    calculatePayslips();
  }, [workers, basis, startDate, endDate, selectedEntity]);

  const resetManualOverrides = () => {
    if (confirm("Reset all manual adjustments and re-calculate based on attendance logs?")) {
        calculatePayslips();
    }
  };

  const updatePayslipHours = (id: string, field: 'ot15Hours' | 'ot20Hours', value: number) => {
    setPayslips(prev => prev.map(p => {
      if (p.id === id) {
        const val = Number(value) || 0;
        const updated = { ...p, [field]: val };
        updated.ot15Pay = Number((Number(updated.ot15Hours) * Number(updated.hourlyRate) * 1.5).toFixed(2));
        
        if (updated.sundayFlatRate && updated.sundayFlatRate > 0) {
            if (updated.ot20Pay === 0 && val > 0) updated.ot20Pay = Number(updated.sundayFlatRate);
            if (val === 0) updated.ot20Pay = 0;
        } else {
            updated.ot20Pay = Number((Number(updated.ot20Hours) * Number(updated.hourlyRate) * 2.0).toFixed(2));
        }

        if (updated.workerType === 'LOCAL') {
            const worker = workers.find(w => w.id === updated.workerId);
            const totalWages = Number(updated.basicSalary) + Number(updated.ot15Pay) + Number(updated.ot20Pay) + (updated.mealAllowance || 0) + (updated.transportAllowance || 0) - Number(updated.deduction);
            // Fix: calculateCpfEstimates only accepts one argument
            const estimates = calculateCpfEstimates(Math.max(0, totalWages));
            updated.employeeCpf = estimates.employee;
            updated.employerCpf = estimates.employer;
        }

        updated.netSalary = Number((
            Number(updated.basicSalary) + 
            Number(updated.ot15Pay) + 
            Number(updated.ot20Pay) + 
            (updated.mealAllowance || 0) +
            (updated.transportAllowance || 0) +
            (Number(updated.allowance) || 0) - 
            (Number(updated.deduction) || 0) - 
            (Number(updated.employeeCpf) || 0)
        ).toFixed(2));
        return updated;
      }
      return p;
    }));
  };

  const updatePayslipManual = (id: string, field: 'allowance' | 'deduction' | 'allowanceRemarks' | 'deductionRemarks', value: any) => {
    setPayslips(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'allowance' || field === 'deduction') {
            updated.netSalary = Number((
                Number(updated.basicSalary) + 
                Number(updated.ot15Pay) + 
                Number(updated.ot20Pay) + 
                (updated.mealAllowance || 0) +
                (updated.transportAllowance || 0) +
                (Number(updated.allowance) || 0) - 
                (Number(updated.deduction) || 0) - 
                (Number(updated.employeeCpf) || 0)
            ).toFixed(2));
        }
        return updated;
      }
      return p;
    }));
  };

  const groupedPayslips = useMemo(() => {
    const groups: Record<string, Payslip[]> = {};
    payslips.forEach(p => {
        const company = (p as any).company || 'Unknown Entity';
        if (!groups[company]) groups[company] = [];
        groups[company].push(p);
    });
    return groups;
  }, [payslips]);

  const totals = payslips.reduce((acc, p) => ({
     basic: acc.basic + Number(p.basicSalary),
     ot15: acc.ot15 + Number(p.ot15Pay),
     ot20: acc.ot20 + Number(p.ot20Pay),
     allow: acc.allow + Number(p.allowance) + (p.mealAllowance || 0) + (p.transportAllowance || 0),
     deduct: acc.deduct + Number(p.deduction),
     cpfEmplr: acc.cpfEmplr + Number(p.employerCpf),
     cpfEmpl: acc.cpfEmpl + Number(p.employeeCpf),
     net: acc.net + Number(p.netSalary)
  }), { basic: 0, ot15: 0, ot20: 0, allow: 0, deduct: 0, cpfEmplr: 0, cpfEmpl: 0, net: 0 });

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === '1920') {
      setShowPasswordPrompt(false);
      setPassInput('');
      setPassError('');
      executeFinalize();
    } else {
      setPassError('Invalid Master Password');
      setPassInput('');
    }
  };

  const handleFinalizeRequest = () => {
    setShowPasswordPrompt(true);
  };

  const executeFinalize = () => {
    const scopeMsg = selectedEntity === 'ALL' ? 'all registered entities' : `entity "${selectedEntity}"`;
    if (confirm(`Confirm processing payroll disbursement for period ${startDate} to ${endDate} for ${scopeMsg}?`)) {
        setIsFinalizing(true);
        const run: PayrollRun = {
            id: generateId(),
            period: startDate.substring(0, 7),
            startDate,
            endDate,
            paymentDate,
            status: 'FINALIZED',
            processedDate: Date.now(),
            totalBasic: Number(totals.basic.toFixed(2)),
            totalOt15: Number(totals.ot15.toFixed(2)),
            totalOt20: Number(totals.ot20.toFixed(2)),
            totalAllowances: Number(totals.allow.toFixed(2)),
            totalDeductions: Number(totals.deduct.toFixed(2)),
            totalEmployerCpf: Number(totals.cpfEmplr.toFixed(2)),
            totalEmployeeCpf: Number(totals.cpfEmpl.toFixed(2)),
            totalNet: Number(totals.net.toFixed(2)),
            payslips: payslips as any,
            paymentStatus: PayrollPaymentStatus.UNPAID,
            paidAmount: 0
        };
        onSave(run);
        setIsFinalizing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-20 text-left">
      {showPasswordPrompt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95">
                  <div className="p-5 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl"><Lock size={32}/></div>
                  <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Auth Required</h3>
                  <p className="text-center text-xs text-slate-400 font-bold uppercase mb-8">Enter Master Password to Edit Payroll</p>
                  <form onSubmit={handleVerifyPassword} className="w-full space-y-6">
                      <input type="password" autoFocus placeholder="••••" className="w-full text-center text-5xl font-black tracking-[0.5em] py-5 border-2 border-slate-50 bg-slate-50 rounded-3xl outline-none" value={passInput} onChange={e => setPassInput(e.target.value)}/>
                      {passError && <p className="text-[10px] text-rose-500 font-black uppercase text-center">{passError}</p>}
                      <div className="flex gap-3">
                          <button type="button" onClick={() => { setShowPasswordPrompt(false); setPassInput(''); setPassError(''); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Cancel</button>
                          <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Verify</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8">
         <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex-1 space-y-6">
               <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Run Payroll</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Configure work period and disbursement details.</p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Filter size={10}/> Billing Entity</label>
                     <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={16}/>
                        <select 
                            className="w-full pl-10 pr-4 py-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-xs font-black uppercase text-indigo-700 outline-none appearance-none cursor-pointer"
                            value={selectedEntity}
                            onChange={e => setSelectedEntity(e.target.value)}
                        >
                            <option value="ALL">All Registered Entities</option>
                            {crmData?.companies?.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period Start</label>
                     <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Period End</label>
                     <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                        <input type="date" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Disbursement Day</label>
                     <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={16}/>
                        <input type="date" className="w-full pl-10 pr-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-black text-indigo-700 focus:ring-4 focus:ring-indigo-500/5 outline-none" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                     </div>
                  </div>
               </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-right min-w-[280px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Calculator size={100} className="text-white" /></div>
                    <span className="block text-[10px] text-indigo-400 uppercase font-black mb-2 tracking-[0.2em]">Net Disbursement</span>
                    <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(totals.net)}</span>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-4 text-[9px] font-black uppercase text-indigo-300">
                        <span>BASIC: {formatCurrency(totals.basic)}</span>
                        <span>OT: {formatCurrency(totals.ot15 + totals.ot20)}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={calculatePayslips} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"><RefreshCw size={14}/> Re-Sync</button>
                    <button onClick={resetManualOverrides} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-rose-600 hover:border-rose-100 flex items-center justify-center gap-2 transition-all"><RotateCcw size={14}/> Reset Form</button>
                </div>
            </div>
         </div>
         
         <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
            <Info className="text-indigo-600" size={20}/>
            <div className="flex-1">
                <p className="text-xs font-bold text-slate-700">Calculation Methodology</p>
                <div className="flex gap-1 mt-1">
                    <button onClick={() => setBasis('actual')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${basis === 'actual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>ACTUAL PAYROLL</button>
                    <button onClick={() => setBasis('mom')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${basis === 'mom' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400'}`}>MOM DECLARED FIXED</button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  <strong>Site Policy:</strong> Late OT Meal ($5) applies for work past 9:00 PM. Transport Claims are reimbursed at face value. Unpaid Leave/Off Days use a pro-rata divisor of 26 <strong>(Monthly Staff Only)</strong>.
                </p>
            </div>
         </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm text-left">
         <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
               <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200 whitespace-nowrap uppercase text-[9px] tracking-[0.15em] sticky top-0 z-20">
                 <tr>
                   <th className="px-8 py-5 sticky left-0 bg-slate-50 z-20 border-r border-slate-100">Personnel / Designation</th>
                   <th className="px-8 py-5 text-right font-black text-slate-900 bg-indigo-50/50">Net Payout</th>
                   <th className="px-6 py-5 text-right bg-slate-100/50">Calculation Hourly</th>
                   <th className="px-6 py-5 text-right">Basic Wage</th>
                   <th className="px-4 py-5 text-center w-24 bg-emerald-50/20">OT 1.5x (Hrs)</th>
                   <th className="px-4 py-5 text-center w-24 bg-indigo-50/20">OT 2.0x / Flat</th>
                   <th className="px-6 py-5 text-right w-48">Other Allowances</th>
                   <th className="px-6 py-5 text-right w-48">Deductions & CPF</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {Object.entries(groupedPayslips).map(([company, slips]) => (
                   <React.Fragment key={company}>
                     <tr className="bg-slate-900 text-white sticky top-[54px] z-10 shadow-sm text-left">
                       <td colSpan={1} className="px-8 py-3">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-indigo-400 border border-white/10">
                                  <Building2 size={16}/>
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-[0.3em]">{company}</span>
                          </div>
                       </td>
                       <td className="px-8 py-3 text-right bg-indigo-900/40">
                          <div className="text-[11px] font-black tabular-nums tracking-tighter text-indigo-400">
                             {formatCurrency((slips as any[]).reduce((sum, s) => sum + s.netSalary, 0))}
                          </div>
                       </td>
                       <td colSpan={6} className="px-8 py-3 text-left">
                            <span className="text-[9px] font-bold text-slate-400">{(slips as any[]).length} Records In-Group</span>
                       </td>
                     </tr>

                     {(slips as any[]).map((p: any) => {
                        const isLocal = p.workerType === 'LOCAL';

                        return (
                       <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="px-8 py-6 sticky left-0 bg-white z-10 font-bold border-r border-slate-100 text-left">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner ${isLocal ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {p.workerName.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 leading-tight uppercase text-xs">{p.workerName}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.designation}</div>
                                </div>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-right font-black text-indigo-700 bg-indigo-50/20 text-xl tabular-nums tracking-tighter border-r border-indigo-100/30">
                            {formatCurrency(p.netSalary)}
                         </td>
                         <td className="px-6 py-6 text-right bg-slate-50/30 font-mono text-[10px] text-slate-500">
                            {formatCurrency(p.hourlyRate)}/h
                         </td>
                         <td className="px-6 py-6 text-right">
                            <div className="font-black text-slate-900">{formatCurrency(p.basicSalary)}</div>
                         </td>
                         <td className="px-2 py-4 bg-emerald-50/10">
                            <input type="number" className="w-full text-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm font-black outline-none" value={p.ot15Hours} onChange={e => updatePayslipHours(p.id, 'ot15Hours', parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
                            <div className="text-[8px] text-center text-emerald-600 mt-2 font-black uppercase tracking-tighter">Pay: {formatCurrency(p.ot15Pay)}</div>
                         </td>
                         <td className="px-2 py-4 bg-indigo-50/10">
                            <input type="number" className="w-full text-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm font-black outline-none" value={p.ot20Hours} onChange={e => updatePayslipHours(p.id, 'ot20Hours', parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
                            <div className="text-[8px] text-center text-indigo-600 mt-2 font-black uppercase tracking-tighter">Pay: {formatCurrency(p.ot20Pay)}</div>
                         </td>
                         <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                                <input type="number" className="w-full text-right bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none" value={p.allowance} onChange={e => updatePayslipManual(p.id, 'allowance', parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {p.mealAllowance > 0 && <span className="bg-amber-50 text-amber-700 text-[8px] px-1.5 py-0.5 rounded font-black border border-amber-100">MEAL: {formatCurrency(p.mealAllowance)}</span>}
                                    {p.transportAllowance > 0 && <span className="bg-blue-50 text-blue-700 text-[8px] px-1.5 py-0.5 rounded font-black border border-blue-100">TRAV: {formatCurrency(p.transportAllowance)}</span>}
                                </div>
                            </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                            <input type="number" className="w-full text-right bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-rose-600 outline-none" value={p.deduction} onChange={e => updatePayslipManual(p.id, 'deduction', parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} />
                            {p.employeeCpf > 0 && <div className="text-[8px] text-rose-500 font-black uppercase tracking-tighter mt-1">CPF: {formatCurrency(p.employeeCpf)}</div>}
                         </td>
                       </tr>
                     )})}
                   </React.Fragment>
                 ))}
                 {payslips.length === 0 && <tr><td colSpan={8} className="py-20 text-center opacity-30 text-xs font-black uppercase tracking-widest">No staff records found for this entity selection</td></tr>}
               </tbody>
            </table>
         </div>
      </div>

      <div className="fixed bottom-10 right-10 z-20 group">
         <Button size="lg" className="shadow-2xl bg-indigo-600 hover:bg-indigo-700 px-12 py-5 rounded-[2rem] border-4 border-indigo-400/20 font-black uppercase tracking-widest text-sm" onClick={handleFinalizeRequest} icon={isFinalizing ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle size={24}/>}>FINALIZE & PROCESS PAYROLL</Button>
      </div>
    </div>
  );
};

export default PayrollProcessor;
