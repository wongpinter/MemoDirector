import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle2, Sparkles, Edit3, Zap, UserSearch, Clapperboard, Ear } from 'lucide-react';
import { calculateMajorNumber, MajorResult } from '../constants';
import { PAOItem } from '../types';

interface ReverseLookupProps {
  items: PAOItem[];
  onAssign: (number: number, name: string) => void;
  onQuickAdd: (number: number, name: string) => void;
}

export const ReverseLookup: React.FC<ReverseLookupProps> = ({ items, onAssign, onQuickAdd }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<MajorResult[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Debounce analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim().length > 1) {
        setResults(calculateMajorNumber(input));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div className="w-full mx-auto py-6 px-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex justify-center items-center gap-2 sm:gap-3">
          <UserSearch className="text-indigo-400 w-6 h-6 sm:w-8 sm:h-8" /> Talent Scout
        </h2>
        <p className="text-slate-400">
          Run a screen test. Enter a character name to see which Major System roles they fit.
        </p>
      </div>

      <div className="bg-slate-800/50 p-4 sm:p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
        {/* Input Area */}
        <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter talent name (e.g. Tony Stark)..."
                className="w-full bg-slate-900 border border-slate-600 text-xl text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                autoFocus
            />
        </div>

        {/* Result Display */}
        {results.length > 0 ? (
            <div className={`grid gap-6 ${results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'}`}>
                {results.map((result, idx) => {
                    const formattedNumber = result.number.toString().padStart(2, '0');
                    const existingItem = items.find(i => i.number === result.number);
                    const isOccupied = existingItem && existingItem.person;
                    const isInitials = result.method === 'Initials';

                    return (
                        <div key={idx} className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-lg flex flex-col">
                            {/* Result Header */}
                            <div className="p-6 flex flex-col items-center justify-center bg-slate-900/50 flex-1">
                                <div className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    {isInitials ? <Clapperboard size={14} /> : <Ear size={14} />}
                                    {isInitials ? 'Initials Mode' : 'Phonetic Mode'}
                                </div>
                                <div className="text-5xl sm:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 mb-4">
                                    {formattedNumber}
                                </div>
                                <div className="text-slate-500 text-xs bg-slate-800 px-3 py-1.5 rounded-full font-mono border border-slate-700 flex items-center gap-2">
                                    {isInitials && <Sparkles size={12} className="text-amber-400" />}
                                    {result.explanation}
                                </div>
                            </div>

                            {/* Result Actions */}
                            <div className={`p-4 border-t border-slate-700 ${isOccupied ? 'bg-amber-950/10' : 'bg-emerald-950/10'}`}>
                                <div className="flex items-center gap-2 mb-4 justify-center">
                                    {isOccupied ? (
                                        <div className="flex items-center gap-2 text-amber-300 text-sm font-bold">
                                            <AlertTriangle size={16} />
                                            <span>Role #{formattedNumber} Filled: {existingItem.person}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                            <CheckCircle2 size={16} />
                                            <span>Role #{formattedNumber} is Open</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => onAssign(result.number, input)}
                                        className="py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <Edit3 size={14} />
                                        Dossier
                                    </button>

                                    <button 
                                        onClick={() => {
                                            onQuickAdd(result.number, input);
                                            setSuccessMsg(`Cast "${input}" as #${formattedNumber}`);
                                            setInput('');
                                            setTimeout(() => setSuccessMsg(null), 3000);
                                        }}
                                        className={`py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isOccupied ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
                                    >
                                        <Zap size={14} />
                                        {isOccupied ? 'Re-Cast' : 'Cast'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="text-center py-12 text-slate-500">
                {successMsg ? (
                    <div className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 p-4 rounded-xl inline-flex items-center gap-2 animate-in fade-in zoom-in-95">
                        <CheckCircle2 size={20} /> {successMsg}
                    </div>
                ) : (
                    <>
                        <div className="font-mono text-sm mb-2 opacity-50">Ready for audition...</div>
                        <p className="text-xs max-w-xs mx-auto opacity-50">
                            Try multi-strategy names like "Tony Stark" (10 or 12) or "Sun Wukong" (07 or 02).
                        </p>
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};