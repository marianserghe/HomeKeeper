// ============================================
// HOMEKEEPER - Privacy Policy Modal
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

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
          <Text style={styles.title}>Privacy Policy</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Last Updated */}
          <Text style={styles.updated}>Last Updated: April 2026</Text>

          {/* Introduction */}
          <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
          <Text style={styles.paragraph}>
            HomeKeeper is designed with privacy as a core principle. Here's how we handle your data:
          </Text>

          {/* Data Storage */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>100% Local Storage</Text>
            </View>
            <Text style={styles.cardText}>
              All your data stays on your device. Tasks, inventory, pros, and home info are stored locally using AsyncStorage. Nothing is uploaded to any server.
            </Text>
          </View>

          {/* What We Don't Collect */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="close-circle-outline" size={24} color={colors.success} />
              <Text style={styles.cardTitle}>What We DON'T Collect</Text>
            </View>
            <Text style={styles.cardText}>
              • No personal information{'\n'}
              • No usage analytics{'\n'}
              • No crash reports{'\n'}
              • No advertising IDs{'\n'}
              • No location history
            </Text>
          </View>

          {/* Third-Party Services */}
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            HomeKeeper uses optional third-party services that may collect data:
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>HERE Geocoding</Text>
            <Text style={styles.cardText}>
              Used for address autocomplete and finding nearby pros. Your search queries may be processed by HERE's servers.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yelp Fusion API</Text>
            <Text style={styles.cardText}>
              Used to display business ratings and reviews. When you view a pro's details, Yelp receives a request for their rating.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zillow (via Apify)</Text>
            <Text style={styles.cardText}>
              Used to fetch home value estimates. Your property address is sent to Zillow's public data through Apify's scraper.
            </Text>
          </View>

          {/* Your Choices */}
          <Text style={styles.sectionTitle}>Your Choices</Text>
          <Text style={styles.paragraph}>
            • You can use HomeKeeper offline without any third-party services{'\n'}
            • You can clear all data anytime in Settings{'\n'}
            • You can disable location access for Pro search
          </Text>

          {/* Contact */}
          <Text style={styles.sectionTitle}>Questions?</Text>
          <Text style={styles.paragraph}>
            If you have questions about this policy, contact us at:
          </Text>
          <Pressable 
            style={styles.contactButton}
            onPress={() => Linking.openURL('mailto:support@rentkeeper.co')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.contactText}>support@rentkeeper.co</Text>
          </Pressable>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            This app is provided "as is" without warranty of any kind. We are not responsible for decisions made based on estimated home values or pro ratings.
          </Text>
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
    },
    updated: {
      fontSize: 12,
      color: colors.textTertiary,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 20,
      marginBottom: 12,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginBottom: 20,
    },
    contactText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '500',
    },
    disclaimer: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 24,
      textAlign: 'center',
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