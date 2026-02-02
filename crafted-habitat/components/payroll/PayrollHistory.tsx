
import React, { useState, useMemo } from 'react';
import { PayrollRun, Payslip, CompanySettings, PayrollPaymentStatus } from '../../types';
import { Button } from '../Button';
import { 
  Calendar, Download, Eye, Trash2, DollarSign, Users, Printer, X, 
  History, Ticket, Loader2, ChevronRight, ChevronDown, CheckCircle2, 
  Clock, AlertCircle, Layers, Folder, ListOrdered, Search, Landmark, Lock
} from 'lucide-react';
import { formatDateSG, formatCurrency, updatePayrollRun } from '../../utils';

interface PayrollHistoryProps {
  runs: PayrollRun[];
  onDelete: (id: string) => void;
  onUpdate: () => void;
  onVoucher?: (runId: string, payslipId: string) => void;
  settings: CompanySettings;
}

export const PayrollHistory: React.FC<PayrollHistoryProps> = ({ runs, onDelete, onUpdate, onVoucher, settings }) => {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isGeneratingPdfId, setIsGeneratingPdfId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Grouping Logic for Sidebar Tree
  const historyTree = useMemo(() => {
    const tree: Record<string, Record<string, PayrollRun[]>> = {};
    const sorted = [...runs].sort((a, b) => b.period.localeCompare(a.period));

    sorted.forEach(run => {
      const [year, monthNum] = run.period.split('-');
      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
      
      if (!tree[year]) tree[year] = {};
      if (!tree[year][monthName]) tree[year][monthName] = [];
      tree[year][monthName].push(run);
    });

    return tree;
  }, [runs]);

  const toggleNode = (node: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  const selectedRun = useMemo(() => 
    runs.find(r => r.id === selectedRunId), 
  [runs, selectedRunId]);

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passInput === '1920') {
      setShowPasswordPrompt(false);
      setPassInput('');
      setPassError('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setPassError('Invalid Master Password');
      setPassInput('');
    }
  };

  const requestAction = (action: () => void) => {
    setPendingAction(() => action);
    setShowPasswordPrompt(true);
  };

  const handleUpdateStatus = (run: PayrollRun, status: PayrollPaymentStatus) => {
      requestAction(() => {
          const updatedRun = { ...run, paymentStatus: status };
          if (status === PayrollPaymentStatus.PAID) {
              updatedRun.paidAmount = run.totalNet;
          } else if (status === PayrollPaymentStatus.UNPAID) {
              updatedRun.paidAmount = 0;
          }
          updatePayrollRun(updatedRun);
          onUpdate();
      });
  };

  const handleUpdatePaidAmount = (run: PayrollRun, amount: number) => {
      requestAction(() => {
          const updatedRun = { ...run, paidAmount: amount };
          if (amount >= run.totalNet) {
              updatedRun.paymentStatus = PayrollPaymentStatus.PAID;
          } else if (amount > 0) {
              updatedRun.paymentStatus = PayrollPaymentStatus.PARTIAL;
          } else {
              updatedRun.paymentStatus = PayrollPaymentStatus.UNPAID;
          }
          updatePayrollRun(updatedRun);
          onUpdate();
      });
  };

  const StatusBadge = ({ status }: { status?: PayrollPaymentStatus }) => {
      switch (status) {
          case PayrollPaymentStatus.PAID:
              return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-left"><CheckCircle2 size={10}/> PAID</span>;
          case PayrollPaymentStatus.PARTIAL:
              return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-left"><Clock size={10}/> PARTIAL</span>;
          default:
              return <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 text-left"><AlertCircle size={10}/> UNPAID</span>;
      }
  };

  const getPayslipHTML = (payslip: Payslip, run: PayrollRun, isBatch: boolean = false) => {
    const logoHtml = settings.logoUrl 
        ? `<img src="${settings.logoUrl}" style="width: 70px; height: 70px; object-fit: contain;" alt="Logo"/>` 
        : '<div style="width:70px;height:70px;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;font-weight:900;border-radius:8px;font-size:20px;">CH</div>';

    const [year, month] = run.period.split('-');
    const salaryMonthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-SG', { month: 'long', year: 'numeric' }).toUpperCase();

    return `
    <div class="payslip-container" style="font-family: 'Inter', sans-serif; color: #0f172a; width: 210mm; height: 280mm; margin: 0 auto; background: #fff; box-sizing: border-box; padding: 8mm 15mm; display: flex; flex-direction: column; overflow: hidden; position: relative; ${isBatch ? 'page-break-after: always;' : ''}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
      </style>
      <div class="letterhead" style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div class="company-info" style="display: flex; align-items: center; gap: 12px;">
          ${logoHtml}
          <div class="company-brand">
              <h1 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em;">${settings.name}</h1>
              <p style="margin: 2px 0; font-size: 9px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">Reg No: ${settings.uen || 'N/A'}</p>
          </div>
        </div>
        <div class="doc-type" style="text-align: right;">
          <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.08em;">PAYSLIP</h2>
          <div class="period-tag" style="background: #0f172a; color: white; padding: 4px 10px; border-radius: 5px; font-size: 9px; font-weight: 800; margin-top: 4px; display: inline-block;">${salaryMonthName}</div>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 8px 15px; border-radius: 8px; border-left: 4px solid #0f172a; margin-bottom: 12px; flex-shrink: 0; text-align: left;">
         <span style="font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Salary Entitlement For:</span>
         <h3 style="margin: 1px 0 0 0; font-size: 14px; font-weight: 900; color: #0f172a;">${salaryMonthName}</h3>
      </div>
      <div class="employee-info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #fff; flex-shrink: 0; text-align: left;">
         <div style="display: flex; flex-direction: column; gap: 8px;">
            <div><span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1px;">Full Name</span> <span style="display: block; font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase;">${payslip.workerName}</span></div>
            <div><span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1px;">Designation</span> <span style="display: block; font-size: 10px; font-weight: 700; color: #475569;">${payslip.designation}</span></div>
         </div>
         <div style="display: flex; flex-direction: column; gap: 8px;">
            <div><span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1px;">Work Period</span> <span style="display: block; font-size: 10px; font-weight: 700; color: #475569;">${formatDateSG(run.startDate)} to ${formatDateSG(run.endDate)}</span></div>
            <div><span style="display: block; font-size: 7px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1px;">Payment Mode</span> <span style="display: block; font-size: 10px; font-weight: 700; color: #475569;">${payslip.modeOfPayment}</span></div>
         </div>
      </div>
      <div class="content-body" style="flex-grow: 1; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
               <thead>
                 <tr>
                   <th style="width: 50%; text-align: left; font-size: 7px; text-transform: uppercase; color: #94a3b8; padding: 6px 12px; border-bottom: 1.5px solid #f1f5f9;">Description</th>
                   <th style="width: 25%; text-align: left; font-size: 7px; text-transform: uppercase; color: #94a3b8; padding: 6px 12px; border-bottom: 1.5px solid #f1f5f9;">Units / Rate</th>
                   <th style="width: 25%; text-align: right; font-size: 7px; text-transform: uppercase; color: #94a3b8; padding: 6px 12px; border-bottom: 1.5px solid #f1f5f9;">Total (SGD)</th>
                 </tr>
               </thead>
               <tbody>
                 <tr style="border-bottom: 1px solid #f8fafc; text-align: left;">
                    <td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Basic Wage Payout</td>
                    <td style="padding: 8px 12px; font-size: 9px; color: #475569;">Calculated</td>
                    <td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.basicSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                 </tr>
                 ${payslip.ot15Hours > 0 ? `<tr style="border-bottom: 1px solid #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Overtime (1.5x)</td><td style="padding: 8px 12px; font-size: 9px; color: #475569;">${payslip.ot15Hours}h</td><td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.ot15Pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
                 ${payslip.ot20Hours > 0 ? `<tr style="border-bottom: 1px solid #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Overtime (2.0x)</td><td style="padding: 8px 12px; font-size: 9px; color: #475569;">${payslip.ot20Hours}h</td><td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.ot20Pay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
                 ${payslip.mealAllowance > 0 ? `<tr style="border-bottom: 1px solid #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Late OT Meal Allowance</td><td style="padding: 8px 12px; font-size: 9px; color: #475569;">${payslip.mealAllowance / 5} Days</td><td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.mealAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
                 ${payslip.transportAllowance > 0 ? `<tr style="border-bottom: 1px solid #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Transport Claims</td><td style="padding: 8px 12px; font-size: 9px; color: #475569;">Reimbursement</td><td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.transportAllowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
                 ${payslip.allowance > 0 ? `<tr style="border-bottom: 1px solid #f8fafc; text-align: left;"><td style="padding: 8px 12px; font-size: 9px; color: #1e293b; font-weight: 600;">Other Allowances</td><td style="padding: 8px 12px; font-size: 9px; color: #475569;">${payslip.allowanceRemarks || 'Verified'}</td><td style="padding: 8px 12px; font-size: 10px; text-align: right; font-weight: 800;">$${payslip.allowance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>` : ''}
               </tbody>
          </table>
      </div>
      <div class="bottom-sections" style="flex-shrink: 0; margin-top: auto; text-align: left;">
          <div style="background: #f8fafc; border: 2px solid #0f172a; border-radius: 10px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
             <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #0f172a;">Net Payable Salary</span>
             <span style="font-size: 24px; font-weight: 900; color: #0f172a;">$${payslip.netSalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #f1f5f9; font-size: 6.5px; color: #cbd5e1; font-weight: 700; text-transform: uppercase;">
            <span>Verified Document ID: ${payslip.id.substring(0,8).toUpperCase()}</span>
          </div>
      </div>
    </div>`;
  };

  const handlePrintPayslip = (payslip: Payslip, run: PayrollRun) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>Payslip</title></head><body>${getPayslipHTML(payslip, run)}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
  };

  const handleSavePdfPayslip = (payslip: Payslip, run: PayrollRun) => {
    setIsGeneratingPdfId(payslip.id);
    const container = document.createElement('div');
    container.innerHTML = getPayslipHTML(payslip, run);
    const opt = { margin: 0, filename: `Payslip_${payslip.workerName}_${run.period}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    if ((window as any).html2pdf) {
        (window as any).html2pdf().set(opt).from(container).save().finally(() => setIsGeneratingPdfId(null));
    }
  };

  const handleBatchDownloadPdf = (run: PayrollRun) => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    const container = document.createElement('div');
    let combinedHTML = '';
    run.payslips.forEach((payslip) => { combinedHTML += getPayslipHTML(payslip, run, true); });
    container.innerHTML = combinedHTML;
    const opt = { margin: 0, filename: `Cycle_${run.period}_Batch.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'], after: '.payslip-container' } };
    if ((window as any).html2pdf) {
        (window as any).html2pdf().set(opt).from(container).save().finally(() => setIsBatchProcessing(false));
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden gap-6 animate-fade-in text-left">
      {showPasswordPrompt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center animate-in zoom-in-95">
                  <div className="p-5 bg-indigo-600 text-white rounded-3xl mb-6 shadow-xl"><Lock size={32}/></div>
                  <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Auth Required</h3>
                  <p className="text-center text-xs text-slate-400 font-bold uppercase mb-8">Enter Master Password to Alter History</p>
                  <form onSubmit={handleVerifyPassword} className="w-full space-y-6">
                      <input type="password" autoFocus placeholder="••••" className="w-full text-center text-5xl font-black tracking-[0.5em] py-5 border-2 border-slate-50 bg-slate-50 rounded-3xl outline-none" value={passInput} onChange={e => setPassInput(e.target.value)}/>
                      {passError && <p className="text-[10px] text-rose-500 font-black uppercase text-center">{passError}</p>}
                      <div className="flex gap-3">
                          <button type="button" onClick={() => { setShowPasswordPrompt(false); setPassInput(''); setPassError(''); setPendingAction(null); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Cancel</button>
                          <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Verify</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-80 shrink-0 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"><History size={18}/></div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight text-left">Cycle Explorer</h3>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
            {Object.keys(historyTree).sort((a,b) => b.localeCompare(a)).map(year => (
                <div key={year} className="mb-1">
                    <button 
                        onClick={() => toggleNode(year)} 
                        className="w-full flex items-center gap-2 p-2.5 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-black uppercase transition-all text-left"
                    >
                        {expandedNodes.has(year) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        <Folder size={14} className="text-amber-400"/>
                        {year}
                    </button>
                    {expandedNodes.has(year) && (
                        <div className="ml-4 border-l border-slate-100 pl-2 space-y-1 mt-1">
                            {Object.keys(historyTree[year]).map(month => (
                                <div key={month} className="space-y-1">
                                    <p className="px-2 py-1 text-[10px] font-black text-slate-300 uppercase tracking-widest text-left">{month}</p>
                                    {historyTree[year][month].map(run => (
                                        <button 
                                            key={run.id}
                                            onClick={() => setSelectedRunId(run.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col gap-1 border ${
                                                selectedRunId === run.id 
                                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' 
                                                : 'text-slate-500 bg-white hover:bg-slate-50 border-slate-100'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center w-full">
                                                <span>RUN #{run.id.substring(0, 5).toUpperCase()}</span>
                                                {selectedRunId === run.id ? <ChevronRight size={10}/> : null}
                                            </div>
                                            <div className={`text-[8px] opacity-70 ${selectedRunId === run.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                {run.payslips.length} STAFF • {formatCurrency(run.totalNet)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {runs.length === 0 && (
                <div className="py-20 text-center opacity-30">
                    <History size={40} className="mx-auto mb-4"/>
                    <p className="text-[10px] font-black uppercase">No archive found</p>
                </div>
            )}
        </div>

        <div className="p-6 bg-slate-900 text-white text-left">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Fiscal Liability</p>
            <p className="text-2xl font-black tabular-nums">{formatCurrency(runs.reduce((s,r) => s+r.totalNet, 0))}</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedRun ? (
          <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-fade-in text-left">
             <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shrink-0">
                <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100"><Calendar size={24}/></div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Cycle Report: {selectedRun.period}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase">RUN ID: {selectedRun.id.substring(0,8).toUpperCase()}</span>
                            <StatusBadge status={selectedRun.paymentStatus} />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-xl"
                        onClick={() => handleBatchDownloadPdf(selectedRun)}
                        disabled={isBatchProcessing}
                        icon={isBatchProcessing ? <Loader2 size={16} className="animate-spin"/> : <Layers size={16}/>}
                    >
                        {isBatchProcessing ? 'Compiling...' : 'Batch PDF Report'}
                    </Button>
                    <button 
                        onClick={() => requestAction(() => { if(confirm("Permanently purge this cycle?")) { onDelete(selectedRun.id); setSelectedRunId(null); } })}
                        className="p-3 text-slate-300 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                        <Trash2 size={20}/>
                    </button>
                </div>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm shrink-0 text-left">
                 <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Liability</span>
                    <span className="text-xl font-black text-slate-900">{formatCurrency(selectedRun.totalNet)}</span>
                 </div>
                 <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Statutory CPF</span>
                    <span className="text-xl font-black text-indigo-600">{formatCurrency(selectedRun.totalEmployeeCpf + selectedRun.totalEmployerCpf)}</span>
                 </div>
                 <div className="md:col-span-2 flex justify-between items-center border-l border-slate-100 pl-6 text-left">
                    <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Office Status</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(['UNPAID', 'PARTIAL', 'PAID'] as PayrollPaymentStatus[]).map(s => (
                                <button key={s} onClick={() => handleUpdateStatus(selectedRun, s)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${selectedRun.paymentStatus === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    {selectedRun.paymentStatus === 'PARTIAL' && (
                        <div className="text-right">
                            <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Partial Payout</span>
                            <input type="number" className="w-24 text-right bg-slate-50 border-b-2 border-indigo-500 font-black text-sm outline-none" value={selectedRun.paidAmount} onChange={e => handleUpdatePaidAmount(selectedRun, parseFloat(e.target.value) || 0)}/>
                        </div>
                    )}
                 </div>
             </div>

             <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col text-left">
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-slate-50/80 backdrop-blur sticky top-0 z-10 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Detail</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Basic</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">OT+Allow</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Disbursement</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Tools</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {selectedRun.payslips.map(slip => (
                                <tr key={slip.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="font-black text-slate-900 leading-tight uppercase">{slip.workerName}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{slip.designation}</p>
                                    </td>
                                    <td className="px-6 py-6 text-right font-bold text-slate-500 tabular-nums">{formatCurrency(slip.basicSalary)}</td>
                                    <td className="px-6 py-6 text-right font-bold text-emerald-600 tabular-nums">+{formatCurrency(slip.ot15Pay + slip.ot20Pay + (slip.mealAllowance || 0) + (slip.transportAllowance || 0) + (slip.allowance || 0))}</td>
                                    <td className="px-6 py-6 text-right font-black text-indigo-700 text-lg tabular-nums">{formatCurrency(slip.netSalary)}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleSavePdfPayslip(slip, selectedRun)} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-indigo-100">{isGeneratingPdfId === slip.id ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}</button>
                                            <button onClick={() => handlePrintPayslip(slip, selectedRun)} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Printer size={16}/></button>
                                            <button onClick={() => onVoucher?.(selectedRun.id, slip.id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl transition-all border border-indigo-100 hover:bg-indigo-600 hover:text-white"><Ticket size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-10 bg-white rounded-[3rem] border border-dashed border-slate-200">
             <div className="text-center space-y-6">
                <div className="p-10 bg-slate-50 text-slate-200 rounded-[3rem] w-fit mx-auto shadow-inner"><History size={80}/></div>
                <div className="max-w-sm">
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cycle History</h3>
                   <p className="text-slate-400 font-medium text-sm mt-2">Select a fiscal period from the left sidebar to review payslips, export batch reports, or manage disbursement status.</p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
