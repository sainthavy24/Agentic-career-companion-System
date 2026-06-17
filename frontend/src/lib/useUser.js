import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// user: undefined = loading, null = signed out, object = signed in
export function useUser() {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    if (!supabase) { setUser(null); return }
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user || null)
    )
    return () => sub.subscription.unsubscribe()
  }, [])
  return user
}
