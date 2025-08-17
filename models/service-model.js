import mongoose from 'mongoose'

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du service est requis'],
      unique: true,
      trim: true,
      maxLength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    color: {
      type: String,
      default: 'bg-blue-500',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'La description ne peut pas dépasser 500 caractères'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

// Index pour la recherche
ServiceSchema.index({ name: 1 }, { unique: true })
ServiceSchema.index({ isActive: 1 })

// Export du modèle pour la collection 'services' dans la base 'basicm'
export default mongoose.models.Service ||
  mongoose.model('Service', ServiceSchema, 'services')
