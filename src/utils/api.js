export async function apiFetch(path, { headers = {}, ...opts } = {}) {
  const token = sessionStorage.getItem('token');
  
  console.log('🌐 API Request:', {
    path,
    token: token ? `${token.substring(0, 20)}...` : 'null',
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }
  });
  
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  
  console.log('🌐 API Response:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    url: res.url
  });
  
  if (res.status === 401) {
    // Not logged in (or token expired)
    window.location.href = '/login';
    return;
  }
  if (!res.ok) {
    const text = await res.text();
    console.error('🌐 API Error Response:', text);
    throw new Error(text || res.statusText);
  }
  
  // Handle empty responses (like 204 No Content for DELETE requests)
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }
  
  return res.json();
}