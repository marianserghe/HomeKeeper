// ============================================
// HOMEKEEPER - Notification Service
// ============================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from './tasks';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return false;
  }
  
  // Get push token for Android (required for local notifications on some devices)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HomeKeeper',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }
  
  console.log('Notification permission granted');
  return true;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All notifications cancelled');
}

// Schedule notification for a task
export async function scheduleTaskReminder(
  task: Task,
  daysBefore: number = 1
): Promise<string | null> {
  if (!task.dueDate) return null;
  
  const dueDate = new Date(task.dueDate);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  reminderDate.setHours(9, 0, 0, 0); // 9 AM reminder
  
  // Don't schedule if reminder time is in the past
  if (reminderDate.getTime() <= Date.now()) {
    console.log('Reminder time is in the past, skipping:', task.title);
    return null;
  }
  
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏠 Task Reminder',
        body: `"${task.title}" is due ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}`,
        data: { taskId: task.id, type: 'task-reminder' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });
    
    console.log(`Scheduled reminder for "${task.title}" on ${reminderDate.toISOString()}`);
    return identifier;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
}

// Schedule overdue notification for a task
export async function scheduleOverdueNotification(task: Task): Promise<string | null> {
  if (!task.dueDate) return null;
  
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(10, 0, 0, 0); // 10 AM on due date
  
  // Schedule for the due date
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Overdue Task',
        body: `"${task.title}" is now overdue!`,
        data: { taskId: task.id, type: 'task-overdue' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
      },
    });
    
    console.log(`Scheduled overdue notification for "${task.title}"`);
    return identifier;
  } catch (error) {
    console.error('Failed to schedule overdue notification:', error);
    return null;
  }
}

// Schedule all task reminders
export async function scheduleAllTaskReminders(
  tasks: Task[],
  enabled: boolean
): Promise<void> {
  // Cancel all existing notifications first
  await cancelAllNotifications();
  
  if (!enabled) {
    console.log('Reminders disabled, no notifications scheduled');
    return;
  }
  
  const pendingTasks = tasks.filter(t => 
    t.status !== 'completed' && 
    t.dueDate && 
    new Date(t.dueDate) > new Date()
  );
  
  console.log(`Scheduling reminders for ${pendingTasks.length} pending tasks`);
  
  for (const task of pendingTasks) {
    // Schedule 1-day reminder
    await scheduleTaskReminder(task, 1);
    
    // Schedule overdue notification
    await scheduleOverdueNotification(task);
  }
}

// Get all scheduled notifications
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Add notification received listener
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add notification response listener (when user taps notification)
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}