import React, { useState } from 'react';
import { MAJOR_SYSTEM } from '../types';
import { BookOpen, Package, ChevronLeft, ChevronRight, Rotate3D, GraduationCap } from 'lucide-react';
import { Card, Button, Badge, Notice } from './ui';

export const MajorSystemTrainer: React.FC = () => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const activeItem = MAJOR_SYSTEM[previewIndex];

  const handleNext = () => {
    setPreviewIndex((prev) => (prev + 1) % MAJOR_SYSTEM.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setPreviewIndex((prev) => (prev - 1 + MAJOR_SYSTEM.length) % MAJOR_SYSTEM.length);
    setIsFlipped(false);
  };

  const cardCSS = `
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: #dcdcdd;
}
.card {
  font-family: 'Instrument Sans', system-ui, sans-serif;
  background-color: #ffffff !important;
  color: #46494c;
  font-size: 16px;
  line-height: 1.5;
  margin: 0 !important;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.flashcard-container {
  width: 100%;
  max-width: 600px;
  padding: 24px;
  box-sizing: border-box;
}
.digit {
  font-family: 'Fraunces', serif;
  font-size: clamp(80px, 20vw, 140px);
  font-weight: 800;
  color: #1985a1;
  margin: 0;
}
.sounds {
  font-size: 28px;
  font-weight: 700;
  color: #46494c;
  margin: 16px 0;
}
.mnemonic {
  font-style: italic;
  color: #4c5c68;
  margin-bottom: 24px;
}
.examples {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}
.example-tag {
  background: #e5e4e6;
  border: 1px solid #c5c3c6;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 14px;
  color: #46494c;
}
`;

  const handleDownloadTXT = () => {
    const sep = '\t';
    const header = `#separator:tab\n#html:true\nFront${sep}Back${sep}Digit\n`;

    const rows = MAJOR_SYSTEM.map((rule) => {
      const styleTag = `<style>${cardCSS.replace(/[\r\n\t]/g, ' ')}</style>`;
      const frontHtml = `<div class="card"><div class="flashcard-container"><div class="digit">${rule.digit}</div></div></div>`;
      const backHtml = `<div class="card"><div class="flashcard-container"><div class="digit" style="font-size: 60px; margin-bottom: 10px;">${rule.digit}</div><div class="sounds">${rule.sounds.join(', ')}</div><div class="mnemonic">&ldquo;${rule.mnemonic}&rdquo;</div><div class="examples">${rule.examples.map((ex) => `<span class="example-tag">${ex}</span>`).join('')}</div></div></div>`;

      const front = (styleTag + frontHtml).replace(/[\r\n\t]/g, ' ');
      const back = (styleTag + backHtml).replace(/[\r\n\t]/g, ' ');

      return `${front}${sep}${back}${sep}${rule.digit}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'major_system_rules.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCsvHelp(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-charcoal flex items-center gap-2.5">
            <GraduationCap className="text-accent w-7 h-7" /> Major System Training
          </h2>
          <p className="text-steel text-sm max-w-xl mt-1">
            Master the phonetic code that underpins the entire PAO memory system. Digits 0–9 map to
            standard consonant sounds.
          </p>
        </div>
        <Button
          variant="accent"
          size="md"
          onClick={() => {
            handleDownloadTXT();
            setShowCsvHelp(true);
          }}
          icon={<Package className="w-4 h-4" />}
        >
          Export Deck for Anki
        </Button>
      </div>

      {showCsvHelp && (
        <Notice
          variant="info"
          title="Importing into Anki"
          className="border-accent/40"
        >
          <div className="space-y-2 mt-1 text-xs">
            <p>1. Open Anki and select <strong>File &rarr; Import...</strong></p>
            <p>2. Choose the downloaded <code className="bg-surface px-1 py-0.5 rounded border border-border">major_system_rules.txt</code>.</p>
            <p>3. Set Separator to <strong>Tab</strong> and ensure <strong>Allow HTML in fields</strong> is checked.</p>
            <Button size="sm" variant="ghost" onClick={() => setShowCsvHelp(false)} className="mt-2">
              Dismiss
            </Button>
          </div>
        </Notice>
      )}

      {/* Reference Table */}
      <Card variant="paper" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-xs uppercase text-steel font-semibold tracking-wider">
                <th className="p-3.5 pl-5">Digit</th>
                <th className="p-3.5">Consonant Sounds</th>
                <th className="p-3.5 hidden sm:table-cell">Mnemonic Anchor</th>
                <th className="p-3.5 pr-5">Examples</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {MAJOR_SYSTEM.map((rule) => (
                <tr key={rule.digit} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="p-3.5 pl-5 font-display font-bold text-2xl text-accent">
                    {rule.digit}
                  </td>
                  <td className="p-3.5 font-semibold text-charcoal">
                    {rule.sounds.join(', ')}
                  </td>
                  <td className="p-3.5 text-steel italic hidden sm:table-cell">
                    {rule.mnemonic}
                  </td>
                  <td className="p-3.5 pr-5">
                    <div className="flex flex-wrap gap-1.5">
                      {rule.examples.map((ex, i) => (
                        <Badge key={i} variant="default" size="sm">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Flashcard Interactive Preview */}
      <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
        <div className="space-y-3">
          <h3 className="text-lg font-display font-bold text-charcoal flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-accent" /> Flashcard Drill
          </h3>
          <p className="text-steel text-sm">
            Test yourself on the 10 phonetic anchors. Click the card to flip between digit and
            sounds.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            <span className="font-display font-bold text-lg min-w-12 text-center text-charcoal">
              {activeItem.digit}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              icon={<ChevronRight className="w-4 h-4" />}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFlipped(!isFlipped)}
              icon={<Rotate3D className="w-4 h-4" />}
            >
              Flip Card
            </Button>
          </div>
        </div>

        {/* Card Canvas */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="cursor-pointer min-h-60 rounded-2xl border border-border bg-surface p-8 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:border-accent hover:shadow-md select-none"
        >
          {!isFlipped ? (
            <div className="space-y-2">
              <span className="text-xs text-steel uppercase tracking-widest font-semibold">
                Digit
              </span>
              <div className="font-display font-extrabold text-7xl text-accent">
                {activeItem.digit}
              </div>
              <span className="text-xs text-steel/60">Click to reveal sound</span>
            </div>
          ) : (
            <div className="space-y-2.5 animate-in fade-in">
              <span className="text-xs text-steel uppercase tracking-widest font-semibold">
                Digit {activeItem.digit} Sounds
              </span>
              <div className="text-3xl font-bold text-charcoal font-sans">
                {activeItem.sounds.join(', ')}
              </div>
              <p className="text-sm italic text-steel">&ldquo;{activeItem.mnemonic}&rdquo;</p>
              <div className="flex gap-1.5 justify-center flex-wrap pt-2">
                {activeItem.examples.map((ex, i) => (
                  <Badge key={i} variant="accent" size="sm">
                    {ex}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
