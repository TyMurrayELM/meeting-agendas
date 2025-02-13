import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'
import AuthComponent from './Auth'  // Make sure this matches the file name exactly

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <AuthComponent />
  }

  return children
}

export default ProtectedRoute