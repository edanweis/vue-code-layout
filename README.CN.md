# vue-code-layout

> 这是 vue-code-layout 的一个分支，增加了使用 Pinia 的内置状态持久化和可选的 Supabase 集成。您可以使用它来自动保存和恢复跨会话的布局状态。

一个仿 VSCode 的 Vue 编辑器布局组件，可以用于开发Web编辑器。

![截图](https://raw.githubusercontent.com/edanweis/vue-code-layout/master/screenshot/first.jpg)

---

## 特性

* 简洁易用，体积小
* 支持添加面板
* 支持拖拽面板
* 支持自定义面板图标、文字、渲染等
* 支持VSCode外壳布局与编辑器区域布局
* 支持保存、加载数据
* 支持定义CSS样式
* 使用 Pinia 的内置状态持久化（可选）
* Supabase 集成用于云存储（可选）

### 安装

```
npm install -save vue-code-layout
```

在 main.ts 中导入:

```js
import 'vue-code-layout/lib/vue-code-layout.css'
import VueCodeLayout from '@edanweis/vue-code-layout'

createApp(App)
  .use(VueCodeLayout)  

```

关于详细的用法，请参考文档。

## 文档

[查看文档](https://docs.imengyu.top/vue-code-layout-docs/)

[查看在线演示](https://docs.imengyu.top/vue-code-layout-demo/)

## 开发

```shell
git clone git@github.com:edanweis/vue-code-layout.git
cd vue-code-layout
npm install
npm run dev        # Development serve project
npm run build-demo # Build example project
npm run build-lib  # Build library project
```

## 问题

开源项目需要大家的支持才能越做越好。如果您遇到了问题，可以在仓库提出Issue，我会尽可能的给你解决。

如果您有好的修改，欢迎提交PR，成为项目的一员！

## 广告：作者的其他有用的项目

* [vue3-context-menu Vue右键菜单组件](https://github.com/imengyu/vue3-context-menu)
* [vue-dock-layout Vue仿Visual studio拖拽布局组件](https://github.com/imengyu/vue-dock-layout)
* [vue-dynamic-form vue数据驱动的表单](https://github.com/imengyu/vue-dynamic-form)

## License

[MIT](./LICENSE)
