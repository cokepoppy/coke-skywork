// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Token 管理
export const TokenManager = {
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): any | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// API 请求封装
interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requireAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // 添加认证 token
  if (requireAuth) {
    const token = TokenManager.getAccessToken();
    console.log(`[API] Making request to ${endpoint}, requireAuth: ${requireAuth}, hasToken: ${!!token}`);
    if (token) {
      console.log(`[API] Token (first 30 chars): ${token.substring(0, 30)}...`);
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`[API] No token available for authenticated request to ${endpoint}`);
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    console.log(`[API] Response status: ${response.status} for ${endpoint}`);

    // 如果 token 过期，尝试刷新
    if (response.status === 401 && requireAuth) {
      console.warn(`[API] Got 401 for ${endpoint}, attempting to refresh token...`);
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        console.log(`[API] Token refreshed successfully, retrying request to ${endpoint}`);
        // 重试请求
        const retryHeaders = { ...headers };
        const newToken = TokenManager.getAccessToken();
        console.log(`[API] New token (first 30 chars): ${newToken?.substring(0, 30)}...`);
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders,
        });

        console.log(`[API] Retry response status: ${retryResponse.status} for ${endpoint}`);
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }

        return await retryResponse.json();
      } else {
        // 刷新失败，跳转到登录
        console.error(`[API] Token refresh failed, redirecting to login`);
        TokenManager.clearTokens();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      console.error(`[API] Request failed for ${endpoint}:`, error);
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Request successful for ${endpoint}`);
    return data;
  } catch (error) {
    console.error(`[API] Exception during request to ${endpoint}:`, error);
    throw error;
  }
}

// 刷新 access token
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

// API 方法
export const API = {
  // ========== 认证相关 ==========
  auth: {
    // Google 登录（打开新窗口）
    loginWithGoogle(): void {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        `${API_BASE_URL}/api/auth/google`,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    },

    // 登出
    async logout(): Promise<void> {
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          await apiRequest('/api/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          });
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
      TokenManager.clearTokens();
    },

    // 获取当前用户信息
    async getCurrentUser(): Promise<any> {
      const response = await apiRequest<any>('/api/auth/me', {
        requireAuth: true,
      });
      if (response.success) {
        TokenManager.setUser(response.user);
        return response.user;
      }
      throw new Error('Failed to get user info');
    },
  },

  // ========== 用户相关 ==========
  user: {
    // 获取点数
    async getCredits(): Promise<number> {
      const response = await apiRequest<any>('/api/user/credits', {
        requireAuth: true,
      });
      return response.credits;
    },

    // 获取点数历史
    async getCreditHistory(limit = 50, offset = 0): Promise<any> {
      const response = await apiRequest<any>(
        `/api/user/credits/history?limit=${limit}&offset=${offset}`,
        { requireAuth: true }
      );
      return response;
    },
  },

  // ========== 支付相关 ==========
  payment: {
    // 获取点数包
    async getPackages(): Promise<any[]> {
      const response = await apiRequest<any>('/api/payment/packages');
      return response.packages || [];
    },

    // 创建支付会话
    async createCheckout(packageId: string): Promise<{ sessionId: string; checkoutUrl: string }> {
      const response = await apiRequest<any>('/api/payment/checkout', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
        requireAuth: true,
      });
      return response;
    },

    // 获取支付历史
    async getHistory(limit = 50, offset = 0): Promise<any> {
      const response = await apiRequest<any>(
        `/api/payment/history?limit=${limit}&offset=${offset}`,
        { requireAuth: true }
      );
      return response;
    },
  },

  // ========== 健康检查 ==========
  async healthCheck(): Promise<boolean> {
    try {
      const response = await apiRequest<any>('/health');
      return response.success === true;
    } catch (error) {
      return false;
    }
  },

  // ========== PPT演示文稿相关 ==========
  presentations: {
    // 保存PPT到数据库
    async save(presentation: any): Promise<any> {
      console.log('[API] Saving presentation to database');
      console.log('[API] Presentation data:', {
        topic: presentation.topic,
        topicLength: presentation.topic?.length,
        theme: presentation.theme,
        hasGeneratedImage: !!presentation.generatedImage,
        generatedImageLength: presentation.generatedImage?.length,
        hasHtmlContent: !!presentation.htmlContent,
        htmlContentLength: presentation.htmlContent?.length,
        hasThumbnailData: !!presentation.thumbnailData,
        thumbnailDataLength: presentation.thumbnailData?.length,
      });
      const response = await apiRequest<any>('/api/presentations', {
        method: 'POST',
        body: JSON.stringify(presentation),
        requireAuth: true,
      });
      console.log('[API] Save presentation response:', response);
      return response;
    },

    // 获取所有PPT列表
    async getAll(limit = 10, offset = 0): Promise<any> {
      const response = await apiRequest<any>(
        `/api/presentations?limit=${limit}&offset=${offset}`,
        { requireAuth: true }
      );
      return response;
    },

    // 获取单个PPT
    async getById(id: string): Promise<any> {
      const response = await apiRequest<any>(`/api/presentations/${id}`, {
        requireAuth: true,
      });
      return response;
    },

    // 更新PPT
    async update(id: string, updates: any): Promise<any> {
      const response = await apiRequest<any>(`/api/presentations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        requireAuth: true,
      });
      return response;
    },

    // 删除PPT
    async delete(id: string): Promise<any> {
      const response = await apiRequest<any>(`/api/presentations/${id}`, {
        method: 'DELETE',
        requireAuth: true,
      });
      return response;
    },
  },

  // ========== Gemini AI相关 ==========
  gemini: {
    // 创建聊天流
    async createChatStream(
      history: { role: string; parts: { text: string }[] }[],
      message: string,
      model: string,
      searchMode: boolean
    ): Promise<Response> {
      console.log('[API] Calling backend Gemini chat stream API');
      const token = TokenManager.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ history, message, model, searchMode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    },

    // 生成PPT图片
    async generateSlideImage(
      topic: string,
      stylePrompt: string = '',
      referenceImages: string[] = []
    ): Promise<string> {
      console.log('[API] Calling backend Gemini generate slide API');
      const response = await apiRequest<any>('/api/gemini/generate-slide', {
        method: 'POST',
        body: JSON.stringify({ topic, stylePrompt, referenceImages }),
        requireAuth: true,
      });

      if (response.success && response.imageData) {
        return response.imageData;
      }

      throw new Error('Failed to generate slide image');
    },

    // 移除图片中的文字
    async removeTextWithAI(imageBase64: string, useProModel = false): Promise<string> {
      console.log('[API] Calling backend Gemini remove text API');
      const response = await apiRequest<any>('/api/gemini/remove-text', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, useProModel }),
        requireAuth: true,
      });

      if (response.success && response.imageData) {
        return response.imageData;
      }

      throw new Error('Failed to remove text from image');
    },

    // 分析PPT图片
    async analyzePPTImage(imageBase64: string): Promise<any> {
      console.log('[API] Calling backend Gemini analyze PPT API');
      const response = await apiRequest<any>('/api/gemini/analyze-ppt', {
        method: 'POST',
        body: JSON.stringify({ imageBase64 }),
        requireAuth: true,
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to analyze PPT image');
    },
  },
};

export default API;
