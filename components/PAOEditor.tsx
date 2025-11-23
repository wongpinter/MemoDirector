import React, { useState, useEffect } from 'react';
import { PAOItem, Suggestion } from '../types';
import { getPhoneticsForNumber, DEFAULT_THEMES } from '../constants';
import { getPAOSuggestions, getSceneDescription, generateMemoryImage, generateMemoryVideo } from '../services/llmService';
import { uploadMedia } from '../services/db';
import { X, Sparkles, Save, Wand2, AlertCircle, Clapperboard, Undo2, ArrowRight, Users, Megaphone, Trash2, Ear, Image as ImageIcon, Video as VideoIcon, Loader2, Play } from 'lucide-react';

interface PAOEditorProps {
  number: number;
  initialData?: PAOItem;
  onClose: () => void;
  onSave: (item: PAOItem) => void;
}

export const PAOEditor: React.FC<PAOEditorProps> = ({ number, initialData, onClose, onSave }) => {
  const [person, setPerson] = useState(initialData?.person || '');
  const [action, setAction] = useState(initialData?.action || '');
  const [object, setObject] = useState(initialData?.object || '');
  const [scene, setScene] = useState(initialData?.scene || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  
  const [theme, setTheme] = useState(DEFAULT_THEMES[0]);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [customThemes, setCustomThemes] = useState<string[]>([]);
  
  const [strictMode, setStrictMode] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [isGenMedia, setIsGenMedia] = useState<'image' | 'video' | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [excludedPersons, setExcludedPersons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Validation State
  const [fieldErrors, setFieldErrors] = useState<{ person?: string; action?: string; object?: string }>({});

  const CHAR_LIMIT = 280;
  const THEME_STORAGE_KEY = 'mindpalace_custom_themes';
  
  // If the user has typed a person, we suggest actions for that person instead of generating a new person.
  const hasPersonInput = person.trim().length > 0;

  // Load custom themes on mount
  useEffect(() => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            setCustomThemes(JSON.parse(stored));
        }
    } catch (e) {
        console.error("Failed to load custom themes", e);
    }
  }, []);

  const handleSave = () => {
    // Validation
    const errors: { person?: string; action?: string; object?: string } = {};
    let isValid = true;

    if (!person.trim()) {
        errors.person = "Person is required";
        isValid = false;
    }
    if (!action.trim()) {
        errors.action = "Action is required";
        isValid = false;
    }
    if (!object.trim()) {
        errors.object = "Object is required";
        isValid = false;
    }

    setFieldErrors(errors);

    if (isValid) {
        onSave({
            number,
            person,
            action,
            object,
            scene,
            imageUrl,
            videoUrl,
            completed: true
        });
        onClose();
    }
  };

  const handleGenerate = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setError("API Key missing in env variables. Suggestions unavailable in this demo.");
        return;
    }

    // Ensure custom theme is not empty
    if (isCustomTheme && !theme.trim()) {
        setError("Please enter a name for your custom theme.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setSuggestions([]); // Clear previous suggestions while loading

    // Save custom theme if it's new
    if (isCustomTheme && theme.trim().length > 0) {
        const newTheme = theme.trim();
        if (!DEFAULT_THEMES.includes(newTheme) && !customThemes.includes(newTheme)) {
            const updatedThemes = [...customThemes, newTheme];
            setCustomThemes(updatedThemes);
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updatedThemes));
        }
    }

    try {
      // If user typed a person, pass it to the service to get specific actions
      const results = await getPAOSuggestions(
          number, 
          theme, 
          hasPersonInput ? person : undefined,
          strictMode,
          excludedPersons
      );
      
      // Track the new persons to exclude them in future generations
      const newPersons = results.map(s => s.person);
      setExcludedPersons(prev => [...prev, ...newPersons]);
      
      setSuggestions(results);
    } catch (e) {
      console.error("❌ PAO Generation Error:", e);
      const errorMsg = e instanceof Error ? e.message : "Failed to get suggestions. Try again.";
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectorCut = async () => {
     if (!person || !action || !object) {
         setError("Fill in Person, Action, and Object first.");
         return;
     }
     if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setScene(`${person} is ${action} with ${object}.`);
        return;
     }
     setIsDirecting(true);
     try {
         const desc = await getSceneDescription(person, action, object);
         setScene(desc);
     } catch (e) {
         setScene(`${person} is ${action} with ${object}.`);
     } finally {
         setIsDirecting(false);
     }
  };

  const handleGenImage = async () => {
    if (!scene) {
        setError("Please write or generate a scene description first.");
        return;
    }
    setIsGenMedia('image');
    setError(null);
    try {
        const base64 = await generateMemoryImage(scene);
        // Upload
        const uploadedUrl = await uploadMedia(number, 'image', base64, 'image/png');
        
        if (uploadedUrl) {
            setImageUrl(uploadedUrl);
        } else {
            // Fallback for offline/no-firebase: just set base64 for immediate preview (won't save persistence efficiently)
            setImageUrl(base64);
            setError("Storage not connected. Image saved locally (might not persist).");
        }
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to generate image.");
    } finally {
        setIsGenMedia(null);
    }
  };

  const handleGenVideo = async () => {
      if (!scene) {
          setError("Please write or generate a scene description first.");
          return;
      }

      // Check for Veo key Requirement
      // Use type assertion for window to avoid TS errors with aistudio
      const win = window as unknown as { aistudio?: { hasSelectedApiKey: () => Promise<boolean>; openSelectKey: () => Promise<void> } };
      
      if (win.aistudio) {
          const hasKey = await win.aistudio.hasSelectedApiKey();
          if (!hasKey) {
              await win.aistudio.openSelectKey();
              // Race condition mitigation: Assume success if no error threw, proceed.
          }
      }

      setIsGenMedia('video');
      setError(null);
      try {
          const { blob, mimeType } = await generateMemoryVideo(scene);
          
          // Convert Blob to Base64 for upload helper
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
              const base64data = reader.result as string;
              const uploadedUrl = await uploadMedia(number, 'video', base64data, mimeType);
              
              if (uploadedUrl) {
                  setVideoUrl(uploadedUrl);
              } else {
                  setError("Storage not connected. Cannot save video.");
              }
              setIsGenMedia(null);
          }
      } catch (e) {
          console.error(e);
          setError("Failed to generate video. Ensure you selected a paid project key.");
          setIsGenMedia(null);
      }
  }

  const applySuggestion = (s: Suggestion) => {
    setPerson(s.person);
    setAction(s.action);
    setObject(s.object);
    // Clear suggestions and any field errors since we filled them
    setSuggestions([]);
    setFieldErrors({});
  };

  const handleClearSuggestions = () => {
    setSuggestions([]);
    // Reset excluded persons when clearing suggestions
    setExcludedPersons([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div>
             <h2 className="text-3xl font-mono font-black text-indigo-500 flex items-center gap-2">
                {number.toString().padStart(2, '0')}
                <span className="text-sm font-sans font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full">
                    {getPhoneticsForNumber(number)}
                </span>
             </h2>
             <p className="text-slate-400 text-sm mt-1">Edit Association</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AI Suggester Section (Casting Actor) */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-indigo-300 font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                <Users size={18} /> Casting Actor
              </h3>
              
              {isCustomTheme ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-300 flex-1 justify-end">
                      <input 
                          type="text" 
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          placeholder="Type custom theme..."
                          className="bg-slate-900 border border-indigo-500/50 text-xs text-white rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none w-full max-w-[180px]"
                          autoFocus
                      />
                      <button 
                        onClick={() => { setIsCustomTheme(false); setTheme(DEFAULT_THEMES[0]); }}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        title="Back to presets"
                      >
                        <Undo2 size={14} />
                      </button>
                  </div>
              ) : (
                <select 
                    value={theme}
                    onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                            setIsCustomTheme(true);
                            setTheme('');
                        } else {
                            setIsCustomTheme(false); // Ensure we switch out of input mode if selecting a preset
                            setTheme(e.target.value);
                        }
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none max-w-[180px]"
                >
                    <optgroup label="Presets">
                        {DEFAULT_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                    {customThemes.length > 0 && (
                        <optgroup label="My Themes">
                            {customThemes.map(t => <option key={t} value={t}>{t}</option>)}
                        </optgroup>
                    )}
                    <option value="CUSTOM" className="font-bold text-indigo-300">✨ New Theme...</option>
                </select>
              )}
            </div>

            {/* Strict Mode Toggle */}
            <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${strictMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Ear size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className={`text-xs font-bold ${strictMode ? 'text-emerald-300' : 'text-slate-400'}`}>
                            Strict P-A-O Mode
                        </span>
                        <span className="text-[10px] text-slate-500">
                            {strictMode ? "Person, Action & Object must match sounds" : "Only Person matches sounds"}
                        </span>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={strictMode} 
                        onChange={(e) => setStrictMode(e.target.checked)} 
                        className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
            </div>

            {suggestions.length === 0 ? (
               <button 
               onClick={handleGenerate}
               disabled={isGenerating}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/20"
             >
               {isGenerating ? (
                 <>
                    <span className="animate-spin">✨</span> Casting...
                 </>
               ) : (
                 <>
                    {hasPersonInput ? (
                        <>
                            <Megaphone size={18} /> Audition Actions for "{person}"
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} /> Start Casting Call
                        </>
                    )}
                 </>
               )}
             </button>
            ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-end">
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            {hasPersonInput ? `Auditioning for ${person}` : `Casting Call: ${theme}`}
                        </div>
                        <button onClick={handleClearSuggestions} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                            <X size={12} /> Clear
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {suggestions.map((s, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => applySuggestion(s)}
                                className="group p-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                                {/* Header: Person & Description */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {s.person}
                                        </h4>
                                    </div>
                                    {(s.person_description || s.notes || s.reasoning) && (
                                        <div className="mt-2 space-y-2">
                                            {s.person_description && (
                                                <div className="text-sm text-slate-400 italic leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                    {s.person_description}
                                                </div>
                                            )}
                                            {s.notes && (
                                                <div className="text-xs text-indigo-400/80 font-mono bg-indigo-950/30 p-2 rounded border border-indigo-500/20 flex items-center gap-2">
                                                    <Ear size={12} className="flex-shrink-0" />
                                                    <span>{s.notes}</span>
                                                </div>
                                            )}
                                            {!s.person_description && !s.notes && s.reasoning && (
                                                <div className="text-sm text-slate-400 italic leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                                                    {s.reasoning}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Action & Object Tags */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30 group-hover:border-emerald-500/30 transition-colors">
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Action</span>
                                        <span className="text-xs text-slate-200 font-medium truncate">{s.action}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30 group-hover:border-pink-500/30 transition-colors">
                                        <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Object</span>
                                        <span className="text-xs text-slate-200 font-medium truncate">{s.object}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={handleGenerate}
                        className="w-full py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 border border-dashed border-indigo-500/30 rounded-lg hover:bg-indigo-950/30 transition-colors"
                    >
                        Re-cast (Try Again)
                    </button>
                </div>
            )}

            {error && (
                <div className="text-rose-400 text-xs flex items-center gap-2 bg-rose-950/30 p-2 rounded">
                    <AlertCircle size={14} /> {error}
                </div>
            )}
          </div>

          {/* Manual Input Form */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Person (Character)</label>
              <input 
                type="text" 
                value={person}
                onChange={(e) => {
                    setPerson(e.target.value);
                    if (fieldErrors.person) setFieldErrors(prev => ({...prev, person: undefined}));
                }}
                placeholder="e.g. Albert Einstein"
                className={`w-full bg-slate-800 border text-slate-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold ${fieldErrors.person ? 'border-rose-500' : 'border-slate-700'}`}
              />
              {fieldErrors.person && (
                  <p className="text-rose-400 text-xs flex items-center gap-1 animate-in fade-in">
                      <AlertCircle size={10} /> {fieldErrors.person}
                  </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action</label>
                <input 
                    type="text" 
                    value={action}
                    onChange={(e) => {
                        setAction(e.target.value);
                        if (fieldErrors.action) setFieldErrors(prev => ({...prev, action: undefined}));
                    }}
                    placeholder="e.g. Writing on board"
                    className={`w-full bg-slate-800 border text-slate-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${fieldErrors.action ? 'border-rose-500' : 'border-slate-700'}`}
                />
                {fieldErrors.action && (
                  <p className="text-rose-400 text-xs flex items-center gap-1 animate-in fade-in">
                      <AlertCircle size={10} /> {fieldErrors.action}
                  </p>
                )}
                </div>
                <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Object</label>
                <input 
                    type="text" 
                    value={object}
                    onChange={(e) => {
                        setObject(e.target.value);
                        if (fieldErrors.object) setFieldErrors(prev => ({...prev, object: undefined}));
                    }}
                    placeholder="e.g. Chalk"
                    className={`w-full bg-slate-800 border text-slate-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${fieldErrors.object ? 'border-rose-500' : 'border-slate-700'}`}
                />
                {fieldErrors.object && (
                  <p className="text-rose-400 text-xs flex items-center gap-1 animate-in fade-in">
                      <AlertCircle size={10} /> {fieldErrors.object}
                  </p>
                )}
                </div>
            </div>
            
            {/* Director's Cut Section */}
            <div className="space-y-1 pt-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        Visual Scene (Director's Cut)
                    </label>
                    <button 
                        onClick={handleDirectorCut}
                        disabled={isDirecting || !person || !action || !object}
                        className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600 hover:text-white text-indigo-300 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-30"
                    >
                       {isDirecting ? <span className="animate-spin">🎬</span> : <Clapperboard size={10} />}
                       Auto-Write Scene
                    </button>
                </div>
                <div className="relative">
                    <textarea 
                        value={scene}
                        onChange={(e) => setScene(e.target.value)}
                        placeholder={person && action ? `${person} doing ${action}... (describe the scene)` : "Describe the memorable scene..."}
                        className="w-full bg-slate-800 border-slate-700 border text-slate-100 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[120px] text-sm pb-6"
                    />
                    <div className={`absolute bottom-2 right-3 text-[10px] font-mono transition-colors ${scene.length > CHAR_LIMIT ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                        {scene.length} / {CHAR_LIMIT}
                    </div>
                </div>
                
                {/* Tip for Sensory Details */}
                <div className="flex justify-between items-start mt-1">
                    <p className="text-[10px] text-slate-500 pl-1">
                        <span className="text-indigo-400 font-bold">Tip:</span> Be descriptive. Add <span className="text-slate-300">sensory details</span> (look, sound, feel, smell). Emphasize the <span className="text-slate-300">action and object</span>. Make it emotional.
                    </p>
                    {scene.length > CHAR_LIMIT && (
                        <p className="text-[10px] text-amber-400/80 animate-in fade-in">
                            * Keep it snappy!
                        </p>
                    )}
                </div>
            </div>

            {/* Visual Media Generation Section */}
            {scene && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        Production Media
                    </label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Image Block */}
                        <div className="space-y-2">
                            {imageUrl ? (
                                <div className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700 bg-black">
                                    <img src={imageUrl} alt="Memory Scene" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setImageUrl('')}
                                        className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleGenImage}
                                    disabled={isGenMedia !== null}
                                    className="w-full aspect-square rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition-all disabled:opacity-50"
                                >
                                    {isGenMedia === 'image' ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="text-xs">Painting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon size={24} />
                                            <span className="text-xs font-medium">Generate Image</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Video Block */}
                        <div className="space-y-2">
                            {videoUrl ? (
                                <div className="relative group aspect-video h-full rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                                    <video src={videoUrl} className="w-full h-full object-cover" controls />
                                    <button 
                                        onClick={() => setVideoUrl('')}
                                        className="absolute top-2 right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleGenVideo}
                                    disabled={isGenMedia !== null}
                                    className="w-full h-full min-h-[120px] rounded-lg border border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition-all disabled:opacity-50"
                                >
                                    {isGenMedia === 'video' ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            <span className="text-xs">Filming (Veo)...</span>
                                        </>
                                    ) : (
                                        <>
                                            <VideoIcon size={24} />
                                            <span className="text-xs font-medium">Generate Video (Veo)</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">
                        * Videos require a paid project API key. Images use standard quota.
                    </p>
                </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex justify-between items-center mb-3">
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>Saves instantly to device • Syncs to cloud automatically</span>
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                >
                    <Save size={18} /> Save PAO
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};