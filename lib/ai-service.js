/**
 * Service IA Intelligent pour Management d'Équipe
 * Agent IA spécialisé dans l'assignation intelligente de tâches
 */

class AIService {
  constructor() {
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY
    this.openaiApiKey = process.env.OPENAI_API_KEY
    this.preferredProvider = this.anthropicApiKey ? 'anthropic' : 'openai'
  }

  /**
   * Analyse intelligente d'une demande et assignation d'employés
   * @param {string} query - La demande de l'utilisateur
   * @param {Array} employees - Liste des employés disponibles
   * @returns {Object} Résultat de l'analyse avec employés matchés
   */
  async analyzeRequest(query, employees) {
    if (!query.trim() || !employees.length) {
      return {
        matches: [],
        summary: 'Demande vide ou aucun employé disponible.',
        analysis: { complexity_level: 'unknown', task_type: 'unknown' },
      }
    }

    try {
      // Préparation des données employés pour l'IA
      const employeesData = employees.map((emp) => ({
        id: emp._id || emp.id,
        name: emp.name,
        service: emp.service,
        role: emp.role,
        tasks: emp.tasks || [],
        averageRating: emp.averageRating || 0,
        totalRequestsHandled: emp.totalRequestsHandled || 0,
      }))

      const prompt = this.buildIntelligentPrompt(query, employeesData)

      let response
      if (this.preferredProvider === 'anthropic' && this.anthropicApiKey) {
        response = await this.callAnthropicAPI(prompt)
      } else if (this.openaiApiKey) {
        response = await this.callOpenAIAPI(prompt)
      } else {
        // Fallback vers analyse locale intelligente
        return this.intelligentLocalAnalysis(query, employeesData)
      }

      return this.parseIntelligentResponse(response, employeesData)
    } catch (error) {
      console.error('Erreur analyse IA:', error)
      // Fallback intelligent local
      return this.intelligentLocalAnalysis(query, employeesData)
    }
  }

  /**
   * Construit un prompt intelligent pour l'agent de management
   */
  buildIntelligentPrompt(query, employees) {
    return `Tu es un AGENT DE MANAGEMENT IA expert dans l'assignation intelligente de tâches en entreprise.

CONTEXTE: Un employé (potentiellement nouveau) fait cette demande sans connaître l'équipe. Ton rôle est de trouver LA PERSONNE IDÉALE en analysant finement les compétences, la complexité et la charge de travail.

DEMANDE: "${query}"

ÉQUIPE DISPONIBLE:
${employees
  .map(
    (emp, index) => `
${index + 1}. ${emp.name} - Service ${emp.service}
   📋 Rôle: ${emp.role}
   🎯 Compétences: ${emp.tasks?.join(' • ') || 'Non spécifiées'}
   ⭐ Performance: ${emp.averageRating}/5 (${emp.totalRequestsHandled} tâches)
   📊 Charge: ${this.getWorkloadStatus(emp.totalRequestsHandled)}
`
  )
  .join('')}

ANALYSE REQUISE:
1. 🔍 ANALYSE DE LA DEMANDE:
   - Type de tâche (technique, créative, administrative, stratégique)
   - Complexité (junior, intermédiaire, senior, expert)
   - Compétences PRÉCISES nécessaires
   - Urgence et durée estimée

2. 🎯 MATCHING INTELLIGENT:
   - Match EXACT entre compétences demandées et disponibles
   - Considère l'expérience (tâches déjà réalisées)
   - Évalue la disponibilité actuelle
   - Priorise la performance

FORMAT RÉPONSE (JSON strict):
{
  "analysis": {
    "task_type": "technique|créative|administrative|stratégique",
    "complexity_level": "junior|intermédiaire|senior|expert",
    "required_skills": ["compétence1", "compétence2"],
    "urgency": "faible|normale|élevée|critique"
  },
  "matches": [
    {
      "employee_id": "${employees[0]?.id || 'id'}",
      "score": 95,
      "confidence": "élevée",
      "primary_reason": "raison principale",
      "detailed_explanation": "pourquoi cette personne est parfaite",
      "matched_skills": ["compétence1"],
      "availability_status": "disponible",
      "recommendation": "assignation_directe"
    }
  ],
  "management_notes": "conseils pour le demandeur"
}`
  }

  /**
   * Analyse locale intelligente (fallback)
   */
  intelligentLocalAnalysis(query, employees) {
    const analysis = this.analyzeTaskComplexity(query)
    const matches = this.findBestMatches(query, employees, analysis)

    return {
      analysis,
      matches: matches.slice(0, 3),
      summary: `Analyse locale: ${matches.length} correspondance(s) trouvée(s) pour cette ${analysis.task_type}`,
      provider: 'local_intelligent',
    }
  }

