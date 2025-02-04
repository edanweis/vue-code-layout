import { inject, ref, type App } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLayoutPersistence } from './useLayoutPersistence'
import type { LayoutPersistenceState, LayoutPersistenceVersion, UseLayoutPersistenceOptions } from './useLayoutPersistence'

const LAYOUT_STORE_KEY = Symbol('layout-store')

export interface LayoutStoreInitOptions extends Omit<UseLayoutPersistenceOptions, 'layoutInstance'> {}

export interface LayoutStore {
  initialize: (options: LayoutStoreInitOptions) => Promise<void>
  setLayoutInstance: (instance: any) => void
  currentState: ReturnType<typeof useLayoutPersistence>['currentState']
  versions: ReturnType<typeof useLayoutPersistence>['versions']
  isLoading: ReturnType<typeof useLayoutPersistence>['isLoading']
  error: ReturnType<typeof useLayoutPersistence>['error']
  loadState: ReturnType<typeof useLayoutPersistence>['loadState']
  saveState: ReturnType<typeof useLayoutPersistence>['saveState']
  createVersion: ReturnType<typeof useLayoutPersistence>['createVersion']
  loadVersion: ReturnType<typeof useLayoutPersistence>['loadVersion']
  fetchVersions: ReturnType<typeof useLayoutPersistence>['fetchVersions']
}

export function createLayoutStore() {
  let persistenceInstance: ReturnType<typeof useLayoutPersistence> | null = null
  const layoutInstance = ref<any>(null)
  const isInitialized = ref(false)

  const throwIfNotInitialized = () => {
    if (!isInitialized.value) {
      throw new Error('[vue-code-layout] Store not initialized. Call initialize first.')
    }
  }

  const store: LayoutStore = {
    initialize: async (options) => {
      if (!layoutInstance.value) {
        throw new Error('[vue-code-layout] Layout instance not set. Call setLayoutInstance before initializing.')
      }
      
      persistenceInstance = useLayoutPersistence({
        ...options,
        layoutInstance: layoutInstance.value
      })

      // Copy all the methods and state from the persistence instance
      store.currentState = persistenceInstance.currentState
      store.versions = persistenceInstance.versions
      store.isLoading = persistenceInstance.isLoading
      store.error = persistenceInstance.error
      store.loadState = persistenceInstance.loadState
      store.saveState = persistenceInstance.saveState
      store.createVersion = persistenceInstance.createVersion
      store.loadVersion = persistenceInstance.loadVersion
      store.fetchVersions = persistenceInstance.fetchVersions

      isInitialized.value = true

      // Load initial state
      await store.loadState()
    },

    setLayoutInstance: (instance) => {
      if (isInitialized.value) {
        throw new Error('[vue-code-layout] Cannot set layout instance after initialization.')
      }
      layoutInstance.value = instance
    },

    // Initialize with empty refs and no-op functions that throw
    currentState: ref<LayoutPersistenceState | null>(null),
    versions: ref<LayoutPersistenceVersion[]>([]),
    isLoading: ref(false),
    error: ref(null),
    loadState: async () => {
      throwIfNotInitialized()
      return null as any // This will be replaced during initialization
    },
    saveState: async () => {
      throwIfNotInitialized()
      return null as any // This will be replaced during initialization
    },
    createVersion: async () => {
      throwIfNotInitialized()
      return null as any // This will be replaced during initialization
    },
    loadVersion: async () => {
      throwIfNotInitialized()
      return null as any // This will be replaced during initialization
    },
    fetchVersions: async () => {
      throwIfNotInitialized()
      return null as any // This will be replaced during initialization
    }
  }

  return {
    install(app: App) {
      app.provide(LAYOUT_STORE_KEY, store)
    }
  }
}

export function useLayoutStore(): LayoutStore {
  const store = inject<LayoutStore>(LAYOUT_STORE_KEY)
  if (!store) {
    throw new Error('[vue-code-layout] Layout store not found. Did you install the plugin?')
  }
  return store
} 