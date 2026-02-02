import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Project, CompanySettings, InvoiceItem, InvoiceStatus, InvoiceType, CompanyProfile } from '../../types';
import { 
  Plus, Trash2, FileText, X, Search, ChevronRight, 
  Calendar, Building2, Save, MapPin, Receipt, Package, ArrowLeft, 
  Download, Phone, Mail, Eye, Landmark, Banknote, 
  Upload, ImageIcon, Info, Stamp, PenTool, Edit2, UserCheck, Smartphone, Tag, Loader2, Share2, Printer, FileType, ListOrdered,
  Archive
} from 'lucide-react';
import { GST_RATE } from '../../constants';
import { formatCurrency, getCompanyProfiles, getMediaViewUrl } from '../../utils';

interface InvoiceManagerProps {
  invoices: Invoice[];
  projects: Project[];
  settings: CompanySettings;
  addInvoice: (i: Invoice) => void;
  updateInvoice?: (i: Invoice) => void;
  deleteInvoice: (id: string) => void;
  updateStatus: (id: string, status: InvoiceStatus) => void;
  sendReminder: (id: string) => void;
}

const INITIAL_FORM_DATA: Partial<Invoice> = {
  issuingCompanyId: '',
  projectId: '',
  invoiceNo: '',
  entityName: '',
  entityAddress: '',
  entityPhone: '',
  entityEmail: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [{ id: '1', type: 'STANDARD', description: '', uom: 'nos', quantity: 1, unitPrice: 0, amount: 0 }],
  discountAmount: 0,
  lessPreviousClaim: 0,
  shippingHandling: 0,
  otherCharges: 0,
  notes: '',
  jobSite: '',
  jobSiteAddress: '',
  issuedBy: 'Admin',
  shippedVia: 'LAND',
  fobPoint: 'SITE',
  paymentMode: 'Bank Transfer',
  paymentDetails: '',
  isTaxable: true,
  descriptionMode: 'WORK',
  signatoryId: ''
};

export const calculateDaysDiff = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
};

