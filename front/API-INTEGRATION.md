# 前端API集成文档

## 已完成的修改

### 1. 新增文件

#### `services/api.ts` - API客户端
完整的后端 API 集成，包括：
- **Token 管理**: 自动管理 access token 和 refresh token
- **自动刷新**: token 过期时自动刷新
- **认证 API**: Google 登录、登出、获取用户信息
- **用户 API**: 获取点数、点数历史
- **支付 API**: 获取点数包、创建支付、支付历史

#### `components/LoginButton.tsx` - 登录按钮组件
- Google 登录按钮
- 用户信息显示（头像、姓名、邮箱）
- 点数显示
- 登出功能
- 自动检测登录状态

#### `auth-callback.html` - OAuth 回调页面
处理 Google OAuth 登录成功后的回调

### 2. 修改文件

#### `App.tsx`
- 添加顶部导航栏
- 集成 LoginButton 组件
- 显示应用标题和登录状态

#### `backend/src/controllers/auth.controller.ts`
- 修改 OAuth 回调重定向 URL

## 使用方法

### 1. 启动前端开发服务器

```bash
cd front
npm install  # 如果还没安装依赖
npm run dev
```

前端将运行在 `http://localhost:5173`

### 2. 配置环境变量

前端 `.env` 文件已创建：
```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=your-gemini-api-key
```

### 3. Google 登录流程

1. 用户点击"使用 Google 登录"按钮
2. 弹出 Google 授权窗口
3. 用户授权后，Google 重定向到后端 `/api/auth/google/callback`
4. 后端生成 JWT tokens，重定向到前端 `/auth-callback.html?accessToken=xxx&refreshToken=xxx`
5. 回调页面自动保存 tokens 并关闭弹窗（或跳转到主页）
6. 主页面接收到 tokens，获取用户信息并显示

### 4. API 调用示例

#### 获取当前用户信息
```typescript
import API from './services/api';

// 自动包含 Authorization header
const user = await API.auth.getCurrentUser();
console.log(user);
```

#### 获取用户点数
```typescript
const credits = await API.user.getCredits();
console.log('当前点数:', credits);
```

#### 获取点数历史
```typescript
const history = await API.user.getCreditHistory(50, 0);
console.log('点数历史:', history.logs);
```

#### 获取点数包列表
```typescript
const packages = await API.payment.getPackages();
console.log('可购买的点数包:', packages);
```

#### 创建支付
```typescript
const { checkoutUrl } = await API.payment.createCheckout(packageId);
window.location.href = checkoutUrl; // 跳转到 Stripe 支付页面
```

### 5. Token 管理

#### 手动管理 Tokens
```typescript
import { TokenManager } from './services/api';

// 获取 token
const accessToken = TokenManager.getAccessToken();
const refreshToken = TokenManager.getRefreshToken();

// 设置 token
TokenManager.setTokens(accessToken, refreshToken);

// 清除 token（登出）
TokenManager.clearTokens();

// 获取/设置用户信息
const user = TokenManager.getUser();
TokenManager.setUser(userData);
```

## 与现有 Gemini 代码集成

前端目前直接调用 Gemini API 生成 PPT。以后可以改为通过后端调用：

### 选项 1: 继续前端直接调用（当前方式）
- 优点：响应快，不占用后端资源
- 缺点：无法准确扣除点数，API key 暴露在前端

### 选项 2: 通过后端调用（推荐）
需要在后端添加 PPT 生成接口：

```typescript
// 后端新增接口
POST /api/ppt/generate
Body: { topic: string, style: string }
Headers: Authorization: Bearer <token>

// 前端调用
const response = await apiRequest('/api/ppt/generate', {
  method: 'POST',
  body: JSON.stringify({ topic, style }),
  requireAuth: true
});
```

后端会：
1. 验证用户身份
2. 检查并扣除点数
3. 调用 Gemini API 生成 PPT
4. 记录使用日志
5. 返回生成的 PPT

## 点数扣除集成

如果要集成点数扣除，在调用 Gemini 之前：

```typescript
// 在生成 PPT 之前
try {
  // 检查点数是否足够
  const credits = await API.user.getCredits();
  const requiredCredits = 10; // PPT 生成需要 10 点数

  if (credits < requiredCredits) {
    alert('点数不足，请充值');
    // 显示充值页面
    return;
  }

  // 生成 PPT（如果通过后端，会自动扣除点数）
  const ppt = await generatePPT(topic);

  // 刷新点数显示
  const newCredits = await API.user.getCredits();
  updateCreditsDisplay(newCredits);

} catch (error) {
  console.error('生成失败:', error);
}
```

## UI/UX 改进建议

### 1. 添加充值按钮
```typescript
// 在 LoginButton 组件中添加
<button onClick={handleRecharge}>
  充值
</button>

const handleRecharge = async () => {
  const packages = await API.payment.getPackages();
  // 显示充值弹窗，让用户选择点数包
  showRechargeModal(packages);
};
```

### 2. 添加点数不足提示
```typescript
// 在发送请求前检查
if (credits < requiredCredits) {
  showNotification({
    type: 'warning',
    message: `点数不足！当前: ${credits}, 需要: ${requiredCredits}`,
    action: {
      text: '去充值',
      onClick: handleRecharge
    }
  });
  return;
}
```

### 3. 添加使用记录查看
```typescript
// 新增历史记录组件
const CreditHistory = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.user.getCreditHistory().then(data => {
      setHistory(data.logs);
    });
  }, []);

  return (
    <div>
      {history.map(log => (
        <div key={log.id}>
          <span>{log.description}</span>
          <span>{log.amount > 0 ? '+' : ''}{log.amount}</span>
          <span>余额: {log.balance}</span>
        </div>
      ))}
    </div>
  );
};
```

## 测试步骤

1. **启动后端**: `cd backend && npm run dev`
2. **启动前端**: `cd front && npm run dev`
3. **打开浏览器**: http://localhost:5173
4. **点击登录**: 使用 Google 账号登录
5. **检查状态**: 登录后应该显示用户信息和点数
6. **测试 API**: 打开浏览器控制台，查看网络请求

## 常见问题

### Q: 登录后没有显示用户信息？
A: 检查浏览器控制台是否有错误，确认：
- 后端服务器正在运行
- Google OAuth 配置正确
- 浏览器允许弹窗

### Q: Token 过期怎么办？
A: API 会自动刷新 token，如果刷新失败会自动跳转登录

### Q: 如何添加新的 API？
A: 在 `services/api.ts` 的 API 对象中添加新方法即可

## 下一步计划

- [ ] 添加充值功能 UI
- [ ] 添加点数历史查看页面
- [ ] 将 PPT 生成改为通过后端调用
- [ ] 添加订阅管理功能
- [ ] 添加用户设置页面
