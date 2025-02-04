import { defineNuxtPlugin } from '#app'
import VueCodeLayout from '../../library'
import type { ModuleOptions } from '../module'

export default defineNuxtPlugin((nuxtApp) => {
  const options = useRuntimeConfig().public.vueCodeLayout as ModuleOptions
  
  // Register Vue plugin
  nuxtApp.vueApp.use(VueCodeLayout)

  return {
    provide: {
      vueCodeLayout: {
        options
      }
    }
  }
}) 