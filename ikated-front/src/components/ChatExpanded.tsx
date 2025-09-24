'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, X, ArrowLeft, Download, Share, Settings, ExternalLink, Maximize2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatExpandedProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  isPopup?: boolean
  onOpenInPopup?: () => void
  messages?: Message[]
  onMessagesUpdate?: (messages: Message[]) => void
  initialMessages?: Message[]
}

export function ChatExpanded({ isOpen, onClose, onMinimize, isPopup = false, onOpenInPopup, messages = [], onMessagesUpdate, initialMessages }: ChatExpandedProps) {
  // Usar mensagens compartilhadas ou fallback para mensagens iniciais
  const currentMessages = messages.length > 0 ? messages : (initialMessages || [
    {
      id: '1',
      role: 'assistant',
      content: 'Bem-vindo ao chat expandido da Ikated! Aqui você pode ter conversas mais longas e detalhadas sobre integração de IA, transformação digital e soluções tecnológicas.',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [currentMessages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const newMessages = [...currentMessages, userMessage]
    onMessagesUpdate?.(newMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      // Esta parte será substituída pela integração com o backend Nest.js
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
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
        content: data.message || 'Desculpe, houve um problema na resposta.',
        timestamp: new Date()
      }

      const finalMessages = [...newMessages, assistantMessage]
      onMessagesUpdate?.(finalMessages)
      setIsLoading(false)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)

      // Fallback para simulação local se o backend não estiver disponível
      const fallbackResponses = [
        'Excelente pergunta! A integração de IA em sistemas corporativos envolve várias etapas importantes. Primeiro, precisamos analisar seus processos atuais e identificar onde a IA pode agregar mais valor. Na Ikated, recomendamos uma abordagem gradual, começando com automação de tarefas simples e evoluindo para soluções mais complexas.',
        'Para implementar transformação digital efetiva, é fundamental ter uma estratégia bem definida. Começamos com diagnóstico completo dos seus sistemas, identificamos gargalos e oportunidades, e então criamos um roadmap personalizado. A IA é apenas uma das ferramentas - o importante é entender como ela se encaixa na sua visão de negócio.',
        'A segurança em projetos de IA é crucial. Na Ikated, implementamos protocolos rigorosos de proteção de dados, criptografia end-to-end e auditoria contínua. Também garantimos compliance com LGPD e outras regulamentações. Cada projeto passa por análise de riscos detalhada antes da implementação.',
        'Machine Learning e Deep Learning podem revolucionar diferentes aspectos do seu negócio. Desde análise preditiva para vendas, otimização de processos operacionais, até personalização de experiência do cliente. O importante é começar com dados de qualidade e objetivos claros.'
      ]

      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
          timestamp: new Date()
        }
        const finalMessages = [...newMessages, assistantMessage]
        onMessagesUpdate?.(finalMessages)
        setIsLoading(false)
      }, 1500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const exportChat = () => {
    const chatText = currentMessages.map(msg =>
      `[${msg.timestamp.toLocaleString('pt-BR')}] ${msg.role === 'user' ? 'Você' : 'Assistente'}: ${msg.content}`
    ).join('\n\n')

    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa-ikated-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className={isPopup ? "h-full" : "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"}>
      <div className={isPopup ? "flex h-full" : "flex h-full"}>
        {/* Chat Area */}
        <div className={`flex-1 bg-background ${isPopup ? '' : 'border-r border-border'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-foreground truncate">Assistente Especializado Ikated</h2>
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    IA em Sistemas • Transformação Digital • Consultoria Tech
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              {!isPopup && onOpenInPopup && (
                <button
                  onClick={onOpenInPopup}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Abrir em nova janela"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={exportChat}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden sm:flex"
                title="Exportar conversa"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden md:flex"
                title="Compartilhar"
              >
                <Share className="w-5 h-5" />
              </button>

              <button
                className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden lg:flex"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6" style={{ height: 'calc(100vh - 240px)' }}>
            {currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] sm:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                      ? 'bg-primary ml-2 sm:ml-3'
                      : 'bg-muted mr-2 sm:mr-3'
                      }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    ) : (
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <div
                      className={`px-3 py-2 sm:px-4 sm:py-3 rounded-xl ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                        }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{message.content}</p>
                    </div>

                    <p
                      className={`text-xs px-3 sm:px-4 ${message.role === 'user'
                        ? 'text-right text-muted-foreground'
                        : 'text-left text-muted-foreground'
                        }`}
                    >
                      {message.timestamp.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
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
                <div className="flex max-w-[85%] sm:max-w-[70%]">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-muted mr-2 sm:mr-3">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  <div className="bg-muted text-foreground px-3 py-2 sm:px-4 sm:py-3 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs sm:text-sm">Processando resposta...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border bg-card">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem detalhada sobre IA, transformação digital ou tecnologia..."
                  className="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-base min-h-[120px]"
                  rows={4}
                  style={{ maxHeight: '200px' }}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-base min-h-[120px] whitespace-nowrap"
              >
                <Send className="w-5 h-5" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Informações da conversa */}
        {!isPopup && (
          <div className="hidden lg:block w-80 bg-card border-l border-border p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Sobre este Chat</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Mensagens:</span>
                  <span className="text-foreground">{currentMessages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Iniciado em:</span>
                  <span className="text-foreground">
                    {currentMessages[0]?.timestamp.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="text-green-500">● Online</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Especialidades</h3>
              <div className="space-y-2">
                {[
                  'Integração de IA',
                  'Transformação Digital',
                  'Machine Learning',
                  'Automação de Processos',
                  'Análise de Dados',
                  'Consultoria Tecnológica'
                ].map((specialty, index) => (
                  <div key={index} className="px-3 py-2 bg-primary/10 rounded-lg text-sm text-primary">
                    {specialty}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Dicas Rápidas</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Seja específico em suas perguntas</p>
                <p>• Descreva seu contexto de negócio</p>
                <p>• Mencione tecnologias que já usa</p>
                <p>• Pergunte sobre casos de uso reais</p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Info Bar - Mostra informações essenciais em dispositivos móveis */}
        {!isPopup && (
          <div className="lg:hidden w-full bg-card border-t border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center space-x-1">
                  <span>Mensagens:</span>
                  <span className="text-foreground font-medium">{currentMessages.length}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Online</span>
                </span>
              </div>
              <button
                onClick={exportChat}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Exportar conversa"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}