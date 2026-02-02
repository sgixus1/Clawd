
export type UserRole = 'admin' | 'staff' | 'supervisor' | 'customer' | null;
export type AppType = 'home' | 'project' | 'quotation' | 'payroll' | 'hr' | 'notifications' | 'archive' | 'directory' | 'invoices' | 'entities' | 'sync' | 'whatsapp' | 'portal' | 'supervisor';

export enum AppView { DASHBOARD = 'DASHBOARD', WORKER_LIST = 'WORKER_LIST', LOCAL_WORKER_LIST = 'LOCAL_WORKER_LIST', ADD_WORKER = 'ADD_WORKER', EDIT_WORKER = 'EDIT_WORKER', INSURANCE = 'INSURANCE', SETTINGS = 'SETTINGS' }
export enum TabView { QUOTATION = 'QUOTATION', SAVED_QUOTES = 'SAVED_QUOTES', ITEMS = 'ITEMS', COMPANY = 'COMPANY' }
export enum RateType { MONTHLY = 'MONTHLY', DAILY = 'DAILY', HOURLY = 'HOURLY' }
export enum Department { OFFICE = 'OFFICE', PROJECT_SITE = 'PROJECT_SITE' }
export enum ProjectStatus { IN_PROGRESS = 'IN_PROGRESS', PLANNING = 'PLANNING', COMPLETED = 'COMPLETED', ACTIVE = 'ACTIVE' }

export interface Worker { 
    id: string; 
    name: string; 
    workerType: 'FOREIGN' | 'LOCAL'; 
    rateType: RateType; 
    department: Department; 
    salary: number; 
    momSalary?: number; 
    levyRate?: number; 
    wpFinNric: string; 
    occupationTitle: string; 
    company: string; 
    dateOfBirth: string; 
    passExpiryDate?: string; 
    cpfAmount?: number; 
    employeeCpf?: number; 
    showInSupervisorApp?: boolean; 
    nationality?: string;
    wpNumber?: string;
    isExcludedFromPayroll?: boolean;
    employmentType?: 'FULL_TIME' | 'PART_TIME';
    sex?: 'MALE' | 'FEMALE';
    passportNo?: string;
    passType?: 'WP' | 'SP' | 'EP' | 'LOCAL';
    medicalExamDate?: string;
    applicationDate?: string;
    passValidity?: string;
    employmentPeriod?: string;
    passIssueDate?: string;
    cancellationDate?: string;
    securityBondNo?: string;
    bondSubmittedDate?: string;
    otPolicy?: string;
    sundayFlatRate?: number;
    stateProvince?: string;
}

export interface AttendanceRecord { 
    id: string; 
    employeeId: string; 
    date: string; 
    hoursWorked: number; 
    overtimeHours: number; 
    projectId?: string; 
    signatureUrl?: string; 
    remarks?: string; 
    hasMealAllowance?: boolean;
    transportClaim?: number;
}

export interface Milestone { 
    id: string; 
    title: string; 
    duration: number; 
    startDate: string; 
    dueDate: string; 
    progress: number; 
    isGroup: boolean; 
    parentId?: string; 
}

export interface Project { 
    id: string; 
    name: string; 
    client: string; 
    location: string; 
    projectType: string; 
    status: ProjectStatus | 'ACTIVE'; 
    progress: number; 
    contractValue: number; 
    budget: number; 
    spent: number; 
    materials: Material[]; 
    milestones: Milestone[]; 
    laborLogs: LaborLog[]; 
    subcontractors: Subcontractor[]; 
    dailyUpdates: DailyUpdate[]; 
    variationOrders?: VariationOrder[]; 
    portalEnabled?: boolean; 
    portalPassword?: string; 
    documents?: ProjectDocument[]; 
    clientPhotos?: ClientPhoto[]; 
    completionPhotos?: any[]; 
    lastUpdated?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
    clientPayments?: any[];
    workers?: any[];
    defects?: Defect[];
}

