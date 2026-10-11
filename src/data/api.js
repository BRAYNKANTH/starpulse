// The session cookie is HttpOnly and sent automatically with same-origin requests.
export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || 'Unable to reach the server.'), { status: response.status });
  return body;
}

export function shopUrl(id, destination = 'landing', base = window.location.origin) {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('biz', id);
  if (destination !== 'landing') url.searchParams.set('view', destination);
  return url.href;
}
