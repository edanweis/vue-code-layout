// @ts-nocheck
import { nextTick, reactive, type Ref } from "vue";
import { CodeLayoutGridInternal, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext, type CodeLayoutPanel, type CodeLayoutDragDropReferencePosition, type CodeLayoutDragDropReferenceAreaType } from "../CodeLayout";
import type { CodeLayoutInitialPanelConfig } from '../Types';


export interface CodeLayoutSplitNGrid extends Omit<CodeLayoutPanel, 'title'> {
  /**
   * Set whether users can close the current panel by continuously shrinking it.
   * 
   * Default: false
   */
  canMinClose?: boolean;

  /**
   * Callback when canMinClose is set to true, and this panel visible was changed by user dragging.
   */
  onMinCloseChanged?: (grid: CodeLayoutSplitNGrid, visible: boolean) => void;
  /**
   * Callback when user actived this grid.
   */
  onActive?: (grid: CodeLayoutSplitNGrid) => void;
  /**
   * Callback when user changed activePanel.
   */
  onActivePanelChanged?: (grid: CodeLayoutSplitNGrid, panel: CodeLayoutSplitNPanel) => void;
}
export interface CodeLayoutSplitNPanel extends Omit<CodeLayoutPanel, 'visible'|'showBadge'|'tabStyle'|'noHide'|'startOpen'> {
  /**
   * Callback when user actived this panel.
   */
  onActive?: (grid: CodeLayoutSplitNPanel) => void;
  /**
   * Callback when user closed this panel.
   */
  onClose?: (grid: CodeLayoutSplitNPanel) => void;
}

export type CodeLayoutSplitCopyDirection = 'left'|'top'|'bottom'|'right';

// Add panel data interface
export interface CodeLayoutPanelData {
  color?: string;
  createdAt?: string;
  visits?: number;
  notes?: string;
  [key: string]: any;
}

/**
 * Panel type definition of SplitLayout.
 */
export class CodeLayoutSplitNPanelInternal extends CodeLayoutPanelInternal implements CodeLayoutSplitNPanel {
  name: string = '';
  title: string = '';
  tooltip?: string;
  badge?: string;
  iconSmall?: () => any;
  iconLarge?: () => any;
  actions?: Array<{name: string, icon?: () => any, onClick?: () => void}>;
  data: CodeLayoutPanelData = {}; // For storing panel state
  parentGroup: CodeLayoutSplitNGridInternal | null = null;

  constructor(parent: CodeLayoutSplitNGridInternal | null = null) {
    super(parent?.context);
    this.parentGroup = parent;
    this.open = true;
  }

  onActive?: (grid: CodeLayoutSplitNPanel) => void;
  onClose?: (grid: CodeLayoutSplitNPanel) => void;

  /**
   * Panel in SplitLayout always open, no need to call the open method.
   */
  openPanel(): void {
    throw new Error('SplitLayout panel can only close');
  }
  /**
   * Close this panel.
   * 
   * This method will trigger panelClose event in SplitLayout.
   */
  closePanel(): void {
    this.context.closePanelInternal(this);
  }

