import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import type { Plugin } from 'vue'
import VueCodeLayout from '../../library'
import type { ModuleOptions } from '../module'

export default defineNuxtPlugin((nuxtApp) => {
  try {
    // Register Vue plugin
    nuxtApp.vueApp.use(VueCodeLayout as Plugin)

    // Get module options from runtime config
    const config = useRuntimeConfig()
    const options = (config.public?.vueCodeLayout || {}) as ModuleOptions

    return {
      provide: {
        vueCodeLayout: {
          options
        }
      }
    }
  } catch (error) {
    console.error('Error initializing vue-code-layout:', error)
    throw error
  }
}) 