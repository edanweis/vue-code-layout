# Layout Persistence

The layout persistence feature allows you to save, load, and version control your layouts using Supabase as a backend. This guide explains how to set up and use the layout persistence system.

## Setup

### 1. Database Setup

First, you need to set up the required tables in your Supabase database:

```sql
-- Create layout states table
create table public.layout_states (
  id uuid not null default gen_random_uuid(),
  state_id text not null,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint layout_states_pkey primary key (id),
  constraint layout_states_state_id_key unique (state_id)
);

-- Create layout versions table
create table public.layout_state_versions (
  id uuid not null default gen_random_uuid(),
  state_id uuid not null,
  version_name text not null,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint layout_state_versions_pkey primary key (id),
  constraint layout_state_versions_state_id_fkey foreign key (state_id) 
    references layout_states (id) 
    on delete cascade
);

-- Add indexes for better performance
create index idx_layout_states_state_id on public.layout_states(state_id);
create index idx_layout_state_versions_state_id on public.layout_state_versions(state_id);
create index idx_layout_state_versions_created_at on public.layout_state_versions(created_at desc);
```

### 2. Initialize the Composable

Import and initialize the `useLayoutPersistence` composable in your component:

```typescript
import { useLayoutPersistence } from '@edanweis/vue-code-layout'
import { supabase } from './supabase-client'

const layoutState = useLayoutPersistence({
  supabase,                    // Configured Supabase client
  stateId: 'my-layout',        // Optional: Unique identifier for this layout
  layoutInstance: layoutRef,    // Reference to the layout component
  autoSync: true,              // Optional: Auto-save changes (default: true)
  autoSyncDebounce: 1000,      // Optional: Debounce delay in ms (default: 1000)
  onError: console.error       // Optional: Error handler
})
```

## Usage

### Basic State Management

```typescript
// Load initial state
await layoutState.loadState()

// Save current state
await layoutState.saveState()
```

### Version Management

```typescript
// Create new version
await layoutState.createVersion('Version 1')

// Load specific version
await layoutState.loadVersion(version)

// Get list of versions
const versions = layoutState.versions
```

### State ID Management

State IDs can be provided in several ways:

1. **URL Parameters**:
   ```
   https://your-app.com/layout?stateId=my-layout-1
   ```

2. **Direct Configuration**:
   ```typescript
   const layoutState = useLayoutPersistence({
     stateId: 'my-layout-1',
     // ... other options
   })
   ```

3. **Local Storage**:
   The last used state ID is automatically saved to localStorage and restored on page load.

### Advanced Configuration

```typescript
const layoutState = useLayoutPersistence({
  // Custom table names
  tables: {
    states: 'custom_layout_states',
    versions: 'custom_layout_versions'
  },
  
  // Custom column names
  columns: {
    stateId: 'state_id',
    layout: 'layout_data',
    versionName: 'version_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  
  // Additional data to include when saving
  additionalData: {
    workspace_id: '123',
    team_id: '456'
  },
  
  // Or use a function for dynamic values
  additionalData: () => ({
    workspace_id: currentWorkspace.value.id,
    last_modified_by: currentUser.value.id
  })
})
```

### Icon Persistence

When saving and loading layouts, panel icons require special handling since they are functions and cannot be directly serialized to JSON. The layout persistence system includes built-in support for preserving icon information through the `defaultPanelConfig` option:

```typescript
const layoutState = useLayoutPersistence({
  supabase,
  layoutInstance: layoutRef,
  defaultPanelConfig: {
    // Function to generate panel icons based on unique name
    iconGenerator: (uniqueName: string) => {
      // Return appropriate icon component based on panel name
      switch (uniqueName) {
        case 'explorer':
          return () => h(IconFolder)
        case 'search':
          return () => h(IconSearch)
        default:
          return () => h(IconFile)
      }
    }
  }
})
```

When a layout is saved, the system tracks which panels had icons by setting `hasIconSmall` and `hasIconLarge` flags. When loading a layout, these flags are used in combination with the `defaultPanelConfig.iconGenerator` to restore the appropriate icons.

For icons to be properly restored:
1. The panels must have had icons when the layout was saved
2. A valid `defaultPanelConfig.iconGenerator` function must be provided when loading the layout

If no `iconGenerator` is provided, panels will be loaded with null icon functions to prevent errors, but the icons will not be displayed.

