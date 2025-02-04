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

### 2. Choose Your Integration Method

#### Option A: Vue Plugin (Standard)

The standard way to use layout persistence is through the layout store:

```typescript
import { useLayoutStore } from '@edanweis/vue-code-layout'

// In your setup function
const layoutStore = useLayoutStore()

// Initialize the store
await layoutStore.initialize({
  supabase,                    // Configured Supabase client
  stateId: 'my-layout',        // Optional: Unique identifier for this layout
  autoSync: true,              // Optional: Auto-save changes (default: true)
  autoSyncDebounce: 1000,      // Optional: Debounce delay in ms (default: 1000)
  onError: console.error,      // Optional: Error handler
  events: {                    // Optional: Event handlers
    onBeforeSave: async (state) => {
      // Called before saving layout state
    },
    onAfterSave: async (state) => {
      // Called after saving layout state
    },
    onBeforeLoad: async (state) => {
      // Called before loading layout state
    },
    onAfterLoad: async (state) => {
      // Called after loading layout state
    },
    onBeforeVersionCreate: async (versionName) => {
      // Called before creating a version
    },
    onAfterVersionCreate: async (version) => {
      // Called after creating a version
    },
    onError: async (error) => {
      // Called when an error occurs
    }
  }
})
```

#### Option B: Nuxt Module

If you're using Nuxt, you can use our dedicated Nuxt module for better integration:

1. First, install the module in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    defaultStateId: 'my-layout' // Optional: default state ID
  }
})
```

2. Use the composables in your components:

```vue
<script setup>
// The composables are auto-imported by Nuxt
const { data: layoutState } = await useNuxtLayout({
  defaultStateId: 'my-layout', // Optional: override default state ID
  immediate: true // Optional: whether to initialize immediately (default: true)
})

// Save version
await saveNuxtLayoutVersion(layoutState.value)

// Load versions
const { data: versions } = await useNuxtLayoutVersions()

// Load specific version
await loadNuxtLayoutVersion(versions.value[0])

// Only components and styles need to be imported explicitly
import { CodeLayout } from '@edanweis/vue-code-layout'
import '@edanweis/vue-code-layout/style.css'
</script>

<template>
  <code-layout ref="layoutRef">
    <!-- Your layout content -->
  </code-layout>
</template>
```

The Nuxt integration provides these benefits:
- Auto-imports for all layout composables
- TypeScript support out of the box
- Integration with Nuxt's state management
- SSR-friendly implementation
- Proper HMR support

### Available Composables

All these composables are auto-imported by Nuxt:

| Composable | Description |
|------------|-------------|
| `useNuxtLayout` | Main composable for managing layout state |
| `saveNuxtLayoutVersion` | Save current layout as a new version |
| `useNuxtLayoutVersions` | Get list of saved versions |
| `loadNuxtLayoutVersion` | Load a specific version |

### TypeScript Support

The module includes full TypeScript support:

```typescript
interface UseNuxtLayoutOptions {
  defaultStateId?: string    // Override default state ID
  immediate?: boolean        // Whether to initialize immediately
}

interface LayoutState {
  id: string
  state_id: string
  layout: any
  created_at: string
  updated_at: string
}

interface LayoutVersion {
  id: string
  state_id: string
  version_name: string
  layout: any
  created_at: string
}
```

## Event Handling

The layout store provides two ways to handle layout events:

### 1. Declarative Event Handling

You can define event handlers when initializing the store:

```typescript
await layoutStore.initialize({
  // ... other options ...
  events: {
    onBeforeSave: async (state) => {
      // Validate or modify state before saving
      if (!isValidState(state)) {
        throw new Error('Invalid state')
      }
    },
    onAfterSave: async (state) => {
      // Update UI or show notifications
      showNotification('Layout saved successfully')
    },
    onError: async (error) => {
      // Handle errors
      showErrorNotification(error.message)
    }
  }
})
```

### 2. Imperative Event Handling

You can also dynamically add and remove event handlers:

```typescript
// Add event handler
const handleStateChange = async (state) => {
  console.log('Layout state changed:', state)
}
layoutStore.on('onAfterSave', handleStateChange)

