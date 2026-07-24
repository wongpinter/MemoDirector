/**
 * PAOStore — local-first persistence for PAO items and versions.
 *
 * Interface (7 functions):
 *   load, save, listVersions, getActiveVersion, createVersion,
 *   switchVersion, deleteVersion, duplicateVersion
 *
 * Implementation hides: user-key namespacing, legacy migration,
 * active-version tracking, localStorage quota handling.
 */

import { PAOItem, PAOVersion } from '../types';
import { getCurrentUserId } from './auth';
import { safeSetItem, safeGetItem, safeRemoveItem, StorageResult } from '../utils/localStorage';
import { safeJsonParse } from '../utils/jsonParse';

// ── keys ────────────────────────────────────────────────────────
const VERSIONS_KEY_BASE = 'pao_versions';
const ACTIVE_VERSION_KEY_BASE = 'pao_active_version';
const DATA_KEY_BASE = 'pao_data';

const LEGACY_KEYS = {
  data: 'pao_data',
  versions: 'pao_versions',
  activeVersion: 'pao_active_version',
} as const;

const namespacedKey = (base: string): string => `${base}_${getCurrentUserId()}`;

// ── init ─────────────────────────────────────────────────────────
let _initialized = false;

function _ensureInit(): void {
  if (_initialized) return;

  const uid = getCurrentUserId();
  if (uid !== 'anonymous') {
    // migrate legacy non-namespaced keys → namespaced
    const pairs: Array<[string, string]> = [
      [LEGACY_KEYS.data, namespacedKey(DATA_KEY_BASE)],
      [LEGACY_KEYS.versions, namespacedKey(VERSIONS_KEY_BASE)],
      [LEGACY_KEYS.activeVersion, namespacedKey(ACTIVE_VERSION_KEY_BASE)],
    ];
    pairs.forEach(([legacy, scoped]) => {
      if (!safeGetItem(scoped)) {
        const val = safeGetItem(legacy);
        if (val) {
          safeSetItem(scoped, val);
          safeRemoveItem(legacy);
        }
      }
    });

    // migrate flat data → versioning (if legacy data exists but no versions)
    const versionsKey = namespacedKey(VERSIONS_KEY_BASE);
    if (!safeGetItem(versionsKey)) {
      const dataKey = namespacedKey(DATA_KEY_BASE);
      const legacyData = safeGetItem(dataKey);
      if (legacyData) {
        const items = safeJsonParse<PAOItem[]>(legacyData, []);
        if (items.length > 0) {
          const id = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const version: PAOVersion = {
            id,
            name: 'Default',
            description: 'Migrated from legacy data',
            createdAt: Date.now(),
            lastModified: Date.now(),
            isActive: true,
            items,
          };
          safeSetItem(versionsKey, JSON.stringify([version]));
          safeSetItem(namespacedKey(ACTIVE_VERSION_KEY_BASE), id);
          console.log('✅ Migrated legacy PAO data to versioning system');
        }
      }
    }
  }

  _initialized = true;
}

// ── internal helpers ─────────────────────────────────────────────

function _emptyItems(): PAOItem[] {
  return Array.from({ length: 100 }, (_, i) => ({
    number: i,
    person: '',
    action: '',
    object: '',
    scene: '',
    completed: false,
    lastModified: Date.now(),
  }));
}

function _readVersions(): PAOVersion[] {
  const key = namespacedKey(VERSIONS_KEY_BASE);
  const data = safeGetItem(key);
  if (!data) return [];
  return safeJsonParse<PAOVersion[]>(data, []);
}

function _writeVersions(versions: PAOVersion[]): void {
  safeSetItem(namespacedKey(VERSIONS_KEY_BASE), JSON.stringify(versions));
}

function _getActiveVersionId(): string | null {
  return safeGetItem(namespacedKey(ACTIVE_VERSION_KEY_BASE)) || null;
}

function _setActiveVersionId(id: string): void {
  safeSetItem(namespacedKey(ACTIVE_VERSION_KEY_BASE), id);
}

/** Ensure exactly one version has isActive=true, matching the stored activeVersionId. */
function _syncActiveFlags(versions: PAOVersion[]): void {
  const activeId = _getActiveVersionId();

  if (activeId) {
    versions.forEach(v => { v.isActive = v.id === activeId; });
  } else if (versions.length > 0) {
    versions.forEach(v => { v.isActive = false; });
    versions[0].isActive = true;
    _setActiveVersionId(versions[0].id);
  }
}

function _generateVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ── public: data ─────────────────────────────────────────────────

/** Load items from the active version. Always returns 100 items (00–99). */
export function load(): PAOItem[] {
  _ensureInit();

  const versions = _readVersions();
  _syncActiveFlags(versions);
  const activeId = _getActiveVersionId();

  if (activeId) {
    const active = versions.find(v => v.id === activeId);
    if (active && active.items.length > 0) return active.items;
  }

  // fallback: namespaced data key (pre-versioning or sync-queue data)
  const dataKey = namespacedKey(DATA_KEY_BASE);
  const raw = safeGetItem(dataKey);
  if (raw) {
    const items = safeJsonParse<PAOItem[]>(raw, []);
    if (items.length > 0) return items;
  }

  return _emptyItems();
}

