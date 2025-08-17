'use client'

import { useState } from 'react'
import { Search, Sparkles, Loader2 } from 'lucide-react'

export default function AISearchBar({
  onSearch,
  isLoading,
  placeholder = 'Décrivez votre besoin...',
}) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query.trim())
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 text-blue-500" />
          )}
        </div>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-12 pr-16 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 resize-none transition-colors disabled:opacity-50"
          rows={1}
          style={{ minHeight: '56px', maxHeight: '120px' }}
        />

        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <div className="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Search className="h-5 w-5" />
          </div>
        </button>
      </div>

      {query.length > 0 && (
        <div className="mt-2 text-sm text-gray-500 text-right">
          {query.length}/1000 caractères
        </div>
      )}
    </form>
  )
}
