import { defineNuxtModule, addImportsDir, createResolver, addPlugin } from '@nuxt/kit'
import { name, version } from '../package.json'

export interface ModuleOptions {
  /**
   * Default stateId to use for layout persistence
   */
  defaultStateId?: string
  /**
   * Enable auto-imports of composables
   */
  autoImports?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'vueCodeLayout',
    compatibility: {
      nuxt: '^3.0.0'
    }
  },
  defaults: {
    defaultStateId: 'default',
    autoImports: true
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add composables auto-imports
    if (options.autoImports) {
      addImportsDir(resolver.resolve('./runtime/composables'))
    }

    // Add plugin for Vue plugin registration
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Inject module options
    nuxt.options.runtimeConfig.public.vueCodeLayout = options

    // Add types
    nuxt.hook('prepare:types', ({ references }) => {
      references.push({ types: '@edanweis/vue-code-layout/nuxt' })
    })
  }
})

declare module '@nuxt/schema' {
  interface ConfigSchema {
    publicRuntimeConfig?: {
      vueCodeLayout?: ModuleOptions
    }
  }
} 