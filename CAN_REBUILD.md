=== tailwind.config.js ===
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F59E0B",
      },
    },
  },
  plugins: [],
};

=== stores/ThemeStore.ts ===
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark' as Theme,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'homekeeper-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

=== stores/AppStore.ts ===
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

export interface Property {
  id: string;
  name: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  photoUri?: string;
  lat?: number;
  lng?: number;
}

export type TaskCategory = 
  | 'hvac' | 'plumbing' | 'electrical' | 'roofing' 
  | 'exterior' | 'interior' | 'appliances' | 'safety' | 'landscaping';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  room?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  propertyId: string;
  costEstimate?: number;
  actualCost?: number;
  attachments?: string[];
  isRecurring?: boolean;
  recurring?: {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    interval: number;
  };
  completedAt?: string;
  nextDueDate?: string;
  createdAt: string;
}

export interface Pro {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  category: string;
  notes?: string;
  rating?: number;
  address?: string;
  propertyId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
  photoUri?: string;
  propertyId: string;
}

interface AppState {
  properties: Property[];
  activePropertyId: string | null;
  tasks: Task[];
  pros: Pro[];
  inventory: InventoryItem[];

  addProperty: (property: Omit<Property, 'id'>) => void;
  setActiveProperty: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addPro: (pro: Omit<Pro, 'id'>) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  getMaintenanceScore: () => number;
  getTotalExpenses: () => number;
  getActivePropertyTasks: () => Task[];
  exportData: () => string;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      properties: [],
      activePropertyId: null,
      tasks: [],
      pros: [],
      inventory: [],

      addProperty: (prop) => {
        const newProp: Property = { ...prop, id: uuidv4() };
        set((state) => ({
          properties: [...state.properties, newProp],
          activePropertyId: state.activePropertyId || newProp.id,
        }));
      },

      setActiveProperty: (id: string) => set({ activePropertyId: id }),

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      completeTask: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;

        const now = new Date().toISOString();
        let nextDue: string | undefined;

        if (task.isRecurring && task.recurring) {
          const due = new Date(task.dueDate);
          if (task.recurring.frequency === 'monthly')
            due.setMonth(due.getMonth() + task.recurring.interval);
          else if (task.recurring.frequency === 'quarterly')
            due.setMonth(due.getMonth() + 3 * task.recurring.interval);
          else
            due.setFullYear(due.getFullYear() + task.recurring.interval);
          nextDue = due.toISOString().split('T')[0];
        }

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'completed', completedAt: now, nextDueDate: nextDue }
              : t
          ),
        }));
      },

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      addPro: (proData) => {
        const newPro: Pro = { ...proData, id: uuidv4() };
        set((state) => ({ pros: [...state.pros, newPro] }));
      },

      addInventoryItem: (itemData) => {
        const newItem: InventoryItem = { ...itemData, id: uuidv4() };
        set((state) => ({ inventory: [...state.inventory, newItem] }));
      },

      getMaintenanceScore: () => {
        const { tasks, activePropertyId } = get();
        if (!activePropertyId) return 45;
        const completed = tasks.filter(
          (t) => t.propertyId === activePropertyId && t.status === 'completed'
        ).length;
        return Math.min(100, completed * 8);
      },

      getTotalExpenses: () => {
        const { tasks } = get();
        return tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0);
      },

      getActivePropertyTasks: () => {
        const { tasks, activePropertyId } = get();
        return tasks.filter((t) => t.propertyId === activePropertyId);
      },

      exportData: () => JSON.stringify(get(), null, 2),
    }),
    {
      name: 'homekeeper-data-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

=== app/_layout.tsx ===
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useThemeStore } from '../stores/ThemeStore';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#0A0A0A' : '#FFFFFF' }}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeWrapper>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modals/add-task" options={{ presentation: 'modal' }} />
            <Stack.Screen name="modals/add-property" options={{ presentation: 'modal' }} />
          </Stack>
        </SafeAreaProvider>
      </ThemeWrapper>
    </GestureHandlerRootView>
  );
}

=== app/(tabs)/_layout.tsx ===
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/ThemeStore';

export default function TabLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' },
        tabBarActiveTintColor: '#F59E0B',
        tabBarInactiveTintColor: isDark ? '#888' : '#666',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory', tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="pros" options={{ title: 'Pros', tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} /> }} />
    </Tabs>
  );
}

