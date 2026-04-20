import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Image, Animated, Modal } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskCategory, TaskCategoryLabels, formatDate, getStatusColor, getPriorityColor, TaskPriority } from '../../lib/tasks';
import { HomeHealthCard } from '../../components/HomeHealthCard';
import { ZestimateCard } from '../../components/ZestimateCard';
import { SeasonalTipsCard } from '../../components/SeasonalTipsCard';
import { SeasonalTipsModal } from '../../components/SeasonalTipsModal';
import { AddTaskModal } from '../../components/AddTaskModal';
import { AddPropertyModal } from '../../components/AddPropertyModal';
import { AddInventoryModal } from '../../components/AddInventoryModal';
import { fetchZestimate, getDaysSinceUpdate } from '../../lib/zestimate';

const APP_VERSION = '1.0.0';

// Splash screen shown when app first loads
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(onFinish, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Image 
          source={require('../../assets/logo.jpg')} 
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={[styles.splashAppName, { color: colors.textPrimary }]}>HomeKeeper</Text>
        <Text style={[styles.splashVersion, { color: colors.textTertiary }]}>Version {APP_VERSION}</Text>
      </Animated.View>
    </View>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tasks, healthScore, overdueTasks, upcomingTasks, addTask, updateTask, completeTask, deleteTask, homeInfo, updateHomeInfo, properties, activePropertyId, addProperty, setActiveProperty, addInventoryItem } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [addPropertyModalVisible, setAddPropertyModalVisible] = useState(false);
  const [addInventoryModalVisible, setAddInventoryModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [zestimateLoading, setZestimateLoading] = useState(false);
  const [zestimateError, setZestimateError] = useState<string | null>(null);
  const [seasonalModalVisible, setSeasonalModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset scroll position when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Fetch Zestimate when address changes (monthly refresh)
  useEffect(() => {
    const fetchHomeValue = async () => {
      if (!homeInfo.address || !homeInfo.city) return;
      const daysSince = getDaysSinceUpdate(homeInfo.zestimateDate);
      // Refresh monthly (30 days)
      if (homeInfo.zestimate && daysSince !== null && daysSince < 30) return; // Fresh enough
      
      setZestimateLoading(true);
      setZestimateError(null);
      
      try {
        const result = await fetchZestimate({
          address: homeInfo.address,
          city: homeInfo.city,
          state: homeInfo.state || 'NJ',
          zip: homeInfo.zip || '',
        } as any);
        
        if (result?.zestimate) {
          updateHomeInfo({
            zestimate: result.zestimate,
            rentZestimate: result.rentZestimate || undefined,
            zestimateDate: new Date().toISOString(),
            zillowUrl: result.zillowUrl,
          });
        } else if (result?.error) {
          setZestimateError(result.error);
        }
      } catch (err) {
        console.error('Failed to fetch Zestimate:', err);
        setZestimateError('Unable to fetch home value');
      } finally {
        setZestimateLoading(false);
      }
    };
    
    fetchHomeValue();
  }, [homeInfo.address, homeInfo.city]);

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  const getCategoryIcon = (category: TaskCategory): any => {
    const icons: Record<TaskCategory, string> = {
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
    return icons[category];
  };

  const TaskRow = ({ task }: { task: Task }) => {
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
            setAddTaskModalVisible(true);
          }}
          style={[
            styles.taskItem, 
            { backgroundColor: colors.surface }
          ]}
        >
          <View style={styles.taskRow}>
            <Ionicons
              name={getCategoryIcon(task.category)}
              size={16}
              color={priorityColor}
            />
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {task.title}
            </Text>
            <Text style={[styles.taskDue, { color: statusColor }]}>
              {formatDate(task.dueDate)}
            </Text>
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  // Refresh Zestimate manually
  const refreshZestimate = async () => {
    if (!homeInfo.address || !homeInfo.city) return;
    
    setZestimateLoading(true);
    setZestimateError(null);
    
    try {
      const result = await fetchZestimate({
        address: homeInfo.address,
        city: homeInfo.city,
        state: homeInfo.state || 'NJ',
        zip: homeInfo.zip || '',
      } as any);
      
      if (result?.zestimate) {
        updateHomeInfo({
          zestimate: result.zestimate,
          rentZestimate: result.rentZestimate || undefined,
          zestimateDate: new Date().toISOString(),
          zillowUrl: result.zillowUrl,
        });
      } else if (result?.error) {
        setZestimateError(result.error);
      }
    } catch (err) {
      console.error('Failed to fetch Zestimate:', err);
      setZestimateError('Unable to fetch home value');
    } finally {
      setZestimateLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Property Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.propertyScroll}
          contentContainerStyle={styles.propertyScrollContent}
        >
          {/* Property Cards */}
          {properties.map((property) => (
            <Pressable
              key={property.id}
              style={[
                styles.propertyCard,
                property.id === activePropertyId && styles.propertyCardActive,
                { 
                  backgroundColor: colors.surface,
                  borderColor: property.id === activePropertyId ? colors.primary : colors.border 
                }
              ]}
              onPress={() => property.id && setActiveProperty(property.id)}
            >
              <Ionicons 
                name="home" 
                size={18} 
                color={property.id === activePropertyId ? colors.primary : colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.propertyName, 
                  { color: property.id === activePropertyId ? colors.textPrimary : colors.textSecondary }
                ]} 
                numberOfLines={1}
              >
                {property.name || property.address || 'Property'}
              </Text>
            </Pressable>
          ))}

          {/* Add Property Card */}
          <Pressable 
            style={[styles.addPropertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setAddPropertyModalVisible(true)}
          >
            <Ionicons name="add" size={20} color={colors.textTertiary} />
          </Pressable>
        </ScrollView>

        {/* Home Health Card */}
        <HomeHealthCard 
          score={healthScore} 
          overdueCount={overdueTasks.length}
          onPress={() => router.push('/tasks')}
        />

        {/* Seasonal Tips Card */}
        <SeasonalTipsCard onPress={() => setSeasonalModalVisible(true)} />

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.error }]}>Overdue</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.countBadgeText}>{overdueTasks.length}</Text>
              </View>
            </View>
            {overdueTasks.slice(0, 3).map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </View>
        )}

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming (7 days)</Text>
            {upcomingTasks.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.countBadgeText}>{upcomingTasks.length}</Text>
              </View>
            )}
          </View>
          {upcomingTasks.length > 0 ? (
            upcomingTasks.slice(0, 3).map(task => (
              <TaskRow key={task.id} task={task} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming tasks this week
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={[styles.actionsRow, { marginTop: 16 }]}>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => setAddTaskModalVisible(true)}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Add Task</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => setAddInventoryModalVisible(true)}>
              <Ionicons name="cube" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Add Item</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => router.push('/pros')}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Find Pro</Text>
            </Pressable>
          </View>
        </View>

        {/* Zestimate Card - Condensed */}
        <ZestimateCard
          zestimate={homeInfo.zestimate}
          purchasePrice={homeInfo.purchasePrice}
          zillowUrl={homeInfo.zillowUrl}
          loading={zestimateLoading}
          error={zestimateError}
          hasAddress={!!(homeInfo.address && homeInfo.city)}
          onRefresh={refreshZestimate}
        />
      </ScrollView>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={addTaskModalVisible}
        properties={properties}
        activePropertyId={activePropertyId}
        editingTask={editingTask}
        onClose={() => {
          setAddTaskModalVisible(false);
          setEditingTask(null);
        }}
        onSave={(taskData) => {
          if (editingTask) {
            updateTask(editingTask.id, {
              title: taskData.title,
              description: taskData.description,
              category: taskData.category,
              priority: taskData.priority,
              dueDate: taskData.dueDate,
              recurring: taskData.recurring,
            });
          } else {
            addTask({ ...taskData, status: 'scheduled' });
          }
          setAddTaskModalVisible(false);
          setEditingTask(null);
        }}
      />

      {/* Add Property Modal */}
      <AddPropertyModal
        visible={addPropertyModalVisible}
        onClose={() => setAddPropertyModalVisible(false)}
        onSave={(property) => {
          addProperty(property);
          setAddPropertyModalVisible(false);
        }}
      />

      {/* Seasonal Tips Modal */}
      <SeasonalTipsModal
        visible={seasonalModalVisible}
        onClose={() => setSeasonalModalVisible(false)}
        onAddTask={(tip) => {
          // Create a task from the tip (modal stays open for more adds)
          addTask({
            title: tip,
            description: `Seasonal maintenance task for ${new Date().toLocaleDateString('en-US', { month: 'long' })}`,
            category: 'other',
            priority: 'medium',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'scheduled',
          });
        }}
      />

      {/* Add Inventory Modal */}
      <AddInventoryModal
        visible={addInventoryModalVisible}
        onClose={() => setAddInventoryModalVisible(false)}
        onSave={(item) => {
          addInventoryItem(item);
          setAddInventoryModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  propertyScroll: {
    marginBottom: 16,
  },
  propertyScrollContent: {
    gap: 12,
    paddingRight: 16,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 140,
  },
  propertyCardActive: {
    // Active state handled by inline styles
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  addPropertyCard: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  emptyState: {
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 150,
    height: 150,
    borderRadius: 30,
  },
  splashAppName: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  splashVersion: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  swipeActions: {
    flexDirection: 'row',
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
  },
});