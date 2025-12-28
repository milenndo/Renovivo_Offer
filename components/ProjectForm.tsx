import React, { useState, useEffect } from 'react';
import { ProjectData, PropertyType, RenovationLevel, Zone, COMMON_ACTIVITIES, DEFAULT_ZONES } from '../types';
import { Plus, Trash2, Check, MapPin, Ruler, Home, FileText, User } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
  isGenerating: boolean;
  initialData?: ProjectData | null;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isGenerating, initialData }) => {
  const defaultData: ProjectData = {
    client: { name: '', email: '', phone: '' },
    type: PropertyType.APARTMENT,
    location: 'София',
    totalArea: 92,
    zones: DEFAULT_ZONES,
    condition: 'Нужда от основен ремонт',
    activities: [
      "Къртене и извозване", "Нови замазки", "Гипсова шпакловка", 
      "Фаянс/Гранитогрес", "Сух под / Ламинат", "Монтаж на осветление", 
      "Нови Ел. инсталации", "Боядисване"
    ],
    level: RenovationLevel.HIGH_END,
    notes: 'Клиентът държи на чиста работа, предпочита по-малко комуникация, иска един партньор „до ключ“.',
  };

  const [data, setData] = useState<ProjectData>(defaultData);

  // Load initial data if provided (History restore)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // Calculate total area automatically when zones change
  useEffect(() => {
    const calculatedArea = data.zones.reduce((sum, zone) => sum + (Number(zone.area) || 0), 0);
    if (calculatedArea > 0) {
      setData(prev => ({ ...prev, totalArea: calculatedArea }));
    }
  }, [data.zones]);

  const handleZoneChange = (id: string, field: keyof Zone, value: string | number) => {
    setData(prev => ({
      ...prev,
      zones: prev.zones.map(z => z.id === id ? { ...z, [field]: value } : z)
    }));
  };

  const addZone = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setData(prev => ({
      ...prev,
      zones: [...prev.zones, { id: newId, name: 'Нова стая', area: 0 }]
    }));
  };

  const removeZone = (id: string) => {
    setData(prev => ({
      ...prev,
      zones: prev.zones.filter(z => z.id !== id)
    }));
  };

  const toggleActivity = (activity: string) => {
    setData(prev => {
      const exists = prev.activities.includes(activity);
      return {
        ...prev,
        activities: exists
          ? prev.activities.filter(a => a !== activity)
          : [...prev.activities, activity]
      };
    });
  };

  return (
    <div className="space-y-12">
      
      {/* Client Info Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
          <User className="w-5 h-5 text-zinc-500" />
          Данни за клиента
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
             <label className="text-sm font-medium text-zinc-500">Име и Фамилия</label>
             <input
                type="text"
                value={data.client.name}
                onChange={(e) => setData({ ...data, client: { ...data.client, name: e.target.value } })}
                placeholder="Иван Иванов"
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
             />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-zinc-500">Email</label>
             <input
                type="email"
                value={data.client.email}
                onChange={(e) => setData({ ...data, client: { ...data.client, email: e.target.value } })}
                placeholder="client@example.com"
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
             />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-medium text-zinc-500">Телефон</label>
             <input
                type="tel"
                value={data.client.phone}
                onChange={(e) => setData({ ...data, client: { ...data.client, phone: e.target.value } })}
                placeholder="0888 123 456"
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
             />
          </div>
        </div>
      </section>

      {/* Basic Info Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
          <Home className="w-5 h-5 text-zinc-500" />
          Данни за имота
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500">Тип имот</label>
            <select
              value={data.type}
              onChange={(e) => setData({ ...data, type: e.target.value as PropertyType })}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none"
            >
              {Object.values(PropertyType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500">Локация</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500">Ниво на изпълнение</label>
            <select
              value={data.level}
              onChange={(e) => setData({ ...data, level: e.target.value as RenovationLevel })}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none"
            >
              {Object.values(RenovationLevel).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500">Обща площ (м²)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400" />
              <input
                type="number"
                value={data.totalArea}
                readOnly
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-3 text-zinc-500 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Zones Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
          <div className="w-5 h-5 border border-zinc-400 rounded-sm" />
          Разпределение и Зони
        </h2>
        <div className="space-y-3">
          {data.zones.map((zone) => (
            <div key={zone.id} className="flex gap-4 items-center group">
              <input
                type="text"
                value={zone.name}
                onChange={(e) => handleZoneChange(zone.id, 'name', e.target.value)}
                placeholder="Име на помещение"
                className="flex-grow bg-transparent border-b border-zinc-200 py-2 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors placeholder-zinc-300"
              />
              <div className="flex items-center gap-2 w-24">
                <input
                  type="number"
                  value={zone.area}
                  onChange={(e) => handleZoneChange(zone.id, 'area', parseFloat(e.target.value))}
                  className="w-full bg-transparent border-b border-zinc-200 py-2 text-right text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors"
                />
                <span className="text-zinc-400 text-sm">м²</span>
              </div>
              <button
                onClick={() => removeZone(zone.id)}
                className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Премахни"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addZone}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добави помещение
          </button>
        </div>
      </section>

      {/* Activities Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
          <Check className="w-5 h-5 text-zinc-500" />
          Дейности
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COMMON_ACTIVITIES.map((activity) => {
            const isSelected = data.activities.includes(activity);
            return (
              <button
                key={activity}
                onClick={() => toggleActivity(activity)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-all text-left ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected ? 'border-white bg-white' : 'border-zinc-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
                </div>
                {activity}
              </button>
            );
          })}
        </div>
      </section>

      {/* Notes Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 border-b border-zinc-200 pb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-zinc-500" />
          Бележки и състояние
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
             <label className="text-sm font-medium text-zinc-500">Текущо състояние</label>
             <input
                type="text"
                value={data.condition}
                onChange={(e) => setData({...data, condition: e.target.value})}
                className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
             />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500">Допълнителни изисквания</label>
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              rows={4}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
              placeholder="Специфични изисквания, предпочитания за материали..."
            />
          </div>
        </div>
      </section>

      {/* Action Button */}
      <div className="pt-6 sticky bottom-6 z-10">
        <button
          onClick={() => onSubmit(data)}
          disabled={isGenerating}
          className="w-full bg-black text-white rounded-full py-4 text-lg font-medium hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform active:scale-[0.99]"
        >
          {isGenerating ? 'Генериране на оферта...' : 'Генерирай Оферта'}
        </button>
      </div>
    </div>
  );
};