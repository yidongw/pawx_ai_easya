import { useAuthStore } from '@/store/authStore';
import { Env } from './Env';

/**
 * Wrapper for fetch that handles authentication errors
 * When receiving a 401 response, it will mark the user as not verified
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${Env.NEXT_PUBLIC_API_HOST}${endpoint}`;

  // Get token from auth store
  const authStore = useAuthStore.getState();

  // Create headers with Authorization if we have a token
  const headers = new Headers(options.headers || {});
  if (authStore.token) {
    headers.set('Authorization', `Turnstile ${authStore.token}`);
  }

  // Update options with the headers
  const updatedOptions = {
    ...options,
    headers,
  };

  const response = await fetch(url, updatedOptions);

  // Handle 401 Unauthorized responses by requiring verification
  if (response.status === 401) {
    authStore.setToken(null);
  }

  return response;
}
