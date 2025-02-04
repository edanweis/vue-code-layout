import type { AsyncData } from '#app'
import { useLayoutStore } from '../../../library/Composeable/createLayoutStore'
import type { LayoutState, LayoutStoreOptions } from '../../../library/types'

export interface UseNuxtLayoutOptions extends Omit<LayoutStoreOptions, 'stateId'> {
  /**
   * Unique identifier for the layout state
   * @default from module options or 'default'
   */
  stateId?: string
  /**
   * Whether to initialize immediately
   * @default true
   */
  immediate?: boolean
  /**
   * Transform the layout state before returning
   */
  transform?: (state: LayoutState) => LayoutState
}

/**
 * Composable for managing layout state in Nuxt applications
 */
export function useNuxtLayout(options: UseNuxtLayoutOptions = {}): AsyncData<LayoutState, Error> {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  const layoutStore = useLayoutStore()
  
  // Get stateId from options or module defaults
  const stateId = options.stateId || 
    config.public.vueCodeLayout?.defaultStateId || 
    'default'

  return useAsyncData<LayoutState>(
    `layout-${stateId}`,
    async () => {
      await layoutStore.initialize({
        ...options,
        stateId
      })

      const state = layoutStore.state
      return options.transform ? options.transform(state) : state
    },
    {
      server: true,
      lazy: false,
      immediate: options.immediate ?? true,
      watch: [() => layoutStore.state],
      transform: options.transform
    }
  )
}

/**
 * Save the current layout state
 */
export async function saveNuxtLayout(state: LayoutState, options: UseNuxtLayoutOptions = {}) {
  const layoutStore = useLayoutStore()
  const config = useRuntimeConfig()
  
  const stateId = options.stateId || 
    config.public.vueCodeLayout?.defaultStateId || 
    'default'

  await layoutStore.saveState(state, stateId)
} 