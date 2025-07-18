import { useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface User {
  id: string
  email: string
  nickname: string
  photoURL?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  nickname: string
  age?: number
  gender?: string
}

const googleProvider = new GoogleAuthProvider()

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user with database and get JWT token
        try {
          const idToken = await firebaseUser.getIdToken()
          const response = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            }),
          })
          
          if (response.ok) {
            const data = await response.json()
            // Store JWT token for backend API calls
            if (data.token) {
              localStorage.setItem('authToken', data.token)
            }
          }
        } catch (error) {
          console.error('Failed to sync user:', error)
        }

        setAuthState({
          user: {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            nickname: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
          },
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        // Clear stored JWT token on logout
        localStorage.removeItem('authToken')
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (data: LoginData) => {
    try {
      const result = await signInWithEmailAndPassword(auth, data.email, data.password)
      const user = {
        id: result.user.uid,
        email: result.user.email || '',
        nickname: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
      }
      return { user }
    } catch (error) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password)
      
      // Update user profile with nickname
      await updateProfile(result.user, {
        displayName: data.nickname,
      })
      
      const user = {
        id: result.user.uid,
        email: result.user.email || '',
        nickname: data.nickname,
        photoURL: result.user.photoURL || undefined,
      }
      
      return { user }
    } catch (error) {
      throw error
    }
  }

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = {
        id: result.user.uid,
        email: result.user.email || '',
        nickname: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
      }
      return { user }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  }

  return {
    ...authState,
    login,
    register,
    loginWithGoogle,
    logout,
  }
}