import mongoose from 'mongoose'

const RequestSchema = new mongoose.Schema(
  {
    // Demandeur
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "L'ID du demandeur est requis"],
    },

    // Demande originale
    query: {
      type: String,
      required: [true, 'La requête est requise'],
      maxLength: [1000, 'La requête ne peut pas dépasser 1000 caractères'],
    },
    category: {
      type: String,
      enum: ['technique', 'design', 'marketing', 'infrastructure', 'general'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // Analyse IA
    aiAnalysis: {
      provider: {
        type: String,
        enum: ['anthropic', 'openai', 'fallback'],
        required: true,
      },
      processedQuery: String,
      keywords: [String],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
      },
      processingTime: Number, // en millisecondes
    },

    // Résultats matching
    matches: [
      {
        employeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
        reason: {
          type: String,
          required: true,
        },
        matchedSkills: [String],
      },
    ],

    // Attribution et suivi
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Feedback
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      maxLength: [500, 'Le feedback ne peut pas dépasser 500 caractères'],
    },

    // Dates importantes
    assignedAt: Date,
    completedAt: Date,

    // Métadonnées
    metadata: {
      userAgent: String,
      ipAddress: String,
      sessionId: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

// Index pour optimiser les requêtes
RequestSchema.index({ requesterId: 1, createdAt: -1 })
RequestSchema.index({ assignedTo: 1, status: 1 })
RequestSchema.index({ status: 1, priority: 1 })
RequestSchema.index({ category: 1, createdAt: -1 })
RequestSchema.index({ 'aiAnalysis.provider': 1 })

// Index pour la recherche textuelle
RequestSchema.index({
  query: 'text',
  'aiAnalysis.keywords': 'text',
})

// Virtual pour la durée de traitement
RequestSchema.virtual('processingDuration').get(function () {
  if (this.assignedAt && this.completedAt) {
    return this.completedAt - this.assignedAt
  }
  return null
})

// Virtual pour le statut formaté
RequestSchema.virtual('statusDisplay').get(function () {
  const statusMap = {
    pending: 'En attente',
    assigned: 'Assignée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  }
  return statusMap[this.status] || this.status
})

// Méthode pour assigner la demande
RequestSchema.methods.assignTo = function (employeeId) {
  this.assignedTo = employeeId
  this.status = 'assigned'
  this.assignedAt = new Date()
  return this.save()
}

// Méthode pour marquer comme terminée
RequestSchema.methods.complete = function (rating = null, feedback = null) {
  this.status = 'completed'
  this.completedAt = new Date()
  if (rating) this.rating = rating
  if (feedback) this.feedback = feedback
  return this.save()
}

// Méthode statique pour les statistiques
RequestSchema.statics.getStats = function (period = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - period)

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        avgRating: { $avg: '$rating' },
        avgProcessingTime: { $avg: '$aiAnalysis.processingTime' },
      },
    },
  ])
}

// Export du modèle pour la collection 'requests' dans la base 'basicm'
export default mongoose.models.Request ||
  mongoose.model('Request', RequestSchema, 'requests')
