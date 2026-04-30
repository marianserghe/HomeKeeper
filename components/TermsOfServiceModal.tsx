// ============================================
// HOMEKEEPER - Terms of Service Modal
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
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
          <Text style={styles.title}>Terms of Service</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Last Updated */}
          <Text style={styles.updated}>Last Updated: April 2026</Text>

          {/* Introduction */}
          <Text style={styles.sectionTitle}>Agreement to Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using HomeKeeper ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.
          </Text>

          {/* License */}
          <Text style={styles.sectionTitle}>License to Use</Text>
          <Text style={styles.paragraph}>
            HomeKeeper is provided for personal, non-commercial use. You may:
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              ✓ Use the App on your personal devices{'\n'}
              ✓ Store your own home maintenance data{'\n'}
              ✓ Use the App offline without restrictions
            </Text>
          </View>
          <Text style={styles.paragraph}>
            You may NOT:
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              ✗ Copy, modify, or distribute the App{'\n'}
              ✗ Reverse engineer or extract source code{'\n'}
              ✗ Use the App for commercial purposes{'\n'}
              ✗ Sell or transfer your account data
            </Text>
          </View>

          {/* Third-Party Services */}
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.paragraph}>
            The App integrates with third-party services for certain features:
          </Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>HERE Technologies</Text>
            <Text style={styles.cardText}>
              Address autocomplete and location-based pro search. Your address queries are sent to HERE's servers. Subject to HERE's terms at developer.here.com.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yelp Fusion API</Text>
            <Text style={styles.cardText}>
              Business ratings and reviews. When you view a pro's details, Yelp receives a request. Subject to Yelp's terms at yelp.com.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Zillow (via Apify)</Text>
            <Text style={styles.cardText}>
              Home value estimates (Zestimate). Your property address is used to fetch public data. Zestimate is a trademark of Zillow, Inc.
            </Text>
          </View>

          {/* Disclaimer */}
          <Text style={styles.sectionTitle}>Disclaimer of Warranties</Text>
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} />
            <Text style={styles.warningText}>
              THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </Text>
          </View>
          <Text style={styles.paragraph}>
            • Accuracy of home value estimates{'\n'}
            • Accuracy of pro ratings or reviews{'\n'}
            • Availability of third-party services{'\n'}
            • Suitability for any particular purpose
          </Text>

          {/* Limitation of Liability */}
          <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Under no circumstances shall HomeKeeper, its developers, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages resulting from:
          </Text>
          <Text style={styles.paragraph}>
            • Use or inability to use the App{'\n'}
            • Decisions made based on estimated home values{'\n'}
            • Actions taken based on pro ratings or reviews{'\n'}
            • Loss of data stored in the App
          </Text>

          {/* Data */}
          <Text style={styles.sectionTitle}>Your Data</Text>
          <Text style={styles.paragraph}>
            All data entered into HomeKeeper is stored locally on your device. You are solely responsible for:
          </Text>
          <Text style={styles.paragraph}>
            • Backing up your data regularly{'\n'}
            • Securing your device{'\n'}
            • Managing data across devices
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              We do not have access to your data and cannot recover lost data.
            </Text>
          </View>

          {/* Indemnification */}
          <Text style={styles.sectionTitle}>Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify and hold harmless HomeKeeper and its developers from any claims, damages, or expenses arising from your use of the App or violation of these Terms.
          </Text>

          {/* Changes */}
          <Text style={styles.sectionTitle}>Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these Terms at any time. Changes will be effective upon posting within the App. Continued use constitutes acceptance of modified Terms.
          </Text>

          {/* Termination */}
          <Text style={styles.sectionTitle}>Termination</Text>
          <Text style={styles.paragraph}>
            You may stop using the App at any time by deleting it from your device. These Terms will remain in effect until terminated by either party.
          </Text>

          {/* Governing Law */}
          <Text style={styles.sectionTitle}>Governing Law</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by the laws of the United States and the State of New Jersey, without regard to conflict of law principles.
          </Text>

          {/* Contact */}
          <Text style={styles.sectionTitle}>Questions?</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, contact:
          </Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Email: support@rentkeeper.co
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>I Agree</Text>
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
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    cardText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.warning + '15',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
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