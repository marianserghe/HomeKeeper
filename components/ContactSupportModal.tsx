// ============================================
// HOMEKEEPER - Contact Support Modal
// ============================================

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { sendSupportEmail } from '../lib/email';

interface ContactSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ContactSupportModal({ visible, onClose }: ContactSupportModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Missing Message', 'Please enter your message.');
      return;
    }

    setSending(true);
    try {
      const result = await sendSupportEmail({
        userEmail: email.trim(),
        message: message.trim(),
      });

      if (result.success) {
        setEmail('');
        setMessage('');
        onClose();
        Alert.alert('Message Sent', "Thanks for reaching out! We'll respond within 24 hours.");
      } else {
        Alert.alert('Error', 'Failed to send message. Please try again or email support@rentkeeper.co directly.');
      }
    } catch (error) {
      console.error('Support message error:', error);
      Alert.alert('Error', 'Failed to send message. Please try again or email support@rentkeeper.co directly.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Contact Support</Text>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
            {/* Introduction */}
            <Text style={styles.intro}>
              Having issues? Send us a message and we'll get back to you within 24 hours.
            </Text>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Message Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Send Button */}
            <Pressable
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send Message</Text>
              )}
            </Pressable>

            {/* Alternative Contact */}
            <View style={styles.alternatives}>
              <Text style={styles.alternativesLabel}>Or reach us directly:</Text>
              <View style={styles.alternativeRow}>
                <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.alternativeEmail}>support@rentkeeper.co</Text>
              </View>
            </View>

            {/* Response Time */}
            <View style={styles.responseCard}>
              <Ionicons name="time-outline" size={18} color={colors.info} />
              <Text style={styles.responseText}>
                Typical response time: 24 hours on business days
              </Text>
            </View>
          </ScrollView>
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
    },
    intro: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.textPrimary,
    },
    textArea: {
      height: 140,
      paddingTop: 14,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    alternatives: {
      alignItems: 'center',
      marginBottom: 16,
    },
    alternativesLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    alternativeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    alternativeEmail: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    responseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.info + '15',
      borderRadius: 10,
      padding: 14,
    },
    responseText: {
      flex: 1,
      fontSize: 14,
      color: colors.info,
      fontWeight: '500',
    },
  });
}