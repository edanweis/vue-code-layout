import { useAsyncData, useRuntimeConfig } from '#app'
import { useLayoutStore } from '#imports'
import type { LayoutState } from '../../../library/types'
import type { ModuleOptions } from '../../module'

export interface UseNuxtLayoutOptions extends Partial<ModuleOptions> {
  /**
   * Whether to initialize immediately
   * @default true
   */
  immediate?: boolean
}

interface VueCodeLayoutConfig {
  defaultStateId?: string
  [key: string]: any
}

/**
 * Composable for managing layout state in Nuxt applications
 */
export function useNuxtLayout(options: UseNuxtLayoutOptions = {}) {
  const config = useRuntimeConfig()
  const layoutStore = useLayoutStore()
  
  // Get stateId from options or module defaults
  const vueCodeLayout = (config.public?.vueCodeLayout || {}) as VueCodeLayoutConfig
  const stateId = options.defaultStateId || 
    vueCodeLayout.defaultStateId || 
    'default'

  return useAsyncData<LayoutState>(
    `layout-${stateId}`,
    async () => {
      await layoutStore.initialize({
        stateId
      })
      return layoutStore.state
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
  
  const vueCodeLayout = (config.public?.vueCodeLayout || {}) as VueCodeLayoutConfig
  const stateId = options.defaultStateId || 
    vueCodeLayout.defaultStateId || 
    'default'

  await layoutStore.saveState(state)
} 