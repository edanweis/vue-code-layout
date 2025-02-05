export interface CodeLayoutDefaultPanelConfig {
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

// Keep old interface for backwards compatibility
export interface CodeLayoutInitialPanelConfig extends CodeLayoutDefaultPanelConfig {} 