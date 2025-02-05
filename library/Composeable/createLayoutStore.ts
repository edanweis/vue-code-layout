import { inject, ref, type App } from 'vue'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useLayoutPersistence } from './useLayoutPersistence'
import type { LayoutPersistenceState, LayoutPersistenceVersion, UseLayoutPersistenceOptions } from './useLayoutPersistence'

const LAYOUT_STORE_KEY = Symbol('layout-store')

export interface LayoutStoreEvents {
  onBeforeSave?: () => void | Promise<void>
  onAfterSave?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeLoad?: () => void | Promise<void>
  onAfterLoad?: (state: LayoutPersistenceState) => void | Promise<void>
  onBeforeCreateVersion?: () => void | Promise<void>
  onAfterCreateVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onBeforeLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onAfterLoadVersion?: (version: LayoutPersistenceVersion) => void | Promise<void>
  onError?: (error: any) => void | Promise<void>
}

export interface LayoutStoreInitOptions extends Omit<UseLayoutPersistenceOptions, 'layoutInstance'> {
  events?: LayoutStoreEvents
}

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
  let events: LayoutStoreEvents = {}

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

      // Store events for later use
      events = options.events || {}
      
      persistenceInstance = useLayoutPersistence({
        ...options,
        layoutInstance: layoutInstance.value,
        onError: async (error) => {
          options.onError?.(error)
          await events.onError?.(error)
        },
        onBeforeSave: events.onBeforeSave,
        onAfterSave: events.onAfterSave,
        onBeforeLoad: events.onBeforeLoad,
        onAfterLoad: events.onAfterLoad,
        onBeforeCreateVersion: events.onBeforeCreateVersion,
        onAfterCreateVersion: events.onAfterCreateVersion,
        onBeforeLoadVersion: events.onBeforeLoadVersion,
        onAfterLoadVersion: events.onAfterLoadVersion
      })

      // Copy all the methods and state from the persistence instance
      store.currentState = persistenceInstance.currentState
      store.versions = persistenceInstance.versions
      store.isLoading = persistenceInstance.isLoading
      store.error = persistenceInstance.error
      
      // Wrap methods with events
      store.loadState = async () => {
        await events.onBeforeLoad?.()
        await persistenceInstance!.loadState()
        if (store.currentState.value) {
          await events.onAfterLoad?.(store.currentState.value)
        }
      }

      store.saveState = async () => {
        await events.onBeforeSave?.()
        const result = await persistenceInstance!.saveState()
        await events.onAfterSave?.(result)
        return result
      }

      store.createVersion = async (versionName: string) => {
        await events.onBeforeCreateVersion?.()
        await persistenceInstance!.createVersion(versionName)
        const latestVersion = persistenceInstance!.versions.value[0]
        if (latestVersion) {
          await events.onAfterCreateVersion?.(latestVersion)
        }
      }

      store.loadVersion = async (version: LayoutPersistenceVersion) => {
        await events.onBeforeLoadVersion?.(version)
        await persistenceInstance!.loadVersion(version)
        await events.onAfterLoadVersion?.(version)
      }

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