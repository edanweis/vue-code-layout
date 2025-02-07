<template>
  <div class="layout-container">
    <div class="controls">
      <button @click="addNewPanel">Add Panel</button>
      <button @click="clearLayout">Clear Layout</button>
    </div>

    <SplitLayout ref="splitLayoutRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLayout } from '../../library'
import type { CodeLayoutSplitNPanelInternal } from '../../library'

// Create refs
const splitLayoutRef = ref()
let panelCount = 0

// Initialize layout
const layout = useLayout()

// Set up the layout instance once the component is mounted
onMounted(() => {
  layout.setLayoutRef(splitLayoutRef)
})

// Add a new panel to the active grid
const addNewPanel = () => {
  panelCount++
  layout.addPanel({
    name: `panel-${panelCount}`,
    title: `Panel ${panelCount}`,
    tooltip: `This is panel ${panelCount}`,
    data: {
      content: `Content for panel ${panelCount}`,
      createdAt: new Date().toISOString()
    }
  }, true) // Make it active
}

// Clear the entire layout
const clearLayout = () => {
  layout.clearLayout()
  panelCount = 0
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.controls {
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #f0f0f0;
}
</style> 