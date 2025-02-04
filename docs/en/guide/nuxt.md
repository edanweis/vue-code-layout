# Nuxt Integration

The vue-code-layout library provides first-class support for Nuxt 3 applications with SSR-friendly state management and automatic component registration.

## Installation

1. Install the package:
```bash
npm install @edanweis/vue-code-layout
```

2. Add the module to your `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt']
})
```

## Usage

The Nuxt module provides a `useNuxtLayout` composable for managing layout state:

```vue
<script setup lang="ts">
const { layoutState, saveLayout } = useNuxtLayout({
  stateId: 'my-layout', // Unique ID for this layout instance
  // Additional options...
})

// Save layout state when needed
const handleLayoutChange = () => {
  saveLayout()
}
</script>

<template>
  <code-layout
    v-model="layoutState"
    @change="handleLayoutChange"
  >
    <!-- Your layout content -->
  </code-layout>
</template>
```

### Configuration Options

The `useNuxtLayout` composable accepts the following options:

```ts
interface UseNuxtLayoutOptions {
  stateId?: string;           // Unique identifier for this layout instance
  autoSave?: boolean;         // Automatically save state on changes
  initialState?: LayoutState; // Initial layout state
  // ... additional options inherited from ModuleOptions
}
```

### State Management

The layout state is automatically persisted using Nuxt's built-in state management. You can customize the storage behavior through the module options in your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    // Module options
    stateStorage: 'localStorage', // or 'sessionStorage', 'supabase'
    supabase: {
      // Supabase configuration if using cloud storage
    }
  }
})
```

### SSR Considerations

The module is designed to work seamlessly with SSR. The layout state is properly hydrated on the client side, and all components are automatically registered globally.

### TypeScript Support

The module includes TypeScript definitions for the composable and configuration options. You can extend the types as needed:

```ts
declare module '@edanweis/vue-code-layout' {
  interface UseNuxtLayoutOptions {
    // Add custom options
  }
}
```

### Examples

#### Basic Usage with Auto-save

```vue
<script setup lang="ts">
const { layoutState } = useNuxtLayout({
  stateId: 'editor-layout',
  autoSave: true
})
</script>

<template>
  <code-layout v-model="layoutState">
    <template #left>
      <!-- Left panel content -->
    </template>
    <template #main>
      <!-- Main content -->
    </template>
    <template #right>
      <!-- Right panel content -->
    </template>
  </code-layout>
</template>
```

#### Custom State Management

```vue
<script setup lang="ts">
const { layoutState, saveLayout, resetLayout } = useNuxtLayout({
  stateId: 'custom-layout',
  initialState: {
    // Your initial layout configuration
  }
})

// Save layout state manually
const handleLayoutChange = () => {
  saveLayout()
}

// Reset layout to initial state
const handleReset = () => {
  resetLayout()
}
</script>
```

#### Using with Supabase

If you're using Supabase for cloud storage:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@edanweis/vue-code-layout/nuxt'],
  vueCodeLayout: {
    stateStorage: 'supabase',
    supabase: {
      // Your Supabase configuration
    }
  }
})
```

Then in your component:

```vue
<script setup lang="ts">
const { layoutState, saveLayout } = useNuxtLayout({
  stateId: 'cloud-layout'
})

// Layout state will be automatically synced with Supabase
</script>
```

## API Reference

### useNuxtLayout Composable

Returns:
- `layoutState`: Reactive layout state
- `saveLayout`: Function to manually save the current layout state
- `resetLayout`: Function to reset the layout to its initial state
- `isLoading`: Boolean ref indicating if state is being loaded/saved

### Module Options

Available options in `nuxt.config.ts`:

```ts
interface ModuleOptions {
  stateStorage?: 'localStorage' | 'sessionStorage' | 'supabase';
  supabase?: {
    // Supabase configuration options
  };
  // Additional module options
}
``` 