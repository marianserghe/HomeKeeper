# HomeKeeper — Technical Specification

*A complete guide for rebuilding this app from scratch.*

---

## Overview

**HomeKeeper** is a React Native app for tracking home maintenance tasks, finding local contractors (pros), and managing household inventory. It supports multiple properties and syncs home values via Zillow Zestimate.

**Goal:** Help homeowners stay on top of maintenance with task templates, contractor search, and home value tracking.

**Platform:** iOS (primary), Android (Expo supports both)

**Location:** `/Users/mybotserghe/Shared/HomeKeeper/`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | React Context + AsyncStorage |
| Styling | Theme system with dark/light modes |
| Maps/Location | expo-location, HERE Geocoding API |
| Reviews | Yelp Fusion API |
| Home Values | Zillow via Apify scraper |

**Dependencies:**
```bash
npx expo install @react-native-community/slider expo-location react-native-gesture-handler
```

---

## Project Structure

```
HomeKeeper/
├── app/
│   ├── _layout.tsx          # Root layout, GestureHandlerRootView wrapper
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigator
│   │   ├── index.tsx        # Home screen
│   │   ├── tasks.tsx        # Tasks list with swipe actions
│   │   ├── inventory.tsx    # Inventory list
│   │   ├── pros.tsx         # Pro search + saved contacts
│   │   └── settings.tsx     # Property management, preferences
├── components/
│   ├── AddTaskModal.tsx     # Create/edit tasks
│   ├── AddProModal.tsx      # Add contractor contact
│   ├── AddInventoryModal.tsx
│   ├── AddPropertyModal.tsx
│   ├── TaskTemplatesModal.tsx
│   ├── PlaceDetailModal.tsx # HERE place details + Yelp ratings
│   ├── ProDetailModal.tsx   # Saved contact details
│   ├── ZestimateCard.tsx    # Animated home value display
│   └── HomeHealthCard.tsx   # Maintenance score progress
├── contexts/
│   ├── AppContext.tsx       # Global state: properties, tasks, pros, inventory
│   └── ThemeContext.tsx     # Dark/light theme persistence
├── lib/
│   ├── tasks.ts            # Task types, helpers, generateSampleTasks
│   ├── taskTemplates.ts    # 20 pre-defined maintenance tasks
│   ├── hereSearch.ts       # HERE API for pro search
│   ├── yelpApi.ts          # Yelp ratings lazy-loaded
│   └── zestimate.ts        # Zillow via Apify
└── constants/
    └── Colors.ts           # Dark/light color palettes
```

---

## Data Models

### Property
```typescript
interface HomeInfo {
  id: string;
  name: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  purchasePrice?: number;
  purchaseDate?: string;
  lat?: number;
  lng?: number;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  propertyId: string;
  templateId?: string;
  isRecurring?: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval: number;
  };
  createdAt: string;
}
```

### Task Categories
```typescript
type TaskCategory = 
  | 'hvac' | 'plumbing' | 'electrical' | 'roofing' 
  | 'exterior' | 'interior' | 'appliances' | 'safety' | 'landscaping';
```

### Priority
```typescript
type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
```

### Pro (Contractor)
```typescript
interface Pro {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  category: ProCategory;
  notes?: string;
  rating?: number;
  address?: string;
  website?: string;
  propertyId: string;
}
```

### Inventory Item
```typescript
interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  notes?: string;
  propertyId: string;
}
```

---

## Key Features & Implementation

### 1. Multi-Property Support

**Location:** `AppContext.tsx`, `settings.tsx`

- `properties[]` array + `activePropertyId`
- Tasks, pros, inventory scoped to `activePropertyId`
- Property selector at top of home screen (horizontal scroll)
- Property editing in Settings (name, beds, baths, purchase info)

```typescript
const activePropertyTasks = tasks.filter(t => t.propertyId === activePropertyId);
```

### 2. Task Management with Swipe Actions

**Location:** `tasks.tsx`, `AddTaskModal.tsx`

