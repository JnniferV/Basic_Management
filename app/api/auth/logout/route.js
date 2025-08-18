import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import authService from '@/lib/auth-service'

/**
 * POST /api/auth/logout - Déconnexion utilisateur sécurisée
 * Architecture Simple Made Easy : Une route, une responsabilité
 */
export async function POST(request) {
  try {
    await connectDB()

    // ✅ Récupérer les options de déconnexion
    const body = await request.json().catch(() => ({}))
    const { revokeAll = false } = body

    console.log(
      '🚪 Tentative de déconnexion',
      revokeAll ? '(tous appareils)' : ''
    )

    // ✅ Récupérer le token d'accès depuis les cookies
    const accessToken = request.cookies.get('accessToken')?.value

    if (accessToken) {
      try {
        if (revokeAll) {
          // ✅ Révoquer toutes les sessions de l'utilisateur
          const decoded = await authService.verifyToken(accessToken, false) // Pas de validation DB
          if (decoded && decoded.userId) {
            await authService.revokeAllUserTokens(decoded.userId)
            console.log('🚪 Toutes les sessions révoquées pour:', decoded.email)
          }
        } else {
          // ✅ Révoquer seulement le token actuel
          await authService.revokeToken(accessToken)
          console.log('🚪 Token actuel révoqué')
        }
      } catch (error) {
        console.log('⚠️ Erreur révocation token (non bloquant):', error.message)
      }
    }

    // ✅ Créer la réponse de succès
    const response = NextResponse.json({
      message: revokeAll
        ? 'Déconnexion de tous les appareils réussie'
        : 'Déconnexion réussie',
      code: 'LOGOUT_SUCCESS',
    })

    // ✅ Supprimer tous les cookies d'authentification
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // ✅ Expire immédiatement
      path: '/',
    }

    response.cookies.set('accessToken', '', cookieOptions)
    response.cookies.set('refreshToken', '', cookieOptions)

    // ✅ Headers de sécurité
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    console.log('✅ Déconnexion réussie')

    return response
  } catch (error) {
    console.error('❌ Erreur route logout:', error)

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/auth/logout - Pré-requête CORS sécurisée
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS || 'https://votre-domaine.com'
          : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
}
