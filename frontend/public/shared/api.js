const API_BASE = '/api';

export async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: { code: 'PARSE_ERROR', message: text } };
    }
  }

  if (!res.ok) {
    const err = new Error(body?.error?.message || `Erro HTTP ${res.status}`);
    err.code = body?.error?.code || 'HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  return body;
}
