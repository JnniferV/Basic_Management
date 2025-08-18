// components/ui/timestamp-display.js
'use client'

import { useState, useEffect } from 'react'

/**
 * Composant pour afficher un timestamp sans problème d'hydratation
 * Suit le principe "Simple Made Easy" de Rich Hickey
 */
export default function TimestampDisplay({
  prefix = 'Dernière mise à jour: ',
  className = 'text-sm text-gray-500',
  format = 'full', // 'full' | 'time' | 'date'
}) {
  const [timestamp, setTimestamp] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Marquer le composant comme monté côté client
    setIsMounted(true)

    // Générer le timestamp côté client uniquement
    const now = new Date()

    let formattedTime = ''
    switch (format) {
      case 'time':
        formattedTime = now.toLocaleTimeString()
        break
      case 'date':
        formattedTime = now.toLocaleDateString()
        break
      case 'full':
      default:
        formattedTime = now.toLocaleString()
        break
    }

    setTimestamp(formattedTime)
  }, [format])

  // Ne rien afficher côté serveur pour éviter l'hydratation mismatch
  if (!isMounted) {
    return <div className={className}>{prefix}...</div>
  }

  return (
    <div className={className}>
      {prefix}
      {timestamp}
    </div>
  )
}
