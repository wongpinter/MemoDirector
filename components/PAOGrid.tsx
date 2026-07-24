import React, { useState, useRef, useMemo } from 'react';
import { PAOItem } from '../types';
import { CheckCircle2, Circle, Clapperboard, Image as ImageIcon, Video as VideoIcon, AlertTriangle, Search, Hash, Sparkles } from 'lucide-react';
import { detectConflicts, hasConflicts, getConflictSummary, ItemConflicts } from '../utils/conflictDetection';

interface PAOGridProps {
  items: PAOItem[];
  onSelect: (num: number) => void;
  onLoadExample?: () => void;
}

interface PAOCardProps {
  item: PAOItem;
  onSelect: (num: number) => void;
  conflicts?: ItemConflicts;
}

const PAOCard: React.FC<PAOCardProps> = ({ item, onSelect, conflicts }) => {
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      // If the card is within 250px of the viewport top (header area + tooltip clearance),
      // flip the tooltip to the bottom to avoid being covered/clipped.
      if (rect.top < 250) {
        setTooltipPosition('bottom');
      } else {
        setTooltipPosition('top');
      }
    }
  };

  const isComplete = item.person && item.action && item.object;
  const hasScene = isComplete && item.scene && item.scene.trim().length > 0;
  const hasMedia = !!(item.imageUrl || item.videoUrl);
  const hasConflict = !!conflicts;

  return (
    <div 
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.number)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.number); } }}
      onMouseEnter={handleMouseEnter}
      className={`
        relative group cursor-pointer p-4 rounded-xl border transition-all duration-300
        hover:scale-[1.02] hover:shadow-xl z-0 hover:z-40
        ${hasConflict
          ? 'bg-amber-950/30 border-amber-600/50 hover:border-amber-500'
          : isComplete 
            ? 'bg-slate-800/50 border-slate-700 hover:border-indigo-500/50' 
            : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50'
        }
      `}
    >
      {/* Tooltip for Scene or Conflicts */}
      {(hasScene || hasConflict) && (
        <div className={`
            absolute left-1/2 -translate-x-1/2 w-64 
            transition-all duration-300 pointer-events-none opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
            z-50
            ${tooltipPosition === 'top' 
                ? 'bottom-full mb-3 origin-bottom' 
                : 'top-full mt-3 origin-top'
            }
        `}>
          <div className={`bg-slate-900/95 backdrop-blur-md text-slate-200 text-xs p-3 rounded-xl border shadow-2xl relative ${
            hasConflict ? 'border-amber-500/50' : 'border-indigo-500/30'
          }`}>
             {hasConflict && (
               <>
                 <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase mb-1.5 tracking-wider border-b border-amber-500/20 pb-1">
                    <AlertTriangle size={10} /> Conflict Warning
                 </div>
                 <div className="text-amber-200 text-[11px] leading-relaxed mb-2">
                   {getConflictSummary(conflicts)}
                 </div>
               </>
             )}
             
             {hasScene && (
               <>
                 <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-bold uppercase mb-1.5 tracking-wider border-b border-indigo-500/20 pb-1">
                    <Clapperboard size={10} /> Director's Cut
                 </div>
                 <div className="italic leading-relaxed text-slate-300 font-serif">"{item.scene}"</div>
               </>
             )}
             
             {/* Dynamic Arrow */}
             {tooltipPosition === 'top' ? (
                 <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/95 border-b border-r rotate-45 ${
                   hasConflict ? 'border-amber-500/50' : 'border-indigo-500/30'
                 }`}></div>
             ) : (
                 <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900/95 border-t border-l rotate-45 ${
                   hasConflict ? 'border-amber-500/50' : 'border-indigo-500/30'
                 }`}></div>
             )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <span className={`text-3xl font-black font-mono transition-colors ${
          hasConflict ? 'text-amber-600 group-hover:text-amber-500' : 'text-slate-700 group-hover:text-indigo-500'
        }`}>
          {item.number.toString().padStart(2, '0')}
        </span>
        <div className="flex items-center gap-2">
            {/* Conflict Indicator */}
            {hasConflict && <AlertTriangle size={16} className="text-amber-500 animate-pulse" />}
            
            {/* Media Indicators */}
            {item.videoUrl && <VideoIcon size={14} className="text-indigo-400" />}
            {item.imageUrl && <ImageIcon size={14} className="text-pink-400" />}
            
            {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
            <Circle className="w-5 h-5 text-slate-600" />
            )}
        </div>
      </div>
      
      <div className="space-y-1">
        {item.person ? (
          <div className="font-bold text-slate-200 truncate">{item.person}</div>
        ) : (
          <div className="h-6 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
        )}
        
        <div className="text-xs text-slate-400 flex flex-col gap-0.5">
          <span className="truncate">{item.action || '...'}</span>
          <span className="truncate text-indigo-300">{item.object || '...'}</span>
        </div>
      </div>
      
      {/* Hover indicator */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-70 transition-opacity">
          <span className="text-xs text-indigo-400 font-mono">EDIT</span>
      </div>
    </div>
  );
};

