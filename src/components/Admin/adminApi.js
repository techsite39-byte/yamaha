import { buildApiUrl } from '../../config/api.js';

export async function requestJson(path, { method = 'GET', body, headers: customHeaders } = {}) {
  const headers = { Accept: 'application/json', ...customHeaders };
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('vathilai_admin_token');
    if (token) {
      headers['X-Admin-Token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = buildApiUrl(path);
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    cache: 'no-store',
    credentials: 'include',
  });

  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.message ?? result.code ?? `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = result.code;
    throw error;
  }
  return result;
}

export async function uploadMediaBinary(file) {
  const query = new URLSearchParams({
    filename: file.name,
    category: file.type.startsWith('video/') ? 'video' : 'image',
  });

  const headers = {
    Accept: 'application/json',
    'Content-Type': file.type || 'application/octet-stream',
    'X-Filename': encodeURIComponent(file.name),
  };

  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('vathilai_admin_token');
    if (token) {
      headers['X-Admin-Token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = buildApiUrl(`/api/admin/media/upload?${query.toString()}`);
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: file,
    cache: 'no-store',
    credentials: 'include',
  });

  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message ?? `Upload failed with status ${response.status}`);
  }
  return result.file;
}

export async function loginAdmin({ email, password, rememberMe = false }) {
  const result = await requestJson('/api/admin/login', {
    method: 'POST',
    body: { email, password, rememberMe },
  });
  if (result.token && typeof localStorage !== 'undefined') {
    localStorage.setItem('vathilai_admin_token', result.token);
  }
  return result;
}

export async function logoutAdmin() {
  try {
    await requestJson('/api/admin/logout', { method: 'POST' });
  } finally {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('vathilai_admin_token');
    }
  }
}

export async function requestForgotPassword({ email }) {
  return requestJson('/api/admin/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function submitResetPassword({ email, code, newPassword }) {
  return requestJson('/api/admin/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
  });
}

export function downloadCsv(filename, data, columns) {
  let targetData = data;
  let targetFilename = typeof filename === 'string' ? filename : 'export.csv';
  let targetCols = columns;

  if (Array.isArray(filename)) {
    targetData = filename;
    targetFilename = typeof data === 'string' ? data : 'export.csv';
    targetCols = columns;
  }

  if (!targetData || !targetData.length) return;
  const cols = targetCols || Object.keys(targetData[0] || {}).map((k) => ({ label: k, key: k }));
  const headerLine = cols.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = targetData.map((row) =>
    cols.map((col) => {
      const val = typeof col.getter === 'function' ? col.getter(row) : (row[col.key] ?? row.customer?.[col.key] ?? '');
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = targetFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