### Panel Close Type Persistence

The layout persistence system also preserves panel close types (`unSave` or `close`). When a layout is saved, the `closeType` property of each panel is automatically included in the serialized data. When loading a layout, these close types are restored to their original values.

This means that panels will maintain their close behavior preferences across save and load operations without any additional configuration required.

### Layout Arrangement Options

When loading a layout, you can specify how panels should be arranged using the `arrangement` option. This is particularly useful when you want to display panels in a specific pattern regardless of their original layout.

```typescript
// Load layout with default arrangement (preserves original structure)
await layoutState.loadVersion(version)

// Load layout with grid arrangement (organizes panels in a square-like grid)
await layoutState.loadVersion(version, { arrangement: 'grid' })
```

The grid arrangement option will:
1. Collect all panels from the layout
2. Calculate the optimal grid dimensions (trying to maintain a square ratio)
3. Create a new grid structure with rows and columns
4. Distribute panels evenly across the grid cells

This is useful when you want to:
- View all panels simultaneously in an organized manner
- Compare multiple panels side by side
- Create a dashboard-like layout from any saved layout

## Example Component

Here's a complete example showing how to implement layout persistence with version control:

```vue
<template>
  <div class="layout-container">
    <!-- Layout Controls -->
    <div class="controls">
      <button @click="handleSaveState">Save State</button>
      <button @click="handleCreateVersion">Create Version</button>
      
      <!-- Version Selector -->
      <div class="version-selector">
        <select v-model="selectedVersion">
          <option value="">Select Version</option>
          <option v-for="version in versions" :key="version.id" :value="version">
            {{ formatVersionName(version) }}
          </option>
        </select>
        <button v-if="selectedVersion" @click="handleLoadVersion">
          Load Version
        </button>
      </div>
    </div>

    <!-- Layout Component -->
    <SplitLayout ref="layoutRef" @layout-change="handleLayoutChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLayoutPersistence } from '@edanweis/vue-code-layout'

const layoutRef = ref()
const versions = ref([])
const selectedVersion = ref(null)

const layoutState = useLayoutPersistence({
  supabase,
  layoutInstance: layoutRef,
  autoSync: true
})

// Initialize
await layoutState.loadState()

// Watch for version changes
watch(() => layoutState.versions, newVersions => {
  versions.value = newVersions
})

// Version management
const handleCreateVersion = async () => {
  const versionName = `Version ${new Date().toLocaleTimeString()}`
  await layoutState.createVersion(versionName)
}

const handleLoadVersion = async () => {
  if (selectedVersion.value) {
    await layoutState.loadVersion(selectedVersion.value)
  }
}
</script>
```

## Best Practices

1. **State IDs**:
   - Use meaningful state IDs to identify layout purposes
   - Consider using URL parameters for easy sharing
   - Store commonly used state IDs in localStorage

2. **Version Control**:
   - Create versions after significant changes
   - Use descriptive version names
   - Consider including timestamps in version names

3. **Error Handling**:
   - Always provide an error handler
   - Handle loading states appropriately
   - Show success/failure feedback to users

4. **Performance**:
   - Use appropriate auto-sync debounce values
   - Consider disabling auto-sync in performance-critical applications
   - Utilize the provided database indexes

## TypeScript Support

The composable includes full TypeScript support with the following interfaces:

```typescript
interface LayoutPersistenceState {
  id: string          // UUID
  state_id: string    // User-provided identifier
  layout: any         // Layout data
  created_at: string
  updated_at: string
}

interface LayoutPersistenceVersion {
  id: string          // UUID
  state_id: string    // References layout_states.id
  version_name: string
  layout: any         // Layout data
  created_at: string
}

interface UseLayoutPersistenceOptions {
  supabase: SupabaseClient       // Pre-configured Supabase client
  stateId?: string              // Optional: Unique identifier for layout state
  layoutInstance: any           // Layout component instance
  autoSync?: boolean            // Whether to auto-sync (default: true)
  autoSyncDebounce?: number     // Debounce delay for auto-sync in ms (default: 1000)
  onError?: (error: any) => void // Error handler callback
  tables?: {                    // Custom table names
    states?: string
    versions?: string
  }
  columns?: {                   // Custom column names
    stateId?: string
    layout?: string
    versionName?: string
    createdAt?: string
    updatedAt?: string
  }
  additionalData?: Record<string, any> | (() => Record<string, any>) // Additional data to include when saving states
  additionalVersionData?: Record<string, any> | (() => Record<string, any>) // Additional data to include when saving versions
}
```

