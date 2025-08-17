import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
  {
    // Identification
    chatId: {
      type: String,
      required: [true, "L'ID du chat est requis"],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, "L'ID de l'expéditeur est requis"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      sparse: true, // Peut être null pour les messages de groupe
    },

    // Contenu
    content: {
      type: String,
      required: [true, 'Le contenu du message est requis'],
      maxLength: [2000, 'Le message ne peut pas dépasser 2000 caractères'],
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'ai'],
      default: 'text',
    },

    // Métadonnées
    isRead: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },

    // Support IA
    aiAnalysis: {
      sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
      },
      keywords: [String],
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },

    // Pièces jointes
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        mimeType: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
)

// Index pour optimiser les requêtes
MessageSchema.index({ chatId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1, createdAt: -1 })
MessageSchema.index({ receiverId: 1, isRead: 1 })

// Index pour la recherche textuelle
MessageSchema.index({ content: 'text' })

// Virtual pour le nom du chat formaté
MessageSchema.virtual('chatName').get(function () {
  return `Chat-${this.chatId}`
})

// Méthode pour marquer comme lu
MessageSchema.methods.markAsRead = function () {
  this.isRead = true
  return this.save()
}

// Méthode statique pour récupérer l'historique d'un chat
MessageSchema.statics.getChatHistory = function (chatId, limit = 50) {
  return this.find({ chatId })
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Export du modèle pour la collection 'messages' dans la base 'basicm'
export default mongoose.models.Message ||
  mongoose.model('Message', MessageSchema, 'messages')
