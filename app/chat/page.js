'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, User, Bot, Phone, Video } from 'lucide-react'
import { useEmployeeStore } from '@/stores/employee-store'
import Sidebar from '@/components/ui/sidebar-component'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const { employees, fetchEmployees } = useEmployeeStore()

  useEffect(() => {
    fetchEmployees()
    loadMessages()
  }, [fetchEmployees])

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erreur chargement messages:', error)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startConversation = (employee) => {
    setSelectedEmployee(employee)
    setMessages([
      {
        id: 1,
        type: 'system',
        content: `Conversation démarrée avec ${employee.name}`,
        timestamp: new Date(),
      },
    ])
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedEmployee) return

    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: messageInput,
      timestamp: new Date(),
      sender: 'Vous',
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput('')
    setIsLoading(true)

    // Simulation d'une réponse automatique
    setTimeout(() => {
      const responseMessage = {
        id: Date.now() + 1,
        type: 'employee',
        content: `Merci pour votre message ! Je vais regarder cela et vous revenir rapidement.`,
        timestamp: new Date(),
        sender: selectedEmployee.name,
        avatar: selectedEmployee.avatar,
      }
      setMessages((prev) => [...prev, responseMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />

      <div className="flex-1 flex ml-72">
        {/* Liste des employés */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-600">Discutez avec votre équipe</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {employees.map((employee) => (
              <div
                key={employee._id || employee.id}
                onClick={() => startConversation(employee)}
                className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors ${
                  selectedEmployee?._id === employee._id
                    ? 'bg-blue-50 border-blue-200'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {employee.name}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {employee.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col">
          {selectedEmployee ? (
            <>
              {/* Header de conversation */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedEmployee.avatar}
                      alt={selectedEmployee.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedEmployee.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedEmployee.role} • {selectedEmployee.service}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
                      <Video className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        message.type === 'system' ? 'mx-auto' : ''
                      }`}
                    >
                      {message.type === 'system' ? (
                        <div className="text-center text-sm text-gray-500 bg-gray-100 rounded-full px-4 py-2">
                          {message.content}
                        </div>
                      ) : (
                        <div className="flex items-end space-x-2">
                          {message.type === 'employee' && (
                            <img
                              src={message.avatar || selectedEmployee.avatar}
                              alt={message.sender}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                message.type === 'user'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              {message.content}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <img
                        src={selectedEmployee.avatar}
                        alt={selectedEmployee.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="bg-gray-200 rounded-2xl px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.1s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Tapez votre message..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || isLoading}
                    className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            // État initial
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-600">
                  Choisissez un employé dans la liste pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
