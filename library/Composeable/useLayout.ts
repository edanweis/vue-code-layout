import { type Ref } from 'vue'
import type { CodeLayoutSplitNInstance, CodeLayoutSplitNPanel } from '../SplitLayout/SplitN'
import { useLayoutStore } from './createLayoutStore'

export function useLayout() {
  const store = useLayoutStore()

  /**
   * Set the layout instance reference. This should be called with the ref to your SplitLayout component.
   * @param instance Ref to the SplitLayout component instance
   */
  const setLayoutRef = (instance: Ref<CodeLayoutSplitNInstance>) => {
    store.setLayoutInstance(instance)
  }

  const addPanel = (panel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    if (!store.layoutInstance.value) {
      console.warn('[vue-code-layout] Layout instance not set')
      return
    }
    return store.layoutInstance.value.addPanelToActiveGrid(panel, makeActive)
  }

  const getActiveGrid = () => {
    return store.layoutInstance.value?.getActiveGrid()
  }

  const getPanelByName = (name: string) => {
    return store.layoutInstance.value?.getPanelByName(name)
  }

  const replacePanel = (panelId: string, newPanel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    return store.layoutInstance.value?.replacePanel(panelId, newPanel, makeActive)
  }

  const getRootGrid = () => {
    return store.layoutInstance.value?.getRootGrid()
  }

  const clearLayout = (options?: { leaveEmptyGrid?: boolean }) => {
    return store.layoutInstance.value?.clearLayout(options)
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
    layoutInstance: store.layoutInstance,

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