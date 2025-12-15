# Gemini 卡通香蕉生成器

使用 Google Gemini API (Nano Banana) 生成可爱的卡通图片

## 📁 文件说明

### 已生成的图片
- **cartoon-banana-0.png** (1.5 MB) - 由 Gemini AI 生成的卡通香蕉图片 ✅
- **cartoon-banana.svg** (2.1 KB) - 本地生成的SVG卡通香蕉

### 代码文件

#### 1. Node.js 版本
**generate-banana.js** - 使用 @google/genai SDK
```bash
node generate-banana.js
```

#### 2. 浏览器版本（推荐）
**generate-browser.html** - 完整的网页应用
- 在浏览器中打开此文件即可使用
- 可视化界面，可自定义提示词
- 实时预览和下载生成的图片

#### 3. Shell 脚本版本
**generate-with-curl.sh** - 使用 curl 命令行
```bash
chmod +x generate-with-curl.sh
./generate-with-curl.sh
```

## 🚀 使用方法

### 方式一：Node.js（已安装依赖）
```bash
# 已安装 @google/genai
node generate-banana.js
```

### 方式二：浏览器（最简单）
1. 双击打开 `generate-browser.html`
2. 输入或修改提示词
3. 点击"生成卡通图片"按钮
4. 等待生成完成，下载图片

### 方式三：命令行
```bash
./generate-with-curl.sh
```

## 🔑 API 配置

当前使用的 API Key: `AIzaSyBu1dY2GoimsGVNjPVUD28p6QbC5RABps0`

使用的模型: **gemini-2.5-flash-image** (Nano Banana)

## ✨ 功能特点

- ✅ 文本生成图片（Text-to-Image）
- ✅ 自定义提示词
- ✅ 自动保存生成的图片
- ✅ 支持 PNG 格式输出
- ✅ 浏览器和命令行两种使用方式

## 📦 依赖

Node.js 版本需要安装：
```bash
npm install @google/genai
```

浏览器版本无需安装，直接使用 ES Module CDN。

## 🎨 示例提示词

```
A cute cartoon banana character with a friendly smile, big eyes,
colorful and playful style, suitable for children.
The banana should have arms and legs, and look very happy and cheerful.
```

## 📝 注意事项

1. API Key 有使用配额限制
2. 生成图片可能需要几秒到几十秒
3. 浏览器版本可能更稳定
4. Node.js 版本在某些网络环境下可能超时

## 🎉 已成功生成

- ✅ 1 张 AI 生成的卡通香蕉图片 (cartoon-banana-0.png)
- ✅ 1 张本地 SVG 卡通香蕉图片 (cartoon-banana.svg)

## 📖 相关文档

- [Gemini API 图像生成文档](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
