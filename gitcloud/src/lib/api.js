import axios from 'axios';

const api = axios.create({
  withCredentials: true,
});

// Direct backend API instance for large uploads (bypasses Next.js proxy)
const directApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// Attach auth token header to direct API calls
directApi.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/authsnap_session=([^;]+)/);
    if (match) {
      config.headers.Authorization = `Bearer ${match[1]}`;
    }
  }
  return config;
});

export { directApi };
export default api;
