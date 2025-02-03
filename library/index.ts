import type { App } from 'vue';

export * from './CodeLayout'
export * from './SplitLayout/SplitN';
export * from './Composeable/DragDrop';
export * from './Composeable/LateClass';
export * from './Composeable/Vector2';
export * from './Composeable/ResizeChecker';
export * from './Composeable/MiniTimeout';
export * from './Composeable/PanelMenu';
export * from './Language/index';

import CodeLayout from './CodeLayout.vue'
import CodeLayoutActionsRender from './CodeLayoutActionsRender.vue'
import CodeLayoutCollapseTitle from './CodeLayoutCollapseTitle.vue'
import CodeLayoutCustomizeLayout from './Components/CodeLayoutCustomizeLayout.vue'
import CodeLayoutScrollbar from './Components/CodeLayoutScrollbar.vue'
import CodeLayoutVNodeStringRender from './Components/CodeLayoutVNodeStringRender.vue'
import OverflowCollapseList from './Components/OverflowCollapseList.vue'
import SimpleTooltip from './Components/SimpleTooltip.vue'
import SplitLayout from './SplitLayout/SplitLayout.vue'
import SplitTab from './SplitLayout/SplitTab.vue'
import SplitTabItem from './SplitLayout/SplitTabItem.vue'
import SplitN from './SplitLayout/SplitN.vue'
import { createLayoutStore } from './Composeable/createLayoutStore'

export {
  CodeLayout,
  CodeLayoutActionsRender,
  CodeLayoutCollapseTitle,
  CodeLayoutCustomizeLayout,
  CodeLayoutScrollbar,
  CodeLayoutVNodeStringRender,
  OverflowCollapseList,
  SimpleTooltip,
  SplitLayout,
  SplitTab,
  SplitTabItem,
  SplitN,
}

export { useLayoutPersistence } from './Composeable/useLayoutPersistence'
export { useLayoutStore } from './Composeable/createLayoutStore'
export type { 
  LayoutPersistenceState, 
  LayoutPersistenceVersion, 
  UseLayoutPersistenceOptions 
} from './Composeable/useLayoutPersistence'
export type { LayoutStore } from './Composeable/createLayoutStore'

// Create the layout store plugin
export const layoutStore = createLayoutStore()

export default {
  install(app: App) {
    app.component('CodeLayout', CodeLayout);
    app.component('SplitLayout', SplitLayout);
    
    // Install the layout store plugin
    layoutStore.install(app)
  },
}