=== components/TaskCard.tsx ===
import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, Task, TaskPriority } from '../stores/AppStore';

const priorityColors: Record<TaskPriority, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const { completeTask, deleteTask } = useAppStore();

  const renderRightActions = () => (
    <View className="flex-row h-[76px] items-center pr-3">
      <Pressable
        onPress={() => completeTask(task.id)}
        className="bg-emerald-600 w-20 h-full justify-center items-center rounded-l-3xl"
      >
        <Ionicons name="checkmark-circle" size={32} color="white" />
      </Pressable>
      <Pressable
        onPress={() =>
          Alert.alert('Delete Task?', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
          ])
        }
        className="bg-red-600 w-20 h-full justify-center items-center rounded-r-3xl"
      >
        <Ionicons name="trash" size={32} color="white" />
      </Pressable>
    </View>
  );

  const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending';

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
      rightThreshold={70}
    >
      <Pressable
        onPress={() => onEdit(task)}
        className="bg-zinc-900 mx-4 mb-3 rounded-3xl p-5 border-l-4 flex-row items-start"
        style={{ borderLeftColor: priorityColors[task.priority] }}
      >
        <View className="flex-1">
          <Text
            className={`text-lg font-semibold ${
              task.status === 'completed' ? 'line-through text-zinc-500' : 'text-white'
            }`}
          >
            {task.title}
          </Text>
          {task.room && <Text className="text-xs text-amber-500 mt-1">{task.room}</Text>}
          <Text className={`text-sm mt-3 ${isOverdue ? 'text-red-500' : 'text-zinc-400'}`}>
            Due {new Date(task.dueDate).toLocaleDateString()}
          </Text>
          {task.costEstimate && (
            <Text className="text-emerald-500 text-sm mt-1">Est. ${task.costEstimate}</Text>
          )}
        </View>
      </Pressable>
    </Swipeable>
  );
}

=== app/(tabs)/index.tsx ===
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useAppStore } from '../../stores/AppStore';
import { useThemeStore } from '../../stores/ThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { properties, activePropertyId, setActiveProperty, getMaintenanceScore, getTotalExpenses, getActivePropertyTasks, exportData } = useAppStore();

  const activeProperty = properties.find((p) => p.id === activePropertyId);
  const score = getMaintenanceScore();
  const expenses = getTotalExpenses();
  const overdue = getActivePropertyTasks().filter(
    (t) => t.status === 'pending' && new Date(t.dueDate) < new Date()
  ).length;

  const scoreAnim = useSharedValue(0);
  useEffect(() => {
    scoreAnim.value = withSpring(score);
  }, [score]);

  const animatedBar = useAnimatedStyle(() => ({
    width: `${scoreAnim.value}%`,
  }));

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="p-6 pt-12">
        <Text className="text-4xl font-bold text-amber-500">HomeKeeper</Text>
        <Text className="text-zinc-500">Smart home maintenance</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-8">
          {properties.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setActiveProperty(p.id)}
              className={`mr-3 px-6 py-3 rounded-2xl ${activePropertyId === p.id ? 'bg-amber-500' : 'bg-zinc-900'}`}
            >
              <Text className={activePropertyId === p.id ? 'text-black font-semibold' : 'text-white'}>
                {p.name}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push('/modals/add-property')}
            className="px-6 py-3 rounded-2xl border border-dashed border-zinc-700"
          >
            <Ionicons name="add" size={24} color="#888" />
          </Pressable>
        </ScrollView>

        {activeProperty && (
          <View className="mt-10">
            <Text className="text-2xl font-semibold text-white">{activeProperty.name}</Text>

            <View className="mt-8 bg-zinc-900 rounded-3xl p-6">
              <Text className="text-zinc-400">Home Health Score</Text>
              <View className="flex-row items-baseline mt-3">
                <Text className="text-7xl font-bold text-amber-500">{score}</Text>
                <Text className="text-3xl text-zinc-500">/100</Text>
              </View>
              <View className="h-3 bg-zinc-800 rounded-full mt-6 overflow-hidden">
                <Animated.View style={animatedBar} className="h-full bg-amber-500 rounded-full" />
              </View>
            </View>

            <View className="mt-6 bg-zinc-900 rounded-3xl p-6">
              <Text className="text-zinc-400">Estimated Value</Text>
              <Text className="text-4xl font-semibold text-white mt-1">$842,500</Text>
              <Text className="text-emerald-500 text-sm">↑ 12% since purchase</Text>
            </View>

            <View className="flex-row gap-4 mt-6">
              <View className="flex-1 bg-zinc-900 rounded-3xl p-5">
                <Text className="text-red-400">Overdue Tasks</Text>
                <Text className="text-5xl font-bold text-white mt-2">{overdue}</Text>
              </View>
              <View className="flex-1 bg-zinc-900 rounded-3xl p-5">
                <Text className="text-emerald-400">Spent This Year</Text>
                <Text className="text-5xl font-bold text-white mt-2">${expenses}</Text>
              </View>
            </View>
          </View>
        )}

        <Pressable
          onPress={() => router.push('/modals/add-task')}
          className="mt-12 bg-amber-500 py-6 rounded-3xl flex-row justify-center items-center"
        >
          <Ionicons name="add-circle" size={28} color="black" />
          <Text className="text-black font-semibold text-xl ml-3">New Maintenance Task</Text>
        </Pressable>

        <Pressable onPress={() => alert(exportData())} className="mt-8">
          <Text className="text-center text-zinc-500">Export All Data (JSON)</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

