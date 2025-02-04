import type { LayoutState } from '../../../library/types'
import type { ModuleOptions } from '../../module'

export interface UseNuxtLayoutOptions extends Partial<ModuleOptions> {
  /**
   * Whether to initialize immediately
   * @default true
   */
  immediate?: boolean
}

/**
 * Composable for managing layout state in Nuxt applications
 */
export function useNuxtLayout(options: UseNuxtLayoutOptions = {}) {
  // These will be auto-imported by Nuxt
  const { useAsyncData } = useNuxtApp()
  const config = useRuntimeConfig()
  const layoutStore = useLayoutStore()
  
  // Get stateId from options or module defaults
  const vueCodeLayout = (config.public?.vueCodeLayout || {}) as ModuleOptions
  const stateId = options.defaultStateId || 
    vueCodeLayout.defaultStateId || 
    'default'

  return useAsyncData(
    `layout-${stateId}`,
    async () => {
      await layoutStore.initialize({
        stateId
      })
      return layoutStore.state as LayoutState
    },
    {
      immediate: options.immediate ?? true
    }
  )
}

/**
 * Save the current layout state
 */
export async function saveNuxtLayout(state: LayoutState, options: UseNuxtLayoutOptions = {}) {
  const config = useRuntimeConfig()
  const layoutStore = useLayoutStore()
  
  const vueCodeLayout = (config.public?.vueCodeLayout || {}) as ModuleOptions
  const stateId = options.defaultStateId || 
    vueCodeLayout.defaultStateId || 
    'default'

  await layoutStore.saveState(state)
} 