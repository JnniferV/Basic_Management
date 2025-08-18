import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '@/models/user-model'

/**
 * Service d'authentification JWT pour TeamFlow - Version Sécurisée
 * Architecture Simple Made Easy : Un service, une responsabilité
 */
class AuthService {
  constructor() {
    this.jwtSecret = this.validateJWTSecret()
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m' // ✅ Plus court pour la sécurité
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }

  /**
   * ✅ NOUVEAU : Valide et sécurise le secret JWT
   */
  validateJWTSecret() {
    const secret = process.env.JWT_SECRET

    // ✅ CRITIQUE : Vérifier que le secret existe en production
    if (process.env.NODE_ENV === 'production' && !secret) {
      throw new Error('🚨 JWT_SECRET est OBLIGATOIRE en production')
    }

    // ✅ Vérifier la longueur du secret (minimum 32 caractères)
    if (secret && secret.length < 32) {
      throw new Error('🚨 JWT_SECRET doit contenir au moins 32 caractères')
    }

    // ✅ En développement, générer un secret fort si manquant
    if (!secret) {
      const devSecret = crypto.randomBytes(64).toString('hex')
      console.log('⚠️ JWT_SECRET généré pour le développement')
      return devSecret
    }

    return secret
  }

  /**
   * ✅ AMÉLIORÉ : Génère un token JWT pour un utilisateur avec ID unique
   */
  generateToken(user) {
    // ✅ Générer un ID unique pour ce token (pour la révocation)
    const tokenId = crypto.randomUUID()

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      tokenId, // ✅ ID unique pour la révocation
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    }

