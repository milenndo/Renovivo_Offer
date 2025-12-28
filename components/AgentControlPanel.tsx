import React, { useState } from 'react';
import { ProjectData, CommunicationChannel } from '../types';
import { generateSalesFollowUp } from '../services/agents/salesAgent';
import { generateProjectPlan } from '../services/agents/projectManagerAgent';
import { adaptMessage } from '../services/agents/communicationAgent';
import { Briefcase, HardHat, MessageSquare, Copy, Sparkles, Calendar, Box, AlertTriangle, ArrowRight, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface AgentControlPanelProps {
  projectData: ProjectData;
}

export const AgentControlPanel: React.FC<AgentControlPanelProps> = ({ projectData }) => {
  const [activeAgent, setActiveAgent] = useState<'sales' | 'pm' | 'comm'>('sales');
  const [output, setOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastInput, setLastInput] = useState<string>('');

  // Sales State
  const handleSalesAction = async (days: 3 | 7 | 14) => {
    setIsLoading(true);
    try {
      const res = await generateSalesFollowUp(projectData, days);
      setOutput(res);
      setLastInput(res);
    } catch (e) {
      console.error(e);
      setOutput("Error generating follow-up.");
    } finally {
      setIsLoading(false);
    }
  };

  // PM State
  const handlePMAction = async () => {
    setIsLoading(true);
    try {
      const res = await generateProjectPlan(projectData);
      setOutput(res);
      setLastInput(res);
    } catch (e) {
      console.error(e);
      setOutput("Error generating plan.");
    } finally {
      setIsLoading(false);
    }
  };

  // Comm State
  const handleCommAction = async (channel: CommunicationChannel) => {
    if (!lastInput && !output) {
      setOutput("Моля, първо генерирайте съдържание от Sales или PM агента, което да адаптирате.");
      return;
    }
    const sourceText = output; 
    setIsLoading(true);
    try {
      const res = await adaptMessage(sourceText, channel);
      setOutput(res);
    } catch (e) {
      console.error(e);
      setOutput("Error adapting message.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI PARSER FOR PM PLAN ---
  const renderTable = (rows: string[], key: number) => {
    const headerRow = rows[0];
    const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
    // Skip separator row (starts with | :-- or | ---)
    const dataRows = rows.slice(2).filter(r => !r.trim().match(/^\|\s*:?-/)); 

    return (
      <div key={key} className="overflow-hidden rounded-xl border border-zinc-200 mb-8 shadow-sm bg-white ring-1 ring-black/5">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 uppercase font-bold text-xs tracking-wider">
                <tr>
                {headers.map((h, idx) => (
                    <th key={idx} className="px-6 py-4 whitespace-nowrap">{h}</th>
                ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
                {dataRows.map((row, rIdx) => {
                const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
                if (cells.length === 0) return null;
                return (
                    <tr key={rIdx} className="hover:bg-zinc-50/80 transition-colors group">
                    {cells.map((c, cIdx) => (
                        <td key={cIdx} className="px-6 py-4 text-zinc-700 leading-relaxed">
                            {cIdx === 0 ? <span className="font-semibold text-zinc-900">{c}</span> : c}
                        </td>
                    ))}
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>
    );
  };

  const renderFormattedOutput = (text: string) => {
    if (!text) return (
        <div className="flex flex-col items-center justify-center h-48 gap-4 text-zinc-400">
            <div className="bg-zinc-50 p-4 rounded-full">
                <Sparkles className="w-6 h-6 opacity-40"/>
            </div>
            <span className="text-sm font-medium opacity-60">Изберете действие, за да генерирате съдържание...</span>
        </div>
    );

    const lines = text.split('\n');
    const renderedContent: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;
    let currentSection: 'general' | 'schedule' | 'logistics' | 'risks' = 'general';

    // Helper to flush table
    const flushTable = () => {
        if (tableBuffer.length > 0) {
            renderedContent.push(renderTable(tableBuffer, renderedContent.length));
            tableBuffer = [];
        }
        inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Handle Table Lines
      if (line.startsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        continue;
      } 
      
      // If we were in a table but line doesn't start with pipe, flush it
      if (inTable) {
        flushTable();
      }

      // Handle Empty Lines
      if (!line) continue;

      // Handle Headers
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '').replace(/\*\*/g, '');
        let icon = <ArrowRight className="w-5 h-5 text-zinc-900" />;
        let sectionColor = "text-zinc-900";
        let containerClass = "bg-zinc-100";
        
        if (title.toLowerCase().includes('график')) {
            currentSection = 'schedule';
            icon = <Calendar className="w-5 h-5 text-blue-600" />;
            sectionColor = "text-blue-900";
            containerClass = "bg-blue-50";
        } else if (title.toLowerCase().includes('логистика') || title.toLowerCase().includes('ресурси')) {
            currentSection = 'logistics';
            icon = <Box className="w-5 h-5 text-orange-600" />;
            sectionColor = "text-orange-900";
            containerClass = "bg-orange-50";
        } else if (title.toLowerCase().includes('риск')) {
            currentSection = 'risks';
            icon = <ShieldAlert className="w-5 h-5 text-red-600" />;
            sectionColor = "text-red-900";
            containerClass = "bg-red-50";
        } else {
            currentSection = 'general';
        }

        renderedContent.push(
          <div key={`header-${i}`} className="flex items-center gap-3 mt-10 mb-6 pb-2 border-b border-zinc-100">
            <div className={`p-2 rounded-lg ${containerClass}`}>{icon}</div>
            <h3 className={`text-lg font-bold ${sectionColor}`}>{title}</h3>
          </div>
        );
        continue;
      }

      // Handle List Items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.replace(/^[*|-] /, '');
        
        if (currentSection === 'risks') {
            const parts = content.split(':');
            const riskTitle = parts[0].replace(/\*\*/g, '');
            const riskDesc = parts.slice(1).join(':').trim();
            
            renderedContent.push(
                <div key={`risk-${i}`} className="group bg-white border-l-[3px] border-l-red-500 rounded-r-lg shadow-sm p-4 mb-3 hover:shadow-md transition-shadow border-t border-r border-b border-zinc-100">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="mt-0.5">
                             <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-zinc-900 text-sm mb-1">
                                {riskTitle}
                            </h4>
                            <p className="text-zinc-600 text-sm leading-relaxed">{riskDesc}</p>
                        </div>
                    </div>
                </div>
            );
        } else if (currentSection === 'logistics') {
             renderedContent.push(
                <div key={`logistics-${i}`} className="flex items-start gap-3 mb-3 p-3 bg-white hover:bg-orange-50/30 rounded-lg border border-zinc-100 transition-colors shadow-sm">
                    <div className="mt-0.5 p-1.5 bg-orange-100 text-orange-600 rounded-md">
                        <Box className="w-4 h-4" />
                    </div>
                    <span className="text-zinc-700 text-sm font-medium leading-relaxed self-center" dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
            );
        } else {
             renderedContent.push(
                <div key={`list-${i}`} className="flex gap-3 mb-2 pl-2 group items-start">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-blue-500 transition-colors flex-shrink-0"></div>
                    <span className="text-zinc-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
            );
        }
        continue;
      }

      // Normal Text
      if (line.length > 0) {
        renderedContent.push(
          <p key={`p-${i}`} className="mb-4 text-zinc-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
      }
    }

    if (inTable) flushTable();

    return <div className="space-y-1">{renderedContent}</div>;
  };

  return (
    <div className="mt-12 border-t border-zinc-200 pt-10 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-zinc-900" />
        <h2 className="text-xl font-bold text-zinc-900">AI Agents Workflow</h2>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
        {/* Agent Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/50">
          <button
            onClick={() => setActiveAgent('sales')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeAgent === 'sales' ? 'bg-white border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Briefcase className="w-4 h-4" /> Sales Agent
          </button>
          <button
            onClick={() => setActiveAgent('pm')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeAgent === 'pm' ? 'bg-white border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <HardHat className="w-4 h-4" /> Project Manager
          </button>
          <button
            onClick={() => setActiveAgent('comm')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeAgent === 'comm' ? 'bg-white border-b-2 border-zinc-900 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Communication
          </button>
        </div>

        {/* Controls Area */}
        <div className="p-6 bg-zinc-50 border-b border-zinc-100">
          {activeAgent === 'sales' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">Автоматични последващи действия при липса на отговор:</p>
              <div className="flex gap-3">
                <button 
                    disabled={isLoading}
                    onClick={() => handleSalesAction(3)} 
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:border-zinc-400 transition-all shadow-sm"
                >
                  Ден 3: Проверка
                </button>
                <button 
                    disabled={isLoading}
                    onClick={() => handleSalesAction(7)}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:border-zinc-400 transition-all shadow-sm"
                >
                  Ден 7: Стойност
                </button>
                <button 
                    disabled={isLoading}
                    onClick={() => handleSalesAction(14)}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:border-zinc-400 transition-all shadow-sm"
                >
                  Ден 14: Финал
                </button>
              </div>
            </div>
          )}

          {activeAgent === 'pm' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">Генериране на план след приемане на офертата:</p>
              <button 
                disabled={isLoading}
                onClick={handlePMAction}
                className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-300 transform active:scale-95 flex items-center gap-2"
              >
                <HardHat className="w-4 h-4" />
                Създай План за Изпълнение (Roadmap)
              </button>
            </div>
          )}

          {activeAgent === 'comm' && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">Адаптиране на текущия текст за различни канали:</p>
              <div className="flex gap-3">
                <button 
                    disabled={isLoading}
                    onClick={() => handleCommAction(CommunicationChannel.EMAIL)}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:border-zinc-400 transition-all shadow-sm flex items-center gap-2"
                >
                   Email
                </button>
                <button 
                    disabled={isLoading}
                    onClick={() => handleCommAction(CommunicationChannel.WHATSAPP)}
                    className="px-4 py-2 bg-[#25D366] text-white border border-[#25D366] rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
                >
                   WhatsApp
                </button>
                <button 
                    disabled={isLoading}
                    onClick={() => handleCommAction(CommunicationChannel.SMS)}
                    className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:border-zinc-400 transition-all shadow-sm flex items-center gap-2"
                >
                   SMS
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Output Area */}
        <div className="p-8 bg-white min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {isLoading ? 'GENERATING...' : 'AGENT OUTPUT'}
                </span>
                <button 
                    onClick={() => navigator.clipboard.writeText(output)}
                    className="text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 text-xs font-medium" 
                    title="Copy"
                >
                    <Copy className="w-3 h-3" /> COPY
                </button>
            </div>
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="w-8 h-8 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin"></div>
                    <p className="text-zinc-400 text-sm animate-pulse">Агентът мисли...</p>
                </div>
            ) : (
                <div className="prose prose-sm max-w-none text-zinc-700">
                    {activeAgent === 'pm' ? renderFormattedOutput(output) : (
                       <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                           {output || "Няма генерирано съдържание."}
                       </pre>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};