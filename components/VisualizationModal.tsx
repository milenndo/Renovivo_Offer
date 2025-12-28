import React, { useState } from 'react';
import { X, Loader2, Image as ImageIcon, Sparkles, Download, Key } from 'lucide-react';
import { generateRoomVisualization } from '../services/geminiService';

interface VisualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName: string;
}

export const VisualizationModal: React.FC<VisualizationModalProps> = ({ isOpen, onClose, roomName }) => {
  const [style, setStyle] = useState('Modern Minimalist');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [keyError, setKeyError] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setKeyError(false);
    
    // 1. Check/Request API Key via AI Studio shim
    // This is mandatory for gemini-3-pro-image-preview
    if (window.aistudio) {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        } catch (e) {
            console.warn("AI Studio Key Check failed:", e);
        }
    }

    setIsGenerating(true);
    setImageUrl(null);
    try {
      const url = await generateRoomVisualization(roomName, style);
      setImageUrl(url);
    } catch (e) {
      console.error(e);
      alert("Неуспешно генериране. Моля проверете дали API ключът има достъп до Gemini 3 Pro Image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `Renovivo_${roomName}_${style}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left: Controls */}
        <div className="w-full md:w-1/3 bg-zinc-50 p-6 border-r border-zinc-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-[#635BFF]" />
               <h3 className="font-bold text-zinc-900">AI 3D Studio</h3>
             </div>
             <button onClick={onClose} className="md:hidden text-zinc-400"><X className="w-5 h-5"/></button>
          </div>

          <div className="space-y-4 mb-auto">
            <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Помещение</label>
                <div className="text-lg font-medium text-zinc-900">{roomName}</div>
            </div>

            <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase block mb-2">Стил</label>
                <select 
                    value={style} 
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                    <option value="Modern Minimalist">Modern Minimalist</option>
                    <option value="Scandinavian">Scandinavian</option>
                    <option value="Industrial Loft">Industrial Loft</option>
                    <option value="Classic Luxury">Classic Luxury</option>
                    <option value="Boho Chic">Boho Chic</option>
                </select>
            </div>
            
            {keyError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs mt-2 border border-red-100">
                    ⚠️ Необходим е платен API ключ за този модел. Моля, изберете такъв от менюто.
                </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-zinc-200"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isGenerating ? 'Рендиране...' : 'Генерирай Визия'}
          </button>
          
          <div className="mt-4 text-[10px] text-zinc-400 text-center leading-tight">
             * Използва Gemini 3 Pro Image Preview. 
             <br/>Изисква валиден API ключ.
          </div>
        </div>

        {/* Right: Image Preview */}
        <div className="w-full md:w-2/3 bg-zinc-900 flex items-center justify-center relative p-4 min-h-[300px]">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white hidden md:block transition-colors"><X className="w-6 h-6"/></button>
            
            {imageUrl ? (
                <div className="relative group w-full h-full flex items-center justify-center">
                    <img src={imageUrl} alt="AI Render" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in fade-in duration-500" />
                    <button 
                        onClick={handleDownload}
                        className="absolute bottom-4 right-4 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 hover:bg-white"
                    >
                        <Download className="w-4 h-4" /> Save
                    </button>
                </div>
            ) : (
                <div className="text-center text-zinc-500">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-zinc-700 border-t-[#635BFF] rounded-full animate-spin"></div>
                            <p className="text-sm text-zinc-400">AI Архитектът проектира...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <ImageIcon className="w-16 h-16 opacity-20" />
                            <p className="text-sm font-medium opacity-50">Няма генерирано изображение</p>
                            <p className="text-xs max-w-xs mx-auto opacity-30">
                                Натиснете бутона вляво, за да създадете фотореалистична визуализация.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};