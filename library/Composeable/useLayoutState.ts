import { defineStore } from 'pinia'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CodeLayoutInstance } from '../CodeLayout'
import { onUnmounted } from 'vue'

export interface LayoutState {
  id: string
  state_id: string
  user_id: string
  layout: any
  created_at: string
  updated_at: string
}

export interface LayoutStateVersion {
  id: string
  state_id: string
  version_name: string
  layout: any
  created_at: string
  created_by: string
}

export interface UseLayoutStateOptions {
  supabase: SupabaseClient
  stateId: string
  layoutInstance: CodeLayoutInstance
  autoSync?: boolean
  onError?: (error: any) => void
}

export const useLayoutStateStore = defineStore('layoutState', {
  state: () => ({
    currentState: null as LayoutState | null,
    versions: [] as LayoutStateVersion[],
    isLoading: false,
    error: null as any
  }),
  
  actions: {
    async fetchCurrentState(supabase: SupabaseClient, stateId: string) {
      try {
        this.isLoading = true
        const { data, error } = await supabase
          .from('layout_states')
          .select('*')
          .eq('state_id', stateId)
          .single()

        if (error) throw error
        this.currentState = data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async saveState(supabase: SupabaseClient, stateId: string, layout: any) {
      try {
        this.isLoading = true
        const { data, error } = await supabase
          .from('layout_states')
          .upsert({
            state_id: stateId,
            layout,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        this.currentState = data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createVersion(supabase: SupabaseClient, stateId: string, versionName: string, layout: any) {
      try {
        this.isLoading = true
        const { data, error } = await supabase
          .from('layout_state_versions')
          .insert({
            state_id: stateId,
            version_name: versionName,
            layout
          })
          .select()
          .single()

        if (error) throw error
        this.versions = [...this.versions, data]
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchVersions(supabase: SupabaseClient, stateId: string) {
      try {
        this.isLoading = true
        const { data, error } = await supabase
          .from('layout_state_versions')
          .select('*')
          .eq('state_id', stateId)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.versions = data
      } catch (error) {
        this.error = error
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})

export function useLayoutState(options: UseLayoutStateOptions) {
  const { 
    supabase, 
    stateId, 
    layoutInstance, 
    autoSync = true,
    onError = console.error 
  } = options

  const store = useLayoutStateStore()

  // Load initial state
  const loadState = async () => {
    try {
      await store.fetchCurrentState(supabase, stateId)
      if (store.currentState?.layout) {
        layoutInstance.loadLayout(store.currentState.layout, (panel) => panel)
      }
    } catch (error) {
      onError(error)
    }
  }

  // Save current state
  const saveState = async () => {
    try {
      const layout = layoutInstance.saveLayout()
      await store.saveState(supabase, stateId, layout)
    } catch (error) {
      onError(error)
    }
  }

  // Create version
  const createVersion = async (versionName: string) => {
    try {
      const layout = layoutInstance.saveLayout()
      await store.createVersion(supabase, stateId, versionName, layout)
    } catch (error) {
      onError(error)
    }
  }

  // Load version
  const loadVersion = async (version: LayoutStateVersion) => {
    try {
      layoutInstance.loadLayout(version.layout, (panel) => panel)
    } catch (error) {
      onError(error)
    }
  }

  // Auto-sync setup
  let unsubscribe: (() => void) | undefined
  
  if (autoSync) {
    // Initial load
    loadState()
    
    // Setup auto-save on layout changes
    let saveTimeout: NodeJS.Timeout | undefined
    
    unsubscribe = layoutInstance.onLayoutChange(() => {
      // Debounce save operations to prevent too many API calls
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      
      saveTimeout = setTimeout(() => {
        saveState()
      }, 1000) // Save after 1 second of no changes
    })
  }

  // Cleanup function
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })

  return {
    store,
    loadState,
    saveState,
    createVersion,
    loadVersion
  }
} 