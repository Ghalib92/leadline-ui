import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const isDev = import.meta.env.DEV;

/**
 * Same origin: every request goes through our `/api/*` proxy
 * (`routes/api.$.ts`), which adds the backend token from the httpOnly cookie.
 * The browser never holds a token.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    // Lets our `/api/*` proxy accept file uploads: a cross-site HTML form
    // can't set custom headers.
    'X-Requested-With': 'leadline',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let signingOut = false;

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (isDev) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }

    // The server couldn't refresh the session: drop it and start again at login.
    if (
      error.response?.status === 401 &&
      typeof globalThis.window !== 'undefined' &&
      !signingOut
    ) {
      signingOut = true;
      void fetch('/auth/session', { method: 'DELETE' }).finally(() =>
        globalThis.location.assign('/auth/login')
      );
    }

    return Promise.reject(error);
  }
);
