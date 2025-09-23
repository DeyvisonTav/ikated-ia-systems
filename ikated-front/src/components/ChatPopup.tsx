'use client'

import React, { useState, useEffect } from 'react'
import { ChatExpanded } from './ChatExpanded'

export function ChatPopup() {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    // Configurar título da janela
    document.title = 'Chat Ikated - Assistente Especializado'

    // Listener para mensagens da janela principal
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      switch (event.data.type) {
        case 'INIT_MESSAGES':
          setMessages(event.data.messages || [])
          break
        case 'NEW_MESSAGE':
          setMessages(prev => [...prev, event.data.message])
          break
      }
    }

    window.addEventListener('message', handleMessage)

    // Solicitar mensagens iniciais da janela principal
    window.opener?.postMessage({
      type: 'REQUEST_INIT_MESSAGES'
    }, window.location.origin)

    // Configurar fechamento da janela
    const handleBeforeUnload = () => {
      window.opener?.postMessage({
        type: 'POPUP_CLOSED'
      }, window.location.origin)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const handleClose = () => {
    window.close()
  }

  return (
    <div className="chat-popup-window bg-background">
      <ChatExpanded
        isOpen={isOpen}
        onClose={handleClose}
        isPopup={true}
        initialMessages={messages}
      />
    </div>
  )
}
