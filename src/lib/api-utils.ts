// Utility functions for robust API calls and error handling

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    retryCondition = (error) => {
      // Retry on network errors, 5xx status codes, and timeouts
      return (
        error.name === 'NetworkError' ||
        error.message.includes('fetch') ||
        error.message.includes('5') ||
        error.message.includes('timeout')
      );
    }
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's the last attempt or error doesn't match retry condition
      if (attempt === maxRetries || !retryCondition(lastError)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoffMultiplier, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

/**
 * Enhanced fetch wrapper with timeout and retry logic
 */
export async function robustFetch(
  url: string,
  options: RequestInit & { timeout?: number; retry?: RetryOptions } = {}
): Promise<Response> {
  const { timeout = 10000, retry, ...fetchOptions } = options;

  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  };

  if (retry) {
    return withRetry(fetchWithTimeout, retry);
  }

  return fetchWithTimeout();
}

/**
 * API call wrapper with comprehensive error handling
 */
export async function apiCall<T = unknown>(
  url: string,
  options: RequestInit & {
    timeout?: number;
    retry?: RetryOptions;
    expectedStatusCodes?: number[];
  } = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = 10000,
    retry,
    expectedStatusCodes = [200],
    ...fetchOptions
  } = options;

  try {
    const response = await robustFetch(url, {
      timeout,
      retry,
      ...fetchOptions,
    });

    let data: T | undefined;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text() as T;
    }

    if (!expectedStatusCodes.includes(response.status)) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      status: 0,
    };
  }
}

/**
 * File upload with retry logic and progress tracking
 */
export async function uploadFileWithRetry(
  url: string,
  file: File,
  options: {
    timeout?: number;
    retry?: RetryOptions;
  } = {}
): Promise<ApiResponse> {

  return apiCall(url, {
    method: 'POST',
    body: file,
    ...options,
  });
}

/**
 * Audio recording utilities with error recovery
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  async startRecording(constraints?: MediaStreamConstraints): Promise<void> {
    try {
      // Try to get microphone access with fallback constraints
      const defaultConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(
          constraints || defaultConstraints
        );
      } catch {
        // Fallback for older browsers or restricted permissions
        console.warn('Advanced constraints failed, using basic audio constraints');
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true
        });
      }

      // Find supported MIME type
      const mimeType = this.findSupportedMimeType();
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps for good quality
      });

      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  stopRecording(): Blob | null {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }

    this.cleanup();

    if (this.chunks.length === 0) {
      return null;
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    return new Blob(this.chunks, { type: mimeType });
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  private findSupportedMimeType(): string | null {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/wav',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return null;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
