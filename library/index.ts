import type { App } from 'vue';

export * from './CodeLayout';
export * from './SplitLayout/SplitN';
export type { CodeLayoutInitialPanelConfig } from './Types';
export * from './Composeable/DragDrop';
export * from './Composeable/LateClass';
export * from './Composeable/Vector2';
export * from './Composeable/ResizeChecker';
export * from './Composeable/MiniTimeout';
export * from './Composeable/PanelMenu';
export * from './Language/index';
export * from './Composeable/createLayoutStore';
export * from './Composeable/useLayout';

import CodeLayout from './CodeLayout.vue';
import CodeLayoutEmpty from './CodeLayoutEmpty.vue';
import OverflowCollapseList from './Components/OverflowCollapseList.vue';
import SimpleTooltip from './Components/SimpleTooltip.vue';
import SplitLayout from './SplitLayout/SplitLayout.vue';
import SplitTab from './SplitLayout/SplitTab.vue';
import SplitTabItem from './SplitLayout/SplitTabItem.vue';
import SplitN from './SplitLayout/SplitN.vue';
import { createLayoutStore } from './Composeable/createLayoutStore';

export {
  CodeLayout,
  CodeLayoutEmpty,
  OverflowCollapseList,
  SimpleTooltip,
  SplitLayout,
  SplitTab,
  SplitTabItem,
  SplitN,
}

export { useLayoutPersistence } from './Composeable/useLayoutPersistence'
export type { 
  LayoutPersistenceState, 
  LayoutPersistenceVersion, 
  UseLayoutPersistenceOptions 
} from './Composeable/useLayoutPersistence'

// Create the layout store plugin
const { install, store } = createLayoutStore();
export const layoutStore = store;

export default {
  install(app: App) {
    app.component('CodeLayout', CodeLayout);
    app.component('CodeLayoutEmpty', CodeLayoutEmpty);
    app.component('OverflowCollapseList', OverflowCollapseList);
    app.component('SimpleTooltip', SimpleTooltip);
    app.component('SplitLayout', SplitLayout);
    app.component('SplitTab', SplitTab);
    app.component('SplitTabItem', SplitTabItem);
    app.component('SplitN', SplitN);
    
    // Install the layout store plugin
    install(app)
  },
}