**Swipe-to-Complete/Delete:**
- Uses `Swipeable` from `react-native-gesture-handler` (NOT Gesture.Pan — it crashes)
- Fixed height (56px) for both card and buttons
- `renderRightActions` with checkmark (complete) and trash (delete)
- Priority colors on left border: red=urgent, amber=high, blue=medium, gray=low

**Expandable FAB:**
- Single + button expands into Templates + Manual Task options
- Spring animation with rotation (+ rotates to ×)
- `Animated.spring` with `useNativeDriver: true`

**Task Editing:**
- Tap task card opens `AddTaskModal` with `editingTask` prop
- Form pre-populated with existing values
- `updateTask()` in context

**Templates:**
- `lib/taskTemplates.ts` — 20 pre-defined tasks with frequencies
- Monthly (3), Quarterly (3), Semi-annual (3), Annual (14)
- Auto-generate default tasks for new properties

**Critical Code Pattern:**
```typescript
// Swipeable implementation
<Swipeable
  ref={swipeableRef}
  renderRightActions={renderRightActions}
  overshootRight={false}
  friction={2}
>
  <Pressable onPress={() => setEditingTask(task)}>
    {/* Task card content */}
  </Pressable>
</Swipeable>

// renderRightActions
const renderRightActions = (_progress, dragX) => {
  const translateX = dragX.interpolate({
    inputRange: [-120, 0],
    outputRange: [0, 120],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={[styles.swipeActions, { transform: [{ translateX }] }]}>
      <Pressable onPress={handleComplete}>
        <Ionicons name="checkmark" />
      </Pressable>
      <Pressable onPress={handleDelete}>
        <Ionicons name="trash" />
      </Pressable>
    </Animated.View>
  );
};
```

### 3. Pro Search with HERE Geocoding

**Location:** `pros.tsx`, `lib/hereSearch.ts`

**API:** HERE Geocoding API

**Key Decision:** Use text search with fallback terms, NOT category IDs (they return wrong results — electrician → dental).

**Search Flow:**
1. Get user location via `expo-location`
2. Fetch results at max radius (50mi)
3. Filter locally for instant slider feedback (1-50mi)
4. Display results with distance badges
5. Lazy-load Yelp ratings on detail modal open

```typescript
// lib/hereSearch.ts
export async function searchNearby(
  query: string,
  lat: number,
  lng: number,
  radius: number = 50000
): Promise<HerePlace[]> {
  const url = `https://discover.search.hereapi.com/v1/discover
    ?q=${encodeURIComponent(query)}
    &at=${lat},${lng}
    &limit=20
    &apikey=${HERE_API_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  return data.items.map(formatPlace);
}
```

### 4. Zillow Zestimate Integration

**Location:** `lib/zestimate.ts`, `ZestimateCard.tsx`

**Method:** Apify scraper for Zillow (shared with RentFlow)

**Flow:**
1. Call Apify with property address
2. Apify scrapes Zillow Zestimate
3. Cache for 7 days (avoid repeated API calls)
4. Calculate equity: `Zestimate - Purchase Price`
5. Show percentage change since purchase

```bash
EXPO_PUBLIC_APIFY_API_KEY=apify_api_xETqYZQKcpTOjWwq7CnFcQVNL5YsO4BDWQt
```

### 5. Theme System

**Location:** `contexts/ThemeContext.tsx`, `constants/Colors.ts`

```typescript
// constants/Colors.ts
export const dark = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  primary: '#F59E0B',  // Amber
  // ...
};

export const light = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#F59E0B',
  // ...
};

// Usage
const { colors } = useTheme();
<View style={{ backgroundColor: colors.background }}>
```

### 6. Keyboard Avoiding

**Location:** All modals and screens with text inputs

```typescript
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <SafeAreaView>
    <ScrollView>
      {/* Form content */}
    </ScrollView>
  </SafeAreaView>
