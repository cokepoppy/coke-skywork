# Curl 测试命令示例

所有命令都已设置为不使用代理 (`--noproxy '*'`)

## 前置条件

```bash
# 设置后端地址
export API_URL="http://localhost:5000"

# 取消代理（如果有）
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
```

---

## 1. 健康检查

```bash
curl --noproxy '*' -X GET "$API_URL/health"
```

**期望输出**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 2. 认证接口

### 2.1 获取认证配置

```bash
curl --noproxy '*' -X GET "$API_URL/api/auth/config"
```

### 2.2 Google 登录 (浏览器访问)

在浏览器中打开:
```
http://localhost:5000/api/auth/google
```

### 2.3 刷新 Token

```bash
curl --noproxy '*' -X POST "$API_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 2.4 登出

```bash
curl --noproxy '*' -X POST "$API_URL/api/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### 2.5 获取当前用户信息

```bash
curl --noproxy '*' -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 3. 用户接口

### 3.1 获取用户点数

```bash
curl --noproxy '*' -X GET "$API_URL/api/user/credits" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 3.2 获取点数历史

```bash
curl --noproxy '*' -X GET "$API_URL/api/user/credits/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 4. 支付接口

### 4.1 获取点数包列表

```bash
curl --noproxy '*' -X GET "$API_URL/api/payment/packages"
```

### 4.2 创建支付会话

```bash
curl --noproxy '*' -X POST "$API_URL/api/payment/checkout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "packageId": "package_id_here"
  }'
```

### 4.3 获取支付历史

```bash
curl --noproxy '*' -X GET "$API_URL/api/payment/history?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## 5. Gemini AI 接口

### 5.1 聊天流

```bash
curl --noproxy '*' -X POST "$API_URL/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "history": [],
    "message": "你好，请介绍一下人工智能",
    "model": "gemini-2.5-flash",
    "searchMode": false
  }'
```

### 5.2 生成 PPT 图片

```bash
curl --noproxy '*' -X POST "$API_URL/api/gemini/generate-slide" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "topic": "人工智能发展趋势",
    "stylePrompt": "现代简约风格，蓝色主题",
    "referenceImages": []
  }'
```

### 5.3 移除图片文字

```bash
curl --noproxy '*' -X POST "$API_URL/api/gemini/remove-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
    "useProModel": false
  }'
```

### 5.4 分析 PPT 图片

```bash
curl --noproxy '*' -X POST "$API_URL/api/gemini/analyze-ppt" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgo..."
  }'
```

---

## 6. 错误测试

### 6.1 测试 404

```bash
curl --noproxy '*' -X GET "$API_URL/api/nonexistent"
```

### 6.2 测试未认证

```bash
curl --noproxy '*' -X GET "$API_URL/api/auth/me"
```

**期望输出**: 401 Unauthorized

---

## 获取 Access Token 的方法

### 方法1: 通过浏览器登录

1. 在浏览器打开前端: `http://localhost:3000`
2. 点击 Google 登录
3. 登录成功后，打开浏览器开发者工具 (F12)
4. 切换到 Console 标签页
5. 输入: `localStorage.getItem('accessToken')`
6. 复制返回的 token

### 方法2: 通过日志获取

1. 查看后端日志
2. 找到 `[Auth] Tokens generated for user: ...` 日志
3. 在重定向 URL 中可以看到 accessToken

---

## 完整测试示例

```bash
#!/bin/bash

# 设置变量
API_URL="http://localhost:5000"
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

# 取消代理
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

echo "测试健康检查..."
curl --noproxy '*' -X GET "$API_URL/health"
echo -e "\n"

echo "测试获取用户信息..."
curl --noproxy '*' -X GET "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo -e "\n"

echo "测试获取点数..."
curl --noproxy '*' -X GET "$API_URL/api/user/credits" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
echo -e "\n"

echo "测试 Gemini 聊天..."
curl --noproxy '*' -X POST "$API_URL/api/gemini/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "history": [],
    "message": "Hello",
    "model": "gemini-2.5-flash",
    "searchMode": false
  }'
echo -e "\n"
```

---

## 注意事项

1. **所有命令都使用 `--noproxy '*'`** 来禁用代理
2. **认证接口需要 Bearer Token** 在 Authorization header 中
3. **POST 请求需要 Content-Type: application/json**
4. **测试前确保后端服务已启动**
5. **可以使用 `-v` 参数查看详细请求信息**: `curl -v ...`
6. **可以使用 `jq` 美化 JSON 输出**: `curl ... | jq`

---

## 自动化测试

使用提供的测试脚本:

```bash
cd backend
./test-api.sh
```

该脚本会自动测试所有接口，并生成测试报告。
