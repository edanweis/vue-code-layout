import { ref, type Ref } from 'vue'
import type { CodeLayoutSplitNInstance, CodeLayoutSplitNPanel } from '../SplitLayout/SplitN'
import { useLayoutStore } from './createLayoutStore'

export function useLayout() {
  const store = useLayoutStore()
  const layoutInstance = ref<CodeLayoutSplitNInstance | null>(null)

  const setLayoutRef = (instance: Ref<CodeLayoutSplitNInstance>) => {
    layoutInstance.value = instance.value
    store.setLayoutInstance(instance)
  }

  const addPanel = (panel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    if (!layoutInstance.value) {
      console.warn('[vue-code-layout] Layout instance not set')
      return
    }
    return layoutInstance.value.addPanelToActiveGrid(panel, makeActive)
  }

  const getActiveGrid = () => {
    return layoutInstance.value?.getActiveGrid()
  }

  const getPanelByName = (name: string) => {
    return layoutInstance.value?.getPanelByName(name)
  }

  const replacePanel = (panelId: string, newPanel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    return layoutInstance.value?.replacePanel(panelId, newPanel, makeActive)
  }

  const getRootGrid = () => {
    return layoutInstance.value?.getRootGrid()
  }

  const clearLayout = (options?: { leaveEmptyGrid?: boolean }) => {
    return layoutInstance.value?.clearLayout(options)
  }

  return {
    // Layout instance methods
    setLayoutRef,
    addPanel,
    getActiveGrid,
    getPanelByName,
    replacePanel,
    getRootGrid,
    clearLayout,
    layoutInstance,

    // Store methods
    store,
    currentState: store.currentState,
    versions: store.versions,
    isLoading: store.isLoading,
    error: store.error,
    loadState: store.loadState,
    saveState: store.saveState,
    createVersion: store.createVersion,
    loadVersion: store.loadVersion,
    fetchVersions: store.fetchVersions,
  }
} 