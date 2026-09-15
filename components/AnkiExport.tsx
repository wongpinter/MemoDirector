import React, { useState, useEffect } from 'react';
import { PAOItem, PAOVersion } from '../types';
import { getPhoneticsForNumber } from '../constants';
import { Download, Copy, FileText, ChevronLeft, ChevronRight, Rotate3D, BookOpen, Package } from 'lucide-react';
import { listVersions, getActiveVersion } from '../services/paoStore';
import { Card, Button, Select, Badge, Notice, TabGroup } from './ui';

interface AnkiExportProps {
  items: PAOItem[];
}

type ExportType = 'complete' | 'minimalist';

export const AnkiExport: React.FC<AnkiExportProps> = ({ items }) => {
  const [versions, setVersions] = useState<PAOVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [displayItems, setDisplayItems] = useState<PAOItem[]>(items);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('complete');

  useEffect(() => {
    const loadedVersions = listVersions();
    setVersions(loadedVersions);

    const active = getActiveVersion();
    if (active) {
      setSelectedVersionId(active.id);
    }
  }, []);

  useEffect(() => {
    if (selectedVersionId) {
      const version = versions.find((v) => v.id === selectedVersionId);
      if (version) {
        setDisplayItems(version.items);
      }
    } else {
      setDisplayItems(items);
    }
    setPreviewIndex(0);
  }, [selectedVersionId, versions, items]);

  const completedItems = displayItems.filter((i) => i.completed);
  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const demoItem: PAOItem = {
    number: 0,
    person: 'Zorro',
    action: "Slicing a 'Z' mark",
    object: 'Sword',
    scene:
      'Zorro dramatically slashes a glowing red Z mark into the curtains using his silver sword.',
    completed: true,
  };

  const activeItem = completedItems.length > 0 ? completedItems[previewIndex] : demoItem;
  const numStr = activeItem.number.toString().padStart(2, '0');
  const phonetics = getPhoneticsForNumber(activeItem.number);

  const handleNext = () => {
    if (completedItems.length === 0) return;
    setPreviewIndex((prev) => (prev + 1) % completedItems.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    if (completedItems.length === 0) return;
    setPreviewIndex((prev) => (prev - 1 + completedItems.length) % completedItems.length);
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
}
.flashcard-container {
  width: 100%;
  max-width: 540px;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.front-wrapper {
  text-align: center;
  padding: 32px 16px;
}
.front-number {
  font-family: 'Fraunces', serif;
  font-size: 110px;
  font-weight: 800;
  color: #1985a1;
  margin: 0;
  line-height: 1;
}
.front-hint {
  font-size: 14px;
  color: #4c5c68;
  margin-top: 16px;
  font-family: 'Space Mono', monospace;
  background: #e5e4e6;
  padding: 4px 12px;
  border-radius: 9999px;
  display: inline-block;
  border: 1px solid #c5c3c6;
}
.back-container {
  width: 100%;
  max-width: 500px;
  border: 1px solid #c5c3c6;
  border-radius: 12px;
  padding: 24px;
  background: #ffffff;
  box-sizing: border-box;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid #c5c3c6;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.header-number {
  font-family: 'Fraunces', serif;
  font-size: 32px;
  font-weight: 800;
  color: #1985a1;
}
.header-phonetic {
  font-size: 12px;
  color: #4c5c68;
  font-family: 'Space Mono', monospace;
}
.pao-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.pao-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: #e5e4e6;
}
.pao-item .label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4c5c68;
  width: 70px;
  flex-shrink: 0;
}
.pao-item .value {
  font-size: 15px;
  font-weight: 600;
  color: #46494c;
}
.scene-box {
  border-top: 1px solid #c5c3c6;
  padding-top: 12px;
}
.scene-tag {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #1985a1;
  font-weight: 700;
  margin-bottom: 4px;
}
.scene-text {
  font-size: 14px;
  line-height: 1.5;
  color: #4c5c68;
  font-style: italic;
}
`;

  const generateFrontHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    const ph = getPhoneticsForNumber(item.number);
    return `<div class="card"><div class="flashcard-container"><div class="front-wrapper"><div class="front-number">${num}</div><div class="front-hint">${ph}</div></div></div></div>`;
  };

  const generateBackHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    const ph = getPhoneticsForNumber(item.number);
    return `<div class="card"><div class="flashcard-container"><div class="back-container"><div class="header"><span class="header-number">#${num}</span><span class="header-phonetic">${ph}</span></div><div class="pao-list"><div class="pao-item"><span class="label">Person</span><div class="value">${item.person}</div></div><div class="pao-item"><span class="label">Action</span><div class="value">${item.action}</div></div><div class="pao-item"><span class="label">Object</span><div class="value">${item.object}</div></div></div>${item.scene ? `<div class="scene-box"><div class="scene-tag">Director's Cut</div><div class="scene-text">&ldquo;${item.scene}&rdquo;</div></div>` : ''}</div></div></div>`;
  };

  const generateMinimalistFrontHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    return `<div class="card"><div class="flashcard-container"><div class="front-wrapper"><div class="front-number">${num}</div></div></div></div>`;
  };

  const generateMinimalistBackHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    return `<div class="card"><div class="flashcard-container"><div class="back-container"><div class="header"><span class="header-number">#${num}</span></div><div class="pao-list"><div class="pao-item"><span class="label">Person</span><div class="value">${item.person}</div></div><div class="pao-item"><span class="label">Action</span><div class="value">${item.action}</div></div><div class="pao-item"><span class="label">Object</span><div class="value">${item.object}</div></div></div></div></div></div>`;
  };

  const handleDownloadTXT = (type: ExportType = 'complete') => {
    const sep = '\t';
    const header = `#separator:tab\n#html:true\nFront${sep}Back${sep}Number${sep}Person${sep}Action${sep}Object\n`;

    const rows = completedItems
      .map((item) => {
        const num = item.number.toString().padStart(2, '0');
        const styleTag = `<style>${cardCSS.replace(/[\r\n\t]/g, ' ')}</style>`;
        const frontHtml =
          type === 'minimalist'
            ? generateMinimalistFrontHtml(item).replace(/[\r\n\t]/g, ' ')
            : generateFrontHtml(item).replace(/[\r\n\t]/g, ' ');
        const backHtml =
          type === 'minimalist'
            ? generateMinimalistBackHtml(item).replace(/[\r\n\t]/g, ' ')
            : generateBackHtml(item).replace(/[\r\n\t]/g, ' ');

        const front = styleTag + frontHtml;
        const back = styleTag + backHtml;

        return `${front}${sep}${back}${sep}${num}${sep}${item.person}${sep}${item.action}${sep}${item.object}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const versionName = selectedVersion?.name.toLowerCase().replace(/\s+/g, '_') || 'default';
    const typeSuffix = type === 'minimalist' ? '_minimalist' : '';
    link.setAttribute('download', `pao_deck_${versionName}${typeSuffix}.txt`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTutorial(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4 px-2 space-y-6">
      {/* Top Banner: Export Action */}
      <Card variant="paper" padding="md" className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-charcoal">
              Anki Deck Export
            </h2>
            <p className="text-steel text-xs sm:text-sm mt-0.5">
              {completedItems.length > 0
                ? `${completedItems.length} cards ready for export from "${selectedVersion?.name || 'Selected Version'}"`
                : 'Complete some PAO card entries to enable deck export.'}
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="accent"
              size="md"
              disabled={completedItems.length === 0}
              onClick={() => handleDownloadTXT('complete')}
              icon={<Download className="w-4 h-4" />}
            >
              Export Complete Deck
            </Button>
            <Button
              variant="outline"
              size="md"
              disabled={completedItems.length === 0}
              onClick={() => handleDownloadTXT('minimalist')}
              icon={<Download className="w-4 h-4" />}
            >
              Minimalist
            </Button>
          </div>
        </div>

        {/* Filters & Options */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
          {versions.length > 0 && (
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <span className="text-xs text-steel font-semibold">Deck Version:</span>
              <div className="flex-1 sm:max-w-xs">
                <Select
                  value={selectedVersionId || ''}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="h-9 text-xs"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.isActive ? '(Active)' : ''} — {v.items.filter((i) => i.completed).length} cards
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-steel font-semibold">Preview Format:</span>
            <TabGroup<ExportType>
              tabs={[
                { id: 'complete', label: 'Complete' },
                { id: 'minimalist', label: 'Minimalist' },
              ]}
              activeId={exportType}
              onChange={setExportType}
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Tutorial Banner */}
      {showTutorial && (
        <Notice variant="info" title="How to Import Deck into Anki">
          <div className="space-y-1 mt-1 text-xs">
            <p>1. Open desktop Anki and go to <strong>File &rarr; Import...</strong></p>
            <p>2. Select the downloaded <code className="bg-surface px-1 py-0.5 rounded border border-border">pao_deck_*.txt</code> file.</p>
            <p>3. Confirm Field Separator is <strong>Tab</strong> and <strong>Allow HTML in fields</strong> is checked.</p>
            <Button size="sm" variant="ghost" onClick={() => setShowTutorial(false)} className="mt-1">
              Dismiss
            </Button>
          </div>
        </Notice>
      )}

      {/* Preview Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Card Canvas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-steel px-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Anki Visualizer
            </span>
            {completedItems.length > 0 && (
              <span className="font-mono">
                Card {previewIndex + 1} of {completedItems.length}
              </span>
            )}
          </div>

          <div className="relative rounded-2xl border border-border bg-canvas p-6 shadow-sm min-h-80 flex flex-col items-center justify-center text-center overflow-hidden">
            <style>{cardCSS}</style>

            <div
              className="card w-full"
              style={{ minHeight: 'auto', background: 'transparent' }}
            >
              {!isFlipped ? (
                <div className="front-wrapper">
                  <div className="front-number">{numStr}</div>
                  {exportType === 'complete' && <div className="front-hint">{phonetics}</div>}
                </div>
              ) : (
                <div className="back-container">
                  <div className="header">
                    <span className="header-number">#{numStr}</span>
                    {exportType === 'complete' && (
                      <span className="header-phonetic">{phonetics}</span>
                    )}
                  </div>
                  <div className="pao-list">
                    <div className="pao-item">
                      <span className="label">Person</span>
                      <div className="value">{activeItem.person}</div>
                    </div>
                    <div className="pao-item">
                      <span className="label">Action</span>
                      <div className="value">{activeItem.action}</div>
                    </div>
                    <div className="pao-item">
                      <span className="label">Object</span>
                      <div className="value">{activeItem.object}</div>
                    </div>
                  </div>
                  {exportType === 'complete' && activeItem.scene && (
                    <div className="scene-box">
                      <div className="scene-tag">Director&apos;s Cut</div>
                      <div className="scene-text">&ldquo;{activeItem.scene}&rdquo;</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Flipper Controls */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border w-full justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrev}
                disabled={completedItems.length === 0}
                icon={<ChevronLeft className="w-4 h-4" />}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setIsFlipped(!isFlipped)}
                icon={<Rotate3D className="w-4 h-4" />}
              >
                {isFlipped ? 'Show Front' : 'Show Back'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
                disabled={completedItems.length === 0}
                icon={<ChevronRight className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="space-y-4">
          <Card variant="paper" padding="md" className="space-y-3">
            <h4 className="font-display font-bold text-charcoal text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" /> Anki Import Checklist
            </h4>
            <ol className="list-decimal list-inside text-xs text-steel space-y-2 leading-relaxed">
              <li>Export and download your <code>.txt</code> deck.</li>
              <li>In Anki Desktop, choose <strong>File &rarr; Import</strong>.</li>
              <li>Anki auto-maps Tab separator: Field 1 = Front, Field 2 = Back.</li>
              <li>Ensure <strong>Allow HTML in fields</strong> is checked.</li>
              <li>Daily spaced repetition embeds the 00–99 matrix into muscle memory.</li>
            </ol>
          </Card>

          <Card variant="subtle" padding="sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-steel flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Embedded Card CSS
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(cardCSS)}
              >
                Copy CSS
              </Button>
            </div>
            <pre className="p-3 bg-surface rounded-lg text-xs font-mono text-charcoal overflow-x-auto h-36 border border-border">
              {cardCSS}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};
