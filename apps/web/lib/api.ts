// API呼び出し用のヘルパー関数
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // デバッグ用：認証情報をログ出力
  console.log('API Call:', endpoint, 'Token:', token ? 'Present' : 'None');

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const apiGet = (endpoint: string) => apiCall(endpoint, { method: 'GET' });

export const apiPost = (endpoint: string, data?: any) => 
  apiCall(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: any) => 
  apiCall(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string) => 
  apiCall(endpoint, { method: 'DELETE' });

export const apiPatch = (endpoint: string, data?: any) => 
  apiCall(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });