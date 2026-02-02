
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Worker, CompanySettings, PayrollRun, Payslip, RateType, Project, PaymentVoucher, VoucherItem, CompanyProfile } from '../../types';
import { Button } from '../Button';
import { getPayrollRuns, formatCurrency, getVouchers, saveVouchers, getCompanyProfiles } from '../../utils';
import { 
  Printer, Trash2, FileText, Download, Loader2,
  Settings, Plus, ListOrdered, Scissors, X, Layers, User, UserPlus, Briefcase, Zap, CreditCard, Banknote, Landmark, Smartphone,
  Search, History, ChevronRight, ChevronDown, Folder, UserCheck, Stamp, PenTool, Archive, Eraser, Building2
} from 'lucide-react';

interface PaymentVoucherViewProps {
  workers: Worker[];
  projects: Project[];
  settings: CompanySettings;
  prefill?: { runId: string, payslipId: string } | null;
}

export const PaymentVoucherView: React.FC<PaymentVoucherViewProps> = ({ workers, projects, settings, prefill }) => {
  const [sourceMode, setSourceMode] = useState<'manual' | 'payroll'>('manual');
  const [availableRuns, setAvailableRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [savedVouchers, setSavedVouchers] = useState<PaymentVoucher[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [historySearch, setHistorySearch] = useState('');
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  
  const generateNewVoucherNo = () => `PV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

  const [voucherForm, setVoucherForm] = useState({
    id: '',
    workerId: '',
    issuingCompanyId: '',
    customPayeeName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ id: '1', description: '', amount: 0 }] as VoucherItem[],
    accountCode: 'GS-102',
    paymentMode: 'CASH' as 'CASH' | 'CHEQUE' | 'TRANSFER' | 'PAYNOW',
    chequeNo: '',
    voucherNo: generateNewVoucherNo(),
    preparedById: '',
    approvedById: ''
  });

  const [printQueue, setPrintQueue] = useState<PaymentVoucher[]>([]);

  // Fix: Missing handleWorkerSelect function to manage employee payee selection and auto-fill payee name
  const handleWorkerSelect = (id: string) => {
    const worker = workers.find(w => w.id === id);
    setVoucherForm(prev => ({
        ...prev,
        workerId: id,
        customPayeeName: worker ? worker.name : ''
    }));
  };

  useEffect(() => { 
    const load = async () => {
        setAvailableRuns(await getPayrollRuns());
        setSavedVouchers(await getVouchers());
        setProfiles(await getCompanyProfiles());
    };
    load();
  }, []);

  const historyTree = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, PaymentVoucher[]>>> = {};
    savedVouchers.filter(v => 
        v.payeeName.toLowerCase().includes(historySearch.toLowerCase()) || 
        v.voucherNo.toLowerCase().includes(historySearch.toLowerCase())
    ).forEach(v => {
        const [year, monthNum, dayNum] = v.date.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long' });
        
        if (!tree[year]) tree[year] = {};
        if (!tree[year][monthName]) tree[year][monthName] = {};
        if (!tree[year][monthName][v.date]) tree[year][monthName][v.date] = [];
        tree[year][monthName][v.date].push(v);
    });
    return tree;
  }, [savedVouchers, historySearch]);

  const toggleNode = (node: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(node)) next.delete(node);
      else next.add(node);
      return next;
    });
  };

  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const generateBreakdownItems = (payslip: Payslip, runPeriod: string): VoucherItem[] => {
    const worker = workers.find(w => w.id === payslip.workerId);
    const [year, month] = runPeriod.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-SG', { month: 'long', year: 'numeric' }).toUpperCase();
    
    const items: VoucherItem[] = [];
    if (worker?.rateType === RateType.DAILY) items.push({ id: 'b1', description: `SALARY FOR ${monthName} (${payslip.daysWorkedCount} DAYS)`, amount: payslip.basicSalary });
    else items.push({ id: 'b1', description: `BASIC SALARY FOR ${monthName}`, amount: payslip.basicSalary });
    if (payslip.ot15Hours > 0) items.push({ id: 'ot1', description: `OVERTIME (1.5X) - ${payslip.ot15Hours} HRS`, amount: payslip.ot15Pay });
    if (payslip.ot20Hours > 0) items.push({ id: 'ot2', description: `OVERTIME (2.0X) - ${payslip.ot20Hours} HRS`, amount: payslip.ot20Pay });
    if (payslip.allowance > 0) items.push({ id: 'al1', description: `ALLOWANCE ${payslip.allowanceRemarks ? `(${payslip.allowanceRemarks})` : ''}`, amount: payslip.allowance });
    if (payslip.employeeCpf > 0) items.push({ id: 'cpf1', description: `EMPLOYEE CPF DEDUCTION`, amount: -payslip.employeeCpf });
    if (payslip.deduction > 0) items.push({ id: 'dd1', description: `DEDUCTIONS ${payslip.deductionRemarks ? `(${payslip.deductionRemarks})` : ''}`, amount: -payslip.deduction });
    return items;
  };

  const handleAddToQueue = async () => {
    const isEmployeeSource = voucherForm.workerId !== '';
    const selectedWorker = workers.find(w => w.id === voucherForm.workerId);
    const payeeName = isEmployeeSource ? selectedWorker?.name || 'UNKNOWN' : (voucherForm.customPayeeName || 'VENDOR');
    const totalAmount = voucherForm.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    const newItem: PaymentVoucher = { 
        id: voucherForm.id || Math.random().toString(36).substr(2, 9), 
        payeeName: payeeName.toUpperCase(), 
        date: voucherForm.date, 
        items: voucherForm.items.map(it => ({ ...it, description: it.description.toUpperCase() })), 
        totalAmount, 
        accountCode: voucherForm.accountCode.toUpperCase(), 
        paymentMode: voucherForm.paymentMode, 
        chequeNo: voucherForm.chequeNo.toUpperCase(), 
        voucherNo: voucherForm.voucherNo.toUpperCase(), 
        preparedById: voucherForm.preparedById,
        approvedById: voucherForm.approvedById,
        runId: sourceMode === 'payroll' ? selectedRunId : undefined,
        lastModified: Date.now()
    };
    setPrintQueue(prev => [...prev.filter(v => v.id !== newItem.id), newItem]);
    const currentVouchers = await getVouchers();
    const updatedHistory = [newItem, ...currentVouchers.filter(v => v.id !== newItem.id)];
    setSavedVouchers(updatedHistory);
    await saveVouchers(updatedHistory);
    resetDraftingDesk();
  };

  const resetDraftingDesk = () => {
    setVoucherForm({ 
        id: '', workerId: '', issuingCompanyId: '', customPayeeName: '', date: new Date().toISOString().split('T')[0],
        items: [{ id: '1', description: '', amount: 0 }], accountCode: 'GS-102', paymentMode: 'CASH',
        chequeNo: '', voucherNo: generateNewVoucherNo(), preparedById: '', approvedById: ''
    });
    setSourceMode('manual');
    setSelectedRunId('');
  };

  const getVoucherHTML = (data: PaymentVoucher) => {
    const itemsHtml = data.items.map(it => `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 6px 12px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; line-height: 1.1;">${it.description}</td><td style="padding: 6px 12px; text-align: right; font-size: 10px; font-weight: 800;">${formatCurrency(it.amount)}</td></tr>`).join('');
    const profile = profiles.find(p => p.id === (data as any).issuingCompanyId) || profiles[0] || ({} as any);
    const preparer = settings.supervisors?.find(s => s.id === data.preparedById);
    const approver = settings.supervisors?.find(s => s.id === data.approvedById);
    const getSigHtml = (staff?: any) => staff?.signatureUrl ? `<img src="${staff.signatureUrl}" style="height: 40px; width: auto; object-fit: contain; margin-bottom: -15px;" />` : '';

    return `
      <div style="font-family: 'Inter', sans-serif; padding: 15px; color: #000; width: 190mm; min-height: 135mm; margin: 0 auto; border: 2.5px solid #000; box-sizing: border-box; background: #fff; position: relative; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="flex: 1;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em;">${profile.name || settings.name}</h1>
            <p style="margin: 3px 0; font-size: 8.5px; font-weight: 600; line-height: 1.2;">${(profile.address || settings.address).replace(/\n/g, ' ')}</p>
            <p style="margin: 0; font-size: 8.5px; font-weight: 700;">UEN: ${profile.uen || settings.uen || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 14px; font-weight: 900; letter-spacing: 0.05em;">PAYMENT VOUCHER</h2>
            <div style="margin-top: 4px; font-size: 11px; font-weight: 900; background: #000; color: #fff; padding: 2px 8px; border-radius: 2px;">PV NO: ${data.voucherNo}</div>
          </div>
        </div>
        <div style="display: flex; gap: 24px; margin-bottom: 10px; font-size: 11px;">
           <div style="flex: 1; display: flex; flex-direction: column; gap: 5px;">
             <div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 2px; align-items: center;"><span style="width: 70px; font-weight: 900; color: #444; text-transform: uppercase; font-size: 8.5px;">Paid To:</span><span style="font-weight: 900; text-transform: uppercase; flex: 1;">${data.payeeName}</span></div>
             <div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 2px; align-items: center;"><span style="width: 70px; font-weight: 900; color: #444; text-transform: uppercase; font-size: 8.5px;">Mode:</span><span style="font-weight: 900; flex: 1; text-transform: uppercase;">[ ${data.paymentMode} ] ${data.chequeNo ? ` - REF: ${data.chequeNo}` : ''}</span></div>
           </div>
           <div style="width: 175px; display: flex; flex-direction: column; gap: 5px;">
             <div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 2px; justify-content: space-between; align-items: center;"><span style="width: 75px; font-weight: 900; color: #444; text-transform: uppercase; font-size: 8.5px;">Date:</span><span style="font-weight: 800; text-align: right; font-size: 10px;">${formatDateToDMY(data.date)}</span></div>
             <div style="display: flex; border-bottom: 1px solid #000; padding-bottom: 2px; justify-content: space-between; align-items: center;"><span style="width: 75px; font-weight: 900; color: #444; text-transform: uppercase; font-size: 8.5px;">Paid on:</span><span style="font-weight: 800; text-align: right; text-transform: uppercase; font-size: 10px;">${data.accountCode}</span></div>
           </div>
        </div>
        <div style="border: 2px solid #000; min-height: 48mm; margin-bottom: 0;"><table style="width: 100%; border-collapse: collapse; font-size: 11px;"><thead><tr style="background: #f3f4f6; border-bottom: 2px solid #000;"><th style="padding: 6px 12px; text-align: left; font-weight: 900; text-transform: uppercase; width: 75%; font-size: 8.5px;">Particulars of Payment</th><th style="padding: 6px 12px; text-align: right; font-weight: 900; text-transform: uppercase; font-size: 8.5px;">Amount (SGD)</th></tr></thead><tbody>${itemsHtml}</tbody></table></div>
        <div style="display: flex; border: 2px solid #000; border-top: none; background: #fdfdfd; padding: 6px 12px; justify-content: space-between; align-items: center;"><span style="font-size: 8.5px; font-weight: 900; text-transform: uppercase;">Total Disbursement:</span><span style="font-size: 13px; font-weight: 900; color: #000;">${formatCurrency(data.totalAmount)}</span></div>
        <div style="display: flex; gap: 16px; margin-top: 10px; font-size: 8.5px;">
            <div style="flex: 1; border: 2px solid #000; padding: 6px; height: 20mm; font-weight: 900; text-transform: uppercase; display: flex; flex-direction: column;"><div style="border-bottom: 1px solid #000; margin-bottom: auto; padding-bottom: 2px;">Prepared By:</div><div style="text-align: center;">${getSigHtml(preparer)}<p style="margin: 0; font-size: 8px;">${preparer?.name || ''}</p></div></div>
            <div style="flex: 1; border: 2px solid #000; padding: 6px; height: 20mm; font-weight: 900; text-transform: uppercase; display: flex; flex-direction: column;"><div style="border-bottom: 1px solid #000; margin-bottom: auto; padding-bottom: 2px;">Approved By:</div><div style="text-align: center;">${getSigHtml(approver)}<p style="margin: 0; font-size: 8px;">${approver?.name || ''}</p></div></div>
            <div style="flex: 1; border: 2px solid #000; padding: 6px; height: 20mm; font-weight: 900; text-transform: uppercase; position: relative;"><div style="border-bottom: 1px solid #000; margin-bottom: 3px; padding-bottom: 1px;">Received By:</div><div style="position: absolute; right: 5mm; bottom: 2mm;">${profile.stampUrl ? `<img src="${profile.stampUrl}" style="height: 50px; opacity: 0.6; rotate: 10deg;"/>` : ''}</div></div>
        </div>
      </div>`;
  };

  const handlePrintAll = () => {
      const win = window.open('', '_blank');
      if (!win) return;
      let html = `<!DOCTYPE html><html><head><title>Batch Print</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');@page { margin: 0; size: A4 portrait; } html, body { margin: 0; padding: 0; } .page { width: 210mm; margin: 0 auto; padding-top: 10mm; } .page:not(:last-child) { break-after: page; } .voucher-wrapper { width: 190mm; margin: 0 auto; } .cut-line { width: 100%; border-top: 1.5px dashed #000; margin: 5mm 0; position: relative; } .cut-line::after { content: '✂'; position: absolute; left: 15mm; top: -10px; font-size: 14px; }</style></head><body>`;
      for (let i = 0; i < printQueue.length; i += 2) {
          html += `<div class="page"><div class="voucher-wrapper">${getVoucherHTML(printQueue[i])}</div>`;
          if (printQueue[i+1]) html += `<div class="cut-line"></div><div class="voucher-wrapper">${getVoucherHTML(printQueue[i+1])}</div>`;
          html += `</div>`;
      }
      html += `</body></html>`;
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 800);
  };

  const totalVoucherAmount = voucherForm.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  const staffList = settings.supervisors?.filter(s => s.role === 'STAFF') || [];

  return (
    <div className="animate-fade-in flex h-[calc(100vh-140px)] gap-6 overflow-hidden px-4 w-full text-left">
      <aside className="w-80 shrink-0 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2"><History size={18}/> Voucher History</h3>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14}/><input className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-bold" placeholder="Search..." value={historySearch} onChange={e => setHistorySearch(e.target.value)}/></div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
            {Object.keys(historyTree).sort((a,b) => b.localeCompare(a)).map(year => (
                <div key={year} className="mb-1">
                    <button onClick={() => toggleNode(year)} className="w-full flex items-center gap-2 p-2 text-slate-700 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase transition-all">{expandedNodes.has(year) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} <Folder size={14} className="text-amber-400"/> {year}</button>
                    {expandedNodes.has(year) && (
                        <div className="ml-4 border-l border-slate-100 pl-2 space-y-1">
                            {Object.keys(historyTree[year]).map(month => (
                                <div key={month} className="space-y-1">
                                    <p className="px-2 py-1 text-[8px] font-black text-slate-300 uppercase mt-1">{month}</p>
                                    {Object.keys(historyTree[year][month]).map(day => (
                                        <div key={day} className="space-y-0.5">
                                            {historyTree[year][month][day].map(v => (
                                                <button key={v.id} onClick={() => setVoucherForm({...v, issuingCompanyId: (v as any).issuingCompanyId || ''} as any)} className={`w-full text-left p-2 rounded-xl hover:bg-indigo-50 flex items-center justify-between group transition-all border ${voucherForm.id === v.id ? 'border-indigo-200 bg-indigo-50/30' : 'border-transparent'}`}><div className="flex flex-col flex-1 min-w-0 pr-2"><div className="flex justify-between items-center w-full"><span className="font-black text-slate-800 text-[9px] uppercase truncate">{v.payeeName}</span><span className="text-[7px] font-black text-indigo-600">{formatCurrency(v.totalAmount)}</span></div><span className="text-[7px] font-bold text-slate-400 uppercase">{v.voucherNo}</span></div><div onClick={async (e) => { e.stopPropagation(); if(confirm("Purge PV?")) { const u = savedVouchers.filter(x => x.id !== v.id); setSavedVouchers(u); await saveVouchers(u); } }} className="p-1.5 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></div></button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="p-6 bg-slate-900 text-white">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 text-left">Fiscal Liability</p>
            <p className="text-2xl font-black tabular-nums text-left">{formatCurrency(savedVouchers.reduce((s,v) => s + v.totalAmount, 0))}</p>
        </div>
      </aside>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-10">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Drafting Desk</h3>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                        <button onClick={() => setSourceMode('manual')} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${sourceMode === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>MANUAL</button>
                        <button onClick={() => setSourceMode('payroll')} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${sourceMode === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>WAGES</button>
                    </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-1"><label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-1"><Building2 size={10}/> Issuing Entity</label><select className="w-full px-3 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase outline-none" value={voucherForm.issuingCompanyId} onChange={e => setVoucherForm({...voucherForm, issuingCompanyId: e.target.value})}><option value="">-- Select Issuer Profile --</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                   <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">PV No</label><input type="text" className="w-full px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase" value={voucherForm.voucherNo} onChange={e => setVoucherForm({...voucherForm, voucherNo: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Date</label><input type="date" className="w-full px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-bold" value={voucherForm.date} onChange={e => setVoucherForm({...voucherForm, date: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Code</label><input type="text" className="w-full px-3 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase" value={voucherForm.accountCode} onChange={e => setVoucherForm({...voucherForm, accountCode: e.target.value})} /></div>
                   </div>
                   <div className="space-y-3 pt-2 border-t border-slate-50">
                        <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Staff / Payee</label><select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[11px] font-bold" value={voucherForm.workerId} onChange={e => handleWorkerSelect(e.target.value)}><option value="">-- Manual Entry --</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                        {!voucherForm.workerId && (<div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Payee Name</label><input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase" value={voucherForm.customPayeeName} onChange={e => setVoucherForm({...voucherForm, customPayeeName: e.target.value})} /></div>)}
                   </div>
                   <div className="space-y-4 pt-2 border-t border-slate-50">
                        <div className="space-y-1"><label className="text-[9px] font-black text-emerald-600 uppercase ml-1">Prepared By</label><select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase" value={voucherForm.preparedById} onChange={e => setVoucherForm({...voucherForm, preparedById: e.target.value})}><option value="">-- Select Signatory --</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div className="space-y-1"><label className="text-[9px] font-black text-indigo-600 uppercase ml-1">Approved By</label><select className="w-full px-3 py-2.5 bg-slate-50 rounded-xl text-[10px] font-black uppercase" value={voucherForm.approvedById} onChange={e => setVoucherForm({...voucherForm, approvedById: e.target.value})}><option value="">-- Select Signatory --</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                   </div>
                   <div className="space-y-2 pt-2 border-t border-slate-50">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Mode</label>
                        <div className="grid grid-cols-4 gap-1">{(['CASH', 'CHEQUE', 'TRANSFER', 'PAYNOW'] as const).map(mode => (<button key={mode} onClick={() => setVoucherForm({...voucherForm, paymentMode: mode})} className={`py-2 rounded-lg text-[7px] font-black uppercase border transition-all ${voucherForm.paymentMode === mode ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{mode}</button>))}</div>
                   </div>
                   <div className="pt-4 border-t border-slate-100 flex justify-between items-end"><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pay Sum</p><p className="text-2xl font-black text-slate-900 tabular-nums">${totalVoucherAmount.toLocaleString()}</p></div><button onClick={resetDraftingDesk} className="p-2 text-slate-300 hover:text-slate-900"><Eraser size={16}/></button></div>
                   <Button className="w-full bg-indigo-600 font-black uppercase text-xs rounded-2xl py-4" onClick={handleAddToQueue}>{voucherForm.id ? "Update Voucher" : "Archive & Add to Queue"}</Button>
                </div>
            </div>
            {printQueue.length > 0 && (<div className="bg-slate-900 p-6 rounded-[2rem] space-y-4 text-white shadow-2xl"><div className="flex justify-between items-center border-b border-white/10 pb-3"><div className="flex items-center gap-2"><ListOrdered size={16} className="text-indigo-400"/><h4 className="text-xs font-black uppercase tracking-widest">Ready to Print</h4></div><span className="bg-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full">{printQueue.length}</span></div><div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">{printQueue.map((v) => (<div key={v.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-[10px] group border border-white/5"><p className="font-black text-white truncate flex-1 uppercase tracking-tight">{v.payeeName}</p><button onClick={() => setPrintQueue(prev => prev.filter(x => x.id !== v.id))} className="text-slate-500 hover:text-rose-400 p-1"><X size={14}/></button></div>))}</div><Button onClick={handlePrintAll} className="w-full bg-emerald-500 hover:bg-emerald-400 font-black uppercase text-xs rounded-xl py-4 shadow-xl active:scale-95">Execute Batch Print</Button></div>)}
        </div>

        <div className="lg:col-span-2 bg-slate-100 rounded-[3rem] p-10 flex flex-col items-center border border-slate-200 shadow-inner min-h-[750px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"><Scissors size={250} className="absolute -bottom-10 -right-10 rotate-12 text-slate-900" /></div>
            <div className="sticky top-4 flex flex-col items-center w-full">
                <div className="scale-[0.75] sm:scale-[0.85] lg:scale-[0.95] xl:scale-[1.05] 2xl:scale-[1.1] origin-top shadow-2xl bg-white border border-slate-300 p-1">
                    <div dangerouslySetInnerHTML={{ __html: getVoucherHTML({ ...voucherForm, id: 'preview', payeeName: (workers.find(w => w.id === voucherForm.workerId)?.name || voucherForm.customPayeeName || '________________').toUpperCase(), totalAmount: totalVoucherAmount, lastModified: Date.now() } as PaymentVoucher) }} />
                </div>
                <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live A4 Alignment Preview</p>
            </div>
        </div>
      </div>
    </div>
  );
};
