# 🔧 DevToolbox

开发者常用工具集 — 一个纯前端的 Web 工具箱，所有数据均在浏览器本地处理，无需登录、不依赖后端、无隐私泄露风险。

## 特性

- **零后端** — 所有计算在浏览器端完成，不上传任何数据
- **即开即用** — 打开页面即可使用，无需注册登录
- **轻量快速** — Vue 3 + Vite 构建，首屏加载快，交互流畅
- **深色模式** — 支持浅色 / 深色主题切换，自动跟随系统
- **可扩展** — 工具以独立 View + Store 方式组织，添加新工具成本低

## 工具列表

| 工具 | 路径 | 状态 |
|------|------|------|
| JSON 查看器 | `/json-viewer` | ✅ 已实现 |
| SQL 格式化 | `/sql-formatter` | ✅ 已实现 |
| 时间戳转换 | `/timestamp` | ✅ 已实现 |
| 密码生成器 | `/password` | ✅ 已实现 |
| 颜色转换 | `/color` | ✅ 已实现 |
| 列值拼接 | `/list-formatter` | ✅ 已实现 |
| 正则测试器 | `/regex` | 🔜 即将 |
| 文本 Diff | `/diff` | 🔜 即将 |
| JWT 解析 | `/jwt` | 🔜 即将 |
| URL 编解码 | `/url-codec` | 🔜 即将 |

## 技术栈

| 维度 | 选择 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建 | Vite |
| 语言 | TypeScript |
| 状态管理 | Pinia |
| 路由 | Vue Router (Hash 模式) |
| 样式 | CSS Variables + Scoped Styles |
| 部署 | Nginx 静态文件 |

## 项目结构

```
tool/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.vue                    # 根组件（侧边栏 + 内容区布局）
│   ├── main.ts                    # 入口
│   ├── router/
│   │   └── index.ts               # 路由配置
│   ├── stores/
│   │   ├── themeStore.ts          # 深色/浅色模式状态
│   │   ├── jsonStore.ts           # JSON 数据状态
│   │   ├── sqlStore.ts            # SQL 格式化状态
│   │   └── timestampStore.ts      # 时间戳转换状态
│   ├── views/
│   │   ├── HomeView.vue           # 首页 / 工具导航卡片墙
│   │   ├── JsonViewer.vue         # JSON 查看器
│   │   ├── SqlFormatter.vue       # SQL 格式化
│   │   └── TimestampTool.vue      # 时间戳转换
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.vue     # 左侧侧边栏容器
│   │   │   ├── SidebarLogo.vue    # Logo + 标题
│   │   │   ├── SidebarNav.vue     # 导航菜单
│   │   │   └── ThemeToggle.vue    # 深色/浅色切换按钮
│   │   └── json/
│   │       ├── JsonInput.vue      # JSON 输入面板
│   │       ├── JsonTree.vue       # JSON 树视图
│   │       ├── JsonNode.vue       # 树节点（递归）
│   │       └── StatusBar.vue      # 状态栏
│   ├── utils/
│   │   ├── jsonParser.ts          # JSON 解析 & 错误提取
│   │   ├── syntaxHighlight.ts     # JSON 语法高亮逻辑
│   │   ├── sqlFormatter.ts        # SQL 格式化引擎
│   │   └── timestamp.ts           # 时间戳转换
│   ├── types/
│   │   └── index.ts               # TypeScript 类型定义
│   └── styles/
│       └── global.css             # 全局样式 & CSS 变量
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── DESIGN.md                      # 详细设计文档
└── README.md
```

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

### 部署

构建后的产物在 `dist/` 目录，可直接部署到任意静态文件服务器。

**Nginx 配置示例：**

```nginx
server {
    listen 80;
    server_name tool.your-domain.com;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Docker 部署：**

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## 设计理念

- **隐私优先**：所有数据仅在浏览器内存中处理，绝不会上传至任何服务器
- **终端风格**：深黑墨绿配色，等宽字体优先，贴合开发者审美
- **简单可靠**：每个工具独立，互不耦合，易于维护和扩展

## License

MIT
