# Nuxt Integration

Vue Code Layout provides first-class support for Nuxt 3 applications through its Nuxt module. This integration provides SSR-friendly layout state management and auto-imports for a seamless development experience.

## Installation

1. Install the package:
```bash
npm install @edanweis/vue-code-layout
```

2. Add the module to your `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    // Module options
    defaultStateId: 'my-layout',
    autoImports: true
  }
})
```

## Usage

The module provides a `useNuxtLayout` composable that handles SSR, caching, and state management:

```vue
<script setup>
const { data: layout, pending, error, refresh } = useNuxtLayout({
  stateId: 'my-layout',
  // Optional Supabase integration
  supabase: useSupabaseClient(),
  // Additional data to store with layout
  additionalData: {
    theme: 'dark'
  }
})

// Save layout changes
const handleLayoutChange = async (newLayout) => {
  await saveNuxtLayout(newLayout, {
    stateId: 'my-layout'
  })
  refresh()
}
</script>

<template>
  <div>
    <div v-if="pending">Loading layout...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <template v-else>
      <CodeLayout 
        :layout="layout"
        @update:layout="handleLayoutChange"
      />
    </template>
  </div>
</template>
```

## Module Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultStateId` | `string` | `'default'` | Default stateId to use for layout persistence |
| `autoImports` | `boolean` | `true` | Enable auto-imports of composables |

## Composables

### useNuxtLayout

```ts
function useNuxtLayout(options?: UseNuxtLayoutOptions): AsyncData<LayoutState, Error>

interface UseNuxtLayoutOptions {
  stateId?: string
  immediate?: boolean
  transform?: (state: LayoutState) => LayoutState
  supabase?: SupabaseClient
  additionalData?: Record<string, any>
}
```

### saveNuxtLayout

```ts
function saveNuxtLayout(
  state: LayoutState, 
  options?: UseNuxtLayoutOptions
): Promise<void>
```

## TypeScript Support

The module includes full TypeScript support. Types are automatically added to your Nuxt project when you install the module. 