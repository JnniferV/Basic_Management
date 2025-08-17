# TeamFlow - Système Intranet Intelligent 🚀

Un système intranet moderne avec IA intégrée pour la gestion d'équipe et l'assignation intelligente des tâches.

## ✨ Fonctionnalités

### 🤖 Assistant IA Intelligent
- **Analyse automatique** des demandes utilisateur
- **Matching intelligent** avec les compétences des employés
- **Scores de pertinence** avec explications détaillées
- **Support multi-IA** : Claude (Anthropic) et OpenAI GPT

### 👥 Gestion d'Équipe
- **CRUD complet** des employés
- **Organisation par département**
- **Profils détaillés** avec compétences et historique
- **Système de notation** et statistiques

### 💬 Messagerie Instantanée
- **Chat en temps réel** avec Socket.io
- **Interface moderne** type messenger
- **Notifications** et statuts de présence

### 📊 Dashboard & Analytics
- **Statistiques temps réel**
- **Historique des demandes**
- **Métriques de performance**
- **Vue d'ensemble de l'équipe**

## 🛠 Stack Technique

### Frontend
- **Next.js 14** avec App Router
- **React 18** avec Hooks
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Socket.io Client** pour le temps réel

### Backend
- **Next.js API Routes**
- **MongoDB** avec Mongoose
- **Socket.io** pour la messagerie
- **JWT** pour l'authentification

### IA & Services
- **Claude (Anthropic)** API
- **OpenAI GPT** API (alternative)
- **Cloudinary** pour les images
- **System de fallback** par mots-clés

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- MongoDB (local ou Atlas)
- Clé API IA (Anthropic ou OpenAI)

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd teamflow-intranet
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration environnement
```bash
cp .env.example .env
```

Éditer `.env` avec vos clés :
```env
MONGODB_URI=mongodb://localhost:27017/teamflow_intranet
ANTHROPIC_API_KEY=your_anthropic_key
# OU
OPENAI_API_KEY=your_openai_key
JWT_SECRET=your_super_secret_key
```

### 4. Lancer le développement
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 📡 API Endpoints

### Employés
```
GET    /api/employees          # Liste des employés
POST   /api/employees          # Créer un employé
GET    /api/employees/:id      # Détails employé
PUT    /api/employees/:id      # Modifier employé
DELETE /api/employees/:id      # Supprimer employé
```

### IA
```
POST   /api/ai/analyze         # Analyser une demande
POST   /api/ai/feedback        # Envoyer un feedback
```

### Recherche
```
GET    /api/search?q=query     # Recherche globale
GET    /api/search/skills      # Recherche par compétences
```

## 🤖 Configuration IA

### Anthropic Claude (Recommandé)
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### OpenAI GPT (Alternative)
```env
OPENAI_API_KEY=sk-...
```

### Système de Fallback
Si aucune IA n'est disponible, le système utilise une recherche par mots-clés.

## 📊 Structure de Données

### Employé
```javascript
{
  name: "Marie Dubois",
  email: "marie@company.com",
  phone: "01 23 45 67 89",
  service: "Développement",
  role: "Senior Frontend Developer",
  tasks: ["React", "TypeScript", "UI/UX"],
  avatar: "https://...",
  isActive: true,
  averageRating: 4.5,
  totalRequestsHandled: 23
}
```

### Analyse IA
```javascript
{
  matches: [
    {
      employee: {...},
      aiScore: 95,
      aiReason: "Expert React/TypeScript"
    }
  ],
  summary: "Analyse de la demande...",
  provider: "anthropic"
}
```

## 🔧 Développement

### Scripts disponibles
```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Démarrer production
npm run lint     # Linter
```

### Structure du projet
```
teamflow-intranet/
├── components/          # Composants React
├── lib/                 # Services et utilitaires
├── models/              # Modèles MongoDB
├── pages/               # Pages et API routes
├── public/              # Assets statiques
├── styles/              # Styles globaux
└── utils/               # Fonctions utilitaires
```

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm run build
vercel --prod
```

### Variables d'environnement production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
ANTHROPIC_API_KEY=...
JWT_SECRET=...
NEXTAUTH_URL=https://votre-domaine.com
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Roadmap

- [ ] **Authentification complète** avec rôles utilisateur
- [ ] **Mobile app** React Native
- [ ] **Intégrations externes** (Slack, Teams, etc.)
- [ ] **Système de notifications** avancé
- [ ] **Analytics avancées** avec graphiques
- [ ] **API publique** avec documentation
- [ ] **Tests automatisés** (Jest, Cypress)
- [ ] **CI/CD pipeline** complet

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Documentation** : Wiki du projet
- **Email** : contact@votreentreprise.com

---

**Créé avec ❤️ pour simplifier la gestion d'équipe**