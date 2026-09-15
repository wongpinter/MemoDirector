import React, { useState, useRef, useMemo } from 'react';
import { PAOItem } from '../types';
import {
  CheckCircle2,
  Circle,
  Clapperboard,
  Image as ImageIcon,
  Video as VideoIcon,
  AlertTriangle,
  Search,
  Hash,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { detectConflicts, getConflictSummary, ItemConflicts } from '../utils/conflictDetection';
import { Card, Button, Input, Badge } from './ui';

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
      if (rect.top < 240) {
        setTooltipPosition('bottom');
      } else {
        setTooltipPosition('top');
      }
    }
  };

  const isComplete = Boolean(item.person && item.action && item.object);
  const hasScene = Boolean(isComplete && item.scene && item.scene.trim().length > 0);
  const hasConflict = Boolean(conflicts);

  const formattedNum = item.number.toString().padStart(2, '0');

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item.number)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item.number);
        }
      }}
      onMouseEnter={handleMouseEnter}
      className={`
        relative group cursor-pointer p-4 rounded-xl border transition-all duration-150 text-left z-0 hover:z-30
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
        ${
          hasConflict
            ? 'bg-conflict-light/40 border-conflict/60 hover:border-conflict hover:shadow-md'
            : isComplete
            ? 'bg-surface border-border hover:border-accent hover:shadow-md shadow-sm'
            : 'bg-surface/50 border-border-subtle hover:bg-surface hover:border-border'
        }
      `}
    >
      {/* Tooltip for Scene or Conflicts */}
      {(hasScene || hasConflict) && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2 w-64
            transition-opacity duration-150 pointer-events-none opacity-0 group-hover:opacity-100
            z-40
            ${tooltipPosition === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'}
          `}
        >
          <div
            className={`
              p-3 rounded-xl border shadow-xl text-xs bg-surface text-charcoal
              ${hasConflict ? 'border-conflict/50 ring-1 ring-conflict/20' : 'border-border'}
            `}
          >
            {hasConflict && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-conflict font-semibold uppercase tracking-wider text-xs pb-1 border-b border-conflict/20 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Conflict Warning
                </div>
                <div className="text-charcoal leading-relaxed">
                  {getConflictSummary(conflicts!)}
                </div>
              </div>
            )}

            {hasScene && (
              <div>
                <div className="flex items-center gap-1 text-accent font-semibold uppercase tracking-wider text-xs pb-1 border-b border-border mb-1">
                  <Clapperboard className="w-3.5 h-3.5" /> Director&apos;s Cut
                </div>
                <p className="italic text-steel font-sans leading-relaxed">
                  &ldquo;{item.scene}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Card Header: Number + Indicators */}
      <div className="flex justify-between items-start mb-2">
        <span
          className={`
            font-display text-3xl font-bold tracking-tight transition-colors
            ${
              hasConflict
                ? 'text-conflict'
                : isComplete
                ? 'text-charcoal group-hover:text-accent'
                : 'text-steel/60 group-hover:text-steel'
            }
          `}
        >
          {formattedNum}
        </span>

        <div className="flex items-center gap-1.5">
          {hasConflict && (
            <span title="Conflict in this card">
              <AlertTriangle className="w-4 h-4 text-conflict" />
            </span>
          )}
          {item.videoUrl && <VideoIcon className="w-3.5 h-3.5 text-accent" />}
          {item.imageUrl && <ImageIcon className="w-3.5 h-3.5 text-steel" />}
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-accent" />
          ) : (
            <Circle className="w-4 h-4 text-border" />
          )}
        </div>
      </div>

      {/* Card Body: Person / Action / Object */}
      <div className="space-y-1">
        {item.person ? (
          <div className="font-semibold text-charcoal truncate text-sm">
            {item.person}
          </div>
        ) : (
          <div className="h-5 bg-border-subtle rounded w-3/4 animate-pulse" />
        )}

        <div className="text-xs text-steel flex flex-col gap-0.5">
          <span className="truncate">{item.action || '—'}</span>
          <span className="truncate font-medium text-accent-dark">{item.object || '—'}</span>
        </div>
      </div>

      {/* Edit Hint on Hover */}
      <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-steel opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-steel/70">Card #{formattedNum}</span>
        <span className="font-medium text-accent flex items-center gap-1">
          <Edit3 className="w-3 h-3" /> Edit
        </span>
      </div>
    </div>
  );
};

export const PAOGrid: React.FC<PAOGridProps> = ({ items, onSelect, onLoadExample }) => {
  const conflictMap = useMemo(() => detectConflicts(items), [items]);
  const [search, setSearch] = useState('');
  const [jumpNum, setJumpNum] = useState('');

  const isEmpty = !items.some((i) => i.person || i.action || i.object);

  const filtered = useMemo(() => {
    let result = items;

    if (jumpNum) {
      const n = parseInt(jumpNum, 10);
      if (!isNaN(n) && n >= 0 && n <= 99) {
        return items.filter((i) => i.number === n);
      }
      return [];
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.person.toLowerCase().includes(q) ||
          i.action.toLowerCase().includes(q) ||
          i.object.toLowerCase().includes(q),
      );
      result = [...result].sort((a, b) => {
        const aMatch = a.person.toLowerCase().includes(q)
          ? 0
          : a.action.toLowerCase().includes(q)
          ? 1
          : 2;
        const bMatch = b.person.toLowerCase().includes(q)
          ? 0
          : b.action.toLowerCase().includes(q)
          ? 1
          : 2;
        return aMatch - bMatch;
      });
    }

    return result;
  }, [items, search, jumpNum]);

  const completedCount = items.filter((i) => i.person && i.action && i.object).length;

  return (
    <div className="space-y-4">
      {/* Empty-state onboarding */}
      {isEmpty && (
        <Card variant="paper" padding="lg" className="text-center mb-6 border-dashed">
          <Clapperboard className="w-12 h-12 mx-auto mb-3 text-accent" />
          <h2 className="text-2xl font-display font-bold text-charcoal mb-2">
            Welcome to MemoDirector
          </h2>
          <p className="text-steel max-w-md mx-auto mb-6 text-sm leading-relaxed">
            Build your PAO (Person-Action-Object) memory deck using the Major System. Each number
            00–99 encodes a character, an action, and an object matching the phonetic rules.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onLoadExample && (
              <Button
                variant="accent"
                size="md"
                onClick={onLoadExample}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Load Example Set
              </Button>
            )}
            <Button variant="outline" size="md" onClick={() => onSelect(0)}>
              Start from Scratch
            </Button>
          </div>
        </Card>
      )}

      {/* Filter and stats toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-2 items-center">
          <div className="flex-1 max-w-md">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setJumpNum('');
              }}
              placeholder="Search person, action, or object..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-28">
            <Input
              type="number"
              min={0}
              max={99}
              value={jumpNum}
              onChange={(e) => {
                setJumpNum(e.target.value);
                setSearch('');
              }}
              placeholder="00–99"
              leftIcon={<Hash className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-steel self-end sm:self-auto">
          {(search || jumpNum) && (
            <span>
              Showing {filtered.length} of {items.length} cards
            </span>
          )}
          <Badge variant="subtle" size="md">
            {completedCount} / 100 Complete
          </Badge>
        </div>
      </div>

      {/* 100-Card Studio Grid */}
      {filtered.length === 0 && !isEmpty ? (
        <Card variant="paper" padding="lg" className="text-center py-12">
          <p className="text-steel text-sm">No cards match &ldquo;{search || jumpNum}&rdquo;.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch('');
              setJumpNum('');
            }}
            className="mt-3"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-16">
          {filtered.map((item) => (
            <PAOCard
              key={item.number}
              item={item}
              onSelect={onSelect}
              conflicts={conflictMap.get(item.number)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
