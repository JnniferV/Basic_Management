import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import Service from '@/models/service-model'

// GET /api/services - Récupérer tous les services
export async function GET() {
  try {
    await connectDB()

    const services = await Service.find({ isActive: true }).sort({ name: 1 })

    return NextResponse.json({
      services,
      total: services.length,
    })
  } catch (error) {
    console.error('Erreur récupération services:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des services' },
      { status: 500 }
    )
  }
}

// POST /api/services - Créer un nouveau service
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { name, color, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom du service est requis' },
        { status: 400 }
      )
    }

    const newService = new Service({
      name: name.trim(),
      color: color || 'bg-blue-500',
      description: description?.trim(),
    })

    const savedService = await newService.save()

    return NextResponse.json(
      {
        message: 'Service créé avec succès',
        service: savedService,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création service:', error)

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Un service avec ce nom existe déjà' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du service' },
      { status: 500 }
    )
  }
}
