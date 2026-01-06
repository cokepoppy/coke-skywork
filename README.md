# Skywork AI - 全栈项目

基于 Gemini AI 的智能助手平台,支持AI对话、PPT生成、图片编辑等功能。

## 示例截图

![PPT 生成与编辑示例](docs/images/readme/ppt.png)

## 项目结构

```
coke-skywork/
├── front/              # 前端应用 (React + TypeScript + Vite)
│   ├── components/    # React组件
│   ├── services/      # API服务
│   ├── utils/         # 工具函数
│   └── ...
│
├── docs/              # 项目文档
│   ├── 调研报告.md    # 市场调研和竞品分析
│   └── 技术方案.md    # 详细技术方案
│
├── output/            # 输出文件
└── README.md          # 本文件
```

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS
- Google Gemini API

### 后端 (规划中)
- Express + TypeScript
- MySQL + Prisma ORM
- Redis (缓存)
- Google OAuth 2.0
- Stripe 支付

## 快速开始

### 前端开发

```bash
cd front
npm install
npm run dev
```

详细说明见 [front/README.md](front/README.md)

### 后端开发 (待实现)

参考文档:
- [调研报告](docs/调研报告.md)
- [技术方案](docs/技术方案.md)

## 主要功能

✅ **AI对话**: Gemini Flash/Pro 模型
✅ **PPT生成**: 12种样式模板,AI生成专业PPT
✅ **PPT编辑**: 图片转可编辑HTML,AI文字去除
✅ **历史管理**: 侧边栏快速访问历史PPT

🚧 **用户系统**: Google OAuth登录 (待开发)
🚧 **点数系统**: 订阅和充值功能 (待开发)
🚧 **支付集成**: Stripe支付 (待开发)

## 版本分支

- **master**: 当前开发分支
- **v4**: AI文字去除 + 侧边栏历史
- **v3**: PPT编辑器初版
- **v2**: PPT样式模板
- **v1**: 基础版本

## 开发路线图

### Phase 1: MVP (已完成)
- ✅ 前端应用基础架构
- ✅ AI对话功能
- ✅ PPT生成功能
- ✅ PPT编辑器

### Phase 2: 后端服务 (进行中)
- 📝 技术方案已完成
- 🚧 Express + TypeScript 后端
- 🚧 MySQL 数据库设计
- 🚧 Google OAuth 认证

### Phase 3: 完整版 (规划中)
- ⏳ 点数和订阅系统
- ⏳ Stripe 支付集成
- ⏳ 管理后台
- ⏳ 数据分析

## 文档

- [前端文档](front/README.md)
- [调研报告](docs/调研报告.md)
- [技术方案](docs/技术方案.md)

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request!
