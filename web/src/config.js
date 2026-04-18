const API_CONFIG = {
  BASE_URL: '/api/v1',
  ENDPOINTS: {
    SEARCH: '/avcode',
    COLLECTIONS: '/hacg',
    VIDEO: '/get_video',
    HOT_SEARCHES: '/hot_searches'
  }
}

// 从 localStorage 读取 API Key
export function getApiKey() {
  return localStorage.getItem('api_key') || ''
}

export function setApiKey(key) {
  localStorage.setItem('api_key', key)
}

// 带认证的 fetch 封装
export async function apiFetch(url, options = {}) {
  const key = getApiKey()
  const headers = {
    ...(options.headers || {}),
    ...(key ? { 'X-API-Key': key } : {})
  }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('api-unauthorized'))
  }
  return res
}

export default API_CONFIG
