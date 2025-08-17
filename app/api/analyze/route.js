import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import Employee from '@/models/employee-model'
import Request from '@/models/request-model'
import Analytics from '@/models/analytics-model'
import AIService from '@/lib/ai-service'

// POST /api/analyze - Analyser une demande avec l'IA
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { query, serviceFilter = 'all', requesterId } = body

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query requise' }, { status: 400 })
    }

    // Mesurer le temps de traitement
    const startTime = Date.now()

    // Récupérer les employés actifs
    let employeeQuery = { isActive: true }
    if (serviceFilter && serviceFilter !== 'all') {
      employeeQuery.service = serviceFilter
    }

    const employees = await Employee.find(employeeQuery)
      .select(
        'name email service role tasks averageRating totalRequestsHandled'
      )
      .lean()

    if (employees.length === 0) {
      return NextResponse.json(
        {
          error: 'Aucun employé trouvé',
          matches: [],
          summary: 'Aucun employé disponible dans ce service',
        },
        { status: 404 }
      )
    }

    // Analyser avec l'IA (instance unique exportée)
    const aiService = AIService
    const analysis = await aiService.analyzeRequest(query, employees)

    const processingTime = Date.now() - startTime

    // Sauvegarder la demande dans la collection 'requests'
    try {
      const requestData = {
        query: query.trim(),
        category: detectCategory(query),
        priority: detectPriority(query),
        aiAnalysis: {
          provider: analysis.provider,
          processedQuery: query.trim(),
          keywords: extractKeywords(query),
          confidence: calculateConfidence(analysis.matches),
          processingTime,
        },
        matches: analysis.matches.map((match) => ({
          employeeId: match._id || match.id,
          score: match.aiScore,
          reason: match.aiReason,
          matchedSkills: extractMatchedSkills(match, query),
        })),
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        },
      }

      if (requesterId) {
        requestData.requesterId = requesterId
      }

      await Request.create(requestData)
    } catch (error) {
      console.error('Erreur sauvegarde request:', error)
      // Ne pas faire échouer la requête principale
    }

    // Enregistrer les analytics
    try {
      await Analytics.logEvent({
        type: 'ai_query',
        action: 'analyze_request',
        data: {
          query: query.trim(),
          provider: analysis.provider,
          matchCount: analysis.matches.length,
          processingTime,
        },
        performance: {
          responseTime: processingTime,
        },
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.ip,
        },
      })
    } catch (error) {
      console.error('Erreur analytics:', error)
      // Ne pas faire échouer la requête principale
    }

    // Réponse
    return NextResponse.json({
      matches: analysis.matches,
      summary: analysis.summary,
      analysis: analysis.analysis,
      provider: analysis.provider,
      processingTime,
      meta: {
        totalEmployees: employees.length,
        serviceFilter,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Erreur API analyse IA:', error)

    // Enregistrer l'erreur dans les analytics
    try {
      await Analytics.logEvent({
        type: 'system_event',
        action: 'api_error',
        data: {
          endpoint: '/api/analyze',
          error: error.message,
        },
      })
    } catch (analyticsError) {
      console.error('Erreur analytics (erreur):', analyticsError)
    }

    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse IA",
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// Fonctions utilitaires

function detectCategory(query) {
  const categoryKeywords = {
    technique: [
      'code',
      'développement',
      'bug',
      'api',
      'database',
      'frontend',
      'backend',
    ],
    design: ['design', 'ui', 'ux', 'interface', 'mockup', 'prototype'],
    marketing: ['marketing', 'seo', 'campagne', 'publicité', 'contenu'],
    infrastructure: ['serveur', 'cloud', 'déploiement', 'docker', 'kubernetes'],
  }

  const queryLower = query.toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => queryLower.includes(keyword))) {
      return category
    }
  }

  return 'general'
}

function detectPriority(query) {
  const urgentKeywords = ['urgent', 'critique', 'bloquant', 'immédiat']
  const highKeywords = ['important', 'priorité', 'rapidement']

  const queryLower = query.toLowerCase()

  if (urgentKeywords.some((keyword) => queryLower.includes(keyword))) {
    return 'urgent'
  }

  if (highKeywords.some((keyword) => queryLower.includes(keyword))) {
    return 'high'
  }

  return 'medium'
}

function extractKeywords(query) {
  // Mots vides à ignorer
  const stopWords = [
    'le',
    'la',
    'les',
    'un',
    'une',
    'des',
    'de',
    'du',
    'et',
    'ou',
    'mais',
    'donc',
    'car',
    'ni',
    'or',
  ]

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10) // Limiter à 10 mots-clés
}

function calculateConfidence(matches) {
  if (!matches.length) return 0

  const avgScore =
    matches.reduce((sum, match) => sum + match.aiScore, 0) / matches.length
  return Math.min(avgScore / 100, 1)
}

function extractMatchedSkills(employee, query) {
  const queryWords = query.toLowerCase().split(/\s+/)
  const employeeSkills = employee.tasks || []

  return employeeSkills.filter((skill) =>
    queryWords.some((word) => skill.toLowerCase().includes(word))
  )
}
