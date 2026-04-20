import React, { useState, useRef, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { AddTaskModal } from '../../components/AddTaskModal';
import { TaskTemplatesModal } from '../../components/TaskTemplatesModal';
import {
  Task,
  TaskCategory,
  TaskStatus,
  TaskPriority,
  TaskCategoryLabels,
  getStatusColor,
  getPriorityColor,
  formatDate,
} from '../../lib/tasks';
import { TaskTemplate } from '../../lib/taskTemplates';

type FilterType = 'all' | 'overdue' | 'upcoming' | 'completed';

export default function TasksScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ category?: TaskCategory }>();
  const { activePropertyTasks: tasks, overdueTasks, upcomingTasks, addTask, updateTask, completeTask, deleteTask, properties, activePropertyId } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset to defaults when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setFilter('all');
      setSelectedCategory(null);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Expandable FAB state
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;

  const toggleFab = useCallback(() => {
    const toValue = fabExpanded ? 0 : 1;
    setFabExpanded(!fabExpanded);
    Animated.parallel([
      Animated.spring(fabAnim, {
        toValue,
        useNativeDriver: true,
        friction: 7,
        tension: 50,
      }),
      Animated.timing(fabRotation, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fabExpanded, fabAnim, fabRotation]);

  const closeFab = useCallback(() => {
    if (fabExpanded) {
      setFabExpanded(false);
      Animated.parallel([
        Animated.spring(fabAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 7,
          tension: 50,
        }),
        Animated.timing(fabRotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fabExpanded, fabAnim, fabRotation]);

  const spin = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedCategory && task.category !== selectedCategory) return false;
    if (filter === 'all') return true;
    if (filter === 'overdue') return overdueTasks.includes(task);
    if (filter === 'upcoming') return upcomingTasks.includes(task);
    return task.status === filter;
  }).sort((a, b) => {
    const [ay, am, ad] = a.dueDate.split('-').map(Number);
    const [by, bm, bd] = b.dueDate.split('-').map(Number);
    const dateA = new Date(ay, am - 1, ad);
    const dateB = new Date(by, bm - 1, bd);
    return dateA.getTime() - dateB.getTime();
  });

  // Group tasks - use dynamic computation for overdue/upcoming
  const laterTasks = tasks.filter(t => {
    // Later = not completed, not in_progress, not overdue, not upcoming (beyond 7 days)
    if (t.status === 'completed' || t.status === 'in_progress') return false;
    if (overdueTasks.includes(t)) return false;
    if (upcomingTasks.includes(t)) return false;
    return true;
  });

  const groupedTasks = {
    overdue: overdueTasks,
    upcoming: upcomingTasks,
    later: laterTasks,
    inProgress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const handleSaveTask = (taskData: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    recurring?: { frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; interval: number };
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        recurring: taskData.recurring,
      });
      setEditingTask(null);
    } else {
      addTask({
        title: taskData.title,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        status: 'scheduled',
        recurring: taskData.recurring,
      });
    }
  };

  // Get existing template IDs to show which are already added
  const existingTemplateIds = tasks
    .filter(t => t.templateId)
    .map(t => t.templateId!);

  // Handle adding a template
  const handleAddTemplate = (template: TaskTemplate) => {
    const { generateTaskFromTemplate } = require('../../lib/taskTemplates');
    const taskData = generateTaskFromTemplate(template, activePropertyId || '');
    addTask(taskData);
  };

  const TaskCategoryIcons = {
    hvac: 'thermometer' as const,
    plumbing: 'water' as const,
    electrical: 'flash' as const,
    roofing: 'home' as const,
    exterior: 'construct' as const,
    interior: 'bed' as const,
    appliances: 'cube' as const,
    safety: 'shield-checkmark' as const,
    landscaping: 'leaf' as const,
    cleaning: 'sparkles' as const,
    pest_control: 'bug' as const,
    other: 'ellipsis-horizontal' as const,
  };

  const FilterButton = ({ type, label, count }: { type: FilterType; label: string; count: number }) => (
    <Pressable
      style={[
        styles.filterButton,
        { backgroundColor: colors.surface },
        filter === type && { backgroundColor: colors.primary },
      ]}
      onPress={() => setFilter(type)}
    >
      <Text
        style={[
          styles.filterText,
          { color: colors.textSecondary },
          filter === type && { color: colors.white },
        ]}
      >
        {label}
      </Text>
      {count > 0 && (
        <View
          style={[
            styles.filterBadge,
            {
              backgroundColor:
                type === 'overdue' ? colors.error : filter === type ? colors.white + '40' : colors.primary + '20',
            },
          ]}
        >
          <Text
            style={[
              styles.filterBadgeText,
              { color: filter === type ? colors.white : type === 'overdue' ? colors.white : colors.primary },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );

  // Swipeable Task Item using Swipeable from react-native-gesture-handler
  const TaskItem = ({ task }: { task: Task }) => {
    const statusColor = getStatusColor(task.status, colors);
    const priorityColor = getPriorityColor(task.priority, colors);
    const swipeableRef = useRef<Swipeable>(null);
    
    const handleComplete = () => {
      swipeableRef.current?.close();
      completeTask(task.id);
    };

    const handleDelete = () => {
      swipeableRef.current?.close();
      deleteTask(task.id);
    };
    
    const renderRightActions = (_progress: any, dragX: any) => {
      const translateX = dragX.interpolate({
        inputRange: [-120, 0],
        outputRange: [0, 120],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View 
          style={[
            styles.swipeActions,
            { transform: [{ translateX }] }
          ]}
        >
          <Pressable onPress={handleComplete} style={[styles.swipeAction, styles.swipeActionComplete, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark" size={24} color="white" />
          </Pressable>
          <Pressable onPress={handleDelete} style={[styles.swipeAction, styles.swipeActionDelete, { backgroundColor: colors.error }]}>
            <Ionicons name="trash" size={22} color="white" />
          </Pressable>
        </Animated.View>
      );
    };
    
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
      >
        <Pressable
          onPress={() => {
            setEditingTask(task);
            setModalVisible(true);
          }}
          style={[
            styles.taskItem, 
            { backgroundColor: colors.surface }
          ]}
        >
          <View style={styles.taskRow}>
            <Ionicons
              name={TaskCategoryIcons[task.category]}
              size={18}
              color={priorityColor}
            />
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {task.title}
            </Text>
            {task.priority === 'urgent' && (
              <View style={[styles.priorityBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.priorityText, { color: colors.error }]}>!</Text>
              </View>
            )}
            <Text style={[styles.taskDue, { color: statusColor }]}>
              {formatDate(task.dueDate)}
            </Text>
            {task.isRecurring && (
              <Ionicons name="repeat" size={14} color={colors.textTertiary} style={styles.recurringIcon} />
            )}
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const TaskSection = ({ title, tasks, showCount = true }: { title: string; tasks: Task[]; showCount?: boolean }) => {
    if (tasks.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {title}
          {showCount && (
            <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
              {' '}({tasks.length})
            </Text>
          )}
        </Text>
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tasks</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {selectedCategory
            ? `${TaskCategoryLabels[selectedCategory]} (${filteredTasks.length})`
            : `${tasks.length} total`}
        </Text>
        {selectedCategory && (
          <Pressable 
            style={[styles.clearFilter, { backgroundColor: colors.surface }]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterButton type="all" label="All" count={tasks.length} />
        <FilterButton type="overdue" label="Overdue" count={groupedTasks.overdue.length} />
        <FilterButton type="upcoming" label="Upcoming" count={groupedTasks.upcoming.length} />
        <FilterButton type="completed" label="Done" count={groupedTasks.completed.length} />
      </ScrollView>

      {/* Task List */}
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content}>
        {filter === 'all' ? (
          <>
            <TaskSection title="Overdue" tasks={groupedTasks.overdue} />
            <TaskSection title="Upcoming" tasks={groupedTasks.upcoming} />
            {groupedTasks.later.length > 0 && (
              <TaskSection title="Later" tasks={groupedTasks.later} />
            )}
            {groupedTasks.inProgress.length > 0 && (
              <TaskSection title="In Progress" tasks={groupedTasks.inProgress} />
            )}
            {groupedTasks.completed.length > 0 && (
              <TaskSection title="Completed" tasks={groupedTasks.completed} />
            )}
          </>
        ) : (
          <View style={styles.filteredSection}>
            {filteredTasks.map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              No tasks in this category
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Expandable FAB - Templates Option */}
      <Animated.View
        style={[
          styles.fabOption,
          {
            transform: [
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -56],
                }),
              },
              {
                scale: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: fabAnim,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable
          style={[styles.fabOptionButton, { backgroundColor: colors.primary + 'D9' }]}
          onPress={() => {
            closeFab();
            setTemplatesModalVisible(true);
          }}
        >
          <Ionicons name="list" size={20} color="white" />
          <Text style={styles.fabOptionText}>Templates</Text>
        </Pressable>
      </Animated.View>

      {/* Expandable FAB - Manual Task Option */}
      <Animated.View
        style={[
          styles.fabOption,
          {
            transform: [
              {
                translateY: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -112],
                }),
              },
              {
                scale: fabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: fabAnim,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable
          style={[styles.fabOptionButton, { backgroundColor: colors.primary + 'D9' }]}
          onPress={() => {
            closeFab();
            setModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.fabOptionText}>Manual Task</Text>
        </Pressable>
      </Animated.View>

      {/* Main FAB */}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={toggleFab}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="add" size={28} color="white" />
        </Animated.View>
      </Pressable>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        visible={modalVisible}
        properties={properties}
        activePropertyId={activePropertyId}
        editingTask={editingTask}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* Task Templates Modal */}
      <TaskTemplatesModal
        visible={templatesModalVisible}
        onClose={() => setTemplatesModalVisible(false)}
        onAddTemplate={handleAddTemplate}
        existingTemplateIds={existingTemplateIds}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionCount: {
    fontWeight: '400',
  },
  filteredSection: {
    gap: 12,
  },
  swipeActions: {
    flexDirection: 'row',
    marginRight: 8,
    alignItems: 'flex-start',
  },
  swipeAction: {
    width: 60,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionComplete: {
    borderRadius: 12,
  },
  swipeActionDelete: {
    borderRadius: 12,
    marginLeft: 4,
  },
  taskItem: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  taskRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  taskDue: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  recurringIcon: {
    marginLeft: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  swipeComplete: {
  },
  swipeDelete: {
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabOption: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fabOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  fabOptionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  clearFilter: {
    padding: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
});