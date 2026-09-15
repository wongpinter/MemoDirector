import React, { useState, useEffect, useMemo } from 'react';
import { PAOItem, Suggestion } from '../types';
import { getPhoneticsForNumber, DEFAULT_THEMES } from '../constants';
import {
  getPAOSuggestions,
  getSceneDescription,
  generateMemoryImage,
  generateMemoryVideo,
} from '../services/llmService';
import { uploadMedia } from '../services/db';
import {
  Sparkles,
  Save,
  Clapperboard,
  Undo2,
  Users,
  Megaphone,
  Trash2,
  Ear,
  Image as ImageIcon,
  Video as VideoIcon,
  AlertTriangle,
} from 'lucide-react';
import { detectConflicts } from '../utils/conflictDetection';
import {
  Modal,
  Button,
  Input,
  Textarea,
  Select,
  Badge,
  FormField,
  Notice,
  Card,
} from './ui';

interface PAOEditorProps {
  number: number;
  initialData?: PAOItem;
  onClose: () => void;
  onSave: (item: PAOItem) => void;
  allItems?: PAOItem[];
}

export const PAOEditor: React.FC<PAOEditorProps> = ({
  number,
  initialData,
  onClose,
  onSave,
  allItems = [],
}) => {
  const [person, setPerson] = useState(initialData?.person || '');
  const [action, setAction] = useState(initialData?.action || '');
  const [object, setObject] = useState(initialData?.object || '');
  const [scene, setScene] = useState(initialData?.scene || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');

  const [theme, setTheme] = useState(DEFAULT_THEMES[0]);
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [customThemes, setCustomThemes] = useState<string[]>([]);
  const [personDescription, setPersonDescription] = useState<string>('');

  const [strictMode, setStrictMode] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirecting, setIsDirecting] = useState(false);
  const [isGenMedia, setIsGenMedia] = useState<'image' | 'video' | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [excludedPersons, setExcludedPersons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    person?: string;
    action?: string;
    object?: string;
  }>({});

  const CHAR_LIMIT = 280;
  const THEME_STORAGE_KEY = 'mindpalace_custom_themes';

  const hasPersonInput = person.trim().length > 0;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        setCustomThemes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load custom themes', e);
    }
  }, []);

  const currentConflicts = useMemo(() => {
    if (!person && !action && !object) return null;

    const testItem: PAOItem = {
      number,
      person,
      action,
      object,
      completed: false,
    };

    const testItems = [...allItems.filter((i) => i.number !== number), testItem];

    const conflictMap = detectConflicts(testItems);
    return conflictMap.get(number);
  }, [person, action, object, number, allItems]);

  const handleSave = () => {
    const errors: { person?: string; action?: string; object?: string } = {};
    let isValid = true;

    if (!person.trim()) {
      errors.person = 'Person is required';
      isValid = false;
    }
    if (!action.trim()) {
      errors.action = 'Action is required';
      isValid = false;
    }
    if (!object.trim()) {
      errors.object = 'Object is required';
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    if (isCustomTheme && theme.trim()) {
      try {
        const updatedThemes = Array.from(new Set([...customThemes, theme.trim()]));
        setCustomThemes(updatedThemes);
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updatedThemes));
      } catch (e) {
        console.error('Failed to save custom theme', e);
      }
    }

    const updated: PAOItem = {
      ...initialData,
      number,
      person: person.trim(),
      action: action.trim(),
      object: object.trim(),
      scene: scene.trim(),
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      completed: true,
      lastModified: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const results = await getPAOSuggestions(
        number,
        theme,
        hasPersonInput ? person : undefined,
        strictMode,
        excludedPersons.length > 0 ? excludedPersons : undefined,
      );
      setSuggestions(results);
      const newExcluded = results.map((s) => s.person).filter(Boolean);
      setExcludedPersons((prev) => Array.from(new Set([...prev, ...newExcluded])));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to generate suggestions. Check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDirectorCut = async () => {
    if (!person || !action || !object) return;
    setIsDirecting(true);
    setError(null);
    try {
      const desc = await getSceneDescription(
        person,
        action,
        object,
        theme,
        personDescription || undefined,
      );
      setScene(desc);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to generate scene description.');
    } finally {
      setIsDirecting(false);
    }
  };

  const handleGenImage = async () => {
    if (!scene) {
      setError('Please write or generate a scene description first.');
      return;
    }
    setIsGenMedia('image');
    setError(null);
    try {
      const base64Image = await generateMemoryImage(scene);
      const uploadedUrl = await uploadMedia(number, 'image', base64Image, 'image/png');
      setImageUrl(uploadedUrl || base64Image);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to generate image.');
    } finally {
      setIsGenMedia(null);
    }
  };

  const handleGenVideo = async () => {
    if (!scene) {
      setError('Please write or generate a scene description first.');
      return;
    }

    const win = window as unknown as {
      aistudio?: {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
      };
    };

    if (win.aistudio) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
      }
    }

    setIsGenMedia('video');
    setError(null);
    try {
      const { blob, mimeType } = await generateMemoryVideo(scene);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const uploadedUrl = await uploadMedia(number, 'video', base64data, mimeType);
        if (uploadedUrl) {
          setVideoUrl(uploadedUrl);
        } else {
          setError('Storage not connected. Cannot save video.');
        }
        setIsGenMedia(null);
      };
      reader.onerror = () => {
        setError('Failed to read video file.');
        setIsGenMedia(null);
      };
    } catch (e) {
      console.error(e);
      setError('Failed to generate video. Ensure project has Veo support.');
      setIsGenMedia(null);
    }
  };

  const applySuggestion = (s: Suggestion) => {
    setPerson(s.person);
    setAction(s.action);
    setObject(s.object);
    setPersonDescription(s.person_description || '');
    setSuggestions([]);
    setFieldErrors({});
  };

  const handleClearSuggestions = () => {
    setSuggestions([]);
    setExcludedPersons([]);
  };

  const formattedNum = number.toString().padStart(2, '0');

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-bold text-charcoal">#{formattedNum}</span>
          <Badge variant="subtle" size="md">
            {getPhoneticsForNumber(number)}
          </Badge>
        </div>
      }
      subtitle="Edit card association and memory scene"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Casting / AI Suggestions */}
        <Card variant="subtle" padding="sm" className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-charcoal flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent" /> AI Casting Call
            </h4>

            {isCustomTheme ? (
              <div className="flex items-center gap-1.5 max-w-xs">
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Type custom theme..."
                  autoFocus
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCustomTheme(false);
                    setTheme(DEFAULT_THEMES[0]);
                  }}
                  icon={<Undo2 className="w-3.5 h-3.5" />}
                  title="Back to presets"
                />
              </div>
            ) : (
              <div className="w-48">
                <Select
                  value={theme}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomTheme(true);
                      setTheme('');
                    } else {
                      setIsCustomTheme(false);
                      setTheme(e.target.value);
                    }
                  }}
                  className="h-8 text-xs"
                >
                  <optgroup label="Presets">
                    {DEFAULT_THEMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                  {customThemes.length > 0 && (
                    <optgroup label="My Themes">
                      {customThemes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="CUSTOM">New Custom Theme...</option>
                </Select>
              </div>
            )}
          </div>

          {/* Strict Mode Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border text-xs">
            <div className="flex items-center gap-2">
              <Ear className="w-4 h-4 text-accent" />
              <div>
                <span className="font-semibold text-charcoal">Strict Major System Mode</span>
                <p className="text-steel text-xs">
                  {strictMode
                    ? 'Person, Action, and Object must strictly match sounds'
                    : 'Only Person must strictly match sounds'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={strictMode}
                onChange={(e) => setStrictMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-accent peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </label>
          </div>

          {/* Cast Trigger */}
          {suggestions.length === 0 ? (
            <Button
              variant="accent"
              size="md"
              className="w-full"
              loading={isGenerating}
              onClick={handleGenerate}
              icon={
                hasPersonInput ? (
                  <Megaphone className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {hasPersonInput ? `Audition Actions for "${person}"` : 'Start Casting Call'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-steel">
                <span>
                  {hasPersonInput ? `Auditioning for ${person}` : `Casting: ${theme}`}
                </span>
                <Button size="sm" variant="ghost" onClick={handleClearSuggestions}>
                  Clear
                </Button>
              </div>

              <div className="grid gap-2">
                {suggestions.map((s, idx) => (
                  <Card
                    key={idx}
                    variant="paper"
                    padding="sm"
                    interactive
                    onClick={() => applySuggestion(s)}
                    className="hover:border-accent"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-charcoal text-sm">{s.person}</span>
                    </div>

                    {(s.person_description || s.notes) && (
                      <p className="text-xs text-steel mb-2 italic line-clamp-2">
                        {s.person_description || s.notes}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-surface-subtle p-1.5 rounded border border-border-subtle">
                        <span className="text-steel font-medium block">Action</span>
                        <span className="text-charcoal font-semibold truncate block">
                          {s.action}
                        </span>
                      </div>
                      <div className="bg-surface-subtle p-1.5 rounded border border-border-subtle">
                        <span className="text-steel font-medium block">Object</span>
                        <span className="text-charcoal font-semibold truncate block">
                          {s.object}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleGenerate}
                loading={isGenerating}
              >
                Re-cast (Try Again)
              </Button>
            </div>
          )}

          {error && <Notice variant="danger">{error}</Notice>}
        </Card>

        {/* Conflict Warning */}
        {currentConflicts && (
          <Notice variant="warning" title="Duplicate Elements Detected">
            <div className="space-y-1 mt-1 text-xs">
              {currentConflicts.person && (
                <p>
                  Person &ldquo;{currentConflicts.person.value}&rdquo; is already assigned to card #{currentConflicts.person.numbers.map((n) => n.toString().padStart(2, '0')).join(', ')}.
                </p>
              )}
              {currentConflicts.action && (
                <p>
                  Action &ldquo;{currentConflicts.action.value}&rdquo; is already assigned to card #{currentConflicts.action.numbers.map((n) => n.toString().padStart(2, '0')).join(', ')}.
                </p>
              )}
              {currentConflicts.object && (
                <p>
                  Object &ldquo;{currentConflicts.object.value}&rdquo; is already assigned to card #{currentConflicts.object.numbers.map((n) => n.toString().padStart(2, '0')).join(', ')}.
                </p>
              )}
            </div>
          </Notice>
        )}

        {/* Form Fields: Person, Action, Object */}
        <div className="space-y-3">
          <FormField label="Person (Character)" required error={fieldErrors.person}>
            <Input
              value={person}
              onChange={(e) => {
                setPerson(e.target.value);
                if (fieldErrors.person) setFieldErrors((prev) => ({ ...prev, person: undefined }));
              }}
              placeholder="e.g. Albert Einstein"
              error={Boolean(fieldErrors.person)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Action" required error={fieldErrors.action}>
              <Input
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  if (fieldErrors.action)
                    setFieldErrors((prev) => ({ ...prev, action: undefined }));
                }}
                placeholder="e.g. Chalking formulas"
                error={Boolean(fieldErrors.action)}
              />
            </FormField>

            <FormField label="Object" required error={fieldErrors.object}>
              <Input
                value={object}
                onChange={(e) => {
                  setObject(e.target.value);
                  if (fieldErrors.object)
                    setFieldErrors((prev) => ({ ...prev, object: undefined }));
                }}
                placeholder="e.g. Blackboard"
                error={Boolean(fieldErrors.object)}
              />
            </FormField>
          </div>
        </div>

        {/* Scene (Director's Cut) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-charcoal">
              Visual Scene (Director&apos;s Cut)
            </label>
            <Button
              size="sm"
              variant="outline"
              disabled={isDirecting || !person || !action || !object}
              loading={isDirecting}
              onClick={handleDirectorCut}
              icon={<Clapperboard className="w-3.5 h-3.5 text-accent" />}
            >
              Auto-Write Scene
            </Button>
          </div>

          <div className="relative">
            <Textarea
              rows={3}
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              placeholder={
                person && action
                  ? `${person} doing ${action} with ${object || '...'}`
                  : 'Describe the sensory, memorable scene...'
              }
            />
            <span
              className={`absolute bottom-2 right-2 text-xs font-mono ${
                scene.length > CHAR_LIMIT ? 'text-conflict font-bold' : 'text-steel/70'
              }`}
            >
              {scene.length} / {CHAR_LIMIT}
            </span>
          </div>
          <p className="text-xs text-steel">
            Use vivid sensory anchors (sight, sound, motion) linking the person, action, and object.
          </p>
        </div>

        {/* Production Media (Image/Video) */}
        {(scene || imageUrl || videoUrl) && (
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-charcoal">Production Media</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Image */}
              <div className="space-y-1">
                {imageUrl ? (
                  <div className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-charcoal">
                    <img src={imageUrl} alt="Scene" className="w-full h-full object-cover" />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      icon={<Trash2 className="w-3 h-3" />}
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-1 border-dashed"
                    loading={isGenMedia === 'image'}
                    onClick={handleGenImage}
                    icon={<ImageIcon className="w-5 h-5 text-steel" />}
                  >
                    Generate Image
                  </Button>
                )}
              </div>

              {/* Video */}
              <div className="space-y-1">
                {videoUrl ? (
                  <div className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-charcoal">
                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setVideoUrl('')}
                      className="absolute top-1 right-1 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      icon={<Trash2 className="w-3 h-3" />}
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col gap-1 border-dashed"
                    loading={isGenMedia === 'video'}
                    onClick={handleGenVideo}
                    icon={<VideoIcon className="w-5 h-5 text-steel" />}
                  >
                    Generate Video (Veo)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-steel">Autosaves locally to active version</span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="accent" onClick={handleSave} icon={<Save className="w-4 h-4" />}>
              Save PAO
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
