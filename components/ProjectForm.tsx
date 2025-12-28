import React, { useState, useEffect, useMemo } from 'react';
import { ProjectData, PropertyType, RenovationLevel, Zone, DEFAULT_ZONES, SelectedService, AnalyzedData } from '../types';
import { SERVICES_DB } from '../services/masterData';
import { analyzeProjectFile } from '../services/geminiService';
import { VisualizationModal } from './VisualizationModal';
import { Plus, Trash2, Check, MapPin, Ruler, Home, FileText, User, Search, Euro, Calendar, UploadCloud, ArrowRight, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
  isGenerating: boolean;
  initialData?: ProjectData | null;
}

const BGN_TO_EUR_RATE = 1.95583;

export const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, isGenerating, initialData }) => {
  // Default State
  const defaultData: ProjectData = {
    client: { name: '', email: '', phone: '' },
    type: PropertyType.APT_NEW,
    location: 'София',
    totalArea: 92,
    zones: DEFAULT_ZONES,
    condition: 'БДС (Шпакловка и замазка)',
    selectedServices: [],
    level: RenovationLevel.HIGH_END,
    notes: '',
  };

  const [data, setData] = useState<ProjectData>(defaultData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Smart Import State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  
  // Visualization State
  const [visModalOpen, setVisModalOpen] = useState(false);
  const [selectedRoomForVis, setSelectedRoomForVis] = useState<string>('');

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData]);

  // Recalculate total area
  useEffect(() => {
    const calculatedArea = data.zones.reduce((sum, zone) => sum + (Number(zone.area) || 0), 0);
    if (calculatedArea > 0) {
      setData(prev => ({ ...prev, totalArea: calculatedArea }));
    }
  }, [data.zones]);

  // --- SMART IMPORT HANDLER ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalyzedData(null);
    try {
        const result = await analyzeProjectFile(file);
        setAnalyzedData(result);
    } catch (error) {
        alert("Грешка при анализа на файла. Моля, опитайте отново.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const applyAnalyzedData = () => {
    if (!analyzedData) return;
    setData(prev => ({
        ...prev,
        totalArea: analyzedData.totalArea || prev.totalArea,
        zones: analyzedData.zones.length > 0 ? analyzedData.zones : prev.zones,
        // Only update type if we're fairly sure, otherwise keep default
        type: analyzedData.type || prev.type,
        notes: prev.notes ? `${prev.notes}\nAI Analysis: ${analyzedData.suggestion}` : `AI Analysis: ${analyzedData.suggestion}`
    }));
    setAnalyzedData(null); // Clear after apply
  };

  // --- HELPERS ---

  const getMarkupPercent = (level: RenovationLevel): number => {
    switch(level) {
      case RenovationLevel.STANDARD: return 0;
      case RenovationLevel.HIGH_END: return 0.20;
      case RenovationLevel.PREMIUM: return 0.30;
      default: return 0;
    }
  };

  const calculateServicePrice = (basePrice: number, level: RenovationLevel) => {
    const markup = getMarkupPercent(level);
    return basePrice * (1 + markup);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('bg-BG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- HANDLERS ---

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

  const openVisModal = (roomName: string) => {
    setSelectedRoomForVis(roomName);
    setVisModalOpen(true);
  };

  // Service Handlers
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lower = searchTerm.toLowerCase();
    return SERVICES_DB.filter(s => 
      s.name.toLowerCase().includes(lower) && 
      !data.selectedServices.find(sel => sel.id === s.id)
    );
  }, [searchTerm, data.selectedServices]);

  const addService = (serviceId: string) => {
    const service = SERVICES_DB.find(s => s.id === serviceId);
    if (!service) return;

    let initialQuantity = 1;
    
    // --- COEFFICIENT 3.5 LOGIC ---
    const keywords = ['шпакловка', 'боядисване', 'обшивка', 'мазилка'];
    const lowerName = service.name.toLowerCase();
    
    // Check if the service name contains any of the target keywords
    if (keywords.some(k => lowerName.includes(k))) {
        if (data.totalArea > 0) {
            // Ask the user if this applies to the whole property
            const calculatedQty = Math.round(data.totalArea * 3.5);
            const userConfirmed = window.confirm(
                `За услугата "${service.name}" може да се приложи автоматично изчисление за целия имот:\n\n` +
                `Подова площ (${data.totalArea} м²) x 3.5 = ${calculatedQty} ${service.unit}\n\n` +
                `Желаете ли да приложим това количество? (Натиснете OK за Да, Cancel за ръчно въвеждане)`
            );

            if (userConfirmed) {
                initialQuantity = calculatedQty;
            }
        }
    }
    // -----------------------------

    const newService: SelectedService = {
      ...service,
      quantity: initialQuantity,
      markupPercent: getMarkupPercent(data.level)
    };

    setData(prev => ({
      ...prev,
      selectedServices: [...prev.selectedServices, newService]
    }));
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  const removeService = (serviceId: string) => {
    setData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.filter(s => s.id !== serviceId)
    }));
  };

  const updateServiceQuantity = (serviceId: string, qty: number) => {
    setData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => 
        s.id === serviceId ? { ...s, quantity: qty } : s
      )
    }));
  };

  useEffect(() => {
    const markup = getMarkupPercent(data.level);
    setData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map(s => ({
        ...s,
        markupPercent: markup
      }))
    }));
  }, [data.level]);

  const grandTotalBGN = data.selectedServices.reduce((acc, curr) => {
    const unitPrice = calculateServicePrice(curr.basePriceBGN, data.level);
    return acc + (unitPrice * curr.quantity);
  }, 0);

  return (
    <div className="space-y-12">
      
      {/* SMART IMPORT SECTION */}
      <section className="bg-zinc-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-semibold">Smart Import</h2>
            </div>
            <p className="text-zinc-400 text-sm mb-6 max-w-lg">
                Качете скица, архитектурен план или снимка на имота. Renovivo AI ще анализира файла и ще попълни автоматично площите и помещенията.
            </p>

            {!analyzedData ? (
                <div className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-8 transition-colors text-center cursor-pointer relative bg-white/5">
                    <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isAnalyzing}
                    />
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-white" />
                            <span className="text-sm font-medium">Анализиране на изображението...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <UploadCloud className="w-8 h-8 text-zinc-400" />
                            <span className="text-sm font-medium">Натисни или провлачи файл тук</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white/10 rounded-xl p-6 border border-white/10 animate-fade-in">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-lg">Успешен Анализ</h3>
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Ready</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <p className="text-zinc-400 text-xs uppercase">Открита Площ</p>
                            <p className="font-medium text-xl">{analyzedData.totalArea} м²</p>
                        </div>
                         <div>
                            <p className="text-zinc-400 text-xs uppercase">Брой Помещения</p>
                            <p className="font-medium text-xl">{analyzedData.zones.length}</p>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-xs italic mb-6 border-l-2 border-zinc-600 pl-3">
                        "{analyzedData.suggestion}"
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={applyAnalyzedData}
                            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
                        >
                            Приложи Данните <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setAnalyzedData(null)}
                            className="text-zinc-400 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors"
                        >
                            Отказ
                        </button>
                    </div>
                </div>
            )}
         </div>
      </section>

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

          {(data.type === PropertyType.HOUSE_NEW || data.type === PropertyType.HOUSE_OLD) && (
            <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-medium text-zinc-500">Година на строителство</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                        type="number"
                        placeholder="e.g. 1985"
                        value={data.yearOfConstruction || ''}
                        onChange={(e) => setData({ ...data, yearOfConstruction: e.target.value })}
                        className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                </div>
            </div>
          )}

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
            <label className="text-sm font-medium text-zinc-500">Ниво на изпълнение / Ценови клас</label>
            <select
              value={data.level}
              onChange={(e) => setData({ ...data, level: e.target.value as RenovationLevel })}
              className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all appearance-none font-medium"
            >
              <option value={RenovationLevel.STANDARD}>Стандарт (Basic)</option>
              <option value={RenovationLevel.HIGH_END}>Висок клас (High-End)</option>
              <option value={RenovationLevel.PREMIUM}>Премиум (Luxury)</option>
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
              
              {/* Visualize Button */}
              <button
                onClick={() => openVisModal(zone.name)}
                className="p-2 text-zinc-300 hover:text-[#635BFF] transition-colors"
                title="Генерирай 3D Визия"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

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

      {/* NEW: Services & Pricing Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-zinc-200 pb-2">
             <h2 className="text-xl font-semibold tracking-tight text-zinc-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-zinc-500" />
                Услуги и Цени
             </h2>
             <span className="text-xs text-zinc-400 uppercase tracking-wide">Цените са без ДДС</span>
        </div>

        <div className="relative z-20">
            <div className="relative">
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-zinc-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Например: Окачен таван, Шпакловка, Боядисване..."
                    className="w-full bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-3 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                />
            </div>
            
            {isSearchFocused && filteredServices.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-zinc-100 max-h-60 overflow-y-auto">
                    {filteredServices.map(service => (
                        <button
                            key={service.id}
                            onClick={() => addService(service.id)}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 flex justify-between items-center group border-b border-zinc-50 last:border-0"
                        >
                            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">{service.name}</span>
                            <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                                {service.basePriceBGN} лв./{service.unit}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {data.selectedServices.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200">
                            <th className="text-left py-3 px-4 font-medium text-zinc-500">Услуга</th>
                            <th className="text-right py-3 px-4 font-medium text-zinc-500 w-24">К-во</th>
                            <th className="text-right py-3 px-4 font-medium text-zinc-500 w-32">Ед. цена</th>
                            <th className="text-right py-3 px-4 font-medium text-zinc-500 w-32">Общо (BGN)</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {data.selectedServices.map(service => {
                            const unitPrice = calculateServicePrice(service.basePriceBGN, data.level);
                            const total = unitPrice * service.quantity;
                            return (
                                <tr key={service.id} className="hover:bg-zinc-50/50">
                                    <td className="py-3 px-4 text-zinc-900">{service.name}</td>
                                    <td className="py-3 px-4 text-right">
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={service.quantity}
                                            onChange={(e) => updateServiceQuantity(service.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-right bg-zinc-50 border border-zinc-200 rounded px-1 py-1 focus:outline-none focus:border-zinc-400"
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-right text-zinc-600">
                                        {formatCurrency(unitPrice)} <span className="text-[10px] text-zinc-400">лв.</span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium text-zinc-900">
                                        {formatCurrency(total)} <span className="text-[10px] text-zinc-400">лв.</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => removeService(service.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-zinc-50 border-t border-zinc-200 font-bold text-zinc-900">
                        <tr>
                            <td colSpan={3} className="py-4 px-4 text-right uppercase text-xs tracking-wider text-zinc-500">Общо без ДДС</td>
                            <td className="py-4 px-4 text-right text-base">{formatCurrency(grandTotalBGN)} лв.</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="py-2 px-4 text-right uppercase text-xs tracking-wider text-zinc-400 pb-4">В Евро (Фиксинг)</td>
                            <td className="py-2 px-4 text-right text-sm text-zinc-500 pb-4">€ {formatCurrency(grandTotalBGN / BGN_TO_EUR_RATE)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        ) : (
            <div className="text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-zinc-400 text-sm">
                Няма добавени услуги. Използвайте търсачката по-горе.
            </div>
        )}
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
          disabled={isGenerating || data.selectedServices.length === 0}
          className="w-full bg-black text-white rounded-full py-4 text-lg font-medium hover:bg-zinc-800 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform active:scale-[0.99]"
        >
          {isGenerating ? 'Генериране на оферта...' : 'Генерирай Оферта'}
        </button>
      </div>

      <VisualizationModal 
        isOpen={visModalOpen} 
        onClose={() => setVisModalOpen(false)} 
        roomName={selectedRoomForVis} 
      />

    </div>
  );
};