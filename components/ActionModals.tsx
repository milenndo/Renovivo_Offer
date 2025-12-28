import React, { useState } from 'react';
import { X, CreditCard, PenTool, Check, Lock, Loader2 } from 'lucide-react';

// --- SIGNATURE MODAL ---
interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: (name: string) => Promise<void>;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSign }) => {
  const [name, setName] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSigning(true);
    await onSign(name);
    setIsSigning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
          <div className="flex items-center gap-2">
             <div className="bg-[#2C5697] text-white p-1 rounded">
                <PenTool className="w-4 h-4" /> 
             </div>
             <span className="font-semibold text-zinc-900">DocuSign eSignature</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-zinc-600">
            Моля, въведете трите си имена, за да подпишете дигитално договора за изпълнение с <strong>Renovivo Ltd</strong>.
          </p>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 uppercase">Пълно Име</label>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border-b-2 border-zinc-200 py-2 text-xl font-serif italic text-zinc-900 focus:outline-none focus:border-[#2C5697] transition-colors placeholder:not-italic placeholder:font-sans placeholder:text-zinc-300"
                placeholder="Подпиши тук..."
                autoFocus
            />
          </div>

          <div className="flex items-start gap-3">
            <input type="checkbox" id="terms" required className="mt-1" />
            <label htmlFor="terms" className="text-xs text-zinc-500">
                Съгласявам се с използването на електронен подпис и приемам <span className="underline cursor-pointer">Общите условия</span>.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isSigning || !name}
            className="w-full bg-[#2C5697] text-white py-3 rounded-lg font-medium hover:bg-[#1e3f70] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSigning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Подпиши Документа'}
          </button>
        </form>
        <div className="px-6 py-3 bg-zinc-50 text-center border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Securely signed via DocuSign
            </p>
        </div>
      </div>
    </div>
  );
};

// --- PAYMENT MODAL ---
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPay: () => Promise<void>;
  amount: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onPay, amount }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await onPay();
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
           <div className="flex items-center gap-2">
             <div className="bg-[#635BFF] text-white p-1 rounded">
                <CreditCard className="w-4 h-4" /> 
             </div>
             <span className="font-semibold text-zinc-900">Stripe Secure Payment</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-6">
          <div className="text-center mb-6">
            <p className="text-zinc-500 text-sm">Депозит за стартиране (10%)</p>
            <p className="text-3xl font-bold text-zinc-900 mt-1">{amount}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase">Данни за картата</label>
                <div className="border border-zinc-200 rounded-lg p-3 flex items-center gap-3 bg-white shadow-sm">
                    <CreditCard className="w-5 h-5 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="0000 0000 0000 0000" 
                        className="flex-1 outline-none text-zinc-900 font-mono"
                        maxLength={19}
                        defaultValue="4242 4242 4242 4242"
                    />
                    <div className="flex gap-2">
                         <input type="text" placeholder="MM/YY" className="w-16 outline-none text-zinc-900 font-mono text-center border-l border-zinc-100 pl-2" defaultValue="12/25"/>
                         <input type="text" placeholder="CVC" className="w-12 outline-none text-zinc-900 font-mono text-center border-l border-zinc-100 pl-2" defaultValue="123"/>
                    </div>
                </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full bg-[#635BFF] text-white py-3 rounded-lg font-medium hover:bg-[#5249d6] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-100"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Плати ${amount}`}
          </button>
        </form>
         <div className="px-6 py-3 bg-zinc-50 text-center border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Encrypted via Stripe (PCI DSS Compliant)
            </p>
        </div>
      </div>
    </div>
  );
};