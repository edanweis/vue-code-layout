<template>
  <div class="full-container demo">
    <div class="title-bar-extra">
      <button @click="handleSaveState" class="action-button" :disabled="!auth.isLoggedIn.value">Save State</button>
      <button @click="handleCreateVersion" class="action-button" :disabled="!auth.isLoggedIn.value">Create Version</button>
      
      <div class="version-selector">
        <select 
          v-model="selectedVersion" 
          class="version-select" 
          :disabled="!auth.isLoggedIn.value || !versions.length"
        >
          <option :value="null">{{ versions.length ? 'Select Version' : 'No versions saved' }}</option>
          <option v-for="version in versions" :key="version.id" :value="version">
            {{ formatVersionName(version) }}
          </option>
        </select>
        <button 
          v-if="selectedVersion" 
          @click="handleLoadVersion" 
          class="action-button load-version-button" 
          :disabled="!auth.isLoggedIn.value"
        >
          Load Version
        </button>
        <button 
          v-if="selectedVersion" 
          @click="handleLoadVersionGrid" 
          class="action-button load-version-button" 
          :disabled="!auth.isLoggedIn.value"
        >
          Load Version (Grid)
        </button>
        <span v-if="selectedVersion" class="version-info">
          Created: {{ formatDate(selectedVersion.created_at) }}
        </span>
      </div>

      <button @click="onResetAll" class="action-button">Reset Layout</button>
      <button @click="showData = !showData" class="action-button">{{ showData ? 'Hide' : 'Show' }} Debug</button>
      <button 
        @click="debug = !debug" 
        class="action-button debug-toggle" 
        :class="{ active: debug }"
      >
        {{ debug ? '🔊 Debug On' : '🔇 Debug Off' }}
      </button>
    </div>

    <SplitLayout
      ref="splitLayoutRef"
      :layoutConfig="config"
      
      @update:lastActive="onLastActiveChange"
      @panelClose="onPanelClose"
      @panelDrop="onPanelDrop"
      @panelActive="onPanelActive"
      @panelContextMenu="onPanelMenu"
      @gridActive="onGridActive"
      @layout-change="handleLayoutChange"
    >
      <template #tabContentRender="{ panel }">
        <div class="panel-content" :style="{ backgroundColor: panel.data?.color }">
          <h2>Grid {{ panel.name }} {{ (panel.parentGroup as CodeLayoutSplitNGridInternal).direction }}</h2>
          <div class="panel-stats">
            <p>Created: {{ new Date(panel.data?.createdAt).toLocaleString() }}</p>
            <p>Visits: {{ panel.data?.visits }}</p>
            <div class="panel-notes">
              <textarea 
                v-model="panel.data.notes" 
                placeholder="Add notes..."
                @input="() => {
                  panel.data.notes = (panel.data.notes || '');
                  handleLayoutChange();
                }"
              ></textarea>
            </div>
          </div>
        </div>
      </template>

      <template #tabEmptyContentRender="{ grid }">
        <h2>
          Empty Grid {{ grid.name }} {{ grid.direction }}
          <br><button @click="onAddPanel(grid)">+ Add Panel</button>
        </h2>
      </template>

      <template #tabHeaderExtraRender="{ grid }">
        <button @click="onAddPanel(grid)">+ Add Panel</button>
      </template>

      <template #tabItemRender="{ panel, active, onTabClick, onContextMenu }">
        <SplitTabItem 
          :panel="(panel as CodeLayoutSplitNPanelInternal)"
          :active="active"
          @click="onTabClick"
          @contextmenu="onContextMenu($event)"
        >
          <template #title>
            <span :style="{ color: panel.data?.color }">
              {{ panel.title }}
              <small v-if="panel.data?.visits">({{ panel.data.visits }} visits)</small>
            </span>
          </template>
        </SplitTabItem>
      </template>
    </SplitLayout>

    <div v-if="showData" class="demo-pre">
      <pre>{{ splitLayoutRef?.getGridTreeDebugText() }}</pre>
      <div class="debug-info">
        <h3>Debug Info:</h3>
        <p>Auth Status: {{ auth.isLoggedIn.value ? 'Logged In' : 'Not Logged In' }}</p>
        <p>Current State ID: {{ layoutState?.currentState.value?.id }}</p>
        <p>Versions Count: {{ versions.length }}</p>
        <p>Last Active Panel: {{ lastActivePanel?.name }} ({{ lastActivePanel?.title }})</p>
        <p>Versions:</p>
        <pre>{{ JSON.stringify(versions, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import SplitLayout from '../../library/SplitLayout/SplitLayout.vue'
import SplitTabItem from '../../library/SplitLayout/SplitTabItem.vue'
import { useLayoutPersistence } from '../../library/Composeable/useLayoutPersistence'
import { supabase } from '../config/supabase'
import { useAuthProvider } from '../providers/AuthProvider'
import type { LayoutPersistenceState, LayoutPersistenceVersion } from '../../library/Composeable/useLayoutPersistence'
import { CodeLayoutSplitNPanelInternal, type CodeLayoutSplitNGridInternal, defaultSplitLayoutConfig } from '../../library/SplitLayout/SplitN'
import type { CodeLayoutPanelData } from '../../library/SplitLayout/SplitN'
import { useLayout } from '../../library/Composeable/useLayout'

const layout = useLayout()
const versions = ref<LayoutPersistenceVersion[]>([]);
const selectedVersion = ref<LayoutPersistenceVersion | null>(null);
let layoutState: ReturnType<typeof useLayoutPersistence>;
const debug = ref(false);

// Panel state
const showData = ref(false);
const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];
const config = { ...defaultSplitLayoutConfig };
let panelCount = 0;
const lastActivePanel = ref<CodeLayoutSplitNPanelInternal | null>(null);

// Add state ID management
const stateId = ref<string | null>(null);

// Try to get state ID from URL or localStorage
onMounted(() => {
  // Check URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const urlStateId = urlParams.get('stateId');
  
  if (urlStateId) {
    stateId.value = urlStateId;
  } else {
    // Check localStorage
    const savedStateId = localStorage.getItem('lastLayoutStateId');
    if (savedStateId) {
      stateId.value = savedStateId;
    }
  }
});

// Initialize auth
const auth = useAuthProvider();

// Track layout changes
const onLayoutChangeCallback = ref<(() => void) | null>(null);

// Panel management functions
const onPanelClose = (panel: CodeLayoutSplitNPanelInternal, resolve: () => void) => {
  resolve();
};

const onPanelDrop = () => {
  if (layout.layoutInstance.value) {
    console.log('Panel Tree:', layout.layoutInstance.value.getGridTreeDebugText());
  }
};

const onLastActiveChange = (panel: CodeLayoutSplitNPanelInternal | null) => {
  if (debug.value) console.log('Last active panel changed:', { panel: panel?.name });
  lastActivePanel.value = panel;
};

const onPanelActive = (oldPanel: CodeLayoutSplitNPanelInternal | null, newPanel: CodeLayoutSplitNPanelInternal | null) => {
  if (debug.value) console.log('Panel active changed:', { old: oldPanel?.name, new: newPanel?.name });
  if (newPanel) {
    // Increment visit count when panel becomes active
    const visits = newPanel.getData('visits', 0);
    newPanel.updateData('visits', (visits ?? 0) + 1);
  }
  // Update lastActivePanel if it's different
  if (lastActivePanel.value !== newPanel) {
    lastActivePanel.value = newPanel;
  }
};

const onPanelMenu = (panel: CodeLayoutSplitNPanelInternal, event: MouseEvent) => {
  event.preventDefault();
  console.log('Panel context menu:', panel.name);
};

const onGridActive = (oldGrid: CodeLayoutSplitNGridInternal | null, newGrid: CodeLayoutSplitNGridInternal | null) => {
  console.log('Grid active changed:', { old: oldGrid?.name, new: newGrid?.name });
};

const onAddPanel = (grid: CodeLayoutSplitNGridInternal) => {
  const panelName = CodeLayoutSplitNPanelInternal.generateUniqueName();
  const panelNumber = ++panelCount;

  const panel = {
    name: panelName,
    title: `Panel ${panelNumber}`,
    tooltip: `Panel ${panelNumber} tooltip`,
    badge: `${panelNumber}`,
    data: {
      color: colors[panelNumber % colors.length],
      createdAt: new Date().toISOString(),
      visits: 0,
      notes: ''
    } as CodeLayoutPanelData
  };
  return grid.addPanel(panel);
};

const onResetAll = async () => {
  if (splitLayoutRef.value) {
    console.log('🔄 Resetting layout...');
    // Clear the current layout
    splitLayoutRef.value.clearLayout();
    panelCount = 0;

    // Add a default panel
    const rootGrid = splitLayoutRef.value.getRootGrid();
    onAddPanel(rootGrid);

    // Save the new state if we have layout state initialized
    if (layoutState) {
      try {
        await layoutState.saveState();
        console.log('✅ Reset layout saved');
      } catch (error) {
        console.error('❌ Failed to save reset layout:', error);
      }
    }
  }
};

const updatePanelCounter = () => {
  // Find the highest panel number in the current layout
  const grid = layout.getRootGrid()
  if (!grid) return

  const panels = grid.children || []
  const maxNumber = panels.reduce((max: number, panel: CodeLayoutSplitNPanelInternal) => {
    const match = panel.name.match(/panel(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      return Math.max(max, num)
    }
    return max
  }, 0)
  panelCount = maxNumber
}

const splitLayoutRef = ref();

// Update the layout instance setup
onMounted(() => {
  // Initialize with a default panel
  if (splitLayoutRef.value) {
    const rootGrid = splitLayoutRef.value.getRootGrid();
    onAddPanel(rootGrid);
  }
});

// Fix the layout state initialization
watch([() => auth.isLoggedIn.value], async ([isLoggedIn]) => {
  console.log('🔄 Checking layout state initialization:', {
    isLoggedIn,
    hasInstance: !!splitLayoutRef.value,
    hasLayoutState: !!layoutState,
    userId: auth.user.value?.id
  });

  if (isLoggedIn && splitLayoutRef.value && !layoutState && auth.user.value?.id) {
    console.log('🔄 Initializing layout state...');
    try {
      layoutState = useLayoutPersistence({
        supabase,
        stateId: stateId.value || undefined,
        layoutInstance: splitLayoutRef.value,
        autoSync: true,
        debug: true, // Always enable debug for now to help troubleshoot
        onError: (error) => {
          console.error('❌ Layout state error:', error);
        }
      });

      // Load initial state
      console.log('🔄 Loading initial state...');
      await layoutState.loadState();
      console.log('✅ Layout state initialized');

      // Update versions list
      versions.value = layoutState.versions.value;
      console.log('📝 Initial versions loaded:', versions.value);

      // Watch for version changes
      watch(() => layoutState.versions.value, (newVersions) => {
        console.log('🔄 Versions updated:', newVersions);
        if (newVersions) {
          versions.value = newVersions;
        }
      }, { immediate: true });

    } catch (error) {
      console.error('❌ Failed to initialize layout state:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  }
}, { immediate: true });

// Watch debug changes and update layout persistence
watch(debug, (newDebug) => {
  if (layoutState) {
    // @ts-ignore - we know this exists internally
    layoutState.debug = newDebug;
  }
});

// Example functions to demonstrate state management
const handleSaveState = async () => {
  if (!layoutState) {
    if (debug.value) console.warn('⚠️ No layout state available')
    return;
  }
  try {
    await layoutState.saveState();
  } catch (error) {
    if (debug.value) console.error('❌ Failed to save layout state:', error);
  }
};

const handleCreateVersion = async () => {
  if (!layoutState) {
    console.error('❌ Cannot create version: Layout state not initialized');
    return;
  }

  if (!auth.isLoggedIn.value) {
    console.error('❌ Cannot create version: User not logged in');
    return;
  }

  try {
    // First ensure we have a saved state
    console.log('🔄 Saving current state before creating version...');
    await layoutState.saveState();
    
    const versionName = `Version ${new Date().toLocaleTimeString()}`;
    console.log('🔄 Creating new version:', versionName);
    await layoutState.createVersion(versionName);
    
    console.log('✅ Version created successfully');
    console.log('Current versions:', layoutState.versions.value);
  } catch (error) {
    console.error('❌ Failed to create version:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
};

const handleLoadVersion = async () => {
  if (!selectedVersion.value || !layoutState) {
    if (debug.value) console.warn('⚠️ No version or layout state available')
    return;
  }
  try {
    await layoutState.loadVersion(selectedVersion.value);
    updatePanelCounter();
  } catch (error) {
    if (debug.value) console.error('❌ Failed to load version:', error);
  }
};

const handleLoadVersionGrid = async () => {
  if (!selectedVersion.value || !layoutState) {
    if (debug.value) console.warn('⚠️ No version or layout state available')
    return;
  }
  try {
    await layoutState.loadVersion(selectedVersion.value, { arrangement: 'grid' } as any);
    updatePanelCounter();
  } catch (error) {
    if (debug.value) console.error('❌ Failed to load version:', error);
  }
};

// Handle layout changes
const handleLayoutChange = async () => {
  console.log('📝 Layout changed');
  if (layoutState) {
    try {
      await layoutState.saveState();
      console.log('✅ Layout state saved automatically');
    } catch (error) {
      console.error('❌ Failed to auto-save layout:', error);
    }
  }
};

// Add these new functions
const formatVersionName = (version: LayoutPersistenceVersion) => {
  const date = new Date(version.created_at)
  return `${version.version_name} (${date.toLocaleDateString()})`
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}
</script>

<style scoped>
.full-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.title-bar-extra {
  padding: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
}

.action-button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  height: 32px;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #999;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f8f8;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 300px;
}

.version-select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  min-width: 200px;
  font-size: 14px;
  flex: 1;
}

.version-select:disabled {
  background: #f5f5f5;
  color: #666;
  border-color: #ddd;
}

.load-version-button {
  white-space: nowrap;
}

.version-info {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.demo-pre {
  padding: 16px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  overflow: auto;
  max-height: 200px;
}

.demo-pre pre {
  margin: 0;
  font-family: monospace;
  white-space: pre-wrap;
}

.panel-content {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-stats p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.panel-notes {
  flex: 1;
  min-height: 100px;
}

.panel-notes textarea {
  width: 100%;
  height: 100%;
  min-height: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
}

.debug-info {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.debug-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.debug-info p {
  margin: 4px 0;
  font-family: monospace;
}

.debug-info pre {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
}

.debug-toggle {
  margin-left: auto;
  background: v-bind('debug ? "#e6f3ff" : "white"');
  border-color: v-bind('debug ? "#2196f3" : "#ccc"');
  color: v-bind('debug ? "#2196f3" : "#666"');
}

.debug-toggle:hover:not(:disabled) {
  background: v-bind('debug ? "#d1e9ff" : "#f0f0f0"');
  border-color: v-bind('debug ? "#1976d2" : "#999"');
}

.debug-toggle.active {
  font-weight: 500;
}
</style>