
import React, { useState, useMemo } from 'react';
import { Worker, OutstandingPayment, Expense, AttendanceRecord, CompanySettings, Transaction, PayrollRun, Invoice } from '../../types';
import { formatCurrency, formatDateSG } from '../../utils';
import { Button } from '../Button';
import { Users, AlertCircle, CreditCard, TrendingUp, TrendingDown, DollarSign, Wallet, Bell, Calendar, Printer, FileText, Loader2 } from 'lucide-react';

interface PayrollDashboardProps {
  employees: Worker[];
  payments: OutstandingPayment[];
  expenses: Expense[];
  attendance: AttendanceRecord[];
  settings: CompanySettings;
  transactions: Transaction[];
  payrollRuns: PayrollRun[];
  invoices: Invoice[];
}

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ 
    employees, payments, expenses, attendance, settings, transactions, payrollRuns, invoices 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const calculations = useMemo(() => {
    const totalRevenue = transactions
        .filter(t => t.type === 'INCOMING')
        .reduce((sum, t) => sum + t.totalAmount, 0);

    const unpaidPayments = payments.filter(p => !p.isPaid);
    const totalPayables = unpaidPayments.reduce((sum, p) => sum + p.amount, 0);

    const ledgerExpenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.totalAmount, 0);
    
    const pettyCashExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const payrollLiability = payrollRuns.reduce((sum, r) => sum + r.totalNet, 0);
    const totalExpenses = ledgerExpenses + pettyCashExpenses + payrollLiability;

    const netProfit = totalRevenue - totalExpenses;
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const billsDueSoon = invoices.filter(i => 
        i.type === 'AP' && 
        i.status !== 'PAID' && 
        new Date(i.dueDate) <= next7Days && 
        new Date(i.dueDate) >= today
    );

    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const diffToMonthEnd = Math.ceil((lastDayOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isCpfLevyWarning = diffToMonthEnd <= 5 && diffToMonthEnd >= 0;

    return {
        totalRevenue,
        totalPayables,
        totalExpenses,
        netProfit,
        unpaidCount: unpaidPayments.length,
        billsDueSoon,
        isCpfLevyWarning,
        daysToMonthEnd: diffToMonthEnd,
        ledgerExpenses,
        payrollLiability,
        pettyCashExpenses
    };
  }, [transactions, payments, expenses, payrollRuns, invoices]);

  const handlePrintFinancialReport = () => {
    setIsGenerating(true);
    const today = new Date();
    const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
    
    const reportHtml = `
      <div style="font-family: 'Inter', sans-serif; padding: 20mm; color: #0f172a; max-width: 210mm; margin: 0 auto; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #0f172a; padding-bottom: 10px; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">${settings.name}</h1>
            <p style="margin: 5px 0; font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase;">Financial Performance Report</p>
          </div>
          <div style="text-align: right;">
            <div style="background: #0f172a; color: white; padding: 5px 15px; border-radius: 5px; font-size: 12px; font-weight: 800;">${monthName}</div>
            <p style="margin: 5px 0 0 0; font-size: 9px; font-weight: 700; color: #94a3b8;">GENERATED: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #64748b; margin-bottom: 20px; border-left: 4px solid #10b981; padding-left: 10px;">Executive Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Total Revenue</span>
              <div style="font-size: 20px; font-weight: 900; color: #10b981; margin-top: 5px;">${formatCurrency(calculations.totalRevenue)}</div>
            </div>
            <div style="background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase;">Total Expenses</span>
              <div style="font-size: 20px; font-weight: 900; color: #ef4444; margin-top: 5px;">${formatCurrency(calculations.totalExpenses)}</div>
            </div>
            <div style="background: #0f172a; padding: 20px; border-radius: 15px; color: white;">
              <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase;">Net Outcome (P&L)</span>
              <div style="font-size: 20px; font-weight: 900; color: ${calculations.netProfit >= 0 ? '#10b981' : '#f43f5e'}; margin-top: 5px;">
                ${calculations.netProfit >= 0 ? '+' : ''}${formatCurrency(calculations.netProfit)}
              </div>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">Revenue Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              ${transactions.filter(t => t.type === 'INCOMING').slice(0, 10).map(t => `
                <tr style="border-bottom: 1px solid #f8fafc;">
                  <td style="padding: 10px 0; color: #64748b;">${t.date}</td>
                  <td style="padding: 10px 0; font-weight: 600;">${t.description.substring(0, 30)}...</td>
                  <td style="padding: 10px 0; text-align: right; font-weight: 800; color: #10b981;">${formatCurrency(t.totalAmount)}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #0f172a;">
                <td colspan="2" style="padding: 15px 0; font-weight: 900; text-transform: uppercase;">Total Inflow</td>
                <td style="padding: 15px 0; text-align: right; font-weight: 900;">${formatCurrency(calculations.totalRevenue)}</td>
              </tr>
            </table>
          </div>
          <div>
            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">Expense Breakdown</h3>
            <div style="space-y: 10px;">
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                <span style="color: #64748b;">Ledger Operating Expenses</span>
                <span style="font-weight: 700;">${formatCurrency(calculations.ledgerExpenses)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                <span style="color: #64748b;">Payroll & Wage Liability</span>
                <span style="font-weight: 700;">${formatCurrency(calculations.payrollLiability)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f8fafc; font-size: 11px;">
                <span style="color: #64748b;">Petty Cash & Miscellaneous</span>
                <span style="font-weight: 700;">${formatCurrency(calculations.pettyCashExpenses)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #0f172a; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                <span>Total Outflow</span>
                <span>${formatCurrency(calculations.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 15px; font-size: 10px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 5px;">Compliance Note</p>
          This document is an internal financial summary generated by the Crafted Habitat ERP system. 
          All figures are calculated based on the recorded transactions, payroll cycles, and petty cash logs 
          within the database as of the generation time. Please reconcile with bank statements for final audit purposes.
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Financial_Report_${monthName.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if ((window as any).html2pdf) {
      const container = document.createElement('div');
      container.innerHTML = reportHtml;
      (window as any).html2pdf().set(opt).from(container).save().finally(() => setIsGenerating(false));
    } else {
      const win = window.open('', '_blank');
      win?.document.write(`<html><head><title>Monthly Financial Report</title></head><body>${reportHtml}</body></html>`);
      win?.document.close();
      win?.print();
      setIsGenerating(false);
    }
  };

  const Card = ({ title, value, sub, icon, color }: any) => {
    const colors: any = {
        blue: "bg-blue-50 text-blue-600",
        red: "bg-red-50 text-red-600",
        green: "bg-green-50 text-green-600",
        indigo: "bg-indigo-50 text-indigo-600",
        emerald: "bg-emerald-50 text-emerald-600"
    };
    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 flex items-start justify-between transition-all hover:shadow-xl hover:-translate-y-1">
            <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-3 font-bold flex items-center gap-1.5">{sub}</p>}
            </div>
            <div className={`p-4 rounded-2xl shadow-sm ${colors[color]}`}>
            {icon}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
          <div className="relative z-10">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Financial Health</h2>
              <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Real-time fiscal monitoring & reporting</p>
          </div>
          <button 
            onClick={handlePrintFinancialReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18}/>}
            {isGenerating ? 'GENERATING...' : 'PRINT FINANCIAL REPORT'}
          </button>
      </div>

      {(calculations.billsDueSoon.length > 0 || calculations.isCpfLevyWarning) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {calculations.isCpfLevyWarning && settings.remindLevyCpf !== false && (
                <div className="bg-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-600/20 flex items-center gap-6 animate-pulse">
                    <div className="p-4 bg-white/10 rounded-2xl"><Bell size={32}/></div>
                    <div>
                        <h4 className="font-black uppercase tracking-widest text-xs">Statutory Reminder</h4>
                        <p className="text-lg font-bold">CPF & Levy Payment Due Soon</p>
                        <p className="text-xs opacity-80 mt-1">Today is {calculations.daysToMonthEnd} days before month end.</p>
                    </div>
                </div>
            )}
            {calculations.billsDueSoon.length > 0 && settings.remindOutstandingBills !== false && (
                <div className="bg-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-rose-600/20 flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl"><Calendar size={32}/></div>
                    <div>
                        <h4 className="font-black uppercase tracking-widest text-xs">Accounts Payable Alert</h4>
                        <p className="text-lg font-bold">{calculations.billsDueSoon.length} Bills Due Within 7 Days</p>
                        <p className="text-xs opacity-80 mt-1">Total outstanding: {formatCurrency(calculations.billsDueSoon.reduce((s,i)=>s+i.totalAmount, 0))}</p>
                    </div>
                </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
            title="Accounts Payable" 
            value={formatCurrency(calculations.totalPayables, settings.currency)} 
            sub={<><AlertCircle size={14}/> {calculations.unpaidCount} Pending Bills</>} 
            icon={<Wallet size={24}/>} 
            color="red" 
        />
        <Card 
            title="Total Expenses" 
            value={formatCurrency(calculations.totalExpenses, settings.currency)} 
            sub={<><CreditCard size={14}/> Integrated burn rate</>} 
            icon={<TrendingDown size={24}/>} 
            color="indigo" 
        />
        <Card 
            title="Staff Headcount" 
            value={employees.length} 
            sub={<><Users size={14}/> Active Workforce</>} 
            icon={<Users size={24}/>} 
            color="blue" 
        />
        <Card 
            title="Profit & Loss" 
            value={formatCurrency(calculations.netProfit, settings.currency)} 
            sub={calculations.netProfit >= 0 ? <><TrendingUp size={14} className="text-emerald-500"/> Healthy Margin</> : <><AlertCircle size={14} className="text-rose-500"/> Action Required</>} 
            icon={<DollarSign size={24}/>} 
            color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Profit & Loss Statement</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">Cumulative Fiscal Summary</p>
                  </div>
                  <div className={`p-4 rounded-3xl ${calculations.netProfit >= 0 ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'} text-white shadow-xl`}>
                      {calculations.netProfit >= 0 ? <TrendingUp size={28}/> : <TrendingDown size={28}/>}
                  </div>
              </div>
              <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-100">
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Revenue (In)</span>
                      <span className="text-lg font-black text-emerald-600">+{formatCurrency(calculations.totalRevenue)}</span>
                  </div>
                  <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expense Breakdown</p>
                      <div className="flex justify-between items-center text-sm font-medium pl-2 border-l-2 border-slate-100">
                          <span className="text-slate-500 italic">Ledger Expenses</span>
                          <span className="text-slate-800">-{formatCurrency(transactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s+t.totalAmount, 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium pl-2 border-l-2 border-slate-100">
                          <span className="text-slate-500 italic">Payroll Disbursements</span>
                          <span className="text-slate-800">-{formatCurrency(payrollRuns.reduce((s,r) => s+r.totalNet, 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-medium pl-2 border-l-2 border-slate-100">
                          <span className="text-slate-500 italic">Petty Cash / Other</span>
                          <span className="text-slate-800">-{formatCurrency(expenses.reduce((s,e) => s+e.amount, 0))}</span>
                      </div>
                  </div>
                  <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-end">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bottom Line</span>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Net Outcome</span>
                      </div>
                      <span className={`text-4xl font-black tabular-nums tracking-tighter ${calculations.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {calculations.netProfit >= 0 ? '+' : ''}${formatCurrency(calculations.netProfit)}
                      </span>
                  </div>
              </div>
          </div>
          
          <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center space-y-4 border border-slate-800 shadow-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600">
                  <DollarSign size={32}/>
              </div>
              <h4 className="text-white font-black uppercase tracking-widest text-sm">Manual Fiscal Review</h4>
              <p className="text-slate-500 text-xs max-w-xs font-medium">Use the detailed profit and loss statement to manually assess business performance and cash flow targets.</p>
              <Button 
                onClick={handlePrintFinancialReport} 
                variant="outline" 
                className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
                icon={<Printer size={16}/>}
              >
                Print Statement
              </Button>
          </div>
      </div>
    </div>
  );
};
