import React, { useState } from 'react';
import { ProjectData, CommunicationChannel } from '../types';
import { generateSalesFollowUp } from '../services/agents/salesAgent';
import { generateProjectPlan } from '../services/agents/projectManagerAgent';
import { adaptMessage } from '../services/agents/communicationAgent';
import { Briefcase, HardHat, MessageSquare, Copy, Sparkles, Calendar, Box, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

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
  const renderFormattedOutput = (text: string) => {
    if (!text) return <div className="text-zinc-400 text-sm italic">Изберете действие, за да генерирате съдържание...</div>;

    // Split text into sections to handle tables and lists differently
    const lines = text.split('\n');
    const renderedContent = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table Detection
      if (line.startsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        continue;
      } else if (inTable) {
        // End of table, render it
        if (tableBuffer.length > 0) {
          renderedContent.push(renderTable(tableBuffer, i));
          tableBuffer = [];
        }
        inTable = false;
      }

      // Headers
      if (line.startsWith('### ')) {
        const title = line.replace('### ', '').replace(/\*\*/g, '');
        let icon = <ArrowRight className="w-5 h-5 text-zinc-900" />;
        if (title.includes('График')) icon = <Calendar className="w-5 h-5 text-blue-600" />;
        if (title.includes('Логистика') || title.includes('Ресурси')) icon = <Box className="w-5 h-5 text-orange-600" />;
        if (title.includes('Риск')) icon = <AlertTriangle className="w-5 h-5 text-red-600" />;

        renderedContent.push(
          <div key={i} className="flex items-center gap-2 mt-8 mb-4 pb-2 border-b border-zinc-100">
            {icon}
            <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          </div>
        );
      }
      // List Items (Bullet points)
      else if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.replace(/^[*|-] /, '');
        const isRisk = content.includes(':'); // Heuristic for risk items "Risk: Mitigation"
        
        if (isRisk && activeAgent === 'pm') {
            const [risk, mitigation] = content.split(':');
            renderedContent.push(
                <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3 mb-2 flex gap-3 items-start">
                    <div className="mt-1 min-w-[4px] h-4 bg-red-400 rounded-full"></div>
                    <div>
                        <span className="font-bold text-red-900 block text-sm">{risk.replace(/\*\*/g, '')}</span>
                        <span className="text-red-700 text-sm">{mitigation}</span>
                    </div>
                </div>
            );
        } else {
            renderedContent.push(
            <div key={i} className="flex gap-3 mb-2 pl-1">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-700 text-sm" dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            </div>
            );
        }
      }
      // Normal Text
      else if (line.length > 0) {
        renderedContent.push(
          <p key={i} className="mb-2 text-zinc-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        );
      }
    }

    // Flush remaining table if ends with table
    if (inTable && tableBuffer.length > 0) {
        renderedContent.push(renderTable(tableBuffer, lines.length));
    }

    return renderedContent;
  };

  const renderTable = (rows: string[], key: number) => {
    // Basic markdown table parser
    const headerRow = rows[0];
    const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
    const dataRows = rows.slice(2); // Skip header and separator line (|---|---|)

    return (
      <div key={key} className="overflow-x-auto rounded-lg border border-zinc-200 mb-6 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-zinc-500 uppercase font-medium text-xs">
            <tr>
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3 border-b border-zinc-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {dataRows.map((row, rIdx) => {
              const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
              if (cells.length === 0) return null;
              return (
                <tr key={rIdx} className="hover:bg-zinc-50/50 transition-colors">
                  {cells.map((c, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 text-zinc-700 font-medium">
                        {c}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
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