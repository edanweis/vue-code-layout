import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import BasicUseage from '../views/BasicUseage.vue'
import SplitLayout from '../views/SplitLayout.vue'
import DataSaveAndLoad from '../views/DataSaveAndLoad.vue'
import LayoutStoreExample from '../views/LayoutStoreExample.vue'
import AdvancedLayoutStore from '../views/AdvancedLayoutStore.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'BasicUseage',
    component: BasicUseage,
  },
  {
    path: '/SplitLayout',
    name: 'SplitLayout',
    component: SplitLayout,
  },
  {
    path: '/DataSaveAndLoad',
    name: 'DataSaveAndLoad',
    component: DataSaveAndLoad,
  },
  {
    path: '/layout-store',
    name: 'LayoutStoreExample',
    component: LayoutStoreExample,
  },
  {
    path: '/advanced-layout-store',
    name: 'AdvancedLayoutStore',
    component: AdvancedLayoutStore,
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router
