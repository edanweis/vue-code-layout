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