/**
 * Save items to the active version and persist to localStorage.
 * Returns StorageResult so callers can detect quota exceeded.
 */
export function save(items: PAOItem[]): StorageResult {
  _ensureInit();

  const versions = _readVersions();
  _syncActiveFlags(versions);
  const activeId = _getActiveVersionId();

  if (activeId) {
    const idx = versions.findIndex(v => v.id === activeId);
    if (idx !== -1) {
      versions[idx] = {
        ...versions[idx],
        items,
        lastModified: Date.now(),
      };
      _writeVersions(versions);
    }
  }

  // also write to the flat data key (used by sync queue and as migration fallback)
  const dataKey = namespacedKey(DATA_KEY_BASE);
  return safeSetItem(dataKey, JSON.stringify(items));
}

// ── public: versions ─────────────────────────────────────────────

/** List all versions, with isActive flags synced to stored activeVersionId. */
export function listVersions(): PAOVersion[] {
  _ensureInit();
  const versions = _readVersions();
  _syncActiveFlags(versions);
  return versions;
}

/** Get the currently active version, or null if none exist. */
export function getActiveVersion(): PAOVersion | null {
  _ensureInit();
  const versions = _readVersions();
  _syncActiveFlags(versions);
  const activeId = _getActiveVersionId();
  if (!activeId) return versions.length > 0 ? versions[0] : null;
  return versions.find(v => v.id === activeId) || null;
}

/** Create a new version. If copyFromActive, clones current items. First version auto-activated. */
export function createVersion(
  name: string,
  description?: string,
  copyFromActive: boolean = false,
): PAOVersion {
  _ensureInit();
  const versions = _readVersions();

  let items: PAOItem[];
  if (copyFromActive) {
    const active = getActiveVersion();
    items = active ? JSON.parse(JSON.stringify(active.items)) : _emptyItems();
  } else {
    items = _emptyItems();
  }

  const isFirst = versions.length === 0;
  const newVersion: PAOVersion = {
    id: _generateVersionId(),
    name,
    description,
    createdAt: Date.now(),
    lastModified: Date.now(),
    isActive: isFirst,
    items,
  };

  versions.push(newVersion);
  _writeVersions(versions);

  if (isFirst) {
    _setActiveVersionId(newVersion.id);
  }

  return newVersion;
}

/** Switch the active version. Returns false if versionId not found. */
export function switchVersion(versionId: string): boolean {
  _ensureInit();
  const versions = _readVersions();

  const target = versions.find(v => v.id === versionId);
  if (!target) return false;

  versions.forEach(v => { v.isActive = false; });
  target.isActive = true;
  _setActiveVersionId(versionId);
  _writeVersions(versions);
  return true;
}

/** Delete a version. If it was active, activates the first remaining version. */
export function deleteVersion(versionId: string): boolean {
  _ensureInit();
  const versions = _readVersions();
  const idx = versions.findIndex(v => v.id === versionId);
  if (idx === -1) return false;

  const wasActive = versions[idx].isActive;
  versions.splice(idx, 1);

  if (wasActive && versions.length > 0) {
    versions[0].isActive = true;
    _setActiveVersionId(versions[0].id);
  } else if (versions.length === 0) {
    safeRemoveItem(namespacedKey(ACTIVE_VERSION_KEY_BASE));
  }

  _writeVersions(versions);
  return true;
}

/**
 * Bulk-import versions from remote (pull/sync). Overwrites local versions
 * and activates the version marked isActive in the imported set.
 */
export function importVersions(versions: PAOVersion[]): void {
  _ensureInit();

  const active = versions.find(v => v.isActive);
  if (active) {
    _setActiveVersionId(active.id);
  } else if (versions.length > 0) {
    versions[0].isActive = true;
    _setActiveVersionId(versions[0].id);
  }

  _writeVersions(versions);
}

/** Update a version's name and/or description. Returns null if not found. */
export function renameVersion(
  versionId: string,
  name: string,
  description?: string,
): PAOVersion | null {
  _ensureInit();
  const versions = _readVersions();
  const idx = versions.findIndex(v => v.id === versionId);
  if (idx === -1) return null;

  versions[idx] = {
    ...versions[idx],
    name,
    description: description !== undefined ? description : versions[idx].description,
    lastModified: Date.now(),
  };
  _writeVersions(versions);
  return versions[idx];
}

/** Clone a version with a new name. The clone is NOT auto-activated. */
export function duplicateVersion(versionId: string, newName: string): PAOVersion | null {
  _ensureInit();
  const versions = _readVersions();
  const source = versions.find(v => v.id === versionId);
  if (!source) return null;

  const clone: PAOVersion = {
    id: _generateVersionId(),
    name: newName,
    description: source.description,
    createdAt: Date.now(),
    lastModified: Date.now(),
    isActive: false,
    items: JSON.parse(JSON.stringify(source.items)),
  };

  versions.push(clone);
  _writeVersions(versions);
  return clone;
}
