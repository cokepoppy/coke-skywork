# 修改说明文档

## 修改概述

本次修改主要包括以下几个方面：

1. **修复登录成功后无法切换到主界面的问题**
2. **将 Gemini API 调用从前端迁移到后端**
3. **添加详细的调试日志**
4. **提供 curl 命令测试所有后端接口**

---

## 1. 登录问题修复

### 问题描述
登录成功后，用户没有被重定向到主界面。

### 根本原因
后端 Google OAuth 回调重定向 URL 与前端路由不匹配：
- 后端重定向到: `/auth-callback.html`
- 前端路由为: `/auth/callback`

### 修复内容

#### 后端修改
**文件**: `backend/src/controllers/auth.controller.ts`

修改第 51 行的重定向 URL：
```typescript
// 修改前
const redirectUrl = `${process.env.FRONTEND_URL}/auth-callback.html?accessToken=${accessToken}&refreshToken=${refreshToken}`;

// 修改后
const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
```

#### 添加的日志
- `[Auth] Google OAuth callback started`
- `[Auth] User authenticated: {email} (ID: {id})`
- `[Auth] Tokens generated for user: {email}`
- `[Auth] Session created for user: {email}`
- `[Auth] Redirecting to: {url}`

#### 前端修改
**文件**:
- `front/components/AuthCallback.tsx`
- `front/App.tsx`

添加的日志：
- `[AuthCallback] Component mounted`
- `[AuthCallback] Current URL`
- `[AuthCallback] Search params`
- `[AuthCallback] Saving tokens to localStorage...`
- `[AuthCallback] Redirecting to home page...`
- `[App] Checking authentication...`
- `[App] Current pathname`
- `[App] Access token present`

---

## 2. Gemini API 迁移到后端

### 为什么迁移
1. **安全性**: 避免在前端暴露 Gemini API Key
2. **性能**: 后端可以更好地处理大数据请求
3. **控制**: 后端可以实施速率限制和用量统计
4. **一致性**: 统一的日志记录和错误处理

### 新增文件

#### 后端文件
1. `backend/src/services/gemini.service.ts` - Gemini 服务封装
2. `backend/src/controllers/gemini.controller.ts` - Gemini 控制器
3. `backend/src/routes/gemini.routes.ts` - Gemini 路由

#### 新增依赖
```bash
npm install @google/genai
```

### 后端 API 端点

所有端点都需要认证 (Bearer Token)

#### 1. 聊天流
```bash
POST /api/gemini/chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "history": [],
  "message": "Hello",
  "model": "gemini-2.5-flash",
  "searchMode": false
}
```

#### 2. 生成 PPT 图片
```bash
POST /api/gemini/generate-slide
Content-Type: application/json
Authorization: Bearer {token}

{
  "topic": "AI Technology",
  "stylePrompt": "Modern and professional",
  "referenceImages": ["base64data1", "base64data2"]
}
```

#### 3. 移除图片文字
```bash
POST /api/gemini/remove-text
Content-Type: application/json
Authorization: Bearer {token}

{
  "imageBase64": "data:image/png;base64,...",
  "useProModel": false
}
```

#### 4. 分析 PPT 图片
```bash
POST /api/gemini/analyze-ppt
Content-Type: application/json
Authorization: Bearer {token}

{
  "imageBase64": "data:image/png;base64,..."
}
```

### 前端修改

**文件**: `front/services/geminiService.ts`

完全重写，现在所有方法都通过 `API.gemini.*` 调用后端接口，不再直接调用 Google Gemini API。

**文件**: `front/services/api.ts`

新增 `API.gemini` 对象，包含所有 Gemini 相关的 API 调用方法。

---

## 3. 环境变量配置

### 后端环境变量

确保 `backend/.env` 文件包含以下配置：

```env
# Gemini API Key (必需)
GEMINI_API_KEY=your-gemini-api-key-here

# Google OAuth (如果使用 Google 登录)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# 其他配置请参考 .env.example
```

### 前端环境变量

确保 `front/.env` 文件包含：

```env
VITE_API_URL=http://localhost:5000
```

---

## 4. API 测试脚本

### 使用方法

```bash
# 进入后端目录
cd backend

# 运行测试脚本
./test-api.sh
```

### 测试内容

脚本会测试以下接口：

1. **健康检查**
   - `GET /health`

2. **认证接口**
   - `GET /api/auth/config`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`

3. **用户接口** (需要认证)
   - `GET /api/user/credits`
   - `GET /api/user/credits/history`

4. **支付接口**
   - `GET /api/payment/packages`
   - `POST /api/payment/checkout` (需要认证)
   - `GET /api/payment/history` (需要认证)

5. **Gemini AI 接口** (需要认证)
   - `POST /api/gemini/chat`
   - `POST /api/gemini/generate-slide`
   - `POST /api/gemini/remove-text`
   - `POST /api/gemini/analyze-ppt`

6. **错误处理**
   - `GET /api/nonexistent` (测试404)

### 测试输出示例

```
========================================
Backend API 测试脚本
API URL: http://localhost:5000
========================================

