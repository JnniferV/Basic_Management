import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import Employee from '@/models/employee-model'
import Request from '@/models/request-model'
import Message from '@/models/message-model'
import Service from '@/models/service-model'

export async function POST() {
  try {
    await connectDB()

    // Nettoyage collections
    await Promise.all([
      Employee.deleteMany({}),
      Request.deleteMany({}),
      Message.deleteMany({}),
      Service.deleteMany({}),
    ])

    // Services fictifs
    const services = await Service.insertMany([
      {
        name: 'Développement',
        color: 'bg-emerald-500',
        description: 'Équipe de développement logiciel',
      },
      {
        name: 'Design',
        color: 'bg-purple-500',
        description: 'Équipe design et UX',
      },
      {
        name: 'Marketing',
        color: 'bg-orange-500',
        description: 'Équipe marketing et communication',
      },
      {
        name: 'Infrastructure',
        color: 'bg-blue-500',
        description: 'Équipe infrastructure et DevOps',
      },
      {
        name: 'Commercial',
        color: 'bg-indigo-500',
        description: 'Équipe commerciale et ventes',
      },
      {
        name: 'RH',
        color: 'bg-pink-500',
        description: 'Équipe ressources humaines',
      },
    ])

    // Employés fictifs avec compétences détaillées pour l'agent IA
    const employees = await Employee.insertMany([
      {
        name: 'Marie Dubois',
        email: 'marie.dubois@example.com',
        phone: '+33 6 12 34 56 78',
        service: 'Développement',
        role: 'Développeuse Frontend Senior',
        tasks: [
          'React avancé',
          'Next.js',
          'TypeScript',
          'Performance optimization',
          'State management',
          'React hooks',
          'Bundle optimization',
          'Tests unitaires',
          'Code review',
          'Mentoring junior',
        ],
        totalRequestsHandled: 42,
        averageRating: 4.6,
      },
      {
        name: 'Alex Martin',
        email: 'alex.martin@example.com',
        phone: '+33 6 98 76 54 32',
        service: 'Infrastructure',
        role: 'DevOps Engineer Expert',
        tasks: [
          'AWS Cloud',
          'Kubernetes',
          'Docker',
          'CI/CD pipelines',
          'Terraform',
          'Security',
          'Monitoring',
          'Load balancing',
          'Database administration',
          'Backup strategies',
        ],
        totalRequestsHandled: 37,
        averageRating: 4.4,
      },
      {
        name: 'Sophie Laurent',
        email: 'sophie.laurent@example.com',
        phone: '+33 7 22 11 33 44',
        service: 'Design',
        role: 'Lead UX/UI Designer',
        tasks: [
          'Design System',
          'Figma',
          'Adobe Creative Suite',
          'UX Research',
          'User testing',
          'Prototyping',
          'Design sprint',
          'Accessibilité',
          'Mobile design',
        ],
        totalRequestsHandled: 28,
        averageRating: 4.8,
      },
      {
        name: 'Camille Rousseau',
        email: 'camille.rousseau@example.com',
        phone: '+33 7 44 55 66 77',
        service: 'Marketing',
        role: 'Growth Marketing Manager',
        tasks: [
          'SEO technique',
          'Google Ads',
          'Facebook Ads',
          'Google Analytics',
          'Conversion optimization',
          'A/B testing',
          'Content marketing',
          'Email marketing',
        ],
        totalRequestsHandled: 31,
        averageRating: 4.3,
      },
      {
        name: 'Thomas Bernard',
        email: 'thomas.bernard@example.com',
        phone: '+33 6 55 44 33 22',
        service: 'Développement',
        role: 'Développeur Full-Stack Junior',
        tasks: [
          'JavaScript',
          'Node.js',
          'HTML/CSS',
          'REST API',
          'SQL',
          'Git',
          'Debug',
          'Code simple',
          'Formation',
        ],
        totalRequestsHandled: 8,
        averageRating: 4.1,
      },
      {
        name: 'Emma Chen',
        email: 'emma.chen@example.com',
        phone: '+33 7 88 99 00 11',
        service: 'Design',
        role: 'UI Designer',
        tasks: [
          'Interface design',
          'Wireframing',
          'Mockups',
          'Icon design',
          'Visual design',
          'Brand guidelines',
        ],
        totalRequestsHandled: 15,
        averageRating: 4.5,
      },
    ])

    // Requêtes fictives
    const [marie, alex, sophie, camille] = employees
    const requests = await Request.insertMany([
      {
        requesterId: marie._id,
        query: "Optimiser les performances d'un composant React complexe",
        category: 'technique',
        priority: 'high',
        aiAnalysis: {
          provider: 'fallback',
          processedQuery: 'optimisation React composant complexe',
          keywords: ['React', 'performance', 'memo', 'profiling'],
          confidence: 0.78,
          processingTime: 120,
        },
        matches: [
          {
            employeeId: marie._id,
            score: 95,
            reason: 'Expertise React/Tailwind confirmée',
            matchedSkills: ['React', 'Tailwind'],
          },
          {
            employeeId: alex._id,
            score: 65,
            reason: 'Impact infra possible (bundling, CI)',
            matchedSkills: ['CI/CD'],
          },
        ],
        assignedTo: marie._id,
        status: 'completed',
        rating: 5,
        feedback: 'Résolution rapide et documentation claire',
        assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        completedAt: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        requesterId: camille._id,
        query: 'Lancer une campagne marketing pour le nouveau produit',
        category: 'marketing',
        priority: 'medium',
        aiAnalysis: {
          provider: 'fallback',
          processedQuery: 'campagne marketing nouveau produit',
          keywords: ['SEO', 'SEA', 'landing'],
          confidence: 0.72,
          processingTime: 90,
        },
        matches: [
          {
            employeeId: camille._id,
            score: 88,
            reason: 'Expertise growth/SEO/SEA',
            matchedSkills: ['SEO', 'SEA'],
          },
          {
            employeeId: sophie._id,
            score: 60,
            reason: 'Design landing pages',
            matchedSkills: ['Design System'],
          },
        ],
        assignedTo: camille._id,
        status: 'in_progress',
      },
    ])

    // Messages fictifs
    const messages = await Message.insertMany([
      {
        chatId: `${marie._id}-${alex._id}`,
        senderId: marie._id,
        receiverId: alex._id,
        content: 'Salut Alex, peux-tu jeter un œil à la config Webpack?',
        messageType: 'text',
      },
      {
        chatId: `${marie._id}-${alex._id}`,
        senderId: alex._id,
        receiverId: marie._id,
        content: 'Oui, je regarde et je te fais un retour.',
        messageType: 'text',
      },
      {
        chatId: `${camille._id}-${sophie._id}`,
        senderId: camille._id,
        receiverId: sophie._id,
        content: 'Peux-tu proposer une maquette pour la landing ?',
        messageType: 'text',
      },
    ])

    return NextResponse.json({
      ok: true,
      inserted: {
        services: services.length,
        employees: employees.length,
        requests: requests.length,
        messages: messages.length,
      },
      message: 'Agent IA Management prêt avec équipe experte !',
    })
  } catch (error) {
    console.error('Erreur seed:', error)
    return NextResponse.json(
      { ok: false, error: 'Seed failed' },
      { status: 500 }
    )
  }
}
