import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

/**
 * Store d'authentification sécurisé pour TeamFlow
 * Architecture Simple Made Easy : Un store, une responsabilité
 * ✅ SÉCURITÉ : Plus de tokens en localStorage, cookies HttpOnly uniquement
 * ✅ SIMPLIFIÉ : Plus de logique de redirection (middleware s'en charge)
 */
export const useAuthStore = create(
  subscribeWithSelector(
    immer((set, get) => ({
      // ✅ État minimal et sécurisé (pas de tokens sensibles)
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ✅ Métadonnées de session
      sessionInfo: {
        lastActivity: null,
        loginTime: null,
        expiresAt: null,
      },

      // ✅ Actions d'authentification sécurisées
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.error = error
        }),

      // ✅ Connexion utilisateur (pas de redirection - middleware s'en charge)
      login: async (email, password) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // ✅ CRITIQUE : Inclure les cookies HttpOnly
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erreur de connexion')
          }

          // ✅ Sauvegarder SEULEMENT les données utilisateur non sensibles
          const now = new Date()
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes

          set((state) => {
            state.user = data.user
            state.isAuthenticated = true
            state.isLoading = false
            state.error = null
            state.sessionInfo = {
              lastActivity: now,
              loginTime: now,
              expiresAt: expiresAt,
            }
          })

          // ✅ SÉCURITÉ : Sauvegarder SEULEMENT les données non sensibles
          sessionStorage.setItem('teamflow_user', JSON.stringify(data.user))
          sessionStorage.setItem(
            'teamflow_session_info',
            JSON.stringify({
              lastActivity: now.toISOString(),
              loginTime: now.toISOString(),
              expiresAt: expiresAt.toISOString(),
            })
          )

          console.log('✅ Connexion réussie:', data.user.email)

          // ✅ SIMPLIFIÉ : Plus de redirection manuelle (middleware s'en charge)
          // Le middleware va automatiquement rediriger vers /dashboard

          return { success: true, user: data.user }
        } catch (error) {
          set((state) => {
            state.error = error.message
            state.isLoading = false
          })
          console.error('❌ Erreur connexion:', error.message)
          throw error
        }
      },

      // ✅ Déconnexion sécurisée (pas de redirection - middleware s'en charge)
      logout: async (revokeAll = false) => {
        try {
          // ✅ Appeler l'API de déconnexion avec révocation optionnelle
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // ✅ Inclure les cookies
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revokeAll }),
          })

          if (!response.ok) {
            console.log('⚠️ Erreur API logout (non bloquant)')
          }
        } catch (error) {
          console.log('⚠️ Erreur API logout (non bloquant):', error.message)
        }

        // ✅ Nettoyer l'état local
        set((state) => {
          state.user = null
          state.isAuthenticated = false
          state.error = null
          state.sessionInfo = {
            lastActivity: null,
            loginTime: null,
            expiresAt: null,
          }
        })

        // ✅ Nettoyer sessionStorage (pas localStorage)
        sessionStorage.removeItem('teamflow_user')
        sessionStorage.removeItem('teamflow_session_info')

        console.log('✅ Déconnexion réussie')

        // ✅ SIMPLIFIÉ : Plus de redirection manuelle (middleware s'en charge)
        // Le middleware va automatiquement rediriger vers /login
      },

      // ✅ Rafraîchir automatiquement la session
      refreshSession: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // ✅ Cookies automatiques
          })

          if (!response.ok) {
            // Si le refresh échoue, déconnecter
            console.log('🚪 Session expirée, déconnexion automatique')
            get().logout()
            return false
          }

          const data = await response.json()

          // ✅ Mettre à jour les métadonnées de session
          const now = new Date()
          const expiresAt = new Date(now.getTime() + 15 * 60 * 1000) // 15 minutes

          set((state) => {
            state.sessionInfo.lastActivity = now
            state.sessionInfo.expiresAt = expiresAt
          })

          sessionStorage.setItem(
            'teamflow_session_info',
            JSON.stringify({
              lastActivity: now.toISOString(),
              loginTime: get().sessionInfo.loginTime?.toISOString(),
              expiresAt: expiresAt.toISOString(),
            })
          )

          console.log('🔄 Session rafraîchie automatiquement')
          return true
        } catch (error) {
          console.error('❌ Erreur rafraîchissement session:', error.message)
          get().logout()
          return false
        }
      },

      // ✅ Vérifier si la session expire bientôt
      isSessionExpiringSoon: () => {
        const state = get()
        if (!state.sessionInfo.expiresAt) return true

        const now = new Date()
        const expiresAt = new Date(state.sessionInfo.expiresAt)
        const fiveMinutes = 5 * 60 * 1000

        return expiresAt - now <= fiveMinutes
      },

      // ✅ Mettre à jour l'activité de l'utilisateur
      updateActivity: () => {
        const state = get()
        if (!state.isAuthenticated) return

        const now = new Date()

        set((state) => {
          state.sessionInfo.lastActivity = now
        })

        // ✅ Rafraîchir automatiquement si nécessaire
        if (state.isSessionExpiringSoon()) {
          get().refreshSession()
        }
      },

      // ✅ API call sécurisée avec gestion automatique des erreurs
      apiCall: async (url, options = {}) => {
        // ✅ Mettre à jour l'activité
        get().updateActivity()

        const defaultOptions = {
          credentials: 'include', // ✅ Inclure automatiquement les cookies
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        }

        try {
          const response = await fetch(url, defaultOptions)

          // ✅ Gérer automatiquement les erreurs 401
          if (response.status === 401) {
            console.log('🚪 Token expiré, tentative de refresh...')

            // Tenter un refresh automatique
            const refreshSuccess = await get().refreshSession()

            if (refreshSuccess) {
              // Retry la requête originale
              return fetch(url, defaultOptions)
            } else {
              // Si le refresh échoue, déconnecter (middleware redirigera)
              get().logout()
              throw new Error('Session expirée')
            }
          }

          return response
        } catch (error) {
          console.error('❌ Erreur API call:', error)
          throw error
        }
      },

      // ✅ SIMPLIFIÉ : Initialiser depuis sessionStorage (plus de vérification d'URL)
      initializeFromStorage: () => {
        try {
          const user = sessionStorage.getItem('teamflow_user')
          const sessionInfo = sessionStorage.getItem('teamflow_session_info')

          if (user && sessionInfo) {
            const parsedUser = JSON.parse(user)
            const parsedSessionInfo = JSON.parse(sessionInfo)

            // ✅ Vérifier si la session n'est pas expirée
            const expiresAt = new Date(parsedSessionInfo.expiresAt)
            const now = new Date()

            if (now < expiresAt) {
              set((state) => {
                state.user = parsedUser
                state.isAuthenticated = true
                state.sessionInfo = {
                  lastActivity: new Date(parsedSessionInfo.lastActivity),
                  loginTime: new Date(parsedSessionInfo.loginTime),
                  expiresAt: expiresAt,
                }
              })

              console.log('✅ Session restaurée:', parsedUser.email)

              // ✅ Vérifier immédiatement si refresh nécessaire
              if (get().isSessionExpiringSoon()) {
                get().refreshSession()
              }

              return true
            } else {
              // Session expirée, nettoyer (middleware redirigera)
              get().logout()
              console.log('⚠️ Session expirée lors de la restauration')
            }
          }
        } catch (error) {
          console.error('❌ Erreur restauration session:', error)
          get().logout()
        }
        return false
      },

      // ✅ Vérification des permissions (inchangée)
      hasPermission: (requiredRoles) => {
        const state = get()
        if (!state.user || !state.isAuthenticated) return false

        const userRole = state.user.role
        const roles = Array.isArray(requiredRoles)
          ? requiredRoles
          : [requiredRoles]

        // Admin a accès à tout
        if (userRole === 'admin') return true

        // Manager a accès aux rôles user et manager
        if (userRole === 'manager' && roles.includes('user')) return true

        // User a accès uniquement à son rôle
        return roles.includes(userRole)
      },

      // ✅ Mettre à jour le profil utilisateur
      updateProfile: (updates) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...updates }
            // Mettre à jour sessionStorage
            sessionStorage.setItem('teamflow_user', JSON.stringify(state.user))
          }
        })
      },

      // ✅ Déconnexion de tous les appareils
      logoutEverywhere: async () => {
        await get().logout(true) // revokeAll = true
      },

      // ✅ Réinitialiser l'état
      reset: () => {
        set((state) => {
          state.user = null
          state.isAuthenticated = false
          state.isLoading = false
          state.error = null
          state.sessionInfo = {
            lastActivity: null,
            loginTime: null,
            expiresAt: null,
          }
        })

        // Nettoyer sessionStorage
        sessionStorage.removeItem('teamflow_user')
        sessionStorage.removeItem('teamflow_session_info')
      },

      // ✅ Obtenir les informations de session
      getSessionInfo: () => {
        const state = get()
        return {
          ...state.sessionInfo,
          isExpiringSoon: state.isSessionExpiringSoon(),
          timeRemaining: state.sessionInfo.expiresAt
            ? Math.max(0, new Date(state.sessionInfo.expiresAt) - new Date())
            : 0,
        }
      },
    }))
  )
)

