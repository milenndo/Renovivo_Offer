import { ServiceItem } from "../types";

export const SERVICES_DB: ServiceItem[] = [
  // TAVANI (Ceilings)
  { id: 't1', name: 'Окачен таван от гипсокартон (прав)', unit: 'м²', basePriceBGN: 45 },
  { id: 't2', name: 'Окачен таван от гипсокартон (растер)', unit: 'м²', basePriceBGN: 38 },
  { id: 't3', name: 'Окачен таван (скрито осветление)', unit: 'мл', basePriceBGN: 55 },
  { id: 't4', name: 'Окачен таван Hunter Douglas', unit: 'м²', basePriceBGN: 85 },
  { id: 't5', name: 'Шпакловка на таван (фина)', unit: 'м²', basePriceBGN: 18 },
  { id: 't6', name: 'Боядисване на таван (латекс)', unit: 'м²', basePriceBGN: 12 },

  // STENI (Walls)
  { id: 'w1', name: 'Предстенна обшивка (гипсокартон)', unit: 'м²', basePriceBGN: 35 },
  { id: 'w2', name: 'Преградна стена (гипсокартон)', unit: 'м²', basePriceBGN: 55 },
  { id: 'w3', name: 'Гипсова шпакловка (стени)', unit: 'м²', basePriceBGN: 16 },
  { id: 'w4', name: 'Финишна шпакловка (шитрок)', unit: 'м²', basePriceBGN: 12 },
  { id: 'w5', name: 'Машинно боядисване (латекс)', unit: 'м²', basePriceBGN: 8 },
  { id: 'w6', name: 'Ръчно боядисване (2 цвята)', unit: 'м²', basePriceBGN: 14 },
  { id: 'w7', name: 'Декоративна мазилка', unit: 'м²', basePriceBGN: 65 },

  // PODOVE (Floors)
  { id: 'f1', name: 'Саморазливна замазка', unit: 'м²', basePriceBGN: 22 },
  { id: 'f2', name: 'Армирана циментова замазка', unit: 'м²', basePriceBGN: 28 },
  { id: 'f3', name: 'Монтаж на ламиниран паркет', unit: 'м²', basePriceBGN: 10 },
  { id: 'f4', name: 'Монтаж на трислоен паркет (лепене)', unit: 'м²', basePriceBGN: 35 },
  { id: 'f5', name: 'Лепене на гранитогрес (стандарт)', unit: 'м²', basePriceBGN: 45 },
  { id: 'f6', name: 'Лепене на гранитогрес (голям формат)', unit: 'м²', basePriceBGN: 65 },

  // BANYA (Bathroom)
  { id: 'b1', name: 'Цялостен ремонт на баня (труд)', unit: 'бр.', basePriceBGN: 3500 },
  { id: 'b2', name: 'Монтаж на структура за вграждане', unit: 'бр.', basePriceBGN: 150 },
  { id: 'b3', name: 'Монтаж на линеен сифон', unit: 'бр.', basePriceBGN: 120 },
  { id: 'b4', name: 'Хидроизолация на баня', unit: 'м²', basePriceBGN: 35 },

  // El & ViK (Installations)
  { id: 'i1', name: 'Изграждане на Ел. точка (тухла)', unit: 'бр.', basePriceBGN: 25 },
  { id: 'i2', name: 'Изграждане на Ел. точка (бетон)', unit: 'бр.', basePriceBGN: 35 },
  { id: 'i3', name: 'Монтаж на ел. табло', unit: 'бр.', basePriceBGN: 180 },
  { id: 'i4', name: 'Изграждане на ВиК точка', unit: 'бр.', basePriceBGN: 140 },

  // DEMONTAZH (Demolition)
  { id: 'd1', name: 'Къртене на фаянс и теракот', unit: 'м²', basePriceBGN: 18 },
  { id: 'd2', name: 'Къртене на замазка', unit: 'м²', basePriceBGN: 15 },
  { id: 'd3', name: 'Къртене на тухлена стена', unit: 'м²', basePriceBGN: 45 },
  { id: 'd4', name: 'Изнасяне и извозване', unit: 'курс', basePriceBGN: 120 },
];