export interface Invoice { 
    id: string; 
    type: InvoiceType; 
    invoiceNo: string; 
    date: string; 
    dueDate: string; 
    entityName: string; 
    totalAmount: number; 
    status: InvoiceStatus; 
    projectId?: string; 
    lastReminderSent?: string; 
    issuingCompanyId?: string; 
    signatoryId?: string; 
    items: InvoiceItem[]; 
    subtotal: number; 
    gstAmount: number; 
    referenceId?: string;
    entityAddress?: string;
    entityPhone?: string;
    entityEmail?: string;
    discountAmount?: number;
    lessPreviousClaim?: number;
    shippingHandling?: number;
    otherCharges?: number;
    notes?: string;
    jobSite?: string;
    jobSiteAddress?: string;
    issuedBy?: string;
    shippedVia?: string;
    fobPoint?: string;
    paymentMode?: string;
    paymentDetails?: string;
    isTaxable?: boolean;
    descriptionMode?: string;
}

export interface CompanySettings { 
    name: string; 
    address: string; 
    phone: string; 
    email: string; 
    uen?: string; 
    hrPin?: string; 
    adminPassword?: string; 
    adminPin?: string; 
    supervisors?: StaffAccount[]; 
    isGstRegistered?: boolean; 
    logoUrl?: string; 
    userName?: string; 
    userTitle?: string; 
    currency?: string;
    dateFormat?: string;
    website?: string;
    bankAccount?: string;
    bankName?: string;
    remindLevyCpf?: boolean;
    remindOutstandingBills?: boolean;
    supervisorPin?: string;
}

export interface WicPolicy { id: string; provider: string; policyNo: string; expiryDate: string; }
export interface CrmData { companies: string[]; nationalities: string[]; occupations: string[]; addresses: string[]; }

export interface SavedQuotation { 
    id: string; 
    ref: string; 
    projectTitle: string; 
    items: any[]; 
    lastModified: number; 
    client: any; 
    company: any; 
    date: string;
    terms?: string[];
    exclusions?: string[];
    internalNotes?: string[] | string;
    signatoryId?: string;
}

export interface RegistryRow {
    id: string;
    description: string;
    unit?: string;
    quantity: number;
    rate: number;
    total: number;
}

export interface VariationOrderRow extends RegistryRow {}

export interface VariationOrder { 
    id: string; 
    voNo: string; 
    amount: number; 
    date: string; 
    isClaimed?: boolean; 
    rows?: VariationOrderRow[]; 
    signatoryId?: string; 
    issuingCompanyId?: string;
    projectId?: string;
    description?: string;
    attachments?: string[];
}

export interface DashboardStats { totalWorkers: number; foreignWorkersCount: number; localWorkersCount: number; expiringSoon: number; totalSalary: number; totalLevy: number; totalCpf: number; totalEmployerCpf: number; totalEmployeeCpf: number; }

export interface Reminder { 
    id: string; 
    title: string; 
    message: string; 
    remindAt: string; 
    isDismissed: boolean; 
    dismissedBy?: string[]; 
    scope: string; 
    createdBy: string; 
    createdByName?: string; 
    createdAt: string;
    relatedId?: string;
    targetUserIds?: string[];
}

export interface PayrollRun { 
    id: string; 
    period: string; 
    status: string; 
    totalNet: number; 
    payslips: any[]; 
    paymentStatus: PayrollPaymentStatus; 
    startDate?: string;
    endDate?: string;
    paymentDate?: string;
    processedDate?: number;
    totalBasic?: number;
    totalOt15?: number;
    totalOt20?: number;
    totalAllowances?: number;
    totalDeductions?: number;
    totalEmployerCpf?: number;
    totalEmployeeCpf?: number;
    paidAmount?: number;
}

export interface Item {
    id: string;
    code: string;
    category: string;
    description: string;
    unit: string;
    unitPrice: number;
}

export type CompanyDetails = CompanySettings;
export type ClientDetails = {
    name: string;
    company?: string;
    address: string;
    phone: string;
    email: string;
};

export interface QuoteItem extends Item {
    quantity: number;
    total: number;
}