    return {
      token: jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.jwtExpiresIn,
        issuer: 'teamflow',
        audience: 'teamflow-users',
      }),
      tokenId, // ✅ Retourner l'ID pour le tracking
    }
  }

  /**
   * ✅ AMÉLIORÉ : Génère un refresh token avec ID unique
   */
  generateRefreshToken(user) {
    const tokenId = crypto.randomUUID()

    const payload = {
      userId: user._id,
      tokenId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
    }

    return {
      token: jwt.sign(payload, this.jwtSecret, {
        expiresIn: this.refreshExpiresIn,
        issuer: 'teamflow',
        audience: 'teamflow-refresh',
      }),
      tokenId,
    }
  }

  /**
   * ✅ AMÉLIORÉ : Vérifie et décode un token JWT avec validation en base
   */
  async verifyToken(token, validateInDatabase = true) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'teamflow',
        audience: 'teamflow-users',
      })

      // ✅ Vérifier le type de token
      if (decoded.type !== 'access') {
        console.log('🚫 Type de token incorrect:', decoded.type)
        return null
      }

      // ✅ NOUVEAU : Validation en base de données
      if (validateInDatabase) {
        const user = await User.findById(decoded.userId).select(
          'isActive role activeSessions'
        )

        if (!user || !user.isActive) {
          console.log('🚫 Utilisateur non trouvé ou inactif:', decoded.userId)
          return null
        }

        // ✅ Vérifier que le rôle n'a pas changé
        if (user.role !== decoded.role) {
          console.log('🚫 Rôle utilisateur modifié, token invalide')
          return null
        }

        // ✅ Vérifier que la session est toujours active
        const sessionExists = user.activeSessions.some(
          (session) =>
            session.tokenId === decoded.tokenId &&
            session.expiresAt > new Date()
        )

        if (!sessionExists) {
          console.log('🚫 Session révoquée ou expirée:', decoded.tokenId)
          return null
        }
      }

      return decoded
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('🕒 Token expiré')
      } else {
        console.log('🔐 Token JWT invalide:', error.message)
      }
      return null
    }
  }

  /**
   * ✅ AMÉLIORÉ : Vérifie un refresh token
   */
  async verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret, {
        issuer: 'teamflow',
        audience: 'teamflow-refresh',
      })

      // ✅ Vérifier le type de token
      if (decoded.type !== 'refresh') {
        console.log('🚫 Type de refresh token incorrect')
        return null
      }

      // ✅ Vérifier que l'utilisateur existe toujours
      const user = await User.findById(decoded.userId).select(
        'isActive activeSessions'
      )

      if (!user || !user.isActive) {
        console.log('🚫 Utilisateur non trouvé pour refresh token')
        return null
      }

      // ✅ Vérifier que la session refresh est active
      const sessionExists = user.activeSessions.some(
        (session) =>
          session.tokenId === decoded.tokenId && session.expiresAt > new Date()
      )

      if (!sessionExists) {
        console.log('🚫 Session refresh révoquée:', decoded.tokenId)
        return null
      }

      return decoded
    } catch (error) {
      console.log('🔄 Refresh token invalide:', error.message)
      return null
    }
  }

  /**
   * ✅ AMÉLIORÉ : Authentifie un utilisateur avec sécurité renforcée
   */
  async authenticateUser(email, password, userAgent = '', ipAddress = '') {
    try {
      console.log('🔐 Tentative de connexion:', email)

      // ✅ Utiliser la nouvelle méthode sécurisée pour trouver l'utilisateur
      const user = await User.findForAuth(email)

      if (!user) {
        console.log('🔍 Utilisateur non trouvé:', email)
        return null
      }

      // ✅ Vérifier si le compte est actif
      if (!user.isActive) {
        console.log('🚫 Compte inactif:', email)
        return null
      }

      // ✅ Vérifier si le compte est verrouillé
      if (user.isAccountLocked()) {
        console.log('🔒 Compte verrouillé:', email)
        return null
      }

      // ✅ Vérifier le mot de passe
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        // Incrémenter les tentatives de connexion
        await user.incLoginAttempts()
        console.log('❌ Mot de passe incorrect:', email)
        return null
      }

      // ✅ Réinitialiser les tentatives de connexion en cas de succès
      await user.resetLoginAttempts()

      // ✅ Générer les tokens avec IDs uniques
      const accessTokenData = this.generateToken(user)
      const refreshTokenData = this.generateRefreshToken(user)

      // ✅ Enregistrer les sessions actives
      await user.addActiveSession(accessTokenData.tokenId, userAgent, ipAddress)
      await user.addActiveSession(
        refreshTokenData.tokenId,
        userAgent,
        ipAddress
      )

      // ✅ Mettre à jour la dernière connexion
      await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

      console.log('✅ Authentification réussie:', email)

      return {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          employeeId: user.employeeId,
        },
        accessToken: accessTokenData.token,
        refreshToken: refreshTokenData.token,
        expiresIn: this.jwtExpiresIn,
        tokenId: accessTokenData.tokenId, // ✅ Pour le tracking
      }
    } catch (error) {
      console.error('❌ Erreur authentification:', error)
      return null
    }
  }

  /**
   * ✅ AMÉLIORÉ : Rafraîchit un token d'accès avec révocation de l'ancien
   */
  async refreshAccessToken(refreshToken) {
    try {
      // ✅ Vérifier le refresh token
      const decoded = await this.verifyRefreshToken(refreshToken)
      if (!decoded) return null

      // ✅ Récupérer l'utilisateur complet
      const user = await User.findById(decoded.userId)
      if (!user || !user.isActive) return null

      // ✅ Révoquer l'ancienne session refresh
      await user.removeActiveSession(decoded.tokenId)

      // ✅ Générer un nouveau token d'accès ET un nouveau refresh token
      const newAccessTokenData = this.generateToken(user)
      const newRefreshTokenData = this.generateRefreshToken(user)

      // ✅ Enregistrer les nouvelles sessions
      await user.addActiveSession(newAccessTokenData.tokenId, '', '')
      await user.addActiveSession(newRefreshTokenData.tokenId, '', '')

      console.log('🔄 Tokens rafraîchis pour:', user.email)

      return {
        accessToken: newAccessTokenData.token,
        refreshToken: newRefreshTokenData.token,
        expiresIn: this.jwtExpiresIn,
      }
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token:', error)
      return null
    }
  }

  /**
   * ✅ NOUVEAU : Révoque un token spécifique
   */
  async revokeToken(token) {
    try {
      const decoded = jwt.decode(token)
      if (!decoded || !decoded.tokenId) return false

      const user = await User.findById(decoded.userId)
      if (!user) return false

      await user.removeActiveSession(decoded.tokenId)
      return true
    } catch (error) {
      console.error('❌ Erreur révocation token:', error)
      return false
    }
  }

  /**
   * ✅ NOUVEAU : Révoque toutes les sessions d'un utilisateur
   */
  async revokeAllUserTokens(userId) {
    try {
      const user = await User.findById(userId)
      if (!user) return false

      await user.removeAllActiveSessions()
      console.log('🚪 Toutes les sessions révoquées pour:', user.email)
      return true
    } catch (error) {
      console.error('❌ Erreur révocation sessions:', error)
      return false
    }
  }

  /**
   * Extrait le token du header Authorization
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    return authHeader.substring(7) // Enlever "Bearer "
  }

  /**
   * ✅ AMÉLIORÉ : Vérification des permissions avec cache
   */
  hasPermission(user, requiredRoles) {
    if (!user || !user.role) return false

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    // Admin a accès à tout
    if (user.role === 'admin') return true

    // Manager a accès aux rôles user et manager
    if (
      user.role === 'manager' &&
      (roles.includes('user') || roles.includes('manager'))
    ) {
      return true
    }

    // User a accès uniquement à son rôle
    return roles.includes(user.role)
  }

  /**
   * ✅ AMÉLIORÉ : Crée un utilisateur admin par défaut avec sécurité
   */
  async ensureDefaultAdmin() {
    try {
      const admin = await User.createDefaultAdmin()
      return admin
    } catch (error) {
      console.error('❌ Erreur création admin par défaut:', error)
      return null
    }
  }

  /**
   * ✅ NOUVEAU : Nettoie les sessions expirées
   */
  async cleanupExpiredSessions() {
    try {
      const result = await User.updateMany(
        {},
        {
          $pull: {
            activeSessions: {
              expiresAt: { $lt: new Date() },
            },
          },
        }
      )

      console.log(`🧹 ${result.modifiedCount} utilisateurs nettoyés`)
      return result.modifiedCount
    } catch (error) {
      console.error('❌ Erreur nettoyage sessions:', error)
      return 0
    }
  }
}

// Export d'une instance unique (Singleton pattern)
export default new AuthService()
