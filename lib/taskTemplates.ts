// ============================================
// HOMEKEEPER - Task Templates
// ============================================

import { TaskCategory } from './tasks';

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  estimatedMinutes: number;
  icon: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  // Monthly
  {
    id: 'hvac-filter',
    title: 'Replace HVAC filter',
    description: 'Replace air filter in HVAC system for better air quality and efficiency',
    category: 'hvac',
    priority: 'high',
    frequency: 'monthly',
    estimatedMinutes: 10,
    icon: 'thermometer',
  },
  {
    id: 'smoke-detectors',
    title: 'Test smoke detectors',
    description: 'Test all smoke and CO detectors, replace batteries if needed',
    category: 'safety',
    priority: 'high',
    frequency: 'monthly',
    estimatedMinutes: 15,
    icon: 'shield-checkmark',
  },
  {
    id: 'garbage-disposal',
    title: 'Clean garbage disposal',
    description: 'Run ice and citrus through disposal to clean and sharpen blades',
    category: 'appliances',
    priority: 'low',
    frequency: 'monthly',
    estimatedMinutes: 5,
    icon: 'cube',
  },

  // Quarterly
  {
    id: 'dryer-vent',
    title: 'Clean dryer vent',
    description: 'Remove lint from dryer vent and exhaust duct to prevent fire hazard',
    category: 'appliances',
    priority: 'high',
    frequency: 'quarterly',
    estimatedMinutes: 30,
    icon: 'cube',
  },
  {
    id: 'gutter-check',
    title: 'Inspect gutters',
    description: 'Check gutters and downspouts for debris and proper drainage',
    category: 'exterior',
    priority: 'medium',
    frequency: 'quarterly',
    estimatedMinutes: 20,
    icon: 'construct',
  },
  {
    id: 'water-softener',
    title: 'Check water softener',
    description: 'Check salt levels and refill water softener if needed',
    category: 'plumbing',
    priority: 'medium',
    frequency: 'quarterly',
    estimatedMinutes: 5,
    icon: 'water',
  },

  // Semi-Annual (every 6 months)
  {
    id: 'refrigerator-coils',
    title: 'Clean refrigerator coils',
    description: 'Vacuum refrigerator condenser coils for better efficiency',
    category: 'appliances',
    priority: 'medium',
    frequency: 'semi-annual',
    estimatedMinutes: 20,
    icon: 'cube',
  },
  {
    id: 'water-heater-flush',
    title: 'Flush water heater',
    description: 'Drain and flush water heater to remove sediment buildup',
    category: 'plumbing',
    priority: 'medium',
    frequency: 'semi-annual',
    estimatedMinutes: 45,
    icon: 'water',
  },
  {
    id: 'faucet-aerators',
    title: 'Clean faucet aerators',
    description: 'Remove and clean aerators on all faucets for better water flow',
    category: 'plumbing',
    priority: 'low',
    frequency: 'semi-annual',
    estimatedMinutes: 20,
    icon: 'water',
  },

  // Annual
  {
    id: 'furnace-inspection',
    title: 'Furnace/AC inspection',
    description: 'Professional HVAC inspection and tune-up',
    category: 'hvac',
    priority: 'high',
    frequency: 'annual',
    estimatedMinutes: 120,
    icon: 'thermometer',
  },
  {
    id: 'roof-inspection',
    title: 'Roof inspection',
    description: 'Inspect roof for damaged shingles, flashing, and sealant',
    category: 'roofing',
    priority: 'high',
    frequency: 'annual',
    estimatedMinutes: 30,
    icon: 'home',
  },
  {
    id: 'chimney-inspection',
    title: 'Chimney inspection',
    description: 'Inspect chimney for damage, clean if needed',
    category: 'safety',
    priority: 'medium',
    frequency: 'annual',
    estimatedMinutes: 60,
    icon: 'home',
  },
  {
    id: 'septic-tank',
    title: 'Septic tank inspection',
    description: 'Inspect septic tank, pump if needed (every 3-5 years)',
    category: 'plumbing',
    priority: 'high',
    frequency: 'annual',
    estimatedMinutes: 60,
    icon: 'water',
  },
  {
    id: 'termite-inspection',
    title: 'Termite inspection',
    description: 'Annual termite and pest inspection',
    category: 'pest_control',
    priority: 'high',
    frequency: 'annual',
    estimatedMinutes: 45,
    icon: 'bug',
  },
  {
    id: 'garage-door',
    title: 'Service garage door',
    description: 'Lubricate hinges, springs, check safety sensors',
    category: 'exterior',
    priority: 'medium',
    frequency: 'annual',
    estimatedMinutes: 30,
    icon: 'construct',
  },
  {
    id: 'deck-seal',
    title: 'Seal deck/fence',
    description: 'Apply sealant to wooden deck or fence',
    category: 'exterior',
    priority: 'medium',
    frequency: 'annual',
    estimatedMinutes: 240,
    icon: 'construct',
  },
  {
    id: 'siding-wash',
    title: 'Power wash siding',
    description: 'Clean exterior siding to remove dirt and mildew',
    category: 'exterior',
    priority: 'low',
    frequency: 'annual',
    estimatedMinutes: 120,
    icon: 'construct',
  },
  {
    id: 'window-well',
    title: 'Clean window wells',
    description: 'Remove debris from basement window wells',
    category: 'exterior',
    priority: 'low',
    frequency: 'annual',
    estimatedMinutes: 30,
    icon: 'construct',
  },
  {
    id: 'tree-trim',
    title: 'Trim trees/shrubs',
    description: 'Trim trees and shrubs away from house and utilities',
    category: 'landscaping',
    priority: 'medium',
    frequency: 'annual',
    estimatedMinutes: 120,
    icon: 'leaf',
  },
  {
    id: 'mulch-refresh',
    title: 'Refresh mulch',
    description: 'Add fresh mulch to flower beds',
    category: 'landscaping',
    priority: 'low',
    frequency: 'annual',
    estimatedMinutes: 60,
    icon: 'leaf',
  },
];

