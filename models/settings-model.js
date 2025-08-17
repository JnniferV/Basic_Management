import mongoose from 'mongoose'

const SettingsSchema = new mongoose.Schema(
  {
    // Identification
    key: {
      type: String,
      required: [true, 'La clé est requise'],
      unique: true,
      maxLength: [100, 'La clé ne peut pas dépasser 100 caractères'],
    },

    // Valeur du paramètre
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'La valeur est requise'],
    },

    // Métadonnées
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'ai',
        'ui',
        'security',
        'notifications',
        'performance',
        'features',
      ],
      required: true,
    },

    // Description et validation
    description: {
      type: String,
      maxLength: [500, 'La description ne peut pas dépasser 500 caractères'],
    },
    validation: {
      required: Boolean,
      min: Number,
      max: Number,
      enum: [String],
      pattern: String,
    },

    // Contrôle d'accès
    isPublic: {
      type: Boolean,
      default: false,
    },
    editableBy: [
      {
        type: String,
        enum: ['admin', 'manager', 'user'],
      },
    ],

    // Historique
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    history: [
      {
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        reason: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

// Index pour optimiser les requêtes
SettingsSchema.index({ key: 1 }, { unique: true })
SettingsSchema.index({ category: 1 })
SettingsSchema.index({ isPublic: 1 })

// Virtual pour la valeur formatée
SettingsSchema.virtual('displayValue').get(function () {
  if (this.type === 'boolean') {
    return this.value ? 'Activé' : 'Désactivé'
  }
  if (this.type === 'array' && Array.isArray(this.value)) {
    return this.value.join(', ')
  }
  if (this.type === 'object') {
    return JSON.stringify(this.value, null, 2)
  }
  return String(this.value)
})

// Méthode pour mettre à jour la valeur avec historique
SettingsSchema.methods.updateValue = function (
  newValue,
  modifiedBy,
  reason = ''
) {
  // Ajouter à l'historique
  this.history.push({
    oldValue: this.value,
    newValue: newValue,
    modifiedBy: modifiedBy,
    reason: reason,
  })

  // Mettre à jour la valeur
  this.value = newValue
  this.lastModifiedBy = modifiedBy

  return this.save()
}

// Méthode statique pour récupérer une valeur
SettingsSchema.statics.getValue = async function (key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key })
    return setting ? setting.value : defaultValue
  } catch (error) {
    console.error('Erreur lors de la récupération du paramètre:', error)
    return defaultValue
  }
}

// Méthode statique pour définir une valeur
SettingsSchema.statics.setValue = async function (
  key,
  value,
  modifiedBy = null,
  options = {}
) {
  try {
    const setting = await this.findOne({ key })

    if (setting) {
      return setting.updateValue(value, modifiedBy, options.reason)
    } else {
      // Créer un nouveau paramètre
      const newSetting = new this({
        key,
        value,
        type: options.type || typeof value,
        category: options.category || 'general',
        description: options.description,
        isPublic: options.isPublic || false,
        lastModifiedBy: modifiedBy,
      })

      return newSetting.save()
    }
  } catch (error) {
    console.error('Erreur lors de la définition du paramètre:', error)
    throw error
  }
}

// Méthode statique pour récupérer les paramètres par catégorie
SettingsSchema.statics.getByCategory = function (category, publicOnly = false) {
  const query = { category }
  if (publicOnly) {
    query.isPublic = true
  }

  return this.find(query).sort({ key: 1 })
}

// Méthode statique pour initialiser les paramètres par défaut
SettingsSchema.statics.initializeDefaults = async function () {
  const defaults = [
    // Paramètres IA
    {
      key: 'ai.preferred_provider',
      value: 'anthropic',
      type: 'string',
      category: 'ai',
      description: 'Fournisseur IA préféré (anthropic ou openai)',
      isPublic: false,
    },
    {
      key: 'ai.max_tokens',
      value: 2000,
      type: 'number',
      category: 'ai',
      description: 'Nombre maximum de tokens pour les réponses IA',
      isPublic: false,
    },
    {
      key: 'ai.temperature',
      value: 0.7,
      type: 'number',
      category: 'ai',
      description: 'Température pour la créativité des réponses IA',
      isPublic: false,
    },

    // Paramètres UI
    {
      key: 'ui.theme',
      value: 'default',
      type: 'string',
      category: 'ui',
      description: "Thème de l'interface utilisateur",
      isPublic: true,
    },
    {
      key: 'ui.items_per_page',
      value: 20,
      type: 'number',
      category: 'ui',
      description: "Nombre d'éléments par page",
      isPublic: true,
    },

    // Paramètres notifications
    {
      key: 'notifications.email_enabled',
      value: true,
      type: 'boolean',
      category: 'notifications',
      description: 'Activer les notifications par email',
      isPublic: false,
    },
    {
      key: 'notifications.push_enabled',
      value: false,
      type: 'boolean',
      category: 'notifications',
      description: 'Activer les notifications push',
      isPublic: false,
    },
  ]

  for (const setting of defaults) {
    const exists = await this.findOne({ key: setting.key })
    if (!exists) {
      await new this(setting).save()
    }
  }
}

// Export du modèle pour la collection 'settings' dans la base 'basicm'
export default mongoose.models.Settings ||
  mongoose.model('Settings', SettingsSchema, 'settings')
