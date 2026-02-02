import React, { useState, useEffect, useMemo, useRef } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { 
  Download, Loader2, Monitor, ArrowLeft, Folder, 
  Image as ImageIcon, Upload, Calendar, 
  ChevronRight, ChevronDown
} from 'lucide-react';

interface ProcessedFile {
  id: string;
  originalName: string;
  originalFile: File;
  date: Date;
  year: number;
  month: number;
  day: number;
  path: string;
}

interface FolderNode {
  name: string;
  type: 'root' | 'year' | 'month' | 'day';
  path: string;
  children: Record<string, FolderNode>;
  files: ProcessedFile[];
  isOpen?: boolean;
}

interface WhatsAppAppProps {
  onBack: () => void;
}

// --- SUBCOMPONENT: Moved out of body ---
const FolderItem: React.FC<{ 
  node: FolderNode; 
  depth?: number; 
  selectedPath: string; 
  expandedPaths: Set<string>; 
  onSelect: (node: FolderNode) => void; 
  onToggle: (path: string) => void; 
}> = ({ node, depth = 0, selectedPath, expandedPaths, onSelect, onToggle }) => {
  const isSelected = selectedPath === node.path;
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren = Object.keys(node.children).length > 0;
  let Icon = Folder;
  if (node.type === 'year') Icon = Calendar;
  if (node.type === 'day') Icon = ImageIcon;

  return (
      <div className="select-none">
          <div 
            className={`flex items-center px-3 py-1.5 cursor-pointer text-sm transition-colors border-l-2 ${
                isSelected 
                ? 'bg-emerald-900/30 border-emerald-50 text-white' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => onSelect(node)}
          >
              {hasChildren ? (
                  <button onClick={(e) => { e.stopPropagation(); onToggle(node.path); }} className="p-0.5 mr-1 rounded hover:bg-white/10 text-slate-500">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
              ) : <span className="w-5"></span>}
              <Icon size={14} className={`mr-2 flex-shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="truncate flex-1">{node.name}</span>
              <span className="ml-2 text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {node.files.length || Object.keys(node.children).length}
              </span>
          </div>
          {isExpanded && (
              <div>
                  {(Object.values(node.children) as FolderNode[])
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                    .map(child => (
                      <FolderItem 
                        key={child.path} 
                        node={child} 
                        depth={depth + 1} 
                        selectedPath={selectedPath} 
                        expandedPaths={expandedPaths} 
                        onSelect={onSelect} 
                        onToggle={onToggle}
                      />
                    ))
                  }
              </div>
          )}
      </div>
  );
};

export const WhatsAppApp: React.FC<WhatsAppAppProps> = ({ onBack }) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractDateFromFilename = (filename: string, lastModified: number): Date => {
    const dateRegex = /(20\d{2})(\d{2})(\d{2})/;
    const match = filename.match(dateRegex);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]);
      const day = parseInt(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
         return new Date(year, month - 1, day);
      }
    }
    return new Date(lastModified);
  };

  const processFiles = (fileList: File[]): ProcessedFile[] => {
    const processed: ProcessedFile[] = [];
    fileList.forEach(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
      const date = extractDateFromFilename(file.name, file.lastModified);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthName = date.toLocaleString('default', { month: 'long' });
      const monthFolder = `${month.toString().padStart(2, '0')} - ${monthName}`;
      const dayFolder = day.toString().padStart(2, '0');
      const path = `${year}/${monthFolder}/${dayFolder}`;
      processed.push({
        id: Math.random().toString(36).substr(2, 9),
        originalName: file.name,
        originalFile: file,
        date, year, month, day, path
      });
    });
    return processed;
  };

  const buildFolderTree = (files: ProcessedFile[]): FolderNode => {
    const root: FolderNode = { name: 'Organized Media', type: 'root', path: '', children: {}, files: [] };
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = root;
      parts.forEach((part, index) => {
        if (!current.children[part]) {
          let type: 'year' | 'month' | 'day' = 'year';
          if (index === 1) type = 'month';
          if (index === 2) type = 'day';
          current.children[part] = {
            name: part, type, path: current.path ? `${current.path}/${part}` : part, children: {}, files: []
          };
        }
        current = current.children[part];
      });
      current.files.push(file);
    });
    return root;
  };

  useEffect(() => {
    if (files.length > 0) {
      const tree = buildFolderTree(files);
      setFolderTree(tree);
      if (!selectedFolder) {
        setSelectedFolder(tree);
        const initialExpanded = new Set<string>();
        Object.values(tree.children).forEach(c => initialExpanded.add(c.path));
        setExpandedPaths(initialExpanded);
      }
    }
  }, [files]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setIsProcessing(true);
        const fileList = Array.from(e.target.files) as File[];
        setTimeout(() => {
            const processed = processFiles(fileList);
            setFiles(prev => [...prev, ...processed]);
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 100);
    }
  };

  const handleDownloadZip = async () => {
    if (!folderTree || files.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const addNodeToZip = (node: FolderNode, zipFolder: JSZip) => {
        node.files.forEach(file => { zipFolder.file(file.originalName, file.originalFile); });
        Object.values(node.children).forEach(child => {
          const childFolder = zipFolder.folder(child.name);
          if (childFolder) addNodeToZip(child, childFolder);
        });
      };
      addNodeToZip(folderTree, zip);
      const content = await zip.generateAsync({ type: "blob", compression: "STORE" }, (m) => setZipProgress(m.percent));
      saveAs(content, "whatsapp-organized.zip");
    } catch (e) { console.error(e); } finally { setIsZipping(false); setZipProgress(0); }
  };

  const toggleFolder = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const visibleFiles = useMemo(() => {
    if (!selectedFolder) return [];
    const collectFiles = (node: FolderNode): ProcessedFile[] => {
      let collected = [...node.files];
      Object.values(node.children).forEach(child => { collected = [...collected, ...collectFiles(child)]; });
      return collected;
    };
    return collectFiles(selectedFolder).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedFolder]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 z-10">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft size={20} /></button>
            <h1 className="font-bold text-lg text-white leading-tight flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div> WhatsApp Media Organizer
            </h1>
         </div>
         <div className="flex items-center gap-3">
             <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFilesSelected} />
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-md text-sm font-medium transition-colors border border-slate-700">
                <Upload size={16} /> Upload
             </button>
             {files.length > 0 && (
                <button onClick={handleDownloadZip} disabled={isZipping} className={`flex items-center gap-2 px-5 py-2 rounded-md font-medium text-sm transition-all shadow-lg ${isZipping ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                    {isZipping ? <><Loader2 size={16} className="animate-spin" /> {zipProgress.toFixed(0)}%</> : <><Download size={16} /> Download ZIP</>}
                </button>
             )}
         </div>
      </header>

      {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in relative">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-800"><ImageIcon size={40} className="text-slate-500" /></div>
              <h2 className="text-2xl font-bold text-white mb-2">WhatsApp Media Organizer</h2>
              <p className="text-slate-400 max-w-md mb-8">Drag & Drop WhatsApp images here to organize them automatically.</p>
              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700">Select Files</button>
          </div>
      ) : (
          <div className="flex flex-1 overflow-hidden">
              <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
                  <div className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Directories</span>
                      <button onClick={() => setExpandedPaths(new Set())} className="hover:text-slate-300">Collapse</button>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
                      {folderTree && (
                        <FolderItem 
                          node={folderTree} 
                          selectedPath={selectedFolder?.path || ''} 
                          expandedPaths={expandedPaths} 
                          onSelect={setSelectedFolder} 
                          onToggle={toggleFolder}
                        />
                      )}
                  </div>
              </aside>
              <main className="flex-1 bg-slate-950 overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-950/95 backdrop-blur z-10 py-2 border-b border-slate-900">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">{selectedFolder?.path.replace(/\//g, ' > ') || 'All Files'}</h2>
                      <span className="text-sm text-slate-500 font-mono bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{visibleFiles.length} items</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {visibleFiles.map(file => (
                          <div key={file.id} className="group relative aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 hover:border-emerald-500 transition-colors">
                              {file.originalFile.type.startsWith('video') ? <div className="w-full h-full flex items-center justify-center text-slate-600"><Monitor size={32} /></div> : <img src={URL.createObjectURL(file.originalFile)} alt={file.originalName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-[10px] text-white font-mono truncate">{file.originalName}</p>
                                  <p className="text-[9px] text-emerald-300 font-medium mt-0.5">{file.date.toLocaleDateString()}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </main>
          </div>
      )}
    </div>
  );
};