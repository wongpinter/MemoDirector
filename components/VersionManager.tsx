import React, { useState, useEffect } from 'react';
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

  return (
    <div className="version-manager">
      <button 
        className="version-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="version-icon">📚</span>
        <span className="version-name">{activeVersion?.name || 'No Version'}</span>
        <span className="version-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="version-dropdown">
          <div className="version-list">
            {versions.map(version => (
              <div 
                key={version.id} 
                className={`version-item ${version.isActive ? 'active' : ''}`}
              >
                {editingVersion === version.id ? (
                  <div className="version-edit-form">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Version name"
                      className="version-edit-input"
                    />
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="version-edit-input"
                    />
                    <div className="version-edit-actions">
                      <button onClick={handleSaveEdit} className="btn-save">Save</button>
                      <button onClick={() => setEditingVersion(null)} className="btn-cancel">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className="version-info"
                      onClick={() => !version.isActive && handleSwitchVersion(version.id)}
                    >
                      <div className="version-header">
                        <span className="version-title">{version.name}</span>
                        {version.isActive && <span className="active-badge">Active</span>}
                      </div>
                      {version.description && (
                        <div className="version-description">{version.description}</div>
                      )}
                      <div className="version-meta">
                        <span>Modified: {formatDate(version.lastModified)}</span>
                      </div>
                    </div>
                    <div className="version-actions">
                      <button 
                        onClick={() => handleStartEdit(version)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDuplicateVersion(version.id)}
                        className="btn-icon"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button 
                        onClick={() => handleDeleteVersion(version.id)}
                        className="btn-icon"
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
            className="btn-create-version"
            onClick={() => setShowCreateModal(true)}
          >
            + Create New Version
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Version</h3>
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="Version name (e.g., Movie Characters)"
              className="modal-input"
              autoFocus
            />
            <input
              type="text"
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
              placeholder="Description (optional)"
              className="modal-input"
            />
            <label className="modal-checkbox">
              <input
                type="checkbox"
                checked={copyFromActive}
                onChange={(e) => setCopyFromActive(e.target.checked)}
              />
              Copy from active version
            </label>
            <div className="modal-actions">
              <button onClick={handleCreateVersion} className="btn-primary">Create</button>
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .version-manager {
          position: relative;
        }

        .version-selector-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .version-selector-btn:hover {
          border-color: #4CAF50;
          background: #f5f5f5;
        }

        .version-icon {
          font-size: 18px;
        }

        .version-name {
          flex: 1;
        }

        .version-arrow {
          font-size: 10px;
          color: #666;
        }

        .version-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
        }

        .version-list {
          padding: 8px;
        }

        .version-item {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          border: 1px solid #e0e0e0;
          transition: all 0.2s;
        }

        .version-item:hover {
          background: #f9f9f9;
        }

        .version-item.active {
          background: #e8f5e9;
          border-color: #4CAF50;
        }

        .version-info {
          cursor: pointer;
        }

        .version-item.active .version-info {
          cursor: default;
        }

        .version-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .version-title {
          font-weight: 600;
          font-size: 14px;
        }

        .active-badge {
          background: #4CAF50;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .version-description {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .version-meta {
          font-size: 11px;
          color: #999;
        }

        .version-actions {
          display: flex;
          gap: 4px;
          margin-top: 8px;
        }

        .btn-icon {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-icon:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #4CAF50;
        }

        .btn-icon:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .version-edit-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .version-edit-input {
          padding: 8px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 14px;
        }

        .version-edit-actions {
          display: flex;
          gap: 8px;
        }

        .btn-save, .btn-cancel {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-save {
          background: #4CAF50;
          color: white;
        }

        .btn-cancel {
          background: #e0e0e0;
          color: #333;
        }

        .btn-create-version {
          width: 100%;
          padding: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 0 0 6px 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s;
        }

        .btn-create-version:hover {
          background: #45a049;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }

        .modal-content h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .modal-input {
          width: 100%;
          padding: 10px;
          margin-bottom: 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .modal-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          gap: 8px;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        }

        .btn-primary {
          background: #4CAF50;
          color: white;
        }

        .btn-primary:hover {
          background: #45a049;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }
      `}</style>
    </div>
  );
}
