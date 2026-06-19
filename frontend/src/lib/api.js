const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function apiGet(path) {
  const res = await fetch(`${API}${path}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function apiUpload(path, formData) {
  const res = await fetch(`${API}${path}`, { method: 'POST', body: formData })
  return res.json()
}

export { API }
