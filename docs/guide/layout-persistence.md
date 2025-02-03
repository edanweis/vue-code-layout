# 布局持久化

布局持久化功能允许您使用 Supabase 作为后端来保存、加载和版本控制您的布局。本指南将说明如何设置和使用布局持久化系统。

## 设置

### 1. 数据库设置

首先，您需要在 Supabase 数据库中设置所需的表：

```sql
-- 创建布局状态表
create table public.layout_states (
  id uuid not null default gen_random_uuid(),
  state_id text not null,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint layout_states_pkey primary key (id),
  constraint layout_states_state_id_key unique (state_id)
);

-- 创建布局版本表
create table public.layout_state_versions (
  id uuid not null default gen_random_uuid(),
  state_id uuid not null,
  version_name text not null,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint layout_state_versions_pkey primary key (id),
  constraint layout_state_versions_state_id_fkey foreign key (state_id) 
    references layout_states (id) 
    on delete cascade
);

-- 添加索引以提高性能
create index idx_layout_states_state_id on public.layout_states(state_id);
create index idx_layout_state_versions_state_id on public.layout_state_versions(state_id);
create index idx_layout_state_versions_created_at on public.layout_state_versions(created_at desc);
```

### 2. 初始化组合式函数

在您的组件中导入并初始化 `useLayoutPersistence` 组合式函数：

```typescript
import { useLayoutPersistence } from 'vue-code-layout'
import { supabase } from './supabase-client'

const layoutState = useLayoutPersistence({
  supabase,                    // 已配置的 Supabase 客户端
  stateId: 'my-layout',        // 可选：此布局的唯一标识符
  layoutInstance: layoutRef,    // 布局组件的引用
  autoSync: true,              // 可选：自动保存更改（默认：true）
  autoSyncDebounce: 1000,      // 可选：防抖延迟（毫秒）（默认：1000）
  onError: console.error       // 可选：错误处理函数
})
```

## 使用方法

### 基本状态管理

```typescript
// 加载初始状态
await layoutState.loadState()

// 保存当前状态
await layoutState.saveState()
```

### 版本管理

```typescript
// 创建新版本
await layoutState.createVersion('版本 1')

// 加载特定版本
await layoutState.loadVersion(version)

// 获取版本列表
const versions = layoutState.versions
```

### 状态 ID 管理

状态 ID 可以通过以下几种方式提供：

1. **URL 参数**：
   ```
   https://your-app.com/layout?stateId=my-layout-1
   ```

2. **直接配置**：
   ```typescript
   const layoutState = useLayoutPersistence({
     stateId: 'my-layout-1',
     // ... 其他选项
   })
   ```

3. **本地存储**：
   最后使用的状态 ID 会自动保存到 localStorage 并在页面加载时恢复。

### 高级配置

```typescript
const layoutState = useLayoutPersistence({
  // 自定义表名
  tables: {
    states: 'custom_layout_states',
    versions: 'custom_layout_versions'
  },
  
  // 自定义列名
  columns: {
    stateId: 'state_id',
    layout: 'layout_data',
    versionName: 'version_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  
  // 保存时包含的额外数据
  additionalData: {
    workspace_id: '123',
    team_id: '456'
  },
  
  // 或者使用函数获取动态值
  additionalData: () => ({
    workspace_id: currentWorkspace.value.id,
    last_modified_by: currentUser.value.id
  })
})
```

## 示例组件

这是一个完整的示例，展示了如何实现带版本控制的布局持久化：

```vue
<template>
  <div class="layout-container">
    <!-- 布局控制 -->
    <div class="controls">
      <button @click="handleSaveState">保存状态</button>
      <button @click="handleCreateVersion">创建版本</button>
      
      <!-- 版本选择器 -->
      <div class="version-selector">
        <select v-model="selectedVersion">
          <option value="">选择版本</option>
          <option v-for="version in versions" :key="version.id" :value="version">
            {{ formatVersionName(version) }}
          </option>
        </select>
        <button v-if="selectedVersion" @click="handleLoadVersion">
          加载版本
        </button>
      </div>
    </div>

    <!-- 布局组件 -->
    <SplitLayout ref="layoutRef" @layout-change="handleLayoutChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLayoutPersistence } from 'vue-code-layout'

const layoutRef = ref()
const versions = ref([])
const selectedVersion = ref(null)

const layoutState = useLayoutPersistence({
  supabase,
  layoutInstance: layoutRef,
  autoSync: true
})

// 初始化
await layoutState.loadState()

// 监听版本变化
watch(() => layoutState.versions, newVersions => {
  versions.value = newVersions
})

// 版本管理
const handleCreateVersion = async () => {
  const versionName = `版本 ${new Date().toLocaleTimeString()}`
  await layoutState.createVersion(versionName)
}

const handleLoadVersion = async () => {
  if (selectedVersion.value) {
    await layoutState.loadVersion(selectedVersion.value)
  }
}
</script>
```

## 最佳实践

1. **状态 ID**：
   - 使用有意义的状态 ID 来标识布局的用途
   - 考虑使用 URL 参数以便于分享
   - 在 localStorage 中存储常用的状态 ID

2. **版本控制**：
   - 在重要更改后创建版本（例如，重大更改后）
   - 使用描述性的版本名称
   - 考虑在版本名称中包含时间戳

3. **错误处理**：
   - 始终提供错误处理函数
   - 适当处理加载状态
   - 向用户显示操作成功/失败的反馈

4. **性能**：
   - 使用适当的自动同步防抖值
   - 考虑在性能关键的应用中禁用自动同步
   - 使用提供的数据库索引

## TypeScript 支持

组合式函数包含完整的 TypeScript 支持，提供以下接口：

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
``` 