export interface StaffAccount {
    id: string;
    name: string;
    title?: string;
    role: 'STAFF' | 'SUPERVISOR';
    password?: string;
    pin?: string;
    permissions?: string[];
    signatureUrl?: string;
}

export type InvoiceStatus = 'PENDING' | 'SENT' | 'PAID';

export enum LeaveType {
    ANNUAL = 'ANNUAL',
    HALF_DAY_ANNUAL = 'HALF_DAY_ANNUAL',
    MC = 'MC',
    HOSPITALIZATION = 'HOSPITALIZATION',
    UNPAID_LEAVE = 'UNPAID_LEAVE',
    OFF_DAY = 'OFF_DAY',
    HALF_DAY_OFF_DAY = 'HALF_DAY_OFF_DAY',
    UNPAID_MC = 'UNPAID_MC'
}

export interface LeaveRecord {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason: string;
    totalDays: number;
    isPayable?: boolean;
}

export interface Expense {
    id: string;
    date: string;
    category: 'Petty Cash' | 'Entertainment' | 'Material' | 'Other';
    amount: number;
    description: string;
    paidBy: string;
}

export interface OutstandingPayment {
    id: string;
    date: string;
    dueDate: string;
    payee: string;
    amount: number;
    paidAmount: number;
    description: string;
    invoiceNumber?: string;
    category: string;
    isPaid: boolean;
    projectId?: string;
    referenceId?: string;
}

export type TransactionType = 'INCOMING' | 'EXPENSE';

export enum TransactionCategory {
    MATERIALS_PURCHASING = 'MATERIALS_PURCHASING',
    LABOR_SUPPLY = 'LABOR_SUPPLY',
    OTHER_EXPENSES = 'OTHER_EXPENSES',
    VEHICLE_UPKEEP = 'VEHICLE_UPKEEP',
    SUB_CON_PAYMENTS = 'SUB_CON_PAYMENTS',
    MONTHLY_SERVICE = 'MONTHLY_SERVICE',
    SURVEYORS_CLAIM = 'SURVEYORS_CLAIM',
    SERVICE_RENTAL = 'SERVICE_RENTAL',
    RENTAL = 'RENTAL',
    ACCOUNTING_SERVICE = 'ACCOUNTING_SERVICE',
    CREDIT_NOTE = 'CREDIT_NOTE',
    ONE_TIME_SERVICE = 'ONE_TIME_SERVICE',
    PROGRESS_CLAIM = 'PROGRESS_CLAIM',
    VO = 'VO',
    RUBBISH_BIN = 'RUBBISH_BIN',
    UTILITIES_BILLS = 'UTILITIES_BILLS',
    CLAIM = 'CLAIM'
}

export type RecurringFrequency = 'NONE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    gstAmount?: number;
    totalAmount: number;
    description: string;
    projectId?: string;
    referenceId?: string;
    isGstInclusive: boolean;
    isRecurring: boolean;
    frequency: RecurringFrequency;
    createdAt: string;
}

export interface ChecklistItem {
    id: string;
    task: string;
    category: 'TAX' | 'ACRA' | 'INTERNAL';
    completed: boolean;
}

export interface CompanyProfile {
    id: string;
    name: string;
    uen?: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
    stampUrl?: string;
    signatureUrl?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    paynowUen?: string;
    gstRegNo?: string;
}

export interface MilestoneTemplate {
    id: string;
    title: string;
    duration: number;
    isGroup: boolean;
    parentId?: string;
}

export interface LaborLog {
    id: string;
    workerName: string;
    date: string;
    hours?: number;
    hourlyRate?: number;
    amount: number;
    invoiceNo?: string;
    rows?: RegistryRow[];
    images?: string[];
}

export interface Subcontractor {
    id: string;
    name: string;
    date: string;
    service?: string;
    contractAmount: number;
    paidAmount: number;
    amount: number;
    invoiceNo?: string;
    rows?: RegistryRow[];
    images?: string[];
}

export interface LegacyDocument {
    id: string;
    type: 'INVOICE' | 'PO' | 'RECEIPT' | 'VOUCHER' | 'QUOTATION' | 'OTHER';
    classification?: string;
    date: string;
    entityName: string;
    referenceNo: string;
    fileUrl: string;
    amount?: number;
    notes?: string;
    uploadedAt: string;
}

