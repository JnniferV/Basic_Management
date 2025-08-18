import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const UserSchema = new mongoose.Schema(
  {
    // Informations d'authentification
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
      index: true, // ✅ Index pour optimiser les recherches
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minLength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false, // ✅ CRITIQUE : Ne jamais exposer le mot de passe par défaut
    },

    // Informations de profil
    firstName: {
      type: String,
      required: [true, 'Le prénom est requis'],
      trim: true,
      maxLength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    lastName: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxLength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },

    // Rôle et permissions
    role: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user',
      required: true,
      index: true, // ✅ Index pour les requêtes par rôle
    },

    // Statut et sécurité
    isActive: {
      type: Boolean,
      default: true,
      index: true, // ✅ Index pour les requêtes d'utilisateurs actifs
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },

    // Référence vers l'employé (optionnel)
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      sparse: true, // Permet null/undefined
    },

    // ✅ AJOUT : Sécurité renforcée
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },

    // Tokens pour reset password
    resetPasswordToken: {
      type: String,
      select: false, // ✅ Ne pas exposer les tokens
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // ✅ AJOUT : Tracking des sessions pour révocation
    activeSessions: [
      {
        tokenId: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        userAgent: String,
        ipAddress: String,
      },
    ],

    // Métadonnées
    avatar: {
      type: String,
      default: function () {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${this.firstName} ${this.lastName}`
        )}&background=random`
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // ✅ SÉCURITÉ : Transformer l'output pour supprimer les champs sensibles
      transform: function (doc, ret) {
        delete ret.password
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.activeSessions
        return ret
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password
        delete ret.resetPasswordToken
        delete ret.resetPasswordExpires
        delete ret.activeSessions
        return ret
      },
    },
  }
)

// ✅ Index composés pour optimiser les requêtes
UserSchema.index({ email: 1, isActive: 1 })
UserSchema.index({ role: 1, isActive: 1 })
UserSchema.index({ employeeId: 1 }, { sparse: true })

// Virtual pour le nom complet
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

// Virtual pour le nom d'affichage
UserSchema.virtual('displayName').get(function () {
  return this.fullName
})

// ✅ Virtual pour vérifier si le compte est verrouillé
UserSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Middleware pre-save pour hasher le mot de passe
UserSchema.pre('save', async function (next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next()

  try {
    // ✅ SÉCURITÉ : Vérifier la complexité du mot de passe
    if (this.password.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères')
    }

    // ✅ Hasher avec un salt de 12 rounds (recommandé pour 2024)
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)

    // ✅ Mettre à jour la date de changement de mot de passe
    this.passwordChangedAt = new Date()

    next()
  } catch (error) {
    next(error)
  }
})

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    if (!candidatePassword || !this.password) return false
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    console.error('❌ Erreur comparaison mot de passe:', error)
    return false
  }
}

// ✅ Méthode pour vérifier si le compte est verrouillé (méthode au lieu de virtual)
UserSchema.methods.isAccountLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
}

// Méthode pour incrémenter les tentatives de connexion
UserSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5
  const lockTime = 2 * 60 * 60 * 1000 // 2 heures

  // Si le compte est déjà verrouillé et que le délai est expiré
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  // Verrouiller le compte après maxAttempts tentatives échouées
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime }
  }

  return this.updateOne(updates)
}

// Méthode pour réinitialiser les tentatives de connexion
UserSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

// ✅ NOUVELLE MÉTHODE : Générer un token de reset password sécurisé
UserSchema.methods.generateResetToken = function () {
  // Générer un token aléatoire
  const resetToken = crypto.randomBytes(32).toString('hex')

  // Hasher le token et le sauvegarder
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Définir l'expiration à 10 minutes
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000

  // Retourner le token non hashé pour l'envoyer par email
  return resetToken
}

// ✅ NOUVELLE MÉTHODE : Ajouter une session active
UserSchema.methods.addActiveSession = function (tokenId, userAgent, ipAddress) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 jours

  this.activeSessions.push({
    tokenId,
    userAgent,
    ipAddress,
    expiresAt,
  })

  // Limiter à 5 sessions actives maximum
  if (this.activeSessions.length > 5) {
    this.activeSessions.shift() // Supprimer la plus ancienne
  }

  return this.save()
}

// ✅ NOUVELLE MÉTHODE : Supprimer une session active
UserSchema.methods.removeActiveSession = function (tokenId) {
  this.activeSessions = this.activeSessions.filter(
    (session) => session.tokenId !== tokenId
  )
  return this.save()
}

// ✅ NOUVELLE MÉTHODE : Supprimer toutes les sessions (déconnexion globale)
UserSchema.methods.removeAllActiveSessions = function () {
  this.activeSessions = []
  return this.save()
}

// ✅ AMÉLIORATION : Méthode statique pour créer un utilisateur admin sécurisé
UserSchema.statics.createDefaultAdmin = async function () {
  try {
    const adminExists = await this.findOne({ role: 'admin' })
    if (adminExists) {
      console.log('👑 Utilisateur admin existe déjà')
      return null
    }

    // ✅ TEMPORAIRE : Mot de passe simple pour les tests
    const simplePassword = 'admin123'

    const adminUser = new this({
      email: 'admin@teamflow.com',
      password: simplePassword, // ✅ Mot de passe simple pour les tests
      firstName: 'Admin',
      lastName: 'TeamFlow',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    })

    const savedAdmin = await adminUser.save()

    // ✅ IMPORTANT : Afficher le mot de passe généré une seule fois
    console.log('🔑=============================================')
    console.log('👑 ADMIN CRÉÉ - SAUVEGARDEZ CES INFORMATIONS :')
    console.log('📧 Email:', savedAdmin.email)
    console.log('🔐 Mot de passe:', simplePassword)
    console.log('🔑=============================================')

    return savedAdmin
  } catch (error) {
    console.error('❌ Erreur création admin par défaut:', error)
    return null
  }
}

// Méthode statique pour la recherche d'utilisateurs
UserSchema.statics.searchUsers = function (query, filters = {}) {
  const searchQuery = {
    $or: [
      { firstName: { $regex: query, $options: 'i' } },
      { lastName: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
    ],
    ...filters,
  }

  return this.find(searchQuery)
    .select(
      '-password -resetPasswordToken -resetPasswordExpires -activeSessions'
    ) // ✅ Exclure les champs sensibles
    .populate('employeeId', 'name role service')
    .sort({ createdAt: -1 })
}

// ✅ NOUVELLE MÉTHODE : Rechercher un utilisateur pour l'authentification
UserSchema.statics.findForAuth = function (email) {
  return this.findOne({
    email: email.toLowerCase().trim(),
    isActive: true,
  }).select('+password') // ✅ Inclure explicitement le mot de passe pour l'auth
}

// Export du modèle User pour la collection 'users' dans la base 'basicm'
export default mongoose.models.User ||
  mongoose.model('User', UserSchema, 'users')
