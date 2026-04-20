// ============================================
// HOMEKEEPER - Task Types & Data
// ============================================

export interface Task {
  id: string;
  propertyId?: string; // Which property this task belongs to
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO date string
  completedDate?: string;
  recurring?: RecurringSchedule;
  isRecurring?: boolean;
  recurringFrequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  templateId?: string; // Reference to task template
  notes?: string;
  attachments?: string[]; // URLs to photos/documents
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
  cost?: number;
  proId?: string; // Reference to professional service
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory = 
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'roofing'
  | 'exterior'
  | 'interior'
  | 'appliances'
  | 'safety'
  | 'landscaping'
  | 'cleaning'
  | 'pest_control'
  | 'other';

export type TaskStatus = 
  | 'overdue'
  | 'upcoming'
  | 'in_progress'
  | 'completed'
  | 'scheduled';

export type TaskPriority = 
  | 'urgent'
  | 'high'
  | 'medium'
  | 'low';

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  interval: number; // Every X frequency units
  nextDueDate?: string; // Optional - computed when task completes
}

export const TaskCategoryLabels: Record<TaskCategory, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  roofing: 'Roofing',
  exterior: 'Exterior',
  interior: 'Interior',
  appliances: 'Appliances',
  safety: 'Safety',
  landscaping: 'Landscaping',
  cleaning: 'Cleaning',
  pest_control: 'Pest Control',
  other: 'Other',
};

export const TaskCategoryIcons: Record<TaskCategory, string> = {
  hvac: 'thermometer',
  plumbing: 'water',
  electrical: 'flash',
  roofing: 'home',
  exterior: 'construct',
  interior: 'bed',
  appliances: 'cube',
  safety: 'shield-checkmark',
  landscaping: 'leaf',
  cleaning: 'sparkles',
  pest_control: 'bug',
  other: 'ellipsis-horizontal',
};

// Sample tasks generator - creates tasks from templates for a specific property
import { generateDefaultTasks } from './taskTemplates';

export function generateSampleTasks(propertyId: string): Task[] {
  return generateDefaultTasks(propertyId);
}

function generateTaskId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper functions
export function getStatusColor(status: TaskStatus, colors: any): string {
  switch (status) {
    case 'overdue':
      return colors.error;
    case 'upcoming':
      return colors.warning;
    case 'in_progress':
      return colors.info;
    case 'completed':
      return colors.success;
    case 'scheduled':
      return colors.primary;
    default:
      return colors.textTertiary;
  }
}

export function getPriorityColor(priority: TaskPriority, colors: any): string {
  switch (priority) {
    case 'urgent':
      return colors.error;
    case 'high':
      return colors.warning;
    case 'medium':
      return colors.info;
    case 'low':
      return colors.textTertiary;
    default:
      return colors.textSecondary;
  }
}

export function formatDate(dateString: string): string {
  // Parse date as local time (not UTC) to avoid timezone shift
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  
  const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`;
  }
  if (daysUntil <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}