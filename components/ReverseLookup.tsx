import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Edit3,
  Zap,
  UserSearch,
  Clapperboard,
  Ear,
} from 'lucide-react';
import { calculateMajorNumber, MajorResult } from '../constants';
import { PAOItem } from '../types';
import { useToast } from '../contexts';
import { Card, Button, Input, Badge } from './ui';

interface ReverseLookupProps {
  items: PAOItem[];
  onAssign: (number: number, name: string) => void;
  onQuickAdd: (number: number, name: string) => void;
}

export const ReverseLookup: React.FC<ReverseLookupProps> = ({ items, onAssign, onQuickAdd }) => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<MajorResult[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim().length > 1) {
        setResults(calculateMajorNumber(input));
      } else {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto py-4 px-2 space-y-6">
      <div className="text-center space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal flex justify-center items-center gap-2.5">
          <UserSearch className="text-accent w-7 h-7" /> Talent Scout
        </h2>
        <p className="text-steel text-sm max-w-md mx-auto">
          Screen-test any character name. The phonetic engine calculates which Major System card
          slots fit.
        </p>
      </div>

      <Card variant="paper" padding="lg" className="space-y-6">
        <div className="max-w-xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter talent name (e.g., Tony Stark, Sherlock Holmes)..."
            leftIcon={<Search className="w-5 h-5 text-steel" />}
            autoFocus
            className="h-12 text-base"
          />
        </div>

        {results.length > 0 ? (
          <div
            className={`grid gap-5 ${
              results.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'
            }`}
          >
            {results.map((result, idx) => {
              const formattedNumber = result.number.toString().padStart(2, '0');
              const existingItem = items.find((i) => i.number === result.number);
              const isOccupied = Boolean(existingItem && existingItem.person);
              const isInitials = result.method === 'Initials';

              return (
                <Card
                  key={idx}
                  variant="subtle"
                  padding="none"
                  className="overflow-hidden flex flex-col border-border"
                >
                  {/* Result Header */}
                  <div className="p-6 flex flex-col items-center justify-center bg-surface flex-1">
                    <span className="text-xs text-steel uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
                      {isInitials ? <Clapperboard className="w-3.5 h-3.5" /> : <Ear className="w-3.5 h-3.5" />}
                      {isInitials ? 'Initials Mode' : 'Phonetic Mode'}
                    </span>

                    <div className="text-6xl font-display font-bold text-charcoal mb-3">
                      {formattedNumber}
                    </div>

                    <Badge variant="subtle" size="sm" className="font-mono">
                      {isInitials && <Sparkles className="w-3 h-3 text-accent mr-1" />}
                      {result.explanation}
                    </Badge>
                  </div>

                  {/* Result Actions & Status */}
                  <div className={`p-4 border-t border-border ${isOccupied ? 'bg-conflict-light/20' : 'bg-accent-light/20'}`}>
                    <div className="flex items-center gap-1.5 mb-3 justify-center text-xs font-semibold">
                      {isOccupied ? (
                        <div className="flex items-center gap-1.5 text-conflict">
                          <AlertTriangle className="w-4 h-4" />
                          <span>
                            Slot #{formattedNumber} Filled: {existingItem?.person}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-accent">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Slot #{formattedNumber} is Open</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAssign(result.number, input)}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Open Card
                      </Button>

                      <Button
                        variant={isOccupied ? 'secondary' : 'accent'}
                        size="sm"
                        onClick={() => {
                          onQuickAdd(result.number, input);
                          showToast(`Cast "${input}" as #${formattedNumber}`, 'success');
                          setInput('');
                        }}
                        icon={<Zap className="w-3.5 h-3.5" />}
                      >
                        {isOccupied ? 'Re-Cast' : 'Assign'}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : input.trim().length > 1 ? (
          <div className="text-center py-8 text-steel text-sm">
            No phonetics found for &ldquo;{input}&rdquo;. Try another name.
          </div>
        ) : null}
      </Card>
    </div>
  );
};
