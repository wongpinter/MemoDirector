import { PAOItem } from '../types';

/**
 * Convert PAO items to CSV format
 */
export function exportToCSV(items: PAOItem[]): string {
  // CSV Headers
  const headers = [
    'Number',
    'Person',
    'Action',
    'Object',
    'Scene',
    'ImageUrl',
    'VideoUrl',
    'Notes',
    'Completed',
    'LastModified'
  ];

  // Escape CSV field (handle commas, quotes, newlines)
  const escapeField = (field: string | number | boolean | null | undefined): string => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV rows
  const rows = items.map(item => [
    item.number,
    escapeField(item.person),
    escapeField(item.action),
    escapeField(item.object),
    escapeField(item.scene || ''),
    escapeField(item.imageUrl || ''),
    escapeField(item.videoUrl || ''),
    escapeField(item.notes || ''),
    item.completed ? 'true' : 'false',
    item.lastModified || ''
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Parse CSV and convert back to PAO items
 */
export function importFromCSV(csvContent: string): PAOItem[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  
  const items: PAOItem[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    try {
      const fields = parseCSVLine(dataLines[i]);
      
      if (fields.length < 9) {
        console.warn(`Skipping line ${i + 2}: insufficient fields`);
        continue;
      }

      const item: PAOItem = {
        number: parseInt(fields[0], 10),
        person: fields[1],
        action: fields[2],
        object: fields[3],
        scene: fields[4] || undefined,
        imageUrl: fields[5] || undefined,
        videoUrl: fields[6] || undefined,
        notes: fields[7] || undefined,
        completed: fields[8].toLowerCase() === 'true',
        lastModified: fields[9] ? parseInt(fields[9], 10) : undefined
      };

      // Validate number
      if (isNaN(item.number) || item.number < 0 || item.number > 99) {
        console.warn(`Skipping line ${i + 2}: invalid number ${fields[0]}`);
        continue;
      }

      items.push(item);
    } catch (error) {
      console.warn(`Error parsing line ${i + 2}:`, error);
    }
  }

  if (items.length === 0) {
    throw new Error('No valid items found in CSV');
  }

  return items;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  // Add last field
  fields.push(currentField);

  return fields;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'pao-backup.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `pao-backup-${timestamp}.csv`;
}
