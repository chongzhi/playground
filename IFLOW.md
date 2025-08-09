# IFLOW.md

此文件为在此代码库中工作的 iFlow Cli 提供指导。

## 项目概述

这是一个使用 HTML/CSS/JavaScript 实现的经典中国棋类游戏集合，无外部依赖。游戏包括：
1. 五子棋 (Gomoku)
2. 斗兽棋 (Animal Chess)
3. 中国象棋 (Chinese Chess)
4. 飞行棋 (Flight Chess)
5. 俄罗斯方块 (Tetris)

所有游戏都作为独立的 HTML 文件实现，包含内嵌的 CSS 和 JavaScript。

## 常用开发命令

### 启动开发服务器
```bash
npm run dev
```
使用 Vite 启动本地开发服务器。

### 构建生产版本
```bash
npm run build
```
构建用于生产部署的项目。

### 代码检查
```bash
npm run lint
```
运行 ESLint 检查代码质量问题。

### 预览生产构建
```bash
npm run preview
```
在本地预览生产构建。

## 代码架构

### 结构
- 根目录包含游戏 HTML 文件
- 每个游戏作为一个单独的 HTML 文件实现，内嵌 CSS 和 JavaScript
- package.json 中包含共享资产和配置
- 游戏特定目录（如 teris-cursor）包含独立的 HTML/CSS/JS 文件

### 游戏实现模式
1. HTML 文件包含完整的游戏实现，带有内嵌的 CSS/JS
2. 游戏使用基于网格或基于画布的渲染方式
3. 游戏逻辑在 JavaScript 类中实现
4. CSS 提供样式和响应式设计
5. 事件监听器处理用户交互

### 开发指南
1. 所有游戏应为独立的，除了 package.json 中的内容外不应有其他外部依赖
2. 游戏应在桌面和移动设备上都具有响应式设计
3. 代码应遵循现代 JavaScript 实践
4. 在游戏间保持一致的样式和 UI 模式
5. 每个游戏都应向用户显示清晰的规则

### 关键组件
1. JavaScript 类中的游戏状态管理
2. 用于 UI 更新的 DOM 操作
3. 用于用户交互的事件处理
4. 用于复杂图形的画布渲染（俄罗斯方块）
5. 用于视觉效果的 CSS 动画和过渡

### 测试
目前没有自动化测试。游戏应手动测试以下内容：
1. 正确的游戏规则实现
2. 在不同屏幕尺寸上的响应式设计
3. 流畅的用户交互
4. 正确的游戏状态管理