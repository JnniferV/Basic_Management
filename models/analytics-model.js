import mongoose from 'mongoose'

const AnalyticsSchema = new mongoose.Schema(
  {
    // Identification
    type: {
      type: String,
      required: [true, "Le type d'événement est requis"],
      enum: [
        'user_action', // Action utilisateur
        'ai_query', // Requête IA
        'employee_view', // Consultation profil employé
        'chat_message', // Message envoyé
        'system_event', // Événement système
        'performance', // Métriques de performance
      ],
    },

    // Données de base
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // Détails de l'événement
    action: {
      type: String,
      required: [true, "L'action est requise"],
      maxLength: [100, "L'action ne peut pas dépasser 100 caractères"],
    },
    resource: {
      type: String, // ex: 'employee', 'chat', 'request'
      maxLength: [50, 'La ressource ne peut pas dépasser 50 caractères'],
    },
    resourceId: {
      type: String, // ID de la ressource concernée
    },

    // Données contextuelles
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Métadonnées techniques
    metadata: {
      userAgent: String,
      ipAddress: String,
      referrer: String,
      viewport: {
        width: Number,
        height: Number,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },

    // Métriques de performance
    performance: {
      loadTime: Number, // Temps de chargement en ms
      responseTime: Number, // Temps de réponse API en ms
      errorCount: Number, // Nombre d'erreurs
      memoryUsage: Number, // Utilisation mémoire
    },

    // Géolocalisation (optionnel)
    location: {
      country: String,
      city: String,
      timezone: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

// Index pour optimiser les requêtes
AnalyticsSchema.index({ type: 1, createdAt: -1 })
AnalyticsSchema.index({ userId: 1, createdAt: -1 })
AnalyticsSchema.index({ sessionId: 1 })
AnalyticsSchema.index({ action: 1, createdAt: -1 })
AnalyticsSchema.index({ resource: 1, resourceId: 1 })

// Index composé pour les requêtes complexes
AnalyticsSchema.index({
  type: 1,
  action: 1,
  createdAt: -1,
})

// Virtual pour le day bucket (pour les agrégations)
AnalyticsSchema.virtual('dayBucket').get(function () {
  const date = this.createdAt
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
})

// Méthode statique pour enregistrer un événement
AnalyticsSchema.statics.logEvent = function (eventData) {
  const analytics = new this({
    ...eventData,
    sessionId: eventData.sessionId || 'default-session-' + Date.now(),
    metadata: {
      ...eventData.metadata,
      timestamp: new Date(),
    },
  })

  return analytics.save().catch((error) => {
    console.error("Erreur lors de l'enregistrement des analytics:", error)
    // Ne pas faire échouer l'opération principale
  })
}

// Méthode statique pour les statistiques d'utilisation
AnalyticsSchema.statics.getUsageStats = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type',
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        events: {
          $push: {
            type: '$_id.type',
            count: '$count',
            uniqueUsers: { $size: '$uniqueUsers' },
          },
        },
        totalEvents: { $sum: '$count' },
      },
    },
    { $sort: { _id: 1 } },
  ])
}

// Méthode statique pour les métriques de performance
AnalyticsSchema.statics.getPerformanceMetrics = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        type: 'performance',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        avgLoadTime: { $avg: '$performance.loadTime' },
        avgResponseTime: { $avg: '$performance.responseTime' },
        totalErrors: { $sum: '$performance.errorCount' },
        maxLoadTime: { $max: '$performance.loadTime' },
        minLoadTime: { $min: '$performance.loadTime' },
      },
    },
  ])
}

// Méthode statique pour nettoyer les anciennes données (GDPR)
AnalyticsSchema.statics.cleanOldData = function (daysToKeep = 90) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
  })
}

// Export du modèle pour la collection 'analytics' dans la base 'basicm'
export default mongoose.models.Analytics ||
  mongoose.model('Analytics', AnalyticsSchema, 'analytics')
