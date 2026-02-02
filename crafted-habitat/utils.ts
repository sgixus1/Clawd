/* MASTER UTILS - ALIGNED v10.9 */
import { DEFAULT_COMPANY_SETTINGS } from './constants';

const API_BASE = '/api';

const api = {
  get: async (endpoint: string) => {
    const url = `${API_BASE}/${endpoint}`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`Server Error (${r.status}): ${text.substring(0, 100)}`);
      }
      const contentType = r.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        return r.json();
      }
      throw new Error(`Backend Error: Expected JSON but got ${contentType}. Check server.js logs.`);
    } catch (err: any) {
      console.error(`API_GET_ERROR [${endpoint}]:`, err.message);
      throw err;
    }
  },
  post: async (endpoint: string, data: any) => {
    const url = `${API_BASE}/${endpoint}`;
    try {
      const r = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      if (!r.ok) {
        const text = await r.text();
        throw new Error(`POST failed (${r.status}): ${text.substring(0, 100)}`);
      }
      return r.json();
    } catch (err: any) {
      console.error(`API_POST_ERROR [${endpoint}]:`, err.message);
      throw err;
    }
  },
  delete: async (endpoint: string) => {
    const url = `${API_BASE}/${endpoint}`;
    try {
      const r = await fetch(url, { method: 'DELETE' });
      if (!r.ok) throw new Error(`DELETE failed (${r.status})`);
      return r.json();
    } catch (err: any) {
      console.error(`API_DELETE_ERROR [${endpoint}]:`, err.message);
      throw err;
    }
  }
};

// --- SYSTEM CHECK ---
export const testBackendConnection = async () => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
            const data = await response.json();
            return { success: data.status === 'connected', message: data.status === 'connected' ? "SQL Engine Linked" : "SQL Offline - Check server logs", details: data };
        }
        return { success: false, message: "SQL Server is starting or has crashed." };
    } catch (e) {
        return { success: false, message: "Connection Refused. Start server.js first." };
    }
};

// --- PROJECTS ---
export const getProjects = async () => {
  const raw = await api.get('projects');
  if (!Array.isArray(raw)) return [];
  
  return raw.map((p: any) => {
    let data: any = {};
    try {
        data = typeof p.projectData === 'string' ? JSON.parse(p.projectData) : (p.projectData || {});
    } catch (e) {
        console.error("Critical: Could not parse projectData for ID", p.id);
    }
    
    if (!p.id) return null;

    return { 
        ...p, 
        ...data, 
        id: p.id,
        name: data.name || p.name || "SITE REFERENCE REQUIRED",
        client: data.client || p.client || "CLIENT REQUIRED",
        milestones: data.milestones || [], 
        materials: data.materials || [], 
        laborLogs: data.laborLogs || [],
        subcontractors: data.subcontractors || [],
        variationOrders: data.variationOrders || [],
        defects: data.defects || [],
        documents: data.documents || [],
        dailyUpdates: data.dailyUpdates || [],
        clientPhotos: data.clientPhotos || []
    };
  }).filter(Boolean);
};

export const saveProject = async (p: any) => {
  const { milestones, materials, laborLogs, variationOrders, defects, documents, dailyUpdates, clientPhotos, name, client, ...core } = p;
  const projectData = { milestones, materials, laborLogs, variationOrders, defects, documents, dailyUpdates, clientPhotos, name, client };
  return api.post('projects', { id: p.id, projectData });
};

export const deleteProject = async (id: string) => api.delete(`projects/${id}`);
export const deepSanitizeProject = async (p: any) => JSON.parse(JSON.stringify(p));

// --- WORKFORCE & HR ---
export const getWorkers = () => api.get('workers');
export const saveAllWorkers = (d: any) => api.post('workers', d);
export const saveWorker = async (w: any) => { 
    const current = await getWorkers(); 
    await saveAllWorkers([...current.filter((x:any) => x.id !== w.id), w]); 
};
export const deleteWorker = (id: string) => api.delete(`workers/${id}`);
export const getAttendance = () => api.get('attendance');
export const saveAttendance = (d: any) => api.post('attendance', d);
export const getLeaves = () => api.get('leaves');
export const saveLeaves = (d: any) => api.post('leaves', d);
export const getActiveClockIns = () => api.get('active_clockins');
export const saveActiveClockIns = (d: any) => api.post('active_clockins', d);

// --- FINANCE & ACCOUNTING ---
export const getInvoices = () => api.get('invoices');
export const saveInvoices = (d: any) => api.post('invoices', d);
export const getQuotations = () => api.get('quotations');
export const saveQuotations = (d: any) => api.post('quotations', d);
export const getPayrollRuns = () => api.get('payroll_runs');
export const savePayrollRun = (d: any) => api.post('payroll_runs', d);
export const updatePayrollRun = (d: any) => api.post('payroll_runs', d);
export const deletePayrollRun = (id: string) => api.delete(`payroll_runs/${id}`);
export const getVos = () => api.get('vos');
export const saveVos = (d: any) => api.post('vos', d);
export const getTransactions = () => api.get('transactions');
export const saveTransactions = (d: any) => api.post('transactions', d);
export const getExpenses = () => api.get('expenses');
export const saveExpenses = (d: any) => api.post('expenses', d);
export const getPayments = () => api.get('payments');
export const savePayments = (d: any) => api.post('payments', d);
export const getVouchers = () => api.get('vouchers');
export const saveVouchers = (d: any) => api.post('vouchers', d);
export const getAccountingChecklist = () => api.get('checklist');
export const saveAccountingChecklist = (d: any) => api.post('checklist', d);
export const getLegacyDocuments = () => api.get('legacy_documents');
export const saveLegacyDocuments = (d: any) => api.post('legacy_documents', d);
export const getItems = () => api.get('items');
export const saveItems = (d: any) => api.post('items', d);

