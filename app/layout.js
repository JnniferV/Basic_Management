import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TeamFlow - Intranet Intelligent',
  description:
    "Système intranet avec IA pour la gestion d'équipe et l'assignation intelligente des tâches",
  keywords:
    'intranet, team management, ai, intelligence artificielle, gestion équipe',
  authors: [{ name: 'TeamFlow' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full">
      <body
        className={`${inter.className} h-full bg-gradient-to-br from-gray-50 to-gray-100`}
      >
        <div id="root" className="h-full">
          {children}
        </div>
        {/* Portal pour les modales */}
        <div id="modal-root" />
        {/* Portal pour les notifications */}
        <div id="toast-root" />
      </body>
    </html>
  )
}
