
import React, { useState } from 'react';
import { ArrowLeft, Copy, CheckCircle, Download, Loader2, PenTool, CreditCard, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { ProjectData, OfferStatus } from '../types';
import { generateOfferPDF } from '../services/pdfExporter';
import { calculateEstimates } from '../services/geminiService';
import { AgentControlPanel } from './AgentControlPanel';
import { SignatureModal, PaymentModal } from './ActionModals';
import { signDocument, processStripePayment, notifySlack } from '../services/mockIntegrations';

interface OfferDisplayProps {
  content: string;
  projectData: ProjectData | null;
  onBack: () => void;
}

export const OfferDisplay: React.FC<OfferDisplayProps> = ({ content, projectData, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(0.85);
  
  // Local State for Phase 4 Simulation
  const [status, setStatus] = useState<OfferStatus>('SENT');
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate estimates for the preview header
  const estimates = projectData ? calculateEstimates(projectData) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!projectData) return;
    setIsDownloading(true);
    try {
      await generateOfferPDF(content, projectData);
    } catch (e) {
      console.error(e);
      alert('Грешка при свалянето на PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSign = async (name: string) => {
    if (!projectData) return;
    await signDocument(name);
    setStatus('SIGNED');
    setIsSignModalOpen(false);
    showToast(`🖋️ Договорът е подписан от ${name}. Slack нотификация е изпратена.`);
    notifySlack('sales', `Contract signed by ${name} for ${projectData.location}`);
  };

  const handlePay = async () => {
    if (!projectData) return;
    await processStripePayment(2500); // Mock amount
    setStatus('PAID');
    setIsPayModalOpen(false);
    showToast('💰 Депозитът е получен успешно. Slack нотификация е изпратена към счетоводство.');
    notifySlack('accounting', `Deposit received for ${projectData.location}`);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev - 0.1));

  const renderContent = () => {
    return content.split('\n').map((line, index) => {
      if (line.trim().startsWith('## ') || line.trim().endsWith(':')) {
        // Section Headers
        return (
            <h3 key={index} className="text-lg font-bold mt-8 mb-4 text-zinc-900 border-b border-zinc-100 pb-2">
                {line.replace(/##\s*/, '').replace(/\*+/g, '')}
            </h3>
        );
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        // List items
        return (
          <div key={index} className="flex gap-3 mb-2 pl-2">
             <span className="text-zinc-400">•</span>
             <span className="text-zinc-700 text-sm leading-relaxed">
                 <span dangerouslySetInnerHTML={{ __html: line.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
             </span>
          </div>
        );
      }
      if (line.includes('**')) {
         const parts = line.split(/(\*\*.*?\*\*)/g);
         return (
             <p key={index} className="mb-4 text-zinc-700 text-sm leading-relaxed">
                 {parts.map((part, i) => {
                     if (part.startsWith('**') && part.endsWith('**')) {
                         return <strong key={i} className="font-semibold text-zinc-900">{part.slice(2, -2)}</strong>;
                     }
                     return part;
                 })}
             </p>
         )
      }
      if (!line.trim()) {
        return <div key={index} className="h-3"></div>;
      }
      return <p key={index} className="mb-4 text-zinc-700 text-sm leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up pb-32 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg z-[70] flex items-center gap-3 animate-in slide-in-from-right duration-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 px-4 sm:px-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Обратно към редакция
        </button>
        
        <div className="flex gap-2">
            <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                copied ? 'bg-green-100 text-green-700' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700'
            }`}
            >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Копирано' : 'Копирай текст'}
            </button>

            {projectData && (
                <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Свали PDF' : 'Свали PDF'}
                </button>
            )}
        </div>
      </div>

      {/* Status Bar */}
      {status !== 'SENT' && (
        <div className="mb-6 mx-4 sm:mx-0 bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-800 max-w-5xl mx-auto">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold">
                {status === 'SIGNED' && 'Договорът е подписан успешно. Очаква се плащане на депозит.'}
                {status === 'PAID' && 'Проектът е активиран! Депозитът е получен и екипът е известен.'}
            </span>
        </div>
      )}

      {/* DOCUMENT VIEWER CONTAINER */}
      <div className="relative">
        {/* Zoom Controls Overlay */}
        <div className="sticky top-20 z-10 flex justify-center mb-4 pointer-events-none">
             <div className="bg-white/90 backdrop-blur shadow-lg border border-zinc-200 rounded-full p-1 flex items-center gap-2 pointer-events-auto">
                <button 
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-medium text-zinc-600 w-10 text-center select-none">
                    {Math.round(zoom * 100)}%
                </span>
                <button 
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-zinc-100 rounded-full text-zinc-600 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
             </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="bg-zinc-100/70 border border-zinc-200 rounded-2xl overflow-auto p-8 sm:p-12 flex justify-center min-h-[600px] transition-colors">
            {/* The Document */}
            <div 
                className="bg-white shadow-2xl rounded-sm overflow-hidden print-preview relative text-zinc-900 transition-transform duration-200 ease-out origin-top" 
                style={{ 
                    width: '210mm', 
                    minHeight: '297mm', 
                    transform: `scale(${zoom})`
                }}
            >
                
                {/* Paid Stamp */}
                {status === 'PAID' && (
                    <div className="absolute top-12 right-12 z-10 pointer-events-none">
                        <div className="border-[6px] border-green-600 text-green-600 font-bold px-6 py-2 rounded-lg -rotate-12 text-4xl uppercase opacity-40 mix-blend-multiply">
                            PAID
                        </div>
                    </div>
                )}
                
                <div className="p-12 md:p-16">
                    {/* 1. Header */}
                    <div className="flex justify-between items-center mb-12 border-b border-zinc-100 pb-8">
                        <div className="flex items-center gap-4">
                            <img src="/renovivo_logo.png" alt="Renovivo Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Дата на оферта</p>
                            <p className="text-sm font-medium text-zinc-900">{new Date().toLocaleDateString('bg-BG')}</p>
                        </div>
                    </div>

                    {/* 2. Info Grid (Gray Box) */}
                    {projectData && (
                        <div className="grid grid-cols-2 gap-8 bg-zinc-50 rounded-xl p-8 mb-10 border border-zinc-100">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-3">Клиент</p>
                                <p className="font-bold text-zinc-900 text-lg mb-1">{projectData.client.name || 'Непосочено име'}</p>
                                <p className="text-sm text-zinc-500">{projectData.client.email}</p>
                                <p className="text-sm text-zinc-500">{projectData.client.phone}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-3">Обект</p>
                                <p className="font-medium text-zinc-900 mb-1">{projectData.type}, {projectData.totalArea} м²</p>
                                <p className="text-sm text-zinc-500">{projectData.location}</p>
                                <p className="text-sm text-zinc-500 inline-block bg-white border border-zinc-200 rounded px-2 py-0.5 mt-1">{projectData.level}</p>
                            </div>
                        </div>
                    )}

                    {/* 3. Budget Box */}
                    {estimates && (
                        <div className="border-2 border-zinc-100 rounded-xl p-8 text-center mb-12 bg-white relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 opacity-50"></div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mb-2">Ориентировъчен Бюджет</p>
                            <p className="text-4xl font-bold text-zinc-900 tracking-tight">{estimates.totalRange}</p>
                            <p className="text-xs text-zinc-400 mt-3">*Цената включва труд и груби строителни материали</p>
                        </div>
                    )}
                    
                    {/* 4. Body Content */}
                    <div className="prose prose-zinc prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-zinc-600 prose-li:text-zinc-600">
                    {renderContent()}
                    </div>

                    {/* 5. Footer */}
                    <div className="mt-20 pt-8 border-t border-zinc-100 text-center">
                        <p className="text-xs font-medium text-zinc-900 mb-1">Renovivo Ltd • office@renovivo.bg • +359 888 123 456</p>
                        <p className="text-[10px] text-zinc-400 max-w-md mx-auto">
                            Офертата е валидна 30 дни от датата на издаване. Крайната стойност подлежи на потвърждение след оглед на място и заснемане.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {projectData && (
        <AgentControlPanel projectData={projectData} />
      )}

      {/* Sticky Action Bar (Phase 4) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-md border border-zinc-200 shadow-2xl rounded-2xl p-2 flex gap-2 items-center">
         {status === 'SENT' && (
            <button 
                onClick={() => setIsSignModalOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-all hover:scale-105"
            >
                <PenTool className="w-4 h-4" /> Подпиши Договор
            </button>
         )}

         {status === 'SIGNED' && (
            <button 
                onClick={() => setIsPayModalOpen(true)}
                className="flex items-center gap-2 bg-[#635BFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5249d6] transition-all hover:scale-105 shadow-lg shadow-indigo-200"
            >
                <CreditCard className="w-4 h-4" /> Плати Депозит
            </button>
         )}

         {status === 'PAID' && (
            <div className="px-6 py-3 bg-green-100 text-green-800 rounded-xl font-bold flex items-center gap-2">
                <Check className="w-5 h-5" /> Проектът е Активен
            </div>
         )}
      </div>

      {/* Modals */}
      <SignatureModal 
        isOpen={isSignModalOpen} 
        onClose={() => setIsSignModalOpen(false)} 
        onSign={handleSign}
      />
      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onPay={handlePay}
        amount="3,500 лв."
      />

    </div>
  );
};