export const TASK_TEMPLATES_BY_FREQUENCY = {
  monthly: TASK_TEMPLATES.filter(t => t.frequency === 'monthly'),
  quarterly: TASK_TEMPLATES.filter(t => t.frequency === 'quarterly'),
  'semi-annual': TASK_TEMPLATES.filter(t => t.frequency === 'semi-annual'),
  annual: TASK_TEMPLATES.filter(t => t.frequency === 'annual'),
};

// Helper to generate a task from a template
export function generateTaskFromTemplate(template: TaskTemplate, propertyId: string) {
  const now = new Date();
  let dueDate = new Date();
  
  // Calculate due date based on frequency
  switch (template.frequency) {
    case 'monthly':
      dueDate.setMonth(dueDate.getMonth() + 1);
      break;
    case 'quarterly':
      dueDate.setMonth(dueDate.getMonth() + 3);
      break;
    case 'semi-annual':
      dueDate.setMonth(dueDate.getMonth() + 6);
      break;
    case 'annual':
      dueDate.setFullYear(dueDate.getFullYear() + 1);
      break;
  }

  return {
    id: `${template.id}-${propertyId}-${Date.now()}`,
    title: template.title,
    description: template.description || '',
    category: template.category,
    priority: template.priority,
    status: 'upcoming' as const,
    dueDate: dueDate.toISOString(),
    estimatedMinutes: template.estimatedMinutes,
    propertyId,
    isRecurring: true,
    recurringFrequency: template.frequency,
    templateId: template.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Generate all default tasks for a new property
export function generateDefaultTasks(propertyId: string) {
  return TASK_TEMPLATES.map(template => generateTaskFromTemplate(template, propertyId));
}