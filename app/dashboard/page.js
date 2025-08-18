'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Users,
  MessageSquare,
  TrendingUp,
  Activity,
  Search,
  Sparkles,
  Bot,
} from 'lucide-react'
import { useEmployeeStore } from '@/stores/employee-store'
import Sidebar from '@/components/ui/sidebar-component'
import AISearchBar from '@/components/ui/ai-search-bar'

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null)
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [aiResults, setAiResults] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  // 🔥 AJOUT : État pour le timestamp (solution anti-hydratation)
  const [lastUpdated, setLastUpdated] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const { employees, stats, fetchEmployees } = useEmployeeStore()

  useEffect(() => {
    fetchEmployees()
    loadAnalytics()

    // 🔥 AJOUT : Définir le timestamp côté client uniquement
    setIsMounted(true)
    setLastUpdated(new Date().toLocaleString())
  }, [fetchEmployees])

  const handleAISearch = async (query) => {
    if (!query.trim()) return

    setIsAiLoading(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const results = await response.json()
        setAiResults(results)
      } else {
        // Fallback avec données de démonstration si l'API ne fonctionne pas
        const demoResults = {
          matches: employees.slice(0, 3).map((emp, index) => ({
            employee: emp,
            score: 90 - index * 10,
            reason: `Expertise en ${
              emp.service
            } et correspondance avec "${query.substring(0, 30)}..."`,
            matchedSkills: emp.tasks?.slice(0, 2) || ['Compétence générale'],
          })),
        }
        setAiResults(demoResults)
      }
    } catch (error) {
      console.error('Erreur recherche IA:', error)
      // Données de démonstration en cas d'erreur
      const demoResults = {
        matches: employees.slice(0, 2).map((emp, index) => ({
          employee: emp,
          score: 85 - index * 15,
          reason: `Correspondance basée sur l'expertise en ${emp.service}`,
          matchedSkills: emp.tasks?.slice(0, 2) || ['Compétence générale'],
        })),
      }
      setAiResults(demoResults)
    } finally {
      setIsAiLoading(false)
    }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulation d'analytics - à remplacer par vraie API
      setAnalytics({
        totalRequests: 147,
        completedRequests: 132,
        averageResponseTime: 4.2,
        topPerformers: employees.slice(0, 3),
        requestsByCategory: {
          technique: 45,
          design: 32,
          marketing: 28,
          infrastructure: 24,
          general: 18,
        },
      })

      setRecentRequests([
        {
          id: 1,
          query: "Besoin d'aide pour optimiser les performances React",
          assignedTo: 'Marie Dubois',
          status: 'completed',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
          category: 'technique',
        },
        {
          id: 2,
          query: "Création d'un nouveau design system",
          assignedTo: 'Sophie Laurent',
          status: 'in_progress',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
          category: 'design',
        },
        {
          id: 3,
          query: 'Campagne marketing pour le nouveau produit',
          assignedTo: 'Camille Rousseau',
          status: 'pending',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6h ago
          category: 'marketing',
        },
      ])
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminée'
      case 'in_progress':
        return 'En cours'
      case 'pending':
        return 'En attente'
      default:
        return status
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technique':
        return 'bg-blue-500'
      case 'design':
        return 'bg-purple-500'
      case 'marketing':
        return 'bg-orange-500'
      case 'infrastructure':
        return 'bg-green-500'
      case 'general':
        return 'bg-gray-500'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden ml-72">
        {/* Header - SEULE MODIFICATION ICI */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Vue d'ensemble de l'activité de votre équipe
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {/* 🔥 CORRECTION : Affichage conditionnel du timestamp */}
                {isMounted
                  ? `Dernière mise à jour: ${lastUpdated}`
                  : 'Chargement...'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Cartes de statistiques - AUCUNE MODIFICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Employés
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {employees.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% ce mois
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Demandes Total
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.totalRequests || '...'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8% cette semaine
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Taux de Résolution
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics
                        ? Math.round(
                            (analytics.completedRequests /
                              analytics.totalRequests) *
                              100
                          )
                        : '...'}
                      %
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5% ce mois
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Temps Moyen
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics?.averageResponseTime || '...'}h
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-red-600">
                  <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                  -15% ce mois
                </div>
              </div>
            </div>

            {/* Section Demandes IA - AUCUNE MODIFICATION */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header avec style ChatGPT */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Assistant IA Demandes</h2>
                    <p className="text-blue-100 text-sm">
                      Trouvez la personne idéale pour votre tâche
                    </p>
                  </div>
                </div>
              </div>

              {/* Zone de saisie style ChatGPT */}
              <div className="p-6">
                <AISearchBar
                  onSearch={handleAISearch}
                  isLoading={isAiLoading}
                  placeholder="Décrivez votre besoin... (ex: J'ai besoin d'aide pour optimiser une app React)"
                />

                {/* Résultats de la recherche IA */}
                {aiResults && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recommandations IA
                      </h3>
                    </div>

                    {aiResults.matches && aiResults.matches.length > 0 ? (
                      <div className="space-y-3">
                        {aiResults.matches.slice(0, 3).map((match, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                          >
                            <img
                              src={
                                match.employee?.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  match.employee?.name || 'User'
                                )}&background=random`
                              }
                              alt={match.employee?.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900">
                                  {match.employee?.name}
                                </h4>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  {match.score}% de correspondance
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {match.employee?.role}
                              </p>
                              <p className="text-sm text-blue-600 mt-1">
                                {match.reason}
                              </p>
                            </div>
                            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm">
                              Contacter
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                        Aucune correspondance trouvée pour cette demande.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demandes récentes - AUCUNE MODIFICATION */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demandes Récentes
                  </h3>
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>

                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
                    >
                      <div
                        className={`w-3 h-3 rounded-full mt-2 ${getCategoryColor(
                          request.category
                        )}`}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {request.query}
                        </p>
                        <p className="text-xs text-gray-500">
                          Assigné à {request.assignedTo} •{' '}
                          {request.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Répartition par catégorie - AUCUNE MODIFICATION */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Demandes par Catégorie
                  </h3>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>

                {analytics && (
                  <div className="space-y-4">
                    {Object.entries(analytics.requestsByCategory).map(
                      ([category, count]) => (
                        <div key={category} className="flex items-center">
                          <div className="flex items-center space-x-3 flex-1">
                            <div
                              className={`w-3 h-3 rounded-full ${getCategoryColor(
                                category
                              )}`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getCategoryColor(
                                  category
                                )}`}
                                style={{
                                  width: `${
                                    (count /
                                      Math.max(
                                        ...Object.values(
                                          analytics.requestsByCategory
                                        )
                                      )) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 w-8">
                              {count}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Top performers - AUCUNE MODIFICATION */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Employés les Plus Actifs
                </h3>
                <Users className="w-5 h-5 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employees.slice(0, 3).map((employee, index) => (
                  <div
                    key={employee._id || employee.id}
                    className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50"
                  >
                    <div className="relative">
                      <img
                        src={employee.avatar}
                        alt={employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div
                        className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : 'bg-orange-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {employee.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {employee.role}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {employee.totalRequestsHandled || 0} demandes
                        </span>
                        <span className="text-xs text-yellow-600">
                          ★ {employee.averageRating || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
