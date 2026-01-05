# Loading Effects - Usage Guide

## 已实现的加载特效

### 1. 页面初始加载动画
- **全屏加载遮罩** - 优雅的渐变背景
- **旋转加载器** - 双层旋转动画
- **进度条** - 显示资源加载进度
- **自动淡出** - 页面加载完成后平滑消失

### 2. 视频加载动画
- 所有 `<video>` 元素会自动获得加载遮罩
- 显示旋转加载器和"Loading video..."文本
- 视频准备好后自动消失

### 3. 点云加载增强
- 增强了 `#pointcloud-loading` 的视觉效果
- 添加了脉冲动画的加载器
- 动态文本效果

### 4. 图片懒加载（可选）
如果需要懒加载某些图片，可以这样使用：

```html
<div class="lazy-image-wrapper">
    <img data-src="path/to/image.jpg" alt="Description">
</div>
```

## 自定义使用

### 为动态内容添加加载效果

```javascript
// 显示加载
const overlay = LoadingManager.showLoading(element, 'Loading content');

// 加载完成后隐藏
LoadingManager.hideLoading(overlay);
```

### 示例：动态视频切换

```javascript
const video = document.getElementById('my-video');
const container = video.parentElement;

// 显示加载
const overlay = LoadingManager.showLoading(container, 'Loading video');

// 切换视频源
video.src = newVideoUrl;
video.load();

// 视频准备好后隐藏加载
video.addEventListener('loadeddata', () => {
    LoadingManager.hideLoading(overlay);
}, { once: true });
```

## CSS 类

### 动画类
- `.fade-in` - 淡入动画
- `.loading-dots` - 点点点动画效果
- `.shimmer` - 闪烁加载动画

### 状态类
- `.page-loader.hidden` - 隐藏页面加载器
- `.video-loading-overlay.hidden` - 隐藏视频加载遮罩
- `.lazy-image-wrapper.loaded` - 图片加载完成

## 特性

✅ 自动检测所有视频和图片
✅ 智能进度追踪
✅ 最小加载时间保证（800ms）确保用户看到加载动画
✅ 平滑的过渡动画
✅ 现代化的设计风格
✅ 响应式设计
✅ 零配置，开箱即用

## 浏览器兼容性

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅
- IE11: ⚠️ 部分功能可能不支持