// ✅ Sélecteurs utiles inchangés mais optimisés
export const useAuthSelectors = () => {
  const store = useAuthStore()

  return {
    // État de base
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,

    // ✅ Informations de session
    sessionInfo: store.getSessionInfo(),

    // Informations utilisateur
    userRole: store.user?.role,
    userName: store.user
      ? `${store.user.firstName} ${store.user.lastName}`
      : null,
    userEmail: store.user?.email,
    userAvatar: store.user?.avatar,

    // Vérifications de permissions
    isAdmin: store.user?.role === 'admin',
    isManager: store.user?.role === 'manager',
    isUser: store.user?.role === 'user',

    // Actions
    login: store.login,
    logout: store.logout,
    logoutEverywhere: store.logoutEverywhere,
    refreshSession: store.refreshSession,
    hasPermission: store.hasPermission,
    updateProfile: store.updateProfile,
    apiCall: store.apiCall,
    updateActivity: store.updateActivity,
  }
}

// ✅ Hook pour l'activité automatique
export const useActivityTracker = () => {
  const updateActivity = useAuthStore((state) => state.updateActivity)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Mettre à jour l'activité sur les interactions
  const trackActivity = () => {
    if (isAuthenticated) {
      updateActivity()
    }
  }

  return trackActivity
}
