export function getBaseUrl() {
  const envs = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];
  const found = envs.find(Boolean);
  return (found || 'http://localhost:3000').replace(/\/$/, '');
}

export async function fetchJson(input: string | URL, init?: RequestInit, log?: (m: string) => void) {
  const url = typeof input === 'string' ? input : input.toString();
  const method = (init?.method || 'GET').toUpperCase();
  log?.(`HTTP ${method} ${url}`);
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e) {
    log?.(`FETCH ERROR: ${(e as Error).message}`);
    throw e;
  }
  const ctype = res.headers.get('content-type') || '';
  let data: unknown = null;
  try {
    if (ctype.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { text: text.slice(0, 2000) };
    }
  } catch {
    data = null;
  }
  log?.(`HTTP ${res.status} content-type=${ctype}`);
  return { res, data } as const;
}
