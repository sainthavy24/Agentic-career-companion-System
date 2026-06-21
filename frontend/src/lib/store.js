// Lightweight per-agent result cache so navigating between pages doesn't
// wipe a user's analysis. Kept in memory (survives SPA navigation) and
// mirrored to sessionStorage (survives a page refresh within the session).
const mem = {}

export function getCache(key) {
  if (key in mem) return mem[key]
  try {
    const v = sessionStorage.getItem('pc_' + key)
    if (v) { mem[key] = JSON.parse(v); return mem[key] }
  } catch { /* ignore */ }
  return undefined
}

export function setCache(key, val) {
  mem[key] = val
  try { sessionStorage.setItem('pc_' + key, JSON.stringify(val)) } catch { /* ignore */ }
}