## Events

When using the layout store plugin, you can define event handlers that will be called before and after various operations. This allows you to perform custom actions at specific points in the layout persistence lifecycle.

### Available Events

```typescript
interface LayoutStoreEvents {
  // Called before saving the layout state
  onBeforeSave?: () => void | Promise<void>
  // Called after successfully saving the layout state
  onAfterSave?: (state: LayoutPersistenceState) => void | Promise<void>
  // Called before loading a layout state
  onBeforeLoad?: () => void | Promise<void>
  // Called after successfully loading a layout state
  onAfterLoad?: (state: LayoutPersistenceState) => void | Promise<void>
  // Called before creating a new version
  onBeforeCreateVersion?: () => void | Promise<void>
  // Called after successfully creating a new version
  onAfterCreateVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  // Called before loading a version
  onBeforeLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  // Called after successfully loading a version
  onAfterLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  // Called when an error occurs in any operation
  onError?: (error: any) => void | Promise<void>
}
```

### Example Usage

```typescript
import { createLayoutStore } from '@edanweis/vue-code-layout'
import { supabase } from './supabase-client'

const layoutStore = createLayoutStore()

// Initialize with events
await layoutStore.initialize({
  supabase,
  stateId: 'my-layout',
  events: {
    onBeforeSave: () => {
      console.log('About to save layout state...')
    },
    onAfterSave: (state) => {
      console.log('Layout state saved:', state)
      // You could show a notification here
    },
    onBeforeLoad: () => {
      console.log('About to load layout state...')
      // You could show a loading indicator
    },
    onAfterLoad: (state) => {
      console.log('Layout state loaded:', state)
      // You could hide the loading indicator
    },
    onBeforeCreateVersion: () => {
      console.log('Creating new version...')
    },
    onAfterCreateVersion: (version) => {
      console.log('New version created:', version)
      // You could show a success message
    },
    onError: (error) => {
      console.error('Layout operation failed:', error)
      // You could show an error notification
    }
  }
})
```

### Best Practices for Events

1. **Error Handling**:
   - Always implement the `onError` event handler to handle and display errors appropriately
   - Use try-catch blocks in your event handlers if performing complex operations

2. **Async Operations**:
   - All event handlers can be asynchronous (return a Promise)
   - Use async/await for cleaner code when performing async operations
   - Be careful not to block the UI thread with long-running operations

3. **State Management**:
   - Use events to sync layout state with other parts of your application
   - Consider integrating with your application's notification system
   - Update loading states and UI feedback in event handlers

4. **Performance**:
   - Keep event handlers light and fast
   - Move heavy computations to web workers if necessary
   - Consider debouncing or throttling if events are triggered frequently

### Example with Loading States

```vue
<template>
  <div class="layout-container">
    <div v-if="isLoading" class="loading-overlay">
      Loading layout...
    </div>
    
    <SplitLayout ref="layoutRef" />
    
    <div class="notifications">
      <div v-if="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLayoutStore } from '@edanweis/vue-code-layout'

const layoutRef = ref()
const isLoading = ref(false)
const notification = ref<{ type: string; message: string } | null>(null)

const showNotification = (message: string, type: string = 'info') => {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const store = useLayoutStore()

// Set up layout instance
store.setLayoutInstance(layoutRef)

// Initialize with events
await store.initialize({
  supabase,
  events: {
    onBeforeLoad: () => {
      isLoading.value = true
    },
    onAfterLoad: () => {
      isLoading.value = false
      showNotification('Layout loaded successfully', 'success')
    },
    onBeforeSave: () => {
      showNotification('Saving layout...', 'info')
    },
    onAfterSave: () => {
      showNotification('Layout saved successfully', 'success')
    },
    onError: (error) => {
      isLoading.value = false
      showNotification(error.message, 'error')
    }
  }
})
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notifications > div {
  padding: 10px 20px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.info {
  background: #2196f3;
  color: white;
}

.success {
  background: #4caf50;
  color: white;
}

.error {
  background: #f44336;
  color: white;
}
</style> 