// --- CRM & SETTINGS ---
export const getSettings = () => api.get('settings').catch(() => DEFAULT_COMPANY_SETTINGS);
export const saveSettings = (d: any) => api.post('settings', d);
export const getReminders = () => api.get('reminders');
export const saveReminders = (d: any) => api.post('reminders', d);
export const getMilestoneMaster = () => api.get('milestones');
export const saveMilestoneMaster = (d: any) => api.post('milestones', d);
export const getCrmData = () => api.get('crm_data');
export const saveCrmData = (d: any) => api.post('crm_data', d);
export const getClients = () => api.get('clients');
export const saveClients = (d: any) => api.post('clients', d);
export const getPolicies = () => api.get('policies');
export const savePolicy = (d: any) => api.post('policies', d);
export const deletePolicy = (id: string) => api.delete(`policies/${id}`);
export const getCompanyProfiles = () => api.get('company_profiles');
export const saveCompanyProfiles = (d: any) => api.post('company_profiles', d);

// --- MEDIA ---
export const getMediaViewUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    const cleanId = url.replace('/api/media/view/', '').replace('/api/media/', '');
    return `${window.location.origin}/api/media/view/${cleanId}`;
};

export const uploadFileToCloud = async (file: File) => {
    const reader = new FileReader();
    const data = await new Promise((res) => { reader.onloadend = () => res(reader.result); reader.readAsDataURL(file); });
    const response = await api.post('media', { id: `${Date.now()}_${file.name}`, data, mimeType: file.type });
    return response.url;
};

// --- CALCULATIONS & UTILS ---
export const formatCurrency = (n: number, currency: string = 'SGD') => 
    new Intl.NumberFormat('en-SG', { style: 'currency', currency }).format(n || 0);

export const formatDateSG = (d?: string) => d ? new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export const isPublicHoliday = (dateStr: string) => {
    const holidays = [
        '2025-01-01', '2025-01-29', '2025-01-30', '2025-03-31', '2025-04-18', 
        '2025-05-01', '2025-05-12', '2025-06-07', '2025-08-09', '2025-10-20', '2025-12-25'
    ];
    return holidays.includes(dateStr);
};

export const calculateOvertimeMultiplier = (d: string) => (new Date(d).getDay() === 0 || isPublicHoliday(d)) ? 2.0 : 1.5;

export const isExpiringSoon = (d?: string) => d ? (new Date(d).getTime() - Date.now()) < 5184000000 : false;
export const calculateDaysLeft = (d?: string) => d ? Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)) : 0;
export const getHourlyRate = (w: any) => Number(w.salary) || 0;
export const calculateCpfEstimates = (w: number) => ({ employee: w * 0.2, employer: w * 0.17 });
export const scrubDuplicates = (items: any[]) => Array.from(new Map((items || []).map(i => [i.id, i])).values());

export const isOfficeStaff = (w: any) => {
    const title = (w.occupationTitle || '').toUpperCase();
    const officeKeywords = ['ADMIN', 'MANAGER', 'OFFICE', 'DIRECTOR', 'ACCOUNTANT', 'CLERK', 'HR', 'SECRETARY'];
    return officeKeywords.some(keyword => title.includes(keyword));
};

export const calculatePayrollForMonth = (workers: any[], attendance: any[], month: number, year: number) => {
    return workers.map(w => ({
        employeeId: w.id,
        employeeName: w.name,
        hourlyRateUsed: Number(w.salary) || 0,
        totalNormalHours: 0,
        ot15Hours: 0,
        ot20Hours: 0,
        normalPay: 0,
        ot15Pay: 0,
        ot20Pay: 0,
        totalPay: Number(w.salary) || 0
    }));
};
export const getLeaveEntitlements = (w: any) => ({ annual: 7, mc: 14, hosp: 60 });

export const reconcileAllData = async () => ({ success: true });
export const getStorageUsage = () => ({ usedMb: '2.9', percentage: '58' });

export const exportDatabase = async () => { 
  const data: any = {};
  const allTables = [
    'workers', 'invoices', 'transactions', 'attendance', 'leaves', 
    'payroll_runs', 'reminders', 'company_profiles', 'vouchers', 
    'milestones', 'crm_data', 'active_clockins', 'checklist', 
    'payments', 'vos', 'quotations', 'legacy_documents', 'policies', 'items', 'clients', 'projects', 'settings'
  ];
  
  for (const table of allTables) {
      try { 
          const result = await api.get(table); 
          data[table] = result;
      } catch(e) {
          console.warn(`Export: Skipping table ${table} (empty or unavailable)`);
      }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crafted_habitat_FULL_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const importDatabase = async (file: File, callback: () => void) => { 
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = JSON.parse(e.target?.result as string);
    for (const key of Object.keys(data)) {
        try { 
            await api.post(key, data[key]); 
            console.log(`Restore: Success for ${key}`);
        } catch(e) {
            console.error(`Restore: Failed for ${key}`, e);
        }
    }
    callback();
  };
  reader.readAsText(file);
};

export const compressImage = async (file: File, width: number, quality: number, mime?: string): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = width / img.width;
                canvas.width = width;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL(mime || file.type, quality));
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};