export interface PayrollSummary {
    employeeId: string;
    employeeName: string;
    hourlyRateUsed: number;
    totalNormalHours: number;
    ot15Hours: number;
    ot20Hours: number;
    normalPay: number;
    ot15Pay: number;
    ot20Pay: number;
    totalPay: number;
}

export type MaterialStatus = 'Delivered' | 'Pending' | 'Rejected';

export interface Material {
    id: string;
    name: string;
    materialType?: string;
    supplierName?: string;
    invoiceNo?: string;
    unit?: string;
    costPerUnit?: number;
    quantityUsed?: number;
    amount: number;
    date: string;
    status: MaterialStatus;
    rows?: RegistryRow[];
    images?: string[];
    isSyncedToAccounting?: boolean;
    paidAmount?: number;
}

export interface DailyUpdateReply {
    id: string;
    user: string;
    text: string;
    date: string;
    images?: string[];
}

export interface DailyUpdate {
    id: string;
    date: string;
    description: string;
    user: string;
    images?: string[];
    isUrgent?: boolean;
    replies?: DailyUpdateReply[];
}

export type DefectStatus = 'Pending' | 'Verified' | 'Fixed';

export interface DefectComment {
    user: string;
    text: string;
    date: string;
}

export interface Defect {
    id: string;
    description: string;
    location: string;
    status: DefectStatus;
    isUrgent?: boolean;
    images?: string[];
    comments?: DefectComment[];
}

export type DocCategory = 'DRAWING' | 'PERMIT' | 'METHOD_STATEMENT' | 'APPROVED_MATERIAL';

export interface ProjectDocument {
    id: string;
    name: string;
    type: DocCategory;
    fileUrl: string;
    uploadedAt: string;
}

export interface ClientPhoto {
    id: string;
    url: string;
    description: string;
    date: string;
}

export interface Payslip {
    id: string;
    workerId: string;
    workerName: string;
    workerType: 'FOREIGN' | 'LOCAL';
    designation: string;
    basicSalary: number;
    hourlyRate: number;
    daysWorkedCount: number;
    ot15Hours: number;
    ot20Hours: number;
    ot15Pay: number;
    ot20Pay: number;
    otPolicy?: string;
    sundayFlatRate?: number;
    mealAllowance?: number;
    transportAllowance?: number;
    allowance: number;
    allowanceRemarks?: string;
    deduction: number;
    deductionRemarks?: string;
    employerCpf: number;
    employeeCpf: number;
    netSalary: number;
    modeOfPayment: 'BANK TRANSFER' | 'CASH' | 'CHEQUE';
    remarks?: string;
    company: string;
}

export enum PayrollPaymentStatus {
    UNPAID = 'UNPAID',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID'
}

export interface InvoiceItem {
    id: string;
    type: 'STANDARD' | 'TEXT_BLOCK';
    description: string;
    longDescription?: string;
    uom?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export type InvoiceType = 'AR' | 'AP' | 'PO' | 'RECEIPT';

export interface ActiveClockIn {
    workerId: string;
    clockInTime: string;
    projectId: string;
    isOvernight?: boolean;
}

export interface UnifiedDocument {
    id: string;
    sourceId: string;
    type: string;
    classification: string;
    date: string;
    entity: string;
    ref: string;
    amount: number;
    isLegacy: boolean;
    rawData?: any;
    fileUrl?: string;
}

export interface VoucherItem {
    id: string;
    description: string;
    amount: number;
}

export interface PaymentVoucher {
    id: string;
    payeeName: string;
    date: string;
    items: VoucherItem[];
    totalAmount: number;
    accountCode: string;
    paymentMode: 'CASH' | 'CHEQUE' | 'TRANSFER' | 'PAYNOW';
    chequeNo: string;
    voucherNo: string;
    preparedById: string;
    approvedById: string;
    runId?: string;
    lastModified: number;
    issuingCompanyId?: string;
}

export type AppSettings = CompanySettings;
