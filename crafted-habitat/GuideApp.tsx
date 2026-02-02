
import React, { useState } from 'react';
import { 
  ArrowLeft, BookOpen, ChevronRight, Settings, PlusCircle, 
  HardHat, Calculator, Users, Globe, ShieldCheck, 
  MessageSquare, Layout, CreditCard, DollarSign, Calendar,
  Camera, Info, MousePointer2, FileType, CheckCircle2,
  ListOrdered, Zap, Building2, UserCheck, Stamp, Layers, 
  RefreshCw, Edit2, Plus, Terminal, Share2, Wallet, 
  Search, Bell, Smartphone, AlertTriangle, FileText, 
  FilePlus, ClipboardList, TrendingUp, Hand, Archive,
  ShieldAlert, UserMinus, Timer, Truck, Wrench, Star,
  Briefcase, Activity, Landmark, ScanFace,
  Cloud, ChevronDown, ArrowRight, Box, Check
} from 'lucide-react';

interface GuideAppProps {
  onBack: () => void;
}

// --- Stylized Illustration Component ---
interface BlueprintFrameProps {
  title: string;
  type: string;
  children: React.ReactNode;
}

const BlueprintFrame: React.FC<BlueprintFrameProps> = ({ title, type, children }) => (
    <div className="my-8 rounded-[2.5rem] bg-nature-forest p-1 border-4 border-nature-forest/10 shadow-2xl overflow-hidden group">
        <div className="bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] p-8 min-h-[240px] flex flex-col items-center justify-center relative">
            <div className="absolute top-4 left-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">{type}</span>
            </div>
            <div className="absolute top-4 right-6 text-[8px] font-black text-white/20 uppercase tracking-widest border border-white/10 px-2 py-0.5 rounded">
                Ref: CH-SOP-V1
            </div>
            
            <div className="w-full max-w-md animate-fade-in">
                {children}
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">
                    Fig: {title}
                </p>
            </div>
        </div>
    </div>
);

interface ActionStepProps {
  number: number;
  title: string;
  children?: React.ReactNode;
  visual?: React.ReactNode;
}

const ActionStep: React.FC<ActionStepProps> = ({ number, title, children, visual }) => (
  <div className="flex gap-6 items-start group">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-nature-forest text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
          {number}
      </div>
      <div className="flex-1 space-y-2 pb-8 border-b border-nature-stone/20 last:border-0">
          <h4 className="text-lg font-black uppercase tracking-tight text-nature-forest"></h4>
          <h4 className="text-lg font-black uppercase tracking-tight text-nature-forest">{title}</h4>
          <div className="text-sm text-nature-forest/70 leading-relaxed">
              {children}
          </div>
          {visual && <div className="pt-4">{visual}</div>}
      </div>
  </div>
);

