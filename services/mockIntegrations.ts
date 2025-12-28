import { InboxThread, CommunicationChannel } from "../types";

// Simulate Network Delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- STRIPE SIMULATION ---
export const processStripePayment = async (amount: number, currency: string = 'BGN') => {
  await delay(2000); // Simulate processing
  return {
    success: true,
    transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
    amount,
    currency,
    timestamp: new Date().toISOString()
  };
};

// --- DOCUSIGN SIMULATION ---
export const signDocument = async (signerName: string) => {
  await delay(1500);
  return {
    success: true,
    envelopeId: `env_${Math.random().toString(36).substr(2, 9)}`,
    signedBy: signerName,
    timestamp: new Date().toISOString()
  };
};

// --- SLACK SIMULATION ---
export const notifySlack = async (channel: string, message: string) => {
  // In a real app, this would hit a backend proxy to the Slack Webhook API
  console.log(`[Slack] Posting to #${channel}: ${message}`);
  return true;
};

// --- INBOX DATA ---
export const MOCK_INBOX: InboxThread[] = [
  {
    id: '1',
    clientName: 'Мария Петрова',
    channel: CommunicationChannel.WHATSAPP,
    preview: 'Здравейте, кога можем да направим оглед?',
    timestamp: '10:30',
    unread: true,
    messages: [
      { sender: 'client', text: 'Здравейте, разгледах офертата. Изглежда добре.', time: '10:28' },
      { sender: 'client', text: 'Кога можем да направим оглед на място?', time: '10:30' }
    ]
  },
  {
    id: '2',
    clientName: 'Георги Димитров',
    channel: CommunicationChannel.EMAIL,
    preview: 'Re: Оферта за ремонт - Лозенец',
    timestamp: 'Вчера',
    unread: false,
    messages: [
      { sender: 'agent', text: 'Здравейте Георги, изпращам Ви актуализираната оферта.', time: 'Вчера 14:00' },
      { sender: 'client', text: 'Благодаря! Ще я обсъдя със съпругата ми и ще върна отговор до края на седмицата.', time: 'Вчера 16:45' }
    ]
  },
  {
    id: '3',
    clientName: 'Tech Office Ltd',
    channel: CommunicationChannel.SMS,
    preview: 'Imame interes. Molya zvunnete.',
    timestamp: 'Пон',
    unread: false,
    messages: [
        { sender: 'client', text: 'Imame interes. Molya zvunnete.', time: 'Пон 09:15' }
    ]
  }
];