// Remove event handler when component is unmounted
onUnmounted(() => {
  layoutStore.off('onAfterSave')
})
```

### Available Events

| Event Name | Description | Parameters |
|------------|-------------|------------|
| `onBeforeSave` | Called before saving layout state | `state: LayoutPersistenceState` |
| `onAfterSave` | Called after saving layout state | `state: LayoutPersistenceState` |
| `onBeforeLoad` | Called before loading layout state | `state: LayoutPersistenceState` |
| `onAfterLoad` | Called after loading layout state | `state: LayoutPersistenceState` |
| `onBeforeVersionCreate` | Called before creating a version | `versionName: string` |
| `onAfterVersionCreate` | Called after creating a version | `version: LayoutPersistenceVersion` |
| `onError` | Called when an error occurs | `error: any` |

## Usage

### Basic State Management

```typescript
// Load initial state
await layoutStore.loadState()

// Save current state
await layoutStore.saveState()
```

### Version Management

```typescript
// Create new version
await layoutStore.createVersion('Version 1')

// Load specific version
await layoutStore.loadVersion(version)

// Get list of versions
const versions = layoutStore.versions
```

### State ID Management

State IDs can be provided in several ways:

1. **URL Parameters**:
   ```
   https://your-app.com/layout?stateId=my-layout-1
   ```

2. **Direct Configuration**:
   ```typescript
   await layoutStore.initialize({
     stateId: 'my-layout-1',
     // ... other options
   })
   ```

3. **Local Storage**:
   The last used state ID is automatically saved to localStorage and restored on page load.

### Advanced Configuration

```typescript
await layoutStore.initialize({
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

## Example Component

Here's a complete example showing how to implement layout persistence with version control and event handling:

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
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLayoutStore } from '@edanweis/vue-code-layout'

const layoutRef = ref()
const versions = ref([])
const selectedVersion = ref(null)
const layoutStore = useLayoutStore()

// Initialize store with event handlers
onMounted(async () => {
  await layoutStore.initialize({
    supabase,
    layoutInstance: layoutRef,
    autoSync: true,
    events: {
      onBeforeSave: async (state) => {
        console.log('Saving layout state:', state)
      },
      onAfterSave: async (state) => {
        showNotification('Layout saved successfully')
      },
      onError: async (error) => {
        showErrorNotification(error.message)
      }
    }
  })

  // Add dynamic event handler
  const handleStateChange = async (state) => {
    console.log('Layout state changed:', state)
  }
  layoutStore.on('onAfterSave', handleStateChange)

  // Clean up
  onUnmounted(() => {
    layoutStore.off('onAfterSave')
  })
})

// Watch for version changes
watch(() => layoutStore.versions, newVersions => {
  versions.value = newVersions
})

// Version management
const handleCreateVersion = async () => {
  const versionName = `Version ${new Date().toLocaleTimeString()}`
  await layoutStore.createVersion(versionName)
}

const handleLoadVersion = async () => {
  if (selectedVersion.value) {
    await layoutStore.loadVersion(selectedVersion.value)
  }
}
</script>
```

## Best Practices

1. **Event Handling**:
   - Use declarative events for static handlers
   - Use imperative events for dynamic handlers
   - Always clean up event listeners in `onUnmounted`
   - Keep event handlers lightweight
   - Handle errors appropriately

2. **State IDs**:
   - Use meaningful state IDs to identify layout purposes
   - Consider using URL parameters for easy sharing
   - Store commonly used state IDs in localStorage

3. **Version Control**:
   - Create versions after significant changes
   - Use descriptive version names
   - Consider including timestamps in version names

4. **Error Handling**:
   - Always provide an error handler
   - Handle loading states appropriately
   - Show success/failure feedback to users

5. **Performance**:
   - Use appropriate auto-sync debounce values
   - Consider disabling auto-sync in performance-critical applications
   - Utilize the provided database indexes

## TypeScript Support

The layout store includes full TypeScript support with the following interfaces:

```typescript
interface LayoutStoreEvents {
  onBeforeSave?: (state: LayoutPersistenceState) => void | Promise<void>
  onAfterSave?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeLoad?: (state: LayoutPersistenceState) => void | Promise<void>
  onAfterLoad?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeVersionCreate?: (versionName: string) => void | Promise<void>
  onAfterVersionCreate?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onError?: (error: any) => void
}

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

interface LayoutStoreInitOptions {
  supabase: SupabaseClient
  stateId?: string
  autoSync?: boolean
  autoSyncDebounce?: number | false
  events?: LayoutStoreEvents
  // ... other options
}
``` 