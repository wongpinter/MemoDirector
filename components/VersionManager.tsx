import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, ChevronDown, Plus, Edit2, Copy, Trash2, Check } from 'lucide-react';
import { PAOVersion } from '../types';
import {
  listVersions,
  createVersion,
  renameVersion,
  deleteVersion,
  switchVersion,
  duplicateVersion,
} from '../services/paoStore';
import { Button, Input, Badge, Modal, FormField } from './ui';

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
    setVersions(listVersions());
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeVersion = versions.find((v) => v.isActive);

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return;

    createVersion(newVersionName.trim(), newVersionDesc.trim() || undefined, copyFromActive);
    setNewVersionName('');
    setNewVersionDesc('');
    setCopyFromActive(false);
    setShowCreateModal(false);
    loadData();
    onVersionSwitch();
  };

  const handleSwitchVersion = (versionId: string) => {
    switchVersion(versionId);
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
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;

    const newName = `${version.name} (Copy)`;
    duplicateVersion(versionId, newName);
    loadData();
  };

  const handleStartEdit = (version: PAOVersion) => {
    setEditingVersion(version.id);
    setEditName(version.name);
    setEditDesc(version.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingVersion || !editName.trim()) return;

    renameVersion(editingVersion, editName.trim(), editDesc.trim() || undefined);
    setEditingVersion(null);
    loadData();
    onVersionSwitch();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const clampedLeft = Math.min(rect.left, Math.max(8, window.innerWidth - 328));
      setDropdownPos({ top: rect.bottom + 6, left: clampedLeft });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface text-charcoal text-xs font-medium hover:border-steel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <BookOpen className="w-3.5 h-3.5 text-accent" />
        <span className="hidden sm:inline font-semibold text-charcoal">
          {activeVersion?.name || 'Default'}
        </span>
        <ChevronDown className="w-3 h-3 text-steel" />
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
            <div
              className="absolute bg-surface border border-border rounded-xl shadow-xl max-h-96 overflow-y-auto w-80 text-charcoal text-xs"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 space-y-1.5">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      version.isActive
                        ? 'bg-accent-light/50 border-accent/40'
                        : 'bg-surface border-border-subtle hover:bg-surface-subtle'
                    }`}
                  >
                    {editingVersion === version.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Version name"
                          autoFocus
                        />
                        <Input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Description (optional)"
                        />
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="accent" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingVersion(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`flex items-start justify-between gap-2 ${
                            version.isActive ? 'cursor-default' : 'cursor-pointer'
                          }`}
                          onClick={() => !version.isActive && handleSwitchVersion(version.id)}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-semibold text-charcoal text-sm">
                                {version.name}
                              </span>
                              {version.isActive && (
                                <Badge variant="accent" size="sm">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {version.description && (
                              <p className="text-steel text-xs mb-1 line-clamp-2">
                                {version.description}
                              </p>
                            )}
                            <span className="text-steel/70 text-xs">
                              {formatDate(version.lastModified)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border-subtle">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(version)}
                            title="Edit"
                            className="h-7 px-2"
                            icon={<Edit2 className="w-3 h-3 text-steel" />}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateVersion(version.id)}
                            title="Duplicate"
                            className="h-7 px-2"
                            icon={<Copy className="w-3 h-3 text-steel" />}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteVersion(version.id)}
                            title="Delete"
                            disabled={versions.length === 1}
                            className="h-7 px-2 text-danger hover:text-danger-dark"
                            icon={<Trash2 className="w-3 h-3" />}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-border bg-surface-subtle/50">
                <Button
                  variant="accent"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create New Version
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Create Version Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Version"
        subtitle="Organize separate PAO decks for different domains or themes"
        maxWidth="md"
      >
        <div className="space-y-4">
          <FormField label="Version Name" required>
            <Input
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="e.g., Movie Heroes, History 101"
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Input
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
              placeholder="Short note about this deck's theme"
            />
          </FormField>

          <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
            <input
              type="checkbox"
              checked={copyFromActive}
              onChange={(e) => setCopyFromActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
            />
            <span>Copy current active deck items to start</span>
          </label>

          <div className="flex gap-2 justify-end pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateVersion}
              disabled={!newVersionName.trim()}
            >
              Create Version
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
