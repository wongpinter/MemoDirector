import React, { useState, useRef, useMemo } from 'react';
import { PAOItem } from '../types';
import { CheckCircle2, Circle, Clapperboard, Image as ImageIcon, Video as VideoIcon, AlertTriangle } from 'lucide-react';
import { detectConflicts, hasConflicts, getConflictSummary, ItemConflicts } from '../utils/conflictDetection';

interface PAOGridProps {
  items: PAOItem[];
  onSelect: (num: number) => void;
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
      onClick={() => onSelect(item.number)}
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
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-indigo-400 font-mono">EDIT</span>
      </div>
    </div>
  );
};

export const PAOGrid: React.FC<PAOGridProps> = ({ items, onSelect }) => {
  // Detect conflicts across all items
  const conflictMap = useMemo(() => detectConflicts(items), [items]);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
      {items.map((item) => (
        <PAOCard 
          key={item.number} 
          item={item} 
          onSelect={onSelect}
          conflicts={conflictMap.get(item.number)}
        />
      ))}
    </div>
  );
};