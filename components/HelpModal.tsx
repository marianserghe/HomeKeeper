// ============================================
// HOMEKEEPER - Help Modal
// ============================================

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpModal({ visible, onClose }: HelpModalProps) {
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
          <Text style={styles.title}>Help & Tips</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Getting Started */}
          <Text style={styles.sectionTitle}>Getting Started</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="home-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Home Health Score</Text>
            </View>
            <Text style={styles.cardText}>
              Your home health score is calculated based on overdue tasks. Each overdue task subtracts 2 points per day (max -10 per task). Keep tasks on schedule to maintain a high score!
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Tasks</Text>
            </View>
            <Text style={styles.cardText}>
              • Swipe left on a task to complete or delete{'\n'}
              • Tap a task to edit it{'\n'}
              • Tasks show as overdue, upcoming, or completed{'\n'}
              • Set priority: Urgent, High, Medium, Low
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Inventory</Text>
            </View>
            <Text style={styles.cardText}>
              • Track items by location (garage, kitchen, etc.){'\n'}
              • Add photos to items{'\n'}
              • Track warranties and purchase dates{'\n'}
              • Categories: Appliances, Furniture, Tools, etc.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Pros</Text>
            </View>
            <Text style={styles.cardText}>
              • Find nearby contractors using location{'\n'}
              • Or enter a ZIP code manually{'\n'}
              • Save your favorite pros{'\n'}
              • Tap a saved pro to view details or edit
            </Text>
          </View>

          {/* Seasonal Tips */}
          <Text style={styles.sectionTitle}>Seasonal Tips</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="leaf-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Climate Zones</Text>
            </View>
            <Text style={styles.cardText}>
              HomeKeeper detects your climate zone based on property location (or state/ZIP) and shows month-specific maintenance tips. Tips update each month to match the season.
            </Text>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              On the Home screen, use Quick Actions to:{'\n'}
              • Add a task instantly{'\n'}
              • Add an inventory item{'\n'}
              • Find pros nearby
            </Text>
          </View>

          {/* Notifications */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
              <Text style={styles.cardTitle}>Task Reminders</Text>
            </View>
            <Text style={styles.cardText}>
              Enable Task Reminders in Settings to get notifications:{'\n'}
              • 1 day before a task is due (9 AM){'\n'}
              • On the due date when overdue (10 AM)
            </Text>
          </View>

          {/* Multi-Property */}
          <Text style={styles.sectionTitle}>Multiple Properties</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              HomeKeeper supports multiple properties!{'\n\n'}
              • Add properties in Settings{'\n'}
              • Switch between them using the property selector{'\n'}
              • Tasks, inventory, and pros are scoped to each property
            </Text>
          </View>

          {/* Tips */}
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              Use templates when adding tasks to quickly create common home maintenance items.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              Check your home health score weekly to stay on top of overdue tasks.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.warning} />
            <Text style={styles.tipText}>
              Add photos to inventory items for easy reference when buying replacements.
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
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 12,
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
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.warning + '15',
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
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