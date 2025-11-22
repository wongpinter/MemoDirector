import React, { useState } from 'react';
import { PAOItem } from '../types';
import { getPhoneticsForNumber } from '../constants';
import { Download, Copy, FileText, ChevronLeft, ChevronRight, Rotate3D, Package, Loader2, FileDown, AlertTriangle, Info, BookOpen } from 'lucide-react';

interface AnkiExportProps {
  items: PAOItem[];
}

export const AnkiExport: React.FC<AnkiExportProps> = ({ items }) => {
  const completedItems = items.filter(i => i.completed);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Demo item for when no items are completed yet
  const demoItem: PAOItem = {
    number: 0,
    person: "Zorro",
    action: "Slicing a 'Z' mark",
    object: "Sword",
    scene: "Zorro dramatically slashes a glowing red 'Z' into the velvet curtains using his silver Sword, while the audience gasps.",
    completed: true
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
.card {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.5;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 8px;
}

/* Front Side */
.front-wrapper {
  text-align: center;
}

.front-number {
  font-size: 140px;
  font-weight: 900;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: #818cf8; /* Fallback */
  filter: drop-shadow(0 4px 15px rgba(129, 140, 248, 0.4));
  margin: 0;
  line-height: 1;
  letter-spacing: -4px;
}

.front-hint {
  margin-top: 16px;
  font-size: 18px;
  color: #64748b;
  font-family: monospace;
  background: #1e293b;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

/* Back Side */
.back-container {
  width: 100%;
  max-width: 360px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 2px solid #334155;
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.header-number {
  font-size: 32px;
  font-weight: 900;
  color: #818cf8;
}

.header-phonetic {
  font-family: monospace;
  color: #94a3b8;
  font-size: 14px;
}

.pao-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.pao-item {
  display: flex;
  flex-direction: column;
  padding: 10px 14px;
  background: #0f172a;
  border-radius: 10px;
  border-left-width: 4px;
  border-left-style: solid;
}

.pao-item.person { border-left-color: #38bdf8; } /* Sky */
.pao-item.action { border-left-color: #34d399; } /* Emerald */
.pao-item.object { border-left-color: #f472b6; } /* Pink */

.label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  margin-bottom: 2px;
  opacity: 0.9;
}

.pao-item.person .label { color: #38bdf8; }
.pao-item.action .label { color: #34d399; }
.pao-item.object .label { color: #f472b6; }

.value {
  font-size: 18px;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.3;
}

.scene-box {
  position: relative;
  background: linear-gradient(145deg, #312e81, #1e1b4b);
  border-radius: 16px;
  padding: 24px 20px 20px 20px;
  border: 1px solid #4f46e5;
  box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
}

.scene-tag {
  position: absolute;
  top: -10px;
  left: 16px;
  background: #4f46e5;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.scene-text {
  font-style: italic;
  color: #e0e7ff;
  font-size: 15px;
  line-height: 1.6;
  text-align: left;
}
`.trim();

  const getSceneText = (item: PAOItem) => {
    if (item.scene && item.scene.trim().length > 0) return item.scene;
    return `${item.person} is ${item.action.toLowerCase()} with ${item.object.toLowerCase()}.`;
  };

  const generateFrontHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    const ph = getPhoneticsForNumber(item.number);
    return `
<div class="card">
  <div class="front-wrapper">
    <div class="front-number">${num}</div>
    <div class="front-hint">${ph}</div>
  </div>
</div>`;
  };

  const generateBackHtml = (item: PAOItem) => {
    const num = item.number.toString().padStart(2, '0');
    const ph = getPhoneticsForNumber(item.number);
    const sceneText = getSceneText(item);
    
    return `
<div class="card">
  <div class="back-container">
    <div class="header">
      <span class="header-number">#${num}</span>
      <span class="header-phonetic">${ph}</span>
    </div>
    <div class="pao-list">
      <div class="pao-item person">
        <span class="label">Person</span>
        <div class="value">${item.person}</div>
      </div>
      <div class="pao-item action">
        <span class="label">Action</span>
        <div class="value">${item.action}</div>
      </div>
      <div class="pao-item object">
        <span class="label">Object</span>
        <div class="value">${item.object}</div>
      </div>
    </div>
    <div class="scene-box">
      <div class="scene-tag">Director's Cut</div>
      <div class="scene-text">"${sceneText}"</div>
    </div>
  </div>
</div>`;
  };

  const handleDownloadTXT = () => {
    // Use Tab separator (Standard for Anki) to avoid conflicts with CSS semicolons and HTML attributes
    const sep = "\t";
    // Reordered Columns: Front HTML and Back HTML first, then metadata
    // This ensures Anki's default mapping (Field 1->Front, Field 2->Back) works out of the box.
    const header = `Front${sep}Back${sep}Number${sep}Person${sep}Action${sep}Object\n`;
    
    const rows = completedItems.map(item => {
      const num = item.number.toString().padStart(2, '0');
      
      // Prepare CSS - strip newlines/tabs for TSV safety
      const styleTag = `<style>${cardCSS.replace(/[\r\n\t]/g, ' ')}</style>`;
      
      // Prepare Content - strip newlines/tabs for TSV safety
      const frontHtml = generateFrontHtml(item).replace(/[\r\n\t]/g, ' ');
      const backHtml = generateBackHtml(item).replace(/[\r\n\t]/g, ' ');
      
      // Combined (Inject CSS into the fields for the text export)
      const front = styleTag + frontHtml;
      const back = styleTag + backHtml;

      // ORDER IS CRITICAL: Front, Back, then other fields
      return `${front}${sep}${back}${sep}${num}${sep}${item.person}${sep}${item.action}${sep}${item.object}`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mindpalace_pao_deck.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTutorial(true); // Auto show tutorial on download
  };

  const handleDownloadAPKG = async () => {
    if (completedItems.length === 0) return;
    setIsExporting(true);
    setExportError(null);

    try {
      // @ts-ignore
      const AnkiExportLib = window.AnkiExport;
      // @ts-ignore
      const saveAs = window.saveAs;

      if (!AnkiExportLib) {
        throw new Error("AnkiExport library failed to load from CDN. Please check internet connection.");
      }
      if (!saveAs) {
        throw new Error("FileSaver library failed to load from CDN. Please check internet connection.");
      }

      // Handle UMD vs ES Module export differences on window
      // Some builds put the constructor at default, others at root
      const AnkiGen = AnkiExportLib.default || AnkiExportLib;

      const apkg = new AnkiGen('MindPalace PAO');
      const styleTag = `<style>${cardCSS}</style>`;

      for (const item of completedItems) {
        const front = styleTag + generateFrontHtml(item);
        const back = styleTag + generateBackHtml(item);
        
        apkg.addCard(front, back);
      }

      const zip = await apkg.save();
      saveAs(zip, 'mindpalace-pao.apkg');
    } catch (error: any) {
      console.error("APKG generation failed:", error);
      setExportError("APKG Generation Failed: " + (error.message || "Unknown error"));
      // Automatically fallback to TXT after a delay
      setTimeout(() => {
          handleDownloadTXT();
          setExportError(prev => prev + ". Downloading Text backup instead...");
      }, 1500);
    } finally {
      setIsExporting(false);
    }
  };

  // Render preview content safely
  const renderPreviewContent = () => {
    if (!isFlipped) {
      return (
        <div className="front-wrapper">
            <div className="front-number">{numStr}</div>
            <div className="front-hint">{phonetics}</div>
        </div>
      );
    }
    const sceneText = getSceneText(activeItem);

    return (
      <div className="back-container">
        <div className="header">
            <span className="header-number">#{numStr}</span>
            <span className="header-phonetic">{phonetics}</span>
        </div>
        <div className="pao-list">
            <div className="pao-item person">
            <span className="label">Person</span>
            <div className="value">{activeItem.person}</div>
            </div>
            <div className="pao-item action">
            <span className="label">Action</span>
            <div className="value">{activeItem.action}</div>
            </div>
            <div className="pao-item object">
            <span className="label">Object</span>
            <div className="value">{activeItem.object}</div>
            </div>
        </div>
        <div className="scene-box">
            <div className="scene-tag">Director's Cut</div>
            <div className="scene-text">"{sceneText}"</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Top Section: Title & Download */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Anki Export</h2>
          <p className="text-slate-400 text-sm">
            {completedItems.length > 0 
              ? `Ready to export ${completedItems.length} cards.` 
              : "Complete some PAO items to enable export."}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
            {/* Secondary TXT Button */}
            <button 
                onClick={() => {
                    handleDownloadTXT();
                    setShowTutorial(true);
                }}
                disabled={completedItems.length === 0 || isExporting}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download Text/CSV Backup"
            >
                <FileDown size={20} /> <span className="hidden sm:inline">TXT</span>
            </button>

            {/* Primary APKG Button */}
            <button 
                onClick={handleDownloadAPKG}
                disabled={completedItems.length === 0 || isExporting}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
            {isExporting ? (
                <>
                    <Loader2 size={20} className="animate-spin" /> Generating...
                </>
            ) : (
                <>
                    <Package size={20} /> Export .APKG
                </>
            )}
            </button>
        </div>
      </div>

      {exportError && (
        <div className="p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl text-amber-200 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div className="flex-1">
                <p className="font-bold text-sm">{exportError}</p>
                <p className="text-xs mt-1 text-amber-300/80">
                    Browser libraries sometimes fail. We automatically downloaded a Text file for you. 
                    See the tutorial below on how to import it.
                </p>
            </div>
        </div>
      )}

      {/* Tutorial Section (Collapsible or always visible if toggled) */}
      {showTutorial && (
          <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6 animate-in slide-in-from-top-2">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-indigo-400" /> How to Import Text to Anki
                </h3>
                <button onClick={() => setShowTutorial(false)} className="text-xs text-slate-500 hover:text-white">Dismiss</button>
             </div>
             
             <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-4 text-sm text-slate-300">
                     <p>If the automatic .APKG file fails, use the Text file with Anki's built-in importer:</p>
                     <ol className="list-decimal list-inside space-y-2 marker:text-indigo-500 marker:font-bold">
                         <li>Open Anki on your desktop.</li>
                         <li>Go to <strong>File</strong> &rarr; <strong>Import...</strong></li>
                         <li>Select the <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">mindpalace_pao_deck.txt</code> you just downloaded.</li>
                         <li className="bg-indigo-900/20 p-1 rounded border border-indigo-500/30">
                             Anki should automatically set the <strong>Field Separator</strong> to <strong>Tab</strong>.
                         </li>
                         <li>In the import window, ensure <strong>"Allow HTML in fields"</strong> is <span className="text-emerald-400 font-bold">CHECKED</span>.</li>
                     </ol>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-xs font-mono space-y-2">
                     <p className="text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800 pb-2 mb-2">New Field Mapping</p>
                     <div className="flex justify-between items-center bg-indigo-900/20 p-1 rounded -mx-1">
                         <span className="text-indigo-300 font-bold">Field 1 (Front HTML)</span>
                         <span className="text-indigo-500">&rarr;</span>
                         <span className="text-indigo-300 font-bold">Front</span>
                     </div>
                     <div className="flex justify-between items-center bg-indigo-900/20 p-1 rounded -mx-1">
                         <span className="text-indigo-300 font-bold">Field 2 (Back HTML)</span>
                         <span className="text-indigo-500">&rarr;</span>
                         <span className="text-indigo-300 font-bold">Back</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-500">Field 3 (Number)</span>
                         <span className="text-slate-600">&rarr;</span>
                         <span className="text-slate-300">Map to "Tags" or Ignore</span>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-slate-500">Fields 4-6</span>
                         <span className="text-slate-600">&rarr;</span>
                         <span className="text-slate-300">Ignore (Metadata)</span>
                     </div>
                 </div>
             </div>
          </div>
      )}

      {/* Preview Section */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Card Visualizer */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm text-slate-400 px-2">
                <span className="font-bold uppercase tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Card Preview
                </span>
                {completedItems.length > 0 && (
                   <span className="font-mono">{previewIndex + 1} / {completedItems.length}</span>
                )}
            </div>

            {/* The Card Stage */}
            <div className="relative bg-slate-950 rounded-2xl p-8 border border-slate-800 shadow-2xl flex flex-col items-center justify-center min-h-[600px] overflow-hidden">
                {/* Inject Styles specifically for this preview container */}
                <style>{cardCSS}</style>
                
                <div className="card w-full">
                    {renderPreviewContent()}
                </div>

                {/* Controls */}
                <div className="absolute bottom-6 flex items-center gap-4 bg-slate-900/90 p-2 rounded-full border border-slate-700 backdrop-blur shadow-xl z-10">
                    <button onClick={handlePrev} disabled={completedItems.length === 0} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setIsFlipped(!isFlipped)} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-colors shadow-lg"
                    >
                        <Rotate3D size={16} className={isFlipped ? "rotate-180 transition-transform" : "transition-transform"} />
                        {isFlipped ? "Show Front" : "Show Back"}
                    </button>
                    <button onClick={handleNext} disabled={completedItems.length === 0} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
            <p className="text-center text-xs text-slate-500 italic">
                * This preview mirrors the styling in the exported deck.
            </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
            
            <div className="bg-emerald-900/20 border border-emerald-500/20 p-6 rounded-xl">
                <h4 className="text-emerald-400 font-bold text-lg mb-3 flex items-center gap-2">
                    <Package size={20} /> Import Instructions
                </h4>
                <ol className="list-decimal list-inside text-sm text-slate-300 space-y-3 ml-1">
                    <li className="pl-2">
                        Click <strong>Export .APKG</strong> to download the Anki deck file.
                    </li>
                    <li className="pl-2">
                        Locate the <code>mindpalace-pao.apkg</code> file on your computer.
                    </li>
                    <li className="pl-2">
                        <strong>Double-click</strong> the file. Anki should open and import it automatically.
                    </li>
                    <li className="pl-2">
                        <span className="text-slate-400 italic">If APKG fails, use the <button onClick={() => setShowTutorial(!showTutorial)} className="text-indigo-400 underline">TXT Method</button>.</span>
                    </li>
                </ol>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 opacity-70 hover:opacity-100 transition-opacity">
                <h3 className="text-slate-400 font-semibold mb-2 flex items-center gap-2 text-sm">
                    <Copy size={14} /> Manual CSS (Backup)
                </h3>
                <div className="relative group">
                    <div className="absolute -top-3 -right-3 p-2">
                        <button 
                            onClick={() => navigator.clipboard.writeText(cardCSS)}
                            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-bold"
                        >
                            <Copy size={14} /> Copy
                        </button>
                    </div>
                    <pre className="bg-slate-950 p-4 rounded-lg text-[10px] leading-relaxed text-indigo-200 font-mono overflow-x-auto h-[180px] border border-slate-900 custom-scrollbar">
                        {cardCSS}
                    </pre>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};