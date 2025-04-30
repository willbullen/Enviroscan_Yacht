import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Enhanced error type for API errors
export interface ApiError extends Error {
  status: number;
  data?: any;
  url: string;
  method: string;
}

// Logger for API errors
export function logApiError(error: ApiError) {
  console.error(`API Error: ${error.method} ${error.url} (${error.status})`, error.message, error.data);
  
  // In a production app, you might want to send this to your error tracking service
  // Example: Sentry.captureException(error);
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  let errorData: any;
  let errorMessage: string;
  
  try {
    // Try to parse as JSON first
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await res.clone().json();
      errorMessage = errorData.message || `${res.status}: ${res.statusText}`;
    } else {
      // If it's not JSON and status is 401, it's an authentication error
      if (res.status === 401) {
        errorMessage = "Authentication required. Please log in.";
      } else {
        // For other content types, just use a generic message to avoid parsing HTML
        const responseText = await res.text();
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          errorMessage = `${res.status}: ${res.statusText} (HTML response)`;
        } else {
          errorMessage = responseText || res.statusText;
        }
      }
    }
  } catch (e) {
    // If all else fails, use the status text
    errorMessage = `${res.status}: ${res.statusText}`;
  }
  
  const error = new Error(errorMessage) as ApiError;
  error.status = res.status;
  error.data = errorData;
  error.url = res.url;
  error.method = 'GET'; // Will be overridden in apiRequest
  
  return error;
}

async function throwIfResNotOk(res: Response, method: string = 'GET') {
  if (!res.ok) {
    const error = await parseErrorResponse(res);
    error.method = method;
    logApiError(error);
    throw error;
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: {
    method: string;
    data?: unknown;
    headers?: Record<string, string>;
    validateStatus?: (status: number) => boolean;
  }
): Promise<T> {
  const { method, data, headers = {}, validateStatus } = options;
  
  try {
    // Set default headers and add custom headers
    const requestHeaders = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...headers
    };
    
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Allow custom status validation if provided
    if (validateStatus && !validateStatus(res.status)) {
      await throwIfResNotOk(res, method);
    } else if (!res.ok) {
      await throwIfResNotOk(res, method);
    }
    
    // Only try to parse JSON if there's content
    if (res.status !== 204) { // No content
      return await res.json();
    }
    
    return {} as T;
  } catch (error) {
    // Enhance errors that aren't already ApiErrors (like network errors)
    if (!(error as ApiError).status) {
      const apiError = error as ApiError;
      apiError.status = 0;
      apiError.url = url;
      apiError.method = method;
      logApiError(apiError);
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const url = queryKey[0] as string;
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (!res.ok) {
        await throwIfResNotOk(res, 'GET');
      }
      
      // Only try to parse JSON if there's content
      if (res.status !== 204) { // No content
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            return data;
          } else {
            // If not JSON, handle appropriately
            const textResponse = await res.text();
            if (textResponse.includes('<!DOCTYPE html>') || textResponse.includes('<html>')) {
              // HTML response indicates auth issue or error page
              if (res.status === 401 || res.status === 403) {
                const error = new Error("Authentication required. Please log in.") as ApiError;
                error.status = res.status;
                error.url = url;
                error.method = 'GET';
                logApiError(error);
                throw error;
              } else {
                const error = new Error(`Received HTML instead of JSON response.`) as ApiError;
                error.status = res.status;
                error.url = url;
                error.method = 'GET';
                logApiError(error);
                throw error;
              }
            }
            // For non-JSON text responses, create an appropriate response object
            return { message: textResponse } as any;
          }
        } catch (parseError) {
          const error = new Error(`Failed to parse response: ${(parseError as Error).message}`) as ApiError;
          error.status = res.status;
          error.url = url;
          error.method = 'GET';
          logApiError(error);
          throw error;
        }
      }
      
      return {} as any;
    } catch (error) {
      // Enhance errors that aren't already ApiErrors (like network errors)
      if (!(error as ApiError).status) {
        const apiError = error as ApiError;
        apiError.status = 0;
        apiError.url = queryKey[0] as string;
        apiError.method = 'GET';
        logApiError(apiError);
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
