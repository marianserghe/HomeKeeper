// ============================================
// HOMEKEEPER - Backup & Restore
// ============================================
// Export/Import all app data as JSON
// Local storage only - no cloud sync
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { format } from 'date-fns';

const STORAGE_KEY = '@homekeeper_data';

// Backup data structure
export interface BackupData {
  version: string;
  exportDate: string;
  app: string;
  data: {
    tasks: any[];
    inventory: any[];
    pros: any[];
    properties: any[];
    activePropertyId: string | null;
  };
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
    reminders: boolean;
  };
}

/**
 * Export all app data to a JSON object
 */
export async function exportAllData(): Promise<BackupData> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  const parsedData = data ? JSON.parse(data) : {};

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    app: 'HomeKeeper',
    data: {
      tasks: parsedData.tasks || [],
      inventory: parsedData.inventory || [],
      pros: parsedData.pros || [],
      properties: parsedData.properties || [],
      activePropertyId: parsedData.activePropertyId || null,
    },
    settings: {
      theme: parsedData.settings?.theme || 'dark',
      notifications: parsedData.settings?.notifications ?? true,
      reminders: parsedData.settings?.reminders ?? true,
    },
  };
}

/**
 * Export backup as JSON string
 */
export async function exportBackupAsString(): Promise<string> {
  const backup = await exportAllData();
  return JSON.stringify(backup, null, 2);
}

/**
 * Validate backup data structure
 */
export function validateBackupData(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid backup format' };
  }

  if (data.app !== 'HomeKeeper') {
    return { valid: false, error: 'Not a HomeKeeper backup file' };
  }

  if (!data.data || typeof data.data !== 'object') {
    return { valid: false, error: 'Missing data section' };
  }

  const requiredArrays = ['tasks', 'inventory', 'pros', 'properties'];
  for (const key of requiredArrays) {
    if (!Array.isArray(data.data[key])) {
      return { valid: false, error: `Missing or invalid ${key} data` };
    }
  }

  return { valid: true };
}

/**
 * Get backup summary for display
 */
export function getBackupSummary(data: BackupData): {
  tasks: number;
  inventory: number;
  pros: number;
  properties: number;
} {
  return {
    tasks: data.data.tasks.length,
    inventory: data.data.inventory.length,
    pros: data.data.pros.length,
    properties: data.data.properties.length,
  };
}

/**
 * Format backup summary as text
 */
export function formatBackupSummary(data: BackupData): string {
  const counts = getBackupSummary(data);
  return (
    `• ${counts.tasks} tasks\n` +
    `• ${counts.inventory} inventory items\n` +
    `• ${counts.pros} pros\n` +
    `• ${counts.properties} properties`
  );
}

/**
 * Import backup data
 */
export async function importAllData(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateBackupData(parsed);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    return { success: true };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: 'Failed to parse backup file' };
  }
}

/**
 * Share backup file
 */
export async function shareBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return { success: false, error: 'Sharing is not available on this device' };
    }

    const jsonData = await exportBackupAsString();
    const filename = `homekeeper-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

    await Sharing.shareAsync(`data:application/json;base64,${btoa(jsonData)}`, {
      mimeType: 'application/json',
      dialogTitle: 'Export HomeKeeper Backup',
      UTI: 'public.json',
    });

    return { success: true };
  } catch (error) {
    console.error('Share backup error:', error);
    return { success: false, error: 'Failed to share backup' };
  }
}

/**
 * Read backup file from document picker
 */
export async function readBackupFile(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, error: 'Cancelled' };
    }

    const file = result.assets[0];
    if (!file || !file.uri) {
      return { success: false, error: 'No file selected' };
    }

    // Read file content
    const FileSystem = require('expo-file-system');
    const content = await FileSystem.readAsStringAsync(file.uri);

    return { success: true, data: content };
  } catch (error) {
    console.error('Read backup file error:', error);
    return { success: false, error: 'Failed to read backup file' };
  }
}

/**
 * Generate readable export report
 */
export async function generateReadableReport(data: BackupData): Promise<string> {
  const lines: string[] = [];
  const now = format(new Date(), 'MMMM d, yyyy');

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                      HOMEKEEPER REPORT                        ');
  lines.push(`                      Generated: ${now}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');

  // Overview
  const totalTasks = data.data.tasks.length;
  const completedTasks = data.data.tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const overdueTasks = data.data.tasks.filter(t => {
    if (t.status === 'completed' || !t.dueDate) return false;
    const [y, m, d] = t.dueDate.split('-').map(Number);
    const dueDate = new Date(y, m - 1, d);
    return dueDate < new Date();
  }).length;

  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│                     TASKS OVERVIEW                          │');
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push(`│  Total Tasks:          ${(totalTasks + '').padEnd(10)}                            │`);
  lines.push(`│  Completed:            ${(completedTasks + '').padEnd(10)}                            │`);
  lines.push(`│  Pending:              ${(pendingTasks + '').padEnd(10)}                            │`);
  lines.push(`│  Overdue:              ${(overdueTasks + '').padEnd(10)}                            │`);
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Inventory
  const totalInventory = data.data.inventory.length;
  const categories = [...new Set(data.data.inventory.map(i => i.category))];

  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│                   INVENTORY SUMMARY                         │');
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push(`│  Total Items:          ${(totalInventory + '').padEnd(10)}                            │`);
  lines.push(`│  Categories:           ${(categories.length + '').padEnd(10)}                            │`);
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Pros
  const totalPros = data.data.pros.length;
  const proCategories = [...new Set(data.data.pros.map(p => p.category))];

  lines.push('┌─────────────────────────────────────────────────────────────┐');
  lines.push('│                     PROS SUMMARY                            │');
  lines.push('├─────────────────────────────────────────────────────────────┤');
  lines.push(`│  Total Pros:           ${(totalPros + '').padEnd(10)}                            │`);
  lines.push(`│  Categories:           ${(proCategories.length + '').padEnd(10)}                            │`);
  lines.push('└─────────────────────────────────────────────────────────────┘');
  lines.push('');

  // Properties
  if (data.data.properties.length > 0) {
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                      PROPERTIES                              ');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    data.data.properties.forEach((property, index) => {
      lines.push(`───────────────────────────────────────────────────────────────`);
      lines.push(`  ${index + 1}. ${property.address || 'No Address'}`);
      if (property.city || property.state || property.zip) {
        lines.push(`     ${property.city || ''}, ${property.state || ''} ${property.zip || ''}`);
      }
      if (property.zestimate) {
        lines.push(`     Estimated Value: $${property.zestimate.toLocaleString()}`);
      }
      lines.push('');
    });
  }

  // Tasks Detail
  if (data.data.tasks.length > 0) {
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                        TASKS                                  ');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    data.data.tasks.forEach((task, index) => {
      const status = task.status === 'completed' ? '✓' : task.status;
      lines.push(`${index + 1}. [${status}] ${task.title}`);
      if (task.dueDate) {
        lines.push(`   Due: ${task.dueDate}`);
      }
      if (task.category) {
        lines.push(`   Category: ${task.category}`);
      }
      lines.push('');
    });
  }

  // Footer
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('               Generated by HomeKeeper                         ');
  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}