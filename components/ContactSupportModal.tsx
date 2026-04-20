// ============================================
// HOMEKEEPER - Contact Support Modal
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ visible, onClose }: ContactSupportModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Note: In a real implementation, you'd use useState for email and message
  // This is a simplified version that just opens email client
  const handleEmailPress = () => {
    Alert.alert(
      'Contact Support',
      'This will open your email client. Send your message to:\n\nsupport@homekeeper.app',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Email', 
          onPress: () => {
            // In a real app, use Linking.openURL with mailto
            Alert.alert('Email Support', 'Please send your message to support@homekeeper.app');
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Contact Support</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Introduction */}
            <Text style={styles.intro}>
              Having issues? We're here to help. Choose how you'd like to reach us:
            </Text>

            {/* Email Support */}
            <Pressable style={styles.contactCard} onPress={handleEmailPress}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="mail-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Email Support</Text>
                  <Text style={styles.cardDescription}>
                    Send us a detailed message. We typically respond within 24-48 hours.
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.emailAddress}>support@homekeeper.app</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Pressable>

            {/* GitHub */}
            <Pressable 
              style={styles.contactCard} 
              onPress={() => Alert.alert('Report Bug', 'Please open an issue on GitHub:\n\ngithub.com/marianserghe/HomeKeeper/issues')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="logo-github" size={24} color={colors.success} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>Report a Bug</Text>
                  <Text style={styles.cardDescription}>
                    Found a bug? Open an issue on GitHub for faster resolution.
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.emailAddress}>github.com/marianserghe/HomeKeeper</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </Pressable>

            {/* Common Issues */}
            <Text style={styles.sectionTitle}>Common Issues</Text>
            <View style={styles.issuesCard}>
              <View style={styles.issueRow}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueTitle}>App won't load?</Text>
                  <Text style={styles.issueText}>Try closing and reopening the app. Check your internet connection for Pro search features.</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.issueRow}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueTitle}>Data missing?</Text>
                  <Text style={styles.issueText}>Your data is stored locally. Check Settings → Data → Export to create a backup.</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.issueRow}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueTitle}>Notifications not working?</Text>
                  <Text style={styles.issueText}>Make sure Task Reminders are enabled in Settings and notification permissions are granted.</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.issueRow}>
                <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                <View style={styles.issueContent}>
                  <Text style={styles.issueTitle}>Zestimate not loading?</Text>
                  <Text style={styles.issueText}>Make sure your property has a valid address. Zestimate requires an address to fetch home value.</Text>
                </View>
              </View>
            </View>

            {/* Response Time */}
            <View style={styles.responseCard}>
              <Ionicons name="time-outline" size={20} color={colors.info} />
              <Text style={styles.responseText}>
                Typical response time: 24-48 hours on business days
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
      </KeyboardAvoidingView>
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
      marginBottom: 20,
    },
    contactCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
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
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    emailAddress: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 12,
    },
    issuesCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    issueRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 16,
    },
    issueContent: {
      flex: 1,
    },
    issueTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    issueText: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      marginLeft: 48,
    },
    responseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.info + '15',
      borderRadius: 10,
      padding: 14,
      marginTop: 20,
    },
    responseText: {
      flex: 1,
      fontSize: 14,
      color: colors.info,
      fontWeight: '500',
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