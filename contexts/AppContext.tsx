// ============================================
// HOMEKEEPER - App State Context
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskCategory, TaskStatus, TaskPriority, RecurringSchedule } from '../lib/tasks';

// Types
export interface Pro {
  id: string;
  propertyId?: string; // Which property this pro belongs to
  name: string;
  category: string;
  phone?: string;
  email?: string;
  company?: string;
  rating?: number;
  notes?: string;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  propertyId?: string; // Which property this item belongs to
  name: string;
  category: InventoryCategory;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
  photos?: string[];
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryCategory = 
  | 'appliances'
  | 'furniture'
  | 'electronics'
  | 'tools'
  | 'documents'
  | 'outdoor'
  | 'other';

export interface HomeInfo {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  // Zestimate data
  zestimate?: number;
  rentZestimate?: number;
  zestimateDate?: string;
  zillowUrl?: string;
}

interface AppState {
  tasks: Task[];
  pros: Pro[];
  inventory: InventoryItem[];
  properties: HomeInfo[];
  activePropertyId: string | null;
  homeInfo: HomeInfo; // Computed from activePropertyId
  settings: {
    notifications: boolean;
    reminders: boolean;
    theme: 'dark' | 'light';
  };
}

interface AppContextType extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  
  // Pro actions
  addPro: (pro: Omit<Pro, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePro: (id: string, updates: Partial<Pro>) => void;
  deletePro: (id: string) => void;
  
  // Inventory actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  // Property actions
  addProperty: (property: Omit<HomeInfo, 'id'>) => void;
  updateProperty: (id: string, updates: Partial<HomeInfo>) => void;
  deleteProperty: (id: string) => void;
  setActiveProperty: (id: string) => void;
  reorderProperties: (fromIndex: number, toIndex: number) => void;
  
  // Home info (legacy compatibility)
  updateHomeInfo: (info: Partial<HomeInfo>) => void;
  
  // Settings
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // Data
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Computed
  healthScore: number;
  overdueTasks: Task[];
  upcomingTasks: Task[];
  // Property-filtered data
  activePropertyTasks: Task[];
  activePropertyPros: Pro[];
  activePropertyInventory: InventoryItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = '@homekeeper_data';

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    pros: [],
    inventory: [],
    properties: [],
    activePropertyId: null,
    homeInfo: {}, // Computed, but kept in state for serialization
    settings: {
      notifications: true,
      reminders: true,
      theme: 'dark',
    },
  });

  // Get active property
  const activeProperty = state.activePropertyId 
    ? state.properties.find(p => p.id === state.activePropertyId)
    : state.properties[0]; // Default to first property
  
  // Home info is derived from active property
  const homeInfo = activeProperty || {};

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data on state change
  useEffect(() => {
    if (state.tasks.length > 0 || state.pros.length > 0 || state.inventory.length > 0) {
      saveData();
    }
  }, [state]);

  // Computed values - filtered by active property
  const activePropertyTasks = state.tasks.filter(t => 
    t.propertyId === state.activePropertyId
  );
  const activePropertyPros = state.pros.filter(p => 
    p.propertyId === state.activePropertyId
  );
  const activePropertyInventory = state.inventory.filter(i => 
    i.propertyId === state.activePropertyId
  );

  const overdueTasks = activePropertyTasks.filter(t => t.status === 'overdue');
  const upcomingTasks = activePropertyTasks.filter(t => {
    if (t.status === 'upcoming') return true;
    if (t.status === 'scheduled') {
      const due = new Date(t.dueDate);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return due <= weekFromNow;
    }
    return false;
  });

  const healthScore = (() => {
    let score = 100;
    const now = new Date();
    overdueTasks.forEach(task => {
      const daysOverdue = Math.ceil((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      score -= Math.min(daysOverdue * 2, 10);
    });
    return Math.max(0, score);
  })();

  // Task actions
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = {
      ...taskData,
      propertyId: taskData.propertyId || state.activePropertyId || undefined,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
    }));
  };

  const completeTask = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    const updates: Partial<Task> = {
      status: 'completed',
      completedDate: new Date().toISOString(),
    };

    // If recurring, create next task
    if (task.recurring) {
      const nextDue = new Date(task.dueDate);
      switch (task.recurring.frequency) {
        case 'daily':
          nextDue.setDate(nextDue.getDate() + task.recurring.interval);
          break;
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + 7 * task.recurring.interval);
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + task.recurring.interval);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + 3 * task.recurring.interval);
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + task.recurring.interval);
          break;
      }

      // Create new recurring task
      const newTask: Task = {
        ...task,
        id: generateId(),
        status: 'scheduled',
        dueDate: nextDue.toISOString(),
        completedDate: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks.map(t => 
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ), newTask],
      }));
    } else {
      updateTask(id, updates);
    }
  };

  // Pro actions
  const addPro = (proData: Omit<Pro, 'id' | 'createdAt' | 'updatedAt'>) => {
    const pro: Pro = {
      ...proData,
      propertyId: state.activePropertyId || undefined,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, pros: [...prev.pros, pro] }));
  };

  const updatePro = (id: string, updates: Partial<Pro>) => {
    setState(prev => ({
      ...prev,
      pros: prev.pros.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
  };

  const deletePro = (id: string) => {
    setState(prev => ({
      ...prev,
      pros: prev.pros.filter(p => p.id !== id),
    }));
  };

  // Inventory actions
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: InventoryItem = {
      ...itemData,
      propertyId: state.activePropertyId || undefined,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, inventory: [...prev.inventory, item] }));
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => 
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      ),
    }));
  };

  const deleteInventoryItem = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id),
    }));
  };

  // Property actions
  const addProperty = (propertyData: Omit<HomeInfo, 'id'>) => {
    const id = generateId();
    const property: HomeInfo = { ...propertyData, id };
    
    // Generate sample tasks for the new property
    const { generateSampleTasks } = require('../lib/tasks');
    const newTasks = generateSampleTasks(id);
    
    setState(prev => ({
      ...prev,
      properties: [...prev.properties, property],
      activePropertyId: prev.activePropertyId || id,
      tasks: [...prev.tasks, ...newTasks],
    }));
    return id;
  };

  const updateProperty = (id: string, updates: Partial<HomeInfo>) => {
    setState(prev => ({
      ...prev,
      properties: prev.properties.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const deleteProperty = (id: string) => {
    setState(prev => {
      const newProperties = prev.properties.filter(p => p.id !== id);
      return {
        ...prev,
        properties: newProperties,
        activePropertyId: prev.activePropertyId === id 
          ? (newProperties[0]?.id || null)
          : prev.activePropertyId,
      };
    });
  };

  const reorderProperties = (fromIndex: number, toIndex: number) => {
    setState(prev => {
      const newProperties = [...prev.properties];
      const [removed] = newProperties.splice(fromIndex, 1);
      newProperties.splice(toIndex, 0, removed);
      return { ...prev, properties: newProperties };
    });
  };

  const setActiveProperty = (id: string) => {
    setState(prev => ({ ...prev, activePropertyId: id }));
  };

  // Home info (legacy compatibility - updates active property)
  const updateHomeInfo = (info: Partial<HomeInfo>) => {
    if (state.activePropertyId) {
      updateProperty(state.activePropertyId, info);
    } else if (state.properties.length === 0) {
      // Create first property if none exist
      const id = addProperty(info);
      setActiveProperty(id);
    }
  };

  // Settings
  const updateSettings = (settings: Partial<AppState['settings']>) => {
    setState(prev => ({ 
      ...prev, 
      settings: { ...prev.settings, ...settings } 
    }));
  };

  // Data persistence
  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        
        // Migration: Convert old single-property format to new multi-property format
        if (parsed.homeInfo && !parsed.properties) {
          // Old format: had homeInfo directly
          // Create a property from the old homeInfo
          const propertyId = generateId();
          const migratedProperties = [{ ...parsed.homeInfo, id: propertyId }];
          
          // Migration: Assign orphan tasks to the migrated property
          const migratedTasks = (parsed.tasks || []).map((t: Task) => ({
            ...t,
            propertyId: t.propertyId || propertyId,
          }));
          const migratedPros = (parsed.pros || []).map((p: Pro) => ({
            ...p,
            propertyId: p.propertyId || propertyId,
          }));
          const migratedInventory = (parsed.inventory || []).map((i: InventoryItem) => ({
            ...i,
            propertyId: i.propertyId || propertyId,
          }));
          
          setState(prev => ({
            ...prev,
            ...parsed,
            properties: migratedProperties,
            activePropertyId: propertyId,
            tasks: migratedTasks,
            pros: migratedPros,
            inventory: migratedInventory,
            settings: { ...prev.settings, ...parsed.settings },
          }));
        } else {
          // New format or no homeInfo
          setState(prev => ({
            ...prev,
            ...parsed,
            settings: { ...prev.settings, ...parsed.settings },
          }));
        }
      } else {
        // First run: Create a sample property and generate tasks for it
        const propertyId = generateId();
        const sampleProperty: HomeInfo = {
          id: propertyId,
          name: 'My Home',
          address: '123 Main St',
          city: 'Waldwick',
          state: 'NJ',
          zip: '07463',
        };
        const { generateSampleTasks } = require('../lib/tasks');
        const sampleTasks = generateSampleTasks(propertyId);
        
        setState(prev => ({
          ...prev,
          properties: [sampleProperty],
          activePropertyId: propertyId,
          tasks: sampleTasks,
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      // Exclude homeInfo from persistence (it's computed from activePropertyId)
      const { homeInfo: _, ...persistedState } = state as any;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      // Reload with fresh sample data
      const propertyId = generateId();
      const sampleProperty: HomeInfo = {
        id: propertyId,
        name: 'My Home',
        address: '123 Main St',
        city: 'Waldwick',
        state: 'NJ',
        zip: '07463',
      };
      const { generateSampleTasks } = require('../lib/tasks');
      const sampleTasks = generateSampleTasks(propertyId);
      
      setState(prev => ({
        ...prev,
        properties: [sampleProperty],
        activePropertyId: propertyId,
        tasks: sampleTasks,
        pros: [],
        inventory: [],
      }));
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const value: AppContextType = {
    ...state,
    homeInfo,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addPro,
    updatePro,
    deletePro,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    // Property actions
    properties: state.properties,
    activePropertyId: state.activePropertyId,
    addProperty,
    updateProperty,
    deleteProperty,
    setActiveProperty,
    reorderProperties,
    // Legacy
    updateHomeInfo,
    updateSettings,
    loadData,
    saveData,
    clearAllData,
    healthScore,
    overdueTasks,
    upcomingTasks,
    // Property-filtered data
    activePropertyTasks,
    activePropertyPros,
    activePropertyInventory,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useTasks() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useApp();
  return { tasks, addTask, updateTask, deleteTask, completeTask };
}

export function usePros() {
  const { activePropertyPros: pros, addPro, updatePro, deletePro } = useApp();
  return { pros, addPro, updatePro, deletePro };
}

export function useInventory() {
  const { activePropertyInventory: inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useApp();
  return { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem };
}

export function useHomeInfo() {
  const { homeInfo, updateHomeInfo } = useApp();
  return { homeInfo, updateHomeInfo };
}

export function useHealthScore() {
  const { healthScore, overdueTasks, upcomingTasks } = useApp();
  return { healthScore, overdueTasks, upcomingTasks };
}