export const GuideApp: React.FC<GuideAppProps> = ({ onBack }) => {
  const [activeTopic, setActiveTopic] = useState<string>('infra-sync');

  const topics = [
    { id: 'infra-sync', label: 'System & Cloud Sync', icon: Globe },
    { id: 'crm-setup', label: 'Company & Recipient CRM', icon: Building2 },
    { id: 'hr-workforce', label: 'Workforce HR (Foreign/Local)', icon: Users },
    { id: 'catalog-mgmt', label: 'Master Price Catalog', icon: ListOrdered },
    { id: 'quotation-lab', label: 'Quotation Engineering', icon: FilePlus },
    { id: 'project-ops', label: 'Project Tracker (Office)', icon: Briefcase },
    { id: 'supervisor-app', label: 'Supervisor Site App', icon: HardHat },
    { id: 'financial-ledger', label: 'General Ledger & AP', icon: CreditCard },
    { id: 'invoice-system', label: 'Invoices, POs & Receipts', icon: FileText },
    { id: 'payroll-engine', label: 'Payroll & MOM Compliance', icon: Calculator },
    { id: 'client-portal', label: 'Customer Transparency', icon: Layout },
    { id: 'notifications', label: 'Team Communication', icon: Bell },
  ];

  const Tip = ({ children, variant = 'warning' }: { children?: React.ReactNode, variant?: 'warning' | 'info' | 'danger' }) => {
      const colors = {
          warning: 'bg-amber-50 border-amber-400 text-amber-900',
          info: 'bg-indigo-50 border-indigo-400 text-indigo-900',
          danger: 'bg-rose-50 border-rose-400 text-rose-900'
      };
      return (
          <div className={`${colors[variant]} border-l-4 p-4 rounded-r-2xl my-4 flex gap-3 items-start shadow-sm`}>
              {variant === 'warning' ? <Zap size={18} className="text-amber-500 shrink-0 mt-0.5"/> : 
               variant === 'info' ? <Info size={18} className="text-indigo-500 shrink-0 mt-0.5"/> :
               <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5"/>}
              <p className="text-xs font-bold uppercase tracking-tight italic">{children}</p>
          </div>
      );
  };

  const TopicContent = () => {
    switch (activeTopic) {
      case 'infra-sync':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Cloud Infrastructure</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Managing the real-time data backbone</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="The Firebase Gateway" visual={
                    <BlueprintFrame title="Gateway Signal Flow" type="SCHEMATIC">
                        <div className="flex items-center justify-center gap-12">
                            <div className="p-4 bg-white/5 border border-white/20 rounded-2xl flex flex-col items-center gap-2">
                                <Smartphone size={24} className="text-white"/>
                                <span className="text-[8px] font-black text-white/40">OFFICE/SITE</span>
                            </div>
                            <div className="flex-1 flex items-center">
                                <div className="h-px bg-emerald-500/50 flex-1 relative">
                                    <RefreshCw size={12} className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 animate-spin-slow" />
                                </div>
                            </div>
                            <div className="p-4 bg-white/10 border border-white/20 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
                                <Cloud size={24} className="text-emerald-400"/>
                                <span className="text-[8px] font-black text-white/40">DATABASE</span>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    The application uses a <strong>Realtime Websocket Gateway</strong>. If the top bar shows "Gateway Pending", click <strong>Infrastructure &gt; Re-test Gateway</strong>. This probes the connection to the cloud database.
                </ActionStep>
                <ActionStep number={2} title="Bidirectional Reconciliation">
                    When multiple supervisors edit site data, use <strong>Rapid Reconcile</strong>. This fetches the master state and merges it with your local changes using a <code>timestamp-guard</code> logic, ensuring the latest update is always preserved.
                </ActionStep>
                <ActionStep number={3} title="Security PIN Management">
                    The system supports 3 security layers: Admin (Full Access), HR (Personnel Records), and Supervisor (Site Logs). Configure these in <strong>Accounting &gt; Settings</strong> to prevent unauthorized access to payroll and profit margins.
                </ActionStep>
            </div>
          </div>
        );
      case 'crm-setup':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Branding & Entities</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Customizing Invoices and document headers</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Entity Management" visual={
                    <BlueprintFrame title="Entity Profile Logic" type="CRM">
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400"><Stamp size={20}/></div>
                                <div className="flex-1">
                                    <div className="h-2 w-24 bg-white/20 rounded mb-1"></div>
                                    <div className="h-1.5 w-32 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-xl shadow-2xl border border-slate-100 relative">
                                <div className="h-2 w-1/2 bg-slate-200 rounded mb-4"></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="h-6 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center text-[6px] font-black text-slate-400">LOGO</div>
                                    <div className="h-6 bg-slate-50 rounded border border-dashed border-slate-200 flex items-center justify-center text-[6px] font-black text-slate-400">SIGNATURE</div>
                                </div>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    Navigate to <strong>Invoice Manager &gt; Entities</strong>. You can add multiple parent/sub-companies. Each entity can have its own logo, bank account, and PayNow UEN.
                </ActionStep>
                <ActionStep number={2} title="Digital Assets">
                    Upload PNG signatures and company stamps. The PDF engine automatically scales these onto Tax Invoices and P.O.s. Use the <strong>Scale Slider</strong> in the document draft to adjust size for pixel-perfect alignment.
                </ActionStep>
            </div>
          </div>
        );
      case 'hr-workforce':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Workforce HR</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Managing Citizenship and Permit compliance</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Foreign Pass Tracking">
                    For Foreign Workers, fill in the <strong>WP Number</strong> and <strong>Pass Expiry Date</strong>. The system calculates "Days Left" and will flag the record in red when within 60 days of expiry.
                </ActionStep>
                <ActionStep number={2} title="Remuneration Types">
                    Assign a <strong>Rate Basis</strong> (Monthly, Daily, or Hourly). This determines how the Payroll Engine calculates the basic wage during monthly cycles.
                </ActionStep>
                <ActionStep number={3} title="Supervisor Visibility">
                    Toggle <strong>"Visible in Supervisor App"</strong>. This controls whether a worker appears in the site clock-in list. High-level staff or office admin should have this disabled.
                </ActionStep>
            </div>
            <Tip variant="danger">Ensure "Employer CPF" is correctly entered for Local staff to automate statutory contribution logic.</Tip>
          </div>
        );
      case 'catalog-mgmt':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Master Price Catalog</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Standardizing project selling rates</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="The CRM Library" visual={
                    <BlueprintFrame title="Standard Library Linkage" type="DATABASE">
                        <div className="flex gap-4 items-stretch h-32">
                            <div className="w-1/3 bg-emerald-900/50 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
                                <span className="text-[6px] font-black text-white/50">CATALOG</span>
                                <Box className="text-emerald-400" size={24}/>
                            </div>
                            <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                                <div className="h-1.5 w-1/2 bg-slate-100 rounded"></div>
                                <div className="h-6 w-full bg-indigo-50 border border-indigo-100 rounded flex items-center px-2">
                                    <span className="text-[6px] font-black text-indigo-400 uppercase">ARCH-001 • $125.00</span>
                                </div>
                                <div className="h-6 w-full bg-indigo-50 border border-indigo-100 rounded flex items-center px-2">
                                    <span className="text-[6px] font-black text-indigo-400 uppercase">STRU-042 • $8,500.00</span>
                                </div>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    The **Master Catalog** stores your standard selling rates (e.g., Brickwall plastering per sqm). Use **Restore Strict Catalog** to populate 200+ industry-standard items from previous A&A projects.
                </ActionStep>
                <ActionStep number={2} title="Reference Coding">
                    Assign a unique Code (e.g., ARCH-01) to each item. This allows you to search and add items to a quotation in seconds by typing the code in the search bar.
                </ActionStep>
            </div>
          </div>
        );
      case 'quotation-lab':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Quotation Engineering</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Building professional client tenders</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="The Template Lab" visual={
                    <BlueprintFrame title="Sectional Hierarchy" type="TEMPLATE">
                        <div className="space-y-2">
                            <div className="p-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">A. PRELIMINARIES</div>
                            <div className="p-3 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest">B. DEMOLITION</div>
                            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-800 uppercase">Total Net Tender Price</span>
                                <span className="text-sm font-black text-indigo-600">$142,000.00</span>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    In the **Quotation Lab**, use **Template Lab** to instantly load preset structures for A&A, Bungalows, or Renovations. This includes all relevant terms and categories.
                </ActionStep>
                <ActionStep number={2} title="Item Population">
                    Open the **Sidebar Library** and click the <Plus size={12} className="inline"/> next to items. Use the **Alloc** dropdown in the breakdown page to move items between sections (e.g. from Structural to Architectural).
                </ActionStep>
                <ActionStep number={3} title="AI Item Generator">
                    Describe your work (e.g., "Full renovation of unit with master bed hacking") and click **Generate**. The Gemini AI will suggest quantities, rates, and detailed descriptions based on current market standards.
                </ActionStep>
            </div>
          </div>
        );
      case 'project-ops':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Project Tracker (Office)</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Site Management and Variation Control</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Timeline Building">
                    Select a site and open the **Timeline** tab. Click **Import Library** to populate the schedule with standard construction phases. Adjust the "Std Duration" to update the Gantt-style logic.
                </ActionStep>
                <ActionStep number={2} title="Variation Orders (VO)" visual={
                    <BlueprintFrame title="VO Claim Pipeline" type="FLOW">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 w-64">
                                <TrendingUp size={16} className="text-rose-400"/>
                                <span className="text-[10px] font-black text-white/60">1. Log Scope Adjustment</span>
                            </div>
                            <ChevronDown size={12} className="text-white/10"/>
                            <div className="p-3 bg-indigo-600 border border-indigo-400 rounded-xl flex items-center gap-3 w-64 shadow-xl">
                                <Share2 size={16} className="text-white"/>
                                <span className="text-[10px] font-black text-white">2. Push to Tax Invoice</span>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    When a client requests additional work, log it in the **Variations** tab. Once detailed, click **Push to Accounting** to instantly generate a Tax Invoice in the finance module.
                </ActionStep>
                <ActionStep number={3} title="Site Defects">
                    Monitor defects reported by the supervisor. Set a "Rectification Deadline". Supervisors can then mark them as "Fixed" and attach photo proof for your review.
                </ActionStep>
            </div>
          </div>
        );
      case 'supervisor-app':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Supervisor Site App</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Live field reporting and attendance</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Worksite Login" visual={
                    <BlueprintFrame title="Mobile Site Check-in" type="MOBILE">
                        <div className="w-48 h-80 bg-slate-950 border-4 border-white/10 rounded-[2.5rem] mx-auto p-4 space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="h-6 w-1/2 bg-white/5 mx-auto rounded-full"></div>
                            <div className="bg-indigo-600 p-3 rounded-xl flex flex-col items-center gap-1 shadow-lg">
                                {/* Fix: Check is now imported from lucide-react */}
                                <Check size={16} className="text-white"/>
                                <span className="text-[6px] font-black text-white uppercase">IN</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2">
                                <div className="h-1 w-full bg-white/10 rounded"></div>
                                <div className="h-1 w-2/3 bg-white/10 rounded"></div>
                                <Camera size={14} className="text-white/20 mx-auto mt-2"/>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    Login with your Supervisor PIN. Select the **Active Worksite** from the dropdown. This ensures all logs and photos are correctly categorized by project.
                </ActionStep>
                <ActionStep number={2} title="Live Site Feed">
                    Capture progress photos throughout the day. Check the **Urgent Alert** box for safety or structural issues to trigger an immediate dashboard notification for the office.
                </ActionStep>
                <ActionStep number={3} title="Overnight Mode">
                    If workers are staying past 7pm, toggle <strong>Overnight Mode</strong>. The system will automatically calculate hours differently to ensure the Payroll Engine captures night-shift OT correctly.
                </ActionStep>
            </div>
          </div>
        );
      case 'financial-ledger':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Ledger & AP</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Cash flow auditing and payables</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Log Direct Transactions">
                    Use the **General Ledger** for direct cash movements like rent or transport. Select "Incoming" for client progress claims and "Expense" for company costs.
                </ActionStep>
                <ActionStep number={2} title="Settling Site Bills">
                    Materials logged by Supervisors appear in **Accounts Payable**. Click **Settle** to record a payment. This automatically posts a balancing "Expense" to the General Ledger.
                </ActionStep>
            </div>
          </div>
        );
      case 'invoice-system':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Invoices & POs</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Generating professional finance documents</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Tax Invoices (AR)">
                    Used for progress claims to clients. Pulls data from **Entity CRM** for headers and bank details. Toggle **GST** to automatically add 9% to the total.
                </ActionStep>
                <ActionStep number={2} title="Purchase Orders (PO)">
                    Standardised ordering for suppliers. Includes **Ship To Site** logic that pulls the specific project address into the delivery field.
                </ActionStep>
                <ActionStep number={3} title="Official Receipts">
                    Generate these after receiving payment. Automatically includes the PayNow reference or Cheque No. from the billing entry.
                </ActionStep>
            </div>
          </div>
        );
      case 'payroll-engine':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Payroll Engine</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Singapore Statutory Wage Calculation</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Calculation Basis" visual={
                    <BlueprintFrame title="Wage Logic Schema" type="ALGORITHM">
                        <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/10 space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-[8px] font-black text-slate-400">UNPAID LEAVE</span>
                                <code className="text-[10px] text-emerald-400">GROSS / 26</code>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-[8px] font-black text-slate-400">OT RATE (1.5x)</span>
                                <code className="text-[10px] text-emerald-400">HOURLY * 1.5</code>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-400">CPF (LOCAL)</span>
                                <code className="text-[10px] text-indigo-400">AUTO-ESTIMATE</code>
                            </div>
                        </div>
                    </BlueprintFrame>
                }>
                    Choose between **Actual Payroll** (based on site logs) or **MOM Declared** (fixed monthly). The system uses a **26-day divisor** for unpaid leave deductions for monthly rated staff.
                </ActionStep>
                <ActionStep number={2} title="Statutory Multipliers">
                    The engine automatically applies 1.5x for OT on workdays and 2.0x for Sundays and Public Holidays. The list of **SG Holidays 2025** is built-in.
                </ActionStep>
                <ActionStep number={3} title="CPF and Levy">
                    For local staff, CPF is estimated based on the latest 2024 CPF tables. For foreign staff, monthly Levy rates are tracked to calculate the total manpower liability.
                </ActionStep>
            </div>
          </div>
        );
      case 'client-portal':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Customer Portal</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Full transparency for Home Owners</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Enabling Access">
                    In **Project Tracker**, toggle "Client Portal Enabled". Set a unique **Portal Key**. Share this key with your client to allow them to enter the secure portal.
                </ActionStep>
                <ActionStep number={2} title="Client View">
                    Clients can see their **Timeline Progress**, **Site Feed photos**, and **Variation Orders**. They cannot see internal costs, payroll, or manpower details.
                </ActionStep>
                <ActionStep number={3} title="Interactive Feedback">
                    Clients can post "Observations" directly from their portal. These appear as blue-flagged updates in the office Site Feed for immediate attention.
                </ActionStep>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-10 animate-fade-in text-left">
            <div>
                <h2 className="text-4xl font-serif font-bold text-nature-forest tracking-tight">Notifications Hub</h2>
                <p className="text-nature-sage text-xs font-black uppercase tracking-[0.3em] mt-2">Team coordination dispatches</p>
            </div>
            <div className="space-y-6">
                <ActionStep number={1} title="Broadcast Dispatches">
                    Use **Global Dispatch** for company-wide news. Every user will see a popup alert upon their next login.
                </ActionStep>
                <ActionStep number={2} title="Targeted Reminders">
                    Assign a notice to a specific staff member. Useful for requesting site clarifications or notifying of bank settlement tasks.
                </ActionStep>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-nature-sand flex flex-col text-left font-sans animate-fade-in">
      <header className="h-20 glass-effect border-b border-nature-stone/30 flex items-center px-8 shrink-0 sticky top-0 z-40">
          <button onClick={onBack} className="flex items-center gap-2 text-nature-forest/60 hover:text-nature-forest font-bold text-sm transition-colors">
              <ArrowLeft size={18}/> Close Guide
          </button>
          <div className="h-6 w-px bg-nature-stone/30 mx-6"></div>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-nature-forest text-white rounded-xl shadow-lg"><BookOpen size={18}/></div>
             <h1 className="text-xl font-serif font-semibold text-nature-forest tracking-tight">Workspace SOP</h1>
          </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
          <aside className="w-80 bg-nature-linen border-r border-nature-stone/20 overflow-y-auto no-scrollbar p-6 space-y-2 shrink-0">
              <p className="px-4 text-[9px] font-black text-nature-sage uppercase tracking-[0.3em] mb-4">Module Entry Guides</p>
              {topics.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveTopic(t.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                        activeTopic === t.id 
                        ? 'bg-nature-forest text-white shadow-xl translate-x-2' 
                        : 'text-nature-forest/40 hover:bg-nature-sand hover:text-nature-forest'
                    }`}
                  >
                      <t.icon size={20} strokeWidth={activeTopic === t.id ? 2.5 : 1.5}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                      {activeTopic === t.id && <ChevronRight size={16} className="ml-auto"/>}
                  </button>
              ))}
          </aside>

          <div className="flex-1 overflow-y-auto p-12 lg:p-20 no-scrollbar">
              <div className="max-w-4xl mx-auto">
                <TopicContent />
                
                <footer className="mt-20 pt-10 border-t border-nature-stone/20 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-nature-stone">
                        <Info size={24}/>
                        <p className="text-[10px] font-bold uppercase tracking-widest italic">
                            Operational Manual v1.1.0 • Technical Visual SOP
                        </p>
                    </div>
                    <button onClick={onBack} className="text-[10px] font-black uppercase text-nature-sage hover:text-nature-forest transition-colors">Return to Workspace</button>
                </footer>
              </div>
          </div>
      </main>
    </div>
  );
};
