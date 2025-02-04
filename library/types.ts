export interface LayoutState {
  stateId?: string
  panels?: {
    [key: string]: {
      size?: number
      collapsed?: boolean
      [key: string]: any
    }
  }
  [key: string]: any
} 