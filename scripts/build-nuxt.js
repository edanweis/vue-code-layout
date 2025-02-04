const { build } = require('esbuild')
const { resolve } = require('path')
const { copyFileSync, mkdirSync, writeFileSync } = require('fs')

async function buildNuxtModule() {
  // Ensure directories exist
  mkdirSync(resolve(__dirname, '../lib/nuxt/types'), { recursive: true })
  mkdirSync(resolve(__dirname, '../lib/composables'), { recursive: true })

  // Build Nuxt module
  await build({
    entryPoints: [resolve(__dirname, '../nuxt/module.ts')],
    outfile: resolve(__dirname, '../lib/nuxt/module.mjs'),
    format: 'esm',
    platform: 'node',
    target: 'node14',
    bundle: true,
    external: ['@nuxt/kit', 'vue', 'pinia', '@vueuse/core'],
  })

  // Build composables
  await build({
    entryPoints: [resolve(__dirname, '../nuxt/runtime/composables/index.ts')],
    outfile: resolve(__dirname, '../lib/composables/index.mjs'),
    format: 'esm',
    platform: 'neutral',
    target: ['chrome91', 'firefox90', 'safari14', 'edge91'],
    bundle: true,
    external: ['vue', 'pinia', '@vueuse/core', '#app', '#imports'],
  })

  // Create type definitions
  const typeContent = `
import type { RuntimeConfig } from '@nuxt/schema'
import type { Ref } from 'vue'
import type { LayoutState } from '../types'

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
`

  writeFileSync(
    resolve(__dirname, '../lib/nuxt/types/index.d.ts'),
    typeContent
  )
}

buildNuxtModule().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
}) 