import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import authService from '@/lib/auth-service'

/**
 * POST /api/auth/refresh - Rafraîchir le token d'accès de manière sécurisée
 * Architecture Simple Made Easy : Une route, une responsabilité
 */
export async function POST(request) {
  try {
    await connectDB()

    // ✅ Récupérer le refresh token depuis les cookies HttpOnly
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      console.log('🚫 Refresh token manquant dans les cookies')
      return NextResponse.json(
        {
          error: 'Refresh token requis',
          code: 'MISSING_REFRESH_TOKEN',
        },
        { status: 401 }
      )
    }

    console.log('🔄 Tentative de rafraîchissement de token')

    // ✅ Rafraîchir les tokens avec nouvelle sécurité
    const refreshResult = await authService.refreshAccessToken(refreshToken)

    if (!refreshResult) {
      console.log('🚫 Échec du rafraîchissement de token')

      // ✅ Supprimer les cookies invalides
      const response = NextResponse.json(
        {
          error: 'Refresh token invalide ou expiré',
          code: 'INVALID_REFRESH_TOKEN',
        },
        { status: 401 }
      )

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      }

      response.cookies.set('accessToken', '', cookieOptions)
      response.cookies.set('refreshToken', '', cookieOptions)

      return response
    }

    // ✅ Créer la réponse de succès
    const response = NextResponse.json({
      message: 'Tokens rafraîchis avec succès',
      code: 'REFRESH_SUCCESS',
      expiresIn: refreshResult.expiresIn,
    })

    // ✅ Mettre à jour les cookies avec les nouveaux tokens
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    }

    // ✅ Nouveau token d'accès (15 minutes)
    response.cookies.set('accessToken', refreshResult.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    })

    // ✅ Nouveau refresh token (7 jours)
    response.cookies.set('refreshToken', refreshResult.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    })

    // ✅ Headers de sécurité
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

    console.log('✅ Tokens rafraîchis avec succès')

    return response
  } catch (error) {
    console.error('❌ Erreur route refresh:', error)

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
 * OPTIONS /api/auth/refresh - Pré-requête CORS sécurisée
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
