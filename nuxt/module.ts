import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
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
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Add components
    nuxt.hook('components:dirs', (dirs) => {
      dirs.push({
        path: resolver.resolve('../library'),
        prefix: ''
      })
    })

    // Add composables
    nuxt.hook('imports:dirs', (dirs) => {
      dirs.push(resolver.resolve('./runtime/composables'))
    })

    // Add CSS
    nuxt.options.css.push('@edanweis/vue-code-layout/style.css')

    // Make options available in runtime config
    nuxt.options.runtimeConfig.public.vueCodeLayout = options
  }
}) 