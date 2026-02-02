
import React, { useState } from 'react';
import { generateItemsFromDescription } from '../services/geminiService';
import { Item } from '../types';
import { Button } from './Button';
import { TextArea } from './Input';
import { Sparkles, Loader2, Plus, X } from 'lucide-react';

interface AIItemGeneratorProps {
  onAddItems: (items: Omit<Item, 'id'>[]) => void;
  onClose: () => void;
}

export const AIItemGenerator: React.FC<AIItemGeneratorProps> = ({ onAddItems, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<Partial<Item>[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const items = await generateItemsFromDescription(prompt);
      setGeneratedItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddAll = () => {
    // Fix: Added category to meet the required properties of Omit<Item, 'id'>
    const cleanItems: Omit<Item, 'id'>[] = generatedItems.map(item => ({
      code: item.code || 'GEN',
      category: item.category || 'AI Generated',
      description: item.description || 'Generated Item',
      unit: item.unit || 'ls',
      unitPrice: item.unitPrice || 0,
    }));
    onAddItems(cleanItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-excel-green to-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-lg">AI Item Generator</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-lg">
              <p>Describe what you need (e.g., "Install 500 sqft of hardwood flooring including underlayment and baseboards") and AI will suggest items for your quotation.</p>
            </div>
            
            <TextArea
              label="Description of Work"
              placeholder="e.g., Renovation of master bedroom including painting walls, installing new ceiling fan, and replacing carpet."
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            {generatedItems.length > 0 && (
              <div className="mt-6 border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                    <tr>
                      <th className="px-4 py-2">Code</th>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Unit</th>
                      <th className="px-4 py-2 text-right">Est. Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-mono text-xs">{item.code}</td>
                        <td className="px-4 py-2">{item.description}</td>
                        <td className="px-4 py-2">{item.unit}</td>
                        <td className="px-4 py-2 text-right">${item.unitPrice?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {generatedItems.length === 0 ? (
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              icon={isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles />}
            >
              {isGenerating ? 'Generating...' : 'Generate Items'}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setGeneratedItems([])}>Back</Button>
              <Button onClick={handleAddAll} icon={<Plus />}>Add to Quote</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
