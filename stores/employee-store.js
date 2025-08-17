import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
// Fonctions API simplifiées directement dans le store

export const useEmployeeStore = create(
  subscribeWithSelector(
    immer((set, get) => ({
      // État
      employees: [],
      loading: false,
      error: null,
      searchQuery: '',
      selectedService: 'all',
      stats: {
        total: 0,
        active: 0,
        byService: {},
      },

      // Actions de base
      setLoading: (loading) =>
        set((state) => {
          state.loading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.error = error
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query
        }),

      setSelectedService: (service) =>
        set((state) => {
          state.selectedService = service
        }),

      // Calculer les statistiques
      updateStats: () =>
        set((state) => {
          const active = state.employees.filter((emp) => emp.isActive).length
          const byService = state.employees.reduce((acc, emp) => {
            acc[emp.service] = (acc[emp.service] || 0) + 1
            return acc
          }, {})

          state.stats = {
            total: state.employees.length,
            active,
            byService,
          }
        }),

      // Récupérer tous les employés - API intégrée
      fetchEmployees: async (filters = {}) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          const queryParams = new URLSearchParams()

          if (filters.service && filters.service !== 'all') {
            queryParams.append('service', filters.service)
          }

          if (filters.search) {
            queryParams.append('search', filters.search)
          }

          if (filters.active && filters.active !== 'all') {
            queryParams.append('active', filters.active)
          }

          const queryString = queryParams.toString()
          const url = `/api/employees${queryString ? `?${queryString}` : ''}`

          const response = await fetch(url)

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const data = await response.json()

          set((state) => {
            state.employees = data.employees || []
            state.loading = false
          })

          get().updateStats()

          return data
        } catch (error) {
          set((state) => {
            state.error =
              error.message || 'Erreur lors du chargement des employés'
            state.loading = false
          })
          throw error
        }
      },

      // Créer un nouvel employé - API intégrée
      createEmployee: async (employeeData) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(
              errorData.error || `Erreur HTTP: ${response.status}`
            )
          }

          const data = await response.json()
          const newEmployee = data.employee

          set((state) => {
            state.employees.push(newEmployee)
            state.loading = false
          })

          get().updateStats()

          console.log('Employé créé avec succès:', newEmployee.name)

          return newEmployee
        } catch (error) {
          set((state) => {
            state.error =
              error.message || "Erreur lors de la création de l'employé"
            state.loading = false
          })
          throw error
        }
      },

      // Mettre à jour un employé
      updateEmployee: async (employeeId, employeeData) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          const updatedEmployee = await apiUpdateEmployee(
            employeeId,
            employeeData
          )

          set((state) => {
            const index = state.employees.findIndex(
              (emp) => (emp._id || emp.id) === employeeId
            )
            if (index !== -1) {
              state.employees[index] = updatedEmployee
            }
            state.loading = false
          })

          get().updateStats()

          console.log('Employé modifié avec succès:', updatedEmployee.name)

          return updatedEmployee
        } catch (error) {
          set((state) => {
            state.error =
              error.message || "Erreur lors de la modification de l'employé"
            state.loading = false
          })
          throw error
        }
      },

      // Supprimer un employé
      deleteEmployee: async (employeeId) => {
        set((state) => {
          state.loading = true
          state.error = null
        })

        try {
          await apiDeleteEmployee(employeeId)

          set((state) => {
            state.employees = state.employees.filter(
              (emp) => (emp._id || emp.id) !== employeeId
            )
            state.loading = false
          })

          get().updateStats()

          console.log('Employé supprimé avec succès')

          return true
        } catch (error) {
          set((state) => {
            state.error =
              error.message || "Erreur lors de la suppression de l'employé"
            state.loading = false
          })
          throw error
        }
      },

      // Désactiver/réactiver un employé
      toggleEmployeeStatus: async (employeeId) => {
        const employee = get().employees.find(
          (emp) => (emp._id || emp.id) === employeeId
        )

        if (!employee) return

        try {
          const updatedEmployee = await apiUpdateEmployee(employeeId, {
            isActive: !employee.isActive,
          })

          set((state) => {
            const index = state.employees.findIndex(
              (emp) => (emp._id || emp.id) === employeeId
            )
            if (index !== -1) {
              state.employees[index] = updatedEmployee
            }
          })

          get().updateStats()

          return updatedEmployee
        } catch (error) {
          set((state) => {
            state.error = error.message || 'Erreur lors du changement de statut'
          })
          throw error
        }
      },

      // Rechercher des employés
      searchEmployees: (query = null) => {
        const searchTerm = query || get().searchQuery
        if (!searchTerm.trim()) {
          return get().employees
        }

        const filtered = get().employees.filter((employee) => {
          const searchableText = `
            ${employee.name} 
            ${employee.email} 
            ${employee.role} 
            ${employee.service} 
            ${employee.tasks?.join(' ') || ''}
          `.toLowerCase()

          return searchableText.includes(searchTerm.toLowerCase())
        })

        return filtered
      },

      // Filtrer par service
      filterByService: (service = null) => {
        const selectedService = service || get().selectedService
        if (selectedService === 'all') {
          return get().employees
        }

        return get().employees.filter(
          (employee) => employee.service === selectedService
        )
      },

      // Obtenir les employés filtrés (recherche + service)
      getFilteredEmployees: () => {
        let filtered = get().employees

        // Filtrer par service
        if (get().selectedService !== 'all') {
          filtered = filtered.filter(
            (emp) => emp.service === get().selectedService
          )
        }

        // Filtrer par recherche
        if (get().searchQuery.trim()) {
          const searchTerm = get().searchQuery.toLowerCase()
          filtered = filtered.filter((employee) => {
            const searchableText = `
              ${employee.name} 
              ${employee.email} 
              ${employee.role} 
              ${employee.service} 
              ${employee.tasks?.join(' ') || ''}
            `.toLowerCase()

            return searchableText.includes(searchTerm)
          })
        }

        return filtered
      },

      // Obtenir un employé par ID
      getEmployeeById: (employeeId) => {
        return get().employees.find((emp) => (emp._id || emp.id) === employeeId)
      },

      // Grouper les employés par service
      getEmployeesByService: () => {
        const employees = get().getFilteredEmployees()

        return employees.reduce((groups, employee) => {
          const service = employee.service
          if (!groups[service]) {
            groups[service] = []
          }
          groups[service].push(employee)
          return groups
        }, {})
      },

      // Obtenir les employés les mieux notés
      getTopRatedEmployees: (limit = 5) => {
        return get()
          .employees.filter((emp) => emp.isActive && emp.averageRating > 0)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, limit)
      },

      // Obtenir les employés les plus expérimentés
      getMostExperiencedEmployees: (limit = 5) => {
        return get()
          .employees.filter(
            (emp) => emp.isActive && emp.totalRequestsHandled > 0
          )
          .sort((a, b) => b.totalRequestsHandled - a.totalRequestsHandled)
          .slice(0, limit)
      },

      // Réinitialiser les filtres
      resetFilters: () =>
        set((state) => {
          state.searchQuery = ''
          state.selectedService = 'all'
        }),

      // Réinitialiser l'état
      reset: () =>
        set((state) => {
          state.employees = []
          state.loading = false
          state.error = null
          state.searchQuery = ''
          state.selectedService = 'all'
          state.stats = {
            total: 0,
            active: 0,
            byService: {},
          }
        }),
    }))
  )
)

// Sélecteurs utiles
export const useEmployeeSelectors = () => {
  const store = useEmployeeStore()

  return {
    // Employés actifs seulement
    activeEmployees: store.employees.filter((emp) => emp.isActive),

    // Services disponibles
    availableServices: [...new Set(store.employees.map((emp) => emp.service))],

    // Employés groupés par service
    employeesByService: store.getEmployeesByService(),

    // Employés filtrés
    filteredEmployees: store.getFilteredEmployees(),

    // Statistiques
    stats: store.stats,
  }
}
