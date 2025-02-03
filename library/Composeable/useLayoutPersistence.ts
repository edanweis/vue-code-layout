import { ref } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { onUnmounted } from 'vue'

export interface LayoutPersistenceState {
  id: string // UUID
  state_id: string
  layout: any
  created_at: string
  updated_at: string
}

export interface LayoutPersistenceVersion {
  id: string // UUID
  state_id: string // UUID referencing layout_states.id
  version_name: string
  layout: any
  created_at: string
}

export interface UseLayoutPersistenceOptions {
  /**
   * Pre-configured and authenticated Supabase client
   */
  supabase: SupabaseClient
  /**
   * Optional state ID to use. If not provided, a new UUID will be generated
   */
  stateId?: string
  /**
   * Layout instance to persist
   */
  layoutInstance: any
  /**
   * Whether to automatically sync layout changes. Defaults to true
   */
  autoSync?: boolean
  /**
   * Debounce delay in ms for auto-sync, false to disable debouncing. Defaults to 1000ms
   */
  autoSyncDebounce?: number | false
  /**
   * Error handler callback
   */
  onError?: (error: any) => void
  /**
   * Database table configuration
   */
  tables?: {
    /**
     * Name of the table to store layout states. Defaults to 'layout_states'
     */
    states?: string
    /**
     * Name of the table to store versions. Defaults to 'layout_state_versions'
     */
    versions?: string
  }
  /**
   * Column configuration for mapping library fields to database columns
   */
  columns?: {
    /**
     * Column name for state ID. Defaults to 'state_id'
     */
    stateId?: string
    /**
     * Column name for layout data. Defaults to 'layout'
     */
    layout?: string
    /**
     * Column name for version name. Defaults to 'version_name'
     */
    versionName?: string
    /**
     * Column name for created timestamp. Defaults to 'created_at'
     */
    createdAt?: string
    /**
     * Column name for updated timestamp. Defaults to 'updated_at'
     */
    updatedAt?: string
  }
  /**
   * Additional data to include when saving states
   */
  additionalData?: Record<string, any> | (() => Record<string, any>)
  /**
   * Additional data to include when saving versions
   */
  additionalVersionData?: Record<string, any> | (() => Record<string, any>)
}

