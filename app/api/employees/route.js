import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import Employee from '@/models/employee-model'

// GET /api/employees - Récupérer tous les employés
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')
    const search = searchParams.get('search')
    const active = searchParams.get('active') || 'true'

    let query = {}

    // Filtre par statut actif
    if (active !== 'all') {
      query.isActive = active === 'true'
    }

    // Filtre par service
    if (service && service !== 'all') {
      query.service = service
    }

    let employees

    // Recherche textuelle si query de recherche
    if (search && search.trim()) {
      employees = await Employee.searchEmployees(search.trim())
    } else {
      employees = await Employee.find(query).sort({
        averageRating: -1,
        totalRequestsHandled: -1,
        createdAt: -1,
      })
    }

    // Statistiques
    const stats = await Employee.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' },
          totalRequests: { $sum: '$totalRequestsHandled' },
        },
      },
    ])

    return NextResponse.json({
      employees,
      stats,
      total: employees.length,
    })
  } catch (error) {
    console.error('Erreur récupération employés:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des employés' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Créer un nouvel employé
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, email, phone, service, role, tasks } = body

    // Validation des données requises
    if (!name || !email || !service || !role) {
      return NextResponse.json(
        {
          error: 'Champs requis manquants: name, email, service, role',
        },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingEmployee = await Employee.findOne({
      email: email.toLowerCase(),
    })
    if (existingEmployee) {
      return NextResponse.json(
        {
          error: 'Un employé avec cet email existe déjà',
        },
        { status: 409 }
      )
    }

    // Traitement des tâches
    let processedTasks = []
    if (tasks) {
      if (Array.isArray(tasks)) {
        processedTasks = tasks.filter((task) => task && task.trim())
      } else if (typeof tasks === 'string') {
        processedTasks = tasks
          .split(',')
          .map((task) => task.trim())
          .filter((task) => task.length > 0)
      }
    }

    // Créer le nouvel employé
    const newEmployee = new Employee({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      service,
      role: role.trim(),
      tasks: processedTasks,
      isActive: true,
    })

    const savedEmployee = await newEmployee.save()

    return NextResponse.json(
      {
        message: 'Employé créé avec succès',
        employee: savedEmployee,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création employé:', error)

    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      )
      return NextResponse.json(
        {
          error: 'Erreur de validation',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Erreur de duplication (index unique)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          error: 'Un employé avec cet email existe déjà',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de l'employé" },
      { status: 500 }
    )
  }
}
