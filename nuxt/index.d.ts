import { ModuleOptions } from './module'
import { UseNuxtLayoutOptions } from './runtime/composables/useNuxtLayout'
import type { LayoutState } from '../library/types'

declare module '#app' {
  interface NuxtApp {
    $vueCodeLayout: {
      options: ModuleOptions
    }
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $vueCodeLayout: {
      options: ModuleOptions
    }
  }
}

export { ModuleOptions, UseNuxtLayoutOptions, LayoutState }
export * from './runtime/composables/useNuxtLayout' 