  /**
   * Analyse la complexité et le type de tâche
   */
  analyzeTaskComplexity(query) {
    const lowerQuery = query.toLowerCase()

    // Détection du type de tâche
    let task_type = 'administrative'
    if (
      this.containsKeywords(lowerQuery, [
        'code',
        'développ',
        'program',
        'bug',
        'api',
        'database',
        'react',
        'javascript',
        'frontend',
        'backend',
      ])
    ) {
      task_type = 'technique'
    } else if (
      this.containsKeywords(lowerQuery, [
        'design',
        'ux',
        'ui',
        'maquette',
        'graphique',
        'visuel',
        'prototype',
      ])
    ) {
      task_type = 'créative'
    } else if (
      this.containsKeywords(lowerQuery, [
        'marketing',
        'campagne',
        'seo',
        'communication',
        'réseaux sociaux',
      ])
    ) {
      task_type = 'stratégique'
    }

    // Détection de la complexité
    let complexity_level = 'intermédiaire'
    if (
      this.containsKeywords(lowerQuery, [
        'simple',
        'basique',
        'facile',
        'rapide',
        'minor',
      ])
    ) {
      complexity_level = 'junior'
    } else if (
      this.containsKeywords(lowerQuery, [
        'complexe',
        'avancé',
        'expert',
        'architecture',
        'optimisation',
        'performance',
      ])
    ) {
      complexity_level = 'expert'
    } else if (
      this.containsKeywords(lowerQuery, [
        'senior',
        'expérimenté',
        'stratégique',
      ])
    ) {
      complexity_level = 'senior'
    }

    // Détection de l'urgence
    let urgency = 'normale'
    if (
      this.containsKeywords(lowerQuery, [
        'urgent',
        'asap',
        'immédiat',
        'critique',
        'rapidement',
      ])
    ) {
      urgency = 'élevée'
    } else if (
      this.containsKeywords(lowerQuery, [
        'quand possible',
        'pas urgent',
        'tranquille',
      ])
    ) {
      urgency = 'faible'
    }

    // Extraction des compétences requises
    const required_skills = this.extractRequiredSkills(lowerQuery)

    return {
      task_type,
      complexity_level,
      urgency,
      required_skills,
    }
  }

  /**
   * Trouve les meilleurs matches basés sur l'analyse
   */
  findBestMatches(query, employees, analysis) {
    const matches = employees.map((employee) => {
      const score = this.calculateIntelligentScore(query, employee, analysis)
      const reason = this.generateMatchReason(employee, analysis, score)

      return {
        employee,
        employee_id: employee.id,
        score: Math.round(score),
        confidence: score > 80 ? 'élevée' : score > 60 ? 'moyenne' : 'faible',
        primary_reason: reason.primary,
        detailed_explanation: reason.detailed,
        matched_skills: this.findMatchedSkills(
          employee.tasks,
          analysis.required_skills
        ),
        availability_status: this.getAvailabilityStatus(employee),
        recommendation:
          score > 80
            ? 'assignation_directe'
            : score > 60
            ? 'avec_support'
            : 'avec_formation',
      }
    })

    return matches
      .sort((a, b) => b.score - a.score)
      .filter((match) => match.score > 30) // Seuil minimum de pertinence
  }

  /**
   * Calcule un score intelligent basé sur plusieurs critères
   */
  calculateIntelligentScore(query, employee, analysis) {
    let score = 0
    const lowerQuery = query.toLowerCase()

    // 1. Match exact des compétences (40% du score)
    const skillsMatch = this.calculateSkillsMatch(
      employee.tasks,
      analysis.required_skills
    )
    score += skillsMatch * 0.4

    // 2. Correspondance du service (25% du score)
    const serviceMatch = this.calculateServiceMatch(
      employee.service,
      analysis.task_type
    )
    score += serviceMatch * 0.25

    // 3. Expérience et performance (20% du score)
    const experienceScore = Math.min(
      100,
      employee.totalRequestsHandled * 5 + employee.averageRating * 20
    )
    score += experienceScore * 0.2

    // 4. Disponibilité (10% du score)
    const availabilityScore = this.calculateAvailabilityScore(employee)
    score += availabilityScore * 0.1

    // 5. Bonus pour mots-clés dans la demande (5% du score)
    const keywordBonus = this.calculateKeywordBonus(lowerQuery, employee)
    score += keywordBonus * 0.05

    return Math.min(100, score)
  }

  /**
   * Calcule la correspondance des compétences
   */
  calculateSkillsMatch(employeeSkills, requiredSkills) {
    if (!employeeSkills?.length || !requiredSkills?.length) return 30

    const matches = requiredSkills.filter((skill) =>
      employeeSkills.some(
        (empSkill) =>
          empSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(empSkill.toLowerCase())
      )
    )

    return (matches.length / requiredSkills.length) * 100
  }

  /**
   * Calcule la correspondance du service
   */
  calculateServiceMatch(employeeService, taskType) {
    const serviceTaskMap = {
      Développement: ['technique'],
      Design: ['créative'],
      Marketing: ['stratégique'],
      Infrastructure: ['technique'],
      Commercial: ['stratégique'],
      RH: ['administrative'],
    }

    const serviceTasks = serviceTaskMap[employeeService] || []
    return serviceTasks.includes(taskType) ? 100 : 50
  }

