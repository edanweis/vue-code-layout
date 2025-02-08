<template>
  <div class="layout-container">
    <nav class="nav-menu">
      <router-link to="/" class="nav-link">Vue Code Layout</router-link>
      <router-link to="/" class="nav-link">Base Layout</router-link>
      <router-link to="/SplitLayout" class="nav-link">Split Layout</router-link>
      <router-link to="/DataSaveAndLoad" class="nav-link">Load and Save</router-link>
      <router-link to="/advanced-layout-store" class="nav-link">Advanced Store</router-link>
    </nav>

    <div class="toolbar">
      <div class="toolbar-section">
        <button @click="addNewPanel" :disabled="loading">
          <i-solar-add-circle-line-duotone class="icon" />
          Add Panel
        </button>
        <button @click="clearLayout" :disabled="loading">
          <i-solar-restart-line-duotone class="icon" />
          Reset Layout
        </button>
      </div>

      <div class="toolbar-section">
        <button @click="saveVersion" :disabled="loading || !hasChanges">
          <i-solar-bookmark-save-line-duotone class="icon" />
          Save Version
        </button>
        <select v-model="selectedVersion" :disabled="loading || !versions.length">
          <option value="">Current Layout</option>
          <option v-for="version in versions" :key="version.id" :value="version">
            {{ version.version_name }} ({{ formatDate(version.created_at) }})
          </option>
        </select>
        <button @click="loadVersion" :disabled="loading || !selectedVersion">
          <i-solar-restart-square-line-duotone class="icon" />
          Load Version
        </button>
      </div>

      <div class="toolbar-section">
        <div class="status" :class="status">{{ status }}</div>
      </div>
    </div>

    <div class="layout-wrapper">
      <SplitLayout 
        ref="splitLayoutRef" 
        @panel-active="onPanelActive"
        @panel-close="onPanelClose"
        @panel-drop="onPanelDrop"
      >
        <template #tabContentRender="{ panel }">
          <div class="panel-content" :style="{ backgroundColor: getPanelColor(panel.name) }">
            <h3>{{ panel.title }}</h3>
            <div class="panel-body">
              <p>{{ panel.data.content }}</p>
              <div class="panel-metadata">
                <span>Created: {{ formatDate(panel.data.createdAt) }}</span>
                <span>Type: {{ panel.data.metadata.type }}</span>
                <span>Version: {{ panel.data.metadata.version }}</span>
              </div>
            </div>
          </div>
        </template>
      </SplitLayout>
    </div>

    <div v-if="activePanel" class="panel-info">
      <h3>Active Panel Info</h3>
      <pre>{{ JSON.stringify(activePanel.data, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useLayoutStore } from '../../library'
import type { 
  CodeLayoutSplitNInstance, 
  CodeLayoutSplitNPanelInternal,
  LayoutPersistenceVersion
} from '../../library'

// Create refs and state
const splitLayoutRef = ref<CodeLayoutSplitNInstance>()
const layoutStore = useLayoutStore()
const activePanel = ref<CodeLayoutSplitNPanelInternal | null>(null)
const selectedVersion = ref<LayoutPersistenceVersion | null>(null)
const versions = ref<LayoutPersistenceVersion[]>([])
const status = ref('idle')
const loading = ref(false)
const hasChanges = ref(false)
let panelCount = 0

// Local storage keys
const STORAGE_KEY = 'vue-code-layout-demo'
const VERSIONS_KEY = 'vue-code-layout-demo-versions'

// Initialize layout store
onMounted(async () => {
  if (!splitLayoutRef.value) return
  
  // Set up the layout instance
  layoutStore.setLayoutInstance(splitLayoutRef.value)
  
  try {
    loading.value = true
    
    // Load initial state from local storage
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      const state = JSON.parse(savedState)
      splitLayoutRef.value.loadLayout(state)
    }
    
    // Load versions from local storage
    const savedVersions = localStorage.getItem(VERSIONS_KEY)
    if (savedVersions) {
      versions.value = JSON.parse(savedVersions)
    }
    
    status.value = 'loaded'
  } catch (error) {
    console.error('Failed to initialize layout:', error)
    status.value = 'error'
  } finally {
    loading.value = false
  }
})

// Panel management
const addNewPanel = async () => {
  if (!splitLayoutRef.value) return
  
  panelCount++
  const panel = {
    name: `panel-${panelCount}`,
    title: `Panel ${panelCount}`,
    tooltip: `This is panel ${panelCount}`,
    data: {
      content: `Content for panel ${panelCount}`,
      createdAt: new Date().toISOString(),
      metadata: {
        type: 'example',
        version: '1.0'
      }
    },
    onClose: (panel) => {
      console.log(`Panel ${panel.name} closed`);
      hasChanges.value = true;
      saveState();
      return Promise.resolve();
    }
  }
  
  splitLayoutRef.value.addPanelToActiveGrid(panel, true)
  hasChanges.value = true
  saveState()
}

const clearLayout = async () => {
  try {
    loading.value = true
    splitLayoutRef.value?.clearLayout({ leaveEmptyGrid: true })
    panelCount = 0
    hasChanges.value = false
    saveState()
  } finally {
    loading.value = false
  }
}

// Save current state to local storage
const saveState = () => {
  try {
    status.value = 'saving'
    const state = splitLayoutRef.value?.saveLayout()
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
    status.value = 'saved'
  } catch (error) {
    console.error('Failed to save state:', error)
    status.value = 'error'
  }
}

// Version management
const fetchVersions = async () => {
  const savedVersions = localStorage.getItem(VERSIONS_KEY)
  if (savedVersions) {
    versions.value = JSON.parse(savedVersions)
  }
}

const saveVersion = async () => {
  try {
    loading.value = true
    const versionName = `Version ${versions.value.length + 1}`
    const newVersion = {
      id: crypto.randomUUID(),
      version_name: versionName,
      layout: splitLayoutRef.value?.saveLayout(),
      created_at: new Date().toISOString()
    }
    versions.value = [newVersion, ...versions.value]
    localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions.value))
    status.value = 'saved'
  } finally {
    loading.value = false
  }
}

