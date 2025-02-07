import { ref } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { onUnmounted } from 'vue'
import type { CodeLayoutDefaultPanelConfig, CodeLayoutInitialPanelConfig } from '../Types'

// Add deprecation warning
const warnOnce = (() => {
  let warned = false
  return () => {
    if (!warned) {
      console.warn(
        '[vue-code-layout] Direct usage of useLayoutPersistence is deprecated. ' +
        'Please use the plugin-based approach with useLayoutStore instead. ' +
        'See documentation for migration guide.'
      )
      warned = true
    }
  }
})()

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
   * Whether to enable debug console logs. Defaults to false
   */
  debug?: boolean
  /**
   * Default configuration for new panels
   */
  defaultPanelConfig?: CodeLayoutDefaultPanelConfig
  /**
   * @deprecated Use defaultPanelConfig instead
   */
  initialPanelConfig?: CodeLayoutInitialPanelConfig
  /**
   * Event handlers for layout state operations
   */
  onBeforeSave?: () => void | Promise<void>
  onAfterSave?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeLoad?: () => void | Promise<void>
  onAfterLoad?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeCreateVersion?: () => void | Promise<void>
  onAfterCreateVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onBeforeLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onAfterLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
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
  // Show deprecation warning
  warnOnce()

  const { 
    supabase, 
    stateId: initialStateId, 
    layoutInstance, 
    autoSync = true,
    autoSyncDebounce = 1000,
    onError = console.error,
    onBeforeSave,
    onAfterSave,
    onBeforeLoad,
    onAfterLoad,
    onBeforeCreateVersion,
    onAfterCreateVersion,
    onBeforeLoadVersion,
    onAfterLoadVersion,
    debug: initialDebug = false,
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
    additionalVersionData,
    defaultPanelConfig,
    initialPanelConfig
  } = options

  const currentState = ref<LayoutPersistenceState | null>(null)
  const versions = ref<LayoutPersistenceVersion[]>([])
  const isLoading = ref(false)
  const error = ref<any>(null)
  const debug = ref(initialDebug)
  let onLayoutChangeCleanup: (() => void) | null = null

  // Helper function for debug logging
  const log = (message: string, data?: any) => {
    if (debug.value) {
      console.group(`[vue-code-layout] ${message}`)
      if (data) console.log(data)
      console.groupEnd()
    }
  }

  // Find or create state for user
  const initializeState = async () => {
    isLoading.value = true
    error.value = null
    try {
      log('Initializing state', { initialStateId })
      // Try to find existing state by state_id if provided
      if (initialStateId) {
        const { data: existingState, error: fetchError } = await supabase
          .from(tables.states)
          .select('*')
          .eq(columns.stateId, initialStateId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // Ignore not found error
        if (existingState) {
          log('Found existing state', existingState)
          currentState.value = existingState
          await fetchVersions(existingState.id)
          return existingState.state_id
        }
      }

      log('No existing state found, will create new')
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
      log('Fetching versions', { stateId })
      const { data, error: versionsError } = await supabase
        .from(tables.versions)
        .select('*')
        .eq('state_id', stateId)
        .order('created_at', { ascending: false })

      if (versionsError) throw versionsError
      versions.value = data || []
      log('Versions fetched', versions.value)
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
  const saveState = async (additionalStateData?: Record<string, any> | (() => Record<string, any>)) => {
    isLoading.value = true
    error.value = null
    try {
      log('Saving state')
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
      log('Using state ID', stateId)

      // Prepare state data
      const stateData = {
        [columns.stateId]: stateId,
        [columns.layout]: layout,
        [columns.updatedAt]: new Date().toISOString(),
        ...getAdditionalData(additionalData), // Default additional data
        ...getAdditionalData(additionalStateData) // Override with save-time data
      }

      let result: LayoutPersistenceState
      if (currentState.value?.id) {
        // Update existing state
        log('Updating existing state')
        const { data, error: updateError } = await supabase
          .from(tables.states)
          .update(stateData)
          .eq('id', currentState.value.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        // Create new state
        log('Creating new state')
        stateData[columns.createdAt] = new Date().toISOString()
        const { data, error: insertError } = await supabase
          .from(tables.states)
          .insert(stateData)
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      log('State saved successfully', result)
      currentState.value = result
      return result
    } catch (err) {
      error.value = err
      onError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create version
  const createVersion = async (versionName: string, additionalVersionStateData?: Record<string, any> | (() => Record<string, any>)) => {
    isLoading.value = true
    error.value = null
    try {
      log('Creating version', { versionName })
      
      // First ensure we have a saved state
      if (!currentState.value?.id) {
        log('No current state, saving state first')
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
      log('Creating version in database')
      const newVersionData = {
        state_id: currentState.value.id,
        [columns.versionName]: versionName,
        [columns.layout]: layout,
        ...getAdditionalData(additionalVersionData), // Default additional data
        ...getAdditionalData(additionalVersionStateData) // Override with save-time data
      }

      const { data: createdVersion, error: versionError } = await supabase
        .from(tables.versions)
        .insert(newVersionData)
        .select()
        .single()

      if (versionError) throw versionError

      log('Version created successfully', createdVersion)

      // Refresh versions list
      await fetchVersions(currentState.value.id)
    } catch (err) {
      error.value = err
      onError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Load version
  const loadVersion = async (version: LayoutPersistenceVersion, options?: { arrangement?: 'default' | 'grid' }) => {
    isLoading.value = true
    error.value = null
    try {
      log('Loading version', version)
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
        }, options) // Pass the options to loadLayout
      } else {
        const grid = layoutInstance.getRootGrid()
        grid.fromJSON(layout)
        layoutInstance.notifyRelayout?.()
      }
      log('Version loaded successfully')
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
      log('Loading state')
      // Initialize state if needed
      if (!currentState.value) {
        const stateId = await initializeState()
        if (!stateId) {
          // No existing state found, create new one
          log('No existing state found, creating new')
          await saveState()
        }
      }

      // Load layout if exists
      if (currentState.value?.layout) {
        log('Loading layout from state')
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
        log('Layout loaded successfully')
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
      log('Layout changed, triggering auto-sync')
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
    fetchVersions,
    debug
  }
} 