  /**
   * Copy this panel and split it
   * @param direction Split direction
   * @param instanceCb New panel instance callback, can modify params
  */
  splitCopy(direction: CodeLayoutSplitCopyDirection, instanceCb: (panel: CodeLayoutSplitNPanel) => CodeLayoutSplitNPanel) {
    /**
     * 向网格中添加面板
     *    如果父级与目标方向一致，则直接添加
     *    如果父级与目标方向不一致，则
     *      分割当前网格，在下一级创建网格
     *        一半是当前父级所有子面板
     *        一半是新的面板
     */
     

    const self = this;
    const adjustGrid = this.parentGroup as CodeLayoutSplitNGridInternal;
    const parentGrid = this.parentGroup?.parentGroup as CodeLayoutSplitNGridInternal;

    if (!parentGrid)
      throw new Error("No top grid!");

    //创建相同方向的网格
    function createSameSideGrid(prev = false) {
      const newGrid = new CodeLayoutSplitNGridInternal(adjustGrid.context);
      Object.assign(newGrid, {
        ...adjustGrid,
        direction: adjustGrid.direction,
        name: adjustGrid.name + Math.floor(Math.random() * 10),
        children: [],
        childGrid: [],
        size: 0,
        noAutoShink: false,
      });
      parentGrid.addChildGrid(
        newGrid, 
        parentGrid.childGrid.indexOf(adjustGrid) + (prev ? -1 : 0)
      );
      return newGrid;
    }
    //创建垂直方向的网格
    function createSubGrid(prev = false) {
      //新网格上部，放之前的面板
      const newGrid = new CodeLayoutSplitNGridInternal(adjustGrid.context);
      Object.assign(newGrid, {
        ...adjustGrid,
        direction: adjustGrid.direction == 'horizontal' ? 'vertical' : 'horizontal',
        name: adjustGrid.name + Math.floor(Math.random() * 10),
        children: [],
        childGrid: [],
        size: 0,
        noAutoShink: false,
      });
      newGrid.addChilds(adjustGrid.children);
      newGrid.setActiveChild(self);
      adjustGrid.children = [];
      adjustGrid.childGrid = [];
      adjustGrid.addChildGrid(newGrid);

      //新网格，放新的面板
      const newGridOther = new CodeLayoutSplitNGridInternal(adjustGrid.context);
      Object.assign(newGridOther, {
        ...adjustGrid,
        direction: adjustGrid.direction == 'horizontal' ? 'vertical' : 'horizontal',
        name: adjustGrid.name + Math.floor(Math.random() * 10),
        children: [],
        childGrid: [],
        size: 0,
        noAutoShink: false,
      });
      adjustGrid.addChildGrid(newGridOther, prev ? 0 : 1);
      return newGridOther;
    }

    let newGrid: CodeLayoutSplitNGridInternal;
    
    switch (direction) {
      case 'left': {
        newGrid = adjustGrid.direction == 'horizontal' ? 
          createSubGrid(true) : 
          createSameSideGrid(true);
        break;
      }
      case 'right': {
        newGrid = adjustGrid.direction == 'horizontal' ? 
          createSubGrid() : 
          createSameSideGrid();
        break;
      }
      case 'top': {
        newGrid = adjustGrid.direction == 'vertical' ? 
          createSubGrid(true) : 
          createSameSideGrid(true);
        break;
      }
      case 'bottom': {
        newGrid = adjustGrid.direction == 'vertical' ? 
          createSubGrid() : 
          createSameSideGrid();
        break;
      }
      default:
        throw new Error('Unknow direction: ' + direction)
    }
    const newPanelDef : CodeLayoutSplitNPanel = {
      title: this.title,
      tooltip: this.tooltip,
      name: this.name,
      badge: this.badge,
      draggable: this.draggable,
      accept: this.accept,
      size: this.size,
      minSize: this.minSize,
      iconLarge: this.iconLarge,
      iconSmall: this.iconSmall,
      closeType: this.closeType,
    };
    const newPanel = newGrid.addPanel(instanceCb(newPanelDef));
    newGrid.setActiveChild(newPanel);
    
    nextTick(() => {
      parentGrid.notifyRelayout();
      adjustGrid.notifyRelayout();
      newGrid.notifyRelayout();
    });
  }

  // Helper method to update data with type safety
  updateData<K extends keyof CodeLayoutPanelData>(key: K, value: CodeLayoutPanelData[K]) {
    this.data[key] = value;
    // Trigger layout change if parent exists
    if (this.parentGroup?.onLayoutChange) {
      this.parentGroup.onLayoutChange();
    }
  }

  // Helper method to get data with type safety
  getData<K extends keyof CodeLayoutPanelData>(key: K, defaultValue?: CodeLayoutPanelData[K]): CodeLayoutPanelData[K] | undefined {
    return this.data[key] ?? defaultValue;
  }

