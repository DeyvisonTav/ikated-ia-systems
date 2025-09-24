'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Maximize2, Minimize2, Bot, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatWidgetProps {
  onExpand?: () => void
  messages?: Message[]
  onMessagesUpdate?: (messages: Message[]) => void
}

export function ChatWidget({ onExpand, messages = [], onMessagesUpdate }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    onMessagesUpdate?.(newMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Falha na comunicação com o backend')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Resposta do backend indisponível.',
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, assistantMessage]
      onMessagesUpdate?.(finalMessages)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)

      // Fallback local quando backend não está disponível
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Backend Nest.js não está disponível. Configure e inicie o servidor backend para usar o chat com IA.',
        timestamp: new Date()
      }
      const finalMessages = [...newMessages, fallbackMessage]
      onMessagesUpdate?.(finalMessages)
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`bg-card border border-border rounded-xl shadow-xl transition-all duration-300 ${
        isMinimized ? 'w-80 h-12' : 'w-80 h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground text-sm">Assistente Ikated</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>

            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Expandir conversa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 h-64">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-primary ml-2'
                          : 'bg-muted mr-2'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-3 h-3 text-primary-foreground" />
                      ) : (
                        <Bot className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>

                    <div
                      className={`px-3 py-2 rounded-lg text-xs ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p
                        className={`text-xs mt-1 opacity-70`}
                      >
                        {message.timestamp.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-muted mr-2">
                      <Bot className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 text-sm bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}