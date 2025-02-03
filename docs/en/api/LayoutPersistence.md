# Layout Persistence API

## useLayoutPersistence

A composable function for managing layout states and versions with Supabase persistence.

### Type Definitions

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
  additionalData?: Record<string, any> | (() => Record<string, any>) // Additional data to include when saving
  additionalVersionData?: Record<string, any> | (() => Record<string, any>) // Additional data to include when saving versions
}
```

### Return Value

```typescript
{
  currentState: Ref<LayoutPersistenceState | null>  // Current layout state
  versions: Ref<LayoutPersistenceVersion[]>         // List of available versions
  isLoading: Ref<boolean>                          // Loading state
  error: Ref<any>                                  // Error state
  loadState: () => Promise<void>                   // Load state
  saveState: () => Promise<void>                   // Save state
  createVersion: (name: string) => Promise<void>   // Create new version
  loadVersion: (version: LayoutPersistenceVersion) => Promise<void>  // Load specific version
  fetchVersions: (stateId: string) => Promise<void> // Fetch version list
}
```

### Example

```typescript
const layoutRef = ref()
const layoutState = useLayoutPersistence({
  supabase,
  stateId: 'my-layout',
  layoutInstance: layoutRef,
  autoSync: true,
  autoSyncDebounce: 1000,
  onError: console.error
})

// Load initial state
await layoutState.loadState()

// Create new version
await layoutState.createVersion('Version 1')

// Load specific version
await layoutState.loadVersion(version)
```

### Configuration Options

#### supabase
- Type: `SupabaseClient`
- Required: Yes
- Description: Pre-configured and authenticated Supabase client instance

#### stateId
- Type: `string`
- Required: No
- Default: `undefined`
- Description: Unique identifier for the layout state. If not provided, a new UUID will be generated

#### layoutInstance
- Type: `any`
- Required: Yes
- Description: Layout component instance used to get and set layout state

#### autoSync
- Type: `boolean`
- Required: No
- Default: `true`
- Description: Whether to automatically save state when layout changes

#### autoSyncDebounce
- Type: `number`
- Required: No
- Default: `1000`
- Description: Debounce delay in milliseconds for auto-save

#### onError
- Type: `(error: any) => void`
- Required: No
- Default: `console.error`
- Description: Error handler callback

#### tables
- Type: `object`
- Required: No
- Description: Custom database table names
  - `states`: State table name (default: 'layout_states')
  - `versions`: Version table name (default: 'layout_state_versions')

#### columns
- Type: `object`
- Required: No
- Description: Custom database column names
  - `stateId`: State ID column name (default: 'state_id')
  - `layout`: Layout data column name (default: 'layout')
  - `versionName`: Version name column name (default: 'version_name')
  - `createdAt`: Creation timestamp column name (default: 'created_at')
  - `updatedAt`: Update timestamp column name (default: 'updated_at')

#### additionalData
- Type: `Record<string, any> | (() => Record<string, any>)`
- Required: No
- Description: Additional data to include when saving states, can be an object or a function that returns an object

#### additionalVersionData
- Type: `Record<string, any> | (() => Record<string, any>)`
- Required: No
- Description: Additional data to include when saving versions, can be an object or a function that returns an object 