  /**
   * Calcule le score de disponibilité
   */
  calculateAvailabilityScore(employee) {
    const workload = employee.totalRequestsHandled || 0
    if (workload === 0) return 100 // Nouveau, très disponible
    if (workload < 10) return 90 // Peu chargé
    if (workload < 30) return 70 // Normalement chargé
    return 40 // Très chargé
  }

  /**
   * Calcule un bonus pour les mots-clés pertinents
   */
  calculateKeywordBonus(query, employee) {
    let bonus = 0
    const employeeText = `${employee.role} ${employee.tasks?.join(
      ' '
    )}`.toLowerCase()

    // Recherche de mots-clés spécifiques dans le profil
    const words = query.split(' ').filter((word) => word.length > 3)
    words.forEach((word) => {
      if (employeeText.includes(word.toLowerCase())) {
        bonus += 20
      }
    })

    return Math.min(100, bonus)
  }

  /**
   * Génère une explication du match
   */
  generateMatchReason(employee, analysis, score) {
    const skillsText = employee.tasks?.join(', ') || 'compétences générales'

    let primary = `Expert en ${employee.service}`
    if (score > 80) {
      primary = `Correspondance parfaite - ${employee.role} avec expertise en ${skillsText}`
    } else if (score > 60) {
      primary = `Bonne correspondance - ${employee.role} dans le service ${employee.service}`
    }

    const detailed = `${employee.name} est ${employee.role} avec ${employee.totalRequestsHandled} tâches réalisées (note ${employee.averageRating}/5). Compétences: ${skillsText}. Convient pour une tâche ${analysis.complexity_level} de type ${analysis.task_type}.`

    return { primary, detailed }
  }

  /**
   * Trouve les compétences qui matchent
   */
  findMatchedSkills(employeeSkills, requiredSkills) {
    if (!employeeSkills?.length || !requiredSkills?.length) return []

    return requiredSkills.filter((skill) =>
      employeeSkills.some(
        (empSkill) =>
          empSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(empSkill.toLowerCase())
      )
    )
  }

  /**
   * Détermine le statut de disponibilité
   */
  getAvailabilityStatus(employee) {
    const workload = employee.totalRequestsHandled || 0
    if (workload < 10) return 'disponible'
    if (workload < 30) return 'partiellement_disponible'
    return 'occupé'
  }

  /**
   * Détermine le statut de charge de travail
   */
  getWorkloadStatus(totalRequests) {
    if (totalRequests === 0) return '🆕 Nouveau'
    if (totalRequests < 10) return '🟢 Disponible'
    if (totalRequests < 30) return '🟡 Occupé'
    return '🔴 Surchargé'
  }

  /**
   * Extrait les compétences requises de la demande
   */
  extractRequiredSkills(query) {
    const skills = []
    const techKeywords = [
      'react',
      'javascript',
      'node',
      'python',
      'database',
      'api',
      'frontend',
      'backend',
    ]
    const designKeywords = [
      'figma',
      'photoshop',
      'ui',
      'ux',
      'design',
      'maquette',
    ]
    const marketingKeywords = [
      'seo',
      'google ads',
      'analytics',
      'social media',
      'content',
    ]

    techKeywords.forEach((keyword) => {
      if (query.includes(keyword)) skills.push(keyword)
    })
    designKeywords.forEach((keyword) => {
      if (query.includes(keyword)) skills.push(keyword)
    })
    marketingKeywords.forEach((keyword) => {
      if (query.includes(keyword)) skills.push(keyword)
    })

    return skills.length > 0 ? skills : ['compétence générale']
  }

  /**
   * Vérifie si la query contient des mots-clés
   */
  containsKeywords(text, keywords) {
    return keywords.some((keyword) => text.includes(keyword))
  }

  /**
   * Parse la réponse de l'IA (si disponible)
   */
  parseIntelligentResponse(response, employeesData) {
    try {
      const parsed = JSON.parse(response)

      // Enrichit les matches avec les données complètes des employés
      if (parsed.matches) {
        parsed.matches = parsed.matches.map((match) => {
          const employee = employeesData.find(
            (emp) => emp.id === match.employee_id
          )
          return {
            ...match,
            employee: employee || null,
          }
        })
      }

      return {
        ...parsed,
        provider: this.preferredProvider,
      }
    } catch (error) {
      console.error('Erreur parsing réponse IA:', error)
      return {
        matches: [],
        summary: 'Erreur parsing réponse IA',
        analysis: { complexity_level: 'unknown', task_type: 'unknown' },
        provider: 'error',
      }
    }
  }

  /**
   * Appel API Anthropic Claude
   */
  async callAnthropicAPI(prompt) {
    if (!this.anthropicApiKey) {
      throw new Error('Clé API Anthropic manquante')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.anthropicApiKey,
        'Anthropic-Version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`Erreur API Anthropic: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  /**
   * Appel API OpenAI
   */
  async callOpenAIAPI(prompt) {
    if (!this.openaiApiKey) {
      throw new Error('Clé API OpenAI manquante')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant IA expert en assignation de tâches.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erreur API OpenAI: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }
}

export default new AIService()
