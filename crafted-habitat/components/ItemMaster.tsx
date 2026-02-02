import React, { useState, useEffect, useMemo } from 'react';
import { Item } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { 
  Plus, Search, Trash2, Edit2, Check, X, 
  TrendingUp, DollarSign, Info, RotateCcw, 
  Loader2, Filter, ArrowUp, ArrowDown, Calculator,
  // Fix: Added missing Archive and Landmark icons
  Archive, Landmark
} from 'lucide-react';
import { STANDARD_SITE_JOBS } from '../constants';
import { getItems, saveItems, formatCurrency } from '../utils';

interface ExtendedItem extends Item {
    costPrice?: number;
    lastPriceUpdate?: string;
}

const CONSTRUCTION_CATEGORIES = [
  'PRELIMINARIES', 'DEMOLITION', 'EXCAVATION', 'STRUCTURAL', 
  'MASONRY', 'PLUMBING', 'ELECTRICAL', 'CARPENTRY', 
  'ARCHITECTURAL', 'GENERAL', 'MISC'
];

export const ItemMaster: React.FC<{ items: Item[] }> = ({ items: initialItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempItem, setTempItem] = useState<Partial<ExtendedItem>>({});
  const [sqlItems, setSqlItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCatalog = async () => {
    setIsLoading(true);
    try {
        const data = await getItems();
        setSqlItems(data || []);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => { refreshCatalog(); }, []);

  const filteredItems = sqlItems.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a,b) => a.category.localeCompare(b.category));

  const handleSave = async () => {
    if (!tempItem.description || !tempItem.unitPrice) return;
    setIsLoading(true);
    try {
        let updated: Item[];
        if (editingId) {
          updated = sqlItems.map(m => m.id === editingId ? { ...tempItem, id: editingId } as Item : m);
          setEditingId(null);
        } else {
          updated = [{ ...tempItem, id: 'ITM_' + Date.now(), lastPriceUpdate: new Date().toISOString() } as Item, ...sqlItems];
          setIsAdding(false);
        }
        await saveItems(updated);
        setSqlItems(updated);
    } finally {
        setIsLoading(false);
        setTempItem({});
    }
  };

  const handleBulkAdjustment = async (percent: number) => {
      if (!confirm(`Apply ${percent}% price adjustment to ${selectedCategory === 'ALL' ? 'ALL items' : `all ${selectedCategory} items`}?`)) return;
      setIsLoading(true);
      const updated = sqlItems.map(it => {
          if (selectedCategory === 'ALL' || it.category === selectedCategory) {
              const newPrice = Number((it.unitPrice * (1 + percent/100)).toFixed(2));
              return { ...it, unitPrice: newPrice };
          }
          return it;
      });
      await saveItems(updated);
      setSqlItems(updated);
      setIsLoading(false);
  };

  const renderInputs = () => (
    <>
      <div className="col-span-1"><Input value={tempItem.code || ''} onChange={e => setTempItem({...tempItem, code: e.target.value.toUpperCase()})} placeholder="CODE" className="h-10 text-[10px] font-black uppercase" /></div>
      <div className="col-span-2">
        <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/5" value={tempItem.category} onChange={e => setTempItem({...tempItem, category: e.target.value})}>
          <option value="">Choose Category...</option>
          {CONSTRUCTION_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="col-span-4"><Input value={tempItem.description || ''} onChange={e => setTempItem({...tempItem, description: e.target.value.toUpperCase()})} placeholder="Item Specification..." className="h-10 text-[11px] font-bold uppercase" /></div>
      <div className="col-span-1"><Input value={tempItem.unit || ''} onChange={e => setTempItem({...tempItem, unit: e.target.value.toUpperCase()})} placeholder="UOM" className="h-10 text-[10px] text-center font-black uppercase" /></div>
      <div className="col-span-2"><Input type="number" value={tempItem.unitPrice || ''} onChange={e => setTempItem({...tempItem, unitPrice: parseFloat(e.target.value)})} placeholder="Selling Rate" className="h-10 text-sm font-black text-indigo-600" /></div>
      <div className="col-span-2 flex justify-center gap-2">
        <button onClick={handleSave} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/10"><Check size={18}/></button>
        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 bg-rose-50 text-rose-500 rounded-xl"><X size={18}/></button>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in text-left flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div className="text-left">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Price Catalog</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-3">Construction Cost Management Registry</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleBulkAdjustment(5)} className="rounded-2xl bg-white border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest px-6" icon={<ArrowUp size={14}/>}>+5% Inflation</Button>
          <Button onClick={() => { setEditingId(null); setTempItem({ category: 'GENERAL', unit: 'LS', unitPrice: 0 }); setIsAdding(true); }} icon={<Plus size={18}/>} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 py-4 shadow-xl shadow-indigo-600/20 font-black text-[10px] uppercase tracking-widest">New Specification</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col flex-1 relative">
        <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="Filter by description or trade code..." 
              className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/5 outline-none text-sm font-bold shadow-sm transition-all text-left"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
              <Filter size={16} className="text-slate-400" />
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/5 appearance-none min-w-[200px]" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="ALL">Show All Categories</option>
                  {CONSTRUCTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
          </div>
          {isLoading && <div className="absolute right-8 bottom-8 z-50 p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"><Loader2 className="animate-spin" size={20}/><span className="text-[9px] font-black uppercase tracking-widest">SQL Syncing</span></div>}
        </div>

        <div className="grid grid-cols-12 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] sticky top-0 z-10 px-6 py-4 shrink-0">
          <div className="col-span-1">Ref</div>
          <div className="col-span-2">Trade</div>
          <div className="col-span-4">Specification Details</div>
          <div className="col-span-1 text-center">Unit</div>
          <div className="col-span-2 text-right">Selling Rate</div>
          <div className="col-span-2 text-center">Manage</div>
        </div>

        <div className="divide-y divide-slate-50 overflow-y-auto no-scrollbar flex-1 p-2">
          {isAdding && <div className="grid grid-cols-12 p-6 gap-4 bg-indigo-50/50 items-center rounded-3xl mb-2 animate-in slide-in-from-top-2">{renderInputs()}</div>}
          {filteredItems.map(item => (
            <div key={item.id} className={`grid grid-cols-12 hover:bg-slate-50/80 transition-all group items-center px-6 py-4 rounded-2xl ${editingId === item.id ? 'bg-indigo-50 shadow-inner' : ''}`}>
              {editingId === item.id ? (
                <div className="col-span-12 grid grid-cols-12 gap-4 items-center">{renderInputs()}</div>
              ) : (
                <>
                  <div className="col-span-1 font-mono text-[10px] text-slate-300 font-bold uppercase">{item.code || '—'}</div>
                  <div className="col-span-2 text-[10px] text-indigo-600 font-black uppercase tracking-tighter truncate">{item.category}</div>
                  <div className="col-span-4 font-bold text-slate-800 text-xs uppercase leading-tight pr-4">{item.description}</div>
                  <div className="col-span-1 text-center text-slate-400 uppercase text-[10px] font-black">{item.unit || 'LS'}</div>
                  <div className="col-span-2 text-right tabular-nums font-black text-indigo-700 text-sm tracking-tight">{formatCurrency(item.unitPrice)}</div>
                  <div className="col-span-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingId(item.id); setTempItem(item); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-indigo-100"><Edit2 size={16}/></button>
                    <button onClick={async () => { if(confirm('Purge spec?')) { const u = sqlItems.filter(i=>i.id!==item.id); setSqlItems(u); await saveItems(u); } }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm transition-all border border-transparent hover:border-rose-100"><Trash2 size={16}/></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredItems.length === 0 && !isAdding && !isLoading && (
            <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4">
                <Archive size={64}/>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Price book empty in this segment</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-8 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark size={140} className="text-white" /></div>
          <div className="flex items-center gap-6 relative z-10 text-left">
              <div className="p-4 bg-indigo-500 rounded-3xl shadow-xl shadow-indigo-500/20"><Calculator size={28}/></div>
              <div>
                  <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-400">Yield Engineering</h4>
                  <p className="text-xl font-black mt-1 uppercase tracking-tight">Active Catalog: {sqlItems.length} Trade Rates</p>
              </div>
          </div>
          <div className="flex gap-10 relative z-10 px-8 border-l border-white/10 text-left">
              <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Average Rate</p>
                  <p className="text-2xl font-black text-white tabular-nums">${Math.round(sqlItems.reduce((s,i)=>s+i.unitPrice, 0) / (sqlItems.length || 1)).toLocaleString()}</p>
              </div>
          </div>
      </div>
    </div>
  );
};