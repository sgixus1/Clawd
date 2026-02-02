import React, { useState, useEffect } from 'react';
import { CompanyDetails, ClientDetails, Item, TabView, SavedQuotation } from './types';
import { CompanyProfile } from './components/CompanyProfile';
import { ItemMaster } from './components/ItemMaster';
import { QuotationEditor } from './components/QuotationEditor';
import { SavedQuotations } from './components/SavedQuotations';
import { ClientManager } from './components/ClientManager';
import { ArrowLeft, RefreshCw, Loader2, Users, FileText, LayoutGrid, Building2, Archive } from 'lucide-react';
import { Button } from './components/Button';
import { getSettings, saveSettings, getItems, getQuotations, saveQuotations, getClients, saveClients } from './utils';
import { SAMPLE_TERMS, SAMPLE_EXCLUSIONS } from './constants';

const INITIAL_CLIENT: ClientDetails = {
  name: '',
  company: '',
  address: '',
  phone: '',
  email: ''
};

export const QuotationApp: React.FC<{onBack: () => void}> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabView | 'CLIENTS'>(TabView.QUOTATION);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [client, setClient] = useState<ClientDetails>(INITIAL_CLIENT);
  const [items, setItems] = useState<Item[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [savedQuotations, setSavedQuotations] = useState<SavedQuotation[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<SavedQuotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      const [dbSettings, dbItems, dbQuotes, dbClients] = await Promise.all([
        getSettings(),
        getItems(),
        getQuotations(),
        getClients()
      ]);
      
      setCompany(dbSettings as unknown as CompanyDetails);
      setItems(dbItems || []);
      setSavedQuotations(dbQuotes || []);
      setClients(dbClients || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, [activeTab]); 

  const handleUpdateCompany = async (details: CompanyDetails) => {
    setCompany(details);
    await saveSettings(details as any);
  };

  const handleSaveQuotation = async (data: Partial<SavedQuotation>) => {
    if (!company) return;
    const newQuote: SavedQuotation = {
      id: editingQuotation?.id || Date.now().toString(),
      ref: data.ref || '',
      date: new Date().toISOString(),
      projectTitle: data.projectTitle || '',
      company,
      client,
      items: data.items || [],
      terms: data.terms || SAMPLE_TERMS,
      exclusions: data.exclusions || SAMPLE_EXCLUSIONS,
      internalNotes: data.internalNotes,
      lastModified: Date.now()
    };

    const current = await getQuotations();
    const exists = current.findIndex(q => q.id === newQuote.id);
    const updated = exists > -1 
        ? current.map(q => q.id === newQuote.id ? newQuote : q)
        : [newQuote, ...current];
    
    await saveQuotations(updated);
    setSavedQuotations(updated);

    alert("Quotation archived to SQL database.");
  };

  const handleLoadQuotation = (quote: SavedQuotation) => {
    setClient(quote.client);
    setEditingQuotation(quote);
    setActiveTab(TabView.QUOTATION);
  };

  const handleResetForm = () => {
      if(confirm("Discard current draft and clear all fields?")) {
          setClient(INITIAL_CLIENT);
          setEditingQuotation(null);
      }
  };

  if (isLoading && !company) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing SQL Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-left">
      <nav className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all">
             <ArrowLeft size={20}/>
          </button>
          <div className="h-8 w-px bg-slate-100"></div>
          <div className="text-left">
             <span className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">Quotation <span className="text-indigo-600">Lab</span></span>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Estimator</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab(TabView.QUOTATION)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === TabView.QUOTATION ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16}/> Drafting
          </button>
          <button 
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'CLIENTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={16}/> Clients
          </button>
          <button 
            onClick={() => setActiveTab(TabView.ITEMS)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === TabView.ITEMS ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid size={16}/> Items
          </button>
          <button 
            onClick={() => setActiveTab(TabView.SAVED_QUOTES)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === TabView.SAVED_QUOTES ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Archive size={16}/> Archives
          </button>
          <button 
            onClick={() => setActiveTab(TabView.COMPANY)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === TabView.COMPANY ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Building2 size={16}/> Profile
          </button>
        </div>

        <div className="flex gap-2">
            {activeTab === TabView.QUOTATION && (
                <button onClick={handleResetForm} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all">
                    <RefreshCw size={20}/>
                </button>
            )}
        </div>
      </nav>

      <main className="flex-1 overflow-hidden">
        {activeTab === TabView.QUOTATION && (
          <QuotationEditor 
            items={items} 
            company={company!} 
            client={client} 
            clients={clients}
            loadedQuotation={editingQuotation}
            onSaveQuotation={handleSaveQuotation}
            onUpdateClient={setClient}
          />
        )}
        {activeTab === 'CLIENTS' && (
          <ClientManager 
            clients={clients} 
            onUpdate={async (updated) => { setClients(updated); await saveClients(updated); }} 
          />
        )}
        {activeTab === TabView.ITEMS && (
          <ItemMaster 
            items={items} 
          />
        )}
        {activeTab === TabView.SAVED_QUOTES && (
          <SavedQuotations 
            quotations={savedQuotations} 
            onLoad={handleLoadQuotation}
            onDelete={async (id) => { 
                if(confirm("Delete quotation?")) {
                    const updated = savedQuotations.filter(q => q.id !== id);
                    await saveQuotations(updated);
                    setSavedQuotations(updated);
                }
            }}
            onImport={async (data) => {
                const updated = [...data, ...savedQuotations];
                await saveQuotations(updated);
                setSavedQuotations(updated);
            }}
          />
        )}
        {activeTab === TabView.COMPANY && (
          <CompanyProfile 
            company={company!} 
            client={client}
            onUpdateCompany={handleUpdateCompany}
            onUpdateClient={setClient}
          />
        )}
      </main>
    </div>
  );
};