
export enum PropertyType {
  APT_NEW = 'Апартамент (Ново строителство - шпакловка/замазка)',
  APT_PANEL = 'Апартамент (Панел)',
  APT_BRICK = 'Апартамент (Тухла - старо строителство)',
  APT_EPK = 'Апартамент (ЕПК)',
  HOUSE_NEW = 'Къща (Ново строителство)',
  HOUSE_OLD = 'Къща (За основен ремонт)',
  OFFICE = 'Офис',
  COMMERCIAL = 'Търговски обект'
}

export enum RenovationLevel {
  STANDARD = 'Стандарт (Basic)',
  HIGH_END = 'Висок клас (High-End)',
  PREMIUM = 'Премиум (Luxury)'
}

export interface Zone {
  id: string;
  name: string;
  area: number; // Floor area
  height: number;
  wallArea: number;
  ceilingArea: number;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

// Database item structure
export interface ServiceItem {
  id: string;
  name: string;
  unit: string; // e.g., "м²", "бр.", "мл"
  basePriceBGN: number; // Base price without VAT
}

// Selected item in the form
export interface SelectedService extends ServiceItem {
  quantity: number;
  markupPercent: number; // 0, 20, or 30
}

export interface ProjectData {
  client: ClientInfo;
  type: PropertyType;
  yearOfConstruction?: string; // Only for houses
  location: string;
  totalArea: number;
  zones: Zone[];
  condition: string;
  selectedServices: SelectedService[]; // Replaces old 'activities'
  level: RenovationLevel;
  notes: string;
}

export interface AnalyzedData {
  totalArea: number;
  zones: Zone[];
  type?: PropertyType;
  suggestion: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  projectData: ProjectData;
  offerText: string;
  priceRange: string;
  status?: OfferStatus;
}

export enum AgentType {
  SALES = 'Sales',
  PM = 'Project Manager',
  COMM = 'Communication'
}

export enum CommunicationChannel {
  EMAIL = 'Email',
  SMS = 'SMS',
  WHATSAPP = 'WhatsApp'
}

export type OfferStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'PAID';

export interface InboxThread {
  id: string;
  clientName: string;
  channel: CommunicationChannel;
  preview: string;
  timestamp: string;
  unread: boolean;
  messages: {
    sender: 'client' | 'agent';
    text: string;
    time: string;
  }[];
}

// Helper for initial calculation
const calculateZoneDetails = (area: number, height: number = 2.60) => {
  const perimeter = 4 * Math.sqrt(area); // Assuming square shape for estimation
  return {
    height,
    wallArea: parseFloat((perimeter * height).toFixed(2)),
    ceilingArea: area
  };
};

export const DEFAULT_ZONES: Zone[] = [
  { id: '1', name: 'Дневна', area: 24, ...calculateZoneDetails(24) },
  { id: '2', name: 'Спалня', area: 14, ...calculateZoneDetails(14) },
  { id: '3', name: 'Спалня', area: 13, ...calculateZoneDetails(13) },
  { id: '4', name: 'Коридор', area: 12, ...calculateZoneDetails(12) },
  { id: '5', name: 'Баня', area: 5, ...calculateZoneDetails(5) },
  { id: '6', name: 'WC', area: 3, ...calculateZoneDetails(3) },
  { id: '7', name: 'Кухня', area: 21, ...calculateZoneDetails(21) },
];
