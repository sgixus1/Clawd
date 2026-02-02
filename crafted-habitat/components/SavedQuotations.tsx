import React, { useRef, useState } from 'react';
import { SavedQuotation } from '../types';
import { Button } from './Button';
import { Trash2, Edit, Download, Upload, Clock, Search, FolderOpen, FileText } from 'lucide-react';

interface SavedQuotationsProps {
  quotations: SavedQuotation[];
  onLoad: (quotation: SavedQuotation) => void;
  onDelete: (id: string) => void;
  onImport: (data: SavedQuotation[]) => void;
}

export const SavedQuotations: React.FC<SavedQuotationsProps> = ({ 
  quotations, 
  onLoad, 
  onDelete,
  onImport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredQuotes = quotations.filter(q => 
    q.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.ref.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.lastModified - a.lastModified);

  const handleExport = (quote: SavedQuotation) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quote, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Quote_${quote.ref.replace(/[^a-zA-Z0-9]/g, '-')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportAll = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quotations, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `All_Quotes_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          // Import Backup (Array of quotes)
          onImport(json);
        } else if (json.id && json.items) {
          // Import Single Quote
          onImport([json]);
        } else {
          alert("Invalid file format");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse JSON file");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Saved Quotations</h2>
          <p className="text-slate-500">Manage your history and backups.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileUpload}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} icon={<Upload size={16}/>}>
            Import File
          </Button>
          <Button variant="secondary" onClick={handleExportAll} icon={<Download size={16}/>}>
            Export All to Drive
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by client, project, or reference..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-excel-green focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FolderOpen size={48} className="mb-4 opacity-50" />
              <p>No quotations found.</p>
              <p className="text-sm">Create a new one or import a file.</p>
            </div>
          ) : (
            filteredQuotes.map(quote => (
              <div key={quote.id} className="group border border-slate-200 rounded-lg p-4 hover:border-excel-green hover:shadow-md transition-all bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{quote.ref}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(quote.lastModified).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">{quote.client.name}</h3>
                    <p className="text-sm text-slate-600 line-clamp-1">{quote.projectTitle}</p>
                    <div className="mt-2 text-xs font-medium text-slate-500">
                      Items: {quote.items.length} | Total: <span className="text-excel-green text-sm">${quote.items.reduce((acc, i) => acc + i.total, 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" onClick={() => onLoad(quote)} icon={<Edit size={14}/>}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleExport(quote)} icon={<Download size={14}/>}>Save to Drive</Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(quote.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};