</KeyboardAvoidingView>
```

---

## API Keys

| Service | Purpose |
|---------|---------|
| HERE Geocoding | Pro search, address autocomplete |
| Yelp Fusion | Business ratings |
| Apify | Zillow Zestimate scraper |
| Expo Location | Device GPS (built-in) |

**.env file:**
```bash
EXPO_PUBLIC_HERE_API_KEY=fOLsRJBzbQTclu5TbUbrgYA9xVwpclFzgKisf_meiJo
EXPO_PUBLIC_YELP_API_KEY=-NP80rN7xTAh67twUodS4cWxBYTYF2OAT-z0U-ZhzEC9MiXXIst4UJ5lrkEe63tnu-lJNP9nhV2AXAbmPnmnQMcPaEbB5Fl7dvLTQcZh3S5e3p8Ymjo1CmL9uTHiaXYx
EXPO_PUBLIC_APIFY_API_KEY=apify_api_xETqYZQKcpTOjWwq7CnFcQVNL5YsO4BDWQt
```

---

## State Management

**Location:** `contexts/AppContext.tsx`

```typescript
interface AppContextType {
  // Properties
  properties: HomeInfo[];
  activePropertyId: string | null;
  setActiveProperty: (id: string) => void;
  addProperty: (property: HomeInfo) => void;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  
  // Pros, Inventory, Settings...
}
```

**Persistence:**
```typescript
// Load from AsyncStorage on mount
useEffect(() => {
  const loadData = async () => {
    const stored = await AsyncStorage.getItem('homekeeper_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Handle migration from single-property to multi-property
      if (!parsed.properties && parsed.homeInfo) {
        parsed.properties = [parsed.homeInfo];
        parsed.activePropertyId = parsed.homeInfo.id;
      }
      setState(parsed);
    }
  };
  loadData();
}, []);

// Auto-save on state change
useEffect(() => {
  AsyncStorage.setItem('homekeeper_data', JSON.stringify(state));
}, [state]);
```

---

## Navigation

**Location:** `app/_layout.tsx`, `app/(tabs)/_layout.tsx`

```typescript
// app/_layout.tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <ThemeProvider>
    <AppProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  </ThemeProvider>
</GestureHandlerRootView>

// app/(tabs)/_layout.tsx
<Tabs>
  <Tabs.Screen name="index" options={{ title: 'Home' }} />
  <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
  <Tabs.Screen name="inventory" options={{ title: 'Inventory' }} />
  <Tabs.Screen name="pros" options={{ title: 'Pros' }} />
  <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
</Tabs>
```

---

## Key Decisions

| Decision | Why |
|----------|-----|
| `Swipeable` not `Gesture.Pan()` | Pan crashes; Swipeable is stable |
| Fixed heights (56px) | Variable heights cause misalignment |
| HERE text search | Category IDs return wrong results |
| Fetch at 50mi, filter locally | Instant slider feedback |
| Yelp lazy load | Saves API quota |
| Priority border colors | Visual priority indicator |
| `EXPO_PUBLIC_` prefix | Required for env vars in RN |
| KeyboardAvoidingView | Keyboard covers inputs without it |
| GestureHandlerRootView at root | Required for Swipeable |

---

## Testing Checklist

- [ ] Swipe gestures on real device
- [ ] Expandable FAB animation smoothness
- [ ] Task editing saves correctly
- [ ] Pro search returns results
- [ ] Yelp ratings load in detail modal
- [ ] Zestimate fetches for test address
- [ ] Multi-property switching
- [ ] Task templates generate properly
- [ ] Keyboard doesn't cover inputs
- [ ] Dark/light theme persistence

---

## Future Enhancements

1. **Cloud sync** — Supabase backend (schema ready from RentFlow)
2. **Push notifications** — Task due date reminders
3. **Recurring task auto-create** — Generate next instance on completion
4. **Property photos** — Add/edit home images
5. **Export data** — CSV/JSON backup
6. **Widget** — iOS home screen widget for overdue tasks

---

*This spec is sufficient for a developer unfamiliar with the codebase to rebuild HomeKeeper from scratch.*