export const PAOGrid: React.FC<PAOGridProps> = ({ items, onSelect, onLoadExample }) => {
  const conflictMap = useMemo(() => detectConflicts(items), [items]);
  const [search, setSearch] = useState('');
  const [jumpNum, setJumpNum] = useState('');

  const isEmpty = !items.some(i => i.person || i.action || i.object);

  const filtered = useMemo(() => {
    let result = items;

    // Number jump — show only that card (but keep it in grid context)
    if (jumpNum) {
      const n = parseInt(jumpNum, 10);
      if (!isNaN(n) && n >= 0 && n <= 99) {
        return items.filter(i => i.number === n);
      }
      return [];
    }

    // Text search across person, action, object
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.person.toLowerCase().includes(q) ||
        i.action.toLowerCase().includes(q) ||
        i.object.toLowerCase().includes(q)
      );
      // Push matching items to top (sort by match quality: person > action > object)
      result = [...result].sort((a, b) => {
        const aMatch = a.person.toLowerCase().includes(q) ? 0 : a.action.toLowerCase().includes(q) ? 1 : 2;
        const bMatch = b.person.toLowerCase().includes(q) ? 0 : b.action.toLowerCase().includes(q) ? 1 : 2;
        return aMatch - bMatch;
      });
    }

    return result;
  }, [items, search, jumpNum]);

  return (
    <div>
      {/* Empty-state onboarding */}
      {isEmpty && (
        <div className="text-center py-12 px-4 mb-6 bg-slate-800/30 border border-slate-700 rounded-2xl">
          <Clapperboard size={48} className="mx-auto mb-4 text-indigo-400 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to MemoDirector</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">
            Build your PAO (Person-Action-Object) memory system using the Major System.
            Each number 00–99 gets a character, an action, and an object that phonetically
            match the digits.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onLoadExample && (
              <button
                onClick={onLoadExample}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Load Example Set
              </button>
            )}
            <button
              onClick={() => onSelect(0)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Start from Scratch
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-4">
            Or use <strong>Casting Search</strong> to find celebrities by name and assign them to numbers.
          </p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setJumpNum(''); }}
              placeholder="Filter by name, action, or object…"
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="relative w-32">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="number"
              min={0}
              max={99}
              value={jumpNum}
              onChange={e => { setJumpNum(e.target.value); setSearch(''); }}
              placeholder="00–99"
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          {(search || jumpNum) && (
            <div className="text-xs text-slate-500 self-center">
              {filtered.length} of {items.length}
            </div>
          )}
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
        {filtered.map((item) => (
          <PAOCard
            key={item.number}
            item={item}
            onSelect={onSelect}
            conflicts={conflictMap.get(item.number)}
          />
        ))}
      </div>
    </div>
  );
};