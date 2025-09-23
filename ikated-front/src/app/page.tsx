'use client'

import { useState, useEffect } from 'react'
import { Upload, MessageCircle, FileText, Bot, Sparkles } from 'lucide-react'
import { SmartForm } from '@/components/SmartForm'
import { ChatBot } from '@/components/ChatBot'
import { ChatWidget } from '@/components/ChatWidget'
import { ChatExpanded } from '@/components/ChatExpanded'
import { ChatPopup } from '@/components/ChatPopup'
import { usePopupChat } from '@/hooks/usePopupChat'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<'form' | 'chat' | null>(null)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  const searchParams = useSearchParams()
  const isPopup = searchParams.get('chat') === 'popup'
  const { openPopupChat, addMessageHandler } = usePopupChat()

  // Se for popup, renderizar componente de popup
  if (isPopup) {
    return <ChatPopup />
  }

  // Configurar comunicação com popup
  useEffect(() => {
    const removeHandler = addMessageHandler((event) => {
      switch (event.data.type) {
        case 'REQUEST_INIT_MESSAGES':
          // Enviar mensagens atuais para o popup
          window.postMessage({
            type: 'INIT_MESSAGES',
            messages: messages
          }, window.location.origin)
          break
        case 'POPUP_CLOSED':
          // Popup foi fechado, pode fazer cleanup se necessário
          break
      }
    })

    return removeHandler
  }, [addMessageHandler, messages])

  const handleOpenInPopup = () => {
    openPopupChat(messages)
    setIsChatExpanded(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/ikatec_logo.jpeg"
              alt="Ikated Logo"
              width={48}
              height={48}
              className="w-12 h-12 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-primary">ikat</span>ed
              </h1>
              <p className="text-xs text-muted-foreground">IKATEC.COM.BR</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="mb-8">
            <h2 className="text-5xl font-bold text-foreground mb-4">
              Tecnologia e inovação
            </h2>
            <h3 className="text-4xl font-bold mb-6">
              para transformar{' '}
              <span className="text-primary">negócios e pessoas</span>
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Descubra como a Inteligência Artificial pode revolucionar seus sistemas
              com nossas demonstrações interativas
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 mb-12">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold text-primary">
              Demonstrações de IA em Ação
            </span>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Demo Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <div
            onClick={() => setActiveDemo('form')}
            className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${activeDemo === 'form'
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
              }`}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Formulário Inteligente
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Carregue seus documentos (CPF, RG, certidões) e deixe a IA preencher
              automaticamente um formulário completo com suas informações pessoais.
            </p>
            <div className="flex items-center text-primary">
              <Upload className="w-4 h-4 mr-2" />
              <span className="font-medium">Upload de Documentos + IA</span>
            </div>
          </div>

          <div
            onClick={() => setActiveDemo('chat')}
            className={`p-8 rounded-xl border-2 cursor-pointer transition-all duration-300 ${activeDemo === 'chat'
              ? 'border-primary bg-primary/10 shadow-lg'
              : 'border-border bg-card hover:border-primary/50'
              }`}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mr-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Chatbot Especializado
              </h3>
            </div>
            <p className="text-muted-foreground mb-4">
              Converse com nossa IA especializada em tecnologia e negócios.
              Tire dúvidas, peça análises e receba insights personalizados.
            </p>
            <div className="flex items-center text-primary">
              <Bot className="w-4 h-4 mr-2" />
              <span className="font-medium">Conversa com IA</span>
            </div>
          </div>
        </div>

        {/* Demo Content Area */}
        {activeDemo && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8">
              {activeDemo === 'form' && (
                <div>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Formulário Inteligente com IA
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Carregue seus documentos e veja a IA preenchendo automaticamente
                      todas as informações do formulário.
                    </p>
                  </div>
                  <SmartForm />
                </div>
              )}

              {activeDemo === 'chat' && (
                <div>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Chatbot Especializado
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Converse com nossa IA especializada em tecnologia e negócios.
                    </p>
                  </div>
                  <ChatBot />
                </div>
              )}
            </div>
          </div>
        )}

        {!activeDemo && (
          <div className="text-center">
            <p className="text-muted-foreground">
              Selecione uma demonstração acima para começar
            </p>
          </div>
        )}
      </main>

      {/* Chat Widget - sempre visível */}
      <ChatWidget onExpand={() => setIsChatExpanded(true)} />

      {/* Chat Expandido - modal */}
      <ChatExpanded
        isOpen={isChatExpanded}
        onClose={() => setIsChatExpanded(false)}
        onOpenInPopup={handleOpenInPopup}
        initialMessages={messages}
      />
    </div>
  )
}