export function useLayoutPersistence(options: UseLayoutPersistenceOptions) {
  const { 
    supabase, 
    stateId: initialStateId, 
    layoutInstance, 
    autoSync = true,
    autoSyncDebounce = 1000,
    onError = console.error,
    tables = {
      states: 'layout_states',
      versions: 'layout_state_versions'
    },
    columns = {
      stateId: 'state_id',
      layout: 'layout',
      versionName: 'version_name',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    additionalData,
    additionalVersionData
  } = options

  const currentState = ref<LayoutPersistenceState | null>(null)
  const versions = ref<LayoutPersistenceVersion[]>([])
  const isLoading = ref(false)
  const error = ref<any>(null)
  let onLayoutChangeCleanup: (() => void) | null = null

  // Find or create state for user
  const initializeState = async () => {
    isLoading.value = true
    error.value = null
    try {
      // Try to find existing state by state_id if provided
      if (initialStateId) {
        const { data: existingState, error: fetchError } = await supabase
          .from(tables.states)
          .select('*')
          .eq(columns.stateId, initialStateId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // Ignore not found error
        if (existingState) {
          currentState.value = existingState
          await fetchVersions(existingState.id)
          return existingState.state_id
        }
      }

      // No state found or no initialStateId provided, return null to trigger creation of new state
      return null
    } catch (err) {
      error.value = err
      onError(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Fetch versions for a state
  const fetchVersions = async (stateId: string) => {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: versionsError } = await supabase
        .from(tables.versions)
        .select('*')
        .eq('state_id', stateId)
        .order('created_at', { ascending: false })

      if (versionsError) throw versionsError
      versions.value = data || []
    } catch (err) {
      error.value = err
      onError(err)
    } finally {
      isLoading.value = false
    }
  }

  // Helper to get additional data
  const getAdditionalData = (dataOrFn?: Record<string, any> | (() => Record<string, any>)) => {
    if (typeof dataOrFn === 'function') {
      return dataOrFn()
    }
    return dataOrFn || {}
  }

  // Save current state
  const saveState = async () => {
    isLoading.value = true
    error.value = null
    try {
      console.group('Layout Persistence: Save State')
      let layout
      if (layoutInstance.saveLayout) {
        layout = layoutInstance.saveLayout()
      } else if (layoutInstance.getRootGrid) {
        const grid = layoutInstance.getRootGrid()
        layout = grid.toJSON()
      } else {
        throw new Error('Layout instance does not have saveLayout or getRootGrid method')
      }

      // Generate or use existing state ID
      const stateId = currentState.value?.state_id || initialStateId || crypto.randomUUID()
      console.log('Using state ID:', stateId)

      // Prepare state data
      const stateData = {
        [columns.stateId]: stateId,
        [columns.layout]: layout,
        [columns.updatedAt]: new Date().toISOString(),
        ...getAdditionalData(additionalData)
      }

      let result: LayoutPersistenceState
      if (currentState.value?.id) {
        // Update existing state
        console.log('🔄 Updating existing state')
        const { data, error: updateError } = await supabase
          .from(tables.states)
          .update(stateData)
          .eq('id', currentState.value.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Failed to update state:', updateError)
          throw updateError
        }
        result = data
      } else {
        // Create new state
        console.log('🔄 Creating new state')
        stateData[columns.createdAt] = new Date().toISOString()
        const { data, error: insertError } = await supabase
          .from(tables.states)
          .insert(stateData)
          .select()
          .single()

        if (insertError) {
          console.error('❌ Failed to create state:', insertError)
          throw insertError
        }
        result = data
      }

      console.log('✅ State saved successfully:', result)
      currentState.value = result
      console.groupEnd()
      return result
    } catch (err) {
      console.error('❌ Save state error:', err)
      error.value = err
      onError(err)
      console.groupEnd()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create version
  const createVersion = async (versionName: string) => {
    isLoading.value = true
    error.value = null
    try {
      console.group('Layout Persistence: Create Version')
      
      // First ensure we have a saved state
      if (!currentState.value?.id) {
        console.log('🔄 No current state, saving state first...')
        const savedState = await saveState()
        if (!savedState) {
          throw new Error('Failed to save state')
        }
        currentState.value = savedState
      }

      let layout
      if (layoutInstance.saveLayout) {
        layout = layoutInstance.saveLayout()
      } else if (layoutInstance.getRootGrid) {
        const grid = layoutInstance.getRootGrid()
        layout = grid.toJSON()
      } else {
        throw new Error('Layout instance does not have saveLayout or getRootGrid method')
      }

      // Create the version
      console.log('🔄 Creating version:', versionName)
      const newVersionData = {
        state_id: currentState.value.id, // Use the UUID from layout_states
        [columns.versionName]: versionName,
        [columns.layout]: layout,
        ...getAdditionalData(additionalVersionData)
      }
      console.log('Version data:', newVersionData)

      const { data: createdVersion, error: versionError } = await supabase
        .from(tables.versions)
        .insert(newVersionData)
        .select()
        .single()

      if (versionError) {
        console.error('❌ Failed to create version:', versionError)
        throw versionError
      }

      console.log('✅ Version created successfully:', createdVersion)

      // Refresh versions list
      await fetchVersions(currentState.value.id)
      console.groupEnd()
    } catch (err) {
      console.error('❌ Create version error:', err)
      error.value = err
      onError(err)
      console.groupEnd()
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Load version
  const loadVersion = async (version: LayoutPersistenceVersion) => {
    isLoading.value = true
    error.value = null
    try {
      const layout = version.layout
      if (layoutInstance.clearLayout) {
        layoutInstance.clearLayout()
      }
      if (layoutInstance.loadLayout) {
        layoutInstance.loadLayout(layout, (panelData: any) => {
          // Create panel with data
          const panel = {
            ...panelData,
            data: panelData.data || {}, // Ensure data object exists
            // Restore icon functions if they existed
            iconSmall: panelData.hasIconSmall ? () => null : undefined,
            iconLarge: panelData.hasIconLarge ? () => null : undefined,
            actions: panelData.hasActions ? [] : undefined,
          };
          return panel;
        })
      } else {
        const grid = layoutInstance.getRootGrid()
        grid.fromJSON(layout)
        layoutInstance.notifyRelayout?.()
      }
    } catch (err) {
      error.value = err
      onError(err)
    } finally {
      isLoading.value = false
    }
  }

  // Load initial state
  const loadState = async () => {
    isLoading.value = true
    error.value = null
    try {
      // Initialize state if needed
      if (!currentState.value) {
        const stateId = await initializeState()
        if (!stateId) {
          // No existing state found, create new one
          await saveState()
        }
      }

      // Load layout if exists
      if (currentState.value?.layout) {
        if (layoutInstance.clearLayout) {
          layoutInstance.clearLayout()
        }
        if (layoutInstance.loadLayout) {
          layoutInstance.loadLayout(currentState.value.layout, (panelData: any) => {
            // Create panel with data
            const panel = {
              ...panelData,
              data: panelData.data || {}, // Ensure data object exists
              // Restore icon functions if they existed
              iconSmall: panelData.hasIconSmall ? () => null : undefined,
              iconLarge: panelData.hasIconLarge ? () => null : undefined,
              actions: panelData.hasActions ? [] : undefined,
            };
            return panel;
          })
        } else {
          const grid = layoutInstance.getRootGrid()
          grid.fromJSON(currentState.value.layout)
          layoutInstance.notifyRelayout?.()
        }
      }
    } catch (err) {
      error.value = err
      onError(err)
    } finally {
      isLoading.value = false
    }
  }

  // Auto-sync setup
  if (autoSync && layoutInstance.onLayoutChange) {
    let saveTimeout: ReturnType<typeof setTimeout>
    onLayoutChangeCleanup = layoutInstance.onLayoutChange(() => {
      // If debouncing is disabled, save immediately
      if (autoSyncDebounce === false) {
        saveState()
        return
      }

      // Otherwise use debounced save
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      saveTimeout = setTimeout(() => {
        saveState()
      }, autoSyncDebounce)
    })
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    if (onLayoutChangeCleanup) {
      onLayoutChangeCleanup()
    }
  })

  return {
    currentState,
    versions,
    isLoading,
    error,
    loadState,
    saveState,
    createVersion,
    loadVersion,
    fetchVersions
  }
} 