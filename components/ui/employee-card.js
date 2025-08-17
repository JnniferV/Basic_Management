'use client'

import { useState } from 'react'
import { Mail, Phone, MessageSquare, Star, Award, User } from 'lucide-react'

export default function EmployeeCard({
  employee,
  showAIScore = false,
  aiScore = null,
  aiReason = null,
  rank = null,
}) {
  const [imageError, setImageError] = useState(false)

  const getServiceColor = (service) => {
    const colors = {
      Développement: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Infrastructure: 'bg-blue-50 text-blue-700 border-blue-200',
      Design: 'bg-purple-50 text-purple-700 border-purple-200',
      Marketing: 'bg-orange-50 text-orange-700 border-orange-200',
      Commercial: 'bg-green-50 text-green-700 border-green-200',
      RH: 'bg-pink-50 text-pink-700 border-pink-200',
    }
    return colors[service] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const startChat = () => {
    // Navigation vers le chat avec cet employé
    window.location.href = `/chat?employee=${employee._id || employee.id}`
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 relative overflow-hidden">
      {/* Rang IA */}
      {showAIScore && rank && (
        <div className="absolute top-4 right-4">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
              rank === 1
                ? 'bg-yellow-500'
                : rank === 2
                ? 'bg-gray-400'
                : 'bg-orange-500'
            }`}
          >
            {rank}
          </div>
        </div>
      )}

      {/* Avatar et info de base */}
      <div className="flex items-start space-x-4 mb-4">
        <div className="relative">
          {imageError ? (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          ) : (
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
          {employee.isActive && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate text-lg">
            {employee.name}
          </h3>
          <p className="text-gray-600 text-sm truncate">{employee.role}</p>
          <div
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getServiceColor(
              employee.service
            )}`}
          >
            {employee.service}
          </div>
        </div>
      </div>

      {/* Score IA */}
      {showAIScore && aiScore && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Match IA</span>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-900">{aiScore}%</span>
            </div>
          </div>
          {aiReason && <p className="text-xs text-blue-700">{aiReason}</p>}
        </div>
      )}

      {/* Compétences */}
      {employee.tasks && employee.tasks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Compétences
          </h4>
          <div className="flex flex-wrap gap-1">
            {employee.tasks.slice(0, 3).map((task, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {task}
              </span>
            ))}
            {employee.tasks.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                +{employee.tasks.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-1">
          <Award className="w-4 h-4" />
          <span>{employee.averageRating || 0}/5</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageSquare className="w-4 h-4" />
          <span>{employee.totalRequestsHandled || 0} demandes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={startChat}
          className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discuter</span>
        </button>

        <a
          href={`mailto:${employee.email}`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Mail className="w-4 h-4" />
        </a>

        {employee.phone && (
          <a
            href={`tel:${employee.phone}`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
