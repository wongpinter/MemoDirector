import React, { useState } from 'react';
import { MAJOR_SYSTEM, MajorSystemRule } from '../types';
import { BookOpen, Package, Loader2, ChevronLeft, ChevronRight, Rotate3D, AlertTriangle, GraduationCap, FileDown } from 'lucide-react';

export const MajorSystemTrainer: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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
  background-color: #0f172a;
}

/* Target Anki's body wrapper */
.card {
  font-family: 'Outfit', 'Segoe UI', system-ui, sans-serif;
  background-color: #0f172a !important;
  color: #f8fafc;
  font-size: 16px;
  line-height: 1.5;
  margin: 0 !important;
  padding: 0;
  width: 100%;
  min-height: 100vh; /* Full screen */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Inner Content Container */
.flashcard-container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

/* Front */
.digit {
  font-size: 140px;
  font-weight: 900;
  background: linear-gradient(135deg, #34d399, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: #34d399;
  margin: 0;
  line-height: 1;
  filter: drop-shadow(0 4px 10px rgba(52, 211, 153, 0.3));
}

/* Back */
.sounds-wrapper {
  background: #1e293b;
  border: 2px solid #334155;
  padding: 20px;
  border-radius: 16px;
  width: 100%;
  max-width: 320px;
}

.sounds-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 8px;
}

.sounds-val {
  font-size: 32px;
  font-weight: 800;
  color: #34d399;
  margin-bottom: 16px;
}

.mnemonic {
  font-style: italic;
  color: #e2e8f0;
  font-size: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #475569;
}

.examples-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.example-tag {
  background: #0f172a;
  color: #a5b4fc;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid #4338ca;
}
`.trim();

  const generateFrontHtml = (rule: MajorSystemRule) => `
<div class="flashcard-container">
  <div class="digit">${rule.digit}</div>
</div>`;

  const generateBackHtml = (rule: MajorSystemRule) => `
<div class="flashcard-container">
  <div class="sounds-wrapper">
    <div class="sounds-label">Phonetic Sounds</div>
    <div class="sounds-val">${rule.sounds.join(' / ')}</div>
    
    <div class="mnemonic">"${rule.mnemonic}"</div>
    
    <div class="sounds-label">Example Objects</div>
    <div class="examples-box">
        ${rule.examples.map(ex => `<span class="example-tag">${ex}</span>`).join('')}
    </div>
  </div>
</div>`;

  const handleDownloadTXT = () => {
    // Use Tab separator (standard for Anki) to avoid conflicts with CSS semicolons
    const sep = "\t";
    // Reordered Columns: Front HTML first, Back HTML second, then Metadata
    const header = `Front${sep}Back${sep}Digit\n`;
    
    const rows = MAJOR_SYSTEM.map(rule => {
      // Inline CSS into the fields so it works reasonably well even in text import
      // IMPORTANT: Strip newlines and tabs from HTML content to prevent breaking the TSV structure
      const styleTag = `<style>${cardCSS.replace(/[\r\n\t]/g, ' ')}</style>`;
      const front = (styleTag + generateFrontHtml(rule)).replace(/[\r\n\t]/g, ' ');
      const back = (styleTag + generateBackHtml(rule)).replace(/[\r\n\t]/g, ' ');
      
      // ORDER IS CRITICAL: Front, Back, then other fields
      return `${front}${sep}${back}${sep}${rule.digit}`;
    }).join("\n");

    const blob = new Blob([header + rows], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'major-system-rules.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCsvHelp(true);
  };

  const handleExportAPKG = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      // @ts-ignore
      const AnkiExportLib = window.AnkiExport;
      // @ts-ignore
      const saveAs = window.saveAs;

      if (!AnkiExportLib) {
         throw new Error("AnkiExport library failed to load. Please check your internet connection and refresh.");
      }
      if (!saveAs) {
         throw new Error("FileSaver library failed to load. Please check your internet connection and refresh.");
      }

      // Handle potential default export structure
      const AnkiGen = AnkiExportLib.default || AnkiExportLib;

      const apkg = new AnkiGen('Major System Rules (0-9)');
      const styleTag = `<style>${cardCSS}</style>`;

      for (const rule of MAJOR_SYSTEM) {
        const front = styleTag + generateFrontHtml(rule);
        const back = styleTag + generateBackHtml(rule);
        apkg.addCard(front, back);
      }

      const zip = await apkg.save();
      saveAs(zip, 'major-system-rules.apkg');
    } catch (e: any) {
      console.error("APKG Export failed:", e);
      setExportError("APKG Export Failed: " + (e.message || "Unknown Error"));
      
      // Slight delay to allow UI to update before fallback download
      setTimeout(() => {
          handleDownloadTXT();
          setExportError(prev => prev + ". Downloading Text backup instead...");
      }, 1500);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-center md:text-left">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 justify-center md:justify-start">
                    <GraduationCap className="text-indigo-400" /> Major System Training
                </h2>
                <p className="text-slate-400 max-w-xl">
                    Master the phonetic code that underpins the entire memory palace. 
                    Learn to convert digits 0-9 into consonant sounds.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleDownloadTXT}
                    disabled={isExporting}
                    className="h-12 px-6 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    title="Download Text File"
                >
                    <FileDown size={20} /> <span className="hidden sm:inline">TXT</span>
                </button>
                <button 
                    onClick={handleExportAPKG}
                    disabled={isExporting}
                    className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isExporting ? <Loader2 size={20} className="animate-spin" /> : <Package size={20} />}
                    Export Deck
                </button>
            </div>
        </div>

        {exportError && (
            <div className="p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl text-amber-200 flex flex-col gap-2 animate-in fade-in">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={20} /> 
                    <span className="text-sm font-bold">{exportError}</span>
                </div>
                <div className="text-xs text-amber-300/80 pl-8">
                    Please import the Text file manually if the APKG file was not generated.
                </div>
            </div>
        )}

        {showCsvHelp && (
            <div className="bg-slate-800 border border-indigo-500/30 rounded-xl p-6 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-indigo-400" /> How to Import Text to Anki
                    </h3>
                    <button onClick={() => setShowCsvHelp(false)} className="text-xs text-slate-500 hover:text-white">Dismiss</button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4 text-sm text-slate-300">
                        <p>If the automatic .APKG file fails, use the Text file with Anki's built-in importer:</p>
                        <ol className="list-decimal list-inside space-y-2 marker:text-indigo-500 marker:font-bold">
                            <li>Open Anki on your desktop.</li>
                            <li>Go to <strong>File</strong> &rarr; <strong>Import...</strong></li>
                            <li>Select the <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">major-system-rules.txt</code> you just downloaded.</li>
                            <li className="bg-indigo-900/20 p-1 rounded border border-indigo-500/30">
                                Anki should automatically detect fields separated by <strong>Tabs</strong>.
                            </li>
                            <li>Ensure <strong>"Allow HTML in fields"</strong> is <span className="text-emerald-400 font-bold">CHECKED</span>.</li>
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
                            <span className="text-slate-500">Field 3 (Digit)</span>
                            <span className="text-slate-600">&rarr;</span>
                            <span className="text-slate-300">Map to "Tags" or Ignore</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Reference Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700 text-xs uppercase text-slate-400 font-bold tracking-wider">
                            <th className="p-4">Digit</th>
                            <th className="p-4">Sounds</th>
                            <th className="p-4 hidden sm:table-cell">Mnemonic</th>
                            <th className="p-4">Examples</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-sm">
                        {MAJOR_SYSTEM.map((rule) => (
                            <tr key={rule.digit} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono font-black text-2xl text-indigo-400">{rule.digit}</td>
                                <td className="p-4 font-bold text-white">{rule.sounds.join(', ')}</td>
                                <td className="p-4 text-slate-400 italic hidden sm:table-cell">{rule.mnemonic}</td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1.5">
                                        {rule.examples.map((ex, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-700 rounded text-slate-200 text-xs border border-slate-600">
                                                {ex}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>

        {/* Card Preview Area */}
        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-800">
             <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-400" /> Flashcard Preview
                </h3>
                <p className="text-slate-400 text-sm">
                    This is how the cards will look in Anki. Practice flipping them to verify you know the sounds for each digit.
                </p>
                
                <div className="flex items-center justify-center gap-4 pt-4">
                    <button onClick={handlePrev} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-mono font-bold text-lg min-w-[3rem] text-center">
                        {activeItem.digit}
                    </span>
                    <button onClick={handleNext} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                        <ChevronRight size={24} />
                    </button>
                </div>
             </div>

             {/* The Stage */}
             <div className="relative bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-center p-8 min-h-[450px] overflow-hidden">
                <style>{cardCSS}</style>
                <div className="w-full h-full relative preserve-3d transition-transform duration-500">
                    {/* 
                        Simulation wrapper:
                        In Anki, .card is on the body.
                        Here we wrap content in a div that mimics .card behaviors but contained.
                    */}
                    <div className="card w-full relative" style={{ minHeight: '100%', height: 'auto', background: 'transparent' }}>
                        {!isFlipped ? (
                            <div className="flashcard-container animate-in fade-in zoom-in-95 duration-300 cursor-pointer" onClick={() => setIsFlipped(true)}>
                                <div className="digit">{activeItem.digit}</div>
                                <div className="absolute bottom-8 text-slate-500 text-xs uppercase tracking-widest font-bold">Click to Reveal</div>
                            </div>
                        ) : (
                            <div className="flashcard-container animate-in fade-in zoom-in-95 duration-300 cursor-pointer" onClick={() => setIsFlipped(false)}>
                                <div className="sounds-wrapper">
                                    <div className="sounds-label">Phonetic Sounds</div>
                                    <div className="sounds-val">{activeItem.sounds.join(' / ')}</div>
                                    
                                    <div className="mnemonic">"{activeItem.mnemonic}"</div>
                                    
                                    <div className="sounds-label">Example Objects</div>
                                    <div className="examples-box">
                                        {activeItem.examples.map((ex, i) => (
                                            <span key={i} className="example-tag">{ex}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="absolute bottom-4 right-4 z-10">
                    <button 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="p-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-full transition-all"
                        title="Flip Card"
                    >
                        <Rotate3D size={20} className={isFlipped ? 'rotate-180' : ''} />
                    </button>
                </div>
             </div>
        </div>

    </div>
  );
};