export const DocLayout = ({ doc, profile, title, settings, id = "doc-print-area" }: { doc: Invoice, profile?: CompanyProfile, title: string, settings: CompanySettings, id?: string }) => {
  const isPO = doc.type === 'PO';
  const isReceipt = doc.type === 'RECEIPT';
  const isBill = doc.type === 'AP';

  const renderItems = () => {
      return (
          <table className="w-full border-collapse">
                <thead>
                    <tr className={`${isReceipt ? 'bg-[#004274]' : isPO ? 'bg-black' : isBill ? 'bg-amber-700' : 'bg-slate-900'} text-white text-[10px] font-black uppercase tracking-widest`}>
                        <th className="py-4 px-6 text-center w-24">QTY</th>
                        <th className="py-4 px-6 text-left">PARTICULARS / SCOPE</th>
                        <th className="py-4 px-6 text-right w-36">UNIT (S$)</th>
                        <th className="py-4 px-6 text-right w-40">AMOUNT (S$)</th>
                    </tr>
                </thead>
                <tbody className="text-[11px] font-bold uppercase text-slate-800">
                    {(doc.items || []).map((it) => (
                        it.type === 'TEXT_BLOCK' ? (
                            <tr key={it.id} className="border-b border-slate-100">
                                <td className="px-6 py-6" colSpan={4}>
                                    <div className="space-y-1 text-left">
                                        <p className="text-sm font-black text-slate-900">{it.description}</p>
                                        <p className="text-sm font-medium text-slate-500 whitespace-pre-wrap leading-relaxed normal-case">{it.longDescription}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <tr key={it.id} className="border-b border-slate-100 h-14">
                                <td className="px-6 text-center">{it.quantity}</td>
                                <td className="px-6 text-left">{it.description}</td>
                                <td className="px-6 text-right text-slate-400">${it.unitPrice?.toFixed(2)}</td>
                                <td className="px-6 text-right font-black">${it.amount.toFixed(2)}</td>
                            </tr>
                        )
                    ))}
                    {[...Array(Math.max(0, 5 - (doc.items?.length || 0)))].map((_, i) => (
                        <tr key={i} className="border-b border-slate-50 h-14 opacity-20"><td colSpan={4}></td></tr>
                    ))}
                </tbody>
            </table>
      );
  };

  const signatory = settings.supervisors?.find(s => s.id === doc.signatoryId);
  const signatureUrl = signatory?.signatureUrl || profile?.signatureUrl;
  const signatoryName = signatory?.name || profile?.name || 'AUTHORIZED SIGNATORY';
  const signatoryTitle = signatory?.title || 'AUTHORIZED SIGNATORY';

  if (isReceipt) {
    return (
      <div id={id} className="w-[210mm] min-h-[297mm] p-[15mm] bg-white text-slate-900 font-sans leading-tight flex flex-col box-border overflow-hidden mx-auto border border-slate-100">
        <div className="flex justify-between items-start mb-12">
            <div className="space-y-4 text-left">
                <h1 className="text-3xl font-black text-[#004274] uppercase tracking-tighter leading-none">{profile?.name || settings.name}</h1>
                <div className="space-y-1 text-[9px] font-bold text-slate-500 uppercase">
                    <p className="flex items-center gap-2"><MapPin size={10} className="text-[#004274]"/> {profile?.address || settings.address}</p>
                    <p className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5"><Phone size={10} className="text-[#004274]"/> {profile?.phone || settings.phone}</span>
                        <span className="flex items-center gap-1.5"><Mail size={10} className="text-[#004274]"/> {profile?.email || settings.email}</span>
                    </p>
                    <p className="text-[#004274] font-black">UEN: {profile?.uen || settings.uen || '—'}</p>
                </div>
            </div>
            <div className="text-right space-y-4">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-[#004274] tracking-tight uppercase leading-none">RECEIPT</h2>
                    <div className="w-full h-1 bg-[#004274] mt-2"></div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-black uppercase text-right">
                    <span className="text-slate-300">REF #</span>
                    <span className="text-[#004274]">{doc.invoiceNo}</span>
                    <span className="text-slate-300">DATE</span>
                    <span className="text-[#004274]">{doc.date}</span>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-10 mb-10">
            <div className="space-y-3 text-left">
                <h4 className="text-[10px] font-black text-[#004274] uppercase tracking-[0.2em]">RECEIVED FROM:</h4>
                <div className="bg-slate-50 rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm h-full">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{doc.entityName}</h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed line-clamp-3">{doc.entityAddress || '—'}</p>
                </div>
            </div>
            <div className="space-y-3 text-left">
                <h4 className="text-[10px] font-black text-[#004274] uppercase tracking-[0.2em]">PAYMENT DETAILS:</h4>
                <div className="bg-[#004274]/5 rounded-[2rem] p-8 border-2 border-[#004274]/10 shadow-sm h-full space-y-3">
                    <div className="flex justify-between items-center border-b border-[#004274]/10 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">MODE</span>
                        <div className="text-right">
                            <p className="text-xs font-black text-[#004274] uppercase">{doc.paymentMode}</p>
                            {doc.paymentDetails && <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{doc.paymentDetails}</p>}
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-[#004274]/10 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">RECEIVED ON</span>
                        <span className="text-xs font-black text-slate-900 uppercase">{doc.date}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase">RECEIVED BY</span>
                        <span className="text-xs font-black text-[#004274] uppercase">{doc.issuedBy || 'OFFICE ADMIN'}</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex-1">{renderItems()}</div>
        <div className="flex justify-between items-end mt-10">
            <div className="flex flex-col items-start relative min-h-[200px] flex-1">
                <div className="absolute left-10 bottom-14 z-0">{profile?.stampUrl && <img src={getMediaViewUrl(profile.stampUrl)} crossOrigin="anonymous" className="w-24 h-24 object-contain rotate-12 opacity-80" alt="Stamp" />}</div>
                <div className="relative z-10 flex flex-col items-start">
                    {signatureUrl && <img src={getMediaViewUrl(signatureUrl)} crossOrigin="anonymous" className="w-[280px] h-28 object-contain mb-[-30px] ml-[-20px]" alt="Signature" />}
                    <div className="w-80 border-t-2 border-[#004274] pt-2 text-left">
                        <p className="text-[11px] font-black text-[#004274] uppercase tracking-widest">{signatoryName}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{signatoryTitle}</p>
                    </div>
                </div>
            </div>
            <div className="w-96 bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-4 shadow-inner">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase px-2"><span>SUBTOTAL</span><span className="text-slate-900">${(doc.subtotal || 0).toLocaleString()}</span></div>
                {doc.isTaxable && <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase px-2"><span>TAX (9% GST)</span><span className="text-slate-900">${(doc.gstAmount || 0).toLocaleString()}</span></div>}
                <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1 text-left"><p className="text-[11px] font-black text-[#004274] uppercase">TOTAL PAYOUT</p><p className="text-[10px] font-bold text-slate-400">(SGD)</p></div>
                    <span className="text-3xl font-black text-slate-900 tabular-nums">${(doc.totalAmount || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (isPO) {
    return (
      <div id={id} className="w-[210mm] min-h-[297mm] p-[10mm] bg-white text-black font-sans leading-tight flex flex-col box-border overflow-hidden mx-auto border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="text-left"><h1 className="text-4xl font-black text-black uppercase tracking-tight leading-none">PURCHASE ORDER</h1></div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-black uppercase leading-none">{profile?.name || settings.name}</h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">CONSTRUCTION & PROJECT MANAGEMENT</p>
            <div className="text-[9px] font-bold text-slate-900 uppercase space-y-0.5 mt-2 text-right"><p>PHONE: {profile?.phone || settings.phone}</p><p>EMAIL: {profile?.email || settings.email}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-12 border-2 border-black mb-4">
          <div className="col-span-4 border-r-2 border-black text-left">
            <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">TO</div>
            <div className="p-3 min-h-[100px] flex flex-col justify-start">
              <h3 className="text-sm font-black uppercase mb-1">{doc.entityName}</h3>
              <p className="text-[9px] font-bold text-slate-700 uppercase leading-relaxed max-w-[200px]">{doc.entityAddress}</p>
              <div className="mt-auto pt-2 text-[9px] font-black uppercase"><p>PHONE: {doc.entityPhone}</p><p>EMAIL: {doc.entityEmail}</p></div>
            </div>
          </div>
          <div className="col-span-4 border-r-2 border-black text-left">
            <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">SHIP TO</div>
            <div className="p-3 min-h-[100px]"><h3 className="text-sm font-black uppercase mb-1">{doc.jobSite || 'OFFICE'}</h3><p className="text-[9px] font-bold text-slate-700 uppercase leading-relaxed">{doc.jobSiteAddress || settings.address}</p></div>
          </div>
          <div className="col-span-4 bg-white text-center">
            <div className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">P.O. NUMBER</div>
            <div className="p-3 min-h-[100px] flex flex-col justify-center"><p className="text-2xl font-black uppercase tracking-tight">{doc.invoiceNo}</p><p className="text-[7px] italic text-slate-500 font-bold mt-2 uppercase leading-tight">Must appear on all correspondence</p></div>
          </div>
        </div>
        <div className="grid grid-cols-5 border-x-2 border-b-2 border-black mb-6">
            {['P.O. DATE', 'REQUISITIONER', 'SHIPPED VIA', 'F.O.B. POINT', 'TERMS'].map((label, idx) => (
                <div key={idx} className={`${idx < 4 ? 'border-r-2 border-black' : ''} flex flex-col`}>
                    <div className="bg-black text-white text-center py-1 text-[8px] font-black uppercase tracking-widest">{label}</div>
                    <div className="py-2 text-center text-[10px] font-black uppercase">
                        {idx === 0 ? doc.date : idx === 1 ? (doc.issuedBy || 'ADMIN') : idx === 2 ? (doc.shippedVia || 'LAND') : idx === 3 ? (doc.fobPoint || 'SITE') : (doc.date && doc.dueDate ? `${calculateDaysDiff(doc.date, doc.dueDate)} DAYS` : '7 DAYS')}
                    </div>
                </div>
            ))}
        </div>
        <div className="flex-1 border-x-2 border-t-2 border-black">{renderItems()}</div>
        <div className="flex justify-between items-start mt-6 gap-8">
            <div className="flex-1 flex flex-col justify-end min-h-[220px] relative text-left">
                <ul className="text-[9px] font-black text-black uppercase space-y-1.5 list-disc pl-4 mb-auto"><li>SEND TWO COPIES OF INVOICE.</li><li>ENTER IN ACCORDANCE WITH PRICES SPECIFIED.</li></ul>
                <div className="flex items-end gap-6 relative">
                    <div className="absolute left-20 bottom-12 z-0">{profile?.stampUrl && <img src={getMediaViewUrl(profile.stampUrl)} crossOrigin="anonymous" className="w-28 h-28 object-contain rotate-6 opacity-80" alt="Stamp" />}</div>
                    <div className="flex flex-col items-start relative z-10">
                        {signatureUrl && <div className="mb-[-25px] ml-[-20px]"><img src={getMediaViewUrl(signatureUrl)} crossOrigin="anonymous" className="w-[280px] h-28 object-contain" alt="Signature" /></div>}
                        <div className="w-80 border-t-2 border-black pt-1 text-left">
                            <p className="text-[9px] font-black uppercase">{signatoryName}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">FOR {profile?.name || settings.name}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-80 border-2 border-black h-fit">
                <div className="grid grid-cols-2 divide-x-2 divide-black border-b-2 border-black">
                    <div className="px-3 py-2 text-[10px] font-black uppercase text-left">SUB TOTAL</div>
                    <div className="px-3 py-2 text-right font-black text-sm">${(doc.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                {doc.isTaxable && (
                    <div className="grid grid-cols-2 divide-x-2 divide-black border-b-2 border-black">
                        <div className="px-3 py-2 text-[10px] font-black uppercase text-left">TAX (GST)</div>
                        <div className="px-3 py-2 text-right font-black text-sm">${(doc.gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                )}
                <div className="grid grid-cols-2 divide-x-2 divide-black bg-black text-white">
                    <div className="px-3 py-2 text-[10px] font-black uppercase text-left">TOTAL</div>
                    <div className="px-3 py-2 text-right font-black text-2xl">${(doc.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div id={id} className="w-[210mm] min-h-[297mm] p-[10mm] bg-white text-black font-sans leading-tight flex flex-col box-border overflow-hidden shadow-2xl mx-auto border border-slate-100">
      <div className="flex justify-between items-start mb-8">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 min-w-[320px] text-left">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">BILL TO :</h4>
              <h2 className="text-xl font-black uppercase text-slate-900 mb-1">{doc.entityName}</h2>
              <div className="text-[9px] font-bold text-slate-500 uppercase space-y-1">
                  <p className="flex items-center gap-2"><Phone size={10}/> {doc.entityPhone || '—'}</p>
                  <p className="flex items-center gap-2"><Mail size={10}/> {doc.entityEmail || '—'}</p>
                  <p className="flex items-start gap-2 pt-1 mt-1 border-t border-slate-200/50"><MapPin size={10} className="mt-0.5 shrink-0"/> <span className="leading-normal">{doc.entityAddress || '—'}</span></p>
              </div>
          </div>
          <div className="text-right flex flex-col items-end">
              {profile?.logoUrl && <img src={getMediaViewUrl(profile.logoUrl)} crossOrigin="anonymous" className="h-16 w-auto object-contain mb-3" alt="Logo" />}
              <h1 className="text-2xl font-black text-slate-900 uppercase leading-none tracking-tight">{profile?.name || settings.name}</h1>
              <div className="mt-3 text-[9px] font-bold text-slate-500 uppercase space-y-1 flex flex-col items-end text-right">
                  <p className="max-w-[240px] leading-snug">{profile?.address || settings.address}</p>
                  <p className="text-indigo-600 font-black">UEN: {profile?.uen || settings.uen}</p>
                  <p className="flex gap-2"><span>TEL: {profile?.phone || settings.phone}</span><span className="text-slate-200">|</span><span>EMAIL: {profile?.email || settings.email}</span></p>
              </div>
          </div>
      </div>
      <div className="flex flex-1 gap-6 relative overflow-hidden">
          <div className={`w-12 shrink-0 border-r-4 ${isBill ? 'border-amber-700' : 'border-slate-900'} flex flex-col items-center justify-center`}>
              <div className="transform -rotate-90 whitespace-nowrap"><span className="text-5xl font-black text-black uppercase tracking-[0.1em]">{isBill ? 'SUPPLIER BILL' : doc.isTaxable ? 'TAX INVOICE' : 'INVOICE'}</span></div>
          </div>
          <div className="flex-1 flex flex-col pt-1">
              <div className="flex justify-between items-end mb-6 px-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase space-y-1 text-left">
                      <p>{isBill ? 'BILL' : 'INVOICE'} # : <span className="text-slate-900">{doc.invoiceNo}</span></p>
                      <p>DATE : <span className="text-slate-900">{doc.date}</span></p>
                      <p>DUE DATE : <span className="text-slate-900">{doc.dueDate} {doc.date && doc.dueDate && `(${calculateDaysDiff(doc.date, doc.dueDate)} Days)`}</span></p>
                  </div>
                  <div className="text-right border-b-2 border-slate-200 pb-1 px-4 text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Gross Amount</p><p className="text-3xl font-black text-slate-900 tracking-tighter">${(doc.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
              </div>
              <div className="flex-1">{renderItems()}</div>
              <div className="mt-auto pb-8 space-y-12">
                  <div className="flex justify-between items-start gap-4">
                      <div className="space-y-4 flex-1 text-left">
                          <div className={`text-white px-4 py-1.5 rounded-lg inline-block text-[9px] font-black uppercase tracking-widest shadow-sm ${isBill ? 'bg-amber-700' : 'bg-slate-900'}`}>{isBill ? 'Audit Verification' : 'Payment Instructions'}</div>
                          {!isBill ? (
                              <div className="text-[11px] font-black text-slate-500 uppercase space-y-1.5 mt-3 pl-1 leading-relaxed text-left">
                                  <p>BANKER : <span className="text-slate-900 font-black">{profile?.bankName || 'DBS BANK'}</span></p>
                                  <p>ACC NAME : <span className="text-slate-900 font-black">{profile?.accountName || profile?.name || settings.name}</span></p>
                                  <p>ACC NO : <span className="text-slate-900 font-mono font-black">{profile?.accountNumber || '—'}</span></p>
                                  <p>PAYNOW UEN : <span className="text-indigo-600 font-black font-mono">{profile?.paynowUen || profile?.uen || settings.uen}</span></p>
                              </div>
                          ) : (
                              <div className="text-[11px] font-black text-slate-500 uppercase space-y-1.5 mt-3 pl-1 leading-relaxed text-left">
                                  <p>RECORD STATUS: <span className="text-amber-700 font-black">LOGGED TO ACCOUNTS PAYABLE</span></p>
                                  <p>SETTLEMENT: <span className="text-slate-900">VIA LEDGER RECONCILIATION</span></p>
                              </div>
                          )}
                      </div>
                      <div className="w-72 space-y-3">
                          <div className="flex justify-between px-2 text-[10px] font-black text-slate-400 uppercase"><span>Subtotal</span> <span className="text-slate-900">${(doc.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                          {doc.isTaxable && <div className="flex justify-between px-2 text-[10px] font-black text-slate-400 uppercase"><span>Tax (GST 9%)</span> <span className="text-slate-900">${(doc.gstAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}
                          <div className={`text-white p-7 rounded-[2.5rem] shadow-xl w-full flex items-center justify-between border-4 mt-4 ${isBill ? 'bg-amber-900 border-amber-800' : 'bg-slate-900 border-slate-800'}`}><span className="text-[11px] font-black uppercase tracking-tighter opacity-60">NET PAYABLE</span><span className="text-3xl font-black tabular-nums tracking-tighter">${(doc.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                  </div>
                  <div className="flex flex-col items-start relative min-h-[220px]">
                      <div className="absolute left-20 bottom-16 z-0">{profile?.stampUrl && <img src={getMediaViewUrl(profile.stampUrl)} crossOrigin="anonymous" className="w-32 h-32 object-contain rotate-6 opacity-80" alt="Stamp" />}</div>
                      <div className="flex flex-col items-start relative z-10">
                          {signatureUrl && <div className="mb-[-25px] ml-[-20px]"><img src={getMediaViewUrl(signatureUrl)} crossOrigin="anonymous" className="w-[280px] h-36 object-contain" alt="Signature" /></div>}
                          <div className="w-80 border-t-2 border-slate-900 pt-3 text-left">
                              <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">{signatoryName}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">FOR {profile?.name || settings.name}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ 
  invoices, projects, settings, addInvoice, updateInvoice, deleteInvoice, updateStatus, sendReminder 
}) => {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'VIEW'>('LIST');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<Partial<Invoice>>(INITIAL_FORM_DATA);
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState<number>(30);

  useEffect(() => {
    const load = async () => {
      setProfiles(await getCompanyProfiles());
    };
    load();
  }, []);

  useEffect(() => {
    if (formData.date) {
        const d = new Date(formData.date);
        d.setDate(d.getDate() + paymentTerms);
        setFormData(prev => ({ ...prev, dueDate: d.toISOString().split('T')[0] }));
    }
  }, [paymentTerms, formData.date]);

  const subtotal = useMemo(() => 
    (formData.items || []).reduce((sum, it) => sum + (it.amount || 0), 0)
  , [formData.items]);

  const gst = useMemo(() => 
    formData.isTaxable ? subtotal * GST_RATE : 0
  , [subtotal, formData.isTaxable]);

  const total = subtotal + gst;

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: Date.now().toString(), type: 'STANDARD', description: '', uom: 'nos', quantity: 1, unitPrice: 0, amount: 0 }]
    }));
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter(it => it.id !== id)
    }));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(it => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
          }
          return updated;
        }
        return it;
      })
    }));
  };

  const handleSave = async () => {
    if (!formData.invoiceNo || !formData.entityName) {
      alert("Missing Required Fields (Invoice #, Name)");
      return;
    }

    const finalInvoice: Invoice = {
      ...INITIAL_FORM_DATA,
      ...formData,
      id: formData.id || 'INV_' + Date.now(),
      subtotal,
      gstAmount: gst,
      totalAmount: total,
      status: formData.status || 'PENDING',
    } as Invoice;

    setIsSyncing(true);
    try {
      if (formData.id && updateInvoice) {
        updateInvoice(finalInvoice);
      } else {
        addInvoice(finalInvoice);
      }
      setView('LIST');
      setFormData(INITIAL_FORM_DATA);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeProfile = useMemo(() => 
    profiles.find(p => p.id === formData.issuingCompanyId) || profiles[0]
  , [profiles, formData.issuingCompanyId]);

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {view === 'LIST' ? (
        <>
          <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
            <div className="relative z-10 text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none text-left">Financial Documents</h2>
                <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px] text-left">Accounts Receivable & Payable Ledger</p>
            </div>
            <button 
              onClick={() => { setFormData(INITIAL_FORM_DATA); setView('CREATE'); }}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus size={18}/> Create Document
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map(inv => (
              <div key={inv.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${inv.type === 'AR' ? 'bg-emerald-500' : inv.type === 'AP' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${inv.type === 'AR' ? 'bg-emerald-50 text-emerald-600' : inv.type === 'AP' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                    {inv.type}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setSelectedInvoice(inv); setView('VIEW'); }} className="p-2 text-slate-300 hover:text-indigo-600"><Eye size={18}/></button>
                    <button onClick={() => { setFormData(inv); setView('CREATE'); }} className="p-2 text-slate-300 hover:text-emerald-600"><Edit2 size={18}/></button>
                    <button onClick={() => deleteInvoice(inv.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={18}/></button>
                  </div>
                </div>
                <div className="space-y-1 flex-1 text-left">
                  <h4 className="font-black text-slate-900 text-lg uppercase truncate text-left">{inv.entityName}</h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><FileText size={12}/> {inv.invoiceNo}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {inv.date}</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-end">
                   <div className="text-left">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Amount</p>
                      <p className="text-xl font-black text-slate-900 tabular-nums">{formatCurrency(inv.totalAmount)}</p>
                   </div>
                   <button 
                    onClick={() => updateStatus(inv.id, inv.status === 'PAID' ? 'PENDING' : 'PAID')}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white'}`}
                   >
                    {inv.status}
                   </button>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
                <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <Archive size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No documents in registry</p>
                </div>
            )}
          </div>
        </>
      ) : view === 'CREATE' ? (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in h-[calc(100vh-140px)]">
           <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center text-left">
                    <button onClick={() => setView('LIST')} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><ArrowLeft/></button>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Drafting System</h3>
                    <button onClick={handleSave} disabled={isSyncing} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2 hover:bg-indigo-700 active:scale-95">
                        {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Archive Doc
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="space-y-6 text-left">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1 flex items-center gap-2 text-left"><Building2 size={14}/> Issuing Entity Profile</label>
                                <select className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-xs uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none text-left" value={formData.issuingCompanyId} onChange={e => setFormData({...formData, issuingCompanyId: e.target.value})}>
                                    <option value="">-- Choose Profile --</option>
                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2 text-left"><Tag size={14}/> Document Type</label>
                                <div className="flex bg-slate-100 p-1 rounded-2xl">
                                    {(['AR', 'AP', 'PO', 'RECEIPT'] as InvoiceType[]).map(t => (
                                        /* Fix: 't' is shorthand for 't: t', but property should be 'type' */
                                        <button key={t} onClick={() => setFormData({...formData, type: t})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${formData.type === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 text-left">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Document No</label>
                                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none text-left" value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value.toUpperCase()})} placeholder="REF-001" />
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Issue Date</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none text-left" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-indigo-600 uppercase ml-1">Payment Terms</label>
                                    <select className="w-full p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-xs uppercase outline-none appearance-none" value={paymentTerms} onChange={e => setPaymentTerms(parseInt(e.target.value))}>
                                        <option value={0}>Due on Receipt</option>
                                        <option value={7}>7 Days</option>
                                        <option value={14}>14 Days</option>
                                        <option value={30}>30 Days</option>
                                    </select>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Due Date</label>
                                    <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none text-left" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6 text-left">
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-4 text-left">
                            <UserCheck size={20} className="text-indigo-600" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-left">Recipient Specifications</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            <div className="space-y-4 text-left">
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Recipient / Entity Name</label>
                                    <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm uppercase outline-none text-left" value={formData.entityName} onChange={e => setFormData({...formData, entityName: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Full Billing Address</label>
                                    <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-medium text-xs uppercase outline-none resize-none h-24 text-left" value={formData.entityAddress} onChange={e => setFormData({...formData, entityAddress: e.target.value.toUpperCase()})} />
                                </div>
                            </div>
                            <div className="space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4 text-left">
                                    <div className="space-y-1 text-left">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Phone</label>
                                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-left" value={formData.entityPhone} onChange={e => setFormData({...formData, entityPhone: e.target.value})} />
                                    </div>
                                    <div className="space-y-1 text-left">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Email</label>
                                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-left" value={formData.entityEmail} onChange={e => setFormData({...formData, entityEmail: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1 text-left">
                                    <label className="text-[9px] font-black text-indigo-600 uppercase ml-1">Link to Active Site</label>
                                    <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase text-left" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                                        <option value="">-- Internal Only --</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 text-left">
                        <div className="flex justify-between items-center px-2 text-left">
                             <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-left"><ListOrdered size={16}/> Breakdown Details</h4>
                             <button onClick={handleAddItem} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2"><Plus size={14}/> Add Line</button>
                        </div>
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden text-left">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">
                                    <tr>
                                        <th className="px-6 py-4">Description</th>
                                        <th className="px-4 py-4 w-24 text-center">Qty</th>
                                        <th className="px-4 py-4 w-32 text-right">Rate</th>
                                        <th className="px-6 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-left">
                                    {(formData.items || []).map(it => (
                                        <tr key={it.id} className="group hover:bg-slate-100 transition-all text-left">
                                            <td className="px-6 py-3 text-left">
                                                {it.type === 'TEXT_BLOCK' ? (
                                                    <div className="space-y-2 py-2 text-left">
                                                        <input className="w-full bg-transparent font-black text-xs uppercase outline-none text-left" value={it.description} onChange={e => handleUpdateItem(it.id, 'description', e.target.value.toUpperCase())} placeholder="BLOCK HEADER..." />
                                                        <textarea className="w-full bg-transparent font-medium text-[11px] outline-none h-20 resize-none text-left" value={it.longDescription} onChange={e => handleUpdateItem(it.id, 'longDescription', e.target.value)} placeholder="Enter long-form text content here..." />
                                                    </div>
                                                ) : (
                                                    <input className="w-full bg-transparent font-bold text-xs uppercase outline-none text-left" value={it.description} onChange={e => handleUpdateItem(it.id, 'description', e.target.value.toUpperCase())} placeholder="Work Item / Supply..." />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {it.type !== 'TEXT_BLOCK' && (
                                                    <input type="number" className="w-full bg-transparent text-center font-black text-xs outline-none" value={it.quantity || ''} onChange={e => handleUpdateItem(it.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {it.type !== 'TEXT_BLOCK' && (
                                                    <input type="number" className="w-full bg-transparent text-right font-black text-xs outline-none text-indigo-600" value={it.unitPrice || ''} onChange={e => handleUpdateItem(it.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all justify-end">
                                                    <button onClick={() => handleUpdateItem(it.id, 'type', it.type === 'STANDARD' ? 'TEXT_BLOCK' : 'STANDARD')} className="p-1 text-slate-300 hover:text-indigo-600"><FileType size={14}/></button>
                                                    <button onClick={() => handleRemoveItem(it.id)} className="p-1 text-slate-300 hover:text-rose-500"><X size={14}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10 text-left">
                        <div className="space-y-4 text-left">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Document Logic</h4>
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-slate-100 text-left">
                                    <input type="checkbox" checked={formData.isTaxable} onChange={e => setFormData({...formData, isTaxable: e.target.checked})} className="w-5 h-5 rounded text-indigo-600" />
                                    <span className="text-[10px] font-black uppercase text-slate-600">Apply GST (9%)</span>
                                </label>
                                <div className="space-y-1 text-left">
                                    <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-[10px] uppercase appearance-none text-left" value={formData.signatoryId} onChange={e => setFormData({...formData, signatoryId: e.target.value})}>
                                        <option value="">Default Brand Signatory</option>
                                        {(settings.supervisors || []).filter(s => s.role === 'STAFF').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-right flex flex-col items-end">
                            <div className="flex items-center gap-12 text-[10px] font-black text-slate-400 uppercase px-4"><span>Subtotal Gross</span><span>{formatCurrency(subtotal)}</span></div>
                            {formData.isTaxable && <div className="flex items-center gap-12 text-[10px] font-black text-slate-400 uppercase px-4"><span>GST (9%)</span><span>{formatCurrency(gst)}</span></div>}
                            <div className="mt-4 p-8 bg-slate-900 text-white rounded-[2rem] w-full flex items-center justify-between shadow-2xl">
                                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Total Amount</span>
                                <span className="text-3xl font-black tabular-nums">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
           </div>

           <div className="hidden xl:flex w-[480px] bg-slate-100 rounded-[3rem] p-10 flex flex-col items-center border border-slate-200 shadow-inner overflow-y-auto no-scrollbar relative">
                <div className="absolute top-10 left-10"><Info className="text-slate-300" size={48}/></div>
                <div className="sticky top-0 w-full flex flex-col items-center">
                    <div className="scale-[0.55] origin-top shadow-2xl bg-white p-1">
                        <DocLayout 
                            doc={{ ...formData, subtotal, gstAmount: gst, totalAmount: total } as Invoice} 
                            profile={activeProfile} 
                            settings={settings}
                            title={formData.type || 'DOCUMENT'}
                            id="doc-creation-preview"
                        />
                    </div>
                    <div className="mt-10 text-center space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2 justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div> 
                            Synchronized A4 Simulation
                        </p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase leading-relaxed max-w-xs">Values and signatories update in real-time as you draft your document.</p>
                    </div>
                </div>
           </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex flex-col animate-fade-in">
             <header className="p-8 border-b border-white/5 flex justify-between items-center text-white shrink-0">
                 <div className="flex items-center gap-6">
                     <button onClick={() => setView('LIST')} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left"><ArrowLeft size={24}/></button>
                     <div className="text-left">
                        <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-left">{selectedInvoice?.entityName}</h3>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-2 text-left">{selectedInvoice?.type} • REF: {selectedInvoice?.invoiceNo}</p>
                     </div>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => { setFormData(selectedInvoice!); setView('CREATE'); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Edit2 size={16}/> Modify Draft</button>
                    <button onClick={async () => {
                         if (typeof (window as any).html2pdf === 'undefined') {
                            alert('PDF Engine loading, please try again in a moment.');
                            return;
                         }
                         const element = document.getElementById('doc-print-area');
                         if (!element) return;
                         const opt = { margin: 0, filename: `${selectedInvoice?.type}_${selectedInvoice?.invoiceNo}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
                         // @ts-ignore
                         await window.html2pdf().set(opt).from(element).save();
                    }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all"><Download size={18}/> Export PDF Archive</button>
                 </div>
             </header>
             <div className="flex-1 overflow-y-auto no-scrollbar p-10 flex justify-center bg-slate-900/50">
                <div className="origin-top scale-[0.9] lg:scale-[1]">
                    <DocLayout 
                        doc={selectedInvoice!} 
                        profile={profiles.find(p => p.id === selectedInvoice?.issuingCompanyId) || profiles[0]} 
                        settings={settings}
                        title={selectedInvoice?.type || 'DOCUMENT'} 
                    />
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;