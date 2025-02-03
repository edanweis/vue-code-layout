import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function initialize() {
    console.group('Auth Store: initialize()')
    try {
      loading.value = true
      console.log('🔄 Checking for existing session...')
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Error getting session:', sessionError)
        throw sessionError
      }

      console.log('📦 Session data:', data)
      const initialSession = data.session
      
      if (initialSession) {
        console.log('✅ Found existing session:', {
          userId: initialSession.user.id,
          email: initialSession.user.email,
          expiresAt: initialSession.expires_at,
          role: initialSession.user.role
        })
        session.value = initialSession
        user.value = initialSession.user
      } else {
        console.log('⚠️ No session found, attempting sign in...')
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'asdf@asdf.com',
          password: 'asdfasdf'
        })
        
        if (signInError) {
          console.error('❌ Sign in failed:', signInError)
          throw signInError
        }

        console.log('✅ Sign in successful:', {
          userId: authData.user?.id,
          email: authData.user?.email,
          expiresAt: authData.session?.expires_at,
          role: authData.user?.role
        })

        session.value = authData.session
        user.value = authData.user
      }

      console.log('🔄 Setting up auth state change listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
        console.group('Auth State Change')
        console.log('Event:', _event)
        console.log('Session:', currentSession)
        session.value = currentSession
        user.value = currentSession?.user ?? null
        console.groupEnd()
      })

      console.log('✅ Auth initialization complete')
      return subscription
    } catch (err) {
      console.error('❌ Auth initialization error:', err)
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
      console.groupEnd()
    }
  }

  async function signOut() {
    console.group('Auth Store: signOut()')
    try {
      loading.value = true
      console.log('🔄 Signing out...')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError)
        throw signOutError
      }
      
      console.log('✅ Sign out successful')
      session.value = null
      user.value = null
    } catch (err) {
      console.error('❌ Sign out error:', err)
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
      console.groupEnd()
    }
  }

  return {
    user,
    session,
    loading,
    error,
    initialize,
    signOut
  }
}) 