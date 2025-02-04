# vue-code-layout

> This is a fork of the original vue-code-layout that adds built-in state persistence with Pinia and optional Supabase integration. You can use it to automatically save and restore layout states across sessions.

A Vue editor layout component that like VSCode and can be used to develop web editors.

![screenshot](https://raw.githubusercontent.com/edanweis/vue-code-layout/master/screenshot/first.jpg)

---

English | [中文](./README.CN.md)

## Features

* Simple and easy to use, small size
* Support adding panels
* Support drag and drop panel
* Support customize panel icons, text, rendering, etc
* Supports VSCode outer layout and inner editor area layout
* Support saving and loading data
* Support defining CSS styles
* Built-in state persistence with Pinia (optional)
* Optional Supabase integration for cloud storage
* Layout persistence with versioning (using Supabase)
* First-class Nuxt 3 support with SSR-friendly state management

## Installation

```bash
# For Vue.js
npm install @edanweis/vue-code-layout

# For Nuxt 3
npm install @edanweis/vue-code-layout
```

## Usage

### Vue.js Setup

```js
// main.ts or main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueCodeLayout from '@edanweis/vue-code-layout'
import '@edanweis/vue-code-layout/style.css'

const app = createApp(App)
app.use(createPinia()) // Required for state persistence
app.use(VueCodeLayout)
app.mount('#app')
```

### Nuxt 3 Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    defaultStateId: 'default' // Optional: Set a default state ID
  }
})
```

### Basic Usage

```vue
<template>
  <code-layout
    v-model="layoutState"
    @change="handleLayoutChange"
  >
    <template #left>
      <!-- Left panel content -->
    </template>
    <template #right>
      <!-- Right panel content -->
    </template>
    <template #bottom>
      <!-- Bottom panel content -->
    </template>
  </code-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { LayoutState } from '@edanweis/vue-code-layout'

const layoutState = ref<LayoutState>({
  panels: {
    left: { size: 200 },
    right: { size: 300 },
    bottom: { size: 200 }
  }
})

const handleLayoutChange = (newState: LayoutState) => {
  // Handle layout changes
  console.log('Layout changed:', newState)
}
</script>
```

### Using with Nuxt 3

The Nuxt module provides automatic component registration and composables for managing layout state:

```vue
<script setup lang="ts">
// Use the built-in composable for state management
const { data: layoutState } = useNuxtLayout({
  defaultStateId: 'my-layout', // Optional: Unique ID for this layout instance
  immediate: true // Optional: Load state immediately (default: true)
})

// Save layout state when needed
const handleLayoutChange = async (newState) => {
  await saveNuxtLayout(newState)
}
</script>

<template>
  <code-layout
    v-if="layoutState"
    v-model="layoutState"
    @change="handleLayoutChange"
  >
    <!-- Your layout content -->
  </code-layout>
</template>
```

### Supabase Integration (Optional)

To enable cloud storage with Supabase:

```ts
// Initialize with Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Vue.js
app.use(VueCodeLayout, {
  supabase,
  defaultStateId: 'my-layout'
})

// Nuxt 3
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    },
    defaultStateId: 'my-layout'
  }
})
```

### TypeScript Support

When using TypeScript, you can extend the types:

```typescript
declare module '@edanweis/vue-code-layout' {
  interface LayoutStoreOptions {
    supabase?: any;
    stateId?: string;
    additionalData?: Record<string, any>;
  }
}
```

## API Reference

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| v-model | `LayoutState` | `{}` | Layout state object |
| defaultStateId | `string` | `'default'` | Unique identifier for the layout state |
| immediate | `boolean` | `true` | Whether to load state immediately |

### Events

| Name | Parameters | Description |
|------|------------|-------------|
| change | `(state: LayoutState)` | Emitted when layout changes |
| initialized | `(state: LayoutState)` | Emitted when layout is initialized |

### Slots

| Name | Description |
|------|-------------|
| left | Left panel content |
| right | Right panel content |
| bottom | Bottom panel content |
| default | Main content area |

## License

[MIT](./LICENSE)
