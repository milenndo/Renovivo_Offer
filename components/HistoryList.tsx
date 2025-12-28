import React from 'react';
import { HistoryItem } from '../types';
import { Clock, MapPin, User, ChevronRight, FileText } from 'lucide-react';

interface HistoryListProps {
  items: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ items, onLoad }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-400">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Все още нямате запазени оферти.</p>
        <p className="text-sm mt-2">Генерирайте нова оферта, за да я видите тук.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-white rounded-xl border border-zinc-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onLoad(item)}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-lg">
                <User className="w-4 h-4 text-zinc-500" />
                {item.projectData.client.name || 'Неизвестен клиент'}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                {new Date(item.timestamp).toLocaleDateString('bg-BG')} 
                <span className="text-zinc-300">|</span>
                <MapPin className="w-3.5 h-3.5" />
                {item.projectData.location}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full inline-block">
                {item.priceRange}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between items-center">
            <div className="text-sm text-zinc-600">
              {item.projectData.type} • {item.projectData.totalArea} м² • {item.projectData.level}
            </div>
            <button 
              className="text-sm font-medium text-zinc-900 flex items-center gap-1 group-hover:underline"
            >
              Преглед <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};