=== app/(tabs)/tasks.tsx ===
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useAppStore, Task } from '../../stores/AppStore';
import { useRouter } from 'expo-router';
import TaskCard from '../../components/TaskCard';
import { Ionicons } from '@expo/vector-icons';

export default function TasksScreen() {
  const router = useRouter();
  const { getActivePropertyTasks, properties, activePropertyId } = useAppStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasks = getActivePropertyTasks();
  const activeProperty = properties.find((p) => p.id === activePropertyId);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const openAddTask = () => router.push('/modals/add-task');

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    router.push('/modals/add-task');
  };

  return (
    <View className="flex-1 bg-black">
      <View className="px-6 pt-12 pb-6 border-b border-zinc-800">
        <Text className="text-3xl font-bold text-white">Tasks</Text>
        {activeProperty && <Text className="text-zinc-400 mt-1">{activeProperty.name}</Text>}
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-semibold text-white">Pending ({pendingTasks.length})</Text>
          <Pressable onPress={openAddTask} className="bg-amber-500 px-6 py-2 rounded-full flex-row items-center">
            <Ionicons name="add" size={20} color="black" />
            <Text className="font-semibold ml-2 text-black">Add Task</Text>
          </Pressable>
        </View>

        {pendingTasks.length > 0 ? (
          <FlatList
            data={pendingTasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskCard task={item} onEdit={openEditTask} />}
            scrollEnabled={false}
          />
        ) : (
          <View className="items-center py-20">
            <Ionicons name="checkmark-circle-outline" size={80} color="#444" />
            <Text className="text-zinc-500 text-xl mt-6">All caught up!</Text>
          </View>
        )}

        {completedTasks.length > 0 && (
          <View className="mt-12">
            <Text className="text-xl font-semibold text-white mb-4">Recently Completed</Text>
            <FlatList
              data={completedTasks.slice(0, 6)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <TaskCard task={item} onEdit={openEditTask} />}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

=== app/modals/add-task.tsx ===
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, Task, TaskCategory, TaskPriority } from '../../stores/AppStore';

const categories: { value: TaskCategory; label: string; icon: string }[] = [
  { value: 'hvac', label: 'HVAC', icon: 'thermometer' },
  { value: 'plumbing', label: 'Plumbing', icon: 'water' },
  { value: 'electrical', label: 'Electrical', icon: 'flash' },
  { value: 'roofing', label: 'Roofing', icon: 'home' },
  { value: 'exterior', label: 'Exterior', icon: 'leaf' },
  { value: 'interior', label: 'Interior', icon: 'hammer' },
  { value: 'appliances', label: 'Appliances', icon: 'cafe' },
  { value: 'safety', label: 'Safety', icon: 'shield-checkmark' },
  { value: 'landscaping', label: 'Landscaping', icon: 'flower' },
];

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
  { value: 'high', label: 'High', color: '#F59E0B' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'low', label: 'Low', color: '#6B7280' },
];

const rooms = ['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Garage', 'Roof', 'Basement', 'Other'];

export default function AddTaskModal() {
  const router = useRouter();
  const { addTask, tasks, activePropertyId } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('hvac');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [costEstimate, setCostEstimate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [interval, setInterval] = useState(1);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!activePropertyId) {
      Alert.alert('Error', 'No active property selected');
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      room: room || undefined,
      priority,
      dueDate: dueDate.toISOString().split('T')[0],
      propertyId: activePropertyId,
      costEstimate: costEstimate ? parseFloat(costEstimate) : undefined,
      isRecurring,
      recurring: isRecurring ? { frequency, interval } : undefined,
    };

    addTask(taskData);
    router.back();
  };

  return (
    <View className="flex-1 bg-black">
      <View className="px-6 pt-14 pb-4 border-b border-zinc-800 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="close" size={28} color="#888" />
        </Pressable>
        <Text className="text-2xl font-semibold text-white">New Task</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <Text className="text-zinc-400 text-sm mb-2">TITLE</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Replace HVAC filter"
          className="bg-zinc-900 text-white px-5 py-4 rounded-2xl text-lg mb-6"
          placeholderTextColor="#666"
        />

        <Text className="text-zinc-400 text-sm mb-2">DESCRIPTION</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Any additional notes..."
          multiline
          className="bg-zinc-900 text-white px-5 py-4 rounded-2xl text-base mb-6 min-h-[80px]"
          placeholderTextColor="#666"
        />

        <Text className="text-zinc-400 text-sm mb-3">CATEGORY</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              className={`px-4 py-2.5 rounded-xl flex-row items-center gap-2 ${category === cat.value ? 'bg-amber-500' : 'bg-zinc-800'}`}
            >
              <Ionicons name={cat.icon as any} size={18} color={category === cat.value ? '#000' : '#aaa'} />
              <Text className={category === cat.value ? 'text-black font-medium' : 'text-white'}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-zinc-400 text-sm mb-3">ROOM / AREA</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {rooms.map((r) => (
            <Pressable
              key={r}
              onPress={() => setRoom(r)}
              className={`px-4 py-2 rounded-xl ${room === r ? 'bg-amber-500' : 'bg-zinc-800'}`}
            >
              <Text className={room === r ? 'text-black' : 'text-white'}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-zinc-400 text-sm mb-3">PRIORITY</Text>
        <View className="flex-row gap-3 mb-8">
          {priorities.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => setPriority(p.value)}
              className={`flex-1 py-3 rounded-2xl items-center ${priority === p.value ? 'border-2 border-white' : ''}`}
              style={{ backgroundColor: `${p.color}20` }}
            >
              <Text style={{ color: p.color }} className="font-semibold">{p.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-zinc-400 text-sm mb-2">DUE DATE</Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          className="bg-zinc-900 px-5 py-4 rounded-2xl flex-row justify-between items-center mb-6"
        >
          <Text className="text-white text-lg">
            {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
          </Text>
          <Ionicons name="calendar-outline" size={24} color="#F59E0B" />
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, selected) => {
              setShowPicker(false);
              if (selected) setDueDate(selected);
            }}
          />
        )}

        <Text className="text-zinc-400 text-sm mb-2">ESTIMATED COST ($)</Text>
        <TextInput
          value={costEstimate}
          onChangeText={setCostEstimate}
          keyboardType="numeric"
          placeholder="0"
          className="bg-zinc-900 text-white px-5 py-4 rounded-2xl text-lg mb-8"
          placeholderTextColor="#666"
        />

        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-lg">Recurring Task</Text>
          <Pressable
            onPress={() => setIsRecurring(!isRecurring)}
            className={`w-12 h-7 rounded-full p-0.5 ${isRecurring ? 'bg-amber-500' : 'bg-zinc-700'}`}
          >
            <View className={`bg-white w-6 h-6 rounded-full transition-all ${isRecurring ? 'translate-x-5' : ''}`} />
          </Pressable>
        </View>

        {isRecurring && (
          <View className="bg-zinc-900 p-5 rounded-2xl mb-10">
            <Text className="text-zinc-400 mb-3">REPEAT EVERY</Text>
            <View className="flex-row gap-2">
              {(['monthly', 'quarterly', 'yearly'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFrequency(f)}
                  className={`flex-1 py-3 rounded-xl items-center ${frequency === f ? 'bg-amber-500' : 'bg-zinc-800'}`}
                >
                  <Text className={frequency === f ? 'text-black font-medium' : 'text-white'}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable onPress={handleSave} className="bg-amber-500 py-6 rounded-3xl">
          <Text className="text-black text-center font-semibold text-xl">Create Task</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

=== app/(tabs)/inventory.tsx ===
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryScreen() {
  return (
    <ScrollView className="flex-1 bg-black p-6 pt-12">
      <Text className="text-3xl font-bold text-white">Inventory</Text>
      <Text className="text-zinc-500 mt-2">Track appliances, warranties, and photos</Text>
      <View className="items-center py-20">
        <Ionicons name="cube-outline" size={80} color="#444" />
        <Text className="text-zinc-500 text-xl mt-6">Coming soon</Text>
      </View>
    </ScrollView>
  );
}

=== app/(tabs)/pros.tsx ===
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProsScreen() {
  return (
    <ScrollView className="flex-1 bg-black p-6 pt-12">
      <Text className="text-3xl font-bold text-white">Local Pros</Text>
      <Text className="text-zinc-500 mt-2">Find contractors near you</Text>
      <View className="items-center py-20">
        <Ionicons name="people-outline" size={80} color="#444" />
        <Text className="text-zinc-500 text-xl mt-6">Search integration ready</Text>
      </View>
    </ScrollView>
  );
}

=== app/(tabs)/settings.tsx ===
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useThemeStore } from '../../stores/ThemeStore';
import { useAppStore } from '../../stores/AppStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { toggleTheme } = useThemeStore();
  const { exportData } = useAppStore();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-black p-6 pt-12">
      <Text className="text-3xl font-bold text-white">Settings</Text>

      <Pressable onPress={toggleTheme} className="mt-10 bg-zinc-900 p-5 rounded-3xl flex-row justify-between items-center">
        <Text className="text-white text-lg">Toggle Theme</Text>
        <Ionicons name="moon-outline" size={24} color="#F59E0B" />
      </Pressable>

      <Pressable
        onPress={() => router.push('/modals/add-property')}
        className="mt-4 bg-zinc-900 p-5 rounded-3xl"
      >
        <Text className="text-white text-lg">Add New Property</Text>
      </Pressable>

      <Pressable onPress={() => alert(exportData())} className="mt-4 bg-zinc-900 p-5 rounded-3xl">
        <Text className="text-white text-lg">Export All Data</Text>
      </Pressable>

      <Text className="text-zinc-500 text-center mt-20">HomeKeeper v1.0</Text>
    </ScrollView>
  );
}

=== app/modals/add-property.tsx ===
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../stores/AppStore';
import { Ionicons } from '@expo/vector-icons';

export default function AddPropertyModal() {
  const router = useRouter();
  const { addProperty } = useAppStore();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');

  const save = () => {
    if (!name.trim() || !address.trim()) return;
    addProperty({
      name: name.trim(),
      address: address.trim(),
      bedrooms: parseInt(bedrooms) || 3,
      bathrooms: parseInt(bathrooms) || 2,
    });
    router.back();
  };

  return (
    <View className="flex-1 bg-black p-6 pt-14">
      <Pressable onPress={() => router.back()} className="absolute top-14 right-6">
        <Ionicons name="close" size={32} color="#888" />
      </Pressable>

      <Text className="text-3xl font-bold text-white">Add Property</Text>

      <TextInput
        placeholder="Property Name (e.g. Main House)"
        value={name}
        onChangeText={setName}
        className="bg-zinc-900 text-white px-5 py-4 rounded-2xl mt-8"
      />

      <TextInput
        placeholder="Full Address"
        value={address}
        onChangeText={setAddress}
        className="bg-zinc-900 text-white px-5 py-4 rounded-2xl mt-4"
      />

      <View className="flex-row gap-4 mt-4">
        <TextInput
          placeholder="Bedrooms"
          value={bedrooms}
          onChangeText={setBedrooms}
          keyboardType="numeric"
          className="flex-1 bg-zinc-900 text-white px-5 py-4 rounded-2xl"
        />
        <TextInput
          placeholder="Bathrooms"
          value={bathrooms}
          onChangeText={setBathrooms}
          keyboardType="numeric"
          className="flex-1 bg-zinc-900 text-white px-5 py-4 rounded-2xl"
        />
      </View>

      <Pressable onPress={save} className="bg-amber-500 py-6 rounded-3xl mt-12">
        <Text className="text-black text-center font-semibold text-xl">Save Property</Text>
      </Pressable>
    </View>
  );
}