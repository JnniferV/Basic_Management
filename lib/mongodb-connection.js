import mongoose from 'mongoose'

// Configuration pour MongoDB Atlas 'basicm'
const MONGODB_URI_RAW =
  process.env.MONGODB_URI ||
  'mongodb+srv://username:password@cluster.mongodb.net/basicm'

// Supprime les options obsolètes de l'URI (ex: bufferMaxEntries)
function sanitizeMongoUri(uri) {
  if (!uri) return uri
  // Retire bufferMaxEntries/buffermaxentries des query params
  return (
    uri
      .replace(/([&?])buffermaxentries=[^&]*/gi, '$1')
      .replace(/([&?])bufferMaxEntries=[^&]*/g, '$1')
      // Nettoie les délimiteurs résiduels ?&
      .replace(/\?[&]+/, '?')
      .replace(/\?$/, '')
  )
}

const MONGODB_URI = sanitizeMongoUri(MONGODB_URI_RAW)

if (!MONGODB_URI) {
  throw new Error(
    "Veuillez définir la variable d'environnement MONGODB_URI dans .env"
  )
}

// Vérification que la base de données est bien 'basicm'
if (!MONGODB_URI.includes('basicm')) {
  console.warn(
    '⚠️  ATTENTION: La base de données devrait être "basicm". URI actuelle:',
    MONGODB_URI
  )
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      // Mongoose 7+ options
      dbName: 'basicm',
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connecté avec succès')
        return mongoose
      })
      .catch((error) => {
        console.error('❌ Erreur de connexion MongoDB:', error)
        throw error
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connecté à MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de connexion Mongoose:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose déconnecté de MongoDB')
})

// Fermeture propre de la connexion
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log("🛑 Connexion MongoDB fermée suite à l'arrêt de l'application")
  process.exit(0)
})

export default connectDB
