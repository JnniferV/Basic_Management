'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Users, Building2 } from 'lucide-react'
import { useEmployeeStore } from '@/stores/employee-store'
import Sidebar from '@/components/ui/sidebar-component'
import EmployeeCard from '@/components/ui/employee-card'
import EmployeeForm from '@/components/forms/employee-form'

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState('all')

  const {
    employees,
    loading,
    error,
    fetchEmployees,
    searchQuery: storeSearchQuery,
    selectedService: storeSelectedService,
    setSearchQuery: setStoreSearchQuery,
    setSelectedService: setStoreSelectedService,
    getFilteredEmployees,
    getEmployeesByService,
  } = useEmployeeStore()

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    setStoreSearchQuery(searchQuery)
  }, [searchQuery, setStoreSearchQuery])

  useEffect(() => {
    setStoreSelectedService(selectedService)
  }, [selectedService, setStoreSelectedService])

  const filteredEmployees = getFilteredEmployees()
  const employeesByService = getEmployeesByService()
  const services = [...new Set(employees.map((emp) => emp.service))]

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden ml-72">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employés</h1>
              <p className="text-gray-600">Gestion complète de votre équipe</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un employé
            </button>
          </div>
        </header>

        {/* Filtres et recherche */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, rôle, compétences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre par service */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">Tous les services</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex items-center space-x-6 mt-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {filteredEmployees.length} employé
                {filteredEmployees.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>
                {services.length} service{services.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun employé trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedService !== 'all'
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Commencez par ajouter votre premier employé'}
              </p>
              {!searchQuery && selectedService === 'all' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un employé
                </button>
              )}
            </div>
          ) : selectedService === 'all' ? (
            // Vue par service
            <div className="space-y-8">
              {Object.entries(employeesByService).map(
                ([service, serviceEmployees]) => (
                  <div key={service}>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      {service}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({serviceEmployees.length})
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {serviceEmployees.map((employee) => (
                        <EmployeeCard
                          key={employee._id || employee.id}
                          employee={employee}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            // Vue filtrée
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee._id || employee.id}
                  employee={employee}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal formulaire employé */}
      {showForm && (
        <EmployeeForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            fetchEmployees()
          }}
        />
      )}
    </div>
  )
}
