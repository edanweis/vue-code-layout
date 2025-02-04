import type { RuntimeConfig } from '@nuxt/schema'
import type { Ref } from 'vue'
import type { LayoutState } from '../../library/types'

declare global {
  const useRuntimeConfig: () => RuntimeConfig
  const useNuxtApp: () => any
  const useLayoutStore: () => {
    state: Ref<LayoutState>
    initialize: (options: { stateId: string }) => Promise<void>
    saveState: (state: LayoutState) => Promise<void>
  }
  const useAsyncData: <T>(...args: any[]) => Promise<T>
}

export {} 