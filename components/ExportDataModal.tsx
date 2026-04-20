// ============================================
// HOMEKEEPER - Export Data Modal
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../contexts/ThemeContext';
import { 
  exportBackupAsString, 
  exportAllData, 
  generateReadableReport, 
  readBackupFile, 
  validateBackupData,
  getBackupSummary,
  formatBackupSummary,
  importAllData,
  BackupData
} from '../lib/backup';
import { useState } from 'react';

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ExportDataModal({ visible, onClose, onImportComplete }: ExportDataModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const handleExportJSON = async () => {
    try {
      setExportLoading(true);
      const jsonData = await exportBackupAsString();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(`data:application/json;base64,${btoa(jsonData)}`, {
          mimeType: 'application/json',
          dialogTitle: 'Export HomeKeeper Backup',
          UTI: 'public.json',
        });
      } else {
        // Fallback: show in alert (for debugging)
        Alert.alert('Backup Created', 'Sharing not available. Data has been prepared for export.');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      const data = await exportAllData();
      const report = await generateReadableReport(data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(`data:text/plain;base64,${btoa(report)}`, {
          mimeType: 'text/plain',
          dialogTitle: 'Export HomeKeeper Report',
          UTI: 'public.plain-text',
        });
      } else {
        Alert.alert('Report Generated', 'Sharing not available. Report has been prepared.');
      }
    } catch (error) {
      console.error('Report export error:', error);
      Alert.alert('Export Failed', 'Could not create report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      setImportLoading(true);

      const result = await readBackupFile();

      if (!result.success || !result.data) {
        setImportLoading(false);
        Alert.alert('Import Failed', result.error || 'Could not read backup file.');
        return;
      }

      const parsedData = JSON.parse(result.data);
      const validation = validateBackupData(parsedData);

      if (!validation.valid) {
        setImportLoading(false);
        Alert.alert('Invalid Backup', validation.error || 'This backup file is corrupted or invalid.');
        return;
      }

      const summary = formatBackupSummary(parsedData);

      Alert.alert(
        '⚠️ Replace All Data?',
        `This will DELETE all your current data and replace it with:\n\n${summary}\n\n⚠️ This cannot be undone!`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setImportLoading(false) },
          {
            text: 'Replace Data',
            style: 'destructive',
            onPress: async () => {
              const importResult = await importAllData(result.data!);

              if (importResult.success) {
                Alert.alert(
                  'Import Successful',
                  'Your data has been restored.',
                  [{ text: 'OK', onPress: () => {
                    onImportComplete();
                    onClose();
                  }}]
                );
              } else {
                Alert.alert('Import Failed', importResult.error || 'An error occurred during import.');
              }
              setImportLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      setImportLoading(false);
      Alert.alert('Import Failed', 'Could not import backup file. Please ensure it\'s a valid HomeKeeper backup.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Export & Backup</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.intro}>
            Export your data to keep a backup or transfer to another device.
          </Text>

          {/* Export JSON Backup */}
          <Pressable 
            style={styles.optionCard} 
            onPress={handleExportJSON}
            disabled={exportLoading}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
                {exportLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons name="download-outline" size={24} color={colors.primary} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Export Backup (JSON)</Text>
                <Text style={styles.cardDescription}>
                  Full backup with all tasks, inventory, pros, and settings. Can be restored later.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Export Readable Report */}
          <Pressable 
            style={styles.optionCard} 
            onPress={handleExportReport}
            disabled={exportLoading}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.info + '20' }]}>
                <Ionicons name="document-text-outline" size={24} color={colors.info} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Export Report (Text)</Text>
                <Text style={styles.cardDescription}>
                  Human-readable summary of your home maintenance data. For reference only.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Import Backup */}
          <Pressable 
            style={styles.optionCard} 
            onPress={handleImportBackup}
            disabled={importLoading}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: colors.success + '20' }]}>
                {importLoading ? (
                  <ActivityIndicator color={colors.success} size="small" />
                ) : (
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.success} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Import Backup</Text>
                <Text style={styles.cardDescription}>
                  Restore data from a previous backup file. This will replace all current data.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Backups are stored locally on your device. There is no cloud sync. Export regularly to avoid data loss.
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips</Text>
            <Text style={styles.tipsText}>
              • Export a backup before updating the app{'\n'}
              • Keep multiple backups in different locations{'\n'}
              • JSON backups can be restored, text reports cannot
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    intro: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      flex: 1,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.warning + '15',
      borderRadius: 10,
      padding: 14,
      marginTop: 16,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    tipsCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginTop: 12,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    tipsText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    footer: {
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    doneButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
  });
}