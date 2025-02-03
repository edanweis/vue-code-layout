import { ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'

export const useAuthProvider = () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const initialized = ref(false)
  const isLoggedIn = ref(false)
  const authError = ref<Error | null>(null)
  const authPromise = ref<Promise<void>>(Promise.resolve())

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error

      isLoggedIn.value = true
      user.value = data.user
      session.value = data.session
      authError.value = null
      
      return data
    } catch (err) {
      authError.value = err as Error
      throw err
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      isLoggedIn.value = false
      user.value = null
      session.value = null
      authError.value = null
    } catch (err) {
      authError.value = err as Error
      throw err
    }
  }

  const initAuth = async () => {
    try {
      console.group('AuthProvider: Initialization')
      console.log('🔄 Getting initial session...')
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession) {
        console.log('✅ Found existing session:', {
          user: initialSession.user.email,
          expiresAt: initialSession.expires_at
        })
        session.value = initialSession
        user.value = initialSession.user
        isLoggedIn.value = true
      } else {
        console.log('⚠️ No session found, attempting automatic sign in...')
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: 'asdf@asdf.com',
            password: 'asdfasdf'
          })
          
          if (error) throw error

          console.log('✅ Auto sign in successful:', {
            user: data.user?.email,
            expiresAt: data.session?.expires_at
          })
          
          isLoggedIn.value = true
          user.value = data.user
          session.value = data.session
        } catch (signInError) {
          console.error('❌ Auto sign in failed:', signInError)
          throw signInError
        }
      }

      // Listen for auth changes
      console.log('🔄 Setting up auth state listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        console.log('📝 Auth state changed:', {
          event: _event,
          user: currentSession?.user?.email,
          hasSession: !!currentSession
        })
        session.value = currentSession
        user.value = currentSession?.user ?? null
        isLoggedIn.value = !!currentSession
      })

      initialized.value = true
      console.log('✅ Auth initialization complete')
      console.groupEnd()
      return subscription
    } catch (err) {
      console.error('❌ Auth initialization failed:', err)
      authError.value = err as Error
      initialized.value = true
      console.groupEnd()
      throw err
    }
  }

  // Initialize auth immediately
  authPromise.value = initAuth()

  return {
    user,
    session,
    initialized,
    isLoggedIn,
    authError,
    signIn,
    signOut,
    authPromise: authPromise.value
  }
}

export const authKey = Symbol('auth') 