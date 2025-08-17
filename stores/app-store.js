import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Store global de l'application - Centralisation complète
export const useAppStore = create(
  subscribeWithSelector(
    immer((set, get) => ({
      // État global UI
      ui: {
        sidebarCollapsed: false,
        theme: 'light',
        loading: false,
        error: null,
        notifications: [],
      },

      // État de recherche IA globale
      aiSearch: {
        query: '',
        results: null,
        isSearching: false,
        lastSearch: null,
        searchHistory: [],
      },

      // État de chat
      chat: {
        selectedEmployee: null,
        messages: [],
        isTyping: false,
        onlineUsers: [],
      },

      // Actions UI globales
      toggleSidebar: () =>
        set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed
        }),

      setTheme: (theme) =>
        set((state) => {
          state.ui.theme = theme
        }),

      setLoading: (loading) =>
        set((state) => {
          state.ui.loading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.ui.error = error
        }),

      addNotification: (notification) =>
        set((state) => {
          state.ui.notifications.push({
            id: Date.now(),
            timestamp: new Date(),
            ...notification,
          })
        }),

      removeNotification: (id) =>
        set((state) => {
          state.ui.notifications = state.ui.notifications.filter(
            (n) => n.id !== id
          )
        }),

      // Actions recherche IA
      setAIQuery: (query) =>
        set((state) => {
          state.aiSearch.query = query
        }),

      performAISearch: async (query) => {
        set((state) => {
          state.aiSearch.isSearching = true
          state.aiSearch.query = query
          state.ui.error = null
        })

        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          })

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const results = await response.json()

          set((state) => {
            state.aiSearch.results = results
            state.aiSearch.lastSearch = {
              query,
              results,
              timestamp: new Date(),
            }
            state.aiSearch.searchHistory.unshift({
              query,
              timestamp: new Date(),
              matchCount: results.matches.length,
            })
            // Garder seulement les 10 dernières recherches
            state.aiSearch.searchHistory = state.aiSearch.searchHistory.slice(
              0,
              10
            )
            state.aiSearch.isSearching = false
          })

          return results
        } catch (error) {
          set((state) => {
            state.ui.error = error.message
            state.aiSearch.isSearching = false
          })
          throw error
        }
      },

      clearAIResults: () =>
        set((state) => {
          state.aiSearch.results = null
          state.aiSearch.query = ''
        }),

      // Actions chat
      selectEmployeeForChat: (employee) =>
        set((state) => {
          state.chat.selectedEmployee = employee
          state.chat.messages = [
            {
              id: Date.now(),
              type: 'system',
              content: `Conversation démarrée avec ${employee.name}`,
              timestamp: new Date(),
            },
          ]
        }),

      sendChatMessage: async (content) => {
        const { selectedEmployee } = get().chat
        if (!selectedEmployee || !content.trim()) return

        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: content.trim(),
          timestamp: new Date(),
          sender: 'Vous',
        }

        set((state) => {
          state.chat.messages.push(userMessage)
          state.chat.isTyping = true
        })

        // Simulation de réponse automatique
        setTimeout(() => {
          const responseMessage = {
            id: Date.now() + 1,
            type: 'employee',
            content: `Merci pour votre message ! Je vais regarder cela et vous revenir rapidement.`,
            timestamp: new Date(),
            sender: selectedEmployee.name,
            avatar: selectedEmployee.avatar,
          }

          set((state) => {
            state.chat.messages.push(responseMessage)
            state.chat.isTyping = false
          })
        }, 1000)
      },

      clearChat: () =>
        set((state) => {
          state.chat.selectedEmployee = null
          state.chat.messages = []
          state.chat.isTyping = false
        }),

      // Actions utilitaires
      reset: () =>
        set((state) => {
          state.ui = {
            sidebarCollapsed: false,
            theme: 'light',
            loading: false,
            error: null,
            notifications: [],
          }
          state.aiSearch = {
            query: '',
            results: null,
            isSearching: false,
            lastSearch: null,
            searchHistory: [],
          }
          state.chat = {
            selectedEmployee: null,
            messages: [],
            isTyping: false,
            onlineUsers: [],
          }
        }),

      // Sélecteurs
      getSearchHistory: () => get().aiSearch.searchHistory,
      getLastSearch: () => get().aiSearch.lastSearch,
      getNotifications: () => get().ui.notifications,
      getCurrentTheme: () => get().ui.theme,
      isLoading: () => get().ui.loading,
      getError: () => get().ui.error,
    }))
  )
)

// Hook combiné pour simplifier l'usage
export const useAppState = () => {
  const store = useAppStore()

  return {
    // UI
    sidebarCollapsed: store.ui.sidebarCollapsed,
    theme: store.ui.theme,
    loading: store.ui.loading,
    error: store.ui.error,
    notifications: store.ui.notifications,

    // AI Search
    aiQuery: store.aiSearch.query,
    aiResults: store.aiSearch.results,
    isSearching: store.aiSearch.isSearching,
    searchHistory: store.aiSearch.searchHistory,

    // Chat
    selectedEmployee: store.chat.selectedEmployee,
    chatMessages: store.chat.messages,
    isTyping: store.chat.isTyping,

    // Actions
    toggleSidebar: store.toggleSidebar,
    setTheme: store.setTheme,
    performAISearch: store.performAISearch,
    clearAIResults: store.clearAIResults,
    selectEmployeeForChat: store.selectEmployeeForChat,
    sendChatMessage: store.sendChatMessage,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
  }
}
