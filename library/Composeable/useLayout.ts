import { type Ref, unref, getCurrentInstance } from 'vue'
import type { CodeLayoutSplitNInstance, CodeLayoutSplitNPanel } from '../SplitLayout/SplitN'
import { useLayoutStore, type LayoutStore } from './createLayoutStore'

export function useLayout(explicitStore?: LayoutStore) {
  // Check if we're in a component context
  const isInSetup = !!getCurrentInstance()
  
  // If no explicit store and not in setup, warn about potential issues
  if (!explicitStore && !isInSetup) {
    console.warn(
      '[vue-code-layout] useLayout() was called outside of a component setup. ' +
      'This may lead to issues. Pass the store explicitly when using outside of components.'
    )
  }

  const store = explicitStore || useLayoutStore()

  /**
   * Set the layout instance reference. This should be called with the ref to your SplitLayout component.
   * @param instance Ref to the SplitLayout component instance
   */
  const setLayoutRef = (instance: Ref<CodeLayoutSplitNInstance>) => {
    store.setLayoutInstance(instance)
  }

  const addPanel = (panel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    const instance = unref(store.layoutInstance)
    if (!instance) {
      console.warn('[vue-code-layout] Layout instance not set')
      return
    }
    return instance.addPanelToActiveGrid(panel, makeActive)
  }

  const getActiveGrid = () => {
    return unref(store.layoutInstance)?.getActiveGrid()
  }

  const getPanelByName = (name: string) => {
    return unref(store.layoutInstance)?.getPanelByName(name)
  }

  const replacePanel = (panelId: string, newPanel: CodeLayoutSplitNPanel, makeActive?: boolean) => {
    return unref(store.layoutInstance)?.replacePanel(panelId, newPanel, makeActive)
  }

  const getRootGrid = () => {
    return unref(store.layoutInstance)?.getRootGrid()
  }

  const clearLayout = (options?: { leaveEmptyGrid?: boolean }) => {
    return unref(store.layoutInstance)?.clearLayout(options)
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