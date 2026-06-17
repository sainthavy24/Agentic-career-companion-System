const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function apiGet(path) {
  const res = await fetch(`${API}${path}`)
  return res.json()
}
export { API }
