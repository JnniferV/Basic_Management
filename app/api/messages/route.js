import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb-connection'
import Message from '@/models/message-model'

// GET /api/messages - Récupérer les messages
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const limit = parseInt(searchParams.get('limit')) || 50

    let query = {}
    if (chatId) {
      query.chatId = chatId
    }

    const messages = await Message.find(query)
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({
      messages: messages.reverse(), // Inverser pour avoir du plus ancien au plus récent
      total: messages.length,
    })
  } catch (error) {
    console.error('Erreur récupération messages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    )
  }
}

// POST /api/messages - Créer un nouveau message
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { chatId, senderId, receiverId, content, messageType = 'text' } = body

    if (!chatId || !senderId || !content) {
      return NextResponse.json(
        { error: 'Champs requis: chatId, senderId, content' },
        { status: 400 }
      )
    }

    const newMessage = new Message({
      chatId,
      senderId,
      receiverId,
      content: content.trim(),
      messageType,
    })

    const savedMessage = await newMessage.save()

    // Populate les données avant de retourner
    await savedMessage.populate('senderId', 'name avatar')
    await savedMessage.populate('receiverId', 'name avatar')

    return NextResponse.json(
      {
        message: 'Message envoyé avec succès',
        data: savedMessage,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur création message:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    )
  }
}
