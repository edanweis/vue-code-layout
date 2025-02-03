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