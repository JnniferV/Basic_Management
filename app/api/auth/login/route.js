import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import authService from '@/lib/auth-service'

/**
 * POST /api/auth/login - Authentification utilisateur sécurisée
 * Architecture Simple Made Easy : Une route, une responsabilité
 */
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { email, password } = body

    // ✅ Validation stricte des données requises
    if (!email || !password) {
      return NextResponse.json(
        {
          error: 'Email et mot de passe requis',
          code: 'MISSING_CREDENTIALS',
          details: {
            email: !email ? 'Email manquant' : null,
            password: !password ? 'Mot de passe manquant' : null,
          },
        },
        { status: 400 }
      )
    }

    // ✅ Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Format d'email invalide",
          code: 'INVALID_EMAIL_FORMAT',
        },
        { status: 400 }
      )
    }

    // ✅ Validation de la longueur du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        {
          error: 'Le mot de passe doit contenir au moins 8 caractères',
          code: 'PASSWORD_TOO_SHORT',
        },
        { status: 400 }
      )
    }

    // ✅ Extraire les métadonnées de sécurité
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'

    console.log('🔐 Tentative de connexion:', email, 'IP:', ipAddress)

    // ✅ Authentifier l'utilisateur avec métadonnées
    const authResult = await authService.authenticateUser(
      email,
      password,
      userAgent,
      ipAddress
    )

    if (!authResult) {
      // ✅ Log de sécurité pour les tentatives échouées
      console.log('🚫 Échec authentification:', email, 'IP:', ipAddress)

      return NextResponse.json(
        {
          error: 'Email ou mot de passe incorrect',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    // ✅ Créer la réponse avec les cookies sécurisés
    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        user: authResult.user,
        // ✅ NE PAS renvoyer les tokens dans la réponse JSON
        expiresIn: authResult.expiresIn,
      },
      { status: 200 }
    )

    // ✅ Configuration des cookies sécurisés
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true, // ✅ CRITIQUE : Empêche l'accès JavaScript
      secure: isProduction, // ✅ HTTPS uniquement en production
      sameSite: 'strict', // ✅ Protection CSRF
      path: '/',
    }

    // ✅ Définir les cookies de tokens
    response.cookies.set('accessToken', authResult.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    })

    response.cookies.set('refreshToken', authResult.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    })

    // ✅ Headers de sécurité supplémentaires
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    console.log(
      '✅ Connexion réussie:',
      email,
      'Rôle:',
      authResult.user.role,
      'IP:',
      ipAddress
    )

    return response
  } catch (error) {
    console.error('❌ Erreur route login:', error)

    // ✅ Ne pas exposer les erreurs internes en production
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Erreur interne du serveur'

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: errorMessage,
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/auth/login - Pré-requête CORS sécurisée
 */
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':
        process.env.NODE_ENV === 'production'
          ? process.env.ALLOWED_ORIGINS || 'https://votre-domaine.com'
          : 'http://localhost:3000', // ✅ Spécifique même en dev
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true', // ✅ Pour les cookies
      'Access-Control-Max-Age': '86400',
    },
  })
}