const loadVersion = async () => {
  if (!selectedVersion.value || !splitLayoutRef.value) return
  
  try {
    loading.value = true
    splitLayoutRef.value.loadLayout(selectedVersion.value.layout)
    hasChanges.value = false
    status.value = 'loaded'
  } finally {
    loading.value = false
  }
}

// Event handlers
const onPanelActive = (oldPanel: CodeLayoutSplitNPanelInternal | null, newPanel: CodeLayoutSplitNPanelInternal) => {
  activePanel.value = newPanel
}

const onPanelClose = async (panel: CodeLayoutSplitNPanelInternal) => {
  hasChanges.value = true
  saveState()
  return Promise.resolve() // Allow panel to close
}

const onPanelDrop = () => {
  hasChanges.value = true
  saveState()
}

// Utilities
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const getPanelColor = (panelName: string) => {
  // Generate a consistent pastel color based on the panel name
  const hash = panelName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use the hash to generate HSL color with high lightness for pastel effect
  const h = hash % 360;
  return `hsl(${h}, 40%, 95%)`;
}

// Clean up
onBeforeUnmount(() => {
  if (hasChanges.value) {
    saveState()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--vt-c-white);
  color: var(--vt-c-text-1);
}

.toolbar {
  padding: 1rem;
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid var(--vt-c-divider-light);
  background: var(--vt-c-white-soft);
}

.toolbar-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.layout-wrapper {
  flex: 1;
  min-height: 0;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--vt-c-divider-light);
  border-radius: 6px;
  background: var(--vt-c-white);
  color: var(--vt-c-text-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background: var(--vt-c-white-mute);
  border-color: var(--vt-c-divider);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon {
  width: 1.2em;
  height: 1.2em;
}

select {
  padding: 0.5rem;
  border: 1px solid var(--vt-c-divider-light);
  border-radius: 6px;
  background: var(--vt-c-white);
  color: var(--vt-c-text-1);
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status.saving { background: #fff3dc; color: #946800; }
.status.saved { background: #dcfce7; color: #166534; }
.status.loading { background: #e0f2fe; color: #075985; }
.status.error { background: #fee2e2; color: #991b1b; }
.status.idle { background: #f3f4f6; color: #374151; }

.panel-info {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 1rem;
  background: var(--vt-c-white);
  border: 1px solid var(--vt-c-divider-light);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  max-width: 300px;
  max-height: 400px;
  overflow: auto;
}

.panel-info h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.panel-info pre {
  margin: 0;
  font-size: 0.875rem;
  white-space: pre-wrap;
}

.nav-menu {
  padding: 1rem;
  display: flex;
  gap: 1.5rem;
  background: var(--vt-c-white-soft);
  border-bottom: 1px solid var(--vt-c-divider-light);
}

.nav-link {
  color: var(--vt-c-text-2);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--vt-c-text-1);
}

.nav-link.router-link-active {
  color: var(--vt-c-text-1);
  font-weight: 500;
}

.panel-content {
  height: 100%;
  padding: 1rem;
  overflow: auto;
}

.panel-content h3 {
  margin: 0 0 1rem 0;
  color: var(--vt-c-text-1);
  font-size: 1.1rem;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-body p {
  margin: 0;
  color: var(--vt-c-text-2);
  line-height: 1.5;
}

.panel-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--vt-c-text-2);
}

.panel-metadata span {
  display: inline-block;
}
</style> 