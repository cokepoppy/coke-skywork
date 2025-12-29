# Skywork AI - Frontend

这是Skywork AI的前端应用,基于React + TypeScript + Vite构建。

## 技术栈

- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS
- **状态管理**: React Hooks
- **HTTP客户端**: Fetch API
- **AI服务**: Google Gemini API

## 主要功能

1. **AI对话**: 支持Gemini Flash/Pro模型对话
2. **PPT生成**: 基于AI生成专业PPT图片
   - 12种预设样式模板
   - 参考图片系统
   - 图片上传分析
3. **PPT编辑器**:
   - 图片转可编辑HTML
   - AI文字去除(背景生成)
   - 拖拽调整元素
   - 导出PNG/HTML
4. **历史记录**: 侧边栏显示最近PPT,点击快速加载

## 项目结构

```
front/
├── components/          # React组件
│   ├── ChatInterface.tsx        # 主聊天界面
│   ├── Sidebar.tsx              # 侧边栏
│   └── PPTEditor/              # PPT编辑器
│       ├── PPTEditor.tsx        # 编辑器容器
│       ├── PPTCanvas.tsx        # 画布
│       ├── EditableElement.tsx  # 可编辑元素
│       ├── Toolbar.tsx          # 工具栏
│       └── elements/           # 元素组件
│           ├── TextElement.tsx
│           ├── ImageElement.tsx
│           └── ShapeElement.tsx
├── services/           # 服务层
│   └── geminiService.ts        # Gemini API集成
├── utils/             # 工具函数
│   ├── export.ts              # 导出功能
│   └── imageProcessing.ts     # 图片处理(AI文字去除)
├── public/            # 静态资源
│   └── styles/               # PPT样式参考图
├── types.ts           # TypeScript类型定义
├── App.tsx            # 根组件
├── index.tsx          # 入口文件
├── index.html         # HTML模板
└── vite.config.ts     # Vite配置
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件:

```bash
# Gemini API Key (必需)
VITE_API_KEY=your-gemini-api-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 4. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 核心功能使用

### AI对话
1. 点击"Chat"选择对话模式
2. 选择模型(Flash/Pro)
3. 输入问题,发送
4. 可选启用Google Search增强

### PPT生成
1. 点击"Slides"进入PPT模式
2. 选择样式模板(红灰/科技蓝/蓝绿等)
3. 输入PPT主题或详细内容
4. 点击发送,等待生成
5. 生成后可点击"Edit"编辑

### PPT编辑
1. 上传PPT图片或从历史加载
2. AI自动分析并提取文字、图标
3. 双击文字编辑内容
4. 拖拽调整位置和大小
5. 导出PNG或HTML

## 开发指南

### 添加新的PPT样式

在 `ChatInterface.tsx` 的 `PPT_STYLES` 数组中添加:

```typescript
{
  id: 'my_style',
  title: '我的风格',
  color: 'bg-purple-600',
  previewColor: 'from-purple-600 to-pink-500',
  suffix: '你的系统提示词...',
  refs: ['/styles/my_style/ref1.png', ...]
}
```

### 修改点数消费规则

在未来的版本中,点数消费将由后端管理。当前为前端演示版本,无点数限制。

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_API_KEY` | Gemini API密钥 | 是 |

## 浏览器支持

- Chrome/Edge >= 90
- Firefox >= 88
- Safari >= 14

## 已知问题

1. 大图片上传可能导致内存占用过高
2. localStorage有5MB限制,历史记录过多可能超限(已优化)
3. AI文字去除功能需要Gemini 3 Pro模型支持

## 版本历史

- **v4** (2025-12-18): AI文字去除 + 侧边栏历史 + 所有bug修复
- **v3**: PPT编辑器 + 图片转HTML + 历史管理
- **v2**: 12个PPT样式模板 + 参考图片系统
- **v1**: 基础聊天 + PPT生成

## 贡献指南

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议,请提交Issue。
