import React, { useState, useEffect } from 'react';
import { ProjectForm } from './components/ProjectForm';
import { OfferDisplay } from './components/OfferDisplay';
import { HistoryList } from './components/HistoryList';
import { Inbox } from './components/Inbox';
import { ProjectData, HistoryItem } from './types';
import { generateRenovationOffer, calculateEstimates } from './services/geminiService';
import { Hammer, Sparkles, LayoutList, PlusCircle, Inbox as InboxIcon } from 'lucide-react';

const STORAGE_KEY = 'renovivo_history';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'inbox'>('new');
  const [viewState, setViewState] = useState<'input' | 'result'>('input');
  
  const [offerContent, setOfferContent] = useState<string>('');
  const [currentProjectData, setCurrentProjectData] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved).sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (data: ProjectData, text: string) => {
    const estimates = calculateEstimates(data);
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      projectData: data,
      offerText: text,
      priceRange: estimates.totalRange,
      status: 'SENT' // Default status
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const handleSubmit = async (data: ProjectData) => {
    setIsGenerating(true);
    setError(null);
    setCurrentProjectData(data); // Store for saving later

    try {
      const result = await generateRenovationOffer(data);
      setOfferContent(result);
      saveToHistory(data, result);
      setViewState('result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setCurrentProjectData(item.projectData);
    setOfferContent(item.offerText);
    
    // Determine where to go? Let's go to input form with pre-filled details
    setActiveTab('new');
    setViewState('input');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-zinc-200">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setActiveTab('new'); setViewState('input'); }}>
            <div className="bg-black text-white p-1.5 rounded-md">
                <Hammer className="w-5 h-5" />
            </div>
                        <img src="/RENOVIVO_black.png" alt="Renovivo" style={{height: "40px"}} />
          </div>
          
          {/* Tabs */}
          <div className="flex bg-zinc-100 p-1 rounded-lg">
             <button 
                onClick={() => { setActiveTab('new'); setViewState('input'); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
             >
                <PlusCircle className="w-4 h-4" />
                Нова Оферта
             </button>
             <button 
                onClick={() => { setActiveTab('history'); setViewState('input'); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
             >
                <LayoutList className="w-4 h-4" />
                История
             </button>
             <button 
                onClick={() => { setActiveTab('inbox'); setViewState('input'); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'inbox' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
             >
                <InboxIcon className="w-4 h-4" />
                Inbox
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">1</span>
             </button>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}

          {activeTab === 'history' && (
             <div className="animate-fade-in">
                <h1 className="text-3xl font-bold tracking-tight mb-8 text-zinc-900">История на офертите</h1>
                <HistoryList items={history} onLoad={handleLoadHistory} />
             </div>
          )}

          {activeTab === 'inbox' && (
            <div className="animate-fade-in">
               <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Multi-Channel Inbox</h1>
                    <p className="text-zinc-500 mt-2">Централизирана комуникация (Email, WhatsApp, SMS)</p>
               </div>
               <Inbox />
            </div>
          )}

          {activeTab === 'new' && (
            <>
              {viewState === 'input' ? (
                <div className="animate-fade-in max-w-3xl mx-auto">
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-bold tracking-tight mb-4 text-zinc-900">Създайте нова оферта</h1>
                        <p className="text-zinc-500 text-lg max-w-lg mx-auto">
                            Попълнете данните за обекта и AI асистентът ще генерира професионална оферта в стила на Renovivo.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 md:p-8">
                        <ProjectForm 
                            onSubmit={handleSubmit} 
                            isGenerating={isGenerating} 
                            initialData={currentProjectData} // Pass this to restore state
                        />
                    </div>
                </div>
              ) : (
                <OfferDisplay 
                    content={offerContent} 
                    projectData={currentProjectData}
                    onBack={() => setViewState('input')} 
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-zinc-900 animate-pulse" />
            </div>
          </div>
          <h3 className="mt-8 text-xl font-medium text-zinc-900">Генериране на оферта...</h3>
          <p className="mt-2 text-zinc-500">Анализиране на квадратурите и дейностите</p>
        </div>
      )}
    </div>
  );
};

export default App;