  // Apply initial configuration if available
  applyInitialConfig(config?: CodeLayoutInitialPanelConfig) {
    if (!config) return;

    const uniqueName = this.name;
    
    if (config.titleGenerator) {
      this.title = config.titleGenerator(uniqueName);
    }
    if (config.tooltipGenerator) {
      this.tooltip = config.tooltipGenerator(uniqueName);
    }
    if (config.badgeGenerator) {
      this.badge = config.badgeGenerator(uniqueName);
    }
    if (config.iconGenerator) {
      this.iconSmall = config.iconGenerator(uniqueName);
    }
    if (config.dataGenerator) {
      this.data = {
        ...this.data,
        ...config.dataGenerator(uniqueName)
      };
    }
    if (config.closeType) {
      this.closeType = config.closeType;
    }
  }

  // Generate a unique panel name
  static generateUniqueName(prefix: string = 'panel'): string {
    return `${prefix}-${crypto.randomUUID().split('-')[0]}`;
  }
}
/**
 * Grid type definition of SplitLayout.
 * 
 * Events:
 */
export class CodeLayoutSplitNGridInternal extends CodeLayoutGridInternal implements CodeLayoutSplitNGrid {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super('centerArea', 'text', context, () => {}, () => {});
    this.open = true;
    this.title = ''; // Initialize title
  }

  /**
   * Set whether users can close the current panel by continuously shrinking it.
   */
  canMinClose = false;
  /**
   * Layout direction. 
   */
  direction: 'vertical'|'horizontal' = 'vertical';
  /**
   * Child grid of this grid.
   */
  childGrid : CodeLayoutSplitNGridInternal[] = [];
  //Public

  /**
   * Add a child grid to this grid.
   * @param grid Grid to add
   * @param direction Direction, default is the direction perpendicular to the current grid
   * @returns Child grid instance.
   */
  addGrid(grid: CodeLayoutSplitNGrid, direction: "vertical" | "horizontal" | undefined = undefined) {
    const panelInternal = grid as CodeLayoutSplitNGridInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${grid.name} already added to ${panelInternal.parentGroup.name} !`);

    const panelResult = reactive(new CodeLayoutSplitNGridInternal(this.context));
    Object.assign(panelResult, grid);
    panelResult.children = [];
    panelResult.childGrid = [];
    panelResult.open = true;
    panelResult.size = grid.size ?? 0;
    panelResult.accept = grid.accept ?? this.accept;
    panelResult.parentGrid = this.parentGrid;
    panelResult.direction = direction ?? (this.direction === 'vertical' ? 'horizontal' : 'vertical');
    this.addChildGrid(panelResult as CodeLayoutSplitNGridInternal);
    return panelResult as CodeLayoutSplitNGridInternal;
  }
  /**
   * Remove a child grid from this grid.
   * @param grid Grid to remove
   */
  removeGrid(grid: CodeLayoutSplitNGrid) {
    const panelInternal = grid as CodeLayoutSplitNGridInternal;
    if (panelInternal.parentGroup !== this)
      throw new Error(`Panel ${grid.name} is not child of this group !`);
    this.removeChildGrid(panelInternal);
    return grid;
  }
  addPanel(panel: CodeLayoutSplitNPanel, startOpen?: boolean, index?: number) {
    const panelInternal = panel as CodeLayoutPanelInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
    if (this.context.panelInstances.has(panelInternal.name))
      throw new Error(`A panel named ${panel.name} already exists in this layout`);
  
    const panelResult = reactive(new CodeLayoutSplitNPanelInternal(this));
    Object.assign(panelResult, panel);
    panelResult.children = [];
    panelResult.size = panel.size ?? 0;
    panelResult.accept = panel.accept ?? this.accept;

    // Apply initial configuration if available
    if (this.context.layoutConfig?.defaultPanelConfig || this.context.layoutConfig?.initialPanelConfig) {
      const config = this.context.layoutConfig?.defaultPanelConfig || this.context.layoutConfig?.initialPanelConfig;
      (panelResult as CodeLayoutSplitNPanelInternal).applyInitialConfig(config);
    }

    this.addChild(panelResult as CodeLayoutSplitNPanelInternal, index);
    this.context.panelInstances.set(panelInternal.name, panelResult as CodeLayoutSplitNPanelInternal);
  
    return panelResult as CodeLayoutSplitNPanelInternal;
  }

  moveChildGridToSelf(childGrid: CodeLayoutSplitNGridInternal) {
    childGrid.childReplacedBy = this;
    this.children.push(...childGrid.children);
    for (const iterator of this.children)
      iterator.parentGroup = this;
    for (const iterator of this.childGrid)
      iterator.parentGroup = null;
    this.childGrid.splice(0);
    for (const iterator of childGrid.childGrid)
      this.childGrid.push(iterator);
    for (const iterator of this.childGrid)
      iterator.parentGroup = this;
    this.direction = childGrid.direction;
    this.setActiveChild(childGrid.activePanel);
  }

  getContainerSize(): number {
    this.pushLateAction('getContainerSize');
    return super.getContainerSize();
  }

  setActiveChild(child: CodeLayoutPanelInternal|null) {
    const oldPanel = this.activePanel;
    if (oldPanel !== child) {
      this.activePanel = child;
      if (child instanceof CodeLayoutSplitNPanelInternal) {
        child.onActive?.(child);
      }
      this.context.childGridActiveChildChanged(this);
    }
  }
  reselectActiveChild(): void {
    super.reselectActiveChild();
    this.context.childGridActiveChildChanged(this);
  }

  onActive?: (grid: CodeLayoutSplitNGrid) => void;
  onActivePanelChanged?: (grid: CodeLayoutSplitNGrid, panel: CodeLayoutSplitNPanel) => void;
  onMinCloseChanged?: (grid: CodeLayoutSplitNGrid, visible: boolean) => void;

  //Internal
  //These methods is called internally, and you do not need to use them.

  childReplacedBy: CodeLayoutSplitNGridInternal|null = null;

  addChildGrid(child: CodeLayoutSplitNGridInternal, index?: number) {
    if (typeof index === 'number')
      this.childGrid.splice(index, 0, child);
    else
      this.childGrid.push(child);
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  addChildGrids(childs: CodeLayoutSplitNGridInternal[], startIndex?: number) {
    if (typeof startIndex === 'number')
      this.childGrid.splice(startIndex, 0, ...childs);
    else
      this.childGrid.push(...childs);
    for (const child of childs) {
      child.parentGroup = this;
      child.parentGrid = this.parentGrid;
    }
  }
  removeChildGrid(child: CodeLayoutSplitNGridInternal) {
    this.childGrid.splice(this.childGrid.indexOf(child), 1);
    child.parentGroup = null;
  }
  replaceChildGrid(oldChild: CodeLayoutSplitNGridInternal, child: CodeLayoutSplitNGridInternal) {
    const index = this.childGrid.indexOf(oldChild);
    if (index === -1)
      throw new Error(`Panel ${oldChild.name} is not child of this group !`);
    this.childGrid.splice(
      index, 
      1, 
      child
    );  
    if (oldChild.parentGroup === this) 
      oldChild.parentGroup = null;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  hasChildGrid(child: CodeLayoutSplitNGridInternal) {
    return this.childGrid.includes(child);
  }
  
  toJson() {
    return {
      name: this.name,
      open: this.open,
      size: this.size,
      visible: this.visible,
      direction: this.direction,
      children: this.children.map(child => ({
        name: child.name,
        title: child.title,
        tooltip: child.tooltip,
        badge: child.badge,
        data: child.data,
        // Don't serialize functions, just their existence
        hasIconSmall: !!child.iconSmall,
        hasIconLarge: !!child.iconLarge,
        hasActions: Array.isArray(child.actions)
      })),
      childGrid: this.childGrid.map(grid => grid.toJson())
    }
  }
  loadFromJson(json: any): void {
    this.direction = json.direction || this.direction;
    this.canMinClose = json.canMinClose ?? this.canMinClose;
    super.loadFromJson(json);
  }
}

export interface CodeLayoutInitialPanelConfig {
  /**
   * Function to generate panel title
   */
  titleGenerator?: (uniqueName: string) => string;
  /**
   * Function to generate panel tooltip
   */
  tooltipGenerator?: (uniqueName: string) => string;
  /**
   * Function to generate panel badge
   */
  badgeGenerator?: (uniqueName: string) => string;
  /**
   * Function to generate panel icon
   */
  iconGenerator?: (uniqueName: string) => (() => any);
  /**
   * Function to generate initial panel data
   */
  dataGenerator?: (uniqueName: string) => Record<string, any>;
  /**
   * Default close type for new panels
   */
  closeType?: 'close' | 'hide';
}

/**
 * Default SplitLayout config
 */
export const defaultSplitLayoutConfig : CodeLayoutSplitNConfig = {

};

/**
 * SplitLayout other config
 */
export interface CodeLayoutSplitNConfig {
  /**
   * This callback is triggered when  user drag a non-panel data into component. You can check here whether dragging is allowed or not.
   * @param e Raw DragEvent
   * @returns Return true allows drop, false prevent drop.
   */
  onNonPanelDrag?: (e: DragEvent, sourcePosition: CodeLayoutDragDropReferenceAreaType) => boolean;
  /**
   * This callback is triggered when user drop a non-panel data into component. 
   * @param e Raw DragEvent
   * @param reference Drop source panel.
   * @param referencePosition Drop source position.
   */
  onNonPanelDrop?: (e: DragEvent, sourcePosition: CodeLayoutDragDropReferenceAreaType, reference: CodeLayoutPanelInternal|undefined, referencePosition: CodeLayoutDragDropReferencePosition|undefined) => void;
  /**
   * Initial panel configuration
   */
  initialPanelConfig?: CodeLayoutInitialPanelConfig;
}

/**
 * Instance of SplitLayout.
 * 
 * Can use like this:
 * ```
 * const splitLayout = ref<CodeLayoutSplitNInstance>(); 
 * const rootGrid = splitLayout.value.getRootGrid();
 * ```
 */
export interface CodeLayoutSplitNInstance {
  /**
   * Get root grid instance.
   * @returns Root grid instance.
   */
  getRootGrid() : CodeLayoutSplitNGridInternal;
  /**
   * Get panel instance by name.
   * @param name The panel name.
   * @returns Panel instance, if panel is not found in the component, return undefined
   */
  getPanelByName(name: string): CodeLayoutPanelInternal | undefined,
  /**
   * Get grid instance by name.
   * @param name The grid name.
   * @returns Grid instance, if grid is not found in the component, return undefined
   */
  getGridByName(name: string): CodeLayoutSplitNGridInternal | undefined,
  /**
   * @deprecated Use getActiveGrid() instead - this method name contains a typo
   */
  getActiveGird() : CodeLayoutSplitNGridInternal|undefined;

  /**
   * Obtain a grid that is currently active and can be used to add panels.
   * @returns The currently active grid, or the root grid if no grid is active
   */
  getActiveGrid() : CodeLayoutSplitNGridInternal|undefined;

  getGridTreeDebugText() : string;

  /**
   * Activate the specified panel through Name. If the specified Name panel does not exist in the component, it has no effect.
   * 
   * This method will change ActiveGird.
   * 
   * @param name Panel name
   */
  activePanel(name: string): void;
  /**
   * Clear all grid.
   */
  clearLayout(): void;
  /**
   * Save current layout to JSON data.
   */
  saveLayout(): any;
  /**
   * Load the previous layout from JSON data, 
   * instantiatePanelCallback will sequentially call all panels, where you can process panel data.
   */
  loadLayout(json: any, instantiatePanelCallback: (data: CodeLayoutSplitNPanel) => CodeLayoutSplitNPanel): void;

  /**
   * Convenience method to add a panel to the currently active grid and optionally make it active.
   * @param panel Panel to add
   * @param makeActive Whether to make the panel active after adding it
   * @returns The added panel instance, or undefined if no active grid
   */
  addPanelToActiveGrid(panel: CodeLayoutSplitNPanel, makeActive?: boolean): CodeLayoutSplitNPanelInternal | undefined;
}

export interface CodeLayoutSplitLayoutContext {
  currentActiveGrid: Ref<CodeLayoutSplitNGridInternal|null>,
  activeGrid(grid: CodeLayoutSplitNGridInternal) : void;
  dragDropToPanel(referencePanel: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal, toTab?: boolean) : void;
  dragDropNonPanel(e: DragEvent, isDrop: boolean, sourcePosition: CodeLayoutDragDropReferenceAreaType, referencePanel?: CodeLayoutPanelInternal, referencePosition?: CodeLayoutDragDropReferencePosition): boolean;
}