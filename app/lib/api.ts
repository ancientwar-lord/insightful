export function getApiBaseUrl(): string {
  // Vercel ka built-in variable automatically set hota hai
  if (process.env.NODE_ENV === 'production') {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelUrl) {
      return `https://${vercelUrl}/agent`; // Production + /agent prefix
    }
  }
  
  // Local development
  let baseUrl = process.env.LOCAL_ENDPOINT || "http://127.0.0.1:8000";
  // trailing slash hatao taki // double slash ka issue na ho
  return baseUrl.replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  // Ensure path starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
