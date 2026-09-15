import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Trash2, Info, Star, ExternalLink, Edit2 } from 'lucide-react';
import { useToast } from '../contexts';
import {
  setKey,
  getKeys,
  removeKey,
  maskAPIKey,
  validateAPIKey,
  getDefaultModel,
  getPreferredProvider,
  setPreferredProvider,
  APIKeys,
  LLMProvider,
} from '../services/llmConfig';
import { Card, Button, Input, FormField, Notice, Badge } from './ui';

export function APIKeysSettings() {
  const [keys, setKeys] = useState<APIKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({});
  const [tempModels, setTempModels] = useState<Record<string, string>>({});
  const [preferredProvider, setPreferredProviderState] = useState<LLMProvider | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadKeys();
    setPreferredProviderState(getPreferredProvider());
  }, []);

  const loadKeys = () => {
    const loadedKeys = getKeys();
    setKeys(loadedKeys);
  };

  const handleSetPreferred = (provider: LLMProvider) => {
    setPreferredProvider(provider);
    setPreferredProviderState(provider);
    showToast(`${provider.toUpperCase()} set as preferred provider`, 'success');
  };

  const handleSave = (provider: 'gemini' | 'openai' | 'openrouter') => {
    const key = tempKeys[provider];
    const model = tempModels[provider];

    if (!key || key.trim() === '') {
      showToast('Please enter an API key', 'error');
      return;
    }

    if (!validateAPIKey(provider, key)) {
      showToast('Invalid API key format', 'error');
      return;
    }

    try {
      setKey({
        provider,
        key,
        model: model || getDefaultModel(provider),
      });

      loadKeys();
      setEditMode({ ...editMode, [provider]: false });
      setTempKeys({ ...tempKeys, [provider]: '' });
      showToast(`${provider.toUpperCase()} API key saved`, 'success');
    } catch {
      showToast('Failed to save API key', 'error');
    }
  };

  const handleSaveOllama = () => {
    const baseUrl = tempKeys['ollama_url'] || keys.ollama?.baseUrl || 'http://localhost:11434';
    const model = tempModels['ollama'] || keys.ollama?.model || getDefaultModel('ollama');

    try {
      setKey({
        provider: 'ollama',
        baseUrl,
        model,
      });

      loadKeys();
      setEditMode({ ...editMode, ollama: false });
      showToast('Ollama configuration saved', 'success');
    } catch {
      showToast('Failed to save Ollama config', 'error');
    }
  };

  const handleDelete = (provider: keyof APIKeys) => {
    if (confirm(`Remove ${provider.toUpperCase()} API key?`)) {
      removeKey(provider);
      loadKeys();
      showToast(`${provider.toUpperCase()} key removed`, 'success');
    }
  };

  const toggleShow = (provider: string) => {
    setShowKeys({ ...showKeys, [provider]: !showKeys[provider] });
  };

  const startEdit = (provider: string) => {
    setEditMode({ ...editMode, [provider]: true });
    if (provider === 'gemini' && keys.gemini) {
      setTempKeys({ ...tempKeys, gemini: keys.gemini });
    } else if (provider === 'openai' && keys.openai) {
      setTempKeys({ ...tempKeys, openai: keys.openai });
    } else if (provider === 'openrouter' && keys.openrouter) {
      setTempKeys({ ...tempKeys, openrouter: keys.openrouter });
    } else if (provider === 'ollama' && keys.ollama) {
      setTempKeys({ ...tempKeys, ollama_url: keys.ollama.baseUrl });
      setTempModels({ ...tempModels, ollama: keys.ollama.model });
    }
  };

  const cancelEdit = (provider: string) => {
    setEditMode({ ...editMode, [provider]: false });
    const updatedTemp = { ...tempKeys };
    delete updatedTemp[provider];
    setTempKeys(updatedTemp);
  };

  return (
    <div className="space-y-5">
      {/* Privacy Notice */}
      <Notice variant="info" title="Zero-Knowledge Key Storage">
        <p className="mt-0.5">
          API keys are encrypted and stored solely in this browser&apos;s LocalStorage. They never
          traverse or touch our servers.
        </p>
      </Notice>

      {/* Preferred Provider Selector */}
      {(keys.gemini || keys.openai || keys.openrouter || keys.ollama) && (
        <Card variant="subtle" padding="md" className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-accent" />
            <h4 className="font-semibold text-charcoal text-sm">Default AI Model Provider</h4>
          </div>
          <p className="text-xs text-steel">
            Choose which configured provider executes casting and scene generation requests:
          </p>
          <div className="flex flex-wrap gap-2">
            {(['gemini', 'openai', 'openrouter', 'ollama'] as const).map((p) => {
              if (!keys[p]) return null;
              const isSelected = preferredProvider === p;
              return (
                <Button
                  key={p}
                  size="sm"
                  variant={isSelected ? 'accent' : 'outline'}
                  onClick={() => handleSetPreferred(p)}
                >
                  {p.toUpperCase()}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Gemini */}
      <ProviderCard
        provider="gemini"
        title="Google Gemini"
        description="Supports scene generation, image rendering, and Veo video"
        hasKey={Boolean(keys.gemini)}
        isEditing={Boolean(editMode.gemini)}
        showKey={Boolean(showKeys.gemini)}
        onToggleShow={() => toggleShow('gemini')}
        onStartEdit={() => startEdit('gemini')}
        onCancelEdit={() => cancelEdit('gemini')}
        onSave={() => handleSave('gemini')}
        onDelete={() => handleDelete('gemini')}
        keyValue={keys.gemini}
        tempKey={tempKeys.gemini}
        onKeyChange={(value) => setTempKeys({ ...tempKeys, gemini: value })}
        tempModel={tempModels.gemini}
        onModelChange={(value) => setTempModels({ ...tempModels, gemini: value })}
        defaultModel={getDefaultModel('gemini')}
        getKeyLink="https://aistudio.google.com/apikey"
      />

      {/* OpenAI */}
      <ProviderCard
        provider="openai"
        title="OpenAI"
        description="GPT-4o and lightweight mini models"
        hasKey={Boolean(keys.openai)}
        isEditing={Boolean(editMode.openai)}
        showKey={Boolean(showKeys.openai)}
        onToggleShow={() => toggleShow('openai')}
        onStartEdit={() => startEdit('openai')}
        onCancelEdit={() => cancelEdit('openai')}
        onSave={() => handleSave('openai')}
        onDelete={() => handleDelete('openai')}
        keyValue={keys.openai}
        tempKey={tempKeys.openai}
        onKeyChange={(value) => setTempKeys({ ...tempKeys, openai: value })}
        tempModel={tempModels.openai}
        onModelChange={(value) => setTempModels({ ...tempModels, openai: value })}
        defaultModel={getDefaultModel('openai')}
        getKeyLink="https://platform.openai.com/api-keys"
      />

      {/* OpenRouter */}
      <ProviderCard
        provider="openrouter"
        title="OpenRouter"
        description="Unified gateway for Claude, Llama, Mistral, and DeepSeek"
        hasKey={Boolean(keys.openrouter)}
        isEditing={Boolean(editMode.openrouter)}
        showKey={Boolean(showKeys.openrouter)}
        onToggleShow={() => toggleShow('openrouter')}
        onStartEdit={() => startEdit('openrouter')}
        onCancelEdit={() => cancelEdit('openrouter')}
        onSave={() => handleSave('openrouter')}
        onDelete={() => handleDelete('openrouter')}
        keyValue={keys.openrouter}
        tempKey={tempKeys.openrouter}
        onKeyChange={(value) => setTempKeys({ ...tempKeys, openrouter: value })}
        tempModel={tempModels.openrouter}
        onModelChange={(value) => setTempModels({ ...tempModels, openrouter: value })}
        defaultModel={getDefaultModel('openrouter')}
        getKeyLink="https://openrouter.ai/keys"
      />

      {/* Ollama */}
      <Card variant="paper" padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-charcoal text-base">Ollama (Local LLM)</h4>
            <p className="text-xs text-steel">
              Run open models locally on your hardware with 0 cloud API tokens.
            </p>
          </div>
          {keys.ollama && !editMode.ollama && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => startEdit('ollama')}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete('ollama')}
                className="text-danger hover:text-danger-dark"
                icon={<Trash2 className="w-3.5 h-3.5" />}
              />
            </div>
          )}
        </div>

        {(editMode.ollama || !keys.ollama) && (
          <div className="space-y-3">
            <FormField label="Base URL">
              <Input
                type="text"
                value={
                  tempKeys['ollama_url'] || keys.ollama?.baseUrl || 'http://localhost:11434'
                }
                onChange={(e) => setTempKeys({ ...tempKeys, ollama_url: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </FormField>

            <FormField label="Model Identifier">
              <Input
                type="text"
                value={tempModels['ollama'] || keys.ollama?.model || 'llama3.2'}
                onChange={(e) => setTempModels({ ...tempModels, ollama: e.target.value })}
                placeholder="llama3.2"
              />
            </FormField>

            <div className="flex gap-2">
              <Button
                variant="accent"
                size="sm"
                onClick={handleSaveOllama}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Ollama
              </Button>
              {keys.ollama && (
                <Button size="sm" variant="ghost" onClick={() => cancelEdit('ollama')}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {keys.ollama && !editMode.ollama && (
          <div className="bg-surface-subtle p-3 rounded-lg border border-border text-xs font-mono text-charcoal space-y-1">
            <div>Base URL: {keys.ollama.baseUrl}</div>
            <div>Model: {keys.ollama.model}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

interface ProviderCardProps {
  provider: string;
  title: string;
  description: string;
  hasKey: boolean;
  isEditing: boolean;
  showKey: boolean;
  onToggleShow: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  keyValue?: string;
  tempKey?: string;
  onKeyChange: (value: string) => void;
  tempModel?: string;
  onModelChange: (value: string) => void;
  defaultModel: string;
  getKeyLink: string;
}

function ProviderCard({
  title,
  description,
  hasKey,
  isEditing,
  showKey,
  onToggleShow,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
  keyValue,
  tempKey,
  onKeyChange,
  tempModel,
  onModelChange,
  defaultModel,
  getKeyLink,
}: ProviderCardProps) {
  return (
    <Card variant="paper" padding="md" className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-charcoal text-base">{title}</h4>
            {hasKey && (
              <Badge variant="subtle" size="sm">
                Configured
              </Badge>
            )}
          </div>
          <p className="text-xs text-steel mt-0.5">{description}</p>
        </div>

        {hasKey && !isEditing && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleShow}
              icon={
                showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />
              }
              title={showKey ? 'Hide key' : 'Show key'}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={onStartEdit}
              icon={<Edit2 className="w-3.5 h-3.5" />}
              title="Edit key"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="text-danger hover:text-danger-dark"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              title="Delete key"
            />
          </div>
        )}
      </div>

      {hasKey && !isEditing && (
        <div className="bg-surface-subtle p-3 rounded-lg border border-border text-xs font-mono text-charcoal">
          {showKey ? keyValue : maskAPIKey(keyValue || '')}
        </div>
      )}

      {(isEditing || !hasKey) && (
        <div className="space-y-3">
          <FormField label="API Key" required>
            <Input
              type="password"
              value={tempKey || ''}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="Paste your key here..."
            />
          </FormField>

          <FormField label="Default Model (optional)">
            <Input
              type="text"
              value={tempModel || ''}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder={defaultModel}
            />
          </FormField>

          <div className="flex items-center justify-between pt-1">
            <a
              href={getKeyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
            >
              Get API Key <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex gap-2">
              {hasKey && (
                <Button size="sm" variant="ghost" onClick={onCancelEdit}>
                  Cancel
                </Button>
              )}
              <Button
                size="sm"
                variant="accent"
                onClick={onSave}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Key
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
