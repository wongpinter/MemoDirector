import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, Trash2, AlertCircle, CheckCircle, Info, Star } from 'lucide-react';
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
  APIKeys
} from '../services/llmConfig';

export function APIKeysSettings() {
  const [keys, setKeys] = useState<APIKeys>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({});
  const [tempModels, setTempModels] = useState<Record<string, string>>({});
  const [preferredProvider, setPreferredProviderState] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadKeys();
    setPreferredProviderState(getPreferredProvider());
  }, []);

  const loadKeys = () => {
    const loadedKeys = getKeys();
    setKeys(loadedKeys);
  };

  const handleSetPreferred = (provider: 'gemini' | 'openai' | 'openrouter' | 'ollama') => {
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
        model: model || getDefaultModel(provider)
      });
      
      loadKeys();
      setEditMode({ ...editMode, [provider]: false });
      setTempKeys({ ...tempKeys, [provider]: '' });
      showToast(`${provider.toUpperCase()} API key saved`, 'success');
    } catch (error) {
      showToast('Failed to save API key', 'error');
    }
  };

  const handleDelete = (provider: 'gemini' | 'openai' | 'openrouter' | 'ollama') => {
    if (confirm(`Delete ${provider.toUpperCase()} API key?`)) {
      try {
        removeKey(provider);
        loadKeys();
        showToast(`${provider.toUpperCase()} API key deleted`, 'success');
      } catch (error) {
        showToast('Failed to delete API key', 'error');
      }
    }
  };

  const handleSaveOllama = () => {
    const baseUrl = tempKeys['ollama_url'] || 'http://localhost:11434';
    const model = tempModels['ollama'] || 'llama3.2';

    try {
      setKey({
        provider: 'ollama',
        baseUrl,
        model
      });
      
      loadKeys();
      setEditMode({ ...editMode, ollama: false });
      showToast('Ollama configuration saved', 'success');
    } catch (error) {
      showToast('Failed to save Ollama configuration', 'error');
    }
  };

  const toggleShow = (provider: string) => {
    setShowKeys({ ...showKeys, [provider]: !showKeys[provider] });
  };

  const startEdit = (provider: string) => {
    setEditMode({ ...editMode, [provider]: true });
  };

  const cancelEdit = (provider: string) => {
    setEditMode({ ...editMode, [provider]: false });
    setTempKeys({ ...tempKeys, [provider]: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600/20 rounded-lg">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Provider API Keys</h2>
            <p className="text-sm text-slate-400">Your keys are stored locally and never sent to our servers</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-950/20 border border-blue-600/30 rounded-lg p-4 flex items-start gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">Privacy & Security</p>
          <ul className="space-y-1 text-blue-200/80">
            <li>• API keys are stored only on your device (LocalStorage)</li>
            <li>• Keys are never transmitted to our servers</li>
            <li>• You need to set keys on each device you use</li>
            <li>• We only provide the database for syncing your PAO data</li>
          </ul>
        </div>
      </div>

      {/* Preferred Provider Selector */}
      {(keys.gemini || keys.openai || keys.openrouter || keys.ollama) && (
        <div className="bg-indigo-950/20 border border-indigo-600/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-indigo-300">Preferred Provider</h3>
          </div>
          <p className="text-xs text-indigo-200/80 mb-3">
            If you have multiple API keys, choose which provider to use by default:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {keys.gemini && (
              <button
                onClick={() => handleSetPreferred('gemini')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  preferredProvider === 'gemini'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Gemini
              </button>
            )}
            {keys.openai && (
              <button
                onClick={() => handleSetPreferred('openai')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  preferredProvider === 'openai'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                OpenAI
              </button>
            )}
            {keys.openrouter && (
              <button
                onClick={() => handleSetPreferred('openrouter')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  preferredProvider === 'openrouter'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                OpenRouter
              </button>
            )}
            {keys.ollama && (
              <button
                onClick={() => handleSetPreferred('ollama')}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  preferredProvider === 'ollama'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Ollama
              </button>
            )}
          </div>
          {!preferredProvider && (
            <p className="text-xs text-slate-500 mt-2">
              Default: Gemini → OpenAI → OpenRouter → Ollama
            </p>
          )}
        </div>
      )}

      {/* Gemini */}
      <ProviderCard
        provider="gemini"
        title="Google Gemini"
        description="Recommended - Supports image/video generation"
        hasKey={!!keys.gemini}
        isEditing={editMode.gemini}
        showKey={showKeys.gemini}
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
        description="GPT models"
        hasKey={!!keys.openai}
        isEditing={editMode.openai}
        showKey={showKeys.openai}
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
        description="Access to multiple models"
        hasKey={!!keys.openrouter}
        isEditing={editMode.openrouter}
        showKey={showKeys.openrouter}
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Ollama (Local)</h3>
            <p className="text-sm text-slate-400">Run models locally - no API key needed</p>
          </div>
          {keys.ollama && !editMode.ollama && (
            <div className="flex gap-2">
              <button
                onClick={() => startEdit('ollama')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete('ollama')}
                className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {(editMode.ollama || !keys.ollama) && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Base URL</label>
              <input
                type="text"
                value={tempKeys['ollama_url'] || keys.ollama?.baseUrl || 'http://localhost:11434'}
                onChange={(e) => setTempKeys({ ...tempKeys, ollama_url: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
              <input
                type="text"
                value={tempModels['ollama'] || keys.ollama?.model || 'llama3.2'}
                onChange={(e) => setTempModels({ ...tempModels, ollama: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="llama3.2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveOllama}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save
              </button>
              {keys.ollama && (
                <button
                  onClick={() => cancelEdit('ollama')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {keys.ollama && !editMode.ollama && (
          <div className="text-sm text-slate-400">
            <p>Base URL: {keys.ollama.baseUrl}</p>
            <p>Model: {keys.ollama.model}</p>
          </div>
        )}
      </div>
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
  provider,
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
  getKeyLink
}: ProviderCardProps) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        {hasKey && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={onToggleShow}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={onStartEdit}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 text-sm rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {hasKey && !isEditing && (
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm text-slate-300">
          {showKey ? keyValue : maskAPIKey(keyValue || '')}
        </div>
      )}

      {(isEditing || !hasKey) && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
            <input
              type="password"
              value={tempKey || ''}
              onChange={(e) => onKeyChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your API key"
            />
            <a
              href={getKeyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
            >
              Get API key →
            </a>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model (optional)</label>
            <input
              type="text"
              value={tempModel || ''}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={defaultModel}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} /> Save
            </button>
            {hasKey && (
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
