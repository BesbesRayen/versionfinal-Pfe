const backendCandidates = process.env.BACKEND_URL
  ? [process.env.BACKEND_URL]
  : [
      'http://127.0.0.1:8082',
      'http://localhost:8082',
    ];

export async function fetchBackendJson(path: string, init?: RequestInit) {
  let lastError: unknown;

  for (const baseUrl of backendCandidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      const data = await response.json().catch(() => null);
      return { response, data };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Backend is unavailable');
}
