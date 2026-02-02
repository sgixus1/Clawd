
import React, { useState, useMemo } from 'react';
import { Worker, AttendanceRecord, PayrollSummary, CompanySettings } from '../../types';
import { calculatePayrollForMonth, formatCurrency } from '../../utils';

interface PayrollRunViewProps {
  employees: Worker[];
  attendance: AttendanceRecord[];
  settings: CompanySettings;
}

export const PayrollRunView: React.FC<PayrollRunViewProps> = ({ employees, attendance, settings }) => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const summary = useMemo(() => calculatePayrollForMonth(employees, attendance, month, year), [employees, attendance, month, year]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4">
           <h3 className="font-bold text-slate-700">Period:</h3>
           <select className="bg-slate-100 border-none rounded px-3 py-1 text-sm font-medium text-slate-800" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
             {Array.from({length: 12}, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
           </select>
           <select className="bg-slate-100 border-none rounded px-3 py-1 text-sm font-medium text-slate-800" value={year} onChange={(e) => setYear(Number(e.target.value))}>
             {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
        <div className="text-right">
             <p className="text-xs text-slate-400 uppercase font-bold">Total Payout</p>
             <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.reduce((a:number, b:PayrollSummary) => a + b.totalPay, 0), settings.currency)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rate Used</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Normal (Hrs)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">OT (Hrs)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Normal Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">OT Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
                {summary.map((s: PayrollSummary) => {
                const totalOTHours = s.ot15Hours + s.ot20Hours;
                const totalOTPay = s.ot15Pay + s.ot20Pay;
                return (
                    <tr key={s.employeeId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{s.employeeName}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{formatCurrency(s.hourlyRateUsed, settings.currency)}/hr</td>
                    <td className="px-6 py-4 text-slate-600">{s.totalNormalHours}</td>
                    <td className="px-6 py-4 text-slate-600">{totalOTHours > 0 ? <span className="text-red-600 font-bold">{totalOTHours}</span> : '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(s.normalPay, settings.currency)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatCurrency(totalOTPay, settings.currency)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 bg-slate-50/50">{formatCurrency(s.totalPay, settings.currency)}</td>
                    </tr>
                );
                })}
            </tbody>
        </table>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
          <p className="font-bold uppercase mb-2">Singapore MOM Regulations applied:</p>
          <p>• <strong>Overtime (Normal):</strong> 1.5x Hourly Rate for work done in excess of normal hours.</p>
          <p>• <strong>Overtime (Rest Day):</strong> 2.0x Hourly Rate for work done on Sundays.</p>
          <p>• <strong>Monthly Rated:</strong> Hourly rate derived as (12 * Monthly Salary) / (52 * 44).</p>
          <p>• <strong>Daily Rated:</strong> Hourly rate derived as Daily Rate / 8 hours.</p>
      </div>
    </div>
  );
};
