import React, { useState } from 'react';
import { InboxThread, CommunicationChannel } from '../types';
import { MOCK_INBOX } from '../services/mockIntegrations';
import { MessageSquare, Mail, Smartphone, Send, MoreVertical, Search, Sparkles } from 'lucide-react';
import { adaptMessage } from '../services/agents/communicationAgent';

export const Inbox: React.FC = () => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(MOCK_INBOX[0].id);
  const [threads] = useState<InboxThread[]>(MOCK_INBOX);
  const [replyText, setReplyText] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case CommunicationChannel.EMAIL: return <Mail className="w-4 h-4" />;
      case CommunicationChannel.SMS: return <Smartphone className="w-4 h-4" />;
      case CommunicationChannel.WHATSAPP: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleAiDraft = async () => {
    if (!selectedThread) return;
    setIsAiGenerating(true);
    try {
        const draft = "Благодаря за бързия отговор. Удобно ли е да направим огледа в Сряда (15.05) от 14:00 часа? Екипът на Renovivo.";
        const adapted = await adaptMessage(draft, selectedThread.channel);
        setReplyText(adapted);
    } catch (e) {
        console.error(e);
        setReplyText("Error generating draft.");
    } finally {
        setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-2xl border border-zinc-200 overflow-hidden animate-fade-in-up">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-zinc-100 flex flex-col">
        <div className="p-4 border-b border-zinc-100">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-300"
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map(thread => (
            <div 
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              className={`p-4 border-b border-zinc-50 cursor-pointer transition-colors hover:bg-zinc-50 ${selectedThreadId === thread.id ? 'bg-zinc-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold text-sm ${thread.unread ? 'text-zinc-900' : 'text-zinc-600'}`}>{thread.clientName}</span>
                <span className="text-xs text-zinc-400">{thread.timestamp}</span>
              </div>
              <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{thread.preview}</p>
              <div className="flex items-center gap-2">
                 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                    thread.channel === CommunicationChannel.WHATSAPP ? 'bg-green-50 text-green-700 border-green-100' :
                    thread.channel === CommunicationChannel.EMAIL ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-gray-50 text-gray-700 border-gray-100'
                 }`}>
                    {getChannelIcon(thread.channel)} {thread.channel}
                 </span>
                 {thread.unread && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-zinc-100 flex justify-between items-center px-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-semibold">
                    {selectedThread.clientName.charAt(0)}
                </div>
                <div>
                    <h3 className="font-semibold text-zinc-900">{selectedThread.clientName}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                        Via {selectedThread.channel} • Active now
                    </p>
                </div>
             </div>
             <button className="text-zinc-400 hover:text-zinc-900"><MoreVertical className="w-5 h-5" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30">
             {selectedThread.messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[70%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                         msg.sender === 'agent' 
                         ? 'bg-zinc-900 text-white rounded-br-none' 
                         : 'bg-white border border-zinc-100 text-zinc-700 rounded-bl-none'
                     }`}>
                         <p>{msg.text}</p>
                         <p className={`text-[10px] mt-2 text-right ${msg.sender === 'agent' ? 'text-zinc-400' : 'text-zinc-300'}`}>{msg.time}</p>
                     </div>
                 </div>
             ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-zinc-100">
             <div className="relative">
                <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply via ${selectedThread.channel}...`}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 pr-24 text-sm focus:outline-none focus:border-zinc-400 resize-none h-24"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                    <button 
                        onClick={handleAiDraft}
                        disabled={isAiGenerating}
                        className="p-2 text-zinc-400 hover:text-[#635BFF] hover:bg-indigo-50 rounded-lg transition-colors"
                        title="AI Draft"
                    >
                        <Sparkles className={`w-5 h-5 ${isAiGenerating ? 'animate-pulse text-[#635BFF]' : ''}`} />
                    </button>
                    <button className="p-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 transition-colors">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-zinc-400">
            Select a conversation
        </div>
      )}
    </div>
  );
};