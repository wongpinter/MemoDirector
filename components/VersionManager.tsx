import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PAOVersion } from '../types';
import {
  loadVersions,
  createVersion,
  updateVersion,
  deleteVersion,
  switchActiveVersion,
  duplicateVersion,
  getActiveVersion
} from '../services/versionManager';

interface VersionManagerProps {
  onVersionSwitch: () => void;
}

export function VersionManager({ onVersionSwitch }: VersionManagerProps) {
  const [versions, setVersions] = useState<PAOVersion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [copyFromActive, setCopyFromActive] = useState(false);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadData = () => {
    setVersions(loadVersions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeVersion = versions.find(v => v.isActive);

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return;
    
    createVersion(newVersionName.trim(), newVersionDesc.trim() || undefined, copyFromActive);
    setNewVersionName('');
    setNewVersionDesc('');
    setCopyFromActive(false);
    setShowCreateModal(false);
    loadData();
  };

  const handleSwitchVersion = (versionId: string) => {
    switchActiveVersion(versionId);
    loadData();
    onVersionSwitch();
  };

  const handleDeleteVersion = (versionId: string) => {
    if (versions.length === 1) {
      alert('Cannot delete the last version');
      return;
    }
    
    if (confirm('Are you sure you want to delete this version? This cannot be undone.')) {
      deleteVersion(versionId);
      loadData();
      onVersionSwitch();
    }
  };

  const handleDuplicateVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;
    
    const newName = prompt('Enter name for duplicated version:', `${version.name} (Copy)`);
    if (newName) {
      duplicateVersion(versionId, newName);
      loadData();
    }
  };

  const handleStartEdit = (version: PAOVersion) => {
    setEditingVersion(version.id);
    setEditName(version.name);
    setEditDesc(version.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingVersion || !editName.trim()) return;
    
    updateVersion(editingVersion, {
      name: editName.trim(),
      description: editDesc.trim() || undefined
    });
    setEditingVersion(null);
    loadData();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button 
        ref={buttonRef}
        className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 bg-slate-800 border-2 border-slate-700 rounded-lg cursor-pointer text-sm font-medium text-slate-200 transition-all hover:border-indigo-500 hover:bg-slate-750"
        onClick={handleToggle}
      >
        <span className="text-base md:text-lg">📚</span>
        <span className="text-xs text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="absolute bg-slate-800 border-2 border-slate-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto min-w-[280px]"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
          <div className="p-2">
            {versions.map(version => (
              <div 
                key={version.id} 
                className={`p-3 rounded-lg mb-2 border transition-all ${
                  version.isActive 
                    ? 'bg-indigo-900/30 border-indigo-600' 
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                }`}
              >
                {editingVersion === version.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Version name"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSaveEdit} 
                        className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingVersion(null)} 
                        className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className={version.isActive ? 'cursor-default' : 'cursor-pointer'}
                      onClick={() => !version.isActive && handleSwitchVersion(version.id)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-100">{version.name}</span>
                        {version.isActive && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      {version.description && (
                        <div className="text-xs text-slate-400 mb-1">{version.description}</div>
                      )}
                      <div className="text-xs text-slate-500">
                        Modified: {formatDate(version.lastModified)}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <button 
                        onClick={() => handleStartEdit(version)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs transition-colors"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDuplicateVersion(version.id)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs transition-colors"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button 
                        onClick={() => handleDeleteVersion(version.id)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Delete"
                        disabled={versions.length === 1}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <button 
            className="w-full p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-b-xl transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Version
          </button>
          </div>
        </div>,
        document.body
      )}

      {showCreateModal && createPortal(
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto z-[9999]" 
          onClick={() => setShowCreateModal(false)}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Create New Version</h3>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Version name (e.g., Movie Characters)"
              className="w-full px-4 py-3 mb-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              autoFocus
            />
            <input
              type="text"
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-3 mb-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <label className="flex items-center gap-2 mb-4 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={copyFromActive}
                onChange={(e) => setCopyFromActive(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              Copy from active version
            </label>
            <div className="flex gap-2">
              <button 
                onClick={handleCreateVersion} 
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors"
              >
                Create
              </button>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
