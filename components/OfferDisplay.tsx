import React, { useState } from 'react';
import { ArrowLeft, Copy, CheckCircle, Download, Loader2 } from 'lucide-react';
import { ProjectData } from '../types';
import { generateOfferPDF } from '../services/pdfExporter';

interface OfferDisplayProps {
  content: string;
  projectData: ProjectData | null;
  onBack: () => void;
}

export const OfferDisplay: React.FC<OfferDisplayProps> = ({ content, projectData, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Simple formatter to make the output look like a document without a heavy MD parser dependency
  // Assuming the model outputs strictly formatted sections as requested.
  const renderContent = () => {
    return content.split('\n').map((line, index) => {
      // Headlines (Sections)
      if (line.trim().startsWith('## ') || line.trim().endsWith(':')) {
        return <h3 key={index} className="text-xl font-semibold mt-8 mb-4 text-zinc-900">{line.replace(/##\s*/, '').replace(/\*+/g, '')}</h3>;
      }
      // Sub-points or lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={index} className="ml-4 pl-2 text-zinc-700 leading-relaxed mb-2 list-none relative before:content-['•'] before:absolute before:-left-4 before:text-zinc-400">
            {line.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </li>
        );
      }
      // Bold text handling
      if (line.includes('**')) {
         const parts = line.split(/(\*\*.*?\*\*)/g);
         return (
             <p key={index} className="mb-4 text-zinc-700 leading-relaxed">
                 {parts.map((part, i) => {
                     if (part.startsWith('**') && part.endsWith('**')) {
                         return <strong key={i} className="font-semibold text-zinc-900">{part.slice(2, -2)}</strong>;
                     }
                     return part;
                 })}
             </p>
         )
      }
      
      // Empty lines
      if (!line.trim()) {
        return <div key={index} className="h-2"></div>;
      }

      // Standard Paragraph
      return <p key={index} className="mb-4 text-zinc-700 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Редакция
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
                {isDownloading ? 'Генериране...' : 'Изтегли PDF'}
                </button>
            )}
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-zinc-100 print-preview">
        <div className="flex items-center gap-3 mb-8 border-b border-zinc-100 pb-8">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Оферта за ремонт</h1>
                <p className="text-zinc-500 text-sm">Renovivo • Generated Proposal</p>
            </div>
        </div>
        
        <div className="prose prose-zinc max-w-none">
          {renderContent()}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 text-center text-zinc-400 text-sm">
            <p>Тази оферта е автоматично генерирана и служи за първоначална ориентация.</p>
        </div>
      </div>
    </div>
  );
};