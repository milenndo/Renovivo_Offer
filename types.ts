export enum PropertyType {
  APARTMENT = 'Апартамент',
  HOUSE = 'Къща',
  OFFICE = 'Офис',
  COMMERCIAL = 'Търговски обект'
}

export enum RenovationLevel {
  STANDARD = 'Стандарт',
  HIGH_END = 'Висок клас',
  LUXURY = 'Лукс / High-end'
}

export interface Zone {
  id: string;
  name: string;
  area: number;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ProjectData {
  client: ClientInfo;
  type: PropertyType;
  location: string;
  totalArea: number;
  zones: Zone[];
  condition: string; // e.g., "Нужда от основен ремонт"
  activities: string[];
  level: RenovationLevel;
  notes: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  projectData: ProjectData;
  offerText: string;
  priceRange: string;
}

export const COMMON_ACTIVITIES = [
  "Къртене и извозване",
  "Нови Ел. инсталации",
  "Нови ВиК инсталации",
  "Нови замазки",
  "Гипсова шпакловка",
  "Боядисване",
  "Фаянс/Гранитогрес",
  "Сух под / Ламинат",
  "Окачени тавани",
  "Монтаж на осветление",
  "Монтаж на санитария",
  "Интериорни врати"
];

export const DEFAULT_ZONES: Zone[] = [
  { id: '1', name: 'Дневна', area: 24 },
  { id: '2', name: 'Спалня', area: 14 },
  { id: '3', name: 'Спалня', area: 13 },
  { id: '4', name: 'Коридор', area: 12 },
  { id: '5', name: 'Баня', area: 5 },
  { id: '6', name: 'WC', area: 3 },
  { id: '7', name: 'Кухня', area: 21 },
];