import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

/**
 * Middleware Next.js pour l'authentification automatique
 * ✅ Protection des routes côté serveur AVANT le rendu
 */
export function middleware(request) {
  const { pathname } = request.nextUrl

  // ✅ Routes publiques (pas d'authentification requise)
  const publicRoutes = [
    '/login',
    '/api/auth/login',
    '/api/auth/register', // Si vous ajoutez l'inscription
    '/_next', // Assets Next.js
    '/favicon.ico',
    '/robots.txt',
  ]

  // ✅ Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // ✅ Routes API protégées (gérées par les middlewares spécifiques)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  console.log('🔍 Vérification authentification pour:', pathname)

  // ✅ Récupérer le token d'accès depuis les cookies
  const accessToken = request.cookies.get('accessToken')?.value

  if (!accessToken) {
    console.log('🚫 Pas de token, redirection vers login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // ✅ Vérifier le token (sans validation DB pour performance)
    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET manquant dans middleware')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const decoded = jwt.verify(accessToken, jwtSecret, {
      issuer: 'teamflow',
      audience: 'teamflow-users',
    })

    // ✅ Vérifier le type de token
    if (decoded.type !== 'access') {
      console.log('🚫 Type de token incorrect dans middleware')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // ✅ Routes avec permissions spécifiques
    const adminRoutes = ['/admin', '/settings']
    const managerRoutes = ['/dashboard/reports', '/employees/manage']

    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
    const isManagerRoute = managerRoutes.some((route) =>
      pathname.startsWith(route)
    )

    // ✅ Vérifier les permissions admin
    if (isAdminRoute && decoded.role !== 'admin') {
      console.log('🚫 Accès admin requis:', decoded.role)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // ✅ Vérifier les permissions manager+
    if (isManagerRoute && !['admin', 'manager'].includes(decoded.role)) {
      console.log('🚫 Accès manager requis:', decoded.role)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    console.log('✅ Accès autorisé:', decoded.email, 'vers', pathname)

    // ✅ Ajouter les informations utilisateur aux headers pour les pages
    const response = NextResponse.next()
    response.headers.set('X-User-Id', decoded.userId)
    response.headers.set('X-User-Role', decoded.role)
    response.headers.set('X-User-Email', decoded.email)

    return response
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.log('🕒 Token expiré dans middleware, tentative de refresh...')

      // ✅ Rediriger vers une page qui tentera le refresh automatiquement
      const refreshUrl = new URL('/auth/refresh-redirect', request.url)
      refreshUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(refreshUrl)
    }

    console.log('🚫 Token invalide dans middleware:', error.message)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

/**
 * ✅ Configuration du matcher pour optimiser les performances
 * Exclude les assets statiques et API routes non protégées
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
