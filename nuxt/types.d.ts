declare module '#app' {
  import type { RuntimeConfig } from '@nuxt/schema'
  import type { Plugin, App } from 'vue'
  
  export const useRuntimeConfig: () => RuntimeConfig
  export const useAsyncData: <T>(...args: any[]) => Promise<T>
  export const defineNuxtPlugin: (plugin: (nuxtApp: { vueApp: App } & any) => any) => Plugin
}

declare module '#imports' {
  import type { Ref } from 'vue'
  import type { LayoutState } from '../library/types'
  
  export const useLayoutStore: () => {
    state: Ref<LayoutState>
    initialize: (options: { stateId: string }) => Promise<void>
    saveState: (state: LayoutState) => Promise<void>
    [key: string]: any
  }
}

declare module '../library/types' {
  export interface LayoutState {
    [key: string]: any
  }
} 