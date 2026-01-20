import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { decodeJWT } from '../utils/jwtDecode'

const AUTH_CHANGED_EVENT = 'auth:changed'

export const AuthContext = createContext(null)

const readToken = () => {
  try {
    return localStorage.getItem('token')
  } catch {
    return null
  }
}

const parseUserFromToken = (token) => {
  const decoded = decodeJWT(token)
  return {
    id: decoded?.id || '',
    role: decoded?.role || '',
    nama: decoded?.nama || ''
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => readToken())
  const [user, setUser] = useState(() => parseUserFromToken(readToken()))

  const syncFromStorage = useCallback(() => {
    const nextToken = readToken()
    setTokenState(nextToken)
    setUser(parseUserFromToken(nextToken))
  }, [])

  useEffect(() => {
    // Sync when token is changed in another tab, or when we dispatch a custom event in this tab.
    const onStorage = (e) => {
      if (e?.key === 'token') syncFromStorage()
    }
    const onAuthChanged = () => syncFromStorage()

    window.addEventListener('storage', onStorage)
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    }
  }, [syncFromStorage])

  const setToken = useCallback((nextToken) => {
    // Update state immediately to avoid auth race during navigation
    setTokenState(nextToken)
    setUser(parseUserFromToken(nextToken))

    if (nextToken) {
      localStorage.setItem('token', nextToken)
    } else {
      localStorage.removeItem('token')
    }
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  }, [])

  const logout = useCallback(() => {
    setTokenState(null)
    setUser(parseUserFromToken(null))
    localStorage.removeItem('token')
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  }, [])

  // IMPORTANT: authKey berubah saat user/token berubah, dipakai untuk reset state per-user.
  const authKey = useMemo(() => {
    const uid = user?.id || ''
    const role = user?.role || ''
    const t = token ? '1' : '0'
    return `${uid}:${role}:${t}`
  }, [user?.id, user?.role, token])

  const value = useMemo(
    () => ({
      token,
      user,
      authKey,
      setToken,
      logout
    }),
    [token, user, authKey, setToken, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
