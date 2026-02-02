
import React, { useState, useMemo, useEffect } from 'react';
import { Worker, RateType, Department, CompanySettings, CrmData } from '../../types';
import { saveWorker, saveAllWorkers, getCrmData } from '../../utils';
import { Button } from '../Button';
import { formatCurrency } from '../../utils';
// Fix: Added missing Info icon import
import { Edit, Trash2, Info } from 'lucide-react';

interface EmployeesViewProps {
  employees: Worker[];
  onUpdate: () => void;
  settings: CompanySettings;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ employees, onUpdate, settings }) => {
  const [showModal, setShowModal] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Worker>>({ 
    rateType: RateType.HOURLY, 
    department: Department.PROJECT_SITE,
    employmentType: 'FULL_TIME',
    company: '',
    wpFinNric: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fix: crmData should be state, not a promise from useMemo
  const [crmData, setCrmData] = useState<CrmData>({ 
    companies: [], 
    nationalities: [], 
    occupations: [], 
    addresses: [] 
  });

  // Fix: Added effect to fetch CRM data asynchronously
  useEffect(() => {
    const loadCrm = async () => {
        const data = await getCrmData();
        if (data) setCrmData(data);
    };
    loadCrm();
  }, []);

  const handleEdit = (emp: Worker) => {
      setNewEmp({...emp});
      setEditingId(emp.id);
      setShowModal(true);
  };

  const handleSave = () => {
    if (!newEmp.name || !newEmp.salary || !newEmp.company) {
        alert("Name, Salary, and Company are required.");
        return;
    }
    
    if (editingId) {
        const updatedEmployees = employees.map((e: Worker) => 
            e.id === editingId 
                ? { ...e, ...newEmp } as Worker
                : e
        );
        saveAllWorkers(updatedEmployees);
    } else {
        const emp: Worker = {
            id: Date.now().toString(),
            name: newEmp.name!,
            workerType: 'LOCAL',
            employmentType: newEmp.employmentType || 'FULL_TIME',
            rateType: newEmp.rateType || RateType.HOURLY,
            department: newEmp.department || Department.PROJECT_SITE,
            salary: Number(newEmp.salary),
            wpFinNric: newEmp.wpFinNric || 'N/A',
            dateOfBirth: newEmp.dateOfBirth || new Date().toISOString(),
            sex: 'MALE',
            nationality: 'SINGAPORE',
            occupationTitle: newEmp.occupationTitle || 'Worker',
            company: newEmp.company!
        };
        saveWorker(emp);
    }

    setShowModal(false);
    setNewEmp({ rateType: RateType.HOURLY, department: Department.PROJECT_SITE, employmentType: 'FULL_TIME' });
    setEditingId(null);
    onUpdate();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Employee Directory</h3>
        <Button onClick={() => { setEditingId(null); setNewEmp({ rateType: RateType.HOURLY, department: Department.PROJECT_SITE, employmentType: 'FULL_TIME', company: settings.name }); setShowModal(true); }}>
            + Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee / Company</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role / Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rate Type</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rate/Salary</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
                {employees.map((e: Worker) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{e.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{e.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-semibold">{e.occupationTitle || e.department}</div>
                        <div className="text-[9px] text-indigo-500 font-black uppercase tracking-tighter">{e.employmentType?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        e.rateType === RateType.HOURLY ? 'bg-green-50 text-green-700 border-green-100' : 
                        e.rateType === RateType.DAILY ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                        {e.rateType || 'MONTHLY'}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-600 text-sm">
                        {formatCurrency(e.salary || 0, settings.currency)}
                        <span className="text-xs text-slate-400 ml-1">
                            /{e.rateType === RateType.HOURLY ? 'hr' : e.rateType === RateType.DAILY ? 'day' : 'mo'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-2">
                        <Button variant="secondary" className="px-2 py-1" onClick={() => handleEdit(e)}><Edit size={14}/></Button>
                    </td>
                </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No employees found.</td></tr>}
            </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg my-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-900 uppercase tracking-tight">{editingId ? 'Update Profile' : 'New Local Employee'}</h3>
            <div className="space-y-5">
              <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.name || ''} onChange={(e) => setNewEmp({...newEmp, name: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">NRIC / FIN</label>
                      <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.wpFinNric || ''} onChange={(e) => setNewEmp({...newEmp, wpFinNric: e.target.value.toUpperCase()})} placeholder="e.g. S1234567A" />
                  </div>
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Company</label>
                      <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.company || ''} onChange={(e) => setNewEmp({...newEmp, company: e.target.value})}>
                          <option value="" disabled>Select Company...</option>
                          {crmData.companies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Role / Designation</label>
                      <input className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.occupationTitle || ''} onChange={(e) => setNewEmp({...newEmp, occupationTitle: e.target.value})} placeholder="e.g. Site Supervisor" />
                  </div>
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Employment Type</label>
                      <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.employmentType} onChange={(e) => setNewEmp({...newEmp, employmentType: e.target.value as any})}>
                          <option value="FULL_TIME">Full Time</option>
                          <option value="PART_TIME">Part Time</option>
                      </select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Rate Type</label>
                      <select className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.rateType} onChange={(e) => setNewEmp({...newEmp, rateType: e.target.value as any})}>
                          {Object.values(RateType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">{newEmp.rateType === RateType.HOURLY ? "Hourly Rate" : newEmp.rateType === RateType.DAILY ? "Daily Rate" : "Monthly Salary"}</label>
                      <input type="number" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none" value={newEmp.salary || ''} onChange={(e) => setNewEmp({...newEmp, salary: Number(e.target.value)})} />
                  </div>
              </div>

               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Info className="text-indigo-400 shrink-0 mt-0.5" size={14}/>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    <strong>Note:</strong> 
                    {newEmp.rateType === RateType.MONTHLY && " Monthly rate converts to hourly for OT via MOM formula (12*Salary)/(52*44)."}
                    {newEmp.rateType === RateType.DAILY && " Daily rate is divided by 8 hours for OT calculation purposes."}
                    {newEmp.rateType === RateType.HOURLY && " Standard hourly rate applies."}
                  </p>
               </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button variant="secondary" className="px-6 py-2 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} className="px-8 py-2 rounded-xl shadow-lg shadow-indigo-600/10">Save Record</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
