'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  avatar?: string
  emailVerified?: boolean
  createdAt: string
  lastLoginAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock user database with admin account
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Administrator',
      role: 'admin',
      avatar: null,
      emailVerified: true,
      createdAt: '2024-01-15T10:30:00Z',
      lastLoginAt: new Date().toISOString()
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Max Mustermann',
      role: 'user',
      avatar: null,
      emailVerified: true,
      createdAt: '2024-01-15T10:30:00Z',
      lastLoginAt: new Date().toISOString()
    }
  ]

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('user_session')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          // Update last login time
          userData.lastLoginAt = new Date().toISOString()
          setUser(userData)
          localStorage.setItem('user_session', JSON.stringify(userData))
        }
      } catch (error) {
        console.error('Session check failed:', error)
        localStorage.removeItem('user_session')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Find user in mock database
      const foundUser = mockUsers.find(u => u.email === email)
      
      if (!foundUser) {
        throw new Error('Ungültige Email-Adresse oder Passwort')
      }

      // Simple password check (in production, use proper hashing)
      const validPasswords = {
        'admin@example.com': 'admin123',
        'user@example.com': 'user123'
      }

      if (validPasswords[email] !== password) {
        throw new Error('Ungültige Email-Adresse oder Passwort')
      }

      // Update user with current login time
      const loggedInUser = {
        ...foundUser,
        lastLoginAt: new Date().toISOString()
      }

      setUser(loggedInUser)
      localStorage.setItem('user_session', JSON.stringify(loggedInUser))
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
      
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithOAuth = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    
    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock OAuth login - defaults to admin user for Google, user for GitHub
      const mockOAuthUser = provider === 'google' 
        ? mockUsers[0] // Admin
        : mockUsers[1] // Regular user

      const loggedInUser = {
        ...mockOAuthUser,
        lastLoginAt: new Date().toISOString()
      }

      setUser(loggedInUser)
      localStorage.setItem('user_session', JSON.stringify(loggedInUser))
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
      
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    
    try {
      // Simulate logout API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUser(null)
      localStorage.removeItem('user_session')
      localStorage.setItem('session_expired', 'true')
      
      // Redirect to login
      window.location.href = '/login'
      
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const savedUser = localStorage.getItem('user_session')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error('User refresh failed:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    loginWithOAuth,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}