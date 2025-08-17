import mongoose from 'mongoose'

const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[\d\s\-\+\(\)\.]+$/.test(v)
        },
        message: 'Numéro de téléphone invalide',
      },
    },
    service: {
      type: String,
      required: [true, 'Le service est requis'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Le rôle est requis'],
      trim: true,
      maxLength: [150, 'Le rôle ne peut pas dépasser 150 caractères'],
    },
    tasks: [
      {
        type: String,
        trim: true,
        maxLength: [1000, 'Une tâche ne peut pas dépasser 1000 caractères'],
      },
    ],
    avatar: {
      type: String,
      default: function () {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(
          this.name
        )}&background=random`
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Métadonnées pour l'IA
    aiSkillsVector: [
      {
        skill: String,
        weight: Number, // Poids de la compétence (0-1)
      },
    ],
    totalRequestsHandled: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Index pour la recherche textuelle
EmployeeSchema.index({
  name: 'text',
  role: 'text',
  service: 'text',
  tasks: 'text',
})

// Index composé pour optimiser les requêtes
EmployeeSchema.index({ service: 1, isActive: 1 })
EmployeeSchema.index({ email: 1 }, { unique: true })

// Virtual pour le nom complet formaté
EmployeeSchema.virtual('displayName').get(function () {
  return this.name
})

// Virtual pour les compétences formatées
EmployeeSchema.virtual('skillsText').get(function () {
  return this.tasks && this.tasks.length > 0
    ? this.tasks.join(', ')
    : 'Aucune compétence'
})

// Middleware pre-save pour mettre à jour lastActivity
EmployeeSchema.pre('save', function (next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date()
  }
  next()
})

// Méthode statique pour la recherche par compétences
EmployeeSchema.statics.findBySkills = function (skills) {
  const skillsArray = Array.isArray(skills) ? skills : [skills]
  return this.find({
    tasks: { $in: skillsArray },
    isActive: true,
  }).sort({ averageRating: -1, totalRequestsHandled: -1 })
}

// Méthode statique pour la recherche textuelle
EmployeeSchema.statics.searchEmployees = function (query) {
  return this.find(
    {
      $text: { $search: query },
      isActive: true,
    },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } })
}

// Méthode d'instance pour incrémenter les demandes traitées
EmployeeSchema.methods.incrementRequestsHandled = function () {
  this.totalRequestsHandled += 1
  this.lastActivity = new Date()
  return this.save()
}

// Méthode d'instance pour mettre à jour la note moyenne
EmployeeSchema.methods.updateRating = function (newRating) {
  // Logique simple de moyenne mobile
  const totalRatings = this.totalRequestsHandled || 1
  this.averageRating =
    (this.averageRating * (totalRatings - 1) + newRating) / totalRatings
  return this.save()
}

// Export du modèle Employee pour la collection 'employees' dans la base 'basicm'
export default mongoose.models.Employee ||
  mongoose.model('Employee', EmployeeSchema, 'employees')
