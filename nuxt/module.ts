import { defineNuxtModule, addPlugin, createResolver, addImports } from '@nuxt/kit'
import { name, version } from '../package.json'

export interface ModuleOptions {
  /**
   * Default stateId to use for layout persistence
   * @default 'default'
   */
  defaultStateId?: string
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
    defaultStateId: 'default'
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add plugin
    addPlugin({
      src: resolver.resolve('./runtime/plugin'),
      mode: 'client'
    })

    // Add composables
    addImports([
      {
        name: 'useNuxtLayout',
        as: 'useNuxtLayout',
        from: resolver.resolve('./runtime/composables')
      },
      {
        name: 'saveNuxtLayout',
        as: 'saveNuxtLayout',
        from: resolver.resolve('./runtime/composables')
      }
    ])

    // Add components
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: resolver.resolve('../library'),
        prefix: ''
      })
    })

    // Add CSS
    nuxt.options.css.push('@edanweis/vue-code-layout/style.css')

    // Make options available in runtime config
    nuxt.options.runtimeConfig.public.vueCodeLayout = options
  }
}) 