=== 1. 健康检查 ===
[TEST 1] Health Check
  Method: GET
  Endpoint: /health
  Status: 200
  ✓ PASSED
  Response: {"success":true,"message":"Server is running","timestamp":"2025-01-15T10:30:00.000Z"}

...

========================================
测试总结
========================================
总测试数: 18
通过: 18
失败: 0

所有测试通过！ ✓
```

---

## 5. 启动服务

### 启动后端

```bash
cd backend

# 确保依赖已安装
npm install

# 运行数据库迁移 (首次运行)
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

后端将在 `http://localhost:5000` 启动

### 启动前端

```bash
cd front

# 确保依赖已安装
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:3000` 启动

---

## 6. 调试日志说明

### 后端日志格式

所有日志都使用统一的前缀格式：
```
[模块名] 日志内容
```

示例：
- `[Auth] Google OAuth callback started`
- `[Gemini] Generating slide image for topic: "AI Technology"`
- `[GeminiController] Chat stream request received`

### 前端日志格式

使用相同的格式：
```
[组件/服务名] 日志内容
```

示例：
- `[AuthCallback] Component mounted`
- `[GeminiService] Creating chat stream via backend API`
- `[API] Calling backend Gemini chat stream API`

### 查看日志

#### 后端日志
后端日志会输出到控制台，使用 Winston 日志库。

#### 前端日志
前端日志输出到浏览器控制台 (按 F12 打开开发者工具)。

---

## 7. 常见问题

### Q1: 登录后仍然无法进入主界面
**检查**:
1. 浏览器控制台是否有错误？
2. 查看 `[AuthCallback]` 日志，token 是否正确保存？
3. 后端日志是否显示 `[Auth] Redirecting to: ...`？
4. 检查 `FRONTEND_URL` 环境变量是否正确

### Q2: Gemini API 调用失败
**检查**:
1. 后端 `.env` 文件中 `GEMINI_API_KEY` 是否正确配置？
2. 后端日志是否显示 `[Gemini] GEMINI_API_KEY not configured`？
3. 前端是否已登录（需要认证 token）？
4. 网络连接是否正常？

### Q3: 测试脚本全部失败
**检查**:
1. 后端服务是否已启动？
2. 端口是否为 5000？如果不是，修改 `test-api.sh` 中的 `API_URL`
3. 是否有代理设置？脚本会自动取消代理

### Q4: 前端无法连接后端
**检查**:
1. `front/.env` 中的 `VITE_API_URL` 是否正确？
2. 后端 CORS 配置是否允许前端域名？
3. 查看 `backend/src/app.ts` 中的 CORS 配置

---

## 8. Chrome DevTools MCP 调试

前端可以使用 Chrome DevTools MCP 进行调试。

### 使用方法

1. 打开 Chrome 浏览器
2. 访问前端应用: `http://localhost:3000`
3. 按 F12 打开开发者工具
4. 在 Console 标签页查看所有日志
5. 在 Network 标签页查看 API 请求

### 调试技巧

1. **过滤日志**: 在 Console 中输入 `[Auth]` 或 `[Gemini]` 过滤特定模块的日志
2. **查看请求详情**: Network 标签页中点击请求查看 Headers、Payload、Response
3. **断点调试**: Sources 标签页中设置断点
4. **查看 LocalStorage**: Application 标签页 → Local Storage

---

## 9. 下一步

完成以上修改后，建议：

1. 运行 `test-api.sh` 确保所有接口正常
2. 测试完整的登录流程
3. 测试 Gemini API 功能（聊天、生成 PPT 等）
4. 检查前后端日志，确保没有错误

---

## 10. 修改文件清单

### 后端修改
- ✅ `backend/src/controllers/auth.controller.ts` - 修复重定向 URL，添加日志
- ✅ `backend/src/services/gemini.service.ts` - 新建 Gemini 服务
- ✅ `backend/src/controllers/gemini.controller.ts` - 新建 Gemini 控制器
- ✅ `backend/src/routes/gemini.routes.ts` - 新建 Gemini 路由
- ✅ `backend/src/app.ts` - 注册 Gemini 路由
- ✅ `backend/package.json` - 添加 @google/genai 依赖
- ✅ `backend/test-api.sh` - 新建 API 测试脚本

### 前端修改
- ✅ `front/components/AuthCallback.tsx` - 添加详细日志
- ✅ `front/App.tsx` - 添加详细日志
- ✅ `front/services/api.ts` - 添加 Gemini API 方法
- ✅ `front/services/geminiService.ts` - 重写为调用后端 API

### 新增文件
- ✅ `CHANGES.md` - 本文档
- ✅ `backend/test-api.sh` - API 测试脚本

---

## 联系与支持

如有问题，请检查：
1. 后端控制台日志
2. 前端浏览器控制台
3. 网络请求详情
4. 环境变量配置

Happy coding! 🚀
