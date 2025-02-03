# Layout Persistence API

## useLayoutPersistence

用于管理布局状态和版本的组合式函数。

### 类型定义

```typescript
interface LayoutPersistenceState {
  id: string          // UUID
  state_id: string    // 用户提供的标识符
  layout: any         // 布局数据
  created_at: string
  updated_at: string
}

interface LayoutPersistenceVersion {
  id: string          // UUID
  state_id: string    // 引用 layout_states.id
  version_name: string
  layout: any         // 布局数据
  created_at: string
}

interface UseLayoutPersistenceOptions {
  supabase: SupabaseClient       // Supabase 客户端实例
  stateId?: string              // 可选：布局状态的唯一标识符
  layoutInstance: Ref<any>      // 布局组件的引用
  autoSync?: boolean            // 是否自动同步（默认：true）
  autoSyncDebounce?: number     // 自动同步的防抖延迟（毫秒）（默认：1000）
  onError?: (error: any) => void // 错误处理函数
  tables?: {                    // 自定义表名
    states?: string
    versions?: string
  }
  columns?: {                   // 自定义列名
    stateId?: string
    layout?: string
    versionName?: string
    createdAt?: string
    updatedAt?: string
  }
  additionalData?: Record<string, any> | (() => Record<string, any>) // 保存时包含的额外数据
}
```

### 返回值

```typescript
{
  currentState: Ref<LayoutPersistenceState | null>  // 当前布局状态
  versions: Ref<LayoutPersistenceVersion[]>         // 可用的版本列表
  loadState: () => Promise<void>                    // 加载状态
  saveState: () => Promise<void>                    // 保存状态
  createVersion: (name: string) => Promise<void>    // 创建新版本
  loadVersion: (version: LayoutPersistenceVersion) => Promise<void>  // 加载特定版本
  fetchVersions: (stateId: string) => Promise<void> // 获取版本列表
}
```

### 示例

```typescript
const layoutRef = ref()
const layoutState = useLayoutPersistence({
  supabase,
  stateId: 'my-layout',
  layoutInstance: layoutRef,
  autoSync: true,
  autoSyncDebounce: 1000,
  onError: console.error
})

// 加载初始状态
await layoutState.loadState()

// 创建新版本
await layoutState.createVersion('版本 1')

// 加载特定版本
await layoutState.loadVersion(version)
```

### 配置选项

#### supabase
- 类型：`SupabaseClient`
- 必填：是
- 说明：已配置的 Supabase 客户端实例

#### stateId
- 类型：`string`
- 必填：否
- 默认值：`undefined`
- 说明：布局状态的唯一标识符。如果未提供，将从 URL 参数或 localStorage 中获取

#### layoutInstance
- 类型：`Ref<any>`
- 必填：是
- 说明：布局组件的引用，用于获取和设置布局状态

#### autoSync
- 类型：`boolean`
- 必填：否
- 默认值：`true`
- 说明：是否在布局更改时自动保存状态

#### autoSyncDebounce
- 类型：`number`
- 必填：否
- 默认值：`1000`
- 说明：自动保存的防抖延迟（毫秒）

#### onError
- 类型：`(error: any) => void`
- 必填：否
- 默认值：`undefined`
- 说明：错误处理函数

#### tables
- 类型：`object`
- 必填：否
- 说明：自定义数据库表名
  - `states`：状态表名（默认：'layout_states'）
  - `versions`：版本表名（默认：'layout_state_versions'）

#### columns
- 类型：`object`
- 必填：否
- 说明：自定义数据库列名
  - `stateId`：状态 ID 列名（默认：'state_id'）
  - `layout`：布局数据列名（默认：'layout'）
  - `versionName`：版本名称列名（默认：'version_name'）
  - `createdAt`：创建时间列名（默认：'created_at'）
  - `updatedAt`：更新时间列名（默认：'updated_at'）

#### additionalData
- 类型：`Record<string, any> | (() => Record<string, any>)`
- 必填：否
- 说明：保存状态时要包含的额外数据，可以是对象或返回对象的函数 