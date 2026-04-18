import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { Task, TaskCategory, TaskCategoryLabels, formatDate, getStatusColor } from '../../lib/tasks';
import { HomeHealthCard } from '../../components/HomeHealthCard';
import { ZestimateCard } from '../../components/ZestimateCard';
import { AddTaskModal } from '../../components/AddTaskModal';
import { AddPropertyModal } from '../../components/AddPropertyModal';
import { fetchZestimate, getDaysSinceUpdate } from '../../lib/zestimate';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tasks, healthScore, overdueTasks, upcomingTasks, addTask, homeInfo, updateHomeInfo, properties, activePropertyId, addProperty, setActiveProperty } = useApp();
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [addPropertyModalVisible, setAddPropertyModalVisible] = useState(false);
  const [zestimateLoading, setZestimateLoading] = useState(false);
  const [zestimateError, setZestimateError] = useState<string | null>(null);

  // Fetch Zestimate when address changes
  useEffect(() => {
    const fetchHomeValue = async () => {
      if (!homeInfo.address || !homeInfo.city) return;
      const daysSince = getDaysSinceUpdate(homeInfo.zestimateDate);
      if (homeInfo.zestimate && daysSince !== null && daysSince < 7) return; // Fresh enough
      
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
    
    return (
      <Pressable
        style={[styles.taskItem, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}
        onPress={() => {}}
      >
        <View style={styles.taskRow}>
          <Ionicons
            name={getCategoryIcon(task.category)}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
        <Text style={[styles.taskDue, { color: statusColor }]}>
          {formatDate(task.dueDate)}
        </Text>
      </Pressable>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
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

        {/* Home Health Card (Animated) */}
        <HomeHealthCard 
          score={healthScore} 
          overdueCount={overdueTasks.length} 
        />

        {/* Zestimate Card */}
        <ZestimateCard
          zestimate={homeInfo.zestimate}
          purchasePrice={homeInfo.purchasePrice}
          zestimateDate={homeInfo.zestimateDate}
          zillowUrl={homeInfo.zillowUrl}
          rentZestimate={homeInfo.rentZestimate}
          loading={zestimateLoading}
          error={zestimateError}
          hasAddress={!!(homeInfo.address && homeInfo.city)}
          onRefresh={refreshZestimate}
        />

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
          <View style={styles.actionsRow}>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => {}}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Scan</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => setAddTaskModalVisible(true)}>
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Add Task</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]} onPress={() => router.push('/pros')}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Find Pro</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <AddTaskModal
        visible={addTaskModalVisible}
        properties={properties}
        activePropertyId={activePropertyId}
        editingTask={null}
        onClose={() => setAddTaskModalVisible(false)}
        onSave={(task) => {
          addTask({ ...task, status: 'scheduled' });
          setAddTaskModalVisible(false);
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
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  taskDue: {
    fontSize: 12,
    fontWeight: '500',
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
});