
import React, { useState } from 'react';
import { Expense, CompanySettings } from '../../types';
import { saveExpenses } from '../../utils';
import { Button } from '../Button';
import { formatCurrency } from '../../utils';

interface ExpensesViewProps {
  expenses: Expense[];
  onUpdate: () => void;
  settings: CompanySettings;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onUpdate, settings }) => {
    const [newExp, setNewExp] = useState<Partial<Expense>>({ category: 'Petty Cash', date: new Date().toISOString().split('T')[0] });

    const handleAdd = () => {
        if (!newExp.amount || !newExp.description) return;
        const e: Expense = {
            id: Date.now().toString(),
            date: newExp.date!,
            category: newExp.category as any,
            amount: Number(newExp.amount),
            description: newExp.description,
            paidBy: newExp.paidBy || 'Admin'
        };
        saveExpenses([...expenses, e]);
        setNewExp({ category: 'Petty Cash', date: new Date().toISOString().split('T')[0], amount: 0, description: '' });
        onUpdate();
    }

    return (
        <div className="animate-fade-in">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Record Expense</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</label>
                        <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" value={newExp.date} onChange={(e) => setNewExp({...newExp, date: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</label>
                        <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" value={newExp.category} onChange={(e) => setNewExp({...newExp, category: e.target.value as any})}>
                            {['Petty Cash', 'Entertainment', 'Material', 'Other'].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" value={newExp.amount || ''} onChange={(e) => setNewExp({...newExp, amount: Number(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2 flex space-x-2">
                        <div className="flex-1 space-y-1">
                             <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</label>
                             <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" value={newExp.description || ''} onChange={(e) => setNewExp({...newExp, description: e.target.value})} />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleAdd}>Record</Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {expenses.map((e) => (
                            <tr key={e.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">{e.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="bg-yellow-50 text-yellow-700 border border-yellow-100 px-2.5 py-0.5 rounded-full text-xs font-medium">{e.category}</span>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{e.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900">{formatCurrency(e.amount, settings.currency)}</td>
                            </tr>
                        ))}